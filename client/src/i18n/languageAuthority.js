import {
  isSupportedLocale,
  profileLanguageToLocale,
} from "./languageMappings";

function supportedLocale(value) {
  const candidate = String(value || "").trim();
  if (isSupportedLocale(candidate)) return candidate;

  const browserBase = candidate.toLowerCase().split("-")[0];
  if (browserBase === "ms") return "ms";
  if (browserBase === "zh") return "zh-CN";
  if (browserBase === "en") return "en";
  return null;
}

function supportedProfileLocale(value) {
  const profileValue = String(value || "").trim();
  if (!["english", "bahasa_melayu", "chinese"].includes(profileValue)) return null;
  return profileLanguageToLocale(profileValue);
}

export function resolveLanguageAuthority({
  explicitLocale,
  profileLanguage,
  storedLocale,
  browserLanguage,
} = {}) {
  return supportedLocale(explicitLocale)
    || supportedProfileLocale(profileLanguage)
    || supportedLocale(storedLocale)
    || supportedLocale(browserLanguage)
    || "en";
}
