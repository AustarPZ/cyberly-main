const crypto = require('node:crypto');

function hashGuardianLinkToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken || '')).digest('hex');
}

function createGuardianLinkToken({ randomBytes = crypto.randomBytes } = {}) {
  const rawToken = randomBytes(32).toString('base64url');
  return { rawToken, tokenHash: hashGuardianLinkToken(rawToken) };
}

module.exports = { createGuardianLinkToken, hashGuardianLinkToken };
