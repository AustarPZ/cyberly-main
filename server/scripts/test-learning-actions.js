const assert = require('node:assert/strict');
const { buildLearningActions } = require('../src/ai/ai.learningActions');

const resources = [
  { id: 1, slug: 'phishing', category_code: 'Scams', title: 'Phishing' },
  { id: 2, slug: 'password-security', category_code: 'Passwords', title: 'Password Security' },
];

const scenarios = [
  { id: 10, slug: 'phishing-check', topic_code: 'phishing_and_scams', completed_count: 0, title: 'Spot a Phishing Message' },
  { id: 11, slug: 'password-check', topic_code: 'password_and_account_security', completed_count: 0, title: 'Secure Your Password' },
  { id: 12, slug: 'phishing-done', topic_code: 'phishing_and_scams', completed_count: 1, title: 'Completed Phishing Practice' },
];

const learnerContext = {
  currentRecommendation: {
    topicCode: 'password_and_account_security',
  },
  primaryFocus: {
    topicCode: 'password_and_account_security',
  },
  learnerLevel: {
    confidence: 'Medium',
  },
};

function actionTypes(actions) {
  return actions.map(action => action.type);
}

function run() {
  let actions = buildLearningActions({
    learnerContext,
    resources,
    scenarios,
    query: 'What is phishing?',
    ragSources: [
      {
        title: 'Phishing',
        internalTarget: { page: 'resources', resourceSlug: 'phishing', resourceId: 1 },
      },
    ],
  });
  assert.deepEqual(actionTypes(actions), ['scenario', 'progress', 'resources']);
  assert.equal(actions[0].target.scenarioSlug, 'phishing-check');
  assert.notEqual(actions[0].type, 'resource');
  assert.equal(actions.length <= 3, true);

  actions = buildLearningActions({
    learnerContext,
    resources,
    scenarios,
    query: 'What should I learn next?',
    ragSources: [
      {
        title: 'Phishing',
        internalTarget: { page: 'resources', resourceSlug: 'phishing', resourceId: 1 },
      },
    ],
  });
  assert.equal(actions[0].type, 'resource');
  assert.equal(actions[0].target.resourceSlug, 'password-security');

  actions = buildLearningActions({
    learnerContext: {
      currentRecommendation: { topicCode: 'phishing_and_scams' },
      learnerLevel: { confidence: 'Medium' },
    },
    resources,
    scenarios: scenarios.map(scenario => (
      scenario.topic_code === 'phishing_and_scams'
        ? { ...scenario, completed_count: 1 }
        : scenario
    )),
    query: 'I completed it, what should I do next?',
  });
  assert.equal(actions.some(action => action.target?.scenarioSlug === 'phishing-check'), false);
  assert.deepEqual(actionTypes(actions), ['resource', 'scenarios', 'progress']);
  assert.equal(actions.length <= 3, true);

  console.log('Learning action selection verification passed.');
}

run();
