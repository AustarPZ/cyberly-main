import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  cyberGuardPilotAction,
  cyberGuardPilotAssistantMessage,
  cyberGuardPilotConversation,
  cyberGuardPilotEmptyConversation,
  cyberGuardPilotGeneratedAssistantMessage,
  cyberGuardPilotGeneratedUserMessage,
  cyberGuardPilotSource,
  cyberGuardPilotUserMessage,
  renderCyberGuardPilotFixture,
} from "./cyberguardTestUtils";
import {
  createChatConversation,
  createChatUserMessage,
  deleteChatConversation,
  generateChatAssistantReply,
  getChatConversation,
  listChatConversations,
  renameChatConversation,
} from "../chat/chatApi";
import { pinnedConversationStorageKey } from "../chat/chatPinning";
import { archivedConversationStorageKey } from "../chat/chatArchiving";
import {
  login,
  logout,
} from "../api/authApi";

jest.mock("react-markdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }) => {
      const text = String(children || "");
      const nodes = text.split(/\n{2,}/).map((block, index) => {
        const heading = block.match(/^##\s+(.+)$/);
        if (heading) {
          return React.createElement("h2", { key: index }, heading[1]);
        }
        return React.createElement("p", { key: index }, block.replace(/\n/g, " "));
      });
      return React.createElement(React.Fragment, null, nodes);
    },
  };
});

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../api/authApi", () => ({
  register: jest.fn(),
  login: jest.fn(),
  restoreSession: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(),
  createChatConversation: jest.fn(),
  getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(),
  deleteChatConversation: jest.fn(),
  createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(),
  createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(),
  cancelLearnerActionProposal: jest.fn(),
}));

jest.mock("../api/assessmentApi", () => ({
  ...jest.requireActual("../api/assessmentApi"),
  getInitialAssessmentStatus: jest.fn(),
}));

jest.mock("../api/progressApi", () => ({
  ...jest.requireActual("../api/progressApi"),
  getProgress: jest.fn(),
}));

jest.mock("../api/recommendationApi", () => ({
  ...jest.requireActual("../api/recommendationApi"),
  getCurrentRecommendation: jest.fn(),
}));

jest.mock("../api/scenarioApi", () => ({
  ...jest.requireActual("../api/scenarioApi"),
  getRecommendedScenarios: jest.fn(),
  getScenarioDashboard: jest.fn(),
}));

function follows(before, after) {
  return Boolean(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);
}

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe("CyberGuard public beta pilot baseline", () => {
  afterEach(() => {
    if (document.createElement?.mockRestore) {
      document.createElement.mockRestore();
    }
    jest.useRealTimers();
  });

  function localIso(year, monthIndex, day, hour, minute) {
    return new Date(year, monthIndex, day, hour, minute).toISOString();
  }

  function conversationWithDate(id, title, updatedAt) {
    return {
      ...cyberGuardPilotConversation,
      id,
      title,
      updatedAt,
      lastMessageAt: updatedAt,
    };
  }

  function conversationTitlesIn(container) {
    return Array.from(container.querySelectorAll(".ai-chat-list-title")).map(node => node.textContent);
  }

  async function logoutCurrentUser() {
    const accountTrigger = screen.getByRole("button", { name: /open account menu/i });
    await userEvent.click(accountTrigger);
    const accountMenu = await screen.findByRole("menu", { name: /account menu/i });
    await userEvent.click(within(accountMenu).getByRole("menuitem", { name: /log out/i }));
    const logoutDialog = await screen.findByRole("dialog", { name: /log out of Cyberly/i });
    await userEvent.click(within(logoutDialog).getByRole("button", { name: /^log out$/i }));
    await waitFor(() => expect(logout).toHaveBeenCalled());
    await waitFor(() => expect(screen.queryByRole("button", { name: /open account menu/i })).not.toBeInTheDocument());
  }

  async function loginAsUser(user) {
    login.mockResolvedValue({
      ok: true,
      data: {
        user,
        profile: {
          exists: true,
          onboardingCompleted: true,
          preferredLanguage: "english",
        },
      },
    });

    await userEvent.click(screen.getByRole("button", { name: /^sign in$/i }));
    const authPanel = (await screen.findByRole("heading", { name: /welcome back/i })).closest(".cy-auth-panel");
    const email = "u2@example.test";
    const password = "SafePass1!";
    await userEvent.type(within(authPanel).getByLabelText(/email/i), email);
    await userEvent.type(within(authPanel).getByLabelText(/password/i), password);
    await userEvent.click(within(authPanel).getByRole("button", { name: /^sign in$/i }));
    await waitFor(() => expect(login).toHaveBeenCalledWith(email, password));
    await screen.findByRole("button", { name: new RegExp(`open account menu for ${user.displayName}`, "i") });
  }

  function historyGroupButton(container, label) {
    return within(container).getByRole("button", { name: new RegExp(`${label} conversations`, "i") });
  }

  function historyGroupSection(container, label) {
    return within(container).getByRole("heading", { name: label }).closest(".ai-chat-history-group");
  }

  async function openConversationMenuIn(container, title) {
    const menuButton = within(container).getByRole("button", { name: new RegExp(`open menu for ${title}`, "i") });
    await userEvent.click(menuButton);
    return menuButton;
  }

  async function openConversationMenu(title) {
    return openConversationMenuIn(screen.getByLabelText(/conversation history/i), title);
  }

  async function openMobileHistoryDrawer() {
    await userEvent.click(screen.getByRole("button", { name: /open chat history/i }));
    return screen.findByRole("dialog", { name: /conversation history/i });
  }

  async function openActiveConversationExportDialog(container, title) {
    const menuButton = await openConversationMenuIn(container, title);
    await userEvent.click(screen.getByRole("menuitem", { name: /^Export conversation$/i }));
    const dialog = await screen.findByRole("dialog", { name: /Export conversation/i });
    return { dialog, menuButton };
  }

  function useFixedLocalNow(date = new Date(2026, 6, 29, 0, 5)) {
    jest.useFakeTimers();
    jest.setSystemTime(date);
  }

  function installDownloadSpies() {
    if (document.createElement?.mockRestore) {
      document.createElement.mockRestore();
    }
    const createObjectURL = jest.fn(() => "blob:cyberguard-export");
    const revokeObjectURL = jest.fn();
    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectURL,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectURL,
    });

    const anchorClicks = [];
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = jest.spyOn(document, "createElement").mockImplementation(tagName => {
      const element = originalCreateElement(tagName);
      if (String(tagName).toLowerCase() === "a") {
        Object.defineProperty(element, "click", {
          configurable: true,
          value: jest.fn(() => anchorClicks.push(element)),
        });
      }
      return element;
    });

    return {
      createObjectURL,
      revokeObjectURL,
      anchorClicks,
      restore: () => createElementSpy.mockRestore(),
    };
  }

  function readBlobText(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
  }

  const conversationSearchFixtures = [
    {
      ...cyberGuardPilotConversation,
      id: 7001,
      title: "Phishing safety practice",
    },
    {
      ...cyberGuardPilotConversation,
      id: 7003,
      title: "Password account check",
    },
    {
      ...cyberGuardPilotConversation,
      id: 7004,
      title: "How to identify phishing links",
    },
  ];

  const groupedConversationFixtures = [
    conversationWithDate(7101, "Today phishing check", localIso(2026, 6, 29, 0, 4)),
    conversationWithDate(7102, "Yesterday password review", localIso(2026, 6, 28, 23, 55)),
    conversationWithDate(7103, "Earlier privacy practice", localIso(2026, 6, 26, 12, 0)),
    conversationWithDate(7104, "Missing timestamp check", null),
    conversationWithDate(7105, "Invalid timestamp check", "not-a-date"),
    conversationWithDate(7106, "Today future check", localIso(2026, 6, 29, 23, 0)),
    conversationWithDate(7107, "Later future check", localIso(2026, 6, 30, 8, 0)),
  ];

  test("authenticated learner reaches an accessible message log", async () => {
    await renderCyberGuardPilotFixture();

    const shell = screen.getByRole("region", { name: /CyberGuard conversation workspace/i });
    const sidebar = shell.querySelector(".cyberguard-chat-shell-sidebar");
    const main = shell.querySelector(".cyberguard-chat-shell-main");
    const log = screen.getByRole("log", { name: /chat message history/i });
    const notice = screen.getByRole("complementary", { name: /AI-supported guidance/i });

    expect(shell).toHaveClass("cyberguard-chat-shell");
    expect(shell).not.toHaveClass("is-sidebar-collapsed");
    expect(sidebar).toBeInTheDocument();
    expect(main).toBeInTheDocument();
    expect(Array.from(shell.children).indexOf(sidebar)).toBeLessThan(Array.from(shell.children).indexOf(main));
    expect(within(sidebar).getByLabelText(/conversation history/i)).toBeInTheDocument();
    expect(within(main).getByRole("log", { name: /chat message history/i })).toBe(log);
    expect(within(main).getByRole("textbox", { name: /type your chat message/i })).toBeInTheDocument();
    expect(screen.getAllByRole("log", { name: /chat message history/i })).toHaveLength(1);
    expect(screen.getByRole("banner", { name: "CyberGuard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: "CyberGuard" })).toBeInTheDocument();
    expect(screen.getByText(/Ask focused cyber-wellness questions/i)).toBeInTheDocument();
    expect(notice.tagName).toBe("ASIDE");
    expect(notice).toHaveAttribute("aria-labelledby", "cyberguard-ai-notice-title");
    expect(notice).toHaveAttribute("aria-describedby", "cyberguard-ai-notice-description");
    expect(notice).not.toHaveAttribute("role", "alert");
    expect(screen.getByText(/Learner-controlled actions still require your confirmation/i)).toBeInTheDocument();
    expect(screen.queryByText(/AI Gateway phase/i)).not.toBeInTheDocument();
    expect(log).toBeInTheDocument();
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(within(log).getByText(/How can I spot a phishing message\?/i)).toBeInTheDocument();
    expect(within(log).getByRole("heading", { name: /Phishing safety check/i })).toBeInTheDocument();
    expect(within(log).getByTestId(`chat-assistant-message-${cyberGuardPilotAssistantMessage.id}`)).toBeInTheDocument();
  });

  test.each([
    ["AI_AUTH_FAILED", /cannot connect to its AI service right now/i, false],
    ["AI_CONTEXT_LIMIT", /conversation is too long/i, false],
    ["AI_REQUEST_FAILED", /could not send this request/i, true],
    ["AI_PROVIDER_UNAVAILABLE", /temporarily unavailable/i, true],
  ])("failed generation uses safe category copy and retry contract for %s", async (code, copyPattern, retryable) => {
    await renderCyberGuardPilotFixture({
      chatOverrides: {
        getChatConversation: () => Promise.resolve({
          ok: true,
          conversation: cyberGuardPilotConversation,
          messages: [cyberGuardPilotUserMessage],
          actions: [],
          sources: [],
          generations: [{
            id: 8801,
            conversationId: cyberGuardPilotConversation.id,
            userMessageId: cyberGuardPilotUserMessage.id,
            status: "failed",
            provider: "openai",
            model: "gpt-5.4-mini",
            errorCode: code,
          }],
        }),
      },
    });

    expect(screen.getByRole("alert")).toHaveTextContent(copyPattern);
    expect(screen.queryByText(/sk-test|OPENAI_API_KEY|Mock auth|gpt-5|OpenAI|Gemini|ILMU/i)).not.toBeInTheDocument();
    const retry = screen.queryByRole("button", { name: /retry cyberguard reply/i });
    if (retryable) {
      expect(retry).toBeInTheDocument();
    } else {
      expect(retry).not.toBeInTheDocument();
    }
  });

  test("desktop sidebar collapse toggles the ChatShell modifier without removing content", async () => {
    await renderCyberGuardPilotFixture();

    const shell = screen.getByRole("region", { name: /CyberGuard conversation workspace/i });
    expect(shell).not.toHaveClass("is-sidebar-collapsed");

    const sidebar = shell.querySelector(".cyberguard-chat-shell-sidebar");
    await userEvent.click(within(sidebar).getByRole("button", { name: /collapse chat history/i }));

    expect(shell).toHaveClass("is-sidebar-collapsed");
    expect(within(sidebar).getByRole("button", { name: /expand chat history/i })).toBeInTheDocument();
    expect(screen.getByRole("log", { name: /chat message history/i })).toBeInTheDocument();
    expect(screen.getByText(/How can I spot a phishing message\?/i)).toBeInTheDocument();
  });

  test("desktop history behavior is owned by the sidebar while header control stays drawer-scoped", async () => {
    await renderCyberGuardPilotFixture();

    const shell = screen.getByRole("region", { name: /CyberGuard conversation workspace/i });
    const header = screen.getByRole("banner", { name: "CyberGuard" });
    const headerMenu = within(header).getByRole("button", { name: /collapse chat history/i });
    const sidebar = shell.querySelector(".cyberguard-chat-shell-sidebar");

    expect(shell).not.toHaveClass("is-sidebar-collapsed");
    expect(headerMenu).toHaveClass("cyberguard-workspace-history-control");

    await userEvent.click(within(sidebar).getByRole("button", { name: /collapse chat history/i }));

    expect(shell).toHaveClass("is-sidebar-collapsed");
    expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument();
    expect(within(header).getByRole("button", { name: /expand chat history/i })).toHaveClass("cyberguard-workspace-history-control");
  });

  test("final alignment presents one trusted companion workspace without render-time mutations", async () => {
    const { container } = await renderCyberGuardPilotFixture();

    const appMain = container.querySelector("main");
    const header = within(appMain).getByRole("banner", { name: "CyberGuard" });

    expect(container.querySelectorAll("main")).toHaveLength(1);
    expect(within(appMain).getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(header).toHaveClass("cyberguard-workspace-header");
    expect(header.querySelector(".cyberguard-workspace-identity-mark")).toHaveAttribute("aria-hidden", "true");
    expect(within(appMain).getByRole("complementary", { name: /AI-supported guidance/i })).toBeInTheDocument();
    expect(within(appMain).getByRole("region", { name: /CyberGuard conversation workspace/i })).toBeInTheDocument();
    expect(within(appMain).getByRole("form", { name: /Message CyberGuard/i })).toBeInTheDocument();
    expect(appMain.querySelector(".cy-explorer-hero")).not.toBeInTheDocument();
    expect(appMain.querySelector(".cy-context-header")).not.toBeInTheDocument();
    expect(appMain.querySelector(".cy-compact-header")).not.toBeInTheDocument();
    expect(createChatConversation).not.toHaveBeenCalled();
    expect(createChatUserMessage).not.toHaveBeenCalled();
    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(deleteChatConversation).not.toHaveBeenCalled();
    expect(generateChatAssistantReply).not.toHaveBeenCalled();
  });

  test("current assistant presentation keeps Markdown, sources, proposal, and actions", async () => {
    await renderCyberGuardPilotFixture({
      activeConversation: cyberGuardPilotEmptyConversation,
      conversations: [cyberGuardPilotEmptyConversation],
      messages: [],
    });

    await userEvent.type(
      screen.getByRole("textbox", { name: /type your chat message/i }),
      "Please help me practise phishing safety."
    );
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    expect(await screen.findByRole("heading", { name: /Phishing safety check/i })).toBeInTheDocument();
    expect(screen.getByText(/Pause before opening links/i)).toBeInTheDocument();
    expect(createChatUserMessage).toHaveBeenCalledTimes(1);
    expect(generateChatAssistantReply).toHaveBeenCalledTimes(1);

    const sourceToggle = screen.getByRole("button", { name: /show sources/i });
    expect(sourceToggle).toHaveAttribute("aria-expanded", "false");

    await userEvent.click(sourceToggle);
    expect(sourceToggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(/Recognising suspicious messages/i)).toBeInTheDocument();

    expect(screen.getByText(/Open the phishing safety resource/i)).toBeInTheDocument();
    expect(screen.getByText(/You stay in control and nothing changes until you confirm/i)).toBeInTheDocument();
    expect(screen.getByText(/This does not change your score, mastery or progress/i)).toBeInTheDocument();
    expect(screen.getByText(cyberGuardPilotAction.title)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open try a phishing practice scenario/i })).toBeInTheDocument();

    const assistantId = cyberGuardPilotGeneratedAssistantMessage.id;
    const assistantRoot = screen.getByTestId(`chat-assistant-message-${assistantId}`);
    const answer = within(assistantRoot).getByTestId(`chat-message-answer-${assistantId}`);
    const sources = within(assistantRoot).getByTestId(`chat-message-sources-${assistantId}`);
    const proposal = within(assistantRoot).getByTestId(`chat-message-proposal-${assistantId}`);
    const actions = within(assistantRoot).getByTestId(`chat-message-actions-${assistantId}`);

    expect(assistantRoot).toHaveAttribute("data-chat-assistant-message-id", String(assistantId));
    expect(within(answer).getByRole("heading", { name: /Phishing safety check/i })).toBeInTheDocument();
    expect(within(sources).getByRole("button", { name: /hide sources/i })).toBeInTheDocument();
    expect(within(proposal).getByText(/You stay in control and nothing changes until you confirm/i)).toBeInTheDocument();
    expect(within(actions).getByRole("button", { name: /open try a phishing practice scenario/i })).toBeInTheDocument();
    expect(follows(answer, sources)).toBe(true);
    expect(follows(sources, proposal)).toBe(true);
    expect(follows(proposal, actions)).toBe(true);
    expect(within(assistantRoot).getAllByTestId(/^chat-message-/)).toHaveLength(4);
  });

  test("new assistant generation scrolls toward the answer region before sources and actions", async () => {
    const originalOffsetTop = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetTop");
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    const originalClientHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "clientHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetTop", {
      configurable: true,
      get() {
        if (this.getAttribute("data-testid") === `chat-message-answer-${cyberGuardPilotGeneratedAssistantMessage.id}`) return 120;
        if (this.getAttribute("data-chat-message-id") === String(cyberGuardPilotGeneratedAssistantMessage.id)) return 820;
        return 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        if (this.getAttribute("data-testid") === `chat-message-answer-${cyberGuardPilotGeneratedAssistantMessage.id}`) return 480;
        return 0;
      },
    });
    Object.defineProperty(HTMLElement.prototype, "clientHeight", {
      configurable: true,
      get() {
        if (this.getAttribute("role") === "log") return 320;
        return 0;
      },
    });

    try {
      await renderCyberGuardPilotFixture({
        activeConversation: cyberGuardPilotEmptyConversation,
        conversations: [cyberGuardPilotEmptyConversation],
        messages: [],
      });
      Element.prototype.scrollTo.mockClear();

      await userEvent.type(
        screen.getByRole("textbox", { name: /type your chat message/i }),
        "Please give me a detailed phishing practice answer."
      );
      await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

      await screen.findByTestId(`chat-message-answer-${cyberGuardPilotGeneratedAssistantMessage.id}`);
      await waitFor(() => expect(Element.prototype.scrollTo).toHaveBeenCalled());
      expect(Element.prototype.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ top: 108 }));
      expect(Element.prototype.scrollTo).not.toHaveBeenCalledWith(expect.objectContaining({ top: 808 }));
    } finally {
      if (originalOffsetTop) {
        Object.defineProperty(HTMLElement.prototype, "offsetTop", originalOffsetTop);
      }
      if (originalOffsetHeight) {
        Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
      }
      if (originalClientHeight) {
        Object.defineProperty(HTMLElement.prototype, "clientHeight", originalClientHeight);
      }
    }
  });

  test("assistant optional wrappers are omitted and user messages keep their current shape", async () => {
    const assistantWithoutExtras = {
      ...cyberGuardPilotAssistantMessage,
      id: 7142,
      content: "## Quick answer\n\nUse trusted sources.",
    };
    await renderCyberGuardPilotFixture({
      messages: [cyberGuardPilotUserMessage, assistantWithoutExtras],
      chatOverrides: {
        getChatConversation: () => Promise.resolve({
          ok: true,
          conversation: cyberGuardPilotConversation,
          messages: [cyberGuardPilotUserMessage, assistantWithoutExtras],
          actions: [],
          sources: [],
          generations: [],
        }),
      },
    });

    const assistantRoot = screen.getByTestId("chat-assistant-message-7142");
    expect(within(assistantRoot).getByTestId("chat-message-answer-7142")).toBeInTheDocument();
    expect(within(assistantRoot).queryByTestId("chat-message-sources-7142")).not.toBeInTheDocument();
    expect(within(assistantRoot).queryByTestId("chat-message-proposal-7142")).not.toBeInTheDocument();
    expect(within(assistantRoot).queryByTestId("chat-message-actions-7142")).not.toBeInTheDocument();
    expect(screen.queryByTestId(`chat-assistant-message-${cyberGuardPilotUserMessage.id}`)).not.toBeInTheDocument();
    expect(document.querySelector(`[data-chat-message-id="${cyberGuardPilotUserMessage.id}"]`)).toHaveClass("chat-bubble", "user");
  });

  test("repeated source sets receive unique expanded source ids per assistant message", async () => {
    const firstAssistant = {
      ...cyberGuardPilotAssistantMessage,
      id: 7143,
      content: "## First source answer\n\nUse the reviewed source.",
    };
    const secondAssistant = {
      ...cyberGuardPilotAssistantMessage,
      id: 7144,
      content: "## Second source answer\n\nUse the same reviewed source safely.",
    };
    await renderCyberGuardPilotFixture({
      messages: [cyberGuardPilotUserMessage, firstAssistant, secondAssistant],
      chatOverrides: {
        getChatConversation: () => Promise.resolve({
          ok: true,
          conversation: cyberGuardPilotConversation,
          messages: [cyberGuardPilotUserMessage, firstAssistant, secondAssistant],
          actions: [],
          sources: [
            { messageId: firstAssistant.id, sources: [cyberGuardPilotSource] },
            { messageId: secondAssistant.id, sources: [cyberGuardPilotSource] },
          ],
          generations: [],
        }),
      },
    });

    const firstToggle = within(screen.getByTestId("chat-message-sources-7143")).getByRole("button", { name: /show sources/i });
    const secondToggle = within(screen.getByTestId("chat-message-sources-7144")).getByRole("button", { name: /show sources/i });

    await userEvent.click(firstToggle);
    await userEvent.click(secondToggle);

    const firstControls = firstToggle.getAttribute("aria-controls");
    const secondControls = secondToggle.getAttribute("aria-controls");

    expect(firstControls).toBeTruthy();
    expect(secondControls).toBeTruthy();
    expect(firstControls).not.toBe(secondControls);
    expect(document.querySelectorAll(`#${CSS.escape(firstControls)}`)).toHaveLength(1);
    expect(document.querySelectorAll(`#${CSS.escape(secondControls)}`)).toHaveLength(1);
  });

  test("mobile history drawer opens, closes with Escape, and returns focus", async () => {
    await renderCyberGuardPilotFixture({ mobile: true });

    const historyTrigger = screen.getByRole("button", { name: /open chat history/i });
    historyTrigger.focus();

    await userEvent.click(historyTrigger);

    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).toBeInTheDocument());
    const drawer = document.getElementById("ai-chat-history-drawer");
    expect(drawer).toHaveAccessibleName(/conversation history/i);
    await waitFor(() => expect(drawer).toHaveFocus());

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument());
    await waitFor(() => expect(historyTrigger).toHaveFocus());
  });

  test("empty conversation renders bounded quick prompts and one composer", async () => {
    await renderCyberGuardPilotFixture({
      activeConversation: cyberGuardPilotEmptyConversation,
      conversations: [cyberGuardPilotEmptyConversation],
      messages: [],
    });

    const emptyState = screen.getByRole("region", { name: /start with a cyber-safety question/i });
    expect(emptyState).toBeInTheDocument();
    expect(within(emptyState).getByText(/Ask CyberGuard to help you understand suspicious messages/i)).toBeInTheDocument();
    const promptButtons = within(emptyState).getAllByRole("button");
    expect(promptButtons).toHaveLength(4);
    expect(within(emptyState).getByRole("button", { name: /How can I tell if a message might be a scam\?/i })).toHaveAttribute("data-prompt-id", "spot-suspicious-message");
    expect(within(emptyState).getByRole("button", { name: /What can I do to make my account safer\?/i })).toHaveAttribute("data-prompt-id", "strengthen-account-safety");

    const log = screen.getByRole("log", { name: /chat message history/i });
    const composer = screen.getByRole("form", { name: /Message CyberGuard/i });
    expect(screen.getAllByRole("textbox", { name: /type your chat message/i })).toHaveLength(1);
    expect(within(composer).getByRole("button", { name: /send chat message/i })).toBeDisabled();
    expect(log.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(document.querySelector("[data-testid^='chat-message-answer-']")).not.toBeInTheDocument();
  });

  test("new chat without an active conversation still renders quick prompts", async () => {
    await renderCyberGuardPilotFixture({
      activeConversation: null,
      conversations: [],
      messages: [],
      chatOverrides: {
        getChatConversation: jest.fn(),
      },
    });

    const emptyState = screen.getByRole("region", { name: /start with a cyber-safety question/i });
    expect(within(emptyState).getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("textbox", { name: /type your chat message/i })).toHaveValue("");
    expect(screen.getByRole("button", { name: /send chat message/i })).toBeDisabled();
  });

  test("uses the production hash route for the full CyberGuard page", async () => {
    await renderCyberGuardPilotFixture({ route: "#/ai-chat" });

    expect(window.location.hash).toBe("#/ai-chat");
    expect(screen.getByRole("log", { name: /chat message history/i })).toBeInTheDocument();
  });

  test("conversation history groups loaded conversations by local calendar recency", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const today = within(sidebar).getByRole("heading", { name: "Today" });
    const yesterday = within(sidebar).getByRole("heading", { name: "Yesterday" });
    const earlier = within(sidebar).getByRole("heading", { name: "Earlier" });

    expect(today).toHaveClass("ai-chat-history-group-heading");
    expect(today.tagName).toBe("H3");
    expect(today.closest(".ai-chat-history-group-heading")).not.toHaveAttribute("role", "button");
    expect(today.closest(".ai-chat-history-group-heading")).not.toHaveAttribute("aria-expanded");
    expect(follows(today, yesterday)).toBe(true);
    expect(follows(yesterday, earlier)).toBe(true);
    expect(conversationTitlesIn(sidebar)).toEqual([
      "Today phishing check",
      "Today future check",
      "Yesterday password review",
      "Earlier privacy practice",
      "Missing timestamp check",
      "Invalid timestamp check",
      "Later future check",
    ]);
    expect(within(sidebar).getByText("Today phishing check").closest(".ai-chat-list-item")).toHaveClass("active");
  });

  test("conversation grouping preserves source order inside each group without chat API calls", async () => {
    useFixedLocalNow();
    const sourceOrderedFixtures = [
      conversationWithDate(7201, "Yesterday first source item", localIso(2026, 6, 28, 9, 0)),
      conversationWithDate(7202, "Today first source item", localIso(2026, 6, 29, 8, 0)),
      conversationWithDate(7203, "Earlier first source item", localIso(2026, 6, 25, 8, 0)),
      conversationWithDate(7204, "Today second source item", localIso(2026, 6, 29, 7, 0)),
      conversationWithDate(7205, "Yesterday second source item", localIso(2026, 6, 28, 7, 0)),
    ];
    await renderCyberGuardPilotFixture({
      conversations: sourceOrderedFixtures,
      activeConversation: sourceOrderedFixtures[1],
    });

    listChatConversations.mockClear();
    getChatConversation.mockClear();

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(conversationTitlesIn(sidebar)).toEqual([
      "Today first source item",
      "Today second source item",
      "Yesterday first source item",
      "Yesterday second source item",
      "Earlier first source item",
    ]);
    expect(within(sidebar).getByRole("button", { current: true })).toHaveAccessibleName(/Yesterday first source item/i);
    expect(listChatConversations).not.toHaveBeenCalled();
    expect(getChatConversation).not.toHaveBeenCalled();
  });

  test("pinning a conversation creates one Pinned group before date groups without chat API calls", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[1],
    });

    listChatConversations.mockClear();
    getChatConversation.mockClear();
    renameChatConversation.mockClear();
    deleteChatConversation.mockClear();

    const activeBeforePin = within(screen.getByLabelText(/conversation history/i)).getByRole("button", { current: true }).textContent;

    await openConversationMenu("Yesterday password review");
    await userEvent.click(screen.getByRole("menuitem", { name: /^pin conversation$/i }));

    const sidebar = screen.getByLabelText(/conversation history/i);
    const pinned = within(sidebar).getByRole("heading", { name: "Pinned" });
    const today = within(sidebar).getByRole("heading", { name: "Today" });

    expect(follows(pinned, today)).toBe(true);
    expect(within(historyGroupSection(sidebar, "Pinned")).getByText("Yesterday password review")).toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Yesterday" })).not.toBeInTheDocument();
    expect(conversationTitlesIn(sidebar).filter(title => title === "Yesterday password review")).toHaveLength(1);
    expect(within(sidebar).getByRole("button", { current: true }).textContent).toBe(activeBeforePin);
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([7102]);
    expect(listChatConversations).not.toHaveBeenCalled();
    expect(getChatConversation).not.toHaveBeenCalled();
    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(deleteChatConversation).not.toHaveBeenCalled();
  });

  test("unpinned conversations return to date grouping and stale pin ids do not render", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([99999, 7101])],
      ],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(historyGroupSection(sidebar, "Pinned")).getByText("Today phishing check")).toBeInTheDocument();
    expect(screen.queryByText("99999")).not.toBeInTheDocument();

    await openConversationMenu("Today phishing check");
    await userEvent.click(screen.getByRole("menuitem", { name: /^unpin conversation$/i }));

    expect(within(sidebar).queryByRole("heading", { name: "Pinned" })).not.toBeInTheDocument();
    expect(within(historyGroupSection(sidebar, "Today")).getByText("Today phishing check")).toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([]);
  });

  test("pin state is scoped to the authenticated user and invalid storage is ignored", async () => {
    useFixedLocalNow();

    await renderCyberGuardPilotFixture({
      user: {
        id: 9002,
        email: "cyberguard-learner-b@example.test",
        displayName: "CyberGuard Learner B",
        name: "CyberGuard Learner B",
        age: 15,
        ageGroup: "teen_13_15",
        role: "user",
        accountStatus: "active",
      },
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7103])],
        [pinnedConversationStorageKey(9002), "{bad json"],
      ],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(sidebar).queryByRole("heading", { name: "Pinned" })).not.toBeInTheDocument();
    expect(conversationTitlesIn(sidebar)[0]).toBe("Today phishing check");
  });

  test("pinned search matches titles, temporarily expands Pinned, and clear restores manual collapse", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7103])],
      ],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    await userEvent.click(historyGroupButton(sidebar, "Pinned"));
    expect(historyGroupButton(sidebar, "Pinned")).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();

    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "privacy");

    expect(historyGroupButton(sidebar, "Pinned")).toHaveAttribute("aria-expanded", "true");
    expect(within(historyGroupSection(sidebar, "Pinned")).getByText("Earlier privacy practice")).toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Earlier" })).not.toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /clear conversation search/i }));

    expect(historyGroupButton(sidebar, "Pinned")).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();
  });

  test("New Chat clears search while preserving pinned state and manual Pinned collapse", async () => {
    useFixedLocalNow();
    const createdConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7691,
      title: "Fresh CyberGuard chat",
    };

    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7103])],
      ],
      chatOverrides: {
        createChatConversation: () => Promise.resolve({ ok: true, conversation: createdConversation }),
        getChatConversation: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            conversation: groupedConversationFixtures[0],
            messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
            actions: [{ messageId: cyberGuardPilotAssistantMessage.id, actions: [cyberGuardPilotAction] }],
            sources: [{ messageId: cyberGuardPilotAssistantMessage.id, sources: [cyberGuardPilotSource] }],
            generations: [],
          })
          .mockResolvedValueOnce({
            ok: true,
            conversation: createdConversation,
            messages: [],
            actions: [],
            sources: [],
            generations: [],
          }),
      },
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });

    await userEvent.click(historyGroupButton(sidebar, "Pinned"));
    await userEvent.type(search, "privacy");
    expect(historyGroupButton(sidebar, "Pinned")).toHaveAttribute("aria-expanded", "true");

    await userEvent.click(screen.getByRole("button", { name: /^New Chat$/i }));

    await screen.findByRole("region", { name: /start with a cyber-safety question/i });
    expect(search).toHaveValue("");
    expect(historyGroupButton(sidebar, "Pinned")).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([7103]);
  });

  test("archiving creates an Archived entry, removes it from normal groups, and keeps active chat usable without chat API calls", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[1],
    });

    listChatConversations.mockClear();
    getChatConversation.mockClear();
    renameChatConversation.mockClear();
    deleteChatConversation.mockClear();

    await openConversationMenu("Yesterday password review");
    await userEvent.click(screen.getByRole("menuitem", { name: /^archive conversation$/i }));

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(sidebar).queryByText("Yesterday password review")).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Yesterday" })).not.toBeInTheDocument();
    expect(screen.getByRole("log", { name: /chat message history/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /type your chat message/i })).toBeEnabled();
    expect(screen.getByText("Pause before opening links and compare the sender, link, and request.")).toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /^Archived$/i }));

    expect(conversationTitlesIn(sidebar)).toEqual(["Yesterday password review"]);
    expect(within(sidebar).queryByRole("heading", { name: "Pinned" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Today" })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([7102]);
    expect(listChatConversations).not.toHaveBeenCalled();
    expect(getChatConversation).not.toHaveBeenCalled();
    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(deleteChatConversation).not.toHaveBeenCalled();
  });

  test("archived pinned conversation returns to Pinned after unarchive and renders exactly once", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7103])],
        [archivedConversationStorageKey(9001), JSON.stringify([7103])],
      ],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /^Archived$/i }));
    expect(conversationTitlesIn(sidebar)).toEqual(["Earlier privacy practice"]);

    await openConversationMenu("Earlier privacy practice");
    await userEvent.click(screen.getByRole("menuitem", { name: /^unarchive conversation$/i }));

    expect(within(sidebar).getByRole("button", { name: /^Chats$/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(historyGroupSection(sidebar, "Pinned")).getByText("Earlier privacy practice")).toBeInTheDocument();
    expect(conversationTitlesIn(sidebar).filter(title => title === "Earlier privacy practice")).toHaveLength(1);
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([7103]);
    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([]);
  });

  test("normal and archived searches are isolated and switching views clears search without changing active conversation", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [archivedConversationStorageKey(9001), JSON.stringify([7102])],
      ],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });

    await userEvent.type(search, "password");
    expect(within(sidebar).queryByText("Yesterday password review")).not.toBeInTheDocument();
    expect(within(sidebar).getByText(/No conversations match your search/i)).toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /^Archived$/i }));
    expect(search).toHaveValue("");
    expect(within(sidebar).getByText("Yesterday password review")).toBeInTheDocument();
    expect(screen.getByText(/Pause before opening links and compare the sender/i)).toBeInTheDocument();

    await userEvent.type(search, "today");
    expect(within(sidebar).queryByText("Yesterday password review")).not.toBeInTheDocument();
    expect(within(sidebar).getByText(/No archived conversations match your search/i)).toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /^Chats$/i }));
    expect(search).toHaveValue("");
    expect(within(sidebar).getByText("Today phishing check")).toBeInTheDocument();
  });

  test("New Chat returns to Chats view while preserving archived and pinned state", async () => {
    useFixedLocalNow();
    const createdConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7692,
      title: "Fresh unarchived chat",
    };

    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7103])],
        [archivedConversationStorageKey(9001), JSON.stringify([7102])],
      ],
      chatOverrides: {
        createChatConversation: () => Promise.resolve({ ok: true, conversation: createdConversation }),
        getChatConversation: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            conversation: groupedConversationFixtures[0],
            messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
            actions: [{ messageId: cyberGuardPilotAssistantMessage.id, actions: [cyberGuardPilotAction] }],
            sources: [{ messageId: cyberGuardPilotAssistantMessage.id, sources: [cyberGuardPilotSource] }],
            generations: [],
          })
          .mockResolvedValueOnce({
            ok: true,
            conversation: createdConversation,
            messages: [],
            actions: [],
            sources: [],
            generations: [],
          }),
      },
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    await userEvent.click(within(sidebar).getByRole("button", { name: /^Archived$/i }));
    await userEvent.type(within(sidebar).getByRole("searchbox", { name: /search conversations/i }), "password");

    await userEvent.click(screen.getByRole("button", { name: /^New Chat$/i }));

    await screen.findByRole("region", { name: /start with a cyber-safety question/i });
    expect(within(sidebar).getByRole("button", { name: /^Chats$/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(sidebar).getByRole("searchbox", { name: /search conversations/i })).toHaveValue("");
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([7103]);
    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([7102]);
    expect(within(sidebar).queryByText("Yesterday password review")).not.toBeInTheDocument();
  });

  test("conversation search filters before grouping and does not match group headings", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });

    await userEvent.type(search, "today");

    expect(within(sidebar).getByRole("heading", { name: "Today" })).toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Yesterday" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Earlier" })).not.toBeInTheDocument();
    expect(conversationTitlesIn(sidebar)).toEqual(["Today phishing check", "Today future check"]);

    await userEvent.click(within(sidebar).getByRole("button", { name: /clear conversation search/i }));
    expect(within(sidebar).getByRole("heading", { name: "Yesterday" })).toBeInTheDocument();
    expect(within(sidebar).getByRole("heading", { name: "Earlier" })).toBeInTheDocument();

    await userEvent.type(search, "yesterday");
    expect(within(sidebar).queryByRole("heading", { name: "Today" })).not.toBeInTheDocument();
    expect(within(sidebar).getByRole("heading", { name: "Yesterday" })).toBeInTheDocument();
    expect(conversationTitlesIn(sidebar)).toEqual(["Yesterday password review"]);
  });

  test("conversation grouping preserves no-result and empty-history states", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    await userEvent.type(within(sidebar).getByRole("searchbox", { name: /search conversations/i }), "no such title");

    expect(within(sidebar).getByText(/No conversations match your search/i)).toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Today" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Yesterday" })).not.toBeInTheDocument();
    expect(within(sidebar).queryByRole("heading", { name: "Earlier" })).not.toBeInTheDocument();

    cleanup();

    await renderCyberGuardPilotFixture({
      activeConversation: null,
      conversations: [],
      messages: [],
      chatOverrides: {
        getChatConversation: jest.fn(),
      },
    });

    expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Today" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Yesterday" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Earlier" })).not.toBeInTheDocument();
  });

  test("mobile drawer renders the same grouped conversation result and keeps Escape priority", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const historyTrigger = screen.getByRole("button", { name: /open chat history/i });
    historyTrigger.focus();
    await userEvent.click(historyTrigger);

    const drawer = await screen.findByRole("dialog", { name: /conversation history/i });
    expect(conversationTitlesIn(drawer)).toEqual([
      "Today phishing check",
      "Today future check",
      "Yesterday password review",
      "Earlier privacy practice",
      "Missing timestamp check",
      "Invalid timestamp check",
      "Later future check",
    ]);

    const todayMenuButton = within(drawer).getByRole("button", { name: /open menu for Today phishing check/i });
    await userEvent.click(todayMenuButton);
    expect(screen.getAllByRole("menuitem", { name: /^pin conversation$/i })).toHaveLength(1);
    await userEvent.click(todayMenuButton);

    const search = within(drawer).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "yesterday");
    expect(within(drawer).queryByRole("heading", { name: "Today" })).not.toBeInTheDocument();
    expect(within(drawer).getByRole("heading", { name: "Yesterday" })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(document.getElementById("ai-chat-history-drawer")).toBeInTheDocument();
    expect(search).toHaveValue("");
    expect(within(drawer).getByRole("heading", { name: "Today" })).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument());
    await waitFor(() => expect(historyTrigger).toHaveFocus());
  });

  test("mobile drawer keeps open when Escape closes the export dialog first", async () => {
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const drawer = await openMobileHistoryDrawer();
    const { dialog: exportDialog, menuButton } = await openActiveConversationExportDialog(drawer, "Today phishing check");
    expect(within(exportDialog).getByRole("group", { name: /^Format$/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Export conversation/i })).not.toBeInTheDocument());
    expect(document.getElementById("ai-chat-history-drawer")).toBeInTheDocument();
    await waitFor(() => expect(menuButton).toHaveFocus());
  });

  test("mobile drawer export dialog renders in a top-level layer above the drawer", async () => {
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const drawer = await openMobileHistoryDrawer();
    const drawerLayer = document.querySelector(".ai-chat-drawer-layer");
    const { dialog: exportDialog } = await openActiveConversationExportDialog(drawer, "Today phishing check");
    const exportLayer = document.querySelector(".cyberguard-export-dialog-layer");

    expect(exportLayer).toBeInTheDocument();
    expect(exportLayer?.parentElement).toBe(document.body);
    expect(exportLayer).toContainElement(exportDialog);
    expect(exportLayer).not.toContainElement(drawer);
    expect(drawerLayer).not.toContainElement(exportLayer);
    expect(drawerLayer).toBeInTheDocument();
    expect(Array.from(document.body.children).indexOf(exportLayer)).toBeGreaterThan(
      Array.from(document.body.children).indexOf(drawerLayer?.parentElement)
    );
  });

  test("mobile drawer keeps open when Escape closes a conversation menu first", async () => {
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const historyTrigger = screen.getByRole("button", { name: /open chat history/i });
    const drawer = await openMobileHistoryDrawer();
    const menuButton = await openConversationMenuIn(drawer, "Today phishing check");
    expect(screen.getAllByRole("menuitem", { name: /^pin conversation$/i })).toHaveLength(1);

    fireEvent.keyDown(document, { key: "Escape" });

    expect(screen.queryByRole("menuitem", { name: /^pin conversation$/i })).not.toBeInTheDocument();
    expect(document.getElementById("ai-chat-history-drawer")).toBeInTheDocument();
    await waitFor(() => expect(menuButton).toHaveFocus());

    fireEvent.keyDown(document, { key: "Escape" });
    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument());
    await waitFor(() => expect(historyTrigger).toHaveFocus());
  });

  test("conversation date groups expose accessible collapse controls and start expanded", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    for (const label of ["Today", "Yesterday", "Earlier"]) {
      const control = historyGroupButton(sidebar, label);
      const chevron = control.querySelector(".ai-chat-history-group-chevron");
      expect(control).toHaveAttribute("aria-expanded", "true");
      expect(control).toHaveAttribute("aria-controls");
      expect(document.getElementById(control.getAttribute("aria-controls"))).toBeInTheDocument();
      expect(chevron).toHaveAttribute("aria-hidden", "true");
      expect(chevron).toHaveClass("is-expanded");
      expect(chevron).toBeEmptyDOMElement();
    }
    expect(conversationTitlesIn(sidebar)).toContain("Earlier privacy practice");
  });

  test("collapsing Earlier hides only Earlier items and re-expanding restores source order", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    listChatConversations.mockClear();
    getChatConversation.mockClear();

    const sidebar = screen.getByLabelText(/conversation history/i);
    const earlierControl = historyGroupButton(sidebar, "Earlier");
    await userEvent.click(earlierControl);

    expect(earlierControl).toHaveAttribute("aria-expanded", "false");
    expect(earlierControl.querySelector(".ai-chat-history-group-chevron")).not.toHaveClass("is-expanded");
    expect(earlierControl.querySelector(".ai-chat-history-group-chevron")).toBeEmptyDOMElement();
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();
    expect(within(sidebar).getByText("Today phishing check")).toBeInTheDocument();
    expect(within(sidebar).getByText("Yesterday password review")).toBeInTheDocument();
    expect(listChatConversations).not.toHaveBeenCalled();
    expect(getChatConversation).not.toHaveBeenCalled();

    await userEvent.click(earlierControl);

    expect(earlierControl).toHaveAttribute("aria-expanded", "true");
    expect(earlierControl.querySelector(".ai-chat-history-group-chevron")).toHaveClass("is-expanded");
    expect(conversationTitlesIn(sidebar)).toEqual([
      "Today phishing check",
      "Today future check",
      "Yesterday password review",
      "Earlier privacy practice",
      "Missing timestamp check",
      "Invalid timestamp check",
      "Later future check",
    ]);
  });

  test("search temporarily expands matching collapsed groups and clearing search restores manual state", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const earlierControl = historyGroupButton(sidebar, "Earlier");
    await userEvent.click(earlierControl);
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();

    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "earlier");

    expect(historyGroupButton(sidebar, "Earlier")).toHaveAttribute("aria-expanded", "true");
    expect(within(sidebar).getByText("Earlier privacy practice")).toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /clear conversation search/i }));

    expect(historyGroupButton(sidebar, "Earlier")).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebar).queryByText("Earlier privacy practice")).not.toBeInTheDocument();
  });

  test("desktop and mobile drawer share group collapse state without changing the active conversation", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const historyTrigger = screen.getByRole("button", { name: /open chat history/i });
    await userEvent.click(historyTrigger);

    const drawer = await screen.findByRole("dialog", { name: /conversation history/i });
    await userEvent.click(historyGroupButton(drawer, "Today"));

    expect(historyGroupButton(drawer, "Today")).toHaveAttribute("aria-expanded", "false");
    expect(within(drawer).queryByText("Today phishing check")).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument());

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(historyGroupButton(sidebar, "Today")).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebar).queryByText("Today phishing check")).not.toBeInTheDocument();

    await userEvent.click(historyGroupButton(sidebar, "Today"));
    expect(within(sidebar).getByText("Today phishing check").closest(".ai-chat-list-item")).toHaveClass("active");
  });

  test("New Chat clears search while preserving manual group collapse state", async () => {
    useFixedLocalNow();
    const createdConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7111,
      title: "Fresh CyberGuard chat",
    };
    await renderCyberGuardPilotFixture({
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      chatOverrides: {
        createChatConversation: () => Promise.resolve({ ok: true, conversation: createdConversation }),
        getChatConversation: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            conversation: groupedConversationFixtures[0],
            messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
            actions: [{ messageId: cyberGuardPilotAssistantMessage.id, actions: [cyberGuardPilotAction] }],
            sources: [{ messageId: cyberGuardPilotAssistantMessage.id, sources: [cyberGuardPilotSource] }],
            generations: [],
          })
          .mockResolvedValueOnce({
            ok: true,
            conversation: createdConversation,
            messages: [],
            actions: [],
            sources: [],
            generations: [],
          }),
      },
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    await userEvent.click(historyGroupButton(sidebar, "Yesterday"));
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "today");

    await userEvent.click(screen.getByRole("button", { name: /^New Chat$/i }));

    await screen.findByRole("region", { name: /start with a cyber-safety question/i });
    expect(search).toHaveValue("");
    expect(historyGroupButton(sidebar, "Yesterday")).toHaveAttribute("aria-expanded", "false");
    expect(within(sidebar).queryByText("Yesterday password review")).not.toBeInTheDocument();
  });

  test("desktop conversation search filters loaded titles without API calls or active-chat changes", async () => {
    await renderCyberGuardPilotFixture({
      conversations: conversationSearchFixtures,
      activeConversation: conversationSearchFixtures[1],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });

    expect(search).toHaveAttribute("placeholder", "Search conversation titles");
    expect(within(sidebar).getByText("Phishing safety practice")).toBeInTheDocument();
    expect(within(sidebar).getByText("Password account check")).toBeInTheDocument();
    expect(within(sidebar).getByText("How to identify phishing links")).toBeInTheDocument();

    listChatConversations.mockClear();
    getChatConversation.mockClear();

    await userEvent.type(search, "  PHISH ");

    expect(search).toHaveValue("  PHISH ");
    expect(within(sidebar).getByText("Phishing safety practice")).toBeInTheDocument();
    expect(within(sidebar).getByText("How to identify phishing links")).toBeInTheDocument();
    expect(within(sidebar).queryByText("Password account check")).not.toBeInTheDocument();
    expect(listChatConversations).not.toHaveBeenCalled();
    expect(getChatConversation).not.toHaveBeenCalled();
    expect(within(sidebar).getByRole("button", { current: true })).toHaveAccessibleName(/Phishing safety practice/i);
    expect(screen.getByRole("log", { name: /chat message history/i })).toBeInTheDocument();
  });

  test("first persisted learner message in an empty default conversation generates one searchable automatic title", async () => {
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7601,
      title: "New chat",
      messageCount: 0,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7602,
      conversationId: emptyDefaultConversation.id,
      content: "How can I\n\nidentify     phishing links?",
    };
    const assistantReply = {
      ...cyberGuardPilotAssistantMessage,
      id: 7603,
      conversationId: emptyDefaultConversation.id,
      replyToMessageId: persistedUserMessage.id,
    };
    const renamedConversation = {
      ...emptyDefaultConversation,
      title: "How can I identify phishing links?",
      messageCount: 1,
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          message: persistedUserMessage,
        }),
        renameChatConversation: jest.fn().mockResolvedValue({
          ok: true,
          conversation: renamedConversation,
        }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: renamedConversation,
          userMessage: persistedUserMessage,
          assistantMessage: assistantReply,
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(
      screen.getByRole("textbox", { name: /type your chat message/i }),
      "How can I\n\nidentify     phishing links?"
    );
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => {
      expect(renameChatConversation).toHaveBeenCalledTimes(1);
    });
    expect(renameChatConversation).toHaveBeenCalledWith(
      emptyDefaultConversation.id,
      "How can I identify phishing links?"
    );
    expect(generateChatAssistantReply).toHaveBeenCalledWith(
      emptyDefaultConversation.id,
      persistedUserMessage.id,
      expect.any(Object)
    );

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(sidebar).getByText("How can I identify phishing links?")).toBeInTheDocument();
    expect(within(sidebar).queryByText("New chat")).not.toBeInTheDocument();

    await userEvent.type(
      within(sidebar).getByRole("searchbox", { name: /search conversations/i }),
      "phishing links"
    );

    expect(conversationTitlesIn(sidebar)).toEqual(["How can I identify phishing links?"]);
    expect(createChatUserMessage).toHaveBeenCalledTimes(1);
    expect(listChatConversations).toHaveBeenCalledTimes(1);
  });

  test("newly created default conversation uses returned conversation as automatic-title fallback", async () => {
    const createdConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7641,
      title: "New chat",
      messageCount: 1,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7642,
      conversationId: createdConversation.id,
      content: "How can I identify a fake banking message?",
    };
    const renamedConversation = {
      ...createdConversation,
      title: "How can I identify a fake banking message?",
    };
    const assistantReply = {
      ...cyberGuardPilotAssistantMessage,
      id: 7643,
      conversationId: createdConversation.id,
      replyToMessageId: persistedUserMessage.id,
    };

    await renderCyberGuardPilotFixture({
      conversations: [],
      activeConversation: null,
      messages: [],
      chatOverrides: {
        createChatConversation: jest.fn().mockResolvedValue({
          ok: true,
          conversation: createdConversation,
          messages: [persistedUserMessage],
        }),
        renameChatConversation: jest.fn().mockResolvedValue({
          ok: true,
          conversation: renamedConversation,
        }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: renamedConversation,
          userMessage: persistedUserMessage,
          assistantMessage: assistantReply,
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(
      screen.getByRole("textbox", { name: /type your chat message/i }),
      "How can I identify a fake banking message?"
    );
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(1));
    expect(renameChatConversation).toHaveBeenCalledWith(
      createdConversation.id,
      "How can I identify a fake banking message?"
    );
    expect(generateChatAssistantReply).toHaveBeenCalledTimes(1);
    expect(generateChatAssistantReply).toHaveBeenCalledWith(
      createdConversation.id,
      persistedUserMessage.id,
      expect.any(Object)
    );

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(conversationTitlesIn(sidebar)).toEqual(["How can I identify a fake banking message?"]);
    expect(createChatConversation).toHaveBeenCalledTimes(1);
    expect(createChatUserMessage).not.toHaveBeenCalled();
  });

  test("late new-conversation response is ignored after the authenticated user changes", async () => {
    const createConversationRequest = createDeferred();
    const userB = {
      id: 9002,
      email: "cyberguard-learner-b@example.test",
      displayName: "CyberGuard Learner B",
      name: "CyberGuard Learner B",
      age: 15,
      ageGroup: "teen_13_15",
      role: "user",
      accountStatus: "active",
    };
    const userAConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7646,
      title: "New chat",
      messageCount: 1,
    };
    const userAMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7647,
      conversationId: userAConversation.id,
      content: "User A suspicious link question",
    };

    await renderCyberGuardPilotFixture({
      conversations: [],
      activeConversation: null,
      messages: [],
      chatOverrides: {
        listChatConversations: jest.fn().mockResolvedValue({ ok: true, conversations: [] }),
        createChatConversation: jest.fn().mockImplementation(() => createConversationRequest.promise),
        renameChatConversation: jest.fn().mockResolvedValue({
          ok: true,
          conversation: {
            ...userAConversation,
            title: "User A suspicious link question",
          },
        }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: userAConversation,
          userMessage: userAMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7648,
            conversationId: userAConversation.id,
            replyToMessageId: userAMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "User A suspicious link question");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));
    await waitFor(() => expect(createChatConversation).toHaveBeenCalledTimes(1));

    await logoutCurrentUser();
    await loginAsUser(userB);

    await act(async () => {
      createConversationRequest.resolve({
        ok: true,
        conversation: userAConversation,
        messages: [userAMessage],
      });
      await createConversationRequest.promise;
    });

    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(generateChatAssistantReply).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: /^CyberGuard$/i }));
    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(conversationTitlesIn(sidebar)).toEqual([]);
    expect(screen.queryByText("User A suspicious link question")).not.toBeInTheDocument();
  });

  test("late automatic title response is ignored after logout", async () => {
    const automaticRename = createDeferred();
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7649,
      title: "New chat",
      messageCount: 0,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7650,
      conversationId: emptyDefaultConversation.id,
      content: "How can I identify a fake banking message?",
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          message: persistedUserMessage,
        }),
        renameChatConversation: jest.fn().mockImplementation(() => automaticRename.promise),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          userMessage: persistedUserMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7654,
            conversationId: emptyDefaultConversation.id,
            replyToMessageId: persistedUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "How can I identify a fake banking message?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));
    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(1));

    await logoutCurrentUser();

    await act(async () => {
      automaticRename.resolve({
        ok: true,
        conversation: {
          ...emptyDefaultConversation,
          title: "How can I identify a fake banking message?",
          messageCount: 1,
        },
      });
      await automaticRename.promise;
    });

    expect(listChatConversations).toHaveBeenCalledTimes(1);
    expect(getChatConversation).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("How can I identify a fake banking message?")).not.toBeInTheDocument();
  });

  test("automatic title is not requested after failed message persistence", async () => {
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7611,
      title: "New chat",
      messageCount: 0,
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: false,
          error: "Unable to send message",
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "Will this send?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => expect(createChatUserMessage).toHaveBeenCalledTimes(1));
    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(generateChatAssistantReply).not.toHaveBeenCalled();
  });

  test("automatic title is not requested for later messages or meaningful titles", async () => {
    const meaningfulConversation = {
      ...cyberGuardPilotConversation,
      id: 7621,
      title: "Manual phishing study",
      messageCount: 2,
    };
    const nextUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7622,
      conversationId: meaningfulConversation.id,
      content: "This should not rename the chat",
    };

    await renderCyberGuardPilotFixture({
      conversations: [meaningfulConversation],
      activeConversation: meaningfulConversation,
      messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: meaningfulConversation,
          message: nextUserMessage,
        }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: meaningfulConversation,
          userMessage: nextUserMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7623,
            conversationId: meaningfulConversation.id,
            replyToMessageId: nextUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "This should not rename the chat");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => expect(generateChatAssistantReply).toHaveBeenCalled());
    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/conversation history/i).querySelector(".ai-chat-list-title")).toHaveTextContent(
      "Manual phishing study"
    );
  });

  test("automatic title failure does not block the sent message or assistant generation", async () => {
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7631,
      title: "New chat",
      messageCount: 0,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7632,
      conversationId: emptyDefaultConversation.id,
      content: "How do I check a suspicious SMS?",
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          message: persistedUserMessage,
        }),
        renameChatConversation: jest.fn().mockResolvedValue({
          ok: false,
          error: "Rename unavailable",
        }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          userMessage: persistedUserMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7633,
            conversationId: emptyDefaultConversation.id,
            replyToMessageId: persistedUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "How do I check a suspicious SMS?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(generateChatAssistantReply).toHaveBeenCalledWith(
      emptyDefaultConversation.id,
      persistedUserMessage.id,
      expect.any(Object)
    ));
    expect(screen.getByText("How do I check a suspicious SMS?")).toBeInTheDocument();
  });

  test("manual rename remains authoritative when automatic title response resolves late", async () => {
    // This verifies frontend-local title authority within the active lifecycle only.
    // It does not prove the server's final persisted title after a reload.
    const automaticRename = createDeferred();
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7651,
      title: "New chat",
      messageCount: 0,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7652,
      conversationId: emptyDefaultConversation.id,
      content: "How can I identify phishing links?",
    };
    const automaticConversation = {
      ...emptyDefaultConversation,
      title: "How can I identify phishing links?",
      messageCount: 1,
    };
    const manualConversation = {
      ...emptyDefaultConversation,
      title: "Cybersecurity Homework",
      messageCount: 1,
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          message: persistedUserMessage,
        }),
        renameChatConversation: jest.fn()
          .mockImplementationOnce(() => automaticRename.promise)
          .mockResolvedValueOnce({ ok: true, conversation: manualConversation }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          userMessage: persistedUserMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7653,
            conversationId: emptyDefaultConversation.id,
            replyToMessageId: persistedUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "How can I identify phishing links?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));
    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole("button", { name: /open menu for new chat/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /^rename$/i }));
    const renameInput = screen.getByRole("textbox", { name: /rename conversation/i });
    await userEvent.clear(renameInput);
    await userEvent.type(renameInput, "Cybersecurity Homework");
    await userEvent.click(screen.getByRole("button", { name: /^save$/i }));

    const sidebar = screen.getByLabelText(/conversation history/i);
    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(conversationTitlesIn(sidebar)).toEqual(["Cybersecurity Homework"]));

    automaticRename.resolve({ ok: true, conversation: automaticConversation });

    await waitFor(() => expect(conversationTitlesIn(sidebar)).toEqual(["Cybersecurity Homework"]));
    expect(generateChatAssistantReply).toHaveBeenCalledTimes(1);
    expect(listChatConversations).toHaveBeenCalledTimes(1);
    expect(getChatConversation).toHaveBeenCalledTimes(1);
  });

  test("late automatic title response does not reinsert a deleted conversation", async () => {
    const automaticRename = createDeferred();
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7661,
      title: "New chat",
      messageCount: 0,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7662,
      conversationId: emptyDefaultConversation.id,
      content: "How can I check a suspicious SMS?",
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          message: persistedUserMessage,
        }),
        renameChatConversation: jest.fn().mockImplementation(() => automaticRename.promise),
        deleteChatConversation: jest.fn().mockResolvedValue({ ok: true }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          userMessage: persistedUserMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7663,
            conversationId: emptyDefaultConversation.id,
            replyToMessageId: persistedUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "How can I check a suspicious SMS?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));
    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole("button", { name: /open menu for new chat/i }));
    await userEvent.click(screen.getByRole("menuitem", { name: /delete conversation new chat/i }));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));
    const sidebar = screen.getByLabelText(/conversation history/i);
    await waitFor(() => expect(conversationTitlesIn(sidebar)).toEqual([]));

    automaticRename.resolve({
      ok: true,
      conversation: {
        ...emptyDefaultConversation,
        title: "How can I check a suspicious SMS?",
        messageCount: 1,
      },
    });

    await waitFor(() => expect(screen.queryByText("How can I check a suspicious SMS?")).not.toBeInTheDocument());
    expect(conversationTitlesIn(sidebar)).toEqual([]);
    expect(listChatConversations).toHaveBeenCalledTimes(1);
    expect(getChatConversation).toHaveBeenCalledTimes(1);
  });

  test("successful delete removes a pinned id while failed delete preserves it", async () => {
    const pinnedConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7681,
      title: "Pinned delete target",
    };

    await renderCyberGuardPilotFixture({
      conversations: [pinnedConversation],
      activeConversation: pinnedConversation,
      messages: [],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7681])],
      ],
      chatOverrides: {
        deleteChatConversation: jest.fn()
          .mockResolvedValueOnce({ ok: false, error: "Delete failed" })
          .mockResolvedValueOnce({ ok: true }),
      },
    });

    await openConversationMenu("Pinned delete target");
    await userEvent.click(screen.getByRole("menuitem", { name: /delete conversation pinned delete target/i }));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await screen.findByText(/Unable to delete this conversation/i);
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([7681]);

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(screen.queryByText("Pinned delete target")).not.toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([]);
    expect(deleteChatConversation).toHaveBeenCalledTimes(2);
  });

  test("failed delete preserves archived and pinned ids while successful delete removes both", async () => {
    const archivedPinnedConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7682,
      title: "Archived pinned delete target",
    };

    await renderCyberGuardPilotFixture({
      conversations: [archivedPinnedConversation],
      activeConversation: archivedPinnedConversation,
      messages: [],
      localStorageEntries: [
        [pinnedConversationStorageKey(9001), JSON.stringify([7682])],
        [archivedConversationStorageKey(9001), JSON.stringify([7682])],
      ],
      chatOverrides: {
        deleteChatConversation: jest.fn()
          .mockResolvedValueOnce({ ok: false, error: "Delete failed" })
          .mockResolvedValueOnce({ ok: true }),
      },
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    await userEvent.click(within(sidebar).getByRole("button", { name: /^Archived$/i }));

    await openConversationMenu("Archived pinned delete target");
    await userEvent.click(screen.getByRole("menuitem", { name: /delete conversation archived pinned delete target/i }));
    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await screen.findByText(/Unable to delete this conversation/i);
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([7682]);
    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([7682]);

    await userEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    await waitFor(() => expect(screen.queryByText("Archived pinned delete target")).not.toBeInTheDocument());
    expect(JSON.parse(window.localStorage.getItem(pinnedConversationStorageKey(9001)))).toEqual([]);
    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([]);
    expect(deleteChatConversation).toHaveBeenCalledTimes(2);
  });

  test("archive state is user scoped and invalid storage is ignored", async () => {
    useFixedLocalNow();

    await renderCyberGuardPilotFixture({
      user: {
        id: 9002,
        email: "cyberguard-learner-b@example.test",
        displayName: "CyberGuard Learner B",
        name: "CyberGuard Learner B",
        age: 15,
        ageGroup: "teen_13_15",
        role: "user",
        accountStatus: "active",
      },
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
      localStorageEntries: [
        [archivedConversationStorageKey(9001), JSON.stringify([7101])],
        [archivedConversationStorageKey(9002), "{bad json"],
      ],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(conversationTitlesIn(sidebar)[0]).toBe("Today phishing check");
    await userEvent.click(within(sidebar).getByRole("button", { name: /^Archived$/i }));
    expect(within(sidebar).getByText(/No archived conversations/i)).toBeInTheDocument();
  });

  test("desktop and mobile drawer share archive state with one menu portal and Escape priority", async () => {
    useFixedLocalNow();
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    const historyTrigger = screen.getByRole("button", { name: /open chat history/i });
    historyTrigger.focus();
    await userEvent.click(historyTrigger);

    const drawer = await screen.findByRole("dialog", { name: /conversation history/i });
    await userEvent.click(within(drawer).getByRole("button", { name: /open menu for Yesterday password review/i }));
    expect(screen.getAllByRole("menuitem", { name: /^archive conversation$/i })).toHaveLength(1);
    await userEvent.click(screen.getByRole("menuitem", { name: /^archive conversation$/i }));
    await waitFor(() => {
      expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([7102]);
    });

    await userEvent.click(within(drawer).getByRole("button", { name: /^Archived$/i }));
    expect(conversationTitlesIn(drawer)).toEqual(["Yesterday password review"]);

    const search = within(drawer).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "missing");
    await userEvent.keyboard("{Escape}");
    expect(document.getElementById("ai-chat-history-drawer")).toBeInTheDocument();
    expect(search).toHaveValue("");

    await userEvent.click(within(drawer).getByRole("button", { name: /open menu for Yesterday password review/i }));
    expect(screen.getAllByRole("menuitem", { name: /^unarchive conversation$/i })).toHaveLength(1);
    await userEvent.click(screen.getByRole("menuitem", { name: /^unarchive conversation$/i }));

    expect(within(drawer).getByRole("button", { name: /^Chats$/i })).toHaveAttribute("aria-pressed", "true");
    expect(within(drawer).getByText("Yesterday password review")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument());
    await waitFor(() => expect(historyTrigger).toHaveFocus());
  });

  test("sending a message in an active archived conversation does not unarchive it", async () => {
    const activeArchivedConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7683,
      title: "Archived active conversation",
    };
    const persistedUserMessage = {
      ...cyberGuardPilotGeneratedUserMessage,
      id: 76831,
      conversationId: activeArchivedConversation.id,
      content: "Can I keep asking here?",
    };

    await renderCyberGuardPilotFixture({
      conversations: [activeArchivedConversation],
      activeConversation: activeArchivedConversation,
      messages: [],
      localStorageEntries: [
        [archivedConversationStorageKey(9001), JSON.stringify([7683])],
      ],
      chatOverrides: {
        createChatUserMessage: () => Promise.resolve({
          ok: true,
          conversation: {
            ...activeArchivedConversation,
            messageCount: 1,
          },
          message: persistedUserMessage,
        }),
        generateChatAssistantReply: () => Promise.resolve({
          ok: true,
          conversation: {
            ...activeArchivedConversation,
            messageCount: 2,
          },
          userMessage: persistedUserMessage,
          assistantMessage: {
            ...cyberGuardPilotGeneratedAssistantMessage,
            conversationId: activeArchivedConversation.id,
            replyToMessageId: persistedUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "Can I keep asking here?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => expect(createChatUserMessage).toHaveBeenCalledTimes(1));
    expect(JSON.parse(window.localStorage.getItem(archivedConversationStorageKey(9001)))).toEqual([7683]);
    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(sidebar).queryByText("Archived active conversation")).not.toBeInTheDocument();
    expect(screen.getByText("Can I keep asking here?")).toBeInTheDocument();
  });

  test("late automatic title response does not change the active conversation after switching", async () => {
    const automaticRename = createDeferred();
    const emptyDefaultConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7671,
      title: "New chat",
      messageCount: 0,
    };
    const secondConversation = {
      ...cyberGuardPilotConversation,
      id: 7674,
      title: "Password safety practice",
      messageCount: 2,
    };
    const persistedUserMessage = {
      ...cyberGuardPilotUserMessage,
      id: 7672,
      conversationId: emptyDefaultConversation.id,
      content: "How can I spot scam links?",
    };

    await renderCyberGuardPilotFixture({
      conversations: [emptyDefaultConversation, secondConversation],
      activeConversation: emptyDefaultConversation,
      messages: [],
      chatOverrides: {
        createChatUserMessage: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          message: persistedUserMessage,
        }),
        renameChatConversation: jest.fn().mockImplementation(() => automaticRename.promise),
        getChatConversation: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            conversation: emptyDefaultConversation,
            messages: [],
            actions: [],
            sources: [],
            generations: [],
          })
          .mockResolvedValueOnce({
            ok: true,
            conversation: secondConversation,
            messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
            actions: [{ messageId: cyberGuardPilotAssistantMessage.id, actions: [cyberGuardPilotAction] }],
            sources: [{ messageId: cyberGuardPilotAssistantMessage.id, sources: [cyberGuardPilotSource] }],
            generations: [],
          }),
        generateChatAssistantReply: jest.fn().mockResolvedValue({
          ok: true,
          conversation: { ...emptyDefaultConversation, messageCount: 1 },
          userMessage: persistedUserMessage,
          assistantMessage: {
            ...cyberGuardPilotAssistantMessage,
            id: 7673,
            conversationId: emptyDefaultConversation.id,
            replyToMessageId: persistedUserMessage.id,
          },
          sources: [],
          actions: [],
          proposal: null,
        }),
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "How can I spot scam links?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));
    await waitFor(() => expect(renameChatConversation).toHaveBeenCalledTimes(1));

    const sidebar = screen.getByLabelText(/conversation history/i);
    const secondConversationButton = within(sidebar)
      .getAllByRole("button", { name: /Password safety practice/i })
      .find(button => button.classList.contains("ai-chat-list-select"));
    expect(secondConversationButton).toBeTruthy();
    await userEvent.click(secondConversationButton);
    await screen.findByText("Phishing safety check");

    automaticRename.resolve({
      ok: true,
      conversation: {
        ...emptyDefaultConversation,
        title: "How can I spot scam links?",
        messageCount: 1,
      },
    });

    await waitFor(() => expect(within(screen.getByLabelText(/conversation history/i)).getByText("How can I spot scam links?")).toBeInTheDocument());
    expect(within(screen.getByLabelText(/conversation history/i)).getByText("Password safety practice").closest(".ai-chat-list-item")).toHaveClass("active");
    expect(screen.getByText("Phishing safety check")).toBeInTheDocument();
  });

  test("conversation search preserves result order and clear restores active styling", async () => {
    await renderCyberGuardPilotFixture({
      conversations: conversationSearchFixtures,
      activeConversation: conversationSearchFixtures[1],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });

    await userEvent.type(search, "phish");

    const visibleTitles = within(sidebar).getAllByText(/phishing/i).map(node => node.textContent);
    expect(visibleTitles).toEqual(["Phishing safety practice", "How to identify phishing links"]);
    expect(within(sidebar).queryByText("Password account check")).not.toBeInTheDocument();

    await userEvent.click(within(sidebar).getByRole("button", { name: /clear conversation search/i }));

    expect(search).toHaveValue("");
    expect(within(sidebar).getByText("Password account check")).toBeInTheDocument();
    expect(within(sidebar).getByText("Phishing safety practice").closest(".ai-chat-list-item")).toHaveClass("active");
  });

  test("conversation search shows no-result state separately from empty history", async () => {
    await renderCyberGuardPilotFixture({
      conversations: conversationSearchFixtures,
      activeConversation: conversationSearchFixtures[0],
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    await userEvent.type(within(sidebar).getByRole("searchbox", { name: /search conversations/i }), "privacy");

    expect(within(sidebar).getByText(/No conversations match your search/i)).toBeInTheDocument();
    expect(within(sidebar).queryByText(/No conversations yet/i)).not.toBeInTheDocument();
    expect(within(sidebar).getByLabelText(/new chat/i)).toBeInTheDocument();

    cleanup();

    await renderCyberGuardPilotFixture({
      activeConversation: null,
      conversations: [],
      messages: [],
      chatOverrides: {
        getChatConversation: jest.fn(),
      },
    });

    expect(screen.getByText(/No conversations yet/i)).toBeInTheDocument();
    expect(screen.queryByRole("searchbox", { name: /search conversations/i })).not.toBeInTheDocument();
  });

  test("New Chat clears conversation search without changing the primary button styling", async () => {
    const createdConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7011,
      title: "Fresh CyberGuard chat",
    };
    await renderCyberGuardPilotFixture({
      conversations: conversationSearchFixtures,
      activeConversation: conversationSearchFixtures[0],
      chatOverrides: {
        createChatConversation: () => Promise.resolve({ ok: true, conversation: createdConversation }),
        getChatConversation: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            conversation: conversationSearchFixtures[0],
            messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
            actions: [{ messageId: cyberGuardPilotAssistantMessage.id, actions: [cyberGuardPilotAction] }],
            sources: [{ messageId: cyberGuardPilotAssistantMessage.id, sources: [cyberGuardPilotSource] }],
            generations: [],
          })
          .mockResolvedValueOnce({
            ok: true,
            conversation: createdConversation,
            messages: [],
            actions: [],
            sources: [],
            generations: [],
          }),
      },
    });

    const sidebar = screen.getByLabelText(/conversation history/i);
    const search = within(sidebar).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "password");

    const newChat = screen.getByRole("button", { name: /^New Chat$/i });
    expect(newChat).toHaveClass("cy-button-primary");
    await userEvent.click(newChat);

    await screen.findByRole("region", { name: /start with a cyber-safety question/i });
    expect(search).toHaveValue("");
  });

  test("mobile drawer conversation search clears on Escape before the drawer closes", async () => {
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: conversationSearchFixtures,
      activeConversation: conversationSearchFixtures[0],
    });

    const historyTrigger = screen.getByRole("button", { name: /open chat history/i });
    historyTrigger.focus();
    await userEvent.click(historyTrigger);

    const drawer = await screen.findByRole("dialog", { name: /conversation history/i });
    const search = within(drawer).getByRole("searchbox", { name: /search conversations/i });
    await userEvent.type(search, "password");

    expect(within(drawer).getByText("Password account check")).toBeInTheDocument();
    expect(within(drawer).queryByText("Phishing safety practice")).not.toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    expect(document.getElementById("ai-chat-history-drawer")).toBeInTheDocument();
    expect(search).toHaveValue("");
    expect(within(drawer).getByText("Phishing safety practice")).toBeInTheDocument();

    await userEvent.keyboard("{Escape}");

    await waitFor(() => expect(document.getElementById("ai-chat-history-drawer")).not.toBeInTheDocument());
    await waitFor(() => expect(historyTrigger).toHaveFocus());
  });

  test("full CyberGuard route does not render the standard application footer", async () => {
    await renderCyberGuardPilotFixture({ route: "#/ai-chat" });

    expect(screen.getByRole("complementary", { name: /AI-supported guidance/i })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: /CyberGuard conversation workspace/i })).toBeInTheDocument();
    expect(screen.queryByText(/Built with care/i)).not.toBeInTheDocument();
  });

  test("normal non-chat routes still render the standard application footer", async () => {
    await renderCyberGuardPilotFixture({ route: "#/about" });

    expect(screen.getByText(/Built with care/i)).toBeInTheDocument();
  });

  test("quick prompt fills the composer draft without sending", async () => {
    await renderCyberGuardPilotFixture({
      activeConversation: cyberGuardPilotEmptyConversation,
      conversations: [cyberGuardPilotEmptyConversation],
      messages: [],
    });

    await userEvent.click(screen.getByRole("button", { name: /How can I tell if a message might be a scam\?/i }));

    const textbox = screen.getByRole("textbox", { name: /type your chat message/i });
    expect(textbox).toHaveValue("How can I tell if a message might be a scam?");
    expect(createChatUserMessage).not.toHaveBeenCalled();
    expect(generateChatAssistantReply).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: /Phishing safety check/i })).not.toBeInTheDocument();

    await userEvent.type(textbox, " Please make it short.");

    expect(textbox).toHaveValue("How can I tell if a message might be a scam? Please make it short.");
    expect(within(screen.getByRole("form", { name: /Message CyberGuard/i })).getByRole("button", { name: /send chat message/i })).toBeEnabled();
  });

  test("blue New Chat resets the full-page message log to the empty-state beginning", async () => {
    const createdConversation = {
      ...cyberGuardPilotEmptyConversation,
      id: 7010,
      title: "New CyberGuard chat",
    };
    await renderCyberGuardPilotFixture({
      chatOverrides: {
        createChatConversation: () => Promise.resolve({ ok: true, conversation: createdConversation }),
        getChatConversation: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            conversation: cyberGuardPilotConversation,
            messages: [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
            actions: [{ messageId: cyberGuardPilotAssistantMessage.id, actions: [cyberGuardPilotAction] }],
            sources: [{ messageId: cyberGuardPilotAssistantMessage.id, sources: [cyberGuardPilotSource] }],
            generations: [],
          })
          .mockResolvedValueOnce({
            ok: true,
            conversation: createdConversation,
            messages: [],
            actions: [],
            sources: [],
            generations: [],
          }),
      },
    });

    const log = screen.getByRole("log", { name: /chat message history/i });
    log.scrollTop = 240;

    await userEvent.click(screen.getByRole("button", { name: /^New Chat$/i }));

    await screen.findByRole("region", { name: /start with a cyber-safety question/i });
    expect(log.scrollTop).toBe(0);
    const emptyHeading = screen.getByText(/Start with a cyber-safety question/i);
    const promptGroup = screen.getByRole("group", { name: /Quick-start CyberGuard prompts/i });
    expect(emptyHeading.compareDocumentPosition(promptGroup) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(promptGroup).getAllByRole("button")).toHaveLength(4);
    expect(screen.getByRole("textbox", { name: /type your chat message/i })).toHaveValue("");
  });

  test("full-page composer exposes sending state and prevents duplicate submission", async () => {
    let resolveCreate;
    const pendingCreate = new Promise(resolve => {
      resolveCreate = resolve;
    });
    await renderCyberGuardPilotFixture({
      activeConversation: cyberGuardPilotEmptyConversation,
      conversations: [cyberGuardPilotEmptyConversation],
      messages: [],
      chatOverrides: {
        createChatUserMessage: () => pendingCreate,
      },
    });

    await userEvent.type(screen.getByRole("textbox", { name: /type your chat message/i }), "Help me check this message.");
    const composer = screen.getByRole("form", { name: /Message CyberGuard/i });
    const sendButton = within(composer).getByRole("button", { name: /send chat message/i });

    await userEvent.click(sendButton);

    await waitFor(() => expect(composer).toHaveAttribute("aria-busy", "true"));
    expect(within(composer).getAllByText(/Sending/i).length).toBeGreaterThan(0);
    expect(sendButton).toBeDisabled();

    await userEvent.click(sendButton);
    expect(createChatUserMessage).toHaveBeenCalledTimes(1);

    resolveCreate({
      ok: true,
      conversation: cyberGuardPilotEmptyConversation,
      message: {
        id: 7121,
        conversationId: cyberGuardPilotEmptyConversation.id,
        role: "user",
        content: "Help me check this message.",
      },
    });
    await waitFor(() => expect(generateChatAssistantReply).toHaveBeenCalledTimes(1));
    expect(await screen.findByRole("heading", { name: /Phishing safety check/i })).toBeInTheDocument();
  });

  test("quick prompts stay out of the floating widget and disappear after messages exist", async () => {
    await renderCyberGuardPilotFixture();

    expect(screen.queryByRole("region", { name: /start with a cyber-safety question/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("group", { name: /Quick-start CyberGuard prompts/i })).not.toBeInTheDocument();

    cleanup();

    await renderCyberGuardPilotFixture({
      route: "#/home",
      user: null,
      authResult: { ok: false, data: null },
    });

    await userEvent.click(await screen.findByRole("button", { name: /open chat widget/i }));
    expect(screen.queryByRole("group", { name: /Quick-start CyberGuard prompts/i })).not.toBeInTheDocument();
  });

  test("active conversation menu opens the export dialog and downloads Markdown without chat API calls", async () => {
    const download = installDownloadSpies();
    await renderCyberGuardPilotFixture();

    listChatConversations.mockClear();
    getChatConversation.mockClear();
    renameChatConversation.mockClear();
    deleteChatConversation.mockClear();
    createChatUserMessage.mockClear();
    generateChatAssistantReply.mockClear();

    await openConversationMenu(cyberGuardPilotConversation.title);
    const menu = screen.getByRole("menu", { name: new RegExp(cyberGuardPilotConversation.title, "i") });
    expect(within(menu).getAllByRole("menuitem").map(item => item.textContent)).toEqual([
      "Rename",
      "Pin conversation",
      "Archive conversation",
      "Export conversation",
      "Delete",
    ]);

    await userEvent.click(within(menu).getByRole("menuitem", { name: /^Export conversation$/i }));
    const dialog = await screen.findByRole("dialog", { name: /Export conversation/i });
    expect(within(dialog).getByText(cyberGuardPilotConversation.title)).toBeInTheDocument();
    expect(within(dialog).getByRole("radio", { name: /Markdown/i })).toBeChecked();
    expect(within(dialog).getByRole("radio", { name: /Plain text/i })).not.toBeChecked();

    await userEvent.click(within(dialog).getByRole("button", { name: /^Export$/i }));

    await waitFor(() => expect(download.createObjectURL).toHaveBeenCalledTimes(1));
    const blob = download.createObjectURL.mock.calls[0][0];
    const content = await readBlobText(blob);
    expect(content).toContain("# CyberGuard Conversation Export");
    expect(content).toContain("Recognising suspicious messages");
    expect(content).not.toContain("proposal-pilot-1");
    expect(download.anchorClicks).toHaveLength(1);
    expect(download.anchorClicks[0].download).toBe("cyberguard-cyberguard-pilot-baseline.md");
    expect(download.revokeObjectURL).toHaveBeenCalledWith("blob:cyberguard-export");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Export conversation/i })).not.toBeInTheDocument());

    expect(listChatConversations).not.toHaveBeenCalled();
    expect(getChatConversation).not.toHaveBeenCalled();
    expect(renameChatConversation).not.toHaveBeenCalled();
    expect(deleteChatConversation).not.toHaveBeenCalled();
    expect(createChatUserMessage).not.toHaveBeenCalled();
    expect(generateChatAssistantReply).not.toHaveBeenCalled();
    download.restore();
  });

  test("export dialog supports plain text and keeps the active conversation selected", async () => {
    const download = installDownloadSpies();
    await renderCyberGuardPilotFixture();

    await openConversationMenu(cyberGuardPilotConversation.title);
    await userEvent.click(screen.getByRole("menuitem", { name: /^Export conversation$/i }));
    const dialog = await screen.findByRole("dialog", { name: /Export conversation/i });
    await userEvent.click(within(dialog).getByRole("radio", { name: /Plain text/i }));
    await userEvent.click(within(dialog).getByRole("button", { name: /^Export$/i }));

    await waitFor(() => expect(download.createObjectURL).toHaveBeenCalledTimes(1));
    const blob = download.createObjectURL.mock.calls[0][0];
    const content = await readBlobText(blob);
    expect(content).toContain("CyberGuard Conversation Export");
    expect(content).not.toContain("## Phishing safety check");
    expect(download.anchorClicks[0].download).toBe("cyberguard-cyberguard-pilot-baseline.txt");
    const sidebar = screen.getByLabelText(/conversation history/i);
    expect(within(sidebar).getByRole("button", { name: new RegExp(`${cyberGuardPilotConversation.title} .*`, "i") })).toHaveAttribute("aria-current", "true");
    download.restore();
  });

  test("export dialog exposes format radios and traps keyboard focus", async () => {
    await renderCyberGuardPilotFixture();

    const sidebar = screen.getByLabelText(/conversation history/i);
    const { dialog, menuButton } = await openActiveConversationExportDialog(sidebar, cyberGuardPilotConversation.title);
    const formatGroup = within(dialog).getByRole("group", { name: /^Format$/i });
    const markdownRadio = within(formatGroup).getByRole("radio", { name: /Markdown/i });
    const textRadio = within(formatGroup).getByRole("radio", { name: /Plain text/i });
    const cancelButton = within(dialog).getByRole("button", { name: /^Cancel$/i });
    const exportButton = within(dialog).getByRole("button", { name: /^Export$/i });

    expect(markdownRadio).toHaveFocus();
    expect(textRadio).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    exportButton.focus();
    expect(exportButton).toHaveFocus();
    await userEvent.tab();
    expect(markdownRadio).toHaveFocus();
    markdownRadio.focus();
    await userEvent.tab({ shift: true });
    expect(exportButton).toHaveFocus();
    expect(dialog).toContainElement(document.activeElement);

    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog", { name: /Export conversation/i })).not.toBeInTheDocument());
    await waitFor(() => expect(menuButton).toHaveFocus());
  }, 15000);

  test("empty active conversations expose a disabled export action without creating a download", async () => {
    const download = installDownloadSpies();
    await renderCyberGuardPilotFixture({
      conversations: [cyberGuardPilotEmptyConversation],
      activeConversation: cyberGuardPilotEmptyConversation,
      messages: [],
    });

    await openConversationMenu(cyberGuardPilotEmptyConversation.title);
    expect(screen.getByRole("menuitem", { name: /^Export conversation$/i })).toBeDisabled();
    await userEvent.click(screen.getByRole("menuitem", { name: /^Export conversation$/i }));

    expect(screen.queryByRole("dialog", { name: /Export conversation/i })).not.toBeInTheDocument();
    expect(download.createObjectURL).not.toHaveBeenCalled();
    download.restore();
  });

  test("only the active conversation menu contains export across sidebar and mobile drawer", async () => {
    await renderCyberGuardPilotFixture({
      mobile: true,
      conversations: groupedConversationFixtures,
      activeConversation: groupedConversationFixtures[0],
    });

    await userEvent.click(screen.getByRole("button", { name: /open chat history/i }));
    const drawer = await screen.findByRole("dialog", { name: /conversation history/i });
    await userEvent.click(within(drawer).getByRole("button", { name: /open menu for Yesterday password review/i }));
    expect(screen.queryByRole("menuitem", { name: /^Export conversation$/i })).not.toBeInTheDocument();

    await userEvent.click(within(drawer).getByRole("button", { name: /open menu for Today phishing check/i }));
    expect(screen.getAllByRole("menuitem", { name: /^Export conversation$/i })).toHaveLength(1);
  });
});
