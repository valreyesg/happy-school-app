const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fixDuplicadosAna() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Buscar todos los registros de Ana García López sin deleted_at
    const result = await client.query(`
      SELECT id, nombre_completo, curp, created_at
      FROM alumnos
      WHERE nombre_completo LIKE 'Ana Garc%' AND deleted_at IS NULL
      ORDER BY created_at;
    `);

    const registros = result.rows;
    console.log(`\n📋 Encontrados ${registros.length} registros de Ana García López:\n`);
    registros.forEach((r, i) => {
      console.log(`  ${i + 1}. ID: ${r.id}`);
      console.log(`     Nombre: ${r.nombre_completo}`);
      console.log(`     CURP: ${r.curp || '(sin CURP)'}`);
      console.log(`     Creado: ${r.created_at}\n`);
    });

    if (registros.length <= 1) {
      console.log('✅ No hay duplicados. Fin.\n');
      await client.query('ROLLBACK');
      process.exit(0);
    }

    // 2. Elegir registro canónico (el que tiene CURP)
    const canonico = registros.find(r => r.curp) || registros[0];
    const canonico_id = canonico.id;
    const duplicados_ids = registros
      .filter(r => r.id !== canonico_id)
      .map(r => r.id);

    console.log(`🎯 Registro canónico (a mantener): ${canonico_id}`);
    console.log(`   CURP: ${canonico.curp}\n`);
    console.log(`❌ Duplicados a eliminar (soft-delete): ${duplicados_ids.length}`);
    duplicados_ids.forEach(id => console.log(`   - ${id}`));
    console.log('');

    // 3. PRIMERO: DELETE los registros de los duplicados en tablas con constraints compuestos
    // (porque esos datos ya deben estar en el canónico)
    console.log('📊 Paso 1: Limpiando registros de tablas con constraints compuestos:\n');

    const tablas_delete = [
      'control_comida_semanal',  // constraint: alumno_id, semana_inicio
      'config_horario_alumno',   // probablemente único por alumno
      'inscripciones',           // puede ser único por alumno+ciclo
      'alumno_padre',            // constraint: alumno_id, padre_id (pero el canónico ya tiene esas relaciones)
    ];

    for (const tabla of tablas_delete) {
      try {
        const check = await client.query(`
          SELECT COUNT(*) as cnt
          FROM ${tabla}
          WHERE alumno_id = ANY($1::uuid[])
        `, [duplicados_ids]);

        const count = check.rows[0].cnt;
        if (count > 0) {
          await client.query(`
            DELETE FROM ${tabla}
            WHERE alumno_id = ANY($1::uuid[])
          `, [duplicados_ids]);
          console.log(`  ✓ ${tabla}: ${count} registros eliminados`);
        }
      } catch (e) {
        console.error(`  ⚠️  ${tabla}: error al procesar (${e.message}), continuando...`);
      }
    }

    // 4. SEGUNDO: UPDATE en tablas sin constraints compuestos (intentar reasignar lo que vale la pena)
    const tablas_update = [
      'actividades_fotos',
      'albumes',
      'asistencia',
      'bitacora_diaria',
      'blacklist',
      'boletas',
      'control_esfinteres',
      'evaluaciones',
      'incidentes',
      'lista_utiles_progreso',
      'log_whatsapp',
      'medicamentos',
      'pago_comida_semanal',
      'pagos',
      'personas_autorizadas',
      'registro_banio',
      'registro_comida',
      'registro_entrada',
      'registro_panial',
      'registro_salida',
      'reportes_mensuales',
      'tarea_alumno',
    ];

    console.log('\n📊 Paso 2: Reasignando registros en tablas simples:\n');

    for (const tabla of tablas_update) {
      try {
        const check = await client.query(`
          SELECT COUNT(*) as cnt
          FROM ${tabla}
          WHERE alumno_id = ANY($1::uuid[])
        `, [duplicados_ids]);

        const count = check.rows[0].cnt;
        if (count > 0) {
          await client.query(`
            UPDATE ${tabla}
            SET alumno_id = $1
            WHERE alumno_id = ANY($2::uuid[])
          `, [canonico_id, duplicados_ids]);
          console.log(`  ✓ ${tabla}: ${count} registros reasignados`);
        }
      } catch (e) {
        // Si falla, DELETE en su lugar (para no bloquear la transacción)
        if (e.code === '23505') {
          await client.query(`
            DELETE FROM ${tabla}
            WHERE alumno_id = ANY($1::uuid[])
          `, [duplicados_ids]);
          console.log(`  ⚠️  ${tabla}: ${check.rows[0].cnt} registros eliminados (conflicto)`);
        } else {
          throw e;
        }
      }
    }

    // 5. Soft-delete los duplicados
    console.log('\n🗑️  Paso 3: Marcando duplicados como eliminados...');
    await client.query(`
      UPDATE alumnos
      SET deleted_at = NOW()
      WHERE id = ANY($1::uuid[])
    `, [duplicados_ids]);

    console.log(`  ✓ ${duplicados_ids.length} registros marcados como eliminados\n`);

    // 6. Verificación final
    console.log('✅ Verificación final:');
    const final = await client.query(`
      SELECT COUNT(*) as cnt
      FROM alumnos
      WHERE nombre_completo LIKE 'Ana Garc%' AND deleted_at IS NULL
    `);
    console.log(`   Registros activos de Ana García López: ${final.rows[0].cnt}\n`);

    await client.query('COMMIT');
    console.log('✨ Limpieza completada exitosamente.\n');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error fatal:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

fixDuplicadosAna();
