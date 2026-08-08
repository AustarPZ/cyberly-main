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
  assertAuthResponseMetadataContract();
  assertRuntimeDocumentationContract();
  console.log('Email transport verification passed.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
