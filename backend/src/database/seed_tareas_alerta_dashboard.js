const { query, pool } = require('../config/database');

async function main() {
  try {
    const GRUPO_K3 = '920c245a-797d-4f48-9d3e-939e77b5b09a'; // Kinder 3
    const ALUMNOS_ALERTA = [
      '6c517c89-8c32-49aa-9d13-2dda520adb92', // Carlos Vargas
      '12a11adc-cd49-46c9-809b-4737d484129b', // Mariana Herrera
      'e4156375-5cab-4d5f-b46f-2ae1cf0ea348', // Pablo Rojas
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
        titulo: 'Lectura de cuentos clásicos',
        descripcion: 'Traer reporte de lectura de cuento clásico',
        fecha_limite: '2026-04-07'
      },
      {
        titulo: 'Proyecto de expresión artística',
        descripcion: 'Traer proyecto de arte de la semana',
        fecha_limite: '2026-04-14'
      },
      {
        titulo: 'Ejercicios de matemáticas avanzadas',
        descripcion: 'Completar serie de problemas matemáticos',
        fecha_limite: '2026-04-21'
      },
    ];

    console.log('\n📊 Insertando tareas para activar alertas en dashboard miss/directora...\n');
    console.log(`   Grupo: Kinder 3`);
    console.log(`   Alumnos: Carlos Vargas, Mariana Herrera, Pablo Rojas\n`);

    for (const t of tareas) {
      // Insertar tarea
      const tareasResult = await query(
        `INSERT INTO tareas (grupo_id, titulo, descripcion, fecha_limite, publicada, creada_por)
         VALUES ($1, $2, $3, $4, true, $5)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [GRUPO_K3, t.titulo, t.descripcion, t.fecha_limite, creada_por]
      );

      if (tareasResult.rows.length === 0) {
        console.log(`⏭️  Ya existe: ${t.titulo}`);
        continue;
      }

      const tarea_id = tareasResult.rows[0].id;

      // Vincular a los 3 alumnos como NO entregado + registrado en bitácora
      for (const alumno_id of ALUMNOS_ALERTA) {
        await query(
          `INSERT INTO tarea_alumno (tarea_id, alumno_id, completada, registrado_en_bitacora)
           VALUES ($1, $2, false, true)
           ON CONFLICT (tarea_id, alumno_id) DO UPDATE SET registrado_en_bitacora = true`,
          [tarea_id, alumno_id]
        );
      }

      console.log(`✅ Insertada: ${t.titulo}`);
      console.log(`   Fecha: ${t.fecha_limite}`);
      console.log(`   Asignada a: Carlos, Mariana, Pablo (NO entregada)\n`);
    }

    console.log('✨ Seed completado. Alumnos mostrarán 3 tareas sin entregar en alertas.\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
