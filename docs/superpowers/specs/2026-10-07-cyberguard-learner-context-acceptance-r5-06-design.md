# CyberGuard Learner Context Acceptance R5-06

**Status: CONTROL TOWER ACCEPTED / OWNER ROUTINE EXECUTION AUTHORITY**

## Authority and purpose

Owner authorizes a single implementation executor to perform local/offline R5-06 implementation and verification at baseline `5c23e423915b78de092f0dcb6c352864bc657213`. Control Tower owns final acceptance. R5-05A/B/C/D/E are accepted as CLOSED for this task; CyberGuard has PROVIDER_INTEGRATION_PASS. Controlled Agentic live certification, tool normalization, and production readiness remain NO.

This work makes existing learner context evidence-calibrated, privacy-safe, bounded, and non-deceptive. It does NOT certify RAG quality, adaptive-learning quality, multilingual answer quality, Agentic, tool normalization, or production readiness. Any later live learner-context Provider acceptance requires its own bounded execution decision; it is not authorized here.

No live Provider calls, real network, deployment, Render mutation, staging database, production access, or R5-07 work. No commit/push, reset/stash/clean, branch creation/switch, or removal of existing untracked review evidence. Do not change `server/.env` or run DB-dependent suites.

## Verified baseline and root cause

`buildLearnerContext({ locale: 'en' })` currently returns L1/Foundation with Low confidence despite having no assessment or scenario evidence. JavaScript numeric coercion accepts `null` as zero both in `weightedScore()` and `learnerLevelForScore()`. At this exact baseline, `weightedScore(undefined, null)` already yields zero. Consequently a guard in the final level mapper alone cannot resolve the defect. The same coercion dilutes assessment-only evidence with a nonexistent scenario score: assessment 60 currently returns L1 instead of the existing 60-to-L3 mapping.

The existing repository loads bounded completed assessment/scenario aggregates, profile age group and education level, topic progress, and a recommendation. It does not select raw answers, scenario decisions, identity fields, or recommendation reason text. The context builder explicitly projects selected fields; `buildResponsesInstructions()` serializes that resulting context. This is an offline contract test of that path, not a claim that arbitrary unsanitized objects passed directly to the instruction builder are safe.

## Required contract

1. With no valid assessment/scenario score evidence, `learnerLevel` is null (absence is also acceptable to consumers). Missing evidence never implies L1/Foundation. Progress or topic-only evidence cannot establish a learner level.
2. Finite numeric scores and nonblank finite numeric strings remain supported, including genuine zero. Null, undefined, empty/whitespace strings, nonnumeric strings, booleans, objects, NaN, and infinities are not score evidence. Existing finite-score ranges and rounding remain unchanged; do not introduce score clamping or new calibration.
3. Preserve all L1-L6 thresholds, labels and form references. Preserve the existing combination weights when both operands exist. With only one valid evidence source, use that source; missing values do not enter scenario averages or scoring as zero.
4. Preserve Low/Medium confidence rules for evidence-bearing contexts, including the existing sufficient-evidence condition. No redesign of confidence calibration.
5. Age bands remain child=1-12, teen=13-17, young_adult=18-24, adult=25+. Unknown/missing retains 13-17 under the existing Cyberly age contract.
6. `schoolStage` exposes only mapped Form 1-5 labels from profile `education_level`; unsupported/missing values omit it. Learner level form references remain their separate existing mapping.
7. Focus context exposes at most one primary and two secondary topics; existing selection and safe generated reason behavior remain.
8. `currentRecommendation` contains only `topicCode`, `topicLabel`, `level`, `reasonCode`. Do not add free-form `reason_text`.
9. Provider-facing context excludes email, username/display name, raw assessment answers, raw scenario decisions, `selectedOptionKey`, prompt-private fields, and exact assessment/scenario/mastery percentages. Scoring formulas and hidden evidence weights remain internal.
10. No source/API response schema change, database migration, UI work, recommendation redesign, RAG change, or adaptive-learning redesign is required.

## Implementation boundary

Create this spec, the corresponding plan, and `server/scripts/test-ai-learner-context.js`. Modify only score absence handling in `server/src/ai/ai.learnerContext.js` and add `test:ai-learner-context` in `server/package.json`. Pin the existing no-evidence mock integration result to `learnerLevel=unknown` in `server/scripts/test-ai.js`; do not run that DB-dependent suite here.

Compatibility finding from final code review: `ai.learningActions.js` checks optional confidence with `!== 'Low'`, which treats null learner level as positive evidence and changes the generic no-evidence action from assessment to progress. Add a one-line Low fallback in that predicate, with a failing regression test first, to preserve existing assessment-first behavior. This does not redesign recommendation/action selection. The candidate therefore contains seven files rather than the six initially expected.

Use a small internal score normalizer to retain the absence sentinel through the average, weighted score, and final level mapper. Do not change the exported API or provider instruction assembly.

## Acceptance evidence

Pure-function tests must cover missing/invalid evidence, genuine zero, assessment-only and scenario-only scores, all level boundaries, combined sufficient evidence, age defaults, supported/unsupported school stages, focus bounds, and recommendation projection. Inject synthetic sensitive fields and distinctive exact numeric evidence throughout realistic input rows. Both serialized output and real provider instruction assembly must exclude their marker values and retain safe context fields.

Required offline commands (PowerShell uses `npm.cmd`):

- `npm.cmd --prefix server run test:ai-learner-context`
- `node server/scripts/test-ai-age-context.js`
- `npm.cmd --prefix server run test:learning-actions`
- `npm.cmd --prefix server run test:ai-provider-unit`
- `node --check` on each changed/new JS file
- `git diff --check`

Provider live calls remain OpenAI/Gemini/ILMU = 0/0/0. Existing provider unit tests use injected transports and fixture implementations; these are not live calls. Control Tower separately decides whether broader regression should run using its isolated DB. Manual browser verification is unnecessary for this backend-only candidate; UI behavior and live answer quality are not certified.
