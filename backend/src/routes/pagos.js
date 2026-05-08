const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');
const ExcelJS = require('exceljs');
const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const multer = require('multer');
const { uploadToCloudinary } = require('../services/cloudinaryService');
const whatsappService = require('../services/whatsappService');

const uploadMemory = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularRecargo(concepto, mes, anio, montoBase) {
  if (!concepto.dia_recargo) return { monto_recargo: 0, dias_atraso: 0 };
  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();

  const recargoPorcentaje = parseFloat(concepto.recargo_porcentaje);
  const usaPorcentaje = !isNaN(recargoPorcentaje) && recargoPorcentaje > 0;
  const montoPorDia = parseFloat(concepto.monto_recargo_dia) || 0;

  // Determinar si hay atraso
  let diasAtraso = 0;
  let hayRecargo = false;

  if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
    const fechaVencimiento = new Date(anio, mes - 1, concepto.dia_recargo);
    diasAtraso = Math.max(0, Math.floor((hoy - fechaVencimiento) / 86400000));
    hayRecargo = diasAtraso > 0;
  } else if (mes === mesActual && anio === anioActual && diaActual >= concepto.dia_recargo) {
    diasAtraso = diaActual - concepto.dia_recargo + 1;
    hayRecargo = true;
  }

  if (!hayRecargo) return { monto_recargo: 0, dias_atraso: 0 };

  if (usaPorcentaje) {
    // Recargo porcentaje: se aplica UNA VEZ por mes vencido (10% del monto base)
    const base = parseFloat(montoBase || concepto.monto) || 0;
    const monto_recargo = +(base * recargoPorcentaje / 100).toFixed(2);
    return { monto_recargo, dias_atraso: diasAtraso };
  }

  // Fallback: recargo diario (lógica original)
  return { monto_recargo: +(diasAtraso * montoPorDia).toFixed(2), dias_atraso: diasAtraso };
}

// Helper: obtener monto correcto para un concepto según nivel del alumno
async function obtenerMontoConcepto(conceptoId, nivelKey, montoDefault) {
  if (!nivelKey) return parseFloat(montoDefault);
  const result = await query(
    'SELECT monto FROM precios_nivel WHERE concepto_id = $1 AND nivel_key = $2',
    [conceptoId, nivelKey]
  );
  return result.rows[0] ? parseFloat(result.rows[0].monto) : parseFloat(montoDefault);
}

async function getSemaforoConfig() {
  try {
    const result = await query(
      `SELECT clave, valor FROM configuracion_general
       WHERE clave IN ('semaforo_dias_amarillo','semaforo_dias_rojo','semaforo_dias_suspendido')`
    );
    const m = Object.fromEntries(result.rows.map(r => [r.clave, parseInt(r.valor)]));
    return {
      amarillo:   m.semaforo_dias_amarillo   ?? 1,
      rojo:       m.semaforo_dias_rojo       ?? 30,
      suspendido: m.semaforo_dias_suspendido ?? 60,
    };
  } catch {
    return { amarillo: 1, rojo: 30, suspendido: 60 };
  }
}

function semaforoAlumno(pagos, cfg = { amarillo: 1, rojo: 30, suspendido: 60 }) {
  if (!pagos.length) return 'verde';
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const maxAtraso = Math.max(...pagos.map(p => {
    // Si tiene dias_atraso guardado, usarlo
    if (p.dias_atraso > 0) return p.dias_atraso;
    // Si tiene fecha_limite y ya pasó, calcular días de atraso real
    if (p.fecha_limite) {
      const limite = new Date(p.fecha_limite);
      limite.setHours(0, 0, 0, 0);
      if (hoy > limite) return Math.floor((hoy - limite) / 86400000);
    }
    return 0;
  }));
  const tieneVencido = pagos.some(p => {
    if (p.estado === 'vencido') return true;
    if (p.fecha_limite) {
      const limite = new Date(p.fecha_limite);
      limite.setHours(0, 0, 0, 0);
      return hoy > limite;
    }
    return false;
  });
  if (maxAtraso >= cfg.suspendido || (tieneVencido && maxAtraso >= cfg.rojo)) return 'suspendido';
  if (maxAtraso >= cfg.rojo || tieneVencido) return 'rojo';
  if (maxAtraso >= cfg.amarillo) return 'amarillo';
  return 'verde';
}

// ─── CONCEPTOS DE PAGO ────────────────────────────────────────────────────────

router.get('/conceptos', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM conceptos_pago WHERE activo = true ORDER BY tipo, nombre'
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.post('/conceptos', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, descripcion, monto, tipo, es_mensual, es_recurrente,
            dia_pago, dia_recargo, monto_recargo_dia, recargo_porcentaje } = req.body;
    if (!nombre || !monto || !tipo)
      return res.status(400).json({ error: 'nombre, monto y tipo son obligatorios' });

    const r = await query(`
      INSERT INTO conceptos_pago
        (nombre, descripcion, monto, tipo, es_mensual, es_recurrente, dia_pago, dia_recargo, monto_recargo_dia, recargo_porcentaje)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *
    `, [nombre, descripcion || null, monto, tipo,
        es_mensual ?? false, es_recurrente ?? false,
        dia_pago || null, dia_recargo || null, monto_recargo_dia || 0,
        recargo_porcentaje != null ? recargo_porcentaje : null]);
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

router.put('/conceptos/:id', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, descripcion, monto, tipo, es_mensual, es_recurrente,
            dia_pago, dia_recargo, monto_recargo_dia, recargo_porcentaje, activo } = req.body;
    await query(`
      UPDATE conceptos_pago SET
        nombre           = COALESCE($1, nombre),
        descripcion      = COALESCE($2, descripcion),
        monto            = COALESCE($3, monto),
        tipo             = COALESCE($4, tipo),
        es_mensual       = COALESCE($5, es_mensual),
        es_recurrente    = COALESCE($6, es_recurrente),
        dia_pago         = COALESCE($7, dia_pago),
        dia_recargo      = COALESCE($8, dia_recargo),
        monto_recargo_dia= COALESCE($9, monto_recargo_dia),
        activo           = COALESCE($10, activo),
        recargo_porcentaje = $11,
        updated_at       = NOW()
      WHERE id = $12
    `, [nombre, descripcion, monto, tipo, es_mensual, es_recurrente,
        dia_pago, dia_recargo, monto_recargo_dia, activo,
        recargo_porcentaje !== undefined ? recargo_porcentaje : null,
        req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/conceptos/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query('UPDATE conceptos_pago SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── PRECIOS POR NIVEL ───────────────────────────────────────────────────────

router.get('/conceptos/:id/precios', async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, nivel_key, monto FROM precios_nivel WHERE concepto_id = $1 ORDER BY nivel_key',
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) { next(err); }
});

router.put('/conceptos/:id/precios', authorize('directora'), async (req, res, next) => {
  try {
    const { precios } = req.body; // [{ nivel_key, monto }]
    if (!Array.isArray(precios))
      return res.status(400).json({ error: 'precios debe ser un array de { nivel_key, monto }' });

    for (const { nivel_key, monto } of precios) {
      if (!nivel_key) continue;
      if (monto === null || monto === '' || monto === undefined) {
        await query(
          'DELETE FROM precios_nivel WHERE concepto_id = $1 AND nivel_key = $2',
          [req.params.id, nivel_key]
        );
      } else {
        await query(`
          INSERT INTO precios_nivel (concepto_id, nivel_key, monto)
          VALUES ($1, $2, $3)
          ON CONFLICT (concepto_id, nivel_key)
          DO UPDATE SET monto = $3, updated_at = NOW()
        `, [req.params.id, nivel_key, monto]);
      }
    }
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// GET monto para un alumno específico según su nivel
router.get('/conceptos/:id/monto-alumno/:alumnoId', async (req, res, next) => {
  try {
    const alumno = await query(
      'SELECT g.nivel_codigo FROM alumnos a JOIN grupos g ON a.grupo_id = g.id WHERE a.id = $1',
      [req.params.alumnoId]
    );
    if (!alumno.rows[0]) return res.status(404).json({ error: 'Alumno no encontrado' });

    const concepto = await query('SELECT monto FROM conceptos_pago WHERE id = $1', [req.params.id]);
    if (!concepto.rows[0]) return res.status(404).json({ error: 'Concepto no encontrado' });

    const monto = await obtenerMontoConcepto(req.params.id, alumno.rows[0].nivel_codigo, concepto.rows[0].monto);
    res.json({ monto, nivel_codigo: alumno.rows[0].nivel_codigo });
  } catch (err) { next(err); }
});

// ─── DASHBOARD FINANCIERO ─────────────────────────────────────────────────────

router.get('/dashboard', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { mes, anio } = req.query;
    const m = parseInt(mes) || new Date().getMonth() + 1;
    const a = parseInt(anio) || new Date().getFullYear();

    const [totales, porEstado, porGrupo, morosos] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE estado = 'pagado')  AS pagados,
          COUNT(*) FILTER (WHERE estado = 'pendiente') AS pendientes,
          COUNT(*) FILTER (WHERE estado = 'vencido')  AS vencidos,
          COUNT(*) FILTER (WHERE estado = 'por_confirmar') AS por_confirmar,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'pagado'),  0) AS recaudado,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'pendiente'), 0) AS por_cobrar,
          COALESCE(SUM(monto_total) FILTER (WHERE estado = 'vencido'),  0) AS vencido_total,
          COALESCE(SUM(monto_recargo) FILTER (WHERE estado = 'pagado'), 0) AS recargos_cobrados
        FROM pagos
        WHERE mes_correspondiente = $1 AND anio_correspondiente = $2
      `, [m, a]),

      query(`
        SELECT concepto_id, cp.nombre AS concepto, cp.tipo,
          COUNT(*) FILTER (WHERE p.estado = 'pagado')   AS pagados,
          COUNT(*) FILTER (WHERE p.estado = 'pendiente') AS pendientes,
          COUNT(*) FILTER (WHERE p.estado = 'vencido')  AS vencidos,
          COALESCE(SUM(p.monto_total) FILTER (WHERE p.estado = 'pagado'), 0) AS recaudado
        FROM pagos p
        JOIN conceptos_pago cp ON p.concepto_id = cp.id
        WHERE p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
        GROUP BY concepto_id, cp.nombre, cp.tipo
        ORDER BY cp.nombre
      `, [m, a]),

      query(`
        SELECT g.nombre AS grupo, g.color_hex,
          COUNT(DISTINCT a.id) AS total_alumnos,
          COUNT(p.id) FILTER (WHERE p.estado = 'pagado')   AS pagados,
          COUNT(p.id) FILTER (WHERE p.estado = 'pendiente') AS pendientes,
          COUNT(p.id) FILTER (WHERE p.estado = 'vencido')  AS vencidos
        FROM grupos g
        LEFT JOIN alumnos a ON a.grupo_id = g.id AND a.deleted_at IS NULL
        LEFT JOIN pagos p ON p.alumno_id = a.id
          AND p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
        WHERE g.activo = true
          AND g.deleted_at IS NULL
          AND g.ciclo_id = (SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1)
        GROUP BY g.id, g.nombre, g.color_hex
        ORDER BY g.nombre
      `, [m, a]),

      (async () => {
        const cfgMax = await query(
          `SELECT valor FROM configuracion_general WHERE clave = 'max_morosos_dashboard'`
        );
        const maxMorosos = parseInt(cfgMax.rows[0]?.valor ?? '10');
        return query(`
          SELECT a.id, a.nombre_completo, a.foto_url,
            g.nombre AS grupo, g.color_hex,
            COUNT(p.id) AS pagos_vencidos,
            MAX(p.dias_atraso) AS max_dias_atraso,
            SUM(p.monto_total) AS deuda_total
          FROM alumnos a
          JOIN grupos g ON a.grupo_id = g.id
          JOIN pagos p ON p.alumno_id = a.id AND p.estado = 'vencido'
            AND p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
          WHERE a.deleted_at IS NULL
          GROUP BY a.id, a.nombre_completo, a.foto_url, g.nombre, g.color_hex
          ORDER BY max_dias_atraso DESC
          LIMIT $3
        `, [m, a, maxMorosos]);
      })(),
    ]);

    res.json({
      mes: m, anio: a,
      totales: totales.rows[0],
      por_concepto: porEstado.rows,
      por_grupo: porGrupo.rows,
      top_morosos: morosos.rows,
    });
  } catch (err) { next(err); }
});

// ─── ESTADO DE CUENTA POR ALUMNO ──────────────────────────────────────────────

router.get('/estado/:alumnoId', async (req, res, next) => {
  try {
    // Padres solo pueden ver sus hijos
    if (req.user.rol_principal === 'padre') {
      const check = await query(
        `SELECT 1 FROM padres p
         JOIN alumno_padre ap ON ap.padre_id = p.id
         WHERE p.usuario_id = $1 AND ap.alumno_id = $2`,
        [req.user.id, req.params.alumnoId]
      );
      if (!check.rows.length) return res.status(403).json({ error: 'Acceso denegado' });
    }

    const [alumno, pagos, comida] = await Promise.all([
      query(`
        SELECT a.id, a.nombre_completo, a.foto_url,
               g.nombre AS grupo, g.color_hex
        FROM alumnos a JOIN grupos g ON a.grupo_id = g.id
        WHERE a.id = $1
      `, [req.params.alumnoId]),

      query(`
        SELECT p.*, cp.nombre AS concepto_nombre, cp.tipo AS concepto_tipo,
               u.nombre AS registrado_por_nombre
        FROM pagos p
        JOIN conceptos_pago cp ON p.concepto_id = cp.id
        LEFT JOIN usuarios u ON p.registrado_por = u.id
        WHERE p.alumno_id = $1
        ORDER BY p.anio_correspondiente DESC, p.mes_correspondiente DESC, p.created_at DESC
      `, [req.params.alumnoId]),

      query(`
        SELECT * FROM pago_comida_semanal
        WHERE alumno_id = $1
        ORDER BY semana_inicio DESC LIMIT 8
      `, [req.params.alumnoId]),
    ]);

    if (!alumno.rows[0]) return res.status(404).json({ error: 'Alumno no encontrado' });

    const pagosList = pagos.rows;
    const pendientesVencidos = pagosList.filter(p => ['pendiente', 'vencido'].includes(p.estado));
    const semaforoCfg = await getSemaforoConfig();

    res.json({
      alumno: alumno.rows[0],
      semaforo: semaforoAlumno(pendientesVencidos, semaforoCfg),
      saldo_pendiente: pendientesVencidos.reduce((s, p) => s + parseFloat(p.monto_total), 0),
      pagos: pagosList,
      comida_semanal: comida.rows,
    });
  } catch (err) { next(err); }
});

// ─── LISTAR PAGOS ─────────────────────────────────────────────────────────────

router.get('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { alumno_id, grupo_id, mes, anio, estado, concepto_id } = req.query;
    const m = parseInt(mes) || new Date().getMonth() + 1;
    const a = parseInt(anio) || new Date().getFullYear();

    const params = [m, a];
    let sql = `
      SELECT p.*,
             cp.nombre AS concepto_nombre, cp.tipo AS concepto_tipo,
             al.nombre_completo AS alumno_nombre, al.foto_url,
             g.nombre AS grupo_nombre, g.color_hex,
             u.nombre AS registrado_por_nombre
      FROM pagos p
      JOIN conceptos_pago cp ON p.concepto_id = cp.id
      JOIN alumnos al ON p.alumno_id = al.id
      JOIN grupos g ON al.grupo_id = g.id
      LEFT JOIN usuarios u ON p.registrado_por = u.id
      WHERE p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
    `;

    if (alumno_id) { params.push(alumno_id); sql += ` AND p.alumno_id = $${params.length}`; }
    if (grupo_id)  { params.push(grupo_id);  sql += ` AND al.grupo_id = $${params.length}`; }
    if (estado)    { params.push(estado);    sql += ` AND p.estado = $${params.length}`; }
    if (concepto_id) { params.push(concepto_id); sql += ` AND p.concepto_id = $${params.length}`; }

    sql += ' ORDER BY al.nombre_completo, cp.nombre';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── REGISTRAR PAGO ───────────────────────────────────────────────────────────

router.post('/', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const {
      alumno_id, concepto_id, monto, mes_correspondiente, anio_correspondiente,
      metodo_pago, referencia, notas, fecha_pago, aplicar_recargo,
    } = req.body;

    if (!alumno_id || !concepto_id || !monto)
      return res.status(400).json({ error: 'alumno_id, concepto_id y monto son obligatorios' });

    const m  = parseInt(mes_correspondiente)  || new Date().getMonth() + 1;
    const a  = parseInt(anio_correspondiente) || new Date().getFullYear();
    const cp = await query('SELECT * FROM conceptos_pago WHERE id = $1', [concepto_id]);
    if (!cp.rows[0]) return res.status(404).json({ error: 'Concepto no encontrado' });

    const base  = parseFloat(monto);
    const { monto_recargo, dias_atraso } = aplicar_recargo !== false
      ? calcularRecargo(cp.rows[0], m, a, base)
      : { monto_recargo: 0, dias_atraso: 0 };
    const total = +(base + monto_recargo).toFixed(2);
    const fechaLimite = cp.rows[0].dia_pago
      ? new Date(a, m - 1, cp.rows[0].dia_pago).toISOString().slice(0, 10)
      : null;

    const r = await query(`
      INSERT INTO pagos
        (alumno_id, concepto_id, monto_base, monto_recargo, monto_total, estado,
         mes_correspondiente, anio_correspondiente, fecha_limite, fecha_pago,
         metodo_pago, referencia, notas, dias_atraso, registrado_por)
      VALUES ($1,$2,$3,$4,$5,'pagado',$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *
    `, [alumno_id, concepto_id, base, monto_recargo, total,
        m, a, fechaLimite, fecha_pago || new Date().toISOString(),
        metodo_pago || 'efectivo', referencia || null, notas || null,
        dias_atraso, req.user.id]);

    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── GENERAR CARGOS PENDIENTES DEL MES ────────────────────────────────────────
// POST /pagos/generar-mes — crea registros 'pendiente' para todos los alumnos activos

router.post('/generar-mes', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const m = parseInt(req.body.mes)  || new Date().getMonth() + 1;
    const a = parseInt(req.body.anio) || new Date().getFullYear();

    // Conceptos mensuales
    const conceptos = await query(
      `SELECT * FROM conceptos_pago WHERE es_mensual = true AND activo = true`
    );
    // Alumnos con su nivel
    const alumnos = await query(`
      SELECT a.id, g.nivel_codigo
      FROM alumnos a
      JOIN grupos g ON a.grupo_id = g.id
      WHERE a.deleted_at IS NULL
    `);

    let creados = 0;
    for (const cp of conceptos.rows) {
      const fechaLimite = cp.dia_pago
        ? new Date(a, m - 1, cp.dia_pago).toISOString().slice(0, 10)
        : null;

      for (const al of alumnos.rows) {
        const existe = await query(
          `SELECT 1 FROM pagos WHERE alumno_id=$1 AND concepto_id=$2
           AND mes_correspondiente=$3 AND anio_correspondiente=$4`,
          [al.id, cp.id, m, a]
        );
        if (existe.rows.length) continue;

        const monto = await obtenerMontoConcepto(cp.id, al.nivel_codigo, cp.monto);

        await query(`
          INSERT INTO pagos
            (alumno_id, concepto_id, monto_base, monto_recargo, monto_total,
             estado, mes_correspondiente, anio_correspondiente, fecha_limite, registrado_por)
          VALUES ($1,$2,$3,0,$3,'pendiente',$4,$5,$6,$7)
        `, [al.id, cp.id, monto, m, a, fechaLimite, req.user.id]);
        creados++;
      }
    }

    // Extensión mensual: generar cargos para alumnos con extensión activa
    const conceptoExt = await query(
      `SELECT * FROM conceptos_pago WHERE tipo = 'extension' AND es_mensual = true AND activo = true LIMIT 1`
    );
    if (conceptoExt.rows[0]) {
      const cpExt = conceptoExt.rows[0];
      const alumnosExt = await query(`
        SELECT a.id, g.nivel_codigo
        FROM alumnos a
        JOIN grupos g ON a.grupo_id = g.id
        JOIN config_horario_alumno cha ON cha.alumno_id = a.id AND cha.tiene_extension = true
        WHERE a.deleted_at IS NULL
      `);
      const fechaLimiteExt = cpExt.dia_pago
        ? new Date(a, m - 1, cpExt.dia_pago).toISOString().slice(0, 10)
        : null;

      for (const al of alumnosExt.rows) {
        const existe = await query(
          `SELECT 1 FROM pagos WHERE alumno_id=$1 AND concepto_id=$2
           AND mes_correspondiente=$3 AND anio_correspondiente=$4`,
          [al.id, cpExt.id, m, a]
        );
        if (existe.rows.length) continue;

        const monto = await obtenerMontoConcepto(cpExt.id, al.nivel_codigo, cpExt.monto);

        await query(`
          INSERT INTO pagos
            (alumno_id, concepto_id, monto_base, monto_recargo, monto_total,
             estado, mes_correspondiente, anio_correspondiente, fecha_limite, registrado_por)
          VALUES ($1,$2,$3,0,$3,'pendiente',$4,$5,$6,$7)
        `, [al.id, cpExt.id, monto, m, a, fechaLimiteExt, req.user.id]);
        creados++;
      }
    }

    res.json({ ok: true, creados });
  } catch (err) { next(err); }
});

// ─── COMPROBANTES POR CONFIRMAR — DIRECTORA ──────────────────────────────────
// GET /pagos/por-confirmar (DEBE estar antes de /:id para que Express no lo confunda)

router.get('/por-confirmar', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT p.id, p.alumno_id, p.concepto_id, p.monto_base, p.monto_recargo, p.monto_total,
             p.mes_correspondiente, p.anio_correspondiente, p.referencia, p.metodo_pago,
             p.comprobante_url, p.comprobante_fecha,
             al.nombre_completo AS alumno_nombre, al.foto_url,
             g.nombre AS grupo_nombre, g.color_hex,
             cp.nombre AS concepto_nombre, cp.tipo AS concepto_tipo,
             upad.nombre AS subido_por_nombre
      FROM pagos p
      JOIN alumnos al ON p.alumno_id = al.id
      JOIN grupos g ON al.grupo_id = g.id
      JOIN conceptos_pago cp ON p.concepto_id = cp.id
      LEFT JOIN usuarios upad ON p.comprobante_subido_por = upad.id
      WHERE p.estado = 'por_confirmar'
      ORDER BY p.comprobante_fecha ASC
    `);
    res.json(result.rows);
  } catch (err) { next(err); }
});

// ─── ACTUALIZAR PAGO ──────────────────────────────────────────────────────────

router.put('/:id', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { estado, monto_recargo, metodo_pago, referencia, notas, fecha_pago } = req.body;

    const pago = await query('SELECT * FROM pagos WHERE id = $1', [req.params.id]);
    if (!pago.rows[0]) return res.status(404).json({ error: 'Pago no encontrado' });

    const nuevoRecargo = monto_recargo !== undefined
      ? parseFloat(monto_recargo)
      : parseFloat(pago.rows[0].monto_recargo);
    const total = +(parseFloat(pago.rows[0].monto_base) + nuevoRecargo).toFixed(2);

    await query(`
      UPDATE pagos SET
        estado        = COALESCE($1, estado),
        monto_recargo = $2,
        monto_total   = $3,
        metodo_pago   = COALESCE($4, metodo_pago),
        referencia    = COALESCE($5, referencia),
        notas         = COALESCE($6, notas),
        fecha_pago    = COALESCE($7, fecha_pago),
        updated_at    = NOW()
      WHERE id = $8
    `, [estado, nuevoRecargo, total, metodo_pago, referencia, notas,
        fecha_pago, req.params.id]);

    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query(`UPDATE pagos SET estado = 'cancelado', updated_at = NOW() WHERE id = $1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// ─── COMIDA SEMANAL ───────────────────────────────────────────────────────────

router.get('/comida', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    // Lunes de la semana actual
    const hoy = new Date();
    const dia = hoy.getDay();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - (dia === 0 ? 6 : dia - 1));
    const semanaInicio = lunes.toISOString().slice(0, 10);

    const result = await query(`
      SELECT pcs.*,
             a.nombre_completo AS alumno_nombre, a.foto_url,
             g.nombre AS grupo_nombre, g.color_hex
      FROM pago_comida_semanal pcs
      JOIN alumnos a ON pcs.alumno_id = a.id
      JOIN grupos g ON a.grupo_id = g.id
      WHERE pcs.semana_inicio = $1
      ORDER BY g.nombre, a.nombre_completo
    `, [semanaInicio]);

    res.json({ semana_inicio: semanaInicio, pagos: result.rows });
  } catch (err) { next(err); }
});

router.post('/comida', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { alumno_id, semana_inicio, monto, metodo_pago } = req.body;
    if (!alumno_id || !semana_inicio)
      return res.status(400).json({ error: 'alumno_id y semana_inicio son obligatorios' });

    const r = await query(`
      INSERT INTO pago_comida_semanal (alumno_id, semana_inicio, estado, monto, fecha_pago, servicio_activo)
      VALUES ($1, $2, 'pagado', $3, NOW(), true)
      ON CONFLICT (alumno_id, semana_inicio)
      DO UPDATE SET estado = 'pagado', monto = $3, fecha_pago = NOW(), servicio_activo = true
      RETURNING *
    `, [alumno_id, semana_inicio, monto || 0]);
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

// ─── HISTORIAL COMIDA POR MES ─────────────────────────────────────────────────
// GET /pagos/comida/historial?mes=5&anio=2026&grupo_id=...

router.get('/comida/historial', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { mes, anio, grupo_id } = req.query;
    const m = parseInt(mes) || new Date().getMonth() + 1;
    const a = parseInt(anio) || new Date().getFullYear();

    // Primer y último día del mes
    const fechaInicio = new Date(a, m - 1, 1).toISOString().slice(0, 10);
    const fechaFin    = new Date(a, m, 0).toISOString().slice(0, 10);

    const params = [fechaInicio, fechaFin];
    let filtroGrupo = '';
    if (grupo_id) { params.push(grupo_id); filtroGrupo = ` AND g.id = $${params.length}`; }

    const result = await query(`
      SELECT pcs.*,
             a.nombre_completo AS alumno_nombre, a.foto_url,
             g.nombre AS grupo_nombre, g.color_hex
      FROM pago_comida_semanal pcs
      JOIN alumnos a ON pcs.alumno_id = a.id
      JOIN grupos g ON a.grupo_id = g.id
      WHERE pcs.semana_inicio BETWEEN $1 AND $2
        ${filtroGrupo}
      ORDER BY pcs.semana_inicio DESC, g.nombre, a.nombre_completo
    `, params);

    // Totales del mes
    const totalesResult = await query(`
      SELECT
        COUNT(*) AS total_registros,
        COALESCE(SUM(monto) FILTER (WHERE estado = 'pagado'), 0) AS recaudado,
        COUNT(DISTINCT alumno_id) AS alumnos_unicos
      FROM pago_comida_semanal
      WHERE semana_inicio BETWEEN $1 AND $2
    `, [fechaInicio, fechaFin]);

    res.json({
      mes: m, anio: a,
      totales: totalesResult.rows[0],
      registros: result.rows,
    });
  } catch (err) { next(err); }
});

// ─── SEGMENTACIÓN DE SERVICIOS ────────────────────────────────────────────────
// GET /pagos/segmentacion — alumnos agrupados por servicios activos

router.get('/segmentacion', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const ciclo = await query(
      `SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1`
    );
    const cicloId = ciclo.rows[0]?.id;

    const alumnos = await query(`
      SELECT
        a.id, a.nombre_completo, a.foto_url,
        g.nombre AS grupo_nombre, g.color_hex, g.nivel,
        cha.tiene_extension,
        cha.hora_salida_extension,
        EXISTS(
          SELECT 1 FROM pago_comida_semanal pcs
          WHERE pcs.alumno_id = a.id
            AND pcs.semana_inicio >= date_trunc('month', CURRENT_DATE)::date
            AND pcs.estado = 'pagado'
        ) AS tiene_comida_activa,
        (
          SELECT cp.nombre FROM pagos p
          JOIN conceptos_pago cp ON cp.id = p.concepto_id
          WHERE p.alumno_id = a.id
            AND cp.tipo = 'extension'
            AND p.estado IN ('pagado','pendiente')
            AND p.mes_correspondiente = EXTRACT(MONTH FROM CURRENT_DATE)
            AND p.anio_correspondiente = EXTRACT(YEAR  FROM CURRENT_DATE)
          LIMIT 1
        ) AS tipo_extension_activa
      FROM alumnos a
      JOIN grupos g ON a.grupo_id = g.id
      LEFT JOIN config_horario_alumno cha ON cha.alumno_id = a.id AND cha.activo = true
      WHERE a.deleted_at IS NULL
        AND g.activo = true
        ${cicloId ? 'AND g.ciclo_id = $1' : ''}
      ORDER BY g.nombre, a.nombre_completo
    `, cicloId ? [cicloId] : []);

    // Agrupar por tipo de servicio
    const regulares   = [];
    const conExtension = [];
    const conComida   = [];
    const conAmbos    = [];

    alumnos.rows.forEach(al => {
      const ext   = !!al.tiene_extension;
      const comida = !!al.tiene_comida_activa;
      if (ext && comida) conAmbos.push(al);
      else if (ext)      conExtension.push(al);
      else if (comida)   conComida.push(al);
      else               regulares.push(al);
    });

    res.json({
      total: alumnos.rows.length,
      regulares:    { count: regulares.length,    alumnos: regulares },
      con_extension:{ count: conExtension.length, alumnos: conExtension },
      con_comida:   { count: conComida.length,    alumnos: conComida },
      con_ambos:    { count: conAmbos.length,     alumnos: conAmbos },
    });
  } catch (err) { next(err); }
});

// ─── EXPORTACIÓN CONTABLE EXCEL ───────────────────────────────────────────────
// GET /pagos/exportar?mes=5&anio=2026&estado=&concepto_id=&grupo_id=

router.get('/exportar', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { mes, anio, estado, concepto_id, grupo_id } = req.query;
    const m = parseInt(mes) || new Date().getMonth() + 1;
    const a = parseInt(anio) || new Date().getFullYear();

    const MESES_NOMBRE = ['', 'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const nombreMes = MESES_NOMBRE[m];

    // ── Pagos regulares ──
    const params = [m, a];
    let sql = `
      SELECT p.*,
             cp.nombre AS concepto_nombre, cp.tipo AS concepto_tipo,
             al.nombre_completo AS alumno_nombre,
             g.nombre AS grupo_nombre, g.nivel,
             u.nombre AS registrado_por_nombre
      FROM pagos p
      JOIN conceptos_pago cp ON p.concepto_id = cp.id
      JOIN alumnos al ON p.alumno_id = al.id
      JOIN grupos g ON al.grupo_id = g.id
      LEFT JOIN usuarios u ON p.registrado_por = u.id
      WHERE p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
    `;
    if (estado)      { params.push(estado);      sql += ` AND p.estado = $${params.length}`; }
    if (concepto_id) { params.push(concepto_id); sql += ` AND p.concepto_id = $${params.length}`; }
    if (grupo_id)    { params.push(grupo_id);    sql += ` AND g.id = $${params.length}`; }
    sql += ' ORDER BY g.nombre, al.nombre_completo, cp.nombre';

    const pagosResult = await query(sql, params);
    const pagos = pagosResult.rows;

    // ── Comida semanal del mes ──
    const fechaInicio = new Date(a, m - 1, 1).toISOString().slice(0, 10);
    const fechaFin    = new Date(a, m, 0).toISOString().slice(0, 10);
    const comidaResult = await query(`
      SELECT pcs.*, a.nombre_completo AS alumno_nombre, g.nombre AS grupo_nombre
      FROM pago_comida_semanal pcs
      JOIN alumnos a ON pcs.alumno_id = a.id
      JOIN grupos g ON a.grupo_id = g.id
      WHERE pcs.semana_inicio BETWEEN $1 AND $2
      ORDER BY pcs.semana_inicio, g.nombre, a.nombre_completo
    `, [fechaInicio, fechaFin]);

    // ── Construir Excel ──
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Happy School';
    workbook.created = new Date();

    const HEADER_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
    const HEADER_FONT = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    const SUBTOTAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

    const ESTADO_LABEL = { pagado: 'Pagado', pendiente: 'Pendiente', vencido: 'Vencido', cancelado: 'Cancelado' };

    // ── Hoja 1: Detalle de Pagos ──
    const wsDetalle = workbook.addWorksheet(`Pagos ${nombreMes} ${a}`);

    wsDetalle.columns = [
      { header: 'Alumno',          key: 'alumno',    width: 28 },
      { header: 'Grupo',           key: 'grupo',     width: 16 },
      { header: 'Nivel',           key: 'nivel',     width: 10 },
      { header: 'Concepto',        key: 'concepto',  width: 24 },
      { header: 'Tipo',            key: 'tipo',      width: 12 },
      { header: 'Estado',          key: 'estado',    width: 12 },
      { header: 'Monto Base',      key: 'base',      width: 14 },
      { header: 'Recargo',         key: 'recargo',   width: 12 },
      { header: 'Total',           key: 'total',     width: 14 },
      { header: 'Método Pago',     key: 'metodo',    width: 14 },
      { header: 'Fecha Pago',      key: 'fecha',     width: 14 },
      { header: 'Referencia',      key: 'ref',       width: 18 },
      { header: 'Registrado por',  key: 'usuario',   width: 22 },
      { header: 'Notas',           key: 'notas',     width: 30 },
    ];

    // Estilo encabezado
    const hdr1 = wsDetalle.getRow(1);
    hdr1.font = HEADER_FONT;
    hdr1.fill = HEADER_FILL;
    hdr1.alignment = { horizontal: 'center', vertical: 'middle' };
    hdr1.height = 18;

    // Colores por estado
    const ESTADO_COLOR = {
      pagado:    'FFD1FAE5',
      pendiente: 'FFFEF9C3',
      vencido:   'FFFEE2E2',
      cancelado: 'FFF3F4F6',
    };

    let totalRecaudado = 0, totalRecargos = 0, totalPendiente = 0, totalVencido = 0;

    pagos.forEach(p => {
      const row = wsDetalle.addRow({
        alumno:   p.alumno_nombre,
        grupo:    p.grupo_nombre,
        nivel:    p.nivel || '',
        concepto: p.concepto_nombre,
        tipo:     p.concepto_tipo,
        estado:   ESTADO_LABEL[p.estado] || p.estado,
        base:     parseFloat(p.monto_base),
        recargo:  parseFloat(p.monto_recargo),
        total:    parseFloat(p.monto_total),
        metodo:   p.metodo_pago || '',
        fecha:    p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '',
        ref:      p.referencia || '',
        usuario:  p.registrado_por_nombre || '',
        notas:    p.notas || '',
      });

      // Formato numérico
      ['base', 'recargo', 'total'].forEach(k => {
        const col = wsDetalle.getColumn(k);
        row.getCell(col.number).numFmt = '"$"#,##0.00';
      });

      // Color por estado
      const fgColor = ESTADO_COLOR[p.estado] || 'FFFFFFFF';
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: fgColor } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      });

      if (p.estado === 'pagado')    { totalRecaudado += parseFloat(p.monto_total); totalRecargos += parseFloat(p.monto_recargo); }
      if (p.estado === 'pendiente') totalPendiente += parseFloat(p.monto_total);
      if (p.estado === 'vencido')   totalVencido   += parseFloat(p.monto_total);
    });

    // Fila totales
    const totalRow = wsDetalle.addRow({
      alumno: 'TOTALES', estado: '',
      base: '', recargo: totalRecargos, total: totalRecaudado + totalPendiente + totalVencido,
    });
    totalRow.font = { bold: true, size: 10 };
    totalRow.fill = SUBTOTAL_FILL;
    const tcol = wsDetalle.getColumn('recargo');
    totalRow.getCell(tcol.number).numFmt = '"$"#,##0.00';
    const ttcol = wsDetalle.getColumn('total');
    totalRow.getCell(ttcol.number).numFmt = '"$"#,##0.00';

    // ── Hoja 2: Resumen por Concepto ──
    const wsResumen = workbook.addWorksheet('Resumen por Concepto');
    wsResumen.columns = [
      { header: 'Concepto',   key: 'concepto',   width: 26 },
      { header: 'Tipo',       key: 'tipo',        width: 14 },
      { header: 'Pagados',    key: 'pagados',     width: 10 },
      { header: 'Pendientes', key: 'pendientes',  width: 12 },
      { header: 'Vencidos',   key: 'vencidos',    width: 10 },
      { header: 'Recaudado',  key: 'recaudado',   width: 16 },
      { header: 'Por Cobrar', key: 'por_cobrar',  width: 16 },
      { header: 'Vencido $',  key: 'vencido_monto', width: 14 },
    ];
    const hdr2 = wsResumen.getRow(1);
    hdr2.font = HEADER_FONT;
    hdr2.fill = HEADER_FILL;
    hdr2.alignment = { horizontal: 'center', vertical: 'middle' };
    hdr2.height = 18;

    const resumenMap = new Map();
    pagos.forEach(p => {
      const k = p.concepto_nombre;
      if (!resumenMap.has(k)) resumenMap.set(k, { concepto: k, tipo: p.concepto_tipo, pagados: 0, pendientes: 0, vencidos: 0, recaudado: 0, por_cobrar: 0, vencido_monto: 0 });
      const r = resumenMap.get(k);
      const monto = parseFloat(p.monto_total);
      if (p.estado === 'pagado')    { r.pagados++;    r.recaudado    += monto; }
      if (p.estado === 'pendiente') { r.pendientes++; r.por_cobrar   += monto; }
      if (p.estado === 'vencido')   { r.vencidos++;   r.vencido_monto += monto; }
    });

    resumenMap.forEach(r => {
      const row = wsResumen.addRow(r);
      ['recaudado', 'por_cobrar', 'vencido_monto'].forEach(k => {
        row.getCell(wsResumen.getColumn(k).number).numFmt = '"$"#,##0.00';
      });
      row.eachCell(cell => {
        cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
      });
    });

    // Fila totales resumen
    const tr2 = wsResumen.addRow({
      concepto: 'TOTAL', tipo: '',
      pagados: pagos.filter(p=>p.estado==='pagado').length,
      pendientes: pagos.filter(p=>p.estado==='pendiente').length,
      vencidos: pagos.filter(p=>p.estado==='vencido').length,
      recaudado: totalRecaudado, por_cobrar: totalPendiente, vencido_monto: totalVencido,
    });
    tr2.font = { bold: true, size: 10 };
    tr2.fill = SUBTOTAL_FILL;
    ['recaudado', 'por_cobrar', 'vencido_monto'].forEach(k => {
      tr2.getCell(wsResumen.getColumn(k).number).numFmt = '"$"#,##0.00';
    });

    // ── Hoja 3: Comida Semanal (si hay datos) ──
    if (comidaResult.rows.length > 0) {
      const wsComida = workbook.addWorksheet('Comida Semanal');
      wsComida.columns = [
        { header: 'Semana',   key: 'semana',  width: 14 },
        { header: 'Alumno',   key: 'alumno',  width: 28 },
        { header: 'Grupo',    key: 'grupo',   width: 16 },
        { header: 'Estado',   key: 'estado',  width: 12 },
        { header: 'Monto',    key: 'monto',   width: 12 },
        { header: 'Fecha Pago', key: 'fecha', width: 14 },
      ];
      const hdr3 = wsComida.getRow(1);
      hdr3.font = HEADER_FONT;
      hdr3.fill = HEADER_FILL;
      hdr3.alignment = { horizontal: 'center', vertical: 'middle' };
      hdr3.height = 18;

      let totalComida = 0;
      comidaResult.rows.forEach(r => {
        const row = wsComida.addRow({
          semana: r.semana_inicio,
          alumno: r.alumno_nombre,
          grupo:  r.grupo_nombre,
          estado: ESTADO_LABEL[r.estado] || r.estado,
          monto:  parseFloat(r.monto || 0),
          fecha:  r.fecha_pago ? new Date(r.fecha_pago).toLocaleDateString('es-MX') : '',
        });
        row.getCell(wsComida.getColumn('monto').number).numFmt = '"$"#,##0.00';
        row.eachCell(cell => {
          cell.border = { bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } } };
        });
        totalComida += parseFloat(r.monto || 0);
      });
      const trc = wsComida.addRow({ semana: 'TOTAL', monto: totalComida });
      trc.font = { bold: true }; trc.fill = SUBTOTAL_FILL;
      trc.getCell(wsComida.getColumn('monto').number).numFmt = '"$"#,##0.00';
    }

    // ── Enviar respuesta ──
    const filename = `pagos-${nombreMes.toLowerCase()}-${a}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// ─── COMPROBANTE COMIDA SEMANAL ───────────────────────────────────────────────
// PATCH /pagos/comida/:id/comprobante
// body (multipart): foto? (file) + metodo_pago_comida + notas_comida
// Sin foto: solo actualiza metodo (efectivo, efectivo_lunes)
// Con foto: sube imagen a Cloudinary y guarda URL

router.patch('/comida/:id/comprobante', authorize('directora', 'administrativo'),
  uploadMemory.single('foto'), async (req, res, next) => {
    try {
      const { metodo_pago_comida = 'efectivo', notas_comida } = req.body;

      const METODOS_VALIDOS = ['efectivo', 'efectivo_lunes', 'transferencia'];
      if (!METODOS_VALIDOS.includes(metodo_pago_comida)) {
        return res.status(400).json({ error: `metodo_pago_comida debe ser uno de: ${METODOS_VALIDOS.join(', ')}` });
      }

      let comprobante_url = null;

      if (req.file) {
        // Subir foto comprobante a Cloudinary
        const resultado = await uploadToCloudinary(req.file.buffer, {
          folder: 'happyschool/comprobantes_comida',
          resource_type: 'image',
        });
        comprobante_url = resultado.url;
      }

      // Verificar que el registro existe
      const check = await query('SELECT id FROM pago_comida_semanal WHERE id = $1', [req.params.id]);
      if (!check.rows[0]) return res.status(404).json({ error: 'Registro de comida no encontrado' });

      await query(`
        UPDATE pago_comida_semanal SET
          metodo_pago_comida = $1,
          notas_comida       = COALESCE($2, notas_comida),
          comprobante_url    = CASE WHEN $3::text IS NOT NULL THEN $3::text ELSE comprobante_url END,
          updated_at         = NOW()
        WHERE id = $4
      `, [metodo_pago_comida, notas_comida || null, comprobante_url, req.params.id]);

      const updated = await query(
        'SELECT id, metodo_pago_comida, comprobante_url, notas_comida FROM pago_comida_semanal WHERE id = $1',
        [req.params.id]
      );
      res.json({ ok: true, ...updated.rows[0] });
    } catch (err) { next(err); }
  }
);

// ─── COMPROBANTE DE PAGO — PADRE SUBE ────────────────────────────────────────
// POST /pagos/:id/comprobante
// Padre sube imagen de comprobante de transferencia para un pago pendiente/vencido

router.post('/:id/comprobante', uploadMemory.single('foto'), async (req, res, next) => {
  try {
    if (req.user.rol_principal !== 'padre') {
      return res.status(403).json({ error: 'Solo padres pueden subir comprobantes' });
    }

    const { referencia } = req.body;

    // Verificar que el pago existe y está pendiente/vencido
    const pagoRes = await query(
      'SELECT id, alumno_id, estado FROM pagos WHERE id = $1', [req.params.id]
    );
    if (!pagoRes.rows[0]) return res.status(404).json({ error: 'Pago no encontrado' });

    const pago = pagoRes.rows[0];
    if (!['pendiente', 'vencido'].includes(pago.estado)) {
      return res.status(400).json({ error: 'Solo se pueden subir comprobantes para pagos pendientes o vencidos' });
    }

    // Verificar que el alumno es hijo del padre
    const check = await query(
      `SELECT 1 FROM padres p
       JOIN alumno_padre ap ON ap.padre_id = p.id
       WHERE p.usuario_id = $1 AND ap.alumno_id = $2`,
      [req.user.id, pago.alumno_id]
    );
    if (!check.rows.length) return res.status(403).json({ error: 'Acceso denegado' });

    if (!req.file) return res.status(400).json({ error: 'Debes adjuntar una imagen del comprobante' });

    // Subir a Cloudinary
    const resultado = await uploadToCloudinary(req.file.buffer, {
      folder: 'happyschool/comprobantes_pago',
      resource_type: 'image',
    });

    await query(`
      UPDATE pagos SET
        estado = 'por_confirmar',
        comprobante_url = $1,
        comprobante_fecha = NOW(),
        comprobante_subido_por = $2,
        metodo_pago = 'transferencia',
        referencia = COALESCE($3, referencia),
        updated_at = NOW()
      WHERE id = $4
    `, [resultado.url, req.user.id, referencia || null, req.params.id]);

    res.json({ ok: true, estado: 'por_confirmar', comprobante_url: resultado.url });
  } catch (err) { next(err); }
});

// ─── CONFIRMAR/RECHAZAR COMPROBANTE — DIRECTORA ──────────────────────────────
// PATCH /pagos/:id/confirmar
// body: { accion: 'aprobar' | 'rechazar', nota?: string }

router.patch('/:id/confirmar', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { accion, nota } = req.body;
    if (!['aprobar', 'rechazar'].includes(accion)) {
      return res.status(400).json({ error: 'accion debe ser "aprobar" o "rechazar"' });
    }

    const pagoRes = await query('SELECT id, estado FROM pagos WHERE id = $1', [req.params.id]);
    if (!pagoRes.rows[0]) return res.status(404).json({ error: 'Pago no encontrado' });
    if (pagoRes.rows[0].estado !== 'por_confirmar') {
      return res.status(400).json({ error: 'Este pago no está pendiente de confirmación' });
    }

    if (accion === 'aprobar') {
      await query(`
        UPDATE pagos SET
          estado = 'pagado',
          fecha_pago = NOW(),
          confirmado_por = $1,
          confirmado_at = NOW(),
          updated_at = NOW()
        WHERE id = $2
      `, [req.user.id, req.params.id]);
      res.json({ ok: true, estado: 'pagado' });
    } else {
      await query(`
        UPDATE pagos SET
          estado = 'pendiente',
          comprobante_url = NULL,
          comprobante_fecha = NULL,
          comprobante_subido_por = NULL,
          rechazo_nota = $1,
          confirmado_por = $2,
          confirmado_at = NOW(),
          updated_at = NOW()
        WHERE id = $3
      `, [nota || 'Comprobante rechazado', req.user.id, req.params.id]);
      res.json({ ok: true, estado: 'pendiente', rechazo_nota: nota || 'Comprobante rechazado' });
    }
  } catch (err) { next(err); }
});

// ─── RECIBO PDF POR PAGO ──────────────────────────────────────────────────────
// GET /pagos/:id/recibo  → descarga PDF del recibo

router.get('/:id/recibo', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const result = await query(`
      SELECT p.*,
             cp.nombre AS concepto_nombre, cp.tipo AS concepto_tipo,
             al.nombre_completo AS alumno_nombre, al.foto_url,
             g.nombre AS grupo_nombre,
             u.nombre AS registrado_por_nombre,
             t.nombre_completo AS tutor_nombre, t.telefono AS tutor_telefono
      FROM pagos p
      JOIN conceptos_pago cp ON p.concepto_id = cp.id
      JOIN alumnos al ON p.alumno_id = al.id
      JOIN grupos g ON al.grupo_id = g.id
      LEFT JOIN usuarios u ON p.registrado_por = u.id
      LEFT JOIN alumno_padre ap ON ap.alumno_id = al.id AND ap.es_tutor_principal = true
      LEFT JOIN padres t ON t.id = ap.padre_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Pago no encontrado' });
    const p = result.rows[0];

    // ── Construir PDF ──
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 350]); // A5 apaisado aprox
    const { width, height } = page.getSize();

    const fontBold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontNormal = await pdfDoc.embedFont(StandardFonts.Helvetica);

    const C = {
      purple: rgb(0.55, 0.27, 0.87),
      purpleLight: rgb(0.82, 0.70, 0.97),
      green:  rgb(0.13, 0.67, 0.45),
      gray:   rgb(0.40, 0.40, 0.40),
      dark:   rgb(0.10, 0.10, 0.10),
      white:  rgb(1, 1, 1),
      bg:     rgb(0.97, 0.95, 1.00),
    };

    const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);

    // Sanitizar strings para Helvetica (solo Latin-1 básico, sin acentos problemáticos)
    const safe = (s) => {
      if (!s) return '';
      return String(s)
        .replace(/\u2014|\u2013/g, '-')   // em dash, en dash -> -
        .replace(/\u00e1/g, 'a').replace(/\u00e9/g, 'e')
        .replace(/\u00ed/g, 'i').replace(/\u00f3/g, 'o')
        .replace(/\u00fa/g, 'u').replace(/\u00fc/g, 'u')
        .replace(/\u00c1/g, 'A').replace(/\u00c9/g, 'E')
        .replace(/\u00cd/g, 'I').replace(/\u00d3/g, 'O')
        .replace(/\u00da/g, 'U').replace(/\u00dc/g, 'U')
        .replace(/\u00f1/g, 'n').replace(/\u00d1/g, 'N')
        .replace(/[^\x20-\x7E]/g, '?');  // cualquier otro no-ASCII -> ?
    };

    const fmtFecha = (iso) => {
      if (!iso) return '-';
      return safe(new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' }));
    };

    const MESES_ES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    // Fondo encabezado
    page.drawRectangle({ x: 0, y: height - 70, width, height: 70, color: C.purple });

    // Título
    page.drawText('Happy School', { x: 24, y: height - 28, size: 20, font: fontBold, color: C.white });
    page.drawText('RECIBO DE PAGO', { x: 24, y: height - 48, size: 9, font: fontNormal, color: C.purpleLight });

    // Folio — últimos 8 chars del UUID en mayúsculas
    const folio = `#${String(p.id).replace(/-/g, '').slice(-8).toUpperCase()}`;
    const folioW = fontBold.widthOfTextAtSize(folio, 18);
    page.drawText(folio, { x: width - folioW - 24, y: height - 38, size: 18, font: fontBold, color: C.white });
    page.drawText('FOLIO', { x: width - folioW - 24, y: height - 54, size: 7, font: fontNormal, color: C.purpleLight });

    // Fondo cuerpo
    page.drawRectangle({ x: 0, y: 0, width, height: height - 70, color: C.bg });

    // Sección alumno
    let y = height - 95;
    page.drawText('ALUMNO', { x: 24, y, size: 7, font: fontBold, color: C.gray });
    y -= 16;
    page.drawText(safe(p.alumno_nombre), { x: 24, y, size: 13, font: fontBold, color: C.dark });
    y -= 14;
    page.drawText(safe(p.grupo_nombre), { x: 24, y, size: 9, font: fontNormal, color: C.gray });

    // Línea divisora
    y -= 14;
    page.drawLine({ start: { x: 24, y }, end: { x: width - 24, y }, thickness: 0.5, color: C.purpleLight });

    // Concepto
    y -= 20;
    page.drawText('CONCEPTO', { x: 24, y, size: 7, font: fontBold, color: C.gray });
    y -= 14;
    page.drawText(safe(p.concepto_nombre), { x: 24, y, size: 11, font: fontBold, color: C.dark });
    page.drawText(`${MESES_ES[p.mes_correspondiente]} ${p.anio_correspondiente}`, {
      x: 24, y: y - 12, size: 9, font: fontNormal, color: C.gray,
    });

    // Montos (columna derecha)
    const xRight = width - 150;
    let yR = height - 95;
    page.drawText('DETALLE', { x: xRight, y: yR, size: 7, font: fontBold, color: C.gray });
    yR -= 16;
    page.drawText('Monto base:', { x: xRight, y: yR, size: 8, font: fontNormal, color: C.gray });
    page.drawText(fmt(p.monto_base), { x: xRight + 80, y: yR, size: 8, font: fontBold, color: C.dark });
    yR -= 14;
    if (parseFloat(p.monto_recargo) > 0) {
      page.drawText('Recargo:', { x: xRight, y: yR, size: 8, font: fontNormal, color: C.gray });
      page.drawText(fmt(p.monto_recargo), { x: xRight + 80, y: yR, size: 8, font: fontBold, color: rgb(0.85, 0.2, 0.2) });
      yR -= 14;
    }
    page.drawLine({ start: { x: xRight, y: yR + 4 }, end: { x: width - 24, y: yR + 4 }, thickness: 0.5, color: C.purpleLight });
    yR -= 4;
    page.drawText('TOTAL:', { x: xRight, y: yR, size: 10, font: fontBold, color: C.dark });
    const totalStr = fmt(p.monto_total);
    const totalW = fontBold.widthOfTextAtSize(totalStr, 14);
    page.drawText(totalStr, { x: width - 24 - totalW, y: yR, size: 14, font: fontBold, color: C.green });

    // Método y fecha
    yR -= 22;
    page.drawText('Método:', { x: xRight, y: yR, size: 8, font: fontNormal, color: C.gray });
    page.drawText(safe((p.metodo_pago || 'efectivo').toUpperCase()), { x: xRight + 60, y: yR, size: 8, font: fontBold, color: C.dark });
    yR -= 12;
    page.drawText('Fecha:', { x: xRight, y: yR, size: 8, font: fontNormal, color: C.gray });
    page.drawText(fmtFecha(p.fecha_pago), { x: xRight + 60, y: yR, size: 8, font: fontBold, color: C.dark });
    if (p.referencia) {
      yR -= 12;
      page.drawText('Ref:', { x: xRight, y: yR, size: 8, font: fontNormal, color: C.gray });
      page.drawText(safe(p.referencia), { x: xRight + 60, y: yR, size: 8, font: fontBold, color: C.dark });
    }

    // Sello PAGADO
    if (p.estado === 'pagado') {
      page.drawRectangle({ x: xRight - 4, y: yR - 28, width: 110, height: 22, color: rgb(0.13, 0.67, 0.45), borderRadius: 4 });
      page.drawText('** PAGADO **', { x: xRight + 4, y: yR - 20, size: 10, font: fontBold, color: C.white });
    }

    // Pie
    page.drawRectangle({ x: 0, y: 0, width, height: 22, color: C.purple });
    const pieText = safe(`Happy School  |  Generado el ${new Date().toLocaleDateString('es-MX')}  |  Folio ${folio}`);
    page.drawText(pieText, { x: 24, y: 6, size: 7, font: fontNormal, color: C.white });

    // Nota tutor
    if (p.tutor_nombre) {
      page.drawText(safe(`Padre/Tutor: ${p.tutor_nombre}`), { x: 24, y: 28, size: 8, font: fontNormal, color: C.gray });
    }
    if (p.notas) {
      page.drawText(safe(`Notas: ${p.notas.substring(0, 80)}`), { x: 24, y: 16, size: 7, font: fontNormal, color: C.gray });
    }

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="recibo-${folio}.pdf"`);
    res.end(Buffer.from(pdfBytes));
  } catch (err) { next(err); }
});

// ─── ENVIAR RECIBO POR WHATSAPP ────────────────────────────────────────────────
// POST /pagos/:id/enviar   body: { canal: 'whatsapp' }

router.post('/:id/enviar', authorize('directora', 'administrativo'), async (req, res, next) => {
  try {
    const { canal = 'whatsapp' } = req.body;

    // Obtener pago + tutor con teléfono
    const result = await query(`
      SELECT p.*,
             cp.nombre AS concepto_nombre,
             al.nombre_completo AS alumno_nombre,
             g.nombre AS grupo_nombre,
             t.nombre_completo AS tutor_nombre,
             COALESCE(t.telefono_whatsapp, t.telefono) AS tutor_telefono
      FROM pagos p
      JOIN conceptos_pago cp ON p.concepto_id = cp.id
      JOIN alumnos al ON p.alumno_id = al.id
      JOIN grupos g ON al.grupo_id = g.id
      LEFT JOIN alumno_padre ap ON ap.alumno_id = al.id AND ap.es_tutor_principal = true
      LEFT JOIN padres t ON t.id = ap.padre_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!result.rows[0]) return res.status(404).json({ error: 'Pago no encontrado' });
    const p = result.rows[0];

    if (!p.tutor_telefono) return res.status(400).json({ error: 'El alumno no tiene tutor con teléfono registrado' });

    if (canal !== 'whatsapp') return res.status(400).json({ error: 'Canal no soportado. Usa: whatsapp' });

    const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n || 0);
    const MESES_ES = ['', 'Enero','Febrero','Marzo','Abril','Mayo','Junio',
      'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

    const baseUrl = process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
    const linkRecibo = `${baseUrl}/api/pagos/${p.id}/recibo`;
    const folio = `#${String(p.id).replace(/-/g, '').slice(-8).toUpperCase()}`;

    const mensajeDirecto = `🧾 *Recibo de Pago — Happy School*\n\n` +
      `Hola ${p.tutor_nombre || 'Estimado padre/madre'},\n` +
      `Adjuntamos el recibo de pago de *${p.alumno_nombre}*.\n\n` +
      `📋 *Concepto:* ${p.concepto_nombre}\n` +
      `📅 *Periodo:* ${MESES_ES[p.mes_correspondiente]} ${p.anio_correspondiente}\n` +
      `💰 *Total pagado:* ${fmt(p.monto_total)}\n` +
      `🔖 *Folio:* ${folio}\n\n` +
      `Descarga tu recibo: ${linkRecibo}\n\n` +
      `_Happy School — Donde los niños son felices_ 🌟`;

    const resultado = await whatsappService.enviarMensaje({
      telefono: p.tutor_telefono,
      mensajeDirecto,
      alumnoId: p.alumno_id,
    });

    if (resultado.omitido) return res.status(503).json({ error: 'WhatsApp no está activo o no configurado' });
    if (resultado.error) return res.status(500).json({ error: resultado.error });

    res.json({ ok: true, canal: 'whatsapp', destinatario: p.tutor_nombre, telefono: p.tutor_telefono });
  } catch (err) { next(err); }
});

module.exports = router;
