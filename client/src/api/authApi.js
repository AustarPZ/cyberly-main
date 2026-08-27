import { apiRequest } from "./apiClient";

export function register(account = {}) {
  return apiRequest("/api/auth/register", {
    method: "POST",
    body: {
      email: account.email,
      displayName: account.displayName,
      password: account.password,
      age: account.age,
    },
  });
}

export function login(email, password) {
  return apiRequest("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function restoreSession() {
  return apiRequest("/api/auth/me", { method: "GET" });
}

export function refreshCurrentUser() {
  return restoreSession();
}

export function verifyEmail(token) {
  return apiRequest("/api/auth/verify-email", {
    method: "POST",
    body: { token },
  });
}

export function resendVerificationEmail() {
  return apiRequest("/api/auth/resend-verification-email", { method: "POST" });
}

export function requestPasswordReset(email, locale) {
  return apiRequest("/api/auth/forgot-password", {
    method: "POST",
    body: { email, locale },
  });
}

export function resetPassword(token, password) {
  return apiRequest("/api/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}

export function requestEmailChange(newEmail, currentPassword, locale) {
  return apiRequest("/api/auth/email-change/request", {
    method: "POST",
    body: { newEmail, currentPassword, locale },
  });
}

export function confirmEmailChange(token) {
  return apiRequest("/api/auth/email-change/confirm", {
    method: "POST",
    body: { token },
  });
}

export function logout() {
  return apiRequest("/api/auth/logout", { method: "POST" });
}
