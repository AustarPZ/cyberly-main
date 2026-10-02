import { render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "#/login");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
});

test.each(["en", "ms", "zh-CN"])("recovered shell and keyboard-accessible neutral help in %s", async locale => {
  await i18n.changeLanguage(locale);
  const { container } = render(<App />);
  await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });
  expect(container.querySelector(".cy-auth-experience")).toBeInTheDocument();
  expect(container.querySelectorAll(".cy-auth-brand li")).toHaveLength(3);
  const help = screen.getByRole("group", { name: i18n.t("auth.experience.accessHelp") });
  const links = within(help).getAllByRole("link");
  expect(links).toHaveLength(2);
  links.forEach(link => expect(link).toHaveAttribute("href", "#/forgot-password"));
  screen.getByLabelText(i18n.t("auth.email")).focus();
  userEvent.tab();
  expect(screen.getByLabelText(i18n.t("auth.password"))).toHaveFocus();
  userEvent.tab();
  expect(within(container.querySelector(".cy-auth-login")).getByRole("button", { name: i18n.t("auth.signInButton"), exact: true })).toHaveFocus();
  userEvent.tab();
  expect(links[0]).toHaveFocus();
  userEvent.tab();
  expect(links[1]).toHaveFocus();
  await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.goToRegister"), exact: true }));
  expect(container.querySelector(".cy-auth-experience-register")).toBeInTheDocument();
  expect(container.querySelector(".cy-auth-credentials-grid")).toContainElement(screen.getByLabelText(i18n.t("auth.age")));
  expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuemax", "7");
  await userEvent.click(screen.getByRole("button", { name: i18n.t("onboarding.continue"), exact: true }));
  await waitFor(() => expect(screen.getByLabelText(i18n.t("auth.email"))).toHaveFocus());
  expect(screen.getAllByRole("alert")).toHaveLength(4);
});

test("responsive contract collapses below desktop without clipping or a FAB right lane", () => {
  const fs = require("fs");
  const path = require("path");
  const css = fs.readFileSync(path.join(__dirname, "authExperience.css"), "utf8");
  expect(css).toMatch(/42fr\) minmax\(0, 58fr\)/);
  expect(css).toMatch(/@media \(max-width: 1023px\)/);
  expect(css).toMatch(/\.cy-auth-brand-values[\s\S]*display: none/);
  expect(css).not.toMatch(/overflow:\s*hidden|max-height:|position:\s*fixed|padding-right:/);
});
