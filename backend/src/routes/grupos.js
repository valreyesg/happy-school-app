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
        COUNT(DISTINCT a.id) AS total_alumnos,
        p_tit.nombre_completo AS maestra_nombre,
        p_tit.id AS maestra_personal_id,
        COALESCE(
          json_agg(
            json_build_object(
              'personal_id', p_aux.id,
              'nombre', p_aux.nombre_completo,
              'es_titular', ag_aux.es_titular
            )
          ) FILTER (WHERE ag_aux.id IS NOT NULL),
          '[]'
        ) AS maestras
      FROM grupos g
      LEFT JOIN ciclos_escolares c ON g.ciclo_id = c.id
      LEFT JOIN alumnos a ON a.grupo_id = g.id AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito', 'reinscrito')
      LEFT JOIN asignaciones_grupo ag_tit ON ag_tit.grupo_id = g.id
        AND ag_tit.es_titular = true AND ag_tit.activo = true
      LEFT JOIN personal p_tit ON p_tit.id = ag_tit.personal_id
      LEFT JOIN asignaciones_grupo ag_aux ON ag_aux.grupo_id = g.id AND ag_aux.activo = true
      LEFT JOIN personal p_aux ON p_aux.id = ag_aux.personal_id
      WHERE g.deleted_at IS NULL
        ${activo !== 'todos' ? `AND g.activo = ${activo === 'true'}` : ''}
        ${ciclo_id ? `AND g.ciclo_id = '${ciclo_id}'` : ''}
      GROUP BY g.id, c.nombre, p_tit.nombre_completo, p_tit.id
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

    // Fecha consultada: parámetro opcional, default CURRENT_DATE
    const fechaParam = req.query.fecha || null;

    // Alumnos del grupo con su estado de entrada y bitácora del día consultado
    const alumnosResult = await query(`
      SELECT
        a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento,
        a.alergias, a.usa_panial,
        -- Asistencia
        COALESCE(ast.estado, 'ausente') AS estado_asistencia,
        re.hora_entrada,
        re.es_retardo,
        re.puede_entrar,
        re.motivo_no_entrada,
        re.numero_retardo_mes,
        re.temperatura,
        re.sin_fiebre,
        re.sin_sintomas,
        re.sintomas_notas,
        re.uñas_cortadas,
        re.sin_lagañas,
        re.panial_limpio,
        re.trae_uniforme,
        re.trae_bata,
        re.trae_termo,
        re.agua_suficiente,
        re.qr_escaneado,
        -- Salida
        rs.id AS salida_id,
        rs.hora_salida,
        rs.nombre_quien_recoge,
        rs.recogido_por_tipo,
        rs.autorizado AS salida_autorizada,
        -- Bitácora (resumen)
        bd.estado_animo,
        bd.tarea_realizada,
        bd.comportamiento,
        rc.cuanto_comio,
        rb.pipi_count,
        rb.popo_count
      FROM alumnos a
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN registro_salida rs ON rs.alumno_id = a.id AND rs.fecha = COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN bitacora_diaria bd ON bd.alumno_id = a.id AND bd.fecha = COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN registro_comida rc ON rc.alumno_id = a.id AND rc.fecha = COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN registro_banio rb ON rb.alumno_id = a.id AND rb.fecha = COALESCE($2::date, CURRENT_DATE)
      WHERE a.grupo_id = $1
        AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito', 'reinscrito')
      ORDER BY a.nombre_completo
    `, [grupo.id, fechaParam]);

    const fechaReal = (await query(`SELECT COALESCE($1::date, CURRENT_DATE)::text AS f`, [fechaParam])).rows[0].f;

    res.json({
      ...grupo,
      alumnos: alumnosResult.rows,
      total_alumnos: alumnosResult.rows.length,
      presentes_hoy: alumnosResult.rows.filter(a => ['presente','retardo'].includes(a.estado_asistencia)).length,
      fecha: fechaReal,
    });
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
