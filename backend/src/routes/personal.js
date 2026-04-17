const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const bcrypt = require('bcryptjs');

router.use(authenticate);

// ── GET /personal ─────────────────────────────────────────────────────────────
// Lista todo el personal con su rol, grupo asignado y estado
router.get('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { activo, rol } = req.query;

    let sql = `
      SELECT
        p.id, p.nombre_completo, p.curp, p.rfc, p.foto_url,
        p.telefono, p.email, p.fecha_ingreso, p.activo,
        u.id AS usuario_id, u.email AS usuario_email,
        u.rol_principal, u.activo AS usuario_activo, u.primer_login,
        COALESCE(
          json_agg(
            json_build_object(
              'grupo_id',  ag.grupo_id,
              'grupo_nombre', g.nombre,
              'es_titular', ag.es_titular,
              'materia',   ag.materia
            )
          ) FILTER (WHERE ag.id IS NOT NULL AND ag.activo = true),
          '[]'
        ) AS grupos_asignados
      FROM personal p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN asignaciones_grupo ag ON ag.personal_id = p.id AND ag.activo = true
      LEFT JOIN grupos g ON ag.grupo_id = g.id
      WHERE p.deleted_at IS NULL
    `;

    const params = [];

    if (activo !== undefined) {
      params.push(activo === 'true');
      sql += ` AND p.activo = $${params.length}`;
    }
    if (rol) {
      params.push(rol);
      sql += ` AND u.rol_principal = $${params.length}`;
    }

    sql += ' GROUP BY p.id, u.id ORDER BY p.nombre_completo';

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ── GET /personal/:id ─────────────────────────────────────────────────────────
router.get('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.*, u.id AS usuario_id, u.email AS usuario_email,
        u.rol_principal, u.activo AS usuario_activo, u.primer_login,
        COALESCE(
          json_agg(
            json_build_object(
              'asignacion_id', ag.id,
              'grupo_id',  ag.grupo_id,
              'grupo_nombre', g.nombre,
              'es_titular', ag.es_titular,
              'materia',   ag.materia,
              'dias_semana', ag.dias_semana
            )
          ) FILTER (WHERE ag.id IS NOT NULL AND ag.activo = true),
          '[]'
        ) AS grupos_asignados
      FROM personal p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN asignaciones_grupo ag ON ag.personal_id = p.id AND ag.activo = true
      LEFT JOIN grupos g ON ag.grupo_id = g.id
      WHERE p.id = $1 AND p.deleted_at IS NULL
      GROUP BY p.id, u.id
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Personal no encontrado' });
    res.json(result.rows[0]);
  } catch (err) { next(err); }
});

// ── POST /personal ────────────────────────────────────────────────────────────
// Crea personal + usuario (cuenta de acceso)
router.post('/', authorize('directora'), async (req, res, next) => {
  try {
    const {
      nombre_completo, curp, rfc, telefono, email,
      fecha_ingreso, rol_principal,
      password_inicial,
    } = req.body;

    if (!nombre_completo || !email || !rol_principal)
      return res.status(400).json({ error: 'nombre_completo, email y rol_principal son obligatorios' });

    // Crear usuario primero
    const passHash = await bcrypt.hash(password_inicial || 'HappySchool2026!', 10);
    const usuarioResult = await query(`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal, primer_login)
      VALUES ($1, $2, $3, $4, $5, true)
      RETURNING id
    `, [nombre_completo, email, telefono, passHash, rol_principal]);

    const usuarioId = usuarioResult.rows[0].id;

    // Crear registro personal
    const personalResult = await query(`
      INSERT INTO personal (usuario_id, nombre_completo, curp, rfc, telefono, email, fecha_ingreso)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `, [usuarioId, nombre_completo, curp || null, rfc || null, telefono || null, email, fecha_ingreso || null]);

    res.status(201).json({ ok: true, personal_id: personalResult.rows[0].id, usuario_id: usuarioId });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'El email ya está registrado' });
    next(err);
  }
});

// ── PUT /personal/:id ─────────────────────────────────────────────────────────
router.put('/:id', authorize('directora'), async (req, res, next) => {
  try {
    const {
      nombre_completo, curp, rfc, telefono, email,
      fecha_ingreso, activo, rol_principal,
    } = req.body;

    await query(`
      UPDATE personal SET
        nombre_completo = COALESCE($1, nombre_completo),
        curp            = COALESCE($2, curp),
        rfc             = COALESCE($3, rfc),
        telefono        = COALESCE($4, telefono),
        email           = COALESCE($5, email),
        fecha_ingreso   = COALESCE($6, fecha_ingreso),
        activo          = COALESCE($7, activo),
        updated_at      = NOW()
      WHERE id = $8
    `, [nombre_completo, curp, rfc, telefono, email, fecha_ingreso, activo, req.params.id]);

    // Actualizar rol en usuarios si se indicó
    if (rol_principal) {
      await query(`
        UPDATE usuarios u SET rol_principal = $1
        FROM personal p
        WHERE p.id = $2 AND u.id = p.usuario_id
      `, [rol_principal, req.params.id]);
    }

    // Sincronizar activo en usuario también
    if (activo !== undefined) {
      await query(`
        UPDATE usuarios u SET activo = $1
        FROM personal p
        WHERE p.id = $2 AND u.id = p.usuario_id
      `, [activo, req.params.id]);
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── POST /personal/:id/reset-password ────────────────────────────────────────
router.post('/:id/reset-password', authorize('directora'), async (req, res, next) => {
  try {
    const passHash = await bcrypt.hash('HappySchool2026!', 10);
    await query(`
      UPDATE usuarios u SET password_hash = $1, primer_login = true
      FROM personal p
      WHERE p.id = $2 AND u.id = p.usuario_id
    `, [passHash, req.params.id]);
    res.json({ ok: true, mensaje: 'Contraseña restablecida a HappySchool2026!' });
  } catch (err) { next(err); }
});

// ── POST /personal/:id/asignar-grupo ─────────────────────────────────────────
router.post('/:id/asignar-grupo', authorize('directora'), async (req, res, next) => {
  try {
    const { grupo_id, es_titular, materia, ciclo_id } = req.body;

    // Obtener ciclo activo si no se provee
    let cicloFinal = ciclo_id;
    if (!cicloFinal) {
      const cicloResult = await query(
        'SELECT id FROM ciclos_escolares WHERE activo = true ORDER BY fecha_inicio DESC LIMIT 1'
      );
      cicloFinal = cicloResult.rows[0]?.id;
    }

    if (!cicloFinal) return res.status(400).json({ error: 'No hay ciclo escolar activo' });

    // Si es titular: desactivar titular anterior de ese grupo
    if (es_titular) {
      await query(`
        UPDATE asignaciones_grupo SET activo = false
        WHERE grupo_id = $1 AND ciclo_id = $2 AND es_titular = true AND activo = true
      `, [grupo_id, cicloFinal]);
    }

    await query(`
      INSERT INTO asignaciones_grupo (personal_id, grupo_id, ciclo_id, es_titular, materia)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (personal_id, grupo_id, ciclo_id) WHERE activo = true DO UPDATE SET
        es_titular = $4, materia = $5
    `, [req.params.id, grupo_id, cicloFinal, es_titular || false, materia || null]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ── DELETE /personal/:id/asignar-grupo/:grupoId ───────────────────────────────
router.delete('/:id/asignar-grupo/:grupoId', authorize('directora'), async (req, res, next) => {
  try {
    await query(`
      UPDATE asignaciones_grupo SET activo = false
      WHERE personal_id = $1 AND grupo_id = $2
    `, [req.params.id, req.params.grupoId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
