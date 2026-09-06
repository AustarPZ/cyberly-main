import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { login, logout, requestPasswordReset, resetPassword, restoreSession } from "../api/authApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), logout: jest.fn(), restoreSession: jest.fn(),
  refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(),
  requestPasswordReset: jest.fn(), resetPassword: jest.fn(),
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

const learner = { id: 44, email: "learner@example.test", displayName: "Aina", role: "user", emailVerified: true };
const profile = { exists: true, onboardingCompleted: true, preferredLanguage: "english" };

async function renderRoute(route, { authenticated = false, locale = "en" } = {}) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  window.IntersectionObserver = class { observe() {} disconnect() {} };
  await i18n.changeLanguage(locale);
  restoreSession.mockResolvedValue(authenticated
    ? { ok: true, data: { user: learner, profile } }
    : { ok: false, data: { error: { code: "AUTH_REQUIRED" } } });
  render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalled());
}

describe("forgot and reset password flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("login exposes both recovery links through the same neutral forgot-password flow", async () => {
    requestPasswordReset.mockResolvedValue({ ok: true, status: 202, data: { accepted: true } });
    await renderRoute("#/login");
    const forgotPasswordLink = await screen.findByRole("link", { name: i18n.t("auth.passwordReset.forgotLink") });
    const findAccountLink = screen.getByRole("link", { name: i18n.t("auth.passwordReset.findAccountLink") });
    expect(forgotPasswordLink).toHaveAttribute("href", "#/forgot-password");
    expect(findAccountLink).toHaveAttribute("href", "#/forgot-password");
    await userEvent.click(findAccountLink);
    expect(await screen.findByRole("heading", { name: i18n.t("auth.passwordReset.forgotTitle") })).toBeVisible();
    expect(screen.getByText(i18n.t("auth.passwordReset.findAccountGuidance"))).toBeVisible();
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.emailLabel")), "learner@example.test");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.requestButton") }));
    expect(requestPasswordReset).toHaveBeenCalledWith("learner@example.test", "en");
    expect(await screen.findByRole("heading", { name: i18n.t("auth.passwordReset.requestAcceptedTitle") })).toBeVisible();
    expect(screen.queryByText(/account exists|account found|not registered/i)).not.toBeInTheDocument();
  });

  test.each(["en", "ms", "zh-CN"])("localizes safe account-finding guidance in %s", async locale => {
    await renderRoute("#/login", { locale });
    const link = await screen.findByRole("link", { name: i18n.t("auth.passwordReset.findAccountLink") });
    expect(link).toHaveAttribute("href", "#/forgot-password");
    await userEvent.click(link);
    expect(await screen.findByText(i18n.t("auth.passwordReset.findAccountGuidance"))).toBeVisible();
    expect(document.body).not.toHaveTextContent("auth.passwordReset.findAccount");
    expect(document.body).not.toHaveTextContent(/account found|account not found|registered email/i);
  });

  test("forgot-password validates malformed email without a request", async () => {
    await renderRoute("#/forgot-password");
    await userEvent.type(await screen.findByLabelText(i18n.t("auth.passwordReset.emailLabel")), "invalid");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.requestButton") }));
    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("auth.passwordReset.invalidEmail"));
    expect(requestPasswordReset).not.toHaveBeenCalled();
  });

  test("captures reset token in memory, immediately cleans the URL, and submits only the new password", async () => {
    const token = "synthetic raw token";
    resetPassword.mockResolvedValue({ ok: true, data: { reset: true, authenticated: false } });
    await renderRoute(`#/reset-password?token=${encodeURIComponent(token)}`);
    expect(await screen.findByRole("heading", { name: i18n.t("auth.passwordReset.resetTitle") })).toBeVisible();
    expect(window.location.hash).toBe("#/reset-password");
    expect(window.localStorage.getItem(token)).toBeNull();
    expect(window.sessionStorage.getItem(token)).toBeNull();
    expect(document.body).not.toHaveTextContent(token);
    expect(document.querySelector("[data-token]")).toBeNull();
    expect(Array.from(document.querySelectorAll("[id]")).some(element => element.id.includes(token))).toBe(false);
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.newPassword")), "Secure123");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.confirmPassword")), "Mismatch123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.resetButton") }));
    expect(resetPassword).not.toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("auth.passwordReset.passwordMismatch"));
    await userEvent.clear(screen.getByLabelText(i18n.t("auth.passwordReset.confirmPassword")));
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.confirmPassword")), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.resetButton") }));
    expect(resetPassword).toHaveBeenCalledWith(token, "Secure123");
    expect(await screen.findByRole("heading", { name: i18n.t("auth.passwordReset.successTitle") })).toBeVisible();
    expect(logout).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
    expect(window.location.hash).toBe("#/reset-password");
  });

  test("successful reset clears restored authenticated identity", async () => {
    resetPassword.mockResolvedValue({ ok: true, data: { reset: true, authenticated: false } });
    await renderRoute("#/reset-password?token=auth-token", { authenticated: true });
    expect(await screen.findByRole("button", { name: /Aina/i })).toBeVisible();
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.newPassword")), "Secure123");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.confirmPassword")), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.resetButton") }));
    await screen.findByRole("heading", { name: i18n.t("auth.passwordReset.successTitle") });
    expect(screen.queryByRole("button", { name: /Aina/i })).not.toBeInTheDocument();
  });

  test.each([
    ["PASSWORD_RESET_TOKEN_EXPIRED", "expiredTitle"],
    ["PASSWORD_RESET_TOKEN_INVALID_OR_UNAVAILABLE", "unavailableTitle"],
  ])("maps %s to a safe reset-link result", async (code, titleKey) => {
    resetPassword.mockResolvedValue({ ok: false, status: 400, data: { error: { code } } });
    await renderRoute("#/reset-password?token=safe-fixture-token");
    await userEvent.type(await screen.findByLabelText(i18n.t("auth.passwordReset.newPassword")), "Secure123");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.confirmPassword")), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.resetButton") }));
    expect(await screen.findByRole("heading", { name: i18n.t(`auth.passwordReset.${titleKey}`) })).toBeVisible();
    expect(screen.getByRole("link", { name: i18n.t("auth.passwordReset.requestNewLink") })).toHaveAttribute("href", "#/forgot-password");
  });

  test("keeps the reset form usable after a password-policy backend error", async () => {
    resetPassword.mockResolvedValue({ ok: false, status: 400, data: { error: { code: "PASSWORD_RESET_PASSWORD_INVALID" } } });
    await renderRoute("#/reset-password?token=safe-fixture-token");
    const password = await screen.findByLabelText(i18n.t("auth.passwordReset.newPassword"));
    await userEvent.type(password, "Secure123");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.passwordReset.confirmPassword")), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.passwordReset.resetButton") }));
    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("auth.passwordReset.passwordRules"));
    expect(password).toBeVisible();
  });

  test.each(["en", "ms", "zh-CN"])("renders localized missing-token state in %s", async locale => {
    await renderRoute("#/reset-password", { locale });
    expect(await screen.findByRole("heading", { name: i18n.t("auth.passwordReset.missingTitle") })).toBeVisible();
    expect(screen.getByRole("link", { name: i18n.t("auth.passwordReset.requestNewLink") })).toHaveAttribute("href", "#/forgot-password");
    expect(resetPassword).not.toHaveBeenCalled();
  });
});
