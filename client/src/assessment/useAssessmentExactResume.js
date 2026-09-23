import { useCallback, useEffect, useRef, useState } from 'react';
import { getAssessmentAttempt, getInitialAssessment } from '../api/assessmentApi';
import { assessmentResumeContentFailure, sameAssessmentResumeContext, validAssessmentResumeHandoff, validateAssessmentResumeContent, validateAssessmentResumeResponse } from '../guidance/assessmentContinuation';

const read = request => Promise.resolve().then(request).catch(() => ({ ok: false, network: true }));

// Transient controller. Content is cached separately from authority, so retry can
// only repeat the exact attempt GET. Nothing is persisted or inferred from a URL.
export default function useAssessmentExactResume({ user, locale, acceptedHash, pending, clearPending, authority, clearAuth, onLoad, onReset }) {
  const [state, setState] = useState({ mode: 'idle' });
  const stateRef = useRef(state);
  const requestRef = useRef(null);
  const contentRef = useRef(null);
  const generation = useRef(0);
  const localeRef = useRef(locale);
  localeRef.current = locale;
  const mounted = useRef(true);
  const [retryRevision, setRetryRevision] = useState(0);
  const focusRef = useRef(null);
  const { authScopeRevision, acceptedNavigationGeneration } = authority.current;
  const publish = useCallback(next => { stateRef.current = next; setState(next); }, []);
  const leave = useCallback(() => {
    generation.current += 1;
    requestRef.current = null;
    if (pending) clearPending(pending.targetRevision);
    onReset();
    publish({ mode: 'idle' });
  }, [pending, clearPending, onReset, publish]);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Also fence user-initiated save/submit responses if an exact handoff replaces
  // their activity before they settle. Ordinary requests retain their behavior.
  const captureActivity = () => {
    const before = { ...authority.current, locale: localeRef.current, generation: generation.current };
    const wasExact = stateRef.current.mode !== 'idle';
    return () => mounted.current
      && before.authScopeRevision === authority.current.authScopeRevision
      && before.targetRevision === authority.current.targetRevision
      && (!wasExact || (before.locale === localeRef.current && before.generation === generation.current
        && before.acceptedNavigationGeneration === authority.current.acceptedNavigationGeneration));
  };

  // Content reacts to handoff/scope/locale, never to an authority Retry. Keep
  // preparing it on locale changes during retryable recovery as well.
  useEffect(() => {
    const previous = stateRef.current;
    const target = pending || previous.target;
    if (!user || acceptedHash !== '#/assessment' || !validAssessmentResumeHandoff(target)
      || target.authScopeRevision !== authScopeRevision || target.acceptedNavigationGeneration !== acceptedNavigationGeneration
      || (!pending && (previous.mode === 'completed' || (previous.mode === 'recovery' && !previous.retryable)))) return;
    if (!contentRef.current || contentRef.current.scope !== authScopeRevision || contentRef.current.locale !== locale) {
      contentRef.current = { scope: authScopeRevision, locale, promise: read(() => getInitialAssessment({ locale })) };
    }
  }, [pending, locale, authScopeRevision, acceptedNavigationGeneration, acceptedHash, user]);

  useEffect(() => {
    let active = true;
    const previous = stateRef.current;
    const target = pending || previous.target;
    if (!user || acceptedHash !== '#/assessment' || (target && (
      target.authScopeRevision !== authScopeRevision || target.acceptedNavigationGeneration !== acceptedNavigationGeneration
    ))) {
      generation.current += 1;
      requestRef.current = null;
      if (pending) clearPending(pending.targetRevision);
      if (previous.mode !== 'idle') {
        onReset();
        publish(user && acceptedHash === '#/assessment' && target?.authScopeRevision !== authScopeRevision
          ? { mode: 'recovery', reason: 'AUTH_LOST' } : { mode: 'idle' });
      }
      return undefined;
    }
    if (!target) return undefined;
    if (!validAssessmentResumeHandoff(target)) {
      clearPending(target.targetRevision);
      onReset();
      publish({ mode: 'recovery', reason: 'INVALID_TARGET' });
      return undefined;
    }
    if (!pending && previous.mode === 'completed') return undefined;
    if (!pending && previous.mode === 'recovery' && previous.retryRevision === retryRevision) return undefined;
    if (!pending && previous.mode === 'active' && previous.locale === locale && previous.retryRevision === retryRevision) return undefined;

    const contentPromise = contentRef.current.promise;
    const context = { ...target, locale, requestGeneration: generation.current };
    let request = requestRef.current;
    if (!request || request.retryRevision !== retryRevision || !sameAssessmentResumeContext(request.stamp, context)) {
      context.requestGeneration = ++generation.current;
      request = { stamp: context, retryRevision, promise: read(() => getAssessmentAttempt(target.attemptId, { locale })) };
      requestRef.current = request;
    }
    publish({ mode: 'loading', target, locale, retryRevision });
    onReset();
    const current = () => active && sameAssessmentResumeContext(request.stamp, {
      ...stateRef.current.target, ...authority.current, locale: localeRef.current, requestGeneration: generation.current,
    });
    const recover = (reason, retryable = false) => {
      requestRef.current = null;
      clearPending(target.targetRevision);
      publish({ mode: 'recovery', reason, target, locale, retryRevision, retryable });
      if (reason === 'AUTH_LOST') clearAuth();
    };
    request.promise.then(async response => {
      if (!current()) return;
      const reason = validateAssessmentResumeResponse(target, response);
      if (reason) { recover(reason, reason === 'NETWORK_ERROR'); return; }
      const content = await contentPromise;
      if (!current()) return;
      if (!content?.ok) { recover(assessmentResumeContentFailure(content)); return; }
      const inconsistent = validateAssessmentResumeContent(response.data.attempt, content.data);
      if (inconsistent) { recover(inconsistent); return; }
      requestRef.current = null;
      clearPending(target.targetRevision);
      onLoad({ ...content.data, attempt: response.data.attempt });
      publish({ mode: 'active', target, locale, retryRevision });
    });
    return () => { active = false; };
    // Synchronous refs own authority. State publication and changing App context
    // callbacks must not trigger another request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending, locale, retryRevision, authScopeRevision, acceptedNavigationGeneration, acceptedHash, user?.id, onLoad, onReset]);

  useEffect(() => {
    if (state.mode === 'active' || state.mode === 'recovery') focusRef.current?.focus();
  }, [state.mode, state.target?.targetRevision]);

  return {
    ...state, isolated: Boolean(pending) || state.mode !== 'idle', focusRef, leave, captureActivity,
    retry: () => { if (stateRef.current.retryable) setRetryRevision(value => value + 1); },
    complete: () => publish({ ...stateRef.current, mode: 'completed' }),
  };
}
