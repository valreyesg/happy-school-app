require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { query } = require('./src/config/database');

async function setup() {
  console.log('🍽️ Creando datos demo realistas de comida...\n');

  try {
    // Obtener alumnos de prueba
    const alumnosResult = await query(`
      SELECT id, nombre_completo FROM alumnos
      WHERE deleted_at IS NULL
      LIMIT 10
    `);

    if (alumnosResult.rows.length === 0) {
      console.log('❌ No hay alumnos en BD');
      process.exit(1);
    }

    console.log(`✅ ${alumnosResult.rows.length} alumnos encontrados\n`);

    // Obtener lunes de esta semana
    const hoy = new Date();
    const lunes = new Date(hoy);
    lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
    const semanaInicio = lunes.toISOString().split('T')[0];

    console.log(`📅 Semana: ${semanaInicio}\n`);

    // Crear confirmaciones variadas
    const alumnos = alumnosResult.rows;
    let confirmados = 0;
    let transferencia = 0;
    let efectivo = 0;

    for (let i = 0; i < alumnos.length; i++) {
      const alumno = alumnos[i];

      // 80% confirman comida
      if (Math.random() > 0.2) {
        confirmados++;

        // Decide modalidad
        const esSemanCompleta = Math.random() > 0.3; // 70% semana, 30% días
        const modalidad = esSemanCompleta ? 'semana_completa' : 'dias_especificos';
        const monto = esSemanCompleta ? 250 : 50 * (2 + Math.floor(Math.random() * 4)); // 2-5 días

        // Decide método pago
        const metodo = Math.random() > 0.4 ? 'transferencia' : 'efectivo'; // 60% transfer, 40% efectivo
        if (metodo === 'transferencia') transferencia++;
        else efectivo++;

        const diasArray = !esSemanCompleta ? [0, 1, 2, 3, 4].slice(0, 2 + Math.floor(Math.random() * 4)) : null;

        // Algunos ya pagaron (marcar pago_verificado)
        const pagado = Math.random() > 0.6; // 40% ya pagaron

        await query(`
          INSERT INTO control_comida_semanal
            (alumno_id, semana_inicio, confirmado, modalidad, dias_seleccionados, monto,
             metodo_pago, pago_verificado, estado)
          VALUES ($1, $2, true, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (alumno_id, semana_inicio)
          DO UPDATE SET
            confirmado = true,
            modalidad = $3,
            dias_seleccionados = $4,
            monto = $5,
            metodo_pago = $6,
            pago_verificado = $7,
            updated_at = NOW()
        `, [
          alumno.id,
          semanaInicio,
          modalidad,
          diasArray,
          monto,
          metodo,
          pagado,
          pagado ? 'pagado' : 'pendiente'
        ]);

        console.log(`  ✅ ${alumno.nombre_completo.padEnd(30)} | ${modalidad === 'semana_completa' ? 'Semana completa $250' : `Días específicos $${monto}`} | ${metodo === 'transferencia' ? '💳' : '💵'} | ${pagado ? '✓ Pagado' : '⏳ Pendiente'}`);
      }
    }

    // Insertar/actualizar menú semanal
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
      `LUNES
Desayuno: Pan integral con queso y jamón
Colación: Manzana roja
Comida: Pollo a la mantequilla con pure de papas y brócoli

MARTES
Desayuno: Cereal con leche
Colación: Plátano
Comida: Pasta integral con salsa de tomate y carne molida

MIÉRCOLES
Desayuno: Huevo revuelto con pan tostado
Colación: Galletas integrales
Comida: Lomo de res guisado con zanahorias y papas

JUEVES
Desayuno: Avena con frutas
Colación: Yogurt natural
Comida: Filete de pescado a la mantequilla con arroz blanco

VIERNES
Desayuno: Pancakes con mermelada
Colación: Melón
Comida: Pizza casera con verduras`
    ]);

    console.log('\n✅ Menú semanal creado\n');

    console.log('📊 RESUMEN:');
    console.log(`   Total confirmados: ${confirmados}`);
    console.log(`   💳 Transferencia: ${transferencia}`);
    console.log(`   💵 Efectivo: ${efectivo}`);

    const pagados = await query(`
      SELECT COUNT(*) as count FROM control_comida_semanal
      WHERE semana_inicio = $1 AND pago_verificado = true
    `, [semanaInicio]);

    console.log(`   ✓ Ya pagaron: ${pagados.rows[0].count}`);
    console.log(`   ⏳ Sin pagar: ${confirmados - parseInt(pagados.rows[0].count)}`);

    console.log('\n✨ Demo listo! Accede a:');
    console.log('   http://localhost:5173/directora');
    console.log('   (Credenciales: directora@happyschool.edu.mx / HappySchool2026!)');

    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
}

setup();
