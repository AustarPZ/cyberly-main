const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildLearnerContext } = require('../src/ai/ai.learnerContext');
const { createAiRepository } = require('../src/ai/ai.repository');

for (const [ageGroup, ageBand] of [['child', '1-12'], ['teen', '13-17'], ['young_adult', '18-24'], ['adult', '25+']]) {
  test(`known ${ageGroup} learner keeps their audience band`, () => {
    const context = buildLearnerContext({ locale: 'en', data: { profile: { age_group: ageGroup } } });
    assert.equal(context.ageBand, ageBand);
    assert.equal(context.age, undefined);
  });
}

test('unknown audience retains the default emphasis', () => {
  assert.equal(buildLearnerContext({ locale: 'ms' }).ageBand, '13-17');
});

test('context repository requests stored age group even without a learner profile', async () => {
  const calls = [];
  const repository = createAiRepository({ query: async (sql, params) => {
    calls.push({ sql, params });
    return calls.length === 1 ? [[{ education_level: null, age_group: 'adult' }]] : [[]];
  } });
  const data = await repository.loadLearnerContextData(71);
  assert.match(calls[0].sql, /u\.age_group/);
  assert.match(calls[0].sql, /FROM users u\s+LEFT JOIN learner_profiles/);
  assert.deepEqual(calls[0].params, [71]);
  assert.equal(buildLearnerContext({ locale: 'en', data }).ageBand, '25+');
});
