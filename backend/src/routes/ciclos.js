const express = require('express');
const router = express.Router();
const { query, getClient } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /ciclos — lista todos los ciclos (solo actuales y futuros para selector destino)
router.get('/', async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, nombre, fecha_inicio, fecha_fin, activo, created_at
       FROM ciclos_escolares
       ORDER BY fecha_inicio DESC`
    );

    // Agregar conteo de alumnos y grupos por ciclo
    const ciclosConConteo = await Promise.all(
      result.rows.map(async (ciclo) => {
        const conteoResult = await query(
          `SELECT COUNT(*) as total FROM alumnos
           WHERE ciclo_id = $1 AND deleted_at IS NULL
           AND estado NOT IN ('baja', 'egresado')`,
          [ciclo.id]
        );

        const gruposResult = await query(
          `SELECT COUNT(*) as total FROM grupos
           WHERE ciclo_id = $1`,
          [ciclo.id]
        );

        return {
          ...ciclo,
          total_alumnos: parseInt(conteoResult.rows[0].total),
          grupos_creados: parseInt(gruposResult.rows[0].total),
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

// GET /ciclos/:id/preview-promocion — vista previa de promoción (recibe ciclo_destino_id como query param)
router.get('/:id/preview-promocion', authorize('directora'), async (req, res, next) => {
  const { id } = req.params;
  const { ciclo_destino_id } = req.query;

  try {
    const cicloActualResult = await query(
      `SELECT id FROM ciclos_escolares WHERE activo = true`
    );

    if (cicloActualResult.rows.length === 0) {
      return res.status(404).json({ error: 'No hay ciclo activo' });
    }

    const cicloActualId = cicloActualResult.rows[0].id;
    const destinoId = ciclo_destino_id || id;

    const previewResult = await query(
      `SELECT
        a.id, a.nombre_completo,
        g.nivel, g.nivel_codigo, g.nombre AS grupo_actual,
        g_dest.id AS grupo_destino_id, g_dest.nombre AS grupo_destino_nombre,
        g_dest.nivel AS nivel_destino,
        cnt_dest.cantidad_grupos_destino,
        CASE g.nivel_codigo
          WHEN 'kinder3' THEN 'egresado'
          ELSE 'reinscrito'
        END AS nuevo_estado
       FROM alumnos a
       JOIN grupos g ON a.grupo_id = g.id
       LEFT JOIN LATERAL (
         SELECT id, nombre, nivel
         FROM grupos
         WHERE ciclo_id = $1
           AND nivel_codigo = (
             CASE g.nivel_codigo
               WHEN 'maternal'  THEN 'prekinder'
               WHEN 'prekinder' THEN 'kinder1'
               WHEN 'kinder1'   THEN 'kinder2'
               WHEN 'kinder2'   THEN 'kinder3'
               ELSE NULL
             END
           )
           AND deleted_at IS NULL
         ORDER BY nombre
         LIMIT 1
       ) g_dest ON true
       LEFT JOIN LATERAL (
         SELECT COUNT(*) AS cantidad_grupos_destino
         FROM grupos
         WHERE ciclo_id = $1
           AND nivel_codigo = (
             CASE g.nivel_codigo
               WHEN 'maternal'  THEN 'prekinder'
               WHEN 'prekinder' THEN 'kinder1'
               WHEN 'kinder1'   THEN 'kinder2'
               WHEN 'kinder2'   THEN 'kinder3'
               ELSE NULL
             END
           )
           AND deleted_at IS NULL
       ) cnt_dest ON true
       WHERE a.ciclo_id = $2
         AND a.deleted_at IS NULL
         AND a.estado NOT IN ('baja', 'egresado')
       ORDER BY g.nivel_codigo, a.nombre_completo`,
      [destinoId, cicloActualId]
    );

    res.json(previewResult.rows);
  } catch (err) {
    next(err);
  }
});

// POST /ciclos/:id/ejecutar-promocion — ejecutar promoción con ajustes
router.post('/:id/ejecutar-promocion', authorize('directora'), async (req, res, next) => {
  const { id } = req.params;
  const { ciclo_destino_id, ajustes } = req.body;

  if (!ciclo_destino_id) {
    return res.status(400).json({ error: 'ciclo_destino_id es requerido' });
  }

  if (!ajustes || !Array.isArray(ajustes)) {
    return res.status(400).json({ error: 'ajustes debe ser un array' });
  }

  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Actualizar alumnos y crear registros en inscripciones
    for (const ajuste of ajustes) {
      const alumno_id = ajuste.alumno_id || ajuste.id;
      const { grupo_destino_id, nuevo_estado } = ajuste;

      // UPDATE alumno: mover al ciclo destino
      await client.query(
        `UPDATE alumnos
         SET ciclo_id = $1, grupo_id = $2, estado = $3, updated_at = NOW()
         WHERE id = $4`,
        [ciclo_destino_id, grupo_destino_id || null, nuevo_estado, alumno_id]
      );

      // INSERT inscripcion en ciclo destino
      if (nuevo_estado !== 'egresado' || grupo_destino_id) {
        await client.query(
          `INSERT INTO inscripciones (alumno_id, ciclo_id, tipo, grupo_id, fecha, documentacion_completa)
           VALUES ($1, $2, 'reinscripcion', $3, CURRENT_DATE, false)
           ON CONFLICT DO NOTHING`,
          [alumno_id, ciclo_destino_id, grupo_destino_id || null]
        );
      }
    }

    // Desactivar ciclo actual
    await client.query(
      `UPDATE ciclos_escolares SET activo = false, updated_at = NOW() WHERE id = $1`,
      [id]
    );

    // Activar ciclo destino
    await client.query(
      `UPDATE ciclos_escolares SET activo = true, updated_at = NOW() WHERE id = $1`,
      [ciclo_destino_id]
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

// GET /ciclos/:id/export — exportar ciclo con grupos, maestras y alumnos
router.get('/:id/export', authorize('directora'), async (req, res, next) => {
  const { id } = req.params;
  const ExcelJS = require('exceljs');

  try {
    // Obtener datos del ciclo
    const cicloResult = await query(
      `SELECT id, nombre FROM ciclos_escolares WHERE id = $1`,
      [id]
    );

    if (cicloResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ciclo no encontrado' });
    }

    const ciclo = cicloResult.rows[0];

    // Obtener grupos con maestras y alumnos
    const gruposResult = await query(
      `SELECT
        g.id, g.nombre, g.nivel,
        array_agg(DISTINCT p.nombre_completo) FILTER (WHERE p.id IS NOT NULL) AS maestras,
        COUNT(DISTINCT a.id) AS total_alumnos
       FROM grupos g
       LEFT JOIN asignaciones_grupo ag ON ag.grupo_id = g.id
       LEFT JOIN personal p ON p.id = ag.personal_id
       LEFT JOIN alumnos a ON a.grupo_id = g.id AND a.deleted_at IS NULL
       WHERE g.ciclo_id = $1
       GROUP BY g.id, g.nombre, g.nivel
       ORDER BY g.nivel`,
      [id]
    );

    // Obtener todos los alumnos del ciclo
    const alumnosResult = await query(
      `SELECT
        a.nombre_completo, g.nombre AS grupo, a.estado
       FROM alumnos a
       JOIN grupos g ON a.grupo_id = g.id
       WHERE a.ciclo_id = $1 AND a.deleted_at IS NULL
       ORDER BY g.nivel, a.nombre_completo`,
      [id]
    );

    // Crear workbook
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Resumen de Grupos y Maestras
    const wsGrupos = workbook.addWorksheet('Grupos y Maestras');
    wsGrupos.columns = [
      { header: 'Grupo', key: 'nombre', width: 20 },
      { header: 'Nivel', key: 'nivel', width: 15 },
      { header: 'Maestras', key: 'maestras', width: 35 },
      { header: 'Total Alumnos', key: 'total_alumnos', width: 15 },
    ];

    wsGrupos.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsGrupos.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };

    gruposResult.rows.forEach(row => {
      wsGrupos.addRow({
        nombre: row.nombre,
        nivel: row.nivel,
        maestras: row.maestras ? row.maestras.join(', ') : '—',
        total_alumnos: row.total_alumnos,
      });
    });

    // Sheet 2: Listado de Alumnos
    const wsAlumnos = workbook.addWorksheet('Alumnos');
    wsAlumnos.columns = [
      { header: 'Nombre', key: 'nombre_completo', width: 30 },
      { header: 'Grupo', key: 'grupo', width: 20 },
      { header: 'Estado', key: 'estado', width: 15 },
    ];

    wsAlumnos.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    wsAlumnos.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };

    alumnosResult.rows.forEach(row => {
      wsAlumnos.addRow(row);
    });

    // Enviar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="ciclo-${ciclo.nombre}.xlsx"`);

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
});

// POST /ciclos/:id/copiar-grupos-del-anterior — copiar grupos + maestras del ciclo anterior
router.post('/:id/copiar-grupos-del-anterior', authorize('directora'), async (req, res, next) => {
  const { id } = req.params;
  const client = await getClient();

  try {
    await client.query('BEGIN');

    // Obtener ciclo destino
    const cicloDestinoResult = await client.query(
      `SELECT fecha_inicio FROM ciclos_escolares WHERE id = $1`,
      [id]
    );

    if (cicloDestinoResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Ciclo destino no encontrado' });
    }

    // Obtener ciclo anterior (más reciente con fecha_fin < ciclo destino)
    const cicloAnteriorResult = await client.query(
      `SELECT id FROM ciclos_escolares
       WHERE fecha_fin < $1
       ORDER BY fecha_fin DESC
       LIMIT 1`,
      [cicloDestinoResult.rows[0].fecha_inicio]
    );

    if (cicloAnteriorResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No hay ciclo anterior para copiar' });
    }

    const cicloAnteriorId = cicloAnteriorResult.rows[0].id;

    // Obtener grupos del ciclo anterior
    const gruposAnteriorResult = await client.query(
      `SELECT id, nombre, nivel, nivel_codigo FROM grupos WHERE ciclo_id = $1`,
      [cicloAnteriorId]
    );

    // Copiar grupos al ciclo destino
    const gruposMap = {}; // para mapear grupo_id anterior -> nuevo

    for (const grupoAnterior of gruposAnteriorResult.rows) {
      const grupoNuevoResult = await client.query(
        `INSERT INTO grupos (ciclo_id, nombre, nivel, nivel_codigo, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())
         RETURNING id`,
        [id, grupoAnterior.nombre, grupoAnterior.nivel, grupoAnterior.nivel_codigo]
      );

      gruposMap[grupoAnterior.id] = grupoNuevoResult.rows[0].id;
    }

    // Copiar asignaciones de maestras
    const asignacionesResult = await client.query(
      `SELECT personal_id, grupo_id FROM asignaciones_grupo
       WHERE grupo_id IN (SELECT id FROM grupos WHERE ciclo_id = $1)`,
      [cicloAnteriorId]
    );

    for (const asignacion of asignacionesResult.rows) {
      const grupoNuevoId = gruposMap[asignacion.grupo_id];
      if (grupoNuevoId) {
        await client.query(
          `INSERT INTO asignaciones_grupo (personal_id, grupo_id, ciclo_id, created_at, updated_at)
           VALUES ($1, $2, $3, NOW(), NOW())
           ON CONFLICT DO NOTHING`,
          [asignacion.personal_id, grupoNuevoId, id]
        );
      }
    }

    await client.query('COMMIT');

    res.json({
      message: 'Grupos copiados correctamente',
      grupos_copiados: gruposAnteriorResult.rows.length,
      asignaciones_copiadas: asignacionesResult.rows.length,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

module.exports = router;
