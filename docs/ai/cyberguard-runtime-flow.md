# CyberGuard Runtime Flow

This document traces the CyberGuard runtime path and the R5-05 controlled live-activation boundary without changing the accepted learner-facing API shape.

## Runtime Provider

CyberGuard chat is routed through the backend provider registry under the purpose `cyberguard_chat`.

The accepted provider for the current R5-05 candidate is OpenAI with `gpt-5.4-mini`. Gemini and ILMU remain separate provider adapters and are not granted CyberGuard product-live routing by this phase.

Provider configuration alone is not CyberGuard product-live authority.

## Product Activation Policies

CyberGuard learner-facing live AI is controlled by two backend-only environment policies:

```text
AI_CYBERGUARD_LIVE_ENABLED
AI_CYBERGUARD_AGENTIC_ENABLED
```

Each policy is enabled only by the exact string `1`. Unset values and all other strings are disabled.

`AI_CYBERGUARD_LIVE_ENABLED` gates learner-facing Provider generation.

`AI_CYBERGUARD_AGENTIC_ENABLED` independently gates Controlled Agentic planning and has no effect when CyberGuard live AI is disabled.

Neither value is exposed to the frontend.

## Processing Order

1. **User message**
   - The authenticated learner sends a chat message through the existing chat endpoints.
   - The learner message and conversation ownership are resolved by the backend.

2. **Generation state**
   - The backend creates or resumes the existing generation record.
   - Duplicate/in-progress generation protection remains in force.

3. **Unsafe request check**
   - Harmful cyber requests remain blocked before ordinary product processing.
   - Safety precedence is unchanged by R5-05.

4. **CyberGuard scope**
   - The backend classifies the request against the CyberGuard domain boundary.
   - Brief casual replies and out-of-scope redirects remain deterministic.
   - These deterministic replies complete before the live Provider gate and therefore require zero Provider calls.

5. **CyberGuard live activation gate**
   - If `AI_CYBERGUARD_LIVE_ENABLED !== "1"`, an in-scope generation fails closed with `AI_RUNTIME_DISABLED`.
   - The gate runs before learner-context loading, RAG retrieval, Controlled Agentic planning, and Provider generation.
   - Provider credential/configuration state is not disclosed through this policy result.

6. **Provider/rate/budget readiness**
   - Existing provider configuration, concurrency, rate and daily-budget checks apply only after the product live gate passes.

7. **Learner context**
   - The backend builds compact learner context from safe Cyberly learning data.
   - It excludes passwords, emails for prompting, raw assessment answers, raw scenario decisions, and hidden formulas.

8. **RAG retrieval**
   - Reviewed, published, RAG-ready Resource chunks are retrieved when relevant.
   - Private user data and raw chat history are not used as RAG knowledge.

9. **Deterministic route and wellness context**
   - Existing deterministic learning-route and cyber-wellness context generation remains available.
   - These are backend-owned data/context functions rather than model tool execution.

10. **Controlled Agentic activation gate**
    - If `AI_CYBERGUARD_AGENTIC_ENABLED !== "1"`, the Controlled Agentic planner is not invoked.
    - The audit state records `fallbackReason=runtime_disabled`, modelRequestCount `0`, and toolExecutionCount `0`.
    - The shared proposal helper also rejects model-origin proposals when Agentic is disabled, including a Provider-returned `actionProposal`; no proposal service call or proposal persistence occurs, and the response has `proposal=null`.

11. **Optional Controlled Agentic planning**
    - When separately enabled by a later authorized phase, the existing Controlled Agentic service may plan one approved read-only tool or one learner-controlled proposal.
    - R5-05 does not certify this live path.

12. **Final Provider generation**
    - The final CyberGuard response is sent through the normalized provider gateway.
    - The OpenAI product provider uses SDK `maxRetries: 0`.
    - Provider-specific raw responses are normalized before the rest of CyberGuard uses them.

13. **Output safety validation**
    - The assistant output is checked before persistence or learner display.

14. **Response persistence**
    - The assistant message and generation usage/cost metadata use the existing persistence path.

15. **Sources and deterministic actions**
    - RAG source snapshots are persisted as evidence/citations.
    - Existing deterministic learning action cards remain backend-owned.
    - Model tool execution is not required for these cards.

16. **Response mapping**
    - The existing API response shape is preserved.
    - Backend role `assistant` continues to map to frontend role `ai`.

## R5-05 One-Call Product Bound

When:

```text
AI_CYBERGUARD_LIVE_ENABLED=1
AI_CYBERGUARD_AGENTIC_ENABLED=0
```

the intended bounded product path is:

```text
final model invocations <= 1
planner model invocations = 0
Agentic tool executions = 0
OpenAI SDK retries = 0
automatic Provider fallback = 0
```

This bound is suitable for the future R5-05E single-call product-live certification.

## Live-OFF Behavior

With CyberGuard live disabled:

- in-scope requests fail with `AI_RUNTIME_DISABLED`;
- Provider calls are zero;
- RAG retrieval after the gate is zero;
- learner-context loading after the gate is zero;
- Controlled Agentic planner calls are zero;
- Agentic tool executions are zero.

The following still work without a Provider call:

- brief casual CyberGuard replies;
- deterministic out-of-scope redirects;
- unsafe/high-risk request rejection.

## Client Contract

The existing client already recognizes `AI_RUNTIME_DISABLED` as a safe generation error.

It is non-retryable and has localized EN, BM, and Chinese learner-facing copy.

R5-05 does not require a frontend API-shape or CyberGuard UI redesign.

## Boundaries

- No Provider key is exposed to the frontend.
- No environment value is returned in learner-facing errors.
- No learner score, mastery, scenario result, or progress mutation is introduced by Provider diagnostics.
- No RAG ingestion is performed by this phase.
- No Agentic live certification is granted by R5-05B.
- No tool-normalization certification is granted by R5-05B.
- No production readiness claim is granted by R5-05.
- Production remains untouched until a separately authorized release phase.

## Certification Boundary

R5-04A/B are CLOSED. R5-04C technical OpenAI bounded provider `CHAT_PASS` evidence was Owner-accepted after the fact, but R5-04C is formally `CLOSED_WITH_GOVERNANCE_EXCEPTION`. Live execution authorization at the original call time was `NOT_ESTABLISHED`. No prior live-call authorization carries into R5-05; any R5-05 live call requires new explicit Owner authorization.

R5-05B establishes the offline product activation candidate only.

Later gates remain separate:

```text
R5-05C — persistence
R5-05D — API staging inert integration
R5-05E — one bounded authenticated product-live certification
```

Only a passing R5-05E may grant `CYBERGUARD_PROVIDER_INTEGRATION_PASS`.
