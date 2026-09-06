const LEARNER_FIELDS = [
  "reference", "guardianEmail", "status", "locale", "invitedAt", "expiresAt",
  "updatedAt", "terminalAt", "canResend", "canRevoke",
];
const PUBLIC_FIELDS = ["learnerDisplayName", "expiresAt", "canAccept", "canDecline", "informationCode"];
const ACTIVE_STATUSES = new Set(["PENDING_VERIFICATION", "LINKED"]);
const RETRYABLE_INSPECT_CODES = new Set(["GUARDIAN_LINK_RATE_LIMITED", "GUARDIAN_LINK_UNAVAILABLE"]);
let guardianBootstrapToken = "";

function pick(value, fields) {
  if (!value || typeof value !== "object") return null;
  return fields.reduce((safe, field) => {
    safe[field] = field.startsWith("can") ? Boolean(value[field]) : (value[field] ?? null);
    return safe;
  }, {});
}

export function normalizeGuardianRelationship(value) { return pick(value, LEARNER_FIELDS); }
export function normalizePublicGuardianLink(value) { return pick(value, PUBLIC_FIELDS); }
export function isActiveGuardianRelationship(value) { return ACTIVE_STATUSES.has(value?.status); }

export function guardianErrorCode(result) {
  return result?.data?.code || result?.code || "GUARDIAN_LINK_UNAVAILABLE";
}

export function retryAfterSeconds(result, maximum = 900) {
  const raw = result?.response?.headers?.get?.("Retry-After");
  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds > 0 ? Math.min(seconds, maximum) : null;
}

export function shouldRetainGuardianTokenAfterInspect(code) {
  return RETRYABLE_INSPECT_CODES.has(code);
}

export function captureGuardianToken(hashValue) {
  const hash = String(hashValue || "");
  const queryIndex = hash.indexOf("?");
  if (queryIndex < 0) return "";
  return new URLSearchParams(hash.slice(queryIndex + 1)).get("token")?.trim() || "";
}

export function prepareGuardianRouteBootstrap(hashValue, history = typeof window === "undefined" ? null : window.history) {
  const rawHash = String(hashValue || "");
  if (!rawHash.replace(/^#\/?/, "").startsWith("guardian-link/verify")) return rawHash;
  const token = captureGuardianToken(rawHash);
  if (token) guardianBootstrapToken = token;
  const cleanHash = "#/guardian-link/verify";
  if (history && rawHash !== cleanHash) {
    history.replaceState({ ...(history.state || {}), route: cleanHash }, "", cleanHash);
  }
  return cleanHash;
}

export function adoptGuardianBootstrapToken(targetRef) {
  if (!targetRef || !guardianBootstrapToken) return false;
  targetRef.current = guardianBootstrapToken;
  guardianBootstrapToken = "";
  return true;
}

export function clearGuardianBootstrapToken(targetRef) {
  guardianBootstrapToken = "";
  if (targetRef) targetRef.current = "";
}

export function hasGuardianBootstrapToken() {
  return Boolean(guardianBootstrapToken);
}
