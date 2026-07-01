const {
  mapAttempt,
  mapCompletedResult,
  mapDecisionFeedback,
  mapSafeStep,
  mapScenarioMeta,
  parseOptions,
} = require('./scenario.mapper');
const { calculateScenarioScore, getMasteryDelta } = require('./scenario.scoring');
const {
  isValidDifficulty,
  isValidTopicCode,
  normalizeSlug,
  validateDecisionInput,
} = require('./scenario.validation');

const DIFFICULTY_ORDER = ['beginner', 'developing', 'intermediate', 'advanced'];

function httpError(status, message, errors) {
  const error = new Error(message);
  error.status = status;
  if (errors) error.errors = errors;
  return error;
}

function createScenarioService(repository, progressService) {
  async function listScenarios(userId, filters = {}) {
    const topicCode = filters.topicCode && isValidTopicCode(filters.topicCode) ? filters.topicCode : null;
    const difficulty = filters.difficulty && isValidDifficulty(filters.difficulty) ? filters.difficulty : null;
    const rows = await repository.listPublishedScenarios({ topicCode, difficulty }, userId);
    return {
      scenarios: rows.map(row => mapScenarioMeta(row, {
        latestAttempt: row.latest_attempt_id ? {
          id: row.latest_attempt_id,
          status: row.latest_attempt_status,
          resultLevel: row.latest_result_level,
          percentage: row.latest_percentage,
        } : null,
      })),
    };
  }

  async function getScenario(slug) {
    const scenario = await repository.findPublishedBySlug(normalizeSlug(slug));
    if (!scenario) throw httpError(404, 'Scenario was not found.');
    const firstStep = await repository.findStepByOrder(scenario.id, 1);
    return {
      scenario: mapScenarioMeta(scenario),
      firstStep: mapSafeStep(firstStep),
      choicesFinal: true,
    };
  }

  async function startOrResume(userId, slug) {
    return repository.withTransaction(async (connection) => {
      const scenario = await repository.findPublishedBySlug(normalizeSlug(slug), connection);
      if (!scenario) throw httpError(404, 'Scenario was not found.');
      let attempt = await repository.findInProgressAttempt(userId, scenario.id, connection);
      if (!attempt) attempt = await repository.createAttempt(userId, scenario.id, connection);
      const steps = await repository.listSteps(scenario.id, connection);
      const decisions = await repository.listDecisions(attempt.id, connection);
      const currentStep = decisions.length === steps.length
        ? null
        : steps.find(step => Number(step.step_order) === Number(attempt.current_step_order)) || steps[0];
      return mapAttempt(attempt, scenario, currentStep, decisions, steps);
    });
  }

  async function getAttempt(userId, attemptId) {
    const attempt = await repository.findAttemptById(Number(attemptId));
    if (!attempt || attempt.user_id !== userId) throw httpError(404, 'Scenario attempt was not found.');
    const scenario = await repository.findScenarioById(attempt.scenario_id);
    const steps = await repository.listSteps(scenario.id);
    const decisions = await repository.listDecisions(attempt.id);
    const currentStep = attempt.status === 'completed' || decisions.length === steps.length
      ? null
      : steps.find(step => Number(step.step_order) === Number(attempt.current_step_order));
    return mapAttempt(attempt, scenario, currentStep, decisions, steps);
  }

  async function saveDecision(userId, attemptId, body) {
    const validation = validateDecisionInput(body);
    if (!validation.ok) throw httpError(400, 'Decision details are invalid.', validation.errors);

    return repository.withTransaction(async (connection) => {
      const attempt = await repository.findAttemptById(Number(attemptId), connection);
      if (!attempt || attempt.user_id !== userId) throw httpError(404, 'Scenario attempt was not found.');
      if (attempt.status !== 'in_progress') throw httpError(409, 'Scenario attempt is already completed.');

      const scenario = await repository.findScenarioById(attempt.scenario_id, connection);
      const step = await repository.findStep(validation.value.stepId, connection);
      if (!step || step.scenario_id !== scenario.id) throw httpError(400, 'Step does not belong to this scenario.');
      if (Number(step.step_order) !== Number(attempt.current_step_order)) {
        throw httpError(409, 'Complete the current scenario step before moving ahead.');
      }

      const existingDecision = await repository.findDecision(attempt.id, step.id, connection);
      if (existingDecision) throw httpError(409, 'Scenario choices are final after submission.');

      const option = parseOptions(step.options_json).find(item => item.key === validation.value.selectedOptionKey);
      if (!option) throw httpError(400, 'Selected option is not valid for this step.');

      const decision = await repository.createDecision(attempt.id, {
        stepId: step.id,
        selectedOptionKey: option.key,
        awardedScore: Number(option.score),
        outcomeCode: option.outcomeCode,
      }, connection);

      const nextStepOrder = option.nextStepOrder || (Number(step.step_order) < Number(scenario.total_steps) ? Number(step.step_order) + 1 : null);
      const nextStep = nextStepOrder ? await repository.findStepByOrder(scenario.id, nextStepOrder, connection) : null;
      const updatedAttempt = await repository.updateCurrentStep(attempt.id, nextStep ? nextStep.step_order : scenario.total_steps, connection);

      return {
        attempt: {
          id: updatedAttempt.id,
          status: updatedAttempt.status,
          currentStepOrder: updatedAttempt.current_step_order,
        },
        decision: mapDecisionFeedback(decision, step),
        nextStep: mapSafeStep(nextStep),
        readyToComplete: !nextStep,
      };
    });
  }

  async function completeAttempt(userId, attemptId) {
    return repository.withTransaction(async (connection) => {
      const attempt = await repository.findAttemptById(Number(attemptId), connection);
      if (!attempt || attempt.user_id !== userId) throw httpError(404, 'Scenario attempt was not found.');
      const scenario = await repository.findScenarioById(attempt.scenario_id, connection);
      const steps = await repository.listSteps(scenario.id, connection);
      const decisions = await repository.listDecisions(attempt.id, connection);

      if (attempt.status === 'completed') {
        const existingImpact = await repository.getProgressEventForAttempt(attempt.id, connection);
        return mapCompletedResult(attempt, scenario, steps, decisions, {
          applied: false,
          masteryDelta: existingImpact?.mastery_delta || getMasteryDelta(attempt.percentage),
        }, (await progressService.getCurrentRecommendation(userId)).recommendation);
      }

      if (decisions.length !== steps.length) {
        throw httpError(409, 'All scenario steps must be answered before completion.');
      }

      const score = calculateScenarioScore(steps, decisions);
      const completedAttempt = await repository.completeAttempt(attempt.id, score, connection);
      const progressImpact = await progressService.applyScenarioCompletion(userId, {
        scenarioAttemptId: completedAttempt.id,
        topicCode: scenario.topic_code,
        percentage: score.percentage,
        masteryDelta: getMasteryDelta(score.percentage),
      }, connection);

      return mapCompletedResult(
        completedAttempt,
        scenario,
        steps,
        decisions,
        {
          applied: progressImpact.applied,
          masteryDelta: progressImpact.masteryDelta,
          summary: progressImpact.summary,
          topics: progressImpact.topics,
        },
        progressImpact.recommendation
      );
    });
  }

  async function getResult(userId, attemptId) {
    const attempt = await repository.findAttemptById(Number(attemptId));
    if (!attempt || attempt.user_id !== userId || attempt.status !== 'completed') {
      throw httpError(404, 'Completed scenario result was not found.');
    }
    const scenario = await repository.findScenarioById(attempt.scenario_id);
    const [steps, decisions, progressEvent, currentRecommendation] = await Promise.all([
      repository.listSteps(scenario.id),
      repository.listDecisions(attempt.id),
      repository.getProgressEventForAttempt(attempt.id),
      progressService.getCurrentRecommendation(userId),
    ]);
    return mapCompletedResult(attempt, scenario, steps, decisions, {
      applied: Boolean(progressEvent),
      masteryDelta: progressEvent?.mastery_delta || getMasteryDelta(attempt.percentage),
    }, currentRecommendation.recommendation);
  }

  async function getRecommendedScenarios(userId) {
    const currentRecommendation = await progressService.getCurrentRecommendation(userId);
    const recommendation = currentRecommendation.recommendation;
    if (!recommendation?.topicCode) return { recommendation, scenarios: [] };

    const all = (await repository.listPublishedScenarios({ topicCode: recommendation.topicCode }, userId))
      .map(row => mapScenarioMeta(row, {
        latestAttempt: row.latest_attempt_id ? {
          id: row.latest_attempt_id,
          status: row.latest_attempt_status,
          resultLevel: row.latest_result_level,
          percentage: row.latest_percentage,
        } : null,
      }));

    const target = recommendation.recommendedLevel || 'beginner';
    const targetIndex = DIFFICULTY_ORDER.indexOf(target);
    const ranked = [...all].sort((a, b) => {
      const ai = DIFFICULTY_ORDER.indexOf(a.difficulty);
      const bi = DIFFICULTY_ORDER.indexOf(b.difficulty);
      const aDistance = ai <= targetIndex ? targetIndex - ai : ai - targetIndex + 10;
      const bDistance = bi <= targetIndex ? targetIndex - bi : bi - targetIndex + 10;
      if (aDistance !== bDistance) return aDistance - bDistance;
      return ai - bi;
    });

    return { recommendation, scenarios: ranked.slice(0, 2) };
  }

  async function getScenarioDashboard(userId) {
    const stats = await repository.listCompletedScenarioStats(userId);
    return {
      completedCount: Number(stats.completedCount || 0),
      latestCompleted: stats.latestCompleted ? {
        attemptId: stats.latestCompleted.id,
        slug: stats.latestCompleted.slug,
        title: stats.latestCompleted.title,
        topicCode: stats.latestCompleted.topic_code,
        difficulty: stats.latestCompleted.difficulty,
        percentage: stats.latestCompleted.percentage,
        resultLevel: stats.latestCompleted.result_level,
      } : null,
      inProgress: stats.inProgress ? {
        attemptId: stats.inProgress.id,
        slug: stats.inProgress.slug,
        title: stats.inProgress.title,
        topicCode: stats.inProgress.topic_code,
        difficulty: stats.inProgress.difficulty,
        currentStepOrder: stats.inProgress.current_step_order,
      } : null,
    };
  }

  return {
    completeAttempt,
    getAttempt,
    getRecommendedScenarios,
    getResult,
    getScenario,
    getScenarioDashboard,
    listScenarios,
    saveDecision,
    startOrResume,
  };
}

module.exports = {
  createScenarioService,
};
