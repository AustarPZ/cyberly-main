import { resolveGuidance } from './resolveGuidance';
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { transformSync } from '@babel/core';

const stamp = { scopeKey: 'controlled-session', revision: 1 };
const observation = (state, extra = {}) => ({ state, stamp: { ...stamp }, ...extra });
const ready = value => observation('ready', { value });
const scenario = (attemptId = 2, scenarioSlug = 'parcel-sms') => ({ attemptId, scenarioSlug });
const complete = (...unfinished) => ready({ coverage: 'complete', unfinished });
const recommendation = (target = { type: 'scenario_intro', scenarioSlug: 'parcel-sms' }, lifecycle = 'active') =>
  ready({ id: 10, lifecycle, target });
const input = (overrides = {}) => ({
  assessmentState: ready({ state: 'pending' }),
  scenarioState: observation('empty-confirmed'),
  currentRecommendation: observation('empty-confirmed'),
  pageContext: { page: 'dashboard' },
  requestState: { stamp: { ...stamp }, audience: 'learner' },
  ...overrides,
});
const resource = (overrides = {}) => input({
  pageContext: { page: 'resource', resourceSlug: 'phishing', readerState: 'open' },
  editorialRelation: ready({ resourceSlug: 'phishing', scenarioSlug: 'parcel-sms' }),
  ...overrides,
});
const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze);
    Object.freeze(value);
  }
  return value;
};

describe('resolveGuidance authority and precedence', () => {
  test('resumes the one owned Assessment without turning pending into resume', () => {
    const result = resolveGuidance(input({ assessmentState: ready({ state: 'in_progress', attemptId: 1 }) }));
    expect(result).toMatchObject({ kind: 'resume', effect: 'none', action: {
      owner: 'assessment', sourceIdentity: { type: 'assessment_attempt', attemptId: 1 },
      target: { type: 'resume_assessment', attemptId: 1 }, actionKey: 'guidance.actions.resumeAssessment',
    } });
    expect(resolveGuidance(input()).kind).toBe('browse');
  });

  test('resumes the exact sole Scenario ahead of a recommendation', () => {
    const result = resolveGuidance(input({ scenarioState: complete(scenario()), currentRecommendation: recommendation() }));
    expect(result).toMatchObject({ kind: 'resume', action: {
      owner: 'scenario', sourceIdentity: { type: 'scenario_attempt', attemptId: 2, scenarioSlug: 'parcel-sms' },
      target: { type: 'resume_scenario', attemptId: 2, scenarioSlug: 'parcel-sms' },
    } });
  });

  test('offers Assessment and Scenario as equal choices with no default action', () => {
    const result = resolveGuidance(input({ assessmentState: ready({ state: 'in_progress', attemptId: 1 }), scenarioState: complete(scenario()) }));
    expect(result.kind).toBe('resume_choice');
    expect(result.choices.map(choice => choice.target)).toEqual([
      { type: 'resume_assessment', attemptId: 1 },
      { type: 'resume_scenario', attemptId: 2, scenarioSlug: 'parcel-sms' },
    ]);
    expect(result).not.toHaveProperty('action');
    expect(result).not.toHaveProperty('defaultChoice');
  });

  test('orders all complete Scenario choices by identity, not input recency', () => {
    const result = resolveGuidance(input({ scenarioState: complete(scenario(9), scenario(2)) }));
    expect(result.kind).toBe('resume_choice');
    expect(result.choices.map(choice => choice.target.attemptId)).toEqual([2, 9]);
  });

  test.each([[[]], [[scenario()]], [[scenario(2), scenario(3)]]])('partial coverage never establishes global cardinality: %j', items => {
    const result = resolveGuidance(input({ scenarioState: ready({ coverage: 'partial', unfinished: items }), currentRecommendation: recommendation() }));
    expect(result).toMatchObject({ kind: 'recovery', issues: [{ owner: 'scenario', reason: 'incomplete_coverage' }] });
  });

  test('deduplicates exact attempts but rejects conflicting identities', () => {
    expect(resolveGuidance(input({ scenarioState: complete(scenario(), scenario()) })).kind).toBe('resume');
    expect(resolveGuidance(input({ scenarioState: complete(scenario(), scenario(2, 'other')) }))).toMatchObject({ kind: 'recovery', issues: [{ reason: 'invalid_input' }] });
  });

  test.each(['active', 'viewed'])('preserves canonical %s recommendation identity', lifecycle => {
    expect(resolveGuidance(input({ currentRecommendation: recommendation(undefined, lifecycle) }))).toMatchObject({
      kind: 'recommendation', lifecycle, action: { owner: 'recommendation', sourceIdentity: { type: 'recommendation', id: 10 }, target: { type: 'scenario_intro', scenarioSlug: 'parcel-sms' } },
    });
  });

  test('completed recommendation does not imply Resource or Scenario completion', () => {
    const result = resolveGuidance(resource({ currentRecommendation: recommendation(null, 'completed') }));
    expect(result.kind).toBe('related');
    expect(result.action.target).toEqual({ type: 'scenario_intro', scenarioSlug: 'parcel-sms' });
  });

  test('matching Resource relation opens introduction only', () => {
    expect(resolveGuidance(resource())).toMatchObject({ kind: 'related', action: {
      owner: 'resource', sourceIdentity: { type: 'resource_relation', resourceSlug: 'phishing', scenarioSlug: 'parcel-sms' },
      target: { type: 'scenario_intro', scenarioSlug: 'parcel-sms' },
    } });
  });

  test('does not promote an editorial relation globally or onto another Resource', () => {
    expect(resolveGuidance(resource({ pageContext: { page: 'dashboard' } })).kind).toBe('browse');
    const result = resolveGuidance(resource({ editorialRelation: ready({ resourceSlug: 'other', scenarioSlug: 'parcel-sms' }) }));
    expect(result.kind).toBe('recovery');
    expect(result).not.toHaveProperty('action');
  });

  test.each([null, {}, { type: 'scenario_intro', scenarioSlug: '../evil' }, { type: 'resource', resourceSlug: 'bad/route' },
    { type: 'resources', scenarioSlug: 'conflict' }, { type: 'progress', sectionId: '<script>' }, { type: 'start_scenario', attemptId: 2 }])('rejects unusable canonical target %j', target => {
    expect(resolveGuidance(resource({ currentRecommendation: recommendation(target) }))).toMatchObject({ kind: 'recovery', issues: [{ owner: 'recommendation', reason: 'unusable_target' }] });
  });

  test.each(['unknown', 'error'])('retains %s blockers from both activity owners', state => {
    const result = resolveGuidance(input({ assessmentState: observation(state, { retryable: true }), scenarioState: observation(state, { retryable: false }), currentRecommendation: recommendation() }));
    expect(result.kind).toBe('recovery');
    expect(result.issues).toEqual([{ owner: 'assessment', reason: state }, { owner: 'scenario', reason: state }]);
    expect(result.retryActions.length).toBe(state === 'error' ? 1 : 0);
  });

  test('recommendation failure cannot fall through to related or browse', () => {
    expect(resolveGuidance(resource({ currentRecommendation: observation('error', { retryable: true }) }))).toMatchObject({ kind: 'recovery', issues: [{ owner: 'recommendation', reason: 'error' }] });
  });

  test('confirmed absence permits exploration without requiring Assessment', () => {
    expect(resolveGuidance(input())).toMatchObject({ kind: 'browse', messageKey: 'guidance.browse', action: { target: { type: 'resources' } } });
    expect(resolveGuidance(input({ assessmentState: observation('empty-confirmed') })).kind).toBe('recovery');
  });

  test('waits only for required owners and reports errors instead of hiding behind loading', () => {
    expect(resolveGuidance(input({ scenarioState: observation('loading') }))).toMatchObject({ kind: 'loading', owners: ['scenario'] });
    expect(resolveGuidance(input({ scenarioState: complete(scenario()), currentRecommendation: observation('loading') })).kind).toBe('resume');
    expect(resolveGuidance(input({ scenarioState: observation('loading'), assessmentState: observation('error', { retryable: false }) })).kind).toBe('recovery');
    expect(resolveGuidance(input({ currentRecommendation: observation('loading') })).kind).toBe('loading');
  });

  test('guests ignore private observations without changing them into empty evidence', () => {
    const value = resource({ requestState: { stamp, audience: 'guest' }, assessmentState: observation('error'), scenarioState: observation('unknown'), currentRecommendation: recommendation() });
    freeze(value);
    expect(resolveGuidance(value).kind).toBe('related');
    expect(value.scenarioState.state).toBe('unknown');
    expect(resolveGuidance({ ...value, pageContext: { page: 'dashboard' } }).kind).toBe('browse');
  });

  test.each(['unavailable', 'error', 'loading'])('Resource %s cannot expose a stale relation', readerState => {
    const result = resolveGuidance(resource({ pageContext: { page: 'resource', resourceSlug: 'phishing', readerState }, requestState: { stamp, audience: 'guest' } }));
    expect(result.kind).toBe('recovery');
    expect(result).not.toHaveProperty('action');
  });

  test.each(['completed', 'in_progress', 'percentageRead', 'markRead', 'resumeReading'])('does not accept Resource state %s', readerState => {
    expect(resolveGuidance(resource({ pageContext: { page: 'resource', resourceSlug: 'phishing', readerState } })).kind).toBe('recovery');
  });

  test.each([{ scopeKey: 'previous-session', revision: 1 }, { scopeKey: stamp.scopeKey, revision: 0 }])('rejects stale scope/revision %j', staleStamp => {
    const result = resolveGuidance(input({ scenarioState: { ...complete(scenario()), stamp: staleStamp } }));
    expect(result).toMatchObject({ kind: 'recovery', issues: [{ owner: 'scenario', reason: 'stale' }] });
    expect(result).not.toHaveProperty('action');
  });

  test('suppresses only the exact displayed attempt, not just the page type', () => {
    expect(resolveGuidance(input({ scenarioState: complete(scenario()), pageContext: { page: 'scenario_attempt', attemptId: 2 } }))).toMatchObject({ kind: 'none', reason: 'already_at_target' });
    expect(resolveGuidance(input({ scenarioState: complete(scenario()), pageContext: { page: 'scenario_attempt', attemptId: 3 } })).kind).toBe('resume');
    expect(resolveGuidance(input({ assessmentState: ready({ state: 'in_progress', attemptId: 1 }), pageContext: { page: 'assessment' } })).kind).toBe('resume');
  });

  test('locale-specific titles never change identities or select a different action', () => {
    const results = ['Parcel message', 'Mesej bungkusan', '包裹信息'].map(title => resolveGuidance(input({ scenarioState: complete({ ...scenario(), title }) })));
    expect(results[1]).toEqual(results[0]);
    expect(results[2]).toEqual(results[0]);
    expect(results[0].action.target).toEqual({ type: 'resume_scenario', attemptId: 2, scenarioSlug: 'parcel-sms' });
  });

  test('is deterministic, accepts frozen inputs, and outputs no mutable input aliases', () => {
    const value = freeze(resource());
    const first = resolveGuidance(value);
    expect(resolveGuidance(value)).toEqual(first);
    first.stamp.revision = 999;
    first.action.target.scenarioSlug = 'changed';
    expect(value.requestState.stamp.revision).toBe(1);
    expect(resolveGuidance(value).action.target.scenarioSlug).toBe('parcel-sms');
  });

  test('performs no network, storage, clock, timer, random or history effects', () => {
    const fail = () => { throw new Error('Forbidden resolver effect'); };
    const spies = [jest.spyOn(Date, 'now'), jest.spyOn(Math, 'random'), jest.spyOn(global, 'setTimeout'),
      jest.spyOn(global, 'setInterval'), jest.spyOn(Storage.prototype, 'getItem'), jest.spyOn(Storage.prototype, 'setItem'),
      jest.spyOn(Storage.prototype, 'removeItem'), jest.spyOn(window.history, 'pushState'), jest.spyOn(window.history, 'replaceState'),
      jest.spyOn(XMLHttpRequest.prototype, 'open')];
    const oldFetch = global.fetch;
    const href = window.location.href;
    try {
      spies.forEach(spy => spy.mockImplementation(fail));
      global.fetch = fail;
      [input(), resource(), input({ scenarioState: complete(scenario()) }), input({ currentRecommendation: recommendation() }),
        input({ scenarioState: observation('error', { retryable: true }) })].forEach(value => {
        expect(resolveGuidance(freeze(value)).effect).toBe('none');
      });
      expect(window.location.href).toBe(href);
    } finally {
      spies.forEach(spy => spy.mockRestore());
      if (oldFetch === undefined) delete global.fetch;
      else global.fetch = oldFetch;
    }
  });

  test('optional Assessment adds no prerequisite action; recovery retains exploration', () => {
    const result = resolveGuidance(input({ assessmentState: observation('unknown') }));
    expect(result.secondaryActions).toEqual([{ owner: 'guidance', sourceIdentity: null, actionKey: 'guidance.actions.browse', target: { type: 'resources' } }]);
    expect(resolveGuidance(input()).action.target).toEqual({ type: 'resources' });
  });

  test.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, '1'])('rejects invalid attempt ID %j', attemptId => {
    expect(resolveGuidance(input({ assessmentState: ready({ state: 'in_progress', attemptId }) })).kind).toBe('recovery');
  });

  test.each(['invented', undefined])('rejects unknown observation discriminator %j', state => {
    expect(resolveGuidance(input({ scenarioState: observation(state) })).kind).toBe('recovery');
  });

  test('rejects invalid lifecycle, malformed input and malformed stamps without guessing', () => {
    expect(resolveGuidance(input({ currentRecommendation: recommendation(undefined, 'mastered') })).kind).toBe('recovery');
    expect(resolveGuidance(null).kind).toBe('recovery');
    expect(resolveGuidance(input({ requestState: { audience: 'learner', stamp: { scopeKey: '', revision: -1 } } })).kind).toBe('recovery');
  });

  test.each([
    { type: 'resources' }, { type: 'scenarios' }, { type: 'assessment' },
    { type: 'resource', resourceSlug: 'protect-privacy' },
    { type: 'progress', sectionId: 'learning-path' }, { type: 'progress', sectionId: null },
  ])('preserves a validated canonical target without inventing routing: %j', target => {
    const result = resolveGuidance(input({ currentRecommendation: recommendation(target) }));
    expect(result.kind).toBe('recommendation');
    expect(result.action.target).toEqual(target);
    expect(result.action.target).not.toBe(target);
  });

  test('does not use stale recommendation or Resource relationship identities', () => {
    const oldStamp = { scopeKey: 'previous-session', revision: 1 };
    expect(resolveGuidance(input({ currentRecommendation: { ...recommendation(), stamp: oldStamp } }))).toMatchObject({ kind: 'recovery', issues: [{ owner: 'recommendation', reason: 'stale' }] });
    expect(resolveGuidance(resource({ editorialRelation: { ...resource().editorialRelation, stamp: oldStamp } }))).toMatchObject({ kind: 'recovery', issues: [{ owner: 'resource', reason: 'stale' }] });
  });

  test('missing relation remains unknown while confirmed absence permits browsing', () => {
    expect(resolveGuidance(resource({ editorialRelation: undefined }))).toMatchObject({ kind: 'recovery', issues: [{ owner: 'resource', reason: 'unknown' }] });
    expect(resolveGuidance(resource({ editorialRelation: observation('empty-confirmed') })).kind).toBe('browse');
    expect(resolveGuidance(resource({ editorialRelation: observation('loading') }))).toMatchObject({ kind: 'loading', owners: ['resource'] });
    expect(resolveGuidance(resource({ editorialRelation: observation('error', { retryable: true }) }))).toMatchObject({ kind: 'recovery', retryActions: [{ target: { type: 'request_owner_refresh', owner: 'resource' } }] });
  });

  test('guest recovery preserves a public loading observation rather than relabelling it unknown', () => {
    const requestState = { stamp, audience: 'guest' };
    expect(resolveGuidance(resource({ requestState, editorialRelation: observation('loading') }))).toMatchObject({
      kind: 'recovery', issues: [{ owner: 'resource', reason: 'unknown', state: 'loading' }],
    });
    expect(resolveGuidance(resource({ requestState, pageContext: { page: 'resource', resourceSlug: 'phishing', readerState: 'loading' } }))).toMatchObject({
      kind: 'recovery', issues: [{ owner: 'resource', reason: 'unknown', state: 'loading' }],
    });
  });

  test('loads and executes in isolation without API/AI imports or browser/global capabilities', () => {
    const source = fs.readFileSync(path.join(__dirname, 'resolveGuidance.js'), 'utf8');
    const { code } = transformSync(source, { babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] });
    const unavailable = () => { throw new Error('External capability used'); };
    const sandbox = { exports: {}, require: unavailable };
    for (const key of ['fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage', 'window', 'document', 'history',
      'location', 'Date', 'Math', 'setTimeout', 'setInterval', 'requestAnimationFrame', 'process']) {
      Object.defineProperty(sandbox, key, { get: unavailable });
    }
    vm.runInNewContext(code, sandbox);
    const isolated = sandbox.exports.resolveGuidance;
    const cases = [input(), resource(), input({ scenarioState: complete(scenario()) }),
      input({ scenarioState: complete(scenario(2), scenario(3)) }), input({ currentRecommendation: recommendation() }),
      input({ scenarioState: observation('loading') }), input({ scenarioState: observation('error', { retryable: true }) }),
      input({ scenarioState: complete(scenario()), pageContext: { page: 'scenario_attempt', attemptId: 2 } })];
    expect(cases.map(value => isolated(freeze(value)).kind)).toEqual(['browse', 'related', 'resume', 'resume_choice', 'recommendation', 'loading', 'recovery', 'none']);
  });
});
