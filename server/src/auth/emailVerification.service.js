const crypto = require('crypto');

const EMAIL_VERIFICATION_TOKEN_TYPE = 'email_verification';
const DEFAULT_EXPIRY_HOURS = 24;
const DEFAULT_RESEND_COOLDOWN_SECONDS = 60;
const DEFAULT_TOKEN_BYTES = 32;

function hashVerificationToken(rawToken) {
  return crypto.createHash('sha256').update(String(rawToken || ''), 'utf8').digest('hex');
}

function generateRawToken(tokenBytes = DEFAULT_TOKEN_BYTES) {
  return crypto.randomBytes(tokenBytes).toString('base64url');
}

function normalizeDate(value) {
  if (!value) return null;
  return value instanceof Date ? value : new Date(value);
}

function classifyToken(token, now) {
  if (!token) return 'missing';
  if (token.usedAt) return 'used';
  if (token.revokedAt) return 'revoked';
  const expiresAt = normalizeDate(token.expiresAt);
  if (!expiresAt || expiresAt.getTime() <= now.getTime()) return 'expired';
  return 'active';
}

function createEmailVerificationTokenService(repository, options = {}) {
  if (!repository) {
    throw new Error('Email verification token service requires a repository.');
  }

  const now = options.now || (() => new Date());
  const expiryHours = Number.isFinite(Number(options.expiryHours))
    ? Number(options.expiryHours)
    : DEFAULT_EXPIRY_HOURS;
  const resendCooldownSeconds = Number.isFinite(Number(options.resendCooldownSeconds))
    ? Number(options.resendCooldownSeconds)
    : DEFAULT_RESEND_COOLDOWN_SECONDS;
  const tokenBytes = Number.isInteger(options.tokenBytes) ? options.tokenBytes : DEFAULT_TOKEN_BYTES;

  async function issueEmailVerificationToken({
    userId,
    targetEmail = null,
    requestIp = null,
    requestUserAgent = null,
  } = {}) {
    const numericUserId = Number(userId);
    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      throw new Error('A valid userId is required to issue an email verification token.');
    }

    const issuedAt = now();
    const expiresAt = new Date(issuedAt.getTime() + expiryHours * 60 * 60 * 1000);
    const rawToken = generateRawToken(tokenBytes);
    const tokenHash = hashVerificationToken(rawToken);

    const work = async (repo) => {
      await repo.revokeActiveTokens(numericUserId, EMAIL_VERIFICATION_TOKEN_TYPE, issuedAt);
      const token = await repo.createToken({
        userId: numericUserId,
        tokenType: EMAIL_VERIFICATION_TOKEN_TYPE,
        tokenHash,
        targetEmail,
        expiresAt,
        requestIp,
        requestUserAgent,
      });
      await repo.setUserVerificationState(numericUserId, {
        emailVerificationSentAt: issuedAt,
      });
      return {
        rawToken,
        token,
        expiresAt,
      };
    };

    return typeof repository.transaction === 'function'
      ? repository.transaction(work)
      : work(repository);
  }

  async function inspectEmailVerificationToken(rawToken) {
    const tokenHash = hashVerificationToken(rawToken);
    const token = await repository.findTokenByHash(tokenHash, EMAIL_VERIFICATION_TOKEN_TYPE);
    return {
      status: classifyToken(token, now()),
      token,
    };
  }

  async function consumeEmailVerificationToken(rawToken) {
    const inspected = await inspectEmailVerificationToken(rawToken);
    if (inspected.status !== 'active') {
      return inspected;
    }
    const usedAt = now();
    const token = await repository.markTokenUsed(inspected.token.id, usedAt);
    return {
      status: 'used',
      token,
    };
  }

  async function revokeActiveEmailVerificationTokens(userId) {
    return repository.revokeActiveTokens(
      Number(userId),
      EMAIL_VERIFICATION_TOKEN_TYPE,
      now()
    );
  }

  async function getEmailVerificationResendCooldown(userId) {
    const user = await repository.getUserVerificationState(Number(userId));
    const sentAt = normalizeDate(user?.emailVerificationSentAt);
    if (!sentAt) {
      return {
        active: false,
        remainingSeconds: 0,
        retryAt: null,
      };
    }

    const retryAt = new Date(sentAt.getTime() + resendCooldownSeconds * 1000);
    const remainingMs = retryAt.getTime() - now().getTime();
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
    return {
      active: remainingSeconds > 0,
      remainingSeconds,
      retryAt,
    };
  }

  return {
    issueEmailVerificationToken,
    inspectEmailVerificationToken,
    consumeEmailVerificationToken,
    revokeActiveEmailVerificationTokens,
    getEmailVerificationResendCooldown,
  };
}

module.exports = {
  DEFAULT_EXPIRY_HOURS,
  DEFAULT_RESEND_COOLDOWN_SECONDS,
  EMAIL_VERIFICATION_TOKEN_TYPE,
  classifyToken,
  createEmailVerificationTokenService,
  generateRawToken,
  hashVerificationToken,
};
