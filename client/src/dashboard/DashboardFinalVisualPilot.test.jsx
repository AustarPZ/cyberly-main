import fs from "fs";
import path from "path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getInitialAssessmentStatus } from "../api/assessmentApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation, markRecommendationViewed } from "../api/recommendationApi";
import { getRecommendedScenarios, getScenarioDashboard } from "../api/scenarioApi";
import { createChatConversation, listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
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
jest.mock("../api/resourceApi", () => ({ listResources: jest.fn() }));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

let intersectionObserverCallback;

class IntersectionObserverMock {
  constructor(callback) { intersectionObserverCallback = callback; }
  observe() {}
  disconnect() {}
}

describe("Dashboard final visual migration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    intersectionObserverCallback = undefined;
    window.history.replaceState({}, "", "#/dashboard");
    window.scrollTo = jest.fn();
    window.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");

    restoreSession.mockResolvedValue({
      ok: true,
      data: {
        user: {
          id: 41, email: "dashboard@example.test", displayName: "Alya", age: 15, role: "user",
          accountStatus: "active", emailVerified: true,
          profile: { helpTopics: ["phishing"] },
        },
        profile: {
          exists: true, onboardingCompleted: true, familiarityLevel: "beginner", educationLevel: "form_3",
          preferredLanguage: "english", learningStyle: "visual", helpTopics: ["phishing"],
        },
      },
    });
    getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "pending" } });
    getProgress.mockResolvedValue({
      ok: true,
      data: {
        learningPathProgress: { percentage: 25, components: [] },
        assessmentTopicResults: [{ topicCode: "phishing", correctCount: 2, totalCount: 3, resultLevel: "developing" }],
      },
    });
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: { id: 7, topicCode: "phishing", reasonText: "Build confidence spotting suspicious messages." } } });
    getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [{ id: 9, slug: "bank-message", title: "Suspicious bank message", topicCode: "phishing", difficulty: "beginner", estimatedMinutes: 5 }] } });
    getScenarioDashboard.mockResolvedValue({ ok: true, data: { completedCount: 1, inProgress: null } });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("composes the real Dashboard from the Explorer hero and reusable section navigation", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });
    const hero = heading.closest(".cy-explorer-hero");

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(hero).toBeInTheDocument();
    expect(within(hero).getByText(i18n.t("dashboard.yourDashboard"))).toHaveClass("cy-page-identity-label");
    expect(within(hero).getByText(i18n.t("dashboard.yourDashboard")).closest(".cy-compact-header-eyebrow")).toBeNull();
    expect(hero.querySelector(".dashboard-explorer-visual").closest(".cy-explorer-hero-visual")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".dashboard-section-nav")).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: i18n.t("dashboard.sectionNav.ariaLabel") })).toHaveClass("cy-section-nav");
  });

  test("keeps representative Dashboard content and conditional navigation aligned", async () => {
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });

    expect(container.querySelector("#dashboard-learning-profile")).not.toBeInTheDocument();
    expect(screen.getByText(i18n.t("dashboard.assessment.pending"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.recommendation.title"))).toBeVisible();
    expect(await screen.findByText(i18n.t("progress.learningPath.title"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.scenarios.practiceTitle"))).toBeVisible();
    expect(container.querySelector("#dashboard-topic-mastery")).not.toBeInTheDocument();
    expect(screen.getByText(i18n.t("dashboard.quickActions.title"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.cyberGuard.title"))).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("dashboard.sectionNav.learningProfile") })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("dashboard.sectionNav.topicMastery") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: new RegExp(i18n.t("dashboard.actions.profile"), "i") })).toBeVisible();
    await waitFor(() => expect(getProgress).toHaveBeenCalledTimes(1));
  });

  test("omits Learning Profile from content and navigation without help topics", async () => {
    restoreSession.mockResolvedValue({
      ok: true,
      data: {
        user: { id: 41, email: "dashboard@example.test", displayName: "Alya", age: 15, role: "user", accountStatus: "active", emailVerified: true },
        profile: { exists: true, onboardingCompleted: true, familiarityLevel: "beginner", educationLevel: "form_3", preferredLanguage: "english", learningStyle: "visual", helpTopics: [] },
      },
    });
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });

    expect(container.querySelector("#dashboard-learning-profile")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("dashboard.sectionNav.learningProfile") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.overview") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.cyberGuardAi") })).toBeVisible();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(window.location.hash).toBe("#/dashboard");
  });

  test("omits the retired Learning Profile and Topic Mastery sections without assessment results", async () => {
    getProgress.mockResolvedValue({ ok: true, data: { learningPathProgress: { percentage: 25, components: [] }, assessmentTopicResults: [] } });
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });

    expect(container.querySelector("#dashboard-topic-mastery")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("dashboard.sectionNav.topicMastery") })).not.toBeInTheDocument();
    expect(container.querySelector("#dashboard-learning-profile")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("dashboard.sectionNav.learningProfile") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.cyberGuardAi") })).toBeVisible();
    expect(window.location.hash).toBe("#/dashboard");
  });

  test("renders the approved Dashboard decision flow in DOM order", async () => {
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });

    const orderedIds = [
      "dashboard-measured-progress",
      "dashboard-recommended-next-step",
      "dashboard-scenario-practice",
      "dashboard-initial-assessment",
      "dashboard-quick-actions",
      "dashboard-daily-tip",
      "dashboard-cyberguard-ai",
    ];
    const sections = orderedIds.map(id => container.querySelector(`#${id}`));
    sections.forEach(section => expect(section).toBeInTheDocument());
    await waitFor(() => {
      sections.forEach(section => expect(section.querySelector("h2")).toBeInTheDocument());
    });
    sections.slice(0, -1).forEach((section, index) => {
      expect(section.compareDocumentPosition(sections[index + 1]) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  test("uses the canonical Scenario target without creating a second primary recommendation", async () => {
    getCurrentRecommendation.mockResolvedValue({
      ok: true,
      data: {
        recommendation: {
          id: 7,
          topicCode: "phishing",
          reasonText: "Continue with the canonical scenario.",
          targetScenarioTitle: "Canonical phishing scenario",
          target: { page: "scenarios", scenarioId: 12, scenarioSlug: "canonical-phishing" },
        },
      },
    });
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });
    await screen.findByText("Continue with the canonical scenario.");
    const recommendation = container.querySelector("#dashboard-recommended-next-step");

    expect(within(recommendation).getByText("Canonical phishing scenario")).toBeVisible();
    expect(screen.getAllByText(i18n.t("dashboard.recommendation.title"))).toHaveLength(1);
    expect(screen.queryByText(i18n.t("dashboard.scenarios.recommendedTitle"))).not.toBeInTheDocument();
    fireEvent.click(within(recommendation).getByRole("button", { name: i18n.t("dashboard.recommendation.practiceScenario") }));
    await waitFor(() => expect(window.location.hash).toBe("#/scenarios"));
    expect(markRecommendationViewed).toHaveBeenCalledWith(7, { locale: "en" });
  });

  test("uses canonical Resource and Assessment recommendation targets", async () => {
    getCurrentRecommendation.mockResolvedValue({
      ok: true,
      data: { recommendation: { id: 8, topicCode: "privacy", reasonText: "Review privacy guidance.", target: { page: "resources", resourceSlug: "protect-privacy" } } },
    });
    const firstRender = render(<App />);
    await screen.findByText("Review privacy guidance.");
    const resourceRecommendation = firstRender.container.querySelector("#dashboard-recommended-next-step");
    fireEvent.click(within(resourceRecommendation).getByRole("button", { name: i18n.t("dashboard.recommendation.readResource") }));
    await waitFor(() => expect(window.location.hash).toBe("#/resources"));
    firstRender.unmount();

    window.history.replaceState({}, "", "#/dashboard");
    getCurrentRecommendation.mockResolvedValue({
      ok: true,
      data: { recommendation: { id: 9, reasonText: "Establish your starting point.", target: { page: "assessment" } } },
    });
    const secondRender = render(<App />);
    await screen.findByText("Establish your starting point.");
    const assessmentRecommendation = secondRender.container.querySelector("#dashboard-recommended-next-step");
    fireEvent.click(within(assessmentRecommendation).getByRole("button", { name: i18n.t("dashboard.recommendation.startAssessment") }));
    await waitFor(() => expect(window.location.hash).toBe("#/assessment"));
  });

  test("keeps a safe empty recommendation without fabricating a destination", async () => {
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
    const { container } = render(<App />);
    await screen.findByText(i18n.t("dashboard.recommendation.empty"));
    const recommendation = container.querySelector("#dashboard-recommended-next-step");

    expect(within(recommendation).getByText(i18n.t("dashboard.recommendation.empty"))).toBeVisible();
    expect(within(recommendation).queryByRole("button")).not.toBeInTheDocument();
  });

  test("keeps pending and in-progress Assessment states distinct without inventing skipped", async () => {
    const pendingRender = render(<App />);
    await screen.findByText(i18n.t("dashboard.assessment.pending"));
    const pending = pendingRender.container.querySelector("#dashboard-initial-assessment");
    expect(within(pending).getByText(i18n.t("dashboard.assessment.pending"))).toBeVisible();
    expect(within(pending).getByRole("button", { name: i18n.t("dashboard.assessment.start") })).toBeVisible();
    expect(pending).not.toHaveTextContent(/skipped/i);
    pendingRender.unmount();

    window.history.replaceState({}, "", "#/dashboard");
    getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "in_progress", attempt: { id: 31, status: "in_progress", answers: [] } } });
    const inProgressRender = render(<App />);
    await screen.findByText(i18n.t("dashboard.assessment.inProgress"));
    const inProgress = inProgressRender.container.querySelector("#dashboard-initial-assessment");
    expect(within(inProgress).getByText(i18n.t("dashboard.assessment.inProgress"))).toBeVisible();
    expect(within(inProgress).getByRole("button", { name: i18n.t("dashboard.assessment.resume") })).toBeVisible();
  });

  test("integrates completed Assessment topic results into the Initial Assessment section", async () => {
    getInitialAssessmentStatus.mockResolvedValue({
      ok: true,
      data: { status: "completed", result: { attempt: { percentage: 67, measuredLevel: "developing" } } },
    });
    const { container } = render(<App />);
    await screen.findByText(i18n.t("dashboard.assessment.completed"));
    const assessment = container.querySelector("#dashboard-initial-assessment");

    expect(within(assessment).getByText(i18n.t("dashboard.assessment.completed"))).toBeVisible();
    expect(within(assessment).getByText(/67%/)).toBeVisible();
    expect(within(assessment).getByText(i18n.t("topics.phishing", { defaultValue: "Phishing" }), { exact: false })).toBeVisible();
    expect(within(assessment).getByRole("button", { name: i18n.t("dashboard.assessment.viewResults") })).toBeVisible();
    expect(container.querySelector("#dashboard-topic-mastery")).not.toBeInTheDocument();
  });

  test("keeps the final visible Dashboard section current at genuine page end", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2500 });
    Object.defineProperty(document.body, "scrollHeight", { configurable: true, value: 2500 });
    render(<App />);

    const cyberGuard = await screen.findByRole("button", { name: i18n.t("dashboard.sectionNav.cyberGuardAi") });
    const measuredProgress = screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.measuredProgress") });
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(cyberGuard).toHaveAttribute("aria-current", "location");
    expect(measuredProgress).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll('.cy-section-nav-button[aria-current="location"]')).toHaveLength(1);

    act(() => intersectionObserverCallback?.([{
        isIntersecting: true,
        intersectionRatio: 0.8,
        target: document.getElementById("dashboard-measured-progress"),
      }]));
    expect(cyberGuard).toHaveAttribute("aria-current", "location");
    expect(measuredProgress).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll('.cy-section-nav-button[aria-current="location"]')).toHaveLength(1);
    expect(markRecommendationViewed).not.toHaveBeenCalled();
    expect(createChatConversation).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#/dashboard");
  });

  test("resumes observer tracking after leaving genuine page end", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2500 });
    Object.defineProperty(document.body, "scrollHeight", { configurable: true, value: 2500 });
    render(<App />);

    const cyberGuard = await screen.findByRole("button", { name: i18n.t("dashboard.sectionNav.cyberGuardAi") });
    const measuredProgress = screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.measuredProgress") });
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(cyberGuard).toHaveAttribute("aria-current", "location");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 700 });
    act(() => {
      window.dispatchEvent(new Event("scroll"));
      intersectionObserverCallback?.([{
        isIntersecting: true,
        intersectionRatio: 0.8,
        target: document.getElementById("dashboard-measured-progress"),
      }]);
    });

    expect(measuredProgress).toHaveAttribute("aria-current", "location");
    expect(cyberGuard).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll('.cy-section-nav-button[aria-current="location"]')).toHaveLength(1);
    expect(markRecommendationViewed).not.toHaveBeenCalled();
    expect(createChatConversation).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#/dashboard");
  });

  test("does not select the final section when the document cannot scroll", async () => {
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 3000 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2500 });
    Object.defineProperty(document.body, "scrollHeight", { configurable: true, value: 2500 });
    render(<App />);

    const overview = await screen.findByRole("button", { name: i18n.t("dashboard.sectionNav.overview") });
    act(() => window.dispatchEvent(new Event("scroll")));
    expect(overview).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.cyberGuardAi") }))
      .not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll('.cy-section-nav-button[aria-current="location"]')).toHaveLength(1);
    expect(window.location.hash).toBe("#/dashboard");
  });

  test("scrolls to a Dashboard section without changing route or learner state", async () => {
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });
    const target = container.querySelector("#dashboard-quick-actions");
    target.scrollIntoView = jest.fn();

    fireEvent.click(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.quickActions") }));

    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: "auto", block: "start" });
    expect(window.location.hash).toBe("#/dashboard");
    expect(markRecommendationViewed).not.toHaveBeenCalled();
    expect(createChatConversation).not.toHaveBeenCalled();
  });

  test("uses the defined raised shadow token for Quick Action hover elevation", () => {
    const css = fs.readFileSync(path.join(__dirname, "dashboard.css"), "utf8");

    expect(css).toMatch(/\.dashboard-action-card:hover\s*\{[^}]*box-shadow:\s*var\(--shadow-raised\)/);
    expect(css).not.toContain("--shadow-elevated");
  });
});
