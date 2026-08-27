import {
  confirmEmailChange,
  login,
  logout,
  requestEmailChange,
  requestPasswordReset,
  register,
  resendVerificationEmail,
  refreshCurrentUser,
  restoreSession,
  resetPassword,
  verifyEmail,
} from "./authApi";
import {
  getProfile,
  saveProfile,
} from "./profileApi";
import {
  getAccount,
  saveAccount,
} from "./accountApi";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: jest.fn().mockResolvedValue(JSON.stringify(body)),
  };
}

describe("auth, profile, and account API wrappers", () => {
  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue(jsonResponse(200, {}));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("preserves auth endpoints", async () => {
    await register({ email: "a@example.com", displayName: "A", password: "pw", age: 16 });
    await login("a@example.com", "pw");
    await restoreSession();
    await logout();

    expect(global.fetch.mock.calls.map(call => [call[0], call[1].method, call[1].body])).toEqual([
      [
        "http://localhost:5000/api/auth/register",
        "POST",
        "{\"email\":\"a@example.com\",\"displayName\":\"A\",\"password\":\"pw\",\"age\":16}",
      ],
      ["http://localhost:5000/api/auth/login", "POST", "{\"email\":\"a@example.com\",\"password\":\"pw\"}"],
      ["http://localhost:5000/api/auth/me", "GET", undefined],
      ["http://localhost:5000/api/auth/logout", "POST", undefined],
    ]);
  });

  test("preserves email verification endpoints", async () => {
    await verifyEmail("token with spaces");
    await resendVerificationEmail();
    await refreshCurrentUser();

    expect(global.fetch.mock.calls.map(call => [call[0], call[1].method, call[1].body])).toEqual([
      [
        "http://localhost:5000/api/auth/verify-email",
        "POST",
        "{\"token\":\"token with spaces\"}",
      ],
      ["http://localhost:5000/api/auth/resend-verification-email", "POST", undefined],
      ["http://localhost:5000/api/auth/me", "GET", undefined],
    ]);
  });

  test("sends password reset request payloads through the shared auth transport", async () => {
    await requestPasswordReset("learner@example.test", "ms");
    await resetPassword("synthetic-reset-token", "Secure123");

    expect(global.fetch.mock.calls.map(call => [call[0], call[1]])).toEqual([
      ["http://localhost:5000/api/auth/forgot-password", expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "learner@example.test", locale: "ms" }),
      })],
      ["http://localhost:5000/api/auth/reset-password", expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "synthetic-reset-token", password: "Secure123" }),
      })],
    ]);
  });

  test("sends email change request and confirmation through the shared auth transport", async () => {
    await requestEmailChange("new@example.test", "Current123", "zh-CN");
    await confirmEmailChange("synthetic-email-change-token");

    expect(global.fetch.mock.calls.map(call => [call[0], call[1]])).toEqual([
      ["http://localhost:5000/api/auth/email-change/request", expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newEmail: "new@example.test",
          currentPassword: "Current123",
          locale: "zh-CN",
        }),
      })],
      ["http://localhost:5000/api/auth/email-change/confirm", expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: "synthetic-email-change-token" }),
      })],
    ]);
  });

  test.each([
    [requestPasswordReset, ["learner@example.test", "en"], 202, "PASSWORD_RESET_EMAIL_INVALID"],
    [requestPasswordReset, ["learner@example.test", "en"], 429, "AUTH_RATE_LIMITED"],
    [resetPassword, ["synthetic-reset-token", "Secure123"], 400, "PASSWORD_RESET_TOKEN_EXPIRED"],
    [resetPassword, ["synthetic-reset-token", "Secure123"], 400, "PASSWORD_RESET_TOKEN_INVALID_OR_UNAVAILABLE"],
    [resetPassword, ["synthetic-reset-token", "short"], 400, "PASSWORD_RESET_PASSWORD_INVALID"],
    [resetPassword, ["synthetic-reset-token", "Secure123"], 500, "INTERNAL_SERVER_ERROR"],
  ])("preserves structured password reset response metadata", async (request, args, status, code) => {
    global.fetch.mockResolvedValueOnce(jsonResponse(status, { error: { code, message: "Safe error" } }));

    const result = await request(...args);

    expect(result).toMatchObject({ ok: status < 400, status, data: { error: { code } } });
  });

  test("preserves resend cooldown error metadata", async () => {
    global.fetch.mockResolvedValueOnce(jsonResponse(429, {
      error: {
        code: "EMAIL_VERIFICATION_RESEND_COOLDOWN",
        message: "Please wait before resending.",
      },
      retryAfterSeconds: 45,
      canResend: true,
    }));

    const result = await resendVerificationEmail();

    expect(result).toMatchObject({
      ok: false,
      status: 429,
      data: {
        error: {
          code: "EMAIL_VERIFICATION_RESEND_COOLDOWN",
        },
        retryAfterSeconds: 45,
        canResend: true,
      },
    });
  });

  test("preserves profile and account endpoints", async () => {
    await getProfile();
    await saveProfile({ language: "en" });
    await getAccount();
    await saveAccount({ displayName: "A" });

    expect(global.fetch.mock.calls.map(call => [call[0], call[1].method, call[1].body])).toEqual([
      ["http://localhost:5000/api/profile", "GET", undefined],
      ["http://localhost:5000/api/profile", "PUT", "{\"language\":\"en\"}"],
      ["http://localhost:5000/api/account", "GET", undefined],
      ["http://localhost:5000/api/account", "PUT", "{\"displayName\":\"A\"}"],
    ]);
  });
});
