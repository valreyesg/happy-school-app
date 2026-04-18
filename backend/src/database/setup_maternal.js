/**
 * Garantiza que maternal@happyschool.edu.mx esté correctamente
 * vinculada al Grupo Maternal del ciclo activo y que la alumna
 * de prueba exista en ese grupo con estado 'inscrito'.
 *
 * Uso: node src/database/setup_maternal.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function main() {
  const PASSWORD = 'HappySchool2026!';
  const hash = await bcrypt.hash(PASSWORD, 12);

  // 1. Ciclo activo
  const cicloR = await query('SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1');
  if (!cicloR.rows.length) throw new Error('No hay ciclo escolar activo');
  const cicloId = cicloR.rows[0].id;
  console.log('✅ Ciclo activo:', cicloId);

  // 2. Grupo Maternal
  const grupoR = await query(
    "SELECT id FROM grupos WHERE nombre = 'Maternal' AND ciclo_id = $1 LIMIT 1",
    [cicloId]
  );
  if (!grupoR.rows.length) throw new Error('Grupo Maternal no encontrado para el ciclo activo');
  const grupoId = grupoR.rows[0].id;
  console.log('✅ Grupo Maternal:', grupoId);

  // 3. Usuario maestra
  await query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
    VALUES ('Maestra Maternal', 'maternal@happyschool.edu.mx', '5500000010', $1, 'maestra_titular')
    ON CONFLICT (email) DO UPDATE SET password_hash = $1, rol_principal = 'maestra_titular'
  `, [hash]);
  const usuR = await query("SELECT id FROM usuarios WHERE email = 'maternal@happyschool.edu.mx'");
  const usuId = usuR.rows[0].id;
  console.log('✅ Usuario maestra:', usuId);

  // 4. Registro en personal
  await query(`
    INSERT INTO personal (usuario_id, nombre_completo)
    VALUES ($1, 'Maestra Maternal')
    ON CONFLICT (usuario_id) DO NOTHING
  `, [usuId]);
  const perR = await query('SELECT id FROM personal WHERE usuario_id = $1', [usuId]);
  const persoId = perR.rows[0].id;
  console.log('✅ Personal:', persoId);

  // 5. Migración 004: agregar constraint si no existe
  try {
    await query(`
      ALTER TABLE asignaciones_grupo
        ADD CONSTRAINT uq_asignaciones_grupo
        UNIQUE (personal_id, grupo_id, ciclo_id)
    `);
    console.log('✅ Constraint uq_asignaciones_grupo agregado');
  } catch (e) {
    if (e.message.includes('already exists')) {
      console.log('ℹ️  Constraint ya existe');
    } else {
      // Limpiar duplicados e intentar de nuevo
      await query(`
        DELETE FROM asignaciones_grupo
        WHERE id NOT IN (
          SELECT DISTINCT ON (personal_id, grupo_id, ciclo_id) id
          FROM asignaciones_grupo
          ORDER BY personal_id, grupo_id, ciclo_id, created_at DESC
        )
      `);
      await query(`
        ALTER TABLE asignaciones_grupo
          ADD CONSTRAINT uq_asignaciones_grupo
          UNIQUE (personal_id, grupo_id, ciclo_id)
      `);
      console.log('✅ Constraint agregado tras limpiar duplicados');
    }
  }

  // 6. Asignación maestra → Maternal (titular, activo)
  await query(`
    INSERT INTO asignaciones_grupo (personal_id, grupo_id, ciclo_id, es_titular, activo)
    VALUES ($1, $2, $3, true, true)
    ON CONFLICT (personal_id, grupo_id, ciclo_id)
    DO UPDATE SET es_titular = true, activo = true
  `, [persoId, grupoId, cicloId]);
  console.log('✅ Asignación Maternal confirmada');

  // 7. Alumna de prueba en Maternal
  const alumnaR = await query(`
    SELECT id FROM alumnos
    WHERE nombre_completo = 'Ana García López' AND deleted_at IS NULL
    LIMIT 1
  `);

  if (alumnaR.rows.length) {
    // Ya existe — asegurar que esté en Maternal e inscrita
    await query(`
      UPDATE alumnos SET grupo_id = $1, ciclo_id = $2, estado = 'inscrito', usa_panial = true
      WHERE id = $3
    `, [grupoId, cicloId, alumnaR.rows[0].id]);
    console.log('✅ Alumna actualizada en Maternal:', alumnaR.rows[0].id);
  } else {
    const newA = await query(`
      INSERT INTO alumnos (nombre_completo, fecha_nacimiento, grupo_id, ciclo_id, estado, usa_panial)
      VALUES ('Ana García López', '2022-03-15', $1, $2, 'inscrito', true)
      RETURNING id
    `, [grupoId, cicloId]);
    console.log('✅ Alumna creada:', newA.rows[0].id);
  }

  console.log('\n🏁 Setup maternal completo');
  console.log('   Email:     maternal@happyschool.edu.mx');
  console.log('   Contraseña: HappySchool2026!');
  process.exit(0);
}

main().catch(err => {
  console.error('❌', err.message);
  process.exit(1);
});
