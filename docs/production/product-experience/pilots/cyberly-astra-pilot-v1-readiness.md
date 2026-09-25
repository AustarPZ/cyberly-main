# Cyberly Astra Pilot v1 — PILOT-A01/A02 readiness

Recorded: 2026-09-25 (MYT). Repository baseline: `develop` at `b9baed034bd8af02d3b6863fc85515f77869097a`.

**PILOT-A01 — COMPLETE (documentation sync). PILOT-A02-VIS1 — current visual evidence recovered for Owner review.**

**PILOT-A02_VISUAL_EVIDENCE = READY_FOR_OWNER_REVIEW. Production remains NOT CERTIFIED.**

VIS1 update, 2026-09-25 (MYT): all 12 requested EN current states captured at 1440×900 and 390×900, with ten existing Astra reference captures and two newly rendered inherited reference result states. The original Batch 01 source audit and failed-build history below are retained; their NOT_OBSERVED / pending statements describe that earlier evidence snapshot and are superseded only for the specific fixture views listed in section 9. No general feature, visual or release acceptance follows. **Dashboard Continue / Recommended unified area implementation = NOT STARTED.**

This is the single bounded readiness report for [the approved scope mirror](cyberly-astra-pilot-v1.md). It does not replace the [canonical Control Tower plan](https://docs.google.com/document/d/1PdAASZCCkpM4-2WIsZMNDUp6mQWRzvT8AhTB8QllARg/edit?tab=t.qta335asc824), redesign Cyberly, reopen accepted S2 work or make comprehensive S3 architecture a prerequisite. Package instructions were followed only within the user's explicit documentation/evidence authorization. The linked live Google Doc was not fetched; the supplied portable handoff is the content synchronized here.

## 1. Initial Batch 01 baseline, manifest and evidence ledger

| Check | Actual result |
|---|---|
| Initial branch / HEAD | `develop` / `b9baed034bd8af02d3b6863fc85515f77869097a`; matches request |
| Initial local master / origin master / origin develop | All match expected HEAD; these are local refs |
| Initial staged / tracked modifications / untracked | 0 / 0 / 0; no unrelated work found |
| Live remote read | `git ls-remote --heads origin master develop` failed to connect to github.com:443. **REMOTE_UNVERIFIED**; connection failure does not establish equality or missing branch |
| Input identity | ZIP extracted outside repository; Workbook SHA matches `5d5aec855a8a1548cd7393b564758c4c6e5789dee557edd3ad2cb0a6eb37e4ca`; supplied census independently compared with original cells |
| Scope equivalents | Existing `cyberguard-public-beta-pilot.md` is CyberGuard-specific, not an equivalent whole-product Astra pilot. No equivalent Astra pilot files found; no substitutions |
| Hosted identity | Handoff frontend `b9baed0` / `dep-daql8cjktnus73b9k5rg`; backend `fc4400bb7c21c0068fe8a1e38651546565379128` / `dep-dap4b9o0cd8s73bn0ud0`; OFF/OFF supplied, not rechecked |
| Current build provenance | 123 mapped local JS/CSS sources match current files (line-ending normalization); existing build hashes recorded. This is artifact/source correlation, not a fresh build or proof of deployed configuration |
| Current browser attempt | Isolated existing build fails before rendering: `REACT_APP_API_BASE_URL must be a valid HTTPS API origin in production.` No API requests. No source/config patch or rebuild performed |

Exact repository output manifest:

1. ADD `docs/production/product-experience/pilots/cyberly-astra-pilot-v1.md` — scope mirror.
2. ADD `docs/production/product-experience/pilots/cyberly-astra-pilot-v1-readiness.md` — this report.
3. MODIFY `docs/05-implementation-roadmap.md` — dated additive pointer/precedence only; original history preserved.

External evidence directory, abbreviated **E** below:

`C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/pilot-a01-a02/`

| Evidence artifact under E | What it proves / limits |
|---|---|
| `Cyberly_Astra_Pilot_v1_Batch01/` | Extracted exact input package; no Workbook copied into repo |
| `input-integrity.json` | Package manifest checks and standalone prompt equality; input checksums |
| `tracked-hashes-before.json`, `head-before.txt`, `baseline-verification.json` | Initial tracked-file hash snapshot and Git facts; environment/credential paths excluded from file-content hashing |
| `workbook-reconciliation-checks.json`, `reconcile_workbook.py` | Independent XLSX/census comparison and reproducible read-only extraction; includes source rows, not learner rows |
| `feature-inventory.md`, `workbook-reconciliation.md`, `operations-gaps.md` | Supporting audit notes incorporated below; not separate controlling plans |
| `build-reference-checks.json` | 123 mapped source matches and 51 v2.3 manifest file hashes (36 proofs + 15 package assets), zero mismatches |
| `capture-isolated.cjs`, `browser-results.json`, `capture-error.txt`, `diagnostic-body.txt`, `1440-diagnostic.png` | Real failed browser attempt using installed Playwright and existing synthetic fixtures. Diagnostic PNG is a blank startup-failure capture, **not** a Dashboard/Scenario/CyberGuard screenshot or visual PASS |
| `verification-final.json` | Final Git/hash/manifest/whitespace checks, including new untracked docs |

Evidence vocabulary: **SOURCE_VERIFIED** = inspected code; **AUTOMATED_SOURCE** = test source inspected/identified, not run; **AUTOMATED_EXECUTED** = a recorded executed check; **HISTORICAL_REPORTED** = previous result supplied by docs/handoff; **REFERENCE_VISUAL_INSPECTED** = actual prior prototype PNG opened in this batch; **BROWSER_OBSERVED** = current rendered fixture state captured; **NOT_OBSERVED** = no current page observation. All live catalogue claims remain **LIVE_DB_UNVERIFIED**. A reference image, test name containing “visual”, or JSDOM assertion does not count as current-page visual evidence.

## 2. Complete exposed-function inventory

47 grouped records cover 37 learner/public/shared functions and 10 existing Admin functions. Grouped rows enumerate actions and subflows; they are not 47 atomic controls or a completion percentage. At the original Batch 01 snapshot, every row was browser **NOT_OBSERVED** because the then-available build failed before rendering. VIS1 adds narrowly scoped fixture observations in section 9; unexercised actions/errors/locales retain NOT_OBSERVED. No feature is dropped to improve the result.

### Shared evidence / boundaries

- **UI-P** public route list `client/src/App.jsx:2445`; **UI-A** authenticated page list `client/src/App.jsx:2446`; route/session recovery and direct-hash guards `client/src/App.jsx:10869`, `:10909`; actual component map `:11432`. Verification routes are separately admitted at `:2447`. This is hash routing: registration is a mode of `#/login`, not a separate register page. Settings is a Profile alias in `client/src/navigation/AccountMenu.jsx:15`. There is no exposed independent Help route in the map; `AppFooter` supports an optional help link (`client/src/navigation/AppFooter.jsx:15`), but its actual caller provides no helpHref (`client/src/App.jsx:10691`).
- **API-A** `server/src/auth/middleware.js:3` requires session userId; this alone is not a complete ownership assessment. Routers pass the session user ID into services. API errors propagate through `server/src/errors/applicationError.middleware.js`; client common transport is `client/src/api/apiClient.js`.
- **API-V** generation has both auth and verified-email checks (`server/src/ai/ai.routes.js:8`), actually injected in `server/server.js:252`. Guardian invite/resend verified-email guard is injected at `server/server.js:244`.
- **API-ADM** current DB user role/account status is checked by `server/src/admin/admin.middleware.js:3`; absent/inactive user returns 401, non-admin 403. All listed Admin routes apply that middleware (`server/src/admin/admin.routes.js:482`). UI role boundary: `client/src/App.jsx:9595`, `:9623`.
- **TEST-AUTH** `client/src/auth/AuthLifecycle.test.jsx:171` login validation/navigation; `:186` seven-step payloads; `:238` profile-only retry after registration. `client/src/auth/PasswordResetFlow.test.jsx:65` recovery links, `:100` token capture/URL clean, `:126` identity clear, `:150` policy retry. `client/src/auth/EmailChangeFlow.test.jsx:84`, `:176`, `:207`, `:227` readonly email, confirmation once, fail-closed refresh, unrelated session preservation. Additional backend sources: `server/scripts/test-auth.js`, `test-password-reset-auth.js`, `test-email-verification-auth.js`, `test-email-change-request.js`, `test-email-change-confirm.js` (not executed).
- **TEST-DASH** `client/src/dashboard/DashboardIntegratedProgress.test.jsx:105` one response owner, `:112` failure not zero, `:139` independent failures, `:161` server-confirmed completion, `:181` exact recommendation, `:230` failed completion retry; `client/src/dashboard/DashboardExactResumeProducer.test.jsx`; `client/src/progress/ProgressCompatibility.test.jsx`; `server/scripts/test-progress.js`.
- **TEST-RES** `client/src/resources/ResourceReaderPage.test.jsx:13` detail/focus/source/practice; `:47` unavailable/malformed; `:58` network/server retry; `:68` stale slug/locale. `client/src/resources/ResourcesPilot.test.jsx`, `ResourceScenarioHandoff.test.jsx`; `server/scripts/test-resource.js`, `test-resource-scenario-contract.js`.
- **TEST-ASMT** `client/src/assessment/AssessmentExactResume.test.jsx:55` exact GET saved answers, `:108` exact retry, `:164` guard, `:263` logout hiding, `:317` explicit save/submit; `AssessmentFinalVisualPilot.test.jsx`; backend `server/scripts/test-assessment.js:166`, `:208` includes unauthenticated/foreign-ID response assertions.
- **TEST-SCN** `client/src/scenario/ScenarioExactResume.test.jsx:51` exact resume independent of published library, `:93` network retry same GET, `:108` guard, `:287` feedback locale preservation, `:301` completion refresh; `ScenarioFinalVisualPilot.test.jsx`; `server/scripts/test-scenario.js` and `test-scenario-continuation-contract.js`.
- **TEST-CHAT** `client/src/cyberguard/CyberGuardPilot.test.jsx:292` log; `:455` sources/actions/proposal; `:635` drawer focus; `:654` quick prompts; `:760` local pin; `:922` local archive. Additional sources `client/src/cyberguard/CyberGuardEmailVerification.test.jsx`, `client/src/chat/chatExport.test.js`, `chatActions.test.js`, `chatApi.test.js`, `client/src/api/agentApi.test.js`. Backend `server/scripts/test-chat.js:159`, `:236`, `:352` auth/foreign IDs; `server/scripts/test-learner-controlled-actions.js:238`, `:241`, `:280`, `:349` authorization/not-found/confirmation boundaries.
- **TEST-PRIV** `client/src/privacy/PrivacyRequestPage.test.jsx:45` validation, `:55` deletion password clearing, `:97` cancel, `:197` idempotency, `:244` no immediate deletion claim, `:255` safe auth/rate errors; backend `server/scripts/test-privacy-requests.js`.
- **TEST-GUARD** `client/src/guardian/GuardianLinkSection.test.jsx:26` invite/empty/password clearing, `:62` unverified resend, `:86` failed delivery refresh, `:96` revoke focus, `:122` successful revoke; `GuardianLinkVerifyPage.test.jsx`; backend `server/scripts/test-guardian-links.js`.
- **TEST-ADM** `client/src/admin/adminRouteState.test.js`, `AdminResourceActions.test.js`, `AdminResourceLifecycleDialog.test.js`, `AdminScenarioPage.test.jsx`, `AdminScenarioEditorPage.test.jsx:104` validation, `:112` duplicate slug retention, `:147` create redirect, `:237` translation save, `:316` lifecycle dirty blocking, `AdminAiProvidersPage.test.jsx`. Backend sources `server/scripts/test-admin-resource-governance.js`, `test-admin-resource-content.js`, `test-admin-resource-create-metadata.js`, `test-admin-resource-lifecycle.js`, `test-admin-scenario-management.js`, `test-admin-ai-providers.js`, `test-agentic-traces.js`.

**Pilot inclusion / gap notation applied per row:** `IN` = exposed function retained in pilot inventory, not acceptance or deployment certification; `OPS` = exposed administrator operation retained for pilot readiness, access restricted to authorized staff, not silently excluded. `G1/P1` = actual browser and deployed integration outcome unobserved, must verify before claiming working. `G2/P2` = source-only navigation/presentation, browser accessibility/responsive/locale observation outstanding. `G3/P1` = scope/authority clarification needed in addition to G1; current runtime exposes more than older governance-only guidance. Priority is verification/decision priority, not an assertion of a defect. Specific static limitations are explicitly identified, not described as runtime bugs.

### Exposed route/action records

| ID | Feature / route and preserved actions | Source owner | Success; error / empty / retry behavior from code | UI + API boundary | Existing automated source | Inclusion; remaining gap / priority |
|---|---|---|---|---|---|---|
| F01 | Home `#/home`: primary start/continue CTA, resource/category CTA | `client/src/App.jsx:5683`, `:5738`, `:5795` | CTA varies by session/onboarding; topics lead to Resources. Static home has no fetch empty/retry. | UI-P; target gates apply; no Home API | `client/src/home/HomeFinalVisualPilot.test.jsx` | IN; G2/P2 |
| F02 | Global navigation/back/account menu; mobile menus; EN/MS/ZH language selection | `client/src/App.jsx:10497`, `:10651`; `client/src/navigation/GlobalNavigation.jsx`; `AccountMenu.jsx:15` | Navigation follows guarded route; account dropdown focuses items; language selector changes app language. Active activity leave/cancel preserves or commits target. | Public/auth navigation differs; protected direct hashes handled by UI-A; APIs retain individual auth | `client/src/navigation/GlobalNavigation.test.jsx`, `navigationGuardState.test.js`, `AppShellLandmarks.test.jsx`, `client/src/i18n/languageAuthority.test.js` | IN; G2/P2 |
| F03 | Login `#/login`: email/password, registration switch, password/email recovery links | `client/src/App.jsx:5176`, `:5207`, `:5382` | Validates fields; successful login updates canonical user and continuation; safe error and editable retry form. | UI-P; POST `/api/auth/login` rate limited `server/server.js:464` | TEST-AUTH | IN; G1/P1 |
| F04 | Registration in Login: credentials, nickname, education, language, familiarity, topics, learning style; previous/next/submit | `client/src/App.jsx:4745`, `:4785`, `:4925` | Seven steps validate; creates account then profile; partial profile failure supports profile-only retry without another account create. | UI-P; register `server/server.js:415`; profile PUT API-A `server/src/profile/profile.routes.js:16` | TEST-AUTH | IN; G1/P1 |
| F05 | Forgot password/email `#/forgot-password`: submit address, return to login | `client/src/App.jsx:5431`, `:5437` | Generic accepted response; malformed address blocked; policy/rate/network error state allows retry. | UI-P; public rate-limited POST `server/server.js:517` | TEST-AUTH | IN; G1/P1; delivery not tested |
| F06 | Reset password `#/reset-password`: password+confirmation, submit/recovery return | `client/src/App.jsx:5499`, `:5506` | In-memory token; validates matching policy; success clears identity; invalid/expired token state and recoverable form errors distinguished. | UI-P; token authority POST `server/server.js:545` | TEST-AUTH | IN; G1/P1 |
| F07 | Verify email `#/verify-email`; global resend/check-again reminder | `client/src/App.jsx:9100`, `:8971`, `:9026`, `:9062` | Verification result offers login or Dashboard/CyberGuard; resend has cooldown; refresh canonical account; errors represented. | Verification token public POST `server/server.js:620`; resend API-A `:715`; UI logged-in reminder | TEST-AUTH; `CyberGuardEmailVerification.test.jsx` | IN; G1/P1; actual email transport unobserved |
| F08 | Logout: request, cancel, confirm; active-learning guard | `client/src/App.jsx:10595`, `:11130`; `AccountMenu.jsx:15` | Confirmation; clears local private activity/auth scope and navigates home; guards integrate with activity leave. | Authenticated UI; logout POST `server/server.js:811` clears session (no requireAuth) | `client/src/navigation/guardedLogout.test.jsx`; TEST-ASMT/SCN logout assertions | IN; G1/P1 |
| F09 | Dashboard `#/dashboard`: overview, journey, progress topics, recent activity, section navigation, assessment/scenario shortcuts | `client/src/App.jsx:5871`, `:5887`, `:6233`; `client/src/progress/ProgressDetails.jsx:6` | Separate loading/error/empty states for progress, recommendation, scenario summary, assessment; retry reload; zero preserved as genuine zero. | UI-A; `/api/progress`, recommendation, assessment status, scenario dashboard API-A in respective route files | TEST-DASH | IN; G1/P1 |
| F10 | Dashboard Continue: exact unfinished Assessment/Scenario choice and recovery | `client/src/dashboard/DashboardResumeSurface.jsx`; `client/src/App.jsx:11239`, `:11254` | Produces exact handoff with guard; navigation/render does not itself start attempt; resume loader owns uncertainty/retry. | UI-A; exact attempt GET API-A; scope identity checks | `client/src/dashboard/DashboardExactResumeProducer.test.jsx`; TEST-ASMT/SCN | IN; G1/P1; accepted exact-resume not reopened |
| F11 | Dashboard recommendation follow / explicitly mark complete | `client/src/App.jsx:6035`, `:6079`, `:6252`, `:6263` | Follow resolves target; completion success refreshes progress only after server acknowledgment; failed completion preserves state and repeat action. | UI-A; viewed/completed POSTs API-A `server/src/progress/progress.routes.js:32`, `:40` | TEST-DASH | IN; G1/P1 |
| F12 | Progress `#/progress` compatibility entry and section targets | `client/src/App.jsx:8949`, `:11280`; `client/src/progress/ProgressDetails.jsx:6` | Redirects into Dashboard progress section; no independent Progress page render; activity/topic empty copy in details. | UI-A; Dashboard data API-A | `client/src/progress/ProgressCompatibility.test.jsx`; TEST-DASH | IN; G2/P2; report alias accurately |
| F13 | Resources `#/resources`: list, category filtering, recommendation focus/show-all, card open | `client/src/App.jsx:6755`, `:6803`, `:6846` | Published list rendered; loading/error/empty distinct. Error view currently has no dedicated retry control; re-entry/locale reload can rerun effect. | UI-P; GET list public `server/src/resource/resource.routes.js:7` | TEST-RES | IN; G1/P1; assess recovery usability, not claimed broken |
| F14 | Resource detail `#/resources/:slug`: read paragraphs, attribution, external source, back, practice handoff | `client/src/resources/ResourceReaderPage.jsx:16`, `:29`, `:45`, `:58` | Success full article; 404/malformed unavailable; network/server retry same slug+locale; stale results ignored; source URL restricted HTTP(S). No learner mark-read/review mutation exposed. | UI-P; GET detail public `server/src/resource/resource.routes.js:15`; practice target protected | TEST-RES | IN; G1/P1 |
| F15 | Scenario library `#/scenarios`: topic/difficulty filter, recommendation highlight, intro/start, resume, result | `client/src/App.jsx:7480`, `:7623`, `:7998`, `:8049` | Loads library/recommendations; empty/loading/errors; selection opens requested intro or latest saved attempt/result. | UI-A; GET scenarios/recommended/dashboard API-A `server/src/scenario/scenario.routes.js:8`, `:16`, `:24` | TEST-SCN | IN; G1/P1 |
| F16 | Scenario introduction `#/scenarios/:slug`: direct resource handoff, back, explicit Start practice | `client/src/App.jsx:7664`, `:7811`, `:7821`, `:8066` | Reads intro before explicit attempt start; unavailable target and retry; guest continuation login remembered; start failure remains error. | UI-A; GET slug / POST attempts API-A `server/src/scenario/scenario.routes.js:32`, `:40` | TEST-SCN; TEST-RES handoff | IN; G1/P1 |
| F17 | Scenario player: choose, confirm decision, feedback, next | `client/src/App.jsx:7846`, `:7862`, `:8091` | Choice only local until confirmation; saved result locks choice and renders feedback; next advances; save failure preserves error and resubmittable choice. | UI-A; decisions PUT API-A `server/src/scenario/scenario.routes.js:56` | TEST-SCN | IN; G1/P1 |
| F18 | Scenario completion/result: complete, result summary, library/Dashboard/Progress return | `client/src/App.jsx:7897`, `:7916`, `:8153` | Completes explicit action, refreshes library, shows returned result; API failure keeps error; result GET independently available. | UI-A; complete/result API-A `server/src/scenario/scenario.routes.js:64`, `:72` | TEST-SCN | IN; G1/P1 |
| F19 | Scenario exact resume/recovery, exit/cancel/confirm, locale fallback | `client/src/App.jsx:7556`, `:7925`, `:7946`, `:8201` | Exact attempt authority, NETWORK_ERROR-only exact retry; leave restores library; active exit uses common guard; locale refresh respects feedback. | UI-A; exact GET API-A `server/src/scenario/scenario.routes.js:48` | TEST-SCN | IN; G1/P1 |
| F20 | Assessment `#/assessment`: intro/start/do-later, ordinary resume/status/result | `client/src/App.jsx:7064`, `:7159`, `:7255`, `:7447` | Loads status/content/result; explicit start; loading/unavailable retry; already completed response routes to result. | UI-A; initial GET/status/result/start API-A `server/src/assessment/assessment.routes.js:8`, `:16`, `:24`, `:32` | TEST-ASMT | IN; G1/P1 |
| F21 | Assessment questions: select/save answer, previous/next, submit confirmation/cancel | `client/src/App.jsx:7180`, `:7201`, `:7210`, `:7291` | Optimistic answer with failure rollback; all answers required; explicit confirmed submit; error preserves attempt for retry. | UI-A; answer PUT / submit POST API-A `server/src/assessment/assessment.routes.js:48`, `:56` | TEST-ASMT | IN; G1/P1 |
| F22 | Assessment result/back; exact-resume recovery/retry/leave | `client/src/App.jsx:7345`, `:7439`; `client/src/assessment/useAssessmentExactResume.js` | Result Dashboard/Progress links; isolated exact loader refuses substituted latest attempt; recovery retry where eligible; leave restores ordinary route. | UI-A; exact GET API-A `server/src/assessment/assessment.routes.js:40` | TEST-ASMT | IN; G1/P1 |
| F23 | Dashboard CyberGuard compact launcher/history entry | `client/src/App.jsx:6690`, `:6698`, `:6095` | Nonempty submission starts backend conversation then opens full chat; status disables double send; failed creation retains launcher error. | UI-A; UI verified-email gate; conversation POST API-A; generation API-V | TEST-CHAT; `client/src/dashboard/DashboardFinalVisualPilot.test.jsx` | IN; G1/P1 |
| F24 | Floating CyberGuard: open/close, expand full page, guest sign-in | `client/src/App.jsx:10423`, `:10451`, `:10472` | Guest CTA; signed-in shared message log/composer; expand uses same chat state; close local only. | Public shell widget, authenticated interaction; generation API-V | TEST-CHAT | IN; G1/P1 |
| F25 | Full CyberGuard `#/ai-chat`: compose/send, quick prompt draft, new conversation | `client/src/App.jsx:9705`, `:6578`, `:3637`, `:3751`, `:9925` | New Chat clears local active state; first nonempty send creates conversation; quick prompt fills draft only; generation/sending locks duplicate interaction; mutation failures visible. | UI-A and verified-email composition lock; chat API-A `server/src/chat/chat.routes.js:15`, `:47`; generation API-V | TEST-CHAT | IN; G1/P1 |
| F26 | Chat generation/recovery: response, retry, polling, migration notice, alternatives | `client/src/App.jsx:3535`, `:3803`, `:6390`, `:6549` | Safe failure codes; retry only retryable generation; existing user message reused; message detail retry; alternatives Resources/Scenarios; persisted history restored. | UI-A; API-V generation; API-A detail GET `server/src/chat/chat.routes.js:23` | TEST-CHAT; `server/scripts/test-ai.js`, `test-ai-provider-unit.js` | IN; G1/P1; provider reliability not measured |
| F27 | History: list/select, search/clear, recency groups/collapse, sidebar/mobile drawer, archived tab | `client/src/App.jsx:3316`, `:3698`, `:9835`, `:9874`, `:10006` | Load/detail retry; empty histories/search matches handled; local title filtering and grouping; drawer close/Escape restores focus. | UI-A; list/detail API-A `server/src/chat/chat.routes.js:7`, `:23` | TEST-CHAT | IN; G1/P1 |
| F28 | History rename/save/cancel; pin/unpin; archive/unarchive | `client/src/App.jsx:3707`, `:9417`, `:9889`, `:9902` | Rename validated and PATCH persisted with mutation error; pin/archive local per-user storage, no server archive endpoint; unarchive returns Chats. | UI-A; rename API-A `server/src/chat/chat.routes.js:31`; pin/archive local only | TEST-CHAT; `client/src/chat/chatPinning.test.js`, `chatArchiving.test.js` | IN; G1/P1; explain device-local scope |
| F29 | Chat export Markdown/text confirmation/cancel; delete confirmation/cancel | `client/src/App.jsx:9933`, `:9939`, `:9957`, `:9974` | Export current loaded messages to download; empty export disabled; caught export errors; successful delete removes chat and local pins/archive; failed delete dialog remains. | UI-A; export local; delete API-A `server/src/chat/chat.routes.js:39` | TEST-CHAT; `client/src/chat/chatExport.test.js` | IN; G1/P1 |
| F30 | Chat citations expand/collapse, bounded learning actions, action review/confirm/cancel/dismiss | `client/src/App.jsx:2941`, `:3025`, `:3179`, `:3219`, `:11280` | Sources rendered separately; action review creates proposal; confirm consumes token and only validated result target navigates; expired/cancelled/failed visible, failure dismiss. | UI-A; proposal/create/confirm/cancel API-A+rate limits `server/src/agent/actions/actionProposal.routes.js:10`, `:18`, `:26` | TEST-CHAT; `server/scripts/test-learning-actions.js`, `test-learner-controlled-actions.js` | IN; G1/P1; document actual confirmed flow rather than older blanket read-only description |
| F31 | Profile/Settings `#/profile`: account details save, learner nickname/preferences/topics/avatar, language save | `client/src/App.jsx:8251`, `:8402`, `:8429`, `:8482` | Loads existing profile/account; validates changes; save success feedback and errors; profile onboarding completion; canonical email readonly; save retry explicit. | UI-A; account GET/PUT API-A `server/src/account/account.routes.js:9`, `:22`; profile GET/PUT API-A `server/src/profile/profile.routes.js:7`, `:16` | `client/src/profile/ProfileFinalVisualPilot.test.jsx`, `avatarModel.test.js`; `server/scripts/test-account.js`, `test-profile.js` | IN; G1/P1 |
| F32 | Account email change request, cancel, public confirmation `#/verify-email-change` | `client/src/App.jsx:8517`, `:8529`, `:5591`, `:5657` | Request requires new email/current password; accepted request does not replace canonical email; confirmation refresh/clear/preserve session by server result; generic-error retry. | Request UI-A/API-A `server/server.js:759`; public token confirm `:779` | TEST-AUTH | IN; G1/P1; transport unobserved |
| F33 | About `#/about`, Privacy Notice `#/privacy`, footer links; Help route census | `client/src/App.jsx:6913`, `:10691`; `client/src/privacy/PrivacyNoticePage.jsx`; `client/src/navigation/AppFooter.jsx:15` | Static info and privacy links; no independent help destination supplied by actual footer. No remote load or empty/retry state. | UI-P; no dedicated page API | `client/src/about/AboutFinalVisualPilot.test.jsx`, `client/src/privacy/PrivacyNotice.test.jsx`, `client/src/navigation/privacyRequestRoute.test.jsx` | IN for actual About/Privacy; Help standalone NOT_EXPOSED, scope clarification P2, not a function exclusion |
| F34 | Privacy requests `#/privacy-requests`: list, correction/deletion draft, subtype/category/detail, submit/cancel | `client/src/privacy/PrivacyRequestPage.jsx:37`, `:56`, `:110`, `:137` | Empty list; load retry; detail validation, deletion password; success receipt; duplicate links existing; idempotency/rate/auth errors mapped. Request does not claim immediate deletion. | UI-A; list/POST API-A+rate limits `server/src/privacy/privacyRequest.routes.js:10`, `:17` | TEST-PRIV | IN; G1/P1 |
| F35 | Privacy request detail, withdraw review/confirm/cancel, back/list/open duplicate | `client/src/privacy/PrivacyRequestPage.jsx:192`, `:214`, `:259` | Detail/not-found/error; cancellability server-driven; withdrawal success synchronizes state; not-cancellable refresh removes stale authority; errors retain safe recovery. | UI-A; detail/cancel API-A `server/src/privacy/privacyRequest.routes.js:23`, `:29` | TEST-PRIV | IN; G1/P1 |
| F36 | Guardian section in Profile: read, invite/new invitation, resend, revoke confirmation/password/cancel | `client/src/guardian/GuardianLinkSection.jsx:16`, `:38`, `:71`, `:91`, `:104` | Empty/current/terminal relationship; transient passwords cleared; delivery failure refresh; safe operation errors; availability determined by relationship flags. | UI-A; read/revoke API-A; invite/resend API-V `server/src/guardian/guardianLink.routes.js:26`, `:29`, `:38`, `:46` | TEST-GUARD | IN; G1/P1 |
| F37 | Guardian public `#/guardian-link/verify`: inspect, accept, decline, retry | `client/src/guardian/GuardianLinkVerifyPage.jsx:19`, `:35`, `:58` | Token held transiently; missing/invalid/expired state; transient retry retains token; success clears token and shows accepted/declined; no learner dashboard granted. | UI-P; token authority, rate limits public endpoints `server/src/guardian/guardianLink.routes.js:16`, `:19`, `:22` | TEST-GUARD; `client/src/navigation/guardianLinkRoute.test.jsx` | IN; G1/P1 |
| F38 | Admin root/status/nav `#/admin` → `#/admin/resources`; invalid route recovery | `client/src/App.jsx:9569`, `:9595`, `:9647`; `client/src/admin/adminRouteState.js:23` | Auth/role deny; status loading/error; canonical root replace; unknown admin path recover to resources. | UI role admin; API-ADM status `server/src/admin/admin.routes.js:487` | TEST-ADM | OPS; G3/P1 |
| F39 | Admin resource list/filter/clear/quick review drawer; governance save/reset | `client/src/admin/AdminResourcePage.jsx:64`, `:108`, `:178`, `:412` | List/detail errors; empty filter state; review drawer updates governance with saving/message/error; reset draft; close. | UI admin; API-ADM list `server/src/admin/admin.routes.js:1135`, detail `:1238`, governance PATCH `:1612` | TEST-ADM | OPS; G3/P1 |
| F40 | Admin new resource `#/admin/resources/new`: content/source/metadata, reset, create draft | `client/src/admin/AdminResourceCreatePage.jsx:65`, `:128`, `:135` | Form validation, preserved values on failure, draft creation and navigation; guarded unsaved state. | UI admin; API-ADM POST `server/src/admin/admin.routes.js:1104`, options `:1095` | TEST-ADM | OPS; G3/P1 |
| F41 | Resource editor `#/admin/resources/:id/edit`: locale, content/source, save, preview, publish, return draft | `client/src/admin/AdminResourceEditorPage.jsx:96`, `:161`, `:210`, `:221` | Content validation; stale save error has reload; saved state; publish/unpublish errors; guarded dirty navigation. | UI admin; API-ADM content GET/PATCH `server/src/admin/admin.routes.js:1491`, `:1554`; publish/unpublish `:1271`, `:1314` | TEST-ADM | OPS; G3/P1 |
| F42 | Resource metadata `#/admin/resources/:id/metadata`: edit/reset/save | `client/src/admin/AdminResourceMetadataPage.jsx:44`, `:110`, `:115` | Loaded metadata form; dirty controls; success/error; return list on load error. This is an editor in inspected runtime. | UI admin; API-ADM GET/PATCH `server/src/admin/admin.routes.js:1509`, `:1523` | TEST-ADM | OPS; G3/P1 |
| F43 | Admin resource lifecycle dialog: inspect/retry, archive, restore, permanent delete/cancel | `client/src/admin/AdminResourceLifecycleDialog.jsx:112`, `:127`, `:141`, `:155` | Loads eligibility; explicit allowed operations; disabled invalid delete; mutation errors retained; cancel/focus restoration. | UI admin; API-ADM lifecycle `server/src/admin/admin.routes.js:1257`, archive `:1354`, restore `:1396`, delete `:1438` | TEST-ADM | OPS; G3/P1; destructive operation not exercised |
| F44 | Admin scenarios `#/admin/scenarios`: filters/clear, quick review/detail, create/edit links | `client/src/admin/AdminScenarioPage.jsx:38`, `:64`, `:127`, `:173` | List loading/error/retry/empty; detail error; drawer close; explicit editor navigation. | UI admin; API-ADM options/list/detail `server/src/admin/admin.routes.js:622`, `:635`, `:783` | TEST-ADM | OPS; G3/P1 |
| F45 | Admin scenario new/edit `#/admin/scenarios/new`, `#/admin/scenarios/:id/edit`: metadata, steps/options/branching, translations, preview, save/create/publish/draft | `client/src/admin/AdminScenarioEditorPage.jsx:278`, `:378`, `:417`, `:435`, `:458`, `:474`, `:485`, `:783` | Inline validation; failed save retains draft; structural-save confirmation and attempted-scenario restriction; dirty guard; locale translations; preview previous/next; publish errors visible. | UI admin; API-ADM POST `server/src/admin/admin.routes.js:743`, metadata `:858`, steps `:903`, translations `:943`, publish/unpublish `:974`, `:1010` | TEST-ADM | OPS; G3/P1 |
| F46 | Admin scenario lifecycle: retry, archive, restore, permanent delete/cancel | `client/src/admin/AdminScenarioLifecycleDialog.jsx:75`, `:125`, `:142`, `:159` | Eligibility load/retry; explicit state-dependent action; errors remain; dirty editor blocks execution; close restores focus. | UI admin; API-ADM lifecycle `server/src/admin/admin.routes.js:797`, delete `:811`, archive/restore `:1041`, `:1068` | TEST-ADM | OPS; G3/P1; destructive operation not exercised |
| F47 | Admin AI/provider/agentic `#/admin/ai-agentic`: provider status/test, trace filters/refresh/pagination/detail/close | `client/src/admin/AdminAiProvidersPage.jsx:501`, `:534`, `:634`, `:730` | Safe provider success/failure result; trace loading/error/empty; pagination/detail errors; provider test explicit and potentially external. | UI admin; API-ADM providers/test/traces `server/src/admin/admin.routes.js:496`, `:507`, `:524`, `:546` | TEST-ADM | OPS; G3/P1; no provider execution; retain Gemini/ILMU scope decision separately |

### Counts and limits

- **47 grouped feature/action records:** 37 learner/public/shared records and 10 existing administrator records. Each grouped row explicitly lists its component actions; this is not a claim of 47 atomic controls or 47 distinct pages.
- **18 root component-map keys** at `App.jsx:11432` plus resource/scenario nested detail routes, public guardian hash normalization, and Admin subroutes. Progress is a compatibility entry; registration is a Login mode; Settings shares Profile. Standalone Help is not in the actual route map.
- **47/47 browser NOT_OBSERVED**, **0 test commands executed**, **0 runtime success claims**, **0 functions excluded to improve readiness**. Every row has source ownership, success/recovery observations, UI/API auth boundary, automated source references, inclusion classification and remaining verification priority.
- Runtime Admin editing/lifecycle/publication and learner-confirmed action code are materially broader than older governance-only/read-only language in AGENTS. That is a documentation/scope reconciliation issue; this audit neither authorizes mutations nor declares code broken.
- Tests are source evidence, not coverage certification: shared keys point to directly inspected relevant test cases plus named additional suites. We did not audit every assertion, simulate every error, or establish complete security coverage. Role/session middleware presence is not proof of every service authorization boundary.
- Resource list lacks an explicit error Retry button in the inspected JSX, unlike detail. Guardian section load error is displayed without an explicit load Retry button. These are source-level recovery differences needing pilot usability assessment, not observed failures.
- Deployed baselines differ (frontend b9baed0 vs backend fc4400bb7c21c0068fe8a1e38651546565379128 per supplied package); repository presence must not be equated with joint live implementation.

### F30 action-level clarification (same grouped record)

`server/src/agent/actions/actionPolicy.js:1` enables exactly five proposal types: `open_resource`, `open_scenario`, `open_recommendation`, `mark_recommendation_viewed`, `mark_recommendation_completed`. The latter two are explicitly confirmed learner writes to recommendation status only, with 180-second proposal expiry (`server/src/agent/actions/actionCatalogue.js:239`, `:282`); inspected handlers use owned recommendation lookup and restricted status updates. They are not score/mastery/progress writes. `server/src/agent/actions/actionProposal.service.js:36` also requires learner role `user`; ownership and confirmation validation appear at `:92`, `:199`. Target missing/foreign/stale state yields bounded 403/404/409/410 errors; UI renders expired/failure or cancelled outcomes. Policy explicitly defers preference updates and prohibits scenario auto-start/restore, decision submit, assessment completion, arbitrary SQL, secrets and safety bypass (`actionPolicy.js:9`, `:13`). This is a narrow source finding, not permission to exercise those writes. F30 retains IN/G1/P1 with browser NOT_OBSERVED and TEST-CHAT evidence.

Additional inspected chat assertions: `client/src/cyberguard/CyberGuardPilot.test.jsx:2303` search/clear, `:2325` no-result versus empty history, `:2440` prompt draft without send, `:2504` duplicate send prevention, `:2563` Markdown export, `:2612` plain text, `:2633` export focus trap, `:2661` disabled empty export, `:2678` active-chat-only export. These remain unexecuted.

## 3. Astra v2.3 reference and initial Batch 01 three-page comparison

Historical source/reference comparison follows. See section 9 for VIS1 current captures and the recovered inherited result reference; the original failure is not the current visual-evidence status.

Reference directory, abbreviated **R**:

`C:/Users/AsusT/.codex/visualizations/2026/09/06/01a075a2-de48-7400-818a-9d123bb43426/v23-review/`

Found and read `manifest.json`, `index.html`, `CYBERLY-ASTRA-REDESIGN-DIRECTION-v2.3.md` and `ABOUT-PROVENANCE.md`. Loaded assets in actual index order: `style.css`, `refinements.css`, `v22.css`, `v23.css`; `content.js`, `app.js`, `refinements.js`, `v22.js`, `v23.js`. Thus inherited Dashboard, full chat and result definitions were considered, not just `v23.js`. Manifest title is CYBERLY ASTRA REDESIGN DIRECTION v2.3, gate UXR-A03-R4, artifact source baseline `690ac170554996dd5fe552087214fc731a8af48c`, created 2026-09-06. Its recorded status is candidate ready for Owner review; the present user's approved-reference instruction establishes its use for this pilot, not a claim that the artifact itself contains a later signed acceptance record.

All 51 listed proof/asset hashes match. Manually inspected prior PNGs: `R/proofs/01-dashboard.png`, `05-assistant-open.png`, `07-full-chat.png`, `10-scenario-confirmed.png`, `21-mobile-dashboard.png`, `26-mobile-feedback.png`, `28-mobile-full-chat.png`. These are **REFERENCE_VISUAL_INSPECTED / historical fixture captures**, not freshly observed current app pages. Manifest also supplies Scenario before/confirming/failure (`08`, `09`, `11`) and mobile before (`25`); their presence/hash is verified, without claiming all were visually inspected. Result composition is inherited from `R/app.js:23`; no dedicated v2.3 result proof is listed, so result reference is source-only until rendered. Prototype About explicitly remains source-unavailable; do not copy its unavailable state as completed About content.

Current-browser method: installed Playwright headless browser, fresh isolated context, service workers blocked, all request URLs intercepted; local build assets fulfilled from disk, existing synthetic fixture responses fulfilled in memory, every unknown external request aborted. Fixture sources are `client/src/scenario/ScenarioFinalVisualPilot.test.jsx:40`, `client/src/dashboard/DashboardExactResumeProducer.test.jsx:12`, `client/src/cyberguard/cyberguardTestUtils.jsx:54` and prior external `uxr-i02-s1-review/verify-local.cjs`. No request was continued to a real server. Two attempts established the same startup failure; the second persisted diagnosis. No API request or Scenario mutation was reached. The script contains later simulated interaction steps, but they were **not executed**. `client/src/api/apiConfig.js:7` validates the production API origin during module initialization; the available build triggers that guard. This does not prove the hosted site has the same build configuration.

| Surface / disposition | Reference visible design | Actual source and exact migration owner | Evidence / acceptance gap |
|---|---|---|---|
| Dashboard — KEEP | Calm heading; primary learning card; optional Assessment; subordinate exploration; integrated My Progress rather than primary standalone Progress | `client/src/App.jsx:5871`, `:6183`; `client/src/dashboard/dashboard.css:1`; `client/src/progress/ProgressDetails.jsx:6`; `App.jsx:8949` compatibility redirect | Keep existing data/Progress ownership and optional Assessment. Reference desktop/mobile inspected; current NOT_OBSERVED |
| Dashboard — REMAINING_MIGRATION | Primary action area precedes secondary material; prototype uses one illustrated recommendation entry | Current `App.jsx:6220` inserts standalone Resume, then progress at `:6227`, then recommendation at `:6238`. `DashboardResumeSurface.jsx:8` has a separate plain button section and `:16` exposes `(#attemptId)` | Source-proven layout difference; no pixel claim. First slice below changes only the action composition, not all Dashboard sections |
| Dashboard — APPROVED_AMENDMENT | New manual Continue/Recommended horizontal area is supplied in PILOT-DEC-001, not present in old screenshot | Compose validated exact-resume descriptors plus existing recommendation owner; preserve `App.jsx:6035` completion and `:6079` follow handlers | Detailed amended layout has no current screenshot; needs Owner visual review. Resolver output never becomes fake “no unfinished work” to reveal recommendations |
| Scenario player — REMAINING_MIGRATION | v2.3 title/context; situation left, choices right; stacked mobile | `App.jsx:8091`/`:8110` current attempt has a 54rem shell and one `scenario-step-card`; `client/src/scenario/scenarios.css:97`/`:107` own shell/choice list | Existing player keeps choices and exact attempt behavior; two-column situation/choices is not established by current source. Current NOT_OBSERVED |
| Scenario confirmed — KEEP + REMAINING_MIGRATION | Locked choices remain above full-width feedback; focus/status reveal; explicit Continue; no XP/confetti | `App.jsx:8119` disables choices after feedback; `:8131` nests feedback inside the same step card; `:7846` saves only on confirm; `:7862` explicitly continues. Styles `scenarios.css:130` | Source confirms server-success feedback and locked choices; source does not establish v2.3 separate full-width layer or confirmed-feedback focus/scroll model. Do not replace accepted lifecycle/uncertainty handling |
| Scenario result — KEEP + EVIDENCE_MISSING | Inherited `R/app.js:23`: attempt-scoped score/band and decision review; related next steps | `App.jsx:8153` has server-returned score, percent, result band, mastery delta, review and recommendation; result styles in `scenarios.css` | Preserve backend result truth; review wording versus “attempt-scoped” design in its own later slice. Dedicated v2.3 result capture and current rendered result missing; do not delete scores on visual preference alone |
| CyberGuard full — ALREADY_MATCHES (source anatomy only) + EVIDENCE_MISSING | Sidebar/history + conversation + stable composer; in-workspace identity and AI notice | `App.jsx:9705`, `:10316`; `CyberGuardChatShell.jsx:3`, `CyberGuardWorkspaceHeader.jsx`, `CyberGuardComposerFrame.jsx`; `cyberguardLayout.css` | Same structural roles exist. Source anatomy label is not pixel parity, provider reliability or accessibility PASS. Current full chat/history/error/citation/proposal render missing |
| CyberGuard compact — ALREADY_MATCHES (source anatomy only) + REMAINING_MIGRATION | Round launcher; header full-page/close, scrolling messages, stable composer; full-screen mobile reference | `App.jsx:2055` round 52px launcher, `:2063` 340px bounded panel, `:10423` header/full-page/shared log/composer, `:10483` open-state ×; `client/src/navigation/shell.css` and `cyberguardLayout.css` responsive overrides | Keep shared ChatProvider, guest and verified-email boundaries. Effective mobile safe-area/full-screen geometry, focus policy and unobstructed composer need browser evidence; do not copy prototype modal behavior blindly |

No current surface earns visual ALREADY_MATCHES/PASS. The limited ALREADY_MATCHES labels above apply explicitly to source anatomy. Missing current rendered Dashboard (including multiple unfinished choices plus recommendation), Scenario before/confirmed/result, and CyberGuard full/compact screenshots prevent `PILOT-A02_OWNER_VISUAL_REVIEW_READY`.

## 4. Workbook source reconciliation

### Independent census

Original `Cyberly_Astra_Pilot_v1_Batch01/Cyberly_AI_Preparation_Workbook.xlsx` SHA-256 is `5d5aec855a8a1548cd7393b564758c4c6e5789dee557edd3ad2cb0a6eb37e4ca`. Parsed original workbook, then compared every extracted field in all 56 inventory records, 69 relationships, 49 category rows and four safety rows to supplied census. Date cells were normalized back to Excel serials. Zero cell differences; every supplied statistic independently matches. Machine-readable evidence: `workbook-reconciliation-checks.json`, with raw records and original row numbers.

Eight worksheets: 01_Learner_Level_Policy; 02_Content_Inventory; Cyberly_Content_Category_Plan; 03_Content_Relationships; 04_AI_Safety_Test_Set; 05_MY_Response_Guidance; 06_AI_Quality_Rubric; 07_Agent_Tool_Catalogue.

- Inventory rows 5–66: 56 nonblank records: 14 resource, seven scenario, 28 FAQ, seven safety_summary; eight per topic. All 56 `review_status=reviewed`, all 56 `rag_ready=no`. These are authoring flags, not publication/RAG eligibility evidence. All 28 FAQ URLs are absent; no duplicate content codes or slugs within the inventory.
- Relationships rows 5–73: all 69 source/target endpoints exist in the workbook; seven prepare_before, 40 next_step, 14 practice_after, eight remedial. Valid workbook references do not mean runtime endpoints exist.
- Category plan rows 11–59: 49 rows, 17 Existing, four Partial, 28 Missing. These are workbook coverage claims, not verified live catalogue coverage.
- Safety sheet rows 8, 11, 12 contain prompt plus expected behavior; row 13 (`SAFE-MY-NORMAL--01`) is incomplete. The 72-test target summary in rows 1–5 is not 72 authored or executed tests. No model/test run was performed.
- **WB-01 unresolved:** inventory rows 23–30 use `TOPIC-AI&TECHNOLOGY`; category-plan rows 53–59 use `TOPIC-AI_TECH`. Preserve both raw values; do not silently rename either.
- **WB-02 unresolved:** inventory row 7 (`SCN-SC-001`) note names absent `RES-PH-001`. Structured relationships rows 7–8 correctly reference existing `RES-SC-001`/`RES-SC-002` to `SCN-SC-001`. The stale note is distinct from structured endpoint validity and does not authorize a redirect.

### Actual repository reconciliation, not a live catalogue

Resources are nine seeded canonical slugs in `server/migrations/014_seed_resource_content.sql:1` and English article bodies at line 20; two additional locales are seeded by `server/migrations/015_seed_resource_ms_zhCN_translations.sql:1`. Eight runnable scenario definitions are seeded in `server/migrations/008_create_scenario_engine.sql:104`, with actual options, score and feedback-bearing steps starting at line 124. Translations are seeded in `server/migrations/012_seed_scenario_ms_zhCN_translations.sql:10`, with English backfill at `server/migrations/025_backfill_scenario_english_translations.sql:1`. These migration definitions prove available repository content, not migration application or current production state.

All 21 workbook rows have three-language titles/summaries but no article body or runnable scenario step/option/feedback/scoring structure. No workbook row can be admitted unchanged. Resource schema requires `content_json` (`server/migrations/013_create_resource_content_tables.sql:19`); scenario schema requires 3–5 steps and options (`server/migrations/008_create_scenario_engine.sql:21`). Runtime locale fallback can display English (`server/src/resource/resource.repository.js:13`); it does not prove translated body completeness. New/revised bodies and scripts need English, Malay and zh-CN review; existing seeded translations must not be replaced with summaries.

Historical planning metadata independently calls these rows blocked_missing_content (`docs/planning/import-preview/14July2026-audit/corrected-dispositions.csv:30`). The historical duplicate report (`docs/planning/import-preview/14July2026/duplicate-report.csv:2`) reports exact source-URL matches for rows 14/50 and slug/title match for row 59. Its `live:resource:*` IDs are old import-preview evidence, not newly checked database IDs. This reconciliation verifies those equality signals against actual seed SQL. Sole exact seeded slug collision is `digital-citizenship`; none of the seven scenario slugs match. A shared source URL is not equal content or equal identity. Reviewed-by workbook text (`Group 20`) is not a runtime user ID (`server/migrations/022_add_resource_review_metadata.sql:10`).

`UPDATE` means preserve the existing canonical identity and review proposed changes; `MERGE` means editorial overlap requiring reconciliation before deciding whether to add a duplicate; `NEW` means a potentially distinct authored item; `BLOCKED` means a missing taxonomy/structural decision as well as missing content. No unconditional KEEP is justified for a workbook body because none exists. Existing seeded bodies should be kept until an approved, reviewed replacement is ready. **Every row below has runtime admission BLOCKED_MISSING_CONTENT and LIVE_DB_UNVERIFIED.**

| Inventory row / code | Workbook slug | Proposal | Existing candidate and exact seed citation | Identity / source finding |
|---|---|---|---|---|
| 5 / RES-SC-001 | `how-to-recognize-and-avoid-phishing-scams` | MERGE | `phishing` — `server/migrations/014_seed_resource_content.sql:3` | Semantic overlap; source changes CSA to FTC. Keep canonical phishing identity pending approved body update. |
| 6 / RES-SC-002 | `national-scam-response-centre-malaysia` | MERGE | `online-scams` — `server/migrations/014_seed_resource_content.sql:4` | Semantic overlap; source changes nsrc.my to NFCC. Scope adds response/reporting; verify current official source later. |
| 7 / SCN-SC-001 | `avoid-social-engineering-and-phishing-attacks` | MERGE | `suspicious-parcel-delivery-sms` — `server/migrations/008_create_scenario_engine.sql:106` | Semantic overlap with parcel and fake-ewallet-urgent-message; not the same script. WB-02 unresolved. |
| 14 / RES-MS-001 | `sebenarnya-malaysia-fact-check` | MERGE | `misinformation-fake-news` — `server/migrations/014_seed_resource_content.sql:5` | Exact source URL only (sebenarnya.my); semantic overlap, not identity equality. |
| 15 / RES-MS-002 | `media-and-information-literacy` | NEW | `misinformation-fake-news` — `server/migrations/014_seed_resource_content.sql:5` | Distinct UNESCO literacy resource; partial thematic overlap. Author distinct learner body or merge deliberately. |
| 16 / SCN-MS-001 | `verifying-viral-news-before-sharing` | MERGE | `viral-emergency-group-chat` — `server/migrations/008_create_scenario_engine.sql:112` | Semantic overlap only; missing workbook script cannot replace seeded decisions. |
| 23 / RES-AIT-001 | `spotlight-cybercrime-innovation` | MERGE | `ai-generated-content` — `server/migrations/014_seed_resource_content.sql:6` | Semantic overlap; INTERPOL AI crime framing differs from seeded MCMC article; WB-01 unresolved. |
| 24 / RES-AIT-002 | `beyond-illusions-deepfakes` | MERGE | `deepfakes` — `server/migrations/014_seed_resource_content.sql:7` | Semantic overlap; source is a specific INTERPOL PDF versus seeded resource URL; WB-01 unresolved. |
| 25 / SCN-AIT-001 | `uncovering-deepfakes` | MERGE | `ai-celebrity-investment-video` — `server/migrations/008_create_scenario_engine.sql:113` | Semantic overlap only; broader synthetic-media practice versus investment scenario; WB-01 unresolved. |
| 32 / RES-PRIV-001 | `department-of-personal-data-protection` | MERGE | `privacy-personal-data` — `server/migrations/014_seed_resource_content.sql:8` | Semantic overlap; /en/ URL is not exact seeded URL; rights/legal accuracy needs review. |
| 33 / RES-PRIV-002 | `online-privacy-and-security` | NEW | `privacy-personal-data` — `server/migrations/014_seed_resource_content.sql:8` | Broader FTC security guide overlaps topic but no exact identity; scope distinct body before addition. |
| 34 / SCN-PRIV-001 | `public-computers-and-public-wifi` | NEW | `mobile-app-excessive-permissions` — `server/migrations/008_create_scenario_engine.sql:111` | Topic-only overlap; public Wi-Fi/banking script is distinct from app permissions and location-post seeds. |
| 41 / RES-SAF-001 | `how-to-stop-cyberbullying` | MERGE | `cyberbullying` — `server/migrations/014_seed_resource_content.sql:9` | Semantic overlap; global UNICEF source differs from Malaysia seed source. |
| 42 / RES-SAF-002 | `online-safety` | NEW | `cyberbullying` — `server/migrations/014_seed_resource_content.sql:9` | Broad online safety, topic-only overlap with bullying; source is a resource hub rather than a selected article. |
| 43 / SCN-SAF-001 | `dealing-with-online-bullying` | BLOCKED | `none` — `server/migrations/008_create_scenario_engine.sql:6` | No dedicated cyberbullying scenario or Safety mastery topic. Requires explicit taxonomy decision plus complete reviewed script. |
| 50 / RES-PASS-001 | `use-strong-passwords` | MERGE | `password-security` — `server/migrations/014_seed_resource_content.sql:10` | Exact CISA source URL only; semantic overlap, distinct slug/title. |
| 51 / RES-PASS-002 | `turn-on-multi-factor-authentication` | NEW | `password-security` — `server/migrations/014_seed_resource_content.sql:10` | MFA has a seeded paragraph but no dedicated article identity; author separate depth or merge. |
| 52 / SCN-PASS-001 | `creating-a-secure-password` | NEW | `same-password-breach-warning` — `server/migrations/008_create_scenario_engine.sql:109` | Thematic overlap only with breach-warning and OTP seeds; new-account/password-choice script is distinct. |
| 59 / RES-BEG-001 | `digital-citizenship` | UPDATE | `digital-citizenship` — `server/migrations/014_seed_resource_content.sql:11` | Only exact resource slug/title collision; keep identity but do not overwrite body. Common Sense source differs from DigitalCitizenship.net. |
| 60 / RES-BEG-002 | `social-engineering` | MERGE | `phishing` — `server/migrations/014_seed_resource_content.sql:3` | Semantic overlap with phishing; same CISA source as SCN-SC-001 and SCN-BEG-001 is not a duplicate identity. |
| 61 / SCN-BEG-001 | `stranger-asking-for-information` | NEW | `suspicious-parcel-delivery-sms` — `server/migrations/008_create_scenario_engine.sql:106` | School impersonation is a distinct script; propose phishing_and_scams only after explicit mapping approval; no Beginner mastery topic. |


All source URLs above remain unvisited in this bounded task. Source rights, current official channel details, Malaysian relevance and content accuracy are unverified. Broad hubs (Internet Matters resources, National Cybersecurity Alliance resources) require specific source selection; changed organisation/URL combinations require fresh review. Workbook source links do not confer reproduction rights. Resource/scenario summaries are not source-grounded full production content.

### Namespace and runtime constraints

| Workbook topic | Existing Resource category candidate | Existing mastery/scenario topic candidate |
|---|---|---|
| TOPIC-SCAMS | Scams | phishing_and_scams |
| TOPIC-MISINFORMATION | Misinformation | misinformation_and_deepfakes |
| TOPIC-AI&TECHNOLOGY (inventory), TOPIC-AI_TECH (plan) | AI & Technology | misinformation_and_deepfakes; WB-01 unresolved |
| TOPIC-PRIVACY | Privacy | privacy_and_personal_information |
| TOPIC-SAFETY | Safety | No dedicated topic; BLOCKED for cyberbullying scenario classification |
| TOPIC-PASSWORD | Passwords | password_and_account_security |
| TOPIC-BEGINNER | Beginner | No dedicated topic; classify a concrete script by risk, not level |

The table is a proposed explicit crosswalk, not implemented aliases. The seven Resource categories come from seed lines 3–11; four scenario/mastery topics are enforced by `server/src/scenario/scenario.validation.js:1`, scenario schema line 6, and `server/src/progress/progress.rules.js:1`. AI and misinformation share one mastery topic. Safety/Beginner are not silently new mastery topics. Workbook identifiers are not runtime slugs or runtime category codes.

Workbook learner policy rows 5–10 defines L1 0–39, L2 40–54, L3 55–69, L4 70–81, L5 82–91, L6 92–100. Runtime difficulty is beginner/developing/intermediate/advanced (`server/src/scenario/scenario.validation.js:8`); progress thresholds are 40/70/85 (`server/src/progress/progress.rules.js:15`). These scales do not map one-to-one: notably workbook L5 crosses runtime's 85 boundary. L1–L6 content difficulty tags cannot be imported into runtime difficulty enums or treated as a released learner-level model without a scoped mapping decision.

Current Resource→Scenario linkage is 0..1 per Resource, a scalar `relatedScenario` or null (`server/src/resource/resource.service.js:28`), implemented by one registry mapping `phishing` → `suspicious-parcel-delivery-sms` (`server/src/resource/resourceScenarioRegistry.js:1`). The target must resolve as published; linkage does not start an attempt. Multiple resources could map to the same scenario, but the 69-edge workbook graph is not implemented by this contract. Its FAQ/safety-summary nodes, prerequisite/remedial/next-step paths and workbook IDs require a separate explicit design; do not truncate or import the graph into the scalar field.

Recommendation ordering is runtime selection based on completion, topic and difficulty (`server/src/scenario/scenarioRecommendation.js:67`, `:94`), not workbook relationship priorities or sequence numbers. A recommendation is not evidence of an explicit relationship. Workbook relationship validity does not authorize auto-start or progress changes.

Publishing new scenarios changes the Learning Path denominator: `server/src/progress/progress.repository.js:165` counts all published definition rows and `:174` counts distinct completed published scenario IDs for that learner. Contribution is 75 × completed/eligible, clamped (`server/src/progress/learning-path-progress.service.js:42`); publication can reduce displayed progress with no deleted completion. Seed-only illustration (not a live count): eight published definitions becoming 15 would reduce one completed scenario's contribution from 9.375 to 5 points. New versions also require care because the denominator counts rows, not unique slugs. Draft additions do not count until published. Do not claim an import is cosmetic; include denominator-impact review and explicit rollout decision.

Additional governance evidence: `server/migrations/022_add_resource_review_metadata.sql:93` seeds existing resource review/RAG metadata separately from workbook flags. It marks AI-generated content, cyberbullying and digital citizenship `needs_review` while retaining demo-era `rag_ready=1` (lines 126, 161, 183); AI-generated content and digital citizenship also need stronger sources. This is historical seed intent, not proof of current eligibility, approved replacement content, or current DB flags. It must not override the workbook's raw `reviewed/no` values or waive renewed source review.

## 5. Operations and release gaps

Scope: source inspection at the parent-supplied b9baed034bd8af02d3b6863fc85515f77869097a baseline; no deployed configuration, infrastructure limits, capacity, provider availability, or measurements were reverified. Frontend b9baed0 / dep-daql8cjktnus73b9k5rg and backend fc4400bb7c21c0068fe8a1e38651546565379128 / dep-dap4b9o0cd8s73bn0ud0 are handoff facts only. Repository-relative citations below identify inspected source, not deployed proof.

Prospective acceptance envelope: 100 registered, 30 active, 10 concurrent AI, 100-arrival burst, 60-minute soak; non-AI p95 <=1.5 seconds and success >=99%; 72 complete three-language tests with zero severe privacy/safety findings. These are targets, not results. Explicitly define workload, warm/cold conditions, shared-IP topology, exclusions and intentional 429 accounting before measurement. Keep AI latency separate from the non-AI threshold.

| Area / priority | Actual evidence | Blocker / bounded next evidence |
|---|---|---|
| Deployment provenance — P1, acceptance prerequisite | Source and hosted backend identifiers differ in supplied handoff. `docs/production/deployment/current-deployment.md:5` expressly distinguishes staging from launch. | Map tested endpoint and effective configuration to an immutable deployment/commit before attributing any source finding or test result to hosted behavior. No forced redeployment proposed. |
| DB concurrency — P1, capacity evidence blocker | `server/src/database/pool.js:88`: 10 connections, wait enabled, unlimited queue (`queueLimit: 0`); no explicit query/acquisition timeout in this pool configuration. TLS code supports certificate verification (`:14`). | Observe DB connections, pool wait, query/error latency, queue/memory behavior under 30-active/10-AI/burst/soak envelope. Confirm managed DB connection allocation across actual processes. Ten connections alone proves neither failure nor sufficient capacity; tune existing pool only from evidence. |
| Shared-IP arrivals / rate limits — P1, test-plan blocker | `server/src/security/rateLimitPolicies.js:14`: registration 10/IP/15 minutes; `:21`: login 20/IP/15 minutes; `:28`: 10/account/15 minutes. Wired at `server/server.js:415` and `:464`. `server/server.js:220`: trust proxy 1. | A burst of 100 new registrations or logins behind one school/NAT IP intentionally exceeds current limits. Define the burst as arrivals versus login/registration workload; retain security controls and report intentional 429 separately. Validate actual proxy/IP attribution and realistic shared-IP onboarding before pilot. |
| Limiter lifetime — P1 before scaling; P2 bounded single-process evidence | `server/src/security/rateLimit.js:10` uses process-local Map; expired key replacement occurs only when that key returns (`:17`). No global eviction here. AI minute/day buckets also process-local (`server/src/ai/ai.service.js:27`, `:254`). | Restart resets and multiple instances split limits. Confirm actual instance count, measure distinct-key memory during soak and document accepted single-instance scope. Do not claim distributed enforcement or propose infrastructure replacement without observed need. |
| Session persistence — P1 evidence blocker | MySQL-backed store wired at `server/server.js:228`; session reads query sessions then user session version (`server/src/auth/mysql-session-store.js:16`), writes/touches persist (`:38`, `:58`). No expired-row sweep in this store. | Verify restart/session restore, logout, revocation, simultaneous sessions and cookies on deployed origins, with DB load included. Establish bounded expiry cleanup ownership and inspect counts using approved future diagnostics; source persistence does not prove hosted continuity. |
| AI concurrency / timeout / failure — P1 evidence blocker | Defaults: 20s timeout, 800 output tokens, 6/user/minute, 60/user/day, 60s stale window (`server/src/ai/ai.config.js:3`). Per-user in-process lock plus DB in-progress check (`server/src/ai/ai.service.js:616`); no global 10-request gate shown. Adapters attempt cancellation (`providers/openai.provider.js:168`, `gemini.provider.js:75`, `ilmu.provider.js:75`). Provider errors mark generation failed and return normalized errors (`ai.service.js:863`), rather than automatic cross-provider failover. | Ten concurrent AI is a test target, not an implemented fleet cap. Measure end-to-end and provider latency separately, timeout/cancellation behavior against installed SDK, in-progress recovery, safe retry/no duplicate persistence, quota exhaustion and provider failure UI. Preserve existing deterministic planning fallback semantics; do not describe generic provider errors as automatic successful fallback. |
| AI budget / billing — P1 budget acceptance blocker | Optional daily budget defaults null (`ai.config.js:38`); preflight compares completed-generation estimated spend (`ai.service.js:628`, `ai.repository.js:514`). Pricing table contains one OpenAI model and falls back to that rate (`ai.config.js:11`, `:24`); tokens/cost/duration persist (`ai.repository.js:459`). | Confirm approved budget and effective configuration through safe owner evidence. This is estimated completed spend, not hard reservation: concurrent work may overshoot and provider/model costs may differ; planner/failed-call billing needs reconciliation. Record provider quota, billed spend, tokens, calls per scenario, and bounded test ceiling without exposing keys or learner content. Do not use stale embedded prices as current billing truth. |
| Gemini / ILMU commitments — P1 routing evidence; no adapter rebuild required | Three adapters and purpose assignments exist (`providers/aiProvider.registry.js:1`, `:91`). Gemini disabled by default (`:57`); config-based `runtime_ok` (`:84`) is not live health proof. ILMU OpenAI-compatible adapter (`ilmu.provider.js:79`); structured output false, tools true capability declaration (`:47`). Gemini chat/structured/tools declarations (`gemini.provider.js:44`). Historical `docs/ai/provider-runtime-report.md:3` dated 2026-07-18 records Gemini auth failure, ILMU health success, but ILMU tool-normalization failure (`:89`). `docs/01-project-overview.md:34` retains ILMU Malaysian/localisation role and `:36` Gemini future multimodal intent; `docs/03-development-decisions.md:50` leaves production selection a decision. | Preserve both providers and prior commitments. Distinguish installed adapters, declared capabilities, historical diagnostics and current production routing. Obtain fresh authorized bounded health/structured/tool-shape evidence only if activating or accepting those purposes. ILMU historic health does not prove tool planning; Gemini future multimodal intent is not current adapter multimodal implementation. No live provider call made here. |
| SMTP / onboarding — P1 evidence blocker | Cached Nodemailer transport directly awaits sendMail (`server/src/email/mailTransport.js:75`); application does not set explicit transport timeout/pool options there. Disabled/test modes exist (`:97`). `docs/production/deployment/current-deployment.md:125` records staging SMTP verification historically, while `configuration/email-verification-smtp.md:119` retains an older pending statement. | Reconcile dated acceptance rather than treating stale checklist as proof of failure. Verify delivery, latency, sender quota, bounce/error behavior and resend/recovery in three languages with owner-controlled inboxes; do not send burst tests to real recipients. Capture redacted delivery evidence and current timeout behavior. |
| Backup / recovery — P1 final Go/No-Go blocker | `docs/production/operations/public-beta-backup-recovery.md:22` records one historical logical backup/checksum; `:32` explicitly excludes successful restore. `:65` requires separate-target rehearsal. Daily/seven-day retention baseline (`:129`); no automatic retention deletion. Storage encryption/access control is external (`:157`). | Obtain recent backup/checksum/storage custody evidence, approved RPO/RTO and timed separate-target restore plus application read validation. Never restore over staging; never inspect dumps for this audit. Existing backup evidence remains valid historical evidence, not current recovery certification. |
| Rollback / incident response — P1 evidence blocker | `docs/production/product-experience/pilots/cyberguard-public-beta-pilot.md:356` calls for source-control rollback; no new pilot flag. `docs/production/security/public-beta-security-boundary.md:57` leaves rollback/monitoring as separate gates. | Name decision owner, pause/stop conditions, exact known-good frontend/backend artifacts, migration compatibility and repeat smoke checks. Rehearse rollback in approved scope; source-control instructions alone do not establish recovery time or session/data continuity. |
| Metrics / observability — P1 measurement blocker | Health endpoint runs SELECT 1 (`server/server.js:405`); AI generations retain durations/tokens/cost (`ai.repository.js:459`), safe trace metadata includes planner/tool latency (`ai.service.js:310`). Inspected source/docs do not establish a general non-AI p95 dashboard/alert pipeline or a completed load/soak run. | Define privacy-safe counters and timing for route/status class, requests/errors/429, p50/p95/p99, AI outcome/timeout, DB wait/connections, CPU/memory, restart and SMTP delivery. Add per-run deployment/time/workload identity, alert owner and stop thresholds. Health success cannot substitute for learner-flow latency/success measurements or 72-case safety acceptance. |

## 6. Recommended first UI implementation slice — specification only

**Name:** Dashboard Continue/Recommended area. **Goal:** place confirmed unfinished work and an explicitly chosen valid recommendation in one coherent, manually switchable horizontal area. **Status:** scoped, implementation NOT STARTED; VIS1 current/reference evidence is ready for Owner review. This recommendation uses the recovered reference plus current state/handler evidence; it does not authorize implementation or bypass Owner review.

**Architecture:** retain React, existing Dashboard data owners, frozen `resolveGuidance`/`dashboardGuidanceInput`, exact-resume adapters and current recommendation mutation handlers. A Dashboard-local presentation component owns only the visible family and readable labels. It must not fetch, reconcile, rank, complete or start learning activities. The server and resolver API remain unchanged; no S3 redesign is bundled.

### Exact future file manifest and reuse

| Future file | Bounded change |
|---|---|
| `client/src/App.jsx:6064`, `:6220`, `:6238` | Replace two separate action presentations with one `DashboardNextStepArea`; pass current scoped observations and unchanged explicit handlers. Retain `progress-recommendation`/`dashboard-recommended-next-step` anchors and section navigation behavior. Do not relocate unrelated lower progress/detail sections |
| ADD `client/src/dashboard/DashboardNextStepArea.jsx` | Local family switcher and panel composition; no I/O. Props: `guidance`, `inventory`, normalized `recommendationObservation`, verified recommendation display text, `scopeKey`, existing resume/follow/complete/retry callbacks, pending/error/success flags. Output is UI only, not a new guidance authority |
| `client/src/dashboard/DashboardResumeSurface.jsx:4` | Reuse exact action iteration/target callbacks; replace standalone card wrapper with panel body; remove raw ID/slug display; readable per-attempt labels only; equal controls, no selected attempt |
| `client/src/dashboard/dashboard.css` | Scoped area/header/panel layout using current tokens; horizontal family controls; wrap text at 320px; no global CSS/font/theme migration |
| `client/src/i18n/locales/en.json`, `ms.json`, `zh-CN.json` | Add equivalent Continue/Recommended, safe empty/loading/recovery and saved-practice disambiguation labels only; retain old accepted recovery copy where reusable |
| ADD `client/src/dashboard/DashboardNextStepArea.test.jsx` | Cover family switching, same-title identities, default-family settling and no side effects; no new browser fixtures in product source |
| `client/src/dashboard/DashboardExactResumeProducer.test.jsx` | Update only visible-label/wrapper expectations currently asserting raw IDs; keep identity order, all exact calls, scope/guard/error/no-Start assertions |
| `client/src/dashboard/DashboardIntegratedProgress.test.jsx` | Adjust selectors only if necessary; retain one-owner fetch counts, failed completion retry, exact recommendation targets and Progress compatibility assertions |

Reuse `client/src/design-system/primitives/Button.jsx`, `client/src/design-system/primitives/Surface.jsx`, `client/src/design-system/feedback/PageState.jsx`, App-local `SuccessFeedback`, current `DashboardResumeSurface` callbacks, Dashboard retry state and existing tokens. App-local feedback may be passed as rendered content rather than extracted into an unrelated shared-component refactor. Do not repurpose `SectionNav` as ARIA tabs: it represents page anchors with `aria-current=location`. Implement ordinary named family buttons with `aria-pressed` and a labelled region, unless the later visual review deliberately approves full tab semantics. Neither button moves focus into or activates a learning action merely by switching.

Read-only dependencies stay unchanged: `client/src/guidance/resolveGuidance.js`, `dashboardGuidance.js`, `scenarioContinuation.js`, `assessmentContinuation.js`, `client/src/assessment/useAssessmentExactResume.js`; all API modules and all server files.

### State contract and visual behavior

Frozen S1 returns Resume before Recommendation (`resolveGuidance.js:199`); `secondaryActions` contains Browse, not a hidden alternate recommendation. **Do not manufacture empty Assessment/Scenario observations or change the resolver to make it emit a recommendation.** Continue consumes the resolver's real `resume`/`resume_choice` only. The Recommended panel presents the existing canonical recommendation observation already owned by Dashboard, with a local validation boundary: matching scope/revision, ready state, positive safe ID, active/viewed lifecycle, and a supported canonical target. Use the existing normalized `dashboardGuidanceInput().currentRecommendation` for validation rather than calling a new endpoint. A completed recommendation remains history/status, not a new actionable recommendation. Unsupported or malformed targets render recovery and never execute the existing generic fallback as if it were a validated recommendation.

| Observed state | Initial / available family | UI and action rules |
|---|---|---|
| Owners loading; unfinished status not established | Neutral loading; both family controls can expose truthful pending state | Do not flash “no unfinished work”, choose an attempt or mark anything viewed |
| Confirmed one unfinished; valid recommendation | Continue initially; Recommended explicitly selectable | Continue action invokes only its existing exact adapter; selecting Recommended changes local panel only |
| Confirmed multiple unfinished (including Assessment + Scenario or repeated title/slug) | Continue initially; no chosen attempt | Every unfinished descriptor has equal prominence and a separate explicit action; no default selected/focused attempt |
| Confirmed none; valid active/viewed recommendation | Recommended initially | Follow/Complete preserve their current explicit server lifecycle; no additional fetch upon switch |
| Confirmed unfinished; recommendation loading/error/unknown | Continue available; Recommended shows pending/error/retry | Keep known resume actions; never show an old recommendation from another scope as current |
| Unfinished coverage partial/malformed/stale or owner failed | Continue shows recovery, not an invented resume | A separately valid current recommendation may be inspected explicitly; do not claim unfinished absence. Retry uses existing owner reload behavior; display its pending state |
| No unfinished and recommendation null (confirmed empty) or completed | Recommended empty/history state with existing Browse navigation | No fabricated assessment requirement, alternate ranking or completion |
| Recommendation completion pending/fails | Retain selected family, saving/error and safe retry | Update success/progress only after acknowledgement; switching must not duplicate the mutation |
| User manually chose a family, then same-scope data settles/refreshes | Preserve that explicit choice | Default to Continue after initial data settles only if no manual choice has occurred; late response cannot steal focus |
| Logout, learner or locale/revision changes | Discard stale actionable state immediately | Revalidate the current observation; reset family default on new scope, preserve no cross-user labels or targets |

Metadata limit: `server/src/scenario/scenario.service.js:258` exports only `attemptId`, `scenarioSlug`, `title` in the complete unfinished inventory. The legacy single `inProgress.currentStepOrder` cannot be borrowed for other attempts. No timestamps or complete per-attempt progress exist in that list. First slice must omit dates/progress unless already verified from the correct owner; it must not add requests/API fields just to decorate cards.

Proposed readable disambiguation: title plus localized “Saved practice 1”, “Saved practice 2” for duplicate titles; generic “Saved practice” if title unavailable. Assign from the resolver's deterministic identity order into a local ID-to-label map for the mounted learner scope, retaining labels for survivors and assigning new ordinals without renumbering during that scope. IDs remain internal keys only, never visible/ARIA text or raw slug fallback. This is stable within the mounted scope, **not** a promised durable cross-session attempt name; locale changes translate the label, not its ordinal. If durable cross-session distinction is required, stop that enhancement for a separately scoped metadata decision rather than fabricate dates or persist new learner data. This limitation belongs in Owner review.

Desktop: one card surface, heading and manual horizontal Continue/Recommended controls, then the selected panel. Multiple unfinished cards are equal-size choices and may wrap inside the panel; navigation arrows, if shown, only change visible cards. Mobile: same families and actions, one-column card content, labelled controls retained, no gesture-only access, no page horizontal overflow at 390/320px. Do not auto-rotate or require swiping. Use reduced-motion-safe transitions, visible keyboard focus, 44px targets and sufficiently wrapping Malay/Chinese labels. Keep the current Progress anchors reachable; family reveal on an explicit recommendation anchor navigation may be local presentation only, with no recommendation mutation.

### Implementation and verification order for the later authorized slice

- [ ] Add failing behavioral assertions to `DashboardNextStepArea.test.jsx`: switching family does not call follow/complete/resume/start; same-title items retain distinct callback targets without raw IDs; manual family selection survives late current-scope data; stale learner/locale observations never execute; errors remain retryable and do not render zero/empty success.
- [ ] Compose existing handlers and resume descriptors through the single presentation component, then update only the raw-ID/wrapper assertions in existing Dashboard tests. Keep resolver/adapter assertions unchanged.
- [ ] Add scoped layout and three-locale copy; retain explicit confirmation and existing recovery states. Review no fetched metadata or additional effects were introduced.
- [ ] Run the following targeted commands, then capture the state matrix in an authorized isolated browser and request Owner visual review. No commands in this subsection were executed in Batch 01.

```powershell
$env:CI = 'true'
npm --prefix client test -- --watchAll=false --runInBand --runTestsByPath src/dashboard/DashboardNextStepArea.test.jsx src/dashboard/DashboardExactResumeProducer.test.jsx src/dashboard/DashboardIntegratedProgress.test.jsx src/dashboard/DashboardFinalVisualPilot.test.jsx src/progress/ProgressCompatibility.test.jsx
npm --prefix client test -- --watchAll=false --runInBand --runTestsByPath src/guidance/resolveGuidance.test.js src/guidance/dashboardGuidance.test.js src/scenario/ScenarioExactResume.test.jsx src/assessment/AssessmentExactResume.test.jsx src/navigation/guardedLogout.test.jsx
node scripts/verify-locales.js
npm run build
```

The production build requires an approved safe API origin through the existing build mechanism; do not edit local `.env` without explicit authorization and do not silently weaken `apiConfig.js`. The future test run's exact environment and build result must be recorded. Backend test suites are not automatically needed for this presentation-only slice; if backend changes become necessary, stop and rescope rather than expand the manifest.

Visual acceptance requires side-by-side real current/reference views for 1440×900, 1024×768, 390px and 320px with EN/MS/ZH-CN; keyboard and 200% zoom/reduced motion; no clipped labels/focus/controls; mixed unfinished+recommendation, no unfinished, loading/error/unknown, failed completion/retry and same-title choices. Recorded intercepted requests must show zero writes/Start/navigation caused by render, visibility, scroll or family switch. A deliberate Continue reaches only the selected exact attempt; explicit recommendation action preserves existing mutation semantics. Do not call this slice accepted until these captures and Owner review exist. Real-device Safari/Android remains a later pilot-wide acceptance gate even if headless visual review succeeds.

## 7. Precise remaining inputs and Owner decisions (five maximum)

1. **Owner visual review:** VIS1 supplied the explicitly authorized fresh isolated build and recovered all requested current views plus inherited reference result views. Review the external comparison package in section 9. No further capture-environment input is needed for these EN states; typography, broader state/locale/device coverage and actual product acceptance remain separate gates.
2. **Dashboard detail review:** confirm the single-area state contract and readable saved-practice numbering scope after current/reference captures. Direction is already approved; cross-session naming or dates require a separate metadata decision.
3. **Content dispositions:** review 12 MERGE, 7 NEW, 1 UPDATE and 1 BLOCKED proposals; resolve WB-01/WB-02 and the Safety/Beginner mapping before authoring/publication. Name source/rights and EN/MS/ZH-CN content reviewers; none of the 21 briefs is directly import-ready.
4. **Pilot promise/operations scope:** reconcile existing Admin editor/lifecycle operations, Help destination and Gemini/ILMU purposes with the retained commitments. Do not activate, remove or certify any provider or exposed function silently.
5. **Acceptance envelope:** fix burst window/shared-IP assumptions, AI latency mode and RM budget/quotas; assign SMTP, metrics, backup/restore/rollback and incident owners. Then separately authorize bounded evaluations and staged 10 → 30 → <=100 rollout gates; this report authorizes no load/provider/DB work.

The initial capture-environment gap affected visual readiness only and was resolved in VIS1 (section 9). Scope sync, code/route inventory, original Workbook verification, source-only dispositions and operations gap analysis were delivered independently. Live catalogue/deployment state remains unverified; VIS1 records Control Tower's supplied remote equality separately from direct local checks. No reset/stash/switch/reconciliation mutation was attempted.

## 8. Initial Batch 01 commands, verification and boundaries

Executed read-only commands: `git status --short` / `--porcelain=v1`, `git branch --show-current`, `git rev-parse HEAD`, `git show-ref --heads`, `git for-each-ref`, `git diff --cached --numstat`, `git ls-remote --heads origin master develop`; `rg --files`, targeted `rg -n` and `Get-Content`; ZIP listing/extraction and SHA-256 verification; bundled Python `-X utf8` XLSX/census extraction; bundled Node `capture-isolated.cjs`; final hash/manifest/reference-path and `git diff --check` checks. Exact support scripts and JSON outcomes are under E. Some initial bounded path probes failed and were corrected without broad disk search. Python's first stdout encoding attempt failed; UTF-8 rerun succeeded. No installed packages were changed.

Tests/build: **no product test suites or builds executed**. Existing tests are AUTOMATED_SOURCE, not fresh PASS. Workbook/census/hash checks ran; isolated browser capture failed at local build configuration validation before product rendering. Historical 3/138 and 109/1086 test claims remain HISTORICAL_REPORTED only. Final `git diff --check` and allowlisted-file/hash checks are recorded in `verification-final.json`; new docs are inspected separately because ordinary Git diff omits untracked files.

Database/migrations: **none**; no live DB reads, learner data access, migrations/seeds/imports/RAG ingestion, provider calls, SMTP sends or load testing. No product source/tests/CSS/locales/config edited. HEAD and source hashes remain unchanged; only the three listed documentation paths differ from the initial state. No commit, push, deploy, branch mutation, reset or stash.

Manual browser verification: **still required** for all exposed feature records and all current three-page comparisons; diagnostic startup evidence is insufficient. Production remains **NOT CERTIFIED**.

## 9. PILOT-A02-VIS1 — isolated current visual evidence recovery

**PILOT-A02_VISUAL_EVIDENCE = READY_FOR_OWNER_REVIEW.** The earlier local-build blocker is resolved by the specifically authorized evidence build, without source/config changes. This section supersedes only the earlier visual-evidence pending status and the initial build/test-command accounting. Product acceptance, implementation, provider performance and release certification are not established.

External evidence directory **V**:

`C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/pilot-a02-vis1/`

Owner review entry points: `V/visual-evidence-index.md`, `V/comparison-gallery.html`, and `V/PILOT-A02-VIS1-report.md`. Exact per-file screenshot hashes are in `V/screenshot-manifest.json`. All evidence stays outside the repository; only this readiness document was updated in VIS1.

### Precheck and fresh build

`develop` and HEAD `b9baed034bd8af02d3b6863fc85515f77869097a` matched. Initial differences were exactly the two existing untracked pilot docs and modified roadmap; staged count zero. `git status --short`, `git diff --name-status`, `git diff --check` were recorded in `V/precheck.json`. Control Tower supplied independent remote master/develop equality; this was not represented as a fresh remote query by this run.

Executed:

```powershell
$env:REACT_APP_API_BASE_URL = 'https://pilot.invalid'
npm --prefix client run build
```

The value existed only in the build process environment. Client had no active local `.env` files (only `.env.example`, which CRA does not load); no environment file was read for configuration or edited. Build exit code **0**, compilation succeeded; a Node DEP0176 `fs.F_OK` deprecation warning was recorded, without patching dependencies. Build log/result: `V/build.log`, `V/build-result.json`. This synthetic build is evidence-only and must never be deployed. No product test suite ran.

| Fresh artifact | SHA-256 |
|---|---|
| `client/build/static/js/main.6e9a14b0.js` | `8bc7c5a0e98f615c819ddc47f2707eb76ce568ea134afdd09ce7dba1ab5703d6` |
| `client/build/static/css/main.b487bf1c.css` | `05cd1c39b7f55d4e66b1fc6be135c900a21edebe5a205058d02743d803da1000` |

`V/build-reference-checks.json` also records index/chunk hashes, all 123 matching mapped JS/CSS source files, all 51 matching Astra manifest assets/proofs, and fixture provenance. Roadmap and scope-mirror bytes are unchanged from VIS1 precheck; final Git/hash checks are in `V/verification-final.json`.

### Current and reference capture inventory

Every state below has a full-page PNG and a `-viewport.png` variant; width prefixes are `1440-` and `390-`, viewport height 900. Captures use EN and reduced-motion headless Chromium. No UI content or CSS was rewritten for screenshots.

| Required surface/state | V file suffix (both widths) | Observed scope |
|---|---|---|
| Dashboard mixed | `dashboard-mixed.png` | Assessment exact-resume action plus two same-title Scenario identities 9 and 12, and current recommendation visible; existing raw-ID presentation retained |
| CyberGuard compact | `cyberguard-compact.png` | Existing conversation/messages and composer; explicit compact open; same ChatProvider content |
| CyberGuard full | `cyberguard-full.png` | Full workspace, current conversation and composer after compact-to-full navigation; desktop history rendered |
| Scenario player | `scenario-player.png` | Existing resumed fixture before selection/confirmation |
| Scenario confirmed | `scenario-confirmed.png` | Explicit fixture-confirmed choice, locked selection and feedback |
| Scenario result | `scenario-result.png` | Existing completed-result fixture after explicit completion control |

Ten unchanged Astra captures copied into `V/comparison/`: `01-dashboard.png`, `05-assistant-open.png`, `07-full-chat.png`, `08-scenario-before.png`, `10-scenario-confirmed.png`, `21-mobile-dashboard.png`, `24-mobile-assistant-open.png`, `25-mobile-scenario-before.png`, `26-mobile-feedback.png`, `28-mobile-full-chat.png` (descriptive comparison filenames map to exact originals in the JSON/index).

The existing complete prototype deterministically rendered `index.html?screen=result&lang=en&auth=member`. Fresh reference result images: `V/1440-astra-scenario-result.png` and `V/390-astra-scenario-result.png`. **REFERENCE_SCENARIO_RESULT = INHERITED_REFERENCE_RESULT_RENDERED.** This loads the inherited v2/v2.2/v2.3 asset chain, not a new design. No required state was unreachable.

| Comparison pair (under V/comparison) | Disposition |
|---|---|
| `dashboard-desktop-current.png` / `dashboard-desktop-astra-reference.png` | APPROVED_AMENDMENT |
| `dashboard-mobile-current.png` / `dashboard-mobile-astra-reference.png` | APPROVED_AMENDMENT |
| `scenario-player-current.png` / `scenario-player-reference.png` | REMAINING_MIGRATION |
| `scenario-confirmed-current.png` / `scenario-confirmed-reference.png` | REMAINING_MIGRATION |
| `cyberguard-compact-current.png` / `cyberguard-compact-reference.png` | REMAINING_MIGRATION |
| `cyberguard-full-current.png` / `cyberguard-full-reference.png` | REMAINING_MIGRATION |
| Additional mobile Scenario/CyberGuard pairs and desktop/mobile result pairs (index lists exact names) | REMAINING_MIGRATION |

Keep existing exact-attempt execution, explicit actions, guard/uncertainty handling and shared conversation ownership. The visible standalone Resume/raw IDs, Scenario single-card composition and separate CyberGuard header/notice arrangement are now current-fixture observations rather than source inference alone. Mobile compact remains a bounded panel in these captures; it is not the reference's full-screen sheet. No aesthetic score or current UI acceptance is assigned.

Feature-matrix evidence extension: F09/F10/F11 have observed **presentation** of the mixed Dashboard, not successful resume/recommendation mutation; F24 has observed compact opening and full-page navigation; F25/F27 have observed workspace/history presentation only, without send/search/rename/provider execution; F17/F18 have observed existing player/confirmed/result fixture states. All other actions, failure/empty/retry branches, locales and deployed boundaries remain unobserved. These additions do not turn whole grouped records into fully verified features.

### Request ledger and zero-write boundary

The external `V/capture-vis1.cjs` registers interception before navigation, uses `https://pilot.invalid` for both page and API origin, blocks service workers, fulfills only local fresh-build/reference files or existing test-derived fixtures, and aborts unknown requests. It contains no network-forwarding operation. Every request in `V/browser-results.json` records method, path, stage, result and `networkContinuation:false`.

Final capture run: **68 requests = 28 synthetic GET responses + 4 explicit synthetic Scenario responses + 34 local asset responses + 2 aborted font requests**. No missing API fixture and no page-script error recorded. Passive POST/PUT/PATCH/DELETE count **0** for render, chat opening, screenshot, scrolling and actual viewport resizing. Family switching is **NOT_IMPLEMENTED**, so no fabricated switch interaction was tested.

The four requests labelled **SYNTHETIC_INTERACTION_ONLY** are `PUT /api/scenario-attempts/501/decisions` and `POST /api/scenario-attempts/501/complete`, once at each width. They return existing success fixtures in memory; no backend or database is involved. The initial screenshot run is retained under `V/capture-run-01/` and also has four such requests. Across both runs: eight fixture-only interactions, **live/network continuations = 0**, **live learner mutations = 0**.

### Limits, verification and stop

- Two external Google Fonts stylesheet requests per run were aborted. Current captures therefore use fallback typography; the Astra package uses its supplied local fonts. Exact typographic parity is not established and no font download/substitution was attempted.
- Dashboard fixtures deliberately combine a complete unfinished list with a null legacy single-attempt summary. The practice tile's 0 does not establish a live catalogue bug. Existing Scenario test fixtures pair a group-chat title with bank-message situation and completed id 502 after resumed id 501; these screenshots show states, not backend lifecycle correctness or authored-content quality.
- The first full-page capture had sticky-header positions affected by existing scroll. Final captures reset page scroll to zero and settle two animation frames; no DOM/CSS alteration. Prior run remains available for provenance.
- Current captures and inherited result images were visually inspected; final geometry records no horizontal document overflow at either tested width. This is limited fixture evidence, not a full accessibility or mobile-device assessment.
- EN only; MS/ZH-CN, tablet/320px, keyboard/focus, zoom, real Safari/Android, provider failure and all broader pilot checks remain outstanding. Owner visual review is still required.

Executed external capture/package scripts plus Git/hash/diff checks; no product test changes or test-suite run. Database/migration impact: none; no DB read/write, migration, seed, RAG ingestion or load generation. Original three-path worktree manifest retained. Only this readiness document changed during VIS1; generated client/build remains ignored evidence output.

```text
PRODUCT SOURCE EDITS = 0
PRODUCT TEST EDITS = 0
CSS EDITS = 0
LOCALE EDITS = 0
CONFIG / ENV FILE EDITS = 0
DEPENDENCY INSTALLS = 0
LIVE API CALLS = 0
DB MUTATIONS = 0
PROVIDER CALLS = 0
SMTP SENDS = 0
COMMITS = 0
PUSHES = 0
DEPLOYMENTS = 0
PRODUCTION = NOT CERTIFIED
```

Stop at the visual package/report. Dashboard Continue / Recommended unified-area implementation remains **NOT STARTED**.

## 10. PILOT-B01 pre-implementation scope conflict — 2026-09-25

Status: **PILOT-B01_SCOPE_ESCALATION_REQUIRED**. Production remains **NOT CERTIFIED**.

Precheck matched develop / b9baed034bd8af02d3b6863fc85515f77869097a and the three expected documentation paths. Product implementation was not started.

B01 section 7 prohibits actionable recommendations without valid lifecycle and canonical target. Existing `client/src/dashboard/DashboardIntegratedProgress.test.jsx:213-228` requires precisely the legacy missing-target fallback (resources / assessment navigation plus mark-viewed). Other success/completion fixtures omit lifecycle and/or target. B01 section 9 permits only selectors to change in that test file. Resolving these assertions requires substantive fixture/behavior edits; therefore work stopped at the explicit manifest boundary. No backend/API/resolver change is currently indicated.

Minimum needed adjustment: authorize this same test file's success fixtures to include valid active/viewed lifecycle and canonical targets, and replace its two legacy fallback expectations with recovery/no-navigation/no-mutation coverage. Retain the existing completion acknowledgement, refresh, retry, canonical navigation, ownership and stale-response checks. No additional product paths requested.

Baseline command: `CI=true npm --prefix client test -- --watchAll=false --runInBand --runTestsByPath src/dashboard/DashboardIntegratedProgress.test.jsx` — PASS, **1 suite / 14 tests**, exit 0. This confirms current behavior, not B01 acceptance. `git diff --check` passed. Candidate targeted/regression/full-client/locales/build/browser verification were not run; no B01 candidate screenshots or visual PASS claimed.

External report and evidence: `C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01/` (`report.md`, `verification.json`, `request-ledger.json`, baseline log, source excerpts/hashes and Git snapshots). Empty request ledger explicitly records browser harness NOT RUN.

This turn changed only this readiness append inside the repository. Product source/tests/CSS/locales/backend/API/resolver edits: 0. DB/migration mutations/live API/provider calls/commits/pushes/deployments: 0. Owner visual review remains pending implementation and isolated evidence. Prior VIS1 review readiness is historical and unchanged.

## 11. PILOT-B01-AMD1 continuation — 2026-09-25

Status: **PILOT-B01_SCOPE_ESCALATION_REQUIRED**. Production remains **NOT CERTIFIED**.

AMD1 accepted the first test-scope escalation. Precheck matched expected HEAD and three-document worktree; audit/VIS1 were not restarted. Updated only authorized `client/src/dashboard/DashboardIntegratedProgress.test.jsx`: corrected success lifecycle/target fixtures and replaced the two targetless fallback expectations with recovery/no-navigation/no-mutation coverage. TDD RED confirmed: **12 passed / 2 failed / 14 tests**; both new recovery expectations fail on unchanged product code as expected.

A further explicit manifest conflict was identified before product edits. Unmodified `client/src/progress/ProgressCompatibility.test.jsx:119,131` supplies no lifecycle but expects actionable Progress navigation/focus (three cases). Unmodified `client/src/dashboard/DashboardFinalVisualPilot.test.jsx:208,237,250` supplies no lifecycle but expects canonical Scenario/Resource/Assessment actions. These files are required by B01 verification but outside the authorized edit manifest. Their current baseline is **2 suites / 24 tests PASS**. B01 cannot keep those fixture expectations actionable without violating active/viewed-only validation.

Minimum next scope adjustment: allow these two test files' valid recommendation fixtures and only unified-area-related selector/wrapper/order assertions; preserve exact navigation/focus/owner/passive-mutation and unrelated composition checks. The visual test's historical separate-card order assertion at lines 180-200 also needs to be assessed against the approved unified composition. No backend/API/resolver change is currently indicated. Stopped under original B01 section 9 and AMD1 section 6.

Evidence: `C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01/amd1-report.md`, `amd1-red.log`, `amd1-remaining-baseline.log`, `amd1-test.patch`, source excerpts/hashes and `amd1-verification.json`. Prior reports/readiness history preserved. `git diff --check` passed. Full client/locales/build/browser candidate evidence not run/generated. No visual PASS or review-ready claim.

This continuation: product source/CSS/locales/backend/API/resolver edits 0; product test edits 1 file; DB/migration mutations/live API/provider calls/commits/pushes/deployments 0. Readiness append only beyond the authorized test change. Worktree intentionally retains the two failing test-first cases pending scoped continuation. Manual browser evidence and Owner review remain outstanding.

## 12. PILOT-B01-AMD2 local implementation and isolated evidence — 2026-09-25

Status: **PILOT-B01_SCOPE_ESCALATION_REQUIRED**. Product candidate implemented; full-client acceptance is blocked by one additional test fixture outside the authorized manifest. **PRODUCTION = NOT CERTIFIED**. This append supersedes previous “implementation not started” statements for current status without rewriting their history.

Precheck matched `develop` / `b9baed034bd8af02d3b6863fc85515f77869097a` and AMD1's preserved RED test worktree. AMD2 fixture normalization first retained exactly the two intentional targetless RED tests (36 others passed). No reset, stash, checkout, commit or audit/VIS1 recreation.

### Local candidate

One `DashboardNextStepArea` now composes Continue and Recommended in the existing upper Continue position, reusing Button, Surface, PageState, exact-resume callbacks, Dashboard retry and existing recommendation handlers/SuccessFeedback. The other Dashboard sections retain their relative order. Manual family switching has no mutation/navigation/focus effect; same-scope manual choice persists. Learner/locale/revision changes invalidate presentation state. Duplicate titles use localized session labels; IDs/slugs are not exposed as fallback labels. Owner loading/unknown/error and recommendation recovery remain distinct.

The presentation and App action handlers validate current normalized recommendation scope, positive safe id, active/viewed lifecycle and supported canonical target before mutation. Topic-derived Resource/Assessment fallbacks were removed. Retained malformed/stale/unmounted callbacks are covered by integration tests. No backend, API, frozen resolver, adapter, global token or theme changes.

Changed product paths (exact):

- `client/src/App.jsx`
- `client/src/dashboard/DashboardNextStepArea.jsx` (new)
- `client/src/dashboard/DashboardResumeSurface.jsx`
- `client/src/dashboard/dashboard.css`
- `client/src/i18n/locales/en.json`
- `client/src/i18n/locales/ms.json`
- `client/src/i18n/locales/zh-CN.json`
- `client/src/dashboard/DashboardNextStepArea.test.jsx` (new)
- `client/src/dashboard/DashboardExactResumeProducer.test.jsx`
- `client/src/dashboard/DashboardIntegratedProgress.test.jsx`
- `client/src/dashboard/DashboardFinalVisualPilot.test.jsx`
- `client/src/progress/ProgressCompatibility.test.jsx`

Only this readiness document was appended beyond those product paths. Existing roadmap/scope document hashes remain unchanged from precheck.

### Verification and remaining scope blocker

- Targeted: **5 suites / 85 tests PASS**, including 22 new component cases and 3 App callback safety cases. Initial 17 component cases and later unmount guard case were observed RED before implementation/fix.
- Guidance/exact-resume/logout regression: **5 suites / 183 tests PASS**.
- Locale JSON/key/interpolation/duplicate verification: PASS.
- Full client: **109 suites passed / 1 failed; 1110 tests passed / 1 failed (1111 total)**. Sole failure: `client/src/progress/ProgressFinalVisualPilot.test.jsx:105`, test “keeps one service-owned recommendation when Assessment evidence is absent”. Its fixture at line 80 has id/topic/reason but neither lifecycle nor canonical target, while requiring the recommendation prose to remain visible. B01 correctly shows recovery instead. This file was NOT modified, pursuant to AMD2 section 10.
- Minimum further authorization: change only that success fixture to add `status: "active"` and `target: { page: "resources" }`; retain its assertions, response-owner count and other test intent. No backend/API/resolver dependency is indicated.
- Evidence build: PASS, process-only `REACT_APP_API_BASE_URL=https://pilot.invalid`; no .env edit. Source maps matched 124 local-source comparisons. `git diff --check`: PASS.
- First browser run found the existing native retry button at 42px. Fixed only the Dashboard-local selectors to enforce at least 44px and visible focus. Targeted tests, build and the entire browser matrix were rerun successfully after this CSS correction. The full-suite log predates only this final two-selector CSS correction; a fresh full run remains required after the fixture amendment. React act(...) warnings and Node fs.F_OK deprecation remain visible in logs, not concealed.

### Actual isolated evidence

Package: `C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01/`.

- `report.md`: complete 12-part implementation report and command inventory.
- `index.html`: gallery, clearly labeled ASTRA_REFERENCE / CURRENT_BEFORE / B01_CANDIDATE_AFTER; blocked acceptance status displayed.
- `verification.json`, `request-ledger.json`, `browser-results.json`, `motion-verification.json`, `screenshot-manifest.json`: machine-readable verification, hashes and ledger.
- `comparison/dashboard-{1440,390}-{before,after,astra-reference}.png`; `locales/{en,ms,zh-CN}-390.png`; `states/`.
- **183 capture records**, 0 browser-check failures. All 12 matrix states (owner unknown/error split) at 1440x900, 1024x768, 390x900 and 320x900 in EN/MS/ZH-CN. Additional keyboard/focus, Recommended-panel and 200% equivalent reflow captures. No document horizontal overflow; measured interactive controls at least 44px. Reduced-motion computed button transitions verified 0s and animation none.
- **1676 intercepted requests, 0 passive POST/PUT/PATCH/DELETE, 0 live API calls, 0 network continuations**. **36 explicit synthetic completion POSTs** exercise pending/failure/retry; no backend is contacted. Keyboard Continue produces only the exact synthetic GET `/api/scenario-attempts/9`. Anchor reveal, viewport, scroll, focus and family changes are non-mutating. All unknown/external requests abort; service workers blocked.
- Reference proof copies match verified v2.3 SHA256; before captures are inherited VIS1 evidence, not recreated or relabeled. After images are generated from the fresh local build. Sampled EN/MS/ZH-CN images were visually inspected; automated geometry does not constitute Owner aesthetic approval.

Limitations: synthetic fixtures do not prove live learner/DB state; external fonts blocked and fallback fonts used. The 200% test uses 720x450 CSS viewport at DPR 2 for 1440x900 physical pixels, not native browser-menu automation. Physical mobile/Safari and full accessibility certification remain outside this evidence. Existing floating CyberGuard control and surrounding Dashboard design remain unchanged. Owner review and full-client acceptance are still pending; no visual PASS or final acceptance claimed.

```text
PRODUCT SOURCE EDITS = 3 files
PRODUCT TEST EDITS = 5 files
CSS EDITS = 1 file
LOCALE EDITS = 3 files
BACKEND EDITS = 0
API EDITS = 0
GUIDANCE RESOLVER EDITS = 0
DB / MIGRATION MUTATIONS = 0
LIVE API CALLS = 0
PROVIDER CALLS = 0
COMMITS = 0
PUSHES = 0
DEPLOYMENTS = 0
PRODUCTION = NOT CERTIFIED
```

Stop at the preserved local candidate and explicit test-manifest blocker. Do not claim `PILOT-B01_OWNER_VISUAL_REVIEW_READY` until the authorized fixture correction and fresh complete acceptance checks pass.


## 13. PILOT-B01-AMD3 final local acceptance — 2026-09-25

**PILOT-B01_OWNER_VISUAL_REVIEW_READY** — LOCAL ENGINEERING + VISUAL EVIDENCE READY FOR OWNER REVIEW. UI/staging acceptance is not granted. **PRODUCTION = NOT CERTIFIED**.

AMD3 applied exactly the one-line success-fixture correction in `client/src/progress/ProgressFinalVisualPilot.test.jsx:80`: added active lifecycle and explicit Resource target. Prose, assertions, Progress expectations and ownership/count checks unchanged. No product source, CSS, locale or config edits from AMD3; all prior candidate changes and readiness history preserved.

Fresh verification, in the requested order: affected **1 suite / 4 tests PASS**; targeted **6 suites / 89 tests PASS**; regression **5 suites / 183 tests PASS**; locale PASS; full client **110 suites / 1111 tests PASS**; isolated build PASS with process-only API base https://pilot.invalid; git diff --check PASS. This full run includes the final 44px/focus CSS correction. Earlier RED logs are historical, not the current gate. React act(...) and Node deprecation warnings remain disclosed in logs.

All seven required product-facing SHA-256 values match before/final/previous capture. All 148 tracked non-test client files match AMD3 precheck. Fresh build entrypoint hashes match the capture build. Screenshot manifest and all 208 PNG hashes pass; browser/ledger/motion/inspection JSON unchanged. Reused **183 capture records**, regenerated **0**, per AMD3 reuse rule. Historical ledger remains 1676 intercepted requests, zero passive mutations/live calls/network continuations; 36 explicit synthetic completion POSTs are not backend writes. No new browser/API/provider calls from AMD3.

Evidence root: `C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01/`. Current `report.md` / `amd3-final-report.md`, `verification.json`, `amd3-integrity.json`, `amd3-exact-diff.patch`, `amd3-*.log`, `amd3-git-name-status.txt`, `amd3-git-stat.txt`, `git-final.txt`, and existing `index.html` gallery. Seven before/final hashes are tabulated in the report.

Branch/HEAD remain develop / b9baed034bd8af02d3b6863fc85515f77869097a. AMD3 test edits 1 file / 1 line; source/CSS/locale/backend/API/resolver/DB/migration/live API/provider/commit/push/deploy counts **0**. This document append is the only additional repository documentation change. Roadmap and scope hashes unchanged. Owner visual review remains required; synthetic local evidence does not certify production, physical devices, Safari or full accessibility. Stop here without commit, push or deployment.


## PILOT-B01-FULL1 — local execution (2026-09-25)
Owner-approved full composition; FULL1 attachment is the execution contract. Baseline: develop / c69528d1c5cc3f72d059fdde6c82b4ad05a0e5ec; tracked, untracked and staged counts zero. Local master irrelevant; no ref movement.

Function/anchor map: dashboard-overview → minimal header; dashboard-recommended-next-step / progress-recommendation → B01 illustrated action surface; dashboard-measured-progress / progress-overview → integrated My Progress heading/detail; dashboard-scenario-practice and dashboard-initial-assessment → integrated rows; progress-assessment-results / progress-learning-activity / progress-badges → real results, activity, expandable details; dashboard-quick-actions → final Resources/Scenarios/Talk paths and utilities; dashboard-daily-tip → upper-right Wellness Tip; dashboard-cyberguard-ai → explicit chat disclosure retaining first-message/history. Global nav/footer/launcher retained.

Test-impact pass: all Dashboard/Progress tests, plus directly rendering navigation/auth/home/profile/scenario/assessment/about/CyberGuard suites. Adapt old header/metadata/section directory/card order and single-percentage assertions, preserving auth, ownership, exact attempt, canonical target, uncertainty and mutation timing. Failing composition/shared-progress/shortcut/tip/inventory tests precede implementation. Then affected/contract/full-client, locale, isolated build, diff and full-page visual evidence. External evidence: PILOT-B01-FULL1 alongside B01; no old evidence overwritten. Production remains NOT CERTIFIED.


### FULL1 final local verification — 2026-09-25

**PILOT-B01-FULL1_OWNER_VISUAL_REVIEW_READY**. Owner visual approval is still required; authenticated staging acceptance is not inferred. **PRODUCTION = NOT CERTIFIED**.

Implemented full composition, not only the main card: concise approved three-language header; illustrated existing B01 action owner; shared scoped progress shortcut; stable entry/manual Wellness Tip; integrated My Progress/Scenario/Assessment/recent activity; final light exploration and explicit chat disclosure. Missing progress/Scenario counts remain unknown, not zero. Global shell and exact-resume/resolver/API/score behavior remain intact.

Final post-launcher-fix checks: targeted 13 suites / 121 tests PASS; contract/navigation/chat regression 9 suites / 279 tests PASS; full client 112 suites / 1127 tests PASS, zero skipped; locales/build/diff PASS. The final evidence-only build uses https://pilot.invalid. Existing React act, test-environment network console output and Node fs.F_OK deprecation are retained in logs. Initial failures and fixes are disclosed in report.md; no tests were skipped/deleted or timeouts increased.

50 fresh full-page candidate PNGs cover EN/MS/ZH-CN × 1440/1024/390/320, explicit Recommended, uncertainty/empty/multiple/duplicate/completion states, tips, expanded details/chat, stale locale/user sessions, keyboard, reduced motion and 200% viewport reflow (720×450 CSS at DPR2, not native menu zoom). Four historical reference/BEFORE images are clearly separated. Final capture checks include 44px control height, overflow, hit-testing, sticky-header focus offset, resize stability and narrow shortcut/launcher rectangle separation. The earlier overlap is preserved in launcher-overlap-red.log; only Dashboard shortcut CSS was adjusted, followed by fresh full validation and capture.

Final ledger: 360 intercepted requests, passive writes 0, live requests/provider calls/network continuation 0; two explicitly triggered synthetic completion requests; one explicitly triggered existing language-preference PUT was aborted rather than fulfilled or sent live. Synthetic GET results do not certify live backend side effects. Stale-user browser proof uses a fresh synthetic session after reload, with an old held response; automated App tests also check late prior-user isolation.

Evidence/review root: C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01-FULL1/. Transfer package: PILOT-B01-FULL1-review.zip; review/index.html, review/report.md, function-anchor-test-map.md, source-diff.patch, git-manifest.json, request-ledger.json, screenshot-manifest.json, tested-product-hashes.json and capture-build-hashes.json. Final hashes bind product source, build and actual PNGs. PNG bytes and relative gallery links are included; font binaries and sensitive files are excluded.

Scope: 6 product source files (3 new focused components), 11 test files (2 new), 1 Dashboard stylesheet, 3 locales, 3 existing docs; 0 binary assets. Fonts use repository fallback, not exact Astra typography. Activity title/reason fixture text stays identical English across locale captures; backend content translation, physical devices, native zoom, full accessibility and authenticated staging remain unverified. Next scope is Owner review and any specifically requested bounded corrections.

COMMITS / AMENDS / PUSHES / REF MOVEMENTS / DEPLOYMENTS / DB-MIGRATION-RAG MUTATIONS / PROVIDER CALLS / LIVE LEARNER REQUESTS / SMTP SENDS / DEPENDENCY INSTALLS = 0. No master publication retry or .git permission repair.

### FULL1-FIX1 bounded presentation correction — 2026-09-25

**PILOT-B01-FULL1-FIX1_OWNER_VISUAL_REVIEW_READY**. Full-page information architecture is retained; final UI and staging acceptance remain pending Owner review. **PRODUCTION = NOT CERTIFIED**.

Precheck matched all 24 existing uncommitted FULL1 paths/hashes, develop / c69528d1c5cc3f72d059fdde6c82b4ad05a0e5ec, staged count 0. Original evidence remains unchanged; submitted ZIP/report/manifests and their hashes are preserved separately as PRE_FIX1. The four supplied screenshots match the archived FULL1 PNG hashes.

V01 RED browser evidence showed the sr-only status had position:static / overflow:visible and no matching hiding rule. Dashboard-scoped descendant CSS now uses absolute 1px clipped geometry, preserving the existing accessible button name without a grid cell. Detailed error and Retry remain visible. V02 RED text-line rectangles showed the 390px loading Tip sentence intersecting the launcher. Narrow Dashboard Wellness Tip content now reserves 4.5rem inline-end space; the launcher, shared shell, chat architecture, content and full-page layout are unchanged. No global sr-only override.

FIX1 repository delta: dashboard/dashboard.css, dashboard/DashboardFullAstra.test.jsx, and this readiness append only (client paths under client/src/). DashboardProgressShortcut.jsx and all other FULL1 files are unchanged. Two semantic regressions preserve accessible loading/error names and visible detail recovery. The first added error test queried the wrong existing retry locale key; that test-authoring mistake is disclosed separately from the genuine browser RED defects.

Fresh focused 1 suite / 15 tests, targeted 13 / 123, contract regression 9 / 279, full client 112 / 1129: PASS, zero skipped. Locale verification, process-only https://pilot.invalid build and diff check PASS. No product edits after verification began. The evidence build must never be deployed.

73 corrected full-page captures recapture the 50-record matrix and extend three-language loading/error and 390/320 Recommended/missing states. 219 recorded initial/paragraph-aligned/control-aligned scroll samples check actual text Range rectangles, status computed styles/clipping, and compact arrow geometry. EN/MS/ZH-CN Continue/Recommended/loading/error are covered at 390/320; the wider matrix retains 1440/1024, keyboard/focus, reduced motion and 200% viewport reflow. Six full-page PNGs were visually inspected; all captures have automated checks. Physical devices, native menu zoom, screen-reader sessions and authenticated staging remain unverified.

GREEN ledger: 613 intercepted requests; network continuation / live API/provider requests / passive mutations = 0; two explicit synthetic completion requests and one explicit profile-language PUT aborted. RED requests are recorded separately. No live learner data, DB/migration, provider, SMTP, dependency, API/resolver/controller/scoring changes.

Evidence: C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01-FULL1-FIX1/. Self-contained PILOT-B01-FULL1-FIX1-review.zip includes corrected PNGs, relative review/index.html gallery, report, full accumulated source/diff/manifest, FIX1-only delta, RED/GREEN geometry, logs, request ledger, and source/build/PNG hashes. PRE_FIX1 images are explicitly historical. Next step is Owner review of these two corrections only. COMMITS / AMENDS / PUSHES / REF MOVEMENTS / DEPLOYMENTS / DB MUTATIONS / PROVIDER CALLS = 0.


### FULL1-POLISH1 local action affordance / content simplification — 2026-09-25

**PILOT-B01-FULL1-POLISH1_OWNER_VISUAL_REVIEW_READY**. Owner visual acceptance remains pending. **PRODUCTION = NOT CERTIFIED**.

Precheck: develop / 7f799bbf3ae0e1c875630716ec631217b6fbb04b, clean worktree/index, local origin/develop and origin/master matched. Fresh live remote query failed (GitHub 443 connectivity, exit 128); live refs remain unverified. This is local implementation only. All baseline product hashes matched accepted FIX1 evidence; eight historical full-page PNGs are explicitly PRE_POLISH1.

Real Continue actions now use equally prominent filled buttons with right-aligned aria-hidden arrows; recommendation primary CTA uses target-specific copy and the same decorative arrow structure. Continue/Recommended selector pills have no arrows. Existing exact targets, Saved practice numbering, guards, canonical validation, explicit viewed/completion timing and all data owners remain unchanged. No automatic or hover-arrow animation was introduced. A missing generic recommendation locale key found during focused verification was replaced with a Dashboard-local translated fallback.

Dashboard-only Assessment topic cards are removed. The optional progress-assessment-results anchor now targets the summary wrapper, preserving existing canonical section navigation. Overall available result/level, concise baseline and View assessment results remain. API payload, Assessment page, stored results, formula and scoring are untouched. Visible progress disclaimer and completed baseline are shortened in all three locales; Recent Activity removes its default description while retaining records and empty state. Detailed formula remains.

Repository delta: 4 product files (App.jsx, DashboardResumeSurface.jsx, DashboardNextStepArea.jsx, ProgressDetails.jsx), Dashboard CSS, 3 locale files, 5 directly affected Dashboard/Progress test files, and this append: 14 paths. No server/API/guidance/controller/semantics/dependency changes. Exact manifest/diff are in the external review package.

RED before implementation: 11 expected failures / 37 passes across 2 suites. First focused generic-key failure and first targeted legacy topic-card expectation are retained in logs. Final fresh focused 5 suites / 92 tests; targeted 13 / 134; contract regression 9 / 279; full client 112 / 1140: PASS, zero skipped. Locale/build/diff PASS. No tests deleted/skipped or timeouts raised. Existing warnings remain disclosed in logs. Final evidence build uses process-only https://pilot.invalid and must never be deployed; environment restored.

Visual evidence: 32 fresh full-page captures + 8 verified historical before images. EN 1440/390 Continue and Recommended; MS/ZH-CN 390 Continue/Recommended; completed Assessment summary in three mobile locales and EN desktop; recorded/empty activity; keyboard focus on a Continue CTA; long duplicate titles at three mobile locales plus EN 320. FIX1 loading/error hiding and reading-safe lane rechecked across EN/MS/ZH-CN at 390/320. Ninety-six sampled initial/paragraph-aligned/control-aligned scroll geometry records pass. Eight actual full-page PNGs visually inspected; all captures have automated arrow alignment, CTA/launcher, overflow and summary checks.

Ledger: 275 intercepted fixture/local-asset requests; mutation requests, network continuation, live backend/provider calls = 0. The floating launcher may cross decorative illustration/background (notably the 320 long-title case); checked CTA rectangles and Wellness text/control remain unobscured. This is not every scroll position/device certification. Real devices, native zoom, screen-reader and authenticated staging verification remain unperformed. External fonts blocked; repository fallback used. Synthetic recommendation/activity content remains English across UI locale captures.

Evidence root: C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01-FULL1-POLISH1/. Review ZIP: PILOT-B01-FULL1-POLISH1-review.zip. Includes relative full-page gallery, before/after PNGs, completed Assessment/three-language/keyboard captures, RED and verification logs, request ledger, exact source/diff, Git manifest and final source/build/PNG hashes. Previous FULL1/FIX1 evidence is preserved. Next step: Owner review of this bounded polish.

COMMITS / PUSHES / REF MOVEMENTS / DEPLOYMENTS / DB-MIGRATION-RAG MUTATIONS / PROVIDER CALLS / SMTP / LIVE LEARNER MUTATIONS / DEPENDENCY INSTALLS = 0. PRODUCTION = NOT CERTIFIED.

### FULL1-POLISH2 final Dashboard visual closeout (A+B+C) — 2026-09-25

**PILOT-B01-FULL1-POLISH2_OWNER_VISUAL_REVIEW_READY**. Owner visual acceptance remains pending. **PRODUCTION = NOT CERTIFIED**.

Precheck: develop / f92e5929673eb4f9dd6254f2fc380fd721cff9aa, clean worktree and empty index. Baseline client source and previous isolated build matched POLISH1 evidence hashes. Remote/staging state was not independently rechecked in this local-only task.

A: Continue activity rows use raised white surfaces, dark green text, brand borders, mint hover/stronger border and light-brand active state. Family selector pills and Recommended primary CTA retain their treatment. Existing aria-hidden arrows, accessible names, equal prominence, exact targets, Saved practice labels, guards and explicit mutation timing remain unchanged. B: Dashboard shell bottom padding is 3rem (48px) on desktop/tablet and 4rem (64px) at <=48rem, reduced from 6rem (96px).

C: Owner explicitly authorized a Dashboard-only footer right safe lane after pre-fix browser evidence showed Privacy Notice intersecting the fixed launcher at 1440/1024. dashboard.css uses .cy-app-shell:has(.dashboard-astra) > footer.cy-app-footer under min-width:601px to reserve 6rem inline-end. Shared AppFooter.jsx, navigation/shell.css, AppShell.jsx, links, launcher position/behavior/z-index and routes are unchanged. Shared mobile 5.5rem (88px) footer bottom clearance is retained.

Repository delta: client/src/dashboard/dashboard.css; client/src/dashboard/DashboardFinalVisualPilot.test.jsx; this append only. All other tracked client source files match baseline hashes. No JSX, API, server, guidance, exact-resume, formula, locale, dependency or configuration changes.

RED A+B: 2 expected failures / 19 passes; C: 1 expected failure / 21 passes. Actual pre-fix browser records show equal dark selected/row fills, 96px gap and Privacy Notice obstruction. Initial A+B verification was interrupted during full-client when C was approved; those partial logs are preserved separately and excluded from final counts. Fresh final A+B+C: focused 5 suites / 96 tests; targeted 13 / 138; regression 9 / 279; full client 112 / 1144, all PASS, zero skipped. Locale verification, process-only https://pilot.invalid build and diff check PASS. The isolated evidence build must not be deployed. Existing console warnings are preserved in logs.

Final visual evidence: 36 fresh full-page PNGs plus 8 bottom viewport supplements, covering EN 1440/1024/768/601/390/320, MS/ZH-CN 390, Continue/Recommended, keyboard focus, duplicate/long titles, completed/empty activity and three-language 390/320 loading/error. All 108 FIX1 text/reading-lane samples pass. Eight bottom checks verify zero text/link rectangle intersection with launcher, visible About/Privacy links, hit testing and trial-click actionability; no horizontal overflow. Actual footer gap is 48px or 64px. Hover changes remain light-brand. Ten AFTER images manually inspected. Forty original PNGs remain explicitly PRE_POLISH2; CSS-injected development probes are separately labelled and are not final evidence.

Ledger: 319 intercepted fixture/local-asset requests; POST/PUT/PATCH/DELETE, network continuation, live backend/provider calls = 0. No learner state, DB/migration, RAG or SMTP mutations. This is Chromium fixture evidence; native devices, screen readers, native zoom and authenticated staging remain unverified. Synthetic activity/recommendation content is English across UI locales. External fonts are blocked; repository fallbacks used. Launcher may overlap decorative illustration/background; sampled controls/text remain clear. This does not certify every content/scroll combination.

Evidence root: C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-B01-FULL1-POLISH2/. PILOT-B01-FULL1-POLISH2-review.zip contains relative HTML gallery, real PNGs, complete report, RED/GREEN logs, request ledgers, source/diff, build/source/PNG hashes and final Git status. Prior evidence is preserved. Next step: Owner visual review of A+B+C only.

COMMITS / PUSHES / REF MOVEMENTS / DEPLOYMENTS / DB MUTATIONS / PROVIDER CALLS = 0. PRODUCTION = NOT CERTIFIED.


## PILOT-SC01-AUDIT — Scenario Astra convergence audit

2026-09-25 — **PILOT-SC01-AUDIT_OWNER_REVIEW_READY**. Audit only; no implementation approval.

- Authority: develop / b41d6f286afe507bf6d444f61ad8b1bfc680d3b7; initial worktree clean and index empty. Dashboard ACCEPTED/CLOSED, untouched.
- S1 Library **POLISH**; S2 Briefing **POLISH**; S3 Active Decision, S4 Feedback/Ready, S5 Result **RECOMPOSE**. Preserve existing lifecycle/ownership/exact-resume/canonical result.
- Evidence: 47 current full-page + 10 bottom viewport + 12 reference PNGs; 51 frozen reference hashes verified. 5 Scenario suites / 52 tests PASS; locales PASS. Existing accepted build reused only after source/asset hash verification; no fresh build.
- Findings include library error rendered as empty, oversized hierarchy/metric parity, missing success feedback focus/live semantics, missing result fallback notice, sampled launcher/control/text/footer intersections. No visual acceptance claimed. External fonts blocked; fixture text English with MS/ZH fallback.
- Request ledger: 185 intercepted; 16 explicit SYNTHETIC_INTERACTION_ONLY writes; passive/live writes and network continuations = 0. No live learners/DB/providers.
- Recommended first slice: SC01-I01 Library compact orientation + truthful recovery. Proposal only; scope/files/tests/gates and all five preservation maps in report.
- Evidence/report/gallery: `C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/PILOT-SC01-AUDIT/REPORT.md`, `review/index.html`, `PILOT-SC01-AUDIT-review.zip`; full inventory/ledger/hash manifests alongside.
- Product/CSS/locale/test/backend edits = 0. Only this readiness append; no commit/push/deploy/ref movement. **PRODUCTION = NOT CERTIFIED.**


### SC01-I01-PERSIST1 — persistent orange recommendation candidate, verification blocked

2026-09-26 — **SC01-I01-PERSIST1_VERIFICATION_BLOCKED**. Not OWNER_VISUAL_REVIEW_READY; no UI acceptance. **PRODUCTION = NOT CERTIFIED**.

Precheck: develop / d88677cbe5dbe3164f8c5be15224a354879de288, local origin/develop and origin/master matched, clean worktree/index. I01 accepted composition is unchanged. Product delta only in Scenario CSS: `.recommended` now owns orange border/top strip on white; `.highlighted:focus` retains green focus only. App.jsx, canonical endpoint, recommendation authority, refresh/completion flow, exact-resume, guards, filters, mutation timing, locale and backend are unchanged. No new persistence or ranking.

TDD valid RED: two expected CSS failures / six existing behavior protections pass. Original RED fixture typo and correction are preserved. GREEN focused: 8 pass (16 unrelated cases excluded by focused name filter); Scenario targeted: 5 suites / 66 pass; relevant regressions: 9 / 179 pass; locale PASS. One fresh full-client run failed: Test Suites: 1 failed, 111 passed, 112 total; Tests:       1 failed, 1157 passed, 1158 total; Time:        491.872 s. Exact failures/source hashes: external full-client-failures.json. No retries, failing-suite reruns, timeout changes, skipped/deleted assertions or unrelated fixes.

Per PERSIST1 section 15 STOP, fresh evidence build and AFTER browser capture were not run. Four genuine BEFORE full-page PNGs (EN1440, EN390, MS390, ZH-CN390) are retained, with build/source provenance matching the published baseline. They are not evidence of the CSS fix. BEFORE ledger: all requests intercepted; no mutations/live API/network continuation. The historical I01 timing watch item remains documented; current failure root cause is not established.

Evidence: C:/Users/AsusT/.codex/visualizations/2026/09/24/01a0d487-d6fa-7ab3-9d0b-964e20805f29/SC01-I01-PERSIST1/REPORT.md; SC01-I01-PERSIST1-blocked-evidence.zip. Candidate CSS, two Scenario test files and this readiness append are the only changed paths. Need separately authorized runtime investigation before completing fresh build and requested visual review package. No commit/push/deploy/ref movement/DB/provider/RAG/dependency changes. PRODUCTION = NOT CERTIFIED.
