import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import {
  confirmEmailChange,
  logout,
  requestEmailChange,
  restoreSession,
} from "../api/authApi";
import { getProfile } from "../api/profileApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), logout: jest.fn(), restoreSession: jest.fn(),
  refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(),
  requestPasswordReset: jest.fn(), resetPassword: jest.fn(), requestEmailChange: jest.fn(),
  confirmEmailChange: jest.fn(),
}));
jest.mock("../api/profileApi", () => ({ getProfile: jest.fn(), saveProfile: jest.fn() }));
jest.mock("../guardian/guardianLink.api", () => ({ getGuardianLink: jest.fn().mockResolvedValue({ ok: true, data: { relationship: null } }) }));
jest.mock("../api/accountApi", () => ({ getAccount: jest.fn(), saveAccount: jest.fn() }));
jest.mock("../api/assessmentApi", () => ({
  getInitialAssessment: jest.fn(), createInitialAssessmentAttempt: jest.fn(),
  getInitialAssessmentStatus: jest.fn().mockResolvedValue({ ok: true, data: { status: "pending" } }),
  saveAssessmentAnswer: jest.fn(), submitAssessmentAttempt: jest.fn(),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn().mockResolvedValue({ ok: true, data: {} }) }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn().mockResolvedValue({ ok: true, data: { recommendation: null } }),
  markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../api/scenarioApi", () => ({
  listScenarios: jest.fn(), getRecommendedScenarios: jest.fn().mockResolvedValue({ ok: true, data: { scenarios: [] } }),
  getScenarioDashboard: jest.fn().mockResolvedValue({ ok: true, data: { completedCount: 0, inProgress: null } }),
  getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), getScenarioAttempt: jest.fn(),
  saveScenarioDecision: jest.fn(), completeScenarioAttempt: jest.fn(), getScenarioAttemptResult: jest.fn(),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn().mockResolvedValue({ ok: true, data: { conversations: [] } }),
  createChatConversation: jest.fn(), getChatConversation: jest.fn(), renameChatConversation: jest.fn(),
  deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(), generateChatAssistantReply: jest.fn(),
  createLearnerActionProposal: jest.fn(), confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

const learner = {
  id: 44,
  email: "current@example.test",
  displayName: "Aina",
  role: "user",
  accountStatus: "active",
  emailVerified: true,
  onboardingCompleted: true,
};
const unrelatedLearner = { ...learner, id: 99, email: "other@example.test", displayName: "Ravi" };
const profile = { exists: true, onboardingCompleted: true, preferredLanguage: "english", helpTopics: [] };

async function renderRoute(route, { user = learner, locale = "en", restoreResults = [] } = {}) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  window.IntersectionObserver = class { observe() {} disconnect() {} };
  await i18n.changeLanguage(locale);
  const initial = user
    ? { ok: true, data: { user, profile } }
    : { ok: false, status: 401, data: { error: { code: "AUTH_REQUIRED" } } };
  restoreSession.mockResolvedValueOnce(initial);
  restoreResults.forEach(result => restoreSession.mockResolvedValueOnce(result));
  getProfile.mockResolvedValue({ ok: true, data: { profile } });
  render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalled());
}

describe("Email Change frontend integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("keeps canonical email readonly and opens a secure request form", async () => {
    await renderRoute("#/profile");
    const email = await screen.findByDisplayValue(learner.email);
    expect(email).toHaveAttribute("readonly");
    expect(screen.queryByLabelText(i18n.t("auth.emailChange.newEmail"))).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.emailChange.changeAction") }));

    expect(screen.getByLabelText(i18n.t("auth.emailChange.newEmail"))).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(i18n.t("auth.emailChange.currentPassword"))).toHaveAttribute("type", "password");
    expect(screen.getByLabelText(i18n.t("auth.emailChange.currentPassword"))).toHaveAttribute("autocomplete", "current-password");
    expect(document.activeElement).toBe(screen.getByLabelText(i18n.t("auth.emailChange.newEmail")));
  });

  test.each([
    ["an Admin", { ...learner, role: "admin" }],
    ["an unverified learner", { ...learner, emailVerified: false }],
    ["an inactive learner", { ...learner, accountStatus: "disabled" }],
    ["an account with unknown eligibility", { ...learner, role: undefined, accountStatus: undefined }],
  ])("does not expose Email Change to %s", async (_label, user) => {
    await renderRoute("#/profile", { user });

    expect(await screen.findByDisplayValue(user.email)).toHaveAttribute("readonly");
    expect(screen.queryByRole("button", { name: i18n.t("auth.emailChange.changeAction") })).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t("auth.emailChange.newEmail"))).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t("auth.emailChange.currentPassword"))).not.toBeInTheDocument();
    expect(requestEmailChange).not.toHaveBeenCalled();
  });

  test("validates required request fields and shows accepted state without changing canonical email", async () => {
    requestEmailChange.mockResolvedValue({ ok: true, status: 202, data: { status: "accepted", expiresInSeconds: 3600 } });
    await renderRoute("#/profile");
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("auth.emailChange.changeAction") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.emailChange.submit") }));
    expect(requestEmailChange).not.toHaveBeenCalled();
    expect(screen.getAllByRole("alert")).toHaveLength(2);

    const newEmail = screen.getByLabelText(i18n.t("auth.emailChange.newEmail"));
    const password = screen.getByLabelText(i18n.t("auth.emailChange.currentPassword"));
    await userEvent.type(newEmail, "new@example.test");
    await userEvent.type(password, "Current123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.emailChange.submit") }));

    expect(requestEmailChange).toHaveBeenCalledWith("new@example.test", "Current123", "en");
    expect(await screen.findByRole("heading", { name: i18n.t("auth.emailChange.acceptedTitle") })).toBeVisible();
    expect(screen.getByDisplayValue(learner.email)).toHaveAttribute("readonly");
    expect(screen.queryByDisplayValue("new@example.test")).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue("Current123")).not.toBeInTheDocument();
  });

  test("prevents duplicate request submission while the first request is pending", async () => {
    let resolveRequest;
    requestEmailChange.mockReturnValue(new Promise(resolve => { resolveRequest = resolve; }));
    await renderRoute("#/profile");
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("auth.emailChange.changeAction") }));
    await userEvent.type(screen.getByLabelText(i18n.t("auth.emailChange.newEmail")), "new@example.test");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.emailChange.currentPassword")), "Current123");
    const submit = screen.getByRole("button", { name: i18n.t("auth.emailChange.submit") });
    await userEvent.click(submit);
    expect(requestEmailChange).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: i18n.t("auth.emailChange.submitting") })).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.emailChange.submitting") }));
    expect(requestEmailChange).toHaveBeenCalledTimes(1);
    resolveRequest({ ok: true, status: 202, data: { status: "accepted", expiresInSeconds: 3600 } });
    expect(await screen.findByRole("heading", { name: i18n.t("auth.emailChange.acceptedTitle") })).toBeVisible();
  });

  test.each([
    ["EMAIL_CHANGE_EMAIL_INVALID", "newEmail", "invalidEmail"],
    ["EMAIL_CHANGE_EMAIL_UNAVAILABLE", "newEmail", "emailUnavailable"],
    ["EMAIL_CHANGE_PASSWORD_REQUIRED", "currentPassword", "passwordRequired"],
    ["EMAIL_CHANGE_PASSWORD_INVALID", "currentPassword", "passwordInvalid"],
    ["EMAIL_VERIFICATION_REQUIRED", "form", "verificationRequired"],
    ["AUTH_REQUIRED", "form", "sessionExpired"],
    ["AUTH_FORBIDDEN", "form", "accountUnavailable"],
    ["AUTH_ACCOUNT_DISABLED", "form", "accountUnavailable"],
    ["AUTH_RATE_LIMITED", "form", "rateLimited"],
    ["EMAIL_SEND_FAILED", "form", "deliveryFailed"],
  ])("maps request error %s safely", async (code, target, messageKey) => {
    requestEmailChange.mockResolvedValue({ ok: false, status: 400, data: { error: { code } } });
    await renderRoute("#/profile");
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("auth.emailChange.changeAction") }));
    await userEvent.type(screen.getByLabelText(i18n.t("auth.emailChange.newEmail")), "new@example.test");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.emailChange.currentPassword")), "Current123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.emailChange.submit") }));
    const alert = await screen.findByText(i18n.t(`auth.emailChange.${messageKey}`));
    expect(alert).toHaveAttribute("role", "alert");
    if (target !== "form") {
      expect(screen.getByLabelText(i18n.t(`auth.emailChange.${target}`))).toHaveAttribute("aria-invalid", "true");
    }
  });

  test("captures and cleans a public confirmation token and confirms only once", async () => {
    confirmEmailChange.mockResolvedValue({ ok: true, data: { status: "confirmed", sessionStatus: "signed_out" } });
    await renderRoute("#/verify-email-change?token=private-token", { user: null });
    expect(await screen.findByRole("heading", { name: i18n.t("auth.emailChange.confirmedTitle") })).toBeVisible();
    expect(confirmEmailChange).toHaveBeenCalledTimes(1);
    expect(confirmEmailChange).toHaveBeenCalledWith("private-token");
    expect(window.location.hash).toBe("#/verify-email-change");
    expect(document.body).not.toHaveTextContent("private-token");
    expect(window.localStorage.getItem("private-token")).toBeNull();
    expect(window.sessionStorage.getItem("private-token")).toBeNull();
  });

  test("does not confirm a missing token", async () => {
    await renderRoute("#/verify-email-change", { user: null });
    expect(await screen.findByRole("heading", { name: i18n.t("auth.emailChange.unavailableTitle") })).toBeVisible();
    expect(confirmEmailChange).not.toHaveBeenCalled();
  });

  test("continued confirmation refreshes canonical auth state", async () => {
    confirmEmailChange.mockResolvedValue({ ok: true, data: { status: "confirmed", sessionStatus: "continued" } });
    const refreshed = { ...learner, email: "new@example.test" };
    await renderRoute("#/verify-email-change?token=continued-token", {
      restoreResults: [{ ok: true, data: { user: refreshed, profile } }],
    });
    expect(await screen.findByText(i18n.t("auth.emailChange.continuedDescription"))).toBeVisible();
    expect(restoreSession).toHaveBeenCalledTimes(2);
    await userEvent.click(screen.getByRole("button", { name: /Aina/i }));
    expect(within(screen.getByRole("menu")).getByText("new@example.test")).toBeVisible();
    expect(logout).not.toHaveBeenCalled();
  });

  test("continued confirmation fails closed locally when canonical auth refresh fails", async () => {
    confirmEmailChange.mockResolvedValue({ ok: true, data: { status: "confirmed", sessionStatus: "continued" } });
    await renderRoute("#/verify-email-change?token=refresh-failure-token", {
      restoreResults: [{ ok: false, status: 401, data: { error: { code: "AUTH_REQUIRED" } } }],
    });
    expect(await screen.findByText(i18n.t("auth.emailChange.signedOutDescription"))).toBeVisible();
    expect(screen.queryByRole("button", { name: /Aina/i })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: i18n.t("auth.emailChange.confirmedTitle") })).toBeVisible();
    expect(logout).not.toHaveBeenCalled();
  });

  test("signed_out confirmation clears local auth without backend logout", async () => {
    confirmEmailChange.mockResolvedValue({ ok: true, data: { status: "confirmed", sessionStatus: "signed_out" } });
    await renderRoute("#/verify-email-change?token=signed-out-token");
    expect(await screen.findByText(i18n.t("auth.emailChange.signedOutDescription"))).toBeVisible();
    expect(screen.queryByRole("button", { name: /Aina/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: i18n.t("auth.emailChange.signIn") })).toHaveAttribute("href", "#/login");
    expect(logout).not.toHaveBeenCalled();
  });

  test("unrelated confirmation preserves the unrelated learner without refresh or rebind", async () => {
    confirmEmailChange.mockResolvedValue({ ok: true, data: { status: "confirmed", sessionStatus: "unrelated" } });
    await renderRoute("#/verify-email-change?token=unrelated-token", { user: unrelatedLearner });
    expect(await screen.findByText(i18n.t("auth.emailChange.unrelatedDescription"))).toBeVisible();
    expect(restoreSession).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Ravi/i })).toBeVisible();
    expect(document.body).not.toHaveTextContent(learner.email);
  });

  test.each([
    ["EMAIL_CHANGE_TOKEN_INVALID_OR_UNAVAILABLE", "unavailableTitle", false],
    ["EMAIL_CHANGE_EMAIL_UNAVAILABLE", "conflictTitle", false],
    ["AUTH_RATE_LIMITED", "rateLimitedTitle", false],
    ["INTERNAL_SERVER_ERROR", "genericErrorTitle", true],
  ])("maps confirmation error %s and bounds retry", async (code, titleKey, retryable) => {
    confirmEmailChange.mockResolvedValue({ ok: false, status: 400, data: { error: { code } } });
    await renderRoute(`#/verify-email-change?token=${code}`, { user: null });
    expect(await screen.findByRole("heading", { name: i18n.t(`auth.emailChange.${titleKey}`) })).toBeVisible();
    expect(confirmEmailChange).toHaveBeenCalledTimes(1);
    const retry = screen.queryByRole("button", { name: i18n.t("auth.emailChange.retry") });
    expect(Boolean(retry)).toBe(retryable);
    if (retry) {
      confirmEmailChange.mockResolvedValueOnce({ ok: true, data: { status: "confirmed", sessionStatus: "signed_out" } });
      await act(async () => {
        await userEvent.click(retry);
      });
      expect(confirmEmailChange).toHaveBeenCalledTimes(2);
      expect(await screen.findByRole("heading", { name: i18n.t("auth.emailChange.confirmedTitle") })).toBeVisible();
    }
  });
});
