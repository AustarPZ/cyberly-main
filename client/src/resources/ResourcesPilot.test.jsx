import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { listResources } from "../api/resourceApi";
import {
  confirmLearnerActionProposal,
  createLearnerActionProposal,
  getChatConversation,
  listChatConversations,
} from "../chat/chatApi";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => {} }));

jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(),
  refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));

jest.mock("../api/resourceApi", () => ({ listResources: jest.fn() }));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(),
  getChatConversation: jest.fn(), renameChatConversation: jest.fn(),
  deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

const resources = [
  {
    id: 1,
    slug: "spot-phishing",
    categoryCode: "Scams",
    title: "Spot phishing messages",
    summary: "Check urgency, sender details, and suspicious links.",
    content: ["Pause before opening a link.", "Verify through an official channel."],
    sourceLabel: "CyberSecurity Malaysia",
    sourceUrl: "https://example.test/phishing",
  },
  {
    id: 2,
    slug: "protect-privacy",
    categoryCode: "Privacy",
    title: "Protect personal information",
    summary: "Share less and review privacy settings.",
    content: ["Review what an app needs before sharing."],
    sourceLabel: "Official privacy guide",
    sourceUrl: "https://example.test/privacy",
  },
];

async function renderResources(result = { ok: true, data: { resources } }, options = {}) {
  window.localStorage.clear();
  window.history.replaceState({}, "", "#/resources");
  await i18n.changeLanguage("en");
  restoreSession.mockResolvedValue(options.authResult || { ok: false, error: "Not authenticated" });
  listResources.mockResolvedValue(result);
  render(<App />);
  await waitFor(() => expect(listResources).toHaveBeenCalledWith({ locale: "en" }));
}

describe("Resources design foundation pilot", () => {
  let originalRequestAnimationFrame;
  let originalCancelAnimationFrame;
  let originalBodyTabIndex;

  beforeEach(() => {
    originalRequestAnimationFrame = window.requestAnimationFrame;
    originalCancelAnimationFrame = window.cancelAnimationFrame;
    originalBodyTabIndex = document.body.getAttribute("tabindex");
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false, media: query, addEventListener: jest.fn(), removeEventListener: jest.fn(),
      addListener: jest.fn(), removeListener: jest.fn(),
    }));
    window.scrollTo = jest.fn();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });
  afterEach(() => {
    if (originalRequestAnimationFrame === undefined) delete window.requestAnimationFrame;
    else window.requestAnimationFrame = originalRequestAnimationFrame;
    if (originalCancelAnimationFrame === undefined) delete window.cancelAnimationFrame;
    else window.cancelAnimationFrame = originalCancelAnimationFrame;
    if (originalBodyTabIndex === null) document.body.removeAttribute("tabindex");
    else document.body.setAttribute("tabindex", originalBodyTabIndex);
    jest.clearAllMocks();
  });

  function installAnimationFrameHarness() {
    const callbacks = new Map();
    let nextFrameId = 1;
    window.requestAnimationFrame = jest.fn(callback => {
      const frameId = nextFrameId;
      nextFrameId += 1;
      callbacks.set(frameId, callback);
      return frameId;
    });
    window.cancelAnimationFrame = jest.fn();
    return callbacks;
  }

  test("renders a compact contextual library with operable filters and resource cards", async () => {
    await renderResources();

    expect(await screen.findByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.querySelector(".resources-page .cy-context-header")).toBeInTheDocument();
    expect(document.querySelector(".resources-page .resources-legacy-hero")).not.toBeInTheDocument();

    const privacyFilter = screen.getByRole("button", { name: "Privacy & Personal Data Protection" });
    await userEvent.click(privacyFilter);
    expect(screen.queryByRole("button", { name: /Spot phishing messages/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Protect personal information/ })).toBeInTheDocument();
    expect(screen.getAllByText("Privacy & Personal Data Protection")).toHaveLength(2);
  });

  test("keeps the Resource Library behind an accessible detail dialog with a safe source link", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 480 });
    await renderResources();
    window.scrollTo.mockClear();
    await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeVisible();
    const dialog = screen.getByRole("dialog", { name: "Spot phishing messages" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Spot phishing messages" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(window.scrollY).toBe(480);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Learn more/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /Learn more/ })).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Escape closes the dialog and restores the originating card without changing Library scroll", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 360 });
    await renderResources();
    window.scrollTo.mockClear();
    const resourceCard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    await userEvent.click(resourceCard);
    await userEvent.keyboard("{Escape}");

    const restoredCard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    await waitFor(() => expect(restoredCard).toHaveFocus());
    expect(window.scrollY).toBe(360);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeInTheDocument();
  });

  test("backdrop dismissal restores the originating card after the complete mouse sequence", async () => {
    const animationFrameCallbacks = installAnimationFrameHarness();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 420 });
    await renderResources();
    window.scrollTo.mockClear();
    const resourceCard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    resourceCard.focus();
    await userEvent.click(resourceCard);
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();

    await userEvent.click(screen.getByTestId("resource-dialog-backdrop"));
    document.body.tabIndex = -1;
    document.body.focus();

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(resourceCard).not.toHaveFocus();
    Array.from(animationFrameCallbacks.values()).forEach(callback => callback(0));
    await waitFor(() => expect(resourceCard).toHaveFocus());
    expect(document.activeElement).not.toBe(document.body);
    expect(window.scrollY).toBe(420);
  });

  test("a stale restoration callback cannot steal focus from a newly opened Resource", async () => {
    const animationFrameCallbacks = installAnimationFrameHarness();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 240 });
    await renderResources();
    window.scrollTo.mockClear();
    const resourceACard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    const resourceBCard = screen.getByRole("button", { name: /Protect personal information/ });

    await userEvent.click(resourceACard);
    await userEvent.click(screen.getByTestId("resource-dialog-backdrop"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const resourceAFrameId = window.requestAnimationFrame.mock.results[0].value;
    const resourceACallback = animationFrameCallbacks.get(resourceAFrameId);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 640 });
    await userEvent.click(resourceBCard);
    expect(screen.getByRole("dialog", { name: "Protect personal information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(resourceAFrameId);

    resourceACallback(0);
    expect(screen.getByRole("dialog", { name: "Protect personal information" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(resourceACard).not.toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalledWith({ top: 240, behavior: "auto" });

    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const resourceBFrameId = window.requestAnimationFrame.mock.results[1].value;
    animationFrameCallbacks.get(resourceBFrameId)(0);
    await waitFor(() => expect(resourceBCard).toHaveFocus());
  });

  test("a same-route pending Resource target cannot run a stale focus restoration", async () => {
    const animationFrameCallbacks = installAnimationFrameHarness();
    const conversation = {
      id: 8101, title: "Resource guidance", createdAt: "2026-08-13T01:00:00.000Z",
      updatedAt: "2026-08-13T01:00:00.000Z", lastMessageAt: "2026-08-13T01:00:00.000Z", messageCount: 1,
    };
    listChatConversations.mockResolvedValue({ ok: true, conversations: [conversation] });
    getChatConversation.mockResolvedValue({
      ok: true,
      conversation,
      messages: [{
        id: 8201, conversationId: conversation.id, role: "assistant",
        content: "Use this reviewed privacy guide.", locale: "en", createdAt: "2026-08-13T01:00:00.000Z",
      }],
      actions: [{
        messageId: 8201,
        actions: [{
          id: 8401, type: "resource", labelKey: "chat.actions.openResource",
          title: "Open privacy resource", description: "Open the reviewed privacy guide.",
          target: { page: "resources", resourceSlug: "protect-privacy" }, displayOrder: 1,
        }],
      }],
      sources: [{
        messageId: 8201,
        sources: [{
          id: 8301, title: "Protect personal information", sourceLabel: "Cyberly Resource",
          sourceUrl: "https://example.test/privacy", citationOrder: 1,
          snippet: "Review what an app needs before sharing personal information.",
          internalTarget: { page: "resources", resourceSlug: "protect-privacy" },
        }],
      }],
      generations: [],
    });
    createLearnerActionProposal.mockResolvedValue({
      ok: true,
      proposal: {
        proposalId: "proposal-resource-b", confirmationToken: "fixture-token",
        actionType: "open_resource", title: "Open privacy resource",
        explanation: "Open the reviewed privacy guide.", consequence: "Navigation only.",
        status: "pending", requiresConfirmation: true,
      },
    });
    confirmLearnerActionProposal.mockResolvedValue({
      ok: true,
      proposal: { proposalId: "proposal-resource-b", status: "completed" },
      result: { target: { page: "resources", resourceSlug: "protect-privacy" } },
    });
    Object.defineProperty(window, "scrollY", { configurable: true, value: 240 });
    await renderResources(undefined, {
      authResult: {
        ok: true,
        data: {
          user: {
            id: 9001, email: "resource-learner@example.test", displayName: "Resource Learner",
            age: 16, ageGroup: "teen_16_17", role: "user", accountStatus: "active", emailVerified: true,
          },
          profile: { exists: true, onboardingCompleted: true },
        },
      },
    });
    const resourceACard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    const resourceBCard = screen.getByRole("button", { name: /Protect personal information/ });

    await userEvent.click(resourceACard);
    await userEvent.click(screen.getByTestId("resource-dialog-backdrop"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const resourceAFrameId = window.requestAnimationFrame.mock.results[0].value;
    const resourceACallback = animationFrameCallbacks.get(resourceAFrameId);

    Object.defineProperty(window, "scrollY", { configurable: true, value: 640 });
    await userEvent.click(screen.getByRole("button", { name: "Open chat widget" }));
    await waitFor(() => expect(getChatConversation).toHaveBeenCalledWith(conversation.id));
    await userEvent.click(screen.getByRole("button", { name: /open open privacy resource/i }));
    await waitFor(() => expect(createLearnerActionProposal).toHaveBeenCalled());
    await act(async () => {
      await createLearnerActionProposal.mock.results[0].value;
    });
    await userEvent.click(screen.getByRole("button", { name: /confirm/i }));
    await waitFor(() => expect(confirmLearnerActionProposal).toHaveBeenCalled());
    await act(async () => {
      await confirmLearnerActionProposal.mock.results[0].value;
    });

    expect(window.location.hash).toBe("#/resources");
    const resourceBDialog = await screen.findByRole("dialog", { name: "Protect personal information" });
    const resourceBClose = within(resourceBDialog).getByRole("button", { name: "Close" });
    expect(resourceBDialog).toBeInTheDocument();
    expect(resourceBClose).toHaveFocus();
    expect(window.cancelAnimationFrame).toHaveBeenCalledWith(resourceAFrameId);

    resourceACallback(0);
    expect(screen.getByRole("dialog", { name: "Protect personal information" })).toBeInTheDocument();
    expect(resourceBClose).toHaveFocus();
    expect(resourceACard).not.toHaveFocus();
    expect(window.scrollTo).not.toHaveBeenCalledWith({ top: 240, behavior: "auto" });

    await userEvent.click(resourceBClose);
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const resourceBFrameId = window.requestAnimationFrame.mock.results[1].value;
    animationFrameCallbacks.get(resourceBFrameId)(0);
    await waitFor(() => expect(resourceBCard).toHaveFocus());
  });

  test("opening and closing detail does not refetch, while locale changes still reload", async () => {
    await renderResources();
    await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeInTheDocument());
    expect(listResources).toHaveBeenCalledTimes(1);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Choose interface language" }), "ms");
    await waitFor(() => expect(listResources).toHaveBeenCalledWith({ locale: "ms" }));
    expect(listResources).toHaveBeenCalledTimes(2);
  });

  test("returns safely to the library when a localized catalogue no longer contains the selected Resource", async () => {
    await renderResources();
    await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));
    listResources.mockResolvedValue({ ok: true, data: { resources: [resources[1]] } });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Choose interface language" }), "ms");

    const libraryHeading = await screen.findByRole("heading", { level: 1, name: "Sumber Kesihatan Siber" });
    await waitFor(() => expect(libraryHeading).toHaveFocus());
    expect(screen.queryByRole("heading", { level: 1, name: "Spot phishing messages" })).not.toBeInTheDocument();
    expect(listResources).toHaveBeenLastCalledWith({ locale: "ms" });
  });

  test("uses canonical PageState for loading, errors, and empty results", async () => {
    let resolveResources;
    const pending = new Promise(resolve => { resolveResources = resolve; });
    await renderResources(pending);
    expect(screen.getByRole("status")).toHaveClass("page-state", "loading");

    await act(async () => resolveResources({ ok: true, data: { resources: [] } }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveClass("page-state", "empty"));
  });

  test("uses the canonical alert state when Resource loading fails", async () => {
    await renderResources({ ok: false, data: { message: "Unable to load resources." } });
    expect(await screen.findByRole("alert")).toHaveClass("page-state", "error");
  });
});
