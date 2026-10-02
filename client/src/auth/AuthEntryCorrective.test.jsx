import { render, screen, within } from "@testing-library/react";
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

beforeEach(async () => {
  jest.clearAllMocks();
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", "#/login");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
  await i18n.changeLanguage("en");
});

async function entry(signup = false) {
  const result = render(<App />);
  await screen.findByLabelText("Email");
  if (signup) await userEvent.click(screen.getByRole("button", { name: "Create an account" }));
  return result;
}

test.each([false, true])("entry has no explicit return control (signup=%s)", async signup => {
  await entry(signup);
  expect(within(screen.getByRole("main")).queryByRole("button", { name: /back/i })).not.toBeInTheDocument();
  await userEvent.click(screen.getByRole("button", { name: i18n.t("nav.brandHomeAriaLabel") }));
  expect(window.location.hash).toBe("#/home");
});

test.each([false, true])("desktop brand has one shared statement without Welcome hierarchy (signup=%s)", async signup => {
  const { container } = await entry(signup);
  const brand = container.querySelector(".cy-auth-brand");
  expect(within(brand).getByRole("img", { name: "Cyberly" })).toBeInTheDocument();
  expect(brand.textContent).toBe("Build confidence, one safe step at a time.");
});

test("Login task heading is Sign in", async () => {
  await entry();
  expect(screen.getByRole("heading", { level: 1, name: "Sign in" })).toBeVisible();
});

test.each([false, true])("Privacy entry belongs to the shared footer (signup=%s)", async signup => {
  const { container } = await entry(signup);
  expect(within(container.querySelector(".cy-auth-panel")).queryByRole("link", { name: "Privacy Notice" })).not.toBeInTheDocument();
  expect(within(screen.getByRole("contentinfo")).getByRole("link", { name: "Privacy Notice" })).toHaveAttribute("href", "#/privacy");
});

test("access help retains accessible grouping and recovery links without static heading", async () => {
  await entry();
  const help = screen.getByRole("group", { name: "Need help accessing your account?" });
  expect(within(help).queryByText("Need help accessing your account?")).not.toBeInTheDocument();
  expect(within(help).getAllByRole("link")).toHaveLength(2);
  within(help).getAllByRole("link").forEach(link => expect(link).toHaveAttribute("href", "#/forgot-password"));
});

test("Login account switch is a small quiet secondary action", async () => {
  await entry();
  expect(screen.getByText("New to Cyberly?")).toBeVisible();
  expect(screen.getByRole("button", { name: "Create an account" })).toHaveClass("cy-button-quiet");
});

test("Signup switch appears only on Step 1; every later step retains Back and its primary action", async () => {
  const { container } = await entry(true);
  const panel = () => within(container.querySelector(".cy-auth-register"));
  expect(panel().getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(screen.getByText(i18n.t("auth.ageGuidance"))).toBeVisible();
  await userEvent.type(screen.getByLabelText("Email"), "entry@example.test");
  await userEvent.type(screen.getByLabelText("Display name"), "Aina");
  await userEvent.type(screen.getByLabelText("Age"), "15");
  await userEvent.type(screen.getByLabelText("Password"), "Secure123");
  const choices = [
    async () => userEvent.type(screen.getByLabelText(i18n.t("onboarding.aiNickname")), "Nova"),
    async () => userEvent.click(screen.getByRole("button", { name: i18n.t("profileOptions.education.form_3") })),
    async () => userEvent.click(screen.getByRole("button", { name: i18n.t("profileOptions.language.english") })),
    async () => userEvent.click(screen.getByRole("button", { name: /Beginner/i })),
    async () => { for (const key of ["staying_safe_online", "avoiding_scams", "protecting_privacy"]) await userEvent.click(screen.getByRole("button", { name: i18n.t(`profileOptions.helpTopics.${key}`) })); },
  ];
  for (let step = 2; step <= 7; step += 1) {
    await userEvent.click(panel().getByRole("button", { name: i18n.t("onboarding.continue") }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(step));
    expect(panel().queryByText("Already have an account?")).not.toBeInTheDocument();
    expect(panel().queryByRole("button", { name: "Sign in" })).not.toBeInTheDocument();
    const actions = within(container.querySelector(".cy-auth-register .cy-auth-actions")).getAllByRole("button");
    expect(actions[0]).toHaveTextContent("Back");
    expect(actions[0]).toHaveClass("cy-button-quiet");
    expect(actions[1]).toHaveClass("cy-button-primary");
    expect(actions[1]).toHaveTextContent(step === 7 ? i18n.t("onboarding.letsGo") : "Continue");
    if (step < 7) await choices[step - 2]();
  }
  for (let step = 6; step >= 1; step -= 1) {
    await userEvent.click(panel().getByRole("button", { name: /Back/ }));
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", String(step));
  }
  expect(panel().getByRole("button", { name: "Sign in" })).toBeVisible();
  expect(screen.getByLabelText("Age")).toHaveValue(15);
});
