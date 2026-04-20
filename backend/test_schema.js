const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres:happy2026@localhost:5432/happy_school'
});

(async () => {
  try {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='bitacora_diaria' 
      AND (column_name LIKE '%actividad%' OR column_name LIKE '%tarea%')
    `);
    console.log('Columnas encontradas:');
    res.rows.forEach(r => console.log('  -', r.column_name));
    await pool.end();
  } catch(e) {
    console.error(e.message);
    await pool.end();
  }
})();
