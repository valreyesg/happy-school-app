require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // El esquema ya fue aplicado por node-pg-migrate
  console.log('✅ Esquema ya aplicado vía migración');

  // Ciclo escolar activo
  const cicloResult = await query(`
    INSERT INTO ciclos_escolares (nombre, fecha_inicio, fecha_fin, activo)
    VALUES ('2025-2026', '2025-09-01', '2026-07-31', true)
    ON CONFLICT DO NOTHING
    RETURNING id
  `);

  let cicloId;
  if (cicloResult.rows.length > 0) {
    cicloId = cicloResult.rows[0].id;
  } else {
    const r = await query('SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1');
    cicloId = r.rows[0].id;
  }

  // Grupos base
  const grupos = [
    { nombre: 'Maternal', nivel: 'Maternal', codigo: 'maternal', color: '#FC8181' },
    { nombre: 'Prekinder', nivel: 'Prekinder', codigo: 'prekinder', color: '#F6E05E' },
    { nombre: 'Kinder 1', nivel: 'Kinder 1', codigo: 'kinder1', color: '#68D391' },
    { nombre: 'Kinder 2', nivel: 'Kinder 2', codigo: 'kinder2', color: '#4299E1' },
    { nombre: 'Kinder 3', nivel: 'Kinder 3', codigo: 'kinder3', color: '#B794F4' },
  ];

  for (const g of grupos) {
    await query(`
      INSERT INTO grupos (nombre, nivel, nivel_codigo, ciclo_id, color_hex)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT DO NOTHING
    `, [g.nombre, g.nivel, g.codigo, cicloId, g.color]);
  }
  console.log('✅ Grupos creados');

  // Usuario directora
  const passwordHash = await bcrypt.hash('HappySchool2026!', 12);
  await query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
    VALUES ('Directora', 'directora@happyschool.edu.mx', '5500000001', $1, 'directora')
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);
  console.log('✅ Usuario directora creado (email: directora@happyschool.edu.mx, pass: HappySchool2026!)');

  // Usuario administrativo
  await query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
    VALUES ('Administrativo', 'admin@happyschool.edu.mx', '5500000002', $1, 'administrativo')
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);
  console.log('✅ Usuario administrativo creado');

  console.log('\n🏫 Seed completado exitosamente');
  console.log('\n📋 Credenciales de acceso:');
  console.log('   Directora: directora@happyschool.edu.mx / HappySchool2026!');
  console.log('   Admin:     admin@happyschool.edu.mx / HappySchool2026!');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
