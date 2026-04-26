require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

const multer = require('multer');
const routes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const { iniciarJobComida } = require('./jobs/comidaJobs');

const app = express();
const PORT = process.env.PORT || 3000;

// Seguridad y utilidades
app.use(helmet());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS — permitir web y mobile
app.use(cors({
  origin: [
    process.env.WEB_URL,
    process.env.MOBILE_URL,
    'http://localhost:5173',
    'http://localhost:3001',
    'exp://localhost:8081',
  ].filter(Boolean),
  credentials: true,
}));

// Rate limiting global
app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 300,
  message: { error: 'Demasiadas solicitudes, intenta más tarde.' },
}));

// Multipart formdata PRIMERO (para tareas con foto)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });
app.use(upload.any());

// Luego parsers JSON y URL-encoded
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Deshabilitar caché HTTP para endpoints de API
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('ETag', 'W/"disabled"');
  next();
});

// Rutas
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', app: 'Happy School API', version: '1.0.0' });
});

// Manejo de errores
app.use(errorHandler);

// Iniciar jobs cron
iniciarJobComida();

app.listen(PORT, () => {
  console.log(`🏫 Happy School API corriendo en puerto ${PORT}`);
  console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
