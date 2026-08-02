import {
  PINNED_CONVERSATIONS_STORAGE_PREFIX,
  normalizePinnedConversationIds,
  partitionPinnedConversations,
  pinnedConversationStorageKey,
  readPinnedConversationIds,
  togglePinnedConversationId,
  writePinnedConversationIds,
} from "./chatPinning";

describe("chat conversation pinning storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("builds a user-scoped storage key", () => {
    expect(pinnedConversationStorageKey(42)).toBe(
      `${PINNED_CONVERSATIONS_STORAGE_PREFIX}.42`
    );
    expect(pinnedConversationStorageKey("learner-a")).toBe(
      `${PINNED_CONVERSATIONS_STORAGE_PREFIX}.learner-a`
    );
  });

  test("normalizes positive unique conversation ids", () => {
    expect(normalizePinnedConversationIds([3, "4", 3, 0, -1, 4.5, "x", null, 5])).toEqual([3, 4, 5]);
    expect(normalizePinnedConversationIds({ id: 3 })).toEqual([]);
  });

  test("reads invalid localStorage as an empty pin list", () => {
    window.localStorage.setItem(pinnedConversationStorageKey(42), "{bad json");

    expect(readPinnedConversationIds(42)).toEqual([]);

    window.localStorage.setItem(pinnedConversationStorageKey(42), JSON.stringify({ ids: [1] }));
    expect(readPinnedConversationIds(42)).toEqual([]);
  });

  test("writes normalized ids without leaking across users", () => {
    expect(writePinnedConversationIds(42, [9, "9", 12, -4])).toEqual([9, 12]);

    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(42)))).toEqual([9, 12]);
    expect(readPinnedConversationIds(99)).toEqual([]);
  });

  test("toggles ids without duplicates", () => {
    expect(togglePinnedConversationId([3, 5], 7)).toEqual([3, 5, 7]);
    expect(togglePinnedConversationId([3, 5, 7], 5)).toEqual([3, 7]);
    expect(togglePinnedConversationId([3], "bad")).toEqual([3]);
  });
});

describe("chat conversation pinning partition", () => {
  const conversations = [
    { id: 10, title: "Today phishing check" },
    { id: 11, title: "Password account check" },
    { id: 12, title: "Earlier privacy practice" },
  ];

  test("partitions pinned conversations without stale placeholders", () => {
    expect(partitionPinnedConversations(conversations, [12, 999, 10])).toEqual({
      pinnedConversations: [conversations[0], conversations[2]],
      unpinnedConversations: [conversations[1]],
    });
  });

  test("returns all conversations as unpinned when no valid pins exist", () => {
    expect(partitionPinnedConversations(conversations, ["x"])).toEqual({
      pinnedConversations: [],
      unpinnedConversations: conversations,
    });
  });
});
