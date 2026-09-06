import { apiRequest } from "../api/apiClient";
import * as api from "./guardianLink.api";

jest.mock("../api/apiClient", () => ({ apiRequest: jest.fn() }));

test("uses the frozen Guardian Link endpoint contract", () => {
  api.getGuardianLink();
  api.createGuardianInvitation({ guardianEmail: "g@example.test", currentPassword: "secret", locale: "en" });
  api.resendGuardianInvitation("CY-GL-A/B");
  api.revokeGuardianLink("CY-GL-A/B", "secret");
  api.inspectGuardianToken("private-token");
  api.acceptGuardianToken("private-token");
  api.declineGuardianToken("private-token");

  expect(apiRequest.mock.calls).toEqual([
    ["/api/guardian-link", { method: "GET" }],
    ["/api/guardian-link/invitations", { method: "POST", body: { guardianEmail: "g@example.test", currentPassword: "secret", locale: "en" } }],
    ["/api/guardian-link/CY-GL-A%2FB/resend", { method: "POST" }],
    ["/api/guardian-link/CY-GL-A%2FB/revoke", { method: "POST", body: { currentPassword: "secret" } }],
    ["/api/guardian-link/token/inspect", { method: "POST", body: { token: "private-token" } }],
    ["/api/guardian-link/token/accept", { method: "POST", body: { token: "private-token" } }],
    ["/api/guardian-link/token/decline", { method: "POST", body: { token: "private-token" } }],
  ]);
});
