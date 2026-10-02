const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validateAge, validateRegistration } = require('../src/auth/validation');
const { validateAccountUpdate } = require('../src/account/account.validation');

const AGE_ERROR = 'Age must be a whole number from 1 to 99.';

function registrationWith(age) {
  return validateRegistration({
    email: 'learner@example.test',
    displayName: 'Learner',
    password: 'Secure123',
    age,
  });
}

function run() {
  for (const age of [0, 100, -1, 1.5, NaN, 'not-an-age', undefined, null, true, false, [], [15], {}]) {
    test(`rejects invalid age ${String(age)} across auth/account`, () => {
      assert.equal(validateAge(age), AGE_ERROR);
      assert.equal(registrationWith(age).errors.age, AGE_ERROR);
      assert.equal(validateAccountUpdate({ age }).errors.age, AGE_ERROR);
    });
  }

  for (const [age, ageGroup] of [[1, 'child'], [12, 'child'], [13, 'teen'], [17, 'teen'], [18, 'young_adult'], [24, 'young_adult'], [25, 'adult'], [99, 'adult']]) {
    test(`accepts age ${age} across auth/account as ${ageGroup}`, () => {
      assert.equal(validateAge(age), null);
      assert.equal(registrationWith(age).ok, true);
      assert.deepEqual(validateAccountUpdate({ age }), {
        ok: true,
        errors: {},
        value: { age, ageGroup },
      });
    });
  }
}

run();
