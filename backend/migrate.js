require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
const { query } = require('./src/config/database');
const fs = require('fs');

(async () => {
  try {
    const sql014 = fs.readFileSync('./migrations/014_control_comida_semanal.sql', 'utf8');
    const sql015 = fs.readFileSync('./migrations/015_menu_comida_semanal.sql', 'utf8');

    console.log('⏳ Ejecutando 014...');
    await query(sql014);
    console.log('✅ Migración 014 completada');

    console.log('⏳ Ejecutando 015...');
    await query(sql015);
    console.log('✅ Migración 015 completada');

    console.log('✨ ¡Migraciones completadas!');
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
