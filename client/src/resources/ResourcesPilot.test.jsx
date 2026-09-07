import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { listResources, getResourceBySlug } from "../api/resourceApi";
import {
  getChatConversation, createLearnerActionProposal, confirmLearnerActionProposal,
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

jest.mock("../api/resourceApi", () => ({ listResources: jest.fn(), getResourceBySlug: jest.fn() }));
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


beforeEach(async () => {
  jest.clearAllMocks(); window.localStorage.clear(); window.sessionStorage.clear();
  window.history.replaceState({}, "", "#/resources"); await i18n.changeLanguage("en");
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  restoreSession.mockResolvedValue({ ok: false });
  listResources.mockResolvedValue({ ok: true, data: { resources } });
  getResourceBySlug.mockImplementation(slug => Promise.resolve({ ok: true, data: { resource: { ...resources.find(r => r.slug === slug), relatedScenario: null } } }));
  listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
});

test("real categories filter library without fetching detail per card", async () => {
  render(<App />);
  await screen.findByRole("button", { name: /Spot phishing messages/ });
  await userEvent.click(screen.getByRole("button", { name: "Privacy & Personal Data Protection" }));
  expect(screen.queryByRole("button", { name: /Spot phishing messages/ })).toBeNull();
  expect(screen.getByRole("button", { name: /Protect personal information/ })).toBeInTheDocument();
  expect(getResourceBySlug).not.toHaveBeenCalled();
});

test("card routes to reader; browser Back and Forward restore addressable pages", async () => {
  render(<App />);
  await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));
  await screen.findByRole("heading", { level: 1, name: resources[0].title });
  expect(window.location.hash).toBe("#/resources/spot-phishing");
  expect(screen.queryByRole("dialog")).toBeNull();
  act(() => window.history.back());
  await screen.findByRole("heading", { name: "Cyber Wellness Resources" });
  act(() => window.history.forward());
  await screen.findByRole("heading", { level: 1, name: resources[0].title });
  expect(document.querySelectorAll("main")).toHaveLength(1);
});

test("direct reader refresh uses detail without a list dependency", async () => {
  window.history.replaceState({}, "", "#/resources/spot-phishing");
  const first = render(<App />);
  await screen.findByText(resources[0].title);
  first.unmount(); render(<App />);
  await screen.findByText(resources[0].title);
  expect(window.location.hash).toBe("#/resources/spot-phishing");
  expect(listResources).not.toHaveBeenCalled();
  expect(getResourceBySlug).toHaveBeenCalledTimes(2);
});

test.each([{ resourceSlug: "protect-privacy" }, { resourceId: 2 }])("existing CyberGuard Resource target resolves to addressable detail: %j", async target => {
  restoreSession.mockResolvedValue({ ok: true, data: {
    user: { id: 9001, email: "controlled@example.test", displayName: "Learner", age: 15, emailVerified: true },
    profile: { onboardingCompleted: true, preferredLanguage: "english" },
  } });
  const conversation = { id: 8101, title: "Resource guidance", messageCount: 1 };
  listChatConversations.mockResolvedValue({ ok: true, conversations: [conversation] });
  getChatConversation.mockResolvedValue({ ok: true, conversation,
    messages: [{ id: 8201, conversationId: 8101, role: "assistant", content: "Try a privacy guide.", locale: "en" }],
    actions: [{ messageId: 8201, actions: [{ id: 8401, type: "resource", labelKey: "chat.actions.openResource", title: "Open privacy resource", target: { page: "resources", ...target }, displayOrder: 1 }] }], sources: [], generations: [],
  });
  createLearnerActionProposal.mockResolvedValue({ ok: true, proposal: { proposalId: "controlled", confirmationToken: "test-only", actionType: "open_resource", title: "Open privacy resource", explanation: "Navigation only", status: "pending", requiresConfirmation: true } });
  confirmLearnerActionProposal.mockResolvedValue({ ok: true, proposal: { proposalId: "controlled", status: "completed" }, result: { target: { page: "resources", ...target } } });
  render(<App />);
  await screen.findByRole("button", { name: /Spot phishing messages/ });
  await userEvent.click(screen.getByRole("button", { name: "Open chat widget" }));
  await userEvent.click(await screen.findByRole("button", { name: /open open privacy resource/i }));
  await userEvent.click(await screen.findByRole("button", { name: /confirm/i }));
  await waitFor(() => expect(window.location.hash).toBe("#/resources/protect-privacy"));
  expect(await screen.findByRole("heading", { level: 1, name: resources[1].title })).toBeInTheDocument();
});

test.each([['empty', { ok: true, data: { resources: [] } }, 'No resources found.'], ['error', { ok: false }, 'Unable to load resources.']])("library %s remains explicit", async (_, response, text) => {
  listResources.mockResolvedValue(response); render(<App />);
  expect(await screen.findByText(text)).toBeInTheDocument();
});
