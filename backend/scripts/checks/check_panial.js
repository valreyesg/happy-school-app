const { query } = require('../../src/config/database');

(async () => {
  try {
    const res = await query(
      "SELECT id, nombre_completo, usa_panial FROM alumnos WHERE nombre_completo ILIKE '%Ana García López%'"
    );
    console.log('Resultado:');
    res.rows.forEach(r => {
      console.log(`  ${r.nombre_completo}: usa_panial = ${r.usa_panial}`);
    });
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
