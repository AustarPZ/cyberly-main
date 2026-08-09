# Staging Configuration Contract

**Status:** Managed database baseline accepted; application hosting and runtime remain unprovisioned.

Provisioned infrastructure currently includes the `cyberly.my` domain, Cloudflare authoritative DNS, and an Aiven MySQL 8.4 staging database in Singapore. Render frontend/backend services, application DNS records, and the external staging runtime have not been provisioned.

## Intended Architecture

```text
Browser
  -> https://app.example.com
  -> https://api.example.com
  -> Managed MySQL
  -> OpenAI
  -> SMTP
```

Replace the example application origins only after the owner approves the frontend/backend hosting and application DNS records.

## Frontend Build Environment

```env
REACT_APP_API_BASE_URL=https://api.example.com
```

This value is public and is embedded into the React bundle. No backend secret may enter the frontend build environment.

## Backend Public Configuration

```env
NODE_ENV=production
PORT=<platform-provided-or-approved-port>
CLIENT_ORIGIN=https://app.example.com
CLIENT_BASE_URL=https://app.example.com
SESSION_COOKIE_SAMESITE=lax
EMAIL_TRANSPORT=smtp
DB_SSL_MODE=required
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Backend Secret Store

Configure these through the selected hosting platform's runtime secret store, never through the React build or committed files:

```text
DB_HOST
DB_PORT
DB_NAME
DB_USER
DB_PASSWORD
SESSION_SECRET
OPENAI_API_KEY
SMTP_HOST
SMTP_PORT
SMTP_SECURE
SMTP_USER
SMTP_PASSWORD
EMAIL_FROM_ADDRESS
DB_SSL_CA
```

Production requires `DB_SSL_MODE=required`, a non-empty managed database CA in `DB_SSL_CA`, and `DB_SSL_REJECT_UNAUTHORIZED=true`. `DB_SSL_CA` accepts inline multiline PEM text or PEM text containing literal `\n` sequences; the escaped-newline form is recommended for Render secret entry. `DB_SSL_CA_FILE` is not supported. Local development may keep TLS disabled.

## Managed MySQL Primary-Key Policy

Aiven staging enforces `sql_require_primary_key=ON` for newly created tables, including temporary tables under MySQL 8.4. Cyberly migrations must define a semantically appropriate primary key for every base or temporary table. Do not disable this managed-database policy as a standard deployment or migration procedure.

## Session Contract

- Production cookies are `secure` and `httpOnly`.
- Sibling `app` and `api` subdomains use `SameSite=lax` by default.
- `CLIENT_ORIGIN` remains the exact credentialed CORS origin.
- Express must remain behind an HTTPS-aware reverse proxy compatible with `trust proxy = 1`.
- Authentication and refresh recovery require staging browser verification before learner invitation.

## PB-OPS-2B Remaining Owner Decisions

Before staging deployment, the owner must select:

1. Frontend hosting provider.
2. Node backend hosting provider.
3. Application subdomain plan and staging naming convention.
4. Whether Gmail SMTP remains the bounded-Beta sender.
5. Expected Beta learner count and approximate usage.
6. Whether staging is public or access-restricted.
7. Render egress and the resulting Aiven inbound-network restriction.

## Explicit Local Staging Commands

Local staging operations use a private `server/.env.staging.local` copied from `server/.env.staging.example`. The private file is Git-ignored and must never be committed or shared. Store `DB_SSL_CA` as inline PEM or escaped-newline PEM so the certificate does not need to appear in command history.

Use this read-only command to inspect migration state:

```powershell
npm --prefix server run staging:migrate:status
```

The wrapper loads the staging file explicitly, validates only the database and verified-TLS contract, and invokes an explicit command allowlist. Migration status, migration execution, bounded content verification, and deterministic RAG ingestion require their dedicated package commands; the wrapper cannot run `db:ensure`, the server, or arbitrary commands. A failed TLS, authentication, DNS, network, migration-status, or content-verification check is a stop condition.

After all migrations are applied, use the read-only content verifier before and after an explicitly authorized RAG ingestion:

```powershell
npm --prefix server run staging:verify-content
npm --prefix server run staging:rag:ingest
npm --prefix server run staging:verify-content
```

The verifier runs a fixed set of `SELECT` queries and does not expose a generic SQL interface. RAG ingestion reads only published, approved, RAG-ready Resource translations, performs deterministic local chunking, and writes only the RAG document and chunk tables. It does not call an AI provider or embedding service. Do not run ingestion when pre-ingestion verification reports unexpected existing or partial RAG data.
