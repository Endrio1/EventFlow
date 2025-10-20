const errorHandler = (err, req, res, next) => {
  console.error('Erro:', err);

  // Erro de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const errors = err.errors.map(e => e.message);
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors
    });
  }

  // Erro de constraint única do Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    return res.status(400).json({
      success: false,
      message: 'Este registro já existe',
      errors: err.errors.map(e => e.message)
    });
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
