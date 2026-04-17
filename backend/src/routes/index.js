const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const alumnosRoutes = require('./alumnos');
const gruposRoutes = require('./grupos');
const personalRoutes = require('./personal');
const asistenciaRoutes = require('./asistencia');
const bitacoraRoutes = require('./bitacora');
const pagosRoutes = require('./pagos');
const calendarioRoutes = require('./calendario');
const evaluacionesRoutes = require('./evaluaciones');
const galeriaRoutes = require('./galeria');
const chatRoutes = require('./chat');
const notificacionesRoutes = require('./notificaciones');
const configRoutes = require('./config');
const reportesRoutes = require('./reportes');

router.use('/auth', authRoutes);
router.use('/alumnos', alumnosRoutes);
router.use('/grupos', gruposRoutes);
router.use('/personal', personalRoutes);
router.use('/asistencia', asistenciaRoutes);
router.use('/bitacora', bitacoraRoutes);
router.use('/pagos', pagosRoutes);
router.use('/calendario', calendarioRoutes);
router.use('/evaluaciones', evaluacionesRoutes);
router.use('/galeria', galeriaRoutes);
router.use('/chat', chatRoutes);
router.use('/notificaciones', notificacionesRoutes);
router.use('/config', configRoutes);
router.use('/reportes', reportesRoutes);

module.exports = router;
