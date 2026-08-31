import { apiRequest } from "../api/apiClient";
import { cancelPrivacyRequest, createPrivacyRequest, getPrivacyRequest, listPrivacyRequests } from "./privacyRequest.api";

jest.mock("../api/apiClient", () => ({ apiRequest: jest.fn() }));

test("Privacy Request API exposes only the four learner operations", async () => {
  apiRequest.mockResolvedValue({ ok: true, status: 200, data: {} });
  await createPrivacyRequest({ type: "CORRECTION" });
  await listPrivacyRequests();
  await getPrivacyRequest("CY-PR-0123456789ABCDEFGHJK");
  await cancelPrivacyRequest("CY-PR-0123456789ABCDEFGHJK");

  expect(apiRequest.mock.calls).toEqual([
    ["/api/privacy/requests", { method: "POST", body: { type: "CORRECTION" } }],
    ["/api/privacy/requests", { method: "GET" }],
    ["/api/privacy/requests/CY-PR-0123456789ABCDEFGHJK", { method: "GET" }],
    ["/api/privacy/requests/CY-PR-0123456789ABCDEFGHJK/cancel", { method: "POST" }],
  ]);
});
