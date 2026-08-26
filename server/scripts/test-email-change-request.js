const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const {
  buildAdminDatabaseConfig,
  buildTestDatabaseConfig,
  createIsolatedDatabaseName,
  validateTestDatabaseEnvironment,
} = require('../src/database/migration-test-safety');
const { runMigrations } = require('../src/database/migration-runner');
const {
  createEmailChangeRequestService,
} = require('../src/auth/emailChangeRequest.service');
const {
  buildEmailChangeVerificationLink,
  createEmailChangeSender,
} = require('../src/auth/emailChangeEmail.service');
const {
  createEmailChangeToken,
} = require('../src/auth/emailChangeToken.service');

const PASSWORD = 'CurrentPass9';
const NOW = new Date('2026-08-26T06:00:00.000Z');

function learner(overrides = {}) {
  return {
    id: 41,
    email: 'learner@example.test',
    passwordHash: overrides.passwordHash,
    role: 'user',
    accountStatus: 'active',
    emailVerifiedAt: NOW,
    ...overrides,
  };
}

function createHarness(options = {}) {
  const rows = (options.rows || []).map(row => ({ ...row }));
  const calls = [];
  let nextId = 1;
  const credential = options.credential;
  const locked = options.locked || credential;
  const repo = {
    async findLearnerCredentialSnapshot() {
      calls.push(['credential']);
      return credential;
    },
    async transaction(work) {
      calls.push(['transaction']);
      return work(repo);
    },
    async lockLearnerForUpdate() {
      calls.push(['lock']);
      return locked;
    },
    async revokeExpiredActiveRequests(args) {
      calls.push(['revokeExpired', args]);
      return 0;
    },
    async findCanonicalEmailOwner(email) {
      calls.push(['owner', email]);
      return options.owner || null;
    },
    async revokeActiveForUser(userId) {
      calls.push(['revokeActiveForUser', userId]);
      for (const row of rows) {
        if (row.userId === userId && !row.usedAt && !row.revokedAt) row.revokedAt = NOW;
      }
      return 1;
    },
    async createRequest(request) {
      calls.push(['createRequest', request]);
      if (options.createError) throw options.createError;
      const row = { id: nextId++, usedAt: null, revokedAt: null, ...request };
      rows.push(row);
      return row;
    },
    async revokeByIdIfActive(id) {
      calls.push(['revokeByIdIfActive', id]);
      if (options.cleanupError) throw options.cleanupError;
      const row = rows.find(candidate => candidate.id === id);
      if (!row || row.usedAt || row.revokedAt) return false;
      row.revokedAt = NOW;
      return true;
    },
  };
  const sent = [];
  const sender = {
    async sendEmailChangeVerification(message) {
      sent.push(message);
      if (options.beforeDeliveryResult) await options.beforeDeliveryResult({ repo, rows });
      return options.delivery || { ok: true, disabled: false };
    },
  };
  const service = createEmailChangeRequestService({
    repository: repo,
    passwordComparer: bcrypt.compare,
    tokenFactory: () => createEmailChangeToken({ now: NOW }),
    sender,
    clientBaseUrl: 'https://app.example.test',
    now: () => NOW,
  });
  return { calls, repo, rows, sent, service };
}

async function expectCode(promise, code) {
  await assert.rejects(promise, error => {
    assert.equal(error.code, code);
    return true;
  });
}

async function testRequestService() {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);

  let harness = createHarness({ credential: null });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'next@example.test',
    currentPassword: PASSWORD,
  }), 'AUTH_REQUIRED');

  harness = createHarness({ credential: learner({ passwordHash }) });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'next@example.test',
    currentPassword: '',
  }), 'EMAIL_CHANGE_PASSWORD_REQUIRED');
  assert.equal(harness.calls.length, 0);

  harness = createHarness({ credential: learner({ passwordHash }) });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'not-an-email',
    currentPassword: PASSWORD,
  }), 'EMAIL_CHANGE_EMAIL_INVALID');
  assert.equal(harness.calls.length, 0);

  harness = createHarness({ credential: learner({ passwordHash }) });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'next@example.test',
    currentPassword: 'WrongPass9',
  }), 'EMAIL_CHANGE_PASSWORD_INVALID');
  assert.deepEqual(harness.calls, [['credential']]);
  assert.equal(harness.sent.length, 0);

  const changedHash = await bcrypt.hash('ChangedPass8', 4);
  harness = createHarness({
    credential: learner({ passwordHash }),
    locked: learner({ passwordHash: changedHash }),
  });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'next@example.test',
    currentPassword: PASSWORD,
  }), 'EMAIL_CHANGE_PASSWORD_INVALID');
  assert.equal(harness.calls.some(([name]) => name === 'revokeActiveForUser'), false);
  assert.equal(harness.calls.some(([name]) => name === 'createRequest'), false);
  assert.equal(harness.sent.length, 0);

  const reservationConflict = new Error(
    "Duplicate entry for key 'uq_email_change_requests_active_email'"
  );
  reservationConflict.code = 'ER_DUP_ENTRY';
  harness = createHarness({
    credential: learner({ passwordHash }),
    createError: reservationConflict,
  });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'reserved@example.test',
    currentPassword: PASSWORD,
  }), 'EMAIL_CHANGE_EMAIL_UNAVAILABLE');
  assert.equal(harness.sent.length, 0);

  for (const credential of [
    learner({ passwordHash, role: 'admin' }),
    learner({ passwordHash, accountStatus: 'disabled' }),
    learner({ passwordHash, emailVerifiedAt: null }),
  ]) {
    harness = createHarness({ credential });
    const expected = credential.role !== 'user'
      ? 'AUTH_FORBIDDEN'
      : credential.accountStatus !== 'active'
        ? 'AUTH_ACCOUNT_DISABLED'
        : 'EMAIL_VERIFICATION_REQUIRED';
    await expectCode(harness.service.requestEmailChange({
      userId: 41,
      newEmail: 'next@example.test',
      currentPassword: PASSWORD,
    }), expected);
  }

  harness = createHarness({ credential: learner({ passwordHash }) });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: ' LEARNER@example.test ',
    currentPassword: PASSWORD,
  }), 'EMAIL_CHANGE_EMAIL_UNAVAILABLE');
  assert.equal(harness.calls.some(([name]) => name === 'revokeActiveForUser'), false);

  harness = createHarness({
    credential: learner({ passwordHash }),
    owner: { id: 99 },
  });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'owned@example.test',
    currentPassword: PASSWORD,
  }), 'EMAIL_CHANGE_EMAIL_UNAVAILABLE');
  assert.equal(harness.calls.some(([name]) => name === 'revokeActiveForUser'), false);

  harness = createHarness({ credential: learner({ passwordHash }) });
  const accepted = await harness.service.requestEmailChange({
    userId: 41,
    newEmail: ' Next@Example.Test ',
    currentPassword: PASSWORD,
    locale: 'ms',
  });
  assert.deepEqual(accepted, { status: 'accepted', expiresInSeconds: 3600 });
  assert.equal(harness.rows.length, 1);
  assert.equal(harness.rows[0].newEmailNormalized, 'next@example.test');
  assert.match(harness.rows[0].tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(Object.hasOwn(harness.rows[0], 'rawToken'), false);
  assert.equal(harness.sent[0].recipientEmail, 'next@example.test');
  assert.equal(harness.sent[0].locale, 'ms');
  assert.deepEqual(
    harness.calls
      .map(([name]) => name)
      .filter(name => ['lock', 'revokeExpired', 'owner', 'revokeActiveForUser', 'createRequest'].includes(name)),
    ['lock', 'revokeExpired', 'owner', 'revokeActiveForUser', 'createRequest']
  );
  const url = new URL(harness.sent[0].verificationUrl);
  assert.equal(url.hash.startsWith('#/verify-email-change?token='), true);
  assert.deepEqual(Array.from(new URLSearchParams(url.hash.split('?')[1]).keys()), ['token']);
  assert.equal(JSON.stringify(accepted).includes('token'), false);

  harness = createHarness({
    credential: learner({ passwordHash }),
    rows: [{
      id: 88,
      userId: 41,
      newEmailNormalized: 'previous@example.test',
      usedAt: null,
      revokedAt: null,
    }],
  });
  await harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'replacement@example.test',
    currentPassword: PASSWORD,
  });
  assert.ok(harness.rows.find(row => row.id === 88).revokedAt);
  assert.equal(
    harness.rows.filter(row => row.userId === 41 && !row.usedAt && !row.revokedAt).length,
    1
  );

  for (const delivery of [{ ok: false, disabled: false }, { ok: true, disabled: true }]) {
    harness = createHarness({ credential: learner({ passwordHash }), delivery });
    await expectCode(harness.service.requestEmailChange({
      userId: 41,
      newEmail: 'failed@example.test',
      currentPassword: PASSWORD,
    }), 'EMAIL_SEND_FAILED');
    assert.ok(harness.rows[0].revokedAt);
    assert.deepEqual(
      harness.calls.filter(([name]) => name === 'revokeByIdIfActive').map(([, id]) => id),
      [harness.rows[0].id]
    );
  }

  const cleanupError = new Error('private SQL cleanup detail');
  cleanupError.code = 'ER_INTERNAL_TEST_DETAIL';
  harness = createHarness({
    credential: learner({ passwordHash }),
    delivery: { ok: false, disabled: false },
    cleanupError,
  });
  await assert.rejects(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'cleanup-error@example.test',
    currentPassword: PASSWORD,
  }), error => {
    assert.equal(error.status, 500);
    assert.equal(error.code, 'INTERNAL_SERVER_ERROR');
    assert.equal(error.message, 'Email change request cleanup failed.');
    assert.equal(JSON.stringify(error).includes('private SQL cleanup detail'), false);
    assert.equal(JSON.stringify(error).includes('ER_INTERNAL_TEST_DETAIL'), false);
    return true;
  });

  harness = createHarness({
    credential: learner({ passwordHash }),
    delivery: { ok: false, disabled: false },
    async beforeDeliveryResult({ rows }) {
      rows[0].revokedAt = NOW;
      rows.push({
        id: 2,
        userId: 41,
        newEmailNormalized: 'newer@example.test',
        usedAt: null,
        revokedAt: null,
      });
    },
  });
  await expectCode(harness.service.requestEmailChange({
    userId: 41,
    newEmail: 'older@example.test',
    currentPassword: PASSWORD,
  }), 'EMAIL_SEND_FAILED');
  assert.equal(harness.rows[1].revokedAt, null);
  assert.deepEqual(
    harness.calls.filter(([name]) => name === 'revokeByIdIfActive').map(([, id]) => id),
    [1]
  );
}

async function testEmailSender() {
  const link = buildEmailChangeVerificationLink(
    'https://app.example.test/',
    'token with unsafe characters?'
  );
  assert.equal(
    link,
    'https://app.example.test/#/verify-email-change?token=token%20with%20unsafe%20characters%3F'
  );
  const sent = [];
  const sender = createEmailChangeSender({
    transport: 'test',
    fromAddress: 'no-reply@example.test',
    send: async message => {
      sent.push(message);
      return { ok: true };
    },
  });
  for (const locale of ['en', 'ms', 'zh-CN']) {
    const result = await sender.sendEmailChangeVerification({
      recipientEmail: 'next@example.test',
      verificationUrl: link,
      locale,
    });
    assert.equal(result.ok, true);
  }
  assert.equal(sent.length, 3);
  for (const message of sent) {
    assert.equal(message.to, 'next@example.test');
    assert.match(message.text, /60|60 分钟/);
    assert.equal(message.text.includes(PASSWORD), false);
  }
}

function testRouteAndScopeContracts() {
  const serverSource = fs.readFileSync(path.resolve(__dirname, '../server.js'), 'utf8');
  assert.match(
    serverSource,
    /app\.post\(\s*['"]\/api\/auth\/email-change\/request['"],[\s\S]*?requireAuth,[\s\S]*?emailChangeIpRateLimit,[\s\S]*?emailChangeUserRateLimit/
  );
  assert.match(serverSource, /userId:\s*req\.session\.userId/);
  const requestServiceSource = fs.readFileSync(
    path.resolve(__dirname, '../src/auth/emailChangeRequest.service.js'),
    'utf8'
  );
  assert.doesNotMatch(requestServiceSource, /UPDATE\s+users/i);
  assert.doesNotMatch(requestServiceSource, /session_version|regenerate|destroySession/);
  assert.doesNotMatch(requestServiceSource, /revokeActiveForUser\(created\.id/);
}

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

async function insertLearner(pool, email, passwordHash, overrides = {}) {
  const [result] = await pool.query(
    `INSERT INTO users (
       email, display_name, age, age_group, password_hash, role,
       account_status, email_verified_at
     ) VALUES (?, 'Email Change I02', 16, 'teen', ?, ?, ?, ?)`,
    [
      email,
      passwordHash,
      overrides.role || 'user',
      overrides.accountStatus || 'active',
      overrides.verified === false ? null : NOW,
    ]
  );
  return Number(result.insertId);
}

function createRealService(repository, sender) {
  return createEmailChangeRequestService({
    repository,
    passwordComparer: bcrypt.compare,
    tokenFactory: () => createEmailChangeToken({ now: NOW }),
    sender,
    clientBaseUrl: 'https://app.example.test',
    now: () => NOW,
  });
}

function successfulSender(onSend) {
  return {
    async sendEmailChangeVerification(message) {
      if (onSend) await onSend(message);
      return { ok: true, disabled: false };
    },
  };
}

async function testRealMySql(config) {
  const databaseName = createIsolatedDatabaseName('email_change_i02');
  await createDatabase(config, databaseName);
  const databaseConfig = buildTestDatabaseConfig(config, databaseName);
  const pool = mysql.createPool({ ...databaseConfig, connectionLimit: 8 });
  try {
    const migrationConnection = await pool.getConnection();
    try {
      await runMigrations({ connection: migrationConnection });
    } finally {
      migrationConnection.release();
    }
    const [[version]] = await pool.query('SELECT VERSION() AS version');
    const [[migrationCount]] = await pool.query('SELECT COUNT(*) AS count FROM schema_migrations');
    assert.match(String(version.version), /^8\./);
    assert.equal(Number(migrationCount.count), 30);

    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    const repository = require('../src/auth/emailChange.repository').createEmailChangeRepository(pool);
    const learnerA = await insertLearner(pool, 'i02-a@example.test', passwordHash);
    const learnerB = await insertLearner(pool, 'i02-b@example.test', passwordHash);
    const learnerC = await insertLearner(pool, 'owned@example.test', passwordHash);
    const service = createRealService(repository, successfulSender());

    const accepted = await service.requestEmailChange({
      userId: learnerA,
      newEmail: ' Real.Next@Example.Test ',
      currentPassword: PASSWORD,
      locale: 'en',
    });
    assert.deepEqual(accepted, { status: 'accepted', expiresInSeconds: 3600 });
    const [[first]] = await pool.query(
      `SELECT id, new_email_normalized, token_hash, used_at, revoked_at
       FROM email_change_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1`,
      [learnerA]
    );
    assert.equal(first.new_email_normalized, 'real.next@example.test');
    assert.match(first.token_hash, /^[a-f0-9]{64}$/);
    assert.equal(Object.hasOwn(first, 'raw_token'), false);
    const [[canonical]] = await pool.query('SELECT email FROM users WHERE id = ?', [learnerA]);
    assert.equal(canonical.email, 'i02-a@example.test');

    await service.requestEmailChange({
      userId: learnerA,
      newEmail: 'newest@example.test',
      currentPassword: PASSWORD,
    });
    const [learnerRequests] = await pool.query(
      `SELECT new_email_normalized, revoked_at FROM email_change_requests
       WHERE user_id = ? ORDER BY id`,
      [learnerA]
    );
    assert.ok(learnerRequests[0].revoked_at);
    assert.equal(learnerRequests.filter(row => !row.revoked_at).length, 1);
    await repository.revokeActiveForUser(learnerA, NOW);

    const expiredToken = createEmailChangeToken({ now: new Date('2026-08-26T04:00:00.000Z') });
    await repository.createRequest({
      userId: learnerA,
      newEmailNormalized: 'expired-release@example.test',
      tokenHash: expiredToken.tokenHash,
      locale: 'en',
      expiresAt: expiredToken.expiresAt,
      createdAt: new Date('2026-08-26T04:00:00.000Z'),
    });
    await service.requestEmailChange({
      userId: learnerB,
      newEmail: 'expired-release@example.test',
      currentPassword: PASSWORD,
    });
    const [[expiredRow]] = await pool.query(
      `SELECT revoked_at FROM email_change_requests
       WHERE user_id = ? AND new_email_normalized = 'expired-release@example.test'`,
      [learnerA]
    );
    assert.ok(expiredRow.revoked_at);

    await expectCode(service.requestEmailChange({
      userId: learnerA,
      newEmail: 'owned@example.test',
      currentPassword: PASSWORD,
    }), 'EMAIL_CHANGE_EMAIL_UNAVAILABLE');

    await repository.revokeActiveForUser(learnerB, NOW);
    const reservedToken = createEmailChangeToken({ now: NOW });
    await repository.createRequest({
      userId: learnerB,
      newEmailNormalized: 'reserved-real@example.test',
      tokenHash: reservedToken.tokenHash,
      locale: 'en',
      expiresAt: reservedToken.expiresAt,
      createdAt: NOW,
    });
    await expectCode(service.requestEmailChange({
      userId: learnerA,
      newEmail: 'reserved-real@example.test',
      currentPassword: PASSWORD,
    }), 'EMAIL_CHANGE_EMAIL_UNAVAILABLE');

    await repository.revokeActiveForUser(learnerA, NOW);
    await repository.revokeActiveForUser(learnerB, NOW);
    const raceCandidate = 'race-real@example.test';
    const race = await Promise.allSettled([
      service.requestEmailChange({ userId: learnerA, newEmail: raceCandidate, currentPassword: PASSWORD }),
      service.requestEmailChange({ userId: learnerB, newEmail: raceCandidate, currentPassword: PASSWORD }),
    ]);
    assert.equal(race.filter(result => result.status === 'fulfilled').length, 1);
    assert.equal(race.filter(result => result.status === 'rejected')[0].reason.code, 'EMAIL_CHANGE_EMAIL_UNAVAILABLE');

    await repository.revokeActiveForUser(learnerA, NOW);
    await repository.revokeActiveForUser(learnerB, NOW);
    const failingService = createRealService(repository, {
      async sendEmailChangeVerification() { return { ok: false, disabled: false }; },
    });
    await expectCode(failingService.requestEmailChange({
      userId: learnerA,
      newEmail: 'failure-release@example.test',
      currentPassword: PASSWORD,
    }), 'EMAIL_SEND_FAILED');
    await service.requestEmailChange({
      userId: learnerB,
      newEmail: 'failure-release@example.test',
      currentPassword: PASSWORD,
    });

    await repository.revokeActiveForUser(learnerA, NOW);
    await repository.revokeActiveForUser(learnerB, NOW);
    let releaseOlder;
    let olderSendStarted;
    const olderStarted = new Promise(resolve => { olderSendStarted = resolve; });
    const olderRelease = new Promise(resolve => { releaseOlder = resolve; });
    const delayedFailureService = createRealService(repository, {
      async sendEmailChangeVerification() {
        olderSendStarted();
        await olderRelease;
        return { ok: false, disabled: false };
      },
    });
    const olderRequest = delayedFailureService.requestEmailChange({
      userId: learnerA,
      newEmail: 'older-real@example.test',
      currentPassword: PASSWORD,
    });
    await olderStarted;
    await service.requestEmailChange({
      userId: learnerA,
      newEmail: 'newer-real@example.test',
      currentPassword: PASSWORD,
    });
    releaseOlder();
    await expectCode(olderRequest, 'EMAIL_SEND_FAILED');
    const [activeAfterOlderFailure] = await repository.listActiveForUser(learnerA);
    assert.equal(activeAfterOlderFailure.newEmailNormalized, 'newer-real@example.test');

    for (const script of ['scripts/test-auth.js', 'scripts/test-password-reset-auth.js']) {
      const child = spawnSync(process.execPath, [script], {
        cwd: path.resolve(__dirname, '..'),
        env: {
          ...process.env,
          DB_HOST: databaseConfig.host,
          DB_PORT: String(databaseConfig.port),
          DB_USER: databaseConfig.user,
          DB_PASSWORD: databaseConfig.password,
          DB_NAME: databaseName,
        },
        stdio: 'inherit',
      });
      assert.equal(child.status, 0, `${script} must pass against fresh schema 030`);
    }
    console.log(`Email change request disposable MySQL passed: version ${version.version}, migrations 30.`);
  } finally {
    await pool.end();
    await dropDatabase(config, databaseName);
    console.log(`Dropped isolated email change request database ${databaseName}.`);
  }
}

async function run() {
  await testRequestService();
  await testEmailSender();
  testRouteAndScopeContracts();
  const hasDatabaseConfig = [
    'TEST_DB_HOST',
    'TEST_DB_USER',
    'TEST_DB_PASSWORD',
    'TEST_DB_ADMIN_DATABASE',
  ].every(key => String(process.env[key] || '').trim());
  if (hasDatabaseConfig) {
    await testRealMySql(validateTestDatabaseEnvironment(process.env));
  } else {
    console.log('Skipping isolated email change request DB test: TEST_DB_* configuration is not set.');
  }
  console.log('Email change request verification passed.');
}

run().catch(error => {
  console.error('Email change request verification failed:', error.stack || error.code || error.message);
  process.exitCode = 1;
});
