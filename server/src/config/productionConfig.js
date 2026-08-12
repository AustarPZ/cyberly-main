const { validateSmtpConfiguration } = require('../auth/emailVerificationEmail.service');

const DEVELOPMENT_SESSION_SECRET = 'development-only-session-secret-change-me';
const VALID_EMAIL_TRANSPORTS = new Set(['disabled', 'test', 'test-success', 'test-fail', 'smtp']);
const VALID_SAME_SITE_VALUES = new Set(['lax', 'strict', 'none']);

function configurationError(fields) {
  const uniqueFields = [...new Set(fields)];
  const error = new Error(`Missing or invalid required production configuration: ${uniqueFields.join(', ')}`);
  error.code = 'INVALID_PRODUCTION_CONFIGURATION';
  error.fields = uniqueFields;
  return error;
}

function requireTrimmed(value, name) {
  const normalized = String(value || '').trim();
  if (!normalized) throw configurationError([name]);
  return normalized;
}

function validateSessionSecret(value) {
  const secret = requireTrimmed(value, 'SESSION_SECRET');
  if (secret === DEVELOPMENT_SESSION_SECRET || secret.length < 32) {
    throw configurationError(['SESSION_SECRET']);
  }
  return secret;
}

function validateProductionUrl(value, { name, originOnly = false } = {}) {
  const raw = requireTrimmed(value, name);
  if (raw === '*') throw configurationError([name]);

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    throw configurationError([name]);
  }

  const hostname = parsed.hostname.toLowerCase();
  if (
    parsed.protocol !== 'https:' ||
    ['localhost', '127.0.0.1', '::1'].includes(hostname) ||
    parsed.search ||
    parsed.hash ||
    (originOnly && parsed.pathname !== '/')
  ) {
    throw configurationError([name]);
  }

  return originOnly
    ? parsed.origin
    : parsed.toString().replace(/\/+$/, '');
}

function validateDatabaseConfig(env) {
  const invalid = [];
  for (const name of ['DB_HOST', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']) {
    if (!String(env[name] || '').trim()) invalid.push(name);
  }

  const port = Number(env.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) invalid.push('DB_PORT');
  if (invalid.length) throw configurationError(invalid);
  return { port };
}

function validateDatabaseTlsConfig(env) {
  const mode = String(env.DB_SSL_MODE || '').trim().toLowerCase();
  if (mode !== 'required') throw configurationError(['DB_SSL_MODE']);

  requireTrimmed(env.DB_SSL_CA, 'DB_SSL_CA');

  const rejectUnauthorized = String(env.DB_SSL_REJECT_UNAUTHORIZED || '').trim().toLowerCase();
  if (rejectUnauthorized !== 'true') {
    throw configurationError(['DB_SSL_REJECT_UNAUTHORIZED']);
  }

  return { mode, rejectUnauthorized: true };
}

function validateEmailConfig(env, clientBaseUrl) {
  const transport = String(env.EMAIL_TRANSPORT || 'disabled').trim().toLowerCase();
  if (!VALID_EMAIL_TRANSPORTS.has(transport)) throw configurationError(['EMAIL_TRANSPORT']);
  if (transport !== 'smtp') return { transport };

  const result = validateSmtpConfiguration({
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      user: env.SMTP_USER,
      password: env.SMTP_PASSWORD,
    },
    fromAddress: env.EMAIL_FROM_ADDRESS,
    clientBaseUrl,
  });
  if (!result.ok) throw configurationError(['SMTP_CONFIGURATION']);
  return { transport };
}

function validateAiConfig(env) {
  requireTrimmed(env.OPENAI_API_KEY, 'OPENAI_API_KEY');
  const dailyBudgetUsd = Number(env.AI_DAILY_BUDGET_USD);
  if (!Number.isFinite(dailyBudgetUsd) || dailyBudgetUsd <= 0) {
    throw configurationError(['AI_DAILY_BUDGET_USD']);
  }
  return { provider: 'openai', dailyBudgetUsd };
}

function validateProductionConfig(env = process.env) {
  if (String(env.NODE_ENV || '').trim().toLowerCase() !== 'production') {
    return { isProduction: false };
  }

  validateSessionSecret(env.SESSION_SECRET);
  const clientOrigin = validateProductionUrl(env.CLIENT_ORIGIN, {
    name: 'CLIENT_ORIGIN',
    originOnly: true,
  });
  const clientBaseUrl = validateProductionUrl(env.CLIENT_BASE_URL, {
    name: 'CLIENT_BASE_URL',
  });
  validateDatabaseConfig(env);
  validateDatabaseTlsConfig(env);
  validateEmailConfig(env, clientBaseUrl);
  validateAiConfig(env);

  const sessionCookieSameSite = String(env.SESSION_COOKIE_SAMESITE || 'lax').trim().toLowerCase();
  if (!VALID_SAME_SITE_VALUES.has(sessionCookieSameSite)) {
    throw configurationError(['SESSION_COOKIE_SAMESITE']);
  }

  return {
    isProduction: true,
    clientOrigin,
    clientBaseUrl,
    sessionCookieSameSite,
  };
}

module.exports = {
  DEVELOPMENT_SESSION_SECRET,
  validateAiConfig,
  validateDatabaseConfig,
  validateDatabaseTlsConfig,
  validateEmailConfig,
  validateProductionConfig,
  validateProductionUrl,
  validateSessionSecret,
};
