import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../design-system/primitives/Button";
import {
  createGuardianInvitation, getGuardianLink, resendGuardianInvitation, revokeGuardianLink,
} from "./guardianLink.api";
import { guardianErrorCode, normalizeGuardianRelationship, retryAfterSeconds } from "./guardianLink.model";
import "./guardianLink.css";

function formatDate(value, locale) {
  if (!value) return "";
  try { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return ""; }
}

export default function GuardianLinkSection({ locale = "en" }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, relationship: null, error: "" });
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ guardianEmail: "", currentPassword: "" });
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokePassword, setRevokePassword] = useState("");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState("");
  const [operationError, setOperationError] = useState("");
  const [focusIntent, setFocusIntent] = useState("");
  const inviteRef = useRef(null);
  const revokeRef = useRef(null);
  const inviteTriggerRef = useRef(null);
  const revokeTriggerRef = useRef(null);
  const sectionHeadingRef = useRef(null);

  async function safely(request) {
    try { return await request; }
    catch { return { ok: false, status: 0, data: { code: "GUARDIAN_LINK_UNAVAILABLE" } }; }
  }

  const refresh = useCallback(async () => {
    let result;
    try { result = await getGuardianLink(); }
    catch { result = { ok: false, networkFailure: true }; }
    if (!result) {
      setState({ loading: false, relationship: null, error: "" });
      return { ok: false };
    }
    setState(result.ok
      ? { loading: false, relationship: normalizeGuardianRelationship(result.data?.relationship), error: "" }
      : { loading: false, relationship: null, error: t("guardianLink.errors.load") });
    return result;
  }, [t]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    const target = focusIntent === "invite-input" ? inviteRef.current
      : focusIntent === "invite-trigger" ? inviteTriggerRef.current
        : focusIntent === "revoke-input" ? revokeRef.current
          : focusIntent === "revoke-trigger" ? revokeTriggerRef.current
            : focusIntent === "section" ? sectionHeadingRef.current : null;
    if (target?.isConnected) {
      target.focus();
      setFocusIntent("");
    }
  }, [focusIntent, inviteOpen, revokeOpen, state.relationship]);

  function errorMessage(result, fallback) {
    const seconds = retryAfterSeconds(result);
    if (result?.status === 429 && seconds) return t("guardianLink.errors.rateLimitedSeconds", { seconds });
    return t(`guardianLink.errors.${guardianErrorCode(result)}`, { defaultValue: t(fallback) });
  }

  async function submitInvite(event) {
    event.preventDefault();
    setBusy("invite"); setMessage(""); setOperationError("");
    const result = await safely(createGuardianInvitation({ ...invite, locale }));
    setInvite(current => ({ ...current, currentPassword: "" }));
    if (result.ok) {
      setState({ loading: false, relationship: normalizeGuardianRelationship(result.data?.relationship), error: "" });
      setInviteOpen(false); setMessage(t("guardianLink.messages.invited")); setFocusIntent("section");
    } else {
      setOperationError(errorMessage(result, "guardianLink.errors.create"));
      if (result.status === 409 || result.status === 503) {
        await refresh();
        setInviteOpen(false);
        setInvite({ guardianEmail: "", currentPassword: "" });
        setFocusIntent("section");
      }
    }
    setBusy("");
  }

  async function resend() {
    setBusy("resend"); setMessage(""); setOperationError("");
    const result = await safely(resendGuardianInvitation(state.relationship.reference));
    if (result.ok) {
      setState(current => ({ ...current, relationship: normalizeGuardianRelationship(result.data?.relationship) }));
      setMessage(t("guardianLink.messages.resent"));
    } else {
      setOperationError(errorMessage(result, "guardianLink.errors.resend"));
      await refresh();
    }
    setBusy("");
  }

  async function revoke(event) {
    event.preventDefault();
    setBusy("revoke"); setMessage(""); setOperationError("");
    const result = await safely(revokeGuardianLink(state.relationship.reference, revokePassword));
    setRevokePassword("");
    if (result.ok) {
      setState(current => ({ ...current, relationship: normalizeGuardianRelationship(result.data?.relationship) }));
      setRevokeOpen(false); setMessage(t("guardianLink.messages.revoked")); setFocusIntent("section");
    } else {
      setOperationError(errorMessage(result, "guardianLink.errors.revoke"));
      setFocusIntent("revoke-input");
    }
    setBusy("");
  }

  const relationship = state.relationship;
  const terminal = relationship && ["DECLINED", "EXPIRED", "REVOKED"].includes(relationship.status);
  return (
    <section className="guardian-link" aria-labelledby="guardian-link-title">
      <h3 ref={sectionHeadingRef} tabIndex="-1" id="guardian-link-title" className="profile-section-title">{t("guardianLink.title")}</h3>
      <p>{t("guardianLink.description")}</p>
      {state.loading && <p role="status">{t("guardianLink.loading")}</p>}
      {state.error && <div role="alert" className="field-error">{state.error}</div>}
      {!state.loading && !relationship && !inviteOpen && <div className="guardian-link-empty">
        <p>{t("guardianLink.empty")}</p>
        <Button ref={inviteTriggerRef} type="button" variant="secondary" onClick={() => { setInviteOpen(true); setFocusIntent("invite-input"); }}>{t("guardianLink.actions.invite")}</Button>
      </div>}
      {relationship && <div className="guardian-link-summary">
        <p className="guardian-link-status"><strong>{t(`guardianLink.status.${relationship.status}`)}</strong></p>
        <dl>
          <div><dt>{t("guardianLink.fields.email")}</dt><dd>{relationship.guardianEmail}</dd></div>
          <div><dt>{t("guardianLink.fields.reference")}</dt><dd>{relationship.reference}</dd></div>
          {relationship.status === "PENDING_VERIFICATION" && relationship.invitedAt && <div><dt>{t("guardianLink.fields.invited")}</dt><dd>{formatDate(relationship.invitedAt, locale)}</dd></div>}
          {relationship.status === "PENDING_VERIFICATION" && relationship.expiresAt && <div><dt>{t("guardianLink.fields.expires")}</dt><dd>{formatDate(relationship.expiresAt, locale)}</dd></div>}
          {terminal && relationship.terminalAt && <div><dt>{t("guardianLink.fields.terminalAt")}</dt><dd>{formatDate(relationship.terminalAt, locale)}</dd></div>}
          {relationship.status === "LINKED" && relationship.updatedAt && <div><dt>{t("guardianLink.fields.updated")}</dt><dd>{formatDate(relationship.updatedAt, locale)}</dd></div>}
        </dl>
        <div className="profile-actions">
          {relationship.canResend && <Button type="button" variant="secondary" loading={busy === "resend"} onClick={resend}>{t("guardianLink.actions.resend")}</Button>}
          {relationship.canRevoke && !revokeOpen && <Button ref={revokeTriggerRef} type="button" variant="quiet" onClick={() => { setRevokeOpen(true); setFocusIntent("revoke-input"); }}>{t("guardianLink.actions.revoke")}</Button>}
          {terminal && !inviteOpen && <Button ref={inviteTriggerRef} type="button" variant="secondary" onClick={() => { setInviteOpen(true); setFocusIntent("invite-input"); }}>{t("guardianLink.actions.inviteNew")}</Button>}
        </div>
      </div>}
      {inviteOpen && <form className="guardian-link-form" onSubmit={submitInvite} noValidate>
        <div className="profile-field"><label htmlFor="guardian-email">{t("guardianLink.fields.email")}</label><input ref={inviteRef} id="guardian-email" className="profile-form-control" type="email" autoComplete="email" required value={invite.guardianEmail} onChange={event => setInvite(current => ({ ...current, guardianEmail: event.target.value }))} /></div>
        <div className="profile-field"><label htmlFor="guardian-password">{t("guardianLink.fields.password")}</label><input id="guardian-password" className="profile-form-control" type="password" autoComplete="current-password" required value={invite.currentPassword} onChange={event => setInvite(current => ({ ...current, currentPassword: event.target.value }))} /></div>
        <div className="profile-actions"><Button type="submit" variant="primary" loading={busy === "invite"}>{t("guardianLink.actions.send")}</Button><Button type="button" variant="quiet" onClick={() => { setInviteOpen(false); setInvite({ guardianEmail: "", currentPassword: "" }); setOperationError(""); setFocusIntent("invite-trigger"); }}>{t("common.cancel")}</Button></div>
      </form>}
      {revokeOpen && <form role="group" aria-labelledby="guardian-revoke-title" aria-describedby="guardian-revoke-description" className="guardian-link-form" onSubmit={revoke} noValidate>
        <p id="guardian-revoke-title"><strong>{t("guardianLink.revoke.title")}</strong></p><p id="guardian-revoke-description">{t("guardianLink.revoke.description")}</p>
        <div className="profile-field"><label htmlFor="guardian-revoke-password">{t("guardianLink.fields.password")}</label><input ref={revokeRef} id="guardian-revoke-password" className="profile-form-control" type="password" autoComplete="current-password" required value={revokePassword} onChange={event => setRevokePassword(event.target.value)} /></div>
        <div className="profile-actions"><Button type="submit" variant="primary" loading={busy === "revoke"}>{t("guardianLink.actions.confirmRevoke")}</Button><Button type="button" variant="quiet" onClick={() => { setRevokeOpen(false); setRevokePassword(""); setOperationError(""); setFocusIntent("revoke-trigger"); }}>{t("common.cancel")}</Button></div>
      </form>}
      {operationError && <div className="field-error guardian-link-error" role="alert">{operationError}</div>}
      {message && <p className="guardian-link-message" role="status" aria-live="polite">{message}</p>}
    </section>
  );
}
