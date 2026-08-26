const { createFixedWindowRateLimiter, createHashedBodyKey } = require('./rateLimit');

const AUTH_LIMIT_RESPONSE = {
  code: 'AUTH_RATE_LIMITED',
  message: 'Too many authentication attempts. Please try again later.',
};

function requestIp(req) {
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function createAuthRateLimiters({ now = Date.now } = {}) {
  return {
    registration: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      keyGenerator: req => `register-ip:${requestIp(req)}`,
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    loginIp: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 20,
      keyGenerator: req => `login-ip:${requestIp(req)}`,
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    loginAccount: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      keyGenerator: createHashedBodyKey('email', { prefix: 'login-account' }),
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    forgotPasswordIp: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      keyGenerator: req => `forgot-password-ip:${requestIp(req)}`,
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    forgotPasswordAccount: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5,
      keyGenerator: createHashedBodyKey('email', { prefix: 'forgot-password-account' }),
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    resetPasswordIp: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 20,
      keyGenerator: req => `reset-password-ip:${requestIp(req)}`,
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    resetPasswordToken: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5,
      keyGenerator: createHashedBodyKey('token', { prefix: 'reset-password-token' }),
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    emailChangeIp: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 10,
      keyGenerator: req => `email-change-ip:${requestIp(req)}`,
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
    emailChangeUser: createFixedWindowRateLimiter({
      windowMs: 15 * 60 * 1000,
      max: 5,
      keyGenerator: req => req.session?.userId
        ? `email-change-user:${req.session.userId}`
        : null,
      now,
      ...AUTH_LIMIT_RESPONSE,
    }),
  };
}

function createAgentActionRateLimiter({ now = Date.now } = {}) {
  return createFixedWindowRateLimiter({
    windowMs: 60 * 1000,
    max: 30,
    keyGenerator: req => req.session?.userId ? `agent-action:${req.session.userId}` : null,
    now,
    code: 'ACTION_RATE_LIMITED',
    message: 'Too many action requests. Please try again later.',
  });
}

module.exports = {
  createAgentActionRateLimiter,
  createAuthRateLimiters,
};
