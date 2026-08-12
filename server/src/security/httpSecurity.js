const helmet = require('helmet');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function createCorsOptions(allowedOrigin) {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin || origin === allowedOrigin) return callback(null, true);
      return callback(null, false);
    },
  };
}

function createSecurityHeadersMiddleware({ isProduction = false } = {}) {
  const helmetMiddleware = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"],
        frameAncestors: ["'none'"],
      },
    },
    frameguard: { action: 'deny' },
    hsts: isProduction ? {
      maxAge: 31536000,
      includeSubDomains: true,
    } : false,
    referrerPolicy: { policy: 'no-referrer' },
  });

  return function securityHeaders(req, res, next) {
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    helmetMiddleware(req, res, next);
  };
}

function createOriginProtection({ allowedOrigin, requireOrigin = false } = {}) {
  return function protectMutationOrigin(req, res, next) {
    if (SAFE_METHODS.has(String(req.method || '').toUpperCase())) return next();

    const origin = String(req.get?.('origin') || req.headers?.origin || '').trim();
    if (!origin && !requireOrigin) return next();
    if (origin === allowedOrigin) return next();

    return res.status(403).json({
      code: 'SECURITY_ORIGIN_REJECTED',
      message: 'Request origin is not allowed.',
    });
  };
}

module.exports = {
  createCorsOptions,
  createOriginProtection,
  createSecurityHeadersMiddleware,
};
