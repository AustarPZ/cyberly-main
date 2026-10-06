# R5-05 CyberGuard Controlled Live Activation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing CyberGuard product route explicitly fail-closed by default, independently gate Controlled Agentic planning, and guarantee a one-model-call / zero-retry product path when CyberGuard live is enabled but Agentic is disabled.

**Architecture:** Preserve the existing CyberGuard UI, chat API, `ai.service`, learner-context, RAG, deterministic action, persistence and Provider registry architecture. Add two exact-string runtime policies to `createAiConfig`, enforce the product-live gate inside `ai.service.generateReply()` after deterministic scope/safety handling but before learner/RAG/provider work, skip Controlled Agentic planning unless separately enabled, and configure the OpenAI product provider with SDK `maxRetries: 0`.

**Tech Stack:** Node.js 24.x, CommonJS, Express 5, OpenAI Node SDK 6.x, React 19 / CRA 5 tests, existing script-based Node verification harnesses.

**Spec:** `docs/superpowers/specs/2026-10-06-cyberguard-controlled-live-activation-r5-05-design.md`

## Global Constraints

- Accepted starting code baseline: `0102fb07d1a32f71b2d59bb56ea017fd67b3ef8a`.
- R5-04A/B are CLOSED. R5-04C technical `CHAT_PASS` evidence was Owner-accepted after the fact; R5-04C is `CLOSED_WITH_GOVERNANCE_EXCEPTION`. Live execution authorization at the original call time was `NOT_ESTABLISHED`. No prior live-call authorization carries into R5-05.
- `AI_CYBERGUARD_LIVE_ENABLED` is enabled only by exact string `"1"`; all other values, including unset, `true`, `yes`, `01`, and ` 1 `, are disabled.
- `AI_CYBERGUARD_AGENTIC_ENABLED` uses the same exact-string `"1"` rule and is ineffective when the CyberGuard live gate is OFF.
- Live OFF in-scope generation returns `AI_RUNTIME_DISABLED` / HTTP 503 before learner-context, RAG, Controlled Agentic planning or Provider generation.
- Casual and out-of-scope deterministic replies remain available with Live OFF and use zero Provider calls.
- Unsafe-request rejection retains precedence over the Live OFF gate.
- Live ON + Agentic OFF: final model invocations max 1; planner model invocations 0; Agentic tool executions 0; SDK retries 0; automatic Provider fallback 0.
- OpenAI real product provider must set `maxRetries: 0`.
- No database migration is introduced.
- Production is untouched.
- R5-05B implementation/offline verification uses zero real Provider calls and no staging configuration mutation.
- R5-05C commit/push, R5-05D staging deployment, and R5-05E product-live call/DB writes each require separate Owner authorization.
- Preserve SINGLE CODEX EXECUTOR / serial same-worktree mutation.
- Do not use destructive cleanup: no `git clean`, `git reset --hard`, recursive deletion, or review-evidence cleanup.
- Tasks 1–5 remain uncommitted until R5-05C is separately authorized; do not create implementation commits during R5-05B.

## File Structure

**Modify**
- `server/src/ai/ai.config.js` — parse the two product activation policies.
- `server/src/ai/providers/aiProvider.registry.js` — set OpenAI product `maxRetries: 0`.
- `server/src/ai/ai.service.js` — enforce Live OFF and Agentic OFF policy.
- `server/package.json` — add the focused R5-05 verification command.
- `server/scripts/test-ai-provider-unit.js` — pin product OpenAI single-attempt behavior.
- `server/scripts/test-ai.js` — keep existing provider/Agentic integration fixtures explicit under the new default-OFF policies.
- `server/scripts/test-agentic-traces.js` — keep the existing Agentic trace integration fixture explicitly Live+Agentic enabled.
- `server/scripts/test-learner-controlled-actions.js` — keep the existing model-origin proposal integration fixture explicitly Live+Agentic enabled.
- `client/src/cyberguard/CyberGuardPilot.test.jsx` — pin safe non-retryable `AI_RUNTIME_DISABLED` UX.
- `server/.env.example` — document both backend-only activation flags.
- `docs/ai/cyberguard-runtime-flow.md` — document the accepted processing order and call bound.

**Create**
- `server/scripts/test-cyberguard-live-activation.js` — DB-free focused service/config verification for R5-05.
- `docs/superpowers/specs/2026-10-06-cyberguard-controlled-live-activation-r5-05-design.md` — written, has passed Control Tower design review, and was accepted by the Owner on 2026-10-06; remains part of the eventual persistence candidate.
- `docs/superpowers/plans/2026-10-06-cyberguard-controlled-live-activation-r5-05.md` — this plan.

No production frontend component change is expected.

## Review Focus

1. **Truthy-looking flag values:** `true`, `yes`, `01`, and whitespace-padded ` 1 ` must remain OFF, or a staging typo could silently enable learner-facing live AI. Task 1 tests every value.
2. **Policy precedence over credential state:** Live OFF with a fully configured Provider must still return `AI_RUNTIME_DISABLED` and reveal nothing about credential configuration. Task 2 tests configured and unconfigured Provider stubs under the same OFF result.
3. **Agentic-eligible learner wording:** With Live ON / Agentic OFF, a message that normally qualifies for Controlled Agentic planning must call the planner zero times while still allowing exactly one final Provider call. Task 3 pins this.
4. **SDK hidden retry after transport failure:** A network/provider failure must produce exactly one OpenAI fetch attempt on the product configuration. Task 1 exercises the real OpenAI adapter with an in-memory failing fetch.
5. **Deterministic branches while live is OFF:** casual, out-of-scope and unsafe inputs must keep their existing precedence and zero-Provider behavior. Task 2 pins all three branches.

---

### Task 1: Activation Config and OpenAI No-Retry Product Contract

**Files:**
- Modify: `server/src/ai/ai.config.js:1-56`
- Modify: `server/src/ai/providers/aiProvider.registry.js:20-55`
- Modify: `server/scripts/test-ai-provider-unit.js`
- Modify: `server/.env.example:34-63`

**Interfaces:**
- Consumes: existing `createAiConfig(env)`, `providerConfig(id, env)`, and `createOpenAiProvider(config)`.
- Produces:
  - `createAiConfig(env).cyberguardLiveEnabled: boolean`
  - `createAiConfig(env).cyberguardAgenticEnabled: boolean`
  - `providerConfig('openai', env).maxRetries === 0`

- [ ] **Step 1: Add RED assertions for exact activation semantics in `test-ai-provider-unit.js`**

Extend the test imports to include:
- `createAiConfig` from `../src/ai/ai.config`;
- `providerConfig` from `../src/ai/providers/aiProvider.registry`;
- `createOpenAiProvider` from `../src/ai/providers/openai.provider`.

Add tests that call `createAiConfig` with:

```text
undefined / "" / "0" / "true" / "yes" / "01" / " 1 " → false
"1"                                             → true
```

for both `AI_CYBERGUARD_LIVE_ENABLED` and `AI_CYBERGUARD_AGENTIC_ENABLED`.

Also assert Agentic config can be true independently at parse time; effective dependency on Live is owned by Task 3.

- [ ] **Step 2: Run RED**

Run:

```powershell
npm --prefix server run test:ai-provider-unit
```

Expected: FAIL because the two config fields do not exist.

- [ ] **Step 3: Implement exact-string flags in `createAiConfig(env)`**

Add one internal helper with signature:

```text
enabledByExactOne(value) -> boolean
```

It returns true only for `value === '1'`; do not trim or coerce.

Add the two booleans to the returned config object.

- [ ] **Step 4: Run GREEN for activation config**

Run the same provider-unit command.

Expected: activation assertions PASS; any remaining Task 1 RED should now be only the no-retry assertions added next.

- [ ] **Step 5: Add RED assertion for OpenAI product `maxRetries: 0`**

In `test-ai-provider-unit.js`:

- assert `providerConfig('openai', env).maxRetries === 0`;
- instantiate the real OpenAI adapter from that config with a fake API key and an in-memory `fetchImpl` that always throws;
- call `generate` once;
- assert the fetch counter is exactly 1;
- assert no real network is used;
- do not require a particular normalized network error enum beyond the existing adapter contract.

- [ ] **Step 6: Run RED**

Run:

```powershell
npm --prefix server run test:ai-provider-unit
```

Expected: FAIL because current OpenAI product `providerConfig` does not set `maxRetries`.

- [ ] **Step 7: Implement OpenAI-only product no-retry config**

In `providerConfig(id, env)` return `maxRetries: 0` for `openai`.

Do not alter Gemini/ILMU retry semantics in this task.

- [ ] **Step 8: Run GREEN**

Run:

```powershell
npm --prefix server run test:ai-provider-unit
```

Expected: PASS and failing-fetch counter = 1.

- [ ] **Step 9: Document backend-only flags in `server/.env.example`**

Add:

```text
AI_CYBERGUARD_LIVE_ENABLED=0
AI_CYBERGUARD_AGENTIC_ENABLED=0
```

with comments that only exact `1` enables them and that Agentic is separately gated.

Do not add secrets or frontend variables.

- [ ] **Step 10: Task verification**

Run:

```powershell
npm --prefix server run test:ai-provider-unit
npm --prefix server run test:production-config
```

Expected: both PASS.

**Commit:** none — R5-05C persistence is not yet authorized.

---

### Task 2: Fail-Closed CyberGuard Live Gate

**Files:**
- Create: `server/scripts/test-cyberguard-live-activation.js`
- Modify: `server/src/ai/ai.service.js:494-640`
- Modify: `server/package.json:6-59`

**Interfaces:**
- Consumes: `config.cyberguardLiveEnabled` from Task 1 and existing `createAiService(repository, provider, config, options)`.
- Produces: Live-OFF in-scope requests fail with public `AI_RUNTIME_DISABLED` / HTTP 503 before learner/RAG/Agentic/Provider work.
- Produces verification command: `npm --prefix server run test:cyberguard-live-activation`.

- [ ] **Step 1: Create a DB-free focused test harness**

Create `test-cyberguard-live-activation.js` using:
- a fake repository that implements only the methods exercised by each case;
- a fake Provider with counters for `generateReply`;
- fake `ragService`, `controlledAgenticService`, and trace service counters;
- no socket/network/DB connection.

Test helper interface:

```text
runServiceCase({
  message,
  configOverrides,
  providerConfigured,
  providerReply,
  optionsOverrides
}) -> { result | error, counters, repositoryState, traceEvents }
```

This helper is test-only.

- [ ] **Step 2: Add RED in-scope Live-OFF cases**

For `How do I spot a phishing message?` and `cyberguardLiveEnabled:false`, assert:

```text
status = 503
code = AI_RUNTIME_DISABLED
providerCalls = 0
plannerCalls = 0
ragCalls = 0
learnerContextLoads = 0
generation.status = failed
generation.errorCode = AI_RUNTIME_DISABLED
```

Run the same case once with `provider.configured=true` and once with `provider.configured=false`; both must return the same policy error.

- [ ] **Step 3: Add RED deterministic precedence cases**

With Live OFF:

1. casual greeting → deterministic 201 response, Provider 0;
2. out-of-scope mathematics request → deterministic 201 boundary reply, Provider 0;
3. unsafe credential-abuse request → `AI_UNSAFE_REQUEST`, Provider 0.

Assert no planner calls in all three.

- [ ] **Step 4: Register the focused script**

Add:

```json
"test:cyberguard-live-activation": "node scripts/test-cyberguard-live-activation.js"
```

to `server/package.json`.

- [ ] **Step 5: Run RED**

Run:

```powershell
npm --prefix server run test:cyberguard-live-activation
```

Expected: Live-OFF in-scope assertions FAIL because current service proceeds to Provider configuration/runtime.

- [ ] **Step 6: Implement the Live OFF gate in `generateReply`**

After unsafe handling and deterministic casual/out-of-scope completion, before `provider.configured` and before learner/RAG work:

```text
if config.cyberguardLiveEnabled !== true:
  mark generation failed with AI_RUNTIME_DISABLED
  throw HTTP 503 / AI_RUNTIME_DISABLED
```

Use the existing safe `httpError` and `ERROR_CODES.AI_RUNTIME_DISABLED`.

Do not inspect or report Provider credential state before this policy result.

- [ ] **Step 7: Run GREEN**

Run:

```powershell
npm --prefix server run test:cyberguard-live-activation
```

Expected: all Live-OFF and deterministic precedence cases PASS, with Provider/planner/RAG/learner counters matching the contract.

- [ ] **Step 8: Preserve existing AI integration fixture semantics explicitly**

In `server/scripts/test-ai.js`, add these defaults to `startServer(...).env`:

```text
AI_CYBERGUARD_LIVE_ENABLED = "1"
AI_CYBERGUARD_AGENTIC_ENABLED = "1"
```

This keeps the pre-R5-05 integration suite exercising its existing live/mock Provider and Agentic behavior while production defaults become OFF.

Then run:

```powershell
npm --prefix server run test:scope-boundary
npm --prefix server run test:ai
```

Expected: PASS. Do not change production defaults to satisfy the old fixture.

**Commit:** none — R5-05C persistence is not yet authorized.

---

### Task 3: Separate Controlled Agentic Activation Boundary

**Files:**
- Modify: `server/src/ai/ai.service.js:412-448, 700-725`
- Modify: `server/scripts/test-cyberguard-live-activation.js`
- Modify: `server/scripts/test-agentic-traces.js:49-72`
- Modify: `server/scripts/test-learner-controlled-actions.js:49-72`
- Test: existing `server/scripts/test-controlled-agentic.js`

**Interfaces:**
- Consumes: `config.cyberguardAgenticEnabled` from Task 1.
- Produces: when Agentic is OFF, `buildControlledAgenticPlanning(...)` returns a policy-disabled audit object and does not call `controlledAgenticService.planAndExecute`.
- Disabled audit shape:

```text
{
  agenticEligible: false,
  agenticUsed: false,
  fallbackReason: "runtime_disabled",
  plannerProvider: null,
  plannerModel: null,
  proposedTool: null,
  toolExecuted: false,
  toolStatus: null,
  safeErrorCode: null,
  plannerLatencyMs: null,
  toolLatencyMs: null,
  modelRequestCount: 0,
  toolExecutionCount: 0,
  contextText: null,
  actionProposal: null,
  adaptiveUsed: false,
  adaptiveStatus: null,
  adaptiveSignalQuality: null,
  adaptiveFallbackReason: null
}
```

- [ ] **Step 1: Add RED Agentic-OFF case**

Use a message that existing `evaluateAgenticEligibility` would normally consider Agentic-eligible, for example a request to show the learner's recommended resources.

Set:

```text
cyberguardLiveEnabled = true
cyberguardAgenticEnabled = false
```

Assert:
- `controlledAgenticService.planAndExecute` calls = 0;
- final Provider calls = 1;
- returned response completes successfully;
- no model-origin proposal;
- deterministic action cards remain bounded;
- trace audit reports `planning.used=false`, `planning.fallbackReason=runtime_disabled`, modelRequestCount 0, toolExecutionCount 0.

- [ ] **Step 2: Add RED call-bound case**

For the same request, assert:
- final Provider invocation counter = 1;
- planner Provider invocation counter = 0;
- Agentic tool execution counter = 0.

This test is in-memory only and does not certify real outbound count; Task 1's OpenAI retry test pins SDK single-attempt behavior.

- [ ] **Step 3: Run RED**

Run:

```powershell
npm --prefix server run test:cyberguard-live-activation
```

Expected: FAIL because current `buildControlledAgenticPlanning` calls the configured Controlled Agentic service whenever it exists.

- [ ] **Step 4: Implement the Agentic policy short-circuit**

At the start of `buildControlledAgenticPlanning(...)`:

- if `config.cyberguardAgenticEnabled !== true`, return the exact disabled audit shape;
- do not call the Controlled Agentic service;
- preserve existing behavior when Agentic is enabled.

Gate the shared model-origin proposal helper before validation or persistence as well: when Agentic is disabled, ignore both Provider-returned and planner-returned `actionProposal`, never call the action proposal service, and return `proposal=null`. Preserve deterministic backend action cards and the existing Agentic-ON proposal precedence.

Do not change `controlledAgentic.service.js` or tool catalogue behavior unless the RED test proves the service wrapper cannot satisfy the policy boundary.

- [ ] **Step 5: Run GREEN**

Run:

```powershell
npm --prefix server run test:cyberguard-live-activation
```

Expected: PASS with planner 0 / final Provider 1 / tool 0.

- [ ] **Step 6: Preserve existing Agentic integration fixture semantics explicitly**

In both:
- `server/scripts/test-agentic-traces.js`
- `server/scripts/test-learner-controlled-actions.js`

add to the spawned server environment:

```text
AI_CYBERGUARD_LIVE_ENABLED = "1"
AI_CYBERGUARD_AGENTIC_ENABLED = "1"
```

These suites intentionally test the pre-existing model-origin planning/proposal path and therefore must opt in explicitly under the new default-OFF policy.

Then run:

```powershell
npm --prefix server run test:controlled-agentic
npm --prefix server run test:agentic-traces
npm --prefix server run test:learner-controlled-actions
```

Expected: PASS without changing production defaults.

**Commit:** none — R5-05C persistence is not yet authorized.

---

### Task 4: Client Runtime-Disabled Regression and Runtime Documentation

**Files:**
- Modify: `client/src/cyberguard/CyberGuardPilot.test.jsx:327-370`
- Modify: `docs/ai/cyberguard-runtime-flow.md:1-58`
- Verify: `client/src/i18n/locales/en.json`
- Verify: `client/src/i18n/locales/ms.json`
- Verify: `client/src/i18n/locales/zh-CN.json`

**Interfaces:**
- Consumes: existing public error code `AI_RUNTIME_DISABLED`.
- Produces: regression proof that the client renders safe localized copy and no retry button for the disabled product policy.
- Produces documentation of Live/Agentic gates and one-call product bound.

- [ ] **Step 1: Add the client RED regression row**

Extend the existing `test.each` table in `CyberGuardPilot.test.jsx` with:

```text
AI_RUNTIME_DISABLED
copy matches the localized "temporarily disabled" meaning
retryable = false
```

Do not change product UI code unless this existing behavior unexpectedly fails.

- [ ] **Step 2: Run focused client test**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
```

Expected: PASS if current client behavior is already correct. Because this is a regression characterization of existing behavior rather than a new frontend feature, an immediate PASS is acceptable and must be recorded as characterization, not RED evidence for production code.

- [ ] **Step 3: Verify locale authority**

Run:

```powershell
node scripts/verify-locales.js
```

Also confirm all three locale files contain `errors.codes.AI_RUNTIME_DISABLED`.

Expected: PASS; no locale change should be necessary.

- [ ] **Step 4: Update `cyberguard-runtime-flow.md`**

Document:
- deterministic safety/scope before Live gate;
- Live gate before learner/RAG/provider work;
- Agentic gate before Controlled Agentic planning;
- Live ON + Agentic OFF call bound;
- OpenAI `maxRetries=0`;
- Provider keys remain backend-only;
- R5-05 does not certify Agentic/RAG/learner-context quality or production readiness.

- [ ] **Step 5: Task verification**

Run:

```powershell
npm --prefix client test -- --watchAll=false --runTestsByPath src/cyberguard/CyberGuardPilot.test.jsx
node scripts/verify-locales.js
```

Expected: PASS.

**Commit:** none — R5-05C persistence is not yet authorized.

---

### Task 5: R5-05B Full Offline Verification and Candidate Review

**Files:**
- No required production-code additions.
- Write only untracked evidence under a new `review-evidence/r5-05b/<timestamp>/` directory.
- Review the approved design spec and this implementation plan against the final diff.

**Interfaces:**
- Consumes: Tasks 1–4 candidate.
- Produces: `R5-05B_READY_FOR_CONTROL_TOWER_REVIEW` evidence package with zero real Provider calls.

- [ ] **Step 1: Focused R5-05 verification**

Run:

```powershell
npm --prefix server run test:cyberguard-live-activation
npm --prefix server run test:ai-provider-unit
```

Expected: PASS.

- [ ] **Step 2: Required server regressions**

Run:

```powershell
npm --prefix server run test:ai
npm --prefix server run test:chat
npm --prefix server run test:controlled-agentic
npm --prefix server run test:agentic-traces
npm --prefix server run test:learner-controlled-actions
npm --prefix server run test:learning-actions
npm --prefix server run test:rag
node server/scripts/test-ai-age-context.js
npm --prefix server run test:scope-boundary
npm --prefix server run test:security-boundary
npm --prefix server run test:production-config
```

Expected: all PASS.

- [ ] **Step 3: Client/locales regression**

Run:

```powershell
node scripts/verify-locales.js
npm --prefix client test -- --watchAll=false
npm --prefix client run build
```

Expected: locale verification PASS, full client PASS, production build PASS.

Record any pre-existing CRA/Node warning separately; do not mislabel a warning as a failure or silently suppress it.

- [ ] **Step 4: Provider/network boundary review**

Prove from the focused tests/evidence:
- all Provider calls are fake/in-memory;
- no OpenAI/Gemini/ILMU live request occurred;
- Live-OFF cases report Provider 0;
- Agentic-OFF case reports planner 0 / tool 0 / final fake Provider 1;
- OpenAI failure fixture performs one in-memory fetch attempt due to `maxRetries=0`.

Run the two DB-free focused commands (`test:cyberguard-live-activation` and `test:ai-provider-unit`) with a compatible reviewer no-network/DB firewall preloaded through an absolute forward-slash `NODE_OPTIONS` path. The R5-05 service test needs a firewall that allows `ai.service` import while still blocking real network and DB access; the legacy R5-02 firewall cannot preload this service-level focused test unchanged. For this corrective, use the reviewer-only `review-evidence/r5-05b/control-tower-offline-20261006-R1/network-firewall-r5-05.cjs` without modifying it. Set `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `ILMU_API_KEY` empty and `AI_LIVE_GATE_AUTHORIZED=0`. Require `unexpectedRealNetworkAttempts=0`. This firewall blocks loopback HTTP too, so it is unsuitable for `test:security-boundary`, which uses only a local in-memory Express fixture. No staging DB or live Provider test is authorized by this corrective.

- [ ] **Step 5: Diff and secret guards**

Run:

```powershell
git diff --check
git status --porcelain=v1
git diff -- server/src/ai/ai.config.js server/src/ai/ai.service.js server/src/ai/providers/aiProvider.registry.js server/scripts/test-cyberguard-live-activation.js server/scripts/test-ai-provider-unit.js server/scripts/test-ai.js server/scripts/test-agentic-traces.js server/scripts/test-learner-controlled-actions.js server/package.json server/.env.example client/src/cyberguard/CyberGuardPilot.test.jsx docs/ai/cyberguard-runtime-flow.md docs/superpowers/specs/2026-10-06-cyberguard-controlled-live-activation-r5-05-design.md docs/superpowers/plans/2026-10-06-cyberguard-controlled-live-activation-r5-05.md
```

Perform a targeted secret scan on the candidate paths for:
- OpenAI-style keys;
- Google-style keys;
- GitHub tokens;
- private-key PEM blocks;
- accidental environment-value dumps.

Expected: diff check PASS, no secret findings.

- [ ] **Step 6: Requirements checklist**

Explicitly verify all spec acceptance criteria 1–15 before recommending persistence.

Write an untracked summary containing:
- exact candidate paths;
- test command results;
- Provider calls = 0/0/0;
- DB migration = none;
- source/Git mutations performed;
- known warnings;
- recommendation.

Expected terminal recommendation:

```text
R5-05B_READY_FOR_CONTROL_TOWER_REVIEW
```

**Commit:** none — stop at the R5-05C authorization boundary.

---

## Control Tower Operational Gates After Task 5

These are part of the R5-05 lifecycle but are **not authorized by approval of this implementation plan**.

### R5-05C — Persistence

**STOP CONDITION:** Requires separate Owner authorization for commit + fast-forward push.

Before any write:
- fresh `origin/develop`, `origin/master`, R3/R4 authority;
- HEAD and tracked/index state;
- exact reviewed candidate manifest.

Stage only explicit approved paths; never `git add .` or `git add -A`.

The persistence candidate may include:
- the approved R5-05 design spec;
- this implementation plan;
- exact Task 1–4 code/tests/docs;
- no review-evidence files.

Run staged diff/secret guards again before commit.

Push only `HEAD:refs/heads/develop`, fast-forward only. Do not move master or tags.

### R5-05D — Staging Integration / Inert

**STOP CONDITION:** Requires separate Owner API-staging deployment authorization.

Deploy exact R5-05 persisted commit to API staging only.

Leave both activation flags unset/OFF; no environment mutation is required merely to prove default fail-closed behavior.

Required evidence:
- exact commit checkout;
- Linux build/start PASS;
- Node runtime;
- `/api/health` 200;
- run `npm --prefix server run test:cyberguard-live-activation` (or equivalent exact focused harness) on the staging artifact through a Render one-off job;
- Provider calls 0;
- staging DB mutation 0;
- Web unchanged;
- production untouched.

### R5-05E — Bounded Product-Live Certification

**STOP CONDITION:** Requires a new explicit Owner authorization for:
- exactly one OpenAI product call;
- one outbound attempt;
- zero retries;
- explicit budget;
- bounded staging DB writes for a designated certification account/conversation.

Preferred execution:
- Render one-off job against the exact latest successful R5-05 staging artifact;
- process-local `AI_CYBERGUARD_LIVE_ENABLED=1`;
- process-local `AI_CYBERGUARD_AGENTIC_ENABLED=0`;
- public staging service remains Live-OFF;
- start the real Express application on loopback and exercise the normal authenticated chat + generation HTTP route;
- prompt: `How do I spot a phishing message?`;
- ID-bounded creation/cleanup only.

Required result:
- real authenticated conversation;
- one user message;
- one completed generation;
- one assistant message;
- final OpenAI model calls max 1;
- actual outbound max 1;
- retry 0;
- planner 0;
- Agentic tool 0;
- safe sources/actions;
- usage/cost persisted;
- no secret leakage;
- post-call health 200;
- no automatic rerun.

Only a passing R5-05E may grant:

```text
CYBERGUARD_PROVIDER_INTEGRATION_PASS
```

It still does not grant Agentic live certification, tool normalization, or production readiness.
