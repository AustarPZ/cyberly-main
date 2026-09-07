import { StrictMode } from "react";
import fs from "fs";
import path from "path";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getInitialAssessmentStatus } from "../api/assessmentApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation, markRecommendationViewed, markRecommendationCompleted } from "../api/recommendationApi";
import { listScenarios, getRecommendedScenarios, getScenarioDashboard } from "../api/scenarioApi";
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

describe("Dashboard integrated Progress", () => {
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

  test("integrates detailed progress with one response owner", async () => {
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:37},recentLearningActivity:[{type:'scenario_completed',occurredAt:'2026-09-01T10:00:00Z'}]}});
    render(<App />);
    expect(await screen.findByText('37%')).toBeVisible();
    expect(await screen.findByText(i18n.t('progress.recentActivity.title'))).toBeVisible();
    expect(getProgress).toHaveBeenCalledTimes(1);
  });
  test("never presents a failed progress request as zero or an empty learner", async () => {
    getProgress.mockResolvedValue({ok:false,data:{message:'Unavailable'}});
    render(<App />);
    expect(await screen.findByText(i18n.t('dashboard.integrated.progressUnavailable'))).toBeVisible();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
  });

  test("preserves genuine zero and has one current recommendation owner", async () => {
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:0}}});
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:null}});
    render(<App />);
    expect(await screen.findByText('0%')).toBeVisible();
    expect(await screen.findByText(i18n.t('dashboard.recommendation.empty'))).toBeVisible();
    expect(getProgress).toHaveBeenCalledTimes(1);
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
    expect(markRecommendationViewed).not.toHaveBeenCalled();
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
  });
  test("keeps loading distinct from unavailable", async () => {
    let resolveProgress;
    getProgress.mockReturnValue(new Promise(resolve => {resolveProgress=resolve;}));
    render(<App />);
    expect(await screen.findByText(i18n.t('dashboard.progress.loading'))).toBeVisible();
    expect(screen.queryByText('0%')).not.toBeInTheDocument();
    await act(async()=>resolveProgress({ok:true,data:{learningPathProgress:{displayedPercent:18}}}));
    expect(await screen.findByText('18%')).toBeVisible();
  });
  test("distinguishes failed recommendation, scenario summary and assessment from empty/pending", async () => {
    getCurrentRecommendation.mockResolvedValue({ok:false,data:{message:'offline'}});
    getScenarioDashboard.mockResolvedValue({ok:false,data:{message:'offline'}});
    getInitialAssessmentStatus.mockResolvedValue({ok:false,data:{message:'offline'}});
    render(<App />);
    expect(await screen.findByText(i18n.t('dashboard.integrated.recommendationUnavailable'))).toBeVisible();
    expect(await screen.findByText(i18n.t('dashboard.integrated.scenarioUnavailable'))).toBeVisible();
    expect(await screen.findByText(i18n.t('dashboard.integrated.assessmentUnavailable'))).toBeVisible();
    expect(screen.queryByText(i18n.t('dashboard.recommendation.empty'))).not.toBeInTheDocument();
    expect(screen.queryByRole('button',{name:i18n.t('dashboard.assessment.start'),exact:true})).not.toBeInTheDocument();
    expect(document.querySelector('#dashboard-scenario-practice').textContent).not.toMatch(/0/);
  });
  test("loads scenario summary without requesting separate suggested scenarios", async () => {
    getRecommendedScenarios.mockResolvedValue({ok:false,data:{message:'offline'}});
    getScenarioDashboard.mockResolvedValue({ok:true,data:{completedCount:3,inProgress:null}});
    render(<App />);
    expect(await screen.findByText('3')).toBeVisible();
    expect(screen.queryByText(i18n.t('dashboard.integrated.scenarioUnavailable'))).not.toBeInTheDocument();
    expect(getRecommendedScenarios).not.toHaveBeenCalled();
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
    expect(getScenarioDashboard).toHaveBeenCalledTimes(1);
  });
  test("only confirms explicit completion after server success then refreshes progress", async () => {
    let confirm;
    markRecommendationCompleted.mockReturnValue(new Promise(resolve=>{confirm=resolve;}));
    getProgress.mockResolvedValueOnce({ok:true,data:{learningPathProgress:{displayedPercent:20}}}).mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:25}}});
    render(<App />);
    expect(await screen.findByText('20%')).toBeVisible();
    fireEvent.click(screen.getByRole('button',{name:i18n.t('progress.recommendation.markComplete')}));
    expect(markRecommendationCompleted).toHaveBeenCalledTimes(1);
    expect(screen.getByText('20%')).toBeVisible();
    expect(screen.queryByText(i18n.t('progress.recommendation.completedSaved'))).not.toBeInTheDocument();
    await act(async()=>confirm({ok:true,data:{completedRecommendation:{id:7,status:'completed'},recommendation:{id:8,topicCode:'privacy',status:'active',reasonText:'Your next server-owned step',target:{page:'progress',sectionId:'progress-badges'}}}}));
    expect(await screen.findByText('25%')).toBeVisible();
    expect(screen.getByText('Your next server-owned step')).toBeVisible();
    markRecommendationViewed.mockResolvedValue({ok:true,data:{}});
    fireEvent.click(document.querySelector('#dashboard-recommended-next-step button:not(.btn-ghost)'));
    await waitFor(()=>expect(markRecommendationViewed).toHaveBeenCalledWith(8,{locale:'en'}));
    expect(getProgress).toHaveBeenCalledTimes(2);
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
    expect(getRecommendedScenarios).not.toHaveBeenCalled();
  });
  test("follows the Current Recommendation target without a suggested-Scenario fallback", async () => {
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:{id:7,topicCode:'phishing',target:{page:'progress',sectionId:'progress-badges'}}}});
    markRecommendationViewed.mockResolvedValue({ok:true,data:{}});
    render(<App />);
    const action = await waitFor(() => {
      const button = document.querySelector('#dashboard-recommended-next-step button:not(.btn-ghost)');
      expect(button).toBeInTheDocument();
      return button;
    });
    expect(markRecommendationViewed).not.toHaveBeenCalled();
    fireEvent.click(action);
    await waitFor(()=>expect(document.activeElement.id).toBe('progress-badges'));
    expect(markRecommendationViewed).toHaveBeenCalledWith(7,{locale:'en'});
    expect(getRecommendedScenarios).not.toHaveBeenCalled();
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
    expect(markRecommendationCompleted).not.toHaveBeenCalled();
  });
  test("navigates to the exact authoritative Scenario and preserves Library recommendations", async () => {
    Element.prototype.scrollIntoView = jest.fn();
    const scenario = {id:12,slug:'canonical-phishing',title:'Canonical phishing scenario',topicCode:'phishing',difficulty:'beginner',estimatedMinutes:5};
    listScenarios.mockResolvedValue({ok:true,data:{scenarios:[scenario]}});
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:{id:7,topicCode:'phishing',targetScenarioTitle:scenario.title,target:{page:'scenarios',scenarioId:12,scenarioSlug:scenario.slug}}}});
    markRecommendationViewed.mockResolvedValue({ok:true,data:{}});
    render(<App />);
    const action = await screen.findByRole('button',{name:i18n.t('dashboard.recommendation.practiceScenario')});
    expect(getRecommendedScenarios).not.toHaveBeenCalled();
    fireEvent.click(action);
    await waitFor(()=>expect(window.location.hash).toBe('#/scenarios'));
    await waitFor(()=>expect(document.querySelector('.scenario-library-card.highlighted')).toHaveTextContent(scenario.title));
    expect(getRecommendedScenarios).toHaveBeenCalled();
    expect(markRecommendationViewed).toHaveBeenCalledWith(7,{locale:'en'});
  });
  test.each([
    ['phishing','readResource','#/resources'],
    [null,'startAssessment','#/assessment'],
  ])('uses the existing fallback for topic %s without a Scenario request', async (topicCode,label,hash) => {
    getCurrentRecommendation.mockResolvedValue({ok:true,data:{recommendation:{id:7,topicCode}}});
    markRecommendationViewed.mockResolvedValue({ok:true,data:{}});
    render(<App />);
    const region = await waitFor(()=>{
      const element=document.querySelector('#dashboard-recommended-next-step');
      expect(within(element).getByRole('button',{name:i18n.t(`dashboard.recommendation.${label}`),exact:true})).toBeInTheDocument();
      return element;
    });
    fireEvent.click(within(region).getByRole('button',{name:i18n.t(`dashboard.recommendation.${label}`),exact:true}));
    await waitFor(()=>expect(window.location.hash).toBe(hash));
    expect(getRecommendedScenarios).not.toHaveBeenCalled();
    expect(markRecommendationViewed).toHaveBeenCalledWith(7,{locale:'en'});
  });
  test("failed completion preserves recorded progress and offers another explicit attempt", async()=>{
    markRecommendationCompleted.mockResolvedValue({ok:false,data:{message:'offline'}});
    getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:20}}});
    render(<App />);
    fireEvent.click(await screen.findByRole('button',{name:i18n.t('progress.recommendation.markComplete')}));
    expect(await screen.findByText(i18n.t('dashboard.integrated.completionUnavailable'))).toBeVisible();
    expect(screen.getByText('20%')).toBeVisible();
    expect(getProgress).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button',{name:i18n.t('progress.recommendation.markComplete')})).toBeEnabled();
  });
  test("ignores a stale progress response after locale changes", async()=>{
    let oldResponse;
    getProgress.mockReturnValueOnce(new Promise(resolve=>{oldResponse=resolve;})).mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:60}}});
    render(<App />);
    await screen.findByText(i18n.t('dashboard.progress.loading'));
    await act(async()=>{await i18n.changeLanguage('ms');});
    expect(await screen.findByText('60%')).toBeVisible();
    await act(async()=>oldResponse({ok:true,data:{learningPathProgress:{displayedPercent:10}}}));
    expect(screen.queryByText('10%')).not.toBeInTheDocument();
    expect(screen.getByText('60%')).toBeVisible();
  });
  test('deduplicates initial overview requests during StrictMode effect replay',async()=>{
    render(<StrictMode><App /></StrictMode>);
    await screen.findByText(i18n.t('progress.recentActivity.title'));
    expect(getProgress).toHaveBeenCalledTimes(1);
    expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
    expect(getRecommendedScenarios).not.toHaveBeenCalled();
  });
});
