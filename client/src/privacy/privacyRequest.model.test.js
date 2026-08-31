import {
  createPrivacyDraft,
  markPrivacyDraftAttempted,
  updatePrivacyDraft,
  normalizePrivacyRequest,
  privacyLoginTarget,
  countUnicodeCodePoints,
} from "./privacyRequest.model";

describe("Privacy Request frontend model", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { randomUUID: jest.fn() },
    });
  });

  test("reuses an attempted draft id until semantic content changes", () => {
    const uuid = jest.spyOn(global.crypto, "randomUUID")
      .mockReturnValueOnce("550e8400-e29b-41d4-a716-446655440001")
      .mockReturnValueOnce("550e8400-e29b-41d4-a716-446655440002");
    let draft = createPrivacyDraft("CORRECTION");
    const originalId = draft.clientRequestId;

    draft = markPrivacyDraftAttempted(draft);
    expect(markPrivacyDraftAttempted(draft).clientRequestId).toBe(originalId);
    draft = updatePrivacyDraft(draft, "detail", "Correct this record");

    expect(draft.clientRequestId).not.toBe(originalId);
    expect(uuid).toHaveBeenCalledTimes(2);
    uuid.mockRestore();
  });

  test("does not rotate an attempted draft id for password-only retry input", () => {
    globalThis.crypto.randomUUID.mockReturnValue("550e8400-e29b-41d4-a716-446655440003");
    const attempted = markPrivacyDraftAttempted(createPrivacyDraft("DELETION"));

    expect(updatePrivacyDraft(attempted, "currentPassword", "new password").clientRequestId)
      .toBe(attempted.clientRequestId);
  });

  test("keeps only learner-safe response fields", () => {
    expect(normalizePrivacyRequest({
      id: 99,
      userId: 41,
      clientRequestId: "private",
      events: [{ actor: "operator" }],
      reference: "CY-PR-0123456789ABCDEFGHJK",
      type: "CORRECTION",
      subtype: "OTHER_PERSONAL_DATA",
      dataCategory: null,
      detail: "Correct this record",
      status: "SUBMITTED",
      submittedAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
      cancellable: true,
    })).toEqual({
      reference: "CY-PR-0123456789ABCDEFGHJK",
      type: "CORRECTION",
      subtype: "OTHER_PERSONAL_DATA",
      dataCategory: null,
      detail: "Correct this record",
      status: "SUBMITTED",
      submittedAt: "2026-08-30T00:00:00.000Z",
      updatedAt: "2026-08-30T00:00:00.000Z",
      cancellable: true,
    });
  });

  test("allows only the Privacy Request login continuation", () => {
    expect(privacyLoginTarget("privacy-requests")).toBe("privacy-requests");
    expect(privacyLoginTarget("#/privacy-requests")).toBe("privacy-requests");
    for (const target of ["dashboard", "#/profile", "https://example.com", "//example.com", "javascript:alert(1)", null]) {
      expect(privacyLoginTarget(target)).toBeNull();
    }
  });

  test.each([
    ["a".repeat(1000), 1000],
    ["a".repeat(1001), 1001],
    ["😀".repeat(1000), 1000],
    ["😀".repeat(1001), 1001],
  ])("counts Unicode code points for detail limits", (value, expected) => {
    expect(countUnicodeCodePoints(value)).toBe(expected);
  });
});
