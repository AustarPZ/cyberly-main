export const EMAIL_VERIFICATION_RESULT_STORAGE_KEY = "cyberly.emailVerificationResult";
export const EMAIL_VERIFICATION_RESULT_TTL_MS = 5 * 60 * 1000;

const SAFE_STATUSES = new Set(["verified", "already_verified"]);

function resolveStorage(storage) {
  if (storage) return storage;
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function clearEmailVerificationResult(storage) {
  try {
    resolveStorage(storage)?.removeItem(EMAIL_VERIFICATION_RESULT_STORAGE_KEY);
  } catch {
    // Storage availability must not affect verification rendering.
  }
}

export function saveEmailVerificationResult(result, { storage, now = Date.now() } = {}) {
  const target = resolveStorage(storage);
  if (!target || !SAFE_STATUSES.has(result?.status) || !Number.isFinite(now)) {
    clearEmailVerificationResult(target);
    return null;
  }

  const safeResult = {
    status: result.status,
    differentAccount: Boolean(result.differentAccount),
    createdAt: now,
  };

  try {
    target.setItem(EMAIL_VERIFICATION_RESULT_STORAGE_KEY, JSON.stringify(safeResult));
    return safeResult;
  } catch {
    return null;
  }
}

export function loadEmailVerificationResult({ storage, now = Date.now() } = {}) {
  const target = resolveStorage(storage);
  if (!target || !Number.isFinite(now)) return null;

  try {
    const raw = target.getItem(EMAIL_VERIFICATION_RESULT_STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    const age = now - value?.createdAt;
    const valid = SAFE_STATUSES.has(value?.status)
      && typeof value?.differentAccount === "boolean"
      && Number.isFinite(value?.createdAt)
      && age >= 0
      && age <= EMAIL_VERIFICATION_RESULT_TTL_MS;

    if (!valid) {
      clearEmailVerificationResult(target);
      return null;
    }

    return {
      status: value.status,
      differentAccount: value.differentAccount,
      createdAt: value.createdAt,
    };
  } catch {
    clearEmailVerificationResult(target);
    return null;
  }
}
