export const MAX_CONVERSATION_TITLE_LENGTH = 80;

export function buildAutomaticConversationTitle(
  message,
  maxLength = MAX_CONVERSATION_TITLE_LENGTH
) {
  const normalized = String(message || "")
    .trim()
    .replace(/\s+/g, " ");

  if (!normalized) return "";
  if (normalized.length <= maxLength) return normalized;

  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

export function normalizeConversationTitle(title) {
  return String(title || "").trim().replace(/\s+/g, " ");
}

export function isDefaultConversationTitle(title) {
  return normalizeConversationTitle(title).toLowerCase() === "new chat";
}

export function shouldRequestAutomaticConversationTitle({
  conversation,
  candidateTitle,
}) {
  const normalizedCandidate = buildAutomaticConversationTitle(candidateTitle);
  if (!conversation || !normalizedCandidate) return false;
  if (!isDefaultConversationTitle(conversation.title)) return false;
  return normalizeConversationTitle(conversation.title) !== normalizedCandidate;
}

export function shouldApplyAutomaticConversationTitleResult({
  currentConversation,
  requestedConversationId,
  titleAtRequestStart,
  returnedConversation,
  currentUserId,
  requestUserId,
}) {
  if (!currentConversation || !returnedConversation) return false;
  if (!currentUserId || !requestUserId || currentUserId !== requestUserId) return false;

  const requestedId = Number(requestedConversationId);
  if (!Number.isFinite(requestedId)) return false;
  if (Number(currentConversation.id) !== requestedId) return false;
  if (Number(returnedConversation.id) !== requestedId) return false;

  const normalizedRequestTitle = normalizeConversationTitle(titleAtRequestStart);
  if (!isDefaultConversationTitle(normalizedRequestTitle)) return false;

  return normalizeConversationTitle(currentConversation.title) === normalizedRequestTitle;
}
