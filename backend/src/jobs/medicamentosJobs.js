const cron = require('node-cron');

const iniciarJobMedicamentos = () => {
  // Cada 5 min, de 7:00 a 16:00, lun-vie
  cron.schedule('*/5 7-16 * * 1-5', async () => {
    try {
      // Importar pool aquí para evitar ciclos de dependencia
      const pool = require('../config/db');
      const { rows } = await pool.query(`
        SELECT rm.id, rm.alumno_id, rm.nombre_medicamento, rm.hora_programada,
               a.nombre_completo as alumno_nombre,
               g.maestra_titular_id
        FROM recepcion_medicamento rm
        JOIN alumnos a ON a.id = rm.alumno_id
        JOIN grupos g ON g.id = a.grupo_id
        WHERE rm.administrado = false
          AND rm.hora_programada::time BETWEEN (NOW() AT TIME ZONE 'America/Mexico_City' - INTERVAL '10 minutes')::time
                                           AND (NOW() AT TIME ZONE 'America/Mexico_City' + INTERVAL '10 minutes')::time
          AND DATE(rm.created_at AT TIME ZONE 'America/Mexico_City') = CURRENT_DATE
      `);

      for (const rec of rows) {
        if (!rec.maestra_titular_id) continue;
        await pool.query(`
          INSERT INTO notificaciones (usuario_id, tipo, titulo, mensaje, deep_link, leida)
          VALUES ($1, 'recordatorio_medicamento', '💊 Medicamento pendiente',
                  $2, $3, false)
        `, [
          rec.maestra_titular_id,
          `${rec.alumno_nombre} necesita ${rec.nombre_medicamento} a las ${rec.hora_programada}`,
          `/maestra/bitacora?alumnoId=${rec.alumno_id}`
        ]);
      }
    } catch (err) {
      console.error('[medicamentosJob] Error:', err.message);
    }
  }, { timezone: 'America/Mexico_City' });

  console.log('[medicamentosJob] Iniciado — cada 5 min 7:00-16:00 lun-vie');
};

module.exports = { iniciarJobMedicamentos };
