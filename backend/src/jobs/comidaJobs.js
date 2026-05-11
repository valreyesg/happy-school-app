const cron = require('node-cron');
const comidaController = require('../controllers/comidaController');
const { query } = require('../config/database');
const whatsappService = require('../services/whatsappService');
const { enviarPush } = require('../services/pushService');

// Job cron: Lunes 7:00 AM — recordatorio de pago comida
const recordatorioComida = async () => {
  try {
    const lunes = new Date();
    lunes.setDate(lunes.getDate() - lunes.getDay() + 1);
    const semana_inicio = lunes.toISOString().split('T')[0];

    const pendientes = await query(`
      SELECT cc.monto, a.id AS alumno_id, a.nombre_completo AS alumno_nombre,
             p.nombre_completo AS padre_nombre,
             COALESCE(p.telefono_whatsapp, p.telefono) AS telefono,
             p.usuario_id
      FROM control_comida_semanal cc
      JOIN alumnos a ON cc.alumno_id = a.id
      JOIN alumno_padre ap ON a.id = ap.alumno_id
      JOIN padres p ON ap.padre_id = p.id
      WHERE cc.semana_inicio = $1
        AND cc.confirmado = true
        AND cc.pago_verificado = false
        AND cc.estado = 'pendiente'
    `, [semana_inicio]);

    for (const r of pendientes.rows) {
      // WA recordatorio
      await whatsappService.notificarPagoComidaLunes(
        { nombre_completo: r.padre_nombre, telefono: r.telefono },
        { nombre_completo: r.alumno_nombre, id: r.alumno_id },
        r.monto
      ).catch(() => {});

      // Notificación campanita + modal
      if (r.usuario_id) {
        const titulo = `🍽️ Recuerda pagar la comida — ${r.alumno_nombre}`;
        const cuerpo = `El pago de $${parseFloat(r.monto).toFixed(2)} para el servicio de comida de esta semana aún no ha sido recibido. Tienes hasta las 8:30 AM para realizarlo.`;
        await query(
          `INSERT INTO notificaciones (usuario_id, titulo, cuerpo, tipo, datos_extra)
           VALUES ($1, $2, $3, 'pago_comida_lunes', $4)`,
          [r.usuario_id, titulo, cuerpo, JSON.stringify({ alumno_id: r.alumno_id, monto: r.monto })]
        ).catch(() => {});
        enviarPush(r.usuario_id, titulo, cuerpo, { tipo: 'pago_comida_lunes', alumno_id: String(r.alumno_id) });
      }
    }

    console.log(`✅ Recordatorio comida enviado a ${pendientes.rows.length} padres`);
  } catch (e) {
    console.error('❌ Error en recordatorioComida:', e.message);
  }
};

// Job cron: Lunes 8:31 AM — procesar comida no pagada
const iniciarJobComida = () => {
  // 0 7 * * 1 = lunes a las 7:00 AM (México)
  cron.schedule('0 7 * * 1', async () => {
    console.log('⏱️ Ejecutando job: recordatorioComida (lunes 7:00 AM)');
    await recordatorioComida();
  }, { timezone: 'America/Mexico_City' });

  // 31 8 * * 1 = lunes a las 8:31 AM (México)
  cron.schedule('31 8 * * 1', async () => {
    console.log('⏱️ Ejecutando job: procesarComidaNoPagada (lunes 8:31 AM)');
    await comidaController.procesarComidaNoPagada();
  }, { timezone: 'America/Mexico_City' });

  console.log('✅ Jobs comida configurados: Lunes 7:00 AM (recordatorio) y 8:31 AM (cancelación)');
};

module.exports = { iniciarJobComida };
