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

describe("Learner Profile final visual migration", () => {
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

  test("presents one Explorer Passport workspace without mutating account or profile data on render", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 2, name: i18n.t("settings.profileGroup") })).toBeVisible();
    const settingsGroup = screen.getByRole("heading", { level: 2, name: i18n.t("settings.settingsGroup") }).closest("section");
    expect(within(settingsGroup).getByLabelText(i18n.t("settings.email"))).toHaveAttribute("readonly");
    expect(within(settingsGroup).getByLabelText(i18n.t("settings.preferredLanguage"))).toHaveValue(profile.preferredLanguage);
    expect(heading.closest(".profile-header")).toBeInTheDocument();
    expect(within(heading.closest(".profile-header")).getByText(i18n.t("settings.learnerProfile"))).toHaveClass("cy-page-identity-label");
    expect(container.querySelector(".profile-page")).toBeInTheDocument();
    expect(container.querySelector(".profile-identity-summary")).toBeInTheDocument();
    expect(container.querySelector('.profile-page [style*="linear-gradient"]')).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: i18n.t("settings.accountInformation") })).toBeVisible();
    expect(screen.getByRole("heading", { level: 3, name: i18n.t("settings.learningPreferences") })).toBeVisible();
    expect(screen.getByDisplayValue(learner.email)).toHaveAttribute("readonly");
    expect(screen.getByDisplayValue(profile.aiNickname)).toBeVisible();
    expect(screen.getByLabelText(i18n.t("settings.educationLevel"))).toHaveValue(profile.educationLevel);
    expect(screen.getByLabelText(i18n.t("settings.preferredLanguage"))).toHaveValue(profile.preferredLanguage);
    expect(screen.getByLabelText(i18n.t("settings.familiarity"))).toHaveValue(profile.familiarityLevel);
    expect(screen.getByLabelText(i18n.t("settings.learningStyle"))).toHaveValue(profile.learningStyle);
    expect(saveAccount).not.toHaveBeenCalled();
    expect(saveProfile).not.toHaveBeenCalled();
  });

  test("offers one initials choice and six localized preset radios with a local preview", async () => {
    const { container } = render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });

    const group = screen.getByRole("group", { name: i18n.t("settings.avatar.legend") });
    expect(screen.getByRole("heading", { level: 3, name: i18n.t("settings.avatar.title") })).toBeVisible();
    const radios = within(group).getAllByRole("radio");
    expect(radios).toHaveLength(7);
    expect(radios.map(radio => radio.value)).toEqual([
      "initials",
      "explorer_orbit",
      "explorer_peak",
      "explorer_compass",
      "explorer_spark",
      "explorer_wave",
      "explorer_horizon",
    ]);
    expect(within(group).getByRole("radio", { name: i18n.t("settings.avatar.useInitials") })).toBeChecked();

    await userEvent.click(within(group).getByRole("radio", { name: i18n.t("settings.avatar.options.explorer_peak") }));
    expect(container.querySelector(".profile-avatar .avatar-visual--explorer_peak")).toBeInTheDocument();
    expect(container.querySelector(".nav-avatar .avatar-visual--explorer_peak")).not.toBeInTheDocument();
    expect(saveProfile).not.toHaveBeenCalled();
  });

  test("saves a preset and updates Profile and navbar only from the successful persisted response", async () => {
    saveProfile.mockImplementation(payload => Promise.resolve({ ok: true, data: { profile: { ...payload, exists: true } } }));
    const { container } = render(<App />);
    const preset = await screen.findByRole("radio", { name: i18n.t("settings.avatar.options.explorer_orbit") });

    await userEvent.click(preset);
    expect(container.querySelector(".profile-avatar .avatar-visual--explorer_orbit")).toBeInTheDocument();
    expect(container.querySelector(".nav-avatar .avatar-visual--explorer_orbit")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("settings.saveProfile") }));

    await waitFor(() => expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ avatarPreset: "explorer_orbit" })));
    await waitFor(() => expect(container.querySelector(".nav-avatar .avatar-visual--explorer_orbit")).toBeInTheDocument());
  });

  test("sends null for initials and preserves a pending preset preview when saving fails", async () => {
    restoreProfile({ profile: { avatarPreset: "explorer_wave" } });
    getProfile.mockResolvedValue({ ok: true, data: { profile: { ...profile, avatarPreset: "explorer_wave" } } });
    saveProfile.mockResolvedValue({ ok: false, error: "Unable to save learner profile." });
    const { container } = render(<App />);

    const initials = await screen.findByRole("radio", { name: i18n.t("settings.avatar.useInitials") });
    const spark = screen.getByRole("radio", { name: i18n.t("settings.avatar.options.explorer_spark") });
    expect(container.querySelector(".nav-avatar .avatar-visual--explorer_wave")).toBeInTheDocument();

    await userEvent.click(spark);
    await userEvent.click(screen.getByRole("button", { name: i18n.t("settings.saveProfile") }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Unable to save learner profile.");
    expect(spark).toBeChecked();
    expect(container.querySelector(".profile-avatar .avatar-visual--explorer_spark")).toBeInTheDocument();
    expect(container.querySelector(".nav-avatar .avatar-visual--explorer_wave")).toBeInTheDocument();

    saveProfile.mockResolvedValue({ ok: true, data: { profile: { ...profile, avatarPreset: null } } });
    await userEvent.click(initials);
    await userEvent.click(screen.getByRole("button", { name: i18n.t("settings.saveProfile") }));
    await waitFor(() => expect(saveProfile).toHaveBeenLastCalledWith(expect.objectContaining({ avatarPreset: null })));
  });

  test("restores a persisted preset and falls back to canonical initials for an invalid server value", async () => {
    restoreProfile({ profile: { avatarPreset: "explorer_horizon" } });
    const { container, unmount } = render(<App />);
    expect(await screen.findByRole("radio", { name: i18n.t("settings.avatar.options.explorer_horizon") })).toBeChecked();
    expect(container.querySelector(".profile-avatar .avatar-visual--explorer_horizon")).toBeInTheDocument();
    expect(container.querySelector(".nav-avatar .avatar-visual--explorer_horizon")).toBeInTheDocument();
    unmount();

    restoreProfile({ user: { displayName: "陈小明" }, profile: { avatarPreset: "https://example.test/avatar.png" } });
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });
    expect(screen.getAllByText("陈").length).toBeGreaterThanOrEqual(2);
    expect(document.querySelector(".profile-avatar .avatar-visual, .nav-avatar .avatar-visual")).not.toBeInTheDocument();
  });

  test("orders the learner account menu as Profile, Settings, Log out", async () => {
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });
    await userEvent.click(screen.getByRole("button", { name: i18n.t("nav.accountMenu.triggerAriaLabel", { name: learner.displayName }) }));
    const menu = screen.getByRole("menu", { name: i18n.t("nav.accountMenu.menuAriaLabel") });
    expect(within(menu).getAllByRole("menuitem").map(item => item.textContent.trim())).toEqual([
      i18n.t("nav.profile"),
      i18n.t("nav.settings"),
      i18n.t("nav.accountMenu.logOut"),
    ]);
  });

  test("global language choice updates runtime, storage, and a freshly loaded full profile", async () => {
    saveProfile.mockResolvedValue({ ok: true, data: { profile: { ...profile, preferredLanguage: "bahasa_melayu" } } });
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: i18n.t("nav.languageAriaLabel") }), "ms");

    await waitFor(() => expect(i18n.language).toBe("ms"));
    expect(window.localStorage.getItem("cyberly.uiLanguage")).toBe("ms");
    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(saveProfile).toHaveBeenCalledWith({ ...profile, preferredLanguage: "bahasa_melayu" });
  });

  test("keeps the mounted Profile language control synchronized with global language choices", async () => {
    const chineseProfile = { ...profile, preferredLanguage: "chinese" };
    restoreProfile({ profile: { preferredLanguage: "chinese" } });
    getProfile.mockResolvedValue({ ok: true, data: { profile: chineseProfile } });
    saveProfile.mockImplementation(payload => Promise.resolve({
      ok: true,
      data: { profile: { ...payload } },
    }));
    await i18n.changeLanguage("zh-CN");
    render(<App />);

    const nickname = await screen.findByDisplayValue(profile.aiNickname);
    const globalLanguage = screen.getByRole("combobox", { name: i18n.t("nav.languageAriaLabel") });
    const profileLanguage = screen.getByLabelText(i18n.t("settings.preferredLanguage"));

    await userEvent.selectOptions(globalLanguage, "en");
    await waitFor(() => expect(i18n.language).toBe("en"));
    expect(globalLanguage).toHaveValue("en");
    expect(profileLanguage).toHaveValue("english");

    await userEvent.selectOptions(globalLanguage, "ms");
    await waitFor(() => expect(i18n.language).toBe("ms"));
    expect(globalLanguage).toHaveValue("ms");
    expect(profileLanguage).toHaveValue("bahasa_melayu");

    await userEvent.selectOptions(globalLanguage, "zh-CN");
    await waitFor(() => expect(i18n.language).toBe("zh-CN"));
    expect(globalLanguage).toHaveValue("zh-CN");
    expect(profileLanguage).toHaveValue("chinese");
    expect(nickname).toHaveValue(profile.aiNickname);

    await userEvent.click(screen.getByRole("button", { name: i18n.t("settings.saveProfile") }));
    await waitFor(() => expect(saveProfile).toHaveBeenLastCalledWith({
      aiNickname: profile.aiNickname,
      educationLevel: profile.educationLevel,
      preferredLanguage: "chinese",
      familiarityLevel: profile.familiarityLevel,
      helpTopics: profile.helpTopics,
      learningStyle: profile.learningStyle,
      avatarPreset: null,
      onboardingCompleted: true,
    }));
  });

  test("keeps an explicit runtime choice when authenticated profile persistence fails", async () => {
    restoreProfile({ profile: { preferredLanguage: "chinese" } });
    getProfile.mockResolvedValue({ ok: false, error: "Unable to load profile." });
    await i18n.changeLanguage("zh-CN");
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: i18n.t("nav.languageAriaLabel") }), "en");

    await waitFor(() => expect(i18n.language).toBe("en"));
    expect(window.localStorage.getItem("cyberly.uiLanguage")).toBe("en");
    expect(screen.getByLabelText(i18n.t("settings.preferredLanguage"))).toHaveValue("english");
    expect(screen.getByRole("alert")).toHaveTextContent(i18n.t("settings.languageSaveFailed"));
    expect(screen.getByRole("alert")).toHaveClass("sr-only");
    expect(screen.getByRole("alert")).not.toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("alert")).not.toHaveStyle({ display: "none" });
    expect(screen.getByRole("alert")).not.toHaveStyle({ visibility: "hidden" });
    expect(saveProfile).not.toHaveBeenCalled();
  });

  test("Profile language control uses the same runtime and persistence authority", async () => {
    saveProfile.mockResolvedValue({ ok: true, data: { profile: { ...profile, preferredLanguage: "chinese" } } });
    render(<App />);
    const language = await screen.findByLabelText(i18n.t("settings.preferredLanguage"));

    await userEvent.selectOptions(language, "chinese");

    await waitFor(() => expect(i18n.language).toBe("zh-CN"));
    expect(window.localStorage.getItem("cyberly.uiLanguage")).toBe("zh-CN");
    expect(getProfile).toHaveBeenCalledTimes(1);
    expect(saveProfile).toHaveBeenCalledWith({ ...profile, preferredLanguage: "chinese" });
  });

  test("does not apply a delayed language write after a newer complete Profile save", async () => {
    let resolveFreshProfile;
    getProfile.mockReturnValue(new Promise(resolve => { resolveFreshProfile = resolve; }));
    saveProfile.mockResolvedValue({ ok: true, data: { profile: { ...profile, aiNickname: "Nova" } } });
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: i18n.t("nav.languageAriaLabel") }), "ms");
    const preferences = screen.getByRole("heading", { level: 3, name: i18n.t("settings.learningPreferences") }).closest("section");
    const nickname = within(preferences).getByLabelText(i18n.t("settings.aiNickname"));
    await userEvent.clear(nickname);
    await userEvent.type(nickname, "Nova");
    await userEvent.click(within(preferences).getByRole("button", { name: i18n.t("settings.saveProfile") }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));

    resolveFreshProfile({ ok: true, data: { profile } });
    await waitFor(() => expect(getProfile).toHaveBeenCalledTimes(1));
    expect(saveProfile).toHaveBeenCalledTimes(1);
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({ aiNickname: "Nova" }));
  });

  test("preserves the exact account update payload and success lifecycle", async () => {
    saveAccount.mockResolvedValue({
      ok: true,
      data: { account: { ...learner, displayName: "Alya Rahman (verified)", age: 16 } },
    });
    render(<App />);

    const section = (await screen.findByRole("heading", { level: 3, name: i18n.t("settings.accountInformation") })).closest("section");
    const displayName = within(section).getByLabelText(i18n.t("settings.displayName"));
    const age = within(section).getByLabelText(i18n.t("settings.age"));
    await userEvent.clear(displayName);
    await userEvent.type(displayName, "Alya Rahman");
    await userEvent.clear(age);
    await userEvent.type(age, "16");
    await userEvent.click(within(section).getByRole("button", { name: i18n.t("settings.saveAccount") }));

    await waitFor(() => expect(saveAccount).toHaveBeenCalledTimes(1));
    expect(saveAccount).toHaveBeenCalledWith({ displayName: "Alya Rahman", age: 16 });
    expect(await within(section).findByText(i18n.t("settings.accountSaved"))).toBeVisible();
    expect(within(section).getByLabelText(i18n.t("settings.displayName"))).toHaveValue("Alya Rahman (verified)");
  });

  test.each([12, 18])("blocks unsupported account age %i before the API call", async ageValue => {
    render(<App />);
    const section = (await screen.findByRole("heading", { level: 3, name: i18n.t("settings.accountInformation") })).closest("section");
    const age = within(section).getByLabelText(i18n.t("settings.age"));
    await userEvent.clear(age);
    await userEvent.type(age, String(ageValue));
    await userEvent.click(within(section).getByRole("button", { name: i18n.t("settings.saveAccount") }));

    expect(await within(section).findByText(i18n.t("settings.ageInvalid"))).toHaveAttribute("role", "alert");
    expect(age).toHaveFocus();
    expect(saveAccount).not.toHaveBeenCalled();
  });

  test.each([13, 17])("allows supported account age %i", async ageValue => {
    saveAccount.mockResolvedValue({
      ok: true,
      data: { account: { ...learner, age: ageValue } },
    });
    render(<App />);
    const section = (await screen.findByRole("heading", { level: 3, name: i18n.t("settings.accountInformation") })).closest("section");
    const age = within(section).getByLabelText(i18n.t("settings.age"));

    expect(age).toHaveAttribute("min", "13");
    expect(age).toHaveAttribute("max", "17");
    await userEvent.clear(age);
    await userEvent.type(age, String(ageValue));
    await userEvent.click(within(section).getByRole("button", { name: i18n.t("settings.saveAccount") }));

    await waitFor(() => expect(saveAccount).toHaveBeenCalledWith({ displayName: learner.displayName, age: ageValue }));
  });

  test("preserves the exact learner-profile payload", async () => {
    saveProfile.mockResolvedValue({ ok: true, data: { profile: { ...profile, aiNickname: "Nova" } } });
    render(<App />);

    const section = (await screen.findByRole("heading", { level: 3, name: i18n.t("settings.learningPreferences") })).closest("section");
    const nickname = within(section).getByLabelText(i18n.t("settings.aiNickname"));
    await userEvent.clear(nickname);
    await userEvent.type(nickname, "Nova");
    await userEvent.click(within(section).getByRole("button", { name: i18n.t("settings.saveProfile") }));

    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
    expect(saveProfile).toHaveBeenCalledWith({
      aiNickname: "Nova",
      educationLevel: "form_3",
      preferredLanguage: "english",
      familiarityLevel: "beginner",
      helpTopics: ["staying_safe_online", "protecting_privacy"],
      learningStyle: "step_by_step",
      avatarPreset: null,
      onboardingCompleted: true,
    });
  });

  test("exposes help-topic selection state and enforces the existing maximum of three", async () => {
    saveProfile.mockResolvedValue({ ok: true, data: { profile } });
    render(<App />);
    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });
    const phishing = screen.getByRole("button", { name: i18n.t("profileOptions.helpTopics.staying_safe_online") });
    const privacy = screen.getByRole("button", { name: i18n.t("profileOptions.helpTopics.protecting_privacy") });
    const scams = screen.getByRole("button", { name: i18n.t("profileOptions.helpTopics.avoiding_scams") });
    const cyberbullying = screen.getByRole("button", { name: i18n.t("profileOptions.helpTopics.understanding_cyber_threats") });

    expect(phishing).toHaveAttribute("aria-pressed", "true");
    expect(privacy).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(scams);
    expect(scams).toHaveAttribute("aria-pressed", "true");
    expect(cyberbullying).toBeDisabled();
    await userEvent.click(privacy);
    expect(privacy).toHaveAttribute("aria-pressed", "false");
    expect(cyberbullying).not.toBeDisabled();
    await userEvent.click(cyberbullying);
    await userEvent.click(screen.getByRole("button", { name: i18n.t("settings.saveProfile") }));
    await waitFor(() => expect(saveProfile).toHaveBeenCalledTimes(1));
    expect(saveProfile).toHaveBeenCalledWith(expect.objectContaining({
      helpTopics: ["staying_safe_online", "avoiding_scams", "understanding_cyber_threats"],
      onboardingCompleted: true,
    }));
  }, 10000);

  test("keeps server validation visible and moves focus to the named account field", async () => {
    saveAccount.mockResolvedValue({
      ok: false,
      data: { error: "Please check your account details.", errors: { displayName: "Display name is required." } },
    });
    render(<App />);
    const section = (await screen.findByRole("heading", { level: 3, name: i18n.t("settings.accountInformation") })).closest("section");
    await userEvent.click(within(section).getByRole("button", { name: i18n.t("settings.saveAccount") }));

    expect(await screen.findByText("Display name is required.")).toHaveAttribute("role", "alert");
    await waitFor(() => expect(within(section).getByLabelText(i18n.t("settings.displayName"))).toHaveFocus());
  });

  test("keeps server age validation visible and moves focus to the age field", async () => {
    saveAccount.mockResolvedValue({
      ok: false,
      data: { error: "Please check your account details.", errors: { age: "Age must be a whole number from 13 to 17." } },
    });
    render(<App />);
    const section = (await screen.findByRole("heading", { level: 3, name: i18n.t("settings.accountInformation") })).closest("section");
    await userEvent.clear(within(section).getByLabelText(i18n.t("settings.age")));
    await userEvent.type(within(section).getByLabelText(i18n.t("settings.age")), "16");
    await userEvent.click(within(section).getByRole("button", { name: i18n.t("settings.saveAccount") }));

    expect(await screen.findByText("Age must be a whole number from 13 to 17.")).toHaveAttribute("role", "alert");
    await waitFor(() => expect(within(section).getByLabelText(i18n.t("settings.age"))).toHaveFocus());
  });

  test("retains the incomplete-onboarding warning and hides the Dashboard shortcut", async () => {
    restoreProfile({ user: { onboardingCompleted: false }, profile: { onboardingCompleted: false } });
    render(<App />);

    expect(await screen.findByText(i18n.t("settings.finishOnboarding"))).toBeVisible();
    expect(screen.getByText(i18n.t("settings.finishOnboardingDescription"))).toBeVisible();
    const preferences = screen.getByRole("heading", { level: 3, name: i18n.t("settings.learningPreferences") }).closest("section");
    expect(within(preferences).queryByRole("button", { name: i18n.t("nav.dashboard") })).not.toBeInTheDocument();
  });
});
