// Setup: Incidentes y Medicamentos — semana 12-17 abril 2026
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const maestras = {
  maternal:  '1c76edb9-2435-4e29-a6c3-5349681b435a', // Gabriela Soto
  prekinder: 'c52f63bd-6bfc-4d3c-949f-1b17530dd265', // Mónica Vargas
  kinder1:   'c27bbcca-c596-4f0f-bb11-6b47a4c4a287', // Diana Cruz
  kinder2:   '56234fa1-1693-4b2c-8621-7ced975b1907', // Paola Gutiérrez
  kinder3:   'd051b547-c6ba-48e5-8c62-106069b49455', // Andrea Morales
};

const alumnos = [
  { id: '56fc4561-6b30-4031-8228-33c3d8e4372e', nombre: 'Ana García',       grupo: 'maternal' },
  { id: '2ee56308-2835-4924-bc0a-d8a256caa337', nombre: 'Emilio Vega',      grupo: 'maternal' },
  { id: 'b16a4103-b917-4b8d-a02b-7f90840d9675', nombre: 'Isabella Morales', grupo: 'maternal' },
  { id: 'c75e11fa-56ac-4f97-be92-bfec0517602b', nombre: 'Camila Torres',    grupo: 'prekinder' },
  { id: '9ddfaab9-19bf-416d-bb67-31a20d76eec3', nombre: 'Andrés Reyes',     grupo: 'kinder1' },
  { id: '8ff43cbb-b326-4209-b88a-6b3a263e5821', nombre: 'Diego Hernández',  grupo: 'kinder1' },
  { id: '4f66b9da-0a94-449a-9e5c-a45e23aff01e', nombre: 'Alejandro Soto',   grupo: 'kinder2' },
  { id: '6c517c89-8c32-49aa-9d13-2dda520adb92', nombre: 'Carlos Vargas',    grupo: 'kinder3' },
];

const dias = ['2026-04-12','2026-04-13','2026-04-14','2026-04-15','2026-04-16','2026-04-17'];

// MEDICAMENTOS: algunos alumnos con medicinas en ciertos días
const medicamentosData = [
  // Emilio (maternal): Antibiótico martes y miércoles
  { alumnoId: '2ee56308-2835-4924-bc0a-d8a256caa337', fechas: ['2026-04-14','2026-04-15'], nombre: 'Amoxicilina', dosis: '250mg', hora: 10, grupo: 'maternal' },
  // Isabella (maternal): Paracetamol domingo a martes
  { alumnoId: 'b16a4103-b917-4b8d-a02b-7f90840d9675', fechas: ['2026-04-12','2026-04-13','2026-04-14'], nombre: 'Paracetamol', dosis: '120mg', hora: 14, grupo: 'maternal' },
  // Camila (prekinder): Jarabe para tos jueves-viernes
  { alumnoId: 'c75e11fa-56ac-4f97-be92-bfec0517602b', fechas: ['2026-04-16','2026-04-17'], nombre: 'Jarabe Triaminic', dosis: '5ml', hora: 11, grupo: 'prekinder' },
  // Diego (kinder1): Antihistamínico por alergia lunes-miércoles
  { alumnoId: '8ff43cbb-b326-4209-b88a-6b3a263e5821', fechas: ['2026-04-13','2026-04-14','2026-04-15'], nombre: 'Loratadina', dosis: '5mg', hora: 8, grupo: 'kinder1' },
  // Alejandro (kinder2): Vitaminas todos los días
  { alumnoId: '4f66b9da-0a94-449a-9e5c-a45e23aff01e', fechas: dias, nombre: 'Vitamina C', dosis: '250mg', hora: 8, grupo: 'kinder2' },
];

// INCIDENTES: caídas, golpes, peleas, reacciones
const incidentesData = [
  // Lunes 13 abril
  {
    alumnoId: 'b16a4103-b917-4b8d-a02b-7f90840d9675', // Isabella
    fecha: '2026-04-13T10:30:00',
    descripcion: 'Caída en el patio. Se golpeó la rodilla izquierda al correr.',
    acciones: 'Se limpió la herida, se aplicó antiséptico. Sin dolor. Continúa jugando.',
    grupo: 'maternal',
    fotos: ['https://via.placeholder.com/150?text=Rodilla+Golpe']
  },
  // Martes 14 abril
  {
    alumnoId: '9ddfaab9-19bf-416d-bb67-31a20d76eec3', // Andrés K1
    fecha: '2026-04-14T14:15:00',
    descripcion: 'Pelea con compañero por juguete. Recibió rasguño en la mejilla.',
    acciones: 'Se separó a los niños, se habló sobre compartir. Se limpió la herida.',
    grupo: 'kinder1',
    fotos: ['https://via.placeholder.com/150?text=Rasguño+Mejilla']
  },
  // Miércoles 15 abril
  {
    alumnoId: '8ff43cbb-b326-4209-b88a-6b3a263e5821', // Diego K1
    fecha: '2026-04-15T11:45:00',
    descripcion: 'Reacción alérgica en la piel (ronchas) después del almuerzo. Puede ser por fresas.',
    acciones: 'Se notificó a papás inmediatamente. Se dio antihistamínico. Ronchas disminuyeron en 30 min.',
    grupo: 'kinder1',
    fotos: ['https://via.placeholder.com/150?text=Ronchas+Alergia']
  },
  // Jueves 16 abril
  {
    alumnoId: 'c75e11fa-56ac-4f97-be92-bfec0517602b', // Camila Prekinder
    fecha: '2026-04-16T09:20:00',
    descripcion: 'Golpe en la cabeza. Se cayó del resbaladero.',
    acciones: 'Se observó por 2 horas. Sin pérdida de conciencia ni vómitos. Se notificó a papás.',
    grupo: 'prekinder',
    fotos: ['https://via.placeholder.com/150?text=Chichón+Cabeza']
  },
  // Viernes 17 abril
  {
    alumnoId: '6c517c89-8c32-49aa-9d13-2dda520adb92', // Carlos K3
    fecha: '2026-04-17T15:30:00',
    descripcion: 'Vómito durante la actividad. Malestar estomacal (posiblemente comió rápido).',
    acciones: 'Se le dio agua y reposo. Se cambió de ropa. Se notificó a papás.',
    grupo: 'kinder3',
    fotos: []
  },
];

async function setup() {
  const client = await pool.connect();
  let totalMedicamentos = 0, totalIncidentes = 0;

  try {
    console.log('🔄 Limpiando medicamentos y incidentes previos (semana 12-17 abril)...');
    await client.query(`
      DELETE FROM medicamentos
      WHERE fecha >= '2026-04-12' AND fecha <= '2026-04-17'
        AND alumno_id = ANY($1::UUID[])
    `, [alumnos.map(a => a.id)]);

    await client.query(`
      DELETE FROM incidentes
      WHERE DATE(fecha) >= '2026-04-12' AND DATE(fecha) <= '2026-04-17'
        AND alumno_id = ANY($1::UUID[])
    `, [alumnos.map(a => a.id)]);

    console.log('✅ Limpieza completada\n');

    // ── INSERTAR MEDICAMENTOS ────────────────────────────────────────────────
    console.log('💊 Insertando medicamentos...');
    for (const med of medicamentosData) {
      for (const fecha of med.fechas) {
        const horaStr = String(med.hora).padStart(2, '0');
        const hora = new Date(`${fecha}T${horaStr}:00:00-06:00`).toISOString();
        const maestraId = maestras[med.grupo];

        await client.query(`
          INSERT INTO medicamentos
            (alumno_id, fecha, nombre, dosis, hora_administracion, administrado_por, notas)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT DO NOTHING
        `, [
          med.alumnoId,
          fecha,
          med.nombre,
          med.dosis,
          hora,
          maestraId,
          `Administrado por maestra. Dosis: ${med.dosis}`
        ]);
        totalMedicamentos++;
      }
    }
    console.log(`✅ ${totalMedicamentos} registros de medicamentos insertados\n`);

    // ── INSERTAR INCIDENTES ──────────────────────────────────────────────────
    console.log('⚠️  Insertando incidentes...');
    for (const inc of incidentesData) {
      const maestraId = maestras[inc.grupo];

      await client.query(`
        INSERT INTO incidentes
          (alumno_id, fecha, descripcion, acciones_tomadas, fotos_urls, reportado_por)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        inc.alumnoId,
        inc.fecha,
        inc.descripcion,
        inc.acciones,
        inc.fotos.length > 0 ? inc.fotos : null,
        maestraId
      ]);
      totalIncidentes++;
    }
    console.log(`✅ ${totalIncidentes} incidentes insertados\n`);

    console.log('🎉 Setup completado exitosamente');
    console.log(`   Medicamentos: ${totalMedicamentos}`);
    console.log(`   Incidentes: ${totalIncidentes}`);

  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

setup();
