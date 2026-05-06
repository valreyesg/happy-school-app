const cron = require('node-cron');
const { query } = require('../config/database');

// Genera cargos pendientes automáticamente el día 1 de cada mes
async function generarCargosMensuales() {
  const hoy = new Date();
  const mes = hoy.getMonth() + 1;
  const anio = hoy.getFullYear();

  console.log(`[cargosMensualesJob] Generando cargos para ${mes}/${anio}...`);

  try {
    // 1. Conceptos mensuales activos
    const conceptos = await query(
      'SELECT * FROM conceptos_pago WHERE es_mensual = true AND activo = true'
    );

    // 2. Alumnos activos con su nivel
    const alumnos = await query(`
      SELECT a.id, g.nivel_codigo
      FROM alumnos a
      JOIN grupos g ON a.grupo_id = g.id
      WHERE a.deleted_at IS NULL
    `);

    let creados = 0;

    for (const cp of conceptos.rows) {
      const fechaLimite = cp.dia_pago
        ? new Date(anio, mes - 1, cp.dia_pago).toISOString().slice(0, 10)
        : null;

      for (const al of alumnos.rows) {
        // Evitar duplicados
        const existe = await query(
          `SELECT 1 FROM pagos WHERE alumno_id=$1 AND concepto_id=$2
           AND mes_correspondiente=$3 AND anio_correspondiente=$4`,
          [al.id, cp.id, mes, anio]
        );
        if (existe.rows.length) continue;

        // Obtener monto por nivel
        const montoResult = await query(
          'SELECT monto FROM precios_nivel WHERE concepto_id = $1 AND nivel_key = $2',
          [cp.id, al.nivel_codigo]
        );
        const monto = montoResult.rows[0]
          ? parseFloat(montoResult.rows[0].monto)
          : parseFloat(cp.monto);

        await query(`
          INSERT INTO pagos
            (alumno_id, concepto_id, monto_base, monto_recargo, monto_total,
             estado, mes_correspondiente, anio_correspondiente, fecha_limite, origen)
          VALUES ($1,$2,$3,0,$3,'pendiente',$4,$5,$6,'automatico')
        `, [al.id, cp.id, monto, mes, anio, fechaLimite]);
        creados++;
      }
    }

    // 3. Extensión mensual para alumnos con extensión activa
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
        ? new Date(anio, mes - 1, cpExt.dia_pago).toISOString().slice(0, 10)
        : null;

      for (const al of alumnosExt.rows) {
        const existe = await query(
          `SELECT 1 FROM pagos WHERE alumno_id=$1 AND concepto_id=$2
           AND mes_correspondiente=$3 AND anio_correspondiente=$4`,
          [al.id, cpExt.id, mes, anio]
        );
        if (existe.rows.length) continue;

        const montoResult = await query(
          'SELECT monto FROM precios_nivel WHERE concepto_id = $1 AND nivel_key = $2',
          [cpExt.id, al.nivel_codigo]
        );
        const monto = montoResult.rows[0]
          ? parseFloat(montoResult.rows[0].monto)
          : parseFloat(cpExt.monto);

        await query(`
          INSERT INTO pagos
            (alumno_id, concepto_id, monto_base, monto_recargo, monto_total,
             estado, mes_correspondiente, anio_correspondiente, fecha_limite, origen)
          VALUES ($1,$2,$3,0,$3,'pendiente',$4,$5,$6,'automatico')
        `, [al.id, cpExt.id, monto, mes, anio, fechaLimiteExt]);
        creados++;
      }
    }

    console.log(`[cargosMensualesJob] Completado: ${creados} cargos creados para ${mes}/${anio}`);
  } catch (err) {
    console.error('[cargosMensualesJob] Error:', err.message);
  }
}

const iniciarJobCargosMensuales = () => {
  // Día 1 de cada mes a las 00:05 AM (México)
  cron.schedule('5 0 1 * *', async () => {
    console.log('[cargosMensualesJob] Ejecutando job de cargos mensuales...');
    await generarCargosMensuales();
  }, {
    timezone: 'America/Mexico_City'
  });

  console.log('✅ Job cargos mensuales configurado: Día 1, 00:05 AM (México)');
};

module.exports = { iniciarJobCargosMensuales, generarCargosMensuales };
