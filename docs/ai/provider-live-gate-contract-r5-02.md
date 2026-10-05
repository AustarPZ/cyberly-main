# R5-02 / CONTROL TOWER ACCEPTED HARNESS CANDIDATE

# Bounded Live-Gate Harness & Certification Semantics

Initial implementation and offline verification, followed by accepted R5-02A API staging integration, 2026-10-05. R5-01 CLOSED is supplied Control Tower authority; its governing baseline is preserved. The initial candidate was verified locally. The exact reviewed eight-file candidate was persisted as 1160b07780eb1cba5b6fe7a609311c901f1a0900 and subsequently deployed to API staging only under separate R5-02A authorization. **R5-03 NOT STARTED / NOT AUTHORIZED.** OpenAI/Gemini/ILMU live calls: **0 / 0 / 0**. Fixture successes are not live provider certifications.

R5-02 Bounded Live-Gate Harness & Certification Semantics was independently reviewed and accepted by Control Tower on **2026-10-05**: **R5-02_CONTROL_TOWER_REVIEW = PASS_WITH_REQUIRED_PRECOMMIT_CORRECTIVE; LIVE_GATE_HARNESS = ACCEPTED; OPENAI_FUTURE_GATE_HARDENING = PASS; CERTIFICATION_SEMANTICS = ACCEPTED**. This acceptance establishes an offline-verified harness candidate only. No provider live certification is established. The reviewed R5-02 candidate is committed and confirmed on origin/develop at 1160b07780eb1cba5b6fe7a609311c901f1a0900; its API staging integration was independently accepted in R5-02A as recorded below. Final closure remains Control Tower authority; R5-03 remains **NOT STARTED / NOT AUTHORIZED**.

## Purpose and authority

Build a DB-free, one-provider plain-text health mechanism for a separately authorized future Gate. Initial R5-02 baseline HEAD/origin/develop: `53aab9a51c04d70c521ee230de0fda8f5e391b3d`; remote master: `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`; annotated R4 tag peels to `91a052736dda7d37c05ac315e9738b4c29937622`. At initial R5-02 review, staging remained that R4 candidate. Current split staging is Web at the immutable R4 SHA and API at 1160b07780eb1cba5b6fe7a609311c901f1a0900; see the R5-02A acceptance section and canonical current-deployment.md.

## Entry point and authorization

`server/scripts/ai-provider-live-gate.js`, package entry `gate:ai-provider-live`. It requires both `--execute` and process env `AI_LIVE_GATE_AUTHORIZED=1`, plus explicit `--authorization-id`, `--provider`, `--model`, `--budget-usd`. No provider/model/budget defaults, no automatic dotenv, prompts or output-limit override. Unknown/duplicate CLI flags fail closed. Authorization ID is a bounded non-secret ASCII identifier; known key-like patterns are refused. Optional `--candidate-sha` must be exactly 40 lowercase hex characters; absent SHA is null, never fabricated. Future Owner authority must name the exact candidate and CLI model; the dual flags are execution interlocks, not permission granted by this document.

Only `provider=openai` is executable after guards. Recognized Gemini/ILMU selectors return **PROVIDER_NOT_YET_HARDENED** before network; no provider registry loop or failover exists. Unknown selectors are rejected. Current supported cost-authorized model is exactly `gpt-5.4-mini`; unknown pricing fails closed without the ordinary AI config fallback. Do not run the live command in R5-02. Fresh model/price and explicit budget/live authorization are required separately for R5-03.

## Logical and transport boundary

Maximum 1 logical invocation and 1 outbound request. A logical guard increments/checks before generate; a second callback is never invoked. Transport wrapper increments transportInvocationCount before checks; a second invocation throws before fetch, leaving actualOutboundAttemptCount at 1. `maxRetries=0` is injected into the actual OpenAI SDK client; ordinary production callers without overrides retain SDK defaults. No failure causes rerun, fallback or fan-out.

Destination allowlist: HTTPS, api.openai.com, default HTTPS port, no credentials/query/fragment, exact `/v1/responses`, method POST. Fetch receives `redirect:'error'`. The request counter increments immediately before the underlying fetch invocation, so a failed connection still consumes its sole allowance. Native fetch connections are not packet/socket counts; redirects are forbidden and SDK retry attempts are disabled. SDK/environment base-URL variations that miss the allowlist are refused rather than broadened. A rejected destination or second attempt is reported using the guard's own safe code even when the adapter normalizes transport errors.

## Fixed request and DB firewall

System: `Cyberly internal provider health check. Reply with OK.` User: `Reply with OK.` Output maximum 16 tokens; text input only, tools empty, no structured output, store:false. No learner/account/session/RAG/route/planner/file/image input. Script imports only the OpenAI adapter; it does not load server, service, repository, DB pool, Admin routes, migrations or session stores. No automatic file writer. A successful health reply must be completed, exactly OK after trim, have no returned tool call and have matching request/returned model. If OpenAI returns a resolved snapshot or otherwise different identifier, the Gate fails closed as INVALID_HEALTH_RESPONSE. This is an accepted conservative false-negative risk. Matching is not broadened during persistence; any alias/snapshot equivalence rule requires separate Control Tower review before live execution.

## Certification semantics

Registry keeps configured/runtimeAvailable/model/capabilities/effectivePurposes, selection policy and manual test authorization intact. Additive enabled/testState/authState/healthState describe policy and test evidence separately.

| State | Routing eligibility | lastRuntimeStatus / lastRuntimeError | Evidence states |
| --- | --- | --- | --- |
| Missing key | false | not_configured / AI_PROVIDER_NOT_CONFIGURED | not_tested |
| Configured, disabled | false | runtime_disabled / AI_RUNTIME_DISABLED | not_tested |
| Configured, enabled | true as before | not_tested / null | not_tested |

runtimeAvailable means routing eligibility, not HEALTH_PASS. Static key presence never establishes auth validity. Admin list uses existing configured/runtimeAvailable fields; policy-disabled now reaches generic unavailable wording instead of false authentication-failure wording. Client source is unchanged; manual connection-test role/allowlist enforcement is unchanged. Existing DB-backed Admin test expectations are updated minimally but the test is not run in this phase.

Bounded Gate preflight refusals: testState/authState/healthState remain not_tested. After an outbound test: a valid completed OK response gives authState valid / healthState pass for that exact Gate only. 401/403 gives invalid/fail; timeout/429/5xx/network failure gives unknown/fail. Invalid/mismatched output gives fail without auth certification. Client abort does not prove server cancellation or absence of billable usage. The Gate does not persist certification back to the registry or overwrite historical evidence.

## Budget boundary

Explicit positive finite `--budget-usd` is mandatory and recorded as authorizedBudgetUsd. AI_DAILY_BUDGET_USD is never read as Gate authority. Known standard uncached prices are gated by exact model: gpt-5.4-mini input USD 0.75 / 1M, output USD 4.50 / 1M, from the accepted R5-01 observation. No general Gemini/ILMU pricing.

Preflight compares the supplied budget with a conservative planning allowance of 1,024 input + 16 output tokens at that price. The 1,024 input allowance is a planning estimate, not a measured token count or a provider hard billing guarantee. It does not choose the Owner budget; insufficient allowance fails before outbound. Returned input/output usage supports an uncached estimate; output beyond 16 or estimate beyond authorization yields BUDGET_OR_USAGE_EXCEEDED, with no retry. Missing usage/cost is null; no provider-reported charge is invented. An approved Gate budget is a governance allowance, not a provider-side hard spending guarantee. Failed/aborted usage and cost can remain unknown. No automatic second call is authorized to resolve ambiguous billing or failed evidence. Cached input, provider billing adjustments and server-side charges require later reconciliation; this does not change the existing multi-provider-accounting readiness NO.

## Safe result schema

One JSON result to stdout, exit 0 only for HEALTH_PASS, otherwise nonzero. Importing script is inert. Error messages/SDK payload/headers/environment are not emitted. No automatic tracked/raw output writes. Caller may capture stdout separately under authorized new evidence.

Refusals without completed authorization/preflight record zero authorized calls/attempts; accepted preflight records maximum one. Fields: gateVersion; authorizationId; provider; model; purpose; candidateGitSha; configured; enabled; testState; authState; healthState; logicalCallsAuthorized/Actual; transportAttemptsAuthorized; transportInvocationsActual; actualOutboundAttempts; maxOutputTokens; maxRetries; usage(inputTokens/outputTokens/totalTokens) or null; estimatedCostUsd or null; providerReportedCostUsd null; authorizedBudgetUsd; latencyMs; providerResponseId/Available; httpRequestId/Available; finishReason; resultCode; retryCount; unexpectedDuplicateAttempt; timestamp.

Existing providerRequestId remains response.id for persistence compatibility. New providerResponseId records response.id; httpRequestId records SDK _request_id when available. Gate exposes only bounded resp_/req_ identifier shapes and suppresses values containing the configured key; absent/unsafe identifiers become null. Presence is not guaranteed. Auth/health unknown remains distinct from invalid. Actual counters are shown even for failed checks, so a rejected second invocation has two transport invocations but only one outbound attempt.

## Verification and deferred scope

`test:ai-provider-unit` and `test:ai-provider-live-gate` are offline. Dedicated test uses actual installed OpenAI SDK with in-memory Response/fetch fixtures and blocks global fetch/http/https/net/tls, including Socket.connect, plus forbidden DB/server imports. It checks authorization omissions, disabled/missing configuration, selector/model/budget rejection, fixed request, SDK retries, endpoint/method/redirect enforcement, duplicate/logical guards, safe IDs/results, status semantics, and success/error/mismatched-model/missing-usage fixtures. An external blocked-network preload also covers the required npm commands and inert CLI. Test outputs belong to review-evidence/r5-02 and remain untracked. No full backend DB suites or client run; no browser verification needed for this local mechanism. Later actual live evidence is separately authorized.

Deferred unchanged: OpenAI structured forwarding; Gemini cancellation/model/API/key/default-disable implementation; ILMU tools/response_format/5xx/key; multi-provider pricing; Agent Router multi-provider enablement. Agent Router remains OPENAI_ONLY, multi-provider readiness NO. Old multi-provider live harness and July runtime artifacts are preserved.

## Historical R5-02 persistence and staging recommendation

The initial R5-02 Owner authorization allowed commit/push of only the reviewed eight-file candidate to origin/develop after all authority/offline/scope/secret guards pass. No raw evidence, master or tag changes. No deployment, environment/Render mutation or provider request. Exact commit/push evidence is recorded separately under untracked review-evidence/r5-02/persistence. After verified persistence, the executor may recommend R5-02_PERSISTED_READY_FOR_FINAL_CONTROL_TOWER_VERIFICATION, without declaring R5-02 CLOSED or any provider live certification.

The initial recommended next stage was **R5-02A HARNESS STAGING INTEGRATION**: separately authorized exact-candidate staging deployment with ZERO provider calls, Render Linux build/start, harness files present, Node 24.21.0, API health/ordinary bounded regression smoke, and inert Gate NOT_AUTHORIZED with zero outbound provider requests. This persistence task does not perform or authorize that deployment. Only after R5-02A passes may Control Tower prepare R5-03, which still needs separate Owner budget/live-call authorization.

## R5-02A staging integration acceptance — 2026-10-05

Control Tower independent decision: **R5-02A_CONTROL_TOWER_REVIEW = PASS_WITH_ACCEPTED_OBSERVABILITY_LIMITATION; R5-02A_TECHNICAL_STAGING_INTEGRATION = PASS; R5-02_HARNESS_STAGING_READY = YES.** The R5-02 harness is **LOCAL/OFFLINE ACCEPTED / PERSISTED / API STAGING INTEGRATED**. R5-02A acceptance persistence remains pending final Control Tower verification; final closure is not declared here.

API service srv-d9tiop942hec738b3org is LIVE at exact candidate **1160b07780eb1cba5b6fe7a609311c901f1a0900**, deploy **dep-db1nu4ou01pc73fbe5e0**. Web service srv-d9tj5hu5djic73a0auk0 remains LIVE at **91a052736dda7d37c05ac315e9738b4c29937622**, deploy **dep-db1kkcegekts73e9r6ug**; Web was not deployed in R5-02A. The annotated R4 baseline tag remains at its immutable R4 SHA; no R3/R4 tag was moved and no new baseline tag is created.

Accepted evidence: Render Linux PASS; Node build **24.21.0**, runtime **v24.21.0**; bcrypt load/hash/compare PASS; API build/start PASS; /api/health, /api/resources?locale=en and /api/resources/phishing?locale=en all HTTP200. Running-instance inert invocation **node server/scripts/ai-provider-live-gate.js**, with no --execute or temporary AI_LIVE_GATE_AUTHORIZED=1, returned **NOT_AUTHORIZED**. logicalCallsAuthorized = 0; logicalCallsActual = 0; transportAttemptsAuthorized = 0; transportInvocationsActual = 0; actualOutboundAttempts = 0. Inert verification PASS; OpenAI/Gemini/ILMU calls **0 / 0 / 0**, SMTP **0**.

**ACCEPTED_NONBLOCKING_OBSERVABILITY_LIMITATION:** The supplemental current-instance error-log query encountered Render logging backend **503 / upstream 502** and was not retried. Successful build/start logs, LIVE record, running-instance proof, HTTP smoke and inert Gate verification were independently available. **FULL_POST_START_ERROR_LOG_SCAN = NOT_AVAILABLE_DUE_RENDER_LOG_BACKEND_ERROR**. No full post-start scan PASS or absence of every possible runtime warning is established.

CATEGORY 0 — NO DATABASE CHANGE: fresh R4 API baseline to R5-02 candidate server/migrations delta NONE and client delta NONE. No backup, migration, restore or DB mutation. API configuration retained branch master, autoDeploy OFF, repository root, build npm --prefix server ci, start npm --prefix server start and health GET /api/health. No NODE_VERSION override, Gate authorization key, linked environment group or new secret file added by R5-02A; no secret value exposed. Production UNTOUCHED.

Provider certification remains **OpenAI = ADAPTER_PRESENT; Gemini = ADAPTER_PRESENT; ILMU = ADAPTER_PRESENT**. No AUTH_VALID, HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY has been granted. Harness integration is not provider live certification. **R5-03 NOT STARTED / NOT AUTHORIZED**; any bounded live Gate requires separate Owner budget/live-call authorization.

This task persists only accepted documentation to origin/develop: no deployment, restart, Render/environment change, provider call or DB action. See [canonical current deployment](../production/deployment/current-deployment.md) for current split staging truth. Raw R5-01/R5-02/R5-02A evidence remains preserved and untracked.

**R5-02A pending final acceptance persistence verification. DO NOT DEPLOY. R5-03 NOT STARTED / NOT AUTHORIZED. Stop after persistence report; final closure belongs to Control Tower.**
