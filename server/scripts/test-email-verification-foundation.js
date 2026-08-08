const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { createPool } = require('../src/database/pool');

const MIGRATION_FILE = path.resolve(__dirname, '../migrations/027_add_email_verification_foundation.sql');

function createMemoryRepository({ now = () => new Date('2026-08-03T00:00:00.000Z') } = {}) {
  const users = new Map();
  const tokens = new Map();
  let nextId = 1;

  return {
    users,
    tokens,
    async transaction(callback) {
      return callback(this);
    },
    async getUserVerificationState(userId) {
      return users.get(Number(userId)) || null;
    },
    async setUserVerificationState(userId, patch = {}) {
      const current = users.get(Number(userId)) || { id: Number(userId) };
      users.set(Number(userId), { ...current, ...patch });
      return users.get(Number(userId));
    },
    async revokeActiveTokens(userId, tokenType, revokedAt = now()) {
      let count = 0;
      for (const token of tokens.values()) {
        if (token.userId === Number(userId) && token.tokenType === tokenType && !token.usedAt && !token.revokedAt) {
          token.revokedAt = revokedAt;
          count += 1;
        }
      }
      return count;
    },
    async createToken(record) {
      const token = { id: nextId++, ...record };
      tokens.set(token.id, token);
      return token;
    },
    async findTokenByHash(tokenHash, tokenType) {
      return Array.from(tokens.values()).find(token => token.tokenHash === tokenHash && token.tokenType === tokenType) || null;
    },
    async markTokenUsed(tokenId, usedAt = now()) {
      const token = tokens.get(Number(tokenId));
      if (!token) return null;
      if (!token.usedAt) token.usedAt = usedAt;
      return token;
    },
  };
}

function assertMigrationText() {
  assert.equal(fs.existsSync(MIGRATION_FILE), true, '027 email verification migration should exist');
  const sql = fs.readFileSync(MIGRATION_FILE, 'utf8');
  assert.match(sql, /email_verified_at\s+DATETIME\s+NULL/i);
  assert.match(sql, /email_verification_sent_at\s+DATETIME\s+NULL/i);
  assert.match(sql, /UPDATE\s+users\s+SET\s+email_verified_at\s*=\s*COALESCE/i);
  assert.match(sql, /CREATE TABLE IF NOT EXISTS account_verification_tokens/i);
  assert.match(sql, /user_id\s+INT\s+UNSIGNED\s+NOT NULL/i);
  assert.match(sql, /token_type\s+VARCHAR/i);
  assert.match(sql, /token_hash\s+CHAR\(64\)\s+NOT NULL/i);
  assert.match(sql, /UNIQUE KEY\s+uq_account_verification_tokens_hash\s+\(token_hash\)/i);
  assert.match(sql, /KEY\s+idx_account_verification_tokens_user_type\s+\(user_id,\s*token_type\)/i);
  assert.match(sql, /KEY\s+idx_account_verification_tokens_expires\s+\(expires_at\)/i);
  assert.match(sql, /CONSTRAINT\s+fk_account_verification_tokens_user/i);
  assert.match(sql, /ON DELETE CASCADE/i);
}

async function assertTokenService() {
  const {
    EMAIL_VERIFICATION_TOKEN_TYPE,
    createEmailVerificationTokenService,
    hashVerificationToken,
  } = require('../src/auth/emailVerification.service');

  const repo = createMemoryRepository();
  const now = new Date('2026-08-03T01:00:00.000Z');
  repo.users.set(42, {
    id: 42,
    email: 'learner@example.test',
    emailVerificationSentAt: null,
  });
  const service = createEmailVerificationTokenService(repo, {
    now: () => now,
    tokenBytes: 32,
  });

  const issued = await service.issueEmailVerificationToken({
    userId: 42,
    targetEmail: 'learner@example.test',
    requestIp: '127.0.0.1',
    requestUserAgent: 'Jest/RED',
  });

  assert.equal(typeof issued.rawToken, 'string');
  assert.ok(issued.rawToken.length >= 32);
  assert.equal(issued.token.tokenType, EMAIL_VERIFICATION_TOKEN_TYPE);
  assert.equal(issued.token.userId, 42);
  assert.equal(issued.token.targetEmail, 'learner@example.test');
  assert.equal(issued.token.requestIp, '127.0.0.1');
  assert.equal(issued.token.requestUserAgent, 'Jest/RED');
  assert.equal(issued.token.tokenHash.length, 64);
  assert.match(issued.token.tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(issued.rawToken, issued.token.tokenHash);
  assert.equal(hashVerificationToken(issued.rawToken), issued.token.tokenHash);
  assert.equal(repo.users.get(42).emailVerificationSentAt.toISOString(), now.toISOString());

  const expiryMs = issued.expiresAt.getTime() - now.getTime();
  assert.ok(expiryMs >= 23.9 * 60 * 60 * 1000 && expiryMs <= 24.1 * 60 * 60 * 1000);

  const active = await service.inspectEmailVerificationToken(issued.rawToken);
  assert.equal(active.status, 'active');
  assert.equal(active.token.id, issued.token.id);

  const oldRawToken = issued.rawToken;
  const second = await service.issueEmailVerificationToken({
    userId: 42,
    targetEmail: 'learner@example.test',
  });
  assert.notEqual(second.rawToken, oldRawToken);
  assert.equal((await service.inspectEmailVerificationToken(oldRawToken)).status, 'revoked');
  assert.equal((await service.inspectEmailVerificationToken(second.rawToken)).status, 'active');

  const consumed = await service.consumeEmailVerificationToken(second.rawToken);
  assert.equal(consumed.status, 'used');
  assert.equal((await service.consumeEmailVerificationToken(second.rawToken)).status, 'used');

  const revoked = await service.issueEmailVerificationToken({ userId: 42, targetEmail: 'learner@example.test' });
  await service.revokeActiveEmailVerificationTokens(42);
  assert.equal((await service.inspectEmailVerificationToken(revoked.rawToken)).status, 'revoked');

  const expiredRepo = createMemoryRepository();
  expiredRepo.users.set(7, { id: 7, email: 'old@example.test', emailVerificationSentAt: null });
  const expiredService = createEmailVerificationTokenService(expiredRepo, {
    now: () => new Date('2026-08-03T00:00:00.000Z'),
    tokenBytes: 32,
    expiryHours: -1,
  });
  const expired = await expiredService.issueEmailVerificationToken({ userId: 7, targetEmail: 'old@example.test' });
  assert.equal((await expiredService.inspectEmailVerificationToken(expired.rawToken)).status, 'expired');
  assert.equal((await service.inspectEmailVerificationToken('missing-token')).status, 'missing');

  repo.users.set(99, {
    id: 99,
    email: 'cooldown@example.test',
    emailVerificationSentAt: new Date(now.getTime() - 30 * 1000),
  });
  const cooldown = await service.getEmailVerificationResendCooldown(99);
  assert.equal(cooldown.active, true);
  assert.ok(cooldown.remainingSeconds >= 29 && cooldown.remainingSeconds <= 30);
}

async function assertEmailBoundary() {
  const {
    EMAIL_TRANSPORT_DISABLED,
    createEmailVerificationSender,
  } = require('../src/auth/emailVerificationEmail.service');

  const sent = [];
  const sender = createEmailVerificationSender({
    transport: EMAIL_TRANSPORT_DISABLED,
    send: async (message) => {
      sent.push(message);
      return { ok: true, providerMessageId: 'hidden-provider-id' };
    },
    fromName: 'Cyberly',
    fromAddress: 'noreply@example.test',
  });

  const result = await sender.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    learnerName: 'Learner',
    verificationUrl: 'https://app.example.test/verify-email?token=redacted',
    expiresAt: new Date('2026-08-04T00:00:00.000Z'),
    locale: 'ms',
  });

  assert.equal(result.ok, true);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, 'learner@example.test');
  assert.equal(sent[0].locale, 'ms');
  assert.equal(sent[0].verificationUrl, 'https://app.example.test/verify-email?token=redacted');
  assert.equal(Object.hasOwn(sent[0], 'rawToken'), false);

  const failingSender = createEmailVerificationSender({
    transport: EMAIL_TRANSPORT_DISABLED,
    send: async () => {
      throw new Error('smtp password leaked if exposed');
    },
  });

  const failure = await failingSender.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    learnerName: 'Learner',
    verificationUrl: 'https://app.example.test/verify-email?token=redacted',
    expiresAt: new Date('2026-08-04T00:00:00.000Z'),
    locale: 'en',
  });

  assert.equal(failure.ok, false);
  assert.equal(failure.error.code, 'EMAIL_SEND_FAILED');
  assert.equal(failure.error.category, 'email_transport_failed');
  assert.equal(JSON.stringify(failure).includes('smtp password'), false);
}

async function assertDatabaseBackedTokenRepository() {
  const { createEmailVerificationRepository } = require('../src/auth/emailVerification.repository');
  const { createEmailVerificationTokenService } = require('../src/auth/emailVerification.service');
  const pool = createPool();
  const email = 'auth.ev.6b.foundation@example.com';

  try {
    await pool.query('DELETE FROM users WHERE email = ?', [email]);
    const [insert] = await pool.query(
      `INSERT INTO users (
          email, display_name, age, age_group, password_hash, role, account_status, email_verified_at
       )
       VALUES (?, 'AUTH EV 6B Foundation', 16, 'teen', 'not-a-real-login-hash', 'user', 'active', CURRENT_TIMESTAMP)`,
      [email]
    );

    const repository = createEmailVerificationRepository(pool);
    const service = createEmailVerificationTokenService(repository);
    const issued = await service.issueEmailVerificationToken({
      userId: insert.insertId,
      targetEmail: email,
      requestIp: '127.0.0.1',
      requestUserAgent: 'Foundation test',
    });

    const [rows] = await pool.query(
      `SELECT token_hash, target_email
       FROM account_verification_tokens
       WHERE user_id = ?`,
      [insert.insertId]
    );
    assert.equal(rows.length, 1);
    assert.equal(rows[0].target_email, email);
    assert.match(rows[0].token_hash, /^[a-f0-9]{64}$/);
    assert.notEqual(rows[0].token_hash, issued.rawToken);

    const inspected = await service.inspectEmailVerificationToken(issued.rawToken);
    assert.equal(inspected.status, 'active');

    await pool.query('DELETE FROM users WHERE id = ?', [insert.insertId]);
    const [[remaining]] = await pool.query(
      'SELECT COUNT(*) AS count FROM account_verification_tokens WHERE user_id = ?',
      [insert.insertId]
    );
    assert.equal(Number(remaining.count), 0);
  } finally {
    await pool.query('DELETE FROM users WHERE email = ?', [email]).catch(() => {});
    await pool.end();
  }
}

(async () => {
  assertMigrationText();
  await assertTokenService();
  await assertEmailBoundary();
  await assertDatabaseBackedTokenRepository();
  console.log('Email verification foundation verification passed.');
})().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
