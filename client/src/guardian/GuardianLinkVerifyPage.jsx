import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import Button from "../design-system/primitives/Button";
import PageContainer from "../design-system/layout/PageContainer";
import Surface from "../design-system/primitives/Surface";
import { acceptGuardianToken, declineGuardianToken, inspectGuardianToken } from "./guardianLink.api";
import {
  adoptGuardianBootstrapToken, clearGuardianBootstrapToken, guardianErrorCode,
  normalizePublicGuardianLink, retryAfterSeconds, shouldRetainGuardianTokenAfterInspect,
} from "./guardianLink.model";
import "./guardianLink.css";

function formatExpiry(value, locale) {
  if (!value) return "";
  try { return new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); }
  catch { return ""; }
}

export default function GuardianLinkVerifyPage() {
  const { t, i18n } = useTranslation();
  const tokenRef = useRef("");
  const cleanupTimerRef = useRef(null);
  const inspectedRef = useRef(false);
  const resultHeadingRef = useRef(null);
  const [state, setState] = useState({ phase: "loading", invitation: null, error: "", retryable: false });

  useLayoutEffect(() => {
    if (cleanupTimerRef.current) clearTimeout(cleanupTimerRef.current);
    adoptGuardianBootstrapToken(tokenRef);
    return () => {
      cleanupTimerRef.current = setTimeout(() => clearGuardianBootstrapToken(tokenRef), 0);
    };
  }, []);

  const inspect = useCallback(async () => {
    if (!tokenRef.current) { setState({ phase: "error", invitation: null, error: t("guardianLink.verify.errors.missing"), retryable: false }); return; }
    setState(current => ({ ...current, phase: "loading", error: "" }));
    let result;
    try { result = await inspectGuardianToken(tokenRef.current); }
    catch { result = { ok: false, status: 0, data: { code: "GUARDIAN_LINK_UNAVAILABLE" } }; }
    if (result.ok) setState({ phase: "ready", invitation: normalizePublicGuardianLink(result.data), error: "", retryable: false });
    else {
      const seconds = retryAfterSeconds(result);
      const code = guardianErrorCode(result);
      const retryable = shouldRetainGuardianTokenAfterInspect(code);
      if (!retryable) clearGuardianBootstrapToken(tokenRef);
      setState({ phase: "error", invitation: null, error: seconds ? t("guardianLink.errors.rateLimitedSeconds", { seconds }) : t(`guardianLink.verify.errors.${code}`, { defaultValue: t("guardianLink.verify.errors.network") }), retryable });
    }
  }, [t]);

  useEffect(() => { if (!inspectedRef.current) { inspectedRef.current = true; inspect(); } }, [inspect]);
  useEffect(() => {
    if ((state.phase === "accepted" || state.phase === "declined") && resultHeadingRef.current?.isConnected) {
      resultHeadingRef.current.focus();
    }
  }, [state.phase]);

  async function decide(action) {
    setState(current => ({ ...current, phase: "submitting", error: "" }));
    let result;
    try { result = await (action === "accept" ? acceptGuardianToken : declineGuardianToken)(tokenRef.current); }
    catch { result = { ok: false, data: { code: "GUARDIAN_LINK_UNAVAILABLE" } }; }
    if (result.ok) {
      clearGuardianBootstrapToken(tokenRef);
      setState({ phase: action === "accept" ? "accepted" : "declined", invitation: null, error: "", retryable: false });
    } else {
      const seconds = retryAfterSeconds(result);
      const code = guardianErrorCode(result);
      const error = seconds ? t("guardianLink.errors.rateLimitedSeconds", { seconds }) : t(`guardianLink.verify.errors.${code}`, { defaultValue: t("guardianLink.verify.errors.network") });
      if (code === "GUARDIAN_LINK_RATE_LIMITED" || code === "GUARDIAN_LINK_UNAVAILABLE") {
        setState(current => ({ ...current, phase: "ready", error, retryable: true }));
      } else {
        clearGuardianBootstrapToken(tokenRef);
        setState({ phase: "error", invitation: null, error, retryable: false });
      }
    }
  }

  return <div className="guardian-verify-page"><PageContainer size="content"><Surface as="section" className="guardian-verify" aria-labelledby="guardian-verify-title">
    {state.phase === "loading" && <><h1 id="guardian-verify-title">{t("guardianLink.verify.loadingTitle")}</h1><p role="status">{t("guardianLink.verify.loading")}</p></>}
    {state.phase === "ready" && <><h1 id="guardian-verify-title">{t("guardianLink.verify.title")}</h1><p>{t("guardianLink.verify.invitedBy", { name: state.invitation.learnerDisplayName })}</p>{state.invitation.expiresAt && <p>{t("guardianLink.verify.expires", { date: formatExpiry(state.invitation.expiresAt, i18n.language) })}</p>}<p>{t("guardianLink.verify.boundary")}</p><p>{t(`guardianLink.verify.information.${state.invitation.informationCode}`, { defaultValue: t("guardianLink.verify.boundary") })}</p>{state.error && <div role="alert" className="field-error">{state.error}</div>}<div className="guardian-verify-actions">{state.invitation.canAccept && <Button variant="primary" onClick={() => decide("accept")}>{t("guardianLink.verify.accept")}</Button>}{state.invitation.canDecline && <Button variant="secondary" onClick={() => decide("decline")}>{t("guardianLink.verify.decline")}</Button>}</div></>}
    {state.phase === "submitting" && <><h1 id="guardian-verify-title">{t("guardianLink.verify.title")}</h1><p role="status">{t("guardianLink.verify.submitting")}</p></>}
    {(state.phase === "accepted" || state.phase === "declined") && <><h1 ref={resultHeadingRef} tabIndex="-1" id="guardian-verify-title">{t(`guardianLink.verify.${state.phase}Title`)}</h1><p>{t(`guardianLink.verify.${state.phase}Description`)}</p></>}
    {state.phase === "error" && <><h1 id="guardian-verify-title">{t("guardianLink.verify.unavailableTitle")}</h1><div role="alert" className="field-error">{state.error}</div>{state.retryable && tokenRef.current && <Button variant="secondary" onClick={inspect}>{t("common.retry")}</Button>}</>}
  </Surface></PageContainer></div>;
}
