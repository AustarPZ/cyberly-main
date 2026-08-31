const REFERENCE_PATTERN = /^CY-PR-[0-9A-HJKMNP-TV-Z]{20}$/;
const SAFE_FIELDS = [
  "reference", "type", "subtype", "dataCategory", "detail", "status",
  "submittedAt", "updatedAt", "cancellable",
];
const SEMANTIC_FIELDS = new Set(["type", "subtype", "dataCategory", "detail"]);

function newClientRequestId() {
  if (!window.crypto?.randomUUID) throw new Error("Secure UUID generation is unavailable.");
  return window.crypto.randomUUID();
}

export function countUnicodeCodePoints(value = "") {
  return Array.from(String(value)).length;
}

export function createPrivacyDraft(type = "CORRECTION") {
  return {
    type,
    subtype: type === "DELETION" ? "WHOLE_ACCOUNT_AND_ASSOCIATED_DATA" : "ACCOUNT_OR_PROFILE_RECORD",
    dataCategory: "",
    detail: "",
    currentPassword: "",
    clientRequestId: newClientRequestId(),
    attempted: false,
  };
}

export function markPrivacyDraftAttempted(draft) {
  return { ...draft, attempted: true };
}

export function updatePrivacyDraft(draft, field, value) {
  const semanticChange = SEMANTIC_FIELDS.has(field) && draft[field] !== value;
  return {
    ...draft,
    [field]: value,
    ...(draft.attempted && semanticChange ? { clientRequestId: newClientRequestId(), attempted: false } : {}),
  };
}

export function normalizePrivacyRequest(value = {}) {
  return SAFE_FIELDS.reduce((request, key) => {
    request[key] = key === "cancellable" ? Boolean(value[key]) : (value[key] ?? null);
    return request;
  }, {});
}

export function normalizePrivacyReference(value) {
  const reference = String(value || "").trim().toUpperCase();
  return REFERENCE_PATTERN.test(reference) ? reference : null;
}

export function privacyLoginTarget(value) {
  return value === "privacy-requests" || value === "#/privacy-requests" ? "privacy-requests" : null;
}
