const crypto = require('node:crypto');

const PASSWORD_RESET_TOKEN_TYPE = 'password_reset';
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TTL_MINUTES = 30;

function hashPasswordResetToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken || ''), 'utf8').digest('hex');
}

function classifyPasswordResetToken(token, now) {
  if (!token) return 'missing';
  if (token.usedAt) return 'used';
  if (token.revokedAt) return 'revoked';
  const expiresAt = token.expiresAt instanceof Date ? token.expiresAt : new Date(token.expiresAt);
  if (!token.expiresAt || expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

function createPasswordResetTokenService(repository, options = {}) {
  const now = options.now || (() => new Date());

  async function issuePasswordResetToken({
    userId,
    requestIp = null,
    requestUserAgent = null,
  } = {}) {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new Error('A valid userId is required to issue a password reset token.');
    }

    const issuedAt = now();
    const expiresAt = new Date(issuedAt.getTime() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000);
    const rawToken = crypto.randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString('base64url');
    const tokenHash = hashPasswordResetToken(rawToken);

    const token = await repository.transaction(async (repo) => {
      await repo.revokeActiveTokens(numericUserId, PASSWORD_RESET_TOKEN_TYPE, issuedAt);
      return repo.createToken({
        userId: numericUserId,
        tokenType: PASSWORD_RESET_TOKEN_TYPE,
        tokenHash,
        targetEmail: null,
        expiresAt,
        requestIp,
        requestUserAgent,
      });
    });

    return { rawToken, token, expiresAt };
  }

  async function inspectPasswordResetToken(rawToken) {
    const token = await repository.findTokenByHash(
      hashPasswordResetToken(rawToken),
      PASSWORD_RESET_TOKEN_TYPE
    );
    return { status: classifyPasswordResetToken(token, now()), token };
  }

  async function consumePasswordResetToken(rawToken, work) {
    return repository.transaction(async (repo) => {
      const token = await repo.findTokenByHashForUpdate(
        hashPasswordResetToken(rawToken),
        PASSWORD_RESET_TOKEN_TYPE
      );
      const status = classifyPasswordResetToken(token, now());
      if (status !== 'active') return { status, token };

      const result = await work(repo, token);
      const usedAt = now();
      const consumed = await repo.markTokenUsedIfActive(token.id, usedAt);
      if (!consumed) {
        throw new Error('Password reset token could not be consumed.');
      }
      return { status: 'used', token: consumed, result };
    });
  }

  return {
    issuePasswordResetToken,
    inspectPasswordResetToken,
    consumePasswordResetToken,
  };
}

module.exports = {
  PASSWORD_RESET_TOKEN_BYTES,
  PASSWORD_RESET_TOKEN_TYPE,
  PASSWORD_RESET_TTL_MINUTES,
  classifyPasswordResetToken,
  createPasswordResetTokenService,
  hashPasswordResetToken,
};
