const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    // Actualizar a Ana García López para que use pañal
    const result = await pool.query(
      "UPDATE alumnos SET usa_panial = true WHERE nombre_completo = 'Ana García López' RETURNING id, nombre_completo, usa_panial"
    );

    if (result.rows.length > 0) {
      const alumna = result.rows[0];
      console.log(`✅ Actualizado: ${alumna.nombre_completo}`);
      console.log(`   usa_panial = ${alumna.usa_panial}`);
    } else {
      console.log('❌ Ana García López no encontrada');
    }

    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
})();
