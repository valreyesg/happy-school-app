const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// GET / — últimas 20 notificaciones del usuario autenticado
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, titulo, cuerpo, tipo, datos_extra, leida, created_at
      FROM notificaciones
      WHERE usuario_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /no-leidas — count de notificaciones no leídas
router.get('/no-leidas', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) AS count FROM notificaciones WHERE usuario_id = $1 AND leida = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { next(err); }
});

// PUT /leer-todas — marcar todas como leídas
router.put('/leer-todas', async (req, res, next) => {
  try {
    await query(
      'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUT /:id/leer — marcar una como leída
router.put('/:id/leer', async (req, res, next) => {
  try {
    await query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /aviso-extraordinario — Directora envía aviso a padres de grupos seleccionados
router.post('/aviso-extraordinario', authorize('directora'), async (req, res, next) => {
  try {
    const { titulo, cuerpo, grupo_ids } = req.body;

    if (!titulo || !cuerpo) {
      return res.status(400).json({ error: 'titulo y cuerpo son requeridos' });
    }

    // Insertar en tabla avisos primero (para tener persistencia del historial)
    // Nota: grupo_ids se guarda en datos_extra de notificaciones por ahora
    const avisoResult = await query(`
      INSERT INTO avisos (titulo, contenido, creado_por, publicado)
      VALUES ($1, $2, $3, true)
      RETURNING id
    `, [titulo, cuerpo, req.user.id]);

    const aviso_id = avisoResult.rows[0].id;

    let padresResult;
    if (!grupo_ids || grupo_ids.length === 0) {
      padresResult = await query(`
        SELECT DISTINCT u.id AS usuario_id, p.nombre_completo AS padre_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.deleted_at IS NULL
      `);
    } else {
      padresResult = await query(`
        SELECT DISTINCT u.id AS usuario_id, p.nombre_completo AS padre_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.grupo_id = ANY($1::uuid[]) AND a.deleted_at IS NULL
      `, [grupo_ids]);
    }

    if (padresResult.rows.length === 0) {
      return res.json({ ok: true, enviadas: 0, aviso_id });
    }

    const datos = JSON.stringify({ aviso_id, grupo_ids: grupo_ids || [], origen: 'directora' });
    await Promise.all(
      padresResult.rows.map(({ usuario_id }) =>
        query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'aviso_extraordinario', $4)
        `, [usuario_id, titulo, cuerpo, datos])
      )
    );

    res.json({ ok: true, enviadas: padresResult.rows.length, aviso_id });
  } catch (err) { next(err); }
});

// GET /aviso-extraordinario/estado/:avisoId — Estado de lectura de un aviso
router.get('/aviso-extraordinario/estado/:avisoId', authorize('directora'), async (req, res, next) => {
  try {
    const { avisoId } = req.params;

    // Buscar todas las notificaciones del aviso específico filtrando por aviso_id en datos_extra
    const result = await query(`
      SELECT
        n.id,
        n.leida,
        n.created_at AS enviado_at,
        p.nombre_completo AS padre_nombre,
        a.nombre_completo AS alumno_nombre,
        g.nombre AS grupo_nombre
      FROM notificaciones n
      JOIN usuarios u ON n.usuario_id = u.id
      JOIN padres p ON p.usuario_id = u.id
      JOIN alumno_padre ap ON ap.padre_id = p.id AND ap.es_tutor_principal = true
      JOIN alumnos a ON ap.alumno_id = a.id AND a.deleted_at IS NULL
      JOIN grupos g ON a.grupo_id = g.id
      WHERE n.tipo = 'aviso_extraordinario' AND n.datos_extra->>'aviso_id' = $1
      ORDER BY n.leida ASC, p.nombre_completo ASC
    `, [avisoId]);

    const total = result.rows.length;
    const leidas = result.rows.filter(r => r.leida).length;

    res.json({
      total,
      leidas,
      pendientes: total - leidas,
      detalle: result.rows,
    });
  } catch (err) { next(err); }
});

// GET /avisos-extraordinarios — Historial de avisos extraordinarios enviados
router.get('/avisos-extraordinarios', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, titulo, created_at
      FROM avisos
      WHERE contenido IS NOT NULL AND publicado = true
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

module.exports = router;
