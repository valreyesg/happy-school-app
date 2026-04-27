require('dotenv').config();
const app = require('./app');
const { iniciarJobComida } = require('./jobs/comidaJobs');
const { iniciarJobMedicamentos } = require('./jobs/medicamentosJobs');

const PORT = process.env.PORT || 3000;

iniciarJobComida();
iniciarJobMedicamentos();

app.listen(PORT, () => {
  console.log(`🏫 Happy School API corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});
