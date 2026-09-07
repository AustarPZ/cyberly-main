import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { login, restoreSession } from "../api/authApi";
import { getResourceBySlug } from "../api/resourceApi";
import { getScenarioBySlug, startScenarioAttempt } from "../api/scenarioApi";
import { markRecommendationViewed, markRecommendationCompleted } from "../api/recommendationApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({ login: jest.fn(), restoreSession: jest.fn(), register: jest.fn(), refreshCurrentUser: jest.fn(), logout: jest.fn(), verifyEmail: jest.fn(), resendVerificationEmail: jest.fn() }));
jest.mock("../api/resourceApi", () => ({ getResourceBySlug: jest.fn(), listResources: jest.fn().mockResolvedValue({ ok: true, data: { resources: [] } }) }));
jest.mock("../api/scenarioApi", () => ({ getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), listScenarios: jest.fn().mockResolvedValue({ ok: true, data: { scenarios: [] } }), getRecommendedScenarios: jest.fn().mockResolvedValue({ ok: true, data: { scenarios: [] } }) }));
jest.mock("../api/recommendationApi", () => ({ markRecommendationViewed: jest.fn(), markRecommendationCompleted: jest.fn() }));
jest.mock("../chat/chatApi", () => ({ listChatConversations: jest.fn().mockResolvedValue({ ok: true, data: { conversations: [] } }) }));
const scenarioSlug = "suspicious-parcel-delivery-sms";
const introHash = `#/scenarios/${scenarioSlug}`;
const session = { ok: true, data: { user: { id: 808, email: "learner@example.test", displayName: "Learner", age: 15, emailVerified: true }, profile: { onboardingCompleted: true, preferredLanguage: "english" } } };
const scenario = { id: 9, slug: scenarioSlug, title: "Parcel practice", summary: "Check a suspicious delivery message.", topicCode: "phishing_and_scams", difficulty: "beginner", estimatedMinutes: 4, totalSteps: 3 };
beforeEach(async () => {
  jest.clearAllMocks(); window.localStorage.clear(); window.sessionStorage.clear();
  window.history.replaceState({}, "", "#/resources/phishing");
  window.scrollTo = jest.fn(); window.HTMLElement.prototype.scrollIntoView = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  await i18n.changeLanguage("en"); restoreSession.mockResolvedValue(session); login.mockResolvedValue(session);
  require("../chat/chatApi").listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  require("../api/scenarioApi").listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  require("../api/scenarioApi").getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [] } });
  require("../api/resourceApi").listResources.mockResolvedValue({ ok: true, data: { resources: [] } });
  getResourceBySlug.mockResolvedValue({ ok: true, data: { resource: { slug: "phishing", title: "Phishing guide", categoryCode: "Scams", summary: "Pause first", content: ["Verify the sender"], relatedScenario: { slug: scenarioSlug } } } });
  getScenarioBySlug.mockResolvedValue({ ok: true, data: { scenario, firstStep: null } });
});
afterEach(() => {
  expect(startScenarioAttempt).not.toHaveBeenCalled();
  expect(markRecommendationViewed).not.toHaveBeenCalled();
  expect(markRecommendationCompleted).not.toHaveBeenCalled();
});
async function expectIntro() {
  expect(await screen.findByText(scenario.summary)).toBeVisible();
  expect(window.location.hash).toBe(introHash);
  expect(getScenarioBySlug).toHaveBeenCalledWith(scenarioSlug, { locale: "en" });
  expect(document.querySelectorAll("main")).toHaveLength(1);
}
test("authenticated reader handoff opens exact intro; history returns to reader and forward to intro", async () => {
  render(<App />);
  await userEvent.click(await screen.findByRole("link", { name: /Put the idea into practice/ }));
  await expectIntro();
  act(() => window.history.back());
  await screen.findByRole("heading", { name: "Phishing guide" });
  act(() => window.history.forward()); await expectIntro();
});
test("guest reader handoff resumes exact introduction after Sign In", async () => {
  restoreSession.mockResolvedValue({ ok: false }); render(<App />);
  await userEvent.click(await screen.findByRole("link", { name: /Put the idea into practice/ }));
  await waitFor(() => expect(window.location.hash).toBe("#/login"));
  await userEvent.type(await screen.findByLabelText(i18n.t("auth.email")), "learner@example.test");
  await userEvent.type(screen.getByLabelText(i18n.t("auth.password")), "ControlledTest123");
  await userEvent.click(screen.getByRole("button", { name: i18n.t("auth.signInButton") }));
  await expectIntro();
});
test("direct authenticated intro survives a fresh App mount/session restore", async () => {
  window.history.replaceState({}, "", introHash);
  const first = render(<App />); await expectIntro(); first.unmount();
  render(<App />); await expectIntro();
});
test("malformed Resource route makes no detail request", async () => {
  window.history.replaceState({}, "", "#/resources/%2Fbad"); render(<App />);
  await screen.findByText(/This guide is unavailable/);
  expect(getResourceBySlug).not.toHaveBeenCalled();
});
