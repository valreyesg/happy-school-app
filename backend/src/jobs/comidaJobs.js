const cron = require('node-cron');
const comidaController = require('../controllers/comidaController');

// Job cron: Lunes 8:31 AM — procesar comida no pagada
const iniciarJobComida = () => {
  // 31 8 * * 1 = lunes a las 8:31 AM (UTC zona horaria México)
  // Usar CRON_TZ para zona horaria local: América/Mexico_City
  cron.schedule('31 8 * * 1', async () => {
    console.log('⏱️ Ejecutando job: procesarComidaNoPagada (lunes 8:31 AM)');
    await comidaController.procesarComidaNoPagada();
  }, {
    timezone: 'America/Mexico_City'
  });

  console.log('✅ Job comida configurado: Lunes 8:31 AM (México)');
};

module.exports = { iniciarJobComida };
