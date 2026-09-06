const { ERROR_CODES } = require('../errors/errorCodes');
const { isValidEmail, normalizeEmail } = require('../auth/validation');
const { GUARDIAN_REFERENCE_PATTERN } = require('./guardianLink.constants');

function validationError(code, message) {
  const error = new Error(message);
  error.status = 400;
  error.code = code;
  return error;
}

function normalizeGuardianEmail(input) {
  const value = normalizeEmail(input);
  if (!value || value.length > 254 || !isValidEmail(value)) {
    throw validationError(ERROR_CODES.GUARDIAN_LINK_INVALID, 'Enter a valid Guardian contact email address.');
  }
  return value;
}

function normalizeGuardianReference(input) {
  const value = String(input || '').trim();
  if (!GUARDIAN_REFERENCE_PATTERN.test(value)) {
    throw validationError(ERROR_CODES.GUARDIAN_LINK_INVALID, 'Guardian Link reference is invalid.');
  }
  return value;
}

function normalizeGuardianToken(input) {
  const value = String(input || '').trim();
  if (!value) throw validationError(ERROR_CODES.GUARDIAN_LINK_TOKEN_REQUIRED, 'Guardian Link token is required.');
  if (!/^[A-Za-z0-9_-]{16,256}$/.test(value)) {
    throw validationError(ERROR_CODES.GUARDIAN_LINK_TOKEN_INVALID_OR_UNAVAILABLE, 'Guardian Link token is invalid or unavailable.');
  }
  return value;
}

function normalizeLocale(input) {
  const value = String(input || 'en').trim().toLowerCase();
  if (value.startsWith('ms')) return 'ms';
  if (value.startsWith('zh')) return 'zh-CN';
  return 'en';
}

module.exports = { normalizeGuardianEmail, normalizeGuardianReference, normalizeGuardianToken, normalizeLocale };
