const crypto = require('node:crypto');
const { ERROR_CODES } = require('../errors/errorCodes');
const { createFixedWindowRateLimiter, createHashedBodyKey } = require('../security/rateLimit');

const RESPONSE = {
  code: ERROR_CODES.GUARDIAN_LINK_RATE_LIMITED,
  message: 'Too many Guardian Link actions. Please try again later.',
};
const requestIp = req => req.ip || req.socket?.remoteAddress || 'unknown';
const digest = value => crypto.createHash('sha256').update(String(value || '')).digest('hex').slice(0, 24);

function createGuardianLinkRateLimiters({ now = Date.now } = {}) {
  const inspectTokenKey = createHashedBodyKey('token', { prefix: 'guardian-inspect-token' });
  const decisionTokenKey = createHashedBodyKey('token', { prefix: 'guardian-decision-token' });
  return {
    createByLearner: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 5,
      keyGenerator: req => req.session?.userId ? `guardian-create-user:${req.session.userId}` : null, now, ...RESPONSE }),
    createByIp: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 10,
      keyGenerator: req => `guardian-create-ip:${requestIp(req)}`, now, ...RESPONSE }),
    resendByRelationship: createFixedWindowRateLimiter({ windowMs: 60 * 60 * 1000, max: 3,
      keyGenerator: req => req.params?.reference ? `guardian-resend-relationship:${digest(req.params.reference)}` : null, now, ...RESPONSE }),
    resendByIp: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 10,
      keyGenerator: req => `guardian-resend-ip:${requestIp(req)}`, now, ...RESPONSE }),
    publicInspectByToken: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 30,
      keyGenerator: inspectTokenKey, now, ...RESPONSE }),
    publicInspectByIp: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 60,
      keyGenerator: req => `guardian-inspect-ip:${requestIp(req)}`, now, ...RESPONSE }),
    publicDecisionByToken: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 5,
      keyGenerator: decisionTokenKey, now, ...RESPONSE }),
    publicDecisionByIp: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 20,
      keyGenerator: req => `guardian-decision-ip:${requestIp(req)}`, now, ...RESPONSE }),
    revokeByLearner: createFixedWindowRateLimiter({ windowMs: 15 * 60 * 1000, max: 5,
      keyGenerator: req => req.session?.userId ? `guardian-revoke-user:${req.session.userId}` : null, now, ...RESPONSE }),
    readByLearner: createFixedWindowRateLimiter({ windowMs: 60 * 1000, max: 60,
      keyGenerator: req => req.session?.userId ? `guardian-read-user:${req.session.userId}` : null, now, ...RESPONSE }),
  };
}

module.exports = { createGuardianLinkRateLimiters };
