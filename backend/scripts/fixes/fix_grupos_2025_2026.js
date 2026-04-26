require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query, getClient } = require('../../src/config/database');

async function fixGrupos() {
  const client = await getClient();

  try {
    console.log('🔧 Iniciando limpieza y reestructuración de grupos 2025-2026...\n');

    await client.query('BEGIN');

    // ── 1. Obtener ciclo 2025-2026 ──────────────────────────────────────────
    const cicloResult = await client.query(
      `SELECT id FROM ciclos_escolares WHERE nombre = '2025-2026' LIMIT 1`
    );

    if (cicloResult.rows.length === 0) {
      throw new Error('❌ No se encontró el ciclo 2025-2026');
    }

    const cicloId = cicloResult.rows[0].id;
    console.log(`✅ Ciclo 2025-2026 encontrado: ${cicloId}\n`);

    // ── 2. Verificar grupos actuales ─────────────────────────────────────────
    const gruposActualesResult = await client.query(
      `SELECT id, nombre FROM grupos
       WHERE ciclo_id = $1 AND deleted_at IS NULL
       ORDER BY nombre`,
      [cicloId]
    );

    console.log('📋 Grupos actuales en la BD:');
    gruposActualesResult.rows.forEach(g => console.log(`   - ${g.nombre} (${g.id})`));
    console.log('');

    // ── 3. Renombrar 'Kinder 1' → 'Kinder 1A' ───────────────────────────────
    const renombreResult = await client.query(
      `UPDATE grupos
       SET nombre = 'Kinder 1A', updated_at = NOW()
       WHERE ciclo_id = $1 AND nombre = 'Kinder 1' AND deleted_at IS NULL
       RETURNING id, nombre`,
      [cicloId]
    );

    if (renombreResult.rows.length > 0) {
      console.log('✅ Grupo renombrado: Kinder 1 → Kinder 1A');
      console.log(`   UUID preservada: ${renombreResult.rows[0].id}\n`);
    } else {
      console.log('⚠️  Grupo "Kinder 1" no encontrado (ya puede estar renombrado)\n');
    }

    // ── 4. Crear 'Kinder 1B' si no existe ───────────────────────────────────
    const nuevoK1BResult = await client.query(
      `INSERT INTO grupos (nombre, nivel, nivel_codigo, ciclo_id, color_hex)
       VALUES ('Kinder 1B', 'Kinder 1', 'kinder1', $1, '#4FD1C5')
       ON CONFLICT (nombre, ciclo_id) WHERE deleted_at IS NULL DO NOTHING
       RETURNING id, nombre`,
      [cicloId]
    );

    let k1bId;
    if (nuevoK1BResult.rows.length > 0) {
      k1bId = nuevoK1BResult.rows[0].id;
      console.log(`✅ Grupo Kinder 1B creado`);
      console.log(`   UUID nueva: ${k1bId}\n`);
    } else {
      // Si ya existe, obtener su ID
      const existeK1BResult = await client.query(
        `SELECT id FROM grupos WHERE ciclo_id = $1 AND nombre = 'Kinder 1B' AND deleted_at IS NULL`,
        [cicloId]
      );
      if (existeK1BResult.rows.length > 0) {
        k1bId = existeK1BResult.rows[0].id;
        console.log(`⚠️  Grupo Kinder 1B ya existe`);
        console.log(`   UUID: ${k1bId}\n`);
      }
    }

    // ── 5. Verificar que los grupos originales existan ──────────────────────
    const gruposCanonicosExpected = ['Maternal', 'Prekinder', 'Kinder 1A', 'Kinder 2', 'Kinder 3'];
    const gruposVerifyResult = await client.query(
      `SELECT nombre FROM grupos
       WHERE ciclo_id = $1 AND deleted_at IS NULL
       ORDER BY nombre`,
      [cicloId]
    );

    const gruposPresentes = gruposVerifyResult.rows.map(g => g.nombre);
    console.log('✅ Grupos canónicos verificados:');
    gruposCanonicosExpected.forEach(g => {
      const existe = gruposPresentes.includes(g);
      console.log(`   ${existe ? '✓' : '✗'} ${g}`);
    });
    console.log('');

    // ── 6. Soft-delete de grupos sobrantes ──────────────────────────────────
    const gruposCanonicos = [...gruposCanonicosExpected, 'Kinder 1B'];
    const deleteResult = await client.query(
      `UPDATE grupos
       SET deleted_at = NOW(), activo = false, updated_at = NOW()
       WHERE ciclo_id = $1
         AND nombre NOT IN (${gruposCanonicos.map((_, i) => `$${i + 2}`).join(',')})
         AND deleted_at IS NULL
       RETURNING nombre`,
      [cicloId, ...gruposCanonicos]
    );

    if (deleteResult.rows.length > 0) {
      console.log('🗑️  Grupos eliminados (soft-delete):');
      deleteResult.rows.forEach(g => console.log(`   - ${g.nombre}`));
      console.log('');
    } else {
      console.log('✅ No hay grupos sobrantes para eliminar\n');
    }

    // ── 7. Recrear UNIQUE index como índice parcial ─────────────────────────
    await client.query(`DROP INDEX IF EXISTS idx_grupos_nombre_ciclo`);
    await client.query(
      `CREATE UNIQUE INDEX idx_grupos_nombre_ciclo ON grupos (nombre, ciclo_id)
       WHERE deleted_at IS NULL`
    );
    console.log('✅ Índice UNIQUE recreado como índice parcial (excluye deleted_at)\n');

    // ── 8. Crear maestra genérica para Kinder 1B ────────────────────────────
    const passHash = await bcrypt.hash('HappySchool2026!', 12);

    const usuarioK1BResult = await client.query(
      `INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
       VALUES ('Maestra Kinder 1B', 'kinder1b@happyschool.edu.mx', '5500000015', $1, 'maestra_titular')
       ON CONFLICT (email) DO NOTHING
       RETURNING id`,
      [passHash]
    );

    let usuarioK1BId;
    if (usuarioK1BResult.rows.length > 0) {
      usuarioK1BId = usuarioK1BResult.rows[0].id;
      console.log('✅ Usuario para maestra Kinder 1B creado');
      console.log(`   Email: kinder1b@happyschool.edu.mx\n`);
    } else {
      const existeResult = await client.query(
        `SELECT id FROM usuarios WHERE email = 'kinder1b@happyschool.edu.mx'`
      );
      usuarioK1BId = existeResult.rows[0]?.id;
      console.log('⚠️  Usuario para maestra Kinder 1B ya existe\n');
    }

    if (usuarioK1BId && k1bId) {
      const personalK1BResult = await client.query(
        `INSERT INTO personal (usuario_id, nombre_completo)
         VALUES ($1, 'Maestra Kinder 1B')
         ON CONFLICT (usuario_id) DO NOTHING
         RETURNING id`,
        [usuarioK1BId]
      );

      let personalK1BId;
      if (personalK1BResult.rows.length > 0) {
        personalK1BId = personalK1BResult.rows[0].id;
      } else {
        const existePersonalResult = await client.query(
          `SELECT id FROM personal WHERE usuario_id = $1`,
          [usuarioK1BId]
        );
        personalK1BId = existePersonalResult.rows[0]?.id;
      }

      if (personalK1BId) {
        const asignacionResult = await client.query(
          `INSERT INTO asignaciones_grupo (personal_id, grupo_id, ciclo_id, es_titular, activo)
           VALUES ($1, $2, $3, true, true)
           ON CONFLICT DO NOTHING`,
          [personalK1BId, k1bId, cicloId]
        );
        console.log('✅ Maestra Kinder 1B asignada al grupo\n');
      }
    }

    // ── 9. Reasignar alumnos del viejo Kinder 1 → Kinder 1A ─────────────────
    const alumnosK1Result = await client.query(
      `SELECT a.id, a.nombre_completo
       FROM alumnos a
       JOIN grupos g ON a.grupo_id = g.id
       WHERE g.ciclo_id = $1 AND g.nombre = 'Kinder 1A' AND a.deleted_at IS NULL`,
      [cicloId]
    );

    if (alumnosK1Result.rows.length > 0) {
      console.log('ℹ️  Alumnos ya en Kinder 1A (ninguno será movido):');
      alumnosK1Result.rows.forEach(a => console.log(`   - ${a.nombre_completo}`));
      console.log('');
    }

    // ── 10. Resumen final ──────────────────────────────────────────────────
    const gruposFinalResult = await client.query(
      `SELECT COUNT(*) as total FROM grupos
       WHERE ciclo_id = $1 AND deleted_at IS NULL`,
      [cicloId]
    );

    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 RESUMEN DE CAMBIOS');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Total grupos finales: ${gruposFinalResult.rows[0].total}`);
    console.log(`✅ Ciclo: 2025-2026 (${cicloId})`);
    console.log(`✅ Kinder 1B UUID: ${k1bId || 'NO CREADO'}`);
    console.log('═══════════════════════════════════════════════════════\n');

    await client.query('COMMIT');

    console.log('🎉 Limpieza completada exitosamente\n');
    console.log('⚠️  PRÓXIMO PASO: Actualizar seed_semana_13_17_abril.js con el UUID de Kinder 1B');
    console.log(`    Agregar: kinder1b: '${k1bId}' en el objeto "grupos"\n`);

    process.exit(0);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    client.release();
  }
}

fixGrupos().catch(err => {
  console.error('❌ Error fatal:', err);
  process.exit(1);
});
