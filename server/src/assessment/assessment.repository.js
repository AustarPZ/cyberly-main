const INITIAL_SLUG = 'initial-cyber-wellness-v1';

function createAssessmentRepository(pool) {
  function db(connection) {
    return connection || pool;
  }

  async function getPublishedInitialAssessment(connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_definitions
       WHERE slug = ? AND assessment_type = 'initial' AND version = 1 AND status = 'published'
       LIMIT 1`,
      [INITIAL_SLUG]
    );
    return rows[0] || null;
  }

  async function listPublishedQuestions(assessmentId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_questions
       WHERE assessment_id = ? AND status = 'published'
       ORDER BY display_order`,
      [assessmentId]
    );
    return rows;
  }

  async function listTopics(assessmentId, connection) {
    const [rows] = await db(connection).query(
      `SELECT topic_code, COUNT(*) AS question_count
       FROM assessment_questions
       WHERE assessment_id = ? AND status = 'published'
       GROUP BY topic_code
       ORDER BY MIN(display_order)`,
      [assessmentId]
    );
    return rows;
  }

  async function findLatestCompletedAttempt(userId, assessmentId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_attempts
       WHERE user_id = ? AND assessment_id = ? AND status = 'completed'
       ORDER BY completed_at ASC, id ASC
       LIMIT 1`,
      [userId, assessmentId]
    );
    return rows[0] || null;
  }

  async function findInProgressAttempt(userId, assessmentId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_attempts
       WHERE user_id = ? AND assessment_id = ? AND status = 'in_progress'
       ORDER BY started_at DESC, id DESC
       LIMIT 1`,
      [userId, assessmentId]
    );
    return rows[0] || null;
  }

  async function createAttempt(userId, assessmentId, connection) {
    const [result] = await db(connection).query(
      `INSERT INTO assessment_attempts (user_id, assessment_id, status, maximum_score)
       VALUES (?, ?, 'in_progress', NULL)`,
      [userId, assessmentId]
    );
    return findAttemptById(result.insertId, connection);
  }

  async function findAttemptById(attemptId, connection) {
    const [rows] = await db(connection).query(
      'SELECT * FROM assessment_attempts WHERE id = ? LIMIT 1',
      [attemptId]
    );
    return rows[0] || null;
  }

  async function listAnswers(attemptId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_answers
       WHERE attempt_id = ?
       ORDER BY question_id`,
      [attemptId]
    );
    return rows;
  }

  async function findQuestionForAssessment(questionId, assessmentId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_questions
       WHERE id = ? AND assessment_id = ? AND status = 'published'
       LIMIT 1`,
      [questionId, assessmentId]
    );
    return rows[0] || null;
  }

  async function upsertAnswer(attemptId, questionId, selectedOptionKey, connection) {
    await db(connection).query(
      `INSERT INTO assessment_answers (attempt_id, question_id, selected_option_key, is_correct, awarded_score)
       VALUES (?, ?, ?, NULL, NULL)
       ON DUPLICATE KEY UPDATE
          selected_option_key = VALUES(selected_option_key),
          is_correct = NULL,
          awarded_score = NULL,
          answered_at = CURRENT_TIMESTAMP`,
      [attemptId, questionId, selectedOptionKey]
    );
  }

  async function updateAnswerScores(attemptId, scoredAnswers, connection) {
    for (const answer of scoredAnswers) {
      await db(connection).query(
        `UPDATE assessment_answers
         SET is_correct = ?, awarded_score = ?
         WHERE attempt_id = ? AND question_id = ?`,
        [answer.isCorrect, answer.awardedScore, attemptId, answer.questionId]
      );
    }
  }

  async function replaceTopicScores(attemptId, topicScores, connection) {
    await db(connection).query('DELETE FROM assessment_topic_scores WHERE attempt_id = ?', [attemptId]);
    for (const topic of topicScores) {
      await db(connection).query(
        `INSERT INTO assessment_topic_scores (attempt_id, topic_code, correct_count, total_count, percentage)
         VALUES (?, ?, ?, ?, ?)`,
        [attemptId, topic.topicCode, topic.correctCount, topic.totalCount, topic.percentage]
      );
    }
  }

  async function completeAttempt(attemptId, score, connection) {
    await db(connection).query(
      `UPDATE assessment_attempts
       SET status = 'completed',
           completed_at = CURRENT_TIMESTAMP,
           total_score = ?,
           maximum_score = ?,
           percentage = ?,
           measured_level = ?
       WHERE id = ? AND status = 'in_progress'`,
      [score.totalScore, score.maximumScore, score.percentage, score.measuredLevel, attemptId]
    );
    return findAttemptById(attemptId, connection);
  }

  async function listTopicScores(attemptId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM assessment_topic_scores
       WHERE attempt_id = ?
       ORDER BY topic_code`,
      [attemptId]
    );
    return rows;
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
    createAttempt,
    completeAttempt,
    findAttemptById,
    findInProgressAttempt,
    findLatestCompletedAttempt,
    findQuestionForAssessment,
    getPublishedInitialAssessment,
    listAnswers,
    listPublishedQuestions,
    listTopicScores,
    listTopics,
    replaceTopicScores,
    updateAnswerScores,
    upsertAnswer,
    withTransaction,
  };
}

module.exports = {
  INITIAL_SLUG,
  createAssessmentRepository,
};
