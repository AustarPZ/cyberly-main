import en from "../i18n/locales/en.json";
import ms from "../i18n/locales/ms.json";
import zh from "../i18n/locales/zh-CN.json";

test.each([["en", en], ["ms", ms], ["zh-CN", zh]])("%s includes the corrected Guardian semantics", (_locale, messages) => {
  expect(messages.guardianLink.fields).toEqual(expect.objectContaining({ invited: expect.any(String), expires: expect.any(String), terminalAt: expect.any(String), updated: expect.any(String) }));
  expect(messages.guardianLink.verify.expires).toContain("{{date}}");
  expect(messages.guardianLink.verify.errors).toEqual(expect.objectContaining({ network: expect.any(String), GUARDIAN_LINK_RATE_LIMITED: expect.any(String) }));
  expect(messages.guardianLink.errors).toEqual(expect.objectContaining({ EMAIL_VERIFICATION_REQUIRED: expect.any(String), EMAIL_SEND_FAILED: expect.any(String) }));
  expect(messages.guardianLink.description).toMatch(/optional|pilihan|可选/);
  expect(messages.guardianLink.description).toMatch(/Guardian account|akaun Penjaga|监护人账户/);
  expect(messages.guardianLink.description).toMatch(/Privacy Requests|Permintaan Privasi|隐私申请/);
  expect(messages.guardianLink.verify.boundary).toMatch(/parenthood|ibu atau bapa|亲子关系/);
  expect(messages.guardianLink.verify.boundary).toMatch(/Guardian account|akaun Penjaga|监护人账户/);
});

test("uses only the frozen Guardian terminology in Simplified Chinese disclosure surfaces", () => {
  expect(zh.guardianLink.description).toContain("监护人关联");
  expect(zh.guardianLink.verify.invitedBy).toContain("监护人关联");
  expect(zh.guardianLink.verify.boundary).toContain("监护人关联");
  expect(JSON.stringify(zh.guardianLink)).not.toContain("监护人链接");
});
