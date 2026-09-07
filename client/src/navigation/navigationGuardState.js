export function normalizeHashRoute(hashValue) {
  const raw = String(hashValue || "").trim();
  if (!raw) return "#/home";
  if (raw.startsWith("#/")) return raw;
  if (raw.startsWith("#")) return `#/${raw.slice(1).replace(/^\/+/, "") || "home"}`;
  return `#/${raw.replace(/^\/+/, "") || "home"}`;
}

export function parseLearningDetailRoute(hashValue, page) {
  const hash = normalizeHashRoute(hashValue);
  if (!["resources", "scenarios"].includes(page) || !hash.startsWith(`#/${page}/`)) return { nested: false, slug: null };
  const raw = hash.slice(page.length + 3);
  try {
    const slug = decodeURIComponent(raw);
    return { nested: true, slug: /^[a-z0-9][a-z0-9_-]{0,139}$/.test(slug) ? slug : null };
  } catch {
    return { nested: true, slug: null };
  }
}

export function routeIdentityFromHash(hashValue) {
  const hash = normalizeHashRoute(hashValue);
  const normalized = hash.replace(/^#\/?/, "");
  const [page = "home", section = null, rawResourceId = null, mode = null] = normalized.split("/");
  const resourceId = rawResourceId && Number.isInteger(Number(rawResourceId))
    ? Number(rawResourceId)
    : null;

  return {
    hash,
    page: page || "home",
    section,
    resourceId,
    mode,
  };
}

export function routeIdentitiesMatch(first, second) {
  return routeIdentityFromHash(first).hash === routeIdentityFromHash(second).hash;
}

export function shouldBlockRouteTransition({ blocker, acceptedHash, requestedHash }) {
  if (!blocker) return false;
  return !routeIdentitiesMatch(acceptedHash, requestedHash);
}

export function shouldGuardAction({ blocker, bypassGuard = false }) {
  return Boolean(blocker) && !bypassGuard;
}

export function resolveSessionRestoreHash({ currentHash, restoredPage, onboardingCompleted }) {
  if (!onboardingCompleted) return "#/profile";
  const normalizedHash = normalizeHashRoute(currentHash);
  if (restoredPage === "admin") return normalizedHash;
  const scenario = parseLearningDetailRoute(normalizedHash, "scenarios");
  if (restoredPage === "scenarios" && scenario.slug) return `#/scenarios/${scenario.slug}`;
  return `#/${restoredPage || "home"}`;
}

export function createPendingRouteTransition({ acceptedHash, requestedHash, requestedIndex, acceptedIndex }) {
  const hasManagedIndexes = Number.isInteger(requestedIndex) && Number.isInteger(acceptedIndex);
  return {
    type: "hash",
    acceptedHash: normalizeHashRoute(acceptedHash),
    hash: normalizeHashRoute(requestedHash),
    historyDelta: hasManagedIndexes ? requestedIndex - acceptedIndex : null,
  };
}

export function createPendingAction({ actionType, execute, guard = null, meta = null, onCancel = null }) {
  return {
    type: "action",
    actionType,
    execute,
    guard,
    meta,
    onCancel,
  };
}
