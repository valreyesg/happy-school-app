// Setup: Crear registro de comida con comprobante para probar pagos
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../../src/config/database');

async function setupComidaPagosDemo() {
  try {
    // Obtener lunes de esta semana
    const hoy = new Date().toLocaleDateString('en-CA');
    const [año, mes, dia] = hoy.split('-');
    const lunes = new Date(año, parseInt(mes) - 1, parseInt(dia));
    lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
    const semanaInicio = lunes.toLocaleDateString('en-CA');

    // Obtener 3 alumnos de prueba
    const alumnosResult = await query(
      'SELECT id FROM alumnos WHERE deleted_at IS NULL LIMIT 3'
    );

    if (alumnosResult.rows.length === 0) {
      console.log('No hay alumnos para la demo');
      return;
    }

    console.log(`\n📋 Creando registros de comida para semana: ${semanaInicio}`);

    for (let i = 0; i < alumnosResult.rows.length; i++) {
      const alumnoId = alumnosResult.rows[i].id;

      // Limpiar existentes
      await query(
        'DELETE FROM control_comida_semanal WHERE alumno_id = $1 AND semana_inicio = $2',
        [alumnoId, semanaInicio]
      );

      // Insertar con y sin comprobante
      const metodo_pago = i === 0 ? 'transferencia' : 'efectivo';
      const comprobante_url = i === 0
        ? 'https://res.cloudinary.com/happyschool/image/upload/v1708975200/happyschool/comida/comprobantes/sample_receipt.jpg'
        : null;

      const res = await query(
        `INSERT INTO control_comida_semanal
          (alumno_id, semana_inicio, confirmado, modalidad, monto, metodo_pago, comprobante_pago_url, pago_verificado, estado)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          alumnoId,
          semanaInicio,
          true,
          'semana_completa',
          250,
          metodo_pago,
          comprobante_url,
          i === 2, // El 3er alumno ya pagado
          i === 2 ? 'pagado' : 'pendiente'
        ]
      );

      const modalidad = res.rows[0].modalidad === 'semana_completa' ? 'Semana completa' : 'Días específicos';
      const status = i === 2 ? '✅ PAGADO' : (i === 0 ? '💳 TRANSFERENCIA (con comprobante)' : '💵 EFECTIVO (sin pagar)');
      console.log(`  ✓ Alumno ${i + 1}: ${modalidad} | ${status}`);
    }

    console.log('\n✅ Demo de pagos de comida creada correctamente\n');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    process.exit(0);
  }
}

setupComidaPagosDemo();
