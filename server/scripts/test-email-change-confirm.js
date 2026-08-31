const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const net = require('node:net');
const path = require('node:path');
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');
const {
  buildAdminDatabaseConfig,
  buildTestDatabaseConfig,
  createIsolatedDatabaseName,
  validateTestDatabaseEnvironment,
} = require('../src/database/migration-test-safety');
const {
  listMigrationFilesThrough,
  runMigrations,
} = require('../src/database/migration-runner');
const { createEmailChangeRepository } = require('../src/auth/emailChange.repository');
const { createEmailChangeToken } = require('../src/auth/emailChangeToken.service');
const { createEmailChangeConfirmService } = require('../src/auth/emailChangeConfirm.service');
const { createEmailChangeNoticeSender } = require('../src/auth/emailChangeNoticeEmail.service');
const MySqlSessionStore = require('../src/auth/mysql-session-store');

const NOW = new Date('2026-08-26T08:00:00.000Z');

function request(overrides = {}) {
  return {
    id: 51,
    userId: 7,
    newEmailNormalized: 'next@example.test',
    tokenHash: 'a'.repeat(64),
    locale: 'en',
    expiresAt: new Date(NOW.getTime() + 60_000),
    usedAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function learner(overrides = {}) {
  return {
    id: 7,
    email: 'old@example.test',
    role: 'user',
    accountStatus: 'active',
    emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
    sessionVersion: 3,
    ...overrides,
  };
}

function harness(options = {}) {
  const calls = [];
  const row = options.request === undefined ? request() : options.request;
  const account = options.learner === undefined ? learner() : options.learner;
  const repo = {
    async transaction(work) { calls.push('begin'); const value = await work(repo); calls.push('commit'); return value; },
    async findByTokenHashForUpdate() { calls.push('token-lock'); return row; },
    async lockLearnerForUpdate() { calls.push('learner-lock'); return account; },
    async findCanonicalEmailOwner() { calls.push('owner'); return options.owner || null; },
    async updateLearnerCanonicalEmail(args) {
      calls.push('canonical-update');
      if (options.updateError) throw options.updateError;
      return { sessionVersion: args.previousSessionVersion + 1 };
    },
    async markUsedIfActive() { calls.push('mark-used'); return options.markUsed === false ? null : row; },
    async revokeOtherActiveForUser() { calls.push('revoke-other'); return 1; },
  };
  const notices = [];
  const noticeSender = {
    async sendEmailChangeNotice(message) {
      calls.push('notice'); notices.push(message);
      if (options.noticeError) throw options.noticeError;
      return options.noticeResult || { ok: true, disabled: false };
    },
  };
  const logger = { error(message) { calls.push(`log:${message}`); } };
  const service = createEmailChangeConfirmService({ repository: repo, noticeSender, now: () => NOW, logger });
  return { calls, notices, service };
}

async function expectCode(promise, code, status) {
  await assert.rejects(promise, error => {
    assert.equal(error.code, code);
    if (status) assert.equal(error.status, status);
    return true;
  });
}

async function testCollapsedTokenStates() {
  for (const candidate of [
    { rawToken: '' },
    { request: null },
    { request: request({ usedAt: NOW }) },
    { request: request({ revokedAt: NOW }) },
    { request: request({ expiresAt: NOW }) },
    { learner: null },
    { learner: learner({ role: 'admin' }) },
    { learner: learner({ accountStatus: 'disabled' }) },
    { learner: learner({ emailVerifiedAt: null }) },
  ]) {
    const testHarness = harness(candidate);
    await expectCode(testHarness.service.confirmEmailChange({
      rawToken: Object.hasOwn(candidate, 'rawToken') ? candidate.rawToken : 'raw-token',
    }), 'EMAIL_CHANGE_TOKEN_INVALID_OR_UNAVAILABLE', 400);
  }
}

async function testConfirmationAndSessions() {
  let testHarness = harness();
  const continued = await testHarness.service.confirmEmailChange({
    rawToken: 'raw-token',
    sessionUserId: 7,
    sessionVersion: 3,
    continueSession: async authenticated => {
      testHarness.calls.push(`continue:${authenticated.sessionVersion}`);
    },
  });
  assert.deepEqual(continued, { status: 'confirmed', sessionStatus: 'continued' });
  assert.deepEqual(testHarness.calls.slice(0, 9), [
    'begin', 'token-lock', 'learner-lock', 'owner', 'canonical-update',
    'mark-used', 'revoke-other', 'commit', 'continue:4',
  ]);
  assert.equal(testHarness.notices[0].recipientEmail, 'old@example.test');
  assert.deepEqual(Object.keys(testHarness.notices[0]).sort(), ['locale', 'recipientEmail']);

  testHarness = harness();
  assert.deepEqual(
    await testHarness.service.confirmEmailChange({ rawToken: 'raw-token' }),
    { status: 'confirmed', sessionStatus: 'signed_out' }
  );

  testHarness = harness();
  let unrelatedTouched = false;
  assert.deepEqual(await testHarness.service.confirmEmailChange({
    rawToken: 'raw-token',
    sessionUserId: 99,
    continueSession: async () => { unrelatedTouched = true; },
    destroySession: async () => { unrelatedTouched = true; },
  }), { status: 'confirmed', sessionStatus: 'unrelated' });
  assert.equal(unrelatedTouched, false);

  for (const sessionVersion of [
    undefined,
    null,
    '',
    '0',
    '3',
    false,
    true,
    NaN,
    Infinity,
    -1,
    2,
    4,
    {},
    [],
  ]) {
    testHarness = harness();
    let continuedCalls = 0;
    let destroyed = 0;
    const staleResult = await testHarness.service.confirmEmailChange({
      rawToken: 'raw-token',
      sessionUserId: 7,
      sessionVersion,
      continueSession: async () => { continuedCalls += 1; },
      destroySession: async () => { destroyed += 1; },
    });
    assert.deepEqual(staleResult, { status: 'confirmed', sessionStatus: 'signed_out' });
    assert.equal(continuedCalls, 0);
    assert.equal(destroyed, 1);
  }

  for (const failure of ['regenerate', 'save']) {
    testHarness = harness();
    let continuationCalls = 0;
    let destroyed = 0;
    const result = await testHarness.service.confirmEmailChange({
      rawToken: 'raw-token',
      sessionUserId: 7,
      sessionVersion: 3,
      continueSession: async () => {
        continuationCalls += 1;
        throw new Error(`${failure} private detail`);
      },
      destroySession: async () => { destroyed += 1; },
    });
    assert.deepEqual(result, { status: 'confirmed', sessionStatus: 'signed_out' });
    assert.equal(continuationCalls, 1);
    assert.equal(destroyed, 1);
    assert.equal(testHarness.calls.includes('commit'), true);
    assert.ok(testHarness.calls.indexOf('commit') < testHarness.calls.indexOf('notice'));
  }
}

async function testCandidateAndPostCommitNotice() {
  await expectCode(harness({ owner: { id: 9 } }).service.confirmEmailChange({ rawToken: 'raw' }),
    'EMAIL_CHANGE_EMAIL_UNAVAILABLE', 409);
  const duplicate = new Error("Duplicate entry for key 'uq_users_email'");
  duplicate.code = 'ER_DUP_ENTRY';
  duplicate.sqlMessage = "Duplicate entry for key 'uq_users_email'";
  await expectCode(harness({ updateError: duplicate }).service.confirmEmailChange({ rawToken: 'raw' }),
    'EMAIL_CHANGE_EMAIL_UNAVAILABLE', 409);

  for (const options of [
    { noticeError: new Error('private transport detail') },
    { noticeResult: { ok: false, disabled: false } },
    { noticeResult: { ok: true, disabled: true } },
  ]) {
    const testHarness = harness(options);
    assert.deepEqual(await testHarness.service.confirmEmailChange({ rawToken: 'raw' }),
      { status: 'confirmed', sessionStatus: 'signed_out' });
    assert.equal(testHarness.calls.includes('commit'), true);
    assert.equal(testHarness.calls.some(value => value === 'log:EMAIL_CHANGE_OLD_NOTICE_FAILED'), true);
  }
}

async function testNoticeLocales() {
  const messages = [];
  const sender = createEmailChangeNoticeSender({
    transport: 'test',
    fromAddress: 'no-reply@example.test',
    send: async message => { messages.push(message); return { ok: true }; },
  });
  for (const locale of ['en', 'ms', 'zh-CN']) {
    assert.equal((await sender.sendEmailChangeNotice({ recipientEmail: 'old@example.test', locale })).ok, true);
  }
  assert.equal(messages.length, 3);
  for (const message of messages) {
    assert.equal(message.to, 'old@example.test');
    assert.equal(JSON.stringify(message).includes('next@example.test'), false);
    assert.equal(JSON.stringify(message).includes('token'), false);
  }
}

function testRouteAndRateLimitContracts() {
  const server = fs.readFileSync(path.resolve(__dirname, '../server.js'), 'utf8');
  assert.match(server, /['"]\/api\/auth\/email-change\/confirm['"][\s\S]*?emailChangeConfirmIpRateLimit,[\s\S]*?emailChangeConfirmTokenRateLimit,[\s\S]*?async \(req, res, next\)/);
  assert.doesNotMatch(server, /email-change\/confirm['"],[\s\S]{0,100}requireAuth/);
  const policies = fs.readFileSync(path.resolve(__dirname, '../src/security/rateLimitPolicies.js'), 'utf8');
  assert.match(policies, /emailChangeConfirmIp:[\s\S]*?15 \* 60 \* 1000[\s\S]*?max: 20/);
  assert.match(policies, /emailChangeConfirmToken:[\s\S]*?15 \* 60 \* 1000[\s\S]*?max: 5[\s\S]*?createHashedBodyKey\('token'/);
}

function quoteIdentifier(identifier) {
  if (!/^cyberly_test_[A-Za-z0-9_]+$/.test(identifier)) throw new Error('Unsafe test database identifier.');
  return `\`${identifier}\``;
}

function storeSet(store, sid, data) {
  return new Promise((resolve, reject) => store.set(sid, data, error => error ? reject(error) : resolve()));
}

function storeGet(store, sid) {
  return new Promise((resolve, reject) => store.get(sid, (error, data) => error ? reject(error) : resolve(data)));
}

function storeDestroy(store, sid) {
  return new Promise((resolve, reject) => store.destroy(sid, error => error ? reject(error) : resolve()));
}

class CookieJar {
  constructor(cookies = new Map()) {
    this.cookies = new Map(cookies);
  }

  clone() {
    return new CookieJar(this.cookies);
  }

  header() {
    return [...this.cookies.entries()].map(([name, value]) => `${name}=${value}`).join('; ');
  }

  value(name = 'cyberly.sid') {
    return this.cookies.get(name) || '';
  }

  adopt(headers) {
    const values = typeof headers.getSetCookie === 'function'
      ? headers.getSetCookie()
      : (headers.get('set-cookie') ? [headers.get('set-cookie')] : []);
    for (const value of values) {
      const [pair] = String(value).split(';');
      const separator = pair.indexOf('=');
      if (separator <= 0) continue;
      const name = pair.slice(0, separator).trim();
      const cookieValue = pair.slice(separator + 1).trim();
      if (cookieValue) this.cookies.set(name, cookieValue);
      else this.cookies.delete(name);
    }
    return values.length > 0;
  }
}

async function http(baseUrl, method, pathname, jar, body) {
  const headers = { Origin: baseUrl };
  const cookie = jar.header();
  if (cookie) headers.Cookie = cookie;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const response = await fetch(`${baseUrl}${pathname}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const hadSetCookie = jar.adopt(response.headers);
  const text = await response.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch {}
  return { status: response.status, json, hadSetCookie };
}

function sessionIdFromCookie(cookie) {
  const decoded = decodeURIComponent(String(cookie || ''));
  const signed = decoded.startsWith('s:') ? decoded.slice(2) : decoded;
  return signed.split('.')[0] || '';
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      server.close(error => error ? reject(error) : resolve(address.port));
    });
  });
}

function startRouteServer(databaseConfig, port) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.resolve(__dirname, '..'),
    env: {
      ...process.env,
      NODE_ENV: 'development',
      PORT: String(port),
      DB_HOST: databaseConfig.host,
      DB_PORT: String(databaseConfig.port),
      DB_USER: databaseConfig.user,
      DB_PASSWORD: databaseConfig.password,
      DB_NAME: databaseConfig.database,
      DB_SSL_MODE: 'disabled',
      CLIENT_ORIGIN: `http://127.0.0.1:${port}`,
      CLIENT_BASE_URL: `http://127.0.0.1:${port}`,
      SESSION_SECRET: 'email-change-route-test-session-secret',
      EMAIL_TRANSPORT: 'disabled',
      AI_PROVIDER: 'openai',
      AI_DEFAULT_PROVIDER: 'openai',
      AI_PROVIDER_CYBERGUARD: 'openai',
      OPENAI_API_KEY: '',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Local route server startup timed out.')), 10_000);
    const inspect = chunk => {
      output += String(chunk);
      if (output.includes(`Server running on port ${port}`)) {
        clearTimeout(timeout);
        resolve();
      }
    };
    child.stdout.on('data', inspect);
    child.stderr.on('data', inspect);
    child.once('exit', code => {
      clearTimeout(timeout);
      reject(new Error(`Local route server exited before readiness (${code}).`));
    });
  });
  return { child, ready };
}

async function stopRouteServer(child) {
  if (!child || child.exitCode !== null) return;
  const exited = new Promise(resolve => child.once('exit', resolve));
  child.kill();
  await exited;
}

async function testRealHttpSessionContinuation({ pool, databaseConfig, repository, passwordHash }) {
  const routeNow = new Date();
  const oldEmail = 'route-old@example.test';
  const newEmail = 'route-new@example.test';
  const password = 'CurrentPass9';
  const [userResult] = await pool.query(
    `INSERT INTO users (email, display_name, age, age_group, password_hash, role, account_status, email_verified_at, session_version)
     VALUES (?, 'Route Learner', 16, 'teen', ?, 'user', 'active', ?, 0)`,
    [oldEmail, passwordHash, routeNow]
  );
  const userId = Number(userResult.insertId);
  const issued = createEmailChangeToken({ now: routeNow });
  await repository.createRequest({
    userId,
    newEmailNormalized: newEmail,
    tokenHash: issued.tokenHash,
    locale: 'en',
    expiresAt: issued.expiresAt,
    createdAt: routeNow,
  });

  const port = await getAvailablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const { child, ready } = startRouteServer(databaseConfig, port);
  try {
    await ready;
    const sessionA = new CookieJar();
    const loginA = await http(baseUrl, 'POST', '/api/auth/login', sessionA, { email: oldEmail, password });
    assert.equal(loginA.status, 200);
    assert.equal(loginA.hadSetCookie, true);
    assert.equal((await http(baseUrl, 'GET', '/api/auth/me', sessionA)).status, 200);
    const preConfirmCookie = sessionA.value();
    const oldSessionA = sessionA.clone();

    const sessionB = new CookieJar();
    assert.equal((await http(baseUrl, 'POST', '/api/auth/login', sessionB, { email: oldEmail, password })).status, 200);
    assert.equal((await http(baseUrl, 'GET', '/api/auth/me', sessionB)).status, 200);

    const confirmation = await http(baseUrl, 'POST', '/api/auth/email-change/confirm', sessionA, {
      token: issued.rawToken,
    });
    assert.equal(confirmation.status, 200);
    assert.deepEqual(confirmation.json, { status: 'confirmed', sessionStatus: 'continued' });
    assert.equal(confirmation.hadSetCookie, true);
    const replacementCookie = sessionA.value();
    assert.notEqual(replacementCookie, preConfirmCookie);
    assert.equal(sessionA.cookies.size, 1);

    const replacementSid = sessionIdFromCookie(replacementCookie);
    const [[replacementRow]] = await pool.query('SELECT data FROM sessions WHERE sid = ? LIMIT 1', [replacementSid]);
    assert.ok(replacementRow, 'replacement session must be persisted');
    const replacementData = typeof replacementRow.data === 'string'
      ? JSON.parse(replacementRow.data)
      : replacementRow.data;
    assert.equal(replacementData.userId, userId, 'replacement session must retain the authenticated userId');
    assert.equal(Number(replacementData.sessionVersion), 1);

    const continued = await http(baseUrl, 'GET', '/api/auth/me', sessionA);
    assert.equal(continued.status, 200);
    assert.equal(Number(continued.json?.user?.id), userId);
    assert.equal(continued.json?.user?.email, newEmail);
    assert.equal(continued.json?.user?.emailVerified, true);

    assert.equal((await http(baseUrl, 'GET', '/api/auth/me', oldSessionA)).status, 401);
    assert.equal((await http(baseUrl, 'GET', '/api/auth/me', sessionB)).status, 401);
    assert.equal((await http(baseUrl, 'POST', '/api/auth/login', new CookieJar(), { email: oldEmail, password })).status, 401);
    assert.equal((await http(baseUrl, 'POST', '/api/auth/login', new CookieJar(), { email: newEmail, password })).status, 200);

    const replay = await http(baseUrl, 'POST', '/api/auth/email-change/confirm', sessionA, {
      token: issued.rawToken,
    });
    assert.equal(replay.status, 400);
    assert.equal(replay.json?.code, 'EMAIL_CHANGE_TOKEN_INVALID_OR_UNAVAILABLE');
  } finally {
    issued.rawToken = null;
    await stopRouteServer(child);
  }
}

async function testRealMySql(config) {
  const databaseName = createIsolatedDatabaseName('email_change_i03');
  const admin = await mysql.createConnection(buildAdminDatabaseConfig(config));
  await admin.query(`CREATE DATABASE ${quoteIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await admin.end();
  const databaseConfig = buildTestDatabaseConfig(config, databaseName);
  const pool = mysql.createPool({ ...databaseConfig, connectionLimit: 8 });
  try {
    const migrationConnection = await pool.getConnection();
    try { await runMigrations({ connection: migrationConnection }); } finally { migrationConnection.release(); }
    const [[version]] = await pool.query('SELECT VERSION() AS version');
    const [[migrationCount]] = await pool.query('SELECT COUNT(*) AS count FROM schema_migrations');
    assert.match(String(version.version), /^8\./);
    const expectedMigrations = listMigrationFilesThrough();
    assert.ok(expectedMigrations.includes('031_create_privacy_requests.sql'));
    assert.equal(Number(migrationCount.count), expectedMigrations.length);
    const passwordHash = await bcrypt.hash('CurrentPass9', 4);
    const repository = createEmailChangeRepository(pool);
    await testRealHttpSessionContinuation({ pool, databaseConfig, repository, passwordHash });
    const [userResult] = await pool.query(
      `INSERT INTO users (email, display_name, age, age_group, password_hash, role, account_status, email_verified_at)
       VALUES ('old-real@example.test', 'I03 Learner', 16, 'teen', ?, 'user', 'active', ?)`,
      [passwordHash, NOW]
    );
    const userId = Number(userResult.insertId);
    const sessionStore = new MySqlSessionStore(pool, 3600);
    const sessionData = { cookie: {}, userId, role: 'user', sessionVersion: 0 };
    await storeSet(sessionStore, 'i03-old-session-a', sessionData);
    await storeSet(sessionStore, 'i03-old-session-b', sessionData);
    const issued = createEmailChangeToken({ now: NOW });
    const created = await repository.createRequest({
      userId, newEmailNormalized: 'new-real@example.test', tokenHash: issued.tokenHash,
      locale: 'ms', expiresAt: issued.expiresAt, createdAt: NOW,
    });
    const notices = [];
    const service = createEmailChangeConfirmService({
      repository,
      noticeSender: { async sendEmailChangeNotice(message) { notices.push(message); return { ok: true }; } },
      now: () => new Date(NOW.getTime() + 1_000),
      logger: { error() {} },
    });
    assert.deepEqual(await service.confirmEmailChange({
      rawToken: issued.rawToken,
      sessionUserId: userId,
      sessionVersion: 0,
      continueSession: async authenticated => {
        await storeDestroy(sessionStore, 'i03-old-session-a');
        await storeSet(sessionStore, 'i03-new-session', {
          cookie: {},
          userId: authenticated.userId,
          role: authenticated.role,
          sessionVersion: authenticated.sessionVersion,
        });
      },
    }), { status: 'confirmed', sessionStatus: 'continued' });
    const [[updated]] = await pool.query('SELECT email, email_verified_at, session_version FROM users WHERE id = ?', [userId]);
    assert.equal(updated.email, 'new-real@example.test');
    assert.equal(Number(updated.session_version), 1);
    const confirmed = await repository.findById(created.id);
    assert.ok(confirmed.usedAt);
    assert.deepEqual(notices, [{ recipientEmail: 'old-real@example.test', locale: 'ms' }]);
    assert.equal(await storeGet(sessionStore, 'i03-old-session-a'), null);
    assert.equal(await storeGet(sessionStore, 'i03-old-session-b'), null);
    assert.equal((await storeGet(sessionStore, 'i03-new-session')).sessionVersion, 1);
    await expectCode(service.confirmEmailChange({ rawToken: issued.rawToken }), 'EMAIL_CHANGE_TOKEN_INVALID_OR_UNAVAILABLE', 400);

    const [raceUserResult] = await pool.query(
      `INSERT INTO users (email, display_name, age, age_group, password_hash, role, account_status, email_verified_at)
       VALUES ('race-owner@example.test', 'Race Owner', 16, 'teen', ?, 'user', 'active', ?)`,
      [passwordHash, NOW]
    );
    const [raceLearnerResult] = await pool.query(
      `INSERT INTO users (email, display_name, age, age_group, password_hash, role, account_status, email_verified_at)
       VALUES ('race-learner@example.test', 'Race Learner', 16, 'teen', ?, 'user', 'active', ?)`,
      [passwordHash, NOW]
    );
    const raceLearnerId = Number(raceLearnerResult.insertId);
    const raceToken = createEmailChangeToken({ now: NOW });
    const raceRequest = await repository.createRequest({
      userId: raceLearnerId,
      newEmailNormalized: 'race-candidate@example.test',
      tokenHash: raceToken.tokenHash,
      locale: 'en',
      expiresAt: raceToken.expiresAt,
      createdAt: NOW,
    });
    let candidateClaimed = false;
    const racingRepository = {
      ...repository,
      transaction: work => repository.transaction(repo => work({
        ...repo,
        async findCanonicalEmailOwner(candidate) {
          const owner = await repo.findCanonicalEmailOwner(candidate);
          if (!owner && !candidateClaimed) {
            candidateClaimed = true;
            await pool.query('UPDATE users SET email = ? WHERE id = ?', [candidate, Number(raceUserResult.insertId)]);
          }
          return owner;
        },
      })),
    };
    const racingService = createEmailChangeConfirmService({
      repository: racingRepository,
      noticeSender: { async sendEmailChangeNotice() { return { ok: true }; } },
      now: () => new Date(NOW.getTime() + 2_000),
      logger: { error() {} },
    });
    await expectCode(racingService.confirmEmailChange({ rawToken: raceToken.rawToken }),
      'EMAIL_CHANGE_EMAIL_UNAVAILABLE', 409);
    const [[raceLearner]] = await pool.query('SELECT email, session_version FROM users WHERE id = ?', [raceLearnerId]);
    assert.equal(raceLearner.email, 'race-learner@example.test');
    assert.equal(Number(raceLearner.session_version), 0);
    const rolledBackRequest = await repository.findById(raceRequest.id);
    assert.equal(rolledBackRequest.usedAt, null);
    assert.equal(rolledBackRequest.revokedAt, null);

    const [staleLearnerResult] = await pool.query(
      `INSERT INTO users (email, display_name, age, age_group, password_hash, role, account_status, email_verified_at)
       VALUES ('stale-session@example.test', 'Stale Session', 16, 'teen', ?, 'user', 'active', ?)`,
      [passwordHash, NOW]
    );
    const staleLearnerId = Number(staleLearnerResult.insertId);
    const staleToken = createEmailChangeToken({ now: NOW });
    const staleRequest = await repository.createRequest({
      userId: staleLearnerId,
      newEmailNormalized: 'stale-confirmed@example.test',
      tokenHash: staleToken.tokenHash,
      locale: 'en',
      expiresAt: staleToken.expiresAt,
      createdAt: NOW,
    });
    const incomingSessionVersion = 0;
    await pool.query('UPDATE users SET session_version = session_version + 1 WHERE id = ?', [staleLearnerId]);
    let staleContinued = 0;
    let staleDestroyed = 0;
    const staleResult = await service.confirmEmailChange({
      rawToken: staleToken.rawToken,
      sessionUserId: staleLearnerId,
      sessionVersion: incomingSessionVersion,
      continueSession: async () => { staleContinued += 1; },
      destroySession: async () => { staleDestroyed += 1; },
    });
    assert.deepEqual(staleResult, { status: 'confirmed', sessionStatus: 'signed_out' });
    assert.equal(staleContinued, 0);
    assert.equal(staleDestroyed, 1);
    const [[staleLearner]] = await pool.query('SELECT email, session_version FROM users WHERE id = ?', [staleLearnerId]);
    assert.equal(staleLearner.email, 'stale-confirmed@example.test');
    assert.equal(Number(staleLearner.session_version), 2);
    assert.ok((await repository.findById(staleRequest.id)).usedAt);

    const [failureLearnerResult] = await pool.query(
      `INSERT INTO users (email, display_name, age, age_group, password_hash, role, account_status, email_verified_at)
       VALUES ('continuation-failure@example.test', 'Continuation Failure', 16, 'teen', ?, 'user', 'active', ?)`,
      [passwordHash, NOW]
    );
    const failureLearnerId = Number(failureLearnerResult.insertId);
    const failureToken = createEmailChangeToken({ now: NOW });
    const failureRequest = await repository.createRequest({
      userId: failureLearnerId,
      newEmailNormalized: 'continuation-confirmed@example.test',
      tokenHash: failureToken.tokenHash,
      locale: 'zh-CN',
      expiresAt: failureToken.expiresAt,
      createdAt: NOW,
    });
    let failureContinuationCalls = 0;
    let failureDestroyCalls = 0;
    const failureResult = await service.confirmEmailChange({
      rawToken: failureToken.rawToken,
      sessionUserId: failureLearnerId,
      sessionVersion: 0,
      continueSession: async () => {
        failureContinuationCalls += 1;
        throw new Error('private continuation detail');
      },
      destroySession: async () => { failureDestroyCalls += 1; },
    });
    assert.deepEqual(failureResult, { status: 'confirmed', sessionStatus: 'signed_out' });
    assert.equal(failureContinuationCalls, 1);
    assert.equal(failureDestroyCalls, 1);
    const [[failureLearner]] = await pool.query(
      'SELECT email, session_version FROM users WHERE id = ?',
      [failureLearnerId]
    );
    assert.equal(failureLearner.email, 'continuation-confirmed@example.test');
    assert.equal(Number(failureLearner.session_version), 1);
    assert.ok((await repository.findById(failureRequest.id)).usedAt);
    console.log(
      `Email change confirm disposable MySQL passed: version ${version.version}, migrations ${expectedMigrations.length}.`
    );
  } finally {
    await pool.end();
    const cleanup = await mysql.createConnection(buildAdminDatabaseConfig(config));
    try { await cleanup.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`); } finally { await cleanup.end(); }
    console.log(`Dropped isolated email change confirm database ${databaseName}.`);
  }
}

async function run() {
  await testCollapsedTokenStates();
  await testConfirmationAndSessions();
  await testCandidateAndPostCommitNotice();
  await testNoticeLocales();
  testRouteAndRateLimitContracts();
  const hasDatabaseConfig = ['TEST_DB_HOST', 'TEST_DB_USER', 'TEST_DB_PASSWORD', 'TEST_DB_ADMIN_DATABASE']
    .every(key => String(process.env[key] || '').trim());
  if (hasDatabaseConfig) await testRealMySql(validateTestDatabaseEnvironment(process.env));
  else console.log('Skipping isolated email change confirm DB test: TEST_DB_* configuration is not set.');
  console.log('Email change confirm verification passed.');
}

run().catch(error => {
  console.error('Email change confirm verification failed:', error.stack || error.code || error.message);
  process.exitCode = 1;
});
