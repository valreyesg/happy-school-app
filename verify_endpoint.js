const { query } = require('./backend/src/config/database');

async function test() {
  try {
    const result = await query(`
      SELECT t.id, t.titulo, t.descripcion, t.fecha_limite, t.foto_url, t.created_at,
             ta.completada, ta.fecha_completada
      FROM tareas t
      LEFT JOIN tarea_alumno ta ON t.id = ta.tarea_id AND ta.alumno_id = $1
      WHERE t.grupo_id = $2 AND t.publicada = true
      ORDER BY t.fecha_limite DESC LIMIT 1
    `, ['2ee56308-2835-4924-bc0a-d8a256caa337', 'ac566ca1-7e1e-480b-babd-f2a529c0abeb']);
    
    console.log('=== QUERY RESULT ===');
    if (result.rows.length === 0) {
      console.log('No rows returned');
      process.exit(1);
    }
    
    const row = result.rows[0];
    console.log('CAMPOS PRESENTES:');
    console.log('- id:', row.id ? '✓' : '✗');
    console.log('- titulo:', row.titulo ? '✓' : '✗');
    console.log('- created_at:', row.created_at ? '✓ ' + row.created_at : '✗');
    console.log('- fecha_limite:', row.fecha_limite ? '✓ ' + row.fecha_limite : '✗');
    console.log('- foto_url:', row.foto_url ? '✓' : '✗ (null)');
    console.log('- completada:', row.completada !== undefined ? '✓ ' + row.completada : '✗');
    console.log('\n=== JSON ===');
    console.log(JSON.stringify(row, null, 2));
    process.exit(0);
  } catch (e) {
    console.error('ERROR:', e.message);
    process.exit(1);
  }
}

test();
