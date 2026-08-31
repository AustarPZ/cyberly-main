const { ERROR_CODES } = require('../errors/errorCodes');
const { createFixedWindowRateLimiter } = require('../security/rateLimit');

const RESPONSE = {
  code: ERROR_CODES.PRIVACY_REQUEST_RATE_LIMITED,
  message: 'Too many Privacy Request actions. Please try again later.',
};

function requestIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createPrivacyRequestRateLimiters({ now = Date.now } = {}) {
  return {
    submissionUser: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000, max: 5,
      keyGenerator: req => req.session?.userId ? `privacy-submit-user:${req.session.userId}` : null,
      now, ...RESPONSE,
    }),
    submissionIp: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000, max: 10,
      keyGenerator: req => `privacy-submit-ip:${requestIp(req)}`,
      now, ...RESPONSE,
    }),
    cancellationUser: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000, max: 10,
      keyGenerator: req => req.session?.userId ? `privacy-cancel-user:${req.session.userId}` : null,
      now, ...RESPONSE,
    }),
    readUser: createFixedWindowRateLimiter({
      windowMs: 60 * 1000, max: 60,
      keyGenerator: req => req.session?.userId ? `privacy-read-user:${req.session.userId}` : null,
      now, ...RESPONSE,
    }),
  };
}

module.exports = { createPrivacyRequestRateLimiters };
