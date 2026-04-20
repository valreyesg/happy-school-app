const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

(async () => {
  try {
    const sql = fs.readFileSync('./migrations/012_fix_ana_panial.sql', 'utf8');
    const result = await pool.query(sql);
    console.log('✅ Migración aplicada:', result.command, result.rowCount, 'filas afectadas');
    pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    pool.end();
    process.exit(1);
  }
})();
