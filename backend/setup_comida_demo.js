require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { query } = require('./src/config/database');

async function setup() {
  console.log('🍽️ Creando datos demo de comida...');

  try {
    // Obtener un alumno de prueba
    const alumnoResult = await query(`
      SELECT id, nombre_completo FROM alumnos
      WHERE deleted_at IS NULL
      LIMIT 1
    `);

    if (alumnoResult.rows.length === 0) {
      console.log('❌ No hay alumnos en BD');
      process.exit(1);
    }

    const alumno = alumnoResult.rows[0];
    console.log(`✅ Alumno seleccionado: ${alumno.nombre_completo}`);

    // Obtener lunes de esta semana
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    const semanaInicio = lunes.toISOString().split('T')[0];

    console.log(`📅 Semana: ${semanaInicio}`);

    // Insertar confirmación de comida
    await query(`
      INSERT INTO control_comida_semanal
        (alumno_id, semana_inicio, confirmado, modalidad, dias_seleccionados, monto,
         metodo_pago, pago_verificado, estado)
      VALUES ($1, $2, true, 'semana_completa', NULL, 250, 'transferencia', false, 'pendiente')
      ON CONFLICT (alumno_id, semana_inicio)
      DO UPDATE SET
        confirmado = true,
        modalidad = 'semana_completa',
        monto = 250,
        metodo_pago = 'transferencia',
        updated_at = NOW()
    `, [alumno.id, semanaInicio]);

    console.log('✅ Confirmación de comida creada');

    // Insertar menú semanal
    await query(`
      INSERT INTO menu_comida_semanal
        (semana_inicio, contenido_texto, publicado, creado_por)
      VALUES ($1, $2, true, NULL)
      ON CONFLICT (semana_inicio)
      DO UPDATE SET
        contenido_texto = $2,
        publicado = true,
        updated_at = NOW()
    `, [
      semanaInicio,
      `LUNES: Desayuno: Pan + Leche | Colación: Fruta | Comida: Pollo con arroz
MARTES: Desayuno: Cereal | Colación: Yogurt | Comida: Pasta con verduras
MIÉRCOLES: Desayuno: Huevo + Pan | Colación: Quesadilla | Comida: Carne molida
JUEVES: Desayuno: Avena | Colación: Galletas | Comida: Pescado a la mantequilla
VIERNES: Desayuno: Pancakes | Colación: Dátiles | Comida: Pizza casera`
    ]);

    console.log('✅ Menú semanal creado');

    console.log('\n✨ ¡Demo listo! Puedes acceder en:');
    console.log('   http://localhost:5173/padre/comida (papá)');
    console.log('   http://localhost:5173/directora/comida-menu (directora)');
    console.log('   http://localhost:5173/maestra/filtro-entrada (maestra - lunes)');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

setup();
