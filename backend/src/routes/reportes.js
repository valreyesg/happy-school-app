const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// Dashboard principal de la directora
// Devuelve todas las stats que muestra la pantalla de inicio
router.get('/dashboard', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    const mesActual = new Date().getMonth() + 1;
    const anioActual = new Date().getFullYear();

    // Ejecutar todas las queries en paralelo para máxima velocidad
    const [
      totalAlumnosResult,
      asistenciaHoyResult,
      pagosSemResult,
      retardosMesResult,
      docsPendientesResult,
      asistenciaPorGrupoResult,
    ] = await Promise.all([

      // Total de alumnos inscritos en ciclo activo
      query(`
        SELECT COUNT(*) AS total
        FROM alumnos a
        JOIN ciclos_escolares c ON a.ciclo_id = c.id
        WHERE a.deleted_at IS NULL
          AND a.estado IN ('inscrito', 'reinscrito')
          AND c.activo = true
      `),

      // Asistencia de hoy: presentes, ausentes, retardos
      query(`
        SELECT
          COUNT(*) FILTER (WHERE estado = 'presente') AS presentes,
          COUNT(*) FILTER (WHERE estado = 'ausente')  AS ausentes,
          COUNT(*) FILTER (WHERE estado = 'retardo')  AS retardos,
          COUNT(*) FILTER (WHERE estado = 'no_entrada') AS no_entrada
        FROM asistencia
        WHERE fecha = $1
      `, [hoy]),

      // Estado de pagos del mes actual
      query(`
        SELECT
          COUNT(*) FILTER (WHERE dias_atraso = 0 AND estado = 'pagado') AS al_corriente,
          COUNT(*) FILTER (WHERE dias_atraso BETWEEN 1 AND 30)          AS con_atraso,
          COUNT(*) FILTER (WHERE dias_atraso > 30)                      AS suspendidos,
          COUNT(*) FILTER (WHERE estado = 'pendiente' AND dias_atraso = 0) AS en_periodo
        FROM pagos
        WHERE mes_correspondiente = $1 AND anio_correspondiente = $2
      `, [mesActual, anioActual]),

      // Alumnos con más retardos este mes (top 10)
      query(`
        SELECT
          a.id, a.nombre_completo,
          g.nombre AS grupo_nombre,
          COUNT(*) AS retardos
        FROM registro_entrada re
        JOIN alumnos a ON re.alumno_id = a.id
        LEFT JOIN grupos g ON a.grupo_id = g.id
        WHERE re.es_retardo = true
          AND EXTRACT(MONTH FROM re.created_at) = $1
          AND EXTRACT(YEAR FROM re.created_at) = $2
        GROUP BY a.id, a.nombre_completo, g.nombre
        HAVING COUNT(*) >= 1
        ORDER BY retardos DESC
        LIMIT 10
      `, [mesActual, anioActual]),

      // Alumnos con documentación incompleta
      query(`
        SELECT id, nombre_completo, grupo_nombre, docs_count
        FROM (
          SELECT
            a.id, a.nombre_completo,
            g.nombre AS grupo_nombre,
            (
              SELECT COUNT(DISTINCT d.tipo)
              FROM documentos d
              WHERE d.entidad_tipo = 'alumno'
                AND d.entidad_id = a.id
                AND d.tipo IN ('acta_nacimiento','curp','cartilla_vacunacion','foto_escolar')
            ) AS docs_count
          FROM alumnos a
          LEFT JOIN grupos g ON a.grupo_id = g.id
          JOIN ciclos_escolares c ON a.ciclo_id = c.id
          WHERE a.deleted_at IS NULL
            AND a.estado IN ('inscrito','reinscrito')
            AND c.activo = true
        ) sub
        WHERE docs_count < 4
        ORDER BY docs_count ASC, grupo_nombre, nombre_completo
      `),

      // Asistencia de hoy por grupo
      query(`
        SELECT
          g.id AS grupo_id,
          g.nombre AS grupo_nombre,
          g.color_hex,
          COUNT(a.id) AS total,
          COUNT(ast.id) FILTER (WHERE ast.estado = 'presente') AS presentes,
          COUNT(ast.id) FILTER (WHERE ast.estado = 'retardo')  AS retardos
        FROM grupos g
        LEFT JOIN alumnos a ON a.grupo_id = g.id
          AND a.deleted_at IS NULL
          AND a.estado IN ('inscrito','reinscrito')
        LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = $1
        WHERE g.activo = true
        GROUP BY g.id, g.nombre, g.color_hex
        ORDER BY g.nivel
      `, [hoy]),
    ]);

    const pagos = pagosSemResult.rows[0];

    res.json({
      fecha: hoy,
      totalAlumnos:        parseInt(totalAlumnosResult.rows[0].total),
      presentesHoy:        parseInt(asistenciaHoyResult.rows[0].presentes || 0),
      ausentesHoy:         parseInt(asistenciaHoyResult.rows[0].ausentes  || 0),
      retardosHoy:         parseInt(asistenciaHoyResult.rows[0].retardos  || 0),
      noEntradaHoy:        parseInt(asistenciaHoyResult.rows[0].no_entrada || 0),
      alumnosAlCorriente:  parseInt(pagos.al_corriente  || 0),
      alumnosConAdeudo:    parseInt(pagos.con_atraso    || 0),
      alumnosSuspendidos:  parseInt(pagos.suspendidos   || 0),
      alumnosEnPeriodo:    parseInt(pagos.en_periodo    || 0),
      retardosMes:         retardosMesResult.rows,
      documentacionPendiente: docsPendientesResult.rows,
      asistenciaPorGrupo:  asistenciaPorGrupoResult.rows,
    });
  } catch (err) { next(err); }
});

module.exports = router;
