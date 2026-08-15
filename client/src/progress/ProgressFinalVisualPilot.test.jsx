import { render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getProgress } from "../api/progressApi";
import {
  getCurrentRecommendation,
  markRecommendationCompleted,
  markRecommendationViewed,
} from "../api/recommendationApi";
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

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

describe("Progress final visual migration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
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
          id: 9102,
          email: "progress-final@example.test",
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
          helpTopics: ["phishing"],
        },
      },
    });
    getProgress.mockResolvedValue({
      ok: true,
      data: {
        summary: { exists: true },
        learningPathProgress: { percentage: 42, components: [] },
        assessmentTopicResults: [{
          topic_code: "phishing_and_scams",
          correct_count: 2,
          total_count: 3,
          percentage: 67,
          currentLevel: "developing",
        }],
        recentLearningActivity: [],
      },
    });
    getCurrentRecommendation.mockResolvedValue({
      ok: true,
      data: {
        recommendation: {
          id: 802,
          topicCode: "phishing_and_scams",
          reasonText: "Practise checking suspicious messages before responding.",
          status: "viewed",
        },
      },
    });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("composes the real Progress route from an Explorer hero and preserved learning sections", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: "Alya's Learning Journey 📊" });
    const hero = heading.closest(".cy-explorer-hero");

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(hero).toHaveClass("progress-explorer-hero");
    expect(within(hero).getByText(i18n.t("progress.title"))).toHaveClass("cy-page-identity-label");
    expect(within(hero).getByText(i18n.t("progress.title")).closest(".cy-compact-header-eyebrow")).toBeNull();
    expect(hero.querySelector(".progress-explorer-visual").closest(".cy-explorer-hero-visual"))
      .toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("complementary", { name: i18n.t("progress.sectionNav.ariaLabel") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("common.backToDashboard") })).toBeVisible();
    expect(container.querySelector("#progress-overview")).toBeInTheDocument();
    await waitFor(() => {
      expect(container.querySelector("#progress-assessment-results")).toBeInTheDocument();
      expect(container.querySelector("#progress-recommendation")).toBeInTheDocument();
    });
    expect(container.querySelector("#progress-learning-activity")).toBeInTheDocument();
    expect(container.querySelector("#progress-badges")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.assessmentResults") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.recommendation") })).toBeVisible();
    expect(getProgress).toHaveBeenCalledTimes(1);
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
    expect(markRecommendationViewed).not.toHaveBeenCalled();
  });

  test("keeps Recommendation aligned when Assessment Results are absent", async () => {
    getProgress.mockResolvedValue({
      ok: true,
      data: { summary: { exists: true }, assessmentTopicResults: [], recentLearningActivity: [] },
    });

    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector("#progress-recommendation")).toBeInTheDocument());

    expect(container.querySelector("#progress-assessment-results")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("progress.sectionNav.assessmentResults") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.recommendation") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.overview") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.learningActivity") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.badges") })).toBeVisible();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(window.location.hash).toBe("#/progress");
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
    expect(markRecommendationViewed).not.toHaveBeenCalled();
  });

  test("keeps Assessment Results aligned when Recommendation is absent", async () => {
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });

    const { container } = render(<App />);
    await waitFor(() => expect(container.querySelector("#progress-assessment-results")).toBeInTheDocument());

    expect(container.querySelector("#progress-recommendation")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.assessmentResults") })).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("progress.sectionNav.recommendation") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.overview") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.learningActivity") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.badges") })).toBeVisible();
    expect(window.location.hash).toBe("#/progress");
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
    expect(markRecommendationViewed).not.toHaveBeenCalled();
  });

  test("keeps optional Progress sections absent when their current data is absent", async () => {
    getProgress.mockResolvedValue({
      ok: true,
      data: { summary: { exists: false }, assessmentTopicResults: [], recentLearningActivity: [] },
    });
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });

    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Alya's Learning Journey 📊" });

    expect(container.querySelector("#progress-assessment-results")).not.toBeInTheDocument();
    expect(container.querySelector("#progress-recommendation")).not.toBeInTheDocument();
    expect(container.querySelector("#progress-overview")).toBeInTheDocument();
    expect(container.querySelector("#progress-learning-activity")).toBeInTheDocument();
    expect(container.querySelector("#progress-badges")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("progress.sectionNav.assessmentResults") })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: i18n.t("progress.sectionNav.recommendation") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.overview") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.learningActivity") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("progress.sectionNav.badges") })).toBeVisible();
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
    expect(markRecommendationViewed).not.toHaveBeenCalled();
  });
});
