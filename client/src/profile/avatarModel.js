export const AVATAR_PRESET_IDS = Object.freeze([
  "explorer_orbit",
  "explorer_peak",
  "explorer_compass",
  "explorer_spark",
  "explorer_wave",
  "explorer_horizon",
]);

const AVATAR_PRESET_ID_SET = new Set(AVATAR_PRESET_IDS);

export function normalizeAvatarPreset(value) {
  return typeof value === "string" && AVATAR_PRESET_ID_SET.has(value) ? value : null;
}

export function getInitialAvatarText(displayName) {
  const trimmed = String(displayName ?? "").trim();
  const firstCodePoint = Array.from(trimmed)[0];
  if (!firstCodePoint) return "C";
  return Array.from(firstCodePoint.toUpperCase())[0] || "C";
}

export function resolveAvatarModel({ avatarPreset, displayName } = {}) {
  const presetId = normalizeAvatarPreset(avatarPreset);
  return presetId
    ? { type: "preset", presetId }
    : { type: "initials", text: getInitialAvatarText(displayName) };
}
