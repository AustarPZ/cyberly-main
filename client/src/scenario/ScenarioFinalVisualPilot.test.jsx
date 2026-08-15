import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import {
  completeScenarioAttempt,
  getRecommendedScenarios,
  getScenarioAttempt,
  getScenarioAttemptResult,
  getScenarioBySlug,
  listScenarios,
  saveScenarioDecision,
  startScenarioAttempt,
} from "../api/scenarioApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/scenarioApi", () => ({
  listScenarios: jest.fn(), getRecommendedScenarios: jest.fn(), getScenarioDashboard: jest.fn(),
  getScenarioBySlug: jest.fn(), startScenarioAttempt: jest.fn(), getScenarioAttempt: jest.fn(),
  saveScenarioDecision: jest.fn(), completeScenarioAttempt: jest.fn(), getScenarioAttemptResult: jest.fn(),
}));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

const scenario = {
  id: 9,
  slug: "suspicious-bank-message",
  title: "Suspicious bank message",
  summary: "A message claims your bank account will be locked unless you act now.",
  topicCode: "phishing_and_scams",
  difficulty: "beginner",
  estimatedMinutes: 6,
  totalSteps: 2,
  latestAttempt: null,
};

const resumedScenario = {
  ...scenario,
  id: 10,
  slug: "group-chat-pressure",
  title: "Pressure in a group chat",
  topicCode: "cyberbullying",
  latestAttempt: { id: 501, status: "in_progress" },
};

const currentStep = {
  id: 301,
  stepOrder: 1,
  situationText: "The message uses your bank logo and asks for a verification code.",
  promptText: "What is the safest next step?",
  options: [
    { key: "A", text: "Reply with the verification code." },
    { key: "B", text: "Pause and verify through the bank's official app." },
  ],
};

const attemptPayload = {
  attempt: { id: 501, status: "in_progress" },
  scenario: resumedScenario,
  currentStep,
  nextStep: null,
  readyToComplete: false,
  locale: { requestedLocale: "en", resolvedLocale: "en", fallbackUsed: false },
};

const completedResult = {
  attempt: {
    id: 502,
    status: "completed",
    totalScore: 3,
    maximumScore: 4,
    percentage: 75,
    resultLevel: "developing",
  },
  scenario: { ...scenario, latestAttempt: { id: 502, status: "completed" } },
  progressImpact: { masteryDelta: 2 },
  review: [{
    id: 801,
    stepOrder: 1,
    selectedOptionKey: "B",
    recommendedOptionKey: "B",
    feedback: "You paused before responding to an urgent request.",
    safetyExplanation: "Using the official banking channel reduces impersonation risk.",
  }],
  recommendation: { reasonText: "Keep practising suspicious-message checks." },
};

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

describe("Scenario Decision Trail final visual migration", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    window.history.replaceState({}, "", "#/scenarios");
    window.scrollTo = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    window.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");

    restoreSession.mockResolvedValue({
      ok: true,
      data: {
        user: { id: 91, email: "scenario@example.test", displayName: "Alya", age: 15, role: "user", accountStatus: "active", emailVerified: true },
        profile: { exists: true, onboardingCompleted: true, familiarityLevel: "beginner", preferredLanguage: "english", learningStyle: "step_by_step", helpTopics: ["phishing"] },
      },
    });
    listScenarios.mockResolvedValue({ ok: true, data: { scenarios: [scenario, resumedScenario] } });
    getRecommendedScenarios.mockResolvedValue({ ok: true, data: { scenarios: [scenario] } });
    getScenarioBySlug.mockResolvedValue({
      ok: true,
      data: { scenario, firstStep: currentStep, locale: { requestedLocale: "en", resolvedLocale: "en", fallbackUsed: false } },
    });
    getScenarioAttempt.mockResolvedValue({ ok: true, data: attemptPayload });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("presents the Scenario library as one Decision Trail practice space without rendering mutations", async () => {
    const { container } = render(<App />);
    const heading = await screen.findByRole("heading", { level: 1, name: i18n.t("scenarios.library.title") });

    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(heading.closest(".scenario-library-header")).toBeInTheDocument();
    expect(container.querySelector(".scenario-page.scenario-page-library")).toBeInTheDocument();
    expect(container.querySelector(".scenario-library-filters")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: i18n.t("scenarios.filters.topic") })).toBeVisible();
    expect(screen.getByRole("combobox", { name: i18n.t("scenarios.filters.difficulty") })).toBeVisible();
    expect(await screen.findByText(scenario.title)).toBeVisible();
    expect(screen.getByText(resumedScenario.title)).toBeVisible();
    expect(screen.getByText(i18n.t("scenarios.library.recommended"))).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("scenarios.card.resume") })).toBeVisible();
    expect(startScenarioAttempt).not.toHaveBeenCalled();
    expect(saveScenarioDecision).not.toHaveBeenCalled();
    expect(completeScenarioAttempt).not.toHaveBeenCalled();
  });

  test("opens a situational briefing with one scenario heading and no start mutation", async () => {
    const { container } = render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("scenarios.card.start") }));

    expect(await screen.findByRole("heading", { level: 1, name: scenario.title })).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector(".scenario-briefing")).toBeInTheDocument();
    expect(screen.getByText(scenario.summary)).toBeVisible();
    expect(screen.getByText(/Scams & Social Engineering/i)).toBeVisible();
    expect(screen.getByText(i18n.t(`levels.${scenario.difficulty}`))).toBeVisible();
    expect(screen.getByText(i18n.t("scenarios.card.minutes", { count: scenario.estimatedMinutes }))).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("scenarios.library.backToLibrary") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("scenarios.intro.startPractice") })).toBeVisible();
    expect(startScenarioAttempt).not.toHaveBeenCalled();
  });

  test("restores an in-progress decision point without saving on render and keeps exit guarded", async () => {
    const { container } = render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("scenarios.card.resume") }));

    expect(await screen.findByRole("heading", { level: 1, name: currentStep.promptText })).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector(".scenario-attempt-shell")).toBeInTheDocument();
    expect(screen.getByText(currentStep.situationText)).toBeVisible();
    expect(screen.getByText(i18n.t("scenarios.attempt.stepProgress", { current: 1, total: 2 }))).toBeVisible();
    expect(screen.getByRole("button", { name: /A\. Reply with the verification code/i })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: /B\. Pause and verify/i })).toHaveAttribute("aria-pressed", "false");
    expect(saveScenarioDecision).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: i18n.t("scenarios.attempt.exit") }));
    expect(screen.getByRole("dialog", { name: i18n.t("scenarios.leaveTitle") })).toBeVisible();
    await userEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: i18n.t("scenarios.continueScenario") }));
    expect(screen.getByText(currentStep.situationText)).toBeVisible();
    expect(window.location.hash).toBe("#/scenarios");
  });

  test("preserves the decision payload and presents consequence feedback without premature completion", async () => {
    saveScenarioDecision.mockResolvedValue({
      ok: true,
      data: {
        decision: {
          feedback: "You chose a safer verification route.",
          safetyExplanation: "Official channels help you avoid urgent-message impersonation.",
          classification: "safest",
        },
        attempt: { id: 501, status: "in_progress" },
        nextStep: null,
        readyToComplete: true,
      },
    });

    const { container } = render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("scenarios.card.resume") }));
    const option = await screen.findByRole("button", { name: /B\. Pause and verify/i });
    await userEvent.click(option);
    expect(option).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("scenarios.attempt.confirmChoice") }));

    await waitFor(() => expect(saveScenarioDecision).toHaveBeenCalledTimes(1));
    expect(saveScenarioDecision).toHaveBeenCalledWith(501, {
      stepId: 301,
      selectedOptionKey: "B",
    }, { locale: "en" });
    expect(container.querySelector(".scenario-feedback")).toBeInTheDocument();
    expect(screen.getByText(i18n.t("scenarios.attempt.outcomes.safest"))).toBeVisible();
    expect(screen.getByText("You chose a safer verification route.")).toBeVisible();
    expect(screen.getByText("Official channels help you avoid urgent-message impersonation.")).toBeVisible();
    expect(completeScenarioAttempt).not.toHaveBeenCalled();
  });

  test("completes only from the existing final feedback lifecycle point", async () => {
    saveScenarioDecision.mockResolvedValue({
      ok: true,
      data: {
        decision: { feedback: "Safer choice.", safetyExplanation: "Verify independently.", classification: "safest" },
        attempt: { id: 501, status: "in_progress" }, nextStep: null, readyToComplete: true,
      },
    });
    completeScenarioAttempt.mockResolvedValue({ ok: true, data: completedResult });

    render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("scenarios.card.resume") }));
    await userEvent.click(await screen.findByRole("button", { name: /B\. Pause and verify/i }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("scenarios.attempt.confirmChoice") }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("scenarios.attempt.complete") }));

    await waitFor(() => expect(completeScenarioAttempt).toHaveBeenCalledTimes(1));
    expect(completeScenarioAttempt).toHaveBeenCalledWith(501, { locale: "en" });
    expect(await screen.findByText("75%")).toBeVisible();
  });

  test("presents a completed scenario as a reflective review with canonical evidence", async () => {
    listScenarios.mockResolvedValue({
      ok: true,
      data: { scenarios: [{ ...scenario, latestAttempt: { id: 502, status: "completed" } }] },
    });
    getScenarioAttemptResult.mockResolvedValue({ ok: true, data: completedResult });

    const { container } = render(<App />);
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("scenarios.card.viewResult") }));

    expect(await screen.findByRole("heading", { level: 1, name: scenario.title })).toBeVisible();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(container.querySelector(".scenario-result-summary")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeVisible();
    expect(screen.getByText(i18n.t("scenarioResults.developing"))).toBeVisible();
    expect(container.querySelectorAll(".scenario-result-review")).toHaveLength(1);
    expect(screen.getByText(completedResult.review[0].feedback)).toBeVisible();
    expect(screen.getByText(completedResult.review[0].safetyExplanation)).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("scenarios.result.returnToLibrary") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("scenarios.result.viewProgress") })).toBeVisible();
    expect(startScenarioAttempt).not.toHaveBeenCalled();
    expect(saveScenarioDecision).not.toHaveBeenCalled();
    expect(completeScenarioAttempt).not.toHaveBeenCalled();
  });
});
