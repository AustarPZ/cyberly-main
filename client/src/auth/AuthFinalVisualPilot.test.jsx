import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession, verifyEmail } from "../api/authApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn().mockResolvedValue({ ok: true, data: { conversations: [] } }),
  createChatConversation: jest.fn(), getChatConversation: jest.fn(), renameChatConversation: jest.fn(),
  deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(), generateChatAssistantReply: jest.fn(),
  createLearnerActionProposal: jest.fn(), confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

async function renderRoute(route, locale = "en") {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  await i18n.changeLanguage(locale);
  restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
  const result = render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
  return result;
}

describe("Auth final visual foundation", () => {
  beforeEach(() => jest.clearAllMocks());

  test("presents Login as a bounded accessible Safe Entry surface", async () => {
    const { container } = await renderRoute("#/login");
    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });

    expect(container.querySelector(".cy-auth-route")).toBeInTheDocument();
    expect(container.querySelector(".cy-auth-login")).toHaveClass("cy-surface");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByLabelText(i18n.t("auth.email"))).toHaveAttribute("type", "email");
    expect(screen.getByLabelText(i18n.t("auth.password"))).toHaveAttribute("type", "password");
    expect(screen.getByRole("button", { name: i18n.t("auth.signInButton") })).toHaveClass("cy-button-primary");
    expect(screen.getByRole("button", { name: i18n.t("common.backToHome") })).not.toHaveAttribute("style");
  });

  test("presents Registration as a seven-step Explorer Setup journey", async () => {
    const { container } = await renderRoute("#/home");
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("auth.getStarted") }));

    expect(container.querySelector(".cy-auth-register")).toHaveClass("cy-surface");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemin", "1");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "7");
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "1");
    expect(screen.getByText(i18n.t("onboarding.progress", {
      step: 1, total: 7, label: i18n.t("onboarding.account"),
    }))).toBeVisible();
    expect(screen.getByLabelText(i18n.t("auth.displayName"))).toBeVisible();
  });

  test("exposes option selection through aria-pressed rather than colour alone", async () => {
    await renderRoute("#/home");
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("auth.getStarted") }));
    await userEvent.type(document.querySelector('[data-field="email"]'), "visual@example.test");
    await userEvent.type(document.querySelector('[data-field="displayName"]'), "Aina");
    await userEvent.type(document.querySelector('[data-field="age"]'), "15");
    await userEvent.type(document.querySelector('[data-field="password"]'), "Secure123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("onboarding.continue") }));
    await userEvent.type(screen.getByPlaceholderText(i18n.t("onboarding.nicknamePlaceholder")), "Nova");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("onboarding.continue") }));

    const option = screen.getByRole("button", { name: i18n.t("profileOptions.education.form_3") });
    expect(option).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(option);
    expect(option).toHaveAttribute("aria-pressed", "true");
  });

  test.each(["en", "ms", "zh-CN"])("renders the verification checkpoint safely in %s", async locale => {
    verifyEmail.mockResolvedValue({
      ok: true,
      data: { user: { id: 401, emailVerified: true }, alreadyVerified: false },
    });
    const { container } = await renderRoute("#/verify-email?token=fake-visual-token", locale);

    const heading = await screen.findByRole("heading", { level: 1, name: i18n.t("auth.emailVerification.successTitle") });
    expect(container.querySelector(".cy-auth-verification")).toHaveClass("cy-surface");
    expect(window.location.hash).toBe("#/verify-email");
    await waitFor(() => expect(heading).toHaveFocus());
    expect(screen.getByRole("button", { name: i18n.t("auth.emailVerification.loginToResend") })).toBeVisible();
  });
});
