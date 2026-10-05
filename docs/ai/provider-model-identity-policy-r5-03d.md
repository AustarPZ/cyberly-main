# R5-03D

**R5-03D CONTROL TOWER ACCEPTED / PENDING FINAL PERSISTENCE VERIFICATION**

R5-03D was independently reviewed and accepted by Control Tower on 2026-10-06. The exact reviewed four-file candidate is accepted for persistence. This acceptance does NOT establish OpenAI HEALTH_PASS. It does NOT authorize deployment or any provider call. Final R5-03D closure remains Control Tower authority after persistence verification.

## Purpose and accepted input

This local offline candidate corrects model identity acceptance in Gate `r5-03d-v1`. Supplied authority: R5-03C_FINAL_CONTROL_TOWER_VERIFICATION = PASS; R5-03C CLOSED; root cause CONFIRMED_RAW_MODEL_MISMATCH. Its accepted live event requested `gpt-5.4-mini`, returned `gpt-5.4-mini-2026-03-17`, and produced INVALID_HEALTH_RESPONSE, valid authentication, failed health, and only RAW_MODEL_MISMATCH. All other predicates passed, with zero tools. Historical R5-03C evidence and its document remain immutable; this policy does not reinterpret that event as HEALTH_PASS.

Control Tower's official policy input checked **2026-10-05**: the [OpenAI GPT-5.4 Mini model page](https://developers.openai.com/api/docs/models/gpt-5.4-mini) lists both identities under Snapshots/Aliases and Responses supports both. This is supplied dated policy input, not a new executor web check or permanent promise about future aliases.

## Explicit mapping and boundary

Policy version: `openai-gpt-5.4-mini-r5-03d-v1`.

| Requested model | Only approved raw identities |
| --- | --- |
| gpt-5.4-mini | gpt-5.4-mini; gpt-5.4-mini-2026-03-17 |

The private code-local map and nested array are frozen. Acceptance requires exact-set membership plus the existing safety validator. No external lookup, runtime scraping, environment override, mutable map, prefix, wildcard, date regex or inferred future equivalence. The configured/requested model is unchanged. This accepts the explicitly reviewed snapshot while refusing lookalikes and future identities.

## Diagnostic schema and health acceptance

All fields remain within healthDiagnostics. requestedModelMatch remains `response.model === requestedModel`; rawModelMatch remains `response.rawMetadata.model === requestedModel`. modelIdentityPolicyVersion always records the static policy version, including preflight refusal and transport error. modelIdentityAccepted and approvedSnapshotMatch are null until provider.generate resolves; no absent response is represented as evaluated false.

After response success, modelIdentityAccepted is true only for a safe explicitly approved identity for the requested model. approvedSnapshotMatch is true only for an accepted identity unequal to the alias. Unsafe raw identities remain available=true, safe=false, returnedModel=null, identity accepted=false, snapshot=false. Missing raw identity has available=false, safe=null, accepted=false, snapshot=false. No unsafe raw identity, response text, tool payload/name/arguments or secret is emitted.

| Identity | rawModelMatch | modelIdentityAccepted | approvedSnapshotMatch |
| --- | --- | --- | --- |
| Exact alias | true | true | false |
| Approved current snapshot | false | true | true |
| Unknown / missing / unsafe | false | false | false |
| No successful response | null | null | null |

Health requires requestedModelMatch, modelIdentityAccepted, finishReasonMatch, responseTextMatch and toolCallCountMatch, plus unchanged accounting/budget/usage guards. rawModelMatch is diagnostic only. Stable failure order: REQUESTED_MODEL_MISMATCH, MODEL_IDENTITY_POLICY_MISMATCH, FINISH_REASON_MISMATCH, RESPONSE_TEXT_MISMATCH, TOOL_CALL_MISMATCH. New results never use RAW_MODEL_MISMATCH as a health failure; historical results retain it.

## RED / GREEN and fixture matrix

Before Gate implementation, desired expectations failed against r5-03a-v1: approved snapshot INVALID_HEALTH_RESPONSE and missing policy fields/version. red-characterization.txt records 41 corrective failures and zero unexpected network attempts. red-snapshot-exact.txt additionally captures the preserved HEAD implementation with completed/OK/zero-tools and only RAW_MODEL_MISMATCH. This supplemental baseline capture was produced after implementation from git show HEAD, with only its import path relocated. The first standalone capture omitted the Responses object discriminator and also failed text; both captures are preserved. The initial relative npm preload failed resolution; the absolute-path firewall rerun supplied valid RED evidence.

GREEN: Gate **PASS, 81 cases** (40 existing general cases and 41 corrective cases); provider unit **PASS**. Both npm commands used the existing r5-02 firewall via absolute NODE_OPTIONS preload. All reported unexpected real network attempts are zero. Actual installed SDK and unchanged adapter process in-memory HTTP fixtures; fixture transport counters are not real provider calls.

| Required case | Verified result |
| --- | --- |
| 1 Exact alias | HEALTH_PASS; requested/raw true, accepted true, snapshot false |
| 2 Approved snapshot | HEALTH_PASS; requested true/raw false, accepted/snapshot true; no failures |
| 3 Next-day snapshot | valid/fail; INVALID_HEALTH_RESPONSE; only MODEL_IDENTITY_POLICY_MISMATCH |
| 4 Far-future snapshot | identity fail closed |
| 5 Prefix lookalike | identity fail closed |
| 6 Extra suffix digit | identity fail closed |
| 7 gpt-5.4 | identity fail closed |
| 8 gpt-5.4-nano | identity fail closed |
| 9 Unsafe identity | redacted, accepted false; includes slash snapshot lookalike |
| 10 Missing raw identity | accepted false |
| 11 Requested adapter mismatch | only REQUESTED_MODEL_MISMATCH when raw snapshot accepted |
| 12 Snapshot + wrong text | only RESPONSE_TEXT_MISMATCH |
| 13 Snapshot + tool | only TOOL_CALL_MISMATCH |
| 14 Snapshot + incomplete finish | only FINISH_REASON_MISMATCH |
| 15 Multiple failures | stable five-enum ordering |
| 16 401/403 | invalid/fail; policy booleans null |
| 17 429/timeout/500/503/network | unknown/fail; policy booleans null |
| 18 Preflight refusal | not_tested; zero outbound; policy booleans null |

Additional fixtures cover latest lookalike, 12 unsafe identities, capped tool counts, safety length, destination/method/redirect rejection, dual authorization, SDK maxRetries=0, no duplicate request, logical guards, pricing, usage and budget. Existing protections remain unchanged.

## External effects and certification

OpenAI/Gemini/ILMU **0/0/0**; unexpected real network attempts **0**; SMTP **0**. No dotenv loading, DB connection/mutation, migration, backup, Render mutation, deployment, commit, push, fetch or local ref update. Production untouched. No provider adapters/config/registry/package/client/gateway/migration changes. Evidence stays untracked under review-evidence/r5-03d; all prior evidence is preserved. No browser/client/build/DB-backed suite is needed for this DB-free offline scope.

Certification remains OpenAI ADAPTER_PRESENT / AUTH_VALID / HEALTH_PASS HOLD; Gemini and ILMU ADAPTER_PRESENT; CHAT_PASS NO; TOOL_NORMALIZATION_PASS NO; PRODUCTION_READY NO. Fixture HEALTH_PASS establishes no live certification.

After independent review and separate persistence, the expected separately authorized next stage is R5-03E MODEL IDENTITY POLICY STAGING INTEGRATION: API-only exact candidate, Render Linux/Node24.21.0, /api/health, inert Gate r5-03d-v1, zero provider calls/outbound. Only after R5-03E may Control Tower consider another separately authorized bounded health call. No staging action or live call is authorized here.
