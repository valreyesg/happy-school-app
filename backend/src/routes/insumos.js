const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje } = require('../services/whatsappService');

router.use(authenticate);

// ── GET /insumos/:alumnoId ────────────────────────────────────────────────
// Obtener stock actual de insumos del alumno
router.get('/:alumnoId', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const result = await query(
      'SELECT * FROM insumos_alumno WHERE alumno_id = $1 ORDER BY tipo',
      [alumnoId]
    );
    res.json(result.rows || []);
  } catch (err) { next(err); }
});

// ── POST /insumos/:alumnoId/recarga ───────────────────────────────────────
// Registrar recarga de insumo (suma al stock)
router.post('/:alumnoId/recarga', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const { tipo, cantidad, motivo } = req.body;

    // Obtener stock actual
    let insumosResult = await query(
      'SELECT * FROM insumos_alumno WHERE alumno_id = $1 AND tipo = $2',
      [alumnoId, tipo]
    );

    let insumoId, cantidadAnterior, cantidadNueva;

    if (insumosResult.rows.length === 0) {
      // Crear entrada si no existe
      const createResult = await query(`
        INSERT INTO insumos_alumno (alumno_id, tipo, cantidad_actual)
        VALUES ($1, $2, $3) RETURNING *
      `, [alumnoId, tipo, cantidad]);
      insumoId = createResult.rows[0].id;
      cantidadAnterior = 0;
      cantidadNueva = cantidad;
    } else {
      insumoId = insumosResult.rows[0].id;
      cantidadAnterior = insumosResult.rows[0].cantidad_actual;
      cantidadNueva = cantidadAnterior + cantidad;

      // Actualizar stock
      await query(`
        UPDATE insumos_alumno
        SET cantidad_actual = $1, updated_at = NOW()
        WHERE id = $2
      `, [cantidadNueva, insumoId]);
    }

    // Registrar movimiento
    await query(`
      INSERT INTO insumos_movimientos
        (alumno_id, tipo, movimiento, cantidad, cantidad_resultante, motivo, registrado_por)
      VALUES ($1, $2, 'recarga', $3, $4, $5, $6)
    `, [alumnoId, tipo, cantidad, cantidadNueva, motivo, req.user.id]);

    // Retornar stock actualizado
    const updatedResult = await query(
      'SELECT * FROM insumos_alumno WHERE id = $1',
      [insumoId]
    );

    res.json(updatedResult.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /insumos/alertas/hoy ──────────────────────────────────────────────
// Listar alumnos con stock bajo (para directora)
router.get('/alertas/hoy', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT ia.*, a.nombre_completo AS alumno_nombre, a.grupo_id
      FROM insumos_alumno ia
      JOIN alumnos a ON ia.alumno_id = a.id
      WHERE ia.cantidad_actual < ia.umbral_alerta
      ORDER BY a.nombre_completo, ia.tipo
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
