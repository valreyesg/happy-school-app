require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../config/database');

async function main() {
  try {
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    const fechaAyer = ayer.toISOString().substring(0, 10);

    // Obtener grupo Prekinder (ciclo activo)
    const grupo = await query(`
      SELECT g.id FROM grupos g
      JOIN ciclos_escolares ce ON g.ciclo_id = ce.id
      WHERE g.nombre = 'Prekinder' AND ce.activo = true
      LIMIT 1
    `);

    if (grupo.rows.length === 0) {
      console.error('❌ Grupo Prekinder con ciclo activo no encontrado');
      process.exit(1);
    }

    const grupo_id = grupo.rows[0].id;

    // Obtener directora como creada_por
    const dir = await query(`
      SELECT id FROM usuarios WHERE email = 'directora@happyschool.edu.mx' LIMIT 1
    `);

    if (dir.rows.length === 0) {
      console.error('❌ Usuario directora@happyschool.edu.mx no encontrado');
      process.exit(1);
    }

    const creada_por = dir.rows[0].id;

    // Insertar tarea de prueba
    const result = await query(`
      INSERT INTO tareas (grupo_id, titulo, descripcion, fecha_limite, publicada, creada_por)
      VALUES ($1, 'Dibujo de la familia', 'Traer dibujo de tu familia a la escuela', $2, true, $3)
      RETURNING id
    `, [grupo_id, fechaAyer, creada_por]);

    console.log(`✅ Tarea de prueba creada exitosamente`);
    console.log(`   ID: ${result.rows[0].id}`);
    console.log(`   Título: Dibujo de la familia`);
    console.log(`   Fecha límite: ${fechaAyer}`);
    console.log(`   Grupo: Prekinder`);
    console.log(`   Estado: Publicada`);
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al crear tarea de prueba:', err.message);
    process.exit(1);
  }
}

main();
