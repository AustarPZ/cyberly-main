import { normalizeLocale } from '../i18n/languageMappings';

export function dashboardGuidanceStamp(userId, locale, revision) {
  return { scopeKey: JSON.stringify([userId, normalizeLocale(locale)]), revision };
}

// Owner request provenance is checked before attaching the current render stamp.
// Never relabel values retained by React across a learner/locale/reload change.
export function dashboardGuidanceInput({ stamp, assessment, scenario, recommendation }) {
  function observe(owner, normalize) {
    const source = owner?.guidanceStamp;
    if (!source || source.scopeKey !== stamp.scopeKey || source.revision !== stamp.revision) return { state: 'unknown', stamp };
    if (owner.loading) return { state: 'loading', stamp };
    if (owner.error || owner.summaryError) return { state: 'error', retryable: true, stamp };
    return { ...normalize(owner), stamp };
  }
  return {
    requestState: { audience: 'learner', stamp },
    pageContext: { page: 'dashboard' },
    assessmentState: observe(assessment, owner => {
      if (owner.status === 'pending') return { state: 'ready', value: { state: 'pending' } };
      if (['in_progress', 'completed'].includes(owner.status)) return {
        state: 'ready', value: { state: owner.status, attemptId: owner.status === 'completed' ? owner.result?.attempt?.id : owner.attempt?.id },
      };
      return { state: 'unknown' };
    }),
    scenarioState: observe(scenario, owner => {
      const inventory = owner.dashboard?.inProgressAttempts;
      if (!Array.isArray(inventory)) return { state: 'unknown' };
      // Preserve every entry, including malformed identities, for frozen S1 validation.
      return { state: 'ready', value: { coverage: 'complete', unfinished: inventory.map(attempt => ({
        attemptId: attempt?.attemptId, scenarioSlug: attempt?.scenarioSlug,
      })) } };
    }),
    currentRecommendation: observe(recommendation, owner => {
      const value = owner.recommendation;
      if (value === null) return { state: 'empty-confirmed' };
      if (value === undefined) return { state: 'unknown' };
      return { state: 'ready', value: { id: value.id, lifecycle: value.status, target: recommendationTarget(value.target) } };
    }),
  };
}

function recommendationTarget(target) {
  if (!target) return null;
  if (target.page === 'scenarios' && target.scenarioSlug !== undefined) return { type: 'scenario_intro', scenarioSlug: target.scenarioSlug };
  if (target.page === 'scenarios' && target.scenarioId !== undefined) return null;
  if (['assessment', 'resources', 'scenarios'].includes(target.page)) return { type: target.page };
  if (target.page === 'progress') return { type: 'progress', sectionId: target.sectionId ?? null };
  return null;
}
