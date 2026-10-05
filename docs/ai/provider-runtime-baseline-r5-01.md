# R5-01 / CONTROL TOWER ACCEPTED BASELINE

# R5-01_PROVIDER_RUNTIME_BASELINE_REPORT

Execution date: **2026-10-05** (Asia/Kuala_Lumpur). Characterization / contract baseline only. Codex is primary executor; Control Tower remains independent review authority. No provider certification is granted here. R4 CLOSED / PLATFORM BASELINE LOCKED = PASS is supplied authority, not a new Codex ruling.

R5-01 Provider Runtime Inventory & Contract Baseline was independently reviewed and accepted by Control Tower on **2026-10-05**: **R5-01_CONTROL_TOWER_REVIEW = PASS_WITH_REQUIRED_PRECOMMIT_CORRECTIVE; PROVIDER_BASELINE = ACCEPTED**. This acceptance establishes static/configuration/contract baseline only and does **not** establish any current live provider certification. R5-01 remains pending final persistence verification until this exact document is committed and confirmed on origin/develop; final phase closure remains Control Tower authority. Owner authorized corrective documentation and single-file persistence only; R5-02 implementation and R5-03 live calls are not authorized by this acceptance.

Evidence classes:

- **A — Repository source truth:** inspected source at HEAD, installed dependency implementation and offline fixtures; implementation, not live behavior.
- **B — Current staging configuration truth:** read-only Render inventory and deploy metadata on execution date; secret keys only YES/NO.
- **C — Historical runtime evidence:** preserved July 18 artifacts; never carried forward as current certification.
- **D — Fresh official documentation:** official pages checked 2026-10-05 and linked beside facts; upstream support does not prove account access or Cyberly support.
- **E — Inference / proposed corrective:** recommendations only; no implementation or live action.

## 1. Repository Authority

| Item | Verified value / authority |
| --- | --- |
| Canonical repo | `C:\Users\AsusT\Documents\Codex\cyberly-main-ui-v2-account-center-r1` |
| Branch | `ui-v2-account-center-r1` |
| HEAD | `5654553c8d07485abeaaf1c8bf3707c2befc348f` |
| origin/develop local and remote | `5654553c8d07485abeaaf1c8bf3707c2befc348f` |
| Remote origin/master | `f76195d76fd44be5f1bed5e0ef7b33dd997f449b` — checked via git ls-remote; stale local tracking master is not authority |
| R3 tag | `r3-staging-accepted-2026-10-03`; object `9b27ccde8dac80f0ab1b0e66db269b37cf79deef`; peeled `f76195d76fd44be5f1bed5e0ef7b33dd997f449b` |
| R4 annotated tag | `r4-platform-baseline-2026-10-05`; object `9626f786e74d7eab96bf7f0c57d5d3ad1f47cbcd`; peeled `91a052736dda7d37c05ac315e9738b4c29937622` |
| API staging | `srv-d9tiop942hec738b3org`; `dep-db1kimdg1s2s73akmku0`, LIVE at `91a052736dda7d37c05ac315e9738b4c29937622` |
| Web staging | `srv-d9tj5hu5djic73a0auk0`; `dep-db1kkcegekts73e9r6ug`, LIVE at the same SHA |
| Node staging authority | `24.21.0`, accepted R4-06 evidence; fresh deploy query confirms accepted deployments remain latest LIVE; no new runtime shell proof |
| Pre-persistence index / tracked tree | Empty index; clean tracked tree; reviewed baseline candidate untracked before authorized persistence |
| Production | SUSPENDED / NOT CERTIFIED; untouched |

A/B: HEAD differs from deployed candidate only in three R4 governance documents: current-deployment.md, staging-operations-runbook.md, maintenance-debt-r4-04.md. Provider source and package/lock content are identical across this boundary, supporting source characterization without new runtime acceptance.

## 2. Current Provider Routing

A/B: createProviderSelectionPolicy selects default from AI_DEFAULT_PROVIDER || AI_PROVIDER || openai, then each purpose override or default. All these staging keys are absent.

| Selection | Effective provider | Source | Invocation evidence |
| --- | --- | --- | --- |
| default | openai | code fallback | registry policy |
| cyberguard_chat | openai | default / code fallback | ai.provider.js resolves purpose |
| agent_route_planning | openai | default / code fallback | agentModelGateway.js resolves purpose and permits only OpenAI |
| lightweight_tool_selection | openai | default / code fallback | assignment only; no production purpose-resolution call found |
| translation_assistance | openai | default / code fallback | assignment only; no production purpose-resolution call found |
| safety_evaluation | openai | default / code fallback | assignment only; no production purpose-resolution call found |

**AGENT_ROUTER_MULTI_PROVIDER_READY = NO. Current Agent Router = OPENAI_ONLY.** `createProviderSelectionPolicy()` exposes `AI_PROVIDER_AGENT_ROUTER`, but `server/src/agent/agentModelGateway.js` rejects any resolved provider whose id is not `openai`, with `AGENT_PROVIDER_NOT_ALLOWED`. Registry assignment capability is not production Agent Router provider support. This does not block the planned OpenAI-first path; the gateway is unchanged in R5-01.

Assignments do not prove the last three are separate implemented provider paths. No production service was inspected/invoked; this is staging policy and source behavior.

Missing configuration: resolveForPurpose rejects AI_PROVIDER_UNAVAILABLE / 503, with not_configured / AI_PROVIDER_NOT_CONFIGURED details. Adapter generation uses AI_PROVIDER_NOT_CONFIGURED; service checks configuration. Disabled and configured: purpose routing rejects unavailable, status details misleadingly say AI_AUTH_FAILED. Unknown provider: ordinary Unknown AI provider error, not uniform provider normalization; safeTestProvider can throw again in its catch while resolving the unknown ID. Admin route independently allowlists IDs and returns 404. None triggered live.

## 3. Safe Staging Configuration Inventory

B: API inventory timestamp `2026-10-05T07:42:21.5923612Z`; specified keys inspected individually, no full environment output. Workspace environment-group inventory contains zero groups, so none contributes settings.

| Secret key | KEY_PRESENT | Source |
| --- | --- | --- |
| OPENAI_API_KEY | YES | service env |
| GEMINI_API_KEY | NO | absent |
| GOOGLE_API_KEY | NO | absent |
| ILMU_API_KEY | NO | absent |

No secret value exposed: **PASS**. No value, length, prefix/suffix, fingerprint, hash or fragment recorded for these keys. Presence does not establish validity, quota or model access.

| Governance keys | Service value | Effective value | Source |
| --- | --- | --- | --- |
| AI_DEFAULT_PROVIDER; legacy AI_PROVIDER | absent | openai | code fallback |
| AI_PROVIDER_CYBERGUARD / AGENT_ROUTER / LIGHTWEIGHT / TRANSLATION / SAFETY | all absent | all openai | default / code fallback |
| AI_PROVIDER_RUNTIME_DISABLED | absent | gemini | undefined-key fallback |
| AI_TIMEOUT_MS | absent | 20000 ms | fallback |
| AI_MAX_OUTPUT_TOKENS | absent | 800 | fallback |
| AI_DAILY_BUDGET_USD | `10` | USD 10 estimated-spend threshold | service env |
| AI_DEFAULT_MODEL / AI_MODEL / OPENAI_MODEL | all absent | gpt-5.4-mini | fallback |
| GEMINI_MODEL | absent | gemini-2.5-flash | fallback |
| ILMU_MODEL | absent | nemo-super | fallback |
| ILMU_BASE_URL | absent | https://api.ilmu.ai/v1 | public provider endpoint fallback; official documentation confirmed |
| AI_PER_USER_MINUTE_LIMIT | absent | 6 | fallback |
| AI_PER_USER_DAILY_LIMIT | absent | 60 | fallback |
| AI_GENERATION_STALE_MS | absent | 60000 ms | fallback |

A: createAiConfig clamps timeout/output/user/stale numbers; direct registry conversion lacks the same clamps. Blank strings differ across parsers. Model precedence differs: service prefers AI_DEFAULT_MODEL / AI_MODEL / OPENAI_MODEL; direct registry prefers OPENAI_MODEL / AI_DEFAULT_MODEL / AI_MODEL; wrapper injects service model as OPENAI_MODEL. Current absent keys match defaults, but future explicit settings need review.

## 4. Provider Matrix

One matrix, transposed for readability. Declarations are static flags, not certification.

| Field | OpenAI | Gemini | ILMU |
| --- | --- | --- | --- |
| Adapter present | YES | YES | YES |
| Transport/API | SDK Responses | SDK models.generateContent | fetch Chat Completions |
| Installed SDK/library | openai 6.45.0 | @google/genai 2.12.0 | Node fetch |
| Effective model | gpt-5.4-mini | gemini-2.5-flash | nemo-super |
| Key present, staging | YES | NO (both key names absent) | NO |
| Runtime-disabled policy | NO | YES | NO |
| Effective purpose assignments | all five | none | none |
| Declared capabilities | chat/structured/tools/usage YES; streaming NO | chat/structured/tools/usage YES; streaming NO | chat/tools/usage YES; structured/streaming NO |
| Actual adapter capabilities | text/usage, Responses tools, prompt JSON; no format/schema | text/usage, declarations, JSON MIME; no schema | text/usage, flat tools mismatch; no response_format |
| Official upstream capabilities | Responses/functions/structured | functions/JSON/schema; restricted 2.5 access | Chat Completions/nested functions/JSON/schema/streaming; Claw access |
| Historical live/date | runtime_ok, 2026-07-18 | AI_AUTH_FAILED, 2026-07-18 | runtime_ok; tool AI_REQUEST_FAILED, 2026-07-18 |
| Current certification | ADAPTER_PRESENT only | ADAPTER_PRESENT only | ADAPTER_PRESENT only |
| Contract mismatches | format boolean overstates enforcement; response vs HTTP ID; string args | abort signal ignored; disabled/auth conflation; capability levels | Responses tools for Chat Completions; JSON gap; 5xx classification |
| Cost-accounting readiness | standard uncached rate matches; full attempt ledger absent | NO: OpenAI fallback prices | NO: OpenAI fallback prices |
| First-live prerequisites | selector, one attempt, no retries, approved budget/exact model | safeguards plus key/model access, timeout fix and diagnostic disabled policy | safeguards plus key/Claw access, tool fix and cost attribution |
| Next action | bounded health first after hardening | config/access/timeout corrective | tool/config/cost corrective |

## 5. OpenAI Contract

D: gpt-5.4-mini exists **YES**; Responses **YES**; function calling **YES**; structured output **YES**. Standard input **USD 0.75 / 1M**, output **USD 4.50 / 1M**, cached input **USD 0.075 / 1M**. Context **400,000**; max output **128,000**. Snapshot gpt-5.4-mini-2026-03-17 is listed; Cyberly uses moving alias. [Official model reference](https://developers.openai.com/api/docs/models/gpt-5.4-mini).

A: responses.create receives model, instructions, text input, max_output_tokens, tools, store:false. Instructions use explicit systemInstruction or combine prompt with learner/RAG/route context. Assistant role retained; other roles become user; content stringified. This is text-only input, not full tool-result/multimodal mapping. AbortController signal correctly passed as SDK options; timeout 20 s. Usage maps input_tokens/output_tokens with prompt/completion and total fallbacks; cached/reasoning breakdowns omitted.

A/D: Flat {type:function,name,description,parameters} matches Responses declarations. [Official function calling](https://developers.openai.com/api/docs/guides/function-calling). Adapter does not forward request.responseFormat, text.format, schema, toolChoice or temperature. structuredOutput=true therefore overstates enforced adapter support: **PROMPT_JSON_BEHAVIOR**, not enforced JSON/schema. Responses uses text.format for these controls. [Official structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

A: providerRequestId=response.id is a response resource ID, not SDK HTTP _request_id. Returned function arguments remain JSON strings in common normalization; downstream controlled validation must parse them. Errors use shared normalization. No adapter retry loop; SDK defaults apply.

C: July runtime_ok/prompt JSON/tool results are historical only. Current certification **ADAPTER_PRESENT**; no new AUTH_VALID, HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY.

## 6. Gemini Contract

D: gemini-2.5-flash remains configured fallback. Google limits 2.5 access to users who actively used it previously; not deprecated, served until further notice. New-project recommendations: **3.5 Flash-Lite or 3.8 Flash**. Cyberly entitlement unknown. [Official model catalog](https://ai.google.dev/gemini-api/docs/models). Function calling/structured output supported upstream. [Official 2.5 Flash](https://ai.google.dev/gemini-api/docs/models/gemini-2.5-flash).

D: Interactions API is GA since June 2026 and recommended for new projects; generateContent is legacy but fully supported. No migration/upgrade approved or performed. Future API decision needs privacy/state-retention review. [Official API lifecycle](https://ai.google.dev/gemini-api/docs/interactions-overview).

A: Adapter uses explicit apiKey from **GEMINI_API_KEY only**. GOOGLE_API_KEY alone does not configure it. SDK implicit mode prefers GOOGLE_API_KEY, then GEMINI_API_KEY; auth diagnostic tests explicit and implicit modes. Different keys can produce different conclusions. July general generator invokes explicit adapter: implicit-source ambiguity is not supported as an explanation of that artifact; exact historic account/key provenance unknown.

A: generateContent receives text parts, user/model roles, systemInstruction, temperature, maxOutputTokens, functionDeclarations and JSON responseMimeType for json_object. No responseSchema/responseJsonSchema. Static **JSON_MODE_ENFORCED implementation intent**, not schema or live certification. Second argument {signal} is ignored by installed SDK one-parameter implementation, which reads params.config.abortSignal. Timer therefore does not cancel the request as written. Even correctly wired Gemini client-side abort does not guarantee provider-side cancellation or absence of billable usage; usage after abort must remain unknown until evidence establishes otherwise. No fix here.

A/B: Undefined disabled setting disables Gemini. Current absent key means not_configured is returned before disabled policy. With key configured it would emit runtime_unavailable + AI_AUTH_FAILED without auth request. Purpose routing blocks; manual testProvider/safeTestProvider/live harness can still call: **SEMANTIC_MISMATCH**, even if diagnostics intend to bypass routing.

C: July AI_AUTH_FAILED is historical, not current invalid-key proof. Structured/tool checks skip on pre-test status and misleadingly label not_configured despite historical configured=true. Current certification **ADAPTER_PRESENT**.

## 7. ILMU Contract

D: nemo-super remains catalogued, **Claw-plan access**, context 256,000. Catalog availability is not account entitlement. [Official overview](https://docs.ilmu.ai/docs/getting-started/overview). Chat Completions documents prompt_tokens/completion_tokens/total_tokens and a completion body id. No x-request-id guarantee established; request-logging page could not be retrieved. [Official API](https://docs.ilmu.ai/docs/api/chat-completions).

D: Tools expect nested {type:function,function:{name,description,parameters}}, including nemo-super examples/public https://api.ilmu.ai/v1. [Official tool contract](https://docs.ilmu.ai/docs/capabilities/tool-use). JSON mode, json_schema and streaming documented. [Official structured outputs](https://docs.ilmu.ai/docs/api/structured-outputs).

A: Fetch POST <baseUrl>/chat/completions with Bearer key, text/system messages, max_tokens, temperature, tools/tool_choice and correct abort signal; no retry loop/streaming consumer. Tool helper instead sends flat Responses shape: **CONTRACT_MISMATCH**, confirmed by offline fake-fetch serialization. No response_format. structuredOutput=false is **CORRECTLY_CONSERVATIVE** for current adapter; upstream support exposes an **IMPLEMENTATION_GAP**, not support obtainable by changing a flag. Prompt JSON only, not enforced.

A: Inbound arguments parsed, malformed JSON silently becomes {}; usage maps prompt/completion. ID prefers body completion id, then optional x-request-id header, which have different meanings.

C/E: July tool AI_REQUEST_FAILED plus unchanged adapter/current documented schema/reproduced payload support **LIKELY_ROOT_CAUSE**, not proven historic runtime cause: original payload/error/account details unavailable. Current certification **ADAPTER_PRESENT**.

## 8. Structured Output Semantics

Ladder: **TEXT_ONLY → PROMPT_JSON_BEHAVIOR → JSON_MODE_ENFORCED → SCHEMA_CONSTRAINED_OUTPUT**. Higher levels require actual format/schema controls and corresponding evidence.

| Provider | Upstream (D) | Adapter (A) | Historical (C) | Currently certified |
| --- | --- | --- | --- | --- |
| OpenAI | schema-constrained available | prompt JSON only; responseFormat ignored | parsed JSON, no enforced mode/schema | NONE |
| Gemini | JSON/schema available | JSON MIME option, no schema | skipped | NONE |
| ILMU | JSON/schema available | prompt JSON only; response_format absent | parsed JSON, no enforced mode/schema | NONE |

Diagnostic parsing includes brace-delimited object extraction, not validation against a required schema. Historical parse-success is not schema conformity. Static classifications grant no current live capability certification.

## 9. Tool Contract

A: OpenAI outbound flattened; Gemini outbound [{functionDeclarations:[{name,description,parametersJsonSchema}]}]; ILMU incorrectly reuses flat OpenAI shape. OpenAI inbound Responses output/function_call carries string arguments; Gemini candidates/content/parts/functionCall carries object args with synthetic call IDs; ILMU choices/message/tool_calls/function arguments parsed. Common result: callId/toolName/arguments/provider.

normalizeToolDeclarations requires a 2–64-character permitted name/schema, trims description to 1,000 characters and rejects 14 prohibited names: SQL, score mutation, account/password changes, email, arbitrary URL, publishing, RAG mutation, safety bypass, secret/raw learner access. normalizeReturnedToolCalls filters those names; it does not independently enforce declaration allowlist, argument schema, roles or authorization. riskLevel/mode/allowedRoles remain backend metadata, not remote execution authority. Controlled Agent Gateway separately validates catalogue, read-only mode and arguments.

**Automatic execution in adapters/normalizers: NO.** Gemini SDK supports callable-tool loops for other inputs, but Cyberly passes plain function declarations, so that loop is not selected. No tool executed in R5-01. Existing controlled backend dispatcher is a separate runtime path, not provider-granted authority. String/object argument differences remain; shared normalization is not a uniform validated-object contract.

## 10. Error Semantics

A: Shared normalization preserves known codes; abort → AI_PROVIDER_TIMEOUT; 401/403 and applicable Google key/auth errors → AI_AUTH_FAILED; 429/RESOURCE_EXHAUSTED → AI_RATE_LIMITED; applicable 400 context/token errors → AI_CONTEXT_LIMIT; billing/region/precondition or otherwise unclassified 5xx → AI_PROVIDER_UNAVAILABLE; otherwise AI_REQUEST_FAILED.

| Condition | Service code / HTTP / retryable |
| --- | --- |
| Missing configuration | AI_NOT_CONFIGURED / 503 / false |
| Explicit disabled code | AI_RUNTIME_DISABLED / 503 / false |
| Authentication failure | AI_AUTH_FAILED / 503 / false |
| Rate limit | AI_RATE_LIMITED / 429 / true |
| Timeout | AI_TIMEOUT / 504 / true |
| Context limit | AI_CONTEXT_LIMIT / 413 / false |
| Unavailable | AI_PROVIDER_UNAVAILABLE / 503 / true |
| Request failure | AI_REQUEST_FAILED / 502 / true |

**Semantic mismatch: YES.** Disabled/configured registry status emits AI_AUTH_FAILED without authentication testing; configured/enabled emits runtime_ok without network test. resolveForPurpose throws unavailable instead of dedicated disabled code. Manual tests bypass disabled policy. Safe status does not persist results; Admin GET creates fresh registry. A diagnostic bypass may be intentional, but unqualified status names misrepresent tested evidence: **SEMANTIC_MISMATCH**.

ILMU prelabels non-401/403/429 errors AI_REQUEST_FAILED, including 500; shared normalization preserves it rather than 5xx unavailable/context classification. Offline 500 fixture confirms. retryable is response metadata, not automatic retry or authorization.

## 11. Cost Governance

A: createAiConfig → MODEL_PRICING_PER_MILLION → config.pricing → createAiService → selected provider.generateReply → token-only estimateCostUsd(...,config) → generation completion → repository.sumEstimatedCostToday. Stored provider/model use selected provider.id/model, falling back to config; pricing uses **config.model**, without resolved provider ID/model.

| Question | Finding |
| --- | --- |
| Price table | only gpt-5.4-mini, USD input 0.75/output 4.5 per 1M |
| Generation controls | selected CyberGuard provider/model; staging openai/gpt-5.4-mini |
| Price controls | config.model; unknown model silently uses gpt-5.4-mini; no provider dimension |
| OpenAI correctness | current standard uncached rate matches; not complete billing |
| Gemini switch | OpenAI fallback prices, not Gemini prices |
| ILMU switch | OpenAI fallback prices, not ILMU prices |
| Daily budget | USD 10 compares persisted estimates before generation; NOT OWNER LIVE-CALL AUTHORIZATION and NOT A HARD BILLING CAP |
| MULTI_PROVIDER_COST_ACCOUNTING_READY | **NO** |

sumEstimatedCostToday sums estimated_cost_usd where completed_at >= CURRENT_DATE. No in-flight reservation, next-call prediction or atomic global allowance; concurrent/new calls can exceed threshold. Cache breakdown/failed billable attempts not reconciled. Planner calls precede answer generation; only answer usage reaches this estimator, even when traces record planner usage. User generation limits do not bound SDK attempts/planner calls. DB timezone boundary is unverified.

E: Before multi-provider production routing: price by resolved provider/model plus approved version/tier/currency and token categories; fail closed for unknown prices; account for every planner/answer/diagnostic attempt including retries, failed/duplicate billable attempts; distinguish reported charges from estimates; reserve/reconcile shared budget atomically with explicit date boundary. No Gemini/ILMU price or R5-01 bill invented. Synthetic offline fixture only proves identical fallback calculation for three model labels.

## 12. Retry / Call Multiplication

| Provider | Adapter retries | Installed transport (A) |
| --- | --- | --- |
| OpenAI | no loop | new OpenAI({apiKey}) leaves maxRetries **2**; up to 3 eligible transport attempts within shared abort lifetime |
| Gemini | no loop | generateContent apiCall performs one fetch if httpOptions.retryOptions absent; Cyberly supplies none |
| ILMU | no loop | one fetch invocation |

Gemini retry options would enable retries if introduced later; separate Interactions client behavior is not current generateContent behavior. Plain declarations do not select callable-tool loops. OpenAI retries are not explicitly governed. Multiple attempts do not imply all billed: future Gates must measure attempts. SDK upgrades need renewed verification.

Defaults: timeout 20 s; output 800; per-user 6/minute and 60/day; daily estimate threshold USD 10; stale 60 s; local context 12 messages/8,000 characters. Health output overrides OpenAI 16 / others 5; structured/tool diagnostic 20. Agent Gateway requests 500 tokens, separate 5-second Promise.race timeout does not cancel underlying provider request. Trace maxModelCalls=2 is logical governance, not wire-attempt enforcement. One learner request need not mean one provider attempt.

**AUTOMATIC_FAILOVER_PRESENT: NO** in inspected registry/adapters/service. Deterministic planner/RAG fallback is not cross-provider retry. No failover added; future failover needs separate authority for cost/behavior/safety/accounting.

## 13. Existing Diagnostics Safety

| Harness | Classification | Behavior / result |
| --- | --- | --- |
| test-ai-provider-unit.js | **SAFE_OFFLINE** | explicit fixtures/mocks/fake fetch; no dotenv/DB; npm run exit 0, AI provider unit verification passed |
| test-ai-providers-live.js | **UNSUITABLE_FOR_SINGLE_PROVIDER_BOUNDED_GATE** | AI_LIVE_TEST=1 loops all configured providers; no selector/call limit; disabled not excluded; safe failed results do not stop subsequent providers or necessarily fail exit |
| ai-provider-runtime-diagnostics.js | R5-01 **NO**; first Gate **ONLY AFTER MODIFICATION** | starts backend PORT 5145; creates admin/login/session, cleans sessions/users; calls connection/structured/tool checks; overwrites three historical docs |
| gemini-auth-diagnostic.js | R5-01 **UNSUITABLE**; future **ONLY AFTER MODIFICATION** | up to 3 default logical calls: explicit Gemini SDK, implicit SDK, explicit adapter; --api-version-probe adds v1alpha/v1, total up to 5; prints forbidden key length/fingerprint metadata |

General generator has no AI_LIVE_TEST gate/selector. Three configured/enabled providers: 3 health + 3 structured + 3 tool = **9 logical calls**. Default Gemini-disabled with all configured: 3 health + 2 structured + 2 tool = **7**. Missing current keys reduce calls but do not authorize execution. SDK attempts may multiply these. Structured/tool checks use pre-health safe status/direct resolve; Array.isArray(toolCalls) passes even an empty array.

Generator entails DB INSERT/DELETE plus session writes despite cleanup. Artifact writer would overwrite history. No live/DB-backed diagnostic, Admin test or CyberGuard message run. Inspection of fingerprint-producing source did not reveal any fingerprint/key value. Admin GET/POST provider routes enforce requireAdmin and test IDs are allowlisted; reading source grants no diagnostic authority.

## 14. Historical Evidence

C: **HISTORICAL_RUNTIME_EVIDENCE_2026_07_18**. Exact generator server/scripts/ai-provider-runtime-diagnostics.js writes provider-runtime-status.json, provider-runtime-report.md, cyberguard-runtime-flow.md. JSON generatedAt 2026-07-18T06:00:11.063Z; report .066Z. Last generator change commit `034c39a5288919c303f8506bdff6a8a0199f77d5`, July 18. Format/generator establish provenance; no immutable execution manifest identifies exact historical checkout/env/invocation.

| Provider | Model | Dated result | Limitation |
| --- | --- | --- | --- |
| OpenAI | gpt-5.4-mini | runtime_ok 1975 ms; usage/id; parsed JSON; one returned tool call | tiny diagnostic, not full chat/safety/schema certification |
| Gemini | gemini-2.5-flash | health AI_AUTH_FAILED; JSON/tools skipped | historical explicit adapter failure; now key absent; skip conflates disabled/unconfigured |
| ILMU | nemo-super | runtime_ok 420 ms; usage/id; parsed JSON; tool AI_REQUEST_FAILED | prompt JSON only; likely tool shape cause unproven; now key absent |

Generator execution entails **provider calls YES** for configured checks and **DB writes YES** for admin/session/cleanup. DB deployment and exact historical retries cannot be reconstructed. Since that commit: OpenAI adapter +33 lines, error normalization +2, server package/lock changes; Gemini/ILMU adapter and ai.config source unchanged in that comparison. Current Gemini/ILMU keys absent, unlike history. SDK/config/time differences prevent carry-forward certification.

**Current carry-forward certification: NONE.** Three historical files hash-checked before/after; not overwritten. Prior review-evidence inventoried and preserved, excluding dependency directories from prior-file hash set.

## 15. Current Certification States

| Provider | Certification ceiling | Additional static/config facts |
| --- | --- | --- |
| openai | **ADAPTER_PRESENT** | CONFIG_KEY_PRESENT YES; MODEL_CONFIGURED; ROUTING_ASSIGNED; STATIC_CONTRACT_CHARACTERIZED |
| gemini | **ADAPTER_PRESENT** | CONFIG_KEY_PRESENT NO; fallback model/disabled policy characterized; no assignment |
| ilmu | **ADAPTER_PRESENT** | CONFIG_KEY_PRESENT NO; fallback model characterized; no assignment |

None newly establishes AUTH_VALID, HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY. Key presence, July success, SDK import and mock shapes are insufficient. Registry runtime_ok is not current health certification. OpenAI **0**, Gemini **0**, ILMU **0** live calls.

## 16. First Live Gate Recommendation

E: Proposed order **OpenAI → Gemini → ILMU**, conditional on corrective prerequisites/new explicit authorization. OpenAI first: current default/purpose choice, staging key, valid model/API family; basic text health avoids structured/tool gaps. This is not authentication/access proof.

Proposal: **OpenAI health only**, exact approved model, fixed non-learner prompt, **max 1 logical invocation and 1 outbound transport attempt**, **max output 16 tokens**; no tools/schema/chat/session/DB/API route; Gemini/ILMU zero. Isolated hardened harness, explicit maxRetries=0, counter, input bound, timeout cancellation, duplicate detection and fail-closed stopping. Preserve store:false. No automatic retry/failover/config/migration/deployment.

Budget prerequisite: Owner authorizes explicit USD ceiling and bounded input/output; validated model price/attempt accounting required. Existing AI_DAILY_BUDGET_USD=10 is not Gate authorization or its budget. Actual tokens/cost cannot be invented before request. Chat/structured/tool claims need separate bounded evidence; health success alone does not certify them.

Gemini needs authorized key/config remediation, exact model access/lifecycle decision, config.abortSignal corrective and explicit diagnostic disabled-policy handling. ILMU needs key/Claw access and nested Chat Completions tool corrective before tool checks. Both need provider-specific cost attribution. No catalog recommendation automatically authorizes a model/API/SDK upgrade.

Minimum future call record:

| Field | Contract |
| --- | --- |
| provider / model / purpose | exact resolved values, API family, SDK version and candidate |
| authorized max / actual calls | distinct logical and wire attempts; global/provider counter; hard stop at allowance |
| max output / actual input / actual output | requested bound and returned usage; unavailable explicitly marked |
| estimated / provider-reported cost | currency, approved price version/tier/token categories, availability and remaining budget |
| latency | attempt/aggregate duration |
| request ID presence | HTTP ID distinct from response/completion ID; protected evidence |
| result code / retries / duplicates | exact result and retry/duplicate counts; fail closed on unexpected attempts |

## 17. R5-02 Recommendation

E: **R5-02 — BOUNDED LIVE-GATE HARNESS & CERTIFICATION SEMANTICS**. Immediate purpose: build a safe mechanism for the first OpenAI live health Gate, with offline verification first. This recommendation does not authorize implementation or live calls. It replaces the earlier broad combined provider-corrective proposal.

| Required boundary | Minimum next-stage scope |
| --- | --- |
| A. Single-provider selector | Require explicit provider=openai\|gemini\|ilmu; no implicit loop over configured providers |
| B. Exact model binding | Record and enforce exact Owner-approved model; reject mismatch |
| C. Logical limit | First Gate maximum 1 logical call |
| D. Transport limit | First Gate maximum 1 outbound attempt; unexpected second attempt FAIL CLOSED |
| E. OpenAI retries | Invoke Cyberly OpenAI adapter with maxRetries=0 or equivalently proven no-retry path; do not globally change production retry policy merely for harness |
| F. DB-free | No admin/session/conversation/learner data/migration/staging DB write |
| G. Fixed diagnostic | Tiny fixed health prompt; no tools/RAG/learner context/agent route/structured-output request |
| H. Output bound | First OpenAI health candidate maxOutputTokens=16 |
| I. Accounting | Provider, exact model, purpose, authorized/actual logical calls, authorized/actual transport attempts, requested output maximum, actual usage if available, latency, result, HTTP/provider request-ID availability, unexpected retries and duplicates |
| J. Safe failure | No fallback provider, rerun, retry after failure or provider fan-out |
| K. Status semantics | Separate CONFIGURED, ENABLED, NOT_TESTED, AUTH_VALID and HEALTH_PASS; disabled policy must not imply AUTH_FAILED; key presence must not imply runtime_ok |

Deferred later R5 work: OpenAI structured-output forwarding; Gemini API/model migration or live authentication; ILMU tool fix or structured output; multi-provider cost accounting; Agent Router multi-provider enablement. Gemini timeout/cancellation and other provider implementation findings remain recorded for their corresponding later scopes. These are not bundled into the immediate OpenAI-health harness stage; required correctives must precede the corresponding provider/capability certification or production routing. No source fixes, pricing additions, model/SDK/API migration or gateway changes in R5-01.

After R5-02 is independently accepted and persisted, next planned stage is **R5-03 — OPENAI BOUNDED HEALTH GATE**: OpenAI, exact `gpt-5.4-mini` subject to fresh execution-time verification, at most 1 logical call / 1 transport attempt, max output 16, no tools or DB, Gemini 0 and ILMU 0. **R5-03 NOT STARTED / NOT AUTHORIZED.** Separate Owner budget and live-call authorization remain mandatory; R5-01 persistence grants neither.

## 18. Artifact / Verification Evidence

Sole Owner-authorized persistence candidate: **docs/ai/provider-runtime-baseline-r5-01.md**. Raw evidence remains untracked in review-evidence/r5-01/:

- staging-config-safe.json: specified-key safe observations/source/timestamp.
- authority-and-sources.json: Git/deploy identities, source hashes/official URLs.
- provider-unit.log: authorized offline unit result.
- offline-contract-probes.cjs / .json: SDK stubs, blocked network/fake-fetch shape; final exit 0; live calls/network attempts 0.
- historical-hashes-before.json, evidence-before.json, preservation-final.json: preservation/scope checks.

Commands/checks: read-only git branch/rev-parse/ls-remote/log/diff/status/cat-file; rg/Get-Content for required config/provider/service/error/tools/registry, all four scripts, Admin routes, setup/history and installed SDK internals; safe individual-key Render GET inventory and list_deploys for staging services; official browsing; `npm --prefix server run test:ai-provider-unit`; `node review-evidence/r5-01/offline-contract-probes.cjs`; source/historical/prior-evidence SHA256 and document/scope checks. No full-env dump or server/.env inspection for characterization.

Offline unit **PASS exit 0**; stub/fake-fetch probes **PASS exit 0**, live calls zero. Early probe-only syntax/stub-resolution/container-shape errors corrected inside new untracked probe; no runtime edits or live request. Local Node **24.13.0**: this is not new Render Node 24.21.0 runtime proof. Full build/regression suites not run, because runtime/UI/packages unchanged. Manual browser verification **not needed for documentation-only R5-01**; later live chat/UI verification requires separate authorization. No Admin connection test opened.

## 19. Change Boundary

| Boundary | Result |
| --- | --- |
| Runtime / existing tests | UNCHANGED |
| Package / lock | UNCHANGED |
| Local/service/group env | UNCHANGED |
| Render config / deployment | UNCHANGED; read-only only |
| DB / migrations / backup / restore | NO MUTATION; none executed |
| Provider calls | OpenAI 0 / Gemini 0 / ILMU 0 |
| SMTP | 0 |
| Production | UNTOUCHED |
| Historical docs / prior evidence | PRESERVED |
| Persistence scope | Original characterization used no commit/push; Owner subsequently authorized commit/push of this document only to origin/develop. Branch unchanged; raw evidence excluded. Exact persistence identity is recorded in the separate report |

## 20. Issues / Limitations

A–E: Auth/quota/region/billing/model access, output/safety/latency/tool reliability and billing remain untested. Staging inventory is point-in-time config, not credential validity. Node/runtime acceptance remains R4 evidence; offline local Node patch differs. Historic exact payload/env/SDK/attempt ledger insufficient for proven root cause. ILMU request-logging page unavailable; no unsupported HTTP-ID guarantee. Unknown-provider handling, parser/model precedence differences, OpenAI format metadata, Gemini timeout, ILMU tool/error/JSON, disabled status and single-model accounting remain unfixed. Characterizing blockers does not authorize live or production certification.

## 21. Recommended Gate

Control Tower independently accepted the baseline on 2026-10-05 with required precommit corrective. This document records those correctives and remains **pending final persistence verification** until the exact document commit is confirmed on origin/develop. After verified persistence, the executor may recommend **R5-01_PERSISTED_READY_FOR_FINAL_CONTROL_TOWER_VERIFICATION**, without self-declaring R5-01 CLOSED, R5 LIVE READY or any provider HEALTH_PASS. Final closure belongs to Control Tower.

Provider baseline: OpenAI / Gemini / ILMU **ADAPTER_PRESENT** only. Production remains SUSPENDED / NOT CERTIFIED. Owner-authorized commit/push is restricted to this document; no R3/R4 tag movement, master change, live call, deployment or provider-config change. Stop after persistence and its report. R5-02 is the bounded harness/semantics next stage; R5-03 is NOT STARTED / NOT AUTHORIZED.
