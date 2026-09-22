/**
 * Pure presentation contract. Callers establish authenticated ownership and
 * canonical provenance; an ID alone is not ownership evidence. Stamps and
 * coverage are caller normalization metadata, NOT new backend fields. The
 * current Scenario summary's LIMIT 1 cannot establish complete positive coverage.
 *
 * @typedef {{scopeKey: string, revision: number}} Stamp
 * @template T
 * @typedef {({state: 'loading'|'empty-confirmed'|'unknown', stamp: Stamp} |
 * {state: 'ready', stamp: Stamp, value: T} |
 * {state: 'error', stamp: Stamp, retryable: boolean})} Observation
 */
/**
 * @typedef {({state: 'pending'} | {state: 'in_progress'|'completed', attemptId: number})} Assessment
 * @typedef {{attemptId: number, scenarioSlug: string}} ScenarioAttempt
 * @typedef {{coverage: 'complete'|'partial', unfinished: ScenarioAttempt[]}} ScenarioSet
 * @typedef {({type: 'resources'|'scenarios'|'assessment'} |
 * {type: 'resource', resourceSlug: string} |
 * {type: 'scenario_intro', scenarioSlug: string} |
 * {type: 'progress', sectionId: string|null})} NavigationTarget
 * @typedef {{id: number, lifecycle: 'active'|'viewed'|'completed', target: NavigationTarget|null}} CanonicalRecommendation
 * @typedef {{resourceSlug: string, scenarioSlug: string}} EditorialRelation
 * @typedef {({page: 'dashboard'|'assessment'|'cyberguard'|'progress'} |
 * {page: 'assessment_result'|'scenario_attempt'|'scenario_result', attemptId: number} |
 * {page: 'scenario_intro', scenarioSlug: string} |
 * {page: 'resource', resourceSlug: string, readerState: 'loading'|'open'|'unavailable'|'error'})} PageContext
 * @typedef {{assessmentState: Observation<Assessment>, scenarioState: Observation<ScenarioSet>,
 * currentRecommendation: Observation<CanonicalRecommendation>, pageContext: PageContext,
 * requestState: {stamp: Stamp, audience: 'guest'|'learner'},
 * editorialRelation?: Observation<EditorialRelation>}} GuidanceInput
 * @typedef {'assessment'|'scenario'|'recommendation'|'resource'|'guidance'} Owner
 * @typedef {({type: 'assessment_attempt', attemptId: number} |
 * {type: 'scenario_attempt', attemptId: number, scenarioSlug: string} |
 * {type: 'recommendation', id: number} |
 * {type: 'resource_relation', resourceSlug: string, scenarioSlug: string} | null)} SourceIdentity
 * @typedef {(NavigationTarget | {type: 'resume_assessment', attemptId: number} |
 * {type: 'resume_scenario', attemptId: number, scenarioSlug: string} |
 * {type: 'request_owner_refresh', owner: 'assessment'|'scenario'|'recommendation'|'resource'})} ActionTarget
 * @typedef {'guidance.actions.browse'|'guidance.actions.resumeAssessment'|'guidance.actions.resumeScenario'|
 * 'guidance.actions.openRecommendation'|'guidance.actions.relatedPractice'|
 * 'guidance.actions.retryAssessment'|'guidance.actions.retryScenario'|
 * 'guidance.actions.retryRecommendation'|'guidance.actions.retryResource'} ActionKey
 * @typedef {{owner: Owner, sourceIdentity: SourceIdentity, actionKey: ActionKey, target: ActionTarget}} Action
 * @typedef {{owner: Owner, reason: 'unknown'|'error'|'stale'|'invalid_input'|'incomplete_coverage'|'unusable_target', state?: 'loading'}} Issue
 * @typedef {{stamp: Stamp, effect: 'none', secondaryActions: Action[]}} Common
 * @typedef {(Common & (
 * {kind: 'resume', action: Action, messageKey: 'guidance.resume'} |
 * {kind: 'resume_choice', choices: Action[], messageKey: 'guidance.resumeChoice'} |
 * {kind: 'recommendation', lifecycle: 'active'|'viewed', action: Action, messageKey: 'guidance.recommendation'} |
 * {kind: 'related', action: Action, messageKey: 'guidance.relatedPractice'} |
 * {kind: 'recovery', issues: Issue[], retryActions: Action[], messageKey: 'guidance.recovery'} |
 * {kind: 'browse', action: Action, messageKey: 'guidance.browse'} |
 * {kind: 'loading', owners: Owner[], messageKey: 'guidance.loading'} |
 * {kind: 'none', reason: 'already_at_target', messageKey: null}))} Guidance
 */

const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const isId = value => Number.isSafeInteger(value) && value > 0;
const isSlug = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,139}$/.test(value);
const isStamp = value => isRecord(value) && typeof value.scopeKey === 'string' && value.scopeKey.trim().length > 0
  && Number.isSafeInteger(value.revision) && value.revision >= 0;
const exactKeys = (value, keys) => Object.keys(value).length === keys.length && keys.every(key => Object.prototype.hasOwnProperty.call(value, key));
const browseAction = () => ({ owner: 'guidance', sourceIdentity: null, actionKey: 'guidance.actions.browse', target: { type: 'resources' } });
const retryKeys = {
  assessment: 'guidance.actions.retryAssessment', scenario: 'guidance.actions.retryScenario',
  recommendation: 'guidance.actions.retryRecommendation', resource: 'guidance.actions.retryResource',
};

function validPage(page) {
  if (!isRecord(page)) return false;
  switch (page.page) {
    case 'dashboard': case 'assessment': case 'cyberguard': case 'progress':
      return exactKeys(page, ['page']);
    case 'assessment_result': case 'scenario_attempt': case 'scenario_result':
      return exactKeys(page, ['page', 'attemptId']) && isId(page.attemptId);
    case 'scenario_intro':
      return exactKeys(page, ['page', 'scenarioSlug']) && isSlug(page.scenarioSlug);
    case 'resource':
      return exactKeys(page, ['page', 'resourceSlug', 'readerState']) && isSlug(page.resourceSlug)
        && ['loading', 'open', 'unavailable', 'error'].includes(page.readerState);
    default: return false;
  }
}

function navigationTarget(value) {
  if (!isRecord(value)) return null;
  switch (value.type) {
    case 'resources': case 'scenarios': case 'assessment':
      return exactKeys(value, ['type']) ? { type: value.type } : null;
    case 'resource':
      return exactKeys(value, ['type', 'resourceSlug']) && isSlug(value.resourceSlug)
        ? { type: 'resource', resourceSlug: value.resourceSlug } : null;
    case 'scenario_intro':
      return exactKeys(value, ['type', 'scenarioSlug']) && isSlug(value.scenarioSlug)
        ? { type: 'scenario_intro', scenarioSlug: value.scenarioSlug } : null;
    case 'progress':
      return exactKeys(value, ['type', 'sectionId']) && (value.sectionId === null || isSlug(value.sectionId))
        ? { type: 'progress', sectionId: value.sectionId } : null;
    default: return null;
  }
}

/**
 * Returns descriptors only. effect:none describes this function, not a future
 * learner-selected action. Refresh intents are never executed here (the existing
 * Current Recommendation request can reconcile records). No clock, I/O or imports.
 * The caller must discard output after its scope/revision changes.
 * @param {GuidanceInput} input
 * @returns {Guidance}
 */
export function resolveGuidance(input) {
  const suppliedStamp = input?.requestState?.stamp;
  // Invalid envelopes receive a non-authoritative sentinel and recovery only.
  const stamp = isStamp(suppliedStamp) ? { scopeKey: suppliedStamp.scopeKey, revision: suppliedStamp.revision }
    : { scopeKey: '', revision: 0 };
  const common = () => ({ stamp: { ...stamp }, effect: 'none', secondaryActions: [browseAction()] });
  const recovery = (issues, retryOwners = []) => ({
    ...common(), kind: 'recovery', messageKey: 'guidance.recovery', issues,
    retryActions: retryOwners.map(owner => ({ owner, sourceIdentity: null, actionKey: retryKeys[owner], target: { type: 'request_owner_refresh', owner } })),
  });
  if (!isRecord(input) || !isStamp(suppliedStamp) || !['guest', 'learner'].includes(input.requestState?.audience) || !validPage(input.pageContext)) {
    return recovery([{ owner: 'guidance', reason: 'invalid_input' }]);
  }
  const guest = input.requestState.audience === 'guest';
  const page = input.pageContext;

  // Each precedence tier checks all its required owners before selecting anything.
  function inspect(entries) {
    const issues = [];
    const loading = [];
    const retries = [];
    for (const [owner, observation] of entries) {
      if (!isRecord(observation) || !isStamp(observation.stamp)) {
        issues.push({ owner, reason: 'invalid_input' });
      } else if (observation.stamp.scopeKey !== stamp.scopeKey || observation.stamp.revision !== stamp.revision) {
        issues.push({ owner, reason: 'stale' });
      } else if (observation.state === 'error') {
        issues.push({ owner, reason: typeof observation.retryable === 'boolean' ? 'error' : 'invalid_input' });
        if (observation.retryable === true) retries.push(owner);
      } else if (observation.state === 'unknown') {
        issues.push({ owner, reason: 'unknown' });
      } else if (observation.state === 'loading') {
        loading.push(owner);
      } else if (!['ready', 'empty-confirmed'].includes(observation.state)) {
        issues.push({ owner, reason: 'invalid_input' });
      }
    }
    return { issues, loading, retries };
  }
  function blocked(check) {
    if (check.issues.length) return recovery(check.issues, check.retries);
    if (check.loading.length) {
      // Guests receive only public contextual recovery, never private loading.
      return guest ? recovery(check.loading.map(owner => ({ owner, reason: 'unknown', state: 'loading' })))
        : { ...common(), kind: 'loading', owners: check.loading, messageKey: 'guidance.loading' };
    }
    return null;
  }

  if (!guest) {
    const { assessmentState: assessment, scenarioState: scenarios } = input;
    const check = inspect([['assessment', assessment], ['scenario', scenarios]]);
    const choices = [];
    if (assessment?.state === 'empty-confirmed') check.issues.push({ owner: 'assessment', reason: 'unknown' });
    if (assessment?.state === 'ready' && !check.issues.some(issue => issue.owner === 'assessment')) {
      const value = assessment.value;
      if (!isRecord(value) || !['pending', 'in_progress', 'completed'].includes(value.state)
        || (value.state !== 'pending' && !isId(value.attemptId))) {
        check.issues.push({ owner: 'assessment', reason: 'invalid_input' });
      } else if (value.state === 'in_progress') {
        choices.push({ owner: 'assessment', sourceIdentity: { type: 'assessment_attempt', attemptId: value.attemptId },
          actionKey: 'guidance.actions.resumeAssessment', target: { type: 'resume_assessment', attemptId: value.attemptId } });
      }
    }
    if (scenarios?.state === 'ready' && !check.issues.some(issue => issue.owner === 'scenario')) {
      const value = scenarios.value;
      if (!isRecord(value) || !['complete', 'partial'].includes(value.coverage) || !Array.isArray(value.unfinished)) {
        check.issues.push({ owner: 'scenario', reason: 'invalid_input' });
      } else {
        const attempts = new Map();
        let invalid = false;
        for (const attempt of value.unfinished) {
          if (!isRecord(attempt) || !isId(attempt.attemptId) || !isSlug(attempt.scenarioSlug)
            || (attempts.has(attempt.attemptId) && attempts.get(attempt.attemptId) !== attempt.scenarioSlug)) {
            invalid = true;
          } else attempts.set(attempt.attemptId, attempt.scenarioSlug);
        }
        if (invalid) check.issues.push({ owner: 'scenario', reason: 'invalid_input' });
        if (value.coverage === 'partial') check.issues.push({ owner: 'scenario', reason: 'incomplete_coverage' });
        // Identity ordering is for stable keyboard order, never recommendation rank.
        [...attempts].sort(([a], [b]) => a - b).forEach(([attemptId, scenarioSlug]) => choices.push({
          owner: 'scenario', sourceIdentity: { type: 'scenario_attempt', attemptId, scenarioSlug },
          actionKey: 'guidance.actions.resumeScenario', target: { type: 'resume_scenario', attemptId, scenarioSlug },
        }));
      }
    }
    const activityBlock = blocked(check);
    if (activityBlock) return activityBlock;
    if (choices.length > 1) return { ...common(), kind: 'resume_choice', choices, messageKey: 'guidance.resumeChoice' };
    if (choices.length === 1) {
      const action = choices[0];
      if (page.page === 'scenario_attempt' && action.owner === 'scenario' && page.attemptId === action.target.attemptId) {
        return { ...common(), kind: 'none', reason: 'already_at_target', messageKey: null };
      }
      // Assessment page context has no attempt identity; page type cannot prove a self-target.
      return { ...common(), kind: 'resume', action, messageKey: 'guidance.resume' };
    }

    const recommendation = input.currentRecommendation;
    const recommendationBlock = blocked(inspect([['recommendation', recommendation]]));
    if (recommendationBlock) return recommendationBlock;
    if (recommendation.state === 'ready') {
      const value = recommendation.value;
      if (!isRecord(value) || !isId(value.id) || !['active', 'viewed', 'completed'].includes(value.lifecycle)) {
        return recovery([{ owner: 'recommendation', reason: 'invalid_input' }]);
      }
      if (value.lifecycle !== 'completed') {
        const target = navigationTarget(value.target);
        if (!target) return recovery([{ owner: 'recommendation', reason: 'unusable_target' }]);
        return { ...common(), kind: 'recommendation', lifecycle: value.lifecycle, messageKey: 'guidance.recommendation', action: {
          owner: 'recommendation', sourceIdentity: { type: 'recommendation', id: value.id }, actionKey: 'guidance.actions.openRecommendation', target,
        } };
      }
    }
  }

  if (page.page === 'resource') {
    if (page.readerState === 'loading') return guest ? recovery([{ owner: 'resource', reason: 'unknown', state: 'loading' }])
      : { ...common(), kind: 'loading', owners: ['resource'], messageKey: 'guidance.loading' };
    if (page.readerState !== 'open') return recovery([{ owner: 'resource', reason: page.readerState === 'error' ? 'error' : 'unusable_target' }]);
    const relation = input.editorialRelation;
    if (relation === undefined) return recovery([{ owner: 'resource', reason: 'unknown' }]);
    const relationBlock = blocked(inspect([['resource', relation]]));
    if (relationBlock) return relationBlock;
    if (relation.state === 'ready') {
      const value = relation.value;
      if (!isRecord(value) || !isSlug(value.resourceSlug) || !isSlug(value.scenarioSlug) || value.resourceSlug !== page.resourceSlug) {
        return recovery([{ owner: 'resource', reason: 'invalid_input' }]);
      }
      return { ...common(), kind: 'related', messageKey: 'guidance.relatedPractice', action: {
        owner: 'resource', sourceIdentity: { type: 'resource_relation', resourceSlug: value.resourceSlug, scenarioSlug: value.scenarioSlug },
        actionKey: 'guidance.actions.relatedPractice', target: { type: 'scenario_intro', scenarioSlug: value.scenarioSlug },
      } };
    }
  }
  return { ...common(), kind: 'browse', action: browseAction(), secondaryActions: [], messageKey: 'guidance.browse' };
}
