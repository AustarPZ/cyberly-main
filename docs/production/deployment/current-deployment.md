# Current Deployment

Cyberly is deployable as a static React frontend plus a persistent Express backend with managed MySQL.

**Deployment status note:** Local development remains the primary engineering mode. The external staging environment is provisioned with Render frontend/backend services, Cloudflare authoritative DNS, and an Aiven MySQL 8.4 database in Singapore. This staging baseline does not certify a production deployment or public launch.

## Current Accepted Split Staging State

**2026-10-05 / R5-03B — CONTROL TOWER REVIEW = PASS; TECHNICAL STAGING INTEGRATION = PASS; FINAL CLOSURE = PENDING PERSISTENCE VERIFICATION.** The R5-03A corrected harness is PERSISTED / API STAGING INTEGRATED. This acceptance does not establish live provider HEALTH_PASS or production readiness.

**CURRENT_STAGING_WEB_SHA = 91a052736dda7d37c05ac315e9738b4c29937622**

**CURRENT_STAGING_API_SHA = 65733d13ba50bbb085d1cbd491176f029a894e66**

| Authority | Accepted current state |
| --- | --- |
| Web | srv-d9tj5hu5djic73a0auk0; dep-db1kkcegekts73e9r6ug; LIVE at CURRENT_STAGING_WEB_SHA; accepted R4 baseline retained; not deployed in R5-02A or R5-03B |
| API | srv-d9tiop942hec738b3org; dep-db1qequgekts73f1ase0; LIVE at CURRENT_STAGING_API_SHA; R5-03A corrected harness PERSISTED / API STAGING INTEGRATED; R5-03B PASS |
| Node | 24.21.0 both accepted deployed runtimes; Web accepted build evidence retained; API build 24.21.0 and running-instance v24.21.0 verified |
| API integration | R5-03B Render Linux build PASS; npm --prefix server ci PASS; server start PASS; build Node24.21.0; running-instance HEAD matches CURRENT_STAGING_API_SHA; /api/health HTTP200; prior R5-02A resource/native checks retained as historical evidence |
| Inert Gate | Running-instance r5-03a-v1; node server/scripts/ai-provider-live-gate.js without --execute and without AI_LIVE_GATE_AUTHORIZED=1; NOT_AUTHORIZED; test/auth/health not_tested; logicalCallsAuthorized/Actual, transportAttemptsAuthorized, transportInvocationsActual and actualOutboundAttempts all 0; retryCount0, unexpectedDuplicateAttempt false |
| DB | CATEGORY 0 — NO DATABASE CHANGE; fresh 1160b07780eb1cba5b6fe7a609311c901f1a0900 to 65733d13ba50bbb085d1cbd491176f029a894e66 server/migrations and client deltas NONE; no backup, migration, restore or DB mutation; no Web deployment |
| API configuration | branch master; autoDeploy OFF; rootDir empty / repository root; build npm --prefix server ci; start npm --prefix server start; health GET /api/health; unchanged |
| Environment boundary | No NODE_VERSION override, AI_LIVE_GATE_AUTHORIZED key, linked environment group or new secret file added by R5-02A; secret values not exposed |
| Immutable R4 baseline | Annotated r4-platform-baseline-2026-10-05 still peels to 91a052736dda7d37c05ac315e9738b4c29937622; API-only R5-02A advancement does not move this tag |
| Frozen master / R3 recovery | f76195d76fd44be5f1bed5e0ef7b33dd997f449b; R3 tag unchanged; no new baseline tag |
| Provider certification | OpenAI = ADAPTER_PRESENT / AUTH_VALID by Control Tower for exact R5-03 event; HEALTH_PASS HOLD / NOT ESTABLISHED; Gemini and ILMU = ADAPTER_PRESENT only; CHAT_PASS / TOOL_NORMALIZATION_PASS / PRODUCTION_READY NO |
| External effects | R5-03B provider calls OpenAI/Gemini/ILMU 0 / 0 / 0; SMTP0; no DB change; production UNTOUCHED; acceptance persistence performs no new deployment or Render mutation |
| Next Gate | R5-03B accepted, pending final persistence verification by Control Tower; any later bounded live provider call requires separate Owner authorization; no additional provider request authorized here |

The current staging split is intentional: R5-03B integrates the corrected harness on API only; client and migrations are unchanged and Web retains the R4 baseline. This documentation persistence performs no deployment, restart or Render configuration change. Final R5-03B closure remains Control Tower authority.

### Historical R5-02A acceptance context (preserved)

**2026-10-05 / R5-02A — Control Tower: PASS_WITH_ACCEPTED_OBSERVABILITY_LIMITATION.** R5-02A_TECHNICAL_STAGING_INTEGRATION = PASS; R5-02_HARNESS_STAGING_READY = YES. This records accepted staging integration, not live provider certification or production readiness. R5-02A final persistence verification remains Control Tower authority.

The staging split is intentional: R5-02A advances API staging only, with no client change and no Web deployment. The R4 immutable platform baseline and historical R4 acceptance below remain unchanged. A documentation push to develop must not trigger deployment, restart or Render configuration changes.

**ACCEPTED_NONBLOCKING_OBSERVABILITY_LIMITATION:** A supplemental current-instance error-log query encountered Render logging backend 503 / upstream 502 and was not retried. Successful build logs, start logs, LIVE deploy record, running-instance proof, HTTP smoke and inert Gate verification were independently available. **FULL_POST_START_ERROR_LOG_SCAN = NOT_AVAILABLE_DUE_RENDER_LOG_BACKEND_ERROR**; this does not establish absence of every possible runtime warning. No full post-start error-log scan PASS is claimed.

### R5-03 Control Tower reviewed live result

R5-03 executed exactly one OpenAI logical call / one transport invocation / one outbound attempt under R5-03-OWNER-20261005-OPENAI-01, gpt-5.4-mini, runtime candidate 1160b07780eb1cba5b6fe7a609311c901f1a0900, timestamp 2026-10-05T11:03:35.945Z. No retry or second invocation; Gemini/ILMU 0, SMTP 0; no deployment/configuration change. Raw result remains INVALID_HEALTH_RESPONSE / authState unknown / healthState fail. Control Tower accepts execution/call accounting/reachability and independently establishes OPENAI_AUTH_VALID = PASS from the completed official provider response, safe response/request IDs and usage; OPENAI_HEALTH_PASS = NOT ESTABLISHED / HOLD. R5-03-F01 diagnostics insufficient and R5-03-F02 auth-valid assignment coupled to strict health success are CONFIRMED; exact failed predicate remains UNDETERMINED_FROM_PRESERVED_OUTPUT. Estimate US$0.00004125 is below US$0.01 allowance; invoice unknown. See [canonical R5-03 result](../../ai/provider-live-result-r5-03.md). Three-document persistence is pending final Control Tower verification; no new provider calls or R5-03A implementation authorized.

## Historical R4-06 Accepted Staging Runtime Baseline

**2026-10-05 / R4-06 — Control Tower: PASS_WITH_ACCEPTED_SCOPE_LIMITATION.**

**CYBERLY_R4_STAGING_RUNTIME_ACCEPTED_BASELINE = 91a052736dda7d37c05ac315e9738b4c29937622**

| Authority | Accepted current state |
| --- | --- |
| Web | srv-d9tj5hu5djic73a0auk0; dep-db1kkcegekts73e9r6ug; LIVE at the exact baseline SHA |
| API | srv-d9tiop942hec738b3org; dep-db1kimdg1s2s73akmku0; LIVE at the exact baseline SHA |
| Node | 24.21.0 via root .node-version; Web build and API build/runtime verified |
| Web acceptance | PASS_WITH_KNOWN_ACCEPTED_WARNINGS; page load / representative guest UI PASS |
| API acceptance | Render Linux install and bcrypt LOAD / HASH / COMPARE PASS; health, resource API and phishing resource HTTP 200 |
| DB | 001–033 accepted historical state; R4-06 migration delta NONE; CATEGORY 0 — NO DATABASE CHANGE; no migration performed |
| Service configuration | Both branches master; autoDeploy OFF; rootDir empty / repository root; unchanged |
| Frozen Git master / R3 recovery | f76195d76fd44be5f1bed5e0ef7b33dd997f449b; r3-staging-accepted-2026-10-03 unchanged |
| R4 baseline tag | r4-platform-baseline-2026-10-05 must be annotated and point to the runtime baseline SHA, not the later documentation commit |
| Production | SUSPENDED / NOT CERTIFIED; R10 and explicit Owner authorization required |
| Live providers | NOT CERTIFIED; AI provider calls 0; SMTP 0; no live-provider authorization |
| Authenticated R4-06 smoke | NOT_RUN_BY_SCOPE / ACCEPTED_LIMITATION; deferred to a separately authorized authenticated Gate |

The accepted R4 runtime was deployed by exact commit. Service branches remain master while Git master remains the frozen R3 baseline; documentation persistence on develop must not redeploy or change service configuration.

Successful login establishes/saves a MySQL-backed session; authenticated /api/auth/me also saves the session. Such checks would create/update staging session records and violate R4-06 zero-DB-mutation authorization. Control Tower does not require authenticated smoke for R4-06 because the exact runtime delta changes neither auth/account source nor migrations. Runtime risks were covered by Linux dependency installation, mysql2-backed health/resource paths, Node build/runtime, native bcrypt, API startup/health, Web build/load, guest smoke and prior accepted full local/client/server regressions. Authenticated session behavior was not freshly exercised on this runtime; a later authenticated staging Gate requires explicit bounded test-session DB-write authorization. This is an accepted scope limitation, not a failed test.

No backup, migration, restore or staging DB mutation was authorized or performed by R4-06. DB state above is accepted historical authority, not a new DB inspection. No provider AUTH_VALID, HEALTH_PASS, CHAT_PASS, TOOL_NORMALIZATION_PASS or PRODUCTION_READY state is established by this phase.

R4_REPOSITORY_AND_OPERATIONS_BASELINE_READY = PASS. R4_STAGING_RUNTIME_INTEGRATION_ACCEPTED = PASS_WITH_ACCEPTED_SCOPE_LIMITATION. R4_PLATFORM_BASELINE_LOCKED = PENDING FINAL CONTROL TOWER PERSISTENCE VERIFICATION. Final R4 closure is not declared here.

Older PB-OPS sections below are historical acceptance records and do not override this current-state section. See the [staging runbook](staging-operations-runbook.md) for operational boundaries.

## Current Shape

- Frontend: build `client/` as static React assets.
- Backend: run `server/server.js` as a Node web service.
- Database: MySQL with migrations applied from `server/migrations/`.
- Sessions: HTTP-only cookies stored in the MySQL-backed session table.
- AI: backend-only provider gateway. Provider keys must not be exposed to the frontend.

## Build and Start Commands

Frontend build:

```powershell
npm --prefix client run build
```

Root build delegates to the official frontend:

```powershell
npm run build
```

Backend start:

```powershell
npm --prefix server start
```

Database setup:

```powershell
npm --prefix server run db:ensure
npm --prefix server run migrate
```

RAG Resource ingestion, when needed for a CyberGuard RAG demo:

```powershell
npm --prefix server run rag:ingest
```

## Required Runtime Configuration

The backend needs production values for:

- `CLIENT_ORIGIN`
- `SESSION_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_SSL_MODE=required`, a non-empty `DB_SSL_CA`, and `DB_SSL_REJECT_UNAUTHORIZED=true`
- AI provider keys only when live AI generation is enabled

The frontend needs:

- `REACT_APP_API_BASE_URL`

Do not put backend secrets in frontend variables.

## Render-Oriented Prototype Reference

The current repository can be deployed as a Render Static Site for `client/` and a Render Web Service for `server/`, but this is a prototype deployment reference rather than the final production hosting decision.

Static site:

- Build command: `npm --prefix client ci && npm --prefix client run build`
- Publish directory: `client/build`

Backend:

- Start command: `npm --prefix server start`
- Configure backend environment variables in Render.
- Run database bootstrap/migration commands from a trusted deployment operation.

## Operational Notes

- `CLIENT_ORIGIN` must exactly match the deployed frontend origin.
- Cross-origin cookies require HTTPS and correct `SameSite`/secure cookie behavior.
- `server/server.js` trusts the hosting proxy with `app.set('trust proxy', 1)`.
- `GET /api/health` checks database connectivity.
- `server/.env` is local-only and must not be committed.

## Staging Deployment Contract

The recommended staging shape is:

```text
Browser
  -> https://app.example.com
  -> https://api.example.com
  -> Managed MySQL
  -> OpenAI
  -> SMTP
```

Sibling frontend and API subdomains are same-site even though they are different origins. The recommended session setting is `SESSION_COOKIE_SAMESITE=lax`; production cookies remain `secure` and `httpOnly`, and Express retains `trust proxy = 1`. Deployments using unrelated sites must explicitly evaluate whether `SameSite=none` is necessary and then verify browser cookie behavior.

The frontend build environment contains only public values such as `REACT_APP_API_BASE_URL=https://api.example.com`. Database credentials, `SESSION_SECRET`, `OPENAI_API_KEY`, and SMTP credentials belong only in the backend runtime secret store.

See [Staging Configuration Contract](staging-configuration-contract.md) for the non-secret deployment template and rehearsal boundary.

## PB-OPS-2A Acceptance Record

**PB-OPS-2A - Production Configuration Guard:** ACCEPTED.

- PB-OPS-2A PRODUCTION CONFIG GUARD - ACCEPTED
- PB-OPS-2A SESSION SECRET HARDENING - PASSED
- PB-OPS-2A ORIGIN VALIDATION - PASSED
- PB-OPS-2A DATABASE CONFIG VALIDATION - PASSED
- PB-OPS-2A SMTP CONFIG VALIDATION - PASSED
- PB-OPS-2A AI CONFIG VALIDATION - PASSED
- PB-OPS-2A FRONTEND API CONFIG GUARD - PASSED
- PB-OPS-2A FAIL-FAST STARTUP - PASSED
- PB-OPS-2A SECRET AUDIT - PASSED
- PB-OPS-2A FULL REGRESSION - PASSED

PB-OPS-2A did not itself certify deployment. Subsequent operational phases provisioned and verified the external staging frontend and backend, application DNS, backend health, staging SMTP and OpenAI paths, browser cookie/CORS behaviour, and bounded learner acceptance. These staging results do not certify production readiness or complete the final Public Beta Go / No-Go review.

## PB-OPS-2B-3B Managed Staging Database Acceptance

**PB-OPS-2B-3B - Managed Staging Database Baseline:** ACCEPTED.

Infrastructure evidence:

- Aiven MySQL staging is provisioned in the Singapore region on MySQL 8.4.
- Verified TLS connection and database authentication passed.
- Aiven inbound networking remains temporarily broad pending the Render egress and network-access decision.

Migration evidence:

- A fresh migration rehearsal completed successfully.
- Migration `012` initially failed because MySQL 8.4 applies `sql_require_primary_key` to temporary tables. Its three staging tables now use semantic natural primary keys.
- The Aiven primary-key policy remains enabled.
- All 27 migrations are applied, with zero pending migrations.
- `db:ensure` was not used against Aiven staging.

Content evidence:

- Initial Assessment verification passed: 12 questions across four topics.
- Scenario verification passed: eight definitions, 24 steps, and 72 options.
- Resource verification passed: nine published Resources, including six approved RAG-eligible Resources.
- Accepted English, Bahasa Melayu, and Simplified Chinese content coverage passed.

RAG evidence:

- Deterministic ingestion passed without an AI provider, embedding call, or provider cost.
- The resulting index contains 18 documents and 90 chunks.
- Duplicate document identities, orphan chunks, and missing eligible translations are all zero.
- A second ingestion retained 18 documents and 90 chunks, confirming runtime idempotency.

This acceptance certifies only the managed staging database, migration-seeded content, and deterministic RAG baseline. It does not certify Render deployment, backend runtime, application DNS records, staging SMTP or OpenAI, browser CORS/cookie behaviour, external learner acceptance, or production deployment.

## PB-OPS-3D Operational Readiness Closure

**PB-OPS-3D-2 Independent Logical Backup:** ACCEPTED.

**PB-OPS-3D Operational Readiness:** CLOSED.

**Closure date:** 2026-08-13.

**Final Public Beta Go / No-Go:** PENDING.

**Production readiness:** NOT CERTIFIED.

- The staging health endpoint passed.
- All 27 migrations remained applied.
- Content verification passed with the accepted Assessment, Scenario, Resource, and RAG counts.
- MySQL 8.4.11 backup tooling passed its verified-TLS prerequisite check.
- One independent staging logical backup completed at 89,806 bytes, and its SHA-256 companion was independently verified.
- Both private artifacts remained Git-ignored and untracked; their SQL content was not inspected.
- The backup operation read Aiven data but did not perform migrations, RAG ingestion, restore, or learner-data mutation.
- Recovery remains a separate-target procedure: never import a logical backup over the only staging database.
- Aiven continuity was owner-verified: the Hobbyist MySQL service is Running, paid continuity and billing-group assignment are configured, connection identifiers are unchanged, and managed full backups are present in `do-sgp1`.
- Manual login, authenticated refresh persistence, protected-route access, logout, and removal of protected access passed.
- Fork service is disabled under the current Hobbyist service state. This does not block closure because managed backups and the independently verified logical backup are both present.
- Accepted residual risks are the open Aiven IP allowlist, single-node Hobbyist availability, and a separate-target recovery rehearsal still required before final production Go / No-Go.

See [Public Beta Backup and Recovery](../operations/public-beta-backup-recovery.md) for the canonical backup, retention, privacy, and recovery procedure.
