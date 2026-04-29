const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

// GET /padres — Lista todos los padres con estado de cuenta y hijos vinculados
router.get('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT
        p.id, p.nombre_completo, p.email, p.telefono, p.usuario_id,
        u.activo AS cuenta_activa, u.primer_login, u.rol_principal,
        COALESCE(
          json_agg(
            json_build_object(
              'alumno_id', a.id,
              'nombre', a.nombre_completo,
              'grupo', g.nombre
            )
          ) FILTER (WHERE a.id IS NOT NULL AND ap.activo = true),
          '[]'
        ) AS hijos
      FROM padres p
      LEFT JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN alumno_padre ap ON ap.padre_id = p.id AND ap.activo = true
      LEFT JOIN alumnos a ON ap.alumno_id = a.id AND a.deleted_at IS NULL
      LEFT JOIN grupos g ON a.grupo_id = g.id
      GROUP BY p.id, u.id
      ORDER BY p.nombre_completo
    `);

    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /padres/:id — Obtener un padre específico
router.get('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(
      `SELECT p.id, p.nombre_completo, p.email, p.telefono, p.usuario_id,
              u.activo AS cuenta_activa, u.primer_login
       FROM padres p
       LEFT JOIN usuarios u ON p.usuario_id = u.id
       WHERE p.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Padre no encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /padres/:id/crear-cuenta — Crear cuenta de usuario para padre existente
router.post('/:id/crear-cuenta', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    // 1. Verificar que el padre existe y no tiene cuenta
    const padreResult = await query('SELECT * FROM padres WHERE id = $1', [req.params.id]);
    if (padreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Padre no encontrado' });
    }

    const padre = padreResult.rows[0];
    if (padre.usuario_id) {
      return res.status(400).json({ error: 'Este padre ya tiene una cuenta' });
    }

    if (!padre.email) {
      return res.status(400).json({ error: 'El padre no tiene email registrado' });
    }

    // 2. Verificar que el email no esté en uso
    const emailCheck = await query('SELECT id FROM usuarios WHERE email = $1', [padre.email]);
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: 'El email ya está en uso' });
    }

    // 3. Hash de la contraseña default
    const passwordDefault = process.env.DEFAULT_USER_PASSWORD || 'HappySchool2026!';
    const passwordHash = await bcrypt.hash(passwordDefault, 10);

    // 4. Crear usuario
    const usuarioResult = await query(
      `INSERT INTO usuarios (nombre, email, password_hash, rol_principal, primer_login, created_at, updated_at)
       VALUES ($1, $2, $3, $4, true, NOW(), NOW())
       RETURNING id`,
      [padre.nombre_completo, padre.email, passwordHash, 'padre']
    );

    const nuevoUsuarioId = usuarioResult.rows[0].id;

    // 5. Actualizar padre con el nuevo usuario_id
    await query('UPDATE padres SET usuario_id = $1, updated_at = NOW() WHERE id = $2', [nuevoUsuarioId, req.params.id]);

    res.json({
      ok: true,
      usuario_id: nuevoUsuarioId,
      password_temporal: passwordDefault,
      email: padre.email,
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /padres/:id/activar — Activar cuenta de padre
router.patch('/:id/activar', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const padreResult = await query('SELECT usuario_id FROM padres WHERE id = $1', [req.params.id]);
    if (padreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Padre no encontrado' });
    }

    const usuarioId = padreResult.rows[0].usuario_id;
    if (!usuarioId) {
      return res.status(400).json({ error: 'Este padre no tiene una cuenta' });
    }

    await query('UPDATE usuarios SET activo = true, updated_at = NOW() WHERE id = $1', [usuarioId]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// PATCH /padres/:id/inactivar — Desactivar cuenta de padre
router.patch('/:id/inactivar', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const padreResult = await query('SELECT usuario_id FROM padres WHERE id = $1', [req.params.id]);
    if (padreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Padre no encontrado' });
    }

    const usuarioId = padreResult.rows[0].usuario_id;
    if (!usuarioId) {
      return res.status(400).json({ error: 'Este padre no tiene una cuenta' });
    }

    await query('UPDATE usuarios SET activo = false, updated_at = NOW() WHERE id = $1', [usuarioId]);

    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
});

// POST /padres/:id/reset-password — Reset de contraseña
router.post('/:id/reset-password', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const padreResult = await query('SELECT usuario_id FROM padres WHERE id = $1', [req.params.id]);
    if (padreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Padre no encontrado' });
    }

    const usuarioId = padreResult.rows[0].usuario_id;
    if (!usuarioId) {
      return res.status(400).json({ error: 'Este padre no tiene una cuenta' });
    }

    const passwordDefault = process.env.DEFAULT_USER_PASSWORD || 'HappySchool2026!';
    const passwordHash = await bcrypt.hash(passwordDefault, 10);

    await query(
      'UPDATE usuarios SET password_hash = $1, primer_login = true, updated_at = NOW() WHERE id = $2',
      [passwordHash, usuarioId]
    );

    res.json({
      ok: true,
      password_temporal: passwordDefault,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
