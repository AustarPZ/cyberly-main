import { validAssessmentResumeTarget, validAssessmentResumeHandoff, sameAssessmentResumeContext, validateAssessmentResumeResponse, validateAssessmentResumeContent, assessmentResumeContentFailure } from './assessmentContinuation';

const target = { type: 'resume_assessment', attemptId: 7 };
const stamp = { attemptId: 7, authScopeRevision: 1, targetRevision: 2, acceptedNavigationGeneration: 3, requestGeneration: 4, locale: 'en' };
const attempt = () => ({ id: 7, assessmentId: 1, status: 'in_progress', answers: [{ questionId: 101, selectedOptionKey: 'A' }] });
const content = () => ({ assessment: { id: 1, questionCount: 1 }, questions: [{ id: 101, prompt: 'Pause?', options: [{ key: 'A', text: 'Verify' }] }] });

test('only canonical target/handoff keys can carry exact authority', () => {
  expect(validAssessmentResumeTarget(target)).toBe(true);
  expect(validAssessmentResumeTarget({ ...target, scenarioSlug: 'other' })).toBe(false);
  expect(validAssessmentResumeTarget({ ...target, type: 'assessment' })).toBe(false);
  const { locale, requestGeneration, ...handoff } = stamp;
  expect(validAssessmentResumeHandoff(handoff)).toBe(true);
  expect(validAssessmentResumeHandoff({ ...handoff, answers: [] })).toBe(false);
});
test.each([0, -1, 1.1, Number.MAX_SAFE_INTEGER + 1, '7', null, NaN])('rejects invalid attempt identity %s', attemptId => {
  expect(validAssessmentResumeTarget({ ...target, attemptId })).toBe(false);
});
test.each(['authScopeRevision', 'targetRevision', 'acceptedNavigationGeneration'])('requires a positive handoff %s', key => {
  const { locale, requestGeneration, ...handoff } = stamp;
  expect(validAssessmentResumeHandoff({ ...handoff, [key]: 0 })).toBe(false);
});
test('all authority/context dimensions invalidate publication', () => {
  expect(sameAssessmentResumeContext(stamp, { ...stamp })).toBe(true);
  for (const key of Object.keys(stamp)) expect(sameAssessmentResumeContext(stamp, { ...stamp, [key]: 'changed' })).toBe(false);
  expect(sameAssessmentResumeContext({}, {})).toBe(false);
  expect(sameAssessmentResumeContext(stamp, null)).toBe(false);
});
test('valid in-progress exact attempt is independent of content authority', () => {
  expect(validateAssessmentResumeResponse(target, { ok: true, data: { attempt: attempt() } })).toBe(null);
  expect(validateAssessmentResumeContent(attempt(), content())).toBe(null);
});
test.each([[401, 'AUTH_LOST'], [404, 'NOT_FOUND_OR_FOREIGN'], [403, 'REQUEST_REJECTED'], [400, 'REQUEST_REJECTED'], [500, 'NETWORK_ERROR'], [503, 'NETWORK_ERROR']])('maps HTTP %s', (status, reason) => {
  expect(validateAssessmentResumeResponse(target, { ok: false, status })).toBe(reason);
});
test('maps invalid authority and transport failure', () => {
  expect(validateAssessmentResumeResponse(null, { ok: true })).toBe('INVALID_TARGET');
  expect(validateAssessmentResumeResponse(target, { ok: false, network: true })).toBe('NETWORK_ERROR');
});

test.each([[401, 'AUTH_LOST'], [404, 'INCONSISTENT_ATTEMPT'], [403, 'REQUEST_REJECTED'], [400, 'REQUEST_REJECTED'], [500, 'NETWORK_ERROR'], [503, 'NETWORK_ERROR']])('supporting content HTTP %s cannot redefine attempt ownership', (status, reason) => {
  expect(assessmentResumeContentFailure({ ok: false, status })).toBe(reason);
});

test('supporting content transport failure remains a network error', () => {
  expect(assessmentResumeContentFailure({ ok: false, network: true })).toBe('NETWORK_ERROR');
});
test.each([8, '7', null])('requires strict attempt identity %s', id => {
  expect(validateAssessmentResumeResponse(target, { ok: true, data: { attempt: { ...attempt(), id } } })).toBe('IDENTITY_MISMATCH');
});
test.each(['completed', 'abandoned', null, undefined])('only in_progress status can open: %s', status => {
  expect(validateAssessmentResumeResponse(target, { ok: true, data: { attempt: { ...attempt(), status } } })).toBe('NOT_IN_PROGRESS');
});
test.each([
  ['different assessment', (a, c) => { c.assessment.id = 2; }],
  ['coerced assessment ID', (a, c) => { c.assessment.id = '1'; }],
  ['missing assessment ID', a => { delete a.assessmentId; }],
  ['missing answers', a => { delete a.answers; }],
  ['foreign question answer', a => { a.answers[0].questionId = 999; }],
  ['invalid option answer', a => { a.answers[0].selectedOptionKey = 'Z'; }],
  ['duplicate answer', a => { a.answers.push({ ...a.answers[0] }); }],
  ['empty questions', (a, c) => { c.questions = []; }],
  ['duplicate question', (a, c) => { c.questions.push({ ...c.questions[0] }); c.assessment.questionCount = 2; }],
  ['missing questions', (a, c) => { delete c.questions; }],
  ['question count mismatch', (a, c) => { c.assessment.questionCount = 2; }],
  ['empty options', (a, c) => { c.questions[0].options = []; }],
  ['null option', (a, c) => { c.questions[0].options = [null]; }],
  ['duplicate option', (a, c) => { c.questions[0].options.push({ ...c.questions[0].options[0] }); }],
  ['missing prompt', (a, c) => { delete c.questions[0].prompt; }],
])('rejects content that cannot represent the attempt: %s', (_, change) => {
  const a = attempt(); const c = content(); change(a, c);
  expect(validateAssessmentResumeContent(a, c)).toBe('INCONSISTENT_ATTEMPT');
});
test('an unanswered attempt and an all-answered unsubmitted attempt are both valid', () => {
  expect(validateAssessmentResumeContent({ ...attempt(), answers: [] }, content())).toBe(null);
  expect(validateAssessmentResumeContent(attempt(), content())).toBe(null);
});
