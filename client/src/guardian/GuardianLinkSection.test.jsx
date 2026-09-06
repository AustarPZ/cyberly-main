import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../i18n";
import GuardianLinkSection from "./GuardianLinkSection";
import { createGuardianInvitation, getGuardianLink, resendGuardianInvitation, revokeGuardianLink } from "./guardianLink.api";

jest.mock("./guardianLink.api", () => ({
  getGuardianLink: jest.fn(), createGuardianInvitation: jest.fn(), resendGuardianInvitation: jest.fn(), revokeGuardianLink: jest.fn(),
}));

beforeEach(async () => { jest.clearAllMocks(); await i18n.changeLanguage("en"); });

test.each([
  ["en", "Guardian Link is optional.", "one Guardian contact email at a time", "does not prove legal guardianship", "create a Guardian account", "Privacy Requests", "remove the link at any time"],
  ["ms", "Pautan Penjaga adalah pilihan.", "satu alamat e-mel kenalan Penjaga pada satu-satu masa", "tidak membuktikan penjagaan sah", "mewujudkan akaun Penjaga", "Permintaan Privasi", "mengalih keluar pautan pada bila-bila masa"],
  ["zh-CN", "监护人关联是可选功能。", "每次可以邀请一个监护人联系人电子邮箱", "不证明法定监护关系", "不会创建监护人账户", "隐私申请", "随时移除此关联"],
])("renders the frozen learner disclosure in %s", async (locale, ...copy) => {
  await i18n.changeLanguage(locale);
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: null } });
  render(<GuardianLinkSection locale={locale} />);
  await screen.findByRole("heading", { name: i18n.t("guardianLink.title") });
  copy.forEach(text => expect(document.body).toHaveTextContent(text));
  if (locale === "zh-CN") expect(document.body).not.toHaveTextContent("监护人链接");
});

test("loads the empty state and clears the transient password after invitation", async () => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: null } });
  createGuardianInvitation.mockResolvedValue({ ok: true, data: { relationship: { reference: "CY-GL-123", guardianEmail: "guardian@example.test", status: "PENDING_VERIFICATION", canResend: true, canRevoke: true } } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Invite a Guardian contact" }));
  await userEvent.type(screen.getByLabelText("Guardian contact email"), "guardian@example.test");
  const password = screen.getByLabelText("Current password");
  await userEvent.type(password, "Secure123");
  await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));
  expect(await screen.findByText("Invitation awaiting a decision")).toBeVisible();
  expect(password).not.toBeInTheDocument();
});

const pending = { reference: "CY-GL-PENDING", guardianEmail: "guardian@example.test", status: "PENDING_VERIFICATION", invitedAt: "2026-09-01T01:00:00Z", expiresAt: "2026-09-04T01:00:00Z", canResend: true, canRevoke: true };

test.each([
  [503, "EMAIL_SEND_FAILED", { ...pending, status: "REVOKED", terminalAt: "2026-09-01T02:00:00Z", canResend: false, canRevoke: false }, "Guardian Link removed"],
  [409, "GUARDIAN_LINK_ACTIVE_EXISTS", pending, "Invitation awaiting a decision"],
])("refreshes once after create %s and renders authoritative state", async (status, code, relationship, expected) => {
  getGuardianLink.mockResolvedValueOnce({ ok: true, data: { relationship: null } }).mockResolvedValueOnce({ ok: true, data: { relationship } });
  createGuardianInvitation.mockResolvedValue({ ok: false, status, data: { code, details: { existingReference: "CY-GL-UNTRUSTED" } } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Invite a Guardian contact" }));
  await userEvent.type(screen.getByLabelText("Guardian contact email"), "guardian@example.test");
  await userEvent.type(screen.getByLabelText("Current password"), "Secure123");
  await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));
  expect(await screen.findByText(expected)).toBeVisible();
  expect(getGuardianLink).toHaveBeenCalledTimes(2);
  expect(createGuardianInvitation).toHaveBeenCalledTimes(1);
  expect(screen.queryByText("CY-GL-UNTRUSTED")).not.toBeInTheDocument();
  if (status === 503) {
    expect(screen.getByRole("alert")).toHaveTextContent("could not be delivered");
    expect(screen.getByRole("button", { name: "Invite a new Guardian contact" })).toBeEnabled();
  }
});

test("preserves the active relationship when resend requires verified email", async () => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: pending } });
  resendGuardianInvitation.mockResolvedValue({ ok: false, status: 403, data: { code: "EMAIL_VERIFICATION_REQUIRED" } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Resend invitation" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("Verify your account email");
  expect(screen.getByText("Invitation awaiting a decision")).toBeVisible();
  expect(screen.getByRole("button", { name: "Remove Guardian Link" })).toBeEnabled();
});

test("clears an incorrect invite password and announces the safe error", async () => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: null } });
  createGuardianInvitation.mockResolvedValue({ ok: false, status: 401, data: { code: "GUARDIAN_LINK_PASSWORD_INVALID" } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Invite a Guardian contact" }));
  const password = screen.getByLabelText("Current password");
  await userEvent.type(screen.getByLabelText("Guardian contact email"), "guardian@example.test");
  await userEvent.type(password, "WrongInviteSecret");
  await userEvent.click(screen.getByRole("button", { name: "Send invitation" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("incorrect");
  expect(password).toHaveValue("");
  expect(document.body).not.toHaveTextContent("WrongInviteSecret");
});

test("refreshes once after resend delivery failure and preserves pending actions", async () => {
  getGuardianLink.mockResolvedValueOnce({ ok: true, data: { relationship: pending } }).mockResolvedValueOnce({ ok: true, data: { relationship: { ...pending, expiresAt: "2026-09-05T01:00:00Z" } } });
  resendGuardianInvitation.mockResolvedValue({ ok: false, status: 503, data: { code: "EMAIL_SEND_FAILED" } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Resend invitation" }));
  expect(await screen.findByRole("button", { name: "Resend invitation" })).toBeEnabled();
  expect(getGuardianLink).toHaveBeenCalledTimes(2);
  expect(resendGuardianInvitation).toHaveBeenCalledTimes(1);
});

test("labels revoke as a group and returns focus to the live trigger on cancel", async () => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: pending } });
  render(<GuardianLinkSection locale="en" />);
  const trigger = await screen.findByRole("button", { name: "Remove Guardian Link" });
  await userEvent.click(trigger);
  const group = screen.getByRole("group", { name: "Remove this Guardian Link?" });
  expect(group).toHaveAccessibleDescription(/ends the connection/i);
  expect(screen.getByLabelText("Current password")).toHaveFocus();
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(await screen.findByRole("button", { name: "Remove Guardian Link" })).toHaveFocus();
});

test("clears revoke password, announces failure, and restores meaningful focus", async () => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: pending } });
  revokeGuardianLink.mockResolvedValue({ ok: false, status: 401, data: { code: "GUARDIAN_LINK_PASSWORD_INVALID" } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Remove Guardian Link" }));
  const password = screen.getByLabelText("Current password");
  await userEvent.type(password, "WrongSecret");
  await userEvent.click(screen.getByRole("button", { name: "Confirm removal" }));
  expect(await screen.findByRole("alert")).toHaveTextContent("incorrect");
  expect(password).toHaveValue("");
  expect(password).toHaveFocus();
  expect(document.body).not.toHaveTextContent("WrongSecret");
});

test("focuses the stable section heading after successful revoke", async () => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: pending } });
  revokeGuardianLink.mockResolvedValue({ ok: true, data: { relationship: { ...pending, status: "REVOKED", terminalAt: "2026-09-01T03:00:00Z", canResend: false, canRevoke: false } } });
  render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Remove Guardian Link" }));
  await userEvent.type(screen.getByLabelText("Current password"), "Secure123");
  await userEvent.click(screen.getByRole("button", { name: "Confirm removal" }));
  await waitFor(() => expect(screen.getByRole("heading", { name: "Guardian Link" })).toHaveFocus());
});

test("restores invite trigger focus on cancel and uses truthful timestamps by status", async () => {
  getGuardianLink.mockResolvedValueOnce({ ok: true, data: { relationship: null } });
  const { rerender } = render(<GuardianLinkSection locale="en" />);
  await userEvent.click(await screen.findByRole("button", { name: "Invite a Guardian contact" }));
  await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(await screen.findByRole("button", { name: "Invite a Guardian contact" })).toHaveFocus();

  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship: { ...pending, status: "LINKED", canResend: false, expiresAt: "2026-09-04T01:00:00Z" } } });
  rerender(<GuardianLinkSection locale="en" key="linked" />);
  await waitFor(() => expect(screen.getByText("Guardian contact linked")).toBeVisible());
  expect(screen.queryByText("Invitation expires")).not.toBeInTheDocument();
});

test.each([
  [pending, "Invitation expires"],
  [{ ...pending, status: "DECLINED", terminalAt: "2026-09-02T01:00:00Z", canResend: false, canRevoke: false }, "Status updated"],
  [{ ...pending, status: "EXPIRED", terminalAt: "2026-09-03T01:00:00Z", canResend: false, canRevoke: false }, "Status updated"],
  [{ ...pending, status: "REVOKED", terminalAt: "2026-09-04T01:00:00Z", canResend: false, canRevoke: false }, "Status updated"],
])("uses status-truthful timestamp label for %s", async (relationship, label) => {
  getGuardianLink.mockResolvedValue({ ok: true, data: { relationship } });
  render(<GuardianLinkSection locale="en" />);
  expect(await screen.findByText(label)).toBeVisible();
  if (relationship.status !== "PENDING_VERIFICATION") expect(screen.queryByText("Invitation expires")).not.toBeInTheDocument();
});
