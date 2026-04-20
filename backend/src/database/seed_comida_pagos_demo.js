require('dotenv').config();
const { query } = require('../config/database');

const seed = async () => {
  try {
    // Obtener lunes actual
    const hoy = new Date();
    let lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    if (hoy.getDay() === 0) {
      lunes.setDate(lunes.getDate() - 7);
    }
    const semana = lunes.toISOString().split('T')[0];

    // Obtener 3 alumnos
    const alumnos = await query('SELECT id FROM alumnos LIMIT 3');
    if (alumnos.rows.length < 3) {
      console.log('❌ No hay suficientes alumnos');
      process.exit(1);
    }

    const [alumno1, alumno2, alumno3] = alumnos.rows.map(r => r.id);

    // Limpiar registros previos de esta semana
    await query('DELETE FROM control_comida_semanal WHERE semana_inicio = $1', [semana]);

    // Crear 3 registros demo
    await query(
      `INSERT INTO control_comida_semanal
        (alumno_id, semana_inicio, confirmado, modalidad, monto, metodo_pago, pago_verificado, estado)
       VALUES
        ($1, $2, true, 'semana_completa', 250, 'transferencia', true, 'pagado'),
        ($3, $2, true, 'semana_completa', 250, 'efectivo', true, 'pagado'),
        ($4, $2, true, 'dias_especificos', 100, 'transferencia', false, 'pendiente')`,
      [alumno1, semana, alumno2, alumno3]
    );

    console.log(`✅ Demo data creada para semana ${semana}`);
    console.log(`   - ${alumno1}: Transferencia, Pagado`);
    console.log(`   - ${alumno2}: Efectivo, Pagado`);
    console.log(`   - ${alumno3}: Transferencia, Sin verificar`);
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
};

seed();
