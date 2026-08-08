# Staging Configuration Contract

**Status:** Preparation contract only. No hosting provider or external infrastructure has been selected or provisioned.

## Intended Architecture

```text
Browser
  -> https://app.example.com
  -> https://api.example.com
  -> Managed MySQL
  -> OpenAI
  -> SMTP
```

Replace the example origins only after the owner approves the staging domain and providers.

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
```

`DB_SSL_MODE`, `DB_SSL_CA`, and `DB_SSL_REJECT_UNAUTHORIZED` depend on the selected managed MySQL provider. Keep certificate verification enabled for the final configuration.

## Session Contract

- Production cookies are `secure` and `httpOnly`.
- Sibling `app` and `api` subdomains use `SameSite=lax` by default.
- `CLIENT_ORIGIN` remains the exact credentialed CORS origin.
- Express must remain behind an HTTPS-aware reverse proxy compatible with `trust proxy = 1`.
- Authentication and refresh recovery require staging browser verification before learner invitation.

## PB-OPS-2B Owner Decisions

Before staging deployment, the owner must select:

1. Frontend hosting provider.
2. Node backend hosting provider.
3. Managed MySQL provider.
4. Domain and subdomain plan.
5. Whether a custom domain is available.
6. Staging naming convention.
7. Whether Gmail SMTP remains the bounded-Beta sender.
8. Expected Beta learner count and approximate usage.
9. Whether staging is public or access-restricted.
