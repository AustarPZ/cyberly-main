import { StrictMode } from "react";
import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getInitialAssessment, getInitialAssessmentStatus } from "../api/assessmentApi";
import { getRecommendedScenarios, getScenarioBySlug, listScenarios, startScenarioAttempt } from "../api/scenarioApi";
import { listChatConversations } from "../chat/chatApi";
import { acceptGuardianToken, inspectGuardianToken } from "../guardian/guardianLink.api";
import { clearGuardianBootstrapToken, hasGuardianBootstrapToken } from "../guardian/guardianLink.model";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({ register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(), requestEmailChange: jest.fn(), confirmEmailChange: jest.fn(), requestPasswordReset: jest.fn(), resetPassword: jest.fn() }));
jest.mock("../api/profileApi", () => ({ getProfile: jest.fn(), saveProfile: jest.fn() }));
jest.mock("../api/accountApi", () => ({ saveAccount: jest.fn() }));
jest.mock("../api/assessmentApi", () => ({ getInitialAssessment: jest.fn(), createInitialAssessmentAttempt: jest.fn(), getInitialAssessmentStatus: jest.fn(), saveAssessmentAnswer: jest.fn(), submitAssessmentAttempt: jest.fn() }));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn() }));
jest.mock("../api/recommendationApi", () => ({ getCurrentRecommendation: jest.fn(), markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn() }));
jest.mock("../api/scenarioApi", () => ({ listScenarios: jest.fn(), getRecommendedScenarios: jest.fn(), getScenarioDashboard: jest.fn(), getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), getScenarioAttempt: jest.fn(), saveScenarioDecision: jest.fn(), completeScenarioAttempt: jest.fn(), getScenarioAttemptResult: jest.fn() }));
jest.mock("../chat/chatApi", () => ({ listChatConversations: jest.fn() }));
jest.mock("../guardian/guardianLink.api", () => ({ getGuardianLink: jest.fn(), createGuardianInvitation: jest.fn(), resendGuardianInvitation: jest.fn(), revokeGuardianLink: jest.fn(), inspectGuardianToken: jest.fn(), acceptGuardianToken: jest.fn(), declineGuardianToken: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  clearGuardianBootstrapToken();
  window.localStorage.clear();
  window.sessionStorage.clear();
  listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
});

const learner = {
  id: 8101, email: "guardian-route@example.test", displayName: "Guarded Learner",
  role: "user", accountStatus: "active", emailVerified: true,
};
const profile = { exists: true, onboardingCompleted: true, preferredLanguage: "english" };
const assessmentQuestion = {
  id: 8201, topicLabel: "Privacy", prompt: "What is the safest next step?",
  options: [{ key: "A", text: "Check first." }, { key: "B", text: "Share immediately." }],
};
const scenario = {
  id: 8301, slug: "guardian-route-scenario", topicCode: "privacy", title: "Guardian route practice",
  summary: "Practise a safe choice.", difficulty: "beginner", estimatedMinutes: 3, totalSteps: 1,
};
const scenarioStep = {
  id: 8401, stepOrder: 1, situationText: "A message asks for personal details.",
  promptText: "What should you do?", options: [{ key: "A", text: "Verify first." }, { key: "B", text: "Reply now." }],
};

function installBrowserShims() {
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
}

function dispatchRuntimeHash(hash) {
  window.history.pushState({}, "", hash);
  act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));
}

function expectTokenExcluded(token) {
  expect(window.location.hash).not.toContain(token);
  expect(JSON.stringify(window.history.state)).not.toContain(token);
  expect(document.body).not.toHaveTextContent(token);
  expect(JSON.stringify(window.localStorage)).not.toContain(token);
  expect(JSON.stringify(window.sessionStorage)).not.toContain(token);
}

async function renderGuardedAssessment() {
  await i18n.changeLanguage("en");
  window.history.replaceState({}, "", "#/assessment");
  installBrowserShims();
  restoreSession.mockResolvedValue({ ok: true, data: { user: learner, profile } });
  getInitialAssessment.mockResolvedValue({ ok: true, data: { assessment: { id: 1, title: i18n.t("assessment.title") }, questions: [assessmentQuestion] } });
  getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "in_progress", attempt: { id: 8501, status: "in_progress", answers: [] } } });
  render(<App />);
  await screen.findByRole("heading", { level: 1, name: i18n.t("assessment.title") });
  await screen.findByText(assessmentQuestion.prompt);
}

async function renderGuardedScenario() {
  await i18n.changeLanguage("en");
  window.history.replaceState({}, "", "#/scenarios");
  installBrowserShims();
  restoreSession.mockResolvedValue({ ok: true, data: { user: learner, profile } });
  listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [scenario] } });
  getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  getScenarioBySlug.mockResolvedValue({ ok: true, data: { scenario, firstStep: scenarioStep, locale: { requestedLocale: "en", resolvedLocale: "en", fallbackUsed: false } } });
  startScenarioAttempt.mockResolvedValue({ ok: true, data: { scenario, attempt: { id: 8601, status: "in_progress" }, currentStep: scenarioStep, locale: { requestedLocale: "en", resolvedLocale: "en", fallbackUsed: false } } });
  render(<App />);
  await screen.findByRole("heading", { level: 1, name: "Scenario Library" });
  await userEvent.click(await screen.findByRole("button", { name: "Start scenario" }));
  await userEvent.click(await screen.findByRole("button", { name: "Start practice" }));
  await screen.findByText(scenarioStep.promptText);
}

test("cleans the token before public rendering and never restores a session", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({}, "", "#/guardian-link/verify?token=private-route-token");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<App />);

  expect(window.location.hash).toBe("#/guardian-link/verify");
  expect(await screen.findByRole("heading", { name: "Guardian Link invitation" })).toBeVisible();
  await waitFor(() => expect(inspectGuardianToken).toHaveBeenCalledTimes(1));
  expect(inspectGuardianToken).toHaveBeenCalledWith("private-route-token");
  expect(restoreSession).not.toHaveBeenCalled();
  expect(document.body).not.toHaveTextContent("private-route-token");
  expect(JSON.stringify(window.history.state)).not.toContain("private-route-token");
  expect(JSON.stringify(window.localStorage)).not.toContain("private-route-token");
  expect(JSON.stringify(window.sessionStorage)).not.toContain("private-route-token");
  expect(hasGuardianBootstrapToken()).toBe(false);
});

test("a clean-route reload cannot recover the historical token", async () => {
  await i18n.changeLanguage("en");
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({ route: "#/guardian-link/verify" }, "", "#/guardian-link/verify");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  render(<App />);
  expect(await screen.findByRole("alert")).toHaveTextContent("incomplete");
  expect(inspectGuardianToken).not.toHaveBeenCalled();
  expect(restoreSession).not.toHaveBeenCalled();
});

test("sanitizes and adopts a Guardian token received through runtime hashchange", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({ route: "#/home" }, "", "#/home");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  restoreSession.mockResolvedValue({ ok: false });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Runtime Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
  restoreSession.mockClear();

  window.history.pushState({}, "", "#/guardian-link/verify?token=runtime-private-token");
  act(() => window.dispatchEvent(new HashChangeEvent("hashchange")));

  expect(await screen.findByRole("heading", { name: "Guardian Link invitation" })).toBeVisible();
  expect(window.location.hash).toBe("#/guardian-link/verify");
  expect(window.history.state?.route).toBe("#/guardian-link/verify");
  expect(inspectGuardianToken).toHaveBeenCalledTimes(1);
  expect(inspectGuardianToken).toHaveBeenCalledWith("runtime-private-token");
  expect(restoreSession).not.toHaveBeenCalled();
  expect(document.body).not.toHaveTextContent("runtime-private-token");
  expect(JSON.stringify(window.history.state)).not.toContain("runtime-private-token");
  expect(JSON.stringify(window.localStorage)).not.toContain("runtime-private-token");
  expect(JSON.stringify(window.sessionStorage)).not.toContain("runtime-private-token");
  expect(hasGuardianBootstrapToken()).toBe(false);
});

test("adopts a Guardian token delivered while the clean verification route is already mounted", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({ route: "#/guardian-link/verify" }, "", "#/guardian-link/verify");
  installBrowserShims();
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Same-route Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<App />);

  expect(await screen.findByRole("alert")).toHaveTextContent("incomplete");
  expect(inspectGuardianToken).not.toHaveBeenCalled();

  dispatchRuntimeHash("#/guardian-link/verify?token=same-route-private-token");

  expect(await screen.findByText(/Same-route Learner/)).toBeVisible();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(1);
  expect(inspectGuardianToken).toHaveBeenCalledWith("same-route-private-token");
  expect(window.location.hash).toBe("#/guardian-link/verify");
  expect(window.history.state?.route).toBe("#/guardian-link/verify");
  expect(hasGuardianBootstrapToken()).toBe(false);
  expectTokenExcluded("same-route-private-token");
});

test("replaces a valid TOKEN_A lifecycle with authoritative TOKEN_B data", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({}, "", "#/guardian-link/verify?token=token-a-private");
  installBrowserShims();
  inspectGuardianToken
    .mockResolvedValueOnce({ ok: true, data: { learnerDisplayName: "Learner A", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } })
    .mockResolvedValueOnce({ ok: true, data: { learnerDisplayName: "Learner B", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<App />);

  expect(await screen.findByText(/Learner A/)).toBeVisible();
  dispatchRuntimeHash("#/guardian-link/verify?token=token-b-private");

  expect(await screen.findByText(/Learner B/)).toBeVisible();
  expect(screen.queryByText(/Learner A/)).not.toBeInTheDocument();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(2);
  expect(inspectGuardianToken).toHaveBeenNthCalledWith(1, "token-a-private");
  expect(inspectGuardianToken).toHaveBeenNthCalledWith(2, "token-b-private");
  expect(hasGuardianBootstrapToken()).toBe(false);
  expectTokenExcluded("token-b-private");
});

test("starts a fresh TOKEN_B lifecycle after TOKEN_A acceptance", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({}, "", "#/guardian-link/verify?token=accepted-token-a");
  installBrowserShims();
  inspectGuardianToken
    .mockResolvedValueOnce({ ok: true, data: { learnerDisplayName: "Accepted Learner A", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } })
    .mockResolvedValueOnce({ ok: true, data: { learnerDisplayName: "Fresh Learner B", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  acceptGuardianToken.mockResolvedValue({ ok: true });
  render(<App />);

  await userEvent.click(await screen.findByRole("button", { name: "Accept invitation" }));
  expect(await screen.findByRole("heading", { name: "Guardian Link accepted" })).toBeVisible();
  dispatchRuntimeHash("#/guardian-link/verify?token=fresh-token-b");

  expect(await screen.findByText(/Fresh Learner B/)).toBeVisible();
  expect(screen.queryByRole("heading", { name: "Guardian Link accepted" })).not.toBeInTheDocument();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(2);
  expect(inspectGuardianToken).toHaveBeenLastCalledWith("fresh-token-b");
});

test("adopts same-route TOKEN_B once under StrictMode cleanup timing", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({ route: "#/guardian-link/verify" }, "", "#/guardian-link/verify");
  installBrowserShims();
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Strict Learner B", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<StrictMode><App /></StrictMode>);

  expect(await screen.findByRole("alert")).toHaveTextContent("incomplete");
  dispatchRuntimeHash("#/guardian-link/verify?token=strict-token-b");

  expect(await screen.findByText(/Strict Learner B/)).toBeVisible();
  await waitFor(() => expect(inspectGuardianToken).toHaveBeenCalledTimes(1));
  expect(inspectGuardianToken).toHaveBeenCalledWith("strict-token-b");
  expect(hasGuardianBootstrapToken()).toBe(false);
});

test("discards TOKEN_A retry state when same-route TOKEN_B arrives", async () => {
  await i18n.changeLanguage("en");
  window.history.replaceState({}, "", "#/guardian-link/verify?token=retry-token-a");
  installBrowserShims();
  inspectGuardianToken
    .mockResolvedValueOnce({ ok: false, status: 429, data: { code: "GUARDIAN_LINK_RATE_LIMITED" } })
    .mockResolvedValueOnce({ ok: true, data: { learnerDisplayName: "Retry Replacement B", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<App />);

  expect(await screen.findByRole("button", { name: "Retry" })).toBeVisible();
  dispatchRuntimeHash("#/guardian-link/verify?token=retry-token-b");

  expect(await screen.findByText(/Retry Replacement B/)).toBeVisible();
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(2);
  expect(inspectGuardianToken).toHaveBeenLastCalledWith("retry-token-b");
});

test("an active Assessment guard cancellation clears the staged token permanently", async () => {
  const token = "guard-cancel-private-token";
  await renderGuardedAssessment();
  dispatchRuntimeHash(`#/guardian-link/verify?token=${token}`);

  const dialog = await screen.findByRole("dialog", { name: i18n.t("assessment.leaveTitle") });
  expectTokenExcluded(token);
  expect(hasGuardianBootstrapToken()).toBe(true);
  expect(inspectGuardianToken).not.toHaveBeenCalled();
  await userEvent.click(within(dialog).getByRole("button", { name: i18n.t("common.continueActivity") }));

  expect(window.location.hash).toBe("#/assessment");
  expect(screen.getByText(assessmentQuestion.prompt)).toBeVisible();
  expect(hasGuardianBootstrapToken()).toBe(false);
  expect(inspectGuardianToken).not.toHaveBeenCalled();

  dispatchRuntimeHash("#/guardian-link/verify");
  const laterDialog = await screen.findByRole("dialog", { name: i18n.t("assessment.leaveTitle") });
  await userEvent.click(within(laterDialog).getByRole("button", { name: i18n.t("common.leavePage") }));
  expect(await screen.findByRole("alert")).toHaveTextContent("incomplete");
  expect(inspectGuardianToken).not.toHaveBeenCalled();
});

test("an active Assessment guard confirmation adopts the sanitized token exactly once", async () => {
  const token = "guard-confirm-private-token";
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Guarded Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  await renderGuardedAssessment();
  dispatchRuntimeHash(`#/guardian-link/verify?token=${token}`);

  const dialog = await screen.findByRole("dialog", { name: i18n.t("assessment.leaveTitle") });
  expectTokenExcluded(token);
  expect(hasGuardianBootstrapToken()).toBe(true);
  await userEvent.click(within(dialog).getByRole("button", { name: i18n.t("common.leavePage") }));

  expect(await screen.findByRole("heading", { name: "Guardian Link invitation" })).toBeVisible();
  expect(window.location.hash).toBe("#/guardian-link/verify");
  expect(window.history.state?.route).toBe("#/guardian-link/verify");
  expect(inspectGuardianToken).toHaveBeenCalledTimes(1);
  expect(inspectGuardianToken).toHaveBeenCalledWith(token);
  expect(hasGuardianBootstrapToken()).toBe(false);
  expectTokenExcluded(token);
});

test("a Scenario guard diversion clears the sanitized token without verification", async () => {
  const token = "scenario-diversion-private-token";
  await renderGuardedScenario();
  dispatchRuntimeHash(`#/guardian-link/verify?token=${token}`);

  const dialog = await screen.findByRole("dialog", { name: i18n.t("scenarios.leaveTitle") });
  expectTokenExcluded(token);
  expect(hasGuardianBootstrapToken()).toBe(true);
  expect(inspectGuardianToken).not.toHaveBeenCalled();
  await userEvent.click(within(dialog).getByRole("button", { name: i18n.t("scenarios.leaveScenario") }));

  expect(window.location.hash).toBe("#/scenarios");
  expect(await screen.findByRole("heading", { level: 1, name: "Scenario Library" })).toBeVisible();
  expect(hasGuardianBootstrapToken()).toBe(false);
  expect(inspectGuardianToken).not.toHaveBeenCalled();

  dispatchRuntimeHash("#/guardian-link/verify");
  expect(await screen.findByRole("alert")).toHaveTextContent("incomplete");
  expect(inspectGuardianToken).not.toHaveBeenCalled();
});
