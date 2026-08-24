const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const cors = require('cors');
const {
  createCorsOptions,
  createOriginProtection,
  createSecurityHeadersMiddleware,
} = require('../src/security/httpSecurity');
const {
  createFixedWindowRateLimiter,
  createHashedBodyKey,
} = require('../src/security/rateLimit');
const {
  createAgentActionRateLimiter,
  createAuthRateLimiters,
} = require('../src/security/rateLimitPolicies');

const CLIENT_ORIGIN = 'https://staging.cyberly.my';

async function withServer(app, callback) {
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    const { port } = server.address();
    await callback(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function testHeadersAndOriginPolicy() {
  const app = express();
  app.use(createSecurityHeadersMiddleware({ isProduction: true }));
  app.use(cors(createCorsOptions(CLIENT_ORIGIN)));
  app.use(createOriginProtection({
    allowedOrigin: CLIENT_ORIGIN,
    requireOrigin: true,
  }));
  app.use(express.json());
  app.get('/read', (_req, res) => res.json({ ok: true }));
  app.post('/mutate', (_req, res) => res.json({ ok: true }));

  await withServer(app, async (baseUrl) => {
    let response = await fetch(`${baseUrl}/read`, {
      headers: { Origin: 'https://evil.example' },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), null);
    assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('x-frame-options'), 'DENY');
    assert.match(response.headers.get('content-security-policy') || '', /default-src 'none'/);
    assert.equal(response.headers.get('permissions-policy'), 'camera=(), microphone=(), geolocation=()');
    assert.match(response.headers.get('strict-transport-security') || '', /max-age=/);

    response = await fetch(`${baseUrl}/mutate`, {
      method: 'POST',
      headers: { Origin: CLIENT_ORIGIN, 'Content-Type': 'application/json' },
      body: '{}',
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('access-control-allow-origin'), CLIENT_ORIGIN);

    for (const origin of ['https://evil.example', 'https://other.cyberly.my']) {
      response = await fetch(`${baseUrl}/mutate`, {
        method: 'POST',
        headers: { Origin: origin, 'Content-Type': 'application/json' },
        body: '{}',
      });
      assert.equal(response.status, 403);
      assert.deepEqual(await response.json(), {
        code: 'SECURITY_ORIGIN_REJECTED',
        message: 'Request origin is not allowed.',
      });
      assert.equal(response.headers.get('access-control-allow-origin'), null);
    }

    response = await fetch(`${baseUrl}/mutate`, { method: 'POST' });
    assert.equal(response.status, 403);
  });

  const developmentApp = express();
  developmentApp.use(createOriginProtection({
    allowedOrigin: 'http://localhost:3000',
    requireOrigin: false,
  }));
  developmentApp.post('/mutate', (_req, res) => res.json({ ok: true }));
  await withServer(developmentApp, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/mutate`, { method: 'POST' });
    assert.equal(response.status, 200);
  });
}

function createMockResponse() {
  return {
    headers: {},
    statusCode: 200,
    body: null,
    set(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(value) {
      this.statusCode = value;
      return this;
    },
    json(value) {
      this.body = value;
      return this;
    },
  };
}

function invoke(middleware, req) {
  const res = createMockResponse();
  let nextCalled = false;
  middleware(req, res, () => { nextCalled = true; });
  return { res, nextCalled };
}

function testRateLimitContracts() {
  let now = 1_000;
  const registrationLimiter = createFixedWindowRateLimiter({
    windowMs: 60_000,
    max: 2,
    keyGenerator: (req) => `register:${req.ip}`,
    now: () => now,
    code: 'AUTH_RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again later.',
  });

  const request = { ip: '203.0.113.10', body: {} };
  assert.equal(invoke(registrationLimiter, request).nextCalled, true);
  assert.equal(invoke(registrationLimiter, request).nextCalled, true);
  const limited = invoke(registrationLimiter, request);
  assert.equal(limited.nextCalled, false);
  assert.equal(limited.res.statusCode, 429);
  assert.deepEqual(limited.res.body, {
    code: 'AUTH_RATE_LIMITED',
    message: 'Too many authentication attempts. Please try again later.',
  });
  assert.equal(limited.res.headers['Retry-After'], '60');

  now += 60_001;
  assert.equal(invoke(registrationLimiter, request).nextCalled, true);

  const keyFor = createHashedBodyKey('email', { prefix: 'login-account' });
  const first = keyFor({ body: { email: ' Learner@Example.com ' } });
  const second = keyFor({ body: { email: 'learner@example.com' } });
  assert.equal(first, second);
  assert.doesNotMatch(first, /learner|example/i);
  assert.equal(keyFor({ body: {} }), null);
}

function testApplicationRateLimitPolicies() {
  const now = () => 10_000;
  const auth = createAuthRateLimiters({ now });
  const registrationRequest = { ip: '203.0.113.20', socket: {}, body: {} };
  for (let index = 0; index < 10; index += 1) {
    assert.equal(invoke(auth.registration, registrationRequest).nextCalled, true);
  }
  const registrationLimited = invoke(auth.registration, registrationRequest);
  assert.equal(registrationLimited.res.statusCode, 429);
  assert.equal(registrationLimited.res.body.code, 'AUTH_RATE_LIMITED');

  for (let index = 0; index < 20; index += 1) {
    const loginRequest = {
      ip: '203.0.113.21',
      socket: {},
      body: { email: `learner-${index}@example.test` },
    };
    assert.equal(invoke(auth.loginIp, loginRequest).nextCalled, true);
  }
  const loginIpLimited = invoke(auth.loginIp, {
    ip: '203.0.113.21', socket: {}, body: { email: 'another@example.test' },
  });
  assert.equal(loginIpLimited.res.statusCode, 429);
  assert.deepEqual(loginIpLimited.res.body, registrationLimited.res.body);

  for (let index = 0; index < 10; index += 1) {
    const loginRequest = {
      ip: `198.51.100.${index}`,
      socket: {},
      body: { email: 'same-learner@example.test' },
    };
    assert.equal(invoke(auth.loginAccount, loginRequest).nextCalled, true);
  }
  const loginAccountLimited = invoke(auth.loginAccount, {
    ip: '198.51.100.99', socket: {}, body: { email: 'same-learner@example.test' },
  });
  assert.equal(loginAccountLimited.res.statusCode, 429);
  assert.deepEqual(loginAccountLimited.res.body, registrationLimited.res.body);

  const forgotIpRequest = { ip: '203.0.113.30', socket: {}, body: { email: 'learner@example.test' } };
  for (let index = 0; index < 10; index += 1) {
    assert.equal(invoke(auth.forgotPasswordIp, forgotIpRequest).nextCalled, true);
  }
  assert.equal(invoke(auth.forgotPasswordIp, forgotIpRequest).res.statusCode, 429);

  for (let index = 0; index < 5; index += 1) {
    assert.equal(invoke(auth.forgotPasswordAccount, {
      ip: `198.51.100.${index}`,
      socket: {},
      body: { email: ' Learner@Example.test ' },
    }).nextCalled, true);
  }
  const forgotAccountLimited = invoke(auth.forgotPasswordAccount, {
    ip: '198.51.100.99', socket: {}, body: { email: 'learner@example.test' },
  });
  assert.equal(forgotAccountLimited.res.statusCode, 429);

  const resetIpRequest = { ip: '203.0.113.31', socket: {}, body: { token: 'raw-reset-token' } };
  for (let index = 0; index < 20; index += 1) {
    assert.equal(invoke(auth.resetPasswordIp, resetIpRequest).nextCalled, true);
  }
  assert.equal(invoke(auth.resetPasswordIp, resetIpRequest).res.statusCode, 429);

  for (let index = 0; index < 5; index += 1) {
    assert.equal(invoke(auth.resetPasswordToken, {
      ip: `192.0.2.${index}`,
      socket: {},
      body: { token: 'raw-reset-token' },
    }).nextCalled, true);
  }
  const resetTokenLimited = invoke(auth.resetPasswordToken, {
    ip: '192.0.2.99', socket: {}, body: { token: 'raw-reset-token' },
  });
  assert.equal(resetTokenLimited.res.statusCode, 429);

  const forgotKey = createHashedBodyKey('email', { prefix: 'forgot-password-account' })({
    body: { email: 'learner@example.test' },
  });
  const resetKey = createHashedBodyKey('token', { prefix: 'reset-password-token' })({
    body: { token: 'raw-reset-token' },
  });
  assert.doesNotMatch(forgotKey, /learner|example/i);
  assert.doesNotMatch(resetKey, /raw-reset-token/i);

  const agentLimiter = createAgentActionRateLimiter({ now });
  const agentRequest = { session: { userId: 42 } };
  for (let index = 0; index < 30; index += 1) {
    assert.equal(invoke(agentLimiter, agentRequest).nextCalled, true);
  }
  const agentLimited = invoke(agentLimiter, agentRequest);
  assert.equal(agentLimited.res.statusCode, 429);
  assert.equal(agentLimited.res.body.code, 'ACTION_RATE_LIMITED');
}

async function run() {
  await testHeadersAndOriginPolicy();
  testRateLimitContracts();
  testApplicationRateLimitPolicies();
  console.log('Security boundary verification passed.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
