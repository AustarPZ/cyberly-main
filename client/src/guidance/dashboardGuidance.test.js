import { dashboardGuidanceInput, dashboardGuidanceStamp } from './dashboardGuidance';
import { resolveGuidance } from './resolveGuidance';

const stamp = { scopeKey: '[41,"en"]', revision: 0 };
const owner = value => ({ guidanceStamp: stamp, loading: false, ...value });
const input = (assessment = {}, scenario = {}, recommendation = {}) => dashboardGuidanceInput({
  stamp,
  assessment: owner({ status: 'pending', ...assessment }),
  scenario: owner({ dashboard: { inProgressAttempts: [] }, ...scenario }),
  recommendation: owner({ recommendation: null, ...recommendation }),
});

test('binds identity, normalized locale and reload revision with one stamp for every owner', () => {
  expect(dashboardGuidanceStamp(41, ' en ', 0)).toEqual(stamp);
  expect(dashboardGuidanceStamp(42, 'ms', 2)).toEqual({ scopeKey: '[42,"ms"]', revision: 2 });
  const value = input();
  expect(value.requestState).toEqual({ audience: 'learner', stamp });
  expect(value.pageContext).toEqual({ page: 'dashboard' });
  for (const key of ['assessmentState', 'scenarioState', 'currentRecommendation']) expect(value[key].stamp).toEqual(stamp);
});
test.each([
  [{ loading: true }, 'loading'], [{ error: 'offline' }, 'error'], [{ status: 'unknown' }, 'unknown'],
  [{ status: undefined }, 'unknown'],
])('preserves assessment uncertainty %j', (value, state) => {
  expect(input(value).assessmentState.state).toBe(state);
  expect(['loading', 'recovery']).toContain(resolveGuidance(input(value)).kind);
});
test.each([
  [{ status: 'pending' }, { state: 'pending' }],
  [{ status: 'in_progress', attempt: { id: 7 } }, { state: 'in_progress', attemptId: 7 }],
  [{ status: 'completed', result: { attempt: { id: 8 } } }, { state: 'completed', attemptId: 8 }],
])('normalizes assessment authority %j', (value, expected) => expect(input(value).assessmentState.value).toEqual(expected));
test.each(['7', 0, -1, 1.5, null, undefined, Number.MAX_SAFE_INTEGER + 1])('does not coerce or drop malformed assessment ID %s', id => {
  for (const status of ['in_progress', 'completed']) {
    const value = input({ status, attempt: { id }, result: { attempt: { id } } });
    expect(value.assessmentState.value.attemptId).toBe(id);
    expect(resolveGuidance(value).kind).toBe('recovery');
  }
});
test('preserves the full S2A inventory including distinct attempts of one scenario', () => {
  const value = input({}, { dashboard: { inProgressAttempts: [
    { attemptId: 9, scenarioSlug: 'sms', title: 'SMS' }, { attemptId: 7, scenarioSlug: 'sms', title: 'SMS' },
  ] } });
  expect(value.scenarioState.value).toEqual({ coverage: 'complete', unfinished: [{ attemptId: 9, scenarioSlug: 'sms' }, { attemptId: 7, scenarioSlug: 'sms' }] });
  expect(resolveGuidance(value).choices.map(action => action.target.attemptId)).toEqual([7, 9]);
});
test.each([undefined, null, {}, 'bad'])('missing/malformed inventory %j never falls back to legacy', inventory => {
  expect(resolveGuidance(input({}, { dashboard: { inProgress: { attemptId: 7, slug: 'sms' }, inProgressAttempts: inventory } })).kind).toBe('recovery');
});
test.each([null, { attemptId: '7', scenarioSlug: 'sms' }, { attemptId: 7, scenarioSlug: '' }, { attemptId: 7, scenarioSlug: 'Bad slug' }])('one bad inventory entry %j poisons the whole set', bad => {
  expect(resolveGuidance(input({}, { dashboard: { inProgressAttempts: [{ attemptId: 9, scenarioSlug: 'sms' }, bad] } })).kind).toBe('recovery');
});
test.each([[{ loading: true }, 'loading'], [{ summaryError: true }, 'error'], [{ dashboard: null }, 'unknown']])('preserves scenario uncertainty', (value, state) => expect(input({}, value).scenarioState.state).toBe(state));
test('only explicit null is an empty recommendation; lifecycle is the server status', () => {
  expect(input().currentRecommendation.state).toBe('empty-confirmed');
  expect(input({}, {}, { recommendation: undefined }).currentRecommendation.state).toBe('unknown');
  expect(input({}, {}, { recommendation: { id: 3, status: 'viewed', target: { page: 'assessment' } } }).currentRecommendation.value)
    .toEqual({ id: 3, lifecycle: 'viewed', target: { type: 'assessment' } });
});
test.each([[{ loading: true }, 'loading'], [{ error: 'offline' }, 'error']])('preserves recommendation uncertainty', (value, state) => expect(input({}, {}, value).currentRecommendation.state).toBe(state));
test('old scope or revision cannot be restamped as current authority', () => {
  for (const guidanceStamp of [{ ...stamp, revision: 1 }, { ...stamp, scopeKey: '[42,"en"]' }, undefined]) {
    expect(input({ status: 'in_progress', attempt: { id: 7 }, guidanceStamp }).assessmentState.state).toBe('unknown');
  }
});
