// Seed: bitácoras, entradas y salidas semana 13-17 abril 2026
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ── DATOS ──────────────────────────────────────────────────────────────────
const grupos = {
  maternal:  '9a44b4df-0347-4938-bcd3-008945ff9ac5',
  prekinder: 'ac566ca1-7e1e-480b-babd-f2a529c0abeb',
  kinder1a:  'd692fdae-df6e-4d72-a43a-4c15a00a60d4',  // Renombrado de 'Kinder 1'
  kinder1b:  '9e15894d-0c75-4147-b470-42f29fed9bd5',  // Nuevo grupo Kinder 1B
  kinder2:   '39e16b01-ddf1-40d7-95ee-1cb67737250e',
  kinder3:   '920c245a-797d-4f48-9d3e-939e77b5b09a',
};

const maestras = {
  maternal:  '1c76edb9-2435-4e29-a6c3-5349681b435a', // Gabriela Soto
  prekinder: 'c52f63bd-6bfc-4d3c-949f-1b17530dd265', // Mónica Vargas
  kinder1a:  'c27bbcca-c596-4f0f-bb11-6b47a4c4a287', // Diana Cruz → Kinder 1A
  kinder2:   '56234fa1-1693-4b2c-8621-7ced975b1907', // Paola Gutiérrez
  kinder3:   'd051b547-c6ba-48e5-8c62-106069b49455', // Andrea Morales
};

const alumnos = [
  // Maternal
  { id: '56fc4561-6b30-4031-8228-33c3d8e4372e', nombre: 'Ana García',       grupo: 'maternal',  usa_panial: true },
  { id: '2ee56308-2835-4924-bc0a-d8a256caa337', nombre: 'Emilio Vega',      grupo: 'maternal',  usa_panial: true },
  { id: 'b16a4103-b917-4b8d-a02b-7f90840d9675', nombre: 'Isabella Morales', grupo: 'maternal',  usa_panial: true },
  { id: 'ede7d099-823c-456b-8787-0e217cab1fcc', nombre: 'Mateo López',      grupo: 'maternal',  usa_panial: true },
  { id: '46155b39-8976-4c24-bc9b-acc41c2e44dd', nombre: 'Sofía Ramírez',    grupo: 'maternal',  usa_panial: false },
  // Prekinder
  { id: 'c75e11fa-56ac-4f97-be92-bfec0517602b', nombre: 'Camila Torres',    grupo: 'prekinder', usa_panial: false },
  { id: '5d00d4e5-5c40-4ff5-a9a3-6bd301d39f5b', nombre: 'Lucía Jiménez',   grupo: 'prekinder', usa_panial: false },
  { id: '34bb8e7e-924a-4f97-9aac-16586c139748', nombre: 'Santiago Gutiérrez', grupo: 'prekinder', usa_panial: false },
  { id: '6079cf19-793f-483b-829f-69194bab8716', nombre: 'Sebastián Medina', grupo: 'prekinder', usa_panial: false },
  { id: 'aedaf1cb-ae1b-4ca3-9377-480c27f4eab4', nombre: 'Valeria Flores',  grupo: 'prekinder', usa_panial: false },
  // Kinder 1A
  { id: '9ddfaab9-19bf-416d-bb67-31a20d76eec3', nombre: 'Andrés Reyes',     grupo: 'kinder1a',  usa_panial: false },
  { id: '8ff43cbb-b326-4209-b88a-6b3a263e5821', nombre: 'Diego Hernández',  grupo: 'kinder1a',  usa_panial: false },
  { id: '86899a32-4b36-4d21-bc8b-b1cd46effcb7', nombre: 'Gabriela Martínez',grupo: 'kinder1a',  usa_panial: false },
  // Kinder 1B
  { id: '2f63f316-0f05-4622-9b4b-e9e3d93e4218', nombre: 'María Fernanda',   grupo: 'kinder1b',  usa_panial: false },
  { id: '8349ffc0-8db5-458b-adbc-fd602987c757', nombre: 'Rodrigo Núñez',    grupo: 'kinder1b',  usa_panial: false },
  // Kinder 2
  { id: '4f66b9da-0a94-449a-9e5c-a45e23aff01e', nombre: 'Alejandro Soto',   grupo: 'kinder2',   usa_panial: false },
  { id: 'dec35a85-27b2-4383-8613-7fa2aba38d94', nombre: 'Daniela Cruz',     grupo: 'kinder2',   usa_panial: false },
  { id: '5fd5b99a-4647-4843-969f-7bf853c731dd', nombre: 'Fernanda Espinoza',grupo: 'kinder2',   usa_panial: false },
  { id: '9e184669-de82-4f73-baff-8d41e28ac911', nombre: 'Nicolás Aguilar',  grupo: 'kinder2',   usa_panial: false },
  { id: 'c7476df7-380f-4ad9-adc5-3d646aee72db', nombre: 'Rafael Delgado',   grupo: 'kinder2',   usa_panial: false },
  // Kinder 3
  { id: '6c517c89-8c32-49aa-9d13-2dda520adb92', nombre: 'Carlos Vargas',    grupo: 'kinder3',   usa_panial: false },
  { id: '12a11adc-cd49-46c9-809b-4737d484129b', nombre: 'Mariana Herrera',  grupo: 'kinder3',   usa_panial: false },
  { id: 'e4156375-5cab-4d5f-b46f-2ae1cf0ea348', nombre: 'Pablo Rojas',      grupo: 'kinder3',   usa_panial: false },
  { id: 'f277c37e-342a-485d-b4f5-7aacd7b32d32', nombre: 'Regina Palma',     grupo: 'kinder3',   usa_panial: false },
  { id: 'af43962d-d0e8-4eac-8b81-4885ac36aab5', nombre: 'Valentina Mendoza',grupo: 'kinder3',   usa_panial: false },
];

const dias = ['2026-04-13','2026-04-14','2026-04-15','2026-04-16','2026-04-17'];

// Ausentes y retardos específicos para hacer realista
// formato: 'alumno_id:fecha' => 'ausente' | 'retardo'
const excepciones = {
  'b16a4103-b917-4b8d-a02b-7f90840d9675:2026-04-13': 'ausente',   // Isabella lunes
  'c7476df7-380f-4ad9-adc5-3d646aee72db:2026-04-13': 'ausente',   // Rafael K2 lunes
  '2ee56308-2835-4924-bc0a-d8a256caa337:2026-04-14': 'retardo',   // Emilio martes
  '8349ffc0-8db5-458b-adbc-fd602987c757:2026-04-15': 'retardo',   // Rodrigo K1 miércoles
  'c75e11fa-56ac-4f97-be92-bfec0517602b:2026-04-15': 'ausente',   // Camila Prekinder miérc
  'af43962d-d0e8-4eac-8b81-4885ac36aab5:2026-04-17': 'ausente',   // Valentina K3 viernes
  '9ddfaab9-19bf-416d-bb67-31a20d76eec3:2026-04-17': 'retardo',   // Andrés K1 viernes
};

const estadosAnimo = ['feliz','feliz','feliz','energico','cansado','inquieto','triste'];
const cuantoComio = ['todo','todo','mitad','poco','todo','mitad','todo'];
const comportamientos = ['muy_bien','muy_bien','bien','bien','necesita_mejorar'];
const notasBitacora = [
  'Excelente participación en las actividades del día.',
  'Muy contento durante el recreo, compartió bien con sus compañeros.',
  'Realizó todas las actividades con entusiasmo.',
  'Estuvo un poco cansado pero participó bien.',
  'Disfrutó mucho la actividad de arte de hoy.',
  'Se integró bien en las actividades grupales.',
  'Tuvo un buen día, comió bien y durmió su siesta.',
  'Participó activamente en la ronda de canciones.',
  'Le costó un poco concentrarse, pero terminó sus actividades.',
  'Muy sociable hoy, hizo nuevos amigos en el patio.',
];

function pick(arr, seed) { return arr[seed % arr.length]; }

function horaEntrada(fecha, esRetardo) {
  const base = new Date(fecha + 'T00:00:00-06:00');
  if (esRetardo) {
    // 8:35 - 8:55
    const min = 8 * 60 + 35 + (Math.floor(Math.random() * 20));
    base.setHours(Math.floor(min/60), min % 60, 0, 0);
  } else {
    // 7:15 - 8:25
    const min = 7 * 60 + 15 + Math.floor(Math.random() * 70);
    base.setHours(Math.floor(min/60), min % 60, 0, 0);
  }
  return base.toISOString();
}

function horaSalida(fecha) {
  const base = new Date(fecha + 'T00:00:00-06:00');
  // 2:50 - 3:15pm
  const min = 14 * 60 + 50 + Math.floor(Math.random() * 25);
  base.setHours(Math.floor(min/60), min % 60, 0, 0);
  return base.toISOString();
}

async function seed() {
  const client = await pool.connect();
  let totalEntradas = 0, totalBitacoras = 0, totalSalidas = 0, totalAsistencias = 0;

  try {
    await client.query('BEGIN');

    for (const dia of dias) {
      for (let i = 0; i < alumnos.length; i++) {
        const alumno = alumnos[i];
        const key = `${alumno.id}:${dia}`;
        const excepcion = excepciones[key] || 'presente';
        const esAusente = excepcion === 'ausente';
        const esRetardo = excepcion === 'retardo';
        const grupoId = grupos[alumno.grupo];
        const maestraId = maestras[alumno.grupo];
        const seed = i + dias.indexOf(dia) * 7;

        // ── registro_entrada (solo si no ausente) ──────────────────────────
        if (!esAusente) {
          const hora = horaEntrada(dia, esRetardo);
          await client.query(`
            INSERT INTO registro_entrada
              (alumno_id, fecha, hora_entrada, es_retardo, numero_retardo_mes,
               sin_fiebre, "sin_lagañas", sin_sintomas, trae_uniforme,
               puede_entrar, qr_escaneado)
            VALUES ($1,$2,$3,$4,$5,true,true,true,true,true,true)
            ON CONFLICT (alumno_id, fecha) DO NOTHING
          `, [alumno.id, dia, hora, esRetardo, esRetardo ? 1 : 0]);
          totalEntradas++;

          // ── registro_salida ────────────────────────────────────────────
          const horaSal = horaSalida(dia);
          await client.query(`
            INSERT INTO registro_salida
              (alumno_id, fecha, hora_salida, recogido_por_tipo,
               nombre_quien_recoge, autorizado, qr_escaneado)
            VALUES ($1,$2,$3,'padre','Papá/Mamá',true,true)
            ON CONFLICT DO NOTHING
          `, [alumno.id, dia, horaSal]);
          totalSalidas++;
        }

        // ── asistencia ──────────────────────────────────────────────────
        const estadoAsist = esAusente ? 'ausente' : esRetardo ? 'retardo' : 'presente';
        await client.query(`
          INSERT INTO asistencia (alumno_id, grupo_id, fecha, estado)
          VALUES ($1,$2,$3,$4)
          ON CONFLICT (alumno_id, fecha) DO NOTHING
        `, [alumno.id, grupoId, dia, estadoAsist]);
        totalAsistencias++;

        // ── bitácora (solo presentes) ──────────────────────────────────
        if (!esAusente) {
          const comportamiento = pick(comportamientos, seed + 1);
          const estado_animo = pick(estadosAnimo, seed + 2);
          const notas = pick(notasBitacora, seed);

          const bitRes = await client.query(`
            INSERT INTO bitacora_diaria
              (alumno_id, fecha, maestra_id, tarea_realizada,
               comportamiento, estado_animo, tuvo_fiebre, notas)
            VALUES ($1,$2,$3,true,$4,$5,false,$6)
            ON CONFLICT (alumno_id, fecha) DO NOTHING
            RETURNING id
          `, [alumno.id, dia, maestraId, comportamiento, estado_animo, notas]);
          totalBitacoras++;

          const bitacoraId = bitRes.rows[0]?.id;

          // ── registro_comida ──────────────────────────────────────────
          const cuanto = pick(cuantoComio, seed + 3);
          await client.query(`
            INSERT INTO registro_comida
              (alumno_id, bitacora_id, fecha, que_comio, cuanto_comio)
            VALUES ($1,$2,$3,'Menú del día',$4)
            ON CONFLICT (alumno_id, fecha) DO NOTHING
          `, [alumno.id, bitacoraId, dia, cuanto]);

          // ── registro_baño ──────────────────────────────────────────
          const pipi = 2 + (seed % 3);
          const popo = alumno.grupo === 'maternal' ? 1 + (seed % 2) : seed % 2;
          await client.query(`
            INSERT INTO registro_banio
              (alumno_id, bitacora_id, fecha, pipi_count, popo_count)
            VALUES ($1,$2,$3,$4,$5)
            ON CONFLICT (alumno_id, fecha) DO NOTHING
          `, [alumno.id, bitacoraId, dia, pipi, popo]);
        }
      }
    }

    await client.query('COMMIT');
    console.log('✅ Seed completado:');
    console.log(`   Entradas:    ${totalEntradas}`);
    console.log(`   Salidas:     ${totalSalidas}`);
    console.log(`   Asistencias: ${totalAsistencias}`);
    console.log(`   Bitácoras:   ${totalBitacoras}`);
    console.log('   Semana: 13-17 abril 2026');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error en seed:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch(console.error);
