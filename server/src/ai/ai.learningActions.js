const MAX_ACTIONS = 3;

const TOPIC_RESOURCE_CATEGORIES = {
  phishing_and_scams: ['Scams'],
  password_and_account_security: ['Passwords'],
  privacy_and_personal_information: ['Privacy'],
  misinformation_and_deepfakes: ['Misinformation', 'AI & Technology'],
};

const LABEL_KEYS = {
  resource: 'chat.actions.startResource',
  scenario: 'chat.actions.startScenario',
  progress: 'chat.actions.viewProgress',
  assessment: 'chat.actions.startAssessment',
  resources: 'chat.actions.openResources',
  scenarios: 'chat.actions.openScenarios',
};

function firstDefined(...values) {
  return values.find(value => value !== undefined && value !== null && value !== '');
}

function candidateTopic(learnerContext = {}) {
  return firstDefined(
    learnerContext.currentRecommendation?.topicCode,
    learnerContext.primaryFocus?.topicCode
  ) || null;
}

function pickResource(resources, topicCode) {
  const categories = TOPIC_RESOURCE_CATEGORIES[topicCode] || [];
  for (const category of categories) {
    const match = resources.find(resource => resource.category_code === category);
    if (match) return match;
  }
  return null;
}

function pickScenario(scenarios, topicCode) {
  const topicScenarios = scenarios.filter(scenario => scenario.topic_code === topicCode);
  return topicScenarios.find(scenario => Number(scenario.completed_count || 0) === 0) || null;
}

function sanitizeTitle(value) {
  if (!value) return null;
  const text = String(value).trim();
  return text ? text.slice(0, 255) : null;
}

function createResourceAction(resource) {
  if (!resource) {
    return {
      type: 'resources',
      labelKey: LABEL_KEYS.resources,
      title: null,
      description: 'Explore cybersecurity lessons at your own pace.',
      target: { page: 'resources' },
    };
  }

  return {
    type: 'resource',
    labelKey: LABEL_KEYS.resource,
    title: sanitizeTitle(resource.title),
    description: 'A short lesson for your recommended focus topic.',
    target: {
      page: 'resources',
      resourceId: Number(resource.id),
      resourceSlug: resource.slug,
    },
  };
}

function createScenarioAction(scenario) {
  if (!scenario) {
    return {
      type: 'scenarios',
      labelKey: LABEL_KEYS.scenarios,
      title: null,
      description: 'Practise with safe Cyberly scenarios.',
      target: { page: 'scenarios' },
    };
  }

  return {
    type: 'scenario',
    labelKey: LABEL_KEYS.scenario,
    title: sanitizeTitle(scenario.title),
    description: 'Practise this topic in a safe scenario.',
    target: {
      page: 'scenarios',
      scenarioId: Number(scenario.id),
      scenarioSlug: scenario.slug,
    },
  };
}

function createProgressAction(hasRecommendation) {
  return {
    type: 'progress',
    labelKey: LABEL_KEYS.progress,
    title: null,
    description: hasRecommendation
      ? 'Review your current recommendation and progress.'
      : 'Review your current learning progress.',
    target: {
      page: 'progress',
      sectionId: hasRecommendation ? 'progress-recommendation' : 'progress-snapshot',
    },
  };
}

function createAssessmentAction() {
  return {
    type: 'assessment',
    labelKey: LABEL_KEYS.assessment,
    title: null,
    description: 'Complete the assessment to unlock measured recommendations.',
    target: { page: 'assessment' },
  };
}

function dedupeAndCap(actions) {
  const seen = new Set();
  const result = [];
  for (const action of actions) {
    const key = `${action.type}:${JSON.stringify(action.target)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({ ...action, displayOrder: result.length + 1 });
    if (result.length >= MAX_ACTIONS) break;
  }
  return result;
}

function hasEvidence(learnerContext = {}) {
  return Boolean(
    learnerContext.currentRecommendation ||
    learnerContext.primaryFocus ||
    learnerContext.secondaryFocus?.length ||
    learnerContext.learnerLevel?.confidence !== 'Low'
  );
}

function buildLearningActions({ learnerContext = {}, resources = [], scenarios = [] } = {}) {
  const topicCode = candidateTopic(learnerContext);
  const hasRecommendation = Boolean(learnerContext.currentRecommendation);

  if (topicCode) {
    return dedupeAndCap([
      createResourceAction(pickResource(resources, topicCode)),
      createScenarioAction(pickScenario(scenarios, topicCode)),
      createProgressAction(hasRecommendation),
    ]);
  }

  return dedupeAndCap([
    hasEvidence(learnerContext) ? createProgressAction(false) : createAssessmentAction(),
    createResourceAction(null),
    createScenarioAction(null),
  ]);
}

module.exports = {
  TOPIC_RESOURCE_CATEGORIES,
  buildLearningActions,
};
