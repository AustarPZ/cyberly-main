// CyberGuard pilot Task 1 testability audit, verified from the current App.jsx runtime:
// - Mount-time calls for #/ai-chat: restoreSession() runs first; when authenticated,
//   ChatProvider calls listChatConversations(50), then getChatConversation(id) for
//   the selected active conversation. The tested route does not need profile,
//   account, progress, recommendation, resource, scenario, admin, or assessment
//   API mocks.
// - Mocked modules: ../api/authApi.js exports register, login, restoreSession,
//   refreshCurrentUser, verifyEmail, resendVerificationEmail, logout;
//   ../chat/chatApi.js exports listChatConversations,
//   createChatConversation, getChatConversation, renameChatConversation,
//   deleteChatConversation, createChatUserMessage, generateChatAssistantReply,
//   createLearnerActionProposal, confirmLearnerActionProposal, and
//   cancelLearnerActionProposal.
// - Auth fixture shape: restoreSession() returns { ok, data: { user, profile } }.
//   The user fixture includes id, email, displayName/name, age/ageGroup, role, and
//   accountStatus; the profile fixture includes onboardingCompleted plus current
//   learner profile fields used by session normalization and protected routing.
// - Routing: tests use the production hash route (#/ai-chat) and render the real App.
// - Browser shims: JSDOM lacks stable scrollTo and matchMedia behavior needed by the
//   current chat route and responsive drawer checks. No ResizeObserver or runtime
//   exports are required.
// - Stop condition check: this helper does not modify App.jsx, add runtime exports,
//   add a test-only route, change state orchestration, change API modules, or add a
//   dependency.

import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import {
  register,
  login,
  restoreSession,
  refreshCurrentUser,
  verifyEmail,
  resendVerificationEmail,
  logout,
} from "../api/authApi";
import {
  listChatConversations,
  createChatConversation,
  getChatConversation,
  renameChatConversation,
  deleteChatConversation,
  createChatUserMessage,
  generateChatAssistantReply,
  createLearnerActionProposal,
  confirmLearnerActionProposal,
  cancelLearnerActionProposal,
} from "../chat/chatApi";

const FIXED_CREATED_AT = "2026-07-28T04:00:00.000Z";

export const cyberGuardPilotProfile = {
  exists: true,
  onboardingCompleted: true,
  onboardingCompletedAt: "2026-07-01T00:00:00.000Z",
  profileLastConfirmedAt: "2026-07-15T00:00:00.000Z",
  aiNickname: "CyberGuard",
  educationLevel: "secondary",
  preferredLanguage: "english",
  familiarityLevel: "beginner",
  helpTopics: ["phishing_and_scams"],
  learningStyle: "practical",
};

export const cyberGuardPilotUser = {
  id: 9001,
  email: "cyberguard-learner@example.test",
  displayName: "CyberGuard Learner",
  name: "CyberGuard Learner",
  age: 16,
  ageGroup: "teen_16_17",
  role: "user",
  accountStatus: "active",
  emailVerified: true,
  emailVerifiedAt: "2026-08-03T00:00:00.000Z",
};

export const cyberGuardPilotConversation = {
  id: 7001,
  title: "CyberGuard pilot baseline",
  createdAt: FIXED_CREATED_AT,
  updatedAt: FIXED_CREATED_AT,
  lastMessageAt: FIXED_CREATED_AT,
  messageCount: 2,
};

export const cyberGuardPilotUserMessage = {
  id: 7101,
  conversationId: cyberGuardPilotConversation.id,
  role: "user",
  content: "How can I spot a phishing message?",
  locale: "en",
  createdAt: FIXED_CREATED_AT,
};

export const cyberGuardPilotAssistantMessage = {
  id: 7102,
  conversationId: cyberGuardPilotConversation.id,
  role: "assistant",
  content: "## Phishing safety check\n\nPause before opening links and compare the sender, link, and request.",
  locale: "en",
  replyToMessageId: cyberGuardPilotUserMessage.id,
  createdAt: FIXED_CREATED_AT,
};

export const cyberGuardPilotSource = {
  id: 7201,
  title: "Recognising suspicious messages",
  sourceLabel: "Cyberly Resource",
  sourceOrganisation: "Cyberly",
  sourceUrl: "https://example.test/cyberly/phishing-safety",
  locale: "en",
  snippet: "Pause before opening urgent links and verify the sender through a trusted channel.",
  internalTarget: {
    page: "resources",
    resourceSlug: "recognising-suspicious-messages",
  },
  citationOrder: 1,
};

export const cyberGuardPilotAction = {
  id: 7301,
  type: "scenario",
  labelKey: "chat.actions.startScenario",
  title: "Try a phishing practice scenario",
  description: "Practise checking a suspicious message before responding.",
  target: {
    page: "scenarios",
    scenarioSlug: "phishing-message-check",
  },
  displayOrder: 1,
};

export const cyberGuardPilotProposal = {
  proposalId: "proposal-pilot-1",
  actionType: "open_resource",
  title: "Open the phishing safety resource",
  explanation: "CyberGuard can open a reviewed resource about suspicious messages.",
  consequence: "You stay in control and nothing changes until you confirm.",
  mode: "navigation",
  riskLevel: "low",
  target: {
    type: "resource",
    id: 8101,
    label: "Recognising suspicious messages",
  },
  requiresConfirmation: true,
  status: "pending",
  createdAt: FIXED_CREATED_AT,
  expiresAt: "2026-07-28T04:15:00.000Z",
  confirmationToken: "fixture-confirmation-token",
};

export const cyberGuardPilotEmptyConversation = {
  ...cyberGuardPilotConversation,
  id: 7002,
  title: "Empty CyberGuard baseline",
  messageCount: 0,
};

export const cyberGuardPilotGeneratedUserMessage = {
  ...cyberGuardPilotUserMessage,
  id: 7111,
  content: "Please help me practise phishing safety.",
};

export const cyberGuardPilotGeneratedAssistantMessage = {
  ...cyberGuardPilotAssistantMessage,
  id: 7112,
  replyToMessageId: cyberGuardPilotGeneratedUserMessage.id,
};

export function installCyberGuardPilotBrowserShims({ mobile = false } = {}) {
  Object.defineProperty(window, "scrollTo", {
    configurable: true,
    writable: true,
    value: jest.fn(),
  });

  if (!Element.prototype.scrollTo) {
    Object.defineProperty(Element.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value: jest.fn(),
    });
  }

  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: mobile ? 390 : 1440,
  });

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: jest.fn().mockImplementation(query => ({
      matches: mobile && /max-width/.test(query),
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });

  class IntersectionObserverMock {
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  }

  Object.defineProperty(window, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: IntersectionObserverMock,
  });
  Object.defineProperty(global, "IntersectionObserver", {
    configurable: true,
    writable: true,
    value: IntersectionObserverMock,
  });
}

function groupedActionsFor(messageId, actions) {
  return actions.length ? [{ messageId, actions }] : [];
}

function groupedSourcesFor(messageId, sources) {
  return sources.length ? [{ messageId, sources }] : [];
}

function resetCyberGuardPilotState(route, { preserveSessionStorage = false } = {}) {
  window.localStorage.clear();
  if (!preserveSessionStorage) window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
}

function mockResolved(apiMock, value) {
  if (apiMock && typeof apiMock.mockResolvedValue === "function") {
    apiMock.mockResolvedValue(value);
  }
}

export function configureCyberGuardPilotMocks({
  user = cyberGuardPilotUser,
  profile = cyberGuardPilotProfile,
  conversations = [cyberGuardPilotConversation],
  activeConversation = cyberGuardPilotConversation,
  messages = [cyberGuardPilotUserMessage, cyberGuardPilotAssistantMessage],
  sources = [cyberGuardPilotSource],
  actions = [cyberGuardPilotAction],
  generatedUserMessage = cyberGuardPilotGeneratedUserMessage,
  generatedAssistantMessage = cyberGuardPilotGeneratedAssistantMessage,
  generatedSources = [cyberGuardPilotSource],
  generatedActions = [cyberGuardPilotAction],
  proposal = cyberGuardPilotProposal,
  authResult,
  authOverrides = {},
  chatOverrides = {},
} = {}) {
  const sessionResult = authResult || {
    ok: Boolean(user),
    data: user ? { user, profile } : null,
  };

  mockResolved(register, { ok: false, error: "Not used by this fixture" });
  mockResolved(login, { ok: false, error: "Not used by this fixture" });
  mockResolved(restoreSession, sessionResult);
  mockResolved(refreshCurrentUser, sessionResult);
  mockResolved(verifyEmail, { ok: false, data: { error: { code: "EMAIL_VERIFICATION_TOKEN_INVALID" } } });
  mockResolved(resendVerificationEmail, { ok: true, data: { sent: false, emailTransportDisabled: true, emailSendFailed: false, cooldownSeconds: 60 } });
  mockResolved(logout, { ok: true });

  const authMocks = {
    register,
    login,
    restoreSession,
    refreshCurrentUser,
    verifyEmail,
    resendVerificationEmail,
    logout,
  };

  Object.entries(authOverrides).forEach(([name, value]) => {
    if (typeof value === "function") {
      authMocks[name]?.mockImplementation(value);
    } else {
      authMocks[name]?.mockResolvedValue(value);
    }
  });

  listChatConversations.mockResolvedValue({ ok: true, conversations });
  getChatConversation.mockResolvedValue({
    ok: true,
    conversation: activeConversation,
    messages,
    actions: groupedActionsFor(cyberGuardPilotAssistantMessage.id, actions),
    sources: groupedSourcesFor(cyberGuardPilotAssistantMessage.id, sources),
    generations: [],
  });
  createChatConversation.mockResolvedValue({
    ok: true,
    conversation: activeConversation,
    userMessage: generatedUserMessage,
  });
  createChatUserMessage.mockResolvedValue({
    ok: true,
    conversation: activeConversation,
    message: generatedUserMessage,
  });
  generateChatAssistantReply.mockResolvedValue({
    ok: true,
    conversation: activeConversation,
    userMessage: generatedUserMessage,
    assistantMessage: generatedAssistantMessage,
    sources: generatedSources,
    actions: generatedActions,
    proposal,
  });
  renameChatConversation.mockResolvedValue({ ok: true, conversation: activeConversation });
  deleteChatConversation.mockResolvedValue({ ok: true });
  createLearnerActionProposal.mockResolvedValue({ ok: false, error: "Not used by this fixture" });
  confirmLearnerActionProposal.mockResolvedValue({ ok: true, route: "#/resources/recognising-suspicious-messages" });
  cancelLearnerActionProposal.mockResolvedValue({ ok: true });

  Object.entries(chatOverrides).forEach(([name, value]) => {
    if (typeof value === "function" && typeof name === "string") {
      const apiMocks = {
        listChatConversations,
        createChatConversation,
        getChatConversation,
        renameChatConversation,
        deleteChatConversation,
        createChatUserMessage,
        generateChatAssistantReply,
        createLearnerActionProposal,
        confirmLearnerActionProposal,
        cancelLearnerActionProposal,
      };
      apiMocks[name]?.mockImplementation(value);
    }
  });
}

export async function renderCyberGuardPilotFixture({
  route = "#/ai-chat",
  user = cyberGuardPilotUser,
  conversations,
  activeConversation,
  messages,
  locale = "en",
  authResult,
  authOverrides,
  chatOverrides,
  localStorageEntries = [],
  sessionStorageEntries = [],
  preserveSessionStorage = false,
  mobile = false,
  strictMode = false,
} = {}) {
  jest.clearAllMocks();
  installCyberGuardPilotBrowserShims({ mobile });
  resetCyberGuardPilotState(route, { preserveSessionStorage });
  localStorageEntries.forEach(([key, value]) => {
    window.localStorage.setItem(key, value);
  });
  sessionStorageEntries.forEach(([key, value]) => {
    window.sessionStorage.setItem(key, value);
  });
  await i18n.changeLanguage(locale);

  configureCyberGuardPilotMocks({
    user,
    conversations,
    activeConversation,
    messages,
    authResult,
    authOverrides,
    chatOverrides,
  });

  const result = render(strictMode ? <StrictMode><App /></StrictMode> : <App />);

  await waitFor(() => expect(restoreSession).toHaveBeenCalled());

  if (user && route.includes("#/ai-chat")) {
    await waitFor(() => expect(listChatConversations).toHaveBeenCalledWith(50));
    if ((conversations || [cyberGuardPilotConversation]).length > 0) {
      await waitFor(() => expect(getChatConversation).toHaveBeenCalled());
    }
    await screen.findByRole("log", { name: /chat message history/i });
  }

  return result;
}
