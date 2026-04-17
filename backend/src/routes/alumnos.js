const express = require('express');
const router = express.Router();
const multer = require('multer');
const { authenticate, authorize } = require('../middleware/auth');
const ctrl = require('../controllers/alumnosController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(authenticate);

router.get('/', ctrl.listar);

// Buscar alumno por dato del QR — usado por el scanner de la maestra
router.get('/por-qr/:qrData', ctrl.buscarPorQR);

router.get('/:id', ctrl.obtener);

router.post('/',
  authorize('directora', 'administrativo'),
  ctrl.crear
);

router.put('/:id',
  authorize('directora', 'administrativo'),
  ctrl.actualizar
);

router.delete('/:id',
  authorize('directora'),
  ctrl.eliminar
);

router.post('/:id/foto',
  authorize('directora', 'administrativo'),
  upload.single('foto'),
  ctrl.subirFoto
);

router.post('/:id/regenerar-qr',
  authorize('directora', 'administrativo'),
  ctrl.regenerarQR
);

module.exports = router;
