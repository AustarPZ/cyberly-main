import { act, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getProfile } from "../api/profileApi";
import { saveAccount } from "../api/accountApi";
import { listChatConversations } from "../chat/chatApi";
import {
  cancelPrivacyRequest,
  createPrivacyRequest,
  getPrivacyRequest,
  listPrivacyRequests,
} from "./privacyRequest.api";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
  requestEmailChange: jest.fn(), confirmEmailChange: jest.fn(), requestPasswordReset: jest.fn(),
  resetPassword: jest.fn(),
}));
jest.mock("../api/profileApi", () => ({ getProfile: jest.fn(), saveProfile: jest.fn() }));
jest.mock("../api/accountApi", () => ({ saveAccount: jest.fn() }));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn().mockResolvedValue({ ok: true, data: { conversations: [] } }),
  createChatConversation: jest.fn(), getChatConversation: jest.fn(), renameChatConversation: jest.fn(),
  deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(), generateChatAssistantReply: jest.fn(),
  createLearnerActionProposal: jest.fn(), confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));
jest.mock("./privacyRequest.api", () => ({
  cancelPrivacyRequest: jest.fn(),
  createPrivacyRequest: jest.fn(),
  getPrivacyRequest: jest.fn(),
  listPrivacyRequests: jest.fn(),
}));

const REQUIRED_ENGLISH_HEADINGS = [
  "Information Cyberly collects",
  "How Cyberly uses information",
  "Learning and progress information",
  "CyberGuard and AI learning features",
  "Account security and recovery",
  "Services that support Cyberly",
  "Cookies and browser storage",
  "How long information is kept",
  "Your current choices and controls",
  "Learners aged 13–17",
  "Changes to this notice",
  "Contact about privacy",
];

const PROHIBITED_CLAIMS = [
  "PDPA compliant",
  "GDPR compliant",
  "compliant with all child-data laws",
  "OpenAI never retains data",
  "OpenAI never trains on data",
  "Cyberly does not sell learner data",
  "24-hour privacy response SLA",
  "all backups are erased",
  "all provider copies are deleted",
  "automatic whole-account deletion",
];

const SECTION_NINE_FIRST_TWO = [
  "Depending on the feature, learners can currently manage information such as their display name, supported age, language, avatar, learning preferences, help topics, and verified account email.",
  "Cyberly also provides current conversation controls where available, including conversation title management, export, and deletion.",
];

const SECTION_NINE_C02 = [
  "Cyberly provides an authenticated Privacy Request workflow for unsupported correction requests and deletion requests. Learners receive a reference and can view the status of their requests.",
  "Submitting a deletion request does not immediately delete a learner’s account or learner data. Cyberly does not currently provide immediate self-service whole-account deletion, an automatic complete personal-data deletion workflow, or complete account-wide data export.",
  "Submitting a Privacy Request does not by itself guarantee removal from every supporting service or every backup. This notice does not state a guaranteed processing time, service level, or statutory deadline for a request.",
];

function prepareRoute(route, locale = "en") {
  window.localStorage.clear();
  window.sessionStorage.clear();
  window.history.replaceState({}, "", route);
  window.scrollTo = jest.fn();
  window.matchMedia = jest.fn().mockReturnValue({
    matches: false,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
  });
  return i18n.changeLanguage(locale);
}

async function renderDirectPrivacy({ locale = "en" } = {}) {
  await prepareRoute("#/privacy", locale);
  const result = render(<App />);
  await screen.findByRole("heading", { level: 1, name: i18n.t("privacyNotice.title") });
  return result;
}

const authenticatedSession = locale => ({
  ok: true,
  data: {
    user: { id: 701, email: "learner@example.test", displayName: "Learner", age: 15, emailVerified: true },
    profile: { onboardingCompleted: true, preferredLanguage: locale },
  },
});

function navigateTo(hash) {
  act(() => {
    window.location.hash = hash;
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

function createDeferredSession() {
  let resolve;
  const promise = new Promise(resolvePromise => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

describe("Privacy Notice", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
  });

  test("renders direct Privacy without starting session restoration", async () => {
    await renderDirectPrivacy();

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
    expect(restoreSession).not.toHaveBeenCalled();
    expect(listPrivacyRequests).not.toHaveBeenCalled();
    expect(createPrivacyRequest).not.toHaveBeenCalled();
    expect(getPrivacyRequest).not.toHaveBeenCalled();
    expect(cancelPrivacyRequest).not.toHaveBeenCalled();
  });

  test("defers session restoration until navigation leaves direct Privacy and attempts it once", async () => {
    await renderDirectPrivacy();
    expect(restoreSession).not.toHaveBeenCalled();
    restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });

    navigateTo("#/home");

    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
    await screen.findByRole("heading", { level: 1, name: i18n.t("home.hero.title") });
    navigateTo("#/about");
    await screen.findByRole("heading", { level: 1, name: i18n.t("about.hero.title") });
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  test("preserves a protected destination while restoring a valid session after direct Privacy", async () => {
    await renderDirectPrivacy();
    const deferredSession = createDeferredSession();
    restoreSession.mockReturnValue(deferredSession.promise);
    getProfile.mockResolvedValue({ ok: true, data: { profile: authenticatedSession("en").data.profile } });

    navigateTo("#/profile");

    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
    expect(window.location.hash).toBe("#/profile");
    expect(screen.queryByRole("heading", { level: 1, name: i18n.t("settings.title") })).not.toBeInTheDocument();
    expect(screen.getByText(i18n.t("app.checkingSession"))).toBeInTheDocument();

    act(() => deferredSession.resolve(authenticatedSession("en")));

    await screen.findByRole("heading", { level: 1, name: i18n.t("settings.title") });
    expect(window.location.hash).toBe("#/profile");
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  test("applies the existing Home fallback after protected navigation resolves unauthenticated", async () => {
    await renderDirectPrivacy();
    const deferredSession = createDeferredSession();
    restoreSession.mockReturnValue(deferredSession.promise);

    navigateTo("#/profile");

    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
    expect(window.location.hash).toBe("#/profile");
    expect(screen.queryByRole("heading", { level: 1, name: i18n.t("settings.title") })).not.toBeInTheDocument();

    act(() => deferredSession.resolve({ ok: false, error: "Not authenticated" }));

    await waitFor(() => expect(window.location.hash).toBe("#/home"));
    expect(screen.queryByRole("heading", { level: 1, name: i18n.t("settings.title") })).not.toBeInTheDocument();
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  test("retains a restored authenticated session when navigating to Privacy", async () => {
    await prepareRoute("#/home", "en");
    restoreSession.mockResolvedValue(authenticatedSession("en"));
    render(<App />);
    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));

    navigateTo("#/privacy");
    await screen.findByRole("heading", { level: 1, name: i18n.t("privacyNotice.title") });

    expect(window.location.hash).toBe("#/privacy");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
    REQUIRED_ENGLISH_HEADINGS.forEach(heading => {
      expect(screen.getByRole("heading", { level: 2, name: heading })).toBeInTheDocument();
    });
    expect(getProfile).not.toHaveBeenCalled();
    expect(saveAccount).not.toHaveBeenCalled();
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  test("preserves the frozen English disclosure boundaries and privacy contact", async () => {
    await renderDirectPrivacy();
    const article = screen.getByRole("article");

    ["OpenAI", "Render", "Aiven MySQL", "Cloudflare", "13–17", "privacy@cyberly.my"].forEach(term => {
      expect(within(article).getAllByText(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i")).length).toBeGreaterThan(0);
    });
    expect(article).toHaveTextContent("do not mean that the related database record is automatically deleted");
    expect(article).toHaveTextContent("does not currently have one uniform fixed automatic deletion period");
    SECTION_NINE_C02.forEach(paragraph => expect(article).toHaveTextContent(paragraph));
    expect(article).not.toHaveTextContent("does not currently provide a whole-account deletion feature, complete personal-data deletion workflow, complete account-wide data export, or formal privacy-request ticket workflow");
    expect(article).toHaveTextContent("does not currently provide a Guardian Link");
    expect(screen.getByRole("link", { name: "privacy@cyberly.my" })).toHaveAttribute("href", "mailto:privacy@cyberly.my");
    PROHIBITED_CLAIMS.forEach(claim => expect(article).not.toHaveTextContent(claim));
  });

  test("integrates only the frozen Section 9 replacement and public Privacy Request CTA", async () => {
    await renderDirectPrivacy();
    const section = screen.getByRole("heading", { level: 2, name: "Your current choices and controls" }).closest("section");
    const paragraphs = within(section).getAllByText((_, node) => node.tagName === "P").map(node => node.textContent);

    expect(paragraphs).toEqual([...SECTION_NINE_FIRST_TWO, ...SECTION_NINE_C02]);
    expect(within(section).getByRole("link", { name: "Manage privacy requests" })).toHaveAttribute("href", "#/privacy-requests");
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
    expect(restoreSession).not.toHaveBeenCalled();
    expect(listPrivacyRequests).not.toHaveBeenCalled();
    expect(createPrivacyRequest).not.toHaveBeenCalled();
    expect(getPrivacyRequest).not.toHaveBeenCalled();
    expect(cancelPrivacyRequest).not.toHaveBeenCalled();
  });

  test("sends a logged-out CTA visitor through the bounded Privacy Request continuation", async () => {
    restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
    await renderDirectPrivacy();

    await userEvent.click(screen.getByRole("link", { name: "Manage privacy requests" }));

    await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });
    expect(window.location.hash).toBe("#/login");
    expect(restoreSession).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("heading", { level: 1, name: i18n.t("privacyRequests.title") })).not.toBeInTheDocument();
  });

  test("opens Privacy Requests from the CTA without a second restore for an authenticated learner", async () => {
    await prepareRoute("#/home", "en");
    restoreSession.mockResolvedValue(authenticatedSession("en"));
    render(<App />);
    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
    navigateTo("#/privacy");
    await screen.findByRole("heading", { level: 1, name: i18n.t("privacyNotice.title") });

    await userEvent.click(screen.getByRole("link", { name: "Manage privacy requests" }));

    expect(await screen.findByRole("heading", { level: 1, name: i18n.t("privacyRequests.title") })).toBeVisible();
    expect(window.location.hash).toBe("#/privacy-requests");
    expect(restoreSession).toHaveBeenCalledTimes(1);
  });

  test("preserves the frozen services list and concluding paragraph order", async () => {
    await renderDirectPrivacy();
    const services = screen.getByRole("heading", { level: 2, name: "Services that support Cyberly" }).closest("section");
    const content = services.textContent;

    expect(content.indexOf("Current supporting services include:")).toBeLessThan(content.indexOf("Render for application hosting"));
    expect(content.indexOf("Cloudflare for DNS")).toBeLessThan(content.indexOf("These services support different parts"));
  });

  test.each([
    ["en", "Manage privacy requests", "does not immediately delete"],
    ["ms", "Urus permintaan privasi", "tidak memadamkan akaun atau data pelajar dengan serta-merta"],
    ["zh-CN", "管理隐私请求", "不会立即删除学习者的账户或数据"],
  ])("provides complete semantic structure in %s", async (locale, actionLabel, requestBoundary) => {
    await renderDirectPrivacy({ locale });
    const article = screen.getByRole("article");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(12);
    expect(article).toHaveTextContent("OpenAI");
    expect(article).toHaveTextContent("13–17");
    expect(article).toHaveTextContent("privacy@cyberly.my");
    expect(article).toHaveTextContent(requestBoundary);
    expect(screen.getByRole("link", { name: actionLabel })).toHaveAttribute("href", "#/privacy-requests");
    expect(article.textContent).not.toMatch(/privacyNotice\.|privacyRequests\./);
    expect(screen.getByRole("link", { name: "privacy@cyberly.my" })).toBeInTheDocument();
  });

  test("does not add Tamil resources", () => {
    expect(i18n.options.supportedLngs).not.toContain("ta");
    expect(i18n.hasResourceBundle("ta", "translation")).toBe(false);
  });

  test("uses derived-age meaning in the Malay Privacy Notice", async () => {
    await renderDirectPrivacy({ locale: "ms" });
    const article = screen.getByRole("article");

    expect(article).toHaveTextContent("kumpulan umur yang ditentukan berdasarkan umur");
    expect(article).toHaveTextContent("menentukan kumpulan umur yang berkaitan berdasarkan maklumat tersebut");
    expect(article).not.toHaveTextContent("kumpulan umur yang diterbitkan");
    expect(article).not.toHaveTextContent("menerbitkan kumpulan umur");
  });

  test.each([
    { route: "#/login", openRegistration: false },
    { route: "#/home", openRegistration: true },
  ])("provides a neutral Privacy Notice entry from $route", async ({ route, openRegistration }) => {
    window.history.replaceState({}, "", route);
    window.scrollTo = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");
    restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
    render(<App />);
    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
    if (openRegistration) {
      await userEvent.click(await screen.findByRole("button", { name: i18n.t("auth.getStarted") }));
    } else {
      await screen.findByRole("heading", { level: 1, name: i18n.t("auth.welcomeBack") });
    }

    const authPanel = document.querySelector(".cy-auth-panel");
    const authLink = within(authPanel).getByRole("link", { name: i18n.t("privacyNotice.linkLabel") });
    expect(authLink).toHaveAttribute("href", "#/privacy");
    await userEvent.click(authLink);
    await waitFor(() => expect(window.location.hash).toBe("#/privacy"));
  });

  test("provides the canonical Privacy Notice link in the global footer", async () => {
    window.history.replaceState({}, "", "#/about");
    window.scrollTo = jest.fn();
    window.matchMedia = jest.fn().mockReturnValue({ matches: false, addEventListener: jest.fn(), removeEventListener: jest.fn() });
    await i18n.changeLanguage("en");
    restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
    render(<App />);
    await waitFor(() => expect(restoreSession).toHaveBeenCalledTimes(1));
    const footer = screen.getByRole("contentinfo");
    const link = within(footer).getByRole("link", { name: i18n.t("privacyNotice.linkLabel") });
    expect(link).toHaveAttribute("href", "#/privacy");
  });
});
