# CyberGuard RAG Acceptance R5-07 Implementation Plan

**Status: CONTROL TOWER ACCEPTED / OWNER ROUTINE EXECUTION AUTHORITY**

**Execution:** Single implementation executor in the existing checkout, local/offline TDD. Owner's task supplies execution authority; user constraints override skill defaults for approval gates, commits, worktrees, delegation and broader suites. Control Tower independently reviews and executes DB acceptance.

**Baseline:** `ee49ef8ee6af98d2b9913ddcd8b444b28ffefb4b`.

**Goal:** Certify the retrieval governance and prompt-data construction contract without changing ranking or adding resources. Factual completeness, answer quality, adaptive learning, Agentic, tool normalization and production readiness remain outside R5-07. Future live RAG answer-quality evaluation is separate.

**Design:** [R5-07 design](../specs/2026-10-07-cyberguard-rag-acceptance-r5-07-design.md).

## Constraints and review focus

- Six named files only; no env/lockfile/schema/API/UI changes. Preserve untracked reports/evidence.
- No real network, live Providers, staging/production DB, Render/deployment or R5-08.
- No commit/push/reset/stash/clean/branch changes; no DB-dependent suites in executor.
- Catch source commands and forged closing delimiters without stripping source semantics.
- Keep normalized field bounds, model projection and citation numbering deterministic.
- Check actual service limits/dedupe/locale merge and actual emitted repository SQL.
- DB demotion test must prove retained physical chunks are no longer retrievable, while leaving original ranking assertions intact.

## Task 1: Pure acceptance RED

**Files:** Create `server/scripts/test-rag-acceptance.js`; add `test:rag-acceptance` to `server/package.json`.

**Interfaces:** Consume `buildRagContext(sources)`, `buildCyberGuardSystemPrompt()`, `isRetrievableDocument(row)`, `safeInternalTarget(target)`, `createRagService(repository).retrieveReviewedChunks(input)`, and `createRagRepository(pool).searchChunks(options)`. Test-only repository/pool fixtures stand in for DB I/O; no Provider is created.

- [x] Pin empty context, max five, 180/180/700 decoded normalized bounds, label fallbacks, projection, explicit pre-source/system directives, malicious text containment, delimiter counts and citation numbers.
- [x] Cover resource governance combinations, safe target page/key/ID projection, service requested limits and bounded candidates, duplicate resources, preferred locale followed by English, fallback disabled/full-primary cases and empty results.
- [x] Capture actual emitted SQL for a hostile query and filter values; assert parameters and governance predicates, with query text absent from SQL. Exercise real mapping of fake DB rows to exclude raw/provider/token/action fields.
- [x] Run `npm.cmd --prefix server run test:rag-acceptance` before editing prompts. Expected RED: missing explicit boundary/directives/delimiters; existing retrieval contracts pass.

## Task 2: Minimal prompt GREEN

**File:** `server/src/ai/ai.prompts.js` only.

**Interface:** Same exported builders and null/string return contract. Context source records carry title/sourceLabel/locale/snippet plus citation number in delimiter metadata; retrieval internals remain excluded.

- [x] Add explicit retrieved-source-data and never-follow-source-commands wording to the system prompt and before source blocks; retain safety precedence and source-number citation guidance.
- [x] Keep current normalization/clamps, five-source cap, filtering and citation numbers. Wrap JSON-serialized source fields in clear source-data delimiters; reversibly escape angle brackets to prevent delimiter forgery. Retain the legacy `[N] Title:` metadata prefix for the existing mock diagnostic.
- [x] Run focused suite; expected GREEN, with decoded malicious semantic content intact and zero real network attempts.

## Task 3: DB governance coverage for Control Tower

**File:** `server/scripts/test-rag.js` only. No DB execution here.

**Interfaces:** Existing fixture insertion and isolated test cleanup, `ingestPublishedResources()`, `syncResource(resourceId)`, `retrieveReviewedChunks(input)`, `listDocumentsForResource(resourceId)`, `countRetrievableChunksForResource(resourceId)`.

- [x] Add unique strong-match published/needs_review and published/approved/rag_ready=false fixtures using `rag-test-*` slugs. After ingestion, assert no matching retrieval, zero retrievable chunks and no eligible documents.
- [x] Ingest an eligible demotion fixture and verify positive retrieval/count. Update only that source resource's governance with a parameterized resource-ID predicate, call syncResource, then assert ineligible document state, zero retrievable chunks, excluded retrieval and identical retained physical chunk count. Use a non-scams query so ranking cannot mask eligibility.
- [x] Place additions independently of original ranking tests; retain existing cleanup boundaries. Hand DB execution to Control Tower's isolated local MySQL.

## Task 4: Offline verification and handoff

**Files:** Update only this plan's execution record; review all six candidate files.

- [x] Run `npm.cmd --prefix server run test:rag-acceptance` and `npm.cmd --prefix server run test:ai-provider-unit` (injected transports only).
- [x] Run `node --check` for `test-rag-acceptance.js`, `test-rag.js`, `ai.prompts.js`; run `git diff --check`. Check new files for whitespace as well.
- [x] Review final diff, status and HEAD. Report exact files, RED/GREEN, commands/results, zero live Providers/network/staging, no schema/migration activity, pending independent DB test and no browser verification need. No build or commit.

## Execution record

- Pre-flight: exact baseline HEAD verified; tracked tree clean; existing untracked reports and `review-evidence` present and preserved. Inspection confirms existing SQL governance/parameterization, bounded retrieval/dedupe/locale fallback, product limit 4 and retrieval error-to-[] handling.
- RED before prompt modification: `npm.cmd --prefix server run test:rag-acceptance` exited 1; 19 tests, 11 PASS, 8 expected failures. Failures identify missing delimiters/JSON data blocks and missing explicit anti-injection/system-data wording. Pure retrieval/governance/SQL/mapper tests pass. Network tripwire records 0 attempts; live OpenAI/Gemini/ILMU calls 0/0/0.
- Initial prompt GREEN: 19/19, exit 0. Minimal runtime change adds explicit directives and delimited escaped JSON data; no policy/repository/service/ranking change.
- Final compatibility review found the unchanged OpenAI mock context diagnostic counts `[N] Title:` markers. A regression assertion first failed (20 tests, 19 PASS, 1 FAIL; observed 0 markers, expected 2). Keeping that metadata prefix alongside the opening delimiter restored GREEN: 20/20, exit 0. Malicious text remains inside JSON data and delimiter forgery tests still pass. This correction remains solely in the expected prompt file; no Provider generation is invoked by the pure suite.
- DB test additions are complete and syntax-checked only. Strong-match needs_review and RAG-disabled resources are asserted ineligible. The demotion fixture verifies a positive baseline, source governance update, sync exclusion/zero eligible chunks, and retained physical chunk count. Existing ranking tests and cleanup were not rewritten. Control Tower must run the revised `test:rag` in its isolated local DB; no executor DB connection, ingest or migration was performed.
- Provider unit suite uses injected fixture transports and overrides. A temporary transport-denial preload in the OS temp directory was applied using process-local `NODE_OPTIONS`, restored after each command. First launch exited 1 before test modules loaded because Windows backslashes were consumed by Node's option parser (`MODULE_NOT_FOUND`); a forward-slash path corrected the launcher. Guarded suite then PASS, exit 0, with zero real network attempts in both npm and its child test process. The temporary guard is outside the repository; it contains no secrets and no application/config change.

| Final verification | Result |
| --- | --- |
| `npm.cmd --prefix server run test:rag-acceptance` | PASS, 20/20, exit 0; network attempts 0 |
| `npm.cmd --prefix server run test:ai-provider-unit` | PASS, exit 0; fixture transports, network attempts 0 |
| `node --check server/scripts/test-rag-acceptance.js` | PASS, exit 0 |
| `node --check server/scripts/test-rag.js` | PASS, exit 0; no DB suite execution |
| `node --check server/src/ai/ai.prompts.js` | PASS, exit 0 |
| `git diff --check` | PASS, exit 0; only LF/CRLF conversion advisories |
| `git diff --no-index --check -- NUL <new file>` | All three new files have no whitespace errors; normal new-content difference exit 1 |

Author review covered all 13 owner contract clauses, the tracked diff and all new files. HEAD remains the exact baseline; candidate contains the six files listed in the design. Existing untracked reports/evidence remain present. Local audit commands included `git status --short`, `git rev-parse HEAD`, `git diff --numstat`, scoped `git diff`, `rg` and `Get-Content`. One `rg` invocation used a Windows wildcard path and reported OS error 123; using `-g 'test-ai*.js'` under the scripts directory completed the intended search. No external access or application activity resulted from either launcher/search diagnostic.

Live Provider calls OpenAI/Gemini/ILMU = 0/0/0; real network attempts = 0. No staging/production/Render/deployment/R5-08, no env/dependency/lockfile/schema/UI changes, and no commit/push or branch/reset/stash/clean action. No frontend build or DB-dependent suites were run under this verification boundary.

Assumptions/limits: safe resource targets use the existing catalog slug contract and positive-ID projection; this phase does not introduce a slug validator or new action routing. Retrieved locale is normalized by the real retrieval path. Field clamps apply after whitespace normalization and before reversible JSON encoding. Product limit 4 and retrieval error-to-[] behavior were verified by source inspection, not DB integration execution. Prompt-data tests prove construction/containment, not factual completeness or live model behavior. Manual browser verification is unnecessary for this backend-only candidate. Control Tower independently ran the revised DB acceptance and full mock AI integration on its isolated local MySQL: test:rag PASS and test:ai PASS with zero non-loopback network attempts. R5-07 offline acceptance is CLOSED and the exact candidate is approved for routine persistence, with no production-readiness or live answer-quality claim.
