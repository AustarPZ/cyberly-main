const record = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const id = value => Number.isSafeInteger(value) && value > 0;
const slug = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,139}$/.test(value);
const keys = (value, names) => record(value) && Object.keys(value).length === names.length && names.every(name => Object.prototype.hasOwnProperty.call(value, name));
const handoffKeys = ['authScopeRevision', 'targetRevision', 'attemptId', 'scenarioSlug', 'acceptedNavigationGeneration'];
const stampKeys = [...handoffKeys, 'requestGeneration', 'locale'];

export function validScenarioResumeTarget(value) {
  return keys(value, ['type', 'attemptId', 'scenarioSlug']) && value.type === 'resume_scenario' && id(value.attemptId) && slug(value.scenarioSlug);
}

export function validScenarioResumeHandoff(value) {
  return keys(value, handoffKeys) && id(value.attemptId) && slug(value.scenarioSlug)
    && ['authScopeRevision', 'targetRevision', 'acceptedNavigationGeneration'].every(key => id(value[key]));
}

export function sameScenarioResumeContext(first, second) {
  return keys(first, stampKeys) && keys(second, stampKeys) && stampKeys.every(key => first[key] === second[key]);
}

// Returns a presentation reason, never a replacement target or an activity action.
export function validateScenarioResumeResponse(target, response) {
  if (!record(target) || !id(target.attemptId) || !slug(target.scenarioSlug)) return 'INVALID_TARGET';
  if (!response?.ok) {
    if (response?.status === 401) return 'AUTH_LOST';
    if (response?.status === 404) return 'NOT_FOUND_OR_FOREIGN';
    if (response?.network || response?.code === 'NETWORK_UNAVAILABLE' || response?.status >= 500) return 'NETWORK_ERROR';
    return 'REQUEST_REJECTED';
  }
  const { attempt, scenario, currentStep: step, decisions } = response;
  if (attempt?.id !== target.attemptId || scenario?.slug !== target.scenarioSlug) return 'IDENTITY_MISMATCH';
  if (attempt.status !== 'in_progress') return 'NOT_IN_PROGRESS';
  if (step === null) {
    if (!id(scenario.totalSteps) || attempt.currentStepOrder !== scenario.totalSteps
      || !Array.isArray(decisions) || decisions.length !== scenario.totalSteps) return 'INCONSISTENT_ATTEMPT';
    const readyIds = new Set();
    const readyOrders = new Set();
    for (const decision of decisions) {
      if (!record(decision) || !id(decision.stepId) || !id(decision.stepOrder)
        || typeof decision.selectedOptionKey !== 'string' || decision.selectedOptionKey.length < 1
        || decision.selectedOptionKey.length > 10 || decision.selectedOptionKey !== decision.selectedOptionKey.trim()
        || decision.stepOrder > scenario.totalSteps
        || readyIds.has(decision.stepId) || readyOrders.has(decision.stepOrder)) return 'INCONSISTENT_ATTEMPT';
      readyIds.add(decision.stepId);
      readyOrders.add(decision.stepOrder);
    }
    // N distinct positive orders bounded by N cover exactly 1..N.
    return null;
  }
  if (!id(scenario.totalSteps) || !record(step) || !id(step.id) || !id(step.stepOrder)
    || step.stepOrder !== attempt.currentStepOrder || step.stepOrder > scenario.totalSteps
    || !Array.isArray(step.options) || !step.options.length
    || step.options.some(option => !record(option) || typeof option.key !== 'string' || !option.key || typeof option.text !== 'string')
    || new Set(step.options.map(option => option.key)).size !== step.options.length
    || !Array.isArray(decisions)) return 'INCONSISTENT_ATTEMPT';
  const ids = new Set();
  const orders = new Set();
  for (const decision of decisions) {
    if (!record(decision) || !id(decision.stepId) || !id(decision.stepOrder) || decision.stepOrder > scenario.totalSteps
      || decision.stepId === step.id || decision.stepOrder === step.stepOrder
      || ids.has(decision.stepId) || orders.has(decision.stepOrder)) return 'INCONSISTENT_ATTEMPT';
    ids.add(decision.stepId);
    orders.add(decision.stepOrder);
  }
  return orders.size >= scenario.totalSteps ? 'INCONSISTENT_ATTEMPT' : null;
}
