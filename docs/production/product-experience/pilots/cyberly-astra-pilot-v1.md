# Cyberly Astra Pilot v1 — scope mirror

Recorded: 2026-09-25 (MYT). Decision: PILOT-DEC-001. Batch: PILOT-A01/A02.
Status: approved delivery direction; implementation and release acceptance remain evidence-gated.
**Production remains NOT CERTIFIED.**

## Authority and precedence

The canonical current plan is [G20Cybelry Plan / Astra Pilot v1](https://docs.google.com/document/d/1PdAASZCCkpM4-2WIsZMNDUp6mQWRzvT8AhTB8QllARg/edit?tab=t.qta335asc824); [prior status/history](https://docs.google.com/document/d/1PdAASZCCkpM4-2WIsZMNDUp6mQWRzvT8AhTB8QllARg/edit?tab=t.b0wwxcfbh91d) is preserved. This file mirrors the supplied `pilot-v1-scope-handoff.md`; it is not another master plan or a fresh read of the live Google Doc. The original attachment is the source of this sync. Current task instructions and `AGENTS.md` govern execution; source and tests determine implemented behavior, not planning prose.

For current delivery sequencing, this scoped pilot direction supersedes an automatic requirement to finish comprehensive S3 recommendation restructuring first. Demonstrated pilot blockers may warrant bounded fixes; historical findings and commitments remain recorded. The earlier CyberGuard-only pilot specification remains a domain reference, not an equivalent whole-product pilot plan. All current batch evidence and the next exact slice are in [the readiness report](cyberly-astra-pilot-v1-readiness.md).

## Identity lock and deployment distinction

- Expected and locally verified branch: `develop`; HEAD, local `master`, `origin/master`, `origin/develop`: `b9baed034bd8af02d3b6863fc85515f77869097a`. Initial staged, modified and untracked counts were zero. Live `git ls-remote --heads origin master develop` failed to connect; live remote equality is unverified, not drift established.
- Supplied frontend live baseline: `b9baed034bd8af02d3b6863fc85515f77869097a`, service `srv-d9tj5hu5djic73a0auk0`, deployment `dep-daql8cjktnus73b9k5rg`.
- Supplied backend live baseline: `fc4400bb7c21c0068fe8a1e38651546565379128`, service `srv-d9tiop942hec738b3org`, deployment `dep-dap4b9o0cd8s73bn0ud0`.
- Handoff reports Render workspace `tea-d9eet3d7vvec7392cegg`, backend Singapore/starter/one instance and AutoDeploy **OFF/OFF**. These are supplied facts, not fresh deployment checks. Do not claim both deployed services run local HEAD.
- Exact original Workbook SHA-256 independently verified: `5d5aec855a8a1548cd7393b564758c4c6e5789dee557edd3ad2cb0a6eb37e4ca`. A same-named repository workbook or live Sheet export is a different version until proven otherwise.

## Approved outcome and five deliverables

Upgrade the existing React/Express/MySQL Cyberly into an Astra v2.3-based controlled pilot for Malaysian teenagers aged 13–17, up to 100 registered users. Reuse the existing implementation and approved design family. Learners should understand a safe next step; this is not a separate demo or platform rewrite.

1. Carry Astra through Home; account/verification/recovery; Dashboard with integrated Progress; Resources; Scenario intro/player/confirmed feedback/result; Assessment and recovery; full/compact CyberGuard/history; Profile/Settings; exposed support, privacy and Guardian flows.
2. Maintain a complete exposed-function acceptance matrix and operations/capacity evidence. A broken or unverified exposed feature remains visible in the matrix; it is not excluded to improve a percentage.
3. Keep Assessment optional, contextual guidance short, Do later safe, non-AI learning accessible, and returning exact resume intact.
4. Verify EN/MS/ZH-CN explanation/follow-up quality, reviewed-source grounding, valid internal targets, conversation/confirmation contracts and truthful recovery. Never invent scores, sources, completion, provider results or recommendation authority.
5. Reconcile and author/review all 14 Resource and 7 Scenario candidates. The 28 FAQs and seven Safety Summaries support content/RAG; they do not create new public modules. Source rows are not ready articles or playable Scenario definitions.

## Dashboard approved amendment

Use one coherent Continue/Recommended area with manual horizontal switching. Continue is the initial family when unfinished work is confirmed. A learner may explicitly switch to a valid recommendation. Multiple unfinished activities remain equal choices with no default selected attempt.

There must be no standalone raw-text Resume block, auto-rotation, new ranking authority or exposed raw database/attempt IDs. Use verified title/progress/date metadata and a readable, stable disambiguation rule where titles repeat. Rendering, visibility, switching and focus must not mark viewed/completed, navigate or Start. Preserve exact-attempt adapters, lifecycle, guards, ownership stamps and uncertainty. Do not alter the frozen resolver API to achieve layout composition.

Compare Dashboard, Scenario and full/compact CyberGuard to the complete v2.3 package before propagating layout patterns. Direction is approved; the amendment's detailed visuals still need Owner review.

## Prospective acceptance targets, not measurements

| Area | Working target / unresolved definition |
|---|---|
| Capacity | <=100 registered, 30 active mixed-workload users, 10 simultaneous AI requests, documented 100-arrival burst, 60-minute soak. Define arrival interval, pacing, token sizes, routes, sessions, shared-IP distribution and warm/cold conditions. This is not a claim of 100 active concurrent learners or 100 generations. |
| Non-AI | p95 <=1.5 seconds; valid business success >=99%. Report expected denials, injected errors, intentional 429s and AI queue outcomes separately with explicit denominators. No data loss, duplicate scoring or leakage. |
| AI | 72 complete tests: 3 locales × 3 categories × 8. Suggested ordinary-case pass >=90%; zero severe safety/privacy failures. Define latency for the actual non-streaming/streaming mode, including queue/total latency and first token only if applicable. |
| Newcomer usability | At least 4 of 5 unfamiliar testers finish an agreed task in five minutes without coaching. |
| Browser | EN/MS/ZH-CN; desktop/tablet/390px/320px; keyboard, 200% zoom and reduced motion; real iPhone Safari and Android smoke. |
| Operations | Separate-target restore, rollback and monitoring/contact ownership, email delivery, quotas and RM budget gates. |

## Source intake and content guardrails

The exact Workbook contains eight sheets, 56 records (14 Resource / 7 Scenario / 28 FAQ / 7 Safety Summary), 69 relationships and 49 category rows (17 Existing / 4 Partial / 28 Missing). Original `content_code` and slug values have no internal duplicates; structured relationship endpoints resolve. Every inventory row says reviewed, but every `rag_ready` is `no`; this is not publication approval. All 28 FAQ source URLs are absent. The safety sheet contains three complete prompt/expected-behavior examples and one incomplete ID-only row, not 72 completed evaluations.

- **WB-01:** inventory `TOPIC-AI&TECHNOLOGY` differs from category `TOPIC-AI_TECH`.
- **WB-02:** SCN-SC-001 notes reference absent `RES-PH-001`; structured edges themselves resolve.
- **WB-03:** summaries and source links are not full Resource articles or runnable Scenario scripts.
- **WB-04:** source, rights, translation and human publication/RAG review remain required.

Do not replace four-domain scoring with seven content topics or L1–L6. Catalogue expansion can change progress denominators; report that impact without rewriting learner records. Source-only reconciliation must say **LIVE_DB_UNVERIFIED**, and must not call seed definitions live data.

## Work order and retained commitments

A. Scope/identity lock, exposed-function inventory, source reconciliation, three-page visual comparison and one exact UI slice.

B. Accepted Astra UI slices and 21-candidate authoring/review; operations metadata can proceed independently.

C. Integrated user guidance and bounded CyberGuard/recommendation correctness, followed by authorized AI evaluation.

D. Feature/browser/capacity/restore/operational acceptance; Owner Go; controlled 10 → 30 → <=100 rollout.

Preserve scoped closure of Phase 3, Astra I01/I02/I03-S1B, S1, S2A/B and minimal S2C exact-resume integration, Scenario guard destination fix, and S2 Orientation & Recovery. Do not reopen accepted Account, exact-resume, guard or recovery implementations without demonstrated pilot blockers. Handoff history reports 3 targeted suites/138 tests and a prior 109-suite/1086-test full run; neither is a fresh Batch 01 execution. Earlier Owner acceptance of Assessment status error/retry/no-Start/no-Resume/recovery is historical; live provider-failure browser behavior was not exercised for that earlier slice.

Gemini and ILMU remain previous requested commitments requiring explicit scope reconciliation, not silent cancellation or automatic activation. The historical October 3 target remains conditional; old schedules/freeze statements are not readiness evidence.

Excluded expansion: new reassessment, large CMS/Admin expansion, new Guardian role, Resource completion, all-49-subcategory production, new mastery/prerequisite systems and autonomous multi-agent product expansion. Existing exposed functions remain inventoried even where older documentation is narrower than source.

## Batch 01 execution boundary

Only this scope mirror, the single readiness report and an additive pointer in `docs/05-implementation-roadmap.md` may change in the repository. Evidence and actual screenshots stay in a reported external temporary directory. Original/private inputs are not committed.

No product source, tests, CSS, locales, config, dependencies or schema edits; no installs; no branch changes, add/commit/push/deploy; no DB writes/migrations/seeds/RAG ingestion, provider calls, email tests or load generation. Do not read environment/credential files, inspect live learner records, use Desktop Remote or assume authenticated staging GETs are read-only. Reuse installed isolated browser tooling and fixture data only. A narrowly scoped existing provider-free test is allowed solely to resolve a fact; a full suite is unnecessary for documentation.

Keep evidence labels separate: **SOURCE_VERIFIED**, **AUTOMATED_SOURCE** (test inspected), **AUTOMATED_EXECUTED** (command/result from this batch), **HISTORICAL_REPORTED**, **BROWSER_OBSERVED** (specific fixture/state only), **NOT_OBSERVED** and **LIVE_DB_UNVERIFIED**. Source/JSDOM checks never establish visual PASS. Stop at `PILOT-A02_OWNER_VISUAL_REVIEW_READY` only with sufficient actual visual evidence; otherwise record `PILOT-A02_VISUAL_EVIDENCE_PENDING` with exact missing evidence. Neither status certifies production.
