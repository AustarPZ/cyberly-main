# Staging Operations Runbook

**R4-05 Staging Operations Runbook was independently reviewed and accepted by Control Tower on 2026-10-05 (Asia/Kuala_Lumpur).** This acceptance validates the document as the combined staging operational reference. It does not itself authorize deployment, migration, backup, restore, provider calls or production action. R4-05 repository and operations readiness is PASS under the subsequent Control Tower R4-06 ruling. R4-06 runtime integration is accepted with the scope limitation below; final baseline persistence verification remains with Control Tower. This document describes future operations; writing or reading it authorizes no deploy, migration, backup, restore, provider call or production action. Codex executes only explicitly authorized scope; Control Tower independently reviews evidence and Gate decisions; Project Owner authorizes external operations and production actions. R4-01/02/03/03A/04/04A closure is Owner / Control Tower supplied authority. R4-05 does not self-close.

## 1. Current authority: read before operating

| Authority | Current accepted value (2026-10-05 / R4-06) | Operational meaning |
| --- | --- | --- |
| Repository | C:/Users/AsusT/Documents/Codex/cyberly-main-ui-v2-account-center-r1 | Canonical workspace; preserve it and its evidence |
| Local branch | ui-v2-account-center-r1 | Branch name alone is not release authority |
| Accepted R4 runtime candidate / pre-persistence develop | 91a052736dda7d37c05ac315e9738b4c29937622 | CYBERLY_R4_STAGING_RUNTIME_ACCEPTED_BASELINE; later docs-only develop commits do not change deployed runtime authority |
| Frozen origin master / R3 recovery baseline SHA | f76195d76fd44be5f1bed5e0ef7b33dd997f449b | CYBERLY_R3_STAGING_ACCEPTED_BASELINE; changes require separately Owner-approved promotion |
| Recovery tag | r3-staging-accepted-2026-10-03 | Must peel to the full R3 SHA above; do not move, delete or force-update |
| Repository Node authority | Root .node-version = 24.21.0 | Persisted repository authority; selected by accepted R4 Web/API builds |
| Current accepted staging Node | 24.21.0 via root .node-version | R4-06 Web build and API build/runtime VERIFIED |
| Staging DB | 001–033 applied; 033_repair_verified_resource_sources.sql APPLIED; RF01 PASS | Accepted historical state; recheck before future operations |
| Legacy production | cyberly / cyberly-api: SUSPENDED / NOT CERTIFIED | Requires separate R10 Production Certification and explicit Owner authorization |

Current runtime authority reflects Control Tower accepted R4-06 evidence. DB 001–033 remains accepted historical state; R4-06 performed no DB inspection/mutation or migration. R3 recovery authority is unchanged. Local remote-tracking refs can be stale; use fresh remote refs before action.

| Staging target | Web | API |
| --- | --- | --- |
| Name | cyberly-staging-web | cyberly-staging-api |
| Service ID | srv-d9tj5hu5djic73a0auk0 | srv-d9tiop942hec738b3org |
| URL | https://staging.cyberly.my | https://api-staging.cyberly.my |
| Source branch / autoDeploy | master / OFF | master / OFF |
| Accepted deployed SHA | 91a052736dda7d37c05ac315e9738b4c29937622 | 91a052736dda7d37c05ac315e9738b4c29937622 |
| Accepted deploy ID | dep-db1kkcegekts73e9r6ug | dep-db1kimdg1s2s73akmku0 |
| rootDir | empty / repository root | empty / repository root |
| Build | npm --prefix client ci && npm --prefix client run build | npm --prefix server ci |
| Start / publish | client/build | npm --prefix server start |
| Health | Page load / scope smoke | GET /api/health |

R4 develop includes governance closure, recovery reference, dependency audit, server dependency remediation, maintenance register and the Node pin. Runtime-impacting files include server/package.json, server/package-lock.json and .node-version. **The exact R4 runtime candidate above is deployed and accepted by R4-06 with an accepted authenticated-smoke scope limitation.** Service branches still track master with autoDeploy OFF; exact-commit deployment does not promote Git master. Develop/master divergence is intentional; never automatically reconcile, promote or deploy it.

## 2. Canonical references and historical-document limits

- [R3 governance and acceptance](../../superpowers/plans/2026-10-02-owner-staging-convergence-r3.md): read the current closure section; historical implementation/deployment instructions are not reusable authorization.
- [R3 recovery reference](r3-staging-accepted-recovery-reference.md): immutable reference, accepted deploy IDs, safe source reconstruction and recovery Gates.
- [Public Beta Backup and Recovery](../operations/public-beta-backup-recovery.md): canonical backup tooling, custody, retention and separate-target restore procedure. This runbook coordinates those operations rather than replacing that procedure.
- [Current Deployment](current-deployment.md), [Configuration Contract](staging-configuration-contract.md), [Deployment Roadmap](deployment-roadmap.md), [Deployment/Operations Architecture](../architecture-specification/07-deployment-and-operations.md), [System Overview](../architecture/system-overview.md), [Security Boundary](../security/public-beta-security-boundary.md): implementation/configuration context. Earlier 027-migration, unprovisioned-staging and proposed-infrastructure descriptions are historical/target guidance; they do not override section 1 or authorize generic db:ensure, RAG ingestion, live chat or production steps.
- [Dependency Audit](../dependency-audit-r4-03.md) and [Maintenance Register / R4-04A](../maintenance-debt-r4-04.md): accepted characterization, later remediation/pin evidence and residual debt. Do not infer current dependency status from older audit versions alone.

No equivalent combined staging operations runbook was found. The requested docs/security and docs/architecture directories are absent; their relevant equivalents are under docs/production/security, architecture and architecture-specification. This is the single combined staging operational reference; the specialized backup/recovery authorities remain canonical.

## 3. State and approval model

| State | Evidence required; no implied next state |
| --- | --- |
| CODE_PRESENT | Exact implementation/configuration exists at the candidate |
| LOCAL_VERIFIED | Appropriate checks passed for that exact candidate/environment |
| REMOTE_PERSISTED | Exact commit/files confirmed on the intended remote ref |
| STAGING_DEPLOYED | Intended service reached LIVE at the authorized exact SHA |
| STAGING_VERIFIED | Runtime, health and scope acceptance evidence passes |
| OWNER_ACCEPTED | Explicit Owner acceptance of the verified staging candidate |
| PRODUCTION_CERTIFIED | Separate R10 review/certification and explicit Owner production authorization |

A develop commit is not equivalent to deployed, staging accepted or production accepted. A deploy request/build success is not LIVE; LIVE alone is not STAGING_VERIFIED. Owner authorization must name candidate, services, intended configuration, DB scope, permitted smoke side effects and rollback scope. Review approval is not an implicit live-provider or production authorization.

## 4. Mandatory preflight and STOP gate

Complete this record before any future staging deployment:

1. Read fresh remote develop/master/tag object and peeled refs; compare the approved expected values. Verify recovery tag identity, not just its name.
2. Record full candidate SHA, source branch, parent/lineage and reviewed delta from currently deployed SHA. No unreviewed merge or branch-tip substitution.
3. Record tracked working tree/index state; require clean candidate or explicitly reviewed differences. Preserve unrelated untracked evidence; never clean it to satisfy preflight.
4. Name exact target service IDs, Web/API scope and approved order. Query current deploy IDs/SHA and service branch, autoDeploy, rootDir, build/start/publish/health configuration read-only.
5. Compare server/migrations between deployed and candidate code; record exact pending DB migrations and classify section 6. Runtime data writes can raise risk even without schema changes.
6. Decide whether a fresh DB backup is required; record decision/exception and approved private custody. A historical backup is not automatically adequate for a new migration.
7. Review secrets/config delta privately, public frontend API base and backend origin/session/TLS contract; report presence or approved safe values only. Do not copy secrets or dump env.
8. Verify exact Node selection, root discovery and higher-precedence overrides; link exact candidate test evidence, native dependency/platform coverage and known debt.
9. Record safe rollback SHA/reference and schema/data/API/Node compatibility, including mixed-version deployment intervals.
10. Obtain explicit Owner authorization and required Control Tower Gate for candidate/services, migration list, backup/restore scope and bounded verification. Recheck refs/config immediately before action.

**STOP** if refs/tag/lineage, service target, deployed SHA, configuration, candidate identity or approval unexpectedly differs. STOP on ambiguous DB target, extra pending migration, failed backup/checksum/TLS, unreviewed secret change, wrong Node, missing required test evidence, unsafe rollback compatibility, failed build/start/health/smoke or missing authorization. Preserve evidence, choose HOLD and report; do not silently reconcile or widen scope.

Read-only Git pattern (run in the canonical repo; compare values, do not fetch/reset automatically):

~~~powershell
git ls-remote origin refs/heads/develop refs/heads/master refs/tags/r3-staging-accepted-2026-10-03 'refs/tags/r3-staging-accepted-2026-10-03^{}'
git rev-parse HEAD
git log -1 --format='%H%n%P%n%s'
git status --short
git diff --cached --name-only
git diff <DEPLOYED_SHA> <AUTHORIZED_CANDIDATE_SHA> -- server/migrations
~~~

## 5. Node runtime selection and proof

[Render precedence](https://render.com/docs/node-version): **NODE_VERSION > .node-version > .nvmrc > package.json engines**. Root .node-version is the single exact repository authority: **NODE24_CURRENT_AUTHORITY = 24.21.0**. R4-04A found no service NODE_VERSION and zero workspace environment groups; this is dated evidence, so recheck direct and inherited overrides before future deployment through filtered/redacted read-only inspection.

Both services must retain repository-root discovery. For the R4 candidate, acceptance requires Web build log and API build log showing **Using Node.js version 24.21.0**, plus independent API runtime evidence for **24.21.0** from authorized runtime/log inspection. Capture only the safe version, not process environment. A build log alone does not prove API runtime; absence of runtime evidence means HOLD. Do not add a public diagnostics endpoint or expose process.env just to obtain proof.

If selected version differs, STOP acceptance; do not silently accept Render default, change the pin, add NODE_VERSION or auto-update. **NODE25_PLUS = SEPARATE_COMPATIBILITY_GATE_REQUIRED** due to Node24-bounded DEP0176/CRA debt. Future Node24 patches require fresh official release/security review and scoped compatibility validation, not an alias/floating range. The historical R3 runtime used default24.14.1; current accepted R4 staging uses 24.21.0. An approved recovery to R3 must review its own code/runtime compatibility rather than assume the R4 pin exists in R3.

## 6. Database classification, backup and migration

| Category | Examples / required decision | Authorized execution boundary |
| --- | --- | --- |
| 0 — NO DATABASE CHANGE | Docs/client-only, dependency-only, Node pin or non-schema runtime change **when reviewed delta proves no DB transformation** | No migration. Record backup-not-required rationale; routine precautionary backup still requires authorization |
| 1 — FORWARD-SAFE MIGRATION REQUIRED | Exact numbered migration list, reviewed compatibility | Fresh backup + independent checksum, status before/after, only approved pending list, affected content/runtime checks |
| 2 — DATA TRANSFORMATION / HIGH-RISK DB CHANGE | Destructive/incompatible schema or data transformation, difficult rollback | Separate approved recovery/rollback plan, rehearsal and explicit write/restore scope; no generic automatic execution |

**Git rollback is not DB rollback.** Migration/restore needs explicit scope authorization independently of deployment. A Category 0 label is not proof if code actually transforms persistent data.

Canonical implementations: server/scripts/backup-staging-mysql.js, server/scripts/migrate.js, server/scripts/run-with-staging-env.js and server/src/database/migration-runner.js. Wrapper command family: backup:check, backup, migrate:status, migrate. Use the explicit staging package entry points below, not generic local db:ensure/migrate against an ambiguous environment. Private staging configuration is server/.env.staging.local; server/.env remains local and unchanged.

Private backup custody: **C:/Users/AsusT/Documents/Codex/cyberly-main-ui-v2-account-center-r1/backups/private/**. Known accepted backup: **cyberly-staging-20261003-000012Z.sql.gz**, **118061 bytes**, previous independent checksum MATCH / PASS. It has not been restore-tested; do not infer that it contains the accepted post-migration 001–033 state. Report only filename, size, UTC timestamp and checksum status; digest is non-secret but unnecessary to routine reports. Never inspect/share SQL contents, credentials or learner data as evidence.

For an explicitly authorized migration deployment:

1. Privately confirm the exact staging service/database target and standard DB_NAME=cyberly; verify it is neither TEST nor production. NODE_ENV=production is required by the staging wrapper and **does not establish target identity**. The wrapper validates config/TLS, not an independently proven service identity; ambiguous target means STOP.
2. Confirm approved migration delta, compatible app rollout and backup/recovery plan. Run backup prerequisite check, then fresh backup **before migration**, unless the exact approved change explicitly proves and authorizes a no-backup exception.
3. Independently compute SHA256 and compare with the sidecar; require nonzero file size and MATCH. Preserve private backup. Failed checksum/backup means STOP.
4. Run migration status, record exact applied/pending filenames, and compare pending list to approved list.
5. Execute only that approved scope through the staging runner. **Current CLI runs all pending migrations; it exposes no per-file/through selector.** Proceed only when its complete pending list exactly equals the approved list at the fixed candidate. If extra/unapproved migrations exist, STOP for a separately reviewed bounded mechanism; do not invent a CLI flag, hand-run SQL or mutate files.
6. Run status again; require approved migrations applied and no unexpected state. On partial failure, STOP and preserve status/evidence; do not rerun blindly or pretend SQL transactions guarantee universal rollback.
7. Verify API health, affected endpoints/content and any required runtime compatibility after the approved rollout. Preserve sanitized migration evidence; never infer success from deployment alone.

Future commands only; **none is executed by R4-05**:

~~~powershell
npm --prefix server run backup:staging:check
npm --prefix server run backup:staging
# Independent metadata/checksum verification before continuing.
npm --prefix server run staging:migrate:status
# STOP unless complete pending list exactly matches authorized list.
npm --prefix server run staging:migrate
npm --prefix server run staging:migrate:status
# Read-only content check only when included in approved scope:
npm --prefix server run staging:verify-content
~~~

For private checksum verification, use the [canonical integrity procedure](../operations/public-beta-backup-recovery.md#integrity-verification). Restore only to a separately confirmed isolated recovery target under its own authorization; never import over the only staging DB. Preserve original DB, verify restored status/content and application compatibility before any Owner-approved cutover. Do not automatically ingest RAG or run seed/bootstrap commands.

## 7. Deployment order and execution

Choose and record order from compatibility evidence: **API first when Web depends on a new backend contract**; Web first only when backend is already backward-compatible and approved scope explicitly supports it. Tightly coupled changes require an approved order and explicit old/new Web/API/schema compatibility, including the intermediate mixed state. No universal Web-first rule. An incompatible interval requires an approved maintenance strategy, not improvised deploys.

| Sequence | Web procedure | API procedure |
| --- | --- | --- |
| 1 | Confirm exact authorized SHA and service ID; verify expected Node, branch/root/build/publish/public API base | Confirm exact authorized SHA/service ID; classify DB; backup/migrate only with separate authorization and compatible order; verify Node/branch/build/start |
| 2 | Trigger only the explicitly authorized manual deploy to exact SHA | Trigger only the explicitly authorized manual deploy to exact SHA |
| 3 | Wait for actual LIVE, record deploy ID and deployed commit; inspect build logs and exact Node/build completion | Wait for actual LIVE, record deploy ID and commit; inspect build/runtime logs, exact Node and start result |
| 4 | Load staging URL; representative guest/authenticated smoke as approved; responsive/EN/BM/zh-CN checks if affected | GET /api/health 200; affected API smoke; auth/session checks if relevant; no provider checks unless separately authorized |
| 5 | Record outcome, errors/debt and scope evidence; hold acceptance on mismatch | Record outcome, errors/debt and scope evidence; hold acceptance on mismatch |

Both services currently track master with autoDeploy OFF. A develop push does not deploy. Future operations must use a platform-supported exact-commit deployment with verified lineage, or a separately Owner-approved promotion/config change; neither is automatic authority from this runbook. If the chosen mechanism cannot target/prove the authorized SHA, STOP. Do not deploy an uncontrolled branch tip. No branch/config change, restart, retry or production action is implied by a failed deploy.

## 8. Acceptance, providers and evidence packet

After any runtime-affecting staging deployment, require exact authorized SHA on each intended service, Render LIVE, expected exact Node build/runtime, API /api/health HTTP200 and Web page load, with no unexpected 500s, startup crashes or build failures. Add scope-specific checks:

| Scope | Required bounded smoke |
| --- | --- |
| Auth/account | Login, signup, profile/settings, refresh/session, logout as relevant using approved controlled accounts; account writes/emails need explicitly permitted test scope |
| Resources | Resource API, reader and external source link; no content publishing/mutation implied |
| CyberGuard | Shell/workspace/history without sending a live provider message |
| Assessment/scenario | Affected smoke only; no destructive/new learner attempt or progress mutation without authorization |
| UI/layout/locales | Affected desktop/mobile and EN/BM/zh-CN routes |

**Current R4 authorizes no live providers.** Provider states remain independent: ADAPTER_PRESENT, AUTH_VALID, HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS, PRODUCTION_READY. API deployment proves none automatically. Generic deploy includes no AI test call, automatic failover or SMTP send. A provider or signup/email smoke requiring external effects must have separate explicit authorization; otherwise use non-provider scope and record the limitation.

Capture a sanitized packet: full candidate SHA, source branch/parent/lineage, target service, deploy ID, timestamp/timezone, exact Node, build/start/health result, migration before/after if applicable, private backup metadata/checksum status if applicable, configuration presence/approved safe values, scope verification, known warnings, unexpected errors, rollback reference/compatibility and final decision/reviewer. Keep credentials/private data outside packets. Decisions: **PASS**, **PASS_WITH_ACCEPTED_DEBT** (name existing disposition), **HOLD**, **ROLLBACK_REQUIRED** (recommendation; execution still needs authorization). No failed required acceptance check can be hidden as accepted debt.

## 9. Rollback and incident safety

1. Halt acceptance/escalate on incident; record deployed IDs/SHA, time, safe error category and current DB state. Preserve workspace, failed artifacts and evidence; any write pause/maintenance/config change needs authorized scope.
2. Determine schema, data, Web/API contract and Node compatibility of the proposed known-safe commit. Primary reference: r3-staging-accepted-2026-10-03 -> f76195d76fd44be5f1bed5e0ef7b33dd997f449b. Reverify remote tag; a later migration can make this ref unsafe.
3. If compatibility or DB recovery is uncertain, **STOP**. Git code rollback does not reverse DB changes. Obtain an approved code/DB recovery plan and deployment order.
4. With explicit rollback authorization, redeploy the known-safe exact commit to named staging service(s); verify LIVE/commit/runtime/health and bounded smoke anew. Never rewrite master/tag or force-push as a substitute for redeploy.
5. If DB restore is required, follow the separately authorized isolated-target recovery procedure; preserve the affected DB until recovery acceptance. Record residual data-loss/session implications privately.

Following the 2026-10-01 recursive-deletion incident, routine recovery **must not prescribe git clean, git reset --hard, rmdir /s /q, rd /s /q, del /s or Remove-Item -Recurse -Force**. Preserve current evidence; use an authorized fresh clone/new worktree in a verified unused path, exact commit/tag and independent verification, following the [recovery reference](r3-staging-accepted-recovery-reference.md). Do not delete old installations/evidence for tidiness. Render outages/config drift require read-only diagnosis and a new decision; never unsuspend/restart/redeploy automatically.

## 10. Secrets and production firewall

Never log/report DB password or URI, Render token, session secret, SMTP credentials, OpenAI/Gemini keys, ILMU credentials or other secrets. Report KEY_PRESENT YES/NO, or explicitly approved non-secret values such as NODE_VERSION. Inspect linked env groups as well as service overrides using a filtered/redacted mechanism. Do not dump full environments, print server/.env or private staging files, copy staging secrets to production, expose backend secrets in Web bundles, or include SQL/private learner data in evidence.

Legacy production services cyberly (srv-d9eg6prrjlhs73ccogu0) and cyberly-api (srv-d9efesn41pts73er8q6g) remain **SUSPENDED / NOT CERTIFIED**. No staging operation authorizes resume, deploy, secret copy, production migration, restore or automatic promotion. Production requires separate **R10 PRODUCTION CERTIFICATION** and explicit Project Owner authorization; staging acceptance cannot substitute.

## 11. R4 integration requirement and final Gate semantics

Control Tower independently reviewed R4-06 on 2026-10-05: technical deployment PASS; staging runtime integration PASS_WITH_ACCEPTED_SCOPE_LIMITATION. The separately authorized exact candidate 91a052736dda7d37c05ac315e9738b4c29937622 is LIVE on Web dep-db1kkcegekts73e9r6ug and API dep-db1kimdg1s2s73akmku0. API acceptance preceded Web deployment. Render Linux dependency installation/native bcrypt, Web Node24.21.0 build/load, API Node24.21.0 build/runtime/start, health HTTP200 and bounded non-provider/guest representative smoke passed. No unexpected NODE_VERSION override or service configuration drift was found.

R4-04A accepted local evidence: Node24.21.0/npm11.19.0 clean installs, build, 118 suites/1412 tests, server production audit0, safe tests, bcrypt/load checks and locales PASS. Keep W05 YAML invalid peer, CRA, DEP0176, Scenario lint and unused import under the existing maintenance dispositions; this runbook repairs none.

| Gate | Current Control Tower ruling |
| --- | --- |
| R4_REPOSITORY_AND_OPERATIONS_BASELINE_READY | **PASS** |
| R4_STAGING_RUNTIME_INTEGRATION_ACCEPTED | **PASS_WITH_ACCEPTED_SCOPE_LIMITATION** |
| R4_PLATFORM_BASELINE_LOCKED | **PENDING FINAL CONTROL TOWER PERSISTENCE VERIFICATION** |

Authenticated smoke: **NOT_RUN_BY_SCOPE / ACCEPTED_LIMITATION**, not required for R4-06 and deferred to a separately authorized authenticated Gate. MySQL session creation/saving and authenticated /api/auth/me session saving would write staging records, conflicting with zero-DB-mutation authorization. The exact R4 runtime delta changes neither auth/account source nor migrations; runtime risks were covered by Linux install, mysql2 health/resource paths, Node/native/API/Web/guest evidence and prior accepted regressions. Residual limit: authenticated session behavior on this staging runtime was not freshly exercised. Test it before a later authenticated staging Gate with explicit bounded test-session DB-write authorization.

Fresh exact f76195d76fd44be5f1bed5e0ef7b33dd997f449b -> 91a052736dda7d37c05ac315e9738b4c29937622 diff under server/migrations/ has no file changes: final **CATEGORY 0 — NO DATABASE CHANGE**. No backup, migration, restore or staging DB mutation was authorized or performed by R4-06. No DB command is permitted during this documentation persistence.

R4 baseline reference: annotated **r4-platform-baseline-2026-10-05** must point exactly to the accepted runtime SHA above, not the later documentation commit. The R3 recovery tag remains r3-staging-accepted-2026-10-03 -> f76195d76fd44be5f1bed5e0ef7b33dd997f449b. Current R4 staging runtime and R3 recovery are separate authorities.

AI provider calls 0; SMTP 0; LIVE_PROVIDER_AUTHORIZATION = NO; production remains SUSPENDED / NOT CERTIFIED and untouched. R4-06 establishes no provider AUTH_VALID, HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY certification. R5 live-provider staging certification and R10 production certification require their own authorization and evidence.

This persistence ends at **R4-06_PERSISTED_READY_FOR_FINAL_CONTROL_TOWER_VERIFICATION**. No new deployment, Render mutation, DB command, backup, restore, provider call or production action is authorized. Do not self-declare R4-06 CLOSED, final R4 closure or R4_PLATFORM_BASELINE_LOCKED.
