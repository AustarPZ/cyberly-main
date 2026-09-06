import {
  adoptGuardianBootstrapToken, captureGuardianToken, clearGuardianBootstrapToken,
  hasGuardianBootstrapToken, normalizeGuardianRelationship, normalizePublicGuardianLink,
  prepareGuardianRouteBootstrap, retryAfterSeconds,
  shouldRetainGuardianTokenAfterInspect,
} from "./guardianLink.model";

test("keeps only frozen learner and public safe fields", () => {
  expect(normalizeGuardianRelationship({ reference: "CY-GL-1", status: "LINKED", token: "secret", learnerId: 7 })).toEqual(expect.objectContaining({ reference: "CY-GL-1", status: "LINKED" }));
  expect(normalizeGuardianRelationship({ reference: "CY-GL-1", token: "secret" })).not.toHaveProperty("token");
  expect(normalizePublicGuardianLink({ learnerDisplayName: "Learner", canAccept: true, guardianEmail: "private@example.test", tokenHash: "secret" })).toEqual({
    learnerDisplayName: "Learner", expiresAt: null, canAccept: true, canDecline: false, informationCode: null,
  });
});

test.each([
  ["GUARDIAN_LINK_TOKEN_INVALID_OR_UNAVAILABLE", false],
  ["GUARDIAN_LINK_TOKEN_EXPIRED", false],
  ["GUARDIAN_LINK_TOKEN_TERMINAL", false],
  ["GUARDIAN_LINK_RATE_LIMITED", true],
  ["GUARDIAN_LINK_UNAVAILABLE", true],
])("classifies inspect token retention for %s", (code, retained) => {
  expect(shouldRetainGuardianTokenAfterInspect(code)).toBe(retained);
});

test("captures only the token query value and bounds Retry-After", () => {
  expect(captureGuardianToken("#/guardian-link/verify?token=private%20token&x=1")).toBe("private token");
  expect(retryAfterSeconds({ response: { headers: { get: () => "9999" } } })).toBe(900);
});

test("sanitizes canonical route state before staging a one-use bootstrap token", () => {
  clearGuardianBootstrapToken();
  const history = { state: { existing: true }, replaceState: jest.fn() };
  expect(prepareGuardianRouteBootstrap("#/guardian-link/verify?token=private-token", history)).toBe("#/guardian-link/verify");
  expect(history.replaceState).toHaveBeenCalledWith({ existing: true, route: "#/guardian-link/verify" }, "", "#/guardian-link/verify");
  expect(hasGuardianBootstrapToken()).toBe(true);
  const target = { current: "" };
  expect(adoptGuardianBootstrapToken(target)).toBe(true);
  expect(target.current).toBe("private-token");
  expect(hasGuardianBootstrapToken()).toBe(false);
  clearGuardianBootstrapToken(target);
  expect(target.current).toBe("");
});
