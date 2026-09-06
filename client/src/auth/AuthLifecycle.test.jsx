import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { login, register, restoreSession } from "../api/authApi";
import { saveProfile } from "../api/profileApi";
import { getInitialAssessmentStatus } from "../api/assessmentApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/profileApi", () => ({ getProfile: jest.fn(), saveProfile: jest.fn() }));
jest.mock("../guardian/guardianLink.api", () => ({ getGuardianLink: jest.fn().mockResolvedValue({ ok: true, data: { relationship: null } }) }));
jest.mock("../api/assessmentApi", () => ({
  getInitialAssessment: jest.fn(), createInitialAssessmentAttempt: jest.fn(),
  getInitialAssessmentStatus: jest.fn(), saveAssessmentAnswer: jest.fn(), submitAssessmentAttempt: jest.fn(),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn().mockResolvedValue({ ok: true, data: {} }) }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn().mockResolvedValue({ ok: true, data: { recommendation: null } }),
  markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../api/scenarioApi", () => ({
  listScenarios: jest.fn(),
  getRecommendedScenarios: jest.fn().mockResolvedValue({ ok: true, data: { scenarios: [] } }),
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

const accountUser = {
  id: 301,
  email: "explorer@example.test",
  displayName: "Aina",
  age: 15,
  role: "user",
  accountStatus: "active",
  emailVerified: false,
};

const profile = {
  exists: true,
  aiNickname: "Nova",
  educationLevel: "form_3",
  preferredLanguage: "english",
  familiarityLevel: "beginner",
  helpTopics: ["staying_safe_online", "avoiding_scams", "protecting_privacy"],
  learningStyle: "step_by_step",
  onboardingCompleted: true,
};

const profilePayload = {
  aiNickname: profile.aiNickname,
  educationLevel: profile.educationLevel,
  preferredLanguage: profile.preferredLanguage,
  familiarityLevel: profile.familiarityLevel,
  helpTopics: profile.helpTopics,
  learningStyle: profile.learningStyle,
  onboardingCompleted: true,
};

async function renderRoute(route = "#/login") {
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
  restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
  getInitialAssessmentStatus.mockResolvedValue({ ok: true, data: { status: "pending" } });
  render(<App />);
  await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
  if (route === "#/login") {
    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });
  }
}

async function enterRegistration() {
  await renderRoute("#/home");
  await click((await screen.findAllByRole("button", { name: i18n.t("home.hero.cta") }))[0]);
  await screen.findByRole("heading", { level: 1, name: i18n.t("auth.createAccount") });
  return within(screen.getByRole("main"));
}

function click(element) {
  return userEvent.click(element, undefined, { skipHover: true });
}

async function continueRegistration(registration) {
  await click(registration.getByRole("button", { name: i18n.t("onboarding.continue") }));
}

async function fillAccountStep(registration) {
  await userEvent.type(registration.getByLabelText(i18n.t("auth.email")), accountUser.email);
  await userEvent.type(registration.getByLabelText(i18n.t("auth.displayName")), accountUser.displayName);
  await userEvent.type(registration.getByLabelText(i18n.t("auth.age")), String(accountUser.age));
  await userEvent.type(registration.getByLabelText(i18n.t("auth.password")), "Secure123");
  await continueRegistration(registration);
}

async function completeNicknameStep(registration) {
  await userEvent.type(registration.getByLabelText(i18n.t("onboarding.aiNickname")), profile.aiNickname);
  await continueRegistration(registration);
}

async function completeEducationStep(registration) {
  await click(registration.getByRole("button", { name: i18n.t("profileOptions.education.form_3") }));
  await continueRegistration(registration);
}

async function completeLanguageStep(registration) {
  await click(registration.getByRole("button", { name: i18n.t("profileOptions.language.english") }));
  await continueRegistration(registration);
}

async function completeFamiliarityStep(registration) {
  await click(registration.getByRole("button", { name: /Beginner/i }));
  await continueRegistration(registration);
}

async function completeHelpTopicsStep(registration) {
  for (const key of profile.helpTopics) {
    await click(registration.getByRole("button", { name: i18n.t(`profileOptions.helpTopics.${key}`) }));
  }
  expect(registration.getByRole("button", { name: i18n.t("profileOptions.helpTopics.learning_cybersecurity") })).toBeDisabled();
  await continueRegistration(registration);
}

async function completeLearningStyleStep(registration) {
  await click(registration.getByRole("button", {
    name: new RegExp(i18n.t("profileOptions.learningStyle.step_by_step"), "i"),
  }));
}

async function completeRegistrationChoices(registration) {
  await fillAccountStep(registration);
  await completeNicknameStep(registration);
  await completeEducationStep(registration);
  await completeLanguageStep(registration);
  await completeFamiliarityStep(registration);
  await completeHelpTopicsStep(registration);
  await completeLearningStyleStep(registration);
}

describe("authentication and registration lifecycle", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("validates Login and preserves successful normalized navigation", async () => {
    await renderRoute();
    await click(screen.getByRole("button", { name: i18n.t("auth.signInButton") }));
    expect(await screen.findByText(i18n.t("auth.emailInvalid"))).toHaveAttribute("role", "alert");
    expect(document.querySelector('[data-field="email"]')).toHaveFocus();

    login.mockResolvedValue({ ok: true, data: { user: accountUser, profile } });
    await userEvent.type(document.querySelector('[data-field="email"]'), accountUser.email);
    await userEvent.type(document.querySelector('[data-field="password"]'), "Secure123");
    await userEvent.keyboard("{Enter}");

    await waitFor(() => expect(login).toHaveBeenCalledWith(accountUser.email, "Secure123"));
    await waitFor(() => expect(window.location.hash).toBe("#/dashboard"));
  });

  test("keeps all seven registration steps and account/profile payloads in order", async () => {
    register.mockResolvedValue({ ok: true, data: { user: accountUser, verification: { emailSent: true } } });
    saveProfile.mockResolvedValue({ ok: true, data: { profile } });
    const registration = await enterRegistration();

    await completeRegistrationChoices(registration);
    expect(registration.getByText(i18n.t("onboarding.progress", { step: 7, total: 7, label: i18n.t("onboarding.learningStyle") }))).toBeVisible();
    await click(registration.getByRole("button", { name: i18n.t("onboarding.letsGo") }));

    await waitFor(() => expect(register).toHaveBeenCalledWith({
      email: accountUser.email,
      displayName: accountUser.displayName,
      age: accountUser.age,
      password: "Secure123",
    }));
    expect(saveProfile).toHaveBeenCalledWith(profilePayload);
    expect(register.mock.invocationCallOrder[0]).toBeLessThan(saveProfile.mock.invocationCallOrder[0]);
    await waitFor(() => expect(window.location.hash).toBe("#/assessment"));
  }, 10000);

  test.each([12, 18])("blocks unsupported registration age %i before submit", async age => {
    const registration = await enterRegistration();
    const ageInput = registration.getByLabelText(i18n.t("auth.age"));

    await userEvent.type(registration.getByLabelText(i18n.t("auth.email")), accountUser.email);
    await userEvent.type(registration.getByLabelText(i18n.t("auth.displayName")), accountUser.displayName);
    await userEvent.type(ageInput, String(age));
    await userEvent.type(registration.getByLabelText(i18n.t("auth.password")), "Secure123");
    await continueRegistration(registration);

    expect(await registration.findByText(i18n.t("auth.ageInvalid"))).toHaveAttribute("role", "alert");
    expect(ageInput).toHaveFocus();
    expect(register).not.toHaveBeenCalled();
  });

  test.each([13, 17])("allows supported registration age %i", async age => {
    const registration = await enterRegistration();
    const ageInput = registration.getByLabelText(i18n.t("auth.age"));

    expect(ageInput).toHaveAttribute("min", "13");
    expect(ageInput).toHaveAttribute("max", "17");
    expect(registration.getByText(i18n.t("auth.ageGuidance"))).toBeVisible();
    await userEvent.type(registration.getByLabelText(i18n.t("auth.email")), accountUser.email);
    await userEvent.type(registration.getByLabelText(i18n.t("auth.displayName")), accountUser.displayName);
    await userEvent.type(ageInput, String(age));
    await userEvent.type(registration.getByLabelText(i18n.t("auth.password")), "Secure123");
    await continueRegistration(registration);

    expect(registration.queryByText(i18n.t("auth.ageInvalid"))).not.toBeInTheDocument();
    expect(registration.getByLabelText(i18n.t("onboarding.aiNickname"))).toBeVisible();
  });

  test("retries only profile persistence after the account has already been created", async () => {
    register.mockResolvedValue({ ok: true, data: { user: accountUser, verification: { emailSent: true } } });
    saveProfile
      .mockResolvedValueOnce({ ok: false, data: { errors: { learningStyle: "Profile unavailable" } } })
      .mockResolvedValueOnce({ ok: true, data: { profile } });
    const registration = await enterRegistration();
    await completeRegistrationChoices(registration);

    await click(registration.getByRole("button", { name: i18n.t("onboarding.letsGo") }));
    expect(await registration.findByText(i18n.t("onboarding.profileSaveFailed"))).toHaveAttribute("role", "alert");
    await click(registration.getByRole("button", { name: i18n.t("onboarding.retrySavingProfile") }));

    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(2));
    expect(register).toHaveBeenCalledTimes(1);
    expect(saveProfile).toHaveBeenNthCalledWith(1, profilePayload);
    expect(saveProfile).toHaveBeenNthCalledWith(2, profilePayload);
    expect(register.mock.invocationCallOrder[0]).toBeLessThan(saveProfile.mock.invocationCallOrder[0]);
    await waitFor(() => expect(window.location.hash).toBe("#/assessment"));
  }, 10000);
});
