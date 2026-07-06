const CONVERSATION_COLUMNS = `
  c.id,
  c.user_id,
  c.title,
  c.locale,
  c.last_message_at,
  c.created_at,
  c.updated_at,
  COUNT(m.id) AS message_count
`;

function createAiRepository(pool) {
  function db(connection) {
    return connection || pool;
  }

  async function findConversationForUser(userId, conversationId, connection) {
    const [rows] = await db(connection).query(
      `SELECT ${CONVERSATION_COLUMNS}
       FROM chat_conversations c
       LEFT JOIN chat_messages m ON m.conversation_id = c.id
       WHERE c.id = ? AND c.user_id = ?
       GROUP BY c.id
       LIMIT 1`,
      [conversationId, userId]
    );
    return rows[0] || null;
  }

  async function findMessage(conversationId, messageId, connection) {
    const [rows] = await db(connection).query(
      `SELECT id, conversation_id, role, content, locale, reply_to_message_id, created_at
       FROM chat_messages
       WHERE id = ? AND conversation_id = ?
       LIMIT 1`,
      [messageId, conversationId]
    );
    return rows[0] || null;
  }

  async function listLatestMessages(conversationId, limit, connection) {
    const [rows] = await db(connection).query(
      `SELECT id, conversation_id, role, content, locale, reply_to_message_id, created_at
       FROM chat_messages
       WHERE conversation_id = ?
         AND role IN ('user', 'assistant')
       ORDER BY id DESC
       LIMIT ?`,
      [conversationId, limit]
    );
    return rows.reverse();
  }

  async function findGenerationByUserMessage(userMessageId, connection) {
    const [rows] = await db(connection).query(
      `SELECT *
       FROM chat_message_generations
       WHERE user_message_id = ?
       LIMIT 1`,
      [userMessageId]
    );
    return rows[0] || null;
  }

  async function createGeneration(conversationId, userMessageId, provider, model, connection) {
    await db(connection).query(
      `INSERT IGNORE INTO chat_message_generations (
          conversation_id,
          user_message_id,
          status,
          provider,
          model
       )
       VALUES (?, ?, 'pending', ?, ?)`,
      [conversationId, userMessageId, provider, model]
    );
    return findGenerationByUserMessage(userMessageId, connection);
  }

  async function markGenerationInProgress(generationId, connection) {
    await db(connection).query(
      `UPDATE chat_message_generations
       SET status = 'in_progress',
           error_code = NULL,
           provider_request_id = NULL,
           input_tokens = NULL,
           output_tokens = NULL,
           estimated_cost_usd = NULL,
           duration_ms = NULL,
           completed_at = NULL
       WHERE id = ?`,
      [generationId]
    );
    const [rows] = await db(connection).query('SELECT * FROM chat_message_generations WHERE id = ? LIMIT 1', [generationId]);
    return rows[0] || null;
  }

  async function markGenerationFailed(generationId, errorCode, durationMs, connection) {
    await db(connection).query(
      `UPDATE chat_message_generations
       SET status = 'failed',
           error_code = ?,
           duration_ms = ?
       WHERE id = ?`,
      [errorCode, durationMs, generationId]
    );
    const [rows] = await db(connection).query('SELECT * FROM chat_message_generations WHERE id = ? LIMIT 1', [generationId]);
    return rows[0] || null;
  }

  async function findAssistantMessage(messageId, connection) {
    if (!messageId) return null;
    const [rows] = await db(connection).query(
      `SELECT id, conversation_id, role, content, locale, reply_to_message_id, created_at
       FROM chat_messages
       WHERE id = ?
       LIMIT 1`,
      [messageId]
    );
    return rows[0] || null;
  }

  async function completeGeneration(userId, generation, assistant, usage, connection) {
    const [messageResult] = await db(connection).query(
      `INSERT INTO chat_messages (conversation_id, role, content, locale, reply_to_message_id)
       VALUES (?, 'assistant', ?, ?, ?)`,
      [generation.conversation_id, assistant.content, assistant.locale || null, generation.user_message_id]
    );

    await db(connection).query(
      `UPDATE chat_message_generations
       SET status = 'completed',
           assistant_message_id = ?,
           provider_request_id = ?,
           error_code = NULL,
           input_tokens = ?,
           output_tokens = ?,
           estimated_cost_usd = ?,
           duration_ms = ?,
           completed_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        messageResult.insertId,
        usage.providerRequestId,
        usage.inputTokens,
        usage.outputTokens,
        usage.estimatedCostUsd,
        usage.durationMs,
        generation.id,
      ]
    );

    await db(connection).query(
      `UPDATE chat_conversations
       SET last_message_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [generation.conversation_id, userId]
    );

    const [generationRows] = await db(connection).query('SELECT * FROM chat_message_generations WHERE id = ? LIMIT 1', [generation.id]);
    const [messageRows] = await db(connection).query(
      `SELECT id, conversation_id, role, content, locale, reply_to_message_id, created_at
       FROM chat_messages
       WHERE id = ?
       LIMIT 1`,
      [messageResult.insertId]
    );
    return {
      generation: generationRows[0] || null,
      assistantMessage: messageRows[0] || null,
      conversation: await findConversationForUser(userId, generation.conversation_id, connection),
    };
  }

  async function countInProgressForUser(userId, staleCutoff, connection) {
    const staleFilter = staleCutoff ? ' AND g.updated_at >= ?' : '';
    const params = staleCutoff ? [userId, staleCutoff] : [userId];
    const [rows] = await db(connection).query(
      `SELECT COUNT(*) AS count
       FROM chat_message_generations g
       JOIN chat_conversations c ON c.id = g.conversation_id
       WHERE c.user_id = ?
         AND g.status = 'in_progress'${staleFilter}`,
      params
    );
    return Number(rows[0]?.count || 0);
  }

  async function sumEstimatedCostToday(connection) {
    const [rows] = await db(connection).query(
      `SELECT COALESCE(SUM(estimated_cost_usd), 0) AS total
       FROM chat_message_generations
       WHERE completed_at >= CURRENT_DATE`
    );
    return Number(rows[0]?.total || 0);
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
    completeGeneration,
    countInProgressForUser,
    createGeneration,
    findAssistantMessage,
    findConversationForUser,
    findGenerationByUserMessage,
    findMessage,
    listLatestMessages,
    markGenerationFailed,
    markGenerationInProgress,
    sumEstimatedCostToday,
    withTransaction,
  };
}

module.exports = {
  createAiRepository,
};
