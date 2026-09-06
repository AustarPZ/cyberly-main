import { render, screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import GlobalNavigation from "./GlobalNavigation";
import AccountMenu from "./AccountMenu";
import AppFooter from "./AppFooter";
import i18n from "../i18n";

const learner = { id: 1, displayName: "Shell Test", role: "user", profile: { avatarPreset: "explorer_orbit" } };
beforeEach(async () => {
  await i18n.changeLanguage("en");
  window.matchMedia = jest.fn(query => ({ matches: false, media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
});
const setup = (user = learner, onHelp) => {
  const onNavigate = jest.fn(), openAuth = jest.fn(), onRequestLogout = jest.fn();
  render(<GlobalNavigation page="resources" user={user} onNavigate={onNavigate} openAuth={openAuth}
    onRequestLogout={onRequestLogout} onHelp={onHelp} languageControl={<button>Language</button>} logo="logo.svg" />);
  return { onNavigate, openAuth, onRequestLogout };
};
test("learner primary navigation has frozen order without Progress or Admin", () => {
  setup();
  const primary = screen.getByLabelText(i18n.t("nav.primaryAriaLabel"));
  expect(within(primary).getAllByRole("button").map(x => x.textContent)).toEqual([
    "Dashboard", "Resources", "Scenarios", "Assessment", "CyberGuard", "About",
  ]);
  expect(within(primary).getByRole("button", { name: "Resources" })).toHaveAttribute("aria-current", "page");
});
test("public navigation keeps public destinations and explicit sign in", () => {
  const { openAuth } = setup(null);
  expect(within(screen.getByLabelText(i18n.t("nav.primaryAriaLabel"))).getAllByRole("button").map(x => x.textContent)).toEqual(["Home", "Resources", "About"]);
  userEvent.click(screen.getByRole("button", { name: i18n.t("nav.signIn") }));
  expect(openAuth).toHaveBeenCalledWith("login");
  expect(screen.queryByRole("button", { name: "Help" })).not.toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Assessment" })).not.toBeInTheDocument();
});
test("account menu uses real avatar authority, keyboard controls and compatible Profile/Settings targets", async () => {
  const onNavigate = jest.fn(), onRequestLogout = jest.fn();
  render(<AccountMenu user={learner} onNavigate={onNavigate} onRequestLogout={onRequestLogout} />);
  const trigger = screen.getByRole("button", { name: /Shell Test/ });
  expect(trigger.querySelector(".avatar-visual")).toBeTruthy();
  fireEvent.keyDown(trigger, { key: "ArrowDown" });
  const profile = await screen.findByRole("menuitem", { name: "Profile" });
  await new Promise(resolve => setTimeout(resolve, 5));
  expect(profile).toHaveFocus();
  fireEvent.keyDown(profile, { key: "End" });
  expect(screen.getByRole("menuitem", { name: i18n.t("nav.accountMenu.logOut") })).toHaveFocus();
  fireEvent.keyDown(document.activeElement, { key: "Home" });
  expect(profile).toHaveFocus();
  fireEvent.keyDown(profile, { key: "ArrowDown" });
  expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveFocus();
  fireEvent.keyDown(document.activeElement, { key: "ArrowUp" });
  expect(profile).toHaveFocus();
  userEvent.click(profile);
  expect(onNavigate).toHaveBeenLastCalledWith("profile");
  userEvent.click(trigger);
  userEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
  expect(onNavigate).toHaveBeenLastCalledWith("profile");
  userEvent.click(trigger);
  fireEvent.keyDown(document, { key: "Escape" });
  expect(trigger).toHaveFocus();
  expect(trigger).toHaveAttribute("aria-expanded", "false");
  userEvent.click(trigger);
  fireEvent.mouseDown(document.body);
  expect(trigger).toHaveFocus();
  expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  userEvent.click(trigger);
  userEvent.click(screen.getByRole("menuitem", { name: i18n.t("nav.accountMenu.logOut") }));
  expect(onRequestLogout).toHaveBeenCalledWith(trigger);
});
test("Admin is reachable only for an admin account", () => {
  const { onNavigate } = setup({ ...learner, role: "admin" });
  userEvent.click(screen.getByRole("button", { name: /Open account menu/ }));
  userEvent.click(screen.getByRole("menuitem", { name: "Admin Console" }));
  expect(onNavigate).toHaveBeenCalledWith("admin");
});
test("footer About and Privacy use existing routes", () => {
  const onNavigate = jest.fn();
  render(<AppFooter onNavigate={onNavigate} />);
  expect(screen.getByRole("link", { name: /About/ })).toHaveAttribute("href", "#/about");
  expect(screen.getByRole("link", { name: /Privacy/ })).toHaveAttribute("href", "#/privacy");
  expect(screen.queryByRole("link", { name: "Help" })).not.toBeInTheDocument();
});
test.each(["en", "ms", "zh-CN"])("mobile menu exposes localized public destinations: %s", async locale => {
  await i18n.changeLanguage(locale);
  window.matchMedia.mockImplementation(query => ({ matches: true, media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  const { onNavigate } = setup(null);
  userEvent.click(screen.getByRole("button", { name: i18n.t("nav.openMenuAriaLabel") }));
  userEvent.click(screen.getByRole("menuitem", { name: i18n.t("nav.about") }));
  expect(onNavigate).toHaveBeenCalledWith("about");
  userEvent.click(screen.getByRole("button", { name: i18n.t("nav.openMenuAriaLabel") }));
  expect(screen.queryByRole("menuitem", { name: i18n.t("nav.help") })).not.toBeInTheDocument();
});

test.each([false, true])("optional Help invokes supplied handler, mobile=%s", mobile => {
  window.matchMedia.mockImplementation(query => ({ matches: mobile, media: query, addEventListener: jest.fn(), removeEventListener: jest.fn() }));
  const onHelp = jest.fn();
  setup(null, onHelp);
  if (mobile) userEvent.click(screen.getByRole("button", { name: i18n.t("nav.openMenuAriaLabel") }));
  const scope = mobile ? screen.getByRole("menu") : document.querySelector(".desktop-auth-actions");
  userEvent.click(within(scope).getByRole(mobile ? "menuitem" : "button", { name: "Help" }));
  expect(onHelp).toHaveBeenCalledTimes(1);
});
test("footer honors an explicitly supplied test-only Help destination", () => {
  const onNavigate = jest.fn();
  render(<AppFooter onNavigate={onNavigate} helpHref="#/__help_contract_test__" />);
  const help = screen.getByRole("link", { name: "Help" });
  expect(help).toHaveAttribute("href", "#/__help_contract_test__");
  userEvent.click(help);
  expect(onNavigate).toHaveBeenCalledWith("__help_contract_test__");
});
