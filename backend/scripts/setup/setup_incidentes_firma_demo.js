const { query } = require('../config/database');

async function setup() {
  try {
    // Obtener un alumno y su padre
    const alumnoRes = await query('SELECT id FROM alumnos LIMIT 1');
    if (alumnoRes.rows.length === 0) {
      console.log('No hay alumnos. Ejecuta seed.js primero.');
      process.exit(1);
    }

    const alumnoId = alumnoRes.rows[0].id;

    // Obtener una maestra
    const maestraRes = await query("SELECT id FROM personal WHERE rol_principal LIKE '%maestra%' LIMIT 1");
    const maestraId = maestraRes.rows.length > 0 ? maestraRes.rows[0].id : null;

    // Insertar incidentes de prueba (sin firma aún)
    const result = await query(`
      INSERT INTO incidentes (alumno_id, descripcion, acciones_tomadas, reportado_por)
      VALUES
        ($1, 'Se golpeó la cabeza en la cancha durante el recreo', 'Se aplicó hielo y se monitoreó', $2),
        ($1, 'Tuvo una caída de la bicicleta fija en educación física', 'Se revisó sin lesiones visibles', $2)
      ON CONFLICT (id) DO NOTHING
      RETURNING id, descripcion
    `, [alumnoId, maestraId]);

    console.log(`✅ ${result.rows.length} incidentes de prueba creados`);
    result.rows.forEach(r => console.log(`   - ${r.descripcion}`));

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

setup();
