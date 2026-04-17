const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

// Verifica el access token JWT
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await query(
      'SELECT id, nombre, email, rol_principal, activo FROM usuarios WHERE id = $1 AND activo = true',
      [decoded.userId]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado', code: 'TOKEN_EXPIRED' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Verifica que el usuario tenga alguno de los roles permitidos
const authorize = (...rolesPermitidos) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    // Directora siempre tiene acceso total
    if (req.user.rol_principal === 'directora') {
      return next();
    }

    // Obtener todos los roles activos del usuario
    const rolesResult = await query(
      `SELECT r.nombre FROM roles_usuario ru
       JOIN roles r ON ru.rol_id = r.id
       WHERE ru.usuario_id = $1 AND ru.activo = true`,
      [req.user.id]
    );

    const rolesUsuario = rolesResult.rows.map(r => r.nombre);
    rolesUsuario.push(req.user.rol_principal);

    const tienePermiso = rolesPermitidos.some(rol => rolesUsuario.includes(rol));
    if (!tienePermiso) {
      return res.status(403).json({ error: 'Sin permisos para esta acción' });
    }

    req.user.roles = rolesUsuario;
    next();
  };
};

module.exports = { authenticate, authorize };
