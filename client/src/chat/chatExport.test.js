import {
  buildConversationExport,
  buildConversationExportFilename,
  hasExportableMessages,
} from "./chatExport";

const exportedAt = new Date("2026-08-01T12:30:00.000Z");

const conversation = {
  id: 7001,
  title: "How can I check a suspicious SMS?",
};

const messages = [
  {
    id: 7101,
    conversationId: 7001,
    role: "user",
    content: "How can I spot a phishing SMS?",
    text: "How can I spot a phishing SMS?",
  },
  {
    id: 7102,
    conversationId: 7001,
    role: "ai",
    content: "## Phishing safety check\n\nPause before opening links.",
    text: "## Phishing safety check\n\nPause before opening links.",
    sources: [
      {
        id: 7201,
        title: "Recognising suspicious messages",
        sourceLabel: "Cyberly Resource",
        sourceOrganisation: "Cyberly",
        sourceUrl: "https://example.test/cyberly/phishing-safety",
        snippet: "Verify urgent links through a trusted channel.",
        internalTarget: {
          page: "resources",
          resourceSlug: "recognising-suspicious-messages",
        },
      },
      {
        id: 7202,
        title: "Unsafe source",
        sourceLabel: "Unsafe",
        sourceUrl: "javascript:alert(1)",
        snippet: "This URL must not be exported.",
      },
    ],
    proposal: {
      proposalId: "proposal-pilot-1",
      actionType: "open_resource",
      title: "Open the phishing safety resource",
      explanation: "CyberGuard can open a reviewed resource.",
      consequence: "Nothing changes until you confirm.",
      confirmationToken: "fixture-token",
      target: {
        type: "resource",
        id: 8101,
        label: "Recognising suspicious messages",
      },
    },
    actions: [
      {
        id: 7301,
        title: "Try a phishing practice scenario",
        description: "Practise checking a suspicious message.",
        target: {
          page: "scenarios",
          scenarioSlug: "phishing-message-check",
        },
      },
    ],
  },
];

describe("CyberGuard conversation export", () => {
  test("builds a safe Markdown export without internal identifiers or trusted parameters", () => {
    const result = buildConversationExport({
      conversation,
      messages,
      exportedAt,
      format: "markdown",
      locale: "en",
    });

    expect(result.filename).toBe("cyberguard-how-can-i-check-a-suspicious-sms.md");
    expect(result.mimeType).toBe("text/markdown;charset=utf-8");
    expect(result.content).toContain("# CyberGuard Conversation Export");
    expect(result.content).toContain("Conversation: How can I check a suspicious SMS?");
    expect(result.content).toContain("Learner");
    expect(result.content).toContain("CyberGuard");
    expect(result.content).toContain("## Phishing safety check");
    expect(result.content).toContain("Sources");
    expect(result.content).toContain("Recognising suspicious messages");
    expect(result.content).toContain("https://example.test/cyberly/phishing-safety");
    expect(result.content).toContain("Suggested action");
    expect(result.content).toContain("Follow-up actions");
    expect(result.content).not.toContain("7001");
    expect(result.content).not.toContain("7101");
    expect(result.content).not.toContain("proposal-pilot-1");
    expect(result.content).not.toContain("fixture-token");
    expect(result.content).not.toContain("resourceSlug");
    expect(result.content).not.toContain("javascript:");
  });

  test("builds a plain text export without Markdown syntax or unsafe metadata", () => {
    const result = buildConversationExport({
      conversation,
      messages,
      exportedAt,
      format: "text",
      locale: "en",
    });

    expect(result.filename).toBe("cyberguard-how-can-i-check-a-suspicious-sms.txt");
    expect(result.mimeType).toBe("text/plain;charset=utf-8");
    expect(result.content).toContain("CyberGuard Conversation Export");
    expect(result.content).toContain("Phishing safety check");
    expect(result.content).toContain("Pause before opening links.");
    expect(result.content).not.toContain("##");
    expect(result.content).not.toContain("proposal-pilot-1");
    expect(result.content).not.toContain("fixture-token");
  });

  test("adds a neutral failed-generation note without provider internals", () => {
    const result = buildConversationExport({
      conversation,
      messages: [messages[0]],
      generationByMessageId: {
        7101: {
          status: "failed",
          error: "OpenAI provider unavailable: secret missing",
          errorCode: "AI_PROVIDER_UNAVAILABLE",
        },
      },
      exportedAt,
      format: "text",
      locale: "en",
    });

    expect(result.content).toContain("[CyberGuard reply was unavailable.]");
    expect(result.content).not.toContain("OpenAI");
    expect(result.content).not.toContain("secret");
    expect(result.content).not.toContain("AI_PROVIDER_UNAVAILABLE");
  });

  test("sanitizes filenames for Windows reserved names and invalid characters", () => {
    expect(buildConversationExportFilename({ title: "CON", format: "markdown" })).toBe("cyberguard-conversation.md");
    expect(buildConversationExportFilename({ title: "Banking: scam/link? check*", format: "text" })).toBe("cyberguard-banking-scam-link-check.txt");
    expect(buildConversationExportFilename({ title: "", format: "markdown" })).toBe("cyberguard-conversation.md");
  });

  test("detects exportable visible messages only", () => {
    expect(hasExportableMessages([{ role: "system", content: "hidden" }])).toBe(false);
    expect(hasExportableMessages([{ role: "user", content: "   " }])).toBe(false);
    expect(hasExportableMessages([{ role: "ai", text: "Safe answer" }])).toBe(true);
  });
});
