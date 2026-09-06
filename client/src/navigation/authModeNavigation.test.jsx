import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { login, register, restoreSession } from "../api/authApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

async function renderRoute(route) {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  await i18n.changeLanguage("en");
  restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
  render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
}

describe("explicit authentication mode navigation", () => {
  beforeEach(() => jest.clearAllMocks());

  test("preserves an explicit Registration request while navigating to the auth route", async () => {
    await renderRoute("#/home");

    await userEvent.click((await screen.findAllByRole("button", { name: i18n.t("home.hero.cta") }))[0]);

    expect(window.location.hash).toBe("#/login");
    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("auth.createAccount") })).toBeVisible();
    expect(screen.queryByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") })).not.toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  test("keeps an explicit Login request in Login mode", async () => {
    await renderRoute("#/home");

    await userEvent.click(screen.getByRole("button", { name: i18n.t("nav.signIn") }));

    expect(window.location.hash).toBe("#/login");
    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") })).toBeVisible();
    expect(register).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });

  test("defaults a generic direct Login route to Login mode", async () => {
    await renderRoute("#/login");

    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") })).toBeVisible();
    expect(screen.queryByText(i18n.t("auth.createAccount"))).not.toBeInTheDocument();
    expect(register).not.toHaveBeenCalled();
    expect(login).not.toHaveBeenCalled();
  });
});
