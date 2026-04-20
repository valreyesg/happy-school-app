const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate);

const CLAVES_HORARIO = [
  'hora_inicio_filtro',
  'hora_fin_filtro',
  'hora_salida_normal',
  'hora_salida_extension',
  'hora_inicio_cobro_extension',
  'costo_extension_hora',
  'max_retardos_mes',
  'dia_inicio_pago',
  'dia_fin_pago',
  'alerta_minutos_sin_recoger',
];

// GET /api/config/horarios — público para todos los roles (lectura)
router.get('/horarios', async (req, res) => {
  try {
    const result = await query(
      `SELECT clave, valor, descripcion, tipo
       FROM configuracion_general
       WHERE clave = ANY($1)
       ORDER BY clave`,
      [CLAVES_HORARIO]
    );
    // Devolver como objeto clave→valor para fácil consumo
    const config = {};
    result.rows.forEach(r => { config[r.clave] = r.valor; });
    res.json({ horarios: config, detalle: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración' });
  }
});

// PUT /api/config/horarios — solo directora
router.put('/horarios', authorize('directora'), async (req, res) => {
  const cambios = req.body; // { clave: valor, ... }
  const clavesCambio = Object.keys(cambios).filter(k => CLAVES_HORARIO.includes(k));

  if (clavesCambio.length === 0) {
    return res.status(400).json({ error: 'No hay claves válidas para actualizar' });
  }

  try {
    for (const clave of clavesCambio) {
      await query(
        `UPDATE configuracion_general SET valor = $1, updated_at = NOW() WHERE clave = $2`,
        [String(cambios[clave]), clave]
      );
    }
    res.json({ ok: true, actualizadas: clavesCambio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuración' });
  }
});

module.exports = router;
