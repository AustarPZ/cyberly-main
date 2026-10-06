const assert = require('node:assert/strict');
const { test } = require('node:test');
const { buildLearnerContext } = require('../src/ai/ai.learnerContext');
const { buildLearningActions } = require('../src/ai/ai.learningActions');
const { buildResponsesInstructions } = require('../src/ai/providers/openai.provider');

test('missing evidence has no capability label and retains the default age contract', () => {
  for (const data of [{}, { assessment: null, scenarios: [] }, {
    assessmentTopicScores: [{ topic_code: 'phishing_and_scams', percentage: 20 }],
    topicProgress: [{ topic_code: 'phishing_and_scams', mastery_percentage: 30 }],
  }]) {
    const context = buildLearnerContext({ locale: 'en', data });
    assert.equal(context.learnerLevel, null);
    assert.equal(context.ageBand, '13-17');
    assert.equal(context.locale, 'en');
    assert.equal(JSON.stringify(context).includes('Foundation'), false);
    const instructions = buildResponsesInstructions('Safe learning guidance.', context);
    assert.equal(instructions.includes('Foundation'), false);
    assert.ok(instructions.includes('"ageBand":"13-17"'));
  }
});

test('null learner level preserves the existing assessment-first action without evidence', () => {
  const learnerContext = buildLearnerContext({ locale: 'en' });
  const actions = buildLearningActions({ learnerContext, query: 'Hello CyberGuard.' });
  assert.deepEqual(actions.map(action => action.type), ['assessment', 'resources', 'scenarios']);
});

test('invalid or blank assessment and scenario values cannot establish a learner level', () => {
  for (const percentage of [undefined, null, '', '  ', 'not-a-score', NaN, Infinity, -Infinity, false, true, [], {}]) {
    for (const data of [
      { assessment: { percentage } },
      { scenarios: [{ topic_code: 'phishing_and_scams', percentage }] },
      { assessment: { percentage }, scenarios: [{ percentage }] },
    ]) {
      assert.equal(buildLearnerContext({ locale: 'en', data }).learnerLevel, null);
    }
  }
});

test('assessment-only evidence uses its score with Low confidence', () => {
  assert.deepEqual(buildLearnerContext({ locale: 'en', data: {
    assessment: { percentage: 60 },
  } }).learnerLevel, {
    code: 'L3', label: 'Developing', formReference: 'Form 3', confidence: 'Low',
  });
});

test('scenario-only evidence retains its expected level with Low confidence', () => {
  assert.deepEqual(buildLearnerContext({ locale: 'en', data: {
    scenarios: [{ percentage: 80 }],
  } }).learnerLevel, {
    code: 'L4', label: 'Proficient', formReference: 'Form 4', confidence: 'Low',
  });
});

test('missing scenario entries do not dilute genuine score evidence', () => {
  const context = buildLearnerContext({ locale: 'en', data: {
    assessment: { percentage: null },
    scenarios: [{ percentage: 80 }, { percentage: null }, {}, { percentage: '' }, { percentage: 'bad' }],
  } });
  assert.equal(context.learnerLevel.code, 'L4');
  assert.equal(context.learnerLevel.confidence, 'Low');
});

for (const [percentage, code, label, formReference] of [
  [0, 'L1', 'Foundation', 'Form 1'],
  [39, 'L1', 'Foundation', 'Form 1'],
  [40, 'L2', 'Emerging', 'Form 2'],
  [54, 'L2', 'Emerging', 'Form 2'],
  [55, 'L3', 'Developing', 'Form 3'],
  [69, 'L3', 'Developing', 'Form 3'],
  [70, 'L4', 'Proficient', 'Form 4'],
  [81, 'L4', 'Proficient', 'Form 4'],
  [82, 'L5', 'Advanced', 'Form 5'],
  [91, 'L5', 'Advanced', 'Form 5'],
  [92, 'L6', 'Cyber Champion', 'Form 5+'],
  [100, 'L6', 'Cyber Champion', 'Form 5+'],
]) {
  test(`valid score ${percentage} retains ${code} mapping and form reference`, () => {
    // Equal source scores exercise the existing mapping without an absent operand.
    const context = buildLearnerContext({ locale: 'en', data: {
      assessment: { percentage }, scenarios: [{ percentage }],
    } });
    assert.deepEqual(context.learnerLevel, { code, label, formReference, confidence: 'Low' });
  });
}

test('numeric database strings including zero remain valid evidence', () => {
  for (const [percentage, code] of [['0', 'L1'], ['60.00', 'L3'], ['92.00', 'L6']]) {
    assert.equal(buildLearnerContext({ locale: 'en', data: {
      assessment: { percentage },
    } }).learnerLevel.code, code);
  }
});

test('combined sufficient evidence retains Medium confidence and its level', () => {
  const data = {
    assessment: { percentage: 60 },
    scenarios: [{ percentage: 50 }, { percentage: 70 }],
    assessmentTopicScores: [
      { topic_code: 'phishing_and_scams', percentage: 30 },
      { topic_code: 'password_and_account_security', percentage: 60 },
    ],
  };
  assert.deepEqual(buildLearnerContext({ locale: 'en', data }).learnerLevel, {
    code: 'L3', label: 'Developing', formReference: 'Form 3', confidence: 'Medium',
  });
  const insufficient = { ...data, scenarios: [{ percentage: 60 }] };
  assert.equal(buildLearnerContext({ locale: 'en', data: insufficient }).learnerLevel.confidence, 'Low');
});

test('unequal combined evidence retains the existing weighting and rounding', () => {
  const context = buildLearnerContext({ locale: 'en', data: {
    assessment: { percentage: 92 }, scenarios: [{ percentage: 40 }],
  } });
  assert.equal(context.learnerLevel.code, 'L3');
  const rounded = buildLearnerContext({ locale: 'en', data: {
    assessment: { percentage: 54 }, scenarios: [{ percentage: 56 }],
  } });
  assert.equal(rounded.learnerLevel.code, 'L3');
});

test('all explicit age groups and unknown or missing defaults retain their bands', () => {
  for (const [age_group, ageBand] of [
    ['child', '1-12'], ['teen', '13-17'], ['young_adult', '18-24'], ['adult', '25+'],
    ['unknown', '13-17'], [undefined, '13-17'], [null, '13-17'],
  ]) {
    const context = buildLearnerContext({ locale: 'en', data: { profile: { age_group } } });
    assert.equal(context.ageBand, ageBand);
    assert.equal(context.age, undefined);
  }
  assert.equal(buildLearnerContext({ locale: 'ms' }).ageBand, '13-17');
});

test('schoolStage exposes only supported Form 1-5 profile mappings', () => {
  for (const [education_level, schoolStage] of [
    ['form_1', 'Form 1'], ['form_2', 'Form 2'], ['form_3', 'Form 3'],
    ['form_4', 'Form 4'], ['form_5', 'Form 5'],
  ]) {
    assert.equal(buildLearnerContext({ locale: 'en', data: {
      profile: { education_level },
    } }).schoolStage, schoolStage);
  }
  for (const education_level of [undefined, null, '', 'other', 'prefer_not_to_say', 'form_6', 'university', 'PRIVATE_SCHOOL_MARKER']) {
    const context = buildLearnerContext({ locale: 'en', data: { profile: { education_level } } });
    assert.equal(Object.hasOwn(context, 'schoolStage'), false);
  }
});

test('four weak topics produce one primary and at most two secondary topics', () => {
  const context = buildLearnerContext({ locale: 'en', data: {
    assessmentTopicScores: [
      { topic_code: 'phishing_and_scams', percentage: 10 },
      { topic_code: 'password_and_account_security', percentage: 20 },
      { topic_code: 'privacy_and_personal_information', percentage: 30 },
      { topic_code: 'misinformation_and_deepfakes', percentage: 40 },
    ],
  } });
  assert.equal(context.primaryFocus.topicCode, 'phishing_and_scams');
  assert.deepEqual(context.secondaryFocus.map(topic => topic.topicCode), [
    'password_and_account_security', 'privacy_and_personal_information',
  ]);
  assert.equal(Array.isArray(context.primaryFocus), false);
  assert.equal(context.secondaryFocus.length, 2);
  assert.deepEqual(Object.keys(context.primaryFocus).sort(), ['reason', 'topicCode', 'topicLabel']);
  for (const topic of context.secondaryFocus) {
    assert.deepEqual(Object.keys(topic).sort(), ['topicCode', 'topicLabel']);
  }
});

test('recommendation fallback stays bounded without score evidence', () => {
  const context = buildLearnerContext({ locale: 'en', data: {
    recommendation: {
      topic_code: 'phishing_and_scams', recommended_level: 'developing', reason_code: 'weak_topic',
      reason_text: 'PRIVATE_REASON_MARKER', percentage: 12.3456,
    },
  } });
  assert.equal(context.learnerLevel, null);
  assert.equal(context.primaryFocus.topicCode, 'phishing_and_scams');
  assert.equal((context.secondaryFocus || []).length, 0);
  assert.deepEqual(context.currentRecommendation, {
    topicCode: 'phishing_and_scams', topicLabel: 'phishing and scams', level: 'developing', reasonCode: 'weak_topic',
  });
  assert.equal(JSON.stringify(context).includes('PRIVATE_REASON_MARKER'), false);
  assert.equal(buildLearnerContext({ locale: 'en', data: { recommendation: {} } }).currentRecommendation, undefined);
});

test('sensitive extras and exact numeric evidence never enter context or Provider instructions', () => {
  // Synthetic markers only; no env, database, generation or network access.
  const extras = {
    email: 'PRIVATE_EMAIL_MARKER@example.invalid', username: 'PRIVATE_USERNAME_MARKER',
    display_name: 'PRIVATE_DISPLAY_NAME_MARKER', displayName: 'PRIVATE_CAMEL_NAME_MARKER',
    answers: ['PRIVATE_ANSWER_MARKER'], raw_assessment_answers: 'PRIVATE_RAW_ANSWERS_MARKER',
    raw_scenario_decisions: 'PRIVATE_DECISIONS_MARKER', selectedOptionKey: 'PRIVATE_OPTION_MARKER',
    prompt_private: 'PRIVATE_PROMPT_MARKER', ai_nickname: 'PRIVATE_NICKNAME_MARKER',
    reason_text: 'PRIVATE_REASON_MARKER', scoring_formula: 'PRIVATE_FORMULA_MARKER',
    evidence_weights: 'PRIVATE_WEIGHTS_MARKER', exact_numeric_evidence: 98.7654,
  };
  const data = {
    ...extras,
    profile: { ...extras, age_group: 'teen', education_level: 'form_3' },
    assessment: { ...extras, percentage: 63.1234 },
    scenarios: [
      { ...extras, topic_code: 'phishing_and_scams', percentage: 21.4321 },
      { ...extras, topic_code: 'password_and_account_security', percentage: 80.5678 },
    ],
    assessmentTopicScores: [
      { ...extras, topic_code: 'phishing_and_scams', percentage: 33.6789 },
      { ...extras, topic_code: 'password_and_account_security', percentage: 52.7891 },
    ],
    topicProgress: [
      { ...extras, topic_code: 'privacy_and_personal_information', mastery_percentage: 12.8912 },
      { ...extras, topic_code: 'misinformation_and_deepfakes', mastery_percentage: 44.9123 },
    ],
    recommendation: {
      ...extras, topic_code: 'phishing_and_scams', recommended_level: 'developing', reason_code: 'weak_topic',
    },
  };
  const context = buildLearnerContext({ locale: 'ms', data });
  const serialized = JSON.stringify(context);
  const instructions = buildResponsesInstructions('Safe learning guidance.', context);
  const forbidden = [
    ...Object.values(extras).flat().map(String),
    '63.1234', '21.4321', '80.5678', '33.6789', '52.7891', '12.8912', '44.9123',
    'percentage', 'mastery_percentage', 'selectedOptionKey', 'reason_text', 'scoring_formula', 'evidence_weights',
    '0.55', '0.45',
  ];
  for (const text of [serialized, instructions]) {
    for (const marker of forbidden) assert.equal(text.includes(marker), false, `unexpected private marker: ${marker}`);
  }
  assert.deepEqual(Object.keys(context).sort(), [
    'ageBand', 'currentRecommendation', 'learnerLevel', 'locale', 'primaryFocus', 'schoolStage', 'secondaryFocus',
  ]);
  assert.equal(context.learnerLevel.code, 'L3');
  assert.equal(context.learnerLevel.confidence, 'Medium');
  assert.equal(context.secondaryFocus.length, 2);
  assert.deepEqual(Object.keys(context.currentRecommendation).sort(), ['level', 'reasonCode', 'topicCode', 'topicLabel']);
  assert.ok(instructions.includes(serialized));
  for (const safeField of [
    '"locale":"ms"', '"ageBand":"13-17"', '"schoolStage":"Form 3"',
    '"code":"L3"', '"confidence":"Medium"', '"primaryFocus"', '"secondaryFocus"',
    '"currentRecommendation"', '"topicCode":"phishing_and_scams"', '"reasonCode":"weak_topic"',
  ]) assert.ok(instructions.includes(safeField), `missing safe field: ${safeField}`);
});
