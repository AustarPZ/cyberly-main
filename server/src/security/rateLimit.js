const crypto = require('node:crypto');

function createFixedWindowRateLimiter({
  windowMs,
  max,
  keyGenerator,
  code,
  message,
  now = Date.now,
  store = new Map(),
} = {}) {
  return function fixedWindowRateLimit(req, res, next) {
    const key = keyGenerator(req);
    if (!key) return next();

    const currentTime = now();
    let bucket = store.get(key);
    if (!bucket || bucket.resetAt <= currentTime) {
      bucket = { count: 0, resetAt: currentTime + windowMs };
    }

    bucket.count += 1;
    store.set(key, bucket);

    if (bucket.count <= max) return next();

    res.set('Retry-After', String(Math.max(1, Math.ceil((bucket.resetAt - currentTime) / 1000))));
    return res.status(429).json({ code, message });
  };
}

function createHashedBodyKey(field, { prefix = 'body' } = {}) {
  return function hashedBodyKey(req) {
    const value = String(req.body?.[field] || '').trim().toLowerCase();
    if (!value) return null;
    const digest = crypto.createHash('sha256').update(value).digest('hex').slice(0, 24);
    return `${prefix}:${digest}`;
  };
}

module.exports = {
  createFixedWindowRateLimiter,
  createHashedBodyKey,
};
