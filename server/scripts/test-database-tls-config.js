const assert = require('node:assert/strict');

const { getDatabaseConfig, getSslConfig } = require('../src/database/pool');
const { validateProductionConfig } = require('../src/config/productionConfig');

const FAKE_CA = '-----BEGIN CERTIFICATE-----\nFAKE_TEST_CA\n-----END CERTIFICATE-----';

function withEnvironment(values, callback) {
  const previousEnvironment = process.env;
  process.env = { ...values };
  try {
    return callback();
  } finally {
    process.env = previousEnvironment;
  }
}

function representativeEnvironment(overrides = {}) {
  return {
    NODE_ENV: 'production',
    SESSION_SECRET: '0123456789abcdef0123456789abcdef',
    CLIENT_ORIGIN: 'https://app.example.com',
    CLIENT_BASE_URL: 'https://app.example.com',
    DB_HOST: 'mysql.example.internal',
    DB_PORT: '3306',
    DB_NAME: 'cyberly',
    DB_USER: 'cyberly_app',
    DB_PASSWORD: 'safe-placeholder-db-password',
    DB_SSL_MODE: 'required',
    DB_SSL_CA: FAKE_CA,
    DB_SSL_REJECT_UNAUTHORIZED: 'true',
    EMAIL_TRANSPORT: 'disabled',
    OPENAI_API_KEY: 'safe-placeholder-openai-key',
    AI_DAILY_BUDGET_USD: '25',
    ...overrides,
  };
}

withEnvironment({ NODE_ENV: 'development', DB_SSL_MODE: 'disabled' }, () => {
  assert.equal(getSslConfig(), undefined);
  assert.equal(getDatabaseConfig().ssl, undefined);
});

withEnvironment({ DB_SSL_MODE: 'required', DB_SSL_CA: FAKE_CA.replace(/\n/g, '\\n') }, () => {
  assert.deepEqual(getSslConfig(), { ca: FAKE_CA, rejectUnauthorized: true });
});

withEnvironment({ DB_SSL_MODE: 'required', DB_SSL_CA: FAKE_CA }, () => {
  assert.deepEqual(getSslConfig(), { ca: FAKE_CA, rejectUnauthorized: true });
});

withEnvironment({ DB_SSL_MODE: 'required', DB_SSL_REJECT_UNAUTHORIZED: 'false' }, () => {
  assert.deepEqual(getSslConfig(), { rejectUnauthorized: false });
});

withEnvironment({ DB_SSL_MODE: 'preferred' }, () => {
  assert.throws(() => getSslConfig(), /DB_SSL_MODE/);
});

withEnvironment({ DB_SSL: 'true' }, () => {
  assert.deepEqual(getSslConfig(), { rejectUnauthorized: true });
});

withEnvironment(representativeEnvironment(), () => {
  assert.equal(validateProductionConfig(process.env).isProduction, true);
  const databaseConfig = getDatabaseConfig();
  assert.equal(databaseConfig.ssl.ca, FAKE_CA);
  assert.equal(databaseConfig.ssl.rejectUnauthorized, true);
});

console.log('Database TLS configuration verification passed.');
