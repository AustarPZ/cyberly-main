const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { createPool } = require('../src/database/pool');
const { createEmailVerificationRepository } = require('../src/auth/emailVerification.repository');
const {
  EMAIL_VERIFICATION_TOKEN_TYPE,
  createEmailVerificationTokenService,
  hashVerificationToken,
} = require('../src/auth/emailVerification.service');

const PORT = process.env.EMAIL_VERIFICATION_AUTH_TEST_PORT || '5117';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'AuthEv6cPass9';
const USER_A_EMAIL = 'auth.ev.6c.a@example.com';
const USER_B_EMAIL = 'auth.ev.6c.b@example.com';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') return response.headers.getSetCookie();
  const value = response.headers.get('set-cookie');
  return value ? [value] : [];
}

function mergeCookies(currentCookieHeader, response) {
  const cookieMap = new Map();
  if (currentCookieHeader) {
    for (const item of currentCookieHeader.split(';')) {
      const [name, ...valueParts] = item.trim().split('=');
      if (name) cookieMap.set(name, valueParts.join('='));
    }
  }
  for (const header of getSetCookieHeaders(response)) {
    const [name, ...valueParts] = header.split(';')[0].split('=');
    if (!name) continue;
    const value = valueParts.join('=');
    if (value) cookieMap.set(name, value);
    else cookieMap.delete(name);
  }
  return Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`).join('; ');
}

async function request(method, pathName, body, cookieHeader = '') {
  const response = await fetch(`${BASE_URL}${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  return { response, json, cookieHeader: mergeCookies(cookieHeader, response) };
}

function startServer(extraEnv = {}) {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT,
      CLIENT_ORIGIN: 'http://localhost:3000',
      CLIENT_BASE_URL: 'http://localhost:3000',
      EMAIL_TRANSPORT: 'disabled',
      NODE_ENV: 'test',
      OPENAI_API_KEY: 'test-key',
      AI_TEST_MOCK_OPENAI: 'success',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  return child;
}

async function waitForHealth(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    if (child.exitCode !== null) throw new Error('Server exited before health check completed.');
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Timed out waiting for server health check.');
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
}

async function cleanup(pool) {
  const [users] = await pool.query('SELECT id FROM users WHERE email IN (?, ?)', [USER_A_EMAIL, USER_B_EMAIL]);
  for (const user of users) {
    await pool.query(
      `DELETE FROM sessions
       WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) AS UNSIGNED) = ?`,
      [user.id]
    );
  }
  if (users.length) {
    await pool.query('DELETE FROM chat_conversations WHERE user_id IN (?)', [users.map(user => user.id)]);
  }
  await pool.query('DELETE FROM users WHERE email IN (?, ?)', [USER_A_EMAIL, USER_B_EMAIL]);
  await pool.query('DELETE FROM sessions WHERE expires < NOW()');
}

async function register(email, displayName) {
  const result = await request('POST', '/api/auth/register', {
    email,
    displayName,
    password: PASSWORD,
    age: 16,
    locale: 'en',
  });
  assert.equal(result.response.status, 201);
  assert.equal(result.json.user.emailVerified, false);
  assert.equal(result.json.user.emailVerifiedAt, null);
  assert.equal(result.json.verification.required, true);
  assert.equal(result.json.verification.emailSent, false);
  assert.equal(result.json.verification.emailTransportDisabled, true);
  assert.equal(result.json.verification.emailSendFailed, false);
  assert.equal(JSON.stringify(result.json).includes('rawToken'), false);
  assert.equal(JSON.stringify(result.json).includes('tokenHash'), false);
  return result;
}

async function createManualToken(repo, userId, rawToken, patch = {}) {
  return repo.createToken({
    userId,
    tokenType: EMAIL_VERIFICATION_TOKEN_TYPE,
    tokenHash: hashVerificationToken(rawToken),
    targetEmail: patch.targetEmail || USER_A_EMAIL,
    expiresAt: patch.expiresAt || new Date(Date.now() + 60 * 60 * 1000),
    requestIp: '127.0.0.1',
    requestUserAgent: 'auth-ev-6c-test',
  });
}

async function getEmailVerificationState(pool, userId) {
  const [[user]] = await pool.query(
    'SELECT email_verification_sent_at AS sentAt FROM users WHERE id = ?',
    [userId]
  );
  const [[tokens]] = await pool.query(
    `SELECT
       SUM(CASE WHEN revoked_at IS NULL AND used_at IS NULL AND expires_at > NOW() THEN 1 ELSE 0 END) AS activeCount,
       COUNT(*) AS totalCount
     FROM account_verification_tokens
     WHERE user_id = ? AND token_type = ?`,
    [userId, EMAIL_VERIFICATION_TOKEN_TYPE]
  );
  return {
    sentAt: user?.sentAt || null,
    activeCount: Number(tokens.activeCount || 0),
    totalCount: Number(tokens.totalCount || 0),
  };
}

async function run() {
  const pool = createPool();
  const repo = createEmailVerificationRepository(pool);
  const tokenService = createEmailVerificationTokenService(repo);
  let child = startServer();

  try {
    await cleanup(pool);
    await waitForHealth(child);

    const userA = await register(USER_A_EMAIL, 'Auth EV 6C A');
    const cookieA = userA.cookieHeader;

    let result = await request('GET', '/api/auth/me', undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.user.emailVerified, false);

    const [[tokenCount]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM account_verification_tokens
       WHERE user_id = ? AND token_type = ?`,
      [userA.json.user.id, EMAIL_VERIFICATION_TOKEN_TYPE]
    );
    assert.equal(Number(tokenCount.count) >= 1, true);

    result = await request('POST', '/api/auth/verify-email', {});
    assert.equal(result.response.status, 400);
    assert.equal(result.json.error.code, 'EMAIL_VERIFICATION_TOKEN_REQUIRED');

    result = await request('POST', '/api/auth/verify-email', { token: 'not-a-real-token' });
    assert.equal(result.response.status, 400);
    assert.equal(result.json.error.code, 'EMAIL_VERIFICATION_TOKEN_INVALID');

    const expiredRaw = 'expired-token-for-auth-ev-6c';
    await createManualToken(repo, userA.json.user.id, expiredRaw, {
      expiresAt: new Date(Date.now() - 60 * 1000),
    });
    result = await request('POST', '/api/auth/verify-email', { token: expiredRaw });
    assert.equal(result.response.status, 410);
    assert.equal(result.json.error.code, 'EMAIL_VERIFICATION_TOKEN_EXPIRED');
    assert.equal(result.json.canResend, true);

    const revokedRaw = 'revoked-token-for-auth-ev-6c';
    const revoked = await createManualToken(repo, userA.json.user.id, revokedRaw);
    await repo.revokeActiveTokens(userA.json.user.id, EMAIL_VERIFICATION_TOKEN_TYPE, new Date());
    result = await request('POST', '/api/auth/verify-email', { token: revokedRaw });
    assert.equal(result.response.status, 410);
    assert.equal(result.json.error.code, 'EMAIL_VERIFICATION_TOKEN_REVOKED');
    assert.equal(revoked.userId, userA.json.user.id);

    await pool.query(
      'UPDATE users SET email_verification_sent_at = NULL WHERE id = ?',
      [userA.json.user.id]
    );
    const issued = await tokenService.issueEmailVerificationToken({
      userId: userA.json.user.id,
      targetEmail: USER_A_EMAIL,
      requestIp: '127.0.0.1',
      requestUserAgent: 'auth-ev-6c-test',
    });

    const userB = await register(USER_B_EMAIL, 'Auth EV 6C B');
    const cookieB = userB.cookieHeader;
    result = await request('POST', '/api/auth/verify-email', { token: issued.rawToken }, cookieB);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.verified, true);
    assert.equal(result.json.user.emailVerified, true);

    result = await request('GET', '/api/auth/me', undefined, cookieB);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.user.email, USER_B_EMAIL);
    assert.equal(result.json.user.emailVerified, false);

    result = await request('POST', '/api/auth/verify-email', { token: issued.rawToken });
    assert.equal(result.response.status, 200);
    assert.equal(result.json.alreadyVerified, true);

    result = await request('POST', '/api/auth/resend-verification-email');
    assert.equal(result.response.status, 401);

    result = await request('POST', '/api/auth/resend-verification-email', {}, cookieB);
    assert.equal(result.response.status, 429);
    assert.equal(result.json.error.code, 'EMAIL_VERIFICATION_RESEND_COOLDOWN');
    assert.equal(Number(result.response.headers.get('retry-after')) > 0, true);

    result = await request('POST', '/api/auth/resend-verification-email', {}, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.sent, false);
    assert.equal(result.json.alreadyVerified, true);

    result = await request('POST', '/api/chat/conversations', {
      message: { content: 'Can you explain suspicious banking messages?' },
      locale: 'en',
    }, cookieB);
    assert.equal(result.response.status, 201);
    const conversationId = result.json.conversation.id;
    const messageId = result.json.messages[0].id;

    result = await request('GET', `/api/chat/conversations/${conversationId}`, undefined, cookieB);
    assert.equal(result.response.status, 200);

    result = await request(
      'POST',
      `/api/chat/conversations/${conversationId}/messages/${messageId}/generate`,
      { locale: 'en' },
      cookieB
    );
    assert.equal(result.response.status, 403);
    assert.equal(result.json.error.code, 'EMAIL_VERIFICATION_REQUIRED');
    const [[generationRows]] = await pool.query(
      'SELECT COUNT(*) AS count FROM chat_message_generations WHERE user_message_id = ?',
      [messageId]
    );
    assert.equal(Number(generationRows.count), 0);

    await pool.query('UPDATE users SET email_verified_at = NOW() WHERE id = ?', [userB.json.user.id]);
    result = await request(
      'POST',
      `/api/chat/conversations/${conversationId}/messages/${messageId}/generate`,
      { locale: 'en' },
      cookieB
    );
    assert.equal(result.response.status, 201);

    await stopServer(child);
    child = null;
    await cleanup(pool);
    child = startServer({ EMAIL_TRANSPORT: 'test-fail' });
    await waitForHealth(child);

    result = await request('POST', '/api/auth/register', {
      email: USER_A_EMAIL,
      displayName: 'Auth EV 6C Send Failure',
      password: PASSWORD,
      age: 16,
      locale: 'en',
    });
    assert.equal(result.response.status, 201);
    assert.equal(result.json.user.emailVerified, false);
    assert.equal(result.json.verification.emailSent, false);
    assert.equal(result.json.verification.emailTransportDisabled, false);
    assert.equal(result.json.verification.emailSendFailed, true);
    assert.equal(JSON.stringify(result.json).includes('SMTP'), false);
    assert.equal(JSON.stringify(result.json).includes('provider'), false);
    const failedUserId = result.json.user.id;
    const failedRegistrationState = await getEmailVerificationState(pool, failedUserId);
    assert.equal(failedRegistrationState.sentAt, null);
    assert.equal(failedRegistrationState.activeCount, 0);

    result = await request('POST', '/api/auth/resend-verification-email', {}, result.cookieHeader);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.sent, false);
    assert.equal(result.json.emailTransportDisabled, false);
    assert.equal(result.json.emailSendFailed, true);
    assert.equal(JSON.stringify(result.json).includes('SMTP'), false);
    assert.equal(JSON.stringify(result.json).includes('provider'), false);
    const failedResendState = await getEmailVerificationState(pool, failedUserId);
    assert.equal(failedResendState.sentAt, null);
    assert.equal(failedResendState.activeCount, 0);

    console.log('Email verification auth integration verification passed.');
  } finally {
    await stopServer(child);
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
