const express = require('express');
const multer = require('multer');
const { verifyToken, authorize } = require('../middleware/auth');
const comidaController = require('../controllers/comidaController');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// GET: Obtener menú de la semana (público - padre)
router.get('/menu', comidaController.getMenu);

// POST: Crear/actualizar menú (directora/admin)
router.post('/menu', verifyToken, authorize(['directora', 'administrativo']),
  upload.single('archivo'),
  comidaController.crearOActualizarMenu
);

// DELETE: Eliminar menú (directora/admin)
router.delete('/menu/:id', verifyToken, authorize(['directora', 'administrativo']),
  comidaController.eliminarMenu
);

// GET: Obtener estadísticas de confirmaciones (directora/admin/maestras)
router.get('/confirmaciones', verifyToken, (req, res, next) => {
  const rolesPermitidos = ['directora', 'administrativo', 'maestra_titular', 'maestra_puerta', 'maestra_auxiliar', 'maestra_especial'];
  if (!rolesPermitidos.includes(req.user.rol_principal)) {
    return res.status(403).json({ error: 'Sin permisos' });
  }
  next();
},
  comidaController.obtenerConfirmaciones
);

// POST: Papá confirma comida (domingo)
router.post('/confirmacion', verifyToken, authorize(['padre']),
  upload.single('comprobante'),
  comidaController.confirmarComida
);

// GET: Papá consulta su confirmación
router.get('/confirmacion/:alumno_id', verifyToken,
  comidaController.verConfirmacion
);

// PUT: Directora, admin o maestra verifica pago (filtro entrada)
router.put('/confirmacion/:id/verificar-pago', verifyToken, authorize(['directora', 'administrativo', 'maestra_titular', 'maestra_puerta', 'maestra_especial']),
  comidaController.verificarPago
);

// PUT: Directora, admin o maestra cancela comida no pagada (filtro entrada)
router.put('/confirmacion/:id/cancelar', verifyToken, authorize(['directora', 'administrativo', 'maestra_titular', 'maestra_puerta', 'maestra_especial']),
  comidaController.cancelarComida
);

module.exports = router;
