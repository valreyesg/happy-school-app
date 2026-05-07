const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje, notificarRetardo } = require('../services/whatsappService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { enviarPush } = require('../services/pushService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// Registrar filtro de entrada (checklist)
router.post('/entrada', async (req, res, next) => {
  try {
    const {
      alumno_id, uñas_cortadas, sin_lagañas, sin_fiebre, temperatura,
      sin_sintomas, sintomas_notas, panial_limpio, trajo_paniales, trae_uniforme,
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
    const horaActual = ahora.toLocaleTimeString('en-CA', { timeZone: 'America/Mexico_City', hour: '2-digit', minute: '2-digit', hour12: false });
    const llegoTarde = horaActual > horaFin;

    // Contar retardos del mes
    const mesActual = ahora.getMonth() + 1;
    const anioActual = ahora.getFullYear();

    const retardosResult = await query(`
      SELECT COUNT(*) FROM registro_entrada
      WHERE alumno_id = $1 AND es_retardo = true
        AND EXTRACT(MONTH FROM created_at) = $2
        AND EXTRACT(YEAR FROM created_at) = $3
    `, [alumno_id, mesActual, anioActual]);

    const retardosMesActuales = parseInt(retardosResult.rows[0].count);
    let puedeEntrar = true;
    let motivoNoEntrada = null;
    let esRetardo = false;
    let numRetardos = 0;

    // Evaluar síntomas/fiebre primero (prioridad máxima)
    if (!sin_fiebre || temperatura > 37.5) {
      puedeEntrar = false;
      motivoNoEntrada = `Fiebre detectada: ${temperatura}°C`;
    }

    if (!sin_sintomas) {
      puedeEntrar = false;
      motivoNoEntrada = `Síntomas de enfermedad: ${sintomas_notas}`;
    }

    // Solo después, evaluar retardos si pasó el filtro de salud
    if (puedeEntrar && llegoTarde) {
      numRetardos = retardosMesActuales + 1;
      if (numRetardos > maxRetardos) {
        puedeEntrar = false;
        motivoNoEntrada = `${numRetardos}° retardo del mes — límite de ${maxRetardos} superado`;
      } else {
        esRetardo = true;
      }
    }

    // Registrar entrada
    const entradaResult = await query(`
      INSERT INTO registro_entrada (
        alumno_id, hora_entrada, es_retardo, numero_retardo_mes,
        uñas_cortadas, sin_lagañas, sin_fiebre, temperatura, sin_sintomas, sintomas_notas,
        panial_limpio, trajo_paniales, trae_uniforme, trae_bata, trae_termo, agua_suficiente,
        puede_entrar, motivo_no_entrada, qr_escaneado, registrado_por
      ) VALUES ($1,NOW(),$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
      ON CONFLICT (alumno_id, fecha)
      DO UPDATE SET
        hora_entrada=NOW(), es_retardo=$2, puede_entrar=$16,
        motivo_no_entrada=$17, trajo_paniales=$11
      RETURNING *
    `, [
      alumno_id, esRetardo, esRetardo ? (retardosMesActuales + 1) : 0,
      uñas_cortadas, sin_lagañas, sin_fiebre, temperatura, sin_sintomas, sintomas_notas,
      panial_limpio, trajo_paniales, trae_uniforme, trae_bata, trae_termo, agua_suficiente,
      puedeEntrar, motivoNoEntrada, qr_escaneado || false, req.user.id,
    ]);

    // Actualizar asistencia
    const estadoAsistencia = !puedeEntrar ? 'no_entrada' : esRetardo ? 'retardo' : 'presente';
    await query(`
      INSERT INTO asistencia (alumno_id, fecha, estado, entrada_id)
      VALUES ($1, CURRENT_DATE, $2, $3)
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET estado=$2, entrada_id=$3, updated_at=NOW()
    `, [alumno_id, estadoAsistencia, entradaResult.rows[0].id]);

    // Calcular y registrar stock diario de pañales (solo si usa_panial = true)
    const alumnoUsaPanialResult = await query(
      'SELECT usa_panial FROM alumnos WHERE id = $1',
      [alumno_id]
    );
    if (alumnoUsaPanialResult.rows.length > 0 && alumnoUsaPanialResult.rows[0].usa_panial) {
      let cantidadHoy = 0;
      if (trajo_paniales) {
        // Si trajo pañales hoy, iniciar con 5
        cantidadHoy = 5;
      } else {
        // Si no trajo, obtener saldo de ayer
        const stockAyerResult = await query(
          `SELECT cantidad FROM insumos_stock_diario
           WHERE alumno_id = $1 AND fecha = CURRENT_DATE - 1`,
          [alumno_id]
        );
        cantidadHoy = stockAyerResult.rows.length > 0 ? stockAyerResult.rows[0].cantidad : 0;
      }
      // Insertar o actualizar stock del día
      await query(
        `INSERT INTO insumos_stock_diario (alumno_id, fecha, cantidad)
         VALUES ($1, CURRENT_DATE, $2)
         ON CONFLICT (alumno_id, fecha) DO UPDATE
         SET cantidad = $2, updated_at = NOW()`,
        [alumno_id, cantidadHoy]
      );
    }

    // Auto-marcar medicamentos del día como recibidos al registrar entrada
    await query(`
      UPDATE recepcion_medicamento
      SET recibido = true, recibido_at = NOW()
      WHERE alumno_id = $1
        AND fecha = CURRENT_DATE
        AND recibido = false
    `, [alumno_id]);

    // Notificaciones WhatsApp — a todos los padres
    const alumnosResult = await query(`
      SELECT a.nombre_completo, p.nombre_completo AS padre_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             u.id AS usuario_id
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id
      JOIN padres p ON ap.padre_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE a.id = $1
    `, [alumno_id]);

    for (const info of alumnosResult.rows) {
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

      // Insertar notificación en-app para el padre cuando hay rechazo
      if (!puedeEntrar && info?.usuario_id) {
        await query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'entrada_rechazada', $4)
        `, [
          info.usuario_id,
          `Entrada rechazada — ${info.nombre_completo}`,
          motivoNoEntrada || `${info.nombre_completo} no pudo entrar hoy`,
          JSON.stringify({ alumno_id, motivo: motivoNoEntrada }),
        ]);
        enviarPush(info.usuario_id, `Entrada rechazada — ${info.nombre_completo}`, motivoNoEntrada || `${info.nombre_completo} no pudo entrar hoy`, { tipo: 'entrada_rechazada', alumno_id: String(alumno_id) });
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
  const client = await require('../config/database').pool.connect();
  try {
    const {
      alumno_id, padre_id, persona_autorizada_id,
      nombre_quien_recoge, qr_escaneado,
      es_anticipada, motivo_salida,
      panial_limpio, pertenencias_ok, estado_fisico_ok, notas_sanitarias, entrega_conforme
    } = req.body;

    // Validación: motivo_salida es obligatorio si es_anticipada es true
    if (es_anticipada && !motivo_salida?.trim()) {
      return res.status(400).json({ error: 'motivo_salida es obligatorio para salidas anticipadas' });
    }

    // Verificar si está autorizado
    let autorizado = false;
    let alerta = false;

    if (padre_id) {
      const padreResult = await client.query(
        'SELECT id FROM alumno_padre WHERE alumno_id = $1 AND padre_id = $2',
        [alumno_id, padre_id]
      );
      autorizado = padreResult.rows.length > 0;
    } else if (persona_autorizada_id) {
      const personaResult = await client.query(
        'SELECT id FROM personas_autorizadas WHERE id = $1 AND alumno_id = $2 AND activo = true',
        [persona_autorizada_id, alumno_id]
      );
      autorizado = personaResult.rows.length > 0;
    }

    // Verificar blacklist
    if (nombre_quien_recoge) {
      const blackResult = await client.query(
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

    // Leer config de horario y cobro desde configuracion_general (fuente de verdad: directora)
    const cfgRows = await client.query(`
      SELECT clave, valor FROM configuracion_general
      WHERE clave IN ('hora_salida_normal', 'hora_inicio_cobro_extension', 'costo_extension_hora')
    `);
    const cfg = {};
    cfgRows.rows.forEach(r => { cfg[r.clave] = r.valor; });
    const horaSalidaNormal  = cfg['hora_salida_normal']          || '15:00';
    const horaInicioCobro   = cfg['hora_inicio_cobro_extension'] || '15:06';
    const costoExtHora      = parseFloat(cfg['costo_extension_hora'] || '125');

    // Leer si el alumno tiene extensión contratada
    const alumnoHorarioRes = await client.query(`
      SELECT COALESCE(cha.tiene_extension, false) AS tiene_extension
      FROM alumnos a
      LEFT JOIN config_horario_alumno cha ON cha.alumno_id = a.id
      WHERE a.id = $1
    `, [alumno_id]);
    const tieneExtension = alumnoHorarioRes.rows[0]?.tiene_extension === true;

    // Función helper: convertir HH:MM a minutos desde medianoche
    function horaAMinutos(horaStr) {
      const [h, m] = horaStr.split(':').map(Number);
      return h * 60 + m;
    }

    // Hora actual en zona México
    const horaActualMX = ahora.toLocaleTimeString('en-CA', {
      timeZone: 'America/Mexico_City',
      hour: '2-digit', minute: '2-digit', hour12: false
    });

    const minActual      = horaAMinutos(horaActualMX);
    const minSalidaNorm  = horaAMinutos(horaSalidaNormal);
    const minInicioCobro = horaAMinutos(horaInicioCobro);

    let esSalidaTardia = false;
    let minutosTarde   = 0;
    let cobroExtension = 0;

    if (!tieneExtension && minActual >= minInicioCobro) {
      esSalidaTardia = true;
      minutosTarde   = minActual - minSalidaNorm;
      // Monto fijo = costo_extension_hora de la config
      cobroExtension = costoExtHora;
    }

    // Iniciar transacción
    await client.query('BEGIN');

    // INSERT a registro_salida con campos de salida tardía
    const result = await client.query(`
      INSERT INTO registro_salida (
        alumno_id, hora_salida, recogido_por_tipo, padre_id, persona_autorizada_id,
        nombre_quien_recoge, autorizado, alerta_generada, qr_escaneado, registrado_por,
        es_anticipada, motivo_salida,
        es_extension, minutos_tarde, cobro_extension
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *
    `, [
      alumno_id, ahora,
      padre_id ? 'padre' : persona_autorizada_id ? 'persona_autorizada' : 'otro',
      padre_id, persona_autorizada_id, nombre_quien_recoge,
      autorizado, alerta, qr_escaneado || false, req.user.id,
      es_anticipada || false, motivo_salida || null,
      esSalidaTardia, minutosTarde, cobroExtension
    ]);

    let salida_sanitaria = null;

    // INSERT condicional a registro_salida_sanitario — SIEMPRE guardar (almenos uno de los campos viene)
    try {
      const sanitariaResult = await client.query(`
        INSERT INTO registro_salida_sanitario
          (alumno_id, fecha, panial_limpio, pertenencias_ok, estado_fisico_ok, notas, entrega_conforme, registrado_por, updated_at)
        VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, NOW())
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET
          panial_limpio = COALESCE(EXCLUDED.panial_limpio, registro_salida_sanitario.panial_limpio),
          pertenencias_ok = COALESCE(EXCLUDED.pertenencias_ok, registro_salida_sanitario.pertenencias_ok),
          estado_fisico_ok = COALESCE(EXCLUDED.estado_fisico_ok, registro_salida_sanitario.estado_fisico_ok),
          notas = COALESCE(EXCLUDED.notas, registro_salida_sanitario.notas),
          entrega_conforme = COALESCE(EXCLUDED.entrega_conforme, registro_salida_sanitario.entrega_conforme),
          updated_at = NOW()
        RETURNING *
      `, [
        alumno_id,
        typeof panial_limpio === 'boolean' ? panial_limpio : null,
        typeof pertenencias_ok === 'boolean' ? pertenencias_ok : null,
        typeof estado_fisico_ok === 'boolean' ? estado_fisico_ok : null,
        notas_sanitarias || null,
        typeof entrega_conforme === 'boolean' ? entrega_conforme : null,
        req.user.id
      ]);
      salida_sanitaria = sanitariaResult.rows[0];
    } catch (err) {
      console.error('Error al guardar salida_sanitaria:', err.message);
      // No bloquear la transacción si falla el sanitario
    }

    // Generar registro en pagos si es salida tardía
    let pagoSalidaTardia = null;
    if (esSalidaTardia && cobroExtension > 0) {
      const conceptoRes = await client.query(`
        SELECT id FROM conceptos_pago
        WHERE nombre ILIKE 'Salida tard%' AND activo = true LIMIT 1
      `);
      if (conceptoRes.rows[0]) {
        const mesActual = ahora.getMonth() + 1;
        const anioActual = ahora.getFullYear();
        const pagoRes = await client.query(`
          INSERT INTO pagos
            (alumno_id, concepto_id, monto_base, monto_total, estado, origen, mes_correspondiente, anio_correspondiente, registrado_por)
          VALUES ($1, $2, $3, $3, 'pendiente', 'salida_tardia', $5, $6, $4)
          RETURNING id, monto_total, estado
        `, [alumno_id, conceptoRes.rows[0].id, cobroExtension, req.user.id, mesActual, anioActual]);
        pagoSalidaTardia = pagoRes.rows[0];
      }
    }

    // COMMIT transacción
    await client.query('COMMIT');

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

    // Notificar a ambos tutores si es salida anticipada
    if (es_anticipada) {
      const tutoresResult = await query(`
        SELECT p.nombre_completo AS padre_nombre,
               COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
               a.nombre_completo AS alumno_nombre,
               p.usuario_id
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        WHERE a.id = $1
      `, [alumno_id]);

      const horaTexto = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Mexico_City' });

      let quienRecoge = nombre_quien_recoge || null;
      if (!quienRecoge && padre_id) {
        const padreRes = await query(
          'SELECT nombre_completo, parentesco FROM padres WHERE id = $1',
          [padre_id]
        );
        if (padreRes.rows[0]) {
          quienRecoge = `${padreRes.rows[0].nombre_completo} (${padreRes.rows[0].parentesco})`;
        }
      }
      if (!quienRecoge && persona_autorizada_id) {
        const autRes = await query(
          'SELECT nombre_completo, parentesco FROM personas_autorizadas WHERE id = $1',
          [persona_autorizada_id]
        );
        if (autRes.rows[0]) {
          quienRecoge = `${autRes.rows[0].nombre_completo} (${autRes.rows[0].parentesco})`;
        }
      }
      quienRecoge = quienRecoge || 'No especificado';

      for (const tutor of tutoresResult.rows) {
        // Notificación en-app
        if (tutor.usuario_id) {
          await query(`
            INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
            VALUES ($1, $2, $3, 'salida_anticipada', $4)
          `, [
            tutor.usuario_id,
            `Salida anticipada — ${tutor.alumno_nombre}`,
            `${tutor.alumno_nombre} fue recogido/a anticipadamente a las ${horaTexto} por ${quienRecoge}. Motivo: ${motivo_salida}`,
            JSON.stringify({ alumno_id, quien_recoge: quienRecoge, motivo: motivo_salida }),
          ]);
          enviarPush(tutor.usuario_id, `Salida anticipada — ${tutor.alumno_nombre}`, `${tutor.alumno_nombre} fue recogido/a a las ${horaTexto} por ${quienRecoge}.`, { tipo: 'salida_anticipada', alumno_id: String(alumno_id) });
        }
        // WhatsApp
        if (tutor.telefono) {
          await enviarMensaje({
            telefono: tutor.telefono,
            clave: 'salida_anticipada',
            variables: {
              nombre_padre: tutor.padre_nombre.split(' ')[0],
              nombre_alumno: tutor.alumno_nombre,
              hora: horaTexto,
              quien_recoge: quienRecoge,
              motivo: motivo_salida,
            },
            alumnoId: alumno_id,
          });
        }
      }
    }

    // Detectar hermanos sin salida registrada hoy
    const hermanosSinSalirResult = await query(`
      SELECT a2.id, a2.nombre_completo, g.nombre AS grupo_nombre
      FROM alumnos a1
      JOIN alumnos a2 ON a2.familia_id = a1.familia_id
                     AND a2.id != a1.id
                     AND a2.deleted_at IS NULL
      JOIN grupos g ON a2.grupo_id = g.id
      LEFT JOIN registro_salida rs2 ON rs2.alumno_id = a2.id
                                    AND rs2.hora_salida::date = CURRENT_DATE
      WHERE a1.id = $1
        AND a1.familia_id IS NOT NULL
        AND rs2.id IS NULL
        AND EXISTS (
          SELECT 1 FROM registro_entrada re2
          WHERE re2.alumno_id = a2.id AND re2.fecha = CURRENT_DATE
            AND re2.puede_entrar = true
        )
    `, [alumno_id]);

    res.json({
      salida: result.rows[0],
      salida_sanitaria,
      autorizado,
      alerta,
      hermanos_sin_salir: hermanosSinSalirResult.rows,
      es_salida_tardia: esSalidaTardia,
      pago_salida_tardia: pagoSalidaTardia
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

// Filtro de entrada — todos los alumnos activos agrupados por grupo
// Devuelve TODOS si: no tiene grupo asignado (maestra_puerta permanente) O tiene turno_puerta hoy
router.get('/filtro-entrada', async (req, res, next) => {
  try {
    const fechaParam = req.query.fecha || null;
    const fechaRow = await query(`SELECT COALESCE($1::date, CURRENT_DATE)::text AS f`, [fechaParam]);
    const fechaResuelta = fechaRow.rows[0].f;

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
        WHERE tp.fecha = $1::date AND p.usuario_id = $2
      `, [fechaResuelta, req.user.id]),
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
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = $1::date
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = $1::date
      WHERE a.deleted_at IS NULL AND a.estado IN ('inscrito','reinscrito')
        AND g.deleted_at IS NULL AND g.activo = true
        ${whereGrupo}
      ORDER BY g.nivel, g.nombre, a.nombre_completo
    `, [fechaResuelta]);

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

    res.json({ grupos: Object.values(grupos), fecha: fechaResuelta });
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
        CASE WHEN re.puede_entrar = false THEN 0 ELSE COALESCE(re.numero_retardo_mes, 0) END AS numero_retardo_mes,
        re.qr_escaneado
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
             ast.estado,
             ast.justificacion_motivo,
             ast.justificada_at,
             ast.justificacion_comprobante_url,
             p.nombre_completo AS justificada_por_nombre
      FROM alumnos a
      LEFT JOIN asistencia ast
        ON ast.alumno_id = a.id
       AND EXTRACT(MONTH FROM ast.fecha) = $2
       AND EXTRACT(YEAR  FROM ast.fecha) = $3
      LEFT JOIN personal p ON p.id = ast.justificada_por
      WHERE a.grupo_id = $1
        AND a.deleted_at IS NULL
        AND a.estado IN ('inscrito','reinscrito')
      ORDER BY a.nombre_completo, ast.fecha
    `, [req.params.grupo_id, mes, anio]);

    // Agrupar por alumno → { id, nombre_completo, foto_url, dias: { 'YYYY-MM-DD': estado | objeto } }
    const mapa = {};
    for (const row of result.rows) {
      if (!mapa[row.id]) {
        mapa[row.id] = { id: row.id, nombre_completo: row.nombre_completo, foto_url: row.foto_url, dias: {} };
      }
      if (row.fecha) {
        if (row.estado === 'justificado') {
          mapa[row.id].dias[row.fecha] = {
            estado: 'justificado',
            motivo: row.justificacion_motivo,
            justificada_at: row.justificada_at,
            comprobante_url: row.justificacion_comprobante_url,
            justificada_por: row.justificada_por_nombre,
          };
        } else {
          mapa[row.id].dias[row.fecha] = row.estado;
        }
      }
    }
    res.json(Object.values(mapa));
  } catch (err) { next(err); }
});

// Filtro de salida — alumnos presentes hoy sin salida registrada
router.get('/filtro-salida', async (req, res, next) => {
  try {
    const fechaParam = req.query.fecha || null;
    const fechaRow = await query(`SELECT COALESCE($1::date, CURRENT_DATE)::text AS f`, [fechaParam]);
    const fechaResuelta = fechaRow.rows[0].f;

    // Leer config de horario
    const cfgResult = await query(
      `SELECT clave, valor FROM configuracion_general
       WHERE clave IN ('hora_salida_normal', 'hora_inicio_cobro_extension')`
    );
    const cfgMap = {};
    cfgResult.rows.forEach(r => { cfgMap[r.clave] = r.valor; });
    const hora_salida_normal        = cfgMap['hora_salida_normal']          || '15:00';
    const hora_inicio_cobro_ext     = cfgMap['hora_inicio_cobro_extension'] || '15:06';

    // Alumnos presentes el día especificado, agrupados por grupo, con flag de salida ya registrada
    const result = await query(`
      SELECT
        a.id, a.nombre_completo, a.foto_url, a.usa_panial,
        g.id AS grupo_id, g.nombre AS grupo_nombre, g.color_hex AS grupo_color,
        COALESCE(ast.estado, 'ausente') AS estado_asistencia,
        re.hora_entrada,
        rs.id AS salida_id, rs.hora_salida, rs.autorizado AS salida_autorizada,
        rs.nombre_quien_recoge,
        COALESCE(cha.tiene_extension, false) AS tiene_extension,
        cha.hora_salida_extension
      FROM alumnos a
      JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN asistencia ast ON ast.alumno_id = a.id AND ast.fecha = $1::date
      LEFT JOIN registro_entrada re ON re.alumno_id = a.id AND re.fecha = $1::date
      LEFT JOIN registro_salida rs ON rs.alumno_id = a.id AND rs.fecha = $1::date
      LEFT JOIN config_horario_alumno cha ON cha.alumno_id = a.id
      WHERE a.deleted_at IS NULL AND a.estado IN ('inscrito','reinscrito')
        AND g.deleted_at IS NULL AND g.activo = true
        AND ast.estado IN ('presente','retardo')
      ORDER BY g.nivel, g.nombre, a.nombre_completo
    `, [fechaResuelta]);

    // Padres y personas autorizadas por alumno (para el selector "quién recoge")
    const alumnoIds = [...new Set(result.rows.map(r => r.id))];
    let padresMap = {};
    let autorizadosMap = {};

    if (alumnoIds.length > 0) {
      const padresResult = await query(`
        SELECT ap.alumno_id, p.id, p.nombre_completo, p.parentesco
        FROM alumno_padre ap
        JOIN padres p ON ap.padre_id = p.id
        WHERE ap.alumno_id = ANY($1)
        ORDER BY ap.es_tutor_principal DESC, p.nombre_completo
      `, [alumnoIds]);
      for (const r of padresResult.rows) {
        if (!padresMap[r.alumno_id]) padresMap[r.alumno_id] = [];
        padresMap[r.alumno_id].push({ id: r.id, nombre: r.nombre_completo, tipo: r.parentesco });
      }

      const autResult = await query(`
        SELECT id, alumno_id, nombre_completo, parentesco
        FROM personas_autorizadas
        WHERE alumno_id = ANY($1) AND activo = true
        ORDER BY nombre_completo
      `, [alumnoIds]);
      for (const r of autResult.rows) {
        if (!autorizadosMap[r.alumno_id]) autorizadosMap[r.alumno_id] = [];
        autorizadosMap[r.alumno_id].push({ id: r.id, nombre: r.nombre_completo, parentesco: r.parentesco });
      }
    }

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
      grupos[row.grupo_id].alumnos.push({
        ...row,
        padres: padresMap[row.id] || [],
        autorizados: autorizadosMap[row.id] || [],
      });
    }

    res.json({
      grupos: Object.values(grupos),
      hora_salida_normal,
      hora_inicio_cobro_extension: hora_inicio_cobro_ext,
      fecha: fechaResuelta
    });
  } catch (err) { next(err); }
});

// GET /asistencia/filtro-entrada/:alumno_id?fecha=YYYY-MM-DD — Para papás consultar entrada de cualquier fecha
router.get('/filtro-entrada/:alumno_id', async (req, res, next) => {
  try {
    const { alumno_id } = req.params;
    const { fecha } = req.query; // formato YYYY-MM-DD

    if (!fecha) return res.status(400).json({ error: 'fecha es obligatorio (YYYY-MM-DD)' });

    const result = await query(`
      SELECT
        hora_entrada, es_retardo, numero_retardo_mes, puede_entrar, motivo_no_entrada,
        uñas_cortadas, sin_lagañas, sin_fiebre, temperatura,
        sin_sintomas, sintomas_notas, panial_limpio, trae_uniforme,
        trae_bata, trae_termo, agua_suficiente,
        trajo_paniales, trajo_toallitas
      FROM registro_entrada
      WHERE alumno_id = $1 AND fecha = $2
    `, [alumno_id, fecha]);

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /asistencia/:alumnoId/justificar ───────────────────────────────────
// Marcar una falta como justificada con comprobante opcional
router.patch('/:alumnoId/justificar', upload.single('comprobante'), authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const { fecha, motivo } = req.body;

    // Obtener el ID de la persona autenticada
    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1',
      [req.user.id]
    );
    const justificadaPor = personalResult.rows[0]?.id || null;

    let comprobanteUrl = null;
    let comprobantePublicId = null;

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, {
        folder: 'justificantes',
        resource_type: 'image',
      });
      comprobanteUrl = uploadResult.url;
      comprobantePublicId = uploadResult.public_id;
    }

    // Upsert: crea la fila si no existe (ausencia virtual), o actualiza si ya existe
    const result = await query(`
      INSERT INTO asistencia (alumno_id, fecha, estado, justificacion_motivo, justificada_por, justificada_at, justificacion_comprobante_url, justificacion_comprobante_public_id)
      VALUES ($3, $4::date, 'justificado', $1, $2, NOW(), $5, $6)
      ON CONFLICT (alumno_id, fecha) DO UPDATE
        SET estado = 'justificado',
            justificacion_motivo = EXCLUDED.justificacion_motivo,
            justificada_por = EXCLUDED.justificada_por,
            justificada_at = NOW(),
            justificacion_comprobante_url = EXCLUDED.justificacion_comprobante_url,
            justificacion_comprobante_public_id = EXCLUDED.justificacion_comprobante_public_id,
            updated_at = NOW()
      RETURNING *
    `, [motivo, justificadaPor, alumnoId, fecha, comprobanteUrl, comprobantePublicId]);

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /asistencia/salida-sanitario ──────────────────────────────────────
// Registrar checklist de salida sanitaria
router.post('/salida-sanitario', async (req, res, next) => {
  try {
    const { alumno_id, panial_limpio, pertenencias_ok, estado_fisico_ok, notas, entrega_conforme } = req.body;

    const result = await query(`
      INSERT INTO registro_salida_sanitario
        (alumno_id, fecha, panial_limpio, pertenencias_ok, estado_fisico_ok, notas, entrega_conforme, registrado_por, updated_at)
      VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7, NOW())
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET
        panial_limpio = EXCLUDED.panial_limpio,
        pertenencias_ok = EXCLUDED.pertenencias_ok,
        estado_fisico_ok = EXCLUDED.estado_fisico_ok,
        notas = EXCLUDED.notas,
        entrega_conforme = EXCLUDED.entrega_conforme,
        registrado_por = EXCLUDED.registrado_por,
        updated_at = NOW()
      RETURNING *
    `, [alumno_id, panial_limpio, pertenencias_ok, estado_fisico_ok, notas, entrega_conforme, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /asistencia/salida-sanitario/:alumnoId ────────────────────────────
// Obtener checklist de salida sanitaria
router.get('/salida-sanitario/:alumnoId', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const { fecha } = req.query;

    const result = await query(`
      SELECT * FROM registro_salida_sanitario
      WHERE alumno_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE)
    `, [alumnoId, fecha]);

    res.json(result.rows[0] || null);
  } catch (err) { next(err); }
});

module.exports = router;
