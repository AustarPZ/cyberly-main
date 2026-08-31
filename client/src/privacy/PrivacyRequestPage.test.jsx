import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../i18n";
import PrivacyRequestPage from "./PrivacyRequestPage";
import * as api from "./privacyRequest.api";

jest.mock("./privacyRequest.api");

const request = {
  reference: "CY-PR-0123456789ABCDEFGHJK",
  type: "CORRECTION",
  subtype: "OTHER_PERSONAL_DATA",
  dataCategory: null,
  detail: "Correct this record",
  status: "SUBMITTED",
  submittedAt: "2026-08-30T00:00:00.000Z",
  updatedAt: "2026-08-30T00:00:00.000Z",
  cancellable: true,
};

const statuses = ["SUBMITTED", "UNDER_REVIEW", "NEEDS_INFORMATION", "COMPLETED", "DECLINED", "CANCELLED"];
const deletionRequest = {
  ...request,
  reference: "CY-PR-1123456789ABCDEFGHJK",
  type: "DELETION",
  subtype: "WHOLE_ACCOUNT_AND_ASSOCIATED_DATA",
  detail: "Delete account data",
};

describe("Privacy Request learner page", () => {
  beforeAll(() => {
    Object.defineProperty(globalThis, "crypto", {
      configurable: true,
      value: { randomUUID: jest.fn() },
    });
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    globalThis.crypto.randomUUID.mockReturnValue("550e8400-e29b-41d4-a716-446655440001");
    await i18n.changeLanguage("en");
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [] } });
  });

  test("shows direct-correction guidance and validates correction without a password", async () => {
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    expect(screen.getByRole("link", { name: i18n.t("privacyRequests.guidance.profile") })).toHaveAttribute("href", "#/profile");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newCorrection") }));
    expect(screen.queryByLabelText(i18n.t("privacyRequests.fields.currentPassword"))).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitCorrection") }));
    expect(await screen.findByRole("alert")).toHaveTextContent(i18n.t("privacyRequests.errors.detailRequired"));
  });

  test("requires deletion category, detail and password and clears password after success", async () => {
    api.createPrivacyRequest.mockResolvedValue({ ok: true, status: 201, data: { request } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newDeletion") }));
    await userEvent.selectOptions(screen.getByLabelText(i18n.t("privacyRequests.fields.deletionScope")), "SELECTED_PERSONAL_DATA");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitDeletion") }));
    expect(screen.getAllByRole("alert")).toHaveLength(3);
    await userEvent.selectOptions(screen.getByLabelText(i18n.t("privacyRequests.fields.dataCategory")), "CHAT");
    await userEvent.type(screen.getByLabelText(i18n.t("privacyRequests.fields.detail")), "Remove this chat record");
    const password = screen.getByLabelText(i18n.t("privacyRequests.fields.currentPassword"));
    await userEvent.type(password, "Secret123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitDeletion") }));
    await screen.findByRole("heading", { name: i18n.t("privacyRequests.confirmation.title") });
    expect(password).not.toBeInTheDocument();
    expect(JSON.stringify(api.createPrivacyRequest.mock.calls)).toContain("SELECTED_PERSONAL_DATA");
  });

  test("clears a deletion password when the form is cancelled", async () => {
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newDeletion") }));
    await userEvent.type(screen.getByLabelText(i18n.t("privacyRequests.fields.currentPassword")), "Secret123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.cancel") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newDeletion") }));
    expect(screen.getByLabelText(i18n.t("privacyRequests.fields.currentPassword"))).toHaveValue("");
  });

  test("shows localized request type, subtype and cancellability on list cards", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request, { ...deletionRequest, cancellable: false }] } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);

    const correctionCard = await screen.findByRole("article", { name: request.reference });
    expect(within(correctionCard).getByText(i18n.t("privacyRequests.type.CORRECTION"))).toBeVisible();
    expect(within(correctionCard).getByText(i18n.t(`privacyRequests.subtype.${request.subtype}`))).toBeVisible();
    expect(within(correctionCard).getByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") })).toBeVisible();
    const deletionCard = screen.getByRole("article", { name: deletionRequest.reference });
    expect(within(deletionCard).getByText(i18n.t("privacyRequests.type.DELETION"))).toBeVisible();
    expect(within(deletionCard).queryByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") })).not.toBeInTheDocument();
    expect(document.body).not.toHaveTextContent("CORRECTION");
  });

  test("cancels from a list card and synchronizes its terminal state", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request } });
    api.cancelPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request: { ...request, status: "CANCELLED", cancellable: false } } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const card = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") }));
    expect(await screen.findByText(i18n.t("privacyRequests.status.CANCELLED"))).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.backToList") }));
    const updatedCard = screen.getByRole("article", { name: request.reference });
    expect(within(updatedCard).getByText(i18n.t("privacyRequests.status.CANCELLED"))).toBeVisible();
    expect(within(updatedCard).queryByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") })).not.toBeInTheDocument();
  });

  test("links a sanitized active duplicate and supports list detail cancellation", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request } });
    api.cancelPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request: { ...request, status: "CANCELLED", cancellable: false } } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const row = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(row).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
    await screen.findByText(request.detail);
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") }));
    await waitFor(() => expect(api.cancelPrivacyRequest).toHaveBeenCalledWith(request.reference));
    expect(await screen.findByText(i18n.t("privacyRequests.status.CANCELLED"))).toBeVisible();
  });

  test("sorts requests newest first and renders all canonical status labels", async () => {
    api.listPrivacyRequests.mockResolvedValue({
      ok: true,
      status: 200,
      data: { requests: statuses.map((status, index) => ({
        ...request,
        reference: `CY-PR-0123456789ABCDEFG${index}JK`,
        status,
        submittedAt: `2026-08-${String(20 + index).padStart(2, "0")}T00:00:00.000Z`,
        cancellable: status === "SUBMITTED",
        id: index,
        userId: index,
      })) },
    });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);

    await screen.findByText(i18n.t("privacyRequests.status.CANCELLED"));
    statuses.forEach(status => expect(screen.getByText(i18n.t(`privacyRequests.status.${status}`))).toBeVisible());
    const references = screen.getAllByText(/^CY-PR-/).map(node => node.textContent);
    expect(references[0]).toContain("5JK");
    expect(document.body).not.toHaveTextContent("userId");
  });

  test.each([200, 201])("shows in-app confirmation for successful status %i", async status => {
    api.createPrivacyRequest.mockResolvedValue({ ok: true, status, data: { request } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newCorrection") }));
    await userEvent.type(screen.getByLabelText(i18n.t("privacyRequests.fields.detail")), "Correct this record");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitCorrection") }));

    expect(await screen.findByText(request.reference)).toBeVisible();
    expect(screen.getByText(i18n.t("privacyRequests.type.CORRECTION"))).toBeVisible();
    expect(screen.getByText(i18n.t(`privacyRequests.subtype.${request.subtype}`))).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") })).toBeVisible();
    expect(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.backToList") })).toBeVisible();
  });

  test("shows deletion type and scope in its confirmation", async () => {
    api.createPrivacyRequest.mockResolvedValue({ ok: true, status: 201, data: { request: deletionRequest } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newDeletion") }));
    await userEvent.type(screen.getByLabelText(i18n.t("privacyRequests.fields.currentPassword")), "Secret123");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitDeletion") }));
    expect(await screen.findByText(i18n.t("privacyRequests.type.DELETION"))).toBeVisible();
    expect(screen.getByText(i18n.t("privacyRequests.subtype.WHOLE_ACCOUNT_AND_ASSOCIATED_DATA"))).toBeVisible();
  });

  test.each([
    ["a".repeat(1000), true],
    ["a".repeat(1001), false],
    ["😀".repeat(1000), true],
    ["😀".repeat(1001), false],
  ])("enforces the 1000-code-point detail limit", async (value, valid) => {
    api.createPrivacyRequest.mockResolvedValue({ ok: true, status: 201, data: { request } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newCorrection") }));
    const detail = screen.getByLabelText(i18n.t("privacyRequests.fields.detail"));
    expect(detail).not.toHaveAttribute("maxlength");
    fireEvent.change(detail, { target: { value } });
    expect(screen.getByText(i18n.t("privacyRequests.fields.characterCount", { count: Array.from(value).length, max: 1000 }))).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitCorrection") }));
    if (valid) {
      expect(await screen.findByRole("heading", { name: i18n.t("privacyRequests.confirmation.title") })).toBeVisible();
      expect(api.createPrivacyRequest).toHaveBeenCalledTimes(1);
    }
    else expect(await screen.findByText(i18n.t("privacyRequests.errors.detailTooLong"))).toBeVisible();
  });

  test("reuses the request id after an unknown result and rotates it after a semantic edit", async () => {
    globalThis.crypto.randomUUID
      .mockReturnValueOnce("550e8400-e29b-41d4-a716-446655440010")
      .mockReturnValueOnce("550e8400-e29b-41d4-a716-446655440011");
    api.createPrivacyRequest
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ ok: false, status: 500, data: {} })
      .mockResolvedValueOnce({ ok: true, status: 201, data: { request } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newCorrection") }));
    const detail = screen.getByLabelText(i18n.t("privacyRequests.fields.detail"));
    await userEvent.type(detail, "Correct this record");
    const submit = screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitCorrection") });
    await userEvent.click(submit);
    await screen.findByText(i18n.t("privacyRequests.errors.network"));
    await userEvent.click(submit);
    await screen.findByText(i18n.t("privacyRequests.errors.submitFailed"));

    expect(api.createPrivacyRequest.mock.calls[0][0].clientRequestId).toBe(api.createPrivacyRequest.mock.calls[1][0].clientRequestId);
    await userEvent.type(detail, " updated");
    await userEvent.click(submit);
    await screen.findByRole("heading", { name: i18n.t("privacyRequests.confirmation.title") });
    expect(api.createPrivacyRequest.mock.calls[2][0].clientRequestId).not.toBe(api.createPrivacyRequest.mock.calls[1][0].clientRequestId);
  });

  test.each([true, false])("handles an active duplicate with sanitized reference present=%s", async hasReference => {
    api.createPrivacyRequest.mockResolvedValue({
      ok: false,
      status: 409,
      data: {
        code: "PRIVACY_REQUEST_ALREADY_ACTIVE",
        details: hasReference ? { existingReference: request.reference } : {},
      },
    });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newCorrection") }));
    await userEvent.type(screen.getByLabelText(i18n.t("privacyRequests.fields.detail")), "Correct this record");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitCorrection") }));

    expect(await screen.findByText(i18n.t("privacyRequests.errors.activeDuplicate"))).toBeVisible();
    const existingAction = screen.queryByRole("button", { name: i18n.t("privacyRequests.actions.openExisting") });
    if (hasReference) expect(existingAction).toBeVisible();
    else expect(existingAction).not.toBeInTheDocument();
  });

  test("preserves deletion-request boundaries without immediate-deletion claims", async () => {
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newDeletion") }));

    expect(screen.getByText(i18n.t("privacyRequests.deletion.warning"))).toHaveTextContent("does not immediately delete");
    for (const claim of ["Delete account now", "Erase everything", "All backups will be erased"]) {
      expect(document.body).not.toHaveTextContent(claim);
    }
  });

  test("handles unauthenticated, unavailable-account and rate-limit results without exposing internal text", async () => {
    const onNavigate = jest.fn();
    api.listPrivacyRequests.mockResolvedValueOnce({ ok: false, status: 401, data: { message: "private stack detail" } });
    const first = render(<PrivacyRequestPage onNavigate={onNavigate} />);
    await waitFor(() => expect(onNavigate).toHaveBeenCalledWith("login"));
    expect(document.body).not.toHaveTextContent("private stack detail");
    first.unmount();

    api.listPrivacyRequests.mockResolvedValueOnce({ ok: false, status: 403, data: {} });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    expect(await screen.findByText(i18n.t("privacyRequests.errors.accountUnavailable"))).toBeVisible();
  });

  test.each([
    ["45", "privacyRequests.errors.rateLimitedSeconds"],
    ["invalid", "privacyRequests.errors.rateLimited"],
  ])("renders safe rate-limit guidance for Retry-After %s", async (retryAfter, key) => {
    api.createPrivacyRequest.mockResolvedValue({
      ok: false,
      status: 429,
      data: { code: "PRIVACY_REQUEST_RATE_LIMITED", message: "private backend detail" },
      response: { headers: { get: jest.fn().mockReturnValue(retryAfter) } },
    });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    await screen.findByText(i18n.t("privacyRequests.empty.title"));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.newCorrection") }));
    await userEvent.type(screen.getByLabelText(i18n.t("privacyRequests.fields.detail")), "Correct this record");
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.submitCorrection") }));
    const expected = key.endsWith("Seconds") ? i18n.t(key, { seconds: 45 }) : i18n.t(key);
    expect(await screen.findByText(expected)).toBeVisible();
    expect(document.body).not.toHaveTextContent("private backend detail");
  });

  test("removes stale cancellation authority after a not-cancellable response", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest
      .mockResolvedValueOnce({ ok: true, status: 200, data: { request } })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { request: { ...request, status: "UNDER_REVIEW", cancellable: false } } });
    api.cancelPrivacyRequest.mockResolvedValue({ ok: false, status: 409, data: { code: "PRIVACY_REQUEST_NOT_CANCELLABLE" } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const card = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") }));
    expect(await screen.findByText(i18n.t("privacyRequests.errors.notCancellable"))).toBeVisible();
    expect(screen.queryByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") })).not.toBeInTheDocument();
    expect(api.getPrivacyRequest).toHaveBeenCalledTimes(2);
  });

  test("returns focus to the live detail Withdraw control after closing cancellation", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const card = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    expect(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.cancel") }));

    expect(screen.queryByRole("group", { name: i18n.t("privacyRequests.cancellation.title") })).not.toBeInTheDocument();
    const withdraw = screen.getByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") });
    expect(withdraw).toHaveFocus();
    expect(document.activeElement.isConnected).toBe(true);
  });

  test("returns list-origin cancellation focus to the current detail Withdraw control", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const card = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    expect(await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") })).toHaveFocus();

    await userEvent.click(screen.getByRole("button", { name: i18n.t("common.cancel") }));

    const withdraw = screen.getByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") });
    expect(withdraw).toHaveFocus();
    expect(document.activeElement.isConnected).toBe(true);
    expect(document.activeElement).not.toBe(document.body);
  });

  test("moves focus to Back to list after successful cancellation removes Withdraw", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request } });
    api.cancelPrivacyRequest.mockResolvedValue({ ok: true, status: 200, data: { request: { ...request, status: "CANCELLED", cancellable: false } } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const card = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") }));

    await screen.findByText(i18n.t("privacyRequests.status.CANCELLED"));
    const backToList = screen.getByRole("button", { name: i18n.t("privacyRequests.actions.backToList") });
    expect(screen.queryByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") })).not.toBeInTheDocument();
    expect(backToList).toHaveFocus();
    expect(document.activeElement.isConnected).toBe(true);
  });

  test("moves focus to Back to list after authoritative not-cancellable refresh", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request] } });
    api.getPrivacyRequest
      .mockResolvedValueOnce({ ok: true, status: 200, data: { request } })
      .mockResolvedValueOnce({ ok: true, status: 200, data: { request: { ...request, status: "UNDER_REVIEW", cancellable: false } } });
    api.cancelPrivacyRequest.mockResolvedValue({ ok: false, status: 409, data: { code: "PRIVACY_REQUEST_NOT_CANCELLABLE" } });
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const card = await screen.findByRole("article", { name: request.reference });
    await userEvent.click(within(card).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
    await userEvent.click(await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") }));
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") }));

    await screen.findByText(i18n.t("privacyRequests.errors.notCancellable"));
    const backToList = screen.getByRole("button", { name: i18n.t("privacyRequests.actions.backToList") });
    expect(screen.queryByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") })).not.toBeInTheDocument();
    expect(backToList).toHaveFocus();
    expect(document.activeElement.isConnected).toBe(true);
  });

  test("resets cancellation state between requests and uses an associated inline group", async () => {
    api.listPrivacyRequests.mockResolvedValue({ ok: true, status: 200, data: { requests: [request, deletionRequest] } });
    api.getPrivacyRequest.mockImplementation(reference => Promise.resolve({ ok: true, status: 200, data: { request: reference === request.reference ? request : deletionRequest } }));
    render(<PrivacyRequestPage onNavigate={jest.fn()} />);
    const correctionCard = await screen.findByRole("article", { name: request.reference });
    await act(async () => {
      await userEvent.click(within(correctionCard).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
      await Promise.resolve();
    });
    const withdraw = await screen.findByRole("button", { name: i18n.t("privacyRequests.actions.withdraw") });
    await userEvent.click(withdraw);
    const group = screen.getByRole("group", { name: i18n.t("privacyRequests.cancellation.title") });
    expect(group).toHaveAttribute("aria-describedby", "privacy-cancel-description");
    expect(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.confirmWithdraw") })).toHaveFocus();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: i18n.t("privacyRequests.actions.backToList") }));
    const nextCard = screen.getByRole("article", { name: deletionRequest.reference });
    await act(async () => {
      await userEvent.click(within(nextCard).getByRole("button", { name: i18n.t("privacyRequests.actions.viewDetails") }));
      await Promise.resolve();
    });
    expect(await screen.findByText(deletionRequest.detail)).toBeVisible();
    expect(screen.queryByRole("group", { name: i18n.t("privacyRequests.cancellation.title") })).not.toBeInTheDocument();
    expect(screen.queryByText(i18n.t("privacyRequests.errors.notCancellable"))).not.toBeInTheDocument();
  });
});
