# R5-03A Live-Gate Failure Observability & Auth-State Corrective

**CONTROL TOWER ACCEPTED / PENDING FINAL PERSISTENCE VERIFICATION**

R5-03A was independently reviewed and accepted by Control Tower on 2026-10-05 (PASS_WITH_REQUIRED_PRECOMMIT_CORRECTIVE). F01 and F02 are accepted as corrected in offline verification; strict health policy remains unchanged. This acceptance does not establish OpenAI HEALTH_PASS and does not authorize deployment or another live provider call. R5-03A remains pending final persistence verification until the exact reviewed four-file candidate, with this required governance wording corrective, is committed and confirmed on origin/develop. Final phase closure belongs to Control Tower.

The sections below preserve the historical local implementation and offline verification record. The Owner separately authorized governance wording correction and exact four-file commit/push to origin/develop; no runtime code change after review.

## Purpose and authority

Local implementation and offline verification only, based on HEAD/origin develop `6bacf47171579cfc76b25a324776a1fbc3c04bc7`. Final Control Tower ruling supplied by Owner: R5-03 CLOSED; call accounting and reachability PASS; OPENAI_AUTH_VALID PASS; OPENAI_HEALTH_PASS HOLD / NOT ESTABLISHED. Confirmed defects are F01 STRICT_HEALTH_FAILURE_NOT_DIAGNOSTIC and F02 AUTH_SUCCESS_MASKED_BY_POST_RESPONSE_VALIDATION. Historical root remains UNDETERMINED_FROM_PRESERVED_OUTPUT; these changes diagnose future responses, not the historical call.

## Code change and authentication

Only the Gate implementation, its offline test, an appended contract section and this new record form the four-file candidate. The unchanged existing OpenAI adapter provides all required metadata. Gate version becomes r5-03a-v1. A successfully resolved provider.generate immediately establishes authState valid, independently of subsequent health failure. Health starts fail and becomes pass only when accounting, budget/usage and all five strict health predicates pass. A semantic failure is tested / valid / fail / INVALID_HEALTH_RESPONSE. 401/403 remain invalid, 429/timeout/5xx/network remain unknown, and preflight refusal remains not_tested with no outbound request. No configuration/key-based authentication inference is made.

## Safe result schema

healthDiagnostics has these fields:

| Field | Semantics after a successful response |
| --- | --- |
| returnedModel | Safe rawMetadata.model identifier, otherwise null |
| returnedModelAvailable | Raw model is neither undefined nor null |
| returnedModelSafe | Boolean for a present value; null for absent |
| requestedModelMatch | adapter result.model === authorized requested model |
| rawModelMatch | rawMetadata.model === authorized requested model, even if unsafe |
| finishReasonMatch | response.finishReason === completed |
| responseTextMatch | String(response.text or empty).trim() === OK |
| toolCallCount | min(normalized toolCalls.length, 99); absent list counts zero |
| toolCallCountMatch | Actual normalized count === 0, independent of display cap |
| failedHealthChecks | Stable ordered allowlisted predicate failures |

Before any successful response, all scalar fields are null and failedHealthChecks is []. After successful resolution, diagnostics are populated before accounting and budget checks; those independent guards still take precedence over health acceptance. Model display permits only ASCII letters, digits, underscore, dot, colon and hyphen, length 1–128, excluding the configured API key substring. Present unsafe values produce available true / safe false / returnedModel null. No arbitrary response text, preview/hash, tool names, tool IDs, arguments or payloads enter the result. Existing public finishReason sanitization is unchanged.

Failure order: REQUESTED_MODEL_MISMATCH, RAW_MODEL_MISMATCH, FINISH_REASON_MISMATCH, RESPONSE_TEXT_MISMATCH, TOOL_CALL_MISMATCH. The five predicates are unchanged. Exact model equality remains mandatory; alias/snapshot equivalence is deferred to separate authority. No special case for gpt-5.4-mini-2026-03-17.

## Offline RED / GREEN

RED before implementation independently collected text-mismatch authentication failure, absent raw-model predicate diagnosis, and absent normalized function_call predicate diagnosis. All three ran through the installed SDK, unchanged adapter and in-memory Responses HTTP fixtures. No real tool execution. New expectations were aggregated so one failure did not hide the other required RED cases.

GREEN: `npm --prefix server run test:ai-provider-live-gate` PASS, exactly 69 cases (original 40 retained, 29 corrective cases); `npm --prefix server run test:ai-provider-unit` PASS. Both commands ran with the existing external fetch/http/https/net/tls/Socket.connect and DB/server import firewall. No .env loading. unexpectedRealNetworkAttempts 0; OpenAI/Gemini/ILMU live calls 0/0/0. Local Node v24.13.0 was used for offline execution; Render Node24.21.0/Linux compatibility remains a future staging check, not a claim from this phase.

| Fixture | Expected verified outcome |
| --- | --- |
| Strict success | valid / pass / HEALTH_PASS; all five predicates true, failures [] |
| Raw model snapshot | valid / fail; only RAW_MODEL_MISMATCH, safe snapshot displayed |
| Text mismatch | valid / fail; only RESPONSE_TEXT_MISMATCH; no text leakage |
| Responses function_call plus OK message | Real adapter normalization, count 1; only TOOL_CALL_MISMATCH; no payload leakage |
| Incomplete finish | valid / fail; only FINISH_REASON_MISMATCH |
| Multiple mismatch | Deterministic raw/finish/text/tool order |
| Adapter model adversarial wrapper | All five failures ordered; real adapter retained inside isolated test wrapper |
| Unsafe identifiers (11 cases) | Unicode, 129 chars, key substring, URL, slash/backslash, whitespace/newline/NUL/tab/final newline all suppressed |
| Missing model / safe 128-char model | Missing: unavailable, safety null; maximum safe value displayed with exact mismatch failure |
| 100 normalized tools | Display 99; actual-zero predicate false; no tool execution |
| 401 / 403 | invalid / fail; unevaluated diagnostics |
| 429 / 500 / 503 | unknown / fail; unevaluated diagnostics; no retries |
| Abort timeout fixture / network failure | unknown / fail; unevaluated diagnostics; no retries |
| Preflight refusal | not_tested; all diagnostics null except failures []; outbound zero |

The isolated adapter-model adversarial wrapper is necessary because the ordinary adapter model is configuration-derived; all primary response/model/tool fixtures use the actual unmodified adapter directly. Original call-safety tests continue passing: dual authorization, one provider, exact requested model, budget, max logical/transport one, SDK retries zero, allowlisted destination, redirect error, no fan-out or failover, DB-free and secret-safe results.

## Preservation and external effects

Prior raw evidence and historical R5-03 documents are unchanged. Contract changes are append-only. No provider/SMTP calls, DB connections/mutations, migrations, backups/restores, Render mutations, deployments or production operations. Protected providers/registry/config/manifests/client/migrations/agentModelGateway remain unchanged. New evidence is under untracked review-evidence/r5-03a. No commit/push or Git reference mutation.

No live HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY is established. Accepted provider state remains OpenAI ADAPTER_PRESENT / AUTH_VALID / HEALTH_PASS HOLD; Gemini and ILMU ADAPTER_PRESENT.

## Next-stage recommendation

After Control Tower independently reviews and the candidate is persisted, request separate authorization for R5-03B CORRECTED HARNESS STAGING INTEGRATION: API-only exact-candidate deployment, Render Linux build/start, Node24.21.0, /api/health, inert Gate with new version and zero outbound attempts. Only after R5-03B may Control Tower consider a second bounded OpenAI health call, requiring separate Owner authorization. Neither staging integration nor another live call is authorized by R5-03A. Manual browser verification is not needed for this local CLI corrective.


## R5-03B corrected harness staging integration — Control Tower accepted

**2026-10-05: R5-03A corrected harness PERSISTED / API STAGING INTEGRATED. R5-03B_CONTROL_TOWER_REVIEW = PASS; R5-03B_TECHNICAL_STAGING_INTEGRATION = PASS; R5-03B_FINAL_CLOSURE = PENDING PERSISTENCE VERIFICATION.** Final closure belongs to Control Tower.

API srv-d9tiop942hec738b3org is LIVE at exact corrected commit 65733d13ba50bbb085d1cbd491176f029a894e66, deploy dep-db1qequgekts73f1ase0. Accepted Render Linux build and npm --prefix server ci PASS, server start PASS, build Node24.21.0, running Node v24.21.0, /api/health HTTP200. Web srv-d9tj5hu5djic73a0auk0 remains LIVE at 91a052736dda7d37c05ac315e9738b4c29937622, deploy dep-db1kkcegekts73e9r6ug; no Web deployment. Service branches remain master and autoDeploy OFF.

Current running-instance proof: HEAD 65733d13ba50bbb085d1cbd491176f029a894e66, Node v24.21.0; node server/scripts/ai-provider-live-gate.js invoked exactly once without --execute or setting AI_LIVE_GATE_AUTHORIZED=1. Gate r5-03a-v1 returned NOT_AUTHORIZED; testState/authState/healthState not_tested; logicalCallsAuthorized0, logicalCallsActual0, transportAttemptsAuthorized0, transportInvocationsActual0, actualOutboundAttempts0, retryCount0, unexpectedDuplicateAttempt false. Logical/transport/outbound 0/0/0, OpenAI/Gemini/ILMU provider calls 0/0/0. NOT_AUTHORIZED intentionally exits nonzero; no rerun.

Fresh Git preflight from 1160b07780eb1cba5b6fe7a609311c901f1a0900 to 65733d13ba50bbb085d1cbd491176f029a894e66: client delta NONE, server/migrations delta NONE; CATEGORY 0 — NO DATABASE CHANGE. No backup, migration, restore or DB mutation; SMTP0 and production UNTOUCHED. This acceptance persistence adds no provider call, Gate execution, DB operation, Render/environment mutation or deployment.

Owner/Control Tower classified later local Windows PowerShell ParserError from pasted JSON as LOCAL_TRANSCRIPT_HANDLING_ERROR / NON_RUNTIME / NON_PROVIDER / NONBLOCKING. It did not rerun Gate, call a provider, mutate DB/Render or alter the accepted evidence.

Strict health policy is unchanged. OpenAI remains ADAPTER_PRESENT / AUTH_VALID / HEALTH_PASS HOLD; Gemini and ILMU ADAPTER_PRESENT. No HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY is granted by inert staging integration. Any later live call requires separate Owner authorization; no additional provider request is authorized by this persistence task.
