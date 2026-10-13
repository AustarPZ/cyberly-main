const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

function withEnv(patch, callback) {
  const previous = {};
  for (const key of Object.keys(patch)) {
    previous[key] = process.env[key];
    if (patch[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = patch[key];
    }
  }

  return Promise.resolve()
    .then(callback)
    .finally(() => {
      for (const key of Object.keys(patch)) {
        if (previous[key] === undefined) {
          delete process.env[key];
        } else {
          process.env[key] = previous[key];
        }
      }
    });
}

async function assertTransportSelection() {
  const {
    EMAIL_TRANSPORT_DISABLED,
    EMAIL_TRANSPORT_SMTP,
    EMAIL_TRANSPORT_TEST_FAIL,
    EMAIL_TRANSPORT_TEST_SUCCESS,
    createEmailVerificationSender,
  } = require('../src/auth/emailVerificationEmail.service');

  await withEnv({ EMAIL_TRANSPORT: undefined }, async () => {
    const sender = createEmailVerificationSender();
    const result = await sender.sendEmailVerification({
      recipientEmail: 'learner@example.test',
      verificationUrl: 'http://localhost:3000/#/verify-email?token=abc',
    });
    assert.equal(sender.transport, EMAIL_TRANSPORT_DISABLED);
    assert.equal(result.ok, true);
    assert.equal(result.disabled, true);
  });

  const disabled = createEmailVerificationSender({ transport: EMAIL_TRANSPORT_DISABLED });
  assert.equal((await disabled.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    verificationUrl: 'http://localhost:3000/#/verify-email?token=abc',
  })).disabled, true);

  const success = createEmailVerificationSender({ transport: EMAIL_TRANSPORT_TEST_SUCCESS });
  assert.equal((await success.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    verificationUrl: 'http://localhost:3000/#/verify-email?token=abc',
  })).ok, true);

  const fail = createEmailVerificationSender({ transport: EMAIL_TRANSPORT_TEST_FAIL });
  const failure = await fail.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    verificationUrl: 'http://localhost:3000/#/verify-email?token=abc',
  });
  assert.equal(failure.ok, false);
  assert.equal(failure.error.code, 'EMAIL_SEND_FAILED');

  const smtp = createEmailVerificationSender({
    transport: EMAIL_TRANSPORT_SMTP,
    smtp: {
      host: 'smtp.example.test',
      port: '465',
      secure: 'true',
      user: 'sender@example.test',
      password: 'smtp-secret',
    },
    fromAddress: 'sender@example.test',
    clientBaseUrl: 'http://localhost:3000',
    createTransport: () => ({
      sendMail: async () => ({ messageId: 'provider-id' }),
    }),
  });
  assert.equal(smtp.transport, EMAIL_TRANSPORT_SMTP);
  const result = await smtp.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    verificationUrl: 'http://localhost:3000/#/verify-email?token=abc',
  });
  assert.equal(result.ok, true);
  assert.equal(JSON.stringify(result).includes('provider-id'), false);
}

async function assertSmtpConfigurationValidation() {
  const {
    EMAIL_TRANSPORT_SMTP,
    createEmailVerificationSender,
  } = require('../src/auth/emailVerificationEmail.service');

  const base = {
    host: 'smtp.example.test',
    port: '465',
    secure: 'true',
    user: 'sender@example.test',
    password: 'smtp-secret',
  };

  const cases = [
    ['missing host', { ...base, host: '' }, { fromAddress: 'sender@example.test', clientBaseUrl: 'http://localhost:3000' }],
    ['missing username', { ...base, user: '' }, { fromAddress: 'sender@example.test', clientBaseUrl: 'http://localhost:3000' }],
    ['missing password', { ...base, password: '' }, { fromAddress: 'sender@example.test', clientBaseUrl: 'http://localhost:3000' }],
    ['invalid port', { ...base, port: 'not-a-port' }, { fromAddress: 'sender@example.test', clientBaseUrl: 'http://localhost:3000' }],
    ['invalid secure', { ...base, secure: 'maybe' }, { fromAddress: 'sender@example.test', clientBaseUrl: 'http://localhost:3000' }],
    ['missing from address', base, { fromAddress: '', clientBaseUrl: 'http://localhost:3000' }],
    ['missing client base url', base, { fromAddress: 'sender@example.test', clientBaseUrl: '' }],
  ];

  for (const [label, smtp, options] of cases) {
    let transportCreated = false;
    const sender = createEmailVerificationSender({
      transport: EMAIL_TRANSPORT_SMTP,
      smtp,
      ...options,
      createTransport: () => {
        transportCreated = true;
        return { sendMail: async () => ({}) };
      },
    });
    const result = await sender.sendEmailVerification({
      recipientEmail: 'learner@example.test',
      verificationUrl: 'http://localhost:3000/#/verify-email?token=abc',
    });
    assert.equal(result.ok, false, label);
    assert.equal(result.error.code, 'EMAIL_SEND_FAILED', label);
    assert.equal(result.error.category, 'email_transport_failed', label);
    assert.equal(JSON.stringify(result).includes('smtp-secret'), false, label);
    assert.equal(transportCreated, false, label);
  }
}

async function assertMessageConstructionAndFailureSafety() {
  const {
    EMAIL_TRANSPORT_SMTP,
    buildVerificationLink,
    createEmailVerificationSender,
  } = require('../src/auth/emailVerificationEmail.service');

  const link = buildVerificationLink('http://localhost:3000/', 'token with spaces+/=');
  assert.equal(link, 'http://localhost:3000/#/verify-email?token=token%20with%20spaces%2B%2F%3D');

  const sent = [];
  const sender = createEmailVerificationSender({
    transport: EMAIL_TRANSPORT_SMTP,
    smtp: {
      host: 'smtp.example.test',
      port: '587',
      secure: 'false',
      user: 'sender@example.test',
      password: 'smtp-secret',
    },
    fromName: 'Cyberly',
    fromAddress: 'sender@example.test',
    clientBaseUrl: 'http://localhost:3000',
    createTransport: (config) => ({
      sendMail: async (message) => {
        sent.push({ config, message });
        return { messageId: 'smtp-provider-message-id', response: 'provider ok' };
      },
    }),
  });

  const result = await sender.sendEmailVerification({
    recipientEmail: 'learner@example.test',
    learnerName: 'Learner',
    verificationUrl: link,
    expiresAt: new Date('2026-08-04T00:00:00.000Z'),
    locale: 'en',
  });

  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result).sort(), ['disabled', 'ok'].sort());
  assert.equal(sent.length, 1);
  assert.equal(sent[0].config.host, 'smtp.example.test');
  assert.equal(sent[0].config.port, 587);
  assert.equal(sent[0].config.secure, false);
  assert.equal(sent[0].config.auth.user, 'sender@example.test');
  assert.equal(sent[0].config.auth.pass, 'smtp-secret');
  assert.equal(sent[0].message.to, 'learner@example.test');
  assert.deepEqual(sent[0].message.from, { name: 'Cyberly', address: 'sender@example.test' });
  assert.match(sent[0].message.subject, /Verify your Cyberly email/i);
  assert.match(sent[0].message.text, /http:\/\/localhost:3000\/#\/verify-email\?token=token%20with%20spaces%2B%2F%3D/);
  assert.match(sent[0].message.html, /http:\/\/localhost:3000\/#\/verify-email\?token=token%20with%20spaces%2B%2F%3D/);
  assert.equal(JSON.stringify(result).includes('smtp-provider-message-id'), false);

  for (const error of [
    new Error('535 Authentication failed for smtp-secret'),
    Object.assign(new Error('Connection timeout for SMTP_PASSWORD'), { code: 'ETIMEDOUT' }),
    Object.assign(new Error('Connection rejected by provider'), { code: 'ECONNREFUSED' }),
    new Error('Generic provider payload leaked'),
  ]) {
    const failingSender = createEmailVerificationSender({
      transport: EMAIL_TRANSPORT_SMTP,
      smtp: {
        host: 'smtp.example.test',
        port: '465',
        secure: 'true',
        user: 'sender@example.test',
        password: 'smtp-secret',
      },
      fromName: 'Cyberly',
      fromAddress: 'sender@example.test',
      clientBaseUrl: 'http://localhost:3000',
      createTransport: () => ({
        sendMail: async () => {
          throw error;
        },
      }),
    });
    const failure = await failingSender.sendEmailVerification({
      recipientEmail: 'learner@example.test',
      verificationUrl: link,
    });
    assert.equal(failure.ok, false);
    assert.equal(failure.error.code, 'EMAIL_SEND_FAILED');
    assert.equal(JSON.stringify(failure).includes('smtp-secret'), false);
    assert.equal(JSON.stringify(failure).includes('SMTP_PASSWORD'), false);
    assert.equal(JSON.stringify(failure).includes('provider payload'), false);
  }
}

async function assertBrevoTransport() {
  const { createMailTransport } = require('../src/email/mailTransport');
  const { createEmailVerificationSender } = require('../src/auth/emailVerificationEmail.service');
  const { createPasswordResetSender } = require('../src/auth/passwordResetEmail.service');
  const options = {
    transport: 'brevo', brevoApiKey: 'fake-brevo-key', fromName: 'Cyberly',
    fromAddress: 'sender@example.test', clientBaseUrl: 'https://app.example.test',
  };
  const message = {
    fromName: 'Cyberly', fromAddress: 'sender@example.test', to: 'learner@example.test',
    subject: 'Offline subject', html: '<p>Offline body</p>', text: 'Offline body',
    verificationUrl: 'fake-private-link', locale: 'ms', learnerName: 'private-name',
  };
  let cases = 0;
  const check = async (label, callback) => { await callback(); cases += 1; };

  await check('fixed endpoint, headers, HTML preference, safe success', async () => {
    const calls = [];
    const sender = createMailTransport({ ...options, endpoint: 'https://invalid.example.test', fetchImpl: async (...args) => {
      calls.push(args);
      return { status: 201, json: async () => ({ messageId: 'fake-private-message-id', extra: 'private-response' }) };
    } });
    assert.deepEqual(await sender.send(message), { ok: true, disabled: false });
    assert.equal(calls.length, 1);
    const [url, request] = calls[0];
    assert.equal(url, 'https://api.brevo.com/v3/smtp/email');
    assert.equal(request.method, 'POST');
    assert.equal(request.redirect, 'error');
    assert.deepEqual(request.headers, { 'api-key': 'fake-brevo-key', 'content-type': 'application/json', accept: 'application/json' });
    assert.ok(request.signal instanceof AbortSignal);
    assert.deepEqual(JSON.parse(request.body), {
      sender: { name: 'Cyberly', email: 'sender@example.test' }, to: [{ email: 'learner@example.test' }],
      subject: 'Offline subject', htmlContent: '<p>Offline body</p>',
    });
  });
  await check('text fallback', async () => {
    let body;
    const sender = createMailTransport({ ...options, fetchImpl: async (_url, request) => {
      body = JSON.parse(request.body); return { status: 201, json: async () => ({ messageId: 'fake-id' }) };
    } });
    assert.deepEqual(await sender.send({ ...message, html: '' }), { ok: true, disabled: false });
    assert.equal(body.textContent, 'Offline body');
    assert.equal(Object.hasOwn(body, 'htmlContent'), false);
  });
  for (const patch of [
    { brevoApiKey: '' }, { brevoApiKey: 'fake\nkey' }, { fromAddress: '' },
    { fromAddress: 'invalid' }, { clientBaseUrl: '' }, { clientBaseUrl: 'invalid' },
  ]) {
    await check('invalid configuration fails before fetch', async () => {
      let calls = 0;
      const sender = createMailTransport({ ...options, ...patch, fetchImpl: async () => { calls += 1; } });
      assert.deepEqual(await sender.send(message), { ok: false, disabled: false });
      assert.equal(calls, 0);
    });
  }
  for (const patch of [{ to: '' }, { to: 'invalid' }, { subject: '' }, { html: '', text: '' }]) {
    await check('invalid message fails before fetch', async () => {
      let calls = 0;
      const sender = createMailTransport({ ...options, fetchImpl: async () => { calls += 1; } });
      assert.deepEqual(await sender.send({ ...message, ...patch }), { ok: false, disabled: false });
      assert.equal(calls, 0);
    });
  }
  for (const status of [200, 202, 301, 400, 401, 403, 429, 500, 503]) {
    await check(`HTTP ${status} fails closed without retry or response logging`, async () => {
      let calls = 0;
      let bodyReads = 0;
      const sender = createMailTransport({ ...options, fetchImpl: async () => {
        calls += 1;
        return { status, json: async () => { bodyReads += 1; throw new Error('fake-private-provider-error'); } };
      } });
      assert.deepEqual(await sender.send(message), { ok: false, disabled: false });
      assert.equal(calls, 1);
      assert.equal(bodyReads, 0);
    });
  }
  for (const payload of [null, {}, { messageId: '' }, { messageId: '   ' }, { messageId: 123 }, { messageId: ['fake-id'] }]) {
    await check('malformed 201 fails closed', async () => {
      let calls = 0;
      const sender = createMailTransport({ ...options, fetchImpl: async () => {
        calls += 1; return { status: 201, json: async () => payload };
      } });
      assert.deepEqual(await sender.send(message), { ok: false, disabled: false });
      assert.equal(calls, 1);
    });
  }
  for (const mode of ['network', 'abort', 'malformed-json', 'fetch-timeout', 'body-timeout', 'ignores-abort']) {
    await check(`${mode} sanitizes and never retries`, async () => {
      let calls = 0;
      let signal;
      const fakeError = Object.assign(new Error('fake-brevo-key fake-private-link learner@example.test fake-provider-error'), { name: mode === 'abort' ? 'AbortError' : 'Error' });
      const sender = createMailTransport({ ...options, brevoTimeoutMs: 15, fetchImpl: async (_url, request) => {
        calls += 1; signal = request.signal;
        if (mode === 'network' || mode === 'abort') throw fakeError;
        if (mode === 'malformed-json') return { status: 201, json: async () => { throw fakeError; } };
        if (mode === 'ignores-abort') return new Promise(() => {});
        const pending = () => new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(fakeError), { once: true }));
        return mode === 'body-timeout' ? { status: 201, json: pending } : pending();
      } });
      const started = Date.now();
      assert.deepEqual(await sender.send(message), { ok: false, disabled: false });
      assert.equal(calls, 1);
      assert.ok(Date.now() - started < 1000);
      if (mode.includes('timeout') || mode === 'ignores-abort') assert.equal(signal.aborted, true);
    });
  }
  for (const transport of ['disabled', 'test', 'test-success', 'test-fail']) {
    await check('legacy mode never fetches', async () => {
      let calls = 0;
      const sender = createMailTransport({ ...options, transport, fetchImpl: async () => { calls += 1; } });
      const result = await sender.send(message);
      assert.deepEqual(result, { ok: transport !== 'test-fail', disabled: transport === 'disabled' });
      assert.equal(calls, 0);
    });
  }
  for (const [requested, expected] of [[undefined, 10000], [60000, 10000], [0, 10000], [-1, 10000], [NaN, 10000], [Infinity, 10000], [15, 15]]) {
    await check('timeout defaults and maximum remain bounded', async () => {
      const originalSetTimeout = global.setTimeout;
      const originalClearTimeout = global.clearTimeout;
      const handle = {};
      let calls = 0;
      let cleared = 0;
      let signal;
      global.setTimeout = (callback, delay) => {
        assert.equal(delay, expected);
        queueMicrotask(callback);
        return handle;
      };
      global.clearTimeout = value => { assert.equal(value, handle); cleared += 1; };
      try {
        const sender = createMailTransport({ ...options, brevoTimeoutMs: requested, fetchImpl: async (_url, request) => {
          calls += 1; signal = request.signal; return new Promise(() => {});
        } });
        assert.deepEqual(await sender.send(message), { ok: false, disabled: false });
        assert.equal(signal.aborted, true);
        assert.equal(calls, 1);
        assert.equal(cleared, 1);
      } finally {
        global.setTimeout = originalSetTimeout;
        global.clearTimeout = originalClearTimeout;
      }
    });
  }
  await check('completed success clears its deadline', async () => {
    const originalClearTimeout = global.clearTimeout;
    let cleared = 0;
    let signal;
    global.clearTimeout = timer => { if (timer) cleared += 1; originalClearTimeout(timer); };
    try {
      const sender = createMailTransport({ ...options, fetchImpl: async (_url, request) => {
        signal = request.signal; return { status: 201, json: async () => ({ messageId: 'fake-id' }) };
      } });
      assert.deepEqual(await sender.send(message), { ok: true, disabled: false });
      assert.equal(cleared, 1);
      assert.equal(signal.aborted, false);
    } finally { global.clearTimeout = originalClearTimeout; }
  });
  await check('explicit environment opt-in uses injected fetch only', async () => {
    await withEnv({ EMAIL_TRANSPORT: 'brevo', BREVO_API_KEY: 'fake-brevo-key', EMAIL_FROM_ADDRESS: 'sender@example.test', CLIENT_BASE_URL: 'https://app.example.test' }, async () => {
      let calls = 0;
      const sender = createMailTransport({ fetchImpl: async () => { calls += 1; return { status: 201, json: async () => ({ messageId: 'fake-id' }) }; } });
      assert.equal(sender.transport, 'brevo');
      assert.deepEqual(await sender.send(message), { ok: true, disabled: false });
      assert.equal(calls, 1);
    });
  });
  await check('unavailable built-in fetch fails closed', async () => {
    const originalFetch = global.fetch;
    global.fetch = undefined;
    try {
      assert.deepEqual(await createMailTransport(options).send(message), { ok: false, disabled: false });
    } finally { global.fetch = originalFetch; }
  });
  await check('key alone never enables transport', async () => {
    await withEnv({ EMAIL_TRANSPORT: undefined, BREVO_API_KEY: 'fake-brevo-key' }, async () => {
      const sender = createMailTransport({ fetchImpl: async () => { throw new Error('must not fetch'); } });
      assert.equal(sender.transport, 'disabled');
      assert.deepEqual(await sender.send(message), { ok: true, disabled: true });
    });
  });
  for (const factory of [createEmailVerificationSender, createPasswordResetSender]) {
    for (const status of [201, 429]) {
      for (const locale of ['en', 'ms', 'zh-CN']) {
        await check('sender integration preserves safe shapes and localized static body', async () => {
          let calls = 0;
          let body;
          const sender = factory({ ...options, fetchImpl: async (_url, request) => {
            calls += 1; body = JSON.parse(request.body);
            return { status, json: async () => ({ messageId: 'fake-private-message-id' }) };
          } });
          const input = { recipientEmail: 'learner@example.test', verificationUrl: 'https://app.example.test/#/verify-email?token=fake', resetUrl: 'https://app.example.test/#/reset-password?token=fake', locale };
          const result = sender.sendEmailVerification
            ? await sender.sendEmailVerification(input) : await sender.sendPasswordReset(input);
          assert.equal(calls, 1);
          if (status === 201) assert.deepEqual(result, { ok: true, disabled: false });
          else {
            assert.equal(result.ok, false);
            assert.equal(result.error.code, 'EMAIL_SEND_FAILED');
            assert.equal(result.error.category, 'email_transport_failed');
            assert.deepEqual(Object.keys(result).sort(), sender.sendEmailVerification ? ['error', 'ok'] : ['disabled', 'error', 'ok']);
          }
          assert.equal(JSON.stringify(result).includes('fake'), false);
          assert.equal(JSON.stringify(result).includes('@'), false);
          assert.ok(body.htmlContent.includes('Cyberly'));
          assert.equal(Object.hasOwn(body, 'textContent'), false);
          if (sender.sendPasswordReset) {
            assert.equal(body.subject, { en: 'Reset your Cyberly password', ms: 'Tetapkan semula kata laluan Cyberly anda', 'zh-CN': '重设您的 Cyberly 密码' }[locale]);
          } else assert.equal(body.subject, 'Verify your Cyberly email');
        });
      }
    }
  }
  console.log(`Brevo offline transport tests passed: ${cases} cases.`);
}

function assertAuthResponseMetadataContract() {
  const serverSource = fs.readFileSync(path.join(__dirname, '..', 'server.js'), 'utf8');
  assert.match(
    serverSource,
    /verification:\s*{[\s\S]*emailSendFailed:\s*Boolean\(sendResult\.failed\)/,
    'registration verification metadata must expose safe emailSendFailed'
  );
  assert.match(
    serverSource,
    /sent:\s*Boolean\(sendResult\.emailSent\)[\s\S]*emailSendFailed:\s*Boolean\(sendResult\.failed\)/,
    'resend response metadata must expose safe emailSendFailed'
  );
}

function assertRuntimeDocumentationContract() {
  const docs = fs.readFileSync(
    path.join(__dirname, '..', '..', 'docs', 'production', 'configuration', 'email-verification-smtp.md'),
    'utf8'
  );
  assert.equal(
    /same token cannot be reused|token reuse fails/i.test(docs),
    false,
    'owner runtime docs must not expect reused verification links to fail'
  );
  assert.match(docs, /already-verified/i, 'owner runtime docs must describe neutral already-verified reuse');
}

(async () => {
  await assertTransportSelection();
  await assertSmtpConfigurationValidation();
  await assertMessageConstructionAndFailureSafety();
  await assertBrevoTransport();
  assertAuthResponseMetadataContract();
  assertRuntimeDocumentationContract();
  console.log('Email transport verification passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
