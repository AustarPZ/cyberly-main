import fs from "fs";
import path from "path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession, login } from "../api/authApi";
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

describe("Progress protected compatibility", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    intersectionObserverCallback = undefined;
    window.history.replaceState({}, "", "#/progress");
    window.scrollTo = jest.fn(); Element.prototype.scrollIntoView = jest.fn();
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


  test("direct protected entry resolves to integrated Dashboard with one request owner",async()=>{
    render(<App />);
    await waitFor(()=>expect(window.location.hash).toBe('#/dashboard'));
    expect(await screen.findByRole('heading',{level:1,name:/Welcome back/})).toBeVisible();
    await waitFor(()=>expect(document.activeElement.id).toBe('progress-overview'));
    expect(getProgress).toHaveBeenCalledTimes(1);
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
    expect(screen.getAllByRole('main')).toHaveLength(1);
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
  });
  test("returning through a Progress history entry does not create a duplicate mounted owner",async()=>{
    render(<App />);
    await waitFor(()=>expect(window.location.hash).toBe('#/dashboard'));
    act(()=>{window.history.pushState({},'', '#/progress'); window.dispatchEvent(new HashChangeEvent('hashchange'));});
    await waitFor(()=>expect(window.location.hash).toBe('#/dashboard'));
    expect(screen.getAllByRole('main')).toHaveLength(1);
    await waitFor(()=>expect(document.activeElement.id).toBe('progress-overview'));
  });
  test("keeps unauthenticated Progress entry pending through Sign In",async()=>{
    const restored=await restoreSession();
    restoreSession.mockResolvedValue({ok:false,data:{}});
    login.mockResolvedValue(restored);
    render(<App />);
    await waitFor(()=>expect(window.location.hash).toBe('#/login'));
    fireEvent.change(document.querySelector('#login-email'),{target:{value:'local@example.test'}});
    fireEvent.change(document.querySelector('#login-password'),{target:{value:'local-test-only'}});
    fireEvent.click(screen.getByRole('button',{name:i18n.t('auth.signInButton'),exact:true}));
    await waitFor(()=>expect(document.activeElement.id).toBe('progress-overview'));
    expect(window.location.hash).toBe('#/dashboard');
  });
  test.each(['progress-badges','progress-assessment-results'])('shared action target opens and focuses %s',async(sectionId)=>{
    window.history.replaceState({},'', '#/dashboard');
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:{id:7,topicCode:'phishing',target:{page:'progress',sectionId}}}});
    markRecommendationViewed.mockResolvedValue({ok:true,data:{}});
    render(<App />);
    fireEvent.click(await waitFor(()=>{const action=document.querySelector('#dashboard-recommended-next-step button:not(.btn-ghost)');expect(action).toBeInTheDocument();return action;},{timeout:5000}));
    await waitFor(()=>expect(document.activeElement.id).toBe(sectionId));
    if(sectionId==='progress-badges')expect(document.activeElement.closest('details')).toHaveAttribute('open');
    expect(getProgress).toHaveBeenCalledTimes(1);
    expect(markRecommendationViewed).toHaveBeenCalledTimes(1);
  });
  test('missing optional action section falls back without trapping focus',async()=>{
    window.history.replaceState({},'', '#/dashboard');
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:0},assessmentTopicResults:[]}});
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:{id:7,topicCode:'phishing',target:{page:'progress',sectionId:'progress-assessment-results'}}}});
    markRecommendationViewed.mockResolvedValue({ok:true,data:{}});
    render(<App />);
    fireEvent.click(await waitFor(()=>{const action=document.querySelector('#dashboard-recommended-next-step button:not(.btn-ghost)');expect(action).toBeInTheDocument();return action;},{timeout:5000}));
    await waitFor(()=>expect(document.activeElement.id).toBe('progress-overview'));
  });
});
