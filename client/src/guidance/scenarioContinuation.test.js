import { validScenarioResumeTarget, validScenarioResumeHandoff, validateScenarioResumeResponse, sameScenarioResumeContext } from './scenarioContinuation';

const target = { type: 'resume_scenario', attemptId: 7, scenarioSlug: 'parcel-sms' };
const stamp = { authScopeRevision: 1, targetRevision: 2, attemptId: 7, scenarioSlug: 'parcel-sms', requestGeneration: 3, locale: 'en', acceptedNavigationGeneration: 4 };
const payload = () => ({ ok: true, attempt: { id: 7, status: 'in_progress', currentStepOrder: 2 }, scenario: { slug: 'parcel-sms', totalSteps: 3 }, currentStep: { id: 12, stepOrder: 2, options: [{ key: 'A', text: 'Pause' }] }, decisions: [{ stepId: 11, stepOrder: 1 }] });

const readyPayload = () => ({ ...payload(), attempt: { id: 7, status: 'in_progress', currentStepOrder: 3 }, currentStep: null, decisions: [1, 2, 3].map(stepOrder => ({ stepId: 10 + stepOrder, stepOrder, selectedOptionKey: 'A' })) });

test.each([
  ['missing', undefined], ['null', null], ['empty', ''], ['whitespace only', '   '],
  ['leading whitespace', ' A'], ['trailing whitespace', 'A '], ['number', 1],
  ['boolean', true], ['object', {}], ['array', []], ['over limit', '12345678901'],
])('C01 rejects Ready selectedOptionKey: %s', (name, key) => {
  const value = readyPayload();
  if (name === 'missing') delete value.decisions[1].selectedOptionKey;
  else value.decisions[1].selectedOptionKey = key;
  expect(validateScenarioResumeResponse(target, value)).toBe('INCONSISTENT_ATTEMPT');
});

test.each(['A', 'SAFE_1', '1234567890'])('C01 accepts canonical Ready selectedOptionKey %s', key => {
  const value = readyPayload();
  value.decisions.forEach(decision => { decision.selectedOptionKey = key; });
  expect(validateScenarioResumeResponse(target, value)).toBe(null);
});

test.each([undefined, false, true])('AMD1 accepts complete canonical Ready independently of readyToComplete=%s', flag => {
  const value = readyPayload();
  if (flag !== undefined) value.readyToComplete = flag;
  expect(validateScenarioResumeResponse(target, value)).toBe(null);
  value.decisions.reverse();
  expect(validateScenarioResumeResponse(target, value)).toBe(null);
});

test.each([
  ['zero total', v => { v.scenario.totalSteps = 0; }],
  ['string total', v => { v.scenario.totalSteps = '3'; }],
  ['fractional total', v => { v.scenario.totalSteps = 2.5; }],
  ['unsafe total', v => { v.scenario.totalSteps = Number.MAX_SAFE_INTEGER + 1; }],
  ['non-final position', v => { v.attempt.currentStepOrder = 2; }],
  ['missing decisions', v => { delete v.decisions; }],
  ['null decisions', v => { v.decisions = null; }],
  ['short decisions', v => { v.decisions.pop(); }],
  ['long decisions', v => { v.decisions.push({ stepId: 14, stepOrder: 4, selectedOptionKey: 'A' }); }],
  ['duplicate id', v => { v.decisions[2].stepId = 11; }],
  ['duplicate order', v => { v.decisions[2].stepOrder = 1; }],
  ['missing middle order', v => { v.decisions[1].stepOrder = 4; }],
  ['out of range order', v => { v.decisions[2].stepOrder = 4; }],
  ['null record', v => { v.decisions[1] = null; }],
  ['array record', v => { v.decisions[1] = []; }],
  ...['stepId', 'stepOrder'].flatMap(key => [0, -1, 1.5, '1', Number.MAX_SAFE_INTEGER + 1].map(invalid => [`${key}=${invalid}`, v => { v.decisions[1][key] = invalid; }])),
])('AMD1 rejects malformed Ready: %s even with a ready flag', (name, change) => {
  const value = readyPayload(); value.readyToComplete = true; change(value);
  expect(validateScenarioResumeResponse(target, value)).toBe('INCONSISTENT_ATTEMPT');
});

test.each([
  ['foreign attempt', v => { v.attempt.id = 8; }, 'IDENTITY_MISMATCH'],
  ['foreign slug', v => { v.scenario.slug = 'other'; }, 'IDENTITY_MISMATCH'],
  ...['completed', 'abandoned'].map(status => [status, v => { v.attempt.status = status; }, 'NOT_IN_PROGRESS']),
])('AMD1 preserves outer Ready rejection: %s', (name, change, reason) => {
  const value = readyPayload(); change(value);
  expect(validateScenarioResumeResponse(target, value)).toBe(reason);
});

test('accepts only canonical target keys and a valid control handoff', () => {
  expect(validScenarioResumeTarget(target)).toBe(true);
  expect(validScenarioResumeTarget({ ...target, title: 'extra' })).toBe(false);
  const { requestGeneration, locale, ...handoff } = stamp;
  expect(validScenarioResumeHandoff(handoff)).toBe(true);
  expect(validScenarioResumeHandoff({ ...handoff, decisions: [] })).toBe(false);
});
test.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '7', null, NaN])('rejects invalid id %s', attemptId => {
  expect(validScenarioResumeTarget({ ...target, attemptId })).toBe(false);
});
test.each(['Parcel', ' parcel', 'parcel ', 'a/b', '%2F', '', 'a'.repeat(141), null])('rejects malformed slug %s', scenarioSlug => {
  expect(validScenarioResumeTarget({ ...target, scenarioSlug })).toBe(false);
});
test('accepts a playable owned identity without Library metadata', () => {
  expect(validateScenarioResumeResponse(target, payload())).toBe(null);
});
test.each(['id', 'slug'])('rejects mismatched %s', field => {
  const value = payload();
  if (field === 'id') value.attempt.id = 8; else value.scenario.slug = 'other';
  expect(validateScenarioResumeResponse(target, value)).toBe('IDENTITY_MISMATCH');
});
test.each(['completed', 'abandoned'])('rejects %s', status => {
  const value = payload(); value.attempt.status = status;
  expect(validateScenarioResumeResponse(target, value)).toBe('NOT_IN_PROGRESS');
});
test.each([
  v => { v.currentStep = null; }, v => { v.currentStep.id = 0; },
  v => { v.currentStep.stepOrder = 0; }, v => { v.currentStep.stepOrder = 1; },
  v => { v.scenario.totalSteps = 1; }, v => { v.scenario.totalSteps = 0; },
  v => { v.currentStep.options = []; }, v => { v.decisions = null; },
  v => { v.decisions = [{ stepId: 12, stepOrder: 2 }]; },
  v => { v.decisions = [1, 2, 3].map(n => ({ stepId: 20 + n, stepOrder: n })); },
  v => { v.decisions.push({ stepId: 11, stepOrder: 1 }); },
  v => { v.decisions.push({ stepId: 13, stepOrder: 1 }); },
  v => { v.currentStep.options = [null]; },
])('rejects inconsistent playable data %#', change => {
  const value = payload(); change(value);
  expect(validateScenarioResumeResponse(target, value)).toBe('INCONSISTENT_ATTEMPT');
});
test.each([[401, 'AUTH_LOST'], [404, 'NOT_FOUND_OR_FOREIGN'], [500, 'NETWORK_ERROR'], [503, 'NETWORK_ERROR'], [403, 'REQUEST_REJECTED']])('classifies HTTP %s', (status, reason) => {
  expect(validateScenarioResumeResponse(target, { ok: false, status })).toBe(reason);
});
test('classifies transport failure', () => {
  expect(validateScenarioResumeResponse(target, { ok: false, code: 'NETWORK_UNAVAILABLE' })).toBe('NETWORK_ERROR');
});
test('compares all request-context dimensions', () => {
  expect(sameScenarioResumeContext(stamp, { ...stamp })).toBe(true);
  for (const key of Object.keys(stamp)) expect(sameScenarioResumeContext(stamp, { ...stamp, [key]: 'changed' })).toBe(false);
  expect(sameScenarioResumeContext(stamp, null)).toBe(false);
  expect(sameScenarioResumeContext({}, {})).toBe(false);
});
test.each(['authScopeRevision', 'targetRevision', 'acceptedNavigationGeneration'])('rejects an invalid handoff %s', key => {
  const { requestGeneration, locale, ...handoff } = stamp;
  expect(validScenarioResumeHandoff({ ...handoff, [key]: 0 })).toBe(false);
});
