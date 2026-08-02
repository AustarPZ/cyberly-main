import {
  buildAutomaticConversationTitle,
  isDefaultConversationTitle,
  shouldApplyAutomaticConversationTitleResult,
  shouldRequestAutomaticConversationTitle,
} from "./chatTitle";

describe("chat title helpers", () => {
  test("normalises first-message titles without changing meaning", () => {
    expect(buildAutomaticConversationTitle("  How can I\n\nidentify     phishing links?\t ")).toBe(
      "How can I identify phishing links?"
    );
  });

  test("returns empty for whitespace-only input", () => {
    expect(buildAutomaticConversationTitle(" \n\t  ")).toBe("");
  });

  test("preserves short input and punctuation", () => {
    expect(buildAutomaticConversationTitle("Is this bank SMS fake?")).toBe("Is this bank SMS fake?");
  });

  test("truncates long input within the maximum and appends one ellipsis", () => {
    const title = buildAutomaticConversationTitle(
      "How can I identify a fake banking message when the sender pressures me to click a suspicious link immediately?",
      80
    );

    expect(title).toHaveLength(80);
    expect(title.endsWith("…")).toBe(true);
    expect(title).not.toContain("...");
  });

  test("does not mutate the original input object", () => {
    const input = {
      toString: () => "  Keep this title  ",
    };

    expect(buildAutomaticConversationTitle(input)).toBe("Keep this title");
    expect(input.toString()).toBe("  Keep this title  ");
  });

  test("recognises only confirmed system default conversation titles", () => {
    expect(isDefaultConversationTitle("New chat")).toBe(true);
    expect(isDefaultConversationTitle(" New Chat ")).toBe(true);
    expect(isDefaultConversationTitle("new   chat")).toBe(true);
    expect(isDefaultConversationTitle("Untitled")).toBe(false);
    expect(isDefaultConversationTitle("How can I spot scams?")).toBe(false);
    expect(isDefaultConversationTitle("")).toBe(false);
  });

  test("allows automatic-title request only for a default title and valid candidate", () => {
    expect(shouldRequestAutomaticConversationTitle({
      conversation: { id: 12, title: "New chat" },
      candidateTitle: "How can I identify phishing links?",
    })).toBe(true);

    expect(shouldRequestAutomaticConversationTitle({
      conversation: { id: 12, title: "Manual title" },
      candidateTitle: "How can I identify phishing links?",
    })).toBe(false);
    expect(shouldRequestAutomaticConversationTitle({
      conversation: { id: 12, title: "New chat" },
      candidateTitle: "   ",
    })).toBe(false);
    expect(shouldRequestAutomaticConversationTitle({
      conversation: null,
      candidateTitle: "How can I identify phishing links?",
    })).toBe(false);
  });

  test("applies automatic-title response only while current title still matches the original default", () => {
    expect(shouldApplyAutomaticConversationTitleResult({
      currentConversation: { id: 22, title: "New chat" },
      requestedConversationId: 22,
      titleAtRequestStart: "New chat",
      returnedConversation: { id: 22, title: "How can I identify phishing links?" },
      currentUserId: 7,
      requestUserId: 7,
    })).toBe(true);

    expect(shouldApplyAutomaticConversationTitleResult({
      currentConversation: { id: 22, title: "Cybersecurity Homework" },
      requestedConversationId: 22,
      titleAtRequestStart: "New chat",
      returnedConversation: { id: 22, title: "How can I identify phishing links?" },
      currentUserId: 7,
      requestUserId: 7,
    })).toBe(false);
    expect(shouldApplyAutomaticConversationTitleResult({
      currentConversation: null,
      requestedConversationId: 22,
      titleAtRequestStart: "New chat",
      returnedConversation: { id: 22, title: "How can I identify phishing links?" },
      currentUserId: 7,
      requestUserId: 7,
    })).toBe(false);
    expect(shouldApplyAutomaticConversationTitleResult({
      currentConversation: { id: 23, title: "New chat" },
      requestedConversationId: 22,
      titleAtRequestStart: "New chat",
      returnedConversation: { id: 22, title: "How can I identify phishing links?" },
      currentUserId: 7,
      requestUserId: 7,
    })).toBe(false);
    expect(shouldApplyAutomaticConversationTitleResult({
      currentConversation: { id: 22, title: "New chat" },
      requestedConversationId: 22,
      titleAtRequestStart: "New chat",
      returnedConversation: { id: 22, title: "How can I identify phishing links?" },
      currentUserId: 8,
      requestUserId: 7,
    })).toBe(false);
  });

  test("ownership helpers do not mutate input objects", () => {
    const currentConversation = { id: 32, title: "New chat" };
    const returnedConversation = { id: 32, title: "How can I identify phishing links?" };

    shouldRequestAutomaticConversationTitle({
      conversation: currentConversation,
      candidateTitle: returnedConversation.title,
    });
    shouldApplyAutomaticConversationTitleResult({
      currentConversation,
      requestedConversationId: 32,
      titleAtRequestStart: "New chat",
      returnedConversation,
      currentUserId: 7,
      requestUserId: 7,
    });

    expect(currentConversation).toEqual({ id: 32, title: "New chat" });
    expect(returnedConversation).toEqual({ id: 32, title: "How can I identify phishing links?" });
  });
});
