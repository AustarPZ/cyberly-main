import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import {
  createInitialAssessmentAttempt,
  getInitialAssessment,
  getInitialAssessmentStatus,
  saveAssessmentAnswer,
  submitAssessmentAttempt,
} from "../api/assessmentApi";
import { listChatConversations } from "../chat/chatApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation } from "../api/recommendationApi";
import { getRecommendedScenarios, getScenarioDashboard } from "../api/scenarioApi";

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
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

const questions = [
  {
    id: 101,
    topicLabel: "Phishing and scams",
    prompt: "Which sign most strongly suggests a message may be a scam?",
    options: [
      { key: "A", text: "It asks you to act urgently and share a verification code." },
      { key: "B", text: "It uses your bank's usual app notification." },
    ],
  },
  {
    id: 102,
    topicLabel: "Privacy",
    prompt: "What is the safest first step before sharing personal information?",
    options: [
      { key: "A", text: "Check who is asking and why they need it." },
      { key: "B", text: "Share it quickly before the request expires." },
    ],
  },
];

const completedResult = {
  attempt: {
    id: 712,
    status: "completed",
    totalScore: 8,
    maximumScore: 12,
    percentage: 67,
    measuredLevel: "Developing",
  },
  topicScores: [
    { topicCode: "phishing", topicLabel: "Phishing and scams", correctCount: 2, totalCount: 3, percentage: 67, classification: "strength" },
    { topicCode: "privacy", topicLabel: "Privacy", correctCount: 1, totalCount: 3, percentage: 33, classification: "improvement" },
  ],
  review: [
    {
      questionId: 101,
      topicLabel: "Phishing and scams",
      prompt: questions[0].prompt,
      isCorrect: true,
      selectedOptionKey: "A",
      correctOptionKey: "A",
      explanation: "Urgency and requests for verification codes are common scam warning signs.",
    },
    {
      questionId: 102,
      topicLabel: "Privacy",
      prompt: questions[1].prompt,
      isCorrect: false,
      selectedOptionKey: "B",
      correctOptionKey: "A",
      explanation: "Confirm the requester and purpose before sharing personal information.",
    },
  ],
};

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

describe("Assessment final visual migration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "#/assessment");
    window.scrollTo = jest.fn();
    window.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");

    restoreSession.mockResolvedValue({
      ok: true,
      data: {
        user: { id: 71, email: "assessment@example.test", displayName: "Alya", age: 15, role: "user", accountStatus: "active", emailVerified: true },
        profile: { exists: true, onboardingCompleted: true, familiarityLevel: "beginner", preferredLanguage: "english", learningStyle: "step_by_step", helpTopics: ["phishing"] },
      },
    });
    getInitialAssessment.mockResolvedValue({ ok: true, data: { assessment: { id: 1, title: i18n.t("assessment.title") }, questions } });
    getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "pending" } });
    getProgress.mockResolvedValue({ ok: true, data: { learningPathProgress: { percentage: 0, components: [] }, assessmentTopicResults: [] } });
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
    getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
    getScenarioDashboard.mockResolvedValue({ ok: true, data: { completedCount: 0, inProgress: null } });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("presents the pending assessment as one checkpoint briefing without the legacy banner", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: i18n.t("assessment.title") });
    const hero = heading.closest(".assessment-checkpoint-hero");

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(hero).toBeInTheDocument();
    expect(within(hero).getByText(i18n.t("assessment.baselineLabel"))).toHaveClass("cy-page-identity-label");
    expect(hero.querySelector(".assessment-checkpoint-visual").closest(".cy-explorer-hero-visual"))
      .toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".assessment-legacy-banner")).not.toBeInTheDocument();
    await waitFor(() => expect(container.querySelector(".assessment-intro")).toBeInTheDocument());
    expect(screen.getByText(i18n.t("assessment.introduction"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.measurementNote"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.doLaterDescription"))).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("assessment.start") })).toHaveClass("cy-button-primary");
    expect(screen.getByRole("button", { name: i18n.t("assessment.doLater") })).toHaveClass("cy-button-quiet");
    expect(createInitialAssessmentAttempt).not.toHaveBeenCalled();
    expect(saveAssessmentAnswer).not.toHaveBeenCalled();
    expect(submitAssessmentAttempt).not.toHaveBeenCalled();
  });

  test("returns to the Dashboard without mutating the pending assessment when the learner chooses later", async () => {
    render(<App />);

    await userEvent.click(await screen.findByRole("button", { name: i18n.t("assessment.doLater") }));

    await waitFor(() => expect(window.location.hash).toBe("#/dashboard"));
    expect(createInitialAssessmentAttempt).not.toHaveBeenCalled();
    expect(saveAssessmentAnswer).not.toHaveBeenCalled();
    expect(submitAssessmentAttempt).not.toHaveBeenCalled();
  });

  test("keeps a resumed attempt focused on one accessible checkpoint question", async () => {
    getInitialAssessmentStatus.mockResolvedValue({
      ok: true,
      data: { status: "in_progress", attempt: { id: 712, status: "in_progress", answers: [{ questionId: 101, selectedOptionKey: "A" }] } },
    });

    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: questions[0].prompt });

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(heading.closest(".assessment-question-card")).toBeInTheDocument();
    expect(container.querySelector(".assessment-question-shell")).toBeInTheDocument();
    expect(screen.getByText(questions[0].topicLabel)).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.questionProgress", { current: 1, total: 2 }))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.answeredProgress", { answered: 1, total: 2 }), { exact: false })).toBeVisible();
    expect(screen.getByRole("button", { name: /A\. It asks you to act urgently/i })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: /B\. It uses your bank/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: i18n.t("assessment.previous") })).toBeDisabled();
    expect(screen.getByRole("button", { name: i18n.t("assessment.next") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("common.backToDashboard") })).toBeVisible();
    expect(createInitialAssessmentAttempt).not.toHaveBeenCalled();
    expect(saveAssessmentAnswer).not.toHaveBeenCalled();
    expect(submitAssessmentAttempt).not.toHaveBeenCalled();
  });

  test("presents completed results as a calm checkpoint summary with preserved evidence", async () => {
    getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "completed", result: completedResult } });

    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: i18n.t("assessment.completed") });
    const hero = heading.closest(".assessment-checkpoint-hero");

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(hero).toBeInTheDocument();
    expect(container.querySelector(".assessment-result-summary")).toBeInTheDocument();
    expect(screen.getAllByText(i18n.t("assessment.resultSummary", { score: 8, maxScore: 12 }))).toHaveLength(2);
    expect(screen.getByText(i18n.t("assessment.resultNextStep"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.measuredLevel"))).toBeVisible();
    expect(screen.getByText("Developing")).toBeVisible();
    expect(screen.getAllByText("67%").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".assessment-topic-result")).toHaveLength(2);
    expect(screen.getByText(i18n.t("assessment.strengths"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.areasToImprove"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.relativeStrength"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.areaToImprove"))).toBeVisible();
    expect(container.querySelectorAll(".assessment-review-card")).toHaveLength(2);
    expect(screen.getByText(i18n.t("assessment.correct"))).toBeVisible();
    expect(screen.getByText(i18n.t("assessment.incorrect"))).toBeVisible();
    expect(screen.getByText(completedResult.review[0].explanation)).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("assessment.backToDashboard") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("assessment.viewProgress") })).toBeVisible();
    expect(createInitialAssessmentAttempt).not.toHaveBeenCalled();
    expect(saveAssessmentAnswer).not.toHaveBeenCalled();
    expect(submitAssessmentAttempt).not.toHaveBeenCalled();
  });

  test("starts an assessment and saves a selected answer through the existing API contract", async () => {
    createInitialAssessmentAttempt.mockResolvedValue({
      ok: true,
      data: { attempt: { id: 712, status: "in_progress", answers: [] } },
    });
    saveAssessmentAnswer.mockResolvedValue({
      ok: true,
      data: {
        attempt: {
          id: 712,
          status: "in_progress",
          answers: [{ questionId: 101, selectedOptionKey: "A" }],
        },
      },
    });

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("assessment.start") }));

    expect(createInitialAssessmentAttempt).toHaveBeenCalledTimes(1);
    expect(createInitialAssessmentAttempt).toHaveBeenCalledWith({ locale: "en" });
    const option = await screen.findByRole("button", { name: /A\. It asks you to act urgently/i });
    await userEvent.click(option);
    await waitFor(() => {
      expect(screen.queryByText(i18n.t("common.saving"), { exact: false })).not.toBeInTheDocument();
    });

    expect(option).toHaveAttribute("aria-pressed", "true");
    expect(saveAssessmentAnswer).toHaveBeenCalledTimes(1);
    expect(saveAssessmentAnswer).toHaveBeenCalledWith(712, {
      questionId: 101,
      selectedOptionKey: "A",
    });
    expect(submitAssessmentAttempt).not.toHaveBeenCalled();
  });

  test("keeps submission behind confirmation and submits the unchanged payload once confirmed", async () => {
    const singleQuestionResult = {
      ...completedResult,
      attempt: { ...completedResult.attempt, maximumScore: 1, totalScore: 1, percentage: 100 },
      topicScores: completedResult.topicScores.slice(0, 1),
      review: completedResult.review.slice(0, 1),
    };
    getInitialAssessment.mockResolvedValue({
      ok: true,
      data: { assessment: { id: 1, title: i18n.t("assessment.title") }, questions: questions.slice(0, 1) },
    });
    getInitialAssessmentStatus.mockResolvedValue({
      ok: true,
      data: {
        status: "in_progress",
        attempt: { id: 712, status: "in_progress", answers: [{ questionId: 101, selectedOptionKey: "A" }] },
      },
    });
    submitAssessmentAttempt.mockResolvedValue({ ok: true, data: singleQuestionResult });

    render(<App />);
    const submitButton = await screen.findByRole("button", { name: i18n.t("assessment.submit") });
    await userEvent.click(submitButton);

    const dialog = screen.getByRole("dialog", { name: i18n.t("assessment.submitConfirmTitle") });
    expect(within(dialog).getByText(i18n.t("assessment.confirmSubmit"))).toBeVisible();
    await userEvent.click(within(dialog).getByRole("button", { name: i18n.t("common.cancel") }));
    expect(submitAssessmentAttempt).not.toHaveBeenCalled();

    await userEvent.click(submitButton);
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: i18n.t("assessment.submit") }));

    expect(submitAssessmentAttempt).toHaveBeenCalledTimes(1);
    expect(submitAssessmentAttempt).toHaveBeenCalledWith(712, { locale: "en" });
    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("assessment.completed") })).toBeVisible();
  });
});
