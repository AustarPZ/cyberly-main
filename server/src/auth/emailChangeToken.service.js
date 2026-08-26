const crypto = require('node:crypto');

const EMAIL_CHANGE_TOKEN_BYTES = 32;
const EMAIL_CHANGE_TTL_MINUTES = 60;

function hashEmailChangeToken(rawToken) {
  return crypto
    .createHash('sha256')
    .update(String(rawToken || ''), 'utf8')
    .digest('hex');
}

function getEmailChangeExpiry(now = new Date()) {
  return new Date(now.getTime() + EMAIL_CHANGE_TTL_MINUTES * 60 * 1000);
}

function createEmailChangeToken({ now = new Date() } = {}) {
  const rawToken = crypto.randomBytes(EMAIL_CHANGE_TOKEN_BYTES).toString('base64url');
  return {
    rawToken,
    tokenHash: hashEmailChangeToken(rawToken),
    expiresAt: getEmailChangeExpiry(now),
  };
}

function classifyEmailChangeRequest(request, now = new Date()) {
  if (!request) return 'missing';
  if (request.usedAt) return 'used';
  if (request.revokedAt) return 'revoked';
  const expiresAt = request.expiresAt instanceof Date
    ? request.expiresAt
    : new Date(request.expiresAt);
  if (!request.expiresAt || expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

module.exports = {
  EMAIL_CHANGE_TOKEN_BYTES,
  EMAIL_CHANGE_TTL_MINUTES,
  classifyEmailChangeRequest,
  createEmailChangeToken,
  getEmailChangeExpiry,
  hashEmailChangeToken,
};
