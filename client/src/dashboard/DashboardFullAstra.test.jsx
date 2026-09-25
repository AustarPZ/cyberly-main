import { StrictMode } from "react";
import fs from "fs";
import path from "path";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
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
let mockNextStepProps;
jest.mock('./DashboardNextStepArea', () => {
  const actual = jest.requireActual('./DashboardNextStepArea');
  return { ...actual, __esModule: true, default: props => { mockNextStepProps = props; return <actual.default {...props} />; } };
});

class IntersectionObserverMock {
  constructor(callback) { intersectionObserverCallback = callback; }
  observe() {}
  disconnect() {}
}

async function renderDashboardWithSettledOverview() {
  // A whole-page role query during startup can monopolize jsdom before React
  // runs the overview effect. Settle the mocked authority and its React updates
  // first, then perform the same accessible-role assertions on the ready UI.
  render(<App />);
  await act(async () => {
    await restoreSession.mock.results[0].value;
  });
  expect(getProgress).toHaveBeenCalledTimes(1);
  expect(getCurrentRecommendation).toHaveBeenCalledTimes(1);
  await act(async () => {
    await Promise.all([
      getProgress.mock.results[0].value,
      getCurrentRecommendation.mock.results[0].value,
    ]);
  });
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
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: { id: 7, status: "active", target: {page: "resources"}, topicCode: "phishing", reasonText: "Build confidence spotting suspicious messages." } } });
    getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [{ id: 9, slug: "bank-message", title: "Suspicious bank message", topicCode: "phishing", difficulty: "beginner", estimatedMinutes: 5 }] } });
    getScenarioDashboard.mockResolvedValue({ ok: true, data: { completedCount: 1, inProgress: null } });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });


 test.each([true,false])('polish retains Assessment summary and recent activity; populated=%s',async(populated)=>{
 getInitialAssessmentStatus.mockResolvedValue({ok:true,data:{status:'completed',result:{attempt:{percentage:75,measuredLevel:'developing'}}}});
 getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:38},assessmentTopicResults:['phishing_and_scams','password_and_account_security','privacy_and_personal_information','misinformation_and_deepfakes'].map(topicCode=>({topicCode,correctCount:1,totalCount:3,resultLevel:'developing'})),recentLearningActivity:populated?[{type:'scenario_completed',occurredAt:'2026-09-01T10:00:00Z',topicCode:'phishing'}]:[]}});
 await renderDashboardWithSettledOverview();
 const assessment=document.querySelector('#dashboard-initial-assessment');
 expect(within(assessment).getByRole('heading',{name:'Initial assessment completed'})).toBeVisible();
 expect(assessment).toHaveTextContent('75%');expect(assessment).toHaveTextContent(i18n.t('levels.developing'));
 expect(within(assessment).getByRole('button',{name:'View assessment results'})).toBeVisible();
 expect(assessment.querySelector('.assessment-results-grid')).toBeNull();expect(within(assessment).queryByText(/1\/3/)).toBeNull();
 expect(assessment).toHaveTextContent('A starting baseline, not a permanent label.');
 expect(assessment).not.toHaveTextContent('They help inform your current recommendations.');
 expect(screen.getByText('Learning progress, not an ability score.')).toBeVisible();
 expect(screen.queryByText('This shows progress through Cyberly. It does not measure cybersecurity ability, mastery or safety.')).toBeNull();
 const recent=document.querySelector('#progress-learning-activity');
 expect(recent).not.toHaveTextContent('Recent items use only activity Cyberly has recorded.');
 expect(within(recent).getByText(i18n.t(populated?'progress.recentActivity.types.scenario_completed':'progress.recentActivity.empty'))).toBeVisible();
 });
 test.each(['guardrail','baseline','recent'])('polish concise %s copy',async(kind)=>{
 getInitialAssessmentStatus.mockResolvedValue({ok:true,data:{status:'completed',result:{attempt:{percentage:75,measuredLevel:'developing'}}}});
 await renderDashboardWithSettledOverview();
 if(kind==='guardrail'){
 expect(screen.getByText('Learning progress, not an ability score.')).toBeVisible();
 expect(screen.queryByText('This shows progress through Cyberly. It does not measure cybersecurity ability, mastery or safety.')).toBeNull();
 }else if(kind==='baseline'){
 expect(screen.getByText('A starting baseline, not a permanent label.')).toBeVisible();
 expect(screen.queryByText('These results are a starting baseline, not a permanent measure of ability. They help inform your current recommendations.')).toBeNull();
 }else expect(document.querySelector('#progress-learning-activity')).not.toHaveTextContent('Recent items use only activity Cyberly has recorded.');
 });
 test.each([0,37])('same confirmed %s in shortcut and detail with one owner',async(percent)=>{
 getProgress.mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:percent}}});await renderDashboardWithSettledOverview();
 expect(within(screen.getByRole('button',{name:/My Progress/})).getByText(percent+'%')).toBeVisible();
 expect(within(document.querySelector('#dashboard-measured-progress')).getByText(percent+'%')).toBeVisible();expect(getProgress).toHaveBeenCalledTimes(1);
 });
 test('full composition integrates details before exploration and explicit chat disclosure',async()=>{
 await renderDashboardWithSettledOverview();expect(screen.getByRole('heading',{level:1})).toHaveTextContent('A little practice. A stronger instinct.');
 const detail=document.querySelector('#dashboard-measured-progress');expect(detail.compareDocumentPosition(document.querySelector('#dashboard-quick-actions')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(detail).toHaveTextContent('Learning progress, not an ability score.');
 expect(detail.contains(document.querySelector('#dashboard-initial-assessment'))).toBe(true);expect(detail.contains(document.querySelector('#progress-learning-activity'))).toBe(true);
 expect(document.querySelector('#dashboard-cyberguard-ai').tagName).toBe('DETAILS');expect(document.querySelector('#dashboard-cyberguard-ai')).not.toHaveAttribute('open');
 expect(screen.queryByRole('complementary',{name:i18n.t('dashboard.sectionNav.ariaLabel')})).not.toBeInTheDocument();
 });
 test.each([true,false])('shortcut focuses heading; reduced=%s without writes',async(reduced)=>{
 window.matchMedia.mockReturnValue({matches:reduced,addEventListener:jest.fn(),removeEventListener:jest.fn()});await renderDashboardWithSettledOverview();
 const heading=document.querySelector('#progress-overview');heading.scrollIntoView=jest.fn();fireEvent.click(screen.getByRole('button',{name:/My Progress/}));
 expect(heading.tagName).toBe('H2');expect(heading).toHaveFocus();expect(heading.scrollIntoView).toHaveBeenCalledWith({behavior:reduced?'auto':'smooth',block:'start'});
 expect(markRecommendationViewed).not.toHaveBeenCalled();expect(markRecommendationCompleted).not.toHaveBeenCalled();expect(createChatConversation).not.toHaveBeenCalled();expect(window.location.hash).toBe('#/dashboard');
 });
 test('manual tip changes without writes; locale retains selected ID',async()=>{
 await renderDashboardWithSettledOverview();const tip=document.querySelector('#dashboard-daily-tip'),first=tip.dataset.tipId;
 fireEvent.click(within(tip).getByRole('button',{name:'Another tip'}));const next=tip.dataset.tipId;expect(next).not.toBe(first);
 await act(async()=>{await i18n.changeLanguage('ms');});expect(tip.dataset.tipId).toBe(next);expect(tip).toHaveTextContent(i18n.t('dashboard.tips.'+next));
 expect(markRecommendationViewed).not.toHaveBeenCalled();expect(markRecommendationCompleted).not.toHaveBeenCalled();expect(createChatConversation).not.toHaveBeenCalled();
 });
 test('complete inventory shows multiple unfinished rather than legacy one',async()=>{
 getScenarioDashboard.mockResolvedValue({ok:true,data:{completedCount:1,inProgress:{attemptId:9},inProgressAttempts:[{attemptId:9,scenarioSlug:'one'},{attemptId:10,scenarioSlug:'two'}]}});
 await renderDashboardWithSettledOverview();expect(within(document.querySelector('#dashboard-scenario-practice')).getByText('2')).toBeVisible();
 });

 test.each(['loading','failure','missing'])('both percentages withhold unconfirmed %s data',async(mode)=>{
 getProgress.mockImplementation(()=>mode==='loading'?new Promise(()=>{}):Promise.resolve(mode==='failure'?{ok:false,data:{message:'offline'}}:{ok:true,data:{}}));
 render(<App />);await screen.findByRole('heading',{level:1});
 if(mode!=='loading')await waitFor(()=>expect(document.querySelector('#dashboard-measured-progress')).toHaveTextContent(i18n.t('dashboard.integrated.progressUnavailable')));
 const shortcut=screen.getByRole('button',{name:/My Progress/});expect(shortcut).toHaveTextContent('—');expect(shortcut.textContent).not.toMatch(/\d+%/);
 expect(document.querySelector('#dashboard-measured-progress').textContent).not.toMatch(/\d+%/);expect(getProgress).toHaveBeenCalledTimes(1);
 });
 test.each(['loading','failure'])('shortcut retains accessible %s status and detailed recovery',async(mode)=>{
 getProgress.mockImplementation(()=>mode==='loading'?new Promise(()=>{}):Promise.resolve({ok:false,data:{message:'offline'}}));
 render(<App />);await screen.findByRole('heading',{level:1});
 const message=i18n.t(mode==='loading'?'dashboard.progress.loading':'dashboard.integrated.progressUnavailable');
 const detail=document.querySelector('#dashboard-measured-progress');
 await waitFor(()=>expect(detail).toHaveTextContent(message));
 const shortcut=screen.getByRole('button',{name:new RegExp('My Progress — '+message.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'))});
 expect(shortcut).toHaveAccessibleName('My Progress — '+message);
 expect(within(detail).getByText(message,{exact:true})).toBeVisible();
 if(mode==='failure')expect(within(detail).getByRole('button',{name:i18n.t('dashboard.integrated.retry')})).toBeVisible();
 expect(markRecommendationCompleted).not.toHaveBeenCalled();
 });
 test('both locations discard old-locale progress immediately while replacement is pending',async()=>{
 getProgress.mockResolvedValueOnce({ok:true,data:{learningPathProgress:{displayedPercent:37}}}).mockImplementation(()=>new Promise(()=>{}));
 await renderDashboardWithSettledOverview();expect(screen.getAllByText('37%')).toHaveLength(2);
 await act(async()=>{await i18n.changeLanguage('ms');});expect(screen.queryByText('37%')).not.toBeInTheDocument();expect(screen.queryByText('0%')).not.toBeInTheDocument();
 expect(screen.getByRole('button',{name:new RegExp(i18n.t('dashboard.astra.myProgress'))})).toHaveTextContent('—');
 expect(getProgress).toHaveBeenCalledTimes(2);expect(markRecommendationViewed).not.toHaveBeenCalled();
 });

 test('missing Scenario inventory and counts are not confirmed zero',async()=>{
 getScenarioDashboard.mockResolvedValue({ok:true,data:{}});await renderDashboardWithSettledOverview();
 const region=document.querySelector('#dashboard-scenario-practice');expect(within(region).queryByText('0')).not.toBeInTheDocument();expect(within(region).getAllByText('—')).toHaveLength(2);
 });
 test('late prior-user progress cannot replace the next user observation',async()=>{
 let old;getProgress.mockReturnValueOnce(new Promise(resolve=>{old=resolve;})).mockResolvedValue({ok:true,data:{learningPathProgress:{displayedPercent:19}}});
 const first=render(<App />);await screen.findByRole('heading',{level:1});await waitFor(()=>expect(getProgress).toHaveBeenCalledTimes(1));
 const session=await restoreSession();first.unmount();restoreSession.mockResolvedValue({...session,data:{...session.data,user:{...session.data.user,id:42,displayName:'Second synthetic learner'}}});
 render(<App />);await screen.findAllByText('19%');await act(async()=>old({ok:true,data:{learningPathProgress:{displayedPercent:87}}}));
 expect(screen.queryByText('87%')).not.toBeInTheDocument();expect(screen.getAllByText('19%')).toHaveLength(2);expect(markRecommendationCompleted).not.toHaveBeenCalled();
 });
});
