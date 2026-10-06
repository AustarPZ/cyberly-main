# CyberGuard Learner Context Acceptance R5-06 Implementation Plan

> **Execution:** SINGLE implementation executor under owner routine execution authority. Use test-driven development and offline verification. Control Tower performs independent final acceptance. User instructions override skill defaults for additional approvals, subagents, worktrees, commits, and broader suites.

**Goal:** Remove evidence-free learner capability labels and demonstrate the existing context privacy and boundedness contract offline.

**Architecture:** Preserve missing scores through the existing pure context builder, keeping valid-score level mapping and confidence rules intact. Exercise the real context builder and provider instruction serializer without calling Provider generation methods.

**Tech Stack:** Node.js CommonJS, `node:assert/strict`, `node:test`, existing npm scripts.

**Spec:** [R5-06 working design](../specs/2026-10-07-cyberguard-learner-context-acceptance-r5-06-design.md)

## Global constraints

- Baseline: `5c23e423915b78de092f0dcb6c352864bc657213`.
- Local/offline only; no live Provider/network/staging/production/Render/deployment/R5-07.
- Preserve all existing untracked evidence; no commit/push/reset/stash/clean/branch changes.
- No `server/.env`, DB/schema/migration, API format, UI, RAG, recommendations, or adaptive-learning redesign.
- No DB-dependent suites. Live calls stay OpenAI/Gemini/ILMU = 0/0/0.
- Final acceptance belongs to Control Tower; later live learner-context acceptance requires a separate bounded execution decision.

## Review focus

- Null/empty/nonnumeric scores must not become zero evidence; topic/progress-only data cannot establish a learner level.
- Genuine zero and numeric database strings must keep their valid mappings; single-source scores must not be diluted by absence.
- Invalid entries in a scenario list must not change the valid scenario average.
- Secondary topics and recommendation fields must stay bounded even when input rows contain extra fields.
- Synthetic identity/private-answer fields and exact evidence values must not leak through either serialized context or Provider instructions.

## Task 1: Evidence calibration and offline characterization

**Files:**

- Create: `server/scripts/test-ai-learner-context.js`
- Modify: `server/src/ai/ai.learnerContext.js`
- Modify: `server/src/ai/ai.learningActions.js` (one null-confidence compatibility fallback only)
- Modify: `server/package.json`
- Modify: `server/scripts/test-ai.js` (one no-evidence assertion only)

**Interfaces:** Consume `buildLearnerContext({ locale, data })` and `buildResponsesInstructions(systemInstruction, learnerContext, ragContext, routeContext)`. Produce the unchanged context object interface, with null learner level when evidence is absent, and the npm `test:ai-learner-context` command. No generation calls or DB connections.

- [x] Write tests with literal expectations: no evidence -> null level/default age/no Foundation; assessment 60 -> L3/Low; scenario 80 -> L4/Low; combined assessment 60 and two scenarios 50,70 plus two topic rows -> L3/Medium. Cover all L1-L6 boundary transitions, zero, numeric strings, invalid/missing scores, progress-only input, age mapping/default, school stage whitelist, focus <=1+2, and bounded recommendation keys.
- [x] Inject synthetic email, username/display_name, raw answers/decisions, selectedOptionKey, prompt-private data, reason_text and distinctive exact score values into all input row types. Assert their absence from JSON and real instruction assembly, safe fields remain, and no score/weight/formula payload is exposed.
- [x] Register `test:ai-learner-context`; run `npm.cmd --prefix server run test:ai-learner-context` before production edits. Expected: regression assertions fail because absent scores yield L1 and assessment-only scores are diluted; existing privacy/bounds tests pass.
- [x] Add one internal numeric-score normalizer and use it in average/weighted score/level mapping to preserve null absence. Keep thresholds, combination weights, confidence logic, and all projection rules unchanged.
- [x] Add `assert.match(content, /learnerLevel=unknown/)` to the existing no-evidence mock integration case in `test-ai.js`. This suite remains deferred to Control Tower because it requires a DB.
- [x] Run focused suite again. Expected: every test passes, with no Provider calls or external services.
- [x] Pin generic no-evidence action types to `['assessment', 'resources', 'scenarios']` using the real context/action builders. Verify failure before adding a one-line Low confidence fallback in `hasEvidence()`; verify the existing action behavior is restored.

## Task 2: Offline regression and handoff

**Files:** Update only this plan's execution record with actual outcomes; inspect all candidate files and preserve unrelated evidence.

**Interfaces:** Consume Task 1 candidate and focused tests. Produce a reviewable uncommitted candidate and explicit verification record for Control Tower.

- [x] Run the four required offline test commands from the spec. Expected: exit 0 for each; no live Provider/network/DB activity.
- [x] Run `node --check` on `ai.learnerContext.js`, `ai.learningActions.js`, `test-ai-learner-context.js`, `test-ai.js`; run `git diff --check`. Expected: exit 0 for each.
- [x] Review the final diff and new files against each design clause. Confirm exact baseline HEAD, seven changed/new files, untouched existing evidence, no env/lockfile/schema changes. Expected: narrow candidate only.
- [x] Record results and report root cause, exact files, commands, tests/build status, DB impact, unresolved assumptions and browser verification status. Mark ready for independent Control Tower offline review only; no acceptance or live quality claims.

## Execution record

- Pre-flight: exact HEAD verified; tracked worktree clean; existing untracked review evidence preserved. No shared interfaces beyond the unchanged builder/serializer contract.
- Ruling: Single executor, existing checkout, no commit and no repeated approval per explicit owner instruction. Control Tower retains independent review; no agent is dispatched.
- Root-cause characterization: no evidence returns L1/Low; assessment 60 alone returns L1/Low; scenario 80 alone returns L4/Low; genuine assessment zero returns L1/Low. Fix must cover upstream null coercion as well as the final mapper.
- RED verified before runtime edits: focused suite 19/25 pass, six expected failures caused by absent-score coercion. A hand-calculated rounding fixture was corrected from scenario 55.2 to 56 before implementation; the corrected rounding characterization passes on the baseline.
- Task 1: numeric absence preserved in average, weighted score and learner-level mapper; no-evidence integration assertion pinned to unknown. Initial focused suite GREEN: 25/25. Initial age tests 6/6, learning-actions and provider unit suites, three JS syntax checks and diff check all passed.
- Final review ruling: add one directly affected consumer file, `ai.learningActions.js`, solely to preserve existing no-evidence action behavior when learner level becomes null. Leaving it unchanged would return progress rather than assessment for a generic query. No recommendation redesign; seven candidate files. New real-builder regression confirmed RED (progress rather than assessment) before the one-line compatibility fix.
- Diagnostic note: a filtered `node --test --test-name-pattern='assessment-first' server/scripts/test-ai-learner-context.js` invocation encountered sandbox child-process `spawn EPERM`; no external activity occurred. The required direct-node npm script ran normally and established the behavioral RED result. No escalation or DB suite was used.
- Task 1 complete: compatibility regression GREEN; all 26 focused tests pass. No false Foundation label with absent/invalid evidence; valid levels, confidence, age contract, bounded projection and private-marker exclusion verified.
- Task 2 complete: final offline verification after compatibility fix is recorded below. Control Tower independent offline review subsequently passed and granted LEARNER_CONTEXT_CONTRACT_PASS; the exact candidate is approved for routine persistence.

| Final command | Result |
| --- | --- |
| `npm.cmd --prefix server run test:ai-learner-context` | PASS, 26/26, exit 0 |
| `node server/scripts/test-ai-age-context.js` | PASS, 6/6, exit 0; repository query uses an injected fixture |
| `npm.cmd --prefix server run test:learning-actions` | PASS, exit 0 |
| `npm.cmd --prefix server run test:ai-provider-unit` | PASS, exit 0; fixture transports only |
| `node --check server/src/ai/ai.learnerContext.js` | PASS, exit 0 |
| `node --check server/src/ai/ai.learningActions.js` | PASS, exit 0 |
| `node --check server/scripts/test-ai-learner-context.js` | PASS, exit 0 |
| `node --check server/scripts/test-ai.js` | PASS, exit 0; syntax only, DB-dependent integration suite not run |
| `git diff --check` | PASS, exit 0; Git line-ending conversion advisories are not whitespace errors |

Final author review covers all design clauses, runtime diff and new tests/docs, including null-safe agent mapping and no-evidence action compatibility. The sole additional production file is the one-line action predicate correction; independent review remains Control Tower's responsibility. No other modules, env, dependencies/lockfiles, DB/schema/migrations or existing evidence were changed. No frontend build or DB-dependent suites were run under this phase's verification boundary.

Additional final read-back: no-evidence output is exactly `{"locale":"en","ageBand":"13-17","learnerLevel":null}`. `git diff --no-index --check -- NUL <file>` was also run separately for all three new files; no whitespace errors were reported. Those comparisons return the normal differences exit code 1 for new content, with only Git LF/CRLF advisories. Tracked `git diff --check` returns 0. Local audit commands included `git status --short`, `git rev-parse HEAD`, `git diff --stat`, scoped `git diff`, `rg` searches and `Get-Content` source/docs reads; no mutation commands were used for source control.

Live Provider calls OpenAI/Gemini/ILMU = 0/0/0. No real network, staging DB, production, Render or deployment activity; no R5-07, commit or push. Filesystem reads and git inspection were local. Existing Provider unit fixtures are not live certification.

Assumptions/limits: existing DB constraints remain responsible for score ranges, profile enum values and reviewed topic/recommendation codes; no new clamping or confidence redesign. Privacy acceptance covers the projected builder-to-instruction path, not an arbitrary caller-supplied context object or unrelated RAG/route text. The added `test-ai.js` integration assertion awaits Control Tower's isolated-DB decision. Manual browser verification is not needed for this backend-only candidate. No RAG/adaptive/multilingual/Agentic/tool-normalization/production-quality certification or live execution authorization is implied.

Exact candidate files:

- `docs/superpowers/specs/2026-10-07-cyberguard-learner-context-acceptance-r5-06-design.md` (new)
- `docs/superpowers/plans/2026-10-07-cyberguard-learner-context-acceptance-r5-06.md` (new)
- `server/src/ai/ai.learnerContext.js` (modified)
- `server/src/ai/ai.learningActions.js` (modified, one line)
- `server/scripts/test-ai-learner-context.js` (new)
- `server/package.json` (modified, one script)
- `server/scripts/test-ai.js` (modified, one assertion)
