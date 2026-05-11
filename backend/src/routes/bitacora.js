const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje, notificarFiebre } = require('../services/whatsappService');
const { uploadToCloudinary, deleteFromCloudinary } = require('../services/cloudinaryService');
const { enviarPush } = require('../services/pushService');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// ── GET /bitacora/incidentes/hoy ─────────────────────────────────────────
// Todos los incidentes del día — para la directora
router.get('/incidentes/hoy', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT i.*,
             a.nombre_completo AS alumno_nombre,
             g.nombre AS grupo_nombre,
             p.nombre_completo AS reportado_por_nombre
      FROM incidentes i
      JOIN alumnos a ON i.alumno_id = a.id
      LEFT JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN personal p ON i.reportado_por = p.id
      WHERE DATE(i.fecha AT TIME ZONE 'America/Mexico_City') = (NOW() AT TIME ZONE 'America/Mexico_City')::DATE
      ORDER BY i.fecha DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /bitacora/actividades-grupo?grupo_id=&fecha= ──────────────────────
// DEBE ESTAR ANTES DE /:alumnoId para evitar que sea interpretado como alumnoId
// Obtener actividades del día definidas para un grupo
router.get('/actividades-grupo', async (req, res, next) => {
  try {
    const { grupo_id, fecha } = req.query;
    if (!grupo_id) {
      return res.status(400).json({ error: 'grupo_id is required' });
    }

    const result = await query(`
      SELECT id, descripcion, foto_url, orden
      FROM actividades_grupo
      WHERE grupo_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE)
      ORDER BY orden ASC
    `, [grupo_id, fecha]);

    res.json(result.rows || []);
  } catch (err) { next(err); }
});

// ── POST /bitacora/vomito ───────────────────────────────────────────────────
// Registrar episodio de vómito
router.post('/vomito', async (req, res, next) => {
  try {
    const { alumno_id, intensidad, notas } = req.body;
    let { bitacora_id } = req.body;

    if (!bitacora_id) {
      const personalResult = await query('SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]);
      const maestraId = personalResult.rows[0]?.id || null;
      const hoy = new Date().toISOString().substring(0, 10);
      const bResult = await query(`
        INSERT INTO bitacora_diaria (alumno_id, fecha, maestra_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `, [alumno_id, hoy, maestraId]);
      bitacora_id = bResult.rows[0].id;
    }

    const result = await query(`
      INSERT INTO registro_vomito (alumno_id, bitacora_id, intensidad, notas, registrado_por)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [alumno_id, bitacora_id, intensidad, notas, req.user.id]);

    // Notificar a todos los padres de vómito (cualquier intensidad)
    const padresResult = await query(`
      SELECT a.nombre_completo AS alumno_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             p.nombre_completo AS padre_nombre,
             u.id AS usuario_id
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id
      JOIN padres p ON ap.padre_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE a.id = $1
    `, [alumno_id]);

    const tipoAlerta = intensidad === 'fuerte' ? 'Vómito fuerte' : intensidad === 'moderado' ? 'Vómito moderado' : 'Vómito leve';
    const emoji = intensidad === 'fuerte' ? '🚨' : intensidad === 'moderado' ? '🤮' : '🤢';

    for (const { alumno_nombre, telefono, padre_nombre, usuario_id } of padresResult.rows) {
      await enviarMensaje({
        telefono,
        clave: 'alerta_salud',
        variables: {
          nombre_padre: padre_nombre.split(' ')[0],
          nombre_alumno: alumno_nombre,
          tipo_alerta: tipoAlerta,
        },
        alumnoId: alumno_id,
      });
      if (usuario_id) {
        await query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'alerta_vomito', $4)
        `, [
          usuario_id,
          `${emoji} Alerta de salud — ${alumno_nombre}`,
          `${tipoAlerta} registrado en ${alumno_nombre}.`,
          JSON.stringify({ alumno_id, tipo: 'vomito', intensidad }),
        ]);
        enviarPush(usuario_id, `${emoji} Alerta de salud — ${alumno_nombre}`, `${tipoAlerta} registrado en ${alumno_nombre}.`, { tipo: 'alerta_vomito', alumno_id: String(alumno_id) });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /bitacora/:alumnoId?fecha=YYYY-MM-DD ──────────────────────────────
// Obtener bitácora completa de un alumno en una fecha (default: hoy)
router.get('/:alumnoId', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const fecha = req.query.fecha || null; // null → CURRENT_DATE (hora local PostgreSQL)

    const [fechaRow, bitacora, banio, comida, panial, esfinteres, medicamentos, incidentes, actividades, tareas, vomitos, recepciones, fotosActividad, salidaReg, salidaSan] = await Promise.all([

      query(`SELECT COALESCE($1::date, CURRENT_DATE)::text AS f`, [fecha]),

      query(`
        SELECT bd.*, p.nombre_completo AS maestra_nombre
        FROM bitacora_diaria bd
        LEFT JOIN personal p ON bd.maestra_id = p.id
        WHERE bd.alumno_id = $1 AND bd.fecha = COALESCE($2::date, CURRENT_DATE)
      `, [alumnoId, fecha]),

      query(
        'SELECT * FROM registro_banio WHERE alumno_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE)',
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM registro_comida WHERE alumno_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE) ORDER BY tiempo',
        [alumnoId, fecha]
      ),

      query(
        "SELECT * FROM registro_panial WHERE alumno_id = $1 AND DATE(hora AT TIME ZONE 'America/Mexico_City') = COALESCE($2::date, CURRENT_DATE) ORDER BY hora",
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM control_esfinteres WHERE alumno_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE)',
        [alumnoId, fecha]
      ),

      query(
        'SELECT * FROM medicamentos WHERE alumno_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE) ORDER BY hora_administracion',
        [alumnoId, fecha]
      ),

      query(`
        SELECT i.*, p.nombre_completo AS reportado_por_nombre
        FROM incidentes i
        LEFT JOIN personal p ON i.reportado_por = p.id
        WHERE i.alumno_id = $1 AND DATE(i.fecha AT TIME ZONE 'America/Mexico_City') = COALESCE($2::date, CURRENT_DATE)
        ORDER BY i.fecha
      `, [alumnoId, fecha]),

      query(`
        SELECT ag.id, ag.descripcion, ag.foto_url, ag.orden, aa.participo,
          COALESCE(
            json_agg(
              json_build_object('id', af.id, 'foto_url', af.foto_url, 'public_id', af.public_id)
              ORDER BY af.created_at
            ) FILTER (WHERE af.id IS NOT NULL),
            '[]'
          ) AS fotos_alumno
        FROM actividades_grupo ag
        LEFT JOIN actividades_alumno aa ON aa.actividad_grupo_id = ag.id AND aa.alumno_id = $1
        LEFT JOIN actividades_fotos af ON af.actividad_grupo_id = ag.id AND af.alumno_id = $1
        WHERE ag.grupo_id = (SELECT grupo_id FROM alumnos WHERE id = $1)
          AND ag.fecha = COALESCE($2::date, CURRENT_DATE)
        GROUP BY ag.id, ag.descripcion, ag.foto_url, ag.orden, aa.participo
        ORDER BY ag.orden
      `, [alumnoId, fecha]),

      query(`
        SELECT t.id, t.titulo, t.descripcion, t.fecha_limite, t.foto_url, ta.completada, ta.fecha_completada
        FROM tareas t
        LEFT JOIN tarea_alumno ta ON t.id = ta.tarea_id AND ta.alumno_id = $1
        WHERE t.grupo_id = (SELECT grupo_id FROM alumnos WHERE id = $1)
          AND t.publicada = true
          AND t.fecha_limite = COALESCE($2::date, CURRENT_DATE)
        ORDER BY t.created_at DESC
      `, [alumnoId, fecha]),

      query(
        "SELECT * FROM registro_vomito WHERE alumno_id = $1 AND DATE(hora AT TIME ZONE 'America/Mexico_City') = COALESCE($2::date, CURRENT_DATE) ORDER BY hora DESC",
        [alumnoId, fecha]
      ),

      query(`
        SELECT rm.*,
               COALESCE(
                 json_agg(
                   json_build_object(
                     'id', t.id,
                     'hora_programada', t.hora_programada::text,
                     'administrado', t.administrado,
                     'administrado_at', t.administrado_at
                   ) ORDER BY t.hora_programada
                 ) FILTER (WHERE t.id IS NOT NULL),
                 '[]'
               ) AS tomas
        FROM recepcion_medicamento rm
        LEFT JOIN toma_medicamento t ON t.recepcion_id = rm.id
        WHERE rm.alumno_id = $1 AND rm.fecha = COALESCE($2::date, CURRENT_DATE)
        GROUP BY rm.id
        ORDER BY rm.created_at DESC
      `, [alumnoId, fecha]),

      // Fotos individuales del alumno en actividades (subidas por la maestra)
      query(
        `SELECT id, foto_url, public_id, descripcion, created_at
         FROM actividades_fotos
         WHERE alumno_id = $1 AND es_grupal = false
           AND fecha = COALESCE($2::date, CURRENT_DATE)
         ORDER BY created_at`,
        [alumnoId, fecha]
      ),

      // Registro de salida
      query(
        `SELECT rs.hora_salida, rs.nombre_quien_recoge, rs.recogido_por_tipo,
                rs.es_anticipada, rs.motivo_salida, rs.autorizado
         FROM registro_salida rs
         WHERE rs.alumno_id = $1 AND rs.hora_salida::date = COALESCE($2::date, CURRENT_DATE)
         LIMIT 1`,
        [alumnoId, fecha]
      ),

      // Sanitario de salida
      query(
        `SELECT panial_limpio, pertenencias_ok, estado_fisico_ok, notas, entrega_conforme
         FROM registro_salida_sanitario
         WHERE alumno_id = $1 AND fecha = COALESCE($2::date, CURRENT_DATE)
         LIMIT 1`,
        [alumnoId, fecha]
      ),
    ]);

    res.json({
      fecha: fechaRow.rows[0].f,
      alumno_id: alumnoId,
      bitacora:    bitacora.rows[0]      || null,
      banio:       banio.rows[0]         || null,
      comida:      comida.rows           || [],
      panial:      panial.rows          || [],
      esfinteres:  esfinteres.rows[0]    || null,
      medicamentos: medicamentos.rows    || [],
      incidentes:   incidentes.rows      || [],
      actividades:  actividades.rows     || [],
      tareas:       tareas.rows          || [],
      vomitos:      vomitos.rows         || [],
      recepciones_medicamento: recepciones.rows || [],
      salida: salidaReg.rows[0] ? {
        ...salidaReg.rows[0],
        ...(salidaSan.rows[0] || {}),
      } : null,
    });
  } catch (err) { next(err); }
});

// ── GET /bitacora/:alumnoId/rango?fecha_inicio=&fecha_fin= ────────────────
// Listado de días de bitácora en un rango (para historial de ciclo)
router.get('/:alumnoId/rango', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const { fecha_inicio, fecha_fin } = req.query;

    if (!fecha_inicio || !fecha_fin) {
      return res.status(400).json({ error: 'fecha_inicio y fecha_fin son requeridos' });
    }

    const result = await query(`
      SELECT bd.fecha, bd.estado_animo, bd.comportamiento, bd.notas,
             p.nombre_completo AS maestra_nombre
      FROM bitacora_diaria bd
      LEFT JOIN personal p ON bd.maestra_id = p.id
      WHERE bd.alumno_id = $1
        AND bd.fecha BETWEEN $2::date AND $3::date
      ORDER BY bd.fecha DESC
    `, [alumnoId, fecha_inicio, fecha_fin]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /bitacora/guardar ────────────────────────────────────────────────
// Guarda o actualiza la bitácora completa del día (upsert por alumno+fecha)
router.post('/guardar', async (req, res, next) => {
  try {
    const {
      alumno_id, fecha,
      // Bitácora general
      estado_animo, actividad_realizada, actividad_descripcion, comportamiento, comportamiento_notas,
      tuvo_fiebre, temperatura_dia, se_enfermo, descripcion_enfermedad, notas,
      // Baño
      pipi_count, popo_count,
      // Comida (array de 4 tiempos)
      comidas,
      // Esfínteres
      fue_solo, pidio_ir, tuvo_accidente, descripcion_accidente, necesito_ayuda, notas_progreso,
    } = req.body;

    const { rows: [{ f: fechaFinal }] } = await query(`SELECT COALESCE($1::date, CURRENT_DATE)::text AS f`, [fecha || null]);

    // Obtener personal_id de la maestra autenticada
    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1',
      [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    // Upsert bitácora principal
    const bitacoraResult = await query(`
      INSERT INTO bitacora_diaria (
        alumno_id, fecha, maestra_id,
        estado_animo, actividad_realizada, actividad_descripcion, comportamiento, comportamiento_notas,
        tuvo_fiebre, temperatura_dia, se_enfermo, descripcion_enfermedad, notas
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      ON CONFLICT (alumno_id, fecha) DO UPDATE SET
        maestra_id = $3,
        estado_animo = $4, actividad_realizada = $5, actividad_descripcion = $6,
        comportamiento = $7, comportamiento_notas = $8,
        tuvo_fiebre = $9, temperatura_dia = $10,
        se_enfermo = $11, descripcion_enfermedad = $12,
        notas = $13, updated_at = NOW()
      RETURNING id
    `, [
      alumno_id, fechaFinal, maestraId,
      estado_animo, actividad_realizada, actividad_descripcion, comportamiento, comportamiento_notas,
      tuvo_fiebre || false, temperatura_dia, se_enfermo || false, descripcion_enfermedad, notas,
    ]);

    const bitacoraId = bitacoraResult.rows[0].id;

    // Upsert baño
    if (pipi_count !== undefined || popo_count !== undefined) {
      await query(`
        INSERT INTO registro_banio (alumno_id, bitacora_id, fecha, pipi_count, popo_count)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET
          pipi_count = $4, popo_count = $5, updated_at = NOW()
      `, [alumno_id, bitacoraId, fechaFinal, pipi_count || 0, popo_count || 0]);
    }

    // Upsert comida (múltiples tiempos)
    if (comidas && Array.isArray(comidas) && comidas.length > 0) {
      for (const comida of comidas) {
        const { tiempo, que_comio, cuanto_comio, observaciones } = comida;
        if (tiempo && (que_comio !== undefined || cuanto_comio !== undefined)) {
          await query(`
            INSERT INTO registro_comida (alumno_id, bitacora_id, fecha, tiempo, que_comio, cuanto_comio, observaciones)
            VALUES ($1,$2,$3,$4,$5,$6,$7)
            ON CONFLICT (alumno_id, fecha, tiempo) DO UPDATE SET
              que_comio = $5, cuanto_comio = $6, observaciones = $7, updated_at = NOW()
          `, [alumno_id, bitacoraId, fechaFinal, tiempo, que_comio, cuanto_comio, observaciones]);
        }
      }
    }

    // Upsert esfínteres
    if (fue_solo !== undefined) {
      await query(`
        INSERT INTO control_esfinteres (alumno_id, bitacora_id, fecha, fue_solo, pidio_ir, tuvo_accidente, descripcion_accidente, necesito_ayuda, notas_progreso)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET
          fue_solo=$4, pidio_ir=$5, tuvo_accidente=$6,
          descripcion_accidente=$7, necesito_ayuda=$8, notas_progreso=$9
      `, [alumno_id, bitacoraId, fechaFinal, fue_solo, pidio_ir, tuvo_accidente, descripcion_accidente, necesito_ayuda, notas_progreso]);
    }

    // Notificar a padres que la bitácora está lista (solo si es la primera vez del día)
    const yaNotificado = await query(
      "SELECT id FROM log_whatsapp WHERE alumno_id = $1 AND tipo = 'bitacora_lista' AND DATE(created_at) = $2",
      [alumno_id, fechaFinal]
    );

    if (yaNotificado.rows.length === 0) {
      const padresResult = await query(`
        SELECT a.nombre_completo AS alumno_nombre,
               COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
               p.nombre_completo AS padre_nombre,
               u.id AS usuario_id
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.id = $1
      `, [alumno_id]);

      for (const { alumno_nombre, telefono, padre_nombre, usuario_id } of padresResult.rows) {
        if (usuario_id) {
          await query(`
            INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
            VALUES ($1, $2, $3, 'bitacora_lista', $4)
          `, [
            usuario_id,
            `Bitácora lista — ${alumno_nombre}`,
            `La maestra registró la bitácora de hoy de ${alumno_nombre}.`,
            JSON.stringify({ alumno_id }),
          ]);
          enviarPush(usuario_id, `Bitácora lista — ${alumno_nombre}`, `La maestra registró la bitácora de hoy de ${alumno_nombre}.`, { tipo: 'bitacora_lista', alumno_id: String(alumno_id) });
        }
      }
    }

    // Alerta de fiebre: si tuvo_fiebre=true, notificar a padres (solo 1 vez por día)
    if (tuvo_fiebre) {
      const yaAlertaFiebre = await query(
        "SELECT id FROM log_whatsapp WHERE alumno_id = $1 AND tipo = 'fiebre' AND DATE(created_at) = $2",
        [alumno_id, fechaFinal]
      );
      if (yaAlertaFiebre.rows.length === 0) {
        const padresFiebre = await query(`
          SELECT a.id AS alumno_id, a.nombre_completo AS alumno_nombre,
                 COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
                 p.nombre_completo AS padre_nombre,
                 p.usuario_id
          FROM alumnos a
          JOIN alumno_padre ap ON ap.alumno_id = a.id
          JOIN padres p ON ap.padre_id = p.id
          WHERE a.id = $1 AND p.telefono IS NOT NULL
        `, [alumno_id]);
        for (const r of padresFiebre.rows) {
          await notificarFiebre(
            { nombre_completo: r.padre_nombre, telefono: r.telefono },
            { nombre_completo: r.alumno_nombre, id: r.alumno_id },
            temperatura_dia
          ).catch(() => {});
          if (r.usuario_id) {
            const tituloFiebre = `🌡️ Alerta de fiebre — ${r.alumno_nombre}`;
            const cuerpoFiebre = `${r.alumno_nombre} presentó fiebre hoy${temperatura_dia ? ` (${temperatura_dia}°C)` : ''}.`;
            await query(
              `INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra) VALUES ($1, $2, $3, 'alerta_fiebre', $4)`,
              [r.usuario_id, tituloFiebre, cuerpoFiebre, JSON.stringify({ tipo: 'alerta_fiebre', alumno_id: String(alumno_id) })]
            );
            enviarPush(r.usuario_id, tituloFiebre, cuerpoFiebre, { tipo: 'alerta_fiebre', alumno_id: String(alumno_id) });
          }
        }
      }
    }

    res.json({ ok: true, bitacora_id: bitacoraId });
  } catch (err) { next(err); }
});

// ── POST /bitacora/:id/foto ───────────────────────────────────────────────
// Subir o reemplazar foto del día en bitácora (Cloudinary)
router.post('/:id/foto', upload.single('foto'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se envió foto' });

    const { id } = req.params;

    // Verificar que la bitácora existe
    const existing = await query('SELECT id, foto_public_id FROM bitacora_diaria WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Bitácora no encontrada' });

    // Borrar foto anterior si existe
    if (existing.rows[0].foto_public_id) {
      await deleteFromCloudinary(existing.rows[0].foto_public_id);
    }

    const uploadResult = await uploadToCloudinary(req.file.buffer, {
      folder: 'happyschool/bitacora',
      transformation: [{ width: 800, height: 800, crop: 'limit' }],
    });

    await query(
      'UPDATE bitacora_diaria SET foto_url = $1, foto_public_id = $2, updated_at = NOW() WHERE id = $3',
      [uploadResult.url, uploadResult.public_id, id]
    );

    res.json({ ok: true, foto_url: uploadResult.url });
  } catch (err) { next(err); }
});

// ── DELETE /bitacora/:id/foto ─────────────────────────────────────────────
// Eliminar foto de bitácora
router.delete('/:id/foto', async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await query('SELECT id, foto_public_id FROM bitacora_diaria WHERE id = $1', [id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Bitácora no encontrada' });

    if (existing.rows[0].foto_public_id) {
      await deleteFromCloudinary(existing.rows[0].foto_public_id);
    }

    await query(
      'UPDATE bitacora_diaria SET foto_url = NULL, foto_public_id = NULL, updated_at = NOW() WHERE id = $1',
      [id]
    );

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── POST /bitacora/panial ─────────────────────────────────────────────────
// Registrar cambio de pañal (Maternal — múltiples por día)
router.post('/panial', async (req, res, next) => {
  try {
    const { alumno_id, condicion, tiene_irritacion, es_diarrea, notas } = req.body;

    const result = await query(`
      INSERT INTO registro_panial (alumno_id, hora, condicion, tiene_irritacion, es_diarrea, notas, registrado_por)
      VALUES ($1, NOW(), $2, $3, $4, $5, $6) RETURNING *
    `, [alumno_id, condicion, tiene_irritacion || false, es_diarrea || false, notas, req.user.id]);

    // Descontar 1 del stock diario de pañales
    try {
      await query(
        `UPDATE insumos_stock_diario
         SET cantidad = GREATEST(cantidad - 1, 0), updated_at = NOW()
         WHERE alumno_id = $1 AND fecha = CURRENT_DATE`,
        [alumno_id]
      );
    } catch (err) {
      console.error('[bitacora] Error al descontar stock de pañales:', err.message);
    }

    // Si es_diarrea === true, notificar al padre
    if (es_diarrea) {
      const padresResult = await query(`
        SELECT a.nombre_completo AS alumno_nombre,
               u.id AS usuario_id
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.id = $1
      `, [alumno_id]);

      for (const { alumno_nombre, usuario_id } of padresResult.rows) {
        if (usuario_id) {
          await query(`
            INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
            VALUES ($1, $2, $3, 'alerta_diarrea', $4)
          `, [
            usuario_id,
            `⚠️ Alerta de salud — ${alumno_nombre}`,
            `Deposición anormal registrada en ${alumno_nombre}.`,
            JSON.stringify({ alumno_id, tipo: 'diarrea' }),
          ]);
          enviarPush(usuario_id, `⚠️ Alerta de salud — ${alumno_nombre}`, `Deposición anormal registrada en ${alumno_nombre}.`, { tipo: 'alerta_diarrea', alumno_id: String(alumno_id) });
        }
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /bitacora/medicamento ────────────────────────────────────────────
// Registrar administración de medicamento
router.post('/medicamento', async (req, res, next) => {
  try {
    const { alumno_id, nombre, dosis, notas } = req.body;

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    const result = await query(`
      INSERT INTO medicamentos (alumno_id, fecha, nombre, dosis, hora_administracion, administrado_por, notas)
      VALUES ($1, CURRENT_DATE, $2, $3, NOW(), $4, $5) RETURNING *
    `, [alumno_id, nombre, dosis, maestraId, notas]);

    // Notificar a padres
    const padreResult = await query(`
      SELECT a.nombre_completo AS alumno_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             p.nombre_completo AS padre_nombre,
             u.id AS usuario_id
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
      JOIN padres p ON ap.padre_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE a.id = $1 LIMIT 1
    `, [alumno_id]);

    if (padreResult.rows.length > 0) {
      const { alumno_nombre, telefono, padre_nombre, usuario_id } = padreResult.rows[0];
      await enviarMensaje({
        telefono,
        clave: 'medicamento',
        variables: {
          nombre_padre: padre_nombre.split(' ')[0],
          nombre_alumno: alumno_nombre,
          medicamento: nombre,
          dosis,
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        },
        alumnoId: alumno_id,
      });
      if (usuario_id) {
        await query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'medicamento', $4)
        `, [
          usuario_id,
          `Medicamento administrado — ${alumno_nombre}`,
          `Se administró ${nombre} (${dosis}) a ${alumno_nombre}.`,
          JSON.stringify({ alumno_id, medicamento: nombre, dosis }),
        ]);
        await query(
          'UPDATE medicamentos SET notificacion_enviada = true WHERE id = $1',
          [result.rows[0].id]
        );
        enviarPush(usuario_id, `Medicamento administrado — ${alumno_nombre}`, `Se administró ${nombre} (${dosis}) a ${alumno_nombre}.`, { tipo: 'medicamento', alumno_id: String(alumno_id) });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /bitacora/medicamento/recepcion ────────────────────────────────────
// Registrar recepción de medicamento (foto en Base64)
router.post('/medicamento/recepcion', async (req, res, next) => {
  try {
    const { alumno_id, nombre, dosis, notas, foto_receta_base64, foto_receta_name, horas } = req.body;

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const recibidoPor = personalResult.rows[0]?.id || null;

    let fotoRecetaUrl = null, fotoRecetaPublicId = null;

    // Convertir Base64 a Buffer para Cloudinary
    if (foto_receta_base64) {
      try {
        const base64Data = foto_receta_base64.split(',')[1] || foto_receta_base64;
        const buffer = Buffer.from(base64Data, 'base64');

        const recetaResult = await uploadToCloudinary(buffer, {
          folder: 'happyschool/medicamentos-recepcion',
          resource_type: 'image',
          public_id: `receta_${Date.now()}`
        });
        fotoRecetaUrl = recetaResult.url;
        fotoRecetaPublicId = recetaResult.public_id;
      } catch (uploadErr) {
        // En desarrollo, si Cloudinary falla, continuar sin foto
        console.warn('[medicamento] Advertencia al subir foto:', uploadErr.message);
        if (process.env.NODE_ENV === 'production') {
          return res.status(400).json({ error: 'Error al subir la foto' });
        }
        // En desarrollo, usar data URL del Base64 como fallback
        fotoRecetaUrl = foto_receta_base64;
        fotoRecetaPublicId = `local_${Date.now()}`;
      }
    }

    const result = await query(`
      INSERT INTO recepcion_medicamento
        (alumno_id, fecha, nombre, dosis, foto_receta_url, foto_receta_public_id, recibido_por, notas)
      VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [alumno_id, nombre, dosis, fotoRecetaUrl, fotoRecetaPublicId, recibidoPor, notas]);

    const recepcionId = result.rows[0].id;

    // Insertar tomas si vienen horas
    let horasArray = [];
    if (horas) {
      horasArray = Array.isArray(horas) ? horas : JSON.parse(horas || '[]');
    }

    if (horasArray && horasArray.length > 0) {
      for (const h of horasArray.filter(h => h)) {
        await query(
          'INSERT INTO toma_medicamento (recepcion_id, hora_programada) VALUES ($1, $2::time)',
          [recepcionId, h]
        );
      }
    }

    // Devolver recepción con tomas
    const fullResult = await query(`
      SELECT rm.*,
             COALESCE(
               json_agg(
                 json_build_object(
                   'id', t.id,
                   'hora_programada', t.hora_programada::text,
                   'administrado', t.administrado,
                   'administrado_at', t.administrado_at
                 ) ORDER BY t.hora_programada
               ) FILTER (WHERE t.id IS NOT NULL),
               '[]'
             ) AS tomas
      FROM recepcion_medicamento rm
      LEFT JOIN toma_medicamento t ON t.recepcion_id = rm.id
      WHERE rm.id = $1
      GROUP BY rm.id
    `, [recepcionId]);

    res.status(201).json(fullResult.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /bitacora/medicamento/pendientes ────────────────────────────────────
// Listar recepciones de medicamento pendientes de administrar
router.get('/medicamento/pendientes', async (req, res, next) => {
  try {
    const { fecha } = req.query;
    const result = await query(`
      SELECT rm.*, a.nombre_completo AS alumno_nombre, g.nombre AS grupo_nombre
      FROM recepcion_medicamento rm
      JOIN alumnos a ON rm.alumno_id = a.id
      LEFT JOIN grupos g ON a.grupo_id = g.id
      WHERE rm.administrado = false AND rm.fecha = COALESCE($1::date, CURRENT_DATE)
      ORDER BY rm.hora_programada, rm.created_at
    `, [fecha]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── DELETE /bitacora/medicamento/recepcion/:recepcionId ──────────────────────
// Padre cancela una recepción declarada (solo si no ha sido recibida aún)
router.delete('/medicamento/recepcion/:recepcionId', async (req, res, next) => {
  try {
    const { recepcionId } = req.params;

    const existing = await query(
      'SELECT id, recibido, administrado FROM recepcion_medicamento WHERE id = $1',
      [recepcionId]
    );
    if (existing.rows.length === 0) return res.status(404).json({ error: 'No encontrado' });
    if (existing.rows[0].recibido || existing.rows[0].administrado) {
      return res.status(400).json({ error: 'No se puede eliminar: ya fue recibido o administrado' });
    }

    await query('DELETE FROM recepcion_medicamento WHERE id = $1', [recepcionId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── PATCH /bitacora/medicamento/recepcion/:recepcionId/recibir ──────────────
// Maestra en Filtro de Entrada confirma que recibió el medicamento físicamente
router.patch('/medicamento/recepcion/:recepcionId/recibir', async (req, res, next) => {
  try {
    const { recepcionId } = req.params;

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1',
      [req.user.id]
    );
    const recibidoPor = personalResult.rows[0]?.id || null;

    const result = await query(`
      UPDATE recepcion_medicamento
      SET recibido = true, recibido_at = NOW(), recibido_por = $2, updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [recepcionId, recibidoPor]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Recepción no encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /bitacora/medicamento/recepcion/:recepcionId/administrar ──────────
// Administrar una toma específica (si toma_id) o toda la recepción (compatibilidad)
router.patch('/medicamento/recepcion/:recepcionId/administrar', async (req, res, next) => {
  try {
    const { recepcionId } = req.params;
    const { toma_id } = req.body || {};

    // Obtener datos de recepción
    const recepcionResult = await query(
      'SELECT * FROM recepcion_medicamento WHERE id = $1',
      [recepcionId]
    );

    if (!recepcionResult.rows.length) {
      return res.status(404).json({ error: 'Recepción no encontrada' });
    }

    const recepcion = recepcionResult.rows[0];
    const { alumno_id, nombre, dosis, notas } = recepcion;

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    // Si viene toma_id, administrar esa toma específica
    if (toma_id) {
      const medicResult = await query(`
        INSERT INTO medicamentos (alumno_id, fecha, nombre, dosis, hora_administracion, administrado_por, notas)
        VALUES ($1, CURRENT_DATE, $2, $3, NOW(), $4, $5) RETURNING *
      `, [alumno_id, nombre, dosis, maestraId, notas]);

      await query(`
        UPDATE toma_medicamento
        SET administrado = true, administrado_at = NOW(), administrado_por = $2, medicamento_id = $3
        WHERE id = $1
      `, [toma_id, maestraId, medicResult.rows[0].id]);

      // Notificar a TODOS los padres vinculados que se administró el medicamento
      const padreResult = await query(`
        SELECT a.nombre_completo AS alumno_nombre,
               COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
               p.nombre_completo AS padre_nombre,
               u.id AS usuario_id
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.id = $1
      `, [alumno_id]);

      for (const padre of padreResult.rows) {
        const { alumno_nombre, telefono, padre_nombre, usuario_id: padreUsuarioId } = padre;
        await enviarMensaje({
          telefono,
          clave: 'medicamento',
          variables: {
            nombre_padre: padre_nombre.split(' ')[0],
            nombre_alumno: alumno_nombre,
            medicamento: nombre,
            dosis,
            hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          },
          alumnoId: alumno_id,
        });
        if (padreUsuarioId) {
          await query(`
            INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
            VALUES ($1, $2, $3, 'medicamento', $4)
          `, [
            padreUsuarioId,
            `Medicamento administrado — ${alumno_nombre}`,
            `Se administró ${nombre} (${dosis}) a ${alumno_nombre}.`,
            JSON.stringify({ alumno_id, medicamento: nombre, dosis }),
          ]);
          enviarPush(padreUsuarioId, `Medicamento administrado — ${alumno_nombre}`, `Se administró ${nombre} (${dosis}) a ${alumno_nombre}.`, { tipo: 'medicamento', alumno_id: String(alumno_id) });
        }
      }

      // Retornar toma actualizada
      const tomaResult = await query(
        'SELECT * FROM toma_medicamento WHERE id = $1',
        [toma_id]
      );
      return res.json(tomaResult.rows[0]);
    }

    // Compatibilidad: si no viene toma_id, marcar recepción completa como administrada
    const medicResult = await query(`
      INSERT INTO medicamentos (alumno_id, fecha, nombre, dosis, hora_administracion, administrado_por, notas)
      VALUES ($1, CURRENT_DATE, $2, $3, NOW(), $4, $5) RETURNING *
    `, [alumno_id, nombre, dosis, maestraId, notas]);

    // Marcar recepción como administrada
    await query(`
      UPDATE recepcion_medicamento
      SET administrado = true, medicamento_id = $1, updated_at = NOW()
      WHERE id = $2
    `, [medicResult.rows[0].id, recepcionId]);

    // Notificar a TODOS los padres vinculados
    const padreResult = await query(`
      SELECT a.nombre_completo AS alumno_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             p.nombre_completo AS padre_nombre,
             u.id AS usuario_id
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id
      JOIN padres p ON ap.padre_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE a.id = $1
    `, [alumno_id]);

    for (const padre of padreResult.rows) {
      const { alumno_nombre, telefono, padre_nombre, usuario_id } = padre;
      await enviarMensaje({
        telefono,
        clave: 'medicamento',
        variables: {
          nombre_padre: padre_nombre.split(' ')[0],
          nombre_alumno: alumno_nombre,
          medicamento: nombre,
          dosis,
          hora: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
        },
        alumnoId: alumno_id,
      });
      if (usuario_id) {
        await query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'medicamento', $4)
        `, [
          usuario_id,
          `Medicamento administrado — ${alumno_nombre}`,
          `Se administró ${nombre} (${dosis}) a ${alumno_nombre}.`,
          JSON.stringify({ alumno_id, medicamento: nombre, dosis }),
        ]);
        enviarPush(usuario_id, `Medicamento administrado — ${alumno_nombre}`, `Se administró ${nombre} (${dosis}) a ${alumno_nombre}.`, { tipo: 'medicamento', alumno_id: String(alumno_id) });
      }
    }
    await query(
      'UPDATE medicamentos SET notificacion_enviada = true WHERE id = $1',
      [medicResult.rows[0].id]
    );

    res.json({ medicamento: medicResult.rows[0], recepcion: recepcionResult.rows[0] });
  } catch (err) { next(err); }
});

// ── POST /bitacora/incidente ──────────────────────────────────────────────
// Registrar incidente/accidente (Miss sube descripción + fotos opcionales)
router.post('/incidente', async (req, res, next) => {
  try {
    const { alumno_id, descripcion, acciones_tomadas } = req.body;

    if (!alumno_id) {
      return res.status(400).json({ error: 'alumno_id es requerido' });
    }

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    const result = await query(`
      INSERT INTO incidentes (alumno_id, descripcion, acciones_tomadas, fotos_urls, reportado_por)
      VALUES ($1, $2, $3, NULL, $4) RETURNING *
    `, [alumno_id, descripcion, acciones_tomadas, maestraId]);

    // Notificar a todos los padres
    const padresResult = await query(`
      SELECT a.nombre_completo AS alumno_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             p.nombre_completo AS padre_nombre,
             u.id AS usuario_id
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id
      JOIN padres p ON ap.padre_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE a.id = $1
    `, [alumno_id]);

    for (const { alumno_nombre, telefono, padre_nombre, usuario_id } of padresResult.rows) {
      await enviarMensaje({
        telefono,
        clave: 'incidente',
        variables: {
          nombre_padre: padre_nombre.split(' ')[0],
          nombre_alumno: alumno_nombre,
        },
        alumnoId: alumno_id,
      });
      if (usuario_id) {
        await query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'incidente', $4)
        `, [
          usuario_id,
          `Incidente registrado — ${alumno_nombre}`,
          descripcion || `Se registró un incidente de ${alumno_nombre}.`,
          JSON.stringify({ alumno_id, incidente_id: result.rows[0].id }),
        ]);
        enviarPush(usuario_id, `Incidente registrado — ${alumno_nombre}`, descripcion || `Se registró un incidente de ${alumno_nombre}.`, { tipo: 'incidente', alumno_id: String(alumno_id) });
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /bitacora/actividades/fotos ──────────────────────────────────────
// Subir fotos de actividades del día (grupal o individual)
router.post('/actividades/fotos', upload.array('fotos', 10), async (req, res, next) => {
  try {
    const { alumno_id, grupo_id, fecha, descripcion, es_grupal } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    // Subir fotos a Cloudinary
    const uploads = await Promise.all(
      req.files.map(f => uploadToCloudinary(f.buffer, { folder: 'happyschool/actividades' }))
    );

    // Insertar registros en DB
    const fotosInsertadas = await Promise.all(
      uploads.map(upload =>
        query(`
          INSERT INTO actividades_fotos (alumno_id, grupo_id, fecha, foto_url, public_id, descripcion, es_grupal, subido_por)
          VALUES ($1, $2, COALESCE($3::date, CURRENT_DATE), $4, $5, $6, $7, $8)
          RETURNING *
        `, [
          alumno_id || null,
          grupo_id,
          fecha,
          upload.url,
          upload.public_id,
          descripcion || null,
          es_grupal === 'true' || false,
          req.user.id,
        ])
      )
    );

    res.status(201).json({
      ok: true,
      fotos: fotosInsertadas.map(r => r.rows[0]),
    });
  } catch (err) { next(err); }
});

// ── POST /bitacora/actividades/:actividadGrupoId/fotos-alumno ─────────────
// Subir fotos del alumno para una actividad específica
router.post('/actividades/:actividadGrupoId/fotos-alumno', upload.array('fotos', 10), async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No se enviaron fotos' });
    }
    const { actividadGrupoId } = req.params;
    const { alumno_id, grupo_id, fecha } = req.body;

    if (!alumno_id || !grupo_id) {
      return res.status(400).json({ error: 'alumno_id y grupo_id son requeridos' });
    }

    const uploads = await Promise.all(
      req.files.map(f => uploadToCloudinary(f.buffer, { folder: 'happyschool/actividades-alumno', transformation: [{ width: 1200, height: 1200, crop: 'limit' }] }))
    );

    const fotosInsertadas = await Promise.all(
      uploads.map(u =>
        query(`
          INSERT INTO actividades_fotos
            (actividad_grupo_id, alumno_id, grupo_id, fecha, foto_url, public_id, es_grupal, subido_por)
          VALUES ($1, $2, $3, COALESCE($4::date, CURRENT_DATE), $5, $6, false, $7)
          RETURNING id, foto_url, public_id
        `, [actividadGrupoId, alumno_id, grupo_id, fecha || null, u.url, u.public_id, req.user.id])
      )
    );

    res.status(201).json({ ok: true, fotos: fotosInsertadas.map(r => r.rows[0]) });
  } catch (err) { next(err); }
});

// ── DELETE /bitacora/actividades/fotos/:fotoId ────────────────────────────
// Eliminar una foto de actividad del alumno
router.delete('/actividades/fotos/:fotoId', async (req, res, next) => {
  try {
    const { fotoId } = req.params;
    const existing = await query('SELECT id, public_id FROM actividades_fotos WHERE id = $1', [fotoId]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Foto no encontrada' });

    if (existing.rows[0].public_id) {
      await deleteFromCloudinary(existing.rows[0].public_id);
    }
    await query('DELETE FROM actividades_fotos WHERE id = $1', [fotoId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /bitacora/:alumnoId/actividades?fecha=YYYY-MM-DD ─────────────────
// Obtener fotos de actividades de un alumno en una fecha
router.get('/:alumnoId/actividades', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const { fecha } = req.query;

    const result = await query(`
      SELECT * FROM actividades_fotos
      WHERE (alumno_id = $1 OR es_grupal = true)
        AND fecha = COALESCE($2::date, CURRENT_DATE)
      ORDER BY created_at ASC
    `, [alumnoId, fecha]);

    res.json(result.rows || []);
  } catch (err) { next(err); }
});

// ── POST /bitacora/actividades-grupo ──────────────────────────────────────
// Maestra define actividades del día para su grupo (multipart con fotos opcionales)
router.post('/actividades-grupo', upload.array('fotos', 20), authenticate, async (req, res, next) => {
  try {
    const { grupo_id, fecha, actividades } = req.body;
    if (!grupo_id || !actividades) {
      return res.status(400).json({ error: 'grupo_id and actividades are required' });
    }

    const actividadesArray = JSON.parse(actividades);
    const fechaFinal = fecha || new Date().toLocaleDateString('en-CA');

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    // Eliminar actividades viejas del grupo+fecha
    await query(
      'DELETE FROM actividades_grupo WHERE grupo_id = $1 AND fecha = $2',
      [grupo_id, fechaFinal]
    );

    // Subir fotos a Cloudinary y crear actividades
    const actividadesInsertadas = await Promise.all(
      actividadesArray.map(async (act, idx) => {
        let fotoUrl = null;
        let publicId = null;

        if (req.files && req.files[idx]) {
          const upload = await uploadToCloudinary(req.files[idx].buffer, { folder: 'happyschool/actividades-grupo' });
          fotoUrl = upload.url;
          publicId = upload.public_id;
        }

        return query(`
          INSERT INTO actividades_grupo (grupo_id, fecha, orden, descripcion, foto_url, public_id, creado_por)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id, descripcion, foto_url, orden
        `, [grupo_id, fechaFinal, act.orden || idx + 1, act.descripcion, fotoUrl, publicId, maestraId]);
      })
    );

    res.status(201).json({
      ok: true,
      actividades: actividadesInsertadas.map(r => r.rows[0]),
    });
  } catch (err) { next(err); }
});

// ── POST /bitacora/actividades-alumno ─────────────────────────────────────
// Guardar participación del alumno en actividades del grupo
router.post('/actividades-alumno', async (req, res, next) => {
  try {
    const { alumno_id, bitacora_id, actividades, fecha } = req.body;
    if (!alumno_id || !actividades) {
      return res.status(400).json({ error: 'alumno_id and actividades are required' });
    }

    const actividadesArray = Array.isArray(actividades) ? actividades : JSON.parse(actividades);

    let finalBitacoraId = bitacora_id;

    // Si no hay bitacora_id, crear una bitácora vacía (para que exista el registro)
    if (!finalBitacoraId) {
      const fechaFinal = fecha || new Date().toLocaleDateString('en-CA');
      const personalResult = await query('SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]);
      const maestraId = personalResult.rows[0]?.id || null;

      const bitacoraResult = await query(`
        INSERT INTO bitacora_diaria (alumno_id, fecha, maestra_id)
        VALUES ($1, $2, $3)
        ON CONFLICT (alumno_id, fecha) DO UPDATE SET updated_at = NOW()
        RETURNING id
      `, [alumno_id, fechaFinal, maestraId]);

      finalBitacoraId = bitacoraResult.rows[0].id;
    }

    // Eliminar registros viejos para esta bitácora+alumno
    await query(
      `DELETE FROM actividades_alumno
       WHERE bitacora_id = $1 AND alumno_id = $2`,
      [finalBitacoraId, alumno_id]
    );

    // Insertar nuevos registros
    const insertados = await Promise.all(
      actividadesArray
        .filter(a => a.actividad_grupo_id && a.participo !== undefined)
        .map(a =>
          query(`
            INSERT INTO actividades_alumno (actividad_grupo_id, bitacora_id, alumno_id, participo)
            VALUES ($1, $2, $3, $4)
            RETURNING *
          `, [a.actividad_grupo_id, finalBitacoraId, alumno_id, a.participo])
        )
    );

    res.status(201).json({
      ok: true,
      bitacora_id: finalBitacoraId,
      registros: insertados.map(r => r.rows[0]),
    });
  } catch (err) { next(err); }
});

// ── PATCH /bitacora/incidente/:incidenteId/firma ────────────────────────
// Padre firma un incidente para confirmar enterado
router.patch('/incidente/:incidenteId/firma', upload.single('firma'), async (req, res, next) => {
  try {
    const { incidenteId } = req.params;

    let firmaData = null;
    if (req.file) {
      firmaData = req.file.buffer.toString('base64');
      firmaData = `data:image/png;base64,${firmaData}`;
    } else if (req.body.firma_data) {
      firmaData = req.body.firma_data;
    }

    if (!firmaData) {
      return res.status(400).json({ error: 'No signature provided' });
    }

    const result = await query(`
      UPDATE incidentes
      SET firma_padre_url = $1, firma_fecha = NOW(), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [firmaData, incidenteId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

module.exports = router;
