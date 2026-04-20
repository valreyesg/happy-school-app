const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    const result = await pool.query(
      "SELECT id, nombre_completo, usa_panial FROM alumnos WHERE nombre_completo ILIKE '%Ana García López%'"
    );
    console.log('Ana García López en BD:');
    console.log(JSON.stringify(result.rows, null, 2));
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
  }
})();
