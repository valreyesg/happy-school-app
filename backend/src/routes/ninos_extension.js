const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// ── GET /ninos-extension — listar niños de extensión activos
router.get('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, nombre_completo, fecha_nacimiento, foto_url,
             tutor_nombre, tutor_telefono, tutor_email, modalidad_pago,
             qr_codigo, activo, created_at
      FROM ninos_extension
      WHERE activo = true
      ORDER BY nombre_completo
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /ninos-extension/por-qr/:qrData — busca por QR (para scanner mobile)
router.get('/por-qr/:qrData', async (req, res, next) => {
  try {
    const { qrData } = req.params;
    const result = await query(`
      SELECT ne.id, ne.nombre_completo, ne.fecha_nacimiento, ne.foto_url,
             ne.tutor_nombre, ne.tutor_telefono, ne.modalidad_pago,
             re.id AS registro_id, re.hora_entrada, re.hora_salida
      FROM ninos_extension ne
      LEFT JOIN registro_extension re ON re.nino_id = ne.id
                                      AND re.fecha = CURRENT_DATE
      WHERE ne.qr_codigo = $1 AND ne.activo = true
      LIMIT 1
    `, [qrData]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Niño de extensión no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /ninos-extension/:id — detalle de niño
router.get('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, nombre_completo, fecha_nacimiento, foto_url, foto_public_id,
             tutor_nombre, tutor_telefono, tutor_email, modalidad_pago, qr_codigo, activo
      FROM ninos_extension
      WHERE id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Niño de extensión no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /ninos-extension — crear niño de extensión
router.post('/', authorize('directora', 'administrativo'), upload.single('foto'), async (req, res, next) => {
  try {
    const { nombre_completo, fecha_nacimiento, tutor_nombre, tutor_telefono, tutor_email, modalidad_pago } = req.body;

    if (!nombre_completo || !tutor_nombre || !tutor_telefono) {
      return res.status(400).json({ error: 'nombre_completo, tutor_nombre y tutor_telefono son obligatorios' });
    }

    let foto_url = null;
    let foto_public_id = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'happyschool/ninos-extension',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      foto_url = uploadResult.url;
      foto_public_id = uploadResult.public_id;
    }

    const ninoRes = await query(`
      INSERT INTO ninos_extension (nombre_completo, fecha_nacimiento, foto_url, foto_public_id,
                                   tutor_nombre, tutor_telefono, tutor_email, modalidad_pago)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, nombre_completo, qr_codigo
    `, [nombre_completo, fecha_nacimiento || null, foto_url, foto_public_id,
        tutor_nombre, tutor_telefono, tutor_email || null, modalidad_pago || 'mensual']);

    const ninoId = ninoRes.rows[0].id;
    const qrCode = `HAPPYSCHOOL:EXT:${ninoId}`;

    // Actualizar qr_codigo
    await query('UPDATE ninos_extension SET qr_codigo = $1 WHERE id = $2', [qrCode, ninoId]);

    const finalRes = await query('SELECT * FROM ninos_extension WHERE id = $1', [ninoId]);
    res.status(201).json(finalRes.rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /ninos-extension/:id — editar niño
router.put('/:id', authorize('directora', 'administrativo'), upload.single('foto'), async (req, res, next) => {
  try {
    const { nombre_completo, fecha_nacimiento, tutor_nombre, tutor_telefono, tutor_email, modalidad_pago } = req.body;

    const currentRes = await query('SELECT foto_public_id FROM ninos_extension WHERE id = $1', [req.params.id]);
    if (!currentRes.rows[0]) return res.status(404).json({ error: 'Niño de extensión no encontrado' });

    let foto_url = null;
    let foto_public_id = null;

    if (req.file) {
      // Eliminar foto anterior si existe
      if (currentRes.rows[0].foto_public_id) {
        try { await deleteFromCloudinary(currentRes.rows[0].foto_public_id); } catch (e) { console.error(e); }
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'happyschool/ninos-extension',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      });
      foto_url = uploadResult.url;
      foto_public_id = uploadResult.public_id;
    }

    const updates = [];
    const params = [];
    let paramIndex = 1;

    if (nombre_completo !== undefined) { updates.push(`nombre_completo = $${paramIndex++}`); params.push(nombre_completo); }
    if (fecha_nacimiento !== undefined) { updates.push(`fecha_nacimiento = $${paramIndex++}`); params.push(fecha_nacimiento || null); }
    if (tutor_nombre !== undefined) { updates.push(`tutor_nombre = $${paramIndex++}`); params.push(tutor_nombre); }
    if (tutor_telefono !== undefined) { updates.push(`tutor_telefono = $${paramIndex++}`); params.push(tutor_telefono); }
    if (tutor_email !== undefined) { updates.push(`tutor_email = $${paramIndex++}`); params.push(tutor_email || null); }
    if (modalidad_pago !== undefined) { updates.push(`modalidad_pago = $${paramIndex++}`); params.push(modalidad_pago); }
    if (foto_url !== null) {
      updates.push(`foto_url = $${paramIndex++}`, `foto_public_id = $${paramIndex++}`);
      params.push(foto_url, foto_public_id);
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No hay datos para actualizar' });

    updates.push(`updated_at = NOW()`);
    params.push(req.params.id);

    const result = await query(`
      UPDATE ninos_extension
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `, params);

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── DELETE /ninos-extension/:id — soft delete (activo = false)
router.delete('/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query('UPDATE ninos_extension SET activo = false, updated_at = NOW() WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /ninos-extension/registro/hoy — registros de hoy
router.get('/registro/hoy', authorize('maestra', 'directora'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT re.id, re.nino_id, ne.nombre_completo, ne.foto_url,
             re.fecha, re.hora_entrada, re.hora_salida, re.registrado_por, re.notas
      FROM registro_extension re
      JOIN ninos_extension ne ON ne.id = re.nino_id
      WHERE re.fecha = CURRENT_DATE
      ORDER BY re.hora_entrada DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /ninos-extension/:id/entrada — registrar entrada
router.post('/:id/entrada', authorize('maestra', 'directora'), async (req, res, next) => {
  try {
    const { notas } = req.body;
    const horaActual = new Date();
    const hora = horaActual.getHours() * 60 + horaActual.getMinutes();
    const esTemprano = hora < (14 * 60 + 45); // 14:45

    const ninoRes = await query('SELECT modalidad_pago FROM ninos_extension WHERE id = $1 AND activo = true', [req.params.id]);
    if (!ninoRes.rows[0]) return res.status(404).json({ error: 'Niño de extensión no encontrado' });

    // Registrar entrada
    const reRes = await query(`
      INSERT INTO registro_extension (nino_id, fecha, hora_entrada, registrado_por, notas)
      VALUES ($1, CURRENT_DATE, $2, $3, $4)
      ON CONFLICT (nino_id, fecha) DO UPDATE
      SET hora_entrada = $2, registrado_por = $3, notas = $4, updated_at = NOW()
      RETURNING id, nino_id, fecha, hora_entrada
    `, [req.params.id, horaActual, req.user.id, notas || null]);

    let pagoGenerado = null;

    // Si es modalidad por_dia, generar pago automático
    if (ninoRes.rows[0].modalidad_pago === 'por_dia') {
      // Buscar concepto "Extensión por día"
      const conceptoRes = await query(`
        SELECT id FROM conceptos_pago
        WHERE nombre = 'Extensión por día' AND activo = true
        LIMIT 1
      `);

      if (conceptoRes.rows[0]) {
        // Verificar si ya hay pago hoy
        const pagoExistente = await query(`
          SELECT id FROM registro_extension
          WHERE nino_id = $1 AND fecha = CURRENT_DATE AND pago_id IS NOT NULL
          LIMIT 1
        `, [req.params.id]);

        if (!pagoExistente.rows[0]) {
          const pagoRes = await query(`
            INSERT INTO pagos (concepto_id, monto_base, monto_total, estado, origen, registrado_por)
            VALUES ($1, 150.00, 150.00, 'pendiente', 'extension_dia', $2)
            RETURNING id, monto_total, estado
          `, [conceptoRes.rows[0].id, req.user.id]);

          const pagoId = pagoRes.rows[0].id;
          await query('UPDATE registro_extension SET pago_id = $1, cobro_generado = true WHERE id = $2',
                     [pagoId, reRes.rows[0].id]);

          pagoGenerado = pagoRes.rows[0];
        }
      }
    }

    res.json({
      entrada: reRes.rows[0],
      aviso_temprano: esTemprano,
      pago_generado: pagoGenerado
    });
  } catch (err) { next(err); }
});

// ── POST /ninos-extension/:id/salida — registrar salida
router.post('/:id/salida', authorize('maestra', 'directora'), async (req, res, next) => {
  try {
    const { notas } = req.body;
    const horaActual = new Date();

    const result = await query(`
      UPDATE registro_extension
      SET hora_salida = $1, registrado_por = $2, notas = COALESCE($3, notas)
      WHERE nino_id = $4 AND fecha = CURRENT_DATE
      RETURNING id, nino_id, hora_entrada, hora_salida
    `, [horaActual, req.user.id, notas || null, req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Registro de entrada no encontrado para hoy' });

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
