require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../config/database');

async function setup() {
  try {
    const result = await query(`
      UPDATE alumnos
      SET fecha_nacimiento = '2026-04-19'
      WHERE nombre_completo = 'Ana García López'
      RETURNING id, nombre_completo, fecha_nacimiento
    `);
    if (result.rows.length > 0) {
      console.log('✅ Actualizado:', result.rows[0]);
    } else {
      console.log('⚠️  No se encontró alumno con ese nombre');
    }
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setup();
