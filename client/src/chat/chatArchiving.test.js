import {
  ARCHIVED_CONVERSATIONS_STORAGE_PREFIX,
  archivedConversationStorageKey,
  normalizeArchivedConversationIds,
  partitionArchivedConversations,
  readArchivedConversationIds,
  toggleArchivedConversationId,
  writeArchivedConversationIds,
} from "./chatArchiving";

describe("chat conversation archiving storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test("builds a user-scoped storage key", () => {
    expect(archivedConversationStorageKey(42)).toBe(
      `${ARCHIVED_CONVERSATIONS_STORAGE_PREFIX}.42`
    );
    expect(archivedConversationStorageKey("learner-a")).toBe(
      `${ARCHIVED_CONVERSATIONS_STORAGE_PREFIX}.learner-a`
    );
  });

  test("normalizes positive unique conversation ids", () => {
    expect(normalizeArchivedConversationIds([3, "4", 3, 0, -1, 4.5, "x", null, 5])).toEqual([3, 4, 5]);
    expect(normalizeArchivedConversationIds({ id: 3 })).toEqual([]);
  });

  test("reads invalid and non-array localStorage as an empty archive list", () => {
    window.localStorage.setItem(archivedConversationStorageKey(42), "{bad json");
    expect(readArchivedConversationIds(42)).toEqual([]);

    window.localStorage.setItem(archivedConversationStorageKey(42), JSON.stringify({ ids: [1] }));
    expect(readArchivedConversationIds(42)).toEqual([]);
  });

  test("writes normalized ids without leaking across users", () => {
    expect(writeArchivedConversationIds(42, [9, "9", 12, -4])).toEqual([9, 12]);

    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(42)))).toEqual([9, 12]);
    expect(readArchivedConversationIds(99)).toEqual([]);
  });

  test("does not break chat when storage writes fail", () => {
    const storage = {
      setItem: jest.fn(() => {
        throw new Error("storage unavailable");
      }),
    };

    expect(writeArchivedConversationIds(42, [3, "4"], storage)).toEqual([3, 4]);
  });

  test("toggles ids without duplicates", () => {
    expect(toggleArchivedConversationId([3, 5], 7)).toEqual([3, 5, 7]);
    expect(toggleArchivedConversationId([3, 5, 7], 5)).toEqual([3, 7]);
    expect(toggleArchivedConversationId([3], "bad")).toEqual([3]);
  });
});

describe("chat conversation archiving partition", () => {
  const conversations = [
    { id: 10, title: "Today phishing check" },
    { id: 11, title: "Password account check" },
    { id: 12, title: "Earlier privacy practice" },
  ];

  test("partitions archived conversations without stale placeholders", () => {
    expect(partitionArchivedConversations(conversations, [12, 999, 10])).toEqual({
      archivedConversations: [conversations[0], conversations[2]],
      activeConversations: [conversations[1]],
    });
  });

  test("returns all conversations as active when no valid archives exist", () => {
    expect(partitionArchivedConversations(conversations, ["x"])).toEqual({
      archivedConversations: [],
      activeConversations: conversations,
    });
  });

  test("preserves source ordering for active and archived partitions", () => {
    expect(partitionArchivedConversations(conversations, [11])).toEqual({
      archivedConversations: [conversations[1]],
      activeConversations: [conversations[0], conversations[2]],
    });
  });
});
