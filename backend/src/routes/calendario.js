const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// ── GET /calendario/categorias ────────────────────────────────────────────────
router.get('/categorias', async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM categorias_evento WHERE activo = true ORDER BY nombre');
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── POST /calendario/categorias ───────────────────────────────────────────────
router.post('/categorias', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, color_hex, icono } = req.body;
    if (!nombre) return res.status(400).json({ error: 'nombre es obligatorio' });
    const result = await query(
      'INSERT INTO categorias_evento (nombre, color_hex, icono) VALUES ($1,$2,$3) RETURNING *',
      [nombre, color_hex || '#805AD5', icono || '📅']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── GET /calendario ───────────────────────────────────────────────────────────
// ?mes=YYYY-MM  |  ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD  |  ?grupo_id=uuid
router.get('/', async (req, res, next) => {
  try {
    const { mes, desde, hasta, grupo_id } = req.query;

    let fechaDesde, fechaHasta;
    if (mes) {
      const [y, m] = mes.split('-').map(Number);
      fechaDesde = new Date(y, m - 1, 1).toISOString();
      fechaHasta = new Date(y, m, 0, 23, 59, 59).toISOString();
    } else {
      const now = new Date();
      fechaDesde = desde || new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      fechaHasta = hasta || new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();
    }

    const params = [fechaDesde, fechaHasta];
    let sql = `
      SELECT
        e.*,
        c.nombre AS categoria_nombre, c.color_hex AS categoria_color, c.icono AS categoria_icono,
        g.nombre AS grupo_nombre,
        u.nombre AS creado_por_nombre
      FROM eventos e
      LEFT JOIN categorias_evento c ON e.categoria_id = c.id
      LEFT JOIN grupos g ON e.grupo_id = g.id
      LEFT JOIN usuarios u ON e.creado_por = u.id
      WHERE e.fecha_inicio >= $1 AND e.fecha_inicio <= $2
    `;

    if (req.user.rol_principal === 'padre') {
      sql += ` AND e.publicado = true`;
    }

    if (grupo_id) {
      params.push(grupo_id);
      sql += ` AND (e.grupo_id = $${params.length} OR e.grupo_id IS NULL)`;
    }

    sql += ' ORDER BY e.fecha_inicio ASC';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /calendario/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT e.*, c.nombre AS categoria_nombre, c.color_hex AS categoria_color, c.icono AS categoria_icono,
             g.nombre AS grupo_nombre, u.nombre AS creado_por_nombre
      FROM eventos e
      LEFT JOIN categorias_evento c ON e.categoria_id = c.id
      LEFT JOIN grupos g ON e.grupo_id = g.id
      LEFT JOIN usuarios u ON e.creado_por = u.id
      WHERE e.id = $1
    `, [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /calendario ──────────────────────────────────────────────────────────
router.post('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id, publicado } = req.body;
    if (!titulo || !fecha_inicio) return res.status(400).json({ error: 'titulo y fecha_inicio son obligatorios' });

    const result = await query(`
      INSERT INTO eventos (titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id, publicado, creado_por)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [titulo, descripcion || null, categoria_id || null, fecha_inicio,
        fecha_fin || null, es_todo_el_dia || false, grupo_id || null, publicado ?? true, req.user.id]);

    res.status(201).json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /calendario/:id ───────────────────────────────────────────────────────
router.put('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id, publicado } = req.body;

    await query(`
      UPDATE eventos SET
        titulo         = COALESCE($1, titulo),
        descripcion    = COALESCE($2, descripcion),
        categoria_id   = COALESCE($3, categoria_id),
        fecha_inicio   = COALESCE($4, fecha_inicio),
        fecha_fin      = COALESCE($5, fecha_fin),
        es_todo_el_dia = COALESCE($6, es_todo_el_dia),
        grupo_id       = $7,
        publicado      = COALESCE($8, publicado),
        updated_at     = NOW()
      WHERE id = $9
    `, [titulo, descripcion, categoria_id, fecha_inicio, fecha_fin, es_todo_el_dia, grupo_id ?? null, publicado, req.params.id]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── DELETE /calendario/:id ────────────────────────────────────────────────────
router.delete('/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query('DELETE FROM eventos WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
