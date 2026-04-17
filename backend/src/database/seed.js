require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

async function seed() {
  console.log('🌱 Iniciando seed de la base de datos...');

  const passwordHash = await bcrypt.hash('HappySchool2026!', 12);

  // ── Ciclo escolar ──────────────────────────────────────────────────────────
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
  console.log('✅ Ciclo escolar listo');

  // ── Grupos ─────────────────────────────────────────────────────────────────
  const gruposDef = [
    { nombre: 'Maternal',  nivel: 'Maternal',  codigo: 'maternal',  color: '#FC8181' },
    { nombre: 'Prekinder', nivel: 'Prekinder', codigo: 'prekinder', color: '#F6E05E' },
    { nombre: 'Kinder 1',  nivel: 'Kinder 1',  codigo: 'kinder1',   color: '#68D391' },
    { nombre: 'Kinder 2',  nivel: 'Kinder 2',  codigo: 'kinder2',   color: '#4299E1' },
    { nombre: 'Kinder 3',  nivel: 'Kinder 3',  codigo: 'kinder3',   color: '#B794F4' },
  ];
  for (const g of gruposDef) {
    await query(`
      INSERT INTO grupos (nombre, nivel, nivel_codigo, ciclo_id, color_hex)
      VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING
    `, [g.nombre, g.nivel, g.codigo, cicloId, g.color]);
  }
  // Obtener IDs de grupos
  const gruposDB = await query('SELECT id, nombre FROM grupos WHERE ciclo_id = $1', [cicloId]);
  const grupoId = (nombre) => gruposDB.rows.find(g => g.nombre === nombre)?.id;
  console.log('✅ Grupos creados');

  // ── Usuarios del sistema ───────────────────────────────────────────────────
  await query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
    VALUES ('Directora Demo', 'directora@happyschool.edu.mx', '5500000001', $1, 'directora')
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);

  await query(`
    INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
    VALUES ('Administrativo Demo', 'admin@happyschool.edu.mx', '5500000002', $1, 'administrativo')
    ON CONFLICT (email) DO NOTHING
  `, [passwordHash]);

  // ── Maestras de prueba ─────────────────────────────────────────────────────
  const maestrasDef = [
    { nombre: 'Maestra Maternal',  email: 'maternal@happyschool.edu.mx',  tel: '5500000010', grupo: 'Maternal'  },
    { nombre: 'Maestra Prekinder', email: 'prekinder@happyschool.edu.mx', tel: '5500000011', grupo: 'Prekinder' },
    { nombre: 'Maestra Kinder 1',  email: 'kinder1@happyschool.edu.mx',   tel: '5500000012', grupo: 'Kinder 1'  },
    { nombre: 'Maestra Kinder 2',  email: 'kinder2@happyschool.edu.mx',   tel: '5500000013', grupo: 'Kinder 2'  },
    { nombre: 'Maestra Kinder 3',  email: 'kinder3@happyschool.edu.mx',   tel: '5500000014', grupo: 'Kinder 3'  },
  ];
  for (const m of maestrasDef) {
    const ur = await query(`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
      VALUES ($1, $2, $3, $4, 'maestra_titular')
      ON CONFLICT (email) DO NOTHING RETURNING id
    `, [m.nombre, m.email, m.tel, passwordHash]);

    let usuarioId;
    if (ur.rows.length > 0) {
      usuarioId = ur.rows[0].id;
    } else {
      const ex = await query('SELECT id FROM usuarios WHERE email = $1', [m.email]);
      usuarioId = ex.rows[0]?.id;
    }
    if (!usuarioId) continue;

    // Crear registro en personal
    const pr = await query(`
      INSERT INTO personal (usuario_id, nombre_completo)
      VALUES ($1, $2)
      ON CONFLICT (usuario_id) DO NOTHING RETURNING id
    `, [usuarioId, m.nombre]);

    let personalId;
    if (pr.rows.length > 0) {
      personalId = pr.rows[0].id;
    } else {
      const ex = await query('SELECT id FROM personal WHERE usuario_id = $1', [usuarioId]);
      personalId = ex.rows[0]?.id;
    }
    if (!personalId) continue;

    // Asignar al grupo como titular
    const gId = grupoId(m.grupo);
    if (gId) {
      await query(`
        INSERT INTO asignaciones_grupo (personal_id, grupo_id, ciclo_id, es_titular, activo)
        VALUES ($1, $2, $3, true, true)
        ON CONFLICT DO NOTHING
      `, [personalId, gId, cicloId]);
    }
  }
  console.log('✅ Maestras de prueba creadas (5)');

  // ── Alumno de prueba para el padre ────────────────────────────────────────
  const gMaternal = grupoId('Maternal');
  const alumnoR = await query(`
    INSERT INTO alumnos (nombre_completo, fecha_nacimiento, grupo_id, ciclo_id, usa_panial)
    VALUES ('Ana García López', '2022-03-15', $1, $2, true)
    ON CONFLICT DO NOTHING RETURNING id
  `, [gMaternal, cicloId]);

  let alumnoId;
  if (alumnoR.rows.length > 0) {
    alumnoId = alumnoR.rows[0].id;
  } else {
    const ex = await query(`SELECT id FROM alumnos WHERE nombre_completo = 'Ana García López' LIMIT 1`);
    alumnoId = ex.rows[0]?.id;
  }

  // ── Usuario padre vinculado al alumno de prueba ───────────────────────────
  if (alumnoId) {
    const padreUsuR = await query(`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
      VALUES ('Papá Demo', 'padre@happyschool.edu.mx', '5500000020', $1, 'padre')
      ON CONFLICT (email) DO NOTHING RETURNING id
    `, [passwordHash]);

    let padreUsuId;
    if (padreUsuR.rows.length > 0) {
      padreUsuId = padreUsuR.rows[0].id;
    } else {
      const ex = await query(`SELECT id FROM usuarios WHERE email = 'padre@happyschool.edu.mx'`);
      padreUsuId = ex.rows[0]?.id;
    }

    if (padreUsuId) {
      // Registro en tabla padres (requiere nombre_completo y telefono NOT NULL)
      const padreR = await query(`
        INSERT INTO padres (usuario_id, nombre_completo, telefono, parentesco)
        VALUES ($1, 'Papá Demo', '5500000020', 'padre')
        ON CONFLICT (usuario_id) DO NOTHING RETURNING id
      `, [padreUsuId]);

      let padreId;
      if (padreR.rows.length > 0) {
        padreId = padreR.rows[0].id;
      } else {
        const ex = await query('SELECT id FROM padres WHERE usuario_id = $1', [padreUsuId]);
        padreId = ex.rows[0]?.id;
      }

      // Vincular padre ↔ alumno en alumno_padre
      if (padreId) {
        await query(`
          INSERT INTO alumno_padre (alumno_id, padre_id, es_tutor_principal)
          VALUES ($1, $2, true)
          ON CONFLICT DO NOTHING
        `, [alumnoId, padreId]);
      }
    }
    console.log('✅ Alumno de prueba y padre demo creados');
  }

  // ── Categorías de eventos ──────────────────────────────────────────────────
  const categoriasEvento = [
    { nombre: 'Festivo / Día libre',   color: '#E53E3E', icono: '🏖️' },
    { nombre: 'Evento escolar',        color: '#805AD5', icono: '🎉' },
    { nombre: 'Entrega de boletas',    color: '#38A169', icono: '📋' },
    { nombre: 'Reunión de padres',     color: '#D69E2E', icono: '👨‍👩‍👧' },
    { nombre: 'Taller / Actividad',    color: '#319795', icono: '🎨' },
    { nombre: 'Pago / Administrativo', color: '#2B6CB0', icono: '💰' },
    { nombre: 'Excursión',             color: '#C05621', icono: '🚌' },
  ];
  for (const cat of categoriasEvento) {
    await query(
      'INSERT INTO categorias_evento (nombre, color_hex, icono) VALUES ($1,$2,$3) ON CONFLICT DO NOTHING',
      [cat.nombre, cat.color, cat.icono]
    );
  }
  console.log('✅ Categorías de eventos creadas');

  // ── Conceptos de pago de prueba ────────────────────────────────────────────
  const conceptosDef = [
    { nombre: 'Colegiatura mensual', tipo: 'colegiatura', monto: 1800, es_mensual: true, dia_pago: 1, dia_recargo: 6, recargo_dia: 50 },
    { nombre: 'Servicio de comida',  tipo: 'comida',      monto: 600,  es_mensual: true, dia_pago: 1, dia_recargo: 6, recargo_dia: 0  },
    { nombre: 'Material didáctico',  tipo: 'material',    monto: 350,  es_mensual: false, dia_pago: null, dia_recargo: null, recargo_dia: 0 },
  ];
  for (const cp of conceptosDef) {
    await query(`
      INSERT INTO conceptos_pago
        (nombre, tipo, monto, es_mensual, es_recurrente, dia_pago, dia_recargo, monto_recargo_dia)
      VALUES ($1,$2,$3,$4,$4,$5,$6,$7)
      ON CONFLICT DO NOTHING
    `, [cp.nombre, cp.tipo, cp.monto, cp.es_mensual, cp.dia_pago, cp.dia_recargo, cp.recargo_dia]);
  }
  console.log('✅ Conceptos de pago de prueba creados');

  // ── Resumen ────────────────────────────────────────────────────────────────
  console.log('\n🏫 Seed completado exitosamente');
  console.log('\n📋 Credenciales de acceso (contraseña igual para todos: HappySchool2026!)');
  console.log('');
  console.log('  ROL DIRECTORA:');
  console.log('    directora@happyschool.edu.mx');
  console.log('');
  console.log('  ROL ADMINISTRATIVO:');
  console.log('    admin@happyschool.edu.mx');
  console.log('');
  console.log('  ROL MAESTRA TITULAR (una por grupo):');
  console.log('    maternal@happyschool.edu.mx   → Grupo Maternal');
  console.log('    prekinder@happyschool.edu.mx  → Grupo Prekinder');
  console.log('    kinder1@happyschool.edu.mx    → Grupo Kinder 1');
  console.log('    kinder2@happyschool.edu.mx    → Grupo Kinder 2');
  console.log('    kinder3@happyschool.edu.mx    → Grupo Kinder 3');
  console.log('');
  console.log('  ROL PADRE (vinculado a alumna "Ana García López", Maternal):');
  console.log('    padre@happyschool.edu.mx');
  console.log('');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
