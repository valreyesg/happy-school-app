require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

const FOTO_PH = 'https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/samples/people/smiling-man.jpg';
const INE_PH  = 'https://res.cloudinary.com/demo/image/upload/v1/samples/imagecon-group.jpg';
const PASS    = 'HappySchool2026!';

// ────────────────────────────────────────────────────────────────────────────
// DATOS: 25 alumnos (5 por grupo)
// ────────────────────────────────────────────────────────────────────────────
const ALUMNOS = [
  // Maternal (usa_panial: true)
  { nombre: 'Ana García López',           fn: '2022-03-15', curp: 'GALA220315MDFRLNA1', grupo: 'Maternal',  panial: true  },
  { nombre: 'Sofía Ramírez Torres',       fn: '2022-07-20', curp: 'RATS220720MDFMRFA1', grupo: 'Maternal',  panial: true  },
  { nombre: 'Mateo López Hernández',      fn: '2022-11-05', curp: 'LOHM221105HDFLPAA1', grupo: 'Maternal',  panial: true  },
  { nombre: 'Isabella Morales Díaz',      fn: '2021-12-10', curp: 'MODI211210MDFRRBA1', grupo: 'Maternal',  panial: true  },
  { nombre: 'Emilio Vega Sánchez',        fn: '2022-08-22', curp: 'VESE220822HDFGNAA1', grupo: 'Maternal',  panial: true  },
  // Prekinder
  { nombre: 'Valeria Flores Ruiz',        fn: '2021-04-18', curp: 'FORV210418MDFLRLA1', grupo: 'Prekinder', panial: false },
  { nombre: 'Santiago Gutiérrez Mendoza', fn: '2021-09-30', curp: 'GUMS210930HDFTNAA1', grupo: 'Prekinder', panial: false },
  { nombre: 'Camila Torres García',       fn: '2021-06-14', curp: 'TOGC210614MDFRRMA1', grupo: 'Prekinder', panial: false },
  { nombre: 'Sebastián Medina Castro',    fn: '2021-02-08', curp: 'MECS210208HDFDSBA1', grupo: 'Prekinder', panial: false },
  { nombre: 'Lucía Jiménez Vargas',       fn: '2021-11-25', curp: 'JIVL211125MDFFMCA1', grupo: 'Prekinder', panial: false },
  // Kinder 1A
  { nombre: 'Diego Hernández Moreno',     fn: '2020-03-22', curp: 'HEMD200322HDFRNAA1', grupo: 'Kinder 1A',  panial: false },
  { nombre: 'Gabriela Martínez Silva',    fn: '2020-08-17', curp: 'MASG200817MDFRRLA1', grupo: 'Kinder 1A',  panial: false },
  { nombre: 'Andrés Reyes Ortega',        fn: '2020-05-11', curp: 'REOA200511HDFRYNA1', grupo: 'Kinder 1A',  panial: false },
  // Kinder 1B
  { nombre: 'María Fernanda Castillo',    fn: '2020-10-03', curp: 'CALM201003MDFRRNA1', grupo: 'Kinder 1B',  panial: false, alergias: 'Cacahuates' },
  { nombre: 'Rodrigo Núñez Paredes',      fn: '2020-01-28', curp: 'NUPR200128HDFRZNA1', grupo: 'Kinder 1B',  panial: false },
  // Kinder 2
  { nombre: 'Alejandro Soto Venegas',     fn: '2019-06-15', curp: 'SOVA190615HDFTNLA1', grupo: 'Kinder 2',  panial: false },
  { nombre: 'Daniela Cruz Méndez',        fn: '2019-09-20', curp: 'CUMD190920MDFRRNA1', grupo: 'Kinder 2',  panial: false },
  { nombre: 'Nicolás Aguilar Ríos',       fn: '2019-04-05', curp: 'AIRN190405HDFGLCA1', grupo: 'Kinder 2',  panial: false },
  { nombre: 'Fernanda Espinoza Luna',     fn: '2019-11-12', curp: 'ESIF191112MDFPNRA1', grupo: 'Kinder 2',  panial: false },
  { nombre: 'Rafael Delgado Fuentes',     fn: '2019-07-30', curp: 'DEFR190730HDFLLFA1', grupo: 'Kinder 2',  panial: false },
  // Kinder 3
  { nombre: 'Mariana Herrera Campos',     fn: '2018-03-08', curp: 'HECM180308MDFRRNA1', grupo: 'Kinder 3',  panial: false },
  { nombre: 'Pablo Rojas Espino',         fn: '2018-08-25', curp: 'ROEP180825HDFBJLA1', grupo: 'Kinder 3',  panial: false },
  { nombre: 'Valentina Mendoza García',   fn: '2018-06-19', curp: 'MEGV180619MDFNLTA1', grupo: 'Kinder 3',  panial: false },
  { nombre: 'Carlos Eduardo Vargas',      fn: '2018-02-14', curp: 'VAMC180214HDFRGLA1', grupo: 'Kinder 3',  panial: false },
  { nombre: 'Regina Palma Cerda',         fn: '2018-10-07', curp: 'PACR181007MDFLLGA1', grupo: 'Kinder 3',  panial: false },
];

// ────────────────────────────────────────────────────────────────────────────
// FAMILIAS: mama, papa (opcional), autorizado
// ────────────────────────────────────────────────────────────────────────────
const FAMILIAS = [
  { curp: 'GALA220315MDFRLNA1',
    mama: { nombre: 'Laura López Vega',           email: 'mama.ana@happyschool.edu.mx',       tel: '5510001001' },
    // Papá Demo ya existe del seed original, solo agregamos mamá
    autorizado: { nombre: 'Abuela Rosa García',        parentesco: 'Abuela', tel: '5510001002' } },

  { curp: 'RATS220720MDFMRFA1',
    mama: { nombre: 'Patricia Torres Gutiérrez', email: 'mama.sofia@happyschool.edu.mx',      tel: '5510002001' },
    papa: { nombre: 'Roberto Ramírez Cruz',       email: 'papa.sofia@happyschool.edu.mx',      tel: '5510002002' },
    autorizado: { nombre: 'Tía Carmen Ramírez',        parentesco: 'Tía',    tel: '5510002003' } },

  { curp: 'LOHM221105HDFLPAA1',
    mama: { nombre: 'Elena Hernández Soto',       email: 'mama.mateo@happyschool.edu.mx',      tel: '5510003001' },
    papa: { nombre: 'José López Reyes',           email: 'papa.mateo@happyschool.edu.mx',      tel: '5510003002' },
    autorizado: { nombre: 'Abuela Consuelo López',     parentesco: 'Abuela', tel: '5510003003' } },

  { curp: 'MODI211210MDFRRBA1',
    mama: { nombre: 'Gabriela Díaz Flores',       email: 'mama.isabella@happyschool.edu.mx',   tel: '5510004001' },
    papa: { nombre: 'Fernando Morales Vega',      email: 'papa.isabella@happyschool.edu.mx',   tel: '5510004002' },
    autorizado: { nombre: 'Tío Marco Morales',         parentesco: 'Tío',    tel: '5510004003' } },

  { curp: 'VESE220822HDFGNAA1',
    mama: { nombre: 'Alejandra Sánchez Ruiz',     email: 'mama.emilio@happyschool.edu.mx',     tel: '5510005001' },
    papa: { nombre: 'Miguel Vega Castro',         email: 'papa.emilio@happyschool.edu.mx',     tel: '5510005002' },
    autorizado: { nombre: 'Abuela Esperanza Sánchez',  parentesco: 'Abuela', tel: '5510005003' } },

  { curp: 'FORV210418MDFLRLA1',
    mama: { nombre: 'Claudia Ruiz Jiménez',       email: 'mama.vflores@happyschool.edu.mx',    tel: '5510006001' },
    papa: { nombre: 'Arturo Flores Medina',       email: 'papa.vflores@happyschool.edu.mx',    tel: '5510006002' },
    autorizado: { nombre: 'Abuela Dolores Ruiz',       parentesco: 'Abuela', tel: '5510006003' } },

  { curp: 'GUMS210930HDFTNAA1',
    mama: { nombre: 'María Mendoza Torres',       email: 'mama.santiago@happyschool.edu.mx',   tel: '5510007001' },
    papa: { nombre: 'Luis Gutiérrez Paredes',     email: 'papa.santiago@happyschool.edu.mx',   tel: '5510007002' },
    autorizado: { nombre: 'Tía Lucía Gutiérrez',       parentesco: 'Tía',    tel: '5510007003' } },

  { curp: 'TOGC210614MDFRRMA1',
    mama: { nombre: 'Adriana García López',       email: 'mama.camila@happyschool.edu.mx',     tel: '5510008001' },
    papa: { nombre: 'Héctor Torres Núñez',        email: 'papa.camila@happyschool.edu.mx',     tel: '5510008002' },
    autorizado: { nombre: 'Abuela Soledad García',     parentesco: 'Abuela', tel: '5510008003' } },

  { curp: 'MECS210208HDFDSBA1',
    mama: { nombre: 'Verónica Castro Delgado',    email: 'mama.sebastian@happyschool.edu.mx',  tel: '5510009001' },
    papa: { nombre: 'Jorge Medina Ramos',         email: 'papa.sebastian@happyschool.edu.mx',  tel: '5510009002' },
    autorizado: { nombre: 'Tío Felipe Castro',         parentesco: 'Tío',    tel: '5510009003' } },

  { curp: 'JIVL211125MDFFMCA1',
    mama: { nombre: 'Sandra Vargas Ortega',       email: 'mama.lucia@happyschool.edu.mx',      tel: '5510010001' },
    papa: { nombre: 'Raúl Jiménez Cruz',          email: 'papa.lucia@happyschool.edu.mx',      tel: '5510010002' },
    autorizado: { nombre: 'Abuela Mercedes Vargas',    parentesco: 'Abuela', tel: '5510010003' } },

  { curp: 'HEMD200322HDFRNAA1',
    mama: { nombre: 'Rosa Moreno Espinoza',       email: 'mama.diego@happyschool.edu.mx',      tel: '5510011001' },
    papa: { nombre: 'Eduardo Hernández Vega',     email: 'papa.diego@happyschool.edu.mx',      tel: '5510011002' },
    autorizado: { nombre: 'Tía Norma Moreno',          parentesco: 'Tía',    tel: '5510011003' } },

  { curp: 'MASG200817MDFRRLA1',
    mama: { nombre: 'Irene Silva Guerrero',       email: 'mama.gabriela@happyschool.edu.mx',   tel: '5510012001' },
    papa: { nombre: 'Ricardo Martínez Luna',      email: 'papa.gabriela@happyschool.edu.mx',   tel: '5510012002' },
    autorizado: { nombre: 'Abuela Teresa Silva',       parentesco: 'Abuela', tel: '5510012003' } },

  { curp: 'REOA200511HDFRYNA1',
    mama: { nombre: 'Mónica Ortega Fuentes',      email: 'mama.andres@happyschool.edu.mx',     tel: '5510013001' },
    papa: { nombre: 'Alfredo Reyes Soto',         email: 'papa.andres@happyschool.edu.mx',     tel: '5510013002' },
    autorizado: { nombre: 'Abuela Pilar Ortega',       parentesco: 'Abuela', tel: '5510013003' } },

  { curp: 'CALM201003MDFRRNA1',
    mama: { nombre: 'Diana López Mendoza',        email: 'mama.mfernanda@happyschool.edu.mx',  tel: '5510014001' },
    papa: { nombre: 'Carlos Castillo Ríos',       email: 'papa.mfernanda@happyschool.edu.mx',  tel: '5510014002' },
    autorizado: { nombre: 'Tía Cristina Castillo',     parentesco: 'Tía',    tel: '5510014003' } },

  { curp: 'NUPR200128HDFRZNA1',
    mama: { nombre: 'Gloria Paredes Herrera',     email: 'mama.rodrigo@happyschool.edu.mx',    tel: '5510015001' },
    papa: { nombre: 'Antonio Núñez Aguilar',      email: 'papa.rodrigo@happyschool.edu.mx',    tel: '5510015002' },
    autorizado: { nombre: 'Abuela Carmen Paredes',     parentesco: 'Abuela', tel: '5510015003' } },

  { curp: 'SOVA190615HDFTNLA1',
    mama: { nombre: 'Beatriz Venegas Cárdenas',   email: 'mama.alejandro@happyschool.edu.mx',  tel: '5510016001' },
    papa: { nombre: 'Marco Soto Jiménez',         email: 'papa.alejandro@happyschool.edu.mx',  tel: '5510016002' },
    autorizado: { nombre: 'Abuela Amparo Venegas',     parentesco: 'Abuela', tel: '5510016003' } },

  { curp: 'CUMD190920MDFRRNA1',
    mama: { nombre: 'Silvia Méndez Vargas',       email: 'mama.daniela@happyschool.edu.mx',    tel: '5510017001' },
    papa: { nombre: 'Enrique Cruz Salinas',       email: 'papa.daniela@happyschool.edu.mx',    tel: '5510017002' },
    autorizado: { nombre: 'Tía Olga Méndez',           parentesco: 'Tía',    tel: '5510017003' } },

  { curp: 'AIRN190405HDFGLCA1',
    mama: { nombre: 'Leticia Ríos Contreras',     email: 'mama.nicolas@happyschool.edu.mx',    tel: '5510018001' },
    papa: { nombre: 'Víctor Aguilar Morales',     email: 'papa.nicolas@happyschool.edu.mx',    tel: '5510018002' },
    autorizado: { nombre: 'Abuela Josefina Ríos',      parentesco: 'Abuela', tel: '5510018003' } },

  { curp: 'ESIF191112MDFPNRA1',
    mama: { nombre: 'Rebeca Luna Pedraza',        email: 'mama.fernanda@happyschool.edu.mx',   tel: '5510019001' },
    papa: { nombre: 'Omar Espinoza Téllez',       email: 'papa.fernanda@happyschool.edu.mx',   tel: '5510019002' },
    autorizado: { nombre: 'Tío Gerardo Luna',          parentesco: 'Tío',    tel: '5510019003' } },

  { curp: 'DEFR190730HDFLLFA1',
    mama: { nombre: 'Norma Fuentes Blanco',       email: 'mama.rafael@happyschool.edu.mx',     tel: '5510020001' },
    papa: { nombre: 'Javier Delgado Ibarra',      email: 'papa.rafael@happyschool.edu.mx',     tel: '5510020002' },
    autorizado: { nombre: 'Abuela Esperanza Fuentes',  parentesco: 'Abuela', tel: '5510020003' } },

  { curp: 'HECM180308MDFRRNA1',
    mama: { nombre: 'Liliana Campos Sandoval',    email: 'mama.mariana@happyschool.edu.mx',    tel: '5510021001' },
    papa: { nombre: 'Ernesto Herrera Vásquez',    email: 'papa.mariana@happyschool.edu.mx',    tel: '5510021002' },
    autorizado: { nombre: 'Abuela Yolanda Campos',     parentesco: 'Abuela', tel: '5510021003' } },

  { curp: 'ROEP180825HDFBJLA1',
    mama: { nombre: 'Cecilia Espino Guerrero',    email: 'mama.pablo@happyschool.edu.mx',      tel: '5510022001' },
    papa: { nombre: 'Gustavo Rojas Peralta',      email: 'papa.pablo@happyschool.edu.mx',      tel: '5510022002' },
    autorizado: { nombre: 'Tía Susana Espino',         parentesco: 'Tía',    tel: '5510022003' } },

  { curp: 'MEGV180619MDFNLTA1',
    mama: { nombre: 'Fabiola García Reyes',       email: 'mama.valentina@happyschool.edu.mx',  tel: '5510023001' },
    papa: { nombre: 'Sergio Mendoza Ávila',       email: 'papa.valentina@happyschool.edu.mx',  tel: '5510023002' },
    autorizado: { nombre: 'Abuela Victoria García',    parentesco: 'Abuela', tel: '5510023003' } },

  { curp: 'VAMC180214HDFRGLA1',
    mama: { nombre: 'Alma Mora Elizondo',         email: 'mama.carlos@happyschool.edu.mx',     tel: '5510024001' },
    papa: { nombre: 'Rogelio Vargas Padilla',     email: 'papa.carlos@happyschool.edu.mx',     tel: '5510024002' },
    autorizado: { nombre: 'Tío Rubén Mora',            parentesco: 'Tío',    tel: '5510024003' } },

  { curp: 'PACR181007MDFLLGA1',
    mama: { nombre: 'Estela Cerda Bravo',         email: 'mama.regina@happyschool.edu.mx',     tel: '5510025001' },
    papa: { nombre: 'Hugo Palma Salazar',         email: 'papa.regina@happyschool.edu.mx',     tel: '5510025002' },
    autorizado: { nombre: 'Abuela Refugio Cerda',      parentesco: 'Abuela', tel: '5510025003' } },
];

// ────────────────────────────────────────────────────────────────────────────
async function seed() {
  console.log('🌱 Iniciando seed de datos reales...\n');
  const passwordHash = await bcrypt.hash(PASS, 12);

  // Ciclo activo
  const cicloR = await query('SELECT id FROM ciclos_escolares WHERE activo = true LIMIT 1');
  if (!cicloR.rows.length) { console.error('❌ No hay ciclo escolar activo. Ejecuta seed.js primero.'); process.exit(1); }
  const cicloId = cicloR.rows[0].id;

  // Grupos
  const gruposDB = await query('SELECT id, nombre FROM grupos WHERE ciclo_id = $1', [cicloId]);
  const grupoId  = (nombre) => gruposDB.rows.find(g => g.nombre === nombre)?.id;

  // ── 1. Alumnos ─────────────────────────────────────────────────────────────
  // Ana García López (primer alumno) ya existe sin CURP — actualizar para evitar duplicado
  await query(`
    UPDATE alumnos SET curp = 'GALA220315MDFRLNA1', updated_at = NOW()
    WHERE nombre_completo = 'Ana García López' AND curp IS NULL
  `);

  const alumnoIds = {};
  let nuevos = 0;
  for (const a of ALUMNOS) {
    const gId = grupoId(a.grupo);
    // Buscar primero por curp para evitar duplicados (sin constraint unique en DB)
    const ex = await query('SELECT id FROM alumnos WHERE curp = $1', [a.curp]);
    if (ex.rows.length > 0) {
      alumnoIds[a.curp] = ex.rows[0].id;
    } else {
      const r = await query(`
        INSERT INTO alumnos (nombre_completo, fecha_nacimiento, curp, grupo_id, ciclo_id, usa_panial, alergias)
        VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id
      `, [a.nombre, a.fn, a.curp, gId, cicloId, a.panial, a.alergias || null]);
      alumnoIds[a.curp] = r.rows[0].id;
      nuevos++;
    }
  }
  console.log(`✅ Alumnos: ${nuevos} nuevos, ${ALUMNOS.length - nuevos} ya existían (total ${ALUMNOS.length})`);

  // ── Helper: crear padre/madre ──────────────────────────────────────────────
  async function crearPadre(info, parentesco, alumnoId, esPrincipal) {
    if (!info || !alumnoId) return;

    const ur = await query(`
      INSERT INTO usuarios (nombre, email, telefono, password_hash, rol_principal)
      VALUES ($1, $2, $3, $4, 'padre')
      ON CONFLICT (email) DO NOTHING RETURNING id
    `, [info.nombre, info.email, info.tel, passwordHash]);

    let usuId = ur.rows[0]?.id;
    if (!usuId) {
      const ex = await query('SELECT id FROM usuarios WHERE email = $1', [info.email]);
      usuId = ex.rows[0]?.id;
    }
    if (!usuId) return;

    const pr = await query(`
      INSERT INTO padres (usuario_id, nombre_completo, telefono, parentesco)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (usuario_id) DO NOTHING RETURNING id
    `, [usuId, info.nombre, info.tel, parentesco]);

    let padreId = pr.rows[0]?.id;
    if (!padreId) {
      const ex = await query('SELECT id FROM padres WHERE usuario_id = $1', [usuId]);
      padreId = ex.rows[0]?.id;
    }
    if (!padreId) return;

    await query(`
      INSERT INTO alumno_padre (alumno_id, padre_id, es_tutor_principal)
      VALUES ($1, $2, $3)
      ON CONFLICT DO NOTHING
    `, [alumnoId, padreId, esPrincipal]);
  }

  // ── Helper: crear persona autorizada ──────────────────────────────────────
  async function crearAutorizado(info, alumnoId) {
    if (!info || !alumnoId) return;
    const ex = await query(
      'SELECT id FROM personas_autorizadas WHERE alumno_id = $1 AND nombre_completo = $2',
      [alumnoId, info.nombre]
    );
    if (ex.rows.length > 0) return;
    await query(`
      INSERT INTO personas_autorizadas
        (alumno_id, nombre_completo, parentesco, telefono, foto_url, ine_frente_url, ine_reverso_url)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [alumnoId, info.nombre, info.parentesco, info.tel, FOTO_PH, INE_PH, INE_PH]);
  }

  // ── 2. Familias ────────────────────────────────────────────────────────────
  let familiaCount = 0;
  for (const f of FAMILIAS) {
    const alumnoId = alumnoIds[f.curp];
    if (!alumnoId) { console.warn(`⚠️  Sin ID para curp ${f.curp}`); continue; }

    await crearPadre(f.mama, 'madre', alumnoId, true);
    if (f.papa) await crearPadre(f.papa, 'padre', alumnoId, false);
    await crearAutorizado(f.autorizado, alumnoId);
    familiaCount++;
  }
  console.log(`✅ Familias procesadas: ${familiaCount}`);

  // ── Resumen ────────────────────────────────────────────────────────────────
  const totAlumnos = await query('SELECT COUNT(*) FROM alumnos WHERE deleted_at IS NULL');
  const totPadres  = await query('SELECT COUNT(*) FROM padres');
  const totAuth    = await query('SELECT COUNT(*) FROM personas_autorizadas');

  console.log('\n🏫 ─────────────────────────────────────────────');
  console.log(`   Alumnos activos:           ${totAlumnos.rows[0].count}`);
  console.log(`   Padres/Madres/Tutores:     ${totPadres.rows[0].count}`);
  console.log(`   Personas autorizadas:      ${totAuth.rows[0].count}`);
  console.log('─────────────────────────────────────────────────');
  console.log('\n📋 Contraseña de todos: HappySchool2026!');
  console.log('\n📧 Ejemplos de acceso como padre:');
  console.log('   mama.ana@happyschool.edu.mx        → Ana García López (Maternal)');
  console.log('   mama.sofia@happyschool.edu.mx      → Sofía Ramírez Torres (Maternal)');
  console.log('   mama.valeria@... → usa mama.vflores@happyschool.edu.mx (Prekinder)');
  console.log('   mama.mariana@happyschool.edu.mx    → Mariana Herrera Campos (Kinder 3)');
  console.log('   mama.regina@happyschool.edu.mx     → Regina Palma Cerda (Kinder 3)');
  console.log('\n✅ Seed de datos reales completado.\n');
  process.exit(0);
}

seed().catch(err => {
  console.error('❌ Error en seed_datos_reales:', err.message);
  console.error(err);
  process.exit(1);
});
