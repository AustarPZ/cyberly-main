import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { logout, restoreSession } from "../api/authApi";
import {
  getRecommendedScenarios,
  getScenarioBySlug,
  listScenarios,
  startScenarioAttempt,
} from "../api/scenarioApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));

jest.mock("../api/authApi", () => ({
  register: jest.fn(),
  login: jest.fn(),
  restoreSession: jest.fn(),
  refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("../api/scenarioApi", () => ({
  listScenarios: jest.fn(),
  getRecommendedScenarios: jest.fn(),
  getScenarioDashboard: jest.fn(),
  getScenarioBySlug: jest.fn(),
  startScenarioAttempt: jest.fn(),
  getScenarioAttempt: jest.fn(),
  saveScenarioDecision: jest.fn(),
  completeScenarioAttempt: jest.fn(),
  getScenarioAttemptResult: jest.fn(),
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

const learner = {
  id: 9101,
  email: "guarded-logout@example.test",
  displayName: "Guarded Learner",
  name: "Guarded Learner",
  role: "user",
  accountStatus: "active",
  emailVerified: true,
};

const profile = {
  exists: true,
  onboardingCompleted: true,
  preferredLanguage: "english",
};

const scenario = {
  id: 9201,
  slug: "guarded-phishing-practice",
  topicCode: "phishing_and_scams",
  title: "Guarded phishing practice",
  summary: "Practise checking a suspicious message.",
  difficulty: "beginner",
  estimatedMinutes: 4,
  totalSteps: 1,
  latestAttempt: null,
};

const firstStep = {
  id: 9301,
  stepOrder: 1,
  situationText: "A suspicious message arrives.",
  promptText: "What should you do?",
  options: [
    { key: "A", text: "Verify it through an official channel." },
    { key: "B", text: "Reply immediately." },
  ],
};

function installBrowserShims() {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  }));
}

async function renderAuthenticatedScenario() {
  window.history.replaceState({}, "", "#/scenarios");
  await i18n.changeLanguage("en");
  restoreSession.mockResolvedValue({ ok: true, data: { user: learner, profile } });
  listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [scenario] } });
  getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  getScenarioBySlug.mockResolvedValue({
    ok: true,
    data: { scenario, firstStep, locale: { requestedLocale: "en", resolvedLocale: "en", fallbackUsed: false } },
  });
  startScenarioAttempt.mockResolvedValue({
    ok: true,
    data: {
      scenario,
      attempt: { id: 9401, status: "in_progress" },
      currentStep: firstStep,
      locale: { requestedLocale: "en", resolvedLocale: "en", fallbackUsed: false },
    },
  });
  logout.mockResolvedValue({ ok: true, data: { ok: true } });

  render(<App />);
  await screen.findByRole("heading", { level: 1, name: "Scenario Library" });
}

async function enterGuardedAttempt() {
  await userEvent.click(await screen.findByRole("button", { name: "Start scenario" }));
  await userEvent.click(await screen.findByRole("button", { name: "Start practice" }));
  await screen.findByText(firstStep.promptText);
}

async function requestLogout() {
  await userEvent.click(screen.getByRole("button", { name: /open account menu/i }));
  await userEvent.click(screen.getByRole("menuitem", { name: /log out/i }));
}

describe("guarded logout", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    installBrowserShims();
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("confirmed Scenario-guarded logout clears the guard and ends the authenticated session", async () => {
    await renderAuthenticatedScenario();
    await enterGuardedAttempt();
    await requestLogout();

    const confirmation = await screen.findByRole("dialog", { name: i18n.t("nav.logoutModal.title") });
    expect(confirmation).toHaveAttribute("aria-labelledby", "confirmation-dialog-title");
    expect(confirmation).toHaveTextContent(i18n.t("scenarios.leaveDescription"));
    expect(screen.getByRole("button", { name: i18n.t("scenarios.continueScenario") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("scenarios.leaveScenario") })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("nav.logoutModal.confirm") }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(window.location.hash).toBe("#/home"));
    expect(screen.queryByRole("button", { name: /open account menu/i })).not.toBeInTheDocument();
    expect(screen.queryByText(firstStep.promptText)).not.toBeInTheDocument();

    act(() => {
      window.location.hash = "#/dashboard";
    });
    await waitFor(() => expect(window.location.hash).toBe("#/home"));
    expect(await screen.findByRole("heading", { level: 1, name: /Stay Safe in the Digital World/i })).toBeInTheDocument();
  });

  test("cancelling guarded logout keeps the learner in the active Scenario", async () => {
    await renderAuthenticatedScenario();
    await enterGuardedAttempt();
    await requestLogout();

    const confirmation = await screen.findByRole("dialog", { name: i18n.t("nav.logoutModal.title") });
    expect(confirmation).toHaveTextContent(i18n.t("scenarios.leaveDescription"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("scenarios.continueScenario") }));

    expect(logout).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#/scenarios");
    expect(screen.getByText(firstStep.promptText)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open account menu/i })).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("normal logout without an activity guard retains the dedicated confirmation path", async () => {
    await renderAuthenticatedScenario();
    await requestLogout();

    const confirmation = await screen.findByRole("dialog", { name: "Log out of Cyberly?" });
    expect(confirmation).toHaveAttribute("aria-labelledby", "logout-modal-title");
    await userEvent.click(screen.getByRole("button", { name: /^Log out$/ }));

    await waitFor(() => expect(logout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(window.location.hash).toBe("#/home"));
    expect(screen.queryByRole("button", { name: /open account menu/i })).not.toBeInTheDocument();
  });

  test("confirmed non-logout Scenario leave still returns to the Scenario Library", async () => {
    await renderAuthenticatedScenario();
    await enterGuardedAttempt();

    await userEvent.click(screen.getByRole("button", { name: "Exit scenario" }));
    const confirmation = await screen.findByRole("dialog", { name: i18n.t("scenarios.leaveTitle") });
    await userEvent.click(within(confirmation).getByRole("button", { name: i18n.t("scenarios.leaveScenario") }));

    expect(logout).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#/scenarios");
    expect(await screen.findByRole("heading", { level: 1, name: "Scenario Library" })).toBeInTheDocument();
    expect(screen.queryByText(firstStep.promptText)).not.toBeInTheDocument();
  });
});
