import { validScenarioResumeTarget, validScenarioResumeHandoff, validateScenarioResumeResponse, sameScenarioResumeContext } from './scenarioContinuation';

const target = { type: 'resume_scenario', attemptId: 7, scenarioSlug: 'parcel-sms' };
const stamp = { authScopeRevision: 1, targetRevision: 2, attemptId: 7, scenarioSlug: 'parcel-sms', requestGeneration: 3, locale: 'en', acceptedNavigationGeneration: 4 };
const payload = () => ({ ok: true, attempt: { id: 7, status: 'in_progress', currentStepOrder: 2 }, scenario: { slug: 'parcel-sms', totalSteps: 3 }, currentStep: { id: 12, stepOrder: 2, options: [{ key: 'A', text: 'Pause' }] }, decisions: [{ stepId: 11, stepOrder: 1 }] });

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
