const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const { enviarPush } = require('../services/pushService');

router.use(authenticate);

// POST /registrar-token — guarda token FCM del dispositivo del usuario autenticado
router.post('/registrar-token', async (req, res, next) => {
  try {
    const { fcmToken } = req.body;
    if (!fcmToken || typeof fcmToken !== 'string') {
      return res.status(400).json({ error: 'fcmToken es requerido' });
    }
    await query(
      'UPDATE usuarios SET fcm_token = $1 WHERE id = $2',
      [fcmToken, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET / — últimas 20 notificaciones del usuario autenticado
router.get('/', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, titulo, cuerpo, tipo, datos_extra, leida, created_at
      FROM notificaciones
      WHERE usuario_id = $1
      ORDER BY created_at DESC
      LIMIT 20
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// GET /no-leidas — count de notificaciones no leídas
router.get('/no-leidas', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT COUNT(*) AS count FROM notificaciones WHERE usuario_id = $1 AND leida = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) { next(err); }
});

// PUT /leer-todas — marcar todas como leídas
router.put('/leer-todas', async (req, res, next) => {
  try {
    await query(
      'UPDATE notificaciones SET leida = true WHERE usuario_id = $1 AND leida = false',
      [req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUT /:id/leer — marcar una como leída
router.put('/:id/leer', async (req, res, next) => {
  try {
    await query(
      'UPDATE notificaciones SET leida = true WHERE id = $1 AND usuario_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// POST /aviso-extraordinario — Directora envía aviso a padres de grupos seleccionados
router.post('/aviso-extraordinario', authorize('directora'), async (req, res, next) => {
  try {
    const { titulo, cuerpo, grupo_ids } = req.body;

    if (!titulo || !cuerpo) {
      return res.status(400).json({ error: 'titulo y cuerpo son requeridos' });
    }

    // Insertar en tabla avisos primero (para tener persistencia del historial)
    // Nota: grupo_ids se guarda en datos_extra de notificaciones por ahora
    const avisoResult = await query(`
      INSERT INTO avisos (titulo, contenido, creado_por, publicado)
      VALUES ($1, $2, $3, true)
      RETURNING id
    `, [titulo, cuerpo, req.user.id]);

    const aviso_id = avisoResult.rows[0].id;

    let padresResult;
    if (!grupo_ids || grupo_ids.length === 0) {
      padresResult = await query(`
        SELECT DISTINCT u.id AS usuario_id, p.nombre_completo AS padre_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.deleted_at IS NULL
      `);
    } else {
      padresResult = await query(`
        SELECT DISTINCT u.id AS usuario_id, p.nombre_completo AS padre_nombre
        FROM alumnos a
        JOIN alumno_padre ap ON ap.alumno_id = a.id
        JOIN padres p ON ap.padre_id = p.id
        JOIN usuarios u ON p.usuario_id = u.id
        WHERE a.grupo_id = ANY($1::uuid[]) AND a.deleted_at IS NULL
      `, [grupo_ids]);
    }

    if (padresResult.rows.length === 0) {
      return res.json({ ok: true, enviadas: 0, aviso_id });
    }

    const datos = JSON.stringify({ aviso_id, grupo_ids: grupo_ids || [], origen: 'directora' });
    await Promise.all(
      padresResult.rows.map(({ usuario_id }) =>
        query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'aviso_extraordinario', $4)
        `, [usuario_id, titulo, cuerpo, datos])
      )
    );

    // Enviar push a todos los padres
    const ids = padresResult.rows.map(r => r.usuario_id);
    enviarPush(ids, titulo, cuerpo, { tipo: 'aviso_extraordinario', aviso_id: String(aviso_id) });

    res.json({ ok: true, enviadas: padresResult.rows.length, aviso_id });
  } catch (err) { next(err); }
});

// GET /aviso-extraordinario/estado/:avisoId — Estado de lectura de un aviso
router.get('/aviso-extraordinario/estado/:avisoId', authorize('directora'), async (req, res, next) => {
  try {
    const { avisoId } = req.params;

    // Buscar todas las notificaciones del aviso específico filtrando por aviso_id en datos_extra
    const result = await query(`
      SELECT
        n.id,
        n.leida,
        n.created_at AS enviado_at,
        p.nombre_completo AS padre_nombre,
        a.nombre_completo AS alumno_nombre,
        g.nombre AS grupo_nombre
      FROM notificaciones n
      JOIN usuarios u ON n.usuario_id = u.id
      JOIN padres p ON p.usuario_id = u.id
      JOIN alumno_padre ap ON ap.padre_id = p.id AND ap.es_tutor_principal = true
      JOIN alumnos a ON ap.alumno_id = a.id AND a.deleted_at IS NULL
      JOIN grupos g ON a.grupo_id = g.id
      WHERE n.tipo = 'aviso_extraordinario' AND n.datos_extra->>'aviso_id' = $1
      ORDER BY n.leida ASC, p.nombre_completo ASC
    `, [avisoId]);

    const total = result.rows.length;
    const leidas = result.rows.filter(r => r.leida).length;

    res.json({
      total,
      leidas,
      pendientes: total - leidas,
      detalle: result.rows,
    });
  } catch (err) { next(err); }
});

// GET /avisos-extraordinarios — Historial de avisos extraordinarios enviados
router.get('/avisos-extraordinarios', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, titulo, created_at
      FROM avisos
      WHERE contenido IS NOT NULL AND publicado = true
      ORDER BY created_at DESC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── ALERTAS FINANCIERAS (Admin/Directora) ────────────────────────────────────

// GET /adeudos — Lista alumnos con adeudos pendientes/vencidos del mes actual
// Incluye si ya se envió alerta de pago hoy y si el padre la leyó
router.get('/adeudos', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { mes, anio } = req.query;
    const m = parseInt(mes) || new Date().getMonth() + 1;
    const a = parseInt(anio) || new Date().getFullYear();

    const result = await query(`
      SELECT
        al.id                          AS alumno_id,
        al.nombre_completo             AS alumno_nombre,
        al.foto_url,
        g.nombre                       AS grupo_nombre,
        g.color_hex,
        COUNT(p.id)                    AS total_cargos,
        COUNT(p.id) FILTER (WHERE p.estado IN ('pendiente','vencido')) AS cargos_adeudados,
        COALESCE(SUM(p.monto_total) FILTER (WHERE p.estado IN ('pendiente','vencido')), 0) AS saldo_pendiente,
        -- Saldo total acumulado hasta el mes seleccionado (excluye meses futuros)
        COALESCE(SUM(ph.monto_total) FILTER (WHERE ph.estado IN ('pendiente','vencido')), 0) AS saldo_total,
        MAX(p.dias_atraso) FILTER (WHERE p.estado IN ('pendiente','vencido'))  AS max_dias_atraso,
        BOOL_OR(p.estado = 'vencido')  AS tiene_vencidos,
        -- Padres del alumno con su estado de lectura
        JSON_AGG(DISTINCT JSONB_BUILD_OBJECT(
          'padre_id',     pad.id,
          'padre_nombre', pad.nombre_completo,
          'usuario_id',   u.id
        )) FILTER (WHERE u.id IS NOT NULL) AS padres,
        -- Última alerta de pago enviada hoy
        MAX(n.created_at) FILTER (WHERE n.tipo = 'alerta_pago'
          AND DATE(n.created_at) = CURRENT_DATE)           AS ultima_alerta_hoy,
        -- Si la última alerta fue leída por al menos un padre
        BOOL_OR(n.leida) FILTER (WHERE n.tipo = 'alerta_pago') AS alerta_leida
      FROM alumnos al
      JOIN grupos g ON al.grupo_id = g.id
      LEFT JOIN pagos p ON p.alumno_id = al.id
        AND p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
      -- Join sin filtro de mes pero acotado a <= mes/año seleccionado (nunca meses futuros)
      LEFT JOIN pagos ph ON ph.alumno_id = al.id
        AND (ph.anio_correspondiente < $2
          OR (ph.anio_correspondiente = $2 AND ph.mes_correspondiente <= $1))
      LEFT JOIN alumno_padre ap ON ap.alumno_id = al.id
      LEFT JOIN padres pad ON ap.padre_id = pad.id
      LEFT JOIN usuarios u ON pad.usuario_id = u.id
      LEFT JOIN notificaciones n ON n.usuario_id = u.id
        AND n.tipo = 'alerta_pago'
        AND (n.datos_extra->>'alumno_id') = al.id::text
      WHERE al.deleted_at IS NULL
        AND g.activo = true
        AND g.ciclo_id = (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1)
      GROUP BY al.id, al.nombre_completo, al.foto_url, g.nombre, g.color_hex
      HAVING COALESCE(SUM(p.monto_total) FILTER (WHERE p.estado IN ('pendiente','vencido')), 0) > 0
      ORDER BY tiene_vencidos DESC, max_dias_atraso DESC NULLS LAST, saldo_pendiente DESC
    `, [m, a]);

    res.json(result.rows);
  } catch (err) { next(err); }
});

// POST /alerta-pago — Envía notificación de adeudo al/los padre/s de un alumno
// Body: { alumno_id, mensaje, mes?, anio? }
// Si se omiten mes/anio usa el mes actual. El campo `mensaje` es el texto completo editable.
router.post('/alerta-pago', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { alumno_id, mensaje } = req.body;
    const mes  = parseInt(req.body.mes)  || new Date().getMonth() + 1;
    const anio = parseInt(req.body.anio) || new Date().getFullYear();

    if (!alumno_id) return res.status(400).json({ error: 'alumno_id es requerido' });

    // Obtener datos del alumno: saldo del mes seleccionado + saldo total histórico
    const alumnoRes = await query(`
      SELECT al.nombre_completo, al.id,
        -- Saldo del mes seleccionado
        COALESCE(SUM(p.monto_total) FILTER (WHERE p.estado IN ('pendiente','vencido')
          AND p.mes_correspondiente = $2 AND p.anio_correspondiente = $3), 0) AS saldo_mes,
        -- Saldo acumulado hasta el mes seleccionado (nunca meses futuros)
        COALESCE(SUM(p.monto_total) FILTER (WHERE p.estado IN ('pendiente','vencido')
          AND (p.anio_correspondiente < $3
            OR (p.anio_correspondiente = $3 AND p.mes_correspondiente <= $2))
        ), 0) AS saldo_total,
        MAX(p.dias_atraso) FILTER (WHERE p.estado IN ('pendiente','vencido')) AS dias_atraso
      FROM alumnos al
      LEFT JOIN pagos p ON p.alumno_id = al.id
      WHERE al.id = $1 AND al.deleted_at IS NULL
      GROUP BY al.id, al.nombre_completo
    `, [alumno_id, mes, anio]);

    if (!alumnoRes.rows.length) return res.status(404).json({ error: 'Alumno no encontrado' });

    const alumno = alumnoRes.rows[0];
    const saldoMes   = parseFloat(alumno.saldo_mes   || 0);
    const saldoTotal = parseFloat(alumno.saldo_total || 0);
    const diasAtraso = parseInt(alumno.dias_atraso || 0);

    // Obtener todos los padres/tutores del alumno
    const padresRes = await query(`
      SELECT DISTINCT u.id AS usuario_id, pad.nombre_completo AS padre_nombre
      FROM alumno_padre ap
      JOIN padres pad ON ap.padre_id = pad.id
      JOIN usuarios u ON pad.usuario_id = u.id
      WHERE ap.alumno_id = $1
    `, [alumno_id]);

    if (!padresRes.rows.length) {
      return res.status(400).json({ error: 'El alumno no tiene padres/tutores registrados' });
    }

    const fmtMXN = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
    const titulo = `Recordatorio de pago — ${alumno.nombre_completo}`;
    // Si el frontend manda el mensaje ya editado, se usa tal cual.
    // Fallback: texto desglosado mes + total histórico con días de atraso cuando aplica.
    let cuerpo;
    if (mensaje?.trim()) {
      cuerpo = mensaje.trim();
    } else {
      const linea1 = diasAtraso > 0
        ? `Tienes un saldo pendiente de ${fmtMXN(saldoMes)} del mes en curso con ${diasAtraso} día${diasAtraso !== 1 ? 's' : ''} de retraso para ${alumno.nombre_completo}.`
        : `Tienes un saldo pendiente de ${fmtMXN(saldoMes)} del mes en curso para ${alumno.nombre_completo}.`;
      const linea2 = saldoTotal > saldoMes
        ? ` Tu adeudo total acumulado es de ${fmtMXN(saldoTotal)}.`
        : '';
      cuerpo = linea1 + linea2 + ' Por favor regulariza tu cuenta a la brevedad.';
    }

    const datos = JSON.stringify({
      alumno_id,
      alumno_nombre: alumno.nombre_completo,
      saldo_mes: saldoMes,
      saldo_total: saldoTotal,
      dias_atraso: diasAtraso,
      origen: 'alerta_admin',
    });

    await Promise.all(
      padresRes.rows.map(({ usuario_id }) =>
        query(`
          INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
          VALUES ($1, $2, $3, 'alerta_pago', $4)
        `, [usuario_id, titulo, cuerpo, datos])
      )
    );

    // Enviar push a los padres del alumno
    const padreIds = padresRes.rows.map(r => r.usuario_id);
    enviarPush(padreIds, titulo, cuerpo, { tipo: 'alerta_pago', alumno_id: String(alumno_id) });

    res.json({ ok: true, enviadas: padresRes.rows.length, alumno: alumno.nombre_completo });
  } catch (err) { next(err); }
});

module.exports = router;
