# Current Deployment

Cyberly is deployable as a static React frontend plus a persistent Express backend with managed MySQL.

**Deployment status note:** Local development remains the primary engineering mode. The external staging environment is provisioned with Render frontend/backend services, Cloudflare authoritative DNS, and an Aiven MySQL 8.4 database in Singapore. This staging baseline does not certify a production deployment or public launch.

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
