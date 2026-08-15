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
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });

    expect(screen.getByText(new RegExp(i18n.t("dashboard.learningProfile"), "i"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.assessment.pending"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.recommendation.title"))).toBeVisible();
    expect(await screen.findByText(i18n.t("progress.learningPath.title"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.scenarios.practiceTitle"))).toBeVisible();
    expect(await screen.findByText(i18n.t("dashboard.topicMastery.title"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.quickActions.title"))).toBeVisible();
    expect(screen.getByText(i18n.t("dashboard.cyberGuard.title"))).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.learningProfile") })).toBeVisible();
    expect(await screen.findByRole("button", { name: i18n.t("dashboard.sectionNav.topicMastery") })).toBeVisible();
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

  test("omits Topic Mastery while retaining Learning Profile without assessment results", async () => {
    getProgress.mockResolvedValue({ ok: true, data: { learningPathProgress: { percentage: 25, components: [] }, assessmentTopicResults: [] } });
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });

    expect(container.querySelector("#dashboard-topic-mastery")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("dashboard.sectionNav.topicMastery") })).not.toBeInTheDocument();
    expect(container.querySelector("#dashboard-learning-profile")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.learningProfile") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("dashboard.sectionNav.cyberGuardAi") })).toBeVisible();
    expect(window.location.hash).toBe("#/dashboard");
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
