const logger = require('../config/logger');

function errorHandler(error, req, res, next) {
  logger.error(error.message, {
    path: req.path,
    method: req.method,
    stack: error.stack
  });

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Internal server error',
    details: error.details || null
  });
}

module.exports = errorHandler;
