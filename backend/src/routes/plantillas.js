const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// ── GET /plantillas ───────────────────────────────────────────────────────────
// Listar todas las plantillas — solo directora
router.get('/', authorize('directora'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT id, clave, nombre, plantilla, activa, created_at, updated_at
       FROM plantillas_whatsapp
       ORDER BY nombre ASC`
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /plantillas/:id ───────────────────────────────────────────────────────
// Obtener una plantilla por ID — solo directora
router.get('/:id', authorize('directora'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, clave, nombre, plantilla, activa, created_at, updated_at
       FROM plantillas_whatsapp
       WHERE id = $1`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PUT /plantillas/:id ───────────────────────────────────────────────────────
// Editar plantilla — solo directora
// Campos editables: nombre, plantilla, activa
// La clave NO es editable (está atada al código)
router.put('/:id', authorize('directora'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { nombre, plantilla, activa } = req.body;

    if (nombre !== undefined && nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre no puede estar vacío' });
    }
    if (plantilla !== undefined && plantilla.trim() === '') {
      return res.status(400).json({ error: 'El contenido de la plantilla no puede estar vacío' });
    }

    const current = await query(
      `SELECT * FROM plantillas_whatsapp WHERE id = $1`,
      [id]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Plantilla no encontrada' });
    const item = current.rows[0];

    const result = await query(
      `UPDATE plantillas_whatsapp
       SET nombre     = $1,
           plantilla  = $2,
           activa     = $3,
           updated_at = NOW()
       WHERE id = $4
       RETURNING id, clave, nombre, plantilla, activa, updated_at`,
      [
        nombre   ?? item.nombre,
        plantilla ?? item.plantilla,
        activa   !== undefined ? activa : item.activa,
        id
      ]
    );
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── PATCH /plantillas/:id/toggle ──────────────────────────────────────────────
// Activar / desactivar plantilla — solo directora
router.patch('/:id/toggle', authorize('directora'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `UPDATE plantillas_whatsapp
       SET activa = NOT activa, updated_at = NOW()
       WHERE id = $1
       RETURNING id, clave, nombre, activa`,
      [id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /plantillas/:id/reset ────────────────────────────────────────────────
// Restaurar plantilla a su texto original (guardado en campo plantilla_original si existe)
// Por ahora: no-op con mensaje informativo
router.post('/:id/reset', authorize('directora'), async (req, res, next) => {
  try {
    const { id } = req.params;
    const current = await query(
      `SELECT id, clave, nombre FROM plantillas_whatsapp WHERE id = $1`,
      [id]
    );
    if (current.rows.length === 0) return res.status(404).json({ error: 'Plantilla no encontrada' });
    res.json({ ok: true, mensaje: 'Para restaurar al original, contacta al administrador del sistema.' });
  } catch (err) { next(err); }
});

module.exports = router;
