import {
  resolveLanguageAuthority,
} from "./languageAuthority";

describe("language authority", () => {
  test.each([
    [{ explicitLocale: "en", profileLanguage: "bahasa_melayu", storedLocale: "ms", browserLanguage: "zh-CN" }, "en"],
    [{ profileLanguage: "bahasa_melayu", storedLocale: "zh-CN", browserLanguage: "en" }, "ms"],
    [{ storedLocale: "ms", browserLanguage: "zh-CN" }, "ms"],
    [{ browserLanguage: "zh-CN" }, "zh-CN"],
    [{ profileLanguage: "tamil", storedLocale: "invalid", browserLanguage: "ta-IN" }, "en"],
    [{ profileLanguage: "unsupported", storedLocale: "invalid", browserLanguage: "ms-MY" }, "ms"],
  ])("resolves the approved precedence safely", (sources, expected) => {
    expect(resolveLanguageAuthority(sources)).toBe(expected);
  });
});
