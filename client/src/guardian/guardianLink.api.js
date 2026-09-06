import { apiRequest } from "../api/apiClient";

export function getGuardianLink() {
  return apiRequest("/api/guardian-link", { method: "GET" });
}

export function createGuardianInvitation(payload) {
  return apiRequest("/api/guardian-link/invitations", { method: "POST", body: payload });
}

export function resendGuardianInvitation(reference) {
  return apiRequest(`/api/guardian-link/${encodeURIComponent(reference)}/resend`, { method: "POST" });
}

export function revokeGuardianLink(reference, currentPassword) {
  return apiRequest(`/api/guardian-link/${encodeURIComponent(reference)}/revoke`, {
    method: "POST",
    body: { currentPassword },
  });
}

export function inspectGuardianToken(token) {
  return apiRequest("/api/guardian-link/token/inspect", { method: "POST", body: { token } });
}

export function acceptGuardianToken(token) {
  return apiRequest("/api/guardian-link/token/accept", { method: "POST", body: { token } });
}

export function declineGuardianToken(token) {
  return apiRequest("/api/guardian-link/token/decline", { method: "POST", body: { token } });
}
