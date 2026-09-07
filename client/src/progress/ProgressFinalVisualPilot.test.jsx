import fs from "fs";
import path from "path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getInitialAssessmentStatus } from "../api/assessmentApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation, markRecommendationViewed, markRecommendationCompleted } from "../api/recommendationApi";
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

describe("Integrated Progress visual composition", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    intersectionObserverCallback = undefined;
    window.history.replaceState({}, "", "#/progress");
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


  test("uses the full server percentage without a duplicate Progress page",async()=>{
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:53},activityComposition:{segments:[]}}});
    render(<App />);
    expect(await screen.findByText('53%')).toBeVisible();
    expect(screen.getAllByText('53%')).toHaveLength(1);
    expect(document.querySelector('.learning-path-formula')).toBeInTheDocument();
    expect(getProgress).toHaveBeenCalledTimes(1);
  });
  test("does not invent Assessment evidence or recent activity",async()=>{
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:0},assessmentTopicResults:[],recentLearningActivity:[]}});
    render(<App />);
    expect(await screen.findByText(i18n.t('progress.recentActivity.empty'))).toBeVisible();
    expect(document.querySelector('#progress-assessment-results')).toBeNull();
    expect(screen.getByText('0%')).toBeVisible();
  });
  test("keeps one service-owned recommendation when Assessment evidence is absent",async()=>{
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:0},assessmentTopicResults:[]}});
    render(<App />);
    expect(await screen.findByText('Build confidence spotting suspicious messages.')).toBeVisible();
    expect(screen.getAllByText('Build confidence spotting suspicious messages.')).toHaveLength(1);
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
  });
  test("keeps Assessment evidence when no current recommendation exists",async()=>{
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:null}});
    render(<App />);
    expect(await screen.findByText(i18n.t('dashboard.recommendation.empty'))).toBeVisible();
    expect(document.querySelector('#progress-assessment-results')).toBeInTheDocument();
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
  });
});
