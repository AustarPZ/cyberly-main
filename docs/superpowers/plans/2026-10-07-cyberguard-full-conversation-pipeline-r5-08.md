# CyberGuard Full Conversation Pipeline Acceptance R5-08 Implementation Plan

**Status: CONTROL TOWER OFFLINE ACCEPTED / OWNER ROUTINE EXECUTION AUTHORITY**

**Execution:** Single local implementation executor, existing checkout, with a read-only final candidate review. The owner's explicit six-file implementation/TDD instructions govern approval, execution, no commits and no worktrees. Control Tower retains final acceptance and isolated DB execution.

**Goal:** Prove two persisted in-scope turns, actual assistant history in turn-2 context, and completed-output replay idempotency using the existing mock pipeline.

**Architecture:** Add aggregate diagnostics solely to OpenAI's test context mock. A network-denied pure script pins the diagnostics; one dedicated `withServer` case exercises the existing authenticated HTTP/DB pipeline without redesigning it.

**Tech stack:** Existing Node/CommonJS, node:test/assert, Express, MySQL and OpenAI adapter.

**Design:** [R5-08 design](../specs/2026-10-07-cyberguard-full-conversation-pipeline-r5-08-design.md).

**Baseline:** `666e49350146adab515bec0dce987a37275bb3f8`.

## Constraints and review focus

- Six named files only; no env, lockfile, dependency, schema, API, UI, ranking or learner calibration changes.
- No live Providers, real network, staging/production, Render/deployment or R5-09. No commit/push/reset/stash/clean/branch changes.
- Do not execute DB-dependent test:ai here; preserve evidence and unrelated untracked files.
- Prior assistant content recognition must derive from actual messages, without echoing raw content; role output uses fixed safe labels.
- Fresh process isolates the module-local context counter; both calls are final generation with Agentic OFF.
- Attachments and replay comparisons are per-message and conversation-bounded, with no assumption of equal ranking/counts between turns.
- Existing audit writes on replay are allowed; trace is checked before replay, outside output-count invariants.

## Task 1: Pure diagnostic RED

**Files:** New `server/scripts/test-conversation-pipeline-acceptance.js`; add only `test:conversation-pipeline-acceptance` in `server/package.json`.

**Interface:** `createOpenAiProvider({ testMockMode: 'context', model, apiKey }).generate({ messages, learnerContext, ragContext })` returns existing content diagnostics. No env loader or DB imports.

- [x] Install network tripwires before requiring the Provider; use only fixed synthetic content/secret markers.
- [x] Call once with user, then once with user/assistant(first.content)/user. Assert indices 1/2, role sequences, assistant count 0/1, history/content booleans false/true, currentUserLast=true, message/character aggregates and no raw marker/key exposure.
- [x] Run `npm.cmd --prefix server run test:conversation-pipeline-acceptance` before mock edit; record RED for missing role/history/content/index diagnostics, live calls 0/0/0 and network attempts 0.

## Task 2: Mock-only GREEN

**File:** `server/src/ai/providers/openai.provider.js`.

**Interface:** Existing context mock response unchanged in shape; append roleSequence, assistantHistoryCount, priorAssistantHistory, priorAssistantContentSeen, currentUserLast and mockContextCallIndex to safe content.

- [x] Add a module-local counter incremented only inside mode=context. Recognize sourceCount= in actual prior assistant content. Fixed role labels avoid arbitrary role-string leakage.
- [x] Keep real request, all other mocks, limits, configuration and exports unchanged.
- [x] Run pure acceptance; record GREEN and zero live calls/network.

## Task 3: Dedicated DB/full HTTP case for Control Tower

**File:** `server/scripts/test-ai.js`; one isolated block, existing helpers/cleanup only.

**Interfaces:** `withServer`, `register`, `seedLearnerContextEvidence`, `ensureRagContent`, `createConversation`, `addUserMessage`, `generate`, `request`, `assertSafeAction`, `assertSafeSource`, existing chat generation/attachment tables and `agentic_execution_traces.trace_json`.

- [x] Dedicated environment: test-key, context mock, Live ON, Agentic OFF, minute limit 20; keep harness context limits 12/8000.
- [x] Register/seed user A, ensure reviewed RAG, generate an explicit phishing question (201/index 1), add contextual suspicious-link follow-up in same conversation, generate (201/index 2).
- [x] Assert both safe bounded actions/sources and learner/source/context diagnostics; turn 2 proves strict roles, actual assistant content and current user last. Reject private learner/raw-data/secret markers.
- [x] GET detail: exact four roles/IDs/reply bindings and per-assistant action/source groups. DB: exactly two completed generations, distinct assistants, correct attachments and owned conversation.
- [x] Before replay inspect existing trace table if available; assert turn-2 planning.used=false, runtime_disabled, null tool and zero tool/model planner counters, maxToolExecutions=0.
- [x] Capture conversation-bounded message/generation/action/source rows and turn-2 IDs/counts. Replay identical request: 200, same output IDs/content index 2, unchanged rows/counts. Do not assert audit trace counts.
- [x] Syntax-check only; independent Control Tower runs test:ai on isolated MySQL.

## Task 4: Verification and review handoff

- [x] Run pure acceptance and fixture-only `npm.cmd --prefix server run test:ai-provider-unit` with real-network denial.
- [x] Run `node --check` for both scripts and Provider; `git diff --check` plus whitespace checks on new files.
- [x] Review exact six-file candidate and contract coverage; recheck baseline/status and preserve untracked evidence.
- [x] Record RED/GREEN, command results, no DB/build/browser execution, zero live/network/staging activity and pending independent Control Tower review. No acceptance/closure claim.

## Execution record

Preflight verified exact HEAD and clean tracked tree. Existing untracked reports/review evidence preserved. Inspected actual Provider, AI pipeline, harness helpers, persistence schemas and trace sanitizer/repository.

Ruling: the owner's supplied minimal design and routine execution authority authorize implementation without a new design-approval pause. Use the requested design/plan files and inline execution; no commits, worktree changes or broader tests. The execution record stays in this named plan, keeping the candidate at exactly six files. A read-only final reviewer follows executing-plans guidance and does not implement or accept the phase.

- Pure RED, before any Provider edit: `npm.cmd --prefix server run test:conversation-pipeline-acceptance` exited 1; 8 tests, 2 PASS, 6 expected FAIL. Missing diagnostics were call index, role sequence, assistant count, prior-history flag, actual prior-content flag and current-user-last flag. Existing transcript aggregate and non-echo checks passed. Transport attempts 0; live OpenAI/Gemini/ILMU 0/0/0.
- Minimal mock GREEN: added one module-local counter, actual assistant-history inspection and six safe aggregate diagnostics only in the context mock. Same command exited 0, 8/8 PASS, network attempts 0 and live calls 0/0/0. Final repeat also 8/8 PASS. No raw message strings or synthetic secret/private markers are echoed.
- Dedicated HTTP/DB block added using existing helpers and cleanup. Process-local Live ON / Agentic OFF, minute limit 20, unchanged context bounds. Explicit phishing turn and suspicious-link follow-up; assertions cover learner context, reviewed sources/actions, full role/ID/reply bindings, exactly two completed generation links, owned conversation, per-assistant attachments, Agentic OFF pre-replay trace and exact completed replay. It is prepared and syntax-checked only; no executor DB/server run.
- Provider regression: `npm.cmd --prefix server run test:ai-provider-unit` exited 0, "AI provider unit verification passed." A uniquely named transport-denial preload in the OS temp directory was applied via process-local `NODE_OPTIONS` and the previous value restored in finally. Both npm and test process reported real network attempts=0. Tests use injected transports/provider fixtures; simulated SDK attempts are not live Provider calls. No repository/config/env file changed by the guard.
- Final read-only candidate review found one P2 test coverage gap: initial snapshots compared IDs/attachments but omitted action/source payload and generation metadata. Expanded the four conversation-bounded output snapshots to complete rows, so payload/order/metadata mutation also fails replay invariance. Existing generation replay uses INSERT IGNORE and completedResponse reads stored rows; no output timestamp update is expected. This is a test-only strengthening, with DB execution still reserved for Control Tower.
- Reviewer read-back confirmed the P2 resolved and reported no remaining findings. Fresh syntax and diff checks after the snapshot edit pass. This review does not grant Control Tower acceptance.

| Executor verification | Result |
| --- | --- |
| `npm.cmd --prefix server run test:conversation-pipeline-acceptance` | PASS 8/8; network attempts 0; live calls 0/0/0 |
| `npm.cmd --prefix server run test:ai-provider-unit` | PASS exit 0; injected fixtures; guarded network attempts 0 in npm and child |
| `node --check server/scripts/test-conversation-pipeline-acceptance.js` | PASS exit 0 |
| `node --check server/scripts/test-ai.js` | PASS exit 0; full HTTP/DB suite not executed |
| `node --check server/src/ai/providers/openai.provider.js` | PASS exit 0 |
| `git diff --check` | PASS exit 0; LF/CRLF conversion advisories only |
| `git diff --no-index --check -- NUL <each new file>` | No whitespace errors; exit 1 denotes new-content differences |

Local audit commands included `git status --short`, `git rev-parse HEAD`, `git diff --numstat`, scoped `git diff`, `rg` and `Get-Content`. A few guessed read-only source paths did not exist; `rg --files` and the actual imports identified the correct paths. No application execution or external access resulted.

The six files in the design are the entire candidate. Package diff adds only the named command; real OpenAI generation code, all other existing integration blocks, limits, ownership, safety, rate handling, ranking, learner calibration and API/UI/schema remain unchanged. No env/lockfile/dependency changes. Existing evidence and unrelated untracked reports remain present; HEAD remains the exact baseline.

Live OpenAI/Gemini/ILMU calls=0/0/0; real network attempts=0; DB connections/mutations/migrations/ingest=0 in this executor; staging/production/Render/deployment activity=0. No commit/push, branch/reset/stash/clean action or R5-09 work. No frontend build or manual browser test; browser verification is unnecessary for this backend test-only candidate.

Remaining assumption and review boundary: Control Tower's isolated local MySQL has the existing schema/migrations, reviewed resources, assessment/scenario definitions and learner fixture prerequisites used by the pre-existing test-ai helpers. The new full HTTP/DB case has not been executed here. Replay no-third-final-call evidence combines completed-output invariants with inspection of the existing completedResponse early return; no extra diagnostic endpoint or third mock call is introduced. Independent Control Tower execution subsequently passed: pure 8/8, provider-unit PASS, fixed-port isolated-DB test:ai PASS with the explicit R5-08 two-turn/replay assertion, test:chat PASS, and zero non-loopback network attempts. FULL_CONVERSATION_PIPELINE_OFFLINE_PASS is granted and the exact candidate is approved for routine persistence. This offline acceptance does not establish Controlled Agentic live certification, TOOL_NORMALIZATION_PASS, production readiness or live multi-turn answer quality.
