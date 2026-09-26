import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import i18n from '../i18n';
import { restoreSession, logout } from '../api/authApi';
import { listChatConversations } from '../chat/chatApi';
import { getScenarioAttempt, getRecommendedScenarios, listScenarios, getScenarioBySlug, startScenarioAttempt, getScenarioAttemptResult, saveScenarioDecision, completeScenarioAttempt } from '../api/scenarioApi';

let mockContext;
jest.mock('../design-system/layout/AppShell', () => {
  const Actual = jest.requireActual('../design-system/layout/AppShell').default;
  function Probe() { mockContext = require('react').useContext(require('../App').AppCtx); return null; }
  return { __esModule: true, default: props => <Actual {...props}><Probe />{props.children}</Actual> };
});
jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => null }));
jest.mock('../api/assessmentApi', () => ({ getInitialAssessmentStatus: jest.fn().mockResolvedValue({ ok: true, data: { status: 'pending' } }) }));
jest.mock('../api/progressApi', () => ({ getProgress: jest.fn().mockResolvedValue({ ok: true, data: { learningPathProgress: { displayedPercent: 0 } } }) }));
jest.mock('../api/recommendationApi', () => ({ getCurrentRecommendation: jest.fn().mockResolvedValue({ ok: true, data: { recommendation: null } }) }));
jest.mock('../api/resourceApi', () => ({ listResources: jest.fn().mockResolvedValue({ ok: true, data: { resources: [] } }) }));
jest.mock('../api/authApi', () => ({ register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn() }));
jest.mock('../api/scenarioApi', () => ({ listScenarios: jest.fn(), getRecommendedScenarios: jest.fn(), getScenarioDashboard: jest.fn(), getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), getScenarioAttempt: jest.fn(), saveScenarioDecision: jest.fn(), completeScenarioAttempt: jest.fn(), getScenarioAttemptResult: jest.fn() }));
jest.mock('../chat/chatApi', () => ({ listChatConversations: jest.fn().mockResolvedValue({ ok: true, data: { conversations: [] } }), createChatConversation: jest.fn(), getChatConversation: jest.fn(), renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(), generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(), confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn() }));

const account = { id: 91, displayName: 'Learner', age: 15, role: 'user', emailVerified: true };
const profile = { exists: true, onboardingCompleted: true, preferredLanguage: 'english', familiarityLevel: 'beginner', learningStyle: 'step_by_step', helpTopics: ['phishing'] };
const target = (attemptId = 7) => ({ type: 'resume_scenario', attemptId, scenarioSlug: 'parcel-sms' });
const payload = (attemptId = 7) => ({ attempt: { id: attemptId, status: 'in_progress', currentStepOrder: 1 }, scenario: { id: 9, slug: 'parcel-sms', title: 'Parcel SMS', totalSteps: 2, difficulty: 'beginner', topicCode: 'phishing_and_scams' }, currentStep: { id: 11, stepOrder: 1, promptText: `Attempt ${attemptId}`, situationText: `Situation ${attemptId}`, options: [{ key: 'A', text: 'Pause and verify' }] }, decisions: [] });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
async function boot() { const result = render(<App />); await waitFor(() => expect(mockContext?.user?.id).toBe(91)); return result; }
async function request(value = target()) { await act(async () => { mockContext.requestScenarioExactResume(value); }); }
function noAutomaticMutations() {
  for (const fn of [startScenarioAttempt, getScenarioAttemptResult, saveScenarioDecision, completeScenarioAttempt, getRecommendedScenarios]) expect(fn).not.toHaveBeenCalled();
}
beforeEach(async () => {
  jest.clearAllMocks(); mockContext = null;
  window.history.replaceState({}, '', '#/about');
  window.scrollTo = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.IntersectionObserver = class { observe() {} disconnect() {} };
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  await i18n.changeLanguage('en');
  restoreSession.mockResolvedValue({ ok: true, data: { user: account, profile } });
  logout.mockResolvedValue({ ok: true, data: {} });
  listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  getScenarioAttempt.mockImplementation(async id => ({ ok: true, status: 200, data: payload(id) }));
});

test('exact GET opens the existing player independent of published Library membership, consumes handoff once and focuses it', async () => {
  await boot(); await request();
  expect(await screen.findByText('Situation 7')).toBeVisible();
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  expect(getScenarioAttempt).toHaveBeenCalledWith(7, { locale: 'en' });
  expect(listScenarios).not.toHaveBeenCalled();
  expect(mockContext.pendingScenarioResume).toBe(null);
  expect(window.location.hash).toBe('#/scenarios');
  expect(screen.getAllByRole('main')).toHaveLength(1);
  expect(document.activeElement).toContainElement(screen.getByText('Situation 7'));
  noAutomaticMutations();
});
test('invalid producer input does not publish, navigate or request', async () => {
  await boot(); let result;
  act(() => { result = mockContext.requestScenarioExactResume({ ...target(), attemptId: '7' }); });
  expect(result.reason).toBe('INVALID_TARGET'); expect(mockContext.pendingScenarioResume).toBe(null);
  expect(window.location.hash).toBe('#/about'); expect(getScenarioAttempt).not.toHaveBeenCalled();
});
test.each([
  ['id', v => { v.attempt.id = 8; }, 'identityMismatch'],
  ['slug', v => { v.scenario.slug = 'other'; }, 'identityMismatch'],
  ['completed', v => { v.attempt.status = 'completed'; }, 'notInProgress'],
  ['abandoned', v => { v.attempt.status = 'abandoned'; }, 'notInProgress'],
  ['null step', v => { v.currentStep = null; }, 'inconsistent'],
])('%s enters terminal recovery and preserves recommendation isolation', async (_, change, key) => {
  const value = payload(); change(value); getScenarioAttempt.mockResolvedValue({ ok: true, data: value });
  await boot(); await request();
  expect(await screen.findByText(i18n.t(`scenarios.resume.${key}`))).toBeVisible();
  expect(mockContext.pendingScenarioResume).toBe(null); noAutomaticMutations();
  expect(screen.queryByRole('button', { name: i18n.t('scenarios.attempt.complete') })).not.toBeInTheDocument();
  expect(document.activeElement).toHaveAttribute('role', 'alert');
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.resume.backToScenarios') }));
  await waitFor(() => expect(getRecommendedScenarios).toHaveBeenCalledTimes(1));
});
test.each([[404, 'unavailable'], [403, 'requestRejected']])('HTTP %s recovery', async (status, key) => {
  getScenarioAttempt.mockResolvedValue({ ok: false, status, data: {} }); await boot(); await request();
  expect(await screen.findByText(i18n.t(`scenarios.resume.${key}`))).toBeVisible(); noAutomaticMutations();
});
test('current 401 clears private authentication and handoff', async () => {
  getScenarioAttempt.mockResolvedValue({ ok: false, status: 401, data: {} }); await boot(); await request();
  await waitFor(() => expect(mockContext.user).toBe(null)); expect(mockContext.pendingScenarioResume).toBe(null); noAutomaticMutations();
});
test('network retry is explicit and repeats only the same exact GET', async () => {
  getScenarioAttempt.mockRejectedValueOnce(new Error('offline'));
  await boot(); await request();
  const retry = await screen.findByRole('button', { name: i18n.t('scenarios.resume.retry') });
  noAutomaticMutations(); retry.focus(); await userEvent.keyboard('{Enter}');
  expect(await screen.findByText('Situation 7')).toBeVisible();
  expect(getScenarioAttempt.mock.calls).toEqual([[7, { locale: 'en' }], [7, { locale: 'en' }]]); noAutomaticMutations();
});
test('replacement target wins even with same slug and an older response resolving last', async () => {
  const old = deferred(); getScenarioAttempt.mockImplementation(id => id === 7 ? old.promise : Promise.resolve({ ok: true, data: payload(id) }));
  await boot(); await request(); await request(target(8));
  expect(await screen.findByText('Situation 8')).toBeVisible();
  await act(async () => old.resolve({ ok: true, data: payload() }));
  expect(screen.queryByText('Situation 7')).not.toBeInTheDocument(); noAutomaticMutations();
});
test('C01 cancellation preserves old activity; confirmation leaves it and executes exact queued target', async () => {
  await boot(); await request(); await screen.findByText('Situation 7');
  await request(target(8));
  expect(screen.getByRole('dialog')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.continueScenario') }));
  expect(screen.getByText('Situation 7')).toBeVisible(); expect(mockContext.pendingScenarioResume).toBe(null); expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  await request(target(8));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.leaveScenario') }));
  expect(await screen.findByText('Situation 8')).toBeVisible(); expect(getScenarioAttempt).toHaveBeenLastCalledWith(8, { locale: 'en' }); noAutomaticMutations();
});
test.each(['logout', 'relogin', 'navigation'])('ignores stale response after %s', async cause => {
  const old = deferred(); getScenarioAttempt.mockReturnValue(old.promise); await boot(); await request();
  await act(async () => {
    if (cause === 'logout') await mockContext.logout();
    else if (cause === 'relogin') mockContext.login(account, profile, 'about');
    else mockContext.requestHashNavigation('#/about');
  });
  await act(async () => old.resolve({ ok: false, status: 401, data: {} }));
  expect(screen.queryByText('Situation 7')).not.toBeInTheDocument();
  if (cause !== 'logout') expect(mockContext.user.id).toBe(91);
  expect(mockContext.pendingScenarioResume).toBe(null);
});
test('locale refresh supersedes old locale without generic duplicate GET', async () => {
  const old = deferred(); getScenarioAttempt.mockImplementation((id, { locale }) => locale === 'en' ? old.promise : Promise.resolve({ ok: true, data: payload(id) }));
  await boot(); await request(); await act(async () => i18n.changeLanguage('ms'));
  expect(await screen.findByText('Situation 7')).toBeVisible();
  await act(async () => old.resolve({ ok: false, status: 404, data: {} }));
  expect(screen.getByText('Situation 7')).toBeVisible(); expect(getScenarioAttempt).toHaveBeenCalledTimes(2); noAutomaticMutations();
});
test.each(['en', 'ms', 'zh-CN'])('recovery copy is translated in %s', async locale => {
  await boot(); await act(async () => i18n.changeLanguage(locale));
  getScenarioAttempt.mockResolvedValue({ ok: false, status: 404, data: {} }); await request();
  const text = i18n.t('scenarios.resume.unavailable'); expect(text).not.toMatch(/^scenarios\./);
  expect(await screen.findByText(text)).toBeVisible();
});
test('remount at the same hash restores ordinary Library, never exact target or Start', async () => {
  const app = await boot(); await request(); await screen.findByText('Situation 7'); app.unmount();
  getScenarioAttempt.mockClear(); render(<App />);
  await waitFor(() => expect(listScenarios).toHaveBeenCalled());
  expect(getScenarioAttempt).not.toHaveBeenCalled(); expect(startScenarioAttempt).not.toHaveBeenCalled();
});
test('all authentication clearing boundaries advance scope; profile changes do not', async () => {
  await boot();
  const revision = () => mockContext.scenarioResumeAuthority.current.authScopeRevision;
  const initial = revision(); expect(initial).toBeGreaterThan(0);
  act(() => mockContext.updateProfile(profile)); expect(revision()).toBe(initial);
  act(() => mockContext.updateAccount({ displayName: 'Updated' })); expect(revision()).toBe(initial);
  act(() => mockContext.clearAuthAfterPasswordReset()); expect(revision()).toBe(initial + 1);
  act(() => mockContext.login(account, profile, 'about')); expect(revision()).toBe(initial + 2);
  act(() => mockContext.clearLocalAuthenticatedUserState()); expect(revision()).toBe(initial + 3);
});
test('logout initiation removes the active private view before logout network settles', async () => {
  await boot(); await request(); await screen.findByText('Situation 7');
  const pending = deferred(); logout.mockReturnValue(pending.promise);
  act(() => { mockContext.logout(); });
  await waitFor(() => expect(screen.queryByText('Situation 7')).not.toBeInTheDocument());
  await act(async () => pending.resolve({ ok: true, data: {} }));
});
test('queued producer cannot publish after authentication scope changes', async () => {
  await boot(); await request(); await screen.findByText('Situation 7'); await request(target(8));
  act(() => mockContext.login(account, profile, 'about'));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.leaveScenario') }));
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1); expect(mockContext.pendingScenarioResume).toBe(null);
});
test('nested introduction navigation invalidates an in-flight exact request', async () => {
  const pending = deferred(); getScenarioAttempt.mockReturnValue(pending.promise);
  getScenarioBySlug.mockResolvedValue({ ok: false, status: 404, data: {} });
  await boot(); await request();
  act(() => mockContext.requestHashNavigation('#/scenarios/other-scenario'));
  await waitFor(() => expect(getScenarioBySlug).toHaveBeenCalledWith('other-scenario', { locale: 'en' }));
  await act(async () => pending.resolve({ ok: true, data: payload() }));
  expect(mockContext.pendingScenarioResume).toBe(null); expect(screen.queryByText('Situation 7')).not.toBeInTheDocument();
});
test('browser Back/Forward cannot replay an exact target or Start', async () => {
  const pending = deferred(); getScenarioAttempt.mockReturnValue(pending.promise);
  await boot(); await request();
  await act(async () => { window.history.back(); await new Promise(resolve => setTimeout(resolve, 30)); });
  await waitFor(() => expect(window.location.hash).toBe('#/about'));
  await act(async () => pending.resolve({ ok: true, data: payload() }));
  await act(async () => { window.history.forward(); await new Promise(resolve => setTimeout(resolve, 30)); });
  await waitFor(() => expect(listScenarios).toHaveBeenCalled());
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1); expect(startScenarioAttempt).not.toHaveBeenCalled();
  expect(mockContext.pendingScenarioResume).toBe(null);
});
test('accepted direct hashchange invalidates pending exact response', async () => {
  const pending = deferred(); getScenarioAttempt.mockReturnValue(pending.promise);
  await boot(); await request();
  await act(async () => { window.location.hash = '#/about'; await new Promise(resolve => setTimeout(resolve, 30)); });
  await act(async () => pending.resolve({ ok: true, data: payload() }));
  expect(mockContext.pendingScenarioResume).toBe(null); expect(screen.queryByText('Situation 7')).not.toBeInTheDocument();
});
test('ordinary Library resume remains unchanged', async () => {
  window.history.replaceState({}, '', '#/scenarios');
  listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [{ ...payload().scenario, summary: 'Practice safely', estimatedMinutes: 3, latestAttempt: { id: 7, status: 'in_progress' } }] } });
  await boot();
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('scenarios.card.resume') }));
  expect(await screen.findByText('Situation 7')).toBeVisible(); expect(getRecommendedScenarios).toHaveBeenCalled(); expect(startScenarioAttempt).not.toHaveBeenCalled();
});
test('ordinary generic guarded action still executes after confirmation', async () => {
  await boot(); const execute = jest.fn(); const leave = jest.fn();
  act(() => mockContext.requestGuardedAction(execute, { actionType: 'existing-action', guard: { source: 'resource-test', title: 'Leave resource?', description: 'Confirm', confirmLabel: 'Proceed', cancelLabel: 'Stay', onLeave: leave } }));
  await userEvent.click(screen.getByRole('button', { name: 'Proceed' }));
  expect(execute).toHaveBeenCalledTimes(1); expect(getScenarioAttempt).not.toHaveBeenCalled();
});
test.each([
  ['Dashboard', '#/dashboard', /A little practice\. A stronger instinct\./i],
  ['Resources', '#/resources', 'Cyber Wellness Resources'],
])('active exact Scenario preserves main-nav %s destination after Cancel then Confirm', async (destination, hash, heading) => {
  window.matchMedia.mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  await boot(); await request(); await screen.findByText('Situation 7');
  const navigate = () => userEvent.click(within(screen.getByLabelText(i18n.t('nav.primaryAriaLabel'))).getByRole('button', { name: destination }));
  await navigate();
  expect(screen.getByRole('dialog')).toBeVisible();
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.continueScenario') }));
  expect(window.location.hash).toBe('#/scenarios');
  expect(screen.getByText('Situation 7')).toBeVisible();
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  noAutomaticMutations();
  await navigate();
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.leaveScenario') }));
  expect(window.location.hash).toBe(hash);
  expect(await screen.findByRole('heading', { level: 1, name: heading })).toBeVisible();
  expect(screen.queryByText('Situation 7')).not.toBeInTheDocument();
  expect(screen.queryByRole('heading', { name: 'Scenario Library' })).not.toBeInTheDocument();
});

test.each([false, true])('I03 exact resume preserves identity in recomposed active/ready (ready=%s)', async ready => {
  const value = payload();
  if (ready) { value.currentStep = null; value.attempt.currentStepOrder = 2; value.decisions = [{ stepId: 11, stepOrder: 1, selectedOptionKey: 'A' }, { stepId: 12, stepOrder: 2, selectedOptionKey: 'A' }]; }
  getScenarioAttempt.mockResolvedValue({ ok: true, data: value });
  await boot(); await request();
  expect(await screen.findByRole('heading', { level: 1, name: 'Parcel SMS' })).toBeVisible();
  expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  expect(screen.getByRole('heading', { level: 2, name: ready ? 'Ready to complete' : 'Attempt 7' })).toBeVisible();
  expect(getScenarioAttempt).toHaveBeenCalledWith(7, { locale: 'en' });
  noAutomaticMutations();
  if (ready) {
    const completion = deferred();
    completeScenarioAttempt.mockReturnValueOnce(completion.promise);
    const button = screen.getByRole('button', { name: i18n.t('scenarios.attempt.complete') });
    button.focus();
    noAutomaticMutations();
    await userEvent.click(button);
    expect(completeScenarioAttempt).toHaveBeenCalledTimes(1);
    expect(button).toBeDisabled();
    await userEvent.click(button);
    expect(completeScenarioAttempt).toHaveBeenCalledTimes(1);
    await act(async () => completion.resolve({ ok: false, status: 503, error: 'Try again' }));
    expect(saveScenarioDecision).not.toHaveBeenCalled();
    expect(startScenarioAttempt).not.toHaveBeenCalled();
  }
});

test.each(['replacement', 'logout', 'navigation'])('I03 old pending save cannot steal focus after %s identity boundary', async cause => {
  const old = deferred(); saveScenarioDecision.mockReturnValueOnce(old.promise);
  await boot(); await request(); await screen.findByText('Situation 7');
  await userEvent.click(screen.getByRole('button', { name: /Pause and verify/ }));
  await userEvent.click(screen.getByRole('button', { name: 'Confirm choice' }));
  if (cause === 'replacement') await request(target(8));
  else await act(async () => { if (cause === 'logout') mockContext.logout(); else mockContext.requestHashNavigation('#/about'); });
  if (screen.queryByRole('dialog')) await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.leaveScenario') }));
  if (cause === 'replacement') await screen.findByText('Situation 8');
  const focus = jest.spyOn(HTMLElement.prototype, 'focus'); focus.mockClear();
  await act(async () => old.resolve({ ok: true, data: { attempt: { id: 7, status: 'in_progress' }, decision: { classification: 'safest', feedback: 'Old saved feedback', safetyExplanation: 'Old lesson' }, nextStep: null, readyToComplete: true } }));
  expect(focus.mock.instances.some(node => node.classList?.contains('scenario-feedback'))).toBe(false);
  focus.mockRestore();
  expect(saveScenarioDecision).toHaveBeenCalledTimes(1); expect(completeScenarioAttempt).not.toHaveBeenCalled();
});

test('active exact exit cancellation preserves isolation and accepted exit restores Library', async () => {
  await boot(); await request(); await screen.findByText('Situation 7');
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.attempt.exit') }));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.continueScenario') }));
  expect(screen.getByText('Situation 7')).toBeVisible(); noAutomaticMutations();
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.attempt.exit') }));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.leaveScenario') }));
  await waitFor(() => expect(getRecommendedScenarios).toHaveBeenCalledTimes(1));
  expect(window.location.hash).toBe('#/scenarios');
  expect(screen.getByRole('heading', { level: 1, name: 'Scenario Library' })).toBeVisible();
  expect(screen.queryByText('Situation 7')).not.toBeInTheDocument();
});

test('explicit Scenario exit runs its shared cleanup and action only once', async () => {
  await boot();
  const leave = jest.fn();
  act(() => mockContext.requestGuardedAction(leave, { actionType: 'scenario-exit', guard: {
    source: 'scenario', title: 'Leave scenario?', description: 'Confirm',
    confirmLabel: 'Leave', cancelLabel: 'Stay', onLeave: leave,
  } }));
  await userEvent.click(screen.getByRole('button', { name: 'Leave', exact: true }));
  expect(await screen.findByRole('heading', { level: 1, name: 'Scenario Library' })).toBeVisible();
  expect(window.location.hash).toBe('#/scenarios');
  expect(leave).toHaveBeenCalledTimes(1);
});

test.each(['hash', 'history'])('active exact Scenario confirms the original %s destination', async mode => {
  await boot(); await request(); await screen.findByText('Situation 7');
  if (mode === 'history') {
    act(() => window.history.back());
  } else {
    act(() => { window.location.hash = '#/about'; });
  }
  await screen.findByRole('dialog');
  await waitFor(() => expect(window.location.hash).toBe('#/scenarios'));
  const historyLength = window.history.length;
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.leaveScenario') }));
  await waitFor(() => expect(window.location.hash).toBe('#/about'));
  expect(screen.queryByText('Situation 7')).not.toBeInTheDocument();
  if (mode === 'history') {
    expect(window.history.length).toBe(historyLength);
    act(() => window.history.forward());
    expect(await screen.findByRole('heading', { level: 1, name: 'Scenario Library' })).toBeVisible();
    expect(window.location.hash).toBe('#/scenarios');
    expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  }
});
test('Strict Mode does not duplicate the exact request after opening', async () => {
  render(<React.StrictMode><App /></React.StrictMode>);
  await waitFor(() => expect(mockContext?.user?.id).toBe(91));
  await request(); await screen.findByText('Situation 7');
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1); noAutomaticMutations();
});
test('feedback survives locale change; exact GET is deferred until explicit continuation', async () => {
  await boot(); await request(); await screen.findByText('Situation 7');
  saveScenarioDecision.mockResolvedValue({ ok: true, data: { attempt: { currentStepOrder: 2 }, decision: { feedback: 'Saved feedback', safetyExplanation: 'Verify safely' }, nextStep: { ...payload().currentStep, id: 12, stepOrder: 2 }, readyToComplete: false } });
  await userEvent.click(screen.getByRole('button', { name: /Pause and verify/ }));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.attempt.confirmChoice') }));
  await screen.findByText('Saved feedback');
  await act(async () => i18n.changeLanguage('ms'));
  expect(screen.getByText('Saved feedback')).toBeVisible(); expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  const next = payload(); next.attempt.currentStepOrder = 2; next.currentStep = { ...next.currentStep, id: 12, stepOrder: 2 }; next.decisions = [{ stepId: 11, stepOrder: 1 }];
  getScenarioAttempt.mockResolvedValue({ ok: true, data: next });
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.next') }));
  await waitFor(() => expect(getScenarioAttempt).toHaveBeenCalledTimes(2));
  expect(getRecommendedScenarios).not.toHaveBeenCalled(); expect(startScenarioAttempt).not.toHaveBeenCalled();
});
test('exact completion refreshes Library and recommendations once, without suppressing later locale refresh', async () => {
  const value = payload(); value.scenario.totalSteps = 1;
  getScenarioAttempt.mockResolvedValue({ ok: true, data: value });
  await boot(); await request(); await screen.findByText('Situation 7');
  saveScenarioDecision.mockResolvedValue({ ok: true, data: { attempt: { currentStepOrder: 1 }, decision: { feedback: 'Final feedback', safetyExplanation: 'Verify safely' }, nextStep: null, readyToComplete: true } });
  const result = { attempt: { id: 7, status: 'completed', totalScore: 1, maximumScore: 1, percentage: 100, resultLevel: 'developing' }, scenario: value.scenario, review: [], progressImpact: {} };
  completeScenarioAttempt.mockResolvedValue({ ok: true, data: result });
  getScenarioAttemptResult.mockResolvedValue({ ok: true, data: result });
  const refresh = deferred(); listScenarios.mockReturnValue(refresh.promise);
  await userEvent.click(screen.getByRole('button', { name: /Pause and verify/ }));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.attempt.confirmChoice') }));
  await screen.findByText('Final feedback'); noAutomaticMutationsAfterSave();
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.attempt.complete') }));
  await waitFor(() => expect(completeScenarioAttempt).toHaveBeenCalledTimes(1));
  expect(listScenarios).toHaveBeenCalledTimes(1);
  expect(getRecommendedScenarios).toHaveBeenCalledTimes(1);
  await act(async () => refresh.resolve({ ok: true, data: { scenarios: [] } }));
  await screen.findByText(i18n.t('scenarios.result.completed'));
  expect(listScenarios).toHaveBeenCalledTimes(1);
  expect(getRecommendedScenarios).toHaveBeenCalledTimes(1);
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  await act(async () => i18n.changeLanguage('ms'));
  await waitFor(() => expect(getRecommendedScenarios).toHaveBeenCalledTimes(2));
  expect(listScenarios).toHaveBeenCalledTimes(2);
  await screen.findByText(i18n.t('scenarios.result.completed'));
  await userEvent.click(screen.getByRole('button', { name: i18n.t('scenarios.result.returnToLibrary') }));
  await userEvent.selectOptions(screen.getByRole('combobox', { name: i18n.t('scenarios.filters.difficulty') }), 'beginner');
  await waitFor(() => expect(getRecommendedScenarios).toHaveBeenCalledTimes(3));
  expect(listScenarios).toHaveBeenCalledTimes(3);
  expect(getScenarioAttempt).toHaveBeenCalledTimes(1);
  expect(completeScenarioAttempt).toHaveBeenCalledTimes(1);
  expect(startScenarioAttempt).not.toHaveBeenCalled();
});
function noAutomaticMutationsAfterSave() {
  expect(listScenarios).not.toHaveBeenCalled();
  expect(completeScenarioAttempt).not.toHaveBeenCalled();
  expect(startScenarioAttempt).not.toHaveBeenCalled();
  expect(getRecommendedScenarios).not.toHaveBeenCalled();
  expect(getScenarioAttemptResult).not.toHaveBeenCalled();
}
