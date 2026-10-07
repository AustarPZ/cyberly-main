# CyberGuard Controlled Agentic Live R5-10 Implementation Plan

> **For agentic workers:** Execute natively in this session, task by task. Owner authorization covers the supplied offline implementation; no commit, delegation, deployment or live execution step is authorized.

**Goal:** Prepare a fail-closed one-turn staging certification harness and prove its offline guards.

**Architecture:** Standalone CommonJS harness with pure guard functions and gated runtime imports. Creation wrappers instrument the existing OpenAI provider and controlled executor; product code is unchanged. Child-process tests deny imports/network in offline modes and regressions deny real transports.

**Tech Stack:** Existing Node/Express/MySQL/OpenAI SDK, Node assert/crypto/fs/child_process.

**Spec:** `docs/superpowers/specs/2026-10-07-cyberguard-controlled-agentic-live-r5-10-design.md`

**Status: CONTROL TOWER ACCEPTED / CONTROLLED_AGENTIC_LIVE_PASS**

## Global constraints

- Product baseline `cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688`; parent pre-corrective baseline `09649868238ba4801fb0ffea31a51026b8cc582e`.
- Offline only; zero real Provider calls/tool executions/network/DB writes.
- Future ceiling US$0.02; OpenAI `gpt-5.4-mini`; planner 500/final <=400; body <=20000 bytes.
- Logical/physical caps 2/2; planner/final exactly 1/1; tool exactly 1 `get_learning_progress`; retries/fallback 0/0.
- Only five named deliverables. Preserve all existing evidence and untracked files; no product/.env/source-control mutations.
- Offline success does NOT authorize or establish future live certification or production readiness.

## Review focus

- Product catches planner failure: sticky stop must still block final request/tool work.
- Gateway timeout can leave planner in flight: reject concurrent final activity.
- Missing physical usage: block subsequent spend; never treat unknown cost as zero.
- Replay creates audit trace: distinguish allowed audit insertion from stable output/learning rows.
- Windows line endings: compare LF-normalized product hashes; exact deployed raw harness hash independently.

### Task 1: Tests and pure guard contract

**Files:** Create `server/scripts/test-r5-10-controlled-agentic-live-gate.js`; add only `test:r5-10-controlled-agentic-live-gate` to `server/package.json`.

**Interfaces:** Child CLI emits one safe JSON receipt. Harness exports immutable `CONTRACT`, `SOURCE_HASHES`, `SAFE_ERROR_CODES`, `safeErrorCode` and pure validators for offline tests.

- [x] Write tests first: default inert mode, self-test coverage and zero counters/imports/network, baseline hashes/limits, safe error redaction, plain reviewable source and credential-output patterns.
- [x] Run `npm.cmd --prefix server run test:r5-10-controlled-agentic-live-gate` before creating harness. Expected RED: `R5_10_HARNESS_MISSING`.
- [x] Implement the pure request/normalization/counter/usage/replay/authorization guards and synthetic self-test in the named harness.
- [x] Run dedicated suite; require GREEN and firewall zero attempts/imports.

### Task 2: Gated future runtime path

**Files:** Create `server/scripts/r5-10-controlled-agentic-live-gate.js`; no product source modifications.

**Interfaces:** `runHarness()` defaults inert, self-test offline; `runLive()` imports only after exact authorization/hash preflight. Creation wrappers use the same validators as self-test.

- [x] Assert baseline/owner/budget/service/candidate/harness hash/production/inherited flags/tests before importing product.
- [x] Wrap provider before server load, enforce SDK retries zero, planner/final order and sticky stop. Wrap executor before controlled service load; check canonical call and original read-only catalogue definition.
- [x] Install exact destination/body guards and account both native response usages at accepted prices; fail on missing usage, output cap, wrong identity or budget breach.
- [x] Prepare code for local loopback API, synthetic verified teen and progress seed; preserve data. Snapshot learning state before generation, then assert product result, persisted trace/usage, snapshots, replay identities/counts/counters and health. These runtime steps were NOT executed.
- [x] Review safe receipts, cleanup of process resources only, and no payload/credential/error logging. No `--execute` invocation in this phase.

### Task 3: Offline regression and handoff

**Files:** Update these two docs with evidence; no additional artifacts required.

- [x] Run dedicated test, `test:cyberguard-live-activation`, `test:ai-tool-normalization`, `test:controlled-agentic`, `test:ai-provider-unit` under process-local no-network tripwires with empty Provider credentials.
- [x] Run `node --check` for both new JS files and `git diff --check`.
- [x] Compare source hashes with exact Git baseline, inspect file allowlist/diff and preserve historical evidence.
- [x] Record RED/GREEN, test counts, final artifact hashes, limits, no DB/migration/build/browser impact and remaining Control Tower review.

## Evidence

Historical pre-corrective preparation used product baseline `09649868238ba4801fb0ffea31a51026b8cc582e`; only unrelated untracked files existed initially. RED command exited 1 with `R5_10_HARNESS_MISSING`, 0/6 tests, firewall networkAttempts=0 and blockedImports=0. No harness implementation existed at that point. The present R5-10B rebase starts at HEAD `cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688` with the pre-existing uncommitted five-file harness candidate.

Additional REDs: proposal-store characterization failed (5/7) because the initial
harness queried a nonexistent proposal table; replaced with a fail-closed wrapper
of the actual in-memory store. Incomplete-usage receipt test then failed (7/8);
exported receipt validation and changed total estimate to null when attempt usage
is incomplete, retaining a separately labeled known-response subtotal. Both are
harness-only corrections. Final GREEN is **8/8** dedicated tests and **50** pure
self-test checks. Static baseline hash verification covers **26** product files.
The following results are freshly verified for the R5-10B corrective rebase:

| Command | Result |
| --- | --- |
| `npm.cmd --prefix server run test:r5-10-controlled-agentic-live-gate` | PASS 8/8, child inert/self-test; no product imports or network |
| `npm.cmd --prefix server run test:cyberguard-live-activation` | PASS, injected repository/Provider fixtures; corrected full audit metadata |
| `npm.cmd --prefix server run test:ai-tool-normalization` | PASS 107/107 |
| `npm.cmd --prefix server run test:controlled-agentic` | PASS, injected Provider/tool/adaptive fixtures only |
| `npm.cmd --prefix server run test:ai-provider-unit` | PASS, injected transports only |
| `node --check server/scripts/r5-10-controlled-agentic-live-gate.js` | PASS |
| `node --check server/scripts/test-r5-10-controlled-agentic-live-gate.js` | PASS |
| `git diff --check` | PASS; existing Git autocrlf informational warning for package.json |

Regression firewall setup (transparent PowerShell, no opaque/base64 command):

```powershell
$r510Firewall = (Join-Path (Get-Location) 'server/scripts/test-r5-10-controlled-agentic-live-gate.js').Replace('\','/')
$env:NODE_OPTIONS = '--require="' + $r510Firewall + '"'
Get-ChildItem Env: | Where-Object { $_.Name -match '^(AI_TEST_|R510_)|(?:OPENAI|GEMINI|ILMU|GOOGLE|ANTHROPIC).*(?:KEY|TOKEN|SECRET|CREDENTIAL)' } | ForEach-Object { Remove-Item -LiteralPath ('Env:' + $_.Name) }
$env:OPENAI_API_KEY = ''
$env:GEMINI_API_KEY = ''
$env:ILMU_API_KEY = ''
$env:GOOGLE_API_KEY = ''
$env:AI_CYBERGUARD_LIVE_ENABLED = '0'
$env:AI_CYBERGUARD_AGENTIC_ENABLED = '0'
```

Every successful regression process reported `networkAttempts=0`, `blockedImports=0`.
Those settings apply only to each verification process; no environment file is read
or edited. Provider unit/normalization suites retain their injected fake credentials
and transports; no real Provider credentials are supplied.

Historical initial regression launch attempts failed at preload resolution because Windows
backslashes were consumed by NODE_OPTIONS parsing; changing the preload path to
forward slashes corrected this. No suite/Provider/network ran in those failed
launches. Sandbox Node->Git/child process restriction required execution
escalation for the dedicated suite; the escalation retained the test's transport
and product-import tripwires and did not grant live execution.

The R5-10B exact-blob recomputation initially hit sandbox `spawnSync git EPERM`
before any write; escalation allowed the read-only Git checks and named script
edits. The first guarded dedicated launch exited zero but emitted no test results:
preloading the main test file cached it before `require.main` was assigned. This
was not accepted as a suite PASS. The test-only bootstrap now also recognizes its
exact main-script path when preloaded; the subsequent run explicitly passed all
8/8 tests. Regression preloads and inert/self-test child preloads remain guard-only.

Raw local R5-10B artifact SHA256 (deployed raw-byte hash must be measured separately):

| File | SHA256 |
| --- | --- |
| `server/scripts/r5-10-controlled-agentic-live-gate.js` | `e60a4ad19815fedd4e8521885f403f4092bf43f55e4bc19c6574a9c5b6026b9c` |
| `server/scripts/test-r5-10-controlled-agentic-live-gate.js` | `b66ddbdde043cc476dc94e37f9baccba83cb996dcef79b29cf276889025b5bf7` |
| `server/package.json` | `acac803eaf26992e398f4ddfd076a301d28321cecf9ff5d6550e58a867c13bf2` |

## R5-10B corrective rebase and handoff

**R5-10A PRODUCT BLOCKERS: RESOLVED.`r`nCONTROL TOWER HARNESS REACCEPTANCE: PASS.`r`nEXACT STAGING DEPLOY / INERT VERIFICATION: PASS.`r`nBOUNDED LIVE EXECUTION: PASS.`r`nCONTROLLED_AGENTIC_LIVE_PASS: ESTABLISHED.**

Accepted corrective `cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688` resolves both
pre-corrective findings. `ai.service.js` preserves the full `planAndExecute` result
with `...result` before normalizing context/proposal, retaining audit metadata and
model/tool counters. `agentModelGateway.js` always supplies the five controlled
tool declarations via `listControlledToolDeclarations()`, including when trusted
target context makes `preferActionProposal=true`. Exact Git parent/corrective diff
confirms those changes; the owner reports independent Control Tower acceptance
of the product corrective. No product file is edited by this harness rebase.

The harness and test now bind the new product base/owner authorization literal.
All 26 SOURCE_HASHES were recomputed against exact Git blobs at the corrective SHA,
normalizing CRLF -> LF only, rather than using dirty checkout bytes as authority.
Only `server/src/ai/ai.service.js` and `server/src/agent/agentModelGateway.js` changed;
the other 24 hashes equal the parent map. The test compares every expected hash
with both the normalized exact Git blob and the normalized checkout, and asserts
26 entries. All live bounds, default-inert/self-test behavior and transparent
authorization interlocks remain intact. The existing package test script is retained;
no additional script is introduced.

| SOURCE_HASHES entry | Parent SHA256 | Corrective SHA256 |
| --- | --- | --- |
| `server/src/ai/ai.service.js` | `2cd13ad108064cca2579ae5359e8ed86c9178426c84ce178647886e902a292fa` | `0703cede60cc3abde139958b36162cff461961a01e224d47a678ba33cae891a0` |
| `server/src/agent/agentModelGateway.js` | `fd367c21742707298700a42182ab7ead65ba596c84584a8e3b9021b1b77efce8` | `48f1bfa1900a9197c24160dcb60695b30fcbadb69a807810bbae5b0e621c7851` |

Five-file candidate against the product baseline: `server/package.json`,
`server/scripts/r5-10-controlled-agentic-live-gate.js`,
`server/scripts/test-r5-10-controlled-agentic-live-gate.js`,
`docs/superpowers/specs/2026-10-07-cyberguard-controlled-agentic-live-r5-10-design.md`,
`docs/superpowers/plans/2026-10-07-cyberguard-controlled-agentic-live-r5-10.md`.
The package file retains exactly its pre-existing one-script addition; only the
other four candidate files require rebase edits. Historical evidence and unrelated
files are untouched.

No harness override was used to manufacture audit or planner behavior. Staging
catalogue contents were not inspected. See the design's resolved-corrective section.

Provider calls OpenAI/Gemini/ILMU **0/0/0**; real network **0**; real tool executions
**0**; DB writes **0**. No commit/push/deploy/live gate/staging/production access.
No schema/migration/environment/dependency changes. No build or manual browser
verification is needed for this offline harness phase. DB-dependent/full backend
suites were not run: they import/use database setup outside this offline phase.
The future runtime assertion branch, Render configuration, deployed candidate,
staging schema/data, live provider behavior and billed costs remain unverified.

## Final live execution record

Control Tower completed the previously pending steps:

1. Persisted rebased five-file harness at `1f17d4250a16dbaa92fbfbab18932ddf1e2a4a96`.
2. Deployed exact API candidate as `dep-db2qtmnlk1mc738e5fh0`; build/start/health PASS.
3. Inert job `job-db2qucflk1mc738e7hhg` returned `NOT_AUTHORIZED` with zero Provider/tool/DB/network counters and proved deployed harness SHA `e60a4ad19815fedd4e8521885f403f4092bf43f55e4bc19c6574a9c5b6026b9c`.
4. Single bounded live job `job-db2quku7bikc73alt7cg` returned `R5_10_PRODUCT_PASS_PENDING_CONTROL_TOWER_REVIEW`.
5. Control Tower independently accepted the result:
   - Provider calls `2`, planner/final `1/1`, OpenAI only
   - tool executions `1`, exact tool `get_learning_progress`
   - retries/fallback/proposals/unexpected fetch `0/0/0/0`
   - trace assertions PASS
   - learning state unchanged PASS
   - replay unchanged PASS
   - cost `US$0.0030135` <= `US$0.02`
   - health `200 -> 200`

Final state: `CONTROLLED_AGENTIC_LIVE_PASS = YES`; `PRODUCTION_READY = NO`.