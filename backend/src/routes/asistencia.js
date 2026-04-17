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
        motivo_no_entrada=$16, updated_at=NOW()
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

// Vista de asistencia por grupo y fecha
router.get('/grupo/:grupo_id', async (req, res, next) => {
  try {
    const { fecha = new Date().toISOString().split('T')[0] } = req.query;
    const result = await query(`
      SELECT a.id, a.nombre_completo, a.foto_url,
        COALESCE(ast.estado, 'ausente') AS estado_asistencia,
        re.hora_entrada, re.es_retardo, re.puede_entrar
      FROM alumnos a
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = $2
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = $2
      WHERE a.grupo_id = $1 AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito','reinscrito')
      ORDER BY a.nombre_completo
    `, [req.params.grupo_id, fecha]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
