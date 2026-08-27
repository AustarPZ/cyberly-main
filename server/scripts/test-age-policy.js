const assert = require('node:assert/strict');
const { validateAge, validateRegistration } = require('../src/auth/validation');
const { validateAccountUpdate } = require('../src/account/account.validation');

const AGE_ERROR = 'Age must be a whole number from 13 to 17.';

function registrationWith(age) {
  return validateRegistration({
    email: 'learner@example.test',
    displayName: 'Learner',
    password: 'Secure123',
    age,
  });
}

function run() {
  for (const age of [12, 18, 12.5, 'not-an-age', undefined]) {
    assert.equal(validateAge(age), AGE_ERROR);
    assert.equal(registrationWith(age).errors.age, AGE_ERROR);
    assert.equal(validateAccountUpdate({ age }).errors.age, AGE_ERROR);
  }

  for (const age of [13, 17]) {
    assert.equal(validateAge(age), null);
    assert.equal(registrationWith(age).ok, true);
    assert.deepEqual(validateAccountUpdate({ age }), {
      ok: true,
      errors: {},
      value: { age, ageGroup: 'teen' },
    });
  }

  console.log('Learner age policy tests passed.');
}

run();
