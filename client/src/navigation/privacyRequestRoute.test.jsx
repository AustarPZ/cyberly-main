import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { login, restoreSession } from "../api/authApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
  requestEmailChange: jest.fn(), confirmEmailChange: jest.fn(), requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock("../api/profileApi", () => ({ getProfile: jest.fn(), saveProfile: jest.fn() }));
jest.mock("../api/accountApi", () => ({ saveAccount: jest.fn() }));
jest.mock("../api/assessmentApi", () => ({
  getInitialAssessmentStatus: jest.fn().mockResolvedValue({ ok: true, data: { status: "pending" } }),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn().mockResolvedValue({ ok: true, data: {} }) }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn().mockResolvedValue({ ok: true, data: { recommendation: null } }),
  markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../api/scenarioApi", () => ({
  getRecommendedScenarios: jest.fn().mockResolvedValue({ ok: true, data: { scenarios: [] } }),
  getScenarioDashboard: jest.fn().mockResolvedValue({ ok: true, data: { completedCount: 0, inProgress: null } }),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(),
}));
jest.mock("../privacy/privacyRequest.api", () => ({
  listPrivacyRequests: jest.fn().mockResolvedValue({ ok: true, data: { requests: [] } }),
  getPrivacyRequest: jest.fn(), createPrivacyRequest: jest.fn(), cancelPrivacyRequest: jest.fn(),
}));

const session = {
  ok: true,
  data: {
    user: { id: 808, email: "learner@example.test", displayName: "Learner", age: 15, emailVerified: true },
    profile: { onboardingCompleted: true, preferredLanguage: "english" },
  },
};

async function renderRoute(route, restored = session) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  class IntersectionObserverMock {
    observe() {}
    disconnect() {}
  }
  window.IntersectionObserver = IntersectionObserverMock;
  global.IntersectionObserver = IntersectionObserverMock;
  await i18n.changeLanguage("en");
  restoreSession.mockResolvedValue(restored);
  render(<App />);
}

function navigateTo(hash) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

describe("Privacy Request protected routing", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    require("../chat/chatApi").listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("renders the protected destination after one successful session restore", async () => {
    await renderRoute("#/privacy-requests");

    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("privacyRequests.title") })).toBeVisible();
    expect(window.location.hash).toBe("#/privacy-requests");
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  test("sends an unauthenticated direct visit to Login and returns there after successful login", async () => {
    await renderRoute("#/privacy-requests", { ok: false, error: "Not authenticated" });
    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });
    expect(window.location.hash).toBe("#/login");

    login.mockResolvedValue(session);
    await userEvent.type(screen.getByLabelText(i18n.t("auth.email")), "learner@example.test");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.password")), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.signInButton") }));

    await waitFor(() => expect(window.location.hash).toBe("#/privacy-requests"));
    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("privacyRequests.title") })).toBeVisible();
  });

  test("keeps protected content hidden after a failed login", async () => {
    await renderRoute("#/privacy-requests", { ok: false, error: "Not authenticated" });
    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });
    login.mockResolvedValue({ ok: false, error: "Invalid credentials" });

    await userEvent.type(screen.getByLabelText(i18n.t("auth.email")), "learner@example.test");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.password")), "wrong-password");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.signInButton") }));

    expect(await screen.findByRole("alert")).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: i18n.t("privacyRequests.title") })).not.toBeInTheDocument();
    expect(window.location.hash).toBe("#/login");
  });

  test("clears the protected return intent after explicit navigation away", async () => {
    await renderRoute("#/privacy-requests", { ok: false, error: "Not authenticated" });
    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });

    navigateTo("#/home");
    await screen.findByRole("heading", { level: 1, name: i18n.t("home.hero.title") });
    navigateTo("#/login");
    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });

    login.mockResolvedValue(session);
    await userEvent.type(screen.getByLabelText(i18n.t("auth.email")), "learner@example.test");
    await userEvent.type(screen.getByLabelText(i18n.t("auth.password")), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.signInButton") }));

    await waitFor(() => expect(window.location.hash).toBe("#/dashboard"));
  });
});
