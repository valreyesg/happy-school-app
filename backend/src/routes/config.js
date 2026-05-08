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

const CLAVES_NOTIFICACIONES = [
  'notificaciones_modal_tipos',
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

// GET /api/config/notificaciones — público para todos los roles (lectura)
router.get('/notificaciones', async (req, res) => {
  try {
    const result = await query(
      `SELECT valor FROM configuracion_general WHERE clave = 'notificaciones_modal_tipos'`
    );
    if (result.rows.length === 0) {
      return res.json({ notificaciones_modal_tipos: [] });
    }
    const tipos = JSON.parse(result.rows[0].valor || '[]');
    res.json({ notificaciones_modal_tipos: tipos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración de notificaciones' });
  }
});

// PUT /api/config/notificaciones — solo directora
router.put('/notificaciones', authorize('directora'), async (req, res) => {
  const { notificaciones_modal_tipos } = req.body;

  if (!Array.isArray(notificaciones_modal_tipos)) {
    return res.status(400).json({ error: 'notificaciones_modal_tipos debe ser un array' });
  }

  try {
    await query(
      `UPDATE configuracion_general SET valor = $1, updated_at = NOW() WHERE clave = 'notificaciones_modal_tipos'`,
      [JSON.stringify(notificaciones_modal_tipos)]
    );
    res.json({ ok: true, notificaciones_modal_tipos });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuración de notificaciones' });
  }
});

// ── Claves de configuración de negocio ───────────────────────────────────────
const CLAVES_NEGOCIO = [
  'precio_comida_semana',
  'precio_comida_dia',
  'semaforo_dias_amarillo',
  'semaforo_dias_rojo',
  'semaforo_dias_suspendido',
  'docs_requeridos_alumno',
  'max_tutores_por_alumno',
  'max_morosos_dashboard',
  'dia_registro_comida',
  'recargo_porcentaje_default',
];

// GET /api/config/negocio — lectura para todos los roles autenticados
router.get('/negocio', async (req, res) => {
  try {
    const result = await query(
      `SELECT clave, valor, descripcion FROM configuracion_general WHERE clave = ANY($1) ORDER BY clave`,
      [CLAVES_NEGOCIO]
    );
    const config = {};
    result.rows.forEach(r => { config[r.clave] = r.valor; });
    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener configuración de negocio' });
  }
});

// PUT /api/config/negocio — solo directora, guarda historial de cambios
router.put('/negocio', authorize('directora'), async (req, res) => {
  const cambios = req.body;
  const clavesCambio = Object.keys(cambios).filter(k => CLAVES_NEGOCIO.includes(k));

  if (clavesCambio.length === 0) {
    return res.status(400).json({ error: 'No hay claves válidas para actualizar' });
  }

  try {
    for (const clave of clavesCambio) {
      // Leer valor anterior para historial
      const anterior = await query(
        `SELECT valor FROM configuracion_general WHERE clave = $1`, [clave]
      );
      const valorAntes = anterior.rows[0]?.valor ?? null;
      const valorNuevo = String(cambios[clave]);

      await query(
        `UPDATE configuracion_general SET valor = $1, updated_at = NOW() WHERE clave = $2`,
        [valorNuevo, clave]
      );

      // Guardar en historial
      await query(
        `INSERT INTO configuracion_historial (clave, valor_antes, valor_nuevo, cambiado_por)
         VALUES ($1, $2, $3, $4)`,
        [clave, valorAntes, valorNuevo, req.user.id]
      );
    }
    res.json({ ok: true, actualizadas: clavesCambio });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar configuración de negocio' });
  }
});

// GET /api/config/whatsapp — estado del feature flag WhatsApp (todos los roles)
// Combina env var WHATSAPP_ENABLED + clave BD whatsapp_activo
router.get('/whatsapp', async (req, res) => {
  if (process.env.WHATSAPP_ENABLED !== 'true') {
    return res.json({ enabled: false });
  }
  try {
    const result = await query(
      `SELECT valor FROM configuracion_general WHERE clave = 'whatsapp_activo'`
    );
    const enabled = result.rows[0]?.valor === 'true';
    res.json({ enabled });
  } catch (err) {
    console.error(err);
    res.json({ enabled: false }); // fail-safe: no error al cliente
  }
});

// GET /api/config/negocio/historial — solo directora
router.get('/negocio/historial', authorize('directora'), async (req, res) => {
  try {
    const result = await query(`
      SELECT h.clave, h.valor_antes, h.valor_nuevo, h.cambiado_at,
             u.nombre AS cambiado_por_nombre
      FROM configuracion_historial h
      LEFT JOIN usuarios u ON h.cambiado_por = u.id
      ORDER BY h.cambiado_at DESC
      LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener historial' });
  }
});

module.exports = router;
