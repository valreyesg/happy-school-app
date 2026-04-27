const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// ── GET /visitantes — listar visitantes (default hoy)
router.get('/', authorize('directora', 'maestra'), async (req, res, next) => {
  try {
    const fecha = req.query.fecha || new Date().toISOString().split('T')[0];
    const result = await query(`
      SELECT v.id, v.nombre, v.fecha, v.foto_url, v.grupo_visitado_id,
             g.nombre AS grupo_nombre, v.tutor_nombre, v.tutor_telefono,
             v.hora_entrada, v.hora_salida, v.tiene_extension_dia,
             v.cobro_extension_id, v.registrado_por, v.notas,
             p.monto_total, p.estado AS pago_estado
      FROM visitantes v
      LEFT JOIN grupos g ON v.grupo_visitado_id = g.id
      LEFT JOIN pagos p ON p.id = v.cobro_extension_id
      WHERE v.fecha::date = $1::date
      ORDER BY v.hora_entrada DESC NULLS LAST
    `, [fecha]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /visitantes/:id — detalle de visitante
router.get('/:id', authorize('directora', 'maestra'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT v.id, v.nombre, v.fecha, v.foto_url, v.foto_public_id, v.grupo_visitado_id,
             g.nombre AS grupo_nombre, v.tutor_nombre, v.tutor_telefono,
             v.hora_entrada, v.hora_salida, v.tiene_extension_dia,
             v.cobro_extension_id, v.registrado_por, v.notas
      FROM visitantes v
      LEFT JOIN grupos g ON v.grupo_visitado_id = g.id
      WHERE v.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Visitante no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /visitantes — registrar visitante
router.post('/', authorize('directora', 'maestra'), upload.single('foto'), async (req, res, next) => {
  try {
    const { nombre, grupo_visitado_id, tutor_nombre, tutor_telefono, notas } = req.body;

    if (!nombre) {
      return res.status(400).json({ error: 'nombre es obligatorio' });
    }

    let foto_url = null;
    let foto_public_id = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'happyschool/visitantes',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      foto_url = uploadResult.url;
      foto_public_id = uploadResult.public_id;
    }

    const result = await query(`
      INSERT INTO visitantes (nombre, fecha, foto_url, foto_public_id, grupo_visitado_id,
                             tutor_nombre, tutor_telefono, hora_entrada, registrado_por, notas)
      VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, NOW(), $7, $8)
      RETURNING id, nombre, fecha, foto_url, grupo_visitado_id, tutor_nombre,
                tutor_telefono, hora_entrada, tiene_extension_dia, notas
    `, [nombre, foto_url, foto_public_id, grupo_visitado_id || null,
        tutor_nombre || null, tutor_telefono || null, req.user.id, notas || null]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /visitantes/:id/salida — registrar hora de salida
router.patch('/:id/salida', authorize('directora', 'maestra'), async (req, res, next) => {
  try {
    const { notas } = req.body;
    const horaActual = new Date();

    const visitanteRes = await query(`
      SELECT id, tiene_extension_dia, cobro_extension_id
      FROM visitantes
      WHERE id = $1
    `, [req.params.id]);

    if (!visitanteRes.rows[0]) return res.status(404).json({ error: 'Visitante no encontrado' });

    const result = await query(`
      UPDATE visitantes
      SET hora_salida = $1, notas = COALESCE($2, notas)
      WHERE id = $3
      RETURNING id, nombre, hora_entrada, hora_salida, tiene_extension_dia, cobro_extension_id
    `, [horaActual, notas || null, req.params.id]);

    let cobro = null;

    // Si tiene extensión día, obtener monto del pago generado
    if (result.rows[0].tiene_extension_dia && result.rows[0].cobro_extension_id) {
      const pagoRes = await query(`
        SELECT monto_total, estado FROM pagos WHERE id = $1
      `, [result.rows[0].cobro_extension_id]);
      if (pagoRes.rows[0]) {
        cobro = pagoRes.rows[0];
      }
    }

    res.json({
      ...result.rows[0],
      cobro
    });
  } catch (err) { next(err); }
});

// ── PATCH /visitantes/:id/extension — activar extensión del día (genera pago automático)
router.patch('/:id/extension', authorize('directora', 'maestra'), async (req, res, next) => {
  try {
    const visitanteRes = await query(`
      SELECT id, tiene_extension_dia, cobro_extension_id
      FROM visitantes
      WHERE id = $1
    `, [req.params.id]);

    if (!visitanteRes.rows[0]) return res.status(404).json({ error: 'Visitante no encontrado' });

    // Si ya tiene extensión, retornar error
    if (visitanteRes.rows[0].tiene_extension_dia) {
      return res.status(400).json({ error: 'El visitante ya tiene extensión del día asignada' });
    }

    // Buscar concepto "Extensión por día"
    const conceptoRes = await query(`
      SELECT id FROM conceptos_pago
      WHERE nombre = 'Extensión por día' AND activo = true
      LIMIT 1
    `);

    if (!conceptoRes.rows[0]) {
      return res.status(500).json({ error: 'Concepto de pago no configurado' });
    }

    // Generar pago automático
    const pagoRes = await query(`
      INSERT INTO pagos (concepto_id, monto_base, monto_total, estado, origen, registrado_por)
      VALUES ($1, 150.00, 150.00, 'pendiente', 'visitante_extension', $2)
      RETURNING id, monto_total, estado
    `, [conceptoRes.rows[0].id, req.user.id]);

    const pagoId = pagoRes.rows[0].id;

    // Actualizar visitante
    const result = await query(`
      UPDATE visitantes
      SET tiene_extension_dia = true, cobro_extension_id = $1
      WHERE id = $2
      RETURNING id, nombre, tiene_extension_dia, cobro_extension_id
    `, [pagoId, req.params.id]);

    res.json({
      visitante: result.rows[0],
      pago_generado: pagoRes.rows[0]
    });
  } catch (err) { next(err); }
});

// ── DELETE /visitantes/:id — eliminar visitante (raramente usado)
router.delete('/:id', authorize('directora'), async (req, res, next) => {
  try {
    // Buscar foto_public_id antes de eliminar
    const visitanteRes = await query('SELECT foto_public_id FROM visitantes WHERE id = $1', [req.params.id]);

    if (visitanteRes.rows[0]?.foto_public_id) {
      try { await deleteFromCloudinary(visitanteRes.rows[0].foto_public_id); } catch (e) { console.error(e); }
    }

    await query('DELETE FROM visitantes WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
