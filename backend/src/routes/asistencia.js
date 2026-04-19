const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje, notificarRetardo } = require('../services/whatsappService');

router.use(authenticate);

// Registrar filtro de entrada (checklist)
router.post('/entrada', async (req, res, next) => {
  try {
    const {
      alumno_id, uñas_cortadas, sin_lagañas, sin_fiebre, temperatura,
      sin_sintomas, sintomas_notas, panial_limpio, trae_uniforme,
      trae_bata, trae_termo, agua_suficiente, qr_escaneado,
    } = req.body;

    const config = await query(
      "SELECT valor FROM configuracion_general WHERE clave IN ('hora_fin_filtro', 'max_retardos_mes')"
    );
    const cfgMap = {};
    config.rows.forEach(r => { cfgMap[r.clave] = r.valor; });

    const horaFin = cfgMap['hora_fin_filtro'] || '08:30';
    const maxRetardos = parseInt(cfgMap['max_retardos_mes'] || '3');

    const ahora = new Date();
    const horaActual = ahora.toTimeString().slice(0, 5);
    const esRetardo = horaActual > horaFin;

    // Contar retardos del mes
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const retardosResult = await query(`
      SELECT COUNT(*) FROM registro_entrada
      WHERE alumno_id = $1 AND es_retardo = true
        AND EXTRACT(MONTH FROM created_at) = $2
        AND EXTRACT(YEAR FROM created_at) = $3
    `, [alumno_id, mesActual, anioActual]);

    const numRetardos = parseInt(retardosResult.rows[0].count) + (esRetardo ? 1 : 0);
    let puedeEntrar = true;
    let motivoNoEntrada = null;

    if (numRetardos > maxRetardos) {
      puedeEntrar = false;
      motivoNoEntrada = `${numRetardos}° retardo del mes — límite de ${maxRetardos} superado`;
    }

    if (!sin_fiebre || temperatura > 37.5) {
      puedeEntrar = false;
      motivoNoEntrada = `Fiebre detectada: ${temperatura}°C`;
    }

    if (!sin_sintomas) {
      puedeEntrar = false;
      motivoNoEntrada = `Síntomas de enfermedad: ${sintomas_notas}`;
    }

    // Registrar entrada
    const entradaResult = await query(`
      INSERT INTO registro_entrada (
        alumno_id, hora_entrada, es_retardo, numero_retardo_mes,
        uñas_cortadas, sin_lagañas, sin_fiebre, temperatura, sin_sintomas, sintomas_notas,
        panial_limpio, trae_uniforme, trae_bata, trae_termo, agua_suficiente,
        puede_entrar, motivo_no_entrada, qr_escaneado, registrado_por
      ) VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
      ON CONFLICT (alumno_id, fecha)
      DO UPDATE SET
        hora_entrada=NOW(), es_retardo=$2, puede_entrar=$15,
        motivo_no_entrada=$16
      RETURNING *
    `, [
      alumno_id, esRetardo, numRetardos,
      uñas_cortadas, sin_lagañas, sin_fiebre, temperatura, sin_sintomas, sintomas_notas,
      panial_limpio, trae_uniforme, trae_bata, trae_termo, agua_suficiente,
      puedeEntrar, motivoNoEntrada, qr_escaneado || false, req.user.id,
    ]);

    // Actualizar asistencia
    const estadoAsistencia = !puedeEntrar ? 'no_entrada' : esRetardo ? 'retardo' : 'presente';
    await query(`
      INSERT INTO asistencia (alumno_id, fecha, estado, entrada_id)
      VALUES ($1, CURRENT_DATE, $2, $3)
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET estado=$2, entrada_id=$3, updated_at=NOW()
    `, [alumno_id, estadoAsistencia, entradaResult.rows[0].id]);

    // Notificaciones WhatsApp
    const alumnoResult = await query(`
      SELECT a.nombre_completo, p.nombre_completo AS padre_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
      JOIN padres p ON ap.padre_id = p.id
      WHERE a.id = $1 LIMIT 1
    `, [alumno_id]);

    if (alumnoResult.rows.length > 0) {
      const info = alumnoResult.rows[0];
      if (esRetardo && puedeEntrar) {
        await enviarMensaje({
          telefono: info.telefono,
          clave: 'retardo',
          variables: {
            nombre_padre: info.padre_nombre.split(' ')[0],
            nombre_alumno: info.nombre_completo,
            hora: ahora.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
            numero_retardo: numRetardos,
          },
          alumnoId: alumno_id,
        });
      }
      if (!puedeEntrar) {
        const clave = !sin_fiebre ? 'fiebre' : numRetardos > maxRetardos ? 'retardo' : 'no_entrada';
        await enviarMensaje({
          telefono: info.telefono,
          clave,
          variables: {
            nombre_padre: info.padre_nombre.split(' ')[0],
            nombre_alumno: info.nombre_completo,
            motivo: motivoNoEntrada,
            temperatura: temperatura || '',
            numero_retardo: numRetardos,
          },
          alumnoId: alumno_id,
        });
      }
    }

    res.json({
      entrada: entradaResult.rows[0],
      estado: estadoAsistencia,
      puede_entrar: puedeEntrar,
      motivo: motivoNoEntrada,
    });
  } catch (err) { next(err); }
});

// Registrar salida
router.post('/salida', async (req, res, next) => {
  try {
    const {
      alumno_id, padre_id, persona_autorizada_id,
      nombre_quien_recoge, qr_escaneado,
    } = req.body;

    // Verificar si está autorizado
    let autorizado = false;
    let alerta = false;

    if (padre_id) {
      const padreResult = await query(
        'SELECT id FROM alumno_padre WHERE alumno_id = $1 AND padre_id = $2',
        [alumno_id, padre_id]
      );
      autorizado = padreResult.rows.length > 0;
    } else if (persona_autorizada_id) {
      const personaResult = await query(
        'SELECT id FROM personas_autorizadas WHERE id = $1 AND alumno_id = $2 AND activo = true',
        [persona_autorizada_id, alumno_id]
      );
      autorizado = personaResult.rows.length > 0;
    }

    // Verificar blacklist
    if (nombre_quien_recoge) {
      const blackResult = await query(
        `SELECT id FROM blacklist WHERE alumno_id = $1 AND activo = true
         AND nombre_completo ILIKE $2`,
        [alumno_id, `%${nombre_quien_recoge}%`]
      );
      if (blackResult.rows.length > 0) {
        autorizado = false;
        alerta = true;
      }
    }

    const ahora = new Date();

    const result = await query(`
      INSERT INTO registro_salida (
        alumno_id, hora_salida, recogido_por_tipo, padre_id, persona_autorizada_id,
        nombre_quien_recoge, autorizado, alerta_generada, qr_escaneado, registrado_por
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [
      alumno_id, ahora,
      padre_id ? 'padre' : persona_autorizada_id ? 'persona_autorizada' : 'otro',
      padre_id, persona_autorizada_id, nombre_quien_recoge,
      autorizado, alerta, qr_escaneado || false, req.user.id,
    ]);

    if (!autorizado) {
      // Notificar inmediatamente a padres
      const alumnoResult = await query(`
        SELECT a.nombre_completo, COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
               p.nombre_completo AS padre_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
        JOIN padres p ON ap.padre_id = p.id
        WHERE a.id = $1 LIMIT 1
      `, [alumno_id]);

      if (alumnoResult.rows.length > 0) {
        const info = alumnoResult.rows[0];
        await enviarMensaje({
          telefono: info.telefono,
          clave: 'persona_no_autorizada',
          variables: { nombre_alumno: info.nombre_completo },
          alumnoId: alumno_id,
        });
      }
    }

    res.json({ salida: result.rows[0], autorizado, alerta });
  } catch (err) { next(err); }
});

// Filtro de entrada — todos los alumnos activos agrupados por grupo
// Devuelve TODOS si: no tiene grupo asignado (maestra_puerta permanente) O tiene turno_puerta hoy
router.get('/filtro-entrada', async (req, res, next) => {
  try {
    const [grupoAsig, turnoHoy] = await Promise.all([
      query(`
        SELECT g.id, g.nombre, g.color_hex
        FROM asignaciones_grupo ag
        JOIN grupos g ON ag.grupo_id = g.id
        JOIN personal p ON ag.personal_id = p.id
        JOIN ciclos_escolares c ON ag.ciclo_id = c.id
        WHERE p.usuario_id = $1 AND ag.activo = true AND c.activo = true
        ORDER BY ag.es_titular DESC
        LIMIT 1
      `, [req.user.id]),
      query(`
        SELECT 1 FROM turno_puerta tp
        JOIN personal p ON tp.personal_id = p.id
        WHERE tp.fecha = CURRENT_DATE AND p.usuario_id = $1
      `, [req.user.id]),
    ]);

    const tieneTurno = turnoHoy.rows.length > 0;
    const whereGrupo = (grupoAsig.rows.length > 0 && !tieneTurno)
      ? `AND a.grupo_id = '${grupoAsig.rows[0].id}'`
      : '';

    const result = await query(`
      SELECT
        a.id, a.nombre_completo, a.foto_url, a.fecha_nacimiento, a.usa_panial,
        g.id AS grupo_id, g.nombre AS grupo_nombre, g.color_hex AS grupo_color,
        COALESCE(ast.estado, 'ausente') AS estado_asistencia,
        re.hora_entrada, re.es_retardo, re.puede_entrar, re.motivo_no_entrada,
        re.numero_retardo_mes, re.temperatura,
        re.sin_fiebre, re.sin_sintomas, re.sintomas_notas,
        re.uñas_cortadas, re.sin_lagañas, re.panial_limpio,
        re.trae_uniforme, re.trae_bata, re.trae_termo, re.agua_suficiente,
        re.qr_escaneado
      FROM alumnos a
      JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = CURRENT_DATE
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = CURRENT_DATE
      WHERE a.deleted_at IS NULL AND a.estado IN ('inscrito','reinscrito')
        AND g.deleted_at IS NULL AND g.activo = true
        ${whereGrupo}
      ORDER BY g.nivel, g.nombre, a.nombre_completo
    `);

    // Agrupar por grupo
    const grupos = {};
    for (const row of result.rows) {
      if (!grupos[row.grupo_id]) {
        grupos[row.grupo_id] = {
          id: row.grupo_id,
          nombre: row.grupo_nombre,
          color_hex: row.grupo_color,
          alumnos: [],
        };
      }
      grupos[row.grupo_id].alumnos.push(row);
    }

    const fecha = (await query(`SELECT CURRENT_DATE::text AS f`)).rows[0].f;
    res.json({ grupos: Object.values(grupos), fecha });
  } catch (err) { next(err); }
});

// Vista de asistencia por grupo y fecha
router.get('/grupo/:grupo_id', async (req, res, next) => {
  try {
    const fecha = req.query.fecha || null; // null → PostgreSQL usa CURRENT_DATE (hora local)
    const result = await query(`
      SELECT a.id, a.nombre_completo, a.foto_url,
        COALESCE(ast.estado, 'ausente') AS estado_asistencia,
        re.hora_entrada, re.es_retardo, re.puede_entrar, re.motivo_no_entrada,
        re.uñas_cortadas, re.sin_lagañas, re.sin_fiebre, re.temperatura,
        re.sin_sintomas, re.sintomas_notas, re.panial_limpio,
        re.trae_uniforme, re.trae_bata, re.trae_termo, re.agua_suficiente,
        re.numero_retardo_mes, re.qr_escaneado
      FROM alumnos a
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = COALESCE($2::date, CURRENT_DATE)
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = COALESCE($2::date, CURRENT_DATE)
      WHERE a.grupo_id = $1 AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito','reinscrito')
      ORDER BY a.nombre_completo
    `, [req.params.grupo_id, fecha]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Vista mensual de asistencia por grupo
router.get('/grupo/:grupo_id/mensual', async (req, res, next) => {
  try {
    const now = new Date();
    const mes  = parseInt(req.query.mes  || now.getMonth() + 1);
    const anio = parseInt(req.query.anio || now.getFullYear());

    const result = await query(`
      SELECT a.id, a.nombre_completo, a.foto_url,
             TO_CHAR(ast.fecha, 'YYYY-MM-DD') AS fecha,
             ast.estado
      FROM alumnos a
      LEFT JOIN asistencia ast
        ON ast.alumno_id = a.id
       AND EXTRACT(MONTH FROM ast.fecha) = $2
       AND EXTRACT(YEAR  FROM ast.fecha) = $3
      WHERE a.grupo_id = $1
        AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito','reinscrito')
      ORDER BY a.nombre_completo, ast.fecha
    `, [req.params.grupo_id, mes, anio]);

    // Agrupar por alumno → { id, nombre_completo, foto_url, dias: { 'YYYY-MM-DD': estado } }
    const mapa = {};
    for (const row of result.rows) {
      if (!mapa[row.id]) {
        mapa[row.id] = { id: row.id, nombre_completo: row.nombre_completo, foto_url: row.foto_url, dias: {} };
      }
      if (row.fecha) {
        mapa[row.id].dias[row.fecha] = row.estado;
      }
    }
    res.json(Object.values(mapa));
  } catch (err) { next(err); }
});

module.exports = router;
