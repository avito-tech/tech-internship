const errorHandler = (err, req, res, next) => {
  console.error('API Error:', err);
  
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Внутренняя ошибка сервера';
  
  res.status(statusCode).json({
    error: {
      message: message,
      statusCode: statusCode,
      timestamp: new Date().toISOString(),
      path: req.path
    }
  });
};

module.exports = errorHandler;
