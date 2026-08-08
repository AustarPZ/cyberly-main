import {
  login,
  logout,
  register,
  resendVerificationEmail,
  refreshCurrentUser,
  restoreSession,
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
