const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// ¿El usuario actual tiene turno hoy?
router.get('/hoy', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT tp.id, tp.fecha::text, tp.turno, p.id AS personal_id, u.nombre
      FROM turno_puerta tp
      JOIN personal p ON tp.personal_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE tp.fecha = CURRENT_DATE AND p.usuario_id = $1
    `, [req.user.id]);
    res.json({ tiene_turno: result.rows.length > 0, turno: result.rows[0] || null });
  } catch (err) { next(err); }
});

// Lista de turnos para una fecha (directora/admin)
router.get('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const fecha = req.query.fecha || (await query(`SELECT CURRENT_DATE::text AS f`)).rows[0].f;
    const result = await query(`
      SELECT tp.id, tp.fecha::text, tp.turno, p.id AS personal_id, u.rol_principal,
             p.foto_url, u.nombre
      FROM turno_puerta tp
      JOIN personal p ON tp.personal_id = p.id
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE tp.fecha = $1
      ORDER BY tp.turno, u.nombre
    `, [fecha]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Personal disponible para asignar (maestras titulares, especiales, puerta)
router.get('/personal', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT p.id, u.rol_principal, p.foto_url, u.nombre
      FROM personal p
      JOIN usuarios u ON p.usuario_id = u.id
      WHERE p.activo = true
        AND u.rol_principal IN ('maestra_titular','maestra_especial','maestra_puerta','administrativo')
      ORDER BY u.nombre
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// Asignar turno
router.post('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { personal_id, fecha, turno = 'entrada' } = req.body;
    const me = await query(`SELECT id FROM personal WHERE usuario_id = $1`, [req.user.id]);
    const asignado_por = me.rows[0]?.id || null;
    const result = await query(`
      INSERT INTO turno_puerta (fecha, personal_id, asignado_por, turno)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (fecha, personal_id, turno) DO NOTHING
      RETURNING id, fecha::text, turno, personal_id
    `, [fecha, personal_id, asignado_por, turno]);
    res.json(result.rows[0] || { ya_existe: true });
  } catch (err) { next(err); }
});

// Eliminar turno
router.delete('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    await query(`DELETE FROM turno_puerta WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
