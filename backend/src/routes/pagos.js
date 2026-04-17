const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const { query } = require('../config/database');

router.use(authenticate);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcularRecargo(concepto, mes, anio) {
  if (!concepto.dia_recargo) return { monto_recargo: 0, dias_atraso: 0 };
  const hoy = new Date();
  const diaActual = hoy.getDate();
  const mesActual = hoy.getMonth() + 1;
  const anioActual = hoy.getFullYear();
  const montoPorDia = parseFloat(concepto.monto_recargo_dia) || 0;

  // Mes anterior o más → recargo desde el día de vencimiento hasta hoy
  if (anio < anioActual || (anio === anioActual && mes < mesActual)) {
    const fechaVencimiento = new Date(anio, mes - 1, concepto.dia_recargo);
    const diasAtraso = Math.max(0, Math.floor((hoy - fechaVencimiento) / 86400000));
    return { monto_recargo: +(diasAtraso * montoPorDia).toFixed(2), dias_atraso: diasAtraso };
  }
  // Mes actual → recargo si ya pasó el día de recargo
  if (mes === mesActual && anio === anioActual && diaActual >= concepto.dia_recargo) {
    const diasAtraso = diaActual - concepto.dia_recargo + 1;
    return { monto_recargo: +(diasAtraso * montoPorDia).toFixed(2), dias_atraso: diasAtraso };
  }
  return { monto_recargo: 0, dias_atraso: 0 };
}

function semaforoAlumno(pagos) {
  if (!pagos.length) return 'verde';
  const maxAtraso = Math.max(...pagos.map(p => p.dias_atraso || 0));
  const tieneVencido = pagos.some(p => p.estado === 'vencido');
  if (maxAtraso >= 60 || (tieneVencido && maxAtraso >= 30)) return 'suspendido';
  if (maxAtraso >= 30 || tieneVencido) return 'rojo';
  if (maxAtraso >= 1) return 'amarillo';
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
    const { nombre, descripcion, monto_base, tipo, es_mensual, es_recurrente,
            dia_pago, dia_recargo, monto_recargo_dia } = req.body;
    if (!nombre || !monto_base || !tipo)
      return res.status(400).json({ error: 'nombre, monto_base y tipo son obligatorios' });

    const r = await query(`
      INSERT INTO conceptos_pago
        (nombre, descripcion, monto_base, tipo, es_mensual, es_recurrente, dia_pago, dia_recargo, monto_recargo_dia)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *
    `, [nombre, descripcion || null, monto_base, tipo,
        es_mensual ?? false, es_recurrente ?? false,
        dia_pago || null, dia_recargo || null, monto_recargo_dia || 0]);
    res.status(201).json(r.rows[0]);
  } catch (err) { next(err); }
});

router.put('/conceptos/:id', authorize('directora'), async (req, res, next) => {
  try {
    const { nombre, descripcion, monto_base, tipo, es_mensual, es_recurrente,
            dia_pago, dia_recargo, monto_recargo_dia, activo } = req.body;
    await query(`
      UPDATE conceptos_pago SET
        nombre           = COALESCE($1, nombre),
        descripcion      = COALESCE($2, descripcion),
        monto_base       = COALESCE($3, monto_base),
        tipo             = COALESCE($4, tipo),
        es_mensual       = COALESCE($5, es_mensual),
        es_recurrente    = COALESCE($6, es_recurrente),
        dia_pago         = COALESCE($7, dia_pago),
        dia_recargo      = COALESCE($8, dia_recargo),
        monto_recargo_dia= COALESCE($9, monto_recargo_dia),
        activo           = COALESCE($10, activo),
        updated_at       = NOW()
      WHERE id = $11
    `, [nombre, descripcion, monto_base, tipo, es_mensual, es_recurrente,
        dia_pago, dia_recargo, monto_recargo_dia, activo, req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

router.delete('/conceptos/:id', authorize('directora'), async (req, res, next) => {
  try {
    await query('UPDATE conceptos_pago SET activo = false WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
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
        LEFT JOIN alumnos a ON a.grupo_id = g.id AND a.activo = true
        LEFT JOIN pagos p ON p.alumno_id = a.id
          AND p.mes_correspondiente = $1 AND p.anio_correspondiente = $2
        GROUP BY g.id, g.nombre, g.color_hex
        ORDER BY g.nombre
      `, [m, a]),

      query(`
        SELECT a.id, a.nombre_completo, a.foto_url,
          g.nombre AS grupo, g.color_hex,
          COUNT(p.id) AS pagos_vencidos,
          MAX(p.dias_atraso) AS max_dias_atraso,
          SUM(p.monto_total) AS deuda_total
        FROM alumnos a
        JOIN grupos g ON a.grupo_id = g.id
        JOIN pagos p ON p.alumno_id = a.id AND p.estado = 'vencido'
        WHERE a.activo = true
        GROUP BY a.id, a.nombre_completo, a.foto_url, g.nombre, g.color_hex
        ORDER BY max_dias_atraso DESC
        LIMIT 10
      `),
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
        `SELECT 1 FROM tutores WHERE usuario_id = $1 AND alumno_id = $2`,
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

    res.json({
      alumno: alumno.rows[0],
      semaforo: semaforoAlumno(pendientesVencidos),
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
      alumno_id, concepto_id, monto_base, mes_correspondiente, anio_correspondiente,
      metodo_pago, referencia, notas, fecha_pago, aplicar_recargo,
    } = req.body;

    if (!alumno_id || !concepto_id || !monto_base)
      return res.status(400).json({ error: 'alumno_id, concepto_id y monto_base son obligatorios' });

    const m  = parseInt(mes_correspondiente)  || new Date().getMonth() + 1;
    const a  = parseInt(anio_correspondiente) || new Date().getFullYear();
    const cp = await query('SELECT * FROM conceptos_pago WHERE id = $1', [concepto_id]);
    if (!cp.rows[0]) return res.status(404).json({ error: 'Concepto no encontrado' });

    const { monto_recargo, dias_atraso } = aplicar_recargo !== false
      ? calcularRecargo(cp.rows[0], m, a)
      : { monto_recargo: 0, dias_atraso: 0 };

    const base  = parseFloat(monto_base);
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

    const conceptos = await query(
      `SELECT * FROM conceptos_pago WHERE es_mensual = true AND activo = true`
    );
    const alumnos = await query(
      `SELECT id FROM alumnos WHERE activo = true`
    );

    let creados = 0;
    for (const cp of conceptos.rows) {
      const fechaLimite = cp.dia_pago
        ? new Date(a, m - 1, cp.dia_pago).toISOString().slice(0, 10)
        : null;

      for (const al of alumnos.rows) {
        // evitar duplicados
        const existe = await query(
          `SELECT 1 FROM pagos WHERE alumno_id=$1 AND concepto_id=$2
           AND mes_correspondiente=$3 AND anio_correspondiente=$4`,
          [al.id, cp.id, m, a]
        );
        if (existe.rows.length) continue;

        await query(`
          INSERT INTO pagos
            (alumno_id, concepto_id, monto_base, monto_recargo, monto_total,
             estado, mes_correspondiente, anio_correspondiente, fecha_limite, registrado_por)
          VALUES ($1,$2,$3,0,$3,'pendiente',$4,$5,$6,$7)
        `, [al.id, cp.id, cp.monto_base, m, a, fechaLimite, req.user.id]);
        creados++;
      }
    }
    res.json({ ok: true, creados });
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

module.exports = router;
