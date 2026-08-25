const assert = require('node:assert/strict');

function loadModule(path) {
  try {
    return require(path);
  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND' && error.message.includes(path.replace('../', ''))) {
      return {};
    }
    throw error;
  }
}

const emailModule = loadModule('../src/auth/passwordResetEmail.service');
const recoveryModule = loadModule('../src/auth/passwordResetRecovery.service');

const RAW_TOKEN = 'raw token+/=';
const RESET_URL = 'http://localhost:3000/#/reset-password?token=raw%20token%2B%2F%3D';

async function assertEmailContentAndTransport() {
  assert.equal(typeof emailModule.buildPasswordResetLink, 'function', 'password reset link builder must exist');
  assert.equal(typeof emailModule.createPasswordResetSender, 'function', 'password reset sender must exist');

  assert.equal(
    emailModule.buildPasswordResetLink('http://localhost:3000/', RAW_TOKEN),
    RESET_URL
  );

  const cases = [
    {
      locale: 'en-US',
      subject: 'Reset your Cyberly password',
      phrases: ['30 minutes', 'did not request', 'never ask for your password by email'],
    },
    {
      locale: 'ms-MY',
      subject: 'Tetapkan semula kata laluan Cyberly anda',
      phrases: ['30 minit', 'tidak meminta', 'tidak akan meminta kata laluan anda melalui e-mel'],
    },
    {
      locale: 'zh-CN',
      subject: '重设您的 Cyberly 密码',
      phrases: ['30 分钟', '并非由您提出', '绝不会通过电子邮件索取您的密码'],
    },
  ];

  for (const testCase of cases) {
    const messages = [];
    const sender = emailModule.createPasswordResetSender({
      transport: 'test-success',
      fromName: 'Cyberly',
      fromAddress: 'sender@example.test',
      send: async message => {
        messages.push(message);
        return { ok: true, disabled: false };
      },
    });
    const delivery = await sender.sendPasswordReset({
      recipientEmail: 'learner@example.test',
      resetUrl: RESET_URL,
      locale: testCase.locale,
    });

    assert.deepEqual(delivery, { ok: true, disabled: false });
    assert.equal(messages.length, 1);
    assert.equal(messages[0].subject, testCase.subject);
    assert.equal(messages[0].to, 'learner@example.test');
    assert.match(messages[0].text, /Cyberly/);
    assert.match(messages[0].html, /Cyberly/);
    assert.ok(messages[0].text.includes(RESET_URL));
    assert.ok(messages[0].html.includes(RESET_URL.replace(/&/g, '&amp;')));
    for (const phrase of testCase.phrases) {
      assert.ok(messages[0].text.includes(phrase), `${testCase.locale} text must include ${phrase}`);
      assert.ok(messages[0].html.includes(phrase), `${testCase.locale} HTML must include ${phrase}`);
    }
  }

  const fallbackMessages = [];
  const fallbackSender = emailModule.createPasswordResetSender({
    transport: 'test-success',
    send: async message => {
      fallbackMessages.push(message);
      return { ok: true };
    },
  });
  await fallbackSender.sendPasswordReset({
    recipientEmail: 'learner@example.test',
    resetUrl: RESET_URL,
    locale: 'ta',
  });
  assert.equal(fallbackMessages[0].locale, 'en');
  assert.equal(fallbackMessages[0].subject, 'Reset your Cyberly password');

  const serialized = JSON.stringify(fallbackMessages[0]);
  assert.equal(serialized.includes(RAW_TOKEN), false);
  assert.ok((serialized.match(/#\/reset-password\?token=raw%20token%2B%2F%3D/g) || []).length >= 3);
  for (const forbidden of [
    'token hash', 'user ID', 'role', 'account status', 'session version', 'SMTP_PASSWORD',
  ]) {
    assert.equal(serialized.toLowerCase().includes(forbidden.toLowerCase()), false);
  }

  const disabled = emailModule.createPasswordResetSender({
    transport: 'disabled',
    createTransport: () => { throw new Error('disabled transport must not construct SMTP'); },
  });
  assert.deepEqual(await disabled.sendPasswordReset({
    recipientEmail: 'learner@example.test',
    resetUrl: RESET_URL,
  }), { ok: true, disabled: true });

  const sent = [];
  const smtp = emailModule.createPasswordResetSender({
    transport: 'smtp',
    smtp: {
      host: 'smtp.example.test', port: '587', secure: 'false',
      user: 'sender@example.test', password: 'smtp-secret',
    },
    fromName: 'Cyberly',
    fromAddress: 'sender@example.test',
    clientBaseUrl: 'http://localhost:3000',
    createTransport: () => ({
      sendMail: async message => {
        sent.push(message);
        return { messageId: 'private-provider-id' };
      },
    }),
  });
  assert.deepEqual(await smtp.sendPasswordReset({
    recipientEmail: 'learner@example.test', resetUrl: RESET_URL, locale: 'en',
  }), { ok: true, disabled: false });
  assert.equal(sent.length, 1);

  const smtpFailure = emailModule.createPasswordResetSender({
    transport: 'smtp',
    smtp: {
      host: 'smtp.example.test', port: '465', secure: 'true',
      user: 'sender@example.test', password: 'smtp-secret',
    },
    fromAddress: 'sender@example.test',
    clientBaseUrl: 'http://localhost:3000',
    createTransport: () => ({
      sendMail: async () => { throw new Error('provider leaked smtp-secret'); },
    }),
  });
  const failure = await smtpFailure.sendPasswordReset({
    recipientEmail: 'learner@example.test', resetUrl: RESET_URL,
  });
  assert.equal(failure.ok, false);
  assert.equal(failure.disabled, false);
  assert.equal(failure.error.code, 'EMAIL_SEND_FAILED');
  assert.equal(JSON.stringify(failure).includes('smtp-secret'), false);
}

async function assertRecoveryOrchestration() {
  assert.equal(
    typeof recoveryModule.createPasswordResetRecoveryService,
    'function',
    'password reset recovery orchestrator must exist'
  );

  const scenarios = [
    { account: { id: 7, email: 'verified@example.test', role: 'user', accountStatus: 'active', emailVerifiedAt: new Date() }, sent: 1, issued: 1 },
    { account: { id: 8, email: 'unverified@example.test', role: 'user', accountStatus: 'active', emailVerifiedAt: null }, sent: 1, issued: 1 },
    { account: null, sent: 0, issued: 0 },
    { account: { id: 9, email: 'admin@example.test', role: 'admin', accountStatus: 'active' }, sent: 0, issued: 0 },
    { account: { id: 10, email: 'disabled@example.test', role: 'user', accountStatus: 'disabled' }, sent: 0, issued: 0 },
  ];

  for (const scenario of scenarios) {
    const calls = { issued: 0, sent: 0, revoked: 0 };
    const service = recoveryModule.createPasswordResetRecoveryService({
      repository: {
        findAccountByEmail: async () => scenario.account,
        revokeTokenByIdIfActive: async () => { calls.revoked += 1; return true; },
      },
      tokenService: {
        issuePasswordResetToken: async () => {
          calls.issued += 1;
          return { rawToken: RAW_TOKEN, token: { id: 44 }, expiresAt: new Date() };
        },
      },
      sender: {
        sendPasswordReset: async message => {
          calls.sent += 1;
          assert.equal(message.recipientEmail, scenario.account.email);
          return { ok: true, disabled: false };
        },
      },
      clientBaseUrl: 'http://localhost:3000',
      logger: { error() { throw new Error('success path must not log'); } },
    });
    await service.requestPasswordReset({ email: 'input@example.test', locale: 'ms' });
    assert.equal(calls.issued, scenario.issued);
    assert.equal(calls.sent, scenario.sent);
    assert.equal(calls.revoked, 0);
  }

  const logs = [];
  const revoked = [];
  const failureService = recoveryModule.createPasswordResetRecoveryService({
    repository: {
      findAccountByEmail: async () => ({
        id: 7, email: 'private@example.test', role: 'user', accountStatus: 'active',
      }),
      revokeTokenByIdIfActive: async (...args) => { revoked.push(args); return true; },
    },
    tokenService: {
      issuePasswordResetToken: async () => ({
        rawToken: 'private-raw-token', token: { id: 91 }, expiresAt: new Date(),
      }),
    },
    sender: { sendPasswordReset: async () => ({ ok: false, disabled: false }) },
    clientBaseUrl: 'http://localhost:3000',
    now: () => new Date('2026-08-25T00:00:00.000Z'),
    logger: { error: category => logs.push(category) },
  });
  await failureService.requestPasswordReset({ email: 'private@example.test', locale: 'en' });
  assert.deepEqual(revoked, [[91, 'password_reset', new Date('2026-08-25T00:00:00.000Z')]]);
  assert.deepEqual(logs, ['PASSWORD_RESET_EMAIL_SEND_FAILED']);
  const logText = JSON.stringify(logs);
  assert.equal(logText.includes('private@example.test'), false);
  assert.equal(logText.includes('private-raw-token'), false);

  const revokeFailureLogs = [];
  const revokeFailureService = recoveryModule.createPasswordResetRecoveryService({
    repository: {
      findAccountByEmail: async () => ({
        id: 7, email: 'private@example.test', role: 'user', accountStatus: 'active',
      }),
      revokeTokenByIdIfActive: async () => false,
    },
    tokenService: {
      issuePasswordResetToken: async () => ({
        rawToken: 'private-raw-token', token: { id: 92 }, expiresAt: new Date(),
      }),
    },
    sender: { sendPasswordReset: async () => ({ ok: false, disabled: false }) },
    clientBaseUrl: 'http://localhost:3000',
    logger: { error: category => revokeFailureLogs.push(category) },
  });
  await revokeFailureService.requestPasswordReset({ email: 'private@example.test' });
  assert.deepEqual(revokeFailureLogs, [
    'PASSWORD_RESET_EMAIL_SEND_FAILED',
    'PASSWORD_RESET_TOKEN_REVOKE_FAILED',
  ]);
}

(async () => {
  await assertEmailContentAndTransport();
  await assertRecoveryOrchestration();
  console.log('Password reset email tests passed: 21 contract groups.');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
