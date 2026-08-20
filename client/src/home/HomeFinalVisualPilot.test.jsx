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
  id: 91,
  email: "home-learner@example.test",
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

async function renderHome({ authenticated = false, locale = "en" } = {}) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "#/home");
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
  getProgress.mockResolvedValue({ ok: true, data: { learningPathProgress: { percentage: 0 }, assessmentTopicResults: [] } });
  getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
  getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  getScenarioDashboard.mockResolvedValue({ ok: true, data: { completedCount: 0, inProgress: null } });

  const result = render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
  await screen.findByRole("heading", { level: 1, name: i18n.t("home.hero.title") });
  return result;
}

describe("Home Cyber Explorer Gateway final visual migration", () => {
  beforeEach(() => jest.clearAllMocks());

  test("composes Home from the Explorer foundation with one application landmark", async () => {
    const { container } = await renderHome();
    const home = container.querySelector(".cy-home-page");

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(home).toBeInTheDocument();
    expect(home.querySelector(".cy-explorer-hero")).toBeInTheDocument();
    expect(within(home).getByText("Cyberly")).toHaveClass("cy-page-identity-label");
    expect(home.querySelector(".hero")).not.toBeInTheDocument();
    expect(home.querySelector(".dashboard-compact-header")).not.toBeInTheDocument();
    expect(home.querySelector(".cyberguard-workspace-header")).not.toBeInTheDocument();
    expect(home.querySelector(".admin-workspace")).not.toBeInTheDocument();
    expect(home.textContent).not.toMatch(/mascot/i);
  });

  test("uses semantic headings for every retained major Home section", async () => {
    const { container } = await renderHome();
    const home = container.querySelector(".cy-home-page");
    const sectionHeadings = [
      "home.threats.eyebrow",
      "home.why.title",
      "home.threatOfWeek.title",
      "home.quickTopics.title",
      "home.how.title",
      "home.bottomCta.title",
    ];

    sectionHeadings.forEach(key => {
      expect(within(home).getByRole("heading", { level: 2, name: i18n.t(key) })).toBeVisible();
    });
    expect(home.querySelector("p.section-title")).not.toBeInTheDocument();
  });

  test("opens the existing registration flow from the unauthenticated primary CTA", async () => {
    await renderHome();

    await userEvent.click(screen.getAllByRole("button", { name: i18n.t("home.hero.cta") })[0]);

    expect(window.location.hash).toBe("#/login");
    expect(await screen.findByText(i18n.t("auth.createAccount"))).toBeVisible();
  });

  test("routes an authenticated learner to the existing Dashboard flow", async () => {
    await renderHome({ authenticated: true });

    await userEvent.click(screen.getAllByRole("button", { name: i18n.t("home.hero.continueLearning") })[0]);

    expect(window.location.hash).toBe("#/dashboard");
    expect(listChatConversations).toHaveBeenCalledWith(50);
    await screen.findByRole("heading", { level: 1, name: new RegExp(i18n.t("dashboard.welcome", { name: learner.displayName }).replace(learner.displayName, ".+"), "i") });
  });

  test("keeps threat exploration on the Resources route", async () => {
    await renderHome();

    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.learnMore") }));
    expect(window.location.hash).toBe("#/resources");
    await waitFor(() => expect(listResources).toHaveBeenCalled());
  });

  test("keeps topic exploration on the Resources route", async () => {
    await renderHome();

    await userEvent.click(screen.getByRole("button", { name: new RegExp(i18n.t("home.topics.phishing"), "i") }));
    expect(window.location.hash).toBe("#/resources");
    await waitFor(() => expect(listResources).toHaveBeenCalled());
  });

  test("does not expose unsupported public claims on the English Home page", async () => {
    const { container } = await renderHome();
    const home = container.querySelector(".cy-home-page");

    expect(home).not.toHaveTextContent(/11%|50%|84\.6%|96%/);
    expect(home).not.toHaveTextContent(/join thousands/i);
    expect(home).not.toHaveTextContent(/threat of the week/i);
    expect(home.querySelectorAll(".cy-home-stat-item")).toHaveLength(4);
    expect(home.querySelector(".cy-home-awareness-band")).toBeInTheDocument();
    expect(home.querySelector(".cy-home-threat-card")).toBeInTheDocument();
  });

  test.each(["en", "ms", "zh-CN"])(
    "keeps neutral awareness and safety-focus content complete in %s",
    async locale => {
      const { container } = await renderHome({ locale });
      const home = container.querySelector(".cy-home-page");
      const awarenessItems = home.querySelectorAll(".cy-home-stat-item");

      expect(awarenessItems).toHaveLength(4);
      awarenessItems.forEach(item => expect(item).not.toBeEmptyDOMElement());
      expect(within(home).getByText(i18n.t("home.bottomCta.description"))).toBeVisible();
      expect(within(home).getByText(i18n.t("home.threatOfWeek.badge"))).toBeVisible();
      expect(home).not.toHaveTextContent(/11%|50%|84\.6%|96%/);
    }
  );
});
