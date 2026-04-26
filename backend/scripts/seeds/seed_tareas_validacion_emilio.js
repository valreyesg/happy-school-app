const { query, pool } = require('../../src/config/database');

async function main() {
  try {
    const GRUPO_ID = 'ac566ca1-7e1e-480b-babd-f2a529c0abeb'; // Prekinder
    const EMILIO_ID = '2ee56308-2835-4924-bc0a-d8a256caa337';

    // Buscar directora/creadora
    const dirResult = await query(`SELECT id FROM usuarios WHERE email = 'directora@happyschool.edu.mx'`);
    if (dirResult.rows.length === 0) {
      console.error('❌ No se encontró directora@happyschool.edu.mx');
      process.exit(1);
    }
    const creada_por = dirResult.rows[0].id;

    const tareas = [
      {
        titulo: 'Traer plastilina',
        descripcion: 'Traer una barra de plastilina de cualquier color',
        fecha_limite: '2026-04-25' // Mañana — ⚠️
      },
      {
        titulo: 'Dibujo de los animales',
        descripcion: 'Traer un dibujo de tu animal favorito',
        fecha_limite: '2026-04-24' // Hoy — 🔥
      },
      {
        titulo: 'Cuento de la semana pasada',
        descripcion: 'Traer el cuento leído la semana pasada',
        fecha_limite: '2026-04-23' // Ayer, 1 día vencida — 🔴 visible
      },
      {
        titulo: 'Deber antiguo olvidado',
        descripcion: 'Tarea que venció hace más de 2 días',
        fecha_limite: '2026-04-21' // Hace 3 días — 🔴 OCULTA (para prueba)
      },
    ];

    console.log('\n📚 Insertando tareas de validación para Emilio...\n');

    for (const t of tareas) {
      const tareasResult = await query(
        `INSERT INTO tareas (grupo_id, titulo, descripcion, fecha_limite, publicada, creada_por)
         VALUES ($1, $2, $3, $4, true, $5)
         ON CONFLICT DO NOTHING
         RETURNING id`,
        [GRUPO_ID, t.titulo, t.descripcion, t.fecha_limite, creada_por]
      );

      if (tareasResult.rows.length === 0) {
        console.log(`⏭️  Ya existe: ${t.titulo}`);
        continue;
      }

      const tarea_id = tareasResult.rows[0].id;

      await query(
        `INSERT INTO tarea_alumno (tarea_id, alumno_id, completada)
         VALUES ($1, $2, false)
         ON CONFLICT (tarea_id, alumno_id) DO NOTHING`,
        [tarea_id, EMILIO_ID]
      );

      console.log(`✅ Insertada: ${t.titulo}`);
      console.log(`   Fecha: ${t.fecha_limite}`);
      console.log(`   Descripción: ${t.descripcion}\n`);
    }

    console.log('✨ Seed completado. Tareas disponibles para probar indicadores de color.\n');
    process.exit(0);

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

main();
