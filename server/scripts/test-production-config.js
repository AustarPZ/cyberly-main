const assert = require('node:assert/strict');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const {
  validateProductionConfig,
  validateProductionUrl,
  validateSessionSecret,
} = require('../src/config/productionConfig');

const VALID_SECRET = '0123456789abcdef0123456789abcdef';
const SECRET_VALUES = {
  SESSION_SECRET: 'secret-value-that-must-never-appear',
  DB_PASSWORD: 'db-password-that-must-never-appear',
  SMTP_PASSWORD: 'smtp-password-that-must-never-appear',
  OPENAI_API_KEY: 'openai-key-that-must-never-appear',
};

function validProductionEnv(overrides = {}) {
  return {
    NODE_ENV: 'production',
    SESSION_SECRET: VALID_SECRET,
    CLIENT_ORIGIN: 'https://app.example.com',
    CLIENT_BASE_URL: 'https://app.example.com/',
    DB_HOST: 'mysql.example.internal',
    DB_PORT: '3306',
    DB_NAME: 'cyberly',
    DB_USER: 'cyberly_app',
    DB_PASSWORD: 'safe-placeholder-db-password',
    EMAIL_TRANSPORT: 'disabled',
    OPENAI_API_KEY: 'safe-placeholder-openai-key',
    SESSION_COOKIE_SAMESITE: 'lax',
    ...overrides,
  };
}

function assertInvalid(overrides, expectedField) {
  assert.throws(
    () => validateProductionConfig(validProductionEnv(overrides)),
    error => {
      assert.equal(error.code, 'INVALID_PRODUCTION_CONFIGURATION');
      assert.match(error.message, new RegExp(expectedField));
      return true;
    }
  );
}

function runValidationCases() {
  assertInvalid({ SESSION_SECRET: undefined }, 'SESSION_SECRET');
  assertInvalid({ SESSION_SECRET: '   ' }, 'SESSION_SECRET');
  assertInvalid({ SESSION_SECRET: 'development-only-session-secret-change-me' }, 'SESSION_SECRET');
  assertInvalid({ SESSION_SECRET: 'too-short' }, 'SESSION_SECRET');
  assert.doesNotThrow(() => validateSessionSecret(VALID_SECRET));

  assertInvalid({ CLIENT_ORIGIN: 'http://localhost:3000' }, 'CLIENT_ORIGIN');
  assertInvalid({ CLIENT_ORIGIN: 'http://app.example.com' }, 'CLIENT_ORIGIN');
  for (const value of [
    'https://app.example.com/path',
    'https://app.example.com?query=yes',
    'https://app.example.com/#hash',
    '*',
  ]) {
    assertInvalid({ CLIENT_ORIGIN: value }, 'CLIENT_ORIGIN');
  }
  assert.equal(
    validateProductionUrl('https://app.example.com/', { name: 'CLIENT_ORIGIN', originOnly: true }),
    'https://app.example.com'
  );

  assertInvalid({ CLIENT_BASE_URL: 'http://127.0.0.1:3000' }, 'CLIENT_BASE_URL');
  assertInvalid({ CLIENT_BASE_URL: 'http://app.example.com' }, 'CLIENT_BASE_URL');
  assert.equal(
    validateProductionConfig(validProductionEnv()).clientBaseUrl,
    'https://app.example.com'
  );

  assertInvalid({ DB_PASSWORD: undefined }, 'DB_PASSWORD');
  for (const value of ['not-a-port', '0', '65536']) {
    assertInvalid({ DB_PORT: value }, 'DB_PORT');
  }

  assertInvalid({
    EMAIL_TRANSPORT: 'smtp',
    SMTP_HOST: 'smtp.example.com',
    SMTP_PORT: '587',
    SMTP_SECURE: 'false',
    SMTP_USER: 'mailer@example.test',
    SMTP_PASSWORD: undefined,
    EMAIL_FROM_ADDRESS: 'mailer@example.test',
  }, 'SMTP_CONFIGURATION');

  for (const transport of ['disabled', 'test', 'test-success', 'test-fail']) {
    assert.doesNotThrow(() => validateProductionConfig(validProductionEnv({ EMAIL_TRANSPORT: transport })));
  }

  assertInvalid({ OPENAI_API_KEY: undefined }, 'OPENAI_API_KEY');

  const result = validateProductionConfig(validProductionEnv());
  assert.equal(result.isProduction, true);
  assert.equal(result.clientOrigin, 'https://app.example.com');
  assert.equal(result.clientBaseUrl, 'https://app.example.com');
  assert.equal(result.sessionCookieSameSite, 'lax');

  const secretEnv = validProductionEnv({ ...SECRET_VALUES, EMAIL_TRANSPORT: 'smtp' });
  let message = '';
  try {
    validateProductionConfig(secretEnv);
  } catch (error) {
    message = error.message;
  }
  for (const secret of Object.values(SECRET_VALUES)) {
    assert.equal(message.includes(secret), false);
  }

  assert.deepEqual(validateProductionConfig({ NODE_ENV: 'development' }), { isProduction: false });
  assert.deepEqual(validateProductionConfig({ NODE_ENV: 'test' }), { isProduction: false });
}

function runStartupGuardCase() {
  const serverPath = path.resolve(__dirname, '..', 'server.js');
  const env = {
    ...process.env,
    ...validProductionEnv({ SESSION_SECRET: '' }),
  };
  const result = spawnSync(process.execPath, [serverPath], {
    cwd: path.dirname(serverPath),
    env,
    encoding: 'utf8',
    timeout: 10000,
  });
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;

  assert.notEqual(result.status, 0);
  assert.match(output, /Production configuration error/);
  assert.match(output, /SESSION_SECRET/);
  assert.doesNotMatch(output, /Server running on port/);
  assert.doesNotMatch(output, /Database health|ECONNREFUSED|access_denied/);
  for (const secret of Object.values(SECRET_VALUES)) {
    assert.equal(output.includes(secret), false);
  }
}

runValidationCases();
runStartupGuardCase();
console.log('Production configuration verification passed.');
