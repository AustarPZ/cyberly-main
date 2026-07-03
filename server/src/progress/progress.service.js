const { mapProgressSummary, mapRecommendation, mapTopicProgress } = require('./progress.mapper');
const { getLevelForPercentage, selectRecommendation } = require('./progress.rules');
const { normalizeLocale } = require('../i18n/locale');

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function calculateSummary(topicRows) {
  const completedTopicCount = topicRows.length;
  const totalActivityCount = topicRows.reduce((sum, topic) => sum + Number(topic.activity_count || 0), 0);
  const overallMasteryPercentage = completedTopicCount
    ? Math.round(topicRows.reduce((sum, topic) => sum + Number(topic.mastery_percentage), 0) / completedTopicCount)
    : 0;

  return {
    overallMasteryPercentage,
    measuredLevel: getLevelForPercentage(overallMasteryPercentage),
    completedTopicCount,
    totalActivityCount,
  };
}

function createProgressService(repository) {
  async function syncInitialAssessment(userId, attemptId, externalConnection, localeInput) {
    const locale = normalizeLocale(localeInput);
    const runner = async (connection) => {
      const attempt = await repository.findAttemptForUser(userId, attemptId, connection);
      if (!attempt) throw httpError(404, 'Completed initial assessment was not found.');

      const topicScores = await repository.listTopicScoresForAttempt(attempt.id, connection);
      if (topicScores.length === 0) throw httpError(400, 'Assessment topic scores are not available.');

      for (const topic of topicScores) {
        await repository.upsertTopicProgress(userId, {
          topicCode: topic.topic_code,
          currentLevel: getLevelForPercentage(topic.percentage),
          masteryPercentage: topic.percentage,
          sourceType: 'initial_assessment',
          sourceReferenceId: attempt.id,
        }, connection);
      }

      const topicProgressRows = await repository.listTopicProgress(userId, connection);
      const summary = calculateSummary(topicProgressRows);
      await repository.upsertSummary(userId, summary, connection);

      const recommendation = selectRecommendation(topicScores.map(topic => ({
        topicCode: topic.topic_code,
        percentage: topic.percentage,
        sourceReferenceId: attempt.id,
      })));

      await repository.supersedeActiveRecommendations(userId, connection);
      const savedRecommendation = await repository.createRecommendation(userId, recommendation, connection);

      return {
        summary: mapProgressSummary(await repository.getSummary(userId, connection)),
        topics: topicProgressRows.map(mapTopicProgress),
        recommendation: mapRecommendation(savedRecommendation, locale),
      };
    };

    if (externalConnection) return runner(externalConnection);
    return repository.withTransaction(runner);
  }

  async function syncLatestInitialAssessment(userId, localeInput) {
    const locale = normalizeLocale(localeInput);
    return repository.withTransaction(async (connection) => {
      const attempt = await repository.findLatestCompletedInitialAttempt(userId, connection);
      if (!attempt) {
        await repository.supersedeActiveRecommendations(userId, connection);
        const recommendation = await repository.createRecommendation(userId, selectRecommendation([]), connection);
        return {
          summary: mapProgressSummary(await repository.getSummary(userId, connection)),
          topics: (await repository.listTopicProgress(userId, connection)).map(mapTopicProgress),
          recommendation: mapRecommendation(recommendation, locale),
        };
      }
      return syncInitialAssessment(userId, attempt.id, connection, locale);
    });
  }

  async function getProgress(userId) {
    const [summary, topics, latestAttempt] = await Promise.all([
      repository.getSummary(userId),
      repository.listTopicProgress(userId),
      repository.findLatestCompletedInitialAttempt(userId),
    ]);

    return {
      summary: mapProgressSummary(summary),
      topics: topics.map(mapTopicProgress),
      latestCompletedAssessment: latestAttempt ? {
        attemptId: latestAttempt.id,
        completedAt: latestAttempt.completed_at ? new Date(latestAttempt.completed_at).toISOString() : null,
        measuredLevel: latestAttempt.measured_level,
        percentage: latestAttempt.percentage,
      } : null,
    };
  }

  async function getCurrentRecommendation(userId, localeInput) {
    const locale = normalizeLocale(localeInput);
    let recommendation = await repository.getCurrentRecommendation(userId);
    if (!recommendation) {
      const latestAttempt = await repository.findLatestCompletedInitialAttempt(userId);
      if (!latestAttempt) {
        const result = await syncLatestInitialAssessment(userId, locale);
        recommendation = result.recommendation;
        return { exists: true, recommendation };
      }
      const result = await syncInitialAssessment(userId, latestAttempt.id, undefined, locale);
      recommendation = result.recommendation;
      return { exists: true, recommendation };
    }
    return { exists: true, recommendation: mapRecommendation(recommendation, locale) };
  }

  async function markViewed(userId, id, localeInput) {
    const locale = normalizeLocale(localeInput);
    const recommendation = await repository.markRecommendationViewed(userId, Number(id));
    if (!recommendation || recommendation.user_id !== userId) throw httpError(404, 'Recommendation was not found.');
    return { recommendation: mapRecommendation(recommendation, locale) };
  }

  async function markCompleted(userId, id, localeInput) {
    const locale = normalizeLocale(localeInput);
    const recommendation = await repository.markRecommendationCompleted(userId, Number(id));
    if (!recommendation || recommendation.user_id !== userId) throw httpError(404, 'Recommendation was not found.');
    return { recommendation: mapRecommendation(recommendation, locale) };
  }

  async function applyScenarioCompletion(userId, scenarioResult, externalConnection, localeInput) {
    const locale = normalizeLocale(localeInput);
    const runner = async (connection) => {
      const existingEvent = await repository.getScenarioProgressEvent(scenarioResult.scenarioAttemptId, connection);
      if (existingEvent) {
        return {
          applied: false,
          masteryDelta: existingEvent.mastery_delta,
          summary: mapProgressSummary(await repository.getSummary(userId, connection)),
          topics: (await repository.listTopicProgress(userId, connection)).map(mapTopicProgress),
          recommendation: mapRecommendation(await repository.getCurrentRecommendation(userId, connection), locale),
        };
      }

      const masteryDelta = scenarioResult.masteryDelta;
      const wasCreated = await repository.createScenarioProgressEvent(userId, {
        scenarioAttemptId: scenarioResult.scenarioAttemptId,
        topicCode: scenarioResult.topicCode,
        masteryDelta,
      }, connection);

      if (wasCreated) {
        await repository.applyScenarioTopicProgress(userId, {
          topicCode: scenarioResult.topicCode,
          currentLevel: getLevelForPercentage(masteryDelta),
          masteryPercentage: masteryDelta,
          masteryDelta,
          sourceReferenceId: scenarioResult.scenarioAttemptId,
        }, connection);
      }

      const topicProgressRows = await repository.listTopicProgress(userId, connection);
      const summary = calculateSummary(topicProgressRows);
      await repository.upsertSummary(userId, summary, connection);

      const recommendation = selectRecommendation(topicProgressRows.map(topic => ({
        topicCode: topic.topic_code,
        percentage: topic.mastery_percentage,
        sourceReferenceId: scenarioResult.scenarioAttemptId,
      })));
      recommendation.sourceType = 'scenario';
      recommendation.sourceReferenceId = scenarioResult.scenarioAttemptId;

      await repository.supersedeActiveRecommendations(userId, connection);
      const savedRecommendation = await repository.createRecommendation(userId, recommendation, connection);

      return {
        applied: wasCreated,
        masteryDelta,
        summary: mapProgressSummary(await repository.getSummary(userId, connection)),
        topics: topicProgressRows.map(mapTopicProgress),
        recommendation: mapRecommendation(savedRecommendation, locale),
      };
    };

    if (externalConnection) return runner(externalConnection);
    return repository.withTransaction(runner);
  }

  return {
    applyScenarioCompletion,
    getCurrentRecommendation,
    getProgress,
    markCompleted,
    markViewed,
    syncInitialAssessment,
    syncLatestInitialAssessment,
  };
}

module.exports = {
  createProgressService,
};
