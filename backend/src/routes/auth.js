const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { validateRequest } = require('../middleware/validateRequest');
const { authenticate } = require('../middleware/auth');
const { login, refresh, logout, cambiarPassword, perfil } = require('../controllers/authController');

router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 6 }).withMessage('Contraseña requerida'),
  ],
  validateRequest,
  login
);

router.post('/refresh',
  body('refreshToken').notEmpty().withMessage('Refresh token requerido'),
  validateRequest,
  refresh
);

router.post('/logout', logout);

router.put('/cambiar-password',
  authenticate,
  [
    body('passwordActual').notEmpty(),
    body('passwordNuevo').isLength({ min: 8 }).withMessage('La nueva contraseña debe tener al menos 8 caracteres'),
  ],
  validateRequest,
  cambiarPassword
);

router.get('/perfil', authenticate, perfil);

module.exports = router;
