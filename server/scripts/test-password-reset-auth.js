const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const bcrypt = require('bcrypt');
const { createPool } = require('../src/database/pool');
const { createPasswordResetRepository } = require('../src/auth/passwordReset.repository');
const { createPasswordResetTokenService, hashPasswordResetToken } = require('../src/auth/passwordResetToken.service');

const PORT = process.env.PASSWORD_RESET_TEST_PORT || '5109';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PREFIX = 'p3.03.i01';
const OLD_PASSWORD = 'ExistingPass9';
const NEW_PASSWORD = 'ReplacementPass8';
const NEUTRAL_RESPONSE = {
  accepted: true,
  message: 'If an account matches that email, we’ll send a password reset link. Check your inbox and spam folder.',
};

const emails = {
  verified: `${PREFIX}.verified@example.test`,
  unverified: `${PREFIX}.unverified@example.test`,
  admin: `${PREFIX}.admin@example.test`,
  disabled: `${PREFIX}.disabled@example.test`,
  other: `${PREFIX}.other@example.test`,
  missing: `${PREFIX}.missing@example.test`,
};

function delay(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function request(method, pathname, body, cookie = '') {
  const response = await fetch(`${BASE_URL}${pathname}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const json = await response.json().catch(() => ({}));
  return { response, json };
}

function cookieFrom(response) {
  return String(response.headers.get('set-cookie') || '').split(';')[0];
}

function startServer(envOverrides = {}) {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT,
      NODE_ENV: 'test',
      CLIENT_ORIGIN: 'http://localhost:3000',
      CLIENT_BASE_URL: 'http://localhost:3000',
      EMAIL_TRANSPORT: 'disabled',
      ...envOverrides,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stderr.on('data', chunk => process.stderr.write(chunk));
  return child;
}

async function waitForHealth(child) {
  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error('Password reset test server exited before health check.');
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(200);
  }
  throw new Error('Timed out waiting for password reset test server.');
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
}

async function clean(pool) {
  const [users] = await pool.query(`SELECT id FROM users WHERE email LIKE ?`, [`${PREFIX}.%@example.test`]);
  for (const user of users) {
    await pool.query(
      `DELETE FROM sessions WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) AS UNSIGNED) = ?`,
      [user.id]
    );
  }
  await pool.query(`DELETE FROM users WHERE email LIKE ?`, [`${PREFIX}.%@example.test`]);
}

async function createUser(pool, { email, role = 'user', status = 'active', verified = true }) {
  const passwordHash = await bcrypt.hash(OLD_PASSWORD, 10);
  const [result] = await pool.query(
    `INSERT INTO users
       (email, display_name, age, age_group, password_hash, role, account_status,
        email_verified_at, email_verification_sent_at)
     VALUES (?, ?, 15, 'teen', ?, ?, ?, ?, NULL)`,
    [email, `Reset ${role}`, passwordHash, role, status, verified ? new Date() : null]
  );
  return Number(result.insertId);
}

async function issue(service, userId) {
  return service.issuePasswordResetToken({ userId, requestIp: '127.0.0.1', requestUserAgent: 'test' });
}

async function run() {
  const pool = createPool();
  const repository = createPasswordResetRepository(pool);
  const tokenService = createPasswordResetTokenService(repository);
  let child = startServer();

  try {
    await clean(pool);
    const verifiedId = await createUser(pool, { email: emails.verified });
    const unverifiedId = await createUser(pool, { email: emails.unverified, verified: false });
    const adminId = await createUser(pool, { email: emails.admin, role: 'admin' });
    const disabledId = await createUser(pool, { email: emails.disabled, status: 'disabled' });
    const otherId = await createUser(pool, { email: emails.other });
    await waitForHealth(child);

    let result = await request('POST', '/api/auth/forgot-password', { email: 'not-an-email' });
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'PASSWORD_RESET_EMAIL_INVALID');

    const oldReset = await issue(tokenService, verifiedId);
    const verificationHash = hashPasswordResetToken('email-verification-token');
    await pool.query(
      `INSERT INTO account_verification_tokens
         (user_id, token_type, token_hash, target_email, expires_at)
       VALUES (?, 'email_verification', ?, ?, DATE_ADD(NOW(), INTERVAL 1 DAY))`,
      [verifiedId, verificationHash, emails.verified]
    );

    const responses = [];
    for (const email of [emails.verified, emails.unverified, emails.missing, emails.admin, emails.disabled]) {
      const forgot = await request('POST', '/api/auth/forgot-password', { email, locale: 'en' });
      assert.equal(forgot.response.status, 202);
      assert.deepEqual(forgot.json, NEUTRAL_RESPONSE);
      assert.equal(Object.hasOwn(forgot.json, 'token'), false);
      responses.push(JSON.stringify(forgot.json));
    }
    assert.equal(new Set(responses).size, 1);

    const [verifiedResetRows] = await pool.query(
      `SELECT token_hash, used_at, revoked_at FROM account_verification_tokens
       WHERE user_id = ? AND token_type = 'password_reset' ORDER BY id`,
      [verifiedId]
    );
    assert.equal(verifiedResetRows.length, 2);
    assert.ok(verifiedResetRows[0].revoked_at);
    assert.equal(verifiedResetRows[1].token_hash.length, 64);
    assert.notEqual(verifiedResetRows[1].token_hash, oldReset.rawToken);

    const [[verificationToken]] = await pool.query(
      `SELECT used_at, revoked_at FROM account_verification_tokens WHERE token_hash = ?`,
      [verificationHash]
    );
    assert.equal(verificationToken.used_at, null);
    assert.equal(verificationToken.revoked_at, null);

    for (const [userId, expected] of [[unverifiedId, 1], [adminId, 0], [disabledId, 0]]) {
      const [[row]] = await pool.query(
        `SELECT COUNT(*) AS count FROM account_verification_tokens
         WHERE user_id = ? AND token_type = 'password_reset'`,
        [userId]
      );
      assert.equal(Number(row.count), expected);
    }

    result = await request('POST', '/api/auth/reset-password', { password: NEW_PASSWORD });
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'PASSWORD_RESET_TOKEN_REQUIRED');

    result = await request('POST', '/api/auth/reset-password', { token: 'unknown', password: NEW_PASSWORD });
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'PASSWORD_RESET_TOKEN_INVALID_OR_UNAVAILABLE');

    const weak = await issue(tokenService, verifiedId);
    result = await request('POST', '/api/auth/reset-password', { token: weak.rawToken, password: 'short1' });
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'PASSWORD_RESET_PASSWORD_INVALID');

    const expired = await issue(tokenService, verifiedId);
    await pool.query(`UPDATE account_verification_tokens SET expires_at = DATE_SUB(NOW(), INTERVAL 1 SECOND) WHERE token_hash = ?`, [hashPasswordResetToken(expired.rawToken)]);
    result = await request('POST', '/api/auth/reset-password', { token: expired.rawToken, password: NEW_PASSWORD });
    assert.equal(result.response.status, 410);
    assert.equal(result.json.code, 'PASSWORD_RESET_TOKEN_EXPIRED');

    const used = await issue(tokenService, verifiedId);
    await pool.query(`UPDATE account_verification_tokens SET used_at = NOW() WHERE token_hash = ?`, [hashPasswordResetToken(used.rawToken)]);
    result = await request('POST', '/api/auth/reset-password', { token: used.rawToken, password: NEW_PASSWORD });
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'PASSWORD_RESET_TOKEN_INVALID_OR_UNAVAILABLE');

    const revoked = await issue(tokenService, verifiedId);
    await pool.query(`UPDATE account_verification_tokens SET revoked_at = NOW() WHERE token_hash = ?`, [hashPasswordResetToken(revoked.rawToken)]);
    result = await request('POST', '/api/auth/reset-password', { token: revoked.rawToken, password: NEW_PASSWORD });
    assert.equal(result.response.status, 400);

    result = await request('POST', '/api/auth/reset-password', { token: 'email-verification-token', password: NEW_PASSWORD });
    assert.equal(result.response.status, 400);

    const login = await request('POST', '/api/auth/login', { email: emails.verified, password: OLD_PASSWORD });
    assert.equal(login.response.status, 200);
    const oldCookie = cookieFrom(login.response);
    const [[beforeReset]] = await pool.query(
      `SELECT password_hash, session_version, email_verified_at, role FROM users WHERE id = ?`,
      [verifiedId]
    );

    const valid = await issue(tokenService, verifiedId);
    result = await request('POST', '/api/auth/reset-password', {
      token: valid.rawToken,
      password: NEW_PASSWORD,
    }, oldCookie);
    assert.equal(result.response.status, 200);
    assert.deepEqual(result.json, { reset: true, authenticated: false });
    assert.match(result.response.headers.get('set-cookie') || '', /cyberly\.sid=;/);

    const [[afterReset]] = await pool.query(
      `SELECT password_hash, session_version, email_verified_at, role FROM users WHERE id = ?`,
      [verifiedId]
    );
    assert.equal(await bcrypt.compare(NEW_PASSWORD, afterReset.password_hash), true);
    assert.equal(await bcrypt.compare(OLD_PASSWORD, afterReset.password_hash), false);
    assert.equal(Number(afterReset.session_version), Number(beforeReset.session_version) + 1);
    assert.equal(String(afterReset.email_verified_at), String(beforeReset.email_verified_at));
    assert.equal(afterReset.role, beforeReset.role);

    const staleSession = await request('GET', '/api/auth/me', undefined, oldCookie);
    assert.equal(staleSession.response.status, 401);
    const oldLogin = await request('POST', '/api/auth/login', { email: emails.verified, password: OLD_PASSWORD });
    assert.equal(oldLogin.response.status, 401);
    const newLogin = await request('POST', '/api/auth/login', { email: emails.verified, password: NEW_PASSWORD });
    assert.equal(newLogin.response.status, 200);

    const replay = await request('POST', '/api/auth/reset-password', { token: valid.rawToken, password: OLD_PASSWORD });
    assert.equal(replay.response.status, 400);

    const rollbackToken = await issue(tokenService, verifiedId);
    const [[beforeRollback]] = await pool.query(
      `SELECT password_hash, session_version FROM users WHERE id = ?`,
      [verifiedId]
    );
    await assert.rejects(repository.transaction(async repo => {
      const locked = await repo.findTokenByHashForUpdate(
        hashPasswordResetToken(rollbackToken.rawToken),
        'password_reset'
      );
      await repo.updatePasswordHash(verifiedId, 'forced-rollback-password-hash');
      await repo.markTokenUsedIfActive(locked.id, new Date());
      await repo.incrementSessionVersion(verifiedId);
      throw new Error('forced password reset rollback');
    }), /forced password reset rollback/);
    const [[afterRollback]] = await pool.query(
      `SELECT password_hash, session_version FROM users WHERE id = ?`,
      [verifiedId]
    );
    const [[rolledBackToken]] = await pool.query(
      `SELECT used_at FROM account_verification_tokens WHERE token_hash = ?`,
      [hashPasswordResetToken(rollbackToken.rawToken)]
    );
    assert.equal(afterRollback.password_hash, beforeRollback.password_hash);
    assert.equal(Number(afterRollback.session_version), Number(beforeRollback.session_version));
    assert.equal(rolledBackToken.used_at, null);

    const roleChanged = await issue(tokenService, unverifiedId);
    await pool.query(`UPDATE users SET role = 'admin' WHERE id = ?`, [unverifiedId]);
    result = await request('POST', '/api/auth/reset-password', { token: roleChanged.rawToken, password: NEW_PASSWORD });
    assert.equal(result.response.status, 400);
    const [[roleChangedToken]] = await pool.query(`SELECT used_at FROM account_verification_tokens WHERE token_hash = ?`, [hashPasswordResetToken(roleChanged.rawToken)]);
    assert.equal(roleChangedToken.used_at, null);

    await stopServer(child);
    child = startServer({ EMAIL_TRANSPORT: 'test-success' });
    await waitForHealth(child);
    const successDelivery = await request('POST', '/api/auth/forgot-password', {
      email: emails.verified,
      locale: 'zh-CN',
    });
    assert.equal(successDelivery.response.status, 202);
    assert.deepEqual(successDelivery.json, NEUTRAL_RESPONSE);
    const [[successfulToken]] = await pool.query(
      `SELECT id, revoked_at FROM account_verification_tokens
       WHERE user_id = ? AND token_type = 'password_reset' ORDER BY id DESC LIMIT 1`,
      [verifiedId]
    );
    assert.equal(successfulToken.revoked_at, null);

    const otherReset = await issue(tokenService, otherId);
    await stopServer(child);
    child = startServer({ EMAIL_TRANSPORT: 'test-fail' });
    await waitForHealth(child);
    const failedDelivery = await request('POST', '/api/auth/forgot-password', {
      email: emails.verified,
      locale: 'ms',
    });
    assert.equal(failedDelivery.response.status, 202);
    assert.deepEqual(failedDelivery.json, NEUTRAL_RESPONSE);
    assert.equal(Object.hasOwn(failedDelivery.json, 'token'), false);

    const [[failedToken]] = await pool.query(
      `SELECT id, used_at, revoked_at FROM account_verification_tokens
       WHERE user_id = ? AND token_type = 'password_reset' ORDER BY id DESC LIMIT 1`,
      [verifiedId]
    );
    assert.notEqual(Number(failedToken.id), Number(successfulToken.id));
    assert.equal(failedToken.used_at, null);
    assert.ok(failedToken.revoked_at);

    const [[otherToken]] = await pool.query(
      `SELECT revoked_at FROM account_verification_tokens WHERE token_hash = ?`,
      [hashPasswordResetToken(otherReset.rawToken)]
    );
    assert.equal(otherToken.revoked_at, null);
    const [[verificationAfterFailure]] = await pool.query(
      `SELECT used_at, revoked_at FROM account_verification_tokens WHERE token_hash = ?`,
      [verificationHash]
    );
    assert.equal(verificationAfterFailure.used_at, null);
    assert.equal(verificationAfterFailure.revoked_at, null);

    console.log('Password reset auth integration tests passed: 54 contract checks.');
  } finally {
    await stopServer(child);
    await clean(pool);
    await pool.end();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
