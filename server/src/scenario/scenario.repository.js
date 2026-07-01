function createScenarioRepository(pool) {
  function db(connection) {
    return connection || pool;
  }

  async function listPublishedScenarios(filters = {}, userId, connection) {
    const conditions = ["sd.status = 'published'"];
    const params = [];
    if (filters.topicCode) {
      conditions.push('sd.topic_code = ?');
      params.push(filters.topicCode);
    }
    if (filters.difficulty) {
      conditions.push('sd.difficulty = ?');
      params.push(filters.difficulty);
    }

    const [rows] = await db(connection).query(
      `SELECT sd.*,
              latest.id AS latest_attempt_id,
              latest.status AS latest_attempt_status,
              latest.result_level AS latest_result_level,
              latest.percentage AS latest_percentage
       FROM scenario_definitions sd
       LEFT JOIN (
         SELECT sa.*
         FROM scenario_attempts sa
         JOIN (
           SELECT scenario_id, MAX(id) AS id
           FROM scenario_attempts
           WHERE user_id = ?
           GROUP BY scenario_id
         ) pick ON pick.id = sa.id
       ) latest ON latest.scenario_id = sd.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY FIELD(sd.topic_code,
          'phishing_and_scams',
          'password_and_account_security',
          'privacy_and_personal_information',
          'misinformation_and_deepfakes'
       ), FIELD(sd.difficulty, 'beginner', 'developing', 'intermediate', 'advanced'), sd.id`,
      [userId, ...params]
    );
    return rows;
  }

  async function findPublishedBySlug(slug, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM scenario_definitions
       WHERE slug = ? AND status = 'published'
       ORDER BY version DESC
       LIMIT 1`,
      [slug]
    );
    return rows[0] || null;
  }

  async function findScenarioById(id, connection) {
    const [rows] = await db(connection).query(
      'SELECT * FROM scenario_definitions WHERE id = ? LIMIT 1',
      [id]
    );
    return rows[0] || null;
  }

  async function listSteps(scenarioId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM scenario_steps
       WHERE scenario_id = ?
       ORDER BY step_order`,
      [scenarioId]
    );
    return rows;
  }

  async function findStep(stepId, connection) {
    const [rows] = await db(connection).query(
      'SELECT * FROM scenario_steps WHERE id = ? LIMIT 1',
      [stepId]
    );
    return rows[0] || null;
  }

  async function findStepByOrder(scenarioId, stepOrder, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM scenario_steps
       WHERE scenario_id = ? AND step_order = ?
       LIMIT 1`,
      [scenarioId, stepOrder]
    );
    return rows[0] || null;
  }

  async function findInProgressAttempt(userId, scenarioId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM scenario_attempts
       WHERE user_id = ? AND scenario_id = ? AND status = 'in_progress'
       ORDER BY started_at DESC, id DESC
       LIMIT 1`,
      [userId, scenarioId]
    );
    return rows[0] || null;
  }

  async function createAttempt(userId, scenarioId, connection) {
    const [result] = await db(connection).query(
      `INSERT INTO scenario_attempts (user_id, scenario_id, status, current_step_order)
       VALUES (?, ?, 'in_progress', 1)`,
      [userId, scenarioId]
    );
    return findAttemptById(result.insertId, connection);
  }

  async function findAttemptById(attemptId, connection) {
    const [rows] = await db(connection).query(
      'SELECT * FROM scenario_attempts WHERE id = ? LIMIT 1',
      [attemptId]
    );
    return rows[0] || null;
  }

  async function listDecisions(attemptId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM scenario_decisions
       WHERE attempt_id = ?
       ORDER BY id`,
      [attemptId]
    );
    return rows;
  }

  async function findDecision(attemptId, stepId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM scenario_decisions
       WHERE attempt_id = ? AND step_id = ?
       LIMIT 1`,
      [attemptId, stepId]
    );
    return rows[0] || null;
  }

  async function createDecision(attemptId, decision, connection) {
    const [result] = await db(connection).query(
      `INSERT INTO scenario_decisions (attempt_id, step_id, selected_option_key, awarded_score, outcome_code)
       VALUES (?, ?, ?, ?, ?)`,
      [
        attemptId,
        decision.stepId,
        decision.selectedOptionKey,
        decision.awardedScore,
        decision.outcomeCode,
      ]
    );
    const [rows] = await db(connection).query(
      'SELECT * FROM scenario_decisions WHERE id = ? LIMIT 1',
      [result.insertId]
    );
    return rows[0];
  }

  async function updateCurrentStep(attemptId, currentStepOrder, connection) {
    await db(connection).query(
      `UPDATE scenario_attempts
       SET current_step_order = ?
       WHERE id = ? AND status = 'in_progress'`,
      [currentStepOrder, attemptId]
    );
    return findAttemptById(attemptId, connection);
  }

  async function completeAttempt(attemptId, score, connection) {
    await db(connection).query(
      `UPDATE scenario_attempts
       SET status = 'completed',
           current_step_order = current_step_order,
           total_score = ?,
           maximum_score = ?,
           percentage = ?,
           result_level = ?,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'in_progress'`,
      [score.totalScore, score.maximumScore, score.percentage, score.resultLevel, attemptId]
    );
    return findAttemptById(attemptId, connection);
  }

  async function getProgressEventForAttempt(attemptId, connection) {
    const [rows] = await db(connection).query(
      'SELECT * FROM scenario_progress_events WHERE scenario_attempt_id = ? LIMIT 1',
      [attemptId]
    );
    return rows[0] || null;
  }

  async function listCompletedScenarioStats(userId, connection) {
    const [rows] = await db(connection).query(
      `SELECT COUNT(*) AS completed_count
       FROM scenario_attempts
       WHERE user_id = ? AND status = 'completed'`,
      [userId]
    );
    const [latest] = await db(connection).query(
      `SELECT sa.*, sd.title, sd.slug, sd.topic_code, sd.difficulty
       FROM scenario_attempts sa
       JOIN scenario_definitions sd ON sd.id = sa.scenario_id
       WHERE sa.user_id = ? AND sa.status = 'completed'
       ORDER BY sa.completed_at DESC, sa.id DESC
       LIMIT 1`,
      [userId]
    );
    const [inProgress] = await db(connection).query(
      `SELECT sa.*, sd.title, sd.slug, sd.topic_code, sd.difficulty
       FROM scenario_attempts sa
       JOIN scenario_definitions sd ON sd.id = sa.scenario_id
       WHERE sa.user_id = ? AND sa.status = 'in_progress'
       ORDER BY sa.started_at DESC, sa.id DESC
       LIMIT 1`,
      [userId]
    );
    return {
      completedCount: rows[0].completed_count,
      latestCompleted: latest[0] || null,
      inProgress: inProgress[0] || null,
    };
  }

  async function withTransaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  return {
    completeAttempt,
    createAttempt,
    createDecision,
    findAttemptById,
    findDecision,
    findInProgressAttempt,
    findPublishedBySlug,
    findScenarioById,
    findStep,
    findStepByOrder,
    getProgressEventForAttempt,
    listCompletedScenarioStats,
    listDecisions,
    listPublishedScenarios,
    listSteps,
    updateCurrentStep,
    withTransaction,
  };
}

module.exports = {
  createScenarioRepository,
};
