const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação do Mongoose
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ success: false, message: 'Erro de validação', errors });
  }

  // Erro de key duplicada do Mongo (por índice único)
  if (err.code && err.code === 11000) {
    const fields = Object.keys(err.keyValue || {});
    return res.status(400).json({ success: false, message: 'Registro já existe', fields, error: err.message });
  }

  // Erro do Multer (upload)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      message: 'Erro no upload do arquivo',
      error: err.message
    });
  }

  // Erro genérico
  return res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Erro interno do servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
