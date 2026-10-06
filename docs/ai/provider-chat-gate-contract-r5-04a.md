# R5-04A

**CONTROL TOWER ACCEPTED / OFFLINE CANDIDATE PASS**

Local, offline-only bounded provider chat harness candidate, 2026-10-06. Control Tower accepted the exact three-file offline candidate and the Project Owner separately authorized persistence. This record does not authorize a provider call, deployment, environment change or database action. Fixture CHAT_PASS results prove only the candidate's offline behavior; **R5-04A offline PASS does NOT grant OpenAI CHAT_PASS**. Final persistence verification and closure remain Control Tower authority.

## Purpose and verified baseline

Gate version: `r5-04a-v1`. Purpose: `bounded_provider_chat`. Conversation contract: `chat-context-v1`.

The accepted [R5-03D identity policy](provider-model-identity-policy-r5-03d.md) and R5-03F bounded live validation establish the existing OpenAI `ADAPTER_PRESENT / AUTH_VALID / HEALTH_PASS` baseline. This candidate adds a separate, DB-free chat capability check. It preserves the accepted health Gate and its historical evidence. OpenAI `CHAT_PASS`, `TOOL_NORMALIZATION_PASS` and `PRODUCTION_READY` remain NO; Gemini and ILMU remain `ADAPTER_PRESENT` only.

The entry point is `server/scripts/ai-provider-chat-gate.js`, with offline fixtures in `server/scripts/test-ai-provider-chat-gate.js`. It invokes only `createOpenAiProvider(...).generate(...)` through the unchanged OpenAI adapter. It does not load the server, chat service, registry, repository, DB pool, sessions, learner context, RAG retrieval, actions or route planning. The existing `validateProviderOutput` function supplies the output safety predicate. No learner-facing behavior or API response format is changed.

## Fixed conversation and wire request

The system instruction is exactly:

```text
Cyberly internal bounded chat capability check. Use only the supplied conversation context. Reply with the requested token exactly and with no extra text.
```

The supplied transcript contains exactly three messages in this order:

| Role | Exact content |
| --- | --- |
| user | Remember the token from the assistant's next message for my following question. |
| assistant | CYBERLY_CHAT_47 |
| user | What token did the assistant just give me? Reply with the token only. |

The expected trimmed reply is exactly `CYBERLY_CHAT_47`. Case changes, missing token, extra text, punctuation or a different token fail the conversation predicate. Leading and trailing whitespace alone is accepted.

The token is intentionally absent from both user messages and appears only in the prior assistant message. This makes a future live CHAT_PASS semantically dependent on assistant-history context, not merely on an earlier user turn.

The adapter request contains this instruction, the fixed messages, `maxOutputTokens:16`, `tools:[]` and `metadata:{purpose:'bounded_provider_chat'}`. Metadata identifies local intent; it is not forwarded as another Responses JSON field. The installed SDK serializes only:

```json
{
  "model": "gpt-5.4-mini",
  "instructions": "Cyberly internal bounded chat capability check. Use only the supplied conversation context. Reply with the requested token exactly and with no extra text.",
  "input": [
    { "role": "user", "content": "Remember the token from the assistant's next message for my following question." },
    { "role": "assistant", "content": "CYBERLY_CHAT_47" },
    { "role": "user", "content": "What token did the assistant just give me? Reply with the token only." }
  ],
  "max_output_tokens": 16,
  "store": false
}
```

The serialized body has no `tools` key, `text.format`, `response_format`, `previous_response_id`, `conversation` or learner/RAG/route contexts. There are no files, images, structured output, streaming, tool execution or generated follow-up messages. The assistant message is supplied as input; it is not obtained through an additional provider request. The fixed transcript is the entire conversation contract.

## Explicit authorization and bounded execution

Execution requires both CLI `--execute` and process environment `AI_LIVE_GATE_AUTHORIZED=1`, together with explicit `--authorization-id`, `--provider`, `--model` and `--budget-usd`. Optional `--candidate-sha` is exactly 40 lowercase hexadecimal characters; absence is reported as null. Unknown or duplicate flags and missing values fail closed. There are no defaults for provider, model or budget, no dotenv loading, no prompt override and no token-limit override. `AI_DAILY_BUDGET_USD` supplies no Gate authority.

Authorization IDs are 1–96 ASCII characters, begin with a letter and otherwise contain only letters, digits, underscore or hyphen. Known `sk-`/`AIza` prefixes and any configured-key substring are rejected. Identifier validation consumes the entire string, including refusal of a final newline. The dual interlocks are execution requirements, not Owner permission. A later live phase must separately name the exact candidate, authorization ID, provider, model, budget and one-call allowance.

Only `openai` can execute. Recognized Gemini and ILMU selectors return `PROVIDER_NOT_YET_HARDENED` before network; unknown selectors are refused. The requested model must be exactly `gpt-5.4-mini`, with known cost policy. There is no fallback, provider loop, retry or failover.

The candidate reuses the health Gate's bounded guards: maximum one logical invocation, one SDK transport invocation and one actual outbound request; SDK `maxRetries:0`; adapter timeout 20,000 ms; output maximum 16 tokens. A second logical callback is never invoked. A second transport invocation is counted but refused before fetch. Actual outbound count increments immediately before the underlying fetch, so connection failure consumes the allowance. Guard codes retain their safe identity through adapter error normalization.

The sole destination is HTTPS `api.openai.com`, exact path `/v1/responses`, method `POST`, default HTTPS port. Credentials, custom ports, query strings, fragments, alternate hosts, paths, protocols and custom base URLs that miss this allowlist are refused. Fetch receives `redirect:'error'`. Counters describe invocation boundaries, not packets or socket counts. Failure or ambiguous cost never authorizes a second call.

## Frozen model identity policy

Policy version remains `openai-gpt-5.4-mini-r5-03d-v1`. The private code-local map and nested identity set are frozen and permit only:

| Requested alias | Approved raw identities |
| --- | --- |
| gpt-5.4-mini | gpt-5.4-mini; gpt-5.4-mini-2026-03-17 |

`requestedModelMatch` means exact equality between `response.model` and the requested alias. `rawModelMatch` means exact equality between `response.rawMetadata.model` and the requested alias. `modelIdentityAccepted` requires a safe raw identity in the explicit set. `approvedSnapshotMatch` is true only when identity is accepted and the raw identity differs from the alias. Consequently the accepted snapshot has `rawModelMatch:false` without failing chat acceptance. Unknown snapshots, prefixes, suffixes, lookalikes and future identities fail closed. There is no wildcard, date-family rule, lookup, scraping or environment policy override.

A displayed raw model is ASCII, 1–128 characters drawn only from letters, digits, underscore, dot, colon and hyphen, and contains no configured-key substring. Unsafe values are redacted: available true, safe false, returned model null, identity acceptance false. Missing raw identity is unavailable with safety null and acceptance false. Before a successful provider response, identity predicates remain null and the static policy version remains present.

## Chat predicates and result semantics

After `provider.generate` resolves, authentication becomes `valid` immediately. It remains valid when later accounting, usage, budget, safety or conversation checks fail. Configuration/key presence alone proves no authentication.

`CHAT_PASS` requires all six semantic predicates plus the existing call-accounting, usage and budget guards:

| Order | Predicate | Failure enum |
| --- | --- | --- |
| 1 | Exact requested/adapter model match | REQUESTED_MODEL_MISMATCH |
| 2 | Safe raw identity accepted by the frozen policy | MODEL_IDENTITY_POLICY_MISMATCH |
| 3 | Finish reason exactly completed | FINISH_REASON_MISMATCH |
| 4 | Trimmed reply exactly CYBERLY_CHAT_47 | CHAT_CONTEXT_RESPONSE_MISMATCH |
| 5 | validateProviderOutput(reply).ok exactly true | OUTPUT_VALIDATION_MISMATCH |
| 6 | Actual normalized tool-call array length exactly zero | TOOL_CALL_MISMATCH |

`failedChatChecks` uses this stable order and can contain more than one failure. A semantic failure returns `INVALID_CHAT_RESPONSE`, `authState:valid` and `chatState:fail`. Raw model equality is diagnostic only. The diagnostic tool count is the actual normalized array length; acceptance requires zero. Existing normalization can filter prohibited or nameless raw tool items, so zero normalized calls does not certify raw tool normalization. Only safe predicate outcomes and counts are emitted, never response text, text previews/hashes or tool names, IDs, arguments or payloads.

The top-level `conversationContractVersion` is `chat-context-v1`. Static `chatDiagnostics` input fields are present even before execution: `messageCount:3`, `assistantHistoryIncluded:true` and string `roleSequence:'user,assistant,user'`. Other semantic predicate fields remain null until a successful response. These input fields describe the fixed supplied transcript and do not establish server-side conversation persistence or learner chat integration.

| Outcome | testState | authState | chatState |
| --- | --- | --- | --- |
| Preflight refusal or no outbound attempt | not_tested | not_tested | not_tested |
| Successful response with all checks passing | tested | valid | pass |
| Successful response with a failed predicate/accounting/budget guard | tested | valid | fail |
| HTTP 401/403 | tested | invalid | fail |
| HTTP 429, timeout, 5xx or network error | tested | unknown | fail |

Error payloads, arbitrary exception messages, headers and secrets are suppressed. Failed or aborted requests can have unknown usage and cost, recorded as null. Null does not mean free, cancelled or unbilled. None of these states triggers a retry or another provider.

## Supplied price and budget policy

Control Tower supplied dated official policy input on **2026-10-06**: Responses supports the alias and approved snapshot; user/assistant input and `output_text` are supported; `store:false` disables storage; standard uncached input is USD 0.75 per million tokens and output USD 4.50 per million tokens. This document relies on that supplied authority and performs no new web research or provider discovery.

Preflight reserves a planning allowance of 1,024 input tokens and 16 output tokens:

```text
(1024 × 0.75 + 16 × 4.50) / 1,000,000 = USD 0.00084
```

An explicit positive finite authorized budget below USD 0.00084 fails before outbound. The reserve is a governance allowance and conservative planning estimate, not measured input usage or a provider-side hard billing cap. Known returned usage supports an uncached estimated cost; reported cost remains null. A returned usage violation (more than 16 output tokens or an estimated cost above the authorization) takes operational precedence and returns `BUDGET_OR_USAGE_EXCEEDED`, while the already-computed chat diagnostics still preserve any semantic failures. If usage remains within bounds, a failed chat predicate returns `INVALID_CHAT_RESPONSE`. Neither outcome authorizes a rerun. Missing usage remains null rather than being invented; it can accompany passing chat predicates while estimated cost stays unknown. Cached input, billing adjustments and ambiguous failed usage require later reconciliation without an automatic additional call.

## Safe result schema

One JSON result is written to stdout; exit 0 requires `CHAT_PASS`. Importing the script is inert. The Gate does not write files or persist certification into a registry. The complete result field inventory is:

| Top-level field | Safe value/domain |
| --- | --- |
| gateVersion | r5-04a-v1 |
| authorizationId | Validated non-secret bounded identifier, or null |
| provider | Recognized selector, or null; only openai can execute |
| model | gpt-5.4-mini, or null |
| purpose | bounded_provider_chat |
| conversationContractVersion | chat-context-v1 |
| candidateGitSha | Explicit 40-character lowercase hex SHA, or null |
| configured | boolean; key presence only |
| enabled | boolean; runtime policy only |
| testState | not_tested or tested |
| authState | not_tested, valid, invalid or unknown |
| chatState | not_tested, pass or fail |
| logicalCallsAuthorized | 0 or 1 |
| logicalCallsActual | Observed logical guard count |
| transportAttemptsAuthorized | 0 or 1 |
| transportInvocationsActual | Observed transport guard count, including blocked duplicates |
| actualOutboundAttempts | 0 or 1 |
| maxOutputTokens | 16 |
| maxRetries | 0 |
| usage | null, or an object with nonnegative safe-integer inputTokens, outputTokens and totalTokens |
| estimatedCostUsd | Known uncached usage estimate, or null |
| providerReportedCostUsd | null |
| authorizedBudgetUsd | Explicit positive finite budget, or null |
| latencyMs | Nonnegative elapsed milliseconds |
| providerResponseId | Validated safe resp_ identifier, or null |
| providerResponseIdAvailable | boolean; a safe emitted identifier exists |
| httpRequestId | Validated safe req_ identifier, or null |
| httpRequestIdAvailable | boolean; a safe emitted identifier exists |
| finishReason | completed, incomplete, failed or null |
| chatDiagnostics | The complete bounded object below |
| resultCode | Allowlisted status/failure enum |
| retryCount | 0 under the bounded transport contract |
| unexpectedDuplicateAttempt | boolean; transport invocation count exceeds 1 |
| timestamp | Generated ISO 8601 UTC timestamp |

| chatDiagnostics field | Safe value/domain |
| --- | --- |
| returnedModel | Safe ASCII model identifier, or null |
| returnedModelAvailable | null until response; then boolean for raw identity presence |
| returnedModelSafe | null before response or when absent; otherwise boolean |
| requestedModelMatch | Exact adapter/request equality boolean, or null |
| rawModelMatch | Exact raw/request equality boolean, or null |
| modelIdentityPolicyVersion | openai-gpt-5.4-mini-r5-03d-v1 in every result |
| modelIdentityAccepted | Safe exact-set membership boolean, or null |
| approvedSnapshotMatch | Accepted non-alias identity boolean, or null |
| finishReasonMatch | completed equality boolean, or null |
| responseTextMatch | Exact trimmed-token equality boolean, or null |
| outputSafetyAccepted | validateProviderOutput(...).ok boolean, or null |
| toolCallCount | Actual normalized array length as a nonnegative integer, or null |
| toolCallCountMatch | Actual normalized count is zero boolean, or null |
| messageCount | 3, including preflight refusal |
| assistantHistoryIncluded | true, including preflight refusal |
| roleSequence | String user,assistant,user, including preflight refusal |
| failedChatChecks | Ordered array containing only the six predicate failure enums; [] before response |

The allowlisted result codes are `CHAT_PASS`, `NOT_AUTHORIZED`, `INVALID_ARGUMENTS`, `AUTHORIZATION_ID_REQUIRED`, `PROVIDER_REQUIRED`, `MODEL_REQUIRED`, `UNKNOWN_MODEL_PRICING`, `BUDGET_REQUIRED`, `CANDIDATE_SHA_INVALID`, `PROVIDER_NOT_YET_HARDENED`, `AI_PROVIDER_NOT_CONFIGURED`, `AI_RUNTIME_DISABLED`, `TRANSPORT_UNAVAILABLE`, `BUDGET_INSUFFICIENT`, `DESTINATION_REJECTED`, `TRANSPORT_ATTEMPT_LIMIT`, `LOGICAL_CALL_LIMIT`, `CALL_ACCOUNTING_MISMATCH`, `BUDGET_OR_USAGE_EXCEEDED`, `INVALID_CHAT_RESPONSE`, `AI_AUTH_FAILED`, `AI_RATE_LIMITED`, `AI_PROVIDER_TIMEOUT`, `AI_PROVIDER_UNAVAILABLE`, `AI_REQUEST_FAILED` and `GATE_FAILED`. Arbitrary provider/SDK error codes and messages are never copied into the result. The outer CLI rejection fallback emits only `gateVersion`, `resultCode:'GATE_FAILED'` and `actualOutboundAttempts:0`.

Safe response/request IDs must respectively match `resp_`/`req_` followed by 1–100 ASCII letters, digits, underscores or hyphens, and contain no configured-key substring. Missing or unsafe IDs become null with availability false. Finish reason is limited to `completed`, `incomplete`, `failed` or null. Authorized calls/attempts remain zero until preflight passes; actual counters remain visible on failure. The schema contains no raw response, normalized tool payload, arbitrary text, headers or environment values.

## Offline verification matrix and evidence

Dedicated fixtures exercise the actual installed OpenAI SDK and unchanged adapter with in-memory `Response`/fetch fixtures. Global fetch, HTTP, HTTPS, net, TLS and Socket.connect are blocked, with DB/server/service imports refused. Fake fixture keys and IDs are local non-secret values; fixture counters are not real provider calls. The required offline matrix is:

| Group | Fixture and required result |
| --- | --- |
| A | Missing either execution interlock: NOT_AUTHORIZED; logical/transport/outbound 0/0/0 |
| B | Missing OpenAI key: AI_PROVIDER_NOT_CONFIGURED; zero outbound |
| C | Disabled OpenAI runtime: AI_RUNTIME_DISABLED; zero outbound |
| D | Budget below USD 0.00084 reserve: BUDGET_INSUFFICIENT; zero outbound |
| E | Exact alias and valid reply: fixture CHAT_PASS |
| F | Exact approved snapshot: fixture CHAT_PASS; rawModelMatch false, modelIdentityAccepted true, approvedSnapshotMatch true |
| G | Unknown/future identity: INVALID_CHAT_RESPONSE with identity failure |
| H | Wrong safe reply: only CHAT_CONTEXT_RESPONSE_MISMATCH; output safety true |
| I | Empty reply: context and output-validation failures |
| J | Unsafe request for a secret: output-validation failure and no reply leakage; context predicate also fails |
| K | Returned normalized function call: TOOL_CALL_MISMATCH; no name/ID/arguments/payload leakage |
| L | Incomplete finish: FINISH_REASON_MISMATCH; successful response authentication remains valid |
| M | Simultaneous failures: all six failure enums in the specified stable order |
| N | HTTP 401/403: invalid authentication, failed chat, predicates unevaluated |
| O | HTTP 429: unknown authentication, failed chat, no retry |
| P | Timeout: unknown authentication, failed chat, one attempt, no retry |
| Q | HTTP 5xx/network error: unknown authentication, failed chat, no retry |
| R | Unsafe raw model: returnedModel null, available true, safe false, identity false |
| S | Missing raw model: available false, safe null, identity false |
| T | Exact successful accounting: logical/transport/outbound 1/1/1; maxRetries 0, retryCount 0, duplicate false; blocked second transport cannot create a second outbound attempt |
| U | Installed-SDK wire body: exact full transcript, output maximum 16, store false and only the five allowed JSON keys |
| V | Inherited destination/method/redirect guards: reject prohibited destinations and methods; force redirect error |
| W | Known usage: USD 0.75/4.50 per million estimate; reserve and output/budget limits enforced; unknown usage/cost remain null |
| X | Safe response/request IDs: accepted prefix and length boundaries; unsafe/missing/secret-containing IDs suppressed |

The timeout fixture exercises the installed SDK and unchanged adapter; its safe normalized error may be `AI_REQUEST_FAILED`. The contract requires unknown authentication, failed chat, one consumed attempt and zero retries, rather than a particular timeout enum in every SDK path.

RED was captured before Gate implementation: the dedicated test failed its missing-Gate assertion, exited 1 and recorded zero real network attempts. Its original test-source snapshot and output are preserved. Final GREEN verification is:

| Command run | Result |
| --- | --- |
| node server/scripts/test-ai-provider-chat-gate.js | PASS, 116/116 cases; 67 in-memory fixture outbound attempts; forbidden import attempts 0 |
| npm --prefix server run test:ai-provider-live-gate | PASS, 81/81 existing health cases |
| npm --prefix server run test:ai-provider-unit | PASS |

The chat test loads the existing R5-02 network firewall before the Gate/adapter. Both npm checks use that same firewall through an absolute forward-slash `NODE_OPTIONS` preload. Final checks report firewall ACTIVE, unexpected real network attempts **0**, and OpenAI/Gemini/ILMU calls **0/0/0**. The 67 fixture attempts are in-memory SDK/adapter test invocations only.

Initial npm preload attempts failed Windows backslash-path resolution before test execution; corrected forward-slash preload runs passed. A subsequent test-only import guard was too broad and matched legitimate adapter/SDK imports; resolved application-path matching corrected the harness. Those intermediate failures are preserved with the final GREEN evidence. The final 116 cases include the assistant-history-only token ownership contract, authorization-ID secret-substring refusal, and budget/output guard precedence while preserving failed-chat diagnostics. No implementation-scope blocker remains.

Evidence is preserved, untracked, under `review-evidence/r5-04a/`. Prior R5 evidence remains unchanged. The phase performs no real network/provider call, SMTP action, database connection/mutation, migration, backup, Render action, deployment, commit, push, fetch or ref update. No `.env`, environment examples, package files, adapters, protected baseline documents or learner UI are changed.

Database impact: **CATEGORY 0 / NO CHANGE**; no migration is needed or run. Client/build and DB-backed suites are outside this local DB-free harness scope. Manual browser verification is not needed for R5-04A because no browser-facing behavior changes. Offline verification cannot replace later staging or live evidence.

## Separately authorized subsequent phases

After this accepted candidate is persisted and R5-04A passes final Control Tower persistence verification, the proposed next phase is **R5-04B CHAT GATE STAGING INTEGRATION**: API only, exact reviewed candidate, inert Gate verification and **zero provider calls**. R5-04B remains separately authorized work; this document performs or authorizes no staging deployment.

Only after R5-04B passes may Control Tower consider **R5-04C BOUNDED OPENAI CHAT LIVE CERTIFICATION**, requiring separate explicit Owner budget and one-call authorization. Such certification is limited to this exact fixed transcript and candidate. It excludes the full CyberGuard flow, persistence, learner context, RAG, actions, planning, tool normalization, structured output, streaming and production readiness. A future fixture or live `CHAT_PASS` cannot grant those separate capabilities.

**R5-04A CONTROL TOWER ACCEPTED / OFFLINE CANDIDATE PASS. Persistence is Owner-authorized; no live CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY is granted.**
