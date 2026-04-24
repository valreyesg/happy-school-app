const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarMensaje } = require('../services/whatsappService');
const { uploadToCloudinary } = require('../services/cloudinaryService');

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

// ── GET /bitacora/:alumnoId?fecha=YYYY-MM-DD ──────────────────────────────
// Obtener bitácora completa de un alumno en una fecha (default: hoy)
router.get('/:alumnoId', async (req, res, next) => {
  try {
    const { alumnoId } = req.params;
    const fecha = req.query.fecha || null; // null → CURRENT_DATE (hora local PostgreSQL)

    const [fechaRow, bitacora, banio, comida, panial, esfinteres, medicamentos, incidentes, actividades] = await Promise.all([

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
        SELECT ag.id, ag.descripcion, ag.foto_url, ag.orden, aa.participo
        FROM actividades_grupo ag
        LEFT JOIN actividades_alumno aa ON aa.actividad_grupo_id = ag.id AND aa.alumno_id = $1
        WHERE ag.grupo_id = (SELECT grupo_id FROM alumnos WHERE id = $1)
          AND ag.fecha = COALESCE($2::date, CURRENT_DATE)
        ORDER BY ag.orden
      `, [alumnoId, fecha]),
    ]);

    res.json({
      fecha: fechaRow.rows[0].f,
      alumno_id: alumnoId,
      bitacora:    bitacora.rows[0]    || null,
      banio:       banio.rows[0]       || null,
      comida:      comida.rows         || [],
      panial:      panial.rows        || [],
      esfinteres:  esfinteres.rows[0]  || null,
      medicamentos: medicamentos.rows  || [],
      incidentes:   incidentes.rows    || [],
      actividades:  actividades.rows   || [],
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
          clave: 'bitacora_lista',
          variables: {
            nombre_padre: padre_nombre.split(' ')[0],
            nombre_alumno: alumno_nombre,
          },
          alumnoId: alumno_id,
        });
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
        }
      }
    }

    res.json({ ok: true, bitacora_id: bitacoraId });
  } catch (err) { next(err); }
});

// ── POST /bitacora/panial ─────────────────────────────────────────────────
// Registrar cambio de pañal (Maternal — múltiples por día)
router.post('/panial', async (req, res, next) => {
  try {
    const { alumno_id, condicion, tiene_irritacion, notas } = req.body;

    const result = await query(`
      INSERT INTO registro_panial (alumno_id, hora, condicion, tiene_irritacion, notas, registrado_por)
      VALUES ($1, NOW(), $2, $3, $4, $5) RETURNING *
    `, [alumno_id, condicion, tiene_irritacion || false, notas, req.user.id]);

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
      }
    }

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /bitacora/incidente ──────────────────────────────────────────────
// Registrar incidente/accidente (Miss sube descripción + fotos opcionales)
router.post('/incidente', upload.array('fotos', 5), async (req, res, next) => {
  try {
    const { alumno_id, descripcion, acciones_tomadas } = req.body;

    const personalResult = await query(
      'SELECT id FROM personal WHERE usuario_id = $1', [req.user.id]
    );
    const maestraId = personalResult.rows[0]?.id || null;

    // Subir fotos a Cloudinary si las hay
    let fotosUrls = [];
    if (req.files && req.files.length > 0) {
      const uploads = await Promise.all(
        req.files.map(f => uploadToCloudinary(f.buffer, { folder: 'happyschool/incidentes' }))
      );
      fotosUrls = uploads.map(u => u.url);
    }

    const result = await query(`
      INSERT INTO incidentes (alumno_id, descripcion, acciones_tomadas, fotos_urls, reportado_por)
      VALUES ($1, $2, $3, $4, $5) RETURNING *
    `, [alumno_id, descripcion, acciones_tomadas, fotosUrls, maestraId]);

    // Notificar al padre
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
