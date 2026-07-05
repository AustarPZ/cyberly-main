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

function createChatRepository(pool) {
  function db(connection) {
    return connection || pool;
  }

  async function listConversations(userId, limit, connection) {
    const [rows] = await db(connection).query(
      `SELECT ${CONVERSATION_COLUMNS}
       FROM chat_conversations c
       LEFT JOIN chat_messages m ON m.conversation_id = c.id
       WHERE c.user_id = ?
       GROUP BY c.id
       ORDER BY c.last_message_at DESC, c.id DESC
       LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }

  async function findConversation(userId, conversationId, connection) {
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

  async function createConversation(userId, conversation, connection) {
    const [result] = await db(connection).query(
      `INSERT INTO chat_conversations (user_id, title, locale)
       VALUES (?, ?, ?)`,
      [userId, conversation.title, conversation.locale]
    );
    return findConversation(userId, result.insertId, connection);
  }

  async function updateConversationTitle(userId, conversationId, title, connection) {
    const [result] = await db(connection).query(
      `UPDATE chat_conversations
       SET title = ?
       WHERE id = ? AND user_id = ?`,
      [title, conversationId, userId]
    );
    if (result.affectedRows === 0) return null;
    return findConversation(userId, conversationId, connection);
  }

  async function touchConversation(userId, conversationId, connection) {
    await db(connection).query(
      `UPDATE chat_conversations
       SET last_message_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [conversationId, userId]
    );
    return findConversation(userId, conversationId, connection);
  }

  async function deleteConversation(userId, conversationId, connection) {
    const [result] = await db(connection).query(
      `DELETE FROM chat_conversations
       WHERE id = ? AND user_id = ?`,
      [conversationId, userId]
    );
    return result.affectedRows > 0;
  }

  async function listMessages(conversationId, connection) {
    const [rows] = await db(connection).query(
      `SELECT id, conversation_id, role, content, reply_to_message_id, created_at
       FROM chat_messages
       WHERE conversation_id = ?
       ORDER BY id`,
      [conversationId]
    );
    return rows;
  }

  async function insertMessage(conversationId, message, connection) {
    const [result] = await db(connection).query(
      `INSERT INTO chat_messages (conversation_id, role, content)
       VALUES (?, ?, ?)`,
      [conversationId, message.role, message.content]
    );
    const [rows] = await db(connection).query(
      `SELECT id, conversation_id, role, content, reply_to_message_id, created_at
       FROM chat_messages
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );
    return rows[0] || null;
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
    createConversation,
    deleteConversation,
    findConversation,
    insertMessage,
    listConversations,
    listMessages,
    touchConversation,
    updateConversationTitle,
    withTransaction,
  };
}

module.exports = {
  createChatRepository,
};
