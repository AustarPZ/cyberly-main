const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { createPool } = require('../src/database/pool');
const { createEmailVerificationRepository } = require('../src/auth/emailVerification.repository');
const { createEmailVerificationTokenService } = require('../src/auth/emailVerification.service');

const PORT = process.env.EMAIL_VERIFICATION_RED_TEST_PORT || '5116';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const VERIFIED_EMAIL = 'auth.ev.6c.verified@example.com';
const UNVERIFIED_EMAIL = 'auth.ev.6c.unverified@example.com';
const TEST_PASSWORD = 'AuthEv6aPass9';

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
  let json = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  return { response, json, cookieHeader: mergeCookies(cookieHeader, response) };
}

function startServer() {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT,
      CLIENT_ORIGIN: 'http://localhost:3000',
      NODE_ENV: 'test',
      OPENAI_API_KEY: 'test-key',
      AI_TEST_MOCK_OPENAI: 'success',
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
  const [users] = await pool.query('SELECT id FROM users WHERE email IN (?, ?)', [VERIFIED_EMAIL, UNVERIFIED_EMAIL]);
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
  await pool.query('DELETE FROM users WHERE email IN (?, ?)', [VERIFIED_EMAIL, UNVERIFIED_EMAIL]);
  await pool.query('DELETE FROM sessions WHERE expires < NOW()');
}

function recordFailure(failures, label, error) {
  failures.push(`${label}: ${error.message}`);
}

function expectEqual(failures, label, actual, expected) {
  try {
    assert.equal(actual, expected);
  } catch (error) {
    recordFailure(failures, label, error);
  }
}

function expectHasOwn(failures, label, value, key) {
  try {
    assert.equal(Object.hasOwn(value || {}, key), true);
  } catch (error) {
    recordFailure(failures, label, error);
  }
}

async function run() {
  const pool = createPool();
  const emailVerificationRepository = createEmailVerificationRepository(pool);
  const emailVerificationTokenService = createEmailVerificationTokenService(emailVerificationRepository);
  const child = startServer();
  const failures = [];

  try {
    await cleanup(pool);
    await waitForHealth(child);

    let result = await request('POST', '/api/auth/register', {
      email: VERIFIED_EMAIL,
      displayName: 'Auth EV 6A Red',
      password: TEST_PASSWORD,
      age: 16,
    });
    assert.equal(result.response.status, 201, 'fixture registration must keep working before email verification is implemented');
    const cookieHeader = result.cookieHeader;

    expectHasOwn(failures, 'register response exposes emailVerified', result.json.user, 'emailVerified');
    expectEqual(failures, 'newly registered user is unverified', result.json.user.emailVerified, false);

    result = await request('GET', '/api/auth/me', undefined, cookieHeader);
    assert.equal(result.response.status, 200, 'authenticated /me must keep working for the fixture');
    expectHasOwn(failures, '/me response exposes emailVerified', result.json.user, 'emailVerified');
    expectEqual(failures, '/me represents new user as unverified', result.json.user.emailVerified, false);

    const issued = await emailVerificationTokenService.issueEmailVerificationToken({
      userId: result.json.user.id,
      targetEmail: VERIFIED_EMAIL,
      requestIp: '127.0.0.1',
      requestUserAgent: 'auth-ev-6c-test',
    });

    result = await request('POST', '/api/auth/verify-email', { token: issued.rawToken });
    expectEqual(failures, 'verify-email endpoint accepts a valid token', result.response.status, 200);
    expectEqual(failures, 'verify-email endpoint returns verified state', result.json.user?.emailVerified, true);

    result = await request('POST', '/api/auth/resend-verification-email');
    expectEqual(failures, 'resend endpoint requires authentication', result.response.status, 401);

    result = await request('POST', '/api/auth/resend-verification-email', {}, cookieHeader);
    expectEqual(failures, 'authenticated resend endpoint issues verification email', result.response.status, 200);

    result = await request('POST', '/api/auth/register', {
      email: UNVERIFIED_EMAIL,
      displayName: 'Auth EV 6C Unverified',
      password: TEST_PASSWORD,
      age: 16,
    });
    assert.equal(result.response.status, 201, 'second unverified fixture registration must keep working');
    const unverifiedCookieHeader = result.cookieHeader;

    result = await request('POST', '/api/chat/conversations', {
      message: { content: 'Can you help me check a suspicious SMS?' },
      locale: 'en',
    }, unverifiedCookieHeader);
    assert.equal(result.response.status, 201, 'unverified users should still be able to create/read chat history fixtures');
    const conversationId = result.json.conversation.id;
    const userMessageId = result.json.messages[0].id;

    result = await request('GET', `/api/chat/conversations/${conversationId}`, undefined, unverifiedCookieHeader);
    assert.equal(result.response.status, 200, 'unverified users may still read existing CyberGuard history');

    result = await request(
      'POST',
      `/api/chat/conversations/${conversationId}/messages/${userMessageId}/generate`,
      { locale: 'en' },
      unverifiedCookieHeader
    );
    expectEqual(failures, 'unverified users cannot trigger new CyberGuard generation', result.response.status, 403);
    expectEqual(failures, 'generation guard returns safe email verification code', result.json.error?.code, 'EMAIL_VERIFICATION_REQUIRED');

    const [[generationRows]] = await pool.query(
      'SELECT COUNT(*) AS count FROM chat_message_generations WHERE user_message_id = ?',
      [userMessageId]
    );
    expectEqual(failures, 'unverified generation guard prevents provider/generation persistence', Number(generationRows.count), 0);

    result = await request(
      'POST',
      `/api/chat/conversations/${conversationId}/messages/${userMessageId}/generate`,
      { locale: 'en' },
      unverifiedCookieHeader
    );
    expectEqual(failures, 'unverified users cannot retry CyberGuard generation', result.response.status, 403);
    expectEqual(failures, 'retry guard returns safe email verification code', result.json.error?.code, 'EMAIL_VERIFICATION_REQUIRED');

    if (failures.length) {
      throw new Error(`Email Verification RED expectations are currently missing:\n- ${failures.join('\n- ')}`);
    }

    console.log('Email verification backend contract verification passed.');
  } finally {
    await stopServer(child);
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
