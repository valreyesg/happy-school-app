/**
 * Siembra datos demo para que padre@happyschool.edu.mx vea contenido real
 * en las 4 vistas: Dashboard, Bitácora, Pagos, Calendario.
 *
 * Idempotente: usa ON CONFLICT DO NOTHING o DO UPDATE donde aplica.
 * Uso: node src/database/setup_padre_demo.js
 */
require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const { query } = require('../config/database');

async function main() {
  // ── IDs conocidos ──────────────────────────────────────────────────────────
  const ANA_ID    = '56fc4561-6b30-4031-8228-33c3d8e4372e';
  const PADRE_USR = 'f25d36bc-d97c-4586-b377-8b870d603978';

  // Obtener maestra y ciclo activo
  const maestraR = await query(`SELECT p.id FROM personal p JOIN usuarios u ON u.id = p.usuario_id WHERE u.email = 'maternal@happyschool.edu.mx' LIMIT 1`);
  const MAESTRA_ID = maestraR.rows[0]?.id;
  if (!MAESTRA_ID) { console.error('❌ maternal@happyschool.edu.mx no encontrada'); process.exit(1); }

  const cicloR = await query(`SELECT id FROM ciclos_escolares WHERE activo = true ORDER BY created_at DESC LIMIT 1`);
  const CICLO_ID = cicloR.rows[0]?.id;
  if (!CICLO_ID) { console.error('❌ No hay ciclo activo'); process.exit(1); }

  const hoy = new Date().toISOString().split('T')[0];

  // ── 1. Bitácora de hoy para Ana ───────────────────────────────────────────
  await query(`
    INSERT INTO bitacora_diaria
      (alumno_id, fecha, maestra_id, tarea_realizada, comportamiento, estado_animo, tuvo_fiebre, notas)
    VALUES ($1, $2, $3, true, 'muy_bien', 'feliz', false,
      'Ana estuvo muy participativa hoy. Completó todas sus actividades con entusiasmo.')
    ON CONFLICT (alumno_id, fecha) DO UPDATE SET
      tarea_realizada = EXCLUDED.tarea_realizada,
      comportamiento  = EXCLUDED.comportamiento,
      estado_animo    = EXCLUDED.estado_animo,
      notas           = EXCLUDED.notas,
      updated_at      = NOW()
  `, [ANA_ID, hoy, MAESTRA_ID]);
  console.log('✅ Bitácora de hoy creada');

  // ── 2. Registro de comida de hoy ──────────────────────────────────────────
  await query(`
    INSERT INTO registro_comida (alumno_id, fecha, que_comio, cuanto_comio, observaciones)
    VALUES ($1, $2, 'Arroz con pollo y verduras', 'todo', 'Comió muy bien, pidió más arroz.')
    ON CONFLICT (alumno_id, fecha) DO UPDATE SET
      que_comio    = EXCLUDED.que_comio,
      cuanto_comio = EXCLUDED.cuanto_comio,
      observaciones= EXCLUDED.observaciones
  `, [ANA_ID, hoy]);
  console.log('✅ Registro de comida de hoy creado');

  // ── 3. Registro de baño de hoy ────────────────────────────────────────────
  await query(`
    INSERT INTO registro_banio (alumno_id, fecha, pipi_count, popo_count)
    VALUES ($1, $2, 3, 1)
    ON CONFLICT (alumno_id, fecha) DO UPDATE SET
      pipi_count = EXCLUDED.pipi_count,
      popo_count = EXCLUDED.popo_count
  `, [ANA_ID, hoy]);
  console.log('✅ Registro de baño de hoy creado');

  // ── 4. Bitácoras de días anteriores (última semana) ───────────────────────
  const diasAtras = [1, 2, 3, 4, 5];
  const animosHist = ['feliz', 'energico', 'cansado', 'feliz', 'inquieto'];
  const comportHist = ['muy_bien', 'bien', 'muy_bien', 'bien', 'necesita_mejorar'];
  const tareaHist  = [true, true, false, true, true];

  for (let i = 0; i < diasAtras.length; i++) {
    const d = new Date(); d.setDate(d.getDate() - diasAtras[i]);
    const fechaHist = d.toISOString().split('T')[0];

    await query(`
      INSERT INTO bitacora_diaria (alumno_id, fecha, maestra_id, tarea_realizada, comportamiento, estado_animo, tuvo_fiebre)
      VALUES ($1, $2, $3, $4, $5, $6, false)
      ON CONFLICT (alumno_id, fecha) DO NOTHING
    `, [ANA_ID, fechaHist, MAESTRA_ID, tareaHist[i], comportHist[i], animosHist[i]]);

    await query(`
      INSERT INTO registro_comida (alumno_id, fecha, cuanto_comio)
      VALUES ($1, $2, $3)
      ON CONFLICT (alumno_id, fecha) DO NOTHING
    `, [ANA_ID, fechaHist, ['todo','casi_todo','poco','todo','casi_todo'][i]]);
  }
  console.log('✅ Bitácoras de la semana creadas');

  // ── 5. Conceptos de pago (si no existen) ─────────────────────────────────
  const conceptosR = await query(`SELECT id, nombre FROM conceptos_pago WHERE activo = true`);
  let conceptos = conceptosR.rows;

  if (conceptos.length === 0) {
    await query(`
      INSERT INTO conceptos_pago (nombre, tipo, monto, es_mensual, dia_pago, dia_recargo, monto_recargo_dia)
      VALUES
        ('Colegiatura', 'colegiatura', 2500, true, 1, 6, 50),
        ('Material didáctico', 'material', 350, true, 1, 10, 0),
        ('Servicio de comida', 'comida', 600, true, 1, 6, 0)
      ON CONFLICT DO NOTHING
    `);
    const recheck = await query(`SELECT id, nombre FROM conceptos_pago WHERE activo = true`);
    conceptos = recheck.rows;
    console.log('✅ Conceptos de pago creados');
  }

  const colegiatura = conceptos.find(c => c.nombre.toLowerCase().includes('colegiatura'));
  const material    = conceptos.find(c => c.nombre.toLowerCase().includes('material'));
  if (!colegiatura) { console.warn('⚠️  No se encontró concepto colegiatura'); }

  const anio = new Date().getFullYear();
  const mesActual = new Date().getMonth() + 1;

  // ── 6. Pagos de Ana (historial de 3 meses) ────────────────────────────────
  const pagosDef = [];

  // Meses anteriores: pagado
  for (let m = mesActual - 2; m < mesActual; m++) {
    if (m < 1) continue;
    if (colegiatura) pagosDef.push({ concepto_id: colegiatura.id, mes: m, estado: 'pagado', monto: 2500 });
    if (material)    pagosDef.push({ concepto_id: material.id,    mes: m, estado: 'pagado', monto: 350 });
  }

  // Mes actual: pendiente (simula que aún no pagan)
  if (colegiatura) pagosDef.push({ concepto_id: colegiatura.id, mes: mesActual, estado: 'pendiente', monto: 2500 });
  if (material)    pagosDef.push({ concepto_id: material.id,    mes: mesActual, estado: 'pendiente', monto: 350 });

  for (const p of pagosDef) {
    const existe = await query(
      `SELECT id FROM pagos WHERE alumno_id = $1 AND concepto_id = $2 AND mes_correspondiente = $3 AND anio_correspondiente = $4`,
      [ANA_ID, p.concepto_id, p.mes, anio]
    );
    if (existe.rows.length > 0) continue;

    await query(`
      INSERT INTO pagos
        (alumno_id, concepto_id, monto_base, monto_total, estado, mes_correspondiente, anio_correspondiente, fecha_pago)
      VALUES ($1, $2, $3, $3, $4, $5, $6, $7)
    `, [
      ANA_ID, p.concepto_id, p.monto, p.estado, p.mes, anio,
      p.estado === 'pagado' ? new Date(anio, p.mes - 1, 5).toISOString() : null,
    ]);
  }
  console.log('✅ Historial de pagos creado');

  // ── 7. Eventos del calendario (este mes y próximo) ────────────────────────
  const catR = await query(`SELECT id, nombre FROM categorias_evento LIMIT 5`);
  const cats = catR.rows;

  if (cats.length === 0) { console.warn('⚠️  No hay categorías de eventos — ejecuta el seed primero'); }

  const getCat = (nombre) => cats.find(c => c.nombre.toLowerCase().includes(nombre.toLowerCase()))?.id || cats[0]?.id;

  const eventosDef = [
    {
      titulo: 'Festival del Día de las Madres',
      descripcion: 'Celebración especial con presentación de los grupos. Se pide llevar flores y vestimenta especial.',
      fecha_inicio: new Date(anio, mesActual - 1, 10, 10, 0).toISOString(),
      es_todo_el_dia: false,
      categoria: 'festival',
    },
    {
      titulo: 'Reunión de padres de familia',
      descripcion: 'Revisión de avances del trimestre y entrega de evaluaciones. Asistencia obligatoria.',
      fecha_inicio: new Date(anio, mesActual - 1, 20, 17, 0).toISOString(),
      es_todo_el_dia: false,
      categoria: 'reunión',
    },
    {
      titulo: 'Día sin uniforme — colores primarios',
      descripcion: 'Este viernes los niños pueden venir con ropa casual en colores rojo, azul o amarillo.',
      fecha_inicio: new Date(anio, mesActual - 1, 25).toISOString(),
      es_todo_el_dia: true,
      categoria: 'especial',
    },
    {
      titulo: 'Vacaciones de verano',
      descripcion: 'Inicio del periodo vacacional. Regreso a clases el 11 de agosto.',
      fecha_inicio: new Date(anio, mesActual, 1).toISOString(),
      es_todo_el_dia: true,
      categoria: 'vacaciones',
    },
  ];

  for (const ev of eventosDef) {
    const existe = await query(`SELECT id FROM eventos WHERE titulo = $1`, [ev.titulo]);
    if (existe.rows.length > 0) continue;

    await query(`
      INSERT INTO eventos (titulo, descripcion, categoria_id, fecha_inicio, es_todo_el_dia, publicado, creado_por)
      VALUES ($1, $2, $3, $4, $5, true, (SELECT id FROM usuarios WHERE email = 'directora@happyschool.edu.mx' LIMIT 1))
    `, [ev.titulo, ev.descripcion, getCat(ev.categoria), ev.fecha_inicio, ev.es_todo_el_dia]);
  }
  console.log('✅ Eventos del calendario creados');

  console.log('\n🎉 Setup padre demo completo. Reinicia el backend y entra con padre@happyschool.edu.mx');
  process.exit(0);
}

main().catch(e => { console.error('❌ Error:', e.message); process.exit(1); });
