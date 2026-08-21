import { act, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  cyberGuardPilotEmptyConversation,
  cyberGuardPilotProfile,
  cyberGuardPilotConversation,
  cyberGuardPilotUserMessage,
  cyberGuardPilotUser,
  renderCyberGuardPilotFixture,
} from "./cyberguardTestUtils";
import {
  createChatConversation,
  createChatUserMessage,
  generateChatAssistantReply,
} from "../chat/chatApi";
import { logout, resendVerificationEmail, restoreSession, verifyEmail } from "../api/authApi";
import { saveProfile } from "../api/profileApi";
import { maskEmailAddress } from "../utils/maskEmailAddress";

jest.mock("react-markdown", () => {
  const React = require("react");
  return {
    __esModule: true,
    default: ({ children }) => React.createElement("p", null, String(children || "")),
  };
});

jest.mock("remark-gfm", () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock("../api/authApi", () => ({
  register: jest.fn(),
  login: jest.fn(),
  restoreSession: jest.fn(),
  refreshCurrentUser: jest.fn(),
  verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(),
  logout: jest.fn(),
}));

jest.mock("../api/profileApi", () => ({
  getProfile: jest.fn(),
  saveProfile: jest.fn(),
}));

jest.mock("../chat/chatApi", () => ({
  listChatConversations: jest.fn(),
  createChatConversation: jest.fn(),
  getChatConversation: jest.fn(),
  renameChatConversation: jest.fn(),
  deleteChatConversation: jest.fn(),
  createChatUserMessage: jest.fn(),
  generateChatAssistantReply: jest.fn(),
  createLearnerActionProposal: jest.fn(),
  confirmLearnerActionProposal: jest.fn(),
  cancelLearnerActionProposal: jest.fn(),
}));

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((promiseResolve, promiseReject) => {
    resolve = promiseResolve;
    reject = promiseReject;
  });
  return { promise, resolve, reject };
}

async function openAccountMenuAndLogout() {
  await userEvent.click(await screen.findByRole("button", { name: /open account menu/i }));
  await userEvent.click(await screen.findByRole("menuitem", { name: /log out/i }));
  await userEvent.click(await screen.findByRole("button", { name: /^log out$/i }));
}

function expectTokenNotExposed(token) {
  expect(document.body).not.toHaveTextContent(token);
  expect(window.location.hash).not.toContain(token);
  document.querySelectorAll("[aria-label], [title], input, textarea").forEach(element => {
    expect(element.getAttribute("aria-label") || "").not.toContain(token);
    expect(element.getAttribute("title") || "").not.toContain(token);
    expect(element.value || "").not.toContain(token);
  });
}

const VERIFICATION_RESULT_STORAGE_KEY = "cyberly.emailVerificationResult";

describe("CyberGuard email verification frontend integration", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test("unverified users can view history but cannot trigger new CyberGuard generation", async () => {
    await renderCyberGuardPilotFixture({
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      activeConversation: cyberGuardPilotEmptyConversation,
      conversations: [cyberGuardPilotEmptyConversation],
      messages: [],
    });

    expect(screen.getByRole("log", { name: /chat message history/i })).toBeInTheDocument();
    expect(screen.getAllByText(/verify your email/i).length).toBeGreaterThan(0);

    const composer = screen.getByRole("textbox", { name: /type your chat message/i });
    expect(composer).toBeDisabled();
    expect(screen.getByRole("button", { name: /send chat message/i })).toBeDisabled();

    await userEvent.type(composer, "Can you help me check a suspicious SMS?");
    await userEvent.click(screen.getByRole("button", { name: /send chat message/i }));

    await waitFor(() => {
      expect(createChatUserMessage).not.toHaveBeenCalled();
      expect(generateChatAssistantReply).not.toHaveBeenCalled();
    });
  });

  test("global reminder can resend and refresh verification status", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        restoreSession: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            data: {
              user: { ...cyberGuardPilotUser, emailVerified: false, emailVerifiedAt: null },
              profile: { exists: true, onboardingCompleted: true },
            },
          })
          .mockResolvedValue({
            ok: true,
            data: {
              user: { ...cyberGuardPilotUser, emailVerified: true, emailVerifiedAt: "2026-08-03T00:00:00.000Z" },
              profile: { exists: true, onboardingCompleted: true },
            },
          }),
        resendVerificationEmail: {
          ok: true,
          data: {
            sent: false,
            cooldownSeconds: 60,
            expiresInSeconds: 86400,
            emailTransportDisabled: true,
          },
        },
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /resend verification email/i }));
    expect(await screen.findByText(/email delivery is not configured/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /i have verified/i }));
    await waitFor(() => {
      expect(screen.queryByText(/verify your email/i)).not.toBeInTheDocument();
    });
  });

  test("verification page handles success without rendering the raw token", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=secret-verification-token",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: false,
            user: {
              id: cyberGuardPilotUser.id,
              email: cyberGuardPilotUser.email,
              emailVerified: true,
              emailVerifiedAt: "2026-08-03T00:00:00.000Z",
            },
          },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("secret-verification-token");
    expect(window.location.hash).not.toContain("secret-verification-token");
    expect(verifyEmail).toHaveBeenCalledWith("secret-verification-token");
  });

  test("StrictMode URL cleanup keeps a valid verification result and sends the original token once", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=strict-mode-token",
      strictMode: true,
      user: {
        ...cyberGuardPilotUser,
        email: "wenzhenpuah@gmail.com",
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        restoreSession: jest.fn()
          .mockResolvedValueOnce({
            ok: true,
            data: {
              user: {
                ...cyberGuardPilotUser,
                email: "wenzhenpuah@gmail.com",
                emailVerified: false,
                emailVerifiedAt: null,
              },
              profile: cyberGuardPilotProfile,
            },
          })
          .mockResolvedValue({
            ok: true,
            data: {
              user: {
                ...cyberGuardPilotUser,
                email: "wenzhenpuah@gmail.com",
                emailVerified: true,
                emailVerifiedAt: "2026-08-06T14:30:00.000Z",
              },
              profile: cyberGuardPilotProfile,
            },
          }),
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: false,
            user: {
              id: cyberGuardPilotUser.id,
              email: "wenzhenpuah@gmail.com",
              emailVerified: true,
              emailVerifiedAt: "2026-08-06T14:30:00.000Z",
            },
          },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(screen.getByText(/CyberGuard is now available for your account/i)).toBeInTheDocument();
    expect(screen.queryByText(/verification link is invalid/i)).not.toBeInTheDocument();
    expect(verifyEmail).toHaveBeenCalledTimes(1);
    expect(verifyEmail).toHaveBeenCalledWith("strict-mode-token");
    expectTokenNotExposed("strict-mode-token");
    expect(screen.queryByText(/check your inbox/i)).not.toBeInTheDocument();
  });

  test("verification page handles already verified tokens as a non-error success state", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=already-verified-token",
      user: null,
      authResult: { ok: false, data: null },
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: true,
          },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: /email already verified/i })).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expectTokenNotExposed("already-verified-token");
  });

  test("verified result survives a same-tab reload without verifying the token again", async () => {
    const first = await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=reload-valid-token",
      user: { ...cyberGuardPilotUser, emailVerified: false, emailVerifiedAt: null },
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: false,
            user: { ...cyberGuardPilotUser, emailVerified: true, emailVerifiedAt: "2026-08-08T01:00:00.000Z" },
          },
        },
      },
    });
    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    first.unmount();

    await renderCyberGuardPilotFixture({
      route: "#/verify-email",
      user: { ...cyberGuardPilotUser, emailVerified: true, emailVerifiedAt: "2026-08-08T01:00:00.000Z" },
      preserveSessionStorage: true,
    });

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(screen.queryByText(/verification link is invalid/i)).not.toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  test("already-verified result survives a same-tab reload", async () => {
    const first = await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=reload-used-token",
      user: null,
      authResult: { ok: false, data: null },
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: { verified: true, alreadyVerified: true },
        },
      },
    });
    expect(await screen.findByRole("heading", { name: /email already verified/i })).toBeInTheDocument();
    first.unmount();

    await renderCyberGuardPilotFixture({
      route: "#/verify-email",
      user: null,
      authResult: { ok: false, data: null },
      preserveSessionStorage: true,
    });

    expect(await screen.findByRole("heading", { name: /email already verified/i })).toBeInTheDocument();
    expect(screen.queryByText(/verification link is invalid/i)).not.toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  test("different-account result survives reload without storing or restoring account identity", async () => {
    const accountB = {
      ...cyberGuardPilotUser,
      id: 9101,
      email: "accountb@example.test",
      emailVerified: false,
      emailVerifiedAt: null,
    };
    const first = await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=account-a-private-token",
      user: accountB,
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: false,
            user: {
              id: 9102,
              email: "accounta@example.test",
              emailVerified: true,
              emailVerifiedAt: "2026-08-08T01:00:00.000Z",
            },
          },
        },
      },
    });
    expect(await screen.findByText(/belongs to another account/i)).toBeInTheDocument();

    const storedValue = window.sessionStorage.getItem(VERIFICATION_RESULT_STORAGE_KEY);
    expect(storedValue).not.toBeNull();
    expect(JSON.parse(storedValue)).toMatchObject({ status: "verified", differentAccount: true });
    expect(storedValue).not.toContain("account-a-private-token");
    expect(storedValue).not.toContain("accounta@example.test");
    expect(storedValue).not.toContain("9102");
    expect(storedValue).not.toContain("emailVerifiedAt");
    expect(storedValue).not.toMatch(/smtp|provider|tokenHash/i);
    first.unmount();

    await renderCyberGuardPilotFixture({
      route: "#/verify-email",
      user: accountB,
      preserveSessionStorage: true,
    });

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(screen.getByText(/belongs to another account/i)).toBeInTheDocument();
    expect(screen.getByText("acco****@example.test")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("accounta@example.test");
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  test("expired persisted result is removed and a direct tokenless route remains invalid", async () => {
    const expiredRecord = JSON.stringify({
      status: "verified",
      differentAccount: false,
      createdAt: Date.now() - (5 * 60 * 1000) - 1,
    });

    await renderCyberGuardPilotFixture({
      route: "#/verify-email",
      user: null,
      authResult: { ok: false, data: null },
      sessionStorageEntries: [[VERIFICATION_RESULT_STORAGE_KEY, expiredRecord]],
    });

    expect(await screen.findByRole("heading", { name: /verification link is invalid/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(VERIFICATION_RESULT_STORAGE_KEY)).toBeNull();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  test("logout clears a persisted verification result", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=logout-result-token",
      user: { ...cyberGuardPilotUser, emailVerified: false, emailVerifiedAt: null },
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: false,
            user: { ...cyberGuardPilotUser, emailVerified: true, emailVerifiedAt: "2026-08-08T01:00:00.000Z" },
          },
        },
      },
    });
    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(window.sessionStorage.getItem(VERIFICATION_RESULT_STORAGE_KEY)).not.toBeNull();

    await openAccountMenuAndLogout();

    await waitFor(() => {
      expect(window.sessionStorage.getItem(VERIFICATION_RESULT_STORAGE_KEY)).toBeNull();
      expect(window.location.hash).toBe("#/home");
    });
  });

  test("a new verification token supersedes a prior persisted result", async () => {
    const previousRecord = JSON.stringify({
      status: "verified",
      differentAccount: true,
      createdAt: Date.now(),
    });
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=new-verification-token",
      user: null,
      authResult: { ok: false, data: null },
      sessionStorageEntries: [[VERIFICATION_RESULT_STORAGE_KEY, previousRecord]],
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: { verified: true, alreadyVerified: true },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: /email already verified/i })).toBeInTheDocument();
    expect(screen.queryByText(/belongs to another account/i)).not.toBeInTheDocument();
    expect(JSON.parse(window.sessionStorage.getItem(VERIFICATION_RESULT_STORAGE_KEY))).toMatchObject({
      status: "already_verified",
      differentAccount: false,
    });
    expect(verifyEmail).toHaveBeenCalledWith("new-verification-token");
  });

  test("verification page handles missing token safely", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email",
      user: null,
      authResult: { ok: false, data: null },
    });
    expect(await screen.findByRole("heading", { name: /verification link is invalid/i })).toBeInTheDocument();
    expect(verifyEmail).not.toHaveBeenCalled();
  });

  test("verification page handles expired token safely", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=expired-token",
      user: null,
      authResult: { ok: false, data: null },
      authOverrides: {
        verifyEmail: {
          ok: false,
          status: 410,
          data: {
            error: {
              code: "EMAIL_VERIFICATION_TOKEN_EXPIRED",
              message: "Verification token has expired.",
            },
            canResend: true,
          },
        },
      },
    });
    expect(await screen.findByRole("heading", { name: /verification link expired/i })).toBeInTheDocument();
    expectTokenNotExposed("expired-token");
  });

  test("verification page handles revoked, invalid, and generic failures without leaking backend detail", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=revoked-token",
      user: null,
      authResult: { ok: false, data: null },
      authOverrides: {
        verifyEmail: {
          ok: false,
          status: 410,
          data: {
            error: {
              code: "EMAIL_VERIFICATION_TOKEN_REVOKED",
              message: "internal revoked account detail",
            },
            canResend: true,
          },
        },
      },
    });
    expect(await screen.findByRole("heading", { name: /verification link replaced/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in to resend/i })).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("internal revoked account detail");
    expectTokenNotExposed("revoked-token");
  });

  test("verification page exposes one focused result heading and keyboard actions", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=focus-token",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        verifyEmail: {
          ok: false,
          status: 500,
          data: {
            error: {
              code: "EMAIL_VERIFICATION_UNKNOWN_FAILURE",
              message: "database stack trace should not render",
            },
          },
        },
      },
    });

    const resultHeading = await screen.findByRole("heading", { name: /verification link is invalid/i });
    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(resultHeading).toBe(headings[0]);
    await waitFor(() => expect(resultHeading).toHaveFocus());
    expect(screen.getByRole("button", { name: /continue to cyberguard/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /go to dashboard/i })).toBeEnabled();
    expect(document.body).not.toHaveTextContent("database stack trace should not render");
    expectTokenNotExposed("focus-token");
  });

  test("verification page success for another account does not replace the current session", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/verify-email?token=other-account-token",
      user: {
        ...cyberGuardPilotUser,
        id: 9001,
        email: "current@example.test",
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        verifyEmail: {
          ok: true,
          data: {
            verified: true,
            alreadyVerified: false,
            user: {
              id: 9002,
              email: "other@example.test",
              emailVerified: true,
              emailVerifiedAt: "2026-08-03T00:00:00.000Z",
            },
          },
        },
      },
    });

    expect(await screen.findByRole("heading", { name: /email verified/i })).toBeInTheDocument();
    expect(screen.getByText(/belongs to another account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/open account menu for CyberGuard Learner/i)).toBeInTheDocument();
    expect(screen.getByText("curr***@example.test")).toBeInTheDocument();
    expectTokenNotExposed("other-account-token");
  });

  test("email masking preserves the approved prefix and conservatively masks short or invalid addresses", () => {
    expect(maskEmailAddress("wenzhenpuah@gmail.com")).toBe("wenz*******@gmail.com");
    expect(maskEmailAddress("sarahteen@gmail.com")).toBe("sara*****@gmail.com");
    expect(maskEmailAddress("abcdefgh@example.com")).toBe("abcd****@example.com");
    expect(maskEmailAddress("a@example.com")).toBe("*@example.com");
    expect(maskEmailAddress("ab@example.com")).toBe("a*@example.com");
    expect(maskEmailAddress("abc@example.com")).toBe("a**@example.com");
    expect(maskEmailAddress("abcd@example.com")).toBe("a***@example.com");
    expect(maskEmailAddress("missing-domain")).toBe("");
    expect(maskEmailAddress()).toBe("");
  });

  test("verification reminder derives its mask from the current user email and clears it on logout", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        email: "wenzhenpuah@gmail.com",
        emailVerified: false,
        emailVerifiedAt: null,
      },
    });

    expect(await screen.findByText("wenz*******@gmail.com")).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("wh********@gmail.com");

    await openAccountMenuAndLogout();

    await waitFor(() => {
      expect(screen.queryByText("wenz*******@gmail.com")).not.toBeInTheDocument();
    });
  });

  test("switching authenticated fixtures replaces the old masked email", async () => {
    const first = await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        id: 8101,
        email: "wenzhenpuah@gmail.com",
        emailVerified: false,
        emailVerifiedAt: null,
      },
    });
    expect(await screen.findByText("wenz*******@gmail.com")).toBeInTheDocument();
    first.unmount();

    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        id: 8102,
        email: "sarahteen@gmail.com",
        emailVerified: false,
        emailVerifiedAt: null,
      },
    });

    expect(await screen.findByText("sara*****@gmail.com")).toBeInTheDocument();
    expect(screen.queryByText("wenz*******@gmail.com")).not.toBeInTheDocument();
  });

  test("resend success starts cooldown and does not claim delivery when transport is disabled", async () => {
    jest.useFakeTimers();
    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        resendVerificationEmail: {
          ok: true,
          data: {
            sent: true,
            cooldownSeconds: 2,
          },
        },
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /resend verification email/i }));
    expect(await screen.findByText(/new verification email was sent/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wait 2s/i })).toBeDisabled();
    act(() => jest.advanceTimersByTime(2000));
    expect(await screen.findByRole("button", { name: /resend verification email/i })).toBeEnabled();
    jest.useRealTimers();
  });

  test("resend cooldown errors respect retry-after and hide internal provider detail", async () => {
    jest.useFakeTimers();
    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        resendVerificationEmail: {
          ok: false,
          status: 429,
          data: {
            error: {
              code: "EMAIL_VERIFICATION_RESEND_COOLDOWN",
              message: "SMTP quota says wait",
            },
            retryAfterSeconds: 2,
          },
        },
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /resend verification email/i }));
    expect(await screen.findByText(/wait 2 seconds/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /wait 2s/i })).toBeDisabled();
    expect(document.body).not.toHaveTextContent("SMTP quota says wait");
    act(() => jest.advanceTimersByTime(2000));
    expect(await screen.findByRole("button", { name: /resend verification email/i })).toBeEnabled();
    jest.useRealTimers();
  });

  test("resend safe send-failure metadata shows failure copy without provider details", async () => {
    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        resendVerificationEmail: {
          ok: true,
          data: {
            sent: false,
            cooldownSeconds: 60,
            expiresInSeconds: 86400,
            emailTransportDisabled: false,
            emailSendFailed: true,
            error: {
              message: "SMTP authentication failed for SMTP_PASSWORD",
            },
          },
        },
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /resend verification email/i }));
    expect(await screen.findByText(/we could not send the verification email/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/new verification email was sent/i);
    expect(document.body).not.toHaveTextContent(/SMTP/i);
    expect(document.body).not.toHaveTextContent(/SMTP_PASSWORD/i);
  });

  test("registration safe send-failure metadata shows failure copy after onboarding", async () => {
    saveProfile.mockResolvedValue({
      ok: true,
      data: {
        profile: cyberGuardPilotProfile,
      },
    });

    const { container } = await renderCyberGuardPilotFixture({
      route: "#/login",
      user: null,
      authResult: { ok: false, data: null },
      authOverrides: {
        register: {
          ok: true,
          data: {
            user: {
              ...cyberGuardPilotUser,
              email: "failed-send@example.test",
              emailVerified: false,
              emailVerifiedAt: null,
            },
            profile: null,
            verification: {
              emailSent: false,
              emailTransportDisabled: false,
              emailSendFailed: true,
            },
          },
        },
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /create an account/i }));
    await userEvent.type(container.querySelector('[data-field="email"]'), "failed-send@example.test");
    await userEvent.type(container.querySelector('[data-field="displayName"]'), "Failed Send Learner");
    await userEvent.type(container.querySelector('[data-field="age"]'), "16");
    await userEvent.type(container.querySelector('[data-field="password"]'), "Password123");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.type(container.querySelector('[data-field="aiNickname"]'), "CyberGuard");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /form 3/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /^english$/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /beginner/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /avoiding scams/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /step-by-step guidance/i }));
    await userEvent.click(screen.getByRole("button", { name: /let/i }));

    expect(await screen.findByText(/we could not send the verification email/i)).toBeInTheDocument();
    expect(document.body).not.toHaveTextContent(/new verification email was sent/i);
  });

  test("late refresh response after logout cannot restore the old authenticated user", async () => {
    const refresh = deferred();
    restoreSession
      .mockResolvedValueOnce({
        ok: true,
        data: {
          user: { ...cyberGuardPilotUser, emailVerified: false, emailVerifiedAt: null },
          profile: cyberGuardPilotProfile,
        },
      })
      .mockReturnValueOnce(refresh.promise);

    await renderCyberGuardPilotFixture({
      route: "#/ai-chat",
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      authOverrides: {
        restoreSession,
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /i have verified/i }));
    await openAccountMenuAndLogout();

    await act(async () => {
      refresh.resolve({
        ok: true,
        data: {
          user: { ...cyberGuardPilotUser, emailVerified: true, emailVerifiedAt: "2026-08-03T00:00:00.000Z" },
          profile: cyberGuardPilotProfile,
        },
      });
      await refresh.promise;
    });

    await waitFor(() => {
      expect(screen.queryByLabelText(/open account menu for CyberGuard Learner/i)).not.toBeInTheDocument();
    });
  });

  test("unverified users cannot retry a failed CyberGuard generation", async () => {
    await renderCyberGuardPilotFixture({
      user: {
        ...cyberGuardPilotUser,
        emailVerified: false,
        emailVerifiedAt: null,
      },
      messages: [cyberGuardPilotUserMessage],
      chatOverrides: {
        getChatConversation: () => Promise.resolve({
          ok: true,
          conversation: cyberGuardPilotConversation,
          messages: [cyberGuardPilotUserMessage],
          actions: [],
          sources: [],
          generations: [{
            id: 8801,
            conversationId: cyberGuardPilotConversation.id,
            userMessageId: cyberGuardPilotUserMessage.id,
            status: "failed",
            errorCode: "AI_PROVIDER_UNAVAILABLE",
          }],
        }),
      },
    });

    const retryButton = await screen.findByRole("button", { name: /retry cyberguard reply/i });
    expect(retryButton).toBeDisabled();
    await userEvent.click(retryButton);
    expect(generateChatAssistantReply).not.toHaveBeenCalled();
  });

  test("registration verification metadata is shown after account creation and onboarding", async () => {
    saveProfile.mockResolvedValue({
      ok: true,
      data: {
        profile: cyberGuardPilotProfile,
      },
    });

    const { container } = await renderCyberGuardPilotFixture({
      route: "#/login",
      user: null,
      authResult: { ok: false, data: null },
      authOverrides: {
        register: {
          ok: true,
          data: {
            user: {
              ...cyberGuardPilotUser,
              email: "new-learner@example.test",
              emailVerified: false,
              emailVerifiedAt: null,
            },
            profile: null,
            verification: {
              emailSent: true,
              emailTransportDisabled: false,
            },
          },
        },
      },
    });

    await userEvent.click(await screen.findByRole("button", { name: /create an account/i }));
    await userEvent.type(container.querySelector('[data-field="email"]'), "new-learner@example.test");
    await userEvent.type(container.querySelector('[data-field="displayName"]'), "New Learner");
    await userEvent.type(container.querySelector('[data-field="age"]'), "16");
    await userEvent.type(container.querySelector('[data-field="password"]'), "Password123");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.type(container.querySelector('[data-field="aiNickname"]'), "CyberGuard");
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /form 3/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /^english$/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /beginner/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /avoiding scams/i }));
    await userEvent.click(screen.getByRole("button", { name: /continue/i }));
    await userEvent.click(screen.getByRole("button", { name: /step-by-step guidance/i }));
    await userEvent.click(screen.getByRole("button", { name: /let/i }));

    expect(await screen.findByText(/new verification email was sent/i)).toBeInTheDocument();
    expect(screen.getByText("new-*******@example.test")).toBeInTheDocument();
    expect(screen.getByText(/verify your email/i)).toBeInTheDocument();
  });
});
