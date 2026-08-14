import { render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getInitialAssessmentStatus } from "../api/assessmentApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation } from "../api/recommendationApi";
import { getRecommendedScenarios, getScenarioDashboard } from "../api/scenarioApi";
import { listResources } from "../api/resourceApi";
import { listChatConversations } from "../chat/chatApi";

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

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

describe("Dashboard CompactHeader pilot", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "#/dashboard");
    window.scrollTo = jest.fn();
    window.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");

    restoreSession.mockResolvedValue({
      ok: true,
      data: {
        user: { id: 41, email: "dashboard@example.test", displayName: "Alya", age: 15, role: "user", accountStatus: "active", emailVerified: true },
        profile: { exists: true, onboardingCompleted: true, familiarityLevel: "beginner", educationLevel: "form_3", preferredLanguage: "english", helpTopics: [] },
      },
    });
    getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "pending" } });
    getProgress.mockResolvedValue({ ok: true, data: { assessmentTopicResults: [] } });
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
    getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
    getScenarioDashboard.mockResolvedValue({ ok: true, data: {} });
    listResources.mockResolvedValue({ ok: true, data: { resources: [] } });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("uses CompactHeader without changing Dashboard section structure or fetching header statistics", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: /Welcome back, Alya/i });
    const header = heading.closest(".cy-compact-header");

    expect(header).toBeInTheDocument();
    expect(within(header).getByText(/Teen/)).toBeInTheDocument();
    expect(within(header).getByText(/Beginner/)).toBeInTheDocument();
    expect(within(header).getByText(/Form 3/i)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector("[style*='linear-gradient(135deg']")).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t("dashboard.stats.learningTopics"))).not.toBeInTheDocument();
    expect(screen.getByRole("complementary", { name: i18n.t("dashboard.sectionNav.ariaLabel") })).toBeInTheDocument();

    const overview = container.querySelector("#dashboard-overview");
    const shell = container.querySelector(".dashboard-shell");
    expect(overview.compareDocumentPosition(shell) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    await waitFor(() => expect(getInitialAssessmentStatus).toHaveBeenCalled());
    expect(listResources).not.toHaveBeenCalled();
  });
});
