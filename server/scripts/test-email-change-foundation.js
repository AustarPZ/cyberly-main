const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const {
  buildAdminDatabaseConfig,
  buildTestDatabaseConfig,
  createIsolatedDatabaseName,
  validateTestDatabaseEnvironment,
} = require('../src/database/migration-test-safety');
const { runMigrations } = require('../src/database/migration-runner');
const { normalizeEmail } = require('../src/auth/validation');
const {
  createEmailChangeToken,
  classifyEmailChangeRequest,
  hashEmailChangeToken,
} = require('../src/auth/emailChangeToken.service');
const {
  createEmailChangeRepository,
  isActiveReservationConflict,
} = require('../src/auth/emailChange.repository');

function quoteIdentifier(identifier) {
  if (!/^cyberly_test_[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error('Unsafe test database identifier.');
  }
  return `\`${identifier}\``;
}

async function createDatabase(config, databaseName) {
  const connection = await mysql.createConnection(buildAdminDatabaseConfig(config));
  try {
    await connection.query(
      `CREATE DATABASE ${quoteIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function dropDatabase(config, databaseName) {
  const connection = await mysql.createConnection(buildAdminDatabaseConfig(config));
  try {
    await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
  } finally {
    await connection.end();
  }
}

async function insertLearner(pool, email) {
  const [result] = await pool.query(
    `INSERT INTO users (
       email, display_name, age, age_group, password_hash, role,
       account_status, email_verified_at
     ) VALUES (?, 'Email Change Test', 16, 'teen', 'not-a-login-hash',
       'user', 'active', CURRENT_TIMESTAMP)`,
    [email]
  );
  return result.insertId;
}

function requestRecord(userId, candidate, token, now, locale = 'en') {
  return {
    userId,
    newEmailNormalized: normalizeEmail(candidate),
    tokenHash: token.tokenHash,
    locale,
    expiresAt: token.expiresAt,
    createdAt: now,
  };
}

function assertTokenFoundation() {
  const now = new Date('2026-08-26T00:00:00.000Z');
  const token = createEmailChangeToken({ now });
  assert.match(token.rawToken, /^[A-Za-z0-9_-]+$/);
  assert.ok(token.rawToken.length >= 43);
  assert.match(token.tokenHash, /^[a-f0-9]{64}$/);
  assert.notEqual(token.rawToken, token.tokenHash);
  assert.equal(hashEmailChangeToken(token.rawToken), token.tokenHash);
  assert.equal(token.expiresAt.toISOString(), '2026-08-26T01:00:00.000Z');
  assert.equal(classifyEmailChangeRequest(null, now), 'missing');
  assert.equal(classifyEmailChangeRequest({ expiresAt: token.expiresAt }, now), 'active');
  assert.equal(classifyEmailChangeRequest({ expiresAt: now }, now), 'expired');
  assert.equal(classifyEmailChangeRequest({ expiresAt: token.expiresAt, usedAt: now }, now), 'used');
  assert.equal(classifyEmailChangeRequest({ expiresAt: token.expiresAt, revokedAt: now }, now), 'revoked');
}

async function assertDatabaseFoundation(config) {
  const databaseName = createIsolatedDatabaseName('email_change');
  await createDatabase(config, databaseName);
  const pool = mysql.createPool({
    ...buildTestDatabaseConfig(config, databaseName),
    connectionLimit: 5,
  });

  try {
    const migrationConnection = await pool.getConnection();
    try {
      await runMigrations({ connection: migrationConnection });
    } finally {
      migrationConnection.release();
    }

    const [[versionRow]] = await pool.query('SELECT VERSION() AS version');
    const [[migrationRow]] = await pool.query('SELECT COUNT(*) AS count FROM schema_migrations');
    assert.match(String(versionRow.version), /^8\./);
    assert.equal(Number(migrationRow.count), 30);

    const repository = createEmailChangeRepository(pool);
    const now = new Date('2026-08-26T02:00:00.000Z');
    const learnerA = await insertLearner(pool, 'email-change-a@example.test');
    const learnerB = await insertLearner(pool, 'email-change-b@example.test');

    const first = createEmailChangeToken({ now });
    const firstRequest = await repository.transaction(async (repo) => {
      await repo.lockLearnerForUpdate(learnerA);
      return repo.createRequest(requestRecord(
        learnerA,
        '  Candidate@Example.Test ',
        first,
        now,
        'ms'
      ));
    });
    assert.equal(firstRequest.newEmailNormalized, 'candidate@example.test');
    assert.equal(firstRequest.locale, 'ms');
    assert.equal(firstRequest.tokenHash, first.tokenHash);
    assert.notEqual(firstRequest.tokenHash, first.rawToken);
    assert.equal((await repository.findByTokenHash(first.tokenHash)).id, firstRequest.id);

    await assert.rejects(
      repository.createRequest(requestRecord(
        learnerA,
        'other@example.test',
        createEmailChangeToken({ now }),
        now
      )),
      isActiveReservationConflict
    );

    const used = await repository.markUsedIfActive(firstRequest.id, now);
    assert.equal(used.usedAt.getTime(), now.getTime());
    assert.equal(classifyEmailChangeRequest(used, now), 'used');
    assert.equal(await repository.markUsedIfActive(firstRequest.id, now), null);

    const afterUse = await repository.createRequest(requestRecord(
      learnerA,
      'candidate@example.test',
      createEmailChangeToken({ now }),
      now
    ));
    assert.ok(afterUse.id > firstRequest.id);
    assert.equal(await repository.revokeByIdIfActive(afterUse.id, now), true);

    const afterRevoke = await repository.createRequest(requestRecord(
      learnerB,
      'candidate@example.test',
      createEmailChangeToken({ now }),
      now
    ));
    assert.ok(afterRevoke.id > afterUse.id);
    await repository.revokeByIdIfActive(afterRevoke.id, now);

    const expiredNow = new Date('2026-08-26T03:00:00.000Z');
    const expiredToken = createEmailChangeToken({ now: new Date('2026-08-26T01:00:00.000Z') });
    const expired = await repository.createRequest(requestRecord(
      learnerA,
      'expired@example.test',
      expiredToken,
      new Date('2026-08-26T01:00:00.000Z')
    ));
    assert.equal(classifyEmailChangeRequest(expired, expiredNow), 'expired');
    await repository.revokeExpiredActiveRequests({
      userId: learnerA,
      newEmailNormalized: 'expired@example.test',
      revokedAt: expiredNow,
    });
    const reused = await repository.createRequest(requestRecord(
      learnerB,
      'expired@example.test',
      createEmailChangeToken({ now: expiredNow }),
      expiredNow
    ));
    assert.ok(reused.id > expired.id);
    await repository.revokeByIdIfActive(reused.id, expiredNow);

    const firstLockAcquired = {};
    firstLockAcquired.promise = new Promise(resolve => { firstLockAcquired.resolve = resolve; });
    const releaseFirst = {};
    releaseFirst.promise = new Promise(resolve => { releaseFirst.resolve = resolve; });
    const firstConcurrentToken = createEmailChangeToken({ now: expiredNow });
    const secondConcurrentToken = createEmailChangeToken({ now: expiredNow });

    const firstConcurrent = repository.transaction(async (repo) => {
      await repo.lockLearnerForUpdate(learnerA);
      firstLockAcquired.resolve();
      await releaseFirst.promise;
      await repo.revokeActiveForUser(learnerA, expiredNow);
      return repo.createRequest(requestRecord(
        learnerA,
        'first-concurrent@example.test',
        firstConcurrentToken,
        expiredNow
      ));
    });
    await firstLockAcquired.promise;
    const secondConcurrent = repository.transaction(async (repo) => {
      await repo.lockLearnerForUpdate(learnerA);
      await repo.revokeActiveForUser(learnerA, expiredNow);
      return repo.createRequest(requestRecord(
        learnerA,
        'second-concurrent@example.test',
        secondConcurrentToken,
        expiredNow
      ));
    });
    releaseFirst.resolve();
    const [, newest] = await Promise.all([firstConcurrent, secondConcurrent]);
    const [activeForLearner] = await repository.listActiveForUser(learnerA);
    assert.equal(activeForLearner.id, newest.id);
    assert.equal(activeForLearner.newEmailNormalized, 'second-concurrent@example.test');

    await repository.revokeActiveForUser(learnerA, expiredNow);
    const sharedCandidate = 'shared-candidate@example.test';
    const candidateResults = await Promise.allSettled([
      repository.transaction(async (repo) => {
        await repo.lockLearnerForUpdate(learnerA);
        return repo.createRequest(requestRecord(
          learnerA,
          sharedCandidate,
          createEmailChangeToken({ now: expiredNow }),
          expiredNow
        ));
      }),
      repository.transaction(async (repo) => {
        await repo.lockLearnerForUpdate(learnerB);
        return repo.createRequest(requestRecord(
          learnerB,
          sharedCandidate,
          createEmailChangeToken({ now: expiredNow }),
          expiredNow
        ));
      }),
    ]);
    assert.equal(candidateResults.filter(result => result.status === 'fulfilled').length, 1);
    const [candidateFailure] = candidateResults.filter(result => result.status === 'rejected');
    assert.equal(isActiveReservationConflict(candidateFailure.reason), true);

    const winner = candidateResults.find(result => result.status === 'fulfilled').value;
    const locked = await repository.transaction(repo => repo.findByTokenHashForUpdate(winner.tokenHash));
    assert.equal(locked.id, winner.id);

    await pool.query('DELETE FROM users WHERE id = ?', [winner.userId]);
    const [[cascadeRow]] = await pool.query(
      'SELECT COUNT(*) AS count FROM email_change_requests WHERE user_id = ?',
      [winner.userId]
    );
    assert.equal(Number(cascadeRow.count), 0);

    console.log(`Email change disposable MySQL passed: version ${versionRow.version}, migrations 30.`);
  } finally {
    await pool.end();
    await dropDatabase(config, databaseName);
    console.log(`Dropped isolated email change database ${databaseName}.`);
  }
}

async function run() {
  assertTokenFoundation();
  const hasDatabaseConfig = [
    'TEST_DB_HOST',
    'TEST_DB_USER',
    'TEST_DB_PASSWORD',
    'TEST_DB_ADMIN_DATABASE',
  ].every(key => String(process.env[key] || '').trim());
  if (!hasDatabaseConfig) {
    console.log('Skipping isolated email change DB test: TEST_DB_* configuration is not set.');
    console.log('Email change foundation verification passed.');
    return;
  }
  const config = validateTestDatabaseEnvironment(process.env);
  await assertDatabaseFoundation(config);
  console.log('Email change foundation verification passed.');
}

run().catch((error) => {
  console.error('Email change foundation verification failed:', error.message);
  process.exitCode = 1;
});
