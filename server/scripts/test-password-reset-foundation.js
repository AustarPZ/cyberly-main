const assert = require('node:assert/strict');
const crypto = require('node:crypto');

const {
  PASSWORD_RESET_TOKEN_TYPE,
  createPasswordResetTokenService,
  hashPasswordResetToken,
} = require('../src/auth/passwordResetToken.service');

function createMemoryRepository() {
  const tokens = [];
  const users = new Map([
    [7, {
      id: 7,
      role: 'user',
      accountStatus: 'active',
      passwordHash: 'old-password-hash',
      sessionVersion: 3,
    }],
  ]);
  let nextId = 1;

  const repository = {
    tokens,
    async transaction(work) {
      const tokenSnapshot = tokens.map(token => ({ ...token }));
      const userSnapshot = new Map(Array.from(users, ([id, user]) => [id, { ...user }]));
      try {
        return await work(repository);
      } catch (error) {
        tokens.splice(0, tokens.length, ...tokenSnapshot);
        users.clear();
        for (const [id, user] of userSnapshot) users.set(id, user);
        throw error;
      }
    },
    async revokeActiveTokens(userId, tokenType, revokedAt) {
      for (const token of tokens) {
        if (token.userId === userId && token.tokenType === tokenType && !token.usedAt && !token.revokedAt) {
          token.revokedAt = revokedAt;
        }
      }
    },
    async createToken(input) {
      const token = { id: nextId++, usedAt: null, revokedAt: null, ...input };
      tokens.push(token);
      return token;
    },
    async findTokenByHash(tokenHash, tokenType) {
      return tokens.find(token => token.tokenHash === tokenHash && token.tokenType === tokenType) || null;
    },
    async findTokenByHashForUpdate(tokenHash, tokenType) {
      return repository.findTokenByHash(tokenHash, tokenType);
    },
    async markTokenUsedIfActive(tokenId, usedAt) {
      const token = tokens.find(candidate => candidate.id === tokenId);
      if (!token || token.usedAt || token.revokedAt) return null;
      token.usedAt = usedAt;
      return token;
    },
    async findUserForPasswordResetForUpdate(userId) {
      return users.get(Number(userId)) || null;
    },
    async updatePasswordHash(userId, passwordHash) {
      const user = users.get(Number(userId));
      if (!user) return false;
      user.passwordHash = passwordHash;
      return true;
    },
    async incrementSessionVersion(userId) {
      const user = users.get(Number(userId));
      if (!user) return null;
      user.sessionVersion += 1;
      return user.sessionVersion;
    },
  };

  repository.users = users;
  return repository;
}

async function run() {
  const issuedAt = new Date('2026-08-24T08:00:00.000Z');
  const repository = createMemoryRepository();
  const service = createPasswordResetTokenService(repository, { now: () => issuedAt });

  const first = await service.issuePasswordResetToken({ userId: 7 });
  assert.equal(PASSWORD_RESET_TOKEN_TYPE, 'password_reset');
  assert.equal(Buffer.from(first.rawToken, 'base64url').length, 32);
  assert.notEqual(first.rawToken, repository.tokens[0].tokenHash);
  assert.equal(repository.tokens[0].tokenHash, hashPasswordResetToken(first.rawToken));
  assert.equal(repository.tokens[0].tokenHash, crypto.createHash('sha256').update(first.rawToken).digest('hex'));
  assert.equal(repository.tokens[0].tokenType, PASSWORD_RESET_TOKEN_TYPE);
  assert.equal(first.expiresAt.toISOString(), '2026-08-24T08:30:00.000Z');
  assert.equal(JSON.stringify(repository.tokens).includes(first.rawToken), false);

  const verificationRawToken = 'verification-raw-token';
  repository.tokens.push({
    id: 99,
    userId: 7,
    tokenType: 'email_verification',
    tokenHash: hashPasswordResetToken(verificationRawToken),
    expiresAt: new Date('2026-08-25T08:00:00.000Z'),
    usedAt: null,
    revokedAt: null,
  });
  const second = await service.issuePasswordResetToken({ userId: 7 });
  assert.ok(repository.tokens[0].revokedAt);
  assert.equal(repository.tokens.find(token => token.id === 99).revokedAt, null);
  assert.equal((await service.inspectPasswordResetToken(second.rawToken)).status, 'active');
  assert.equal((await service.inspectPasswordResetToken('unknown-token')).status, 'missing');
  assert.equal((await service.inspectPasswordResetToken(verificationRawToken)).status, 'missing');

  const completionRepository = createMemoryRepository();
  const completionService = createPasswordResetTokenService(completionRepository, { now: () => issuedAt });
  const completionToken = await completionService.issuePasswordResetToken({ userId: 7 });
  const completion = await completionService.completePasswordReset(completionToken.rawToken, 'new-password-hash');
  assert.equal(completion.status, 'reset');
  assert.equal(completionRepository.users.get(7).passwordHash, 'new-password-hash');
  assert.equal(completionRepository.users.get(7).sessionVersion, 4);
  assert.ok(completionRepository.tokens.find(token => token.tokenHash === hashPasswordResetToken(completionToken.rawToken)).usedAt);

  for (const failure of ['password', 'consume', 'session']) {
    const failureRepository = createMemoryRepository();
    const failureService = createPasswordResetTokenService(failureRepository, { now: () => issuedAt });
    const failureToken = await failureService.issuePasswordResetToken({ userId: 7 });
    if (failure === 'password') failureRepository.updatePasswordHash = async () => false;
    if (failure === 'consume') failureRepository.markTokenUsedIfActive = async () => null;
    if (failure === 'session') failureRepository.incrementSessionVersion = async () => null;

    await assert.rejects(
      failureService.completePasswordReset(failureToken.rawToken, 'new-password-hash')
    );
    assert.equal(failureRepository.users.get(7).passwordHash, 'old-password-hash');
    assert.equal(failureRepository.users.get(7).sessionVersion, 3);
    assert.equal(failureRepository.tokens[0].usedAt, null);
  }

  const usedResult = await service.consumePasswordResetToken(second.rawToken, async () => 'updated');
  assert.equal(usedResult.status, 'used');
  assert.equal(usedResult.result, 'updated');
  assert.equal((await service.consumePasswordResetToken(second.rawToken, async () => 'duplicate')).status, 'used');

  const conflictRepository = createMemoryRepository();
  const conflictService = createPasswordResetTokenService(conflictRepository, { now: () => issuedAt });
  const conflict = await conflictService.issuePasswordResetToken({ userId: 10 });
  conflictRepository.markTokenUsedIfActive = async () => null;
  await assert.rejects(
    conflictService.consumePasswordResetToken(conflict.rawToken, async () => 'password-updated'),
    /could not be consumed/i
  );

  const revoked = await service.issuePasswordResetToken({ userId: 8 });
  repository.tokens.find(token => token.tokenHash === hashPasswordResetToken(revoked.rawToken)).revokedAt = issuedAt;
  assert.equal((await service.inspectPasswordResetToken(revoked.rawToken)).status, 'revoked');

  const expiredRepository = createMemoryRepository();
  const expiryService = createPasswordResetTokenService(expiredRepository, { now: () => issuedAt });
  const expired = await expiryService.issuePasswordResetToken({ userId: 9 });
  const laterService = createPasswordResetTokenService(expiredRepository, {
    now: () => new Date('2026-08-24T08:31:00.000Z'),
  });
  assert.equal((await laterService.inspectPasswordResetToken(expired.rawToken)).status, 'expired');

  console.log('Password reset foundation tests passed: 12 assertions groups.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
