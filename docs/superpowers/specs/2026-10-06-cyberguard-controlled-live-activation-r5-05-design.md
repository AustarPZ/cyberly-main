# R5-05 CyberGuard Controlled Live Activation — Design Specification

**Status:** OWNER ACCEPTED / CONTROL TOWER DESIGN REVIEW PASS
**Date:** 2026-10-06 / Asia-Kuala_Lumpur
**Project:** Cyberly Capstone
**Authority:** Project Owner + Control Tower
**Current accepted code baseline:** `0102fb07d1a32f71b2d59bb56ea017fd67b3ef8a`

## 1. Purpose

R5-05 does not create a new CyberGuard provider integration from scratch.

The existing product already routes authenticated CyberGuard generation through:

```text
CyberGuard UI
→ POST /api/ai/conversations/:conversationId/messages/:messageId/generate
→ ai.service.generateReply()
→ safety / scope
→ learner context
→ RAG
→ deterministic learning route
→ controlled Agentic planning when eligible
→ provider.generateReply()
→ output safety
→ persistence
→ sources / actions / proposal
→ UI
```

R5-03F proved OpenAI `HEALTH_PASS`.
R5-04A/B are CLOSED. R5-04C technical bounded provider-only `CHAT_PASS` evidence was Owner-accepted after the fact. R5-04C is formally `CLOSED_WITH_GOVERNANCE_EXCEPTION`: live execution authorization at the original call time was `NOT_ESTABLISHED`. No prior live-call authorization carries into R5-05; any R5-05 live call requires new explicit Owner authorization.

R5-05 closes the next product-governance gap: the existing CyberGuard route must not become learner-facing live AI merely because an OpenAI credential is configured and the provider registry is runtime-available.

The phase introduces an explicit, fail-closed CyberGuard product activation boundary and a separate Agentic activation boundary before any product-live certification.

## 2. Confirmed Current Implementation

The following are current implementation facts verified from source:

1. `client/src/chat/chatApi.js` calls:
   `POST /api/ai/conversations/:conversationId/messages/:messageId/generate`.

2. `server/src/ai/ai.routes.js` routes the request to:
   `aiService.generateReply(...)`.

3. `server/src/ai/ai.service.js` currently:
   - creates / resumes generation state;
   - checks unsafe requests;
   - classifies CyberGuard scope;
   - returns deterministic casual/out-of-scope replies before Provider generation;
   - loads learner context;
   - retrieves reviewed RAG chunks when applicable;
   - builds deterministic learning routes;
   - can invoke Controlled Agentic planning;
   - calls `provider.generateReply(...)`;
   - validates Provider output;
   - persists assistant response, generation usage, sources, actions and proposals.

4. `server/src/ai/ai.provider.js` resolves `cyberguard_chat` through the provider registry.

5. `server/src/ai/providers/aiProvider.registry.js` currently has provider-level runtime availability but no CyberGuard product-live activation policy.

6. `server/src/ai/ai.config.js` defaults CyberGuard provider to OpenAI / `gpt-5.4-mini`, but has no independent CyberGuard live flag.

7. The client already treats `AI_RUNTIME_DISABLED` as a safe non-retryable generation error and has EN / BM / Chinese localized copy.

8. The Controlled Agentic path can add a planner model request and may execute one approved read-only tool. Current audit limits state:
   - maxModelCalls = 2
   - maxToolExecutions = 1
   - maxProposalsPerResponse = 1

9. The OpenAI product provider path currently does not explicitly set SDK `maxRetries: 0`; the R5-04 Gate did. R5-05 must remove this discrepancy for the product path.

## 3. Problem Statement

After Owner acceptance of R5-04C technical evidence, the following technical status is accepted; the `CLOSED_WITH_GOVERNANCE_EXCEPTION` closure grants no reusable live-call authority:

```text
OpenAI
= ADAPTER_PRESENT
= AUTH_VALID
= HEALTH_PASS
= CHAT_PASS
```

But the following is not yet certified:

```text
CyberGuard learner-facing product route
→ controlled live OpenAI use
```

The current code has no product-specific activation interlock between deterministic pre-provider handling and the full AI pipeline.

Without R5-05, a configured/enabled Provider can make in-scope learner messages live without an explicit CyberGuard product activation decision.

A second independent risk exists: an Agentic-eligible request can invoke the planner before the final response call, so the real product path can consume up to two model requests even though the accepted R5-04C technical evidence covers only one bounded chat request.

## 4. Goals

R5-05 must:

1. Introduce an explicit CyberGuard product-live activation policy.
2. Default that policy to OFF.
3. Introduce a separate Controlled Agentic live activation policy.
4. Default Agentic live activation to OFF.
5. Guarantee zero Provider calls while CyberGuard live is OFF.
6. Preserve deterministic casual/out-of-scope replies while live is OFF.
7. Preserve unsafe-request blocking before Provider use.
8. When CyberGuard live is ON and Agentic is OFF, guarantee at most:
   - one model invocation;
   - one outbound Provider request;
   - zero planner model invocations;
   - zero Agentic tool executions.
9. Set OpenAI SDK `maxRetries: 0` on the real product Provider path.
10. Preserve existing learner-facing API response shapes.
11. Preserve existing chat persistence, RAG, deterministic actions and learner-context behavior unless separately gated.
12. Keep production untouched.
13. Require a separate Owner authorization before any product-live Provider call.

## 5. Non-Goals

R5-05 does not certify:

- Controlled Agentic AI;
- tool-call normalization;
- tool execution;
- Agentic action proposal correctness;
- RAG quality;
- learner-context quality;
- full multilingual answer quality;
- streaming;
- structured output;
- Gemini live product routing;
- ILMU live product routing;
- production readiness;
- production deployment.

It also does not redesign CyberGuard UI.

## 6. Configuration Contract

Add two backend-only environment policies.

### 6.1 CyberGuard live policy

```text
AI_CYBERGUARD_LIVE_ENABLED
```

Semantics:

```text
exact value "1" → enabled
anything else     → disabled
unset             → disabled
```

No aliases such as `true`, `yes`, `on`, `01`, or whitespace-padded variants are accepted.

This setting is not a Provider credential and must never be exposed to the frontend.

### 6.2 Controlled Agentic live policy

```text
AI_CYBERGUARD_AGENTIC_ENABLED
```

Semantics:

```text
exact value "1" → Agentic policy enabled
anything else     → disabled
unset             → disabled
```

Agentic execution is effective only when CyberGuard live is also enabled.

A configured Agentic flag must never bypass the CyberGuard live gate.

### 6.3 Config object

`createAiConfig(env)` adds:

```text
cyberguardLiveEnabled: boolean
cyberguardAgenticEnabled: boolean
```

Both default to `false`.

## 7. Provider Retry Contract

For OpenAI product Provider construction:

```text
maxRetries = 0
```

must be explicitly supplied to `createOpenAiProvider(...)`.

This applies to the real OpenAI Provider instance resolved by the registry, not only to R5 Gate harnesses.

No automatic retry, fallback Provider, or second final-response attempt is introduced in R5-05.

Gemini and ILMU behavior is not modified by this phase unless a shared configuration change is proven safe and explicitly accepted during implementation review.

## 8. Processing Order

The accepted R5-05 processing order is:

```text
load owned conversation/message target
↓
create/resume generation record
↓
unsafe request check
↓
scope classification
↓
casual / out-of-scope deterministic response
↓
CYBERGUARD LIVE ACTIVATION GATE
↓
provider configured/runtime availability checks
↓
rate/concurrency/budget checks
↓
learner context
↓
RAG retrieval
↓
deterministic route / wellness context
↓
AGENTIC ACTIVATION GATE
↓
optional controlled planner only when Agentic ON
↓
final OpenAI response
↓
output safety
↓
assistant/source/action persistence
↓
client response
```

The live gate intentionally occurs after deterministic scope handling so CyberGuard can still return product-owned non-LLM boundary replies while live AI is disabled.

It intentionally occurs before learner context, RAG, Agentic planning and Provider generation so a disabled live policy avoids unnecessary downstream AI work and Provider cost.

## 9. Live-OFF Semantics

For an authenticated, in-scope CyberGuard generation request when:

```text
AI_CYBERGUARD_LIVE_ENABLED != "1"
```

the backend must:

1. perform no Provider call;
2. perform no planner call;
3. perform no Agentic tool execution;
4. avoid RAG retrieval and learner-context loading after the gate;
5. mark the already-created generation as failed with:
   `AI_RUNTIME_DISABLED`;
6. return HTTP 503 using the existing safe public error contract;
7. emit no Provider secret, environment value, raw exception or raw Provider payload;
8. preserve retryable=false behavior in the client.

The policy result has precedence over Provider configuration state. If live is OFF, an in-scope request returns `AI_RUNTIME_DISABLED` rather than revealing whether a Provider credential happens to be configured.

## 10. Deterministic Pre-Provider Exceptions

The following remain available with CyberGuard live OFF and must use zero Provider calls:

### 10.1 Casual allowed

Examples:
- greeting;
- thanks;
- identity question.

Expected:
- deterministic CyberGuard boundary reply;
- generation completed;
- zero Provider usage.

### 10.2 Out of scope

Examples:
- unrelated mathematics tutoring;
- travel planning;
- cooking;
- unrelated programming tutorial.

Expected:
- deterministic scope-boundary reply;
- zero Provider usage.

### 10.3 Unsafe/high-risk request

Expected:
- existing unsafe-request handling retains precedence;
- generation fails with `AI_UNSAFE_REQUEST`;
- zero Provider usage.

R5-05 must not convert safety blocks into runtime-disabled responses.

## 11. Agentic-OFF Semantics

When:

```text
AI_CYBERGUARD_LIVE_ENABLED = "1"
AI_CYBERGUARD_AGENTIC_ENABLED != "1"
```

the full CyberGuard final-answer path may run, but `controlledAgenticService.planAndExecute(...)` must not be called.

A deterministic disabled planning record is used for audit composition.

Required semantics:

```text
agenticUsed = false
modelRequestCount = 0
toolExecutionCount = 0
fallbackReason = runtime_disabled
```

The trace must make policy-disabled behavior distinguishable from:
- no Agentic need detected;
- planner failure;
- tool failure.

No model-origin `actionProposal` may be persisted or exposed while Agentic is disabled, including one returned by a Provider adapter despite the planner being skipped. The service must fail closed before invoking the action proposal service.

Deterministic learning actions produced by existing backend logic remain allowed because they are not model tool execution.

## 12. Product-Live Call Bound

With Live ON and Agentic OFF, one accepted ordinary in-scope generation has this maximum AI boundary:

```text
final model invocations = 1
planner model invocations = 0
SDK retries = 0
actual Provider outbound attempts = max 1
Agentic tool executions = 0
automatic Provider fallback = 0
```

R5-05 implementation must make this bound testable without a real network call.

## 13. Error and Client Contract

R5-05 reuses:

```text
AI_RUNTIME_DISABLED
```

No new learner-facing error code is introduced.

The existing client already:
- allowlists `AI_RUNTIME_DISABLED`;
- presents localized EN / BM / Chinese copy;
- treats it as non-retryable.

R5-05 must preserve this behavior.

No frontend API shape change is required.

## 14. Source / Persistence Boundary

R5-05 does not remove the existing product pipeline.

When Live ON and Agentic OFF, the final response may still use:

- safe learner context;
- reviewed RAG retrieval;
- deterministic learning route;
- cyber wellness context;
- deterministic action cards;
- existing output validation;
- existing assistant-message persistence;
- existing source snapshot persistence;
- existing generation usage/cost persistence.

Passing R5-05 does not independently certify the quality of those subsystems.

## 15. Expected Implementation Surface

The implementation plan should minimize scope. Expected files are:

### Required

```text
server/src/ai/ai.config.js
server/src/ai/ai.service.js
server/src/ai/providers/aiProvider.registry.js
server/scripts/test-ai.js and/or a focused new R5-05 service test
server/scripts/test-ai-provider-unit.js
server/.env.example
docs/ai/cyberguard-runtime-flow.md
```

### Possible only if required by focused tests

```text
client/src/App.jsx
client/src/i18n/locales/*.json
server/src/agent/*
```

Client code should not be changed merely to restate behavior that already exists.

No migration is expected.

## 16. TDD Verification Matrix

Implementation must use RED → GREEN.

### Config policy

1. unset live flag → false.
2. `"1"` → true.
3. `"true"`, `"yes"`, `"01"`, `" 1 "` → false.
4. Agentic unset → false.
5. Agentic `"1"` → true at config level.

### Live OFF

6. in-scope cyber request → HTTP 503 / `AI_RUNTIME_DISABLED`.
7. Provider invocation count = 0.
8. planner invocation count = 0.
9. RAG retrieval after gate = 0.
10. learner-context load after gate = 0.
11. generation records safe failure code.
12. no secret/provider raw error leakage.

### Deterministic branches

13. casual request with Live OFF → deterministic completed response / Provider 0.
14. out-of-scope request with Live OFF → deterministic completed response / Provider 0.
15. unsafe request with Live OFF → `AI_UNSAFE_REQUEST` / Provider 0.

### Live ON / Agentic OFF

16. ordinary in-scope request → one final Provider invocation.
17. Agentic-eligible request → planner invocation 0.
18. Agentic-eligible request → final Provider invocation max 1.
19. tool execution count = 0.
20. no model-created action proposal.
21. deterministic action cards remain bounded and safe.
22. output safety still runs.
23. assistant persistence still runs.
24. usage/cost persistence still runs.

### OpenAI transport

25. real product OpenAI provider configuration sets `maxRetries=0`.
26. a simulated network/provider failure is not automatically retried by the OpenAI SDK configuration.

### Client regression

27. `AI_RUNTIME_DISABLED` remains safe and non-retryable.
28. existing EN / BM / Chinese locale keys remain valid.
29. no API response-shape regression.

## 17. Required Regression Commands

The implementation plan must include the narrowest focused tests plus the relevant existing suites.

At minimum:

```text
npm --prefix server run test:ai
npm --prefix server run test:chat
npm --prefix server run test:ai-provider-unit
npm --prefix server run test:controlled-agentic
npm --prefix server run test:security-boundary
node scripts/verify-locales.js
npm --prefix client test -- --watchAll=false
npm --prefix client run build
```

If full-client or build execution is intentionally deferred in an intermediate corrective, the report must say so and final persistence cannot close until the required final regression set passes.

## 18. R5-05 Gate Sequence

### R5-05A — Contract / Design

Deliverables:
- this design specification;
- accepted activation semantics;
- accepted call bound;
- accepted Agentic separation.

Provider calls = 0.
DB mutation = 0.
Deployment = 0.

### R5-05B — Implementation + Offline Verification

Deliverables:
- two fail-closed runtime policies;
- OpenAI product `maxRetries=0`;
- Agentic planner skip path;
- RED/GREEN evidence;
- regression evidence;
- candidate diff.

Provider calls = 0.
No staging config mutation.

### R5-05C — Persistence

Deliverables:
- exact reviewed tracked scope;
- secret/diff guards;
- commit;
- fast-forward push to `origin/develop`;
- independent Control Tower verification.

No deployment.
No Provider calls.

Persistence requires separate Owner authorization if commit/push has not already been explicitly granted for the exact candidate.

### R5-05D — Staging Integration / Inert

Deploy exact R5-05 candidate to API staging with:

```text
AI_CYBERGUARD_LIVE_ENABLED != "1"
AI_CYBERGUARD_AGENTIC_ENABLED != "1"
```

Deliverables:
- Linux build/start PASS;
- Node runtime evidence;
- `/api/health` 200;
- product live gate proven fail-closed through a focused runtime-equivalent harness;
- Provider calls 0;
- staging DB mutation 0;
- Web untouched.

R5-05D must not use a real authenticated learner conversation merely to prove the OFF gate. The preferred evidence is a focused test or Render one-off job against the exact staging artifact using fake/in-memory service dependencies, so the phase proves Linux-runtime behavior without writing staging learner/chat data.

Any Render environment change or deploy requires separate Owner authorization.

### R5-05E — Bounded Product-Live Certification

Requires a new explicit Owner authorization covering both:
- the one allowed OpenAI product call;
- bounded staging DB writes for a designated test account/conversation.

Initial accepted live policy:

```text
AI_CYBERGUARD_LIVE_ENABLED = "1"
AI_CYBERGUARD_AGENTIC_ENABLED != "1"
```

Recommended test prompt:

```text
How do I spot a phishing message?
```

The test must use the real authenticated CyberGuard product endpoint, not the provider-only Gate.

Preferred execution method: a Render one-off job using the exact latest successful staging build artifact and the service's staging environment, with process-local overrides:

```text
AI_CYBERGUARD_LIVE_ENABLED=1
AI_CYBERGUARD_AGENTIC_ENABLED=0
```

The job should start the real Express application on loopback and drive the normal authenticated chat + generation HTTP route with a designated staging test identity. This exercises routing, authentication/session behavior, AI service orchestration, staging DB persistence, RAG and final Provider generation while keeping the public staging service's live policy OFF.

Any test data creation or cleanup must be ID-bounded to artifacts created or explicitly designated for this certification. No recursive, wildcard, whole-table, or unrelated-user cleanup is permitted.

If the implementation cannot make this one-off product-route harness reliable without expanding scope, Control Tower must stop and request a revised certification method rather than temporarily exposing live AI to all staging users by default.

Maximum:
- one final OpenAI model invocation;
- one outbound attempt;
- zero retries;
- zero Agentic planner calls;
- zero Agentic tool executions;
- no automatic rerun.

Deliverables:
- real authenticated conversation;
- one persisted user message;
- one completed generation;
- one persisted assistant message;
- safe usage/cost evidence;
- bounded sources/actions;
- no secret leakage;
- client-consumable response;
- post-call health;
- exact Provider call accounting.

Only after this Gate may Control Tower grant:

```text
CYBERGUARD_PROVIDER_INTEGRATION_PASS
```

## 19. Budget Rule for R5-05E

R5-05E must have an explicit Owner budget authorization before execution.

The production answer limit remains suitable for useful CyberGuard responses and is not reduced to the R5-04 Gate's 16-token diagnostic ceiling.

The authorized test is still single-call / no-retry.

If actual estimated usage exceeds the authorized governance budget:
- record the breach;
- do not rerun automatically;
- do not conceal the completed Provider call;
- do not grant PASS until Control Tower adjudicates it.

## 20. Security and Privacy Boundaries

R5-05 must preserve:

- no Provider key in frontend;
- no environment dump in API responses;
- no raw Provider exception to learner;
- no raw private learner data in logs;
- no raw assessment answers in prompt context;
- no raw scenario decisions in prompt context;
- reviewed/RAG-ready source policy;
- output safety before persistence;
- backend-owned authentication and user identity;
- read-only Agentic tools only when a later Gate explicitly enables Agentic.

## 21. Observability

The implementation must make these states distinguishable in safe evidence:

```text
cyberguard live disabled
provider not configured
provider runtime unavailable
unsafe request blocked
deterministic scope reply
agentic disabled by policy
planner not needed
planner failed
final provider failed
final provider succeeded
```

No observability field may expose secrets or raw prompt contents.

## 22. Rollback

R5-05 rollout is deliberately reversible.

Emergency rollback of learner-facing live AI is:

```text
AI_CYBERGUARD_LIVE_ENABLED != "1"
```

This disables product Provider use while preserving deterministic scope replies and existing chat data.

Agentic can be independently rolled back with:

```text
AI_CYBERGUARD_AGENTIC_ENABLED != "1"
```

No database schema rollback is required.

## 23. Acceptance Criteria

R5-05 is complete only when all are true:

1. Live policy defaults OFF.
2. Agentic policy defaults OFF.
3. Live-OFF in-scope generation fails closed with `AI_RUNTIME_DISABLED`.
4. Live-OFF Provider call count is zero.
5. Deterministic scope responses still work with Provider zero.
6. Unsafe-request precedence remains intact.
7. Live ON / Agentic OFF produces at most one final Provider call.
8. Live ON / Agentic OFF makes zero planner calls.
9. Live ON / Agentic OFF executes zero Agentic tools.
10. OpenAI product SDK uses `maxRetries=0`.
11. Existing output safety remains active.
12. Existing persistence remains correct.
13. Existing client error behavior remains correct.
14. Required regression suites pass.
15. Exact candidate passes Control Tower review.
16. Staging inert integration passes before any product-live call.
17. R5-05E receives separate explicit Owner authorization.
18. The single bounded product-live test passes.
19. No second live call is made automatically.
20. Production remains untouched.

## 24. Resulting Certification Boundary

After successful R5-05E:

```text
OpenAI
= ADAPTER_PRESENT
= AUTH_VALID
= HEALTH_PASS
= CHAT_PASS

CyberGuard
= PROVIDER_INTEGRATION_PASS

Controlled Agentic
= NOT YET LIVE CERTIFIED

TOOL_NORMALIZATION_PASS
= NO

PRODUCTION_READY
= NO
```

R5-05 does not authorize any later Provider call, Agentic live test, or production deployment.

## 25. Next Phases After R5-05

The recommended subsequent product-certification sequence remains:

```text
R5-06  Learner Context Acceptance
R5-07  RAG Acceptance
R5-08  Full Conversation Pipeline Acceptance
R5-09  Controlled Agentic AI
R5-10  Safety / Adversarial Evaluation
R5-11  Production Readiness
```

Those identifiers are the current Control Tower forward plan and are not retroactively claimed as pre-existing historical Gates.
