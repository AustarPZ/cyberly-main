# Cyberly Owner Staging Convergence R3 Implementation Plan

## R4-01 governance record — 2026-10-05 Asia/Kuala_Lumpur

**R3_OWNER_STAGING_ACCEPTANCE = PASS**
**R3 = CLOSED / FROZEN**
**CYBERLY_R3_STAGING_ACCEPTED_BASELINE = f76195d76fd44be5f1bed5e0ef7b33dd997f449b**

This section is the canonical R3 closure and Post-R3 frontier record. It supersedes the execution status of the historical plan below and the earlier blocked `R3-EXECUTION-REPORT.md`, not their retained evidence. Historical checkboxes are not current pending authorization. Do not resume the old implementation/deployment instructions. R4-01 was independently reviewed and accepted by Control Tower on 2026-10-05. This record does not authorize later R4 tasks or any production action.

### Authority and evidence provenance

Project Owner / Control Tower supplied final staging acceptance and the evidence below in the R4-01 instruction. These are accepted historical results, not fresh deployment, database, browser or provider checks by this documentation task. Read-only GitHub authority was independently checked on 2026-10-05: remote `develop` = remote `master` = the baseline SHA above. Accepted commit: `f76195d`, `test(resources): align reader workspace width contract`.

| R3 gate | Accepted state |
| --- | --- |
| Implementation / local verification / Git promotion | COMPLETE / COMPLETE / COMPLETE |
| Staging Web / API deployment | LIVE / VERIFIED, both at accepted SHA |
| Staging DB backup | PASS |
| RF01 migration 033 / RF01 staging | APPLIED / PASS |
| Guest acceptance / authenticated final acceptance | PASS / PASS |
| Owner staging acceptance | PASS |
| Production | UNTOUCHED / SUSPENDED / NOT CERTIFIED |

| Deployment | Service ID | Accepted deploy ID |
| --- | --- | --- |
| cyberly-staging-web | srv-d9tj5hu5djic73a0auk0 | dep-davth4rtqb8s73dohbdg |
| cyberly-staging-api | srv-d9tiop942hec738b3org | dep-davtgkrtqb8s73doflk0 |

Both accepted deploys were LIVE at `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`; `/api/health` = PASS. Final full client: **118/118 suites, 1412/1412 tests PASS**; the earlier execution report also records this final local run.

Staging backup: `cyberly-staging-20261003-000012Z.sql.gz`, **118061 bytes**; checksum sidecar `cyberly-staging-20261003-000012Z.sql.gz.sha256`; SHA-256 comparison **MATCH / PASS**. Persistent custody: `backups/private/`. No backup contents or secrets are included here; the instruction supplied a match result, not the checksum value.

`033_repair_verified_resource_sources.sql` = **APPLIED**; post-migration status **001–033 applied**. RF01: old CSA URL HTTP 404; replacement HTTP 200:

<https://www.csa.gov.sg/our-programmes/cybersecurity-outreach/cybersecurity-campaigns/the-unseen-enemy-campaign/beware-of-phishing-scams/>

Staging `/api/resources/phishing` returns that replacement. Actual headed-browser Reader `View external source` click reached it; title `Beware of Phishing Scams | Cyber Security Agency of Singapore`, H1 `Beware of Phishing Scams`: PASS.

Authenticated final acceptance: Dashboard, Profile, Settings, Initial Assessment, CyberGuard conversation workspace, Resources, Reader and Phishing external source = PASS. Desktop, mobile, EN, BM and zh-CN = PASS. CyberGuard route `#/ai-chat`: New Chat, history, existing conversations, safety / AI guidance, desktop layout, mobile history opener, mobile layout and no horizontal overflow confirmed. No live AI message was sent; no provider budget/call was consumed. This is not Gemini, ILMU or live-provider readiness certification.

### Frozen baseline and production boundary

The named baseline is the latest accepted version completing local verification, Git promotion, Web/API deployments, DB migration, RF01 live verification, guest/authenticated staging acceptance and Owner acceptance. Future work must not silently redefine it. Every new development belongs to R4+.

R3 can reopen only with **NEW MATERIAL DEFECT EVIDENCE affecting the accepted baseline**. Feature requests, improvements, AI runtime expansion, content expansion, UX iteration and technical debt do not reopen R3.

Legacy production `cyberly` (`srv-d9eg6prrjlhs73ccogu0`) and `cyberly-api` (`srv-d9efesn41pts73er8q6g`) remain SUSPENDED / NOT CERTIFIED. No unsuspend, deploy, modification, migration or promotion is authorized. Staging acceptance does not certify production.

### Post-R3 program and authorized frontier

| Phase | Program authority |
| --- | --- |
| R4 | Platform Baseline & Operational Hardening |
| R5 | Live AI Runtime & Provider Governance |
| R6 | Resource / Scenario / RAG Expansion |
| R7 | Learning Intelligence & Adaptive Experience |
| R8 | Quality / Security / Accessibility Hardening |
| R9 | User Evaluation & Evidence |
| R10 | Production Certification — OPTIONAL / OWNER AUTHORIZATION REQUIRED |
| R11 | Capstone Final Freeze & Delivery |
| R12+ | Post-Capstone Product Expansion |

**Current execution frontier: R4 PLATFORM BASELINE.**
**Next major technical frontier after R4: R5 LIVE AI RUNTIME.**

R4 entries are scope references only, not implementation authorization:

- R4-01: R3 Formal Closure + Baseline Freeze — this docs-only record; independently reviewed and accepted by Control Tower on 2026-10-05.
- R4-02: Accepted Release Baseline / Recovery Reference.
- R4-03: Dependency Audit.
- R4-04: Known Warning / Maintenance Debt Classification; examples awaiting classification: Node DEP0176 `fs.F_OK` and Scenario App.jsx `useEffect` dependency warning.
- R4-05: Staging Operations Runbook covering deploy, rollback, DB backup, migration/status, health verification, Render recovery, staging smoke verification, secret handling and incident response.

R4-02 through R4-05 and R5+ are not implemented by R4-01. No runtime, schema, migration, provider, environment or deployment change is part of this task. Control Tower owns independent review, Gate decision and commit/push authorization; Codex stops at local documentation and diff verification.

---

## Historical R3 implementation plan (retained evidence)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** Deliver the Owner's Auth/navigation/age/RF01/UI-V2 requirements together with the accepted Account Center candidate to staging.cyberly.my for direct Owner acceptance.

**Architecture:** Keep one linear integration branch/worktree based on Auth V2 commit `27972d7`. First freeze the already-reviewed Account Center candidate, then apply independent bounded commits for Auth/main-page, age, RF01, Resource Reader, Assessment and CyberGuard. Push each completed task to `origin/develop`; promote exact final `develop` to `master` only after whole-branch verification, because Render staging-web tracks master with autoDeploy disabled.

**Tech Stack:** React/CRA/Jest, Express/Node, MySQL migrations, Render staging, i18next.

**Spec:** `docs/superpowers/specs/2026-10-02-owner-staging-convergence-r3-design.md`

## Global Constraints
- Registration/account age = integer 1–99 inclusive.
- 13–17 remains target-audience emphasis only, never registration eligibility.
- Preserve all existing security/verification/privacy/guardian/provider/business semantics unless the spec explicitly changes them.
- RF01 exact restored hashes must be verified before integration; migration executes only through governed staging migration runner after backup.
- No production deployment/reactivation.
- No page-wide mobile FAB right lane.
- One heavy task at a time.
- No live provider calls.
- Every product change uses RED→GREEN.
- Final full-client only after all implementation tasks, with browser/server closed.

## Review Focus
- Age 0/100/decimal bypass at frontend/backend/account edit.
- Route/logo/back behavior differences for guest vs authenticated top-level/nested pages.
- Signup Step 1 vs Steps 2–7 secondary switch/action placement.
- Mobile FAB overlap after removing/restructuring Auth/Reader/Assessment/CyberGuard surfaces.
- RF01 staging DB state vs source commit: migration must be proven applied, not inferred.

---

### Task 1: Freeze Account Center V2 candidate

**Files:**
- Product/test allowlist = existing Account Center candidate under `client/src/**` only.
- Evidence/docs remain uncommitted unless required by project convention.

**Interfaces:**
- Produces distinct `#/profile` and `#/settings`, `AccountCenterShell`, `AccountCenterViews`.
- Later Task 3 consumes age controls via Account Center context.

- [ ] Verify baseline HEAD `27972d7`, empty index, final report OWNER_REVIEW_READY.
- [ ] Re-run final focused Account Center suite and locale verifier only if source changed since latest PASS; otherwise verify hashes/status against final evidence.
- [ ] Stage only Account Center product/tests/locales/CSS; exclude review-evidence/control prompts.
- [ ] `git diff --cached --check`; verify no server/package/lock paths.
- [ ] Commit `feat(account): separate profile and settings`.
- [ ] Push exact commit to `origin/develop` only.
- [ ] Record commit SHA in execution ledger.

### Task 2: Auth + top-level navigation corrective

**Files likely:**
- Modify `client/src/App.jsx`
- Modify `client/src/auth/AuthBrandPanel.jsx`
- Modify `client/src/auth/AuthAccessHelp.jsx`
- Modify `client/src/auth/AuthExperienceShell.jsx` if needed
- Modify `client/src/auth/authExperience.css`
- Modify `client/src/auth/auth.css`
- Modify `client/src/i18n/locales/{en,ms,zh-CN}.json`
- Modify relevant Auth/About/navigation tests.

**Interfaces:**
- Preserves Auth API and seven-step registration state machine.
- Produces corrected desktop/mobile shell consumed by Task 3 age fields.

- [ ] Add RED tests for: About no top-level Back; Auth no entry Back; desktop brand logo enlarged/centered; mobile brand omitted; no repeated Welcome hierarchy; no form Privacy link; static help heading absent; compact Login register switch; Signup sign-in switch Step1 only; Back left/Continue right on Steps2–7.
- [ ] Run focused RED and preserve output.
- [ ] Implement minimal structural/CSS/copy changes.
- [ ] Run GREEN focused Auth/About/navigation tests.
- [ ] Run locale verifier.
- [ ] Production build with process-local staging-invalid API base.
- [ ] Local CDP visual matrix desktop 1440/1024, mobile 390/320, EN/BM/ZH representative, all Signup steps route/CTA checks.
- [ ] Commit `fix(auth): refine entry experience and top-level navigation`.
- [ ] Push exact commit to `origin/develop`.

### Task 3: Age eligibility contract 1–99

**Files likely:**
- Modify frontend age constants/validation in `client/src/App.jsx`
- Modify Account Center age input/controller as needed
- Modify `server/src/auth/validation.js`
- Modify `server/src/account/account.validation.js`
- Modify age-policy tests: client Profile/Auth and `server/scripts/test-age-policy.js`
- Modify age eligibility/privacy/helper locale copy.
- Review `server/src/ai/ai.prompts.js` and `ai.learnerContext.js`; change only if known learner ages outside 13–17 are misrepresented.

**Interfaces:**
- Accepts integer 1–99 registration/account updates.
- Age-group mapping remains child/teen/young_adult/adult.

- [ ] RED tests: 0,100,-1,1.5 reject; 1,12,13,17,18,24,25,99 accept; frontend min/max=1/99; server registration/account match.
- [ ] Run RED frontend + server age tests.
- [ ] Implement minimal cross-layer constants/messages.
- [ ] Remove 13–17 eligibility/helper wording while retaining target-audience language where descriptive.
- [ ] Verify known learner age/ageGroup is not overwritten by static 13–17 AI context; if current source is wrong, add RED then fix.
- [ ] GREEN frontend/server age tests + Account Center/Profile focused tests.
- [ ] Locale verifier + build.
- [ ] Commit `fix(account): support learner ages one through ninety-nine`.
- [ ] Push exact commit to `origin/develop`.

### Task 4: Integrate and validate RF01 source repair

**Files:**
- Add exact restored `server/migrations/033_repair_verified_resource_sources.sql`
- Add exact restored `server/scripts/test-resource-source-repair.js`
- Modify exact restored `server/scripts/test-migration-foundation-unit.js`

**Interfaces:**
- Produces committed migration 033 and source repair test; final deployment executes it on staging DB.

- [ ] Verify all three accepted SHA-256 values before staging.
- [ ] Run migration foundation unit + source repair unit/preflight.
- [ ] Ensure diff contains exact restored bytes only.
- [ ] Commit `fix(resources): repair verified external source metadata`.
- [ ] Push exact commit to `origin/develop`.
- [ ] Do NOT execute staging migration until Task 8 deployment gate.

### Task 5: Resource Reader V2

**Files likely:**
- Modify `client/src/resources/ResourceReaderPage.jsx`
- Modify `client/src/resources/resources.css`
- Add/reuse focused section-navigation component if needed within resources/design-system.
- Modify focused Reader tests/locales.

**Interfaces:**
- Preserve API/source/related Scenario/view/completion semantics.
- Desktop section nav + mobile On-this-page.

- [ ] Open recovered Astra v2.3 Reader reference before editing.
- [ ] RED tests for desktop section nav, mobile collapsible On-this-page, active section/scroll behavior, no permanent sidebar under mobile breakpoint, source/related-scenario preservation.
- [ ] Implement minimal V2 layout and section behavior.
- [ ] GREEN Reader/resources/navigation tests.
- [ ] Locale + build + CDP desktop/mobile visual matrix.
- [ ] Commit `feat(resources): introduce reader v2 workspace`.
- [ ] Push exact commit to `origin/develop`.

### Task 6: Initial Assessment V2

**Files likely:**
- Modify Assessment UI in `client/src/App.jsx` and assessment CSS/components/tests/locales.

**Interfaces:**
- No scoring/attempt/save/submit contract changes.
- Produces distinct Pending/In-progress/Completed visual states.

- [ ] Open recovered Astra assessment/result reference before editing.
- [ ] RED tests for one consolidated completed result, compact pending state, in-progress question-first hierarchy, preserved lifecycle handlers.
- [ ] Implement layout/component extraction as needed without changing backend semantics.
- [ ] GREEN Assessment + guarded-activity scoped tests.
- [ ] Locale + build + CDP states at desktop/mobile.
- [ ] Commit `feat(assessment): align initial assessment v2 hierarchy`.
- [ ] Push exact commit to `origin/develop`.

### Task 7: CyberGuard V2

**Files likely:**
- Modify CyberGuard page/component/CSS/tests/locales.
- Reuse existing chat/history/action components; no provider/client API changes.

**Interfaces:**
- Preserve chat history, provider boundary, learner-action proposal confirmation, mobile navigation-close behavior.

- [ ] Open recovered Astra chat reference before editing.
- [ ] RED tests for compact header, conversation-first workspace, secondary expandable AI guidance, mobile compact topbar, preserved action confirmation/navigation behavior.
- [ ] Implement V2 layout only.
- [ ] GREEN CyberGuard/chat/action/navigation scoped tests.
- [ ] Locale + build + CDP desktop/mobile fixtures; no live provider.
- [ ] Commit `feat(cyberguard): introduce conversation-first v2 workspace`.
- [ ] Push exact commit to `origin/develop`.

### Task 8: Whole-branch verification, staging DB, promotion and deployment

**Files:** no product edits unless final review finds a Critical/Important issue; any fix requires RED→GREEN and its own commit.

- [ ] Fresh `origin/develop` read and exact branch status.
- [ ] Final scoped client/backend suites across changed domains.
- [ ] One serial full-client run with no browser/server in parallel.
- [ ] Safe backend suite including auth/account/profile/resource/migrations/privacy/guardian/assessment/chat/actions.
- [ ] Locale verifier + production build + `git diff --check`.
- [ ] Fresh whole-branch code review. Fix Critical/Important once under TDD; rerun affected + final gate.
- [ ] Staging DB: run migration status; run existing backup check and governed backup; verify backup success.
- [ ] Execute `staging:migrate` through existing runner; verify 033 recorded.
- [ ] GET staging phishing API: new CSA URL/label required; public destination HTTP 200.
- [ ] Fast-forward `origin/master` to exact verified `origin/develop` commit.
- [ ] Manual Render deploy staging-web and staging-api to exact final commit. Production untouched.
- [ ] HTTP 200 web + API health.
- [ ] Fresh guest staging matrix: Home/Resources/About/Auth/Signup/Reader/Assessment public surfaces as applicable.
- [ ] Owner/manual authentication if required for protected staging re-acceptance; never inspect credentials/tokens.
- [ ] Authenticated staging: Profile/Settings, Resource Reader, Assessment, CyberGuard; no provider generation unless separately authorized.
- [ ] Append final release record to Project SoT after fresh revision guard.
- [ ] Final state: `OWNER_STAGING_ACCEPTANCE_READY`; stop for Owner direct acceptance.
