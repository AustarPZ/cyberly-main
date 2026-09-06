import { render, screen } from "@testing-library/react";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { getProgress } from "../api/progressApi";
import { getCurrentRecommendation } from "../api/recommendationApi";
import { getAdminStatus } from "../admin/adminApi";
import { listChatConversations } from "../chat/chatApi";

jest.mock("react-markdown", () => ({ __esModule: true, default: ({ children }) => <div>{children}</div> }));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => null }));
jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(), refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(), resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));
jest.mock("../api/progressApi", () => ({ getProgress: jest.fn() }));
jest.mock("../api/recommendationApi", () => ({
  getCurrentRecommendation: jest.fn(), markRecommendationCompleted: jest.fn(), markRecommendationViewed: jest.fn(),
}));
jest.mock("../admin/adminApi", () => ({ getAdminStatus: jest.fn() }));
jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(), createChatConversation: jest.fn(), getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(), deleteChatConversation: jest.fn(), createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(), createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(), cancelLearnerActionProposal: jest.fn(),
}));

class IntersectionObserverMock {
  observe() {}
  disconnect() {}
}

const profile = {
  exists: true,
  onboardingCompleted: true,
  preferredLanguage: "english",
  familiarityLevel: "beginner",
};

function restoreAs(role) {
  restoreSession.mockResolvedValue({
    ok: true,
    data: {
      user: {
        id: role === "admin" ? 8102 : 8101,
        email: `${role}-landmark@example.test`,
        displayName: role === "admin" ? "Admin Reviewer" : "Progress Learner",
        age: 15,
        role,
        accountStatus: "active",
        emailVerified: true,
      },
      profile,
    },
  });
}

describe("AppShell route landmark ownership", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    window.scrollTo = jest.fn();
    window.IntersectionObserver = IntersectionObserverMock;
    window.matchMedia = jest.fn().mockReturnValue({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    });
    listChatConversations.mockResolvedValue({ ok: true, data: { conversations: [] } });
    await i18n.changeLanguage("en");
  });

  test("Progress leaves the application main landmark to AppShell", async () => {
    window.history.replaceState({}, "", "#/progress");
    restoreAs("user");
    getProgress.mockResolvedValue({ ok: true, data: { assessmentTopicResults: [] } });
    getCurrentRecommendation.mockResolvedValue({ ok: true, data: { recommendation: null } });

    const { container } = render(<App />);

    expect(await screen.findByRole("complementary", { name: i18n.t("progress.sectionNav.ariaLabel") })).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveClass("cy-app-shell-main");
    expect(container.querySelector(".cy-app-shell")).toBeInTheDocument();
    expect(container.querySelector(".progress-content")).toBeInTheDocument();
    expect(container.querySelector(".progress-content").tagName).not.toBe("MAIN");
    expect(Array.from(container.querySelectorAll(".nav-primary button"), item => item.textContent)).toEqual([
      "Dashboard", "Resources", "Scenarios", "Assessment", "CyberGuard", "About",
    ]);
    expect(container.querySelector('.cy-footer-links a[href="#/about"]')).toBeInTheDocument();
    expect(container.querySelector('.cy-footer-links a[href="#/resources"]')).not.toBeInTheDocument();
    expect(Array.from(container.querySelectorAll('.navbar button, .cy-footer-links a')).some(item => item.textContent === i18n.t("nav.help"))).toBe(false);
  });

  test("Admin leaves the application main landmark to AppShell", async () => {
    window.history.replaceState({}, "", "#/admin/resources");
    restoreAs("admin");
    getAdminStatus.mockReturnValue(new Promise(() => {}));

    const { container } = render(<App />);

    expect(await screen.findByRole("navigation", { name: i18n.t("admin.navigation.label") })).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByRole("main")).toHaveClass("cy-app-shell-main");
    expect(container.querySelector(".admin-workspace-main")).toBeInTheDocument();
    expect(container.querySelector(".admin-workspace-main").tagName).not.toBe("MAIN");
  });
});
