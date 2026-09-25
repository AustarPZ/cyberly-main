import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';
import i18n from '../i18n';
import { restoreSession } from '../api/authApi';
import * as assessment from '../api/assessmentApi';
import * as scenario from '../api/scenarioApi';
import * as recommendation from '../api/recommendationApi';
import { getProgress } from '../api/progressApi';
import { listChatConversations } from '../chat/chatApi';
const account = { id: 41, displayName: 'Alya', age: 15, role: 'user', emailVerified: true };
const profile = { exists: true, onboardingCompleted: true, preferredLanguage: 'english', familiarityLevel: 'beginner', learningStyle: 'visual', helpTopics: ['phishing'] };
const unfinished = (attemptId = 9) => ({ attemptId, scenarioSlug: 'parcel-sms', title: 'Parcel SMS' });
function setOwners(hasAssessment, attempts = []) {
  assessment.getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: hasAssessment ? { status: 'in_progress', attempt: { id: 7 } } : { status: 'pending' } });
  scenario.getScenarioDashboard.mockResolvedValue({ ok: true, data: { completedCount: 0, inProgress: null, inProgressAttempts: attempts } });
}
async function boot() {
  render(<App />);
  await act(async () => { await restoreSession.mock.results[0].value; });
  await act(async () => { await Promise.allSettled([assessment.getInitialAssessmentStatus, scenario.getScenarioDashboard, recommendation.getCurrentRecommendation].map(fn => fn.mock.results[0]?.value)); });
}
const surface = () => screen.getByRole('region', { name: i18n.t('dashboard.continueLearning') });
function isolated() {
  for (const fn of [assessment.createInitialAssessmentAttempt, assessment.getInitialAssessmentResult, scenario.startScenarioAttempt, scenario.getScenarioAttemptResult, recommendation.markRecommendationViewed, recommendation.markRecommendationCompleted]) expect(fn).not.toHaveBeenCalled();
  expect(assessment.getInitialAssessmentStatus).toHaveBeenCalledTimes(1);
}
beforeEach(async () => {
  jest.resetAllMocks(); mockContext = null;
  window.history.replaceState({}, '', '#/dashboard');
  window.scrollTo = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.IntersectionObserver = class { observe() {} disconnect() {} };
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  await i18n.changeLanguage('en');
  restoreSession.mockResolvedValue({ ok: true, data: { user: account, profile } });
  getProgress.mockResolvedValue({ ok: true, data: { learningPathProgress: { displayedPercent: 0 } } });
  recommendation.getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });
  listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  setOwners(false);
  assessment.getInitialAssessment.mockResolvedValue({ ok: true, data: { assessment: { id: 1, title: 'Assessment', questionCount: 1 }, questions: [{ id: 101, prompt: 'Safe next step?', options: [{ key: 'A', text: 'Pause' }] }] } });
  assessment.getAssessmentAttempt.mockResolvedValue({ ok: true, data: { attempt: { id: 7, assessmentId: 1, status: 'in_progress', answers: [] } } });
  scenario.getScenarioAttempt.mockImplementation(async id => ({ ok: true, data: {
    attempt: { id, status: 'in_progress', currentStepOrder: 1 }, scenario: { id: 3, slug: 'parcel-sms', title: 'Parcel SMS', totalSteps: 2 },
    currentStep: { id: 11, stepOrder: 1, promptText: 'Choose', situationText: `Saved situation ${id}`, options: [{ key: 'A', text: 'Pause' }] }, decisions: [],
  } }));
});
test.each(['en', 'ms', 'zh-CN'])('one assessment: accessible %s action reaches only exact authority', async locale => {
  await i18n.changeLanguage(locale);
  restoreSession.mockResolvedValue({ ok: true, data: { user: account, profile: { ...profile, preferredLanguage: { en: 'english', ms: 'bahasa_melayu', 'zh-CN': 'chinese' }[locale] } } });
  setOwners(true); await boot();
  const buttons = within(surface()).getAllByRole('button'); expect(buttons).toHaveLength(1);
  expect(buttons[0]).toHaveAccessibleName(i18n.t('dashboard.resumeAssessment'));
  expect(assessment.getAssessmentAttempt).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(buttons[0]));
  expect(await screen.findByText('Safe next step?')).toBeVisible();
  expect(assessment.getAssessmentAttempt.mock.calls).toEqual([[7, { locale }]]);
  expect(scenario.getScenarioAttempt).not.toHaveBeenCalled(); isolated();
});
test.each(['en', 'ms', 'zh-CN'])('one scenario: accessible %s action reaches exact attempt and slug', async locale => {
  await i18n.changeLanguage(locale);
  restoreSession.mockResolvedValue({ ok: true, data: { user: account, profile: { ...profile, preferredLanguage: { en: 'english', ms: 'bahasa_melayu', 'zh-CN': 'chinese' }[locale] } } });
  setOwners(false, [unfinished()]); await boot();
  const buttons = within(surface()).getAllByRole('button'); expect(buttons).toHaveLength(1);
  expect(buttons[0]).toHaveAccessibleName(`${i18n.t('dashboard.resumeScenario')}: Parcel SMS`);
  expect(scenario.getScenarioAttempt).not.toHaveBeenCalled();
  await act(async () => fireEvent.click(buttons[0]));
  expect(await screen.findByText('Saved situation 9')).toBeVisible();
  expect(scenario.getScenarioAttempt.mock.calls).toEqual([[9, { locale }]]);
  expect(assessment.getAssessmentAttempt).not.toHaveBeenCalled(); isolated();
});
test.each([0, 1])('mixed choices have equal prominence and only selected choice %s executes', async selection => {
  setOwners(true, [unfinished()]); await boot();
  const buttons = within(surface()).getAllByRole('button'); expect(buttons).toHaveLength(2);
  expect(buttons[0].className).toBe(buttons[1].className);
  for (const button of buttons) { expect(button).not.toHaveAttribute('aria-pressed'); expect(button).not.toHaveFocus(); }
  expect(assessment.getAssessmentAttempt).not.toHaveBeenCalled(); expect(scenario.getScenarioAttempt).not.toHaveBeenCalled(); isolated();
  await act(async () => fireEvent.click(buttons[selection]));
  expect(assessment.getAssessmentAttempt).toHaveBeenCalledTimes(selection === 0 ? 1 : 0);
  expect(scenario.getScenarioAttempt).toHaveBeenCalledTimes(selection === 1 ? 1 : 0); isolated();
});
test('all same-title same-slug attempts remain distinct in resolver identity order', async () => {
  setOwners(false, [unfinished(12), unfinished(9), { attemptId: 10, scenarioSlug: 'other', title: 'Other title' }]); await boot();
  const buttons = within(surface()).getAllByRole('button'); expect(buttons).toHaveLength(3);
  expect(buttons.map(button => button.querySelector('.dashboard-action-label').textContent)).toEqual([
    `${i18n.t('dashboard.resumeScenario')}: Parcel SMS${i18n.t('dashboard.nextStep.savedPracticeNumber',{number:1})}`, `${i18n.t('dashboard.resumeScenario')}: Other title`, `${i18n.t('dashboard.resumeScenario')}: Parcel SMS${i18n.t('dashboard.nextStep.savedPracticeNumber',{number:2})}`,
  ]);
  await act(async () => fireEvent.click(buttons[2]));
  expect(scenario.getScenarioAttempt.mock.calls).toEqual([[12, { locale: 'en' }]]); isolated();
});
test.each(['legacy', 'assessment-error', 'scenario-error', 'unknown', 'malformed'])('%s cannot fabricate a producer', async state => {
  setOwners(true, [unfinished()]);
  if (state === 'legacy') scenario.getScenarioDashboard.mockResolvedValue({ ok: true, data: { inProgress: { attemptId: 9, slug: 'parcel-sms' } } });
  if (state === 'assessment-error') assessment.getInitialAssessmentStatus.mockRejectedValue(new Error('offline'));
  if (state === 'scenario-error') scenario.getScenarioDashboard.mockRejectedValue(new Error('offline'));
  if (state === 'unknown') assessment.getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: 'unknown' } });
  if (state === 'malformed') scenario.getScenarioDashboard.mockResolvedValue({ ok: true, data: { inProgressAttempts: [unfinished(), { attemptId: '10', scenarioSlug: 'sms' }] } });
  await boot();
  expect(screen.queryByRole('region', { name: i18n.t('dashboard.continueLearning') })).not.toBeInTheDocument();
  expect(assessment.getAssessmentAttempt).not.toHaveBeenCalled(); expect(scenario.getScenarioAttempt).not.toHaveBeenCalled(); isolated();
});
test.each(['assessment', 'scenario'])('%s loading cannot fabricate a producer', async owner => {
  setOwners(true, [unfinished()]); let finish;
  const pending = new Promise(resolve => { finish = resolve; });
  (owner === 'assessment' ? assessment.getInitialAssessmentStatus : scenario.getScenarioDashboard).mockReturnValue(pending);
  render(<App />); await act(async () => { await restoreSession.mock.results[0].value; });
  expect(screen.queryByRole('region', { name: i18n.t('dashboard.continueLearning') })).not.toBeInTheDocument();
  await act(async () => finish({ ok: true, data: owner === 'assessment' ? { status: 'pending' } : { inProgressAttempts: [] } }));
});
test.each([0, 1])('choice %s delegates guard cancel/confirm to the exact adapter', async selection => {
  setOwners(true, [unfinished()]); await boot(); const leave = jest.fn();
  act(() => mockContext.registerActivityGuard({ source: 'scenario', key: 'prior', title: 'Leave?', description: 'Confirm', confirmLabel: 'Leave prior', cancelLabel: 'Stay here', onLeave: leave }));
  fireEvent.click(within(surface()).getAllByRole('button')[selection]);
  expect(assessment.getAssessmentAttempt).not.toHaveBeenCalled(); expect(scenario.getScenarioAttempt).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Stay here' })); expect(leave).not.toHaveBeenCalled(); expect(surface()).toBeVisible();
  fireEvent.click(within(surface()).getAllByRole('button')[selection]);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Leave prior' })));
  expect(leave).toHaveBeenCalledTimes(1);
  expect(assessment.getAssessmentAttempt).toHaveBeenCalledTimes(selection === 0 ? 1 : 0);
  expect(scenario.getScenarioAttempt).toHaveBeenCalledTimes(selection === 1 ? 1 : 0); isolated();
});
test.each([null, { id: 4, status: 'active', target: { page: 'assessment' } }, { id: 4, status: 'completed', target: null }])('no unfinished activity adds no producer for recommendation %j', async value => {
  recommendation.getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: value } });
  await boot();
  expect(screen.queryByRole('region', { name: i18n.t('dashboard.continueLearning') })).not.toBeInTheDocument(); isolated();
});
test('locale change hides old authority until both current owners settle', async () => {
  setOwners(true, [unfinished()]); await boot(); expect(surface()).toBeVisible();
  let finishAssessment; let finishScenario;
  assessment.getInitialAssessmentStatus.mockReturnValue(new Promise(resolve => { finishAssessment = resolve; }));
  scenario.getScenarioDashboard.mockReturnValue(new Promise(resolve => { finishScenario = resolve; }));
  await act(async () => { await i18n.changeLanguage('ms'); });
  expect(screen.queryByRole('region', { name: i18n.t('dashboard.continueLearning') })).not.toBeInTheDocument();
  await act(async () => finishAssessment({ ok: true, data: { status: 'in_progress', attempt: { id: 17 } } }));
  expect(screen.queryByRole('region', { name: i18n.t('dashboard.continueLearning') })).not.toBeInTheDocument();
  await act(async () => finishScenario({ ok: true, data: { inProgressAttempts: [] } }));
  await act(async () => fireEvent.click(within(surface()).getByRole('button')));
  expect(assessment.getAssessmentAttempt.mock.calls).toEqual([[17, { locale: 'ms' }]]);
});
let mockContext;
jest.mock('../design-system/layout/AppShell', () => {
  const Actual = jest.requireActual('../design-system/layout/AppShell').default;
  function Probe() { mockContext = require('react').useContext(require('../App').AppCtx); return null; }
  return { __esModule: true, default: props => <Actual {...props}><Probe />{props.children}</Actual> };
});
jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/assessmentApi", () => ({
  getInitialAssessment: jest.fn(), getAssessmentAttempt: jest.fn(), getInitialAssessmentResult: jest.fn(), createInitialAssessmentAttempt: jest.fn(), getInitialAssessmentStatus: jest.fn(),
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
