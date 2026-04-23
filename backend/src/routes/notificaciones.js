const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
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

module.exports = router;
