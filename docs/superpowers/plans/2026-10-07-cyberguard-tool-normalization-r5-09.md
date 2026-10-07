# CyberGuard Tool Normalization R5-09 Implementation Plan

> **For agentic workers:** Execute natively in this session using the TDD and verification skills. Owner routine execution authority applies; no commits or worktree/branch operations. User scope overrides skill defaults requiring approval handoffs, commits, broader suites or cleanup. Independent Control Tower offline review follows implementation.

**Status:** CONTROL TOWER ACCEPTED / OWNER ROUTINE EXECUTION AUTHORITY.

**Goal:** Establish deterministic canonical tool calls and correct provider wire declarations using offline fixtures.

**Architecture:** Validate returned arguments centrally and preserve the canonical shape. Keep the Responses and Gemini serializers; add a distinct Chat Completions serializer and route ILMU raw returned calls through shared normalization.

**Tech Stack:** Existing CommonJS Node modules, Node strict assertions, injected fetch.

**Spec:** [R5-09 design](../specs/2026-10-07-cyberguard-tool-normalization-r5-09-design.md).

## Global constraints

- Exact baseline `b487aac6720481b0421f1179d57492a8e5efe3eb`.
- Local/offline only; provider calls OpenAI/Gemini/ILMU = 0/0/0; real network = 0.
- No real tool execution, live certification, staging/production access, Render mutation, deployment, commit/push, reset/stash/clean or branch operations.
- No schema/API/UI/catalogue/eligibility/executor changes; preserve unrelated files and evidence.
- Stop and report if OpenAI or Gemini needs an adapter-specific change.
- R5-09 certifies deterministic wire/canonical normalization only, not live tool calling, Controlled Agentic live behavior, real-output execution correctness or production readiness.

## Review focus

- Explicit invalid `arguments` alongside valid `args` must throw instead of falling through (Task 1 test).
- One malformed call after a valid call must reject the whole result (Task 1 test).
- Direct nonplain values must throw; nested object contents remain untouched (Task 1 tests).
- Whitespace around a prohibited name must not bypass exclusion (Task 1 tests).
- ILMU malformed response arguments must reach shared validation, not become `{}` (Task 1 injected-response tests).

## Task 1: Dedicated contract tests and RED

**Files:** Create `server/scripts/test-ai-tool-normalization.js`; modify `server/package.json` only to add `test:ai-tool-normalization`. Create the design and this plan.

**Interfaces:** Consume existing `normalizeReturnedToolCalls(provider, calls)`, `toOpenAiTools(tools)`, `toGeminiTools(tools)`, and `createIlmuProvider(config).generate(request)`. Specify new `toChatCompletionsTools(tools)` through a test before implementation.

- [x] Write tests for the supplied contract and review-focus cases; deny real transports before loading modules and inject ILMU fetch with synthetic fixtures.
- [x] Run `npm.cmd --prefix server run test:ai-tool-normalization` before production edits. Expected: assertion RED for wrong OpenAI ID/string arguments, missing Chat Completions serializer, ILMU flat declarations and malformed arguments accepted.
- [x] Read all failures and record the baseline result below. Existing serializer/object-argument cases should already pass.

## Task 2: Minimal shared normalization and ILMU fix

**Files:** Modify `server/src/ai/providers/aiProvider.tools.js` and `server/src/ai/providers/ilmu.provider.js` only.

**Interfaces:** Preserve canonical `{callId, toolName, arguments, provider}`; add `toChatCompletionsTools(tools = [])` returning nested function declarations; throw existing `AI_TOOL_CALL_INVALID` for invalid arguments.

- [x] Implement trimmed names, ID precedence, first-defined argument selection and plain-object validation without object mutation.
- [x] Add Chat Completions serialization through shared declaration normalization; leave Responses/Gemini wire shapes and prohibited names unchanged.
- [x] Switch ILMU serializer and remove its permissive parse/catch by normalizing raw returned `tool_calls`.
- [x] Run `npm.cmd --prefix server run test:ai-tool-normalization`. Expected: all dedicated cases pass and zero network attempts.

## Task 3: Offline regression and handoff

**Files:** No additional product files; update this plan with evidence.

- [x] Run `npm.cmd --prefix server run test:ai-provider-unit` and `npm.cmd --prefix server run test:controlled-agentic` with a temporary process-local network-denial preload. Expected: both pass; no transport attempts. The latter runs fixture executor handlers, not real tools.
- [x] Run `node --check` on the dedicated test and both changed production JS modules. Expected: exit 0 for each.
- [x] Review the exact diff against the spec and run `git diff --check`. Expected: narrow allowed scope, no whitespace errors, unchanged baseline HEAD and preserved pre-existing untracked files.
- [x] Record RED/GREEN, database/build/manual-browser status and pending independent review; leave uncommitted.

## Execution evidence

Baseline verified in this session: exact HEAD; tracked working tree initially clean, with pre-existing unrelated untracked reports and `review-evidence/`. No environment files or external systems accessed.

### RED before production edits

Command: `npm.cmd --prefix server run test:ai-tool-normalization`; exit **1**; **47/107 passed, 60 failed**. Both production-module diffs were empty at this point; the only tracked diff was the package script addition.

Observed baseline failures included:

```text
FAIL: OpenAI raw Responses call preserves call_id and parses JSON arguments
actual:   callId='fc_item_1', arguments='{"query":"phishing"}'
expected: callId='call_real_1', arguments={query:'phishing'}

FAIL: ILMU injected fetch emits Chat Completions body and preserves request settings
actual tools:   [{type:'function', name, description, parameters}]
expected tools:[{type:'function', function:{name, description, parameters}}]

FAIL: malformed JSON argument text throws without echoing the payload
Missing expected exception.
FAIL: ILMU injected malformed/nonobject response {bad rejects
Missing expected rejection.

Tool normalization: 47/107 passed; 60 failed.
Live provider calls OpenAI/Gemini/ILMU = 0/0/0; real network = 0; real tool executions = 0.
```

Remaining RED assertions covered trimmed names, JSON object parsing, invalid text/direct payloads, whitespace-only text, invalid-field fallback, whole-list failure, whitespace prohibited-name exclusion, and the missing Chat Completions serializer. These were expected missing behaviors, not import/syntax failures. Existing Responses/Gemini exact serializers, ordinary object args and valid ILMU returned calls passed.

### GREEN and regression results

| Command | Exit | Observed result |
| --- | --- | --- |
| `npm.cmd --prefix server run test:ai-tool-normalization` | 0 | **107/107 passed; 0 failed**; real network 0; real tool executions 0 |
| `npm.cmd --prefix server run test:ai-provider-unit` with transport preload | 0 | `AI provider unit verification passed.`; tripwire attempts 0 in npm and test processes |
| `npm.cmd --prefix server run test:controlled-agentic` with transport preload | 0 | `Controlled single-step Agentic foundation verification passed.`; tripwire attempts 0 in npm and test processes |
| `node --check server/scripts/test-ai-tool-normalization.js` | 0 | Syntax valid |
| `node --check server/src/ai/providers/aiProvider.tools.js` | 0 | Syntax valid |
| `node --check server/src/ai/providers/ilmu.provider.js` | 0 | Syntax valid |
| `git diff --check` | 0 | No whitespace errors; Git printed only Windows LF/CRLF conversion notices |

First attempts at both regression commands exited 1 before any test loaded: `NODE_OPTIONS` interpreted Windows backslashes and could not resolve the guard module (`MODULE_NOT_FOUND`, internal/preload). This was a verification harness path error, not a product RED. Replacing backslashes with forward slashes fixed it; both corrected runs are the GREEN results above. No real transport ran on the failed preload attempts.

Temporary guard retained at `C:/Users/AsusT/AppData/Local/Temp/cyberly-r509-offline-d1154f1aa8504491a5aff6d7e69a1af1.cjs`. For each corrected npm command, prepend `--require "<guard path>"` to process-local `NODE_OPTIONS` and restore the original value in `finally`. The guard denies global fetch, HTTP(S) request/get, socket connect and TLS connect; any attempt fails the process even if a test catches it. The dedicated suite has its own equivalent guards and injects every ILMU fetch. No repository evidence was overwritten or removed.

### Phase limits and handoff

- Provider calls OpenAI/Gemini/ILMU: **0/0/0**. Real network: **0**. Render/deployment/staging DB/production/live certification activity: **none**.
- No real tool execution. The mandatory existing Controlled Agentic regression invokes synthetic fixture handlers; its `tool_execution` log refers to those fixtures only. The dedicated normalization suite imports no executor and executes no tool.
- Database/schema/migration impact: **none**; no migrations, DB commands, ingestion or DB-dependent suites run.
- Frontend/build impact: **none**; frontend build and manual browser verification are not needed for this phase and were not run. No full-suite or live-readiness claim is made.
- Assumption: current wire contracts are the Control Tower-verified contracts supplied by the owner. Live behavior remains unverified and outside this authority. The inherited Gemini malformed-scalar boundary is explicitly dispositioned below.
- Tracked candidate: only `server/package.json`, `server/src/ai/providers/aiProvider.tools.js`, `server/src/ai/providers/ilmu.provider.js`. New candidate: only this plan, its design and `server/scripts/test-ai-tool-normalization.js`.
- No OpenAI/Gemini adapter changes, environment-file changes, commit, push or source-control state changes.

### Final review and disposition

A separate read-only reviewer inspected the six-file candidate against the supplied contract, including the tests and production diff. No blocking finding or introduced correctness defect was found. Reviewer ran no tests and mutated no files; the command evidence above is the executor's observed evidence. This review is not independent Control Tower acceptance.

Final: Ruling: the existing Gemini extractor (`server/src/ai/providers/gemini.provider.js:37`) uses `functionCall.args || {}` and could coerce malformed direct falsy SDK values (false/0/null) to `{}` before shared validation. Leave it unchanged because the supplied Gemini wire contract is valid structured-object args, the authorized change is shared normalization plus ILMU, and no test proved an unavoidable adapter defect against that contract. Cost if wrong: an out-of-contract malformed Gemini SDK scalar could be treated as empty arguments by the inherited extractor; this phase does not establish end-to-end Gemini invalid SDK-output rejection. Do not use this offline result as live certification.

Final: Ruling: inherited malformed response-envelope handling, nonarray call collections and null call entries remain outside this bounded contract. Keep existing behavior: nonarray collections normalize to no calls; null entries throw rather than reach execution. Cost if wrong: an unexpected provider envelope could lose a tool request or fail the provider response; no envelope-wide live certification is established here. Live compatibility, real execution, merge authorization and production readiness were also declined by the reviewer and remain outside owner authority for this phase.

Final HEAD was rechecked as `b487aac6720481b0421f1179d57492a8e5efe3eb`; tracked diff contains only the three requested runtime/package files. The three new candidate files are the requested design, plan and dedicated suite. Original untracked reports and review-evidence remain present and were not edited. All task checkboxes are complete; no commit or push was performed.

**Control Tower disposition:** independent offline review PASS. TOOL_NORMALIZATION_PASS = YES / OFFLINE CONTRACT. The exact six-file candidate is approved for routine persistence. Controlled Agentic live certification and production readiness remain separate and are not granted.
