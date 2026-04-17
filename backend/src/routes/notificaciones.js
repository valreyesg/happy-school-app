const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
router.use(authenticate);
// TODO: implementar endpoints de este módulo
router.get('/', (req, res) => res.json({ modulo: 'notificaciones', mensaje: 'Módulo en construcción' }));
module.exports = router;
