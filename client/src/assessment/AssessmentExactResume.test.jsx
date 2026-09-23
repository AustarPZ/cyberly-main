import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';
import i18n from '../i18n';
import { restoreSession, logout } from '../api/authApi';
import * as api from '../api/assessmentApi';

let mockContext;
jest.mock('../design-system/layout/AppShell', () => {
  const Actual = jest.requireActual('../design-system/layout/AppShell').default;
  function Probe() { mockContext = require('react').useContext(require('../App').AppCtx); return null; }
  return { __esModule: true, default: props => <Actual {...props}><Probe />{props.children}</Actual> };
});
jest.mock('react-markdown', () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock('remark-gfm', () => ({ __esModule: true, default: () => null }));
jest.mock('../api/authApi', () => ({ register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn() }));
jest.mock('../api/assessmentApi', () => ({ getInitialAssessment: jest.fn(), getInitialAssessmentStatus: jest.fn(), getInitialAssessmentResult: jest.fn(), createInitialAssessmentAttempt: jest.fn(), getAssessmentAttempt: jest.fn(), saveAssessmentAnswer: jest.fn(), submitAssessmentAttempt: jest.fn() }));
jest.mock('../chat/chatApi', () => ({ listChatConversations: jest.fn().mockResolvedValue({ ok: true, data: { conversations: [] } }), createChatConversation: jest.fn(), getChatConversation: jest.fn(), renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(), generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(), confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn() }));

const account = { id: 91, displayName: 'Learner', age: 15, role: 'user', emailVerified: true };
const profile = { exists: true, onboardingCompleted: true, preferredLanguage: 'english', familiarityLevel: 'beginner', learningStyle: 'step_by_step', helpTopics: ['phishing'] };
const target = (attemptId = 7) => ({ type: 'resume_assessment', attemptId });
const attempt = (id = 7) => ({ id, assessmentId: 1, status: 'in_progress', answers: [{ questionId: 101, selectedOptionKey: id === 7 ? 'A' : 'B' }] });
const content = () => ({ assessment: { id: 1, title: 'Assessment content', questionCount: 2 }, questions: [
  { id: 101, prompt: 'Which action is safe?', options: [{ key: 'A', text: 'Pause and verify' }, { key: 'B', text: 'Ask for help' }] },
  { id: 102, prompt: 'What comes next?', options: [{ key: 'A', text: 'Check the source' }, { key: 'B', text: 'Share immediately' }] },
] });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
async function boot() { const app = render(<App />); await waitFor(() => expect(mockContext?.user?.id).toBe(91)); return app; }
async function request(value = target()) { await act(async () => { mockContext.requestAssessmentExactResume(value); }); }
const selected = text => screen.getByRole('button', { name: new RegExp(text) });
async function player(choice = 'Pause and verify') {
  expect(await screen.findByText('Which action is safe?')).toBeVisible();
  await waitFor(() => expect(selected(choice)).toHaveAttribute('aria-pressed', 'true'));
}
function isolated() {
  for (const fn of [api.getInitialAssessmentStatus, api.getInitialAssessmentResult, api.createInitialAssessmentAttempt, api.saveAssessmentAnswer, api.submitAssessmentAttempt]) expect(fn).not.toHaveBeenCalled();
}
beforeEach(async () => {
  jest.resetAllMocks(); mockContext = null;
  window.history.replaceState({}, '', '#/about');
  window.scrollTo = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.IntersectionObserver = class { observe() {} disconnect() {} };
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  await i18n.changeLanguage('en');
  restoreSession.mockResolvedValue({ ok: true, data: { user: account, profile } });
  logout.mockResolvedValue({ ok: true, data: {} });
  require('../chat/chatApi').listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  api.getInitialAssessment.mockResolvedValue({ ok: true, data: content() });
  api.getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: 'pending' } });
  api.getAssessmentAttempt.mockImplementation(async id => ({ ok: true, data: { attempt: attempt(id) } }));
});

test('exact authority opens the existing player with saved answers and focus, without ordinary authority or mutation', async () => {
  await boot();
  const local = jest.spyOn(Storage.prototype, 'setItem'); local.mockClear();
  await request(); await player();
  expect(api.getAssessmentAttempt.mock.calls).toEqual([[7, { locale: 'en' }]]);
  expect(api.getInitialAssessment.mock.calls).toEqual([[{ locale: 'en' }]]);
  expect(mockContext.pendingAssessmentResume).toBe(null);
  expect(window.location.hash).toBe('#/assessment');
  expect(window.location.search).toBe('');
  expect(local).not.toHaveBeenCalled(); local.mockRestore();
  expect(document.activeElement).toContainElement(screen.getByText('Which action is safe?'));
  expect(screen.getAllByRole('main')).toHaveLength(1); isolated();
});

test.each([null, { type: 'resume_assessment', attemptId: '7' }, { ...target(), extra: true }])('invalid producer input %j never publishes or navigates', async value => {
  await boot(); let response;
  act(() => { response = mockContext.requestAssessmentExactResume(value); });
  expect(response).toEqual({ ok: false, reason: 'INVALID_TARGET' });
  expect(window.location.hash).toBe('#/about');
  expect(mockContext.pendingAssessmentResume).toBe(null);
  expect(api.getAssessmentAttempt).not.toHaveBeenCalled();
});

test.each([
  ['identityMismatch', value => { value.id = 8; }],
  ['identityMismatch', value => { value.id = '7'; }],
  ['notInProgress', value => { value.status = 'completed'; }],
  ['notInProgress', value => { value.status = 'abandoned'; }],
  ['inconsistent', value => { value.assessmentId = 2; }],
  ['inconsistent', value => { value.answers[0].questionId = 999; }],
  ['inconsistent', value => { value.answers[0].selectedOptionKey = 'Z'; }],
])('%s enters focused terminal recovery %#', async (key, change) => {
  const value = attempt(); change(value);
  api.getAssessmentAttempt.mockResolvedValue({ ok: true, data: { attempt: value } });
  await boot(); await request();
  expect(await screen.findByText(i18n.t(`assessment.exactResume.${key}`))).toBeVisible();
  expect(document.activeElement).toHaveAttribute('role', 'alert');
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: i18n.t('assessment.exactResume.retry') })).not.toBeInTheDocument();
  expect(mockContext.pendingAssessmentResume).toBe(null); isolated();
});

test.each([[404, 'unavailable'], [403, 'requestRejected'], [400, 'requestRejected']])('HTTP %s has bounded recovery', async (status, key) => {
  api.getAssessmentAttempt.mockResolvedValue({ ok: false, status }); await boot(); await request();
  expect(await screen.findByText(i18n.t(`assessment.exactResume.${key}`))).toBeVisible(); isolated();
});

test('current 401 clears authentication and consumes target', async () => {
  api.getAssessmentAttempt.mockResolvedValue({ ok: false, status: 401 }); await boot(); await request();
  await waitFor(() => expect(mockContext.user).toBe(null));
  expect(mockContext.pendingAssessmentResume).toBe(null); isolated();
});

test('keyboard retry repeats only the same exact GET, with independently cached content', async () => {
  api.getAssessmentAttempt.mockRejectedValueOnce(new Error('offline'));
  await boot(); await request();
  const retry = await screen.findByRole('button', { name: i18n.t('assessment.exactResume.retry') });
  isolated(); expect(api.getInitialAssessment).toHaveBeenCalledTimes(1);
  retry.focus(); await userEvent.keyboard('{Enter}'); await player();
  expect(api.getAssessmentAttempt.mock.calls).toEqual([[7, { locale: 'en' }], [7, { locale: 'en' }]]);
  expect(api.getInitialAssessment).toHaveBeenCalledTimes(1); isolated();
});

test('content failure cannot expose a retry that refetches content or substitutes latest state', async () => {
  api.getInitialAssessment.mockRejectedValue(new Error('offline'));
  await boot(); await request();
  expect(await screen.findByText(i18n.t('assessment.exactResume.networkError'))).toBeVisible();
  expect(screen.queryByRole('button', { name: i18n.t('assessment.exactResume.retry') })).not.toBeInTheDocument();
  isolated();
});

test('supporting-content 404 after successful exact authority means inconsistent content, never a missing or foreign attempt', async () => {
  const pending = deferred(); api.getInitialAssessment.mockReturnValue(pending.promise);
  await boot(); await request();
  expect(api.getAssessmentAttempt).toHaveBeenCalledWith(7, { locale: 'en' });
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
  await act(async () => pending.resolve({ ok: false, status: 404 }));
  expect(await screen.findByText(i18n.t('assessment.exactResume.inconsistent'))).toBeVisible();
  expect(screen.queryByText(i18n.t('assessment.exactResume.unavailable'))).not.toBeInTheDocument();
  expect(document.activeElement).toHaveAttribute('role', 'alert');
  expect(screen.queryByRole('button', { name: i18n.t('assessment.exactResume.retry') })).not.toBeInTheDocument();
  expect(mockContext.pendingAssessmentResume).toBe(null);
  expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1);
  expect(api.getInitialAssessment).toHaveBeenCalledTimes(1);
  isolated();
});

test.each([[403, 'requestRejected'], [500, 'networkError'], [503, 'networkError']])('supporting-content HTTP %s preserves its failure reason without an authority Retry', async (status, key) => {
  api.getInitialAssessment.mockResolvedValue({ ok: false, status });
  await boot(); await request();
  expect(await screen.findByText(i18n.t(`assessment.exactResume.${key}`))).toBeVisible();
  expect(screen.queryByRole('button', { name: i18n.t('assessment.exactResume.retry') })).not.toBeInTheDocument();
  isolated();
});

test('supporting-content 401 after exact authority succeeds still clears authentication', async () => {
  api.getInitialAssessment.mockResolvedValue({ ok: false, status: 401 });
  await boot(); await request();
  await waitFor(() => expect(mockContext.user).toBe(null));
  expect(mockContext.pendingAssessmentResume).toBe(null); isolated();
});

test('replacement during loading wins when old successful response arrives last', async () => {
  const old = deferred(); api.getAssessmentAttempt.mockImplementation(id => id === 7 ? old.promise : Promise.resolve({ ok: true, data: { attempt: attempt(id) } }));
  await boot(); await request(); await request(target(8)); await player('Ask for help');
  await act(async () => old.resolve({ ok: true, data: { attempt: attempt() } }));
  await player('Ask for help'); expect(api.getInitialAssessment).toHaveBeenCalledTimes(1); isolated();
});

test('guard cancel preserves activity; confirm runs prior leave before executing queued exact target', async () => {
  await boot(); await request(); await player();
  const leave = jest.fn(() => expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1));
  act(() => mockContext.registerActivityGuard({ source: 'scenario', key: 'prior', title: 'Leave prior activity?', description: 'Confirm', confirmLabel: 'Leave prior', cancelLabel: 'Stay here', onLeave: leave }));
  await request(target(8));
  await userEvent.click(screen.getByRole('button', { name: 'Stay here' }));
  await player(); expect(leave).not.toHaveBeenCalled();
  expect(mockContext.pendingAssessmentResume).toBe(null); expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1);
  await request(target(8)); await act(async () => userEvent.click(screen.getByRole('button', { name: 'Leave prior' })));
  await player('Ask for help'); expect(leave).toHaveBeenCalledTimes(1); isolated();
});

test.each(['logout', 'relogin', 'navigation', 'directHash'])('stale authority 401 cannot publish after %s', async cause => {
  const old = deferred(); api.getAssessmentAttempt.mockReturnValue(old.promise);
  await boot(); await request();
  await act(async () => {
    if (cause === 'logout') await mockContext.logout();
    else if (cause === 'relogin') mockContext.login(account, profile, 'about');
    else if (cause === 'navigation') mockContext.requestHashNavigation('#/about');
    else { window.location.hash = '#/about'; await new Promise(resolve => setTimeout(resolve, 30)); }
  });
  await act(async () => old.resolve({ ok: false, status: 401 }));
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
  if (cause !== 'logout') expect(mockContext.user.id).toBe(91);
  expect(mockContext.pendingAssessmentResume).toBe(null);
});

test('stale supporting content cannot publish or clear authentication after replacement', async () => {
  const old = deferred(); api.getInitialAssessment.mockReturnValueOnce(old.promise);
  await boot(); await request();
  act(() => mockContext.login(account, profile, 'about'));
  api.getInitialAssessment.mockResolvedValue({ ok: true, data: content() });
  await request(target(8)); await player('Ask for help');
  await act(async () => old.resolve({ ok: false, status: 401 }));
  await player('Ask for help'); expect(mockContext.user.id).toBe(91); isolated();
});

test('locale supersession ignores stale authority and reloads content independently', async () => {
  const old = deferred(); api.getAssessmentAttempt.mockImplementation((id, { locale }) => locale === 'en' ? old.promise : Promise.resolve({ ok: true, data: { attempt: attempt(id) } }));
  await boot(); await request(); await act(async () => i18n.changeLanguage('ms')); await player();
  await act(async () => old.resolve({ ok: false, status: 401 }));
  expect(mockContext.user.id).toBe(91); await player();
  expect(api.getAssessmentAttempt.mock.calls).toEqual([[7, { locale: 'en' }], [7, { locale: 'ms' }]]);
  expect(api.getInitialAssessment.mock.calls).toEqual([[{ locale: 'en' }], [{ locale: 'ms' }]]); isolated();
});

test('ordinary in-flight status cannot override an exact handoff', async () => {
  window.history.replaceState({}, '', '#/assessment');
  const old = deferred(); api.getInitialAssessmentStatus.mockReturnValue(old.promise);
  await boot(); await waitFor(() => expect(api.getInitialAssessmentStatus).toHaveBeenCalledTimes(1));
  await request(); await player();
  await act(async () => old.resolve({ ok: true, data: { status: 'completed', result: { attempt: { id: 999, status: 'completed' } } } }));
  await player(); expect(api.getInitialAssessmentStatus).toHaveBeenCalledTimes(1);
});

test('recovery exit explicitly restores ordinary Assessment loading', async () => {
  api.getAssessmentAttempt.mockResolvedValue({ ok: false, status: 404 });
  await boot(); await request(); isolated();
  await userEvent.click(await screen.findByRole('button', { name: i18n.t('assessment.exactResume.backToAssessment') }));
  await waitFor(() => expect(api.getInitialAssessmentStatus).toHaveBeenCalledTimes(1));
  expect(await screen.findByRole('button', { name: i18n.t('assessment.start') })).toBeVisible();
  expect(api.createInitialAssessmentAttempt).not.toHaveBeenCalled();
});

test('remount at the same hash has no exact target restoration', async () => {
  const app = await boot(); await request(); await player(); app.unmount();
  api.getAssessmentAttempt.mockClear(); render(<App />);
  await waitFor(() => expect(api.getInitialAssessmentStatus).toHaveBeenCalledTimes(1));
  expect(api.getAssessmentAttempt).not.toHaveBeenCalled(); expect(api.createInitialAssessmentAttempt).not.toHaveBeenCalled();
});

test('browser Back/Forward does not replay exact target or start', async () => {
  const pending = deferred(); api.getAssessmentAttempt.mockReturnValue(pending.promise);
  await boot(); await request();
  await act(async () => { window.history.back(); await new Promise(resolve => setTimeout(resolve, 30)); });
  await waitFor(() => expect(window.location.hash).toBe('#/about'));
  await act(async () => pending.resolve({ ok: true, data: { attempt: attempt() } }));
  await act(async () => { window.history.forward(); await new Promise(resolve => setTimeout(resolve, 30)); });
  await waitFor(() => expect(api.getInitialAssessmentStatus).toHaveBeenCalledTimes(1));
  expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1); expect(api.createInitialAssessmentAttempt).not.toHaveBeenCalled();
});

test('Strict Mode does not duplicate either request', async () => {
  render(<React.StrictMode><App /></React.StrictMode>); await waitFor(() => expect(mockContext?.user?.id).toBe(91));
  await request(); await player();
  expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1); expect(api.getInitialAssessment).toHaveBeenCalledTimes(1); isolated();
});

test('a locale change during authority recovery prepares content separately from Retry', async () => {
  api.getAssessmentAttempt.mockRejectedValueOnce(new Error('offline'));
  await boot(); await request(); await screen.findByRole('button', { name: i18n.t('assessment.exactResume.retry') });
  await act(async () => i18n.changeLanguage('ms'));
  expect(api.getInitialAssessment.mock.calls).toEqual([[{ locale: 'en' }], [{ locale: 'ms' }]]);
  expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1);
  await act(async () => userEvent.click(screen.getByRole('button', { name: i18n.t('assessment.exactResume.retry') })));
  await player(); expect(api.getInitialAssessment).toHaveBeenCalledTimes(2);
  expect(api.getAssessmentAttempt).toHaveBeenLastCalledWith(7, { locale: 'ms' }); isolated();
});

test('logout initiation hides active private content before logout settles', async () => {
  await boot(); await request(); await player(); const pending = deferred(); logout.mockReturnValue(pending.promise);
  act(() => { mockContext.logout(); });
  expect(await screen.findByText(i18n.t('assessment.exactResume.authLost'))).toBeVisible();
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
  expect(document.activeElement).toHaveAttribute('role', 'alert');
  await act(async () => pending.resolve({ ok: true, data: {} }));
});

test('same-account relogin at Assessment invalidates an in-flight exact target', async () => {
  const old = deferred(); api.getAssessmentAttempt.mockReturnValue(old.promise);
  await boot(); await request(); act(() => mockContext.login(account, profile, 'assessment'));
  await act(async () => old.resolve({ ok: true, data: { attempt: attempt() } }));
  expect(await screen.findByText(i18n.t('assessment.exactResume.authLost'))).toBeVisible();
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument(); isolated();
});

test('all auth clearing boundaries advance scope, but profile/account updates do not', async () => {
  await boot(); const revision = () => mockContext.assessmentResumeAuthority.current.authScopeRevision;
  const initial = revision(); expect(initial).toBeGreaterThan(0);
  act(() => mockContext.updateProfile(profile)); act(() => mockContext.updateAccount({ displayName: 'Updated' }));
  expect(revision()).toBe(initial);
  act(() => mockContext.clearAuthAfterPasswordReset()); expect(revision()).toBe(initial + 1);
  act(() => mockContext.login(account, profile, 'about')); expect(revision()).toBe(initial + 2);
  act(() => mockContext.clearLocalAuthenticatedUserState()); expect(revision()).toBe(initial + 3);
});

test('an exact queued target cannot execute after same-account relogin', async () => {
  await boot(); await request(); await player(); await request(target(8));
  act(() => mockContext.login(account, profile, 'about'));
  await act(async () => userEvent.click(screen.getByRole('button', { name: i18n.t('common.leavePage') })));
  expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1); expect(mockContext.pendingAssessmentResume).toBe(null);
});

test('completed response reaches recovery without waiting for content or fetching a result', async () => {
  const pending = deferred(); api.getInitialAssessment.mockReturnValue(pending.promise);
  api.getAssessmentAttempt.mockResolvedValue({ ok: true, data: { attempt: { ...attempt(), status: 'completed' }, review: [] } });
  await boot(); await request();
  expect(await screen.findByText(i18n.t('assessment.exactResume.notInProgress'))).toBeVisible(); isolated();
  await act(async () => pending.resolve({ ok: true, data: content() }));
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
});

test('active ordinary Assessment guard cancellation preserves it and confirmation opens exact ID', async () => {
  window.history.replaceState({}, '', '#/assessment');
  api.getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: 'in_progress', attempt: attempt(8) } });
  await boot(); await player('Ask for help'); await request();
  await userEvent.click(screen.getByRole('button', { name: i18n.t('common.continueActivity') }));
  await player('Ask for help'); expect(api.getAssessmentAttempt).not.toHaveBeenCalled();
  await request(); await act(async () => userEvent.click(screen.getByRole('button', { name: i18n.t('common.leavePage') })));
  await player(); expect(api.getAssessmentAttempt).toHaveBeenCalledWith(7, { locale: 'en' });
  expect(api.getInitialAssessmentStatus).toHaveBeenCalledTimes(1);
});

test('explicit answer saving and confirmed submission still use the exact attempt', async () => {
  await boot(); await request(); await player(); isolated();
  api.saveAssessmentAnswer.mockResolvedValue({ ok: true, data: { attempt: { ...attempt(), answers: [...attempt().answers, { questionId: 102, selectedOptionKey: 'A' }] } } });
  await userEvent.click(screen.getByRole('button', { name: i18n.t('assessment.next') }));
  await act(async () => userEvent.click(selected('Check the source')));
  expect(api.saveAssessmentAnswer).toHaveBeenCalledWith(7, { questionId: 102, selectedOptionKey: 'A' });
  await userEvent.click(screen.getByRole('button', { name: i18n.t('assessment.submit') }));
  expect(api.submitAssessmentAttempt).not.toHaveBeenCalled();
  api.submitAssessmentAttempt.mockResolvedValue({ ok: true, data: { attempt: { ...attempt(), status: 'completed', totalScore: 2, maximumScore: 2, percentage: 100 }, topicScores: [], review: [] } });
  await act(async () => userEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: i18n.t('assessment.submit') })));
  expect(api.submitAssessmentAttempt).toHaveBeenCalledWith(7, { locale: 'en' });
  expect(await screen.findByText(i18n.t('assessment.completed'))).toBeVisible();
  await act(async () => i18n.changeLanguage('ms'));
  expect(api.getAssessmentAttempt).toHaveBeenCalledTimes(1);
  expect(api.getInitialAssessmentStatus).not.toHaveBeenCalled(); expect(api.getInitialAssessmentResult).not.toHaveBeenCalled();
});

test.each(['navigation', 'locale'])('late content cannot overwrite or clear auth after %s', async cause => {
  const pending = deferred(); api.getInitialAssessment.mockReturnValueOnce(pending.promise);
  await boot(); await request();
  expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
  if (cause === 'navigation') act(() => mockContext.requestHashNavigation('#/about'));
  else { await act(async () => i18n.changeLanguage('ms')); await player(); }
  await act(async () => pending.resolve({ ok: false, status: 401 }));
  expect(mockContext.user.id).toBe(91);
  if (cause === 'navigation') expect(screen.queryByText('Which action is safe?')).not.toBeInTheDocument();
  else await player();
  isolated();
});

test('replacing an active exact attempt ignores its late save response', async () => {
  await boot(); await request(); await player();
  const old = deferred(); api.saveAssessmentAnswer.mockReturnValue(old.promise);
  await userEvent.click(selected('Ask for help'));
  await request(target(8));
  await act(async () => userEvent.click(screen.getByRole('button', { name: i18n.t('common.leavePage') })));
  await player('Ask for help');
  await act(async () => old.resolve({ ok: true, data: { attempt: attempt() } }));
  api.saveAssessmentAnswer.mockResolvedValue({ ok: true, data: { attempt: attempt(8) } });
  await act(async () => userEvent.click(selected('Pause and verify')));
  expect(api.saveAssessmentAnswer).toHaveBeenLastCalledWith(8, { questionId: 101, selectedOptionKey: 'A' });
});

test('ordinary save completion still settles its saving indicator across a locale refresh', async () => {
  window.history.replaceState({}, '', '#/assessment');
  api.getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: 'in_progress', attempt: attempt() } });
  await boot(); await player();
  const pending = deferred(); api.saveAssessmentAnswer.mockReturnValue(pending.promise);
  await userEvent.click(selected('Ask for help'));
  await act(async () => i18n.changeLanguage('ms'));
  await act(async () => pending.resolve({ ok: true, data: { attempt: attempt() } }));
  expect(screen.queryByText(new RegExp(i18n.t('common.saving')))).not.toBeInTheDocument();
  expect(api.getAssessmentAttempt).not.toHaveBeenCalled();
});

test('guest producer returns AUTH_LOST without request or navigation', async () => {
  await boot(); act(() => mockContext.clearLocalAuthenticatedUserState());
  let response; act(() => { response = mockContext.requestAssessmentExactResume(target()); });
  expect(response).toEqual({ ok: false, reason: 'AUTH_LOST' });
  expect(api.getAssessmentAttempt).not.toHaveBeenCalled(); expect(window.location.hash).toBe('#/about');
});

test.each(['en', 'ms', 'zh-CN'])('all recovery reasons have translated copy and focused alert in %s', async locale => {
  await boot(); await act(async () => i18n.changeLanguage(locale));
  for (const key of ['invalidTarget', 'authLost', 'unavailable', 'identityMismatch', 'notInProgress', 'inconsistent', 'networkError', 'requestRejected', 'retry', 'backToAssessment', 'loading']) {
    expect(i18n.getResource(locale, 'translation', `assessment.exactResume.${key}`)).toEqual(expect.any(String));
  }
  api.getAssessmentAttempt.mockResolvedValue({ ok: false, status: 404 }); await request();
  expect(await screen.findByText(i18n.t('assessment.exactResume.unavailable'))).toBeVisible();
  expect(document.activeElement).toHaveAttribute('role', 'alert'); isolated();
});
