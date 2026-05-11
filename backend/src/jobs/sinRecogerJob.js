const cron = require('node-cron');
const { query } = require('../config/database');
const { notificarSinRecoger } = require('../services/whatsappService');
const { enviarPush } = require('../services/pushService');

/**
 * Job automático: alumnos sin recoger
 * Corre cada minuto, lunes-viernes, entre 14:00 y 19:00 (México)
 * Lógica:
 *   1. Lee hora_salida_normal y alerta_minutos_sin_recoger de configuracion_general
 *   2. Busca alumnos cuyo horario de salida (normal o extensión) ya pasó + minutos de gracia
 *   3. Alumnos que entraron hoy (registro_entrada) pero NO tienen registro_salida hoy
 *   4. Que no hayan recibido ya la alerta hoy (log_whatsapp tipo=sin_recoger)
 *   5. Respeta extensiones: alumnos con tiene_extension=true usan hora_salida_extension
 *   6. Notifica: WhatsApp + notificaciones BD (campanita + modal) + push mobile
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

    const horaSalidaNormal = cfg['hora_salida_normal'] || '14:30';
    const minutosGracia    = parseInt(cfg['alerta_minutos_sin_recoger'] || '5', 10);

    const ahora = new Date();
    const hoy   = ahora.toISOString().slice(0, 10);

    // Helper: dado "HH:MM", retorna Date de hoy con esa hora + minutos de gracia
    const horaLimiteDe = (horaStr) => {
      const [h, m] = horaStr.split(':').map(Number);
      const d = new Date(ahora);
      d.setHours(h, m + minutosGracia, 0, 0);
      return d;
    };

    // 2. Alumnos que entraron hoy, no tienen salida, no han sido alertados
    //    Incluye su configuración de horario (extensión si aplica)
    const alumnos = await query(`
      SELECT
        a.id AS alumno_id,
        a.nombre_completo AS alumno_nombre,
        COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
        p.nombre_completo AS padre_nombre,
        p.usuario_id AS padre_usuario_id,
        COALESCE(cha.tiene_extension, false) AS tiene_extension,
        cha.hora_salida_extension
      FROM registro_entrada re
      JOIN alumnos a ON a.id = re.alumno_id
      JOIN alumno_padre ap ON ap.alumno_id = a.id AND ap.es_tutor_principal = true
      JOIN padres p ON p.id = ap.padre_id
      LEFT JOIN config_horario_alumno cha ON cha.alumno_id = a.id AND cha.activo = true
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

    // 3. Filtrar: solo alertar si ya pasó hora_salida_efectiva + gracia
    const alumnosAlertar = alumnos.rows.filter(r => {
      const horaEfectiva = (r.tiene_extension && r.hora_salida_extension)
        ? r.hora_salida_extension.slice(0, 5)  // TIME de Postgres viene "HH:MM:SS"
        : horaSalidaNormal;
      return ahora >= horaLimiteDe(horaEfectiva);
    });

    if (alumnosAlertar.length === 0) return;

    console.log(`[sinRecogerJob] ${alumnosAlertar.length} alumno(s) sin recoger a las ${ahora.toLocaleTimeString('es-MX')}`);

    for (const r of alumnosAlertar) {
      // Hora a mostrar en el mensaje: extensión o normal según el alumno
      const horaMensaje = (r.tiene_extension && r.hora_salida_extension)
        ? r.hora_salida_extension.slice(0, 5)
        : horaSalidaNormal;

      // WhatsApp
      await notificarSinRecoger(
        { nombre_completo: r.padre_nombre, telefono: r.telefono },
        { nombre_completo: r.alumno_nombre, id: r.alumno_id },
        horaMensaje
      ).catch(() => {});

      // Notificación en portal web (campanita + modal) y mobile
      if (r.padre_usuario_id) {
        const titulo = `⏰ Sin recoger — ${r.alumno_nombre}`;
        const cuerpo = `${r.alumno_nombre} aún no ha sido recogido. Su horario de salida fue ${horaMensaje}. Por favor pasa a recogerlo a la brevedad.`;
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
  // Cada minuto, lunes-viernes, entre 14:00 y 19:00 (México)
  // Rango ampliado a 19:00 para cubrir alumnos con extensión de horario hasta 18:00
  cron.schedule('* 14-19 * * 1-5', async () => {
    await verificarSinRecoger();
  }, {
    timezone: 'America/Mexico_City',
  });

  console.log('✅ Job sin_recoger configurado: cada minuto, 14:00-19:00, lunes-viernes (México)');
};

module.exports = { iniciarJobSinRecoger, verificarSinRecoger };
