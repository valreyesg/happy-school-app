const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const { enviarMensaje } = require('../services/whatsappService');

router.use(authenticate);

// ── Helper: obtener configuracion de notificaciones (tipos habilitados)
async function getNotificacionesConfig() {
  try {
    const result = await query(`
      SELECT valor FROM configuracion_general WHERE clave = 'notificaciones_modal_tipos'
    `);
    if (result.rows.length > 0) {
      return JSON.parse(result.rows[0].valor || '[]');
    }
  } catch (err) {
    console.error('Error fetching notificaciones config:', err);
  }
  return [];
}

// ── Helper: es dia hábil
function esDiaHabil(fecha) {
  const d = new Date(fecha);
  const day = d.getDay();
  return day !== 0 && day !== 6;
}

// ── Helper: proximo dia hábil
function proximoDiaHabil(fecha = new Date()) {
  const d = new Date(fecha);
  d.setDate(d.getDate() + 1);
  while (!esDiaHabil(d)) {
    d.setDate(d.getDate() + 1);
  }
  return d.toISOString().substring(0, 10);
}

// ════════════════════════════════════════════════════════════════════════════
// RUTAS ESTÁTICAS (ANTES que las dinámicas)
// ════════════════════════════════════════════════════════════════════════════

// ── GET /tareas/hoy-pendientes — tareas cuya fecha_limite = fecha (hoy por defecto)
router.get('/hoy-pendientes', async (req, res, next) => {
  try {
    const { grupo_id, fecha } = req.query;
    if (!grupo_id) {
      return res.status(400).json({ error: 'grupo_id is required' });
    }

    const fechaQuery = fecha || new Date().toISOString().substring(0, 10);

    const result = await query(`
      SELECT t.id, t.titulo
      FROM tareas t
      WHERE t.grupo_id = $1
        AND t.publicada = true
        AND t.fecha_limite = $2
      ORDER BY t.created_at DESC
    `, [grupo_id, fechaQuery]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /tareas/reciente — tarea más reciente publicada del grupo (Papá)
router.get('/reciente', async (req, res, next) => {
  try {
    const { alumno_id } = req.query;
    if (!alumno_id) {
      return res.status(400).json({ error: 'alumno_id is required' });
    }

    // Obtener grupo del alumno
    const alumnoResult = await query(`
      SELECT grupo_id FROM alumnos WHERE id = $1
    `, [alumno_id]);

    if (alumnoResult.rows.length === 0) {
      return res.status(404).json({ error: 'alumno not found' });
    }

    const grupo_id = alumnoResult.rows[0].grupo_id;

    // Obtener tarea más reciente publicada del grupo
    const result = await query(`
      SELECT t.id, t.titulo, t.descripcion, t.fecha_limite, t.foto_url, t.created_at,
             ta.completada, ta.fecha_completada
      FROM tareas t
      LEFT JOIN tarea_alumno ta ON t.id = ta.tarea_id AND ta.alumno_id = $1
      WHERE t.grupo_id = $2 AND t.publicada = true
      ORDER BY t.fecha_limite DESC LIMIT 1
    `, [alumno_id, grupo_id]);

    if (result.rows.length === 0) {
      return res.json(null);
    }

    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /tareas/alerta-acumulado — alumnos con ≥3 tareas sin entregar en el mes
router.get('/alerta-acumulado', async (req, res, next) => {
  try {
    const { grupo_id } = req.query;
    if (!grupo_id) {
      return res.status(400).json({ error: 'grupo_id is required' });
    }

    const result = await query(`
      SELECT a.id, a.nombre_completo, COUNT(*) AS tareas_sin_entregar
      FROM tarea_alumno ta
      JOIN tareas t ON ta.tarea_id = t.id
      JOIN alumnos a ON ta.alumno_id = a.id
      WHERE t.grupo_id = $1
        AND t.publicada = true
        AND ta.completada = false
        AND ta.registrado_en_bitacora = true
        AND t.fecha_limite >= date_trunc('month', CURRENT_DATE)
        AND t.fecha_limite < date_trunc('month', CURRENT_DATE) + interval '1 month'
      GROUP BY a.id, a.nombre_completo
      HAVING COUNT(*) >= 3
      ORDER BY tareas_sin_entregar DESC
    `, [grupo_id]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /tareas/alumnos-alerta — alumnos EN ALERTA (por alumno_id o para todos)
router.get('/alumnos-alerta', async (req, res, next) => {
  try {
    const { alumno_id, grupo_id } = req.query;

    let sql = `
      SELECT a.id, a.nombre_completo, COUNT(*) AS tareas_sin_entregar
      FROM tarea_alumno ta
      JOIN tareas t ON ta.tarea_id = t.id
      JOIN alumnos a ON ta.alumno_id = a.id
      WHERE t.publicada = true
        AND ta.completada = false
        AND ta.registrado_en_bitacora = true
        AND t.fecha_limite >= date_trunc('month', CURRENT_DATE)
        AND t.fecha_limite < date_trunc('month', CURRENT_DATE) + interval '1 month'
    `;

    const params = [];

    if (alumno_id) {
      sql += ` AND a.id = $${params.length + 1}`;
      params.push(alumno_id);
    }

    if (grupo_id) {
      sql += ` AND t.grupo_id = $${params.length + 1}`;
      params.push(grupo_id);
    }

    sql += ` GROUP BY a.id, a.nombre_completo HAVING COUNT(*) >= 3`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /tareas/pendientes-alumno — conteo de tareas publicadas no entregadas (Papá)
router.get('/pendientes-alumno', async (req, res, next) => {
  try {
    const { alumno_id } = req.query;
    if (!alumno_id) return res.status(400).json({ error: 'alumno_id is required' });

    // Verificar que el alumno pertenece al padre en sesión
    const authCheck = await query(`
      SELECT a.id
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id
      JOIN padres p ON ap.padre_id = p.id
      WHERE a.id = $1 AND p.usuario_id = $2 AND a.deleted_at IS NULL
    `, [alumno_id, req.user.id]);

    if (authCheck.rows.length === 0) return res.status(403).json({ error: 'unauthorized' });

    const alumnoResult = await query(`SELECT grupo_id FROM alumnos WHERE id = $1`, [alumno_id]);
    const grupo_id = alumnoResult.rows[0].grupo_id;

    const result = await query(`
      SELECT COUNT(*) AS pendientes
      FROM tareas t
      LEFT JOIN tarea_alumno ta ON t.id = ta.tarea_id AND ta.alumno_id = $1
      WHERE t.grupo_id = $2
        AND t.publicada = true
        AND (ta.completada IS NULL OR ta.completada = false)
    `, [alumno_id, grupo_id]);

    res.json({ pendientes: parseInt(result.rows[0].pendientes) });
  } catch (err) { next(err); }
});

// ════════════════════════════════════════════════════════════════════════════
// RUTAS DINÁMICAS (DESPUÉS de las estáticas)
// ════════════════════════════════════════════════════════════════════════════

// ── GET /tareas?grupo_id= — lista tareas del grupo
router.get('/', async (req, res, next) => {
  try {
    const { grupo_id } = req.query;
    if (!grupo_id) {
      return res.status(400).json({ error: 'grupo_id is required' });
    }

    const result = await query(`
      SELECT t.*, u.nombre AS creada_por_nombre
      FROM tareas t
      LEFT JOIN usuarios u ON t.creada_por = u.id
      WHERE t.grupo_id = $1
      ORDER BY t.created_at DESC
    `, [grupo_id]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /tareas — crear tarea (Miss)
router.post('/', authorize('maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { titulo, descripcion, fecha_limite, grupo_id } = req.body;
    const usuario_id = req.user.id;

    if (!titulo || !grupo_id) {
      return res.status(400).json({ error: 'titulo and grupo_id are required' });
    }

    // Obtener personal_id desde usuario_id
    const personalResult = await query(`
      SELECT id FROM personal WHERE usuario_id = $1
    `, [usuario_id]);

    if (personalResult.rows.length === 0) {
      return res.status(403).json({ error: 'personal record not found' });
    }

    const personal_id = personalResult.rows[0].id;

    // Validar que el usuario sea maestra titular del grupo
    const grupoResult = await query(`
      SELECT g.id FROM grupos g
      JOIN asignaciones_grupo ag ON g.id = ag.grupo_id
      WHERE g.id = $1 AND ag.personal_id = $2 AND ag.es_titular = true
    `, [grupo_id, personal_id]);

    if (grupoResult.rows.length === 0) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    let foto_url = null;
    const fotoFile = req.files?.find(f => f.fieldname === 'foto');
    if (fotoFile) {
      foto_url = await uploadToCloudinary(fotoFile.buffer, { folder: 'tareas' });
    }

    const fecha = fecha_limite || proximoDiaHabil();

    const result = await query(`
      INSERT INTO tareas (titulo, descripcion, fecha_limite, foto_url, creada_por, grupo_id, publicada)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      RETURNING *
    `, [titulo, descripcion || null, fecha, foto_url, usuario_id, grupo_id]);

    res.json({ ok: true, id: result.rows[0].id, tarea: result.rows[0] });
  } catch (err) {
    console.error('ERROR POST /tareas:', err.message);
    next(err);
  }
});

// ── PUT /tareas/:id — editar tarea (solo si no está publicada)
router.put('/:id', authorize('maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { titulo, descripcion, fecha_limite } = req.body;
    const usuario_id = req.user.id;

    // Obtener tarea
    const tareaResult = await query(`
      SELECT * FROM tareas WHERE id = $1
    `, [id]);

    if (tareaResult.rows.length === 0) {
      return res.status(404).json({ error: 'tarea not found' });
    }

    const tarea = tareaResult.rows[0];

    // No permitir editar si ya está publicada
    if (tarea.publicada) {
      return res.status(403).json({ error: 'cannot edit published task' });
    }

    // Obtener personal_id
    const personalResult = await query(`
      SELECT id FROM personal WHERE usuario_id = $1
    `, [usuario_id]);

    if (personalResult.rows.length === 0) {
      return res.status(403).json({ error: 'personal record not found' });
    }

    const personal_id = personalResult.rows[0].id;

    // Validar que es titular del grupo
    const grupoResult = await query(`
      SELECT g.id FROM grupos g
      JOIN asignaciones_grupo ag ON g.id = ag.grupo_id
      WHERE g.id = $1 AND ag.personal_id = $2 AND ag.es_titular = true
    `, [tarea.grupo_id, personal_id]);

    if (grupoResult.rows.length === 0) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    // Subir foto si viene
    let foto_url = null;
    const fotoFile = req.files?.find(f => f.fieldname === 'foto');
    if (fotoFile) {
      foto_url = await uploadToCloudinary(fotoFile.buffer, { folder: 'tareas' });
    }

    // Actualizar
    const result = await query(`
      UPDATE tareas
      SET titulo = COALESCE($1, titulo),
          descripcion = COALESCE($2, descripcion),
          fecha_limite = COALESCE($3, fecha_limite),
          foto_url = COALESCE($4, foto_url),
          updated_at = NOW()
      WHERE id = $5
      RETURNING *
    `, [titulo || null, descripcion || null, fecha_limite || null, foto_url, id]);

    res.json({ ok: true, tarea: result.rows[0] });
  } catch (err) { next(err); }
});

// ── DELETE /tareas/:id — borrar tarea (publicada o no); notifica papás si estaba publicada
router.delete('/:id', authorize('maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    const tareaResult = await query(`
      SELECT * FROM tareas WHERE id = $1
    `, [id]);

    if (tareaResult.rows.length === 0) {
      return res.status(404).json({ error: 'tarea not found' });
    }

    const tarea = tareaResult.rows[0];

    const personalResult = await query(`
      SELECT id FROM personal WHERE usuario_id = $1
    `, [usuario_id]);

    if (personalResult.rows.length === 0) {
      return res.status(403).json({ error: 'personal record not found' });
    }

    const personal_id = personalResult.rows[0].id;

    const grupoResult = await query(`
      SELECT g.id FROM grupos g
      JOIN asignaciones_grupo ag ON g.id = ag.grupo_id
      WHERE g.id = $1 AND ag.personal_id = $2 AND ag.es_titular = true
    `, [tarea.grupo_id, personal_id]);

    if (grupoResult.rows.length === 0) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    // Si estaba publicada: notificar papás que fue cancelada
    if (tarea.publicada) {
      const padresResult = await query(`
        SELECT DISTINCT u.id, u.telefono, a.nombre_completo AS alumno_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        JOIN grupos g ON a.grupo_id = g.id
        WHERE g.id = $1 AND a.deleted_at IS NULL
      `, [tarea.grupo_id]);

      for (const padre of padresResult.rows) {
        await query(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, datos_extra)
          VALUES ($1, 'tarea_nueva', $2, $3, $4)
        `, [padre.id, `Tarea cancelada: ${tarea.titulo}`, `La tarea "${tarea.titulo}" fue eliminada por la maestra.`, JSON.stringify({ alumno_nombre: padre.alumno_nombre })]);

        if (padre.telefono) {
          const msg = `🚫 La tarea *${tarea.titulo}* de ${padre.alumno_nombre} fue cancelada por la maestra.`;
          await enviarMensaje(padre.telefono, msg).catch(() => {});
        }
      }
    }

    // Limpiar datos relacionados antes de eliminar
    await query(`DELETE FROM tarea_alumno WHERE tarea_id = $1`, [id]);
    await query(`DELETE FROM notificaciones WHERE tipo = 'tarea_nueva' AND datos_extra->>'tarea_id' = $1`, [id]);
    await query(`DELETE FROM tareas WHERE id = $1`, [id]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── PUT /tareas/:id/publicar — publicar tarea y notificar padres
router.put('/:id/publicar', authorize('maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const usuario_id = req.user.id;

    // Obtener tarea y validar que pertenece al usuario
    const tareaResult = await query(`
      SELECT t.*, g.id AS grupo_id FROM tareas t
      JOIN grupos g ON t.grupo_id = g.id
      WHERE t.id = $1
    `, [id]);

    if (tareaResult.rows.length === 0) {
      return res.status(404).json({ error: 'tarea not found' });
    }

    const tarea = tareaResult.rows[0];

    // Obtener personal_id desde usuario_id
    const personalResult = await query(`
      SELECT id FROM personal WHERE usuario_id = $1
    `, [usuario_id]);

    if (personalResult.rows.length === 0) {
      return res.status(403).json({ error: 'personal record not found' });
    }

    const personal_id = personalResult.rows[0].id;

    const grupoResult = await query(`
      SELECT g.id FROM grupos g
      JOIN asignaciones_grupo ag ON g.id = ag.grupo_id
      WHERE g.id = $1 AND ag.personal_id = $2 AND ag.es_titular = true
    `, [tarea.grupo_id, personal_id]);

    if (grupoResult.rows.length === 0) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    // Actualizar estado a publicado
    await query(`UPDATE tareas SET publicada = true WHERE id = $1`, [id]);

    // Obtener padres del grupo
    const padresResult = await query(`
      SELECT DISTINCT u.id, u.email, u.telefono, a.nombre_completo AS alumno_nombre
      FROM alumnos a
      JOIN alumno_padre ap ON ap.alumno_id = a.id
      JOIN padres p ON ap.padre_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      JOIN grupos g ON a.grupo_id = g.id
      WHERE g.id = $1 AND a.deleted_at IS NULL
    `, [tarea.grupo_id]);

    // Verificar si tipo 'tarea_nueva' está habilitado en notificaciones
    const tiposActivos = await getNotificacionesConfig();
    const notificacionesHabilitadas = tiposActivos.includes('tarea_nueva');

    if (notificacionesHabilitadas) {
      // Insertar notificaciones para cada padre
      for (const padre of padresResult.rows) {
        await query(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, cuerpo, datos_extra)
          VALUES ($1, 'tarea_nueva', $2, $3, $4)
        `, [padre.id, `Tarea nueva: ${tarea.titulo}`, tarea.descripcion || tarea.titulo, JSON.stringify({ tarea_id: id, alumno_nombre: padre.alumno_nombre })]);

        // Enviar WhatsApp notificacion
        if (padre.telefono) {
          const msg = `📚 ${padre.alumno_nombre}, tienes una nueva tarea: *${tarea.titulo}* (Entrega: ${tarea.fecha_limite})`;
          await enviarMensaje(padre.telefono, msg).catch(() => {});
        }
      }
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── GET /tareas/:id/alumnos — lista alumnos con estado entrega
router.get('/:id/alumnos', authorize('maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT a.id, a.nombre_completo, ta.completada, ta.fecha_completada
      FROM alumnos a
      LEFT JOIN tarea_alumno ta ON a.id = ta.alumno_id AND ta.tarea_id = $1
      WHERE a.grupo_id = (SELECT grupo_id FROM tareas WHERE id = $1)
      ORDER BY a.nombre_completo ASC
    `, [id]);

    // Contar entregadas vs total
    const entregadas = result.rows.filter(r => r.completada === true).length;

    res.json({
      alumnos: result.rows,
      entregadas,
      total: result.rows.length
    });
  } catch (err) { next(err); }
});

// ── GET /tareas/:id/entregas — conteo detallado
router.get('/:id/entregas', authorize('maestra_titular', 'maestra_especial'), async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validar que la tarea pertenece a un grupo de la maestra
    const tareaResult = await query(`
      SELECT grupo_id FROM tareas WHERE id = $1
    `, [id]);

    if (tareaResult.rows.length === 0) {
      return res.status(404).json({ error: 'tarea not found' });
    }

    const grupo_id = tareaResult.rows[0].grupo_id;

    // Obtener personal_id desde usuario_id
    const personalResult = await query(`
      SELECT id FROM personal WHERE usuario_id = $1
    `, [req.user.id]);

    if (personalResult.rows.length === 0) {
      return res.status(403).json({ error: 'personal record not found' });
    }

    const personal_id = personalResult.rows[0].id;

    // Verificar permisos
    const grupoResult = await query(`
      SELECT g.id FROM grupos g
      JOIN asignaciones_grupo ag ON g.id = ag.grupo_id
      WHERE g.id = $1 AND ag.personal_id = $2 AND ag.es_titular = true
    `, [grupo_id, personal_id]);

    if (grupoResult.rows.length === 0) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    // Contar entregas
    const result = await query(`
      SELECT
        COUNT(DISTINCT ta.alumno_id) FILTER (WHERE ta.completada = true) AS entregadas,
        COUNT(DISTINCT ta.alumno_id) FILTER (WHERE ta.completada = false) AS no_entregadas,
        COUNT(DISTINCT a.id) AS total
      FROM alumnos a
      LEFT JOIN tarea_alumno ta ON a.id = ta.alumno_id AND ta.tarea_id = $1
      WHERE a.grupo_id = $2
    `, [id, grupo_id]);

    const stats = result.rows[0];
    res.json({
      entregadas: stats.entregadas || 0,
      no_entregadas: stats.no_entregadas || 0,
      total: stats.total || 0
    });
  } catch (err) { next(err); }
});

// ── PUT /tareas/:id/alumnos/:alumnoId — registrar entrega SI/NO
router.put('/:id/alumnos/:alumnoId', async (req, res, next) => {
  try {
    const { id, alumnoId } = req.params;
    const { completada, registrado_en_bitacora } = req.body;
    const usuario_id = req.user.id;

    // Validar que el usuario sea maestra del grupo de la tarea
    const tareaResult = await query(`
      SELECT grupo_id FROM tareas WHERE id = $1
    `, [id]);

    if (tareaResult.rows.length === 0) {
      return res.status(404).json({ error: 'tarea not found' });
    }

    // Obtener personal_id desde usuario_id
    const personalResult = await query(`
      SELECT id FROM personal WHERE usuario_id = $1
    `, [usuario_id]);

    if (personalResult.rows.length === 0) {
      return res.status(403).json({ error: 'personal record not found' });
    }

    const personal_id = personalResult.rows[0].id;

    const grupoResult = await query(`
      SELECT g.id FROM grupos g
      JOIN asignaciones_grupo ag ON g.id = ag.grupo_id
      WHERE g.id = $1 AND ag.personal_id = $2 AND ag.es_titular = true
    `, [tareaResult.rows[0].grupo_id, personal_id]);

    if (grupoResult.rows.length === 0) {
      return res.status(403).json({ error: 'unauthorized' });
    }

    // Upsert en tarea_alumno
    const result = await query(`
      INSERT INTO tarea_alumno (tarea_id, alumno_id, completada, registrado_en_bitacora, fecha_completada)
      VALUES ($1, $2, $3, $4, CASE WHEN $3 THEN NOW() ELSE NULL END)
      ON CONFLICT (tarea_id, alumno_id) DO UPDATE
      SET completada = $3, registrado_en_bitacora = $4, fecha_completada = CASE WHEN $3 THEN NOW() ELSE NULL END
      RETURNING *
    `, [id, alumnoId, completada, registrado_en_bitacora || false]);

    res.json({ ok: true, data: result.rows[0] });
  } catch (err) { next(err); }
});

module.exports = router;
