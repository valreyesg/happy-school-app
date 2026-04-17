const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// Listar grupos
router.get('/', async (req, res, next) => {
  try {
    const { ciclo_id, activo = 'true' } = req.query;
    const result = await query(`
      SELECT g.*, c.nombre AS ciclo_nombre,
        COUNT(a.id) AS total_alumnos
      FROM grupos g
      LEFT JOIN ciclos_escolares c ON g.ciclo_id = c.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito', 'reinscrito')
      WHERE g.deleted_at IS NULL
        ${activo !== 'todos' ? `AND g.activo = ${activo === 'true'}` : ''}
        ${ciclo_id ? `AND g.ciclo_id = '${ciclo_id}'` : ''}
      GROUP BY g.id, c.nombre
      ORDER BY g.nivel, g.nombre
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Crear grupo
router.post('/', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, nivel, nivel_codigo, ciclo_id, cupo_maximo, color_hex } = req.body;
    const result = await query(`
      INSERT INTO grupos (nombre, nivel, nivel_codigo, ciclo_id, cupo_maximo, color_hex)
      VALUES ($1,$2,$3,$4,$5,$6) RETURNING *
    `, [nombre, nivel, nivel_codigo, ciclo_id, cupo_maximo || 20, color_hex || '#805AD5']);
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// Actualizar grupo
router.put('/:id', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, cupo_maximo, color_hex, activo } = req.body;
    const result = await query(`
      UPDATE grupos SET nombre=$1, cupo_maximo=$2, color_hex=$3, activo=$4, updated_at=NOW()
      WHERE id=$5 RETURNING *
    `, [nombre, cupo_maximo, color_hex, activo, req.params.id]);
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// Grupo de la maestra autenticada + alumnos con estado del día
// Usado por el dashboard mobile de la maestra
router.get('/mi-grupo', async (req, res, next) => {
  try {
    // Buscar el grupo asignado a esta maestra (titular del ciclo activo)
    const grupoResult = await query(`
      SELECT g.id, g.nombre, g.nivel, g.nivel_codigo, g.color_hex, g.cupo_maximo
      FROM asignaciones_grupo ag
      JOIN grupos g ON ag.grupo_id = g.id
      JOIN personal p ON ag.personal_id = p.id
      JOIN ciclos_escolares c ON ag.ciclo_id = c.id
      WHERE p.usuario_id = $1
        AND ag.activo = true
        AND c.activo = true
        AND ag.es_titular = true
      LIMIT 1
    `, [req.user.id]);

    // Si no tiene grupo asignado como titular, buscar como especial
    let grupo = grupoResult.rows[0];
    if (!grupo) {
      const especResult = await query(`
        SELECT g.id, g.nombre, g.nivel, g.nivel_codigo, g.color_hex, g.cupo_maximo
        FROM asignaciones_grupo ag
        JOIN grupos g ON ag.grupo_id = g.id
        JOIN personal p ON ag.personal_id = p.id
        JOIN ciclos_escolares c ON ag.ciclo_id = c.id
        WHERE p.usuario_id = $1
          AND ag.activo = true
          AND c.activo = true
        ORDER BY ag.created_at DESC
        LIMIT 1
      `, [req.user.id]);
      grupo = especResult.rows[0];
    }

    if (!grupo) {
      return res.status(404).json({ error: 'No tienes grupo asignado en el ciclo activo' });
    }

    // Alumnos del grupo con su estado de entrada y bitácora de hoy
    const alumnosResult = await query(`
      SELECT
        a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento,
        a.alergias, a.usa_panial,
        -- Asistencia hoy
        COALESCE(ast.estado, 'ausente') AS estado_asistencia,
        re.hora_entrada,
        re.es_retardo,
        re.puede_entrar,
        -- Bitácora hoy (resumen)
        bd.estado_animo,
        bd.tarea_realizada,
        bd.comportamiento,
        rc.cuanto_comio,
        rb.pipi_count,
        rb.popo_count
      FROM alumnos a
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = CURRENT_DATE
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = CURRENT_DATE
      LEFT JOIN bitacora_diaria bd ON bd.alumno_id = a.id AND bd.fecha = CURRENT_DATE
      LEFT JOIN registro_comida rc ON rc.alumno_id = a.id AND rc.fecha = CURRENT_DATE
      LEFT JOIN registro_banio rb ON rb.alumno_id = a.id AND rb.fecha = CURRENT_DATE
      WHERE a.grupo_id = $1
        AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito', 'reinscrito')
      ORDER BY a.nombre_completo
    `, [grupo.id]);

    res.json({
      ...grupo,
      alumnos: alumnosResult.rows,
      total_alumnos: alumnosResult.rows.length,
      presentes_hoy: alumnosResult.rows.filter(a => a.estado_asistencia === 'presente').length,
      fecha: new Date().toISOString().split('T')[0],
    });
  } catch (err) { next(err); }
});

// Alumnos de un grupo
router.get('/:id/alumnos', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento, a.estado, a.usa_panial
      FROM alumnos a WHERE a.grupo_id = $1 AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito','reinscrito')
      ORDER BY a.nombre_completo
    `, [req.params.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
