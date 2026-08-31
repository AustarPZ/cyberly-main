import { apiRequest } from "../api/apiClient";

export function createPrivacyRequest(payload) {
  return apiRequest("/api/privacy/requests", { method: "POST", body: payload });
}

export function listPrivacyRequests() {
  return apiRequest("/api/privacy/requests", { method: "GET" });
}

export function getPrivacyRequest(reference) {
  return apiRequest(`/api/privacy/requests/${encodeURIComponent(reference)}`, { method: "GET" });
}

export function cancelPrivacyRequest(reference) {
  return apiRequest(`/api/privacy/requests/${encodeURIComponent(reference)}/cancel`, { method: "POST" });
}
