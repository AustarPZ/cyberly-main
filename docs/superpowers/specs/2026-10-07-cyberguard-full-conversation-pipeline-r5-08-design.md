# CyberGuard Full Conversation Pipeline Acceptance R5-08

**Status: CONTROL TOWER OFFLINE ACCEPTED / OWNER ROUTINE EXECUTION AUTHORITY**

## Authority and purpose

Exact executor baseline: `666e49350146adab515bec0dce987a37275bb3f8`. Owner authorizes this bounded local/offline implementation; Control Tower owns independent DB execution and final acceptance. The supplied R5-05E, R5-06 and R5-07 closure states are the accepted starting contract, not certifications newly performed here.

Prove a complete authenticated two-turn CyberGuard conversation with process-local Live ON / Agentic OFF, the existing OpenAI context mock and Control Tower's isolated local MySQL. Both turns traverse existing learner context, reviewed RAG, deterministic actions, final response generation and persistence. Replay must reuse the second completed output.

Public staging remains owner-reported API `5c23e423...`, Web `91a05273...`, Live OFF / Agentic OFF. This executor does not access or alter staging. No commit/push, branch changes, reset/stash/clean, deployment, Render mutation, live Provider, staging DB, production access or R5-09. Preserve review evidence and unrelated untracked files; leave `server/.env` untouched.

## Verified existing implementation

- `test-ai.js` already provides authenticated registration, conversation creation, user-message addition, generation, learner evidence seeding, reviewed resource ingestion, safe action/source assertions, and isolated `withServer` processes.
- That harness sets Live ON, 12 messages and 8000 characters; each server process has a fresh Provider module. The dedicated case explicitly sets Agentic OFF and uses a sufficient process-local rate limit.
- `ai.service.js` constructs bounded history, learner context and reviewed RAG (product limit 4), runs output safety, and persists assistant/actions/sources. Completed generation replay returns stored outputs before a final Provider call.
- Agentic OFF audit records planning unused, runtime_disabled, no tool name and zero tool/model planner counters. Existing trace JSON supports inspection without schema changes.
- The mock context branch already emits safe aggregate context diagnostics. The real OpenAI Responses request path is separate and will remain unchanged.

## Required contract

1. Same owned conversation for both in-scope turns; Provider turn-2 role order exactly `user>assistant>user` and current user last.
2. At least one prior assistant and its actual content must reach turn 2. Detect the stable `sourceCount=` token in an earlier assistant's content, without echoing content.
3. Preserve existing message/character bounds; both turns use learner context, reviewed RAG, actions and assistant/source persistence.
4. Turn-2 diagnostics retain locale en, age band 13-17, level L3, confidence Medium, Form 3, phishing focus, two secondary topics, three total focus topics, existing recommendation and nonjudgmental guidance. No email, nickname, raw answers/decisions or secrets are echoed.
5. Both responses have safe actions (1..3) and reviewed sources (1..4). Each assistant's source/action IDs and DB attachments correspond to its own message and conversation; counts need not match across turns.
6. Conversation detail has exactly user/assistant/user/assistant, correct message IDs and assistant reply-to bindings. Exactly two completed, distinct generation rows map the two user messages to two distinct assistant rows.
7. Agentic planner remains unused and tool executions zero; trace limits keep maxToolExecutions=0. Inspect turn-2 trace before replay, when the trace table is available; require a trace row if the table exists.
8. Exactly two mock final context calls in the fresh dedicated process: index 1 then index 2. Pure acceptance also makes exactly two context calls in its own process.
9. Replay exact turn-2 request returns HTTP 200, same assistant/generation/action/source IDs and content index 2, with unchanged conversation message/generation/action/source counts and rows. A replay may create request/audit evidence; trace counts are not replay invariants.
10. Preserve ownership, unsafe-request, rate-limit, provider-error and context-bound behavior. No schema/API/UI/RAG ranking/learner calibration/action/scope/Agentic redesign.

## Minimal candidate and verification

Only these six files:

- `docs/superpowers/specs/2026-10-07-cyberguard-full-conversation-pipeline-r5-08-design.md`
- `docs/superpowers/plans/2026-10-07-cyberguard-full-conversation-pipeline-r5-08.md`
- `server/scripts/test-conversation-pipeline-acceptance.js`
- `server/package.json` (only add `test:conversation-pipeline-acceptance`)
- `server/src/ai/providers/openai.provider.js` (module-local context-mock counter and safe diagnostics only)
- `server/scripts/test-ai.js` (one dedicated two-turn block only)

Write pure tests and command first, capture missing-diagnostic RED, then minimally add diagnostics and capture GREEN. The pure process denies real network before loading the Provider, calls it twice, tests role/history/content/last-user/index diagnostics and aggregate bounds, and checks no fixture contents/secrets appear. Diagnostics expose fixed role labels, counts and booleans only.

Executor runs `npm.cmd --prefix server run test:conversation-pipeline-acceptance`, `npm.cmd --prefix server run test:ai-provider-unit`, `node --check` on changed/new JS and `git diff --check`. Provider unit regression uses injected fixture transports with a process-local transport tripwire. Do not execute DB-dependent `test:ai`, migrations, ingestion, live gates, server startup or frontend build. Control Tower independently executes the revised full HTTP suite on isolated local MySQL with existing fixtures/migrations. No manual browser verification is needed for this backend test-only change.

R5-08 offline acceptance does not establish Controlled Agentic live certification, TOOL_NORMALIZATION_PASS, production readiness or live multi-turn answer quality. Final acceptance/closure remains pending Control Tower.
