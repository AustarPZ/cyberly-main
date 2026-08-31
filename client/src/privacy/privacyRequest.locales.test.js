import i18n from "../i18n";

const requiredKeys = [
  "title", "actions.newCorrection", "actions.newDeletion", "fields.reference", "fields.status",
  "fields.submitted", "fields.updated", "fields.currentPassword", "actions.withdraw",
  "deletion.warning", "guidance.description", "status.SUBMITTED", "status.UNDER_REVIEW",
  "status.NEEDS_INFORMATION", "status.COMPLETED", "status.DECLINED", "status.CANCELLED",
];

describe("Privacy Request localization", () => {
  test.each(["en", "ms", "zh-CN"])("provides complete learner-safe copy in %s", locale => {
    const bundle = i18n.getResourceBundle(locale, "translation");
    for (const key of requiredKeys) {
      const value = key.split(".").reduce((current, part) => current?.[part], bundle.privacyRequests);
      expect(typeof value).toBe("string");
      expect(value).not.toMatch(/^privacyRequests\./);
    }
    expect(bundle.privacyRequests.deletion.warning).not.toMatch(/Delete account now|Erase everything|Padam akaun sekarang/i);
    if (locale === "en") expect(bundle.privacyRequests.deletion.warning).toContain("does not immediately delete");
    if (locale === "ms") expect(bundle.privacyRequests.deletion.warning).toContain("tidak serta-merta");
    if (locale === "zh-CN") expect(bundle.privacyRequests.deletion.warning).toContain("不会立即删除");
  });

  test("does not introduce Tamil resources", () => {
    expect(i18n.options.supportedLngs).not.toContain("ta");
    expect(i18n.hasResourceBundle("ta", "translation")).toBe(false);
  });
});
