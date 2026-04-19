require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const PASS = 'HappySchool2026!';

// ────────────────────────────────────────────────────────────────────────────
// NOMBRES REALES del personal (actualizar demos existentes)
// ────────────────────────────────────────────────────────────────────────────
const ACTUALIZAR = [
  { email: 'directora@happyschool.edu.mx',  nombre: 'Carmen Rodríguez Mendoza',  genero: 'f' },
  { email: 'admin@happyschool.edu.mx',       nombre: 'Ana María Pérez Torres',    genero: 'f' },
  { email: 'maternal@happyschool.edu.mx',    nombre: 'Gabriela Soto Ramírez',     genero: 'f' },
  { email: 'prekinder@happyschool.edu.mx',   nombre: 'Sofía Martínez Reyes',      genero: 'f' },
  { email: 'kinder1@happyschool.edu.mx',     nombre: 'Diana Cruz Herrera',        genero: 'f' },
  { email: 'kinder2@happyschool.edu.mx',     nombre: 'Paola Gutiérrez Vega',      genero: 'f' },
  { email: 'kinder3@happyschool.edu.mx',     nombre: 'Andrea Morales Jiménez',    genero: 'f' },
];

// ────────────────────────────────────────────────────────────────────────────
// NUEVAS MAESTRAS AUXILIARES
// ────────────────────────────────────────────────────────────────────────────
const AUXILIARES = [
  { nombre: 'Karla Espinoza Luna',     email: 'auxiliar.maternal@happyschool.edu.mx',   tel: '5500000015', grupo: 'Maternal',  genero: 'f' },
  { nombre: 'Mónica Vargas Castillo',  email: 'auxiliar.prekinder@happyschool.edu.mx',  tel: '5500000016', grupo: 'Prekinder', genero: 'f' },
];

// ────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Actualizando personal con nombres reales...\n');
  const passwordHash = await bcrypt.hash(PASS, 12);

  // Ciclo activo
  const cicloR = await query('SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1');
  if (!cicloR.rows.length) { console.error('❌ Sin ciclo escolar activo'); process.exit(1); }
  const cicloId = cicloR.rows[0].id;

  // Grupos
  const gruposDB = await query('SELECT id, nombre FROM grupos WHERE ciclo_id = $1', [cicloId]);
  const grupoId  = (nombre) => gruposDB.rows.find(g => g.nombre === nombre)?.id;

  // ── 1. Actualizar nombres del personal existente ───────────────────────────
  for (const p of ACTUALIZAR) {
    // Actualizar nombre en usuarios
    await query(
      'UPDATE usuarios SET nombre = $1, updated_at = NOW() WHERE email = $2',
      [p.nombre, p.email]
    );

    // Obtener usuario_id
    const ur = await query('SELECT id FROM usuarios WHERE email = $1', [p.email]);
    const usuId = ur.rows[0]?.id;
    if (!usuId) { console.warn(`⚠️  No encontrado: ${p.email}`); continue; }

    // Crear o actualizar registro en personal
    const exist = await query('SELECT id FROM personal WHERE usuario_id = $1', [usuId]);
    if (exist.rows.length > 0) {
      await query(
        'UPDATE personal SET nombre_completo = $1, genero = $2, updated_at = NOW() WHERE usuario_id = $3',
        [p.nombre, p.genero, usuId]
      );
    } else {
      await query(
        'INSERT INTO personal (usuario_id, nombre_completo, genero) VALUES ($1, $2, $3)',
        [usuId, p.nombre, p.genero]
      );
    }
    console.log(`  ✅ ${p.nombre.padEnd(32)} ← ${p.email}`);
  }

  // ── 2. Crear maestras auxiliares ──────────────────────────────────────────
  console.log('\n👩‍🏫 Creando maestras auxiliares...');
  for (const aux of AUXILIARES) {
    // Usuario
    const ur = await query(`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
      VALUES ($1, $2, $3, $4, 'maestra_titular')
      ON CONFLICT (email) DO NOTHING RETURNING id
    `, [aux.nombre, aux.email, aux.tel, passwordHash]);

    let usuId = ur.rows[0]?.id;
    if (!usuId) {
      const ex = await query('SELECT id FROM usuarios WHERE email = $1', [aux.email]);
      usuId = ex.rows[0]?.id;
    }
    if (!usuId) continue;

    // Actualizar nombre si ya existía
    await query('UPDATE usuarios SET nombre = $1, updated_at = NOW() WHERE id = $2', [aux.nombre, usuId]);

    // Personal
    const pr = await query(`
      INSERT INTO personal (usuario_id, nombre_completo, genero)
      VALUES ($1, $2, $3)
      ON CONFLICT (usuario_id) DO NOTHING RETURNING id
    `, [usuId, aux.nombre, aux.genero]);

    let personalId = pr.rows[0]?.id;
    if (!personalId) {
      await query('UPDATE personal SET nombre_completo = $1, genero = $2 WHERE usuario_id = $3', [aux.nombre, aux.genero, usuId]);
      const ex = await query('SELECT id FROM personal WHERE usuario_id = $1', [usuId]);
      personalId = ex.rows[0]?.id;
    }
    if (!personalId) continue;

    // Asignación al grupo como auxiliar (es_titular = false)
    const gId = grupoId(aux.grupo);
    if (gId) {
      const asigExist = await query(
        'SELECT id FROM asignaciones_grupo WHERE personal_id = $1 AND grupo_id = $2 AND ciclo_id = $3',
        [personalId, gId, cicloId]
      );
      if (asigExist.rows.length === 0) {
        await query(`
          INSERT INTO asignaciones_grupo (personal_id, grupo_id, ciclo_id, es_titular, activo)
          VALUES ($1, $2, $3, false, true)
        `, [personalId, gId, cicloId]);
      }
    }
    console.log(`  ✅ ${aux.nombre.padEnd(32)} → auxiliar ${aux.grupo} | ${aux.email}`);
  }

  // ── 3. Resumen final ───────────────────────────────────────────────────────
  const asig = await query(`
    SELECT g.nombre grupo, p.nombre_completo maestra, a.es_titular, u.email
    FROM asignaciones_grupo a
    JOIN personal p ON p.id = a.personal_id
    JOIN grupos g ON g.id = a.grupo_id
    JOIN usuarios u ON u.id = p.usuario_id
    ORDER BY g.nombre, a.es_titular DESC
  `);

  console.log('\n📋 Asignaciones de grupo:\n');
  console.log('  GRUPO        ROL        MAESTRA                          EMAIL');
  console.log('  ─────────────────────────────────────────────────────────────────────');
  asig.rows.forEach(r => {
    const rol = r.es_titular ? 'Titular  ' : 'Auxiliar ';
    console.log(`  ${r.grupo.padEnd(12)} ${rol}  ${r.maestra.padEnd(32)} ${r.email}`);
  });

  console.log('\n🔑 Credenciales de personal (contraseña: HappySchool2026!):\n');
  console.log('  ROL              NOMBRE                           EMAIL');
  console.log('  ─────────────────────────────────────────────────────────────────────');
  const todo = await query(`
    SELECT u.rol_principal, u.nombre, u.email
    FROM usuarios u WHERE u.rol_principal != 'padre'
    ORDER BY u.rol_principal, u.nombre
  `);
  todo.rows.forEach(r => {
    console.log(`  ${r.rol_principal.padEnd(16)} ${r.nombre.padEnd(32)} ${r.email}`);
  });

  console.log('\n✅ Personal actualizado correctamente.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
