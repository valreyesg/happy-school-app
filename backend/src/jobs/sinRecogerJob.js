const cron = require('node-cron');
const { query } = require('../config/database');
const { notificarSinRecoger } = require('../services/whatsappService');
const { enviarPush } = require('../services/pushService');

/**
 * Job automático: alumnos sin recoger
 * Corre cada minuto, lunes-viernes, entre 14:00 y 17:00 (México)
 * Lógica:
 *   1. Lee hora_salida_normal y alerta_minutos_sin_recoger de configuracion_general
 *   2. Si ya pasaron los minutos de gracia desde hora_salida_normal → buscar alumnos
 *   3. Alumnos que entraron hoy (registro_entrada) pero NO tienen registro_salida hoy
 *   4. Que no hayan recibido ya la alerta hoy (log_whatsapp tipo=sin_recoger)
 *   5. Notifica: WhatsApp + notificaciones BD (campanita + modal) + push mobile
 */
async function verificarSinRecoger() {
  try {
    // 1. Leer config
    const cfgRes = await query(`
      SELECT clave, valor FROM configuracion_general
      WHERE clave IN ('hora_salida_normal', 'alerta_minutos_sin_recoger')
    `);
    const cfg = {};
    for (const row of cfgRes.rows) cfg[row.clave] = row.valor;

    const horaSalidaNormal     = cfg['hora_salida_normal']           || '14:30';
    const minutosGracia        = parseInt(cfg['alerta_minutos_sin_recoger'] || '5', 10);

    // 2. Calcular hora límite para disparar alerta (hora_salida + minutos de gracia)
    const ahora = new Date();
    const [hSal, mSal] = horaSalidaNormal.split(':').map(Number);
    const horaLimite = new Date(ahora);
    horaLimite.setHours(hSal, mSal + minutosGracia, 0, 0);

    if (ahora < horaLimite) return; // Aún no pasó el tiempo de gracia

    const hoy = ahora.toISOString().slice(0, 10);
    const horaSalidaTexto = horaSalidaNormal; // Para el mensaje WA

    // 3. Alumnos que entraron hoy pero no tienen salida y no han sido alertados
    const alumnos = await query(`
      SELECT
        a.id AS alumno_id,
        a.nombre_completo AS alumno_nombre,
        COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
        p.nombre_completo AS padre_nombre,
        p.usuario_id AS padre_usuario_id
      FROM registro_entrada re
      JOIN alumnos a ON a.id = re.alumno_id
      JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
      JOIN padres p ON p.id = ap.padre_id
      WHERE re.fecha = $1
        AND re.puede_entrar = true
        AND NOT EXISTS (
          SELECT 1 FROM registro_salida rs
          WHERE rs.alumno_id = a.id AND rs.fecha = $1
        )
        AND NOT EXISTS (
          SELECT 1 FROM log_whatsapp lw
          WHERE lw.alumno_id = a.id AND lw.tipo = 'sin_recoger' AND DATE(lw.created_at) = $1
        )
    `, [hoy]);

    if (alumnos.rows.length === 0) return;

    console.log(`[sinRecogerJob] ${alumnos.rows.length} alumno(s) sin recoger a las ${ahora.toLocaleTimeString('es-MX')}`);

    for (const r of alumnos.rows) {
      // WhatsApp
      await notificarSinRecoger(
        { nombre_completo: r.padre_nombre, telefono: r.telefono },
        { nombre_completo: r.alumno_nombre, id: r.alumno_id },
        horaSalidaTexto
      ).catch(() => {});

      // Notificación en portal web (campanita + modal) y mobile
      if (r.padre_usuario_id) {
        const titulo = `⏰ Sin recoger — ${r.alumno_nombre}`;
        const cuerpo = `${r.alumno_nombre} aún no ha sido recogido. Su horario de salida fue ${horaSalidaTexto}. Por favor pasa a recogerlo a la brevedad.`;
        const datos  = JSON.stringify({ tipo: 'sin_recoger', alumno_id: String(r.alumno_id) });

        await query(
          `INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra) VALUES ($1, $2, $3, 'sin_recoger', $4)`,
          [r.padre_usuario_id, titulo, cuerpo, datos]
        );
        enviarPush(r.padre_usuario_id, titulo, cuerpo, { tipo: 'sin_recoger', alumno_id: String(r.alumno_id) });
      }
    }
  } catch (err) {
    console.error('[sinRecogerJob] Error:', err.message);
  }
}

const iniciarJobSinRecoger = () => {
  // Cada minuto, lunes-viernes, entre 14:00 y 17:00 (México)
  cron.schedule('* 14-17 * * 1-5', async () => {
    await verificarSinRecoger();
  }, {
    timezone: 'America/Mexico_City',
  });

  console.log('✅ Job sin_recoger configurado: cada minuto, 14:00-17:00, lunes-viernes (México)');
};

module.exports = { iniciarJobSinRecoger, verificarSinRecoger };
