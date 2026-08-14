import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation, markRecommendationCompleted } from "../api/recommendationApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn() }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn(), markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

let intersectionObserverCallback;

class IntersectionObserverMock {
  constructor(callback) {
    intersectionObserverCallback = callback;
  }
  observe() {}
  disconnect() {}
}

describe("Progress design foundation pilot", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    intersectionObserverCallback = undefined;
    window.history.replaceState({}, "", "#/progress");
    window.scrollTo = jest.fn();
    window.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    await i18n.changeLanguage("en");

    restoreSession.mockResolvedValue({
      ok: true,
      data: {
        user: {
          id: 9101,
          email: "progress-foundation@example.test",
          displayName: "Alya",
          age: 15,
          role: "user",
          accountStatus: "active",
          emailVerified: true,
        },
        profile: {
          exists: true,
          onboardingCompleted: true,
          familiarityLevel: "beginner",
          preferredLanguage: "english",
          learningStyle: "step_by_step",
          helpTopics: [],
        },
      },
    });
    getProgress.mockResolvedValue({
      ok: true,
      data: {
        summary: { exists: false },
        assessmentTopicResults: [],
        recentLearningActivity: [],
      },
    });
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("uses CompactHeader and SectionNav while preserving Progress context and content", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: "Alya's Learning Journey 📊" });
    const header = heading.closest(".cy-compact-header");
    const sectionNav = screen.getByRole("complementary", { name: i18n.t("progress.sectionNav.ariaLabel") });

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveClass("cy-app-shell-main");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(header).toBeInTheDocument();
    expect(within(header).getByText(i18n.t("progress.title"))).toBeInTheDocument();
    expect(within(header).getByText(i18n.t("progress.profileFamiliaritySummary", { level: "Beginner" }))).toBeInTheDocument();
    expect(within(header).getByText("English")).toBeInTheDocument();
    expect(within(header).getByText("Step-by-step guidance")).toBeInTheDocument();
    expect(sectionNav).toHaveClass("cy-section-nav");
    expect(within(sectionNav).getByText(i18n.t("progress.sectionNav.title"))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("common.backToDashboard") })).toBeInTheDocument();
    expect(container.querySelector(".progress-content")).toBeInTheDocument();
    expect(container.querySelector("#progress-overview")).toBeInTheDocument();
    expect(container.querySelector("[style*='linear-gradient(135deg']")).not.toBeInTheDocument();
    expect(container.querySelector(".progress-shell .dashboard-section-nav")).not.toBeInTheDocument();
  });

  test("activates the final visible section when scrolling reaches the document end", async () => {
    getProgress.mockResolvedValue({
      ok: true,
      data: {
        summary: { exists: true },
        assessmentTopicResults: [
          {
            topic_code: "phishing_and_scams",
            correct_count: 2,
            total_count: 3,
            percentage: 67,
            currentLevel: "developing",
          },
        ],
        recentLearningActivity: [],
      },
    });
    getCurrentRecommendation.mockResolvedValue({
      ok: true,
      data: {
        recommendation: {
          id: 801,
          topicCode: "phishing_and_scams",
          reasonText: "Practise checking suspicious messages before responding.",
          status: "viewed",
        },
      },
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 900 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 100 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2500 });
    Object.defineProperty(document.body, "scrollHeight", { configurable: true, value: 2500 });

    render(<App />);

    const achievements = await screen.findByRole("button", { name: "Achievements" });
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "location");
    expect(achievements).not.toHaveAttribute("aria-current");

    Object.defineProperty(window, "scrollY", { configurable: true, value: 1600 });
    fireEvent.scroll(window);

    await waitFor(() => expect(achievements).toHaveAttribute("aria-current", "location"));

    act(() => {
      intersectionObserverCallback([
        {
          isIntersecting: true,
          intersectionRatio: 0.6,
          target: document.getElementById("progress-learning-activity"),
        },
      ]);
    });

    expect(achievements).toHaveAttribute("aria-current", "location");
    expect(document.querySelectorAll('.cy-section-nav-button[aria-current="location"]')).toHaveLength(1);
    expect(window.location.hash).toBe("#/progress");
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
  });

  test("keeps Overview active when the Progress document has no meaningful scroll range", async () => {
    getProgress.mockResolvedValue({
      ok: true,
      data: {
        summary: { exists: true },
        assessmentTopicResults: [
          {
            topic_code: "phishing_and_scams",
            correct_count: 2,
            total_count: 3,
            percentage: 67,
            currentLevel: "developing",
          },
        ],
        recentLearningActivity: [],
      },
    });
    getCurrentRecommendation.mockResolvedValue({
      ok: true,
      data: {
        recommendation: {
          id: 801,
          topicCode: "phishing_and_scams",
          reasonText: "Practise checking suspicious messages before responding.",
          status: "viewed",
        },
      },
    });
    Object.defineProperty(window, "innerHeight", { configurable: true, value: 3000 });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 2500 });
    Object.defineProperty(document.body, "scrollHeight", { configurable: true, value: 2500 });

    render(<App />);

    const overview = await screen.findByRole("button", { name: "Overview" });
    const achievements = screen.getByRole("button", { name: "Achievements" });
    await act(async () => {
      await new Promise(resolve => window.setTimeout(resolve, 0));
    });

    expect(overview).toHaveAttribute("aria-current", "location");
    expect(achievements).not.toHaveAttribute("aria-current");
    expect(document.querySelectorAll('.cy-section-nav-button[aria-current="location"]')).toHaveLength(1);
    expect(window.location.hash).toBe("#/progress");
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
  });
});
