function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(email));
}

function validateDisplayName(displayName) {
  const value = String(displayName || '').trim();
  if (value.length < 1) return 'Display name is required.';
  if (value.length > 100) return 'Display name must be 100 characters or fewer.';
  return null;
}

function validatePassword(password) {
  const value = String(password || '');
  if (value.length < 8) return 'Password must be at least 8 characters.';
  if (!/[A-Za-z]/.test(value) || !/[0-9]/.test(value)) {
    return 'Password must contain at least one letter and one number.';
  }
  return null;
}

const MIN_LEARNER_AGE = 13;
const MAX_LEARNER_AGE = 17;
const AGE_VALIDATION_MESSAGE = 'Age must be a whole number from 13 to 17.';

function validateAge(age) {
  const value = Number(age);
  if (
    !Number.isInteger(value) ||
    value < MIN_LEARNER_AGE ||
    value > MAX_LEARNER_AGE
  ) {
    return AGE_VALIDATION_MESSAGE;
  }
  return null;
}

function validateRegistration(input) {
  const errors = {};

  if (!isValidEmail(input.email)) errors.email = 'Please enter a valid email address.';

  const displayNameError = validateDisplayName(input.displayName);
  if (displayNameError) errors.displayName = displayNameError;

  const passwordError = validatePassword(input.password);
  if (passwordError) errors.password = passwordError;

  const ageError = validateAge(input.age);
  if (ageError) errors.age = ageError;

  return {
    ok: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  AGE_VALIDATION_MESSAGE,
  MAX_LEARNER_AGE,
  MIN_LEARNER_AGE,
  isValidEmail,
  normalizeEmail,
  validateAge,
  validateDisplayName,
  validatePassword,
  validateRegistration,
};
