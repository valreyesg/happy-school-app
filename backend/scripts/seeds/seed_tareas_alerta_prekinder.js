const { query, pool } = require('../../src/config/database');

async function main() {
  try {
    const GRUPO_PREKINDER = 'ac566ca1-7e1e-480b-babd-f2a529c0abeb';
    const ALUMNOS_PREKINDER = [
      'c75e11fa-56ac-4f97-be92-bfec0517602b', // Camila Torres
      '5d00d4e5-5c40-4ff5-a9a3-6bd301d39f5b', // Lucía Jiménez
      '34bb8e7e-924a-4f97-9aac-16586c139748', // Santiago Gutiérrez
    ];

    // Buscar directora/creadora
    const dirResult = await query(`SELECT id FROM usuarios WHERE email = 'directora@happyschool.edu.mx'`);
    if (dirResult.rows.length === 0) {
      console.error('❌ No se encontró directora@happyschool.edu.mx');
      process.exit(1);
    }
    const creada_por = dirResult.rows[0].id;

    // 3 tareas pasadas en el mes de abril (para activar alerta de 3+ sin entregar)
    const tareas = [
      {
        titulo: 'Cuento clásico — análisis',
        descripcion: 'Leer cuento y entregar análisis simple',
        fecha_limite: '2026-04-07'
      },
      {
        titulo: 'Proyecto colaborativo artístico',
        descripcion: 'Trabajo en equipo para crear arte',
        fecha_limite: '2026-04-14'
      },
      {
        titulo: 'Ejercicios de cálculo avanzado',
        descripcion: 'Serie de problemas matemáticos del mes',
        fecha_limite: '2026-04-21'
      },
    ];

    console.log('\n📊 Insertando tareas para alertas de Prekinder...\n');
    console.log(`   Grupo: Prekinder`);
    console.log(`   Alumnos: Camila Torres, Lucía Jiménez, Santiago Gutiérrez\n`);

    for (const t of tareas) {
      // Insertar tarea
      const tareasResult = await query(
        `INSERT INTO tareas (grupo_id, titulo, descripcion, fecha_limite, publicada, creada_por)
         VALUES ($1, $2, $3, $4, true, $5)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [GRUPO_PREKINDER, t.titulo, t.descripcion, t.fecha_limite, creada_por]
      );

      if (tareasResult.rows.length === 0) {
        console.log(`⏭️  Ya existe: ${t.titulo}`);
        continue;
      }

      const tarea_id = tareasResult.rows[0].id;

      // Vincular a los 3 alumnos como NO entregado + registrado en bitácora
      for (const alumno_id of ALUMNOS_PREKINDER) {
        await query(
          `INSERT INTO tarea_alumno (tarea_id, alumno_id, completada, registrado_en_bitacora)
           VALUES ($1, $2, false, true)
           ON CONFLICT (tarea_id, alumno_id) DO UPDATE SET registrado_en_bitacora = true`,
          [tarea_id, alumno_id]
        );
      }

      console.log(`✅ Insertada: ${t.titulo}`);
      console.log(`   Fecha: ${t.fecha_limite}`);
      console.log(`   Asignada a: Camila, Lucía, Santiago (NO entregada)\n`);
    }

    console.log('✨ Seed completado. Miss de Prekinder verá alumnos en alerta.\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
