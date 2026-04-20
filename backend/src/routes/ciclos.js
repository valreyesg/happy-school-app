const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /ciclos — lista todos los ciclos
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, nombre, fecha_inicio, fecha_fin, activo, created_at
       FROM ciclos_escolares
       ORDER BY fecha_inicio DESC`
    );

    // Agregar conteo de alumnos por ciclo
    const ciclosConConteo = await Promise.all(
      result.rows.map(async (ciclo) => {
        const conteoResult = await query(
          `SELECT COUNT(*) as total FROM alumnos
           WHERE ciclo_id = $1 AND deleted_at IS NULL
           AND estado NOT IN ('baja', 'egresado')`,
          [ciclo.id]
        );
        return {
          ...ciclo,
          total_alumnos: parseInt(conteoResult.rows[0].total),
        };
      })
    );

    res.json(ciclosConConteo);
  } catch (err) {
    next(err);
  }
});

// POST /ciclos — crear nuevo ciclo
router.post('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  const { nombre, fecha_inicio, fecha_fin } = req.body;

  if (!nombre || !fecha_inicio || !fecha_fin) {
    return res.status(400).json({ error: 'nombre, fecha_inicio y fecha_fin son requeridos' });
  }

  try {
    const result = await query(
      `INSERT INTO ciclos_escolares (nombre, fecha_inicio, fecha_fin, activo)
       VALUES ($1, $2, $3, false)
       RETURNING id, nombre, fecha_inicio, fecha_fin, activo, created_at`,
      [nombre, fecha_inicio, fecha_fin]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El ciclo con ese nombre ya existe' });
    }
    next(err);
  }
});

// GET /ciclos/:id/preview-promocion — vista previa de promoción
router.get('/:id/preview-promocion', authorize('directora'), async (req, res, next) => {
  const { id } = req.params;

  try {
    const cicloActualResult = await query(
      `SELECT id FROM ciclos_escolares WHERE activo = true`
    );

    if (cicloActualResult.rows.length === 0) {
      return res.status(404).json({ error: 'No hay ciclo activo' });
    }

    const cicloActualId = cicloActualResult.rows[0].id;

    const previewResult = await query(
      `SELECT
        a.id, a.nombre_completo,
        g.nivel, g.nivel_codigo, g.nombre AS grupo_actual,
        g_dest.id AS grupo_destino_id, g_dest.nombre AS grupo_destino_nombre,
        g_dest.nivel AS nivel_destino,
        CASE g.nivel_codigo
          WHEN 'kinder3' THEN 'egresado'
          ELSE 'reinscrito'
        END AS nuevo_estado
       FROM alumnos a
       JOIN grupos g ON a.grupo_id = g.id
       LEFT JOIN grupos g_dest ON g_dest.ciclo_id = $1
         AND g_dest.nivel_codigo = (
           CASE g.nivel_codigo
             WHEN 'maternal'  THEN 'prekinder'
             WHEN 'prekinder' THEN 'kinder1'
             WHEN 'kinder1'   THEN 'kinder2'
             WHEN 'kinder2'   THEN 'kinder3'
             ELSE NULL
           END
         )
       WHERE a.ciclo_id = $2
         AND a.deleted_at IS NULL
         AND a.estado NOT IN ('baja', 'egresado')
       ORDER BY g.nivel_codigo, a.nombre_completo`,
      [id, cicloActualId]
    );

    res.json(previewResult.rows);
  } catch (err) {
    next(err);
  }
});

// POST /ciclos/:id/ejecutar-promocion — ejecutar promoción con ajustes
router.post('/:id/ejecutar-promocion', authorize('directora'), async (req, res, next) => {
  const { id } = req.params;
  const { ajustes } = req.body;

  if (!ajustes || !Array.isArray(ajustes)) {
    return res.status(400).json({ error: 'ajustes debe ser un array' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    const cicloActualResult = await client.query(
      `SELECT id FROM ciclos_escolares WHERE activo = true`
    );

    if (cicloActualResult.rows.length === 0) {
      throw new Error('No hay ciclo activo');
    }

    const cicloActualId = cicloActualResult.rows[0].id;

    // Actualizar alumnos y crear registros en inscripciones
    for (const ajuste of ajustes) {
      // Aceptar tanto 'alumno_id' como 'id'
      const alumno_id = ajuste.alumno_id || ajuste.id;
      const { grupo_destino_id, nuevo_estado } = ajuste;

      // UPDATE alumno
      await client.query(
        `UPDATE alumnos
         SET ciclo_id = $1, grupo_id = $2, estado = $3, updated_at = NOW()
         WHERE id = $4`,
        [id, grupo_destino_id || null, nuevo_estado, alumno_id]
      );

      // INSERT inscripcion (solo si no es egresado o si tiene grupo destino)
      if (nuevo_estado !== 'egresado' || grupo_destino_id) {
        await client.query(
          `INSERT INTO inscripciones (alumno_id, ciclo_id, tipo, grupo_id, fecha, documentacion_completa)
           VALUES ($1, $2, 'reinscripcion', $3, CURRENT_DATE, false)
           ON CONFLICT DO NOTHING`,
          [alumno_id, id, grupo_destino_id || null]
        );
      }
    }

    // Desactivar ciclo actual, activar nuevo
    await client.query(
      `UPDATE ciclos_escolares SET activo = false, updated_at = NOW() WHERE id = $1`,
      [cicloActualId]
    );

    await client.query(
      `UPDATE ciclos_escolares SET activo = true, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Promoción ejecutada correctamente',
      alumnos_promovidos: ajustes.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
