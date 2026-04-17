const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  if (err.name === 'UnauthorizedError' || err.message === 'No autorizado') {
    return res.status(401).json({ error: 'No autorizado' });
  }

  if (err.code === '23505') {
    return res.status(409).json({ error: 'Ya existe un registro con esos datos' });
  }

  if (err.code === '23503') {
    return res.status(400).json({ error: 'Referencia inválida en los datos' });
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message,
  });
};

module.exports = { errorHandler };
