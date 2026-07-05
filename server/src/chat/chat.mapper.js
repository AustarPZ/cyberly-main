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

module.exports = {
  mapConversation,
  mapMessage,
};
