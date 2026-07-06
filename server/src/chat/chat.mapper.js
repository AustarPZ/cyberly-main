const { ERROR_CODES } = require('../errors/errorCodes');

function toIso(value) {
  if (!value) return null;
  return new Date(value).toISOString();
}

function mapConversation(row) {
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    locale: row.locale,
    messageCount: Number(row.message_count || 0),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    lastMessageAt: toIso(row.last_message_at),
  };
}

function mapMessage(row) {
  if (!row) return null;

  return {
    id: row.id,
    conversationId: row.conversation_id,
    role: row.role,
    content: row.content,
    locale: row.locale || null,
    replyToMessageId: row.reply_to_message_id || null,
    createdAt: toIso(row.created_at),
  };
}

function mapGenerationState(row, options = {}) {
  if (!row) return null;

  const staleMs = Number(options.staleMs || 60000);
  const now = Number(options.now || Date.now());
  const updatedAtMs = row.updated_at ? new Date(row.updated_at).getTime() : 0;
  const isPotentiallyStale = ['pending', 'in_progress'].includes(row.status);
  const stale = isPotentiallyStale && updatedAtMs && now - updatedAtMs > staleMs;
  const completedWithoutAssistant = row.status === 'completed' &&
    (!row.assistant_message_id || Number(row.assistant_exists || 0) !== 1);

  let status = row.status;
  let errorCode = row.error_code || null;

  if (stale) {
    status = 'failed';
    errorCode = ERROR_CODES.AI_TIMEOUT;
  } else if (completedWithoutAssistant) {
    status = 'failed';
    errorCode = ERROR_CODES.AI_ASSISTANT_PERSISTENCE_FAILED;
  }

  return {
    userMessageId: row.user_message_id,
    assistantMessageId: row.assistant_message_id || null,
    status,
    errorCode,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at),
    completedAt: toIso(row.completed_at),
  };
}

module.exports = {
  mapGenerationState,
  mapConversation,
  mapMessage,
};
