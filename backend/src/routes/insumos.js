const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje } = require('../services/whatsappService');

router.use(authenticate);

// ── GET /insumos/:alumnoId ────────────────────────────────────────────────
// Obtener stock diario actual de pañales + solicitudes de toallitas pendientes
router.get('/:alumnoId', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;

    // Obtener stock del día actual
    const stockResult = await query(
      `SELECT cantidad FROM insumos_stock_diario
       WHERE alumno_id = $1 AND fecha = CURRENT_DATE`,
      [alumnoId]
    );

    const stock = stockResult.rows.length > 0
      ? { cantidad: stockResult.rows[0].cantidad, no_registrado: false }
      : { cantidad: null, no_registrado: true };

    // Obtener solicitudes de toallitas pendientes del día
    const solicitudesResult = await query(
      `SELECT id, fecha, created_at FROM insumos_solicitudes
       WHERE alumno_id = $1 AND fecha <= CURRENT_DATE AND resuelta = false
       ORDER BY created_at DESC`,
      [alumnoId]
    );

    res.json({
      stock,
      solicitudes_toallitas: solicitudesResult.rows || [],
    });
  } catch (err) { next(err); }
});

// ── POST /insumos/:alumnoId/solicitar-toallitas ───────────────────────────
// Crear solicitud de toallitas + enviar notificación al papá
router.post('/:alumnoId/solicitar-toallitas', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;

    // Verificar si ya existe solicitud no resuelta hoy
    const existente = await query(
      `SELECT id FROM insumos_solicitudes
       WHERE alumno_id = $1 AND fecha <= CURRENT_DATE AND resuelta = false`,
      [alumnoId]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({
        error: 'Ya existe una solicitud de toallitas pendiente para hoy',
      });
    }

    // Crear solicitud
    const solicitudResult = await query(
      `INSERT INTO insumos_solicitudes (alumno_id, tipo, registrado_por)
       VALUES ($1, 'toallita', $2) RETURNING *`,
      [alumnoId, req.user.id]
    );
    const solicitud = solicitudResult.rows[0];

    // Obtener datos del padre tutor principal
    const padreResult = await query(
      `SELECT p.nombre_completo, COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
              u.id AS usuario_id, a.nombre_completo AS alumno_nombre
       FROM alumnos a
       JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
       JOIN padres p ON ap.padre_id = p.id
       JOIN usuarios u ON p.usuario_id = u.id
       WHERE a.id = $1 LIMIT 1`,
      [alumnoId]
    );

    if (padreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Padre tutor principal no encontrado' });
    }

    const info = padreResult.rows[0];

    // Enviar notificación WhatsApp
    try {
      await enviarMensaje({
        telefono: info.telefono,
        clave: 'solicitud_toallitas',
        variables: {
          nombre_padre: info.nombre_completo.split(' ')[0],
          nombre_alumno: info.alumno_nombre,
        },
        alumnoId,
      });
    } catch (err) {
      console.error('[insumos] Error enviando WhatsApp solicitud_toallitas:', err.message);
    }

    // Insertar notificación en-app al padre
    try {
      await query(
        `INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
         VALUES ($1, $2, $3, 'solicitud_toallitas', $4)`,
        [
          info.usuario_id,
          `Necesitas llevar toallitas — ${info.alumno_nombre}`,
          'La escuela necesita que lleves toallitas mañana',
          JSON.stringify({ alumno_id: alumnoId }),
        ]
      );
    } catch (err) {
      console.error('[insumos] Error insertando notificación:', err.message);
    }

    res.json(solicitud);
  } catch (err) { next(err); }
});

// ── PUT /insumos/solicitudes/:solicitudId/recibida ───────────────────────
// Marcar solicitud como resuelta (papá entregó toallitas en entrada)
router.put('/solicitudes/:solicitudId/recibida', async (req, res, next) => {
  try {
    const { solicitudId } = req.params;

    const result = await query(
      `UPDATE insumos_solicitudes
       SET resuelta = true, resuelta_en_entrada = true, updated_at = NOW()
       WHERE id = $1 RETURNING *`,
      [solicitudId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Solicitud no encontrada' });
    }

    // Marcar trajo_toallitas en registro_entrada del mismo día (crear si no existe)
    await query(
      `INSERT INTO registro_entrada (alumno_id, fecha, trajo_toallitas)
       VALUES ($1, CURRENT_DATE, true)
       ON CONFLICT (alumno_id, fecha) DO UPDATE
       SET trajo_toallitas = true, updated_at = NOW()`,
      [result.rows[0].alumno_id]
    );

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
