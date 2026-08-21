import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getInitialAssessmentStatus } from "../api/assessmentApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation } from "../api/recommendationApi";
import { listResources } from "../api/resourceApi";
import { getRecommendedScenarios, getScenarioDashboard } from "../api/scenarioApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/resourceApi", () => ({ listResources: jest.fn() }));
jest.mock("../api/assessmentApi", () => ({
  getInitialAssessment: jest.fn(), createInitialAssessmentAttempt: jest.fn(), getInitialAssessmentStatus: jest.fn(),
  saveAssessmentAnswer: jest.fn(), submitAssessmentAttempt: jest.fn(),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn() }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn(), markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../api/scenarioApi", () => ({
  listScenarios: jest.fn(), getRecommendedScenarios: jest.fn(), getScenarioDashboard: jest.fn(),
  getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), getScenarioAttempt: jest.fn(),
  saveScenarioDecision: jest.fn(), completeScenarioAttempt: jest.fn(), getScenarioAttemptResult: jest.fn(),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

const learner = {
  id: 191,
  email: "about-learner@example.test",
  displayName: "Aina",
  age: 15,
  role: "user",
  accountStatus: "active",
  emailVerified: true,
};

const profile = {
  exists: true,
  onboardingCompleted: true,
  preferredLanguage: "english",
  helpTopics: ["phishing"],
};

async function renderAbout({ authenticated = false, locale = "en" } = {}) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "#/about");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  class IntersectionObserverMock {
    observe() {}
    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserverMock;
  global.IntersectionObserver = IntersectionObserverMock;
  await i18n.changeLanguage(locale);
  restoreSession.mockResolvedValue(authenticated
    ? { ok: true, data: { user: learner, profile } }
    : { ok: false, error: "Not authenticated" });
  listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  listResources.mockResolvedValue({ ok: true, data: { resources: [] } });
  getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "pending" } });
  getProgress.mockResolvedValue({ ok: true, data: { learningPathProgress: {}, assessmentTopicResults: [] } });
  getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
  getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  getScenarioDashboard.mockResolvedValue({ ok: true, data: { completedCount: 0, inProgress: null } });

  const result = render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
  await screen.findByRole("heading", { level: 1, name: i18n.t("about.hero.title") });
  return result;
}

describe("About Project Story and Trust Overview", () => {
  beforeEach(() => jest.clearAllMocks());

  test("keeps About public and establishes the final semantic foundation", async () => {
    const { container } = await renderAbout();
    const about = container.querySelector(".cy-about-page");

    expect(window.location.hash).toBe("#/about");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(about).toBeInTheDocument();
    ["why", "capabilities", "how", "objectives", "team"].forEach(section => {
      expect(within(about).getByRole("heading", { level: 2, name: i18n.t(`about.${section}.title`) })).toBeVisible();
    });
    expect(about.querySelector("p.section-title")).not.toBeInTheDocument();
  });

  test("uses repository-accurate learner capabilities and removes unsupported claims", async () => {
    const { container } = await renderAbout();
    const about = container.querySelector(".cy-about-page");

    ["assessment", "recommendations", "scenarios", "cyberguard", "progress", "interactive"].forEach(capability => {
      expect(within(about).getByRole("heading", { level: 3, name: i18n.t(`about.capabilities.items.${capability}.title`) })).toBeVisible();
    });
    expect(about).not.toHaveTextContent(/56%|11%|84\.6%|96%/);
    expect(about).not.toHaveTextContent(/AI-driven platform|autonomous, goal-oriented|auto-selects difficulty|AI builds your path/i);
    expect(about).not.toHaveTextContent(/admin/i);
  });

  test("separates project objectives and retains the approved project team", async () => {
    const { container } = await renderAbout();
    const about = container.querySelector(".cy-about-page");

    expect(within(about).getByText(i18n.t("about.objectives.note"))).toBeVisible();
    expect(within(about).getByText("Dr Siti Zainab Ibrahim")).toBeVisible();
    ["Jayron Poi", "Chung Jin Hong", "Edward Chang", "Arman", "Puah Wen Zhen"].forEach(name => {
      expect(within(about).getByRole("heading", { level: 3, name })).toBeVisible();
    });
    expect(within(about).getAllByText(/Taylor's University/i).length).toBeGreaterThan(0);
    expect(within(about).getAllByText(/Cybersecurity Hub DISS/i).length).toBeGreaterThan(0);
  });

  test("preserves the guest Back destination", async () => {
    await renderAbout();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.backToHome") }));
    expect(window.location.hash).toBe("#/home");
  });

  test("preserves the authenticated Back destination", async () => {
    const { unmount } = await renderAbout({ authenticated: true });
    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.backToDashboard") }));
    expect(window.location.hash).toBe("#/dashboard");
    unmount();
  });

  test.each(["en", "ms", "zh-CN"])("keeps the content-truth contract complete in %s", async locale => {
    const { container } = await renderAbout({ locale });
    const about = container.querySelector(".cy-about-page");

    expect(within(about).getByRole("heading", { level: 2, name: i18n.t("about.capabilities.title") })).toBeVisible();
    expect(within(about).getByText(i18n.t("about.objectives.note"))).toBeVisible();
    expect(within(about).getByRole("heading", { level: 3, name: i18n.t("about.capabilities.items.cyberguard.title") })).toBeVisible();
    expect(about).not.toHaveTextContent(/56%|11%|84\.6%|96%/);
  });
});
