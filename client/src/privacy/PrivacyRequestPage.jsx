import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageContainer from "../design-system/layout/PageContainer";
import PageState from "../design-system/feedback/PageState";
import Button from "../design-system/primitives/Button";
import Surface from "../design-system/primitives/Surface";
import PageIdentity from "../design-system/visual/PageIdentity";
import {
  cancelPrivacyRequest,
  createPrivacyRequest,
  getPrivacyRequest,
  listPrivacyRequests,
} from "./privacyRequest.api";
import {
  createPrivacyDraft,
  countUnicodeCodePoints,
  markPrivacyDraftAttempted,
  normalizePrivacyReference,
  normalizePrivacyRequest,
  updatePrivacyDraft,
} from "./privacyRequest.model";
import "./privacyRequest.css";

const CORRECTION_SUBTYPES = ["ACCOUNT_OR_PROFILE_RECORD", "LEARNING_ACTIVITY_RECORD", "CHAT_OR_AI_RECORD", "OTHER_PERSONAL_DATA"];
const DELETION_SCOPES = ["WHOLE_ACCOUNT_AND_ASSOCIATED_DATA", "SELECTED_PERSONAL_DATA"];
const DATA_CATEGORIES = ["PROFILE", "LEARNING_ACTIVITY", "CHAT", "SECURITY_OR_RECOVERY", "OTHER"];

function newestFirst(requests) {
  return [...requests].sort((a, b) => String(b.submittedAt).localeCompare(String(a.submittedAt)));
}

function retryAfterSeconds(result) {
  const value = Number(result?.response?.headers?.get?.("Retry-After"));
  return Number.isFinite(value) && value > 0 ? value : null;
}

export default function PrivacyRequestPage({ onNavigate }) {
  const { t, i18n } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [listState, setListState] = useState("loading");
  const [view, setView] = useState("list");
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState(null);
  const [detailState, setDetailState] = useState("idle");
  const [confirmation, setConfirmation] = useState(null);
  const [duplicateReference, setDuplicateReference] = useState(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationFocusTarget, setCancellationFocusTarget] = useState(null);
  const cancelConfirmRef = useRef(null);
  const detailWithdrawRef = useRef(null);
  const backToListRef = useRef(null);

  const loadRequests = useCallback(async () => {
    setListState("loading");
    try {
      const result = await listPrivacyRequests();
      if (result.status === 401) {
        onNavigate?.("login");
        return;
      }
      if (!result.ok) {
        setListState(result.status === 403 ? "forbidden" : "error");
        return;
      }
      setRequests(newestFirst((result.data?.requests || []).map(normalizePrivacyRequest)));
      setListState("success");
    } catch {
      setListState("error");
    }
  }, [onNavigate]);

  useEffect(() => { loadRequests(); }, [loadRequests]);
  useEffect(() => {
    if (cancelOpen) {
      cancelConfirmRef.current?.focus();
      return;
    }
    const target = cancellationFocusTarget;
    if (!target || view !== "detail" || detailState !== "success") return;
    const node = target === "withdraw" && selected?.cancellable
      ? detailWithdrawRef.current
      : backToListRef.current;
    if (node?.isConnected) {
      node.focus();
      setCancellationFocusTarget(null);
    }
  }, [cancelOpen, cancellationFocusTarget, detailState, selected?.cancellable, view]);

  function resetCancellationState() {
    setCancellationFocusTarget(null);
    setCancelOpen(false);
    setCancelling(false);
    setErrors(current => ({ ...current, cancel: undefined }));
  }

  function returnToList() {
    setDraft(null);
    setSelected(null);
    setConfirmation(null);
    setDuplicateReference(null);
    setErrors({});
    setCancelOpen(false);
    setCancelling(false);
    setView("list");
  }

  function begin(type) {
    setDraft(createPrivacyDraft(type));
    setSelected(null);
    setConfirmation(null);
    setErrors({});
    setDuplicateReference(null);
    setCancelOpen(false);
    setCancelling(false);
    setView("form");
  }

  function change(field, value) {
    setDraft(current => updatePrivacyDraft(current, field, value));
    setErrors(current => ({ ...current, [field]: undefined, form: undefined }));
    setDuplicateReference(null);
  }

  function validate() {
    const next = {};
    if (!draft.detail.trim() && (draft.type === "CORRECTION" || draft.subtype === "SELECTED_PERSONAL_DATA")) next.detail = t("privacyRequests.errors.detailRequired");
    if (countUnicodeCodePoints(draft.detail.trim()) > 1000) next.detail = t("privacyRequests.errors.detailTooLong");
    if (draft.subtype === "SELECTED_PERSONAL_DATA" && !draft.dataCategory) next.dataCategory = t("privacyRequests.errors.categoryRequired");
    if (draft.type === "DELETION" && !draft.currentPassword) next.currentPassword = t("privacyRequests.errors.passwordRequired");
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function submit(event) {
    event.preventDefault();
    if (!validate()) return;
    const attempted = markPrivacyDraftAttempted(draft);
    setDraft(attempted);
    setSubmitting(true);
    setErrors({});
    setDuplicateReference(null);
    const payload = {
      type: attempted.type,
      subtype: attempted.subtype,
      detail: attempted.detail.trim() || undefined,
      clientRequestId: attempted.clientRequestId,
      ...(attempted.subtype === "SELECTED_PERSONAL_DATA" ? { dataCategory: attempted.dataCategory } : {}),
      ...(attempted.type === "DELETION" ? { currentPassword: attempted.currentPassword } : {}),
    };
    try {
      const result = await createPrivacyRequest(payload);
      if (result.ok && (result.status === 200 || result.status === 201)) {
        const safe = normalizePrivacyRequest(result.data?.request);
        setDraft(current => ({ ...current, currentPassword: "" }));
        setConfirmation(safe);
        setRequests(current => newestFirst([safe, ...current.filter(item => item.reference !== safe.reference)]));
        setView("confirmation");
        return;
      }
      const code = result.data?.code;
      if (result.status === 401 && code !== "PRIVACY_REQUEST_PASSWORD_INVALID") {
        onNavigate?.("login");
      } else if (result.status === 403) {
        setErrors({ form: t("privacyRequests.errors.accountUnavailable") });
      } else if (code === "PRIVACY_REQUEST_INVALID") {
        setErrors({ form: t("privacyRequests.errors.validation") });
      } else if (code === "PRIVACY_REQUEST_ALREADY_ACTIVE") {
        setDuplicateReference(normalizePrivacyReference(result.data?.details?.existingReference));
        setErrors({ form: t("privacyRequests.errors.activeDuplicate") });
      } else if (code === "PRIVACY_REQUEST_PASSWORD_INVALID") {
        setErrors({ currentPassword: t("privacyRequests.errors.passwordInvalid") });
      } else if (code === "PRIVACY_REQUEST_PASSWORD_REQUIRED") {
        setErrors({ currentPassword: t("privacyRequests.errors.passwordRequired") });
      } else if (code === "PRIVACY_REQUEST_RATE_LIMITED") {
        const seconds = retryAfterSeconds(result);
        setErrors({ form: seconds ? t("privacyRequests.errors.rateLimitedSeconds", { seconds }) : t("privacyRequests.errors.rateLimited") });
      } else if (code === "PRIVACY_REQUEST_IDEMPOTENCY_CONFLICT") {
        setErrors({ form: t("privacyRequests.errors.idempotencyConflict") });
      } else {
        setErrors({ form: t("privacyRequests.errors.submitFailed") });
      }
    } catch {
      setErrors({ form: t("privacyRequests.errors.network") });
    } finally {
      setSubmitting(false);
    }
  }

  async function openDetail(reference, openCancellation = false) {
    resetCancellationState();
    setDuplicateReference(null);
    setView("detail");
    setDetailState("loading");
    setSelected(null);
    try {
      const result = await getPrivacyRequest(reference);
      if (result.status === 401) {
        onNavigate?.("login");
      } else if (result.ok) {
        setSelected(normalizePrivacyRequest(result.data?.request));
        setDetailState("success");
        setCancelOpen(openCancellation);
      } else {
        setDetailState(result.status === 404 ? "not-found" : "error");
      }
    } catch {
      setDetailState("error");
    }
  }

  async function confirmCancel() {
    setCancelling(true);
    try {
      const result = await cancelPrivacyRequest(selected.reference);
      if (result.status === 401) {
        onNavigate?.("login");
        setCancelOpen(false);
      } else if (result.ok) {
        const safe = normalizePrivacyRequest(result.data?.request);
        setCancellationFocusTarget("back");
        setSelected(safe);
        setRequests(current => current.map(item => item.reference === safe.reference ? safe : item));
        setCancelOpen(false);
      } else if (result.data?.code === "PRIVACY_REQUEST_NOT_CANCELLABLE") {
        setErrors({ cancel: t("privacyRequests.errors.notCancellable") });
        setCancelOpen(false);
        try {
          const refreshed = await getPrivacyRequest(selected.reference);
          if (refreshed.ok) {
            const safe = normalizePrivacyRequest(refreshed.data?.request);
            setCancellationFocusTarget(safe.cancellable ? "withdraw" : "back");
            setSelected(safe);
            setRequests(current => current.map(item => item.reference === safe.reference ? safe : item));
          } else {
            setCancellationFocusTarget("back");
            setSelected(current => ({ ...current, cancellable: false }));
          }
        } catch {
          setCancellationFocusTarget("back");
          setSelected(current => ({ ...current, cancellable: false }));
        }
      } else {
        setCancellationFocusTarget("withdraw");
        setErrors({ cancel: t("privacyRequests.errors.cancelFailed") });
        setCancelOpen(false);
      }
    } catch {
      setCancellationFocusTarget("withdraw");
      setErrors({ cancel: t("privacyRequests.errors.network") });
      setCancelOpen(false);
    } finally {
      setCancelling(false);
    }
  }

  function openCancellation() {
    setErrors(current => ({ ...current, cancel: undefined }));
    setCancelOpen(true);
  }

  function closeCancellation() {
    setCancellationFocusTarget("withdraw");
    setCancelOpen(false);
  }

  const dateFormat = useMemo(() => new Intl.DateTimeFormat(i18n.language, { dateStyle: "medium", timeStyle: "short" }), [i18n.language]);
  const formatDate = value => value ? dateFormat.format(new Date(value)) : t("privacyRequests.notAvailable");

  return (
    <div className="privacy-request-page">
      <PageContainer width="wide" className="privacy-request-container">
        <header className="privacy-request-header">
          <PageIdentity label={t("privacyRequests.identity")} icon="ID" />
          <h1>{t("privacyRequests.title")}</h1>
          <p>{t("privacyRequests.overview")}</p>
          <p className="privacy-request-boundary">{t("privacyRequests.deletionBoundary")}</p>
        </header>

        {view === "list" && <>
          <Surface as="section" className="privacy-guidance" aria-labelledby="privacy-guidance-title">
            <h2 id="privacy-guidance-title">{t("privacyRequests.guidance.title")}</h2>
            <p>{t("privacyRequests.guidance.description")}</p>
            <div className="privacy-guidance-links">
              <a href="#/profile">{t("privacyRequests.guidance.profile")}</a>
              <a href="#/profile">{t("privacyRequests.guidance.preferences")}</a>
              <a href="#/profile">{t("privacyRequests.guidance.email")}</a>
              <a href="#/forgot-password">{t("privacyRequests.guidance.password")}</a>
            </div>
          </Surface>
          <div className="privacy-request-actions">
            <Button variant="primary" onClick={() => begin("CORRECTION")}>{t("privacyRequests.actions.newCorrection")}</Button>
            <Button variant="secondary" onClick={() => begin("DELETION")}>{t("privacyRequests.actions.newDeletion")}</Button>
          </div>
          <section aria-labelledby="privacy-request-list-title">
            <h2 id="privacy-request-list-title">{t("privacyRequests.list.title")}</h2>
            {listState === "loading" && <PageState message={t("privacyRequests.loading.list")} />}
            {listState === "error" && <PageState type="error" message={t("privacyRequests.errors.listFailed")} actionLabel={t("common.retry")} onAction={loadRequests} />}
            {listState === "forbidden" && <PageState type="error" message={t("privacyRequests.errors.accountUnavailable")} />}
            {listState === "success" && requests.length === 0 && <PageState title={t("privacyRequests.empty.title")} message={t("privacyRequests.empty.description")} />}
            <div className="privacy-request-list">
              {requests.map(item => <Surface as="article" className="privacy-request-card" aria-label={item.reference} key={item.reference}>
                <div><strong className="privacy-reference">{item.reference}</strong><span className={`privacy-status status-${String(item.status).toLowerCase()}`}>{t(`privacyRequests.status.${item.status}`)}</span></div>
                <dl><div><dt>{t("privacyRequests.fields.type")}</dt><dd>{t(`privacyRequests.type.${item.type}`)}</dd></div><div><dt>{t("privacyRequests.fields.subtype")}</dt><dd>{t(`privacyRequests.subtype.${item.subtype}`)}</dd></div><div><dt>{t("privacyRequests.fields.submitted")}</dt><dd>{formatDate(item.submittedAt)}</dd></div><div><dt>{t("privacyRequests.fields.updated")}</dt><dd>{formatDate(item.updatedAt)}</dd></div></dl>
                <div className="privacy-request-actions"><Button variant="quiet" onClick={() => openDetail(item.reference)}>{t("privacyRequests.actions.viewDetails")}</Button>{item.cancellable && <Button variant="danger" onClick={() => openDetail(item.reference, true)}>{t("privacyRequests.actions.withdraw")}</Button>}</div>
              </Surface>)}
            </div>
          </section>
        </>}

        {view === "form" && draft && <Surface as="section" className="privacy-request-form-surface">
          <form onSubmit={submit} noValidate>
            <fieldset><legend>{t(draft.type === "CORRECTION" ? "privacyRequests.correction.title" : "privacyRequests.deletion.title")}</legend>
              <p>{t(draft.type === "CORRECTION" ? "privacyRequests.correction.description" : "privacyRequests.deletion.warning")}</p>
              <label htmlFor="privacy-subtype">{t(draft.type === "CORRECTION" ? "privacyRequests.fields.correctionSubtype" : "privacyRequests.fields.deletionScope")}</label>
              <select id="privacy-subtype" value={draft.subtype} onChange={event => change("subtype", event.target.value)}>
                {(draft.type === "CORRECTION" ? CORRECTION_SUBTYPES : DELETION_SCOPES).map(value => <option value={value} key={value}>{t(`privacyRequests.subtype.${value}`)}</option>)}
              </select>
              {draft.subtype === "SELECTED_PERSONAL_DATA" && <><label htmlFor="privacy-category">{t("privacyRequests.fields.dataCategory")}</label><select id="privacy-category" value={draft.dataCategory} aria-invalid={Boolean(errors.dataCategory)} onChange={event => change("dataCategory", event.target.value)}><option value="">{t("privacyRequests.fields.chooseCategory")}</option>{DATA_CATEGORIES.map(value => <option value={value} key={value}>{t(`privacyRequests.category.${value}`)}</option>)}</select>{errors.dataCategory && <div role="alert" className="field-error">{errors.dataCategory}</div>}</>}
              <label htmlFor="privacy-detail">{t("privacyRequests.fields.detail")}</label>
              <textarea id="privacy-detail" value={draft.detail} aria-invalid={Boolean(errors.detail)} onChange={event => change("detail", event.target.value)} />
              <div className="privacy-character-count">{t("privacyRequests.fields.characterCount", { count: countUnicodeCodePoints(draft.detail), max: 1000 })}</div>
              {errors.detail && <div role="alert" className="field-error">{errors.detail}</div>}
              {draft.type === "DELETION" && <><label htmlFor="privacy-password">{t("privacyRequests.fields.currentPassword")}</label><input id="privacy-password" type="password" autoComplete="current-password" value={draft.currentPassword} aria-invalid={Boolean(errors.currentPassword)} onChange={event => change("currentPassword", event.target.value)} />{errors.currentPassword && <div role="alert" className="field-error">{errors.currentPassword}</div>}</>}
              {errors.form && <div role="alert" className="field-error">{errors.form}</div>}
              {duplicateReference && <Button variant="quiet" onClick={() => openDetail(duplicateReference)}>{t("privacyRequests.actions.openExisting")}</Button>}
              <div className="privacy-request-actions"><Button type="submit" variant="primary" loading={submitting} loadingLabel={t("privacyRequests.actions.submitting")}>{t(draft.type === "CORRECTION" ? "privacyRequests.actions.submitCorrection" : "privacyRequests.actions.submitDeletion")}</Button><Button variant="quiet" disabled={submitting} onClick={returnToList}>{t("common.cancel")}</Button></div>
            </fieldset>
          </form>
        </Surface>}

        {view === "confirmation" && confirmation && <Surface as="section" role="status" aria-live="polite" className="privacy-confirmation">
          <h2>{t("privacyRequests.confirmation.title")}</h2><p>{t("privacyRequests.confirmation.description")}</p>
          <p className="privacy-reference">{confirmation.reference}</p><dl><div><dt>{t("privacyRequests.fields.status")}</dt><dd>{t(`privacyRequests.status.${confirmation.status}`)}</dd></div><div><dt>{t("privacyRequests.fields.type")}</dt><dd>{t(`privacyRequests.type.${confirmation.type}`)}</dd></div><div><dt>{t("privacyRequests.fields.subtype")}</dt><dd>{t(`privacyRequests.subtype.${confirmation.subtype}`)}</dd></div></dl>
          <div className="privacy-request-actions"><Button variant="primary" onClick={() => openDetail(confirmation.reference)}>{t("privacyRequests.actions.viewDetails")}</Button><Button variant="quiet" onClick={returnToList}>{t("privacyRequests.actions.backToList")}</Button></div>
        </Surface>}

        {view === "detail" && <section aria-labelledby="privacy-detail-title"><h2 id="privacy-detail-title">{t("privacyRequests.detail.title")}</h2>
          {detailState === "loading" && <PageState message={t("privacyRequests.loading.detail")} />}
          {detailState === "not-found" && <PageState type="error" message={t("privacyRequests.errors.notFound")} />}
          {detailState === "error" && <PageState type="error" message={t("privacyRequests.errors.detailFailed")} />}
          {detailState === "success" && selected && <Surface className="privacy-request-detail"><p className="privacy-reference">{selected.reference}</p><dl>{[["type", t(`privacyRequests.type.${selected.type}`)], ["status", t(`privacyRequests.status.${selected.status}`)], ["subtype", t(`privacyRequests.subtype.${selected.subtype}`)], ["dataCategory", selected.dataCategory ? t(`privacyRequests.category.${selected.dataCategory}`) : t("privacyRequests.notAvailable")], ["detail", selected.detail || t("privacyRequests.notAvailable")], ["submitted", formatDate(selected.submittedAt)], ["updated", formatDate(selected.updatedAt)]].map(([key,value]) => <div key={key}><dt>{t(`privacyRequests.fields.${key}`)}</dt><dd>{value}</dd></div>)}</dl>
            {errors.cancel && <div role="alert" className="field-error">{errors.cancel}</div>}
            {selected.cancellable && <Button ref={detailWithdrawRef} variant="danger" disabled={cancelOpen} onClick={openCancellation}>{t("privacyRequests.actions.withdraw")}</Button>}
            {cancelOpen && <div className="privacy-cancel-confirm" role="group" aria-labelledby="privacy-cancel-title" aria-describedby="privacy-cancel-description"><h3 id="privacy-cancel-title">{t("privacyRequests.cancellation.title")}</h3><p id="privacy-cancel-description">{t("privacyRequests.cancellation.description")}</p><Button ref={cancelConfirmRef} variant="danger" loading={cancelling} onClick={confirmCancel}>{t("privacyRequests.actions.confirmWithdraw")}</Button><Button variant="quiet" onClick={closeCancellation}>{t("common.cancel")}</Button></div>}
            <Button ref={backToListRef} variant="quiet" onClick={returnToList}>{t("privacyRequests.actions.backToList")}</Button>
          </Surface>}
        </section>}
      </PageContainer>
    </div>
  );
}
