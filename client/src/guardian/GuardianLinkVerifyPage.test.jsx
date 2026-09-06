import { StrictMode } from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../i18n";
import GuardianLinkVerifyPage from "./GuardianLinkVerifyPage";
import { acceptGuardianToken, declineGuardianToken, inspectGuardianToken } from "./guardianLink.api";
import { hasGuardianBootstrapToken, prepareGuardianRouteBootstrap } from "./guardianLink.model";
import * as guardianModel from "./guardianLink.model";

jest.mock("./guardianLink.api", () => ({
  inspectGuardianToken: jest.fn(), acceptGuardianToken: jest.fn(), declineGuardianToken: jest.fn(),
}));

beforeEach(async () => { jest.restoreAllMocks(); jest.clearAllMocks(); await i18n.changeLanguage("en"); });

test("inspects once, never renders the token, and accepts explicitly", async () => {
  prepareGuardianRouteBootstrap("#/guardian-link/verify?token=private-token-value", { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "A Learner", expiresAt: "2026-09-01T00:00:00Z", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP", guardianEmail: "hidden@example.test" } });
  acceptGuardianToken.mockResolvedValue({ ok: true, data: { status: "LINKED" } });
  const { rerender } = render(<GuardianLinkVerifyPage />);
  expect(await screen.findByRole("heading", { name: "Guardian Link invitation" })).toBeVisible();
  expect(document.body).toHaveTextContent("A Learner invited you to become their Guardian contact through Guardian Link.");
  expect(document.body).toHaveTextContent("Accepting confirms that you control the invited email address and creates only a limited Guardian Link.");
  expect(document.body).toHaveTextContent("parenthood, custody or consent authority");
  expect(document.body).toHaveTextContent("No Guardian account is created");
  expect(document.body).toHaveTextContent("learning information or Privacy Requests");
  expect(document.body).not.toHaveTextContent("private-token-value");
  expect(document.body).not.toHaveTextContent("hidden@example.test");
  expect(hasGuardianBootstrapToken()).toBe(false);
  rerender(<GuardianLinkVerifyPage />);
  expect(inspectGuardianToken).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole("button", { name: "Accept invitation" }));
  await waitFor(() => expect(acceptGuardianToken).toHaveBeenCalledWith("private-token-value"));
  expect(await screen.findByRole("heading", { name: "Guardian Link accepted" })).toBeVisible();
});

test.each([
  ["ms", "A Learner menjemput anda menjadi kenalan Penjaga mereka melalui Pautan Penjaga.", "status ibu atau bapa, hak penjagaan atau kuasa memberikan persetujuan", "Tiada akaun Penjaga diwujudkan"],
  ["zh-CN", "A Learner 邀请你通过监护人关联成为其监护人联系人。", "亲子关系、监护权或同意授权", "系统不会创建监护人账户"],
])("renders the frozen public verification boundary in %s", async (locale, invitation, legalBoundary, accountBoundary) => {
  await i18n.changeLanguage(locale);
  prepareGuardianRouteBootstrap(`#/guardian-link/verify?token=${locale}-token`, { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "A Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<GuardianLinkVerifyPage />);
  expect(await screen.findByText(invitation)).toBeVisible();
  expect(document.body).toHaveTextContent(legalBoundary);
  expect(document.body).toHaveTextContent(accountBoundary);
  expect(screen.getByRole("button", { name: i18n.t("guardianLink.verify.accept") })).toBeVisible();
  expect(screen.getByRole("button", { name: i18n.t("guardianLink.verify.decline") })).toBeVisible();
  if (locale === "zh-CN") expect(document.body).not.toHaveTextContent("监护人链接");
});

test("survives StrictMode pressure, shows localized expiry, and inspects once", async () => {
  prepareGuardianRouteBootstrap("#/guardian-link/verify?token=strict-private-token", { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "A Learner", expiresAt: "2026-09-02T03:00:00Z", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<StrictMode><GuardianLinkVerifyPage /></StrictMode>);
  expect(await screen.findByText(/Invitation expires/)).toBeVisible();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(1);
  expect(inspectGuardianToken).toHaveBeenCalledWith("strict-private-token");
});

test.each([["accept", acceptGuardianToken], ["decline", declineGuardianToken]])("renders bounded Retry-After for %s without leaking backend detail", async (action, request) => {
  prepareGuardianRouteBootstrap(`#/guardian-link/verify?token=${action}-private-token`, { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  request.mockResolvedValue({ ok: false, status: 429, response: { headers: { get: () => "75" } }, data: { code: "GUARDIAN_LINK_RATE_LIMITED", message: "raw backend detail" } });
  render(<GuardianLinkVerifyPage />);
  await userEvent.click(await screen.findByRole("button", { name: action === "accept" ? "Accept invitation" : "Decline invitation" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("75 seconds");
  expect(document.body).not.toHaveTextContent("raw backend detail");
});

test("shows inspect Retry-After and permits only user-triggered retry", async () => {
  prepareGuardianRouteBootstrap("#/guardian-link/verify?token=inspect-rate-token", { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValueOnce({ ok: false, status: 429, response: { headers: { get: () => "42" } }, data: { code: "GUARDIAN_LINK_RATE_LIMITED" } }).mockResolvedValueOnce({ ok: true, data: { learnerDisplayName: "Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  render(<GuardianLinkVerifyPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent("42 seconds");
  expect(inspectGuardianToken).toHaveBeenCalledTimes(1);
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("heading", { name: "Guardian Link invitation" })).toBeVisible();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(2);
  expect(inspectGuardianToken).toHaveBeenLastCalledWith("inspect-rate-token");
});

test("retains a transient-network token for explicit retry, then clears it on terminal classification", async () => {
  const clearToken = jest.spyOn(guardianModel, "clearGuardianBootstrapToken");
  prepareGuardianRouteBootstrap("#/guardian-link/verify?token=network-retry-token", { state: {}, replaceState: jest.fn() });
  inspectGuardianToken
    .mockResolvedValueOnce({ ok: false, status: 0, data: { code: "GUARDIAN_LINK_UNAVAILABLE" } })
    .mockResolvedValueOnce({ ok: false, status: 400, data: { code: "GUARDIAN_LINK_TOKEN_EXPIRED" } });
  render(<GuardianLinkVerifyPage />);
  await screen.findByRole("button", { name: "Retry" });
  expect(inspectGuardianToken).toHaveBeenCalledWith("network-retry-token");
  clearToken.mockClear();
  expect(clearToken).not.toHaveBeenCalled();
  await userEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("alert")).toHaveTextContent(/expired/i);
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  expect(inspectGuardianToken).toHaveBeenCalledTimes(2);
  expect(inspectGuardianToken).toHaveBeenLastCalledWith("network-retry-token");
  expect(clearToken).toHaveBeenCalledWith(expect.anything());
});

test("declines exactly once and clears the adopted token", async () => {
  prepareGuardianRouteBootstrap("#/guardian-link/verify?token=decline-private-token", { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: true, data: { learnerDisplayName: "Learner", canAccept: true, canDecline: true, informationCode: "VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP" } });
  declineGuardianToken.mockResolvedValue({ ok: true, data: { status: "DECLINED" } });
  render(<GuardianLinkVerifyPage />);
  await userEvent.click(await screen.findByRole("button", { name: "Decline invitation" }));
  expect(declineGuardianToken).toHaveBeenCalledTimes(1);
  await waitFor(() => expect(screen.getByRole("heading", { name: "Guardian Link declined" })).toHaveFocus());
});

test.each([
  ["GUARDIAN_LINK_TOKEN_EXPIRED", "expired"],
  ["GUARDIAN_LINK_TOKEN_TERMINAL", "already"],
  ["GUARDIAN_LINK_TOKEN_INVALID_OR_UNAVAILABLE", "invalid"],
])("classifies %s as terminal without Retry", async (code, copy) => {
  const clearToken = jest.spyOn(guardianModel, "clearGuardianBootstrapToken");
  prepareGuardianRouteBootstrap(`#/guardian-link/verify?token=${code}`, { state: {}, replaceState: jest.fn() });
  inspectGuardianToken.mockResolvedValue({ ok: false, status: 400, data: { code } });
  render(<GuardianLinkVerifyPage />);
  expect(await screen.findByRole("alert")).toHaveTextContent(new RegExp(copy, "i"));
  expect(screen.queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
  expect(clearToken).toHaveBeenCalledWith(expect.anything());
});
