const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');

const generarTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
  const refreshToken = jwt.sign(
    { userId, jti: uuidv4() },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
  return { accessToken, refreshToken };
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT u.id, u.nombre, u.email, u.password_hash, u.rol_principal, u.activo,
              u.foto_url, u.primer_login
       FROM usuarios u WHERE u.email = $1`,
      [email.toLowerCase().trim()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(401).json({ error: 'Usuario inactivo. Contacta a la directora.' });
    }

    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    // Obtener roles adicionales
    const rolesResult = await query(
      `SELECT r.nombre, ru.contexto_grupo_id
       FROM roles_usuario ru
       JOIN roles r ON ru.rol_id = r.id
       WHERE ru.usuario_id = $1 AND ru.activo = true`,
      [usuario.id]
    );

    const { accessToken, refreshToken } = generarTokens(usuario.id);

    // Guardar refresh token en DB
    await query(
      'INSERT INTO refresh_tokens (usuario_id, token, expira_en) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [usuario.id, refreshToken]
    );

    // Actualizar último acceso
    await query('UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = $1', [usuario.id]);

    res.json({
      accessToken,
      refreshToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rolPrincipal: usuario.rol_principal,
        roles: rolesResult.rows,
        fotoUrl: usuario.foto_url,
        primerLogin: usuario.primer_login,
      },
    });
  } catch (err) {
    next(err);
  }
};

const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token requerido' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const tokenResult = await query(
      'SELECT id FROM refresh_tokens WHERE token = $1 AND usuario_id = $2 AND usado = false AND expira_en > NOW()',
      [refreshToken, decoded.userId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token inválido o expirado' });
    }

    // Invalidar token usado (rotación de tokens)
    await query('UPDATE refresh_tokens SET usado = true WHERE token = $1', [refreshToken]);

    const tokens = generarTokens(decoded.userId);

    await query(
      'INSERT INTO refresh_tokens (usuario_id, token, expira_en) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [decoded.userId, tokens.refreshToken]
    );

    res.json(tokens);
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Refresh token inválido' });
    }
    next(err);
  }
};

const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await query('UPDATE refresh_tokens SET usado = true WHERE token = $1', [refreshToken]);
    }
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
};

const cambiarPassword = async (req, res, next) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;
    const userId = req.user.id;

    const result = await query('SELECT password_hash FROM usuarios WHERE id = $1', [userId]);
    const valida = await bcrypt.compare(passwordActual, result.rows[0].password_hash);

    if (!valida) {
      return res.status(400).json({ error: 'Contraseña actual incorrecta' });
    }

    const hash = await bcrypt.hash(passwordNuevo, 12);
    await query(
      'UPDATE usuarios SET password_hash = $1, primer_login = false, updated_at = NOW() WHERE id = $1',
      [hash, userId]
    );

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

const perfil = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT u.id, u.nombre, u.email, u.rol_principal, u.foto_url, u.telefono,
              u.ultimo_acceso, u.created_at
       FROM usuarios u WHERE u.id = $1`,
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
};

module.exports = { login, refresh, logout, cambiarPassword, perfil };
