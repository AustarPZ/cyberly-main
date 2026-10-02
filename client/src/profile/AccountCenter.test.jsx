import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { saveAccount } from "../api/accountApi";
import { getProfile, saveProfile } from "../api/profileApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/accountApi", () => ({ getAccount: jest.fn(), saveAccount: jest.fn() }));
jest.mock("../api/profileApi", () => ({ getProfile: jest.fn(), saveProfile: jest.fn() }));
jest.mock("../guardian/guardianLink.api", () => ({ getGuardianLink: jest.fn().mockResolvedValue({ ok: true, data: { relationship: null } }) }));
jest.mock("../api/assessmentApi", () => ({
  getInitialAssessment: jest.fn(), createInitialAssessmentAttempt: jest.fn(), getInitialAssessmentStatus: jest.fn(),
  saveAssessmentAnswer: jest.fn(), submitAssessmentAttempt: jest.fn(),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn() }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn(), markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../api/scenarioApi", () => ({
  listScenarios: jest.fn(), getRecommendedScenarios: jest.fn(), getScenarioDashboard: jest.fn(),
  getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), getScenarioAttempt: jest.fn(),
  saveScenarioDecision: jest.fn(), completeScenarioAttempt: jest.fn(), getScenarioAttemptResult: jest.fn(),
}));
jest.mock("../api/resourceApi", () => ({ listResources: jest.fn() }));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

const learner = {
  id: 71,
  email: "profile@example.test",
  displayName: "Alya Noor",
  age: 15,
  ageGroup: "teen",
  role: "user",
  accountStatus: "active",
  emailVerified: true,
  onboardingCompleted: true,
};

const profile = {
  exists: true,
  onboardingCompleted: true,
  aiNickname: "Alya",
  educationLevel: "form_3",
  preferredLanguage: "english",
  familiarityLevel: "beginner",
  helpTopics: ["staying_safe_online", "protecting_privacy"],
  learningStyle: "step_by_step",
  avatarPreset: null,
};

function restoreProfile(overrides = {}) {
  restoreSession.mockResolvedValue({
    ok: true,
    data: {
      user: { ...learner, ...(overrides.user || {}) },
      profile: { ...profile, ...(overrides.profile || {}) },
    },
  });
}

describe("Account Center V2", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    window.localStorage.clear();
    window.history.replaceState({}, "", "#/profile");
    window.scrollTo = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");
    restoreProfile();
    getProfile.mockResolvedValue({ ok: true, data: { profile } });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });


  test("Profile owns identity without settings forms", async () => {
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Profile" });
    const nav = screen.getByRole("navigation", { name: "Account Center" });
    expect(within(nav).getByRole("link", { name: "Profile" })).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "Settings" })).toHaveAttribute("href", "#/settings");
    expect(screen.getByLabelText(i18n.t("settings.displayName"))).toBeVisible();
    expect(screen.getByRole("group", { name: i18n.t("settings.avatar.legend") })).toBeVisible();
    expect(screen.queryByLabelText(i18n.t("settings.preferredLanguage"))).not.toBeInTheDocument();
    expect(screen.queryByLabelText(i18n.t("settings.email"))).not.toBeInTheDocument();
    expect(saveAccount).not.toHaveBeenCalled();
    expect(saveProfile).not.toHaveBeenCalled();
  });
  test("direct Settings route has shared navigation and progressive sections", async () => {
    window.history.replaceState({}, "", "#/settings");
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(screen.getByRole("navigation", { name: "Account Center" })).toBeVisible();
    expect(screen.getByLabelText(i18n.t("settings.preferredLanguage"))).toHaveValue("english");
    expect(screen.queryByLabelText(i18n.t("settings.displayName"))).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Account & Security", exact: true }));
    expect(screen.getByLabelText(i18n.t("settings.email"))).toHaveAttribute("readonly");
    expect(screen.getByRole("button", { name: i18n.t("auth.emailChange.changeAction") })).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Privacy & Guardian Link", exact: true }));
    expect(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.manage") })).toBeVisible();
    expect(saveProfile).not.toHaveBeenCalled();
  });
  test("account menu Settings is distinct and draft avatar survives view switching", async () => {
    render(<App />);
    await userEvent.click(await screen.findByRole("radio", { name: i18n.t("settings.avatar.options.explorer_peak") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("nav.accountMenu.triggerAriaLabel", { name: learner.displayName }) }));
    await userEvent.click(screen.getByRole("menuitem", { name: "Settings" }));
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(window.location.hash).toBe("#/settings");
    await userEvent.click(within(screen.getByRole("navigation", { name: "Account Center" })).getByRole("link", { name: "Profile" }));
    await screen.findByRole("heading", { level: 1, name: "Profile" });
    expect(screen.getByRole("radio", { name: i18n.t("settings.avatar.options.explorer_peak") })).toBeChecked();
    expect(saveProfile).not.toHaveBeenCalled();
  });
  test("Settings remains protected", async () => {
    restoreSession.mockResolvedValue({ ok: false, status: 401 });
    window.history.replaceState({}, "", "#/settings");
    render(<App />);
    await waitFor(() => expect(window.location.hash).toBe("#/home"));
    expect(screen.queryByRole("navigation", { name: "Account Center" })).not.toBeInTheDocument();
  });
  test("profile save reveals preference validation in Settings and focuses its field", async () => {
    saveProfile.mockResolvedValue({ ok: false, data: { error: "Check learning preferences.", errors: { educationLevel: "Choose your education level." } } });
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("settings.saveProfile") }));
    await screen.findByRole("heading", { level: 1, name: "Settings" });
    expect(await screen.findByText("Choose your education level.")).toHaveAttribute("role", "alert");
    await waitFor(() => expect(screen.getByLabelText(i18n.t("settings.educationLevel"))).toHaveFocus());
    expect(saveProfile).toHaveBeenCalledTimes(1);
  });

  test("switching Settings sections preserves an unfinished Guardian invitation without submitting", async () => {
    window.history.replaceState({}, "", "#/settings");
    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: "Privacy & Guardian Link", exact: true }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("guardianLink.actions.invite") }));
    await userEvent.type(screen.getByLabelText(i18n.t("guardianLink.fields.email")), "guardian@example.test");
    await userEvent.click(screen.getByRole("button", { name: "Learning Preferences", exact: true }));
    expect(screen.queryByRole("button", { name: i18n.t("guardianLink.actions.send") })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Privacy & Guardian Link", exact: true }));
    expect(screen.getByLabelText(i18n.t("guardianLink.fields.email"))).toHaveValue("guardian@example.test");
    expect(saveProfile).not.toHaveBeenCalled();
  });

});
