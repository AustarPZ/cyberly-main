export const PINNED_CONVERSATIONS_STORAGE_PREFIX = "cyberly.chat.pinnedConversations.v1";

export function pinnedConversationStorageKey(userId) {
  if (userId === null || userId === undefined || userId === "") return "";
  return `${PINNED_CONVERSATIONS_STORAGE_PREFIX}.${String(userId)}`;
}

function toPositiveInteger(value) {
  const numericValue = typeof value === "string" && value.trim() !== ""
    ? Number(value)
    : value;
  if (!Number.isInteger(numericValue) || numericValue <= 0) return null;
  return numericValue;
}

export function normalizePinnedConversationIds(value) {
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

export function readPinnedConversationIds(userId, storage = window.localStorage) {
  const key = pinnedConversationStorageKey(userId);
  if (!key || !storage) return [];

  try {
    return normalizePinnedConversationIds(JSON.parse(storage.getItem(key) || "[]"));
  } catch {
    return [];
  }
}

export function writePinnedConversationIds(userId, ids, storage = window.localStorage) {
  const key = pinnedConversationStorageKey(userId);
  const normalizedIds = normalizePinnedConversationIds(ids);
  if (!key || !storage) return normalizedIds;

  try {
    storage.setItem(key, JSON.stringify(normalizedIds));
  } catch {
    // Pinning is a local convenience feature; storage failures should not break chat.
  }

  return normalizedIds;
}

export function togglePinnedConversationId(ids, conversationId) {
  const normalizedIds = normalizePinnedConversationIds(ids);
  const id = toPositiveInteger(conversationId);
  if (!id) return normalizedIds;

  if (normalizedIds.includes(id)) {
    return normalizedIds.filter(existingId => existingId !== id);
  }

  return [...normalizedIds, id];
}

export function partitionPinnedConversations(conversations, pinnedIds) {
  const pinnedIdSet = new Set(normalizePinnedConversationIds(pinnedIds));
  const pinnedConversations = [];
  const unpinnedConversations = [];

  conversations.forEach(conversation => {
    const id = toPositiveInteger(conversation?.id);
    if (id && pinnedIdSet.has(id)) {
      pinnedConversations.push(conversation);
    } else {
      unpinnedConversations.push(conversation);
    }
  });

  return { pinnedConversations, unpinnedConversations };
}
