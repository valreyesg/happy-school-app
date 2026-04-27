const cron = require('node-cron');

const iniciarJobMedicamentos = () => {
  // Cada 5 min, de 7:00 a 16:00, lun-vie
  cron.schedule('*/5 7-16 * * 1-5', async () => {
    try {
      // Importar pool aquí para evitar ciclos de dependencia
      const pool = require('../config/database');
      const { rows } = await pool.query(`
        SELECT t.id AS toma_id, t.hora_programada, t.recordatorio_enviado,
               rm.id AS recepcion_id, rm.alumno_id, rm.nombre,
               a.nombre_completo AS alumno_nombre,
               g.maestra_titular_id
        FROM toma_medicamento t
        JOIN recepcion_medicamento rm ON rm.id = t.recepcion_id
        JOIN alumnos a ON a.id = rm.alumno_id
        JOIN grupos g ON g.id = a.grupo_id
        WHERE t.administrado = false
          AND t.recordatorio_enviado = false
          AND rm.recibido = true
          AND t.hora_programada::time BETWEEN
                (NOW() AT TIME ZONE 'America/Mexico_City' - INTERVAL '10 minutes')::time
            AND (NOW() AT TIME ZONE 'America/Mexico_City' + INTERVAL '10 minutes')::time
          AND rm.fecha = (NOW() AT TIME ZONE 'America/Mexico_City')::date
      `);

      for (const rec of rows) {
        if (!rec.maestra_titular_id) continue;
        await pool.query(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, deep_link, leida)
          VALUES ($1, 'recordatorio_medicamento', '💊 Medicamento pendiente',
                  $2, $3, false)
        `, [
          rec.maestra_titular_id,
          `${rec.alumno_nombre} necesita ${rec.nombre} a las ${rec.hora_programada.substring(0, 5)}`,
          `/maestra/bitacora?alumnoId=${rec.alumno_id}`
        ]);

        // Marcar recordatorio como enviado en la toma
        await pool.query(
          'UPDATE toma_medicamento SET recordatorio_enviado = true WHERE id = $1',
          [rec.toma_id]
        );
      }
    } catch (err) {
      console.error('[medicamentosJob] Error:', err.message);
    }
  }, { timezone: 'America/Mexico_City' });

  console.log('[medicamentosJob] Iniciado — cada 5 min 7:00-16:00 lun-vie');
};

module.exports = { iniciarJobMedicamentos };
