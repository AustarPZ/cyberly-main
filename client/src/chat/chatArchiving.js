export const ARCHIVED_CONVERSATIONS_STORAGE_PREFIX = "cyberly.chat.archivedConversations.v1";

export function archivedConversationStorageKey(userId) {
  if (userId === null || userId === undefined || userId === "") return "";
  return `${ARCHIVED_CONVERSATIONS_STORAGE_PREFIX}.${String(userId)}`;
}

function toPositiveInteger(value) {
  const numericValue = typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value;
  if (!Number.isInteger(numericValue) || numericValue <= 0) return null;
  return numericValue;
}

export function normalizeArchivedConversationIds(value) {
  if (!Array.isArray(value)) return [];

  const seen = new Set();
  const ids = [];

  value.forEach(item => {
    const id = toPositiveInteger(item);
    if (!id || seen.has(id)) return;
    seen.add(id);
    ids.push(id);
  });

  return ids;
}

export function readArchivedConversationIds(userId, storage = window.localStorage) {
  const key = archivedConversationStorageKey(userId);
  if (!key || !storage) return [];

  try {
    return normalizeArchivedConversationIds(JSON.parse(storage.getItem(key) || "[]"));
  } catch {
    return [];
  }
}

export function writeArchivedConversationIds(userId, ids, storage = window.localStorage) {
  const key = archivedConversationStorageKey(userId);
  const normalizedIds = normalizeArchivedConversationIds(ids);
  if (!key || !storage) return normalizedIds;

  try {
    storage.setItem(key, JSON.stringify(normalizedIds));
  } catch {
    // Archiving is local convenience state; storage failures should not break chat.
  }

  return normalizedIds;
}

export function toggleArchivedConversationId(ids, conversationId) {
  const normalizedIds = normalizeArchivedConversationIds(ids);
  const id = toPositiveInteger(conversationId);
  if (!id) return normalizedIds;

  if (normalizedIds.includes(id)) {
    return normalizedIds.filter(existingId => existingId !== id);
  }

  return [...normalizedIds, id];
}

export function partitionArchivedConversations(conversations, archivedIds) {
  const archivedIdSet = new Set(normalizeArchivedConversationIds(archivedIds));
  const archivedConversations = [];
  const activeConversations = [];

  conversations.forEach(conversation => {
    const id = toPositiveInteger(conversation?.id);
    if (id && archivedIdSet.has(id)) {
      archivedConversations.push(conversation);
    } else {
      activeConversations.push(conversation);
    }
  });

  return { archivedConversations, activeConversations };
}
