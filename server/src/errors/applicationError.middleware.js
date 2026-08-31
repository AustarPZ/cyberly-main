const { ERROR_CODES } = require('./errorCodes');

function applicationErrorMiddleware(error, _req, res, _next) {
  console.error('Server error:', error.code || error.message);
  if (error.status && error.status < 600 && error.code) {
    return res.status(error.status).json({
      code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
      message: error.message,
      ...(error.errors ? { errors: error.errors } : {}),
    });
  }
  return res.status(500).json({
    code: ERROR_CODES.INTERNAL_SERVER_ERROR,
    message: 'Server error.',
  });
}

module.exports = { applicationErrorMiddleware };
