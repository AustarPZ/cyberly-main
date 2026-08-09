# Environment Variables

This document lists environment variable names and purposes only. Do not include real secret values in repository files or documentation.

## Frontend

| Variable | Purpose | Secret |
|---|---|---|
| `REACT_APP_API_BASE_URL` | Public backend API origin used by the React app. | No |

Only public, non-secret values should be exposed to the frontend.

## Backend Core

| Variable | Purpose | Secret |
|---|---|---|
| `PORT` | Backend listen port. Hosting platforms may provide this. | No |
| `CLIENT_ORIGIN` | Allowed frontend origin for credentialed CORS. | No |
| `CLIENT_BASE_URL` | Public frontend base URL used to build email verification links. | No |
| `NODE_ENV` | Runtime mode. Use `production` for production hosting. | No |

## Email Verification

| Variable | Purpose | Secret |
|---|---|---|
| `EMAIL_TRANSPORT` | Email transport mode. Use `disabled` for local/no-op, `test-success` or `test-fail` for deterministic tests, and `smtp` for real delivery. | No |
| `EMAIL_FROM_NAME` | Display name used in verification email sender. | No |
| `EMAIL_FROM_ADDRESS` | Sender email address used by SMTP. | No |
| `SMTP_HOST` | SMTP host. | No |
| `SMTP_PORT` | SMTP port, commonly `465` for implicit TLS or `587` for STARTTLS. | No |
| `SMTP_SECURE` | `true` for implicit TLS, `false` for STARTTLS/plain upgrade depending on provider. | No |
| `SMTP_USER` | SMTP account username. | Yes |
| `SMTP_PASSWORD` | SMTP account password or app password. | Yes |

## Database

| Variable | Purpose | Secret |
|---|---|---|
| `DB_HOST` | MySQL host. | No |
| `DB_PORT` | MySQL port. Defaults to `3306` when unset. | No |
| `DB_USER` | MySQL username. | Yes |
| `DB_PASSWORD` | MySQL password. | Yes |
| `DB_NAME` | MySQL database name. Standard value: `cyberly`. | No |
| `DB_SSL_MODE` | Production requires `required`; local development may use `disabled`. | No |
| `DB_SSL_CA` | Production-required managed MySQL CA certificate as inline PEM text. | Yes |
| `DB_SSL_REJECT_UNAUTHORIZED` | Production requires `true` so the managed database certificate is verified. | No |

## Sessions

| Variable | Purpose | Secret |
|---|---|---|
| `SESSION_SECRET` | Express-session signing secret. Must be strong in production. | Yes |
| `SESSION_NAME` | Session cookie name. Defaults to `cyberly.sid`. | No |
| `SESSION_TTL_SECONDS` | Session lifetime in seconds. | No |

## AI Providers

| Variable | Purpose | Secret |
|---|---|---|
| `OPENAI_API_KEY` | OpenAI provider key. | Yes |
| `OPENAI_MODEL` | OpenAI model override. | No |
| `GEMINI_API_KEY` | Gemini provider key. | Yes |
| `GEMINI_MODEL` | Gemini model override. | No |
| `ILMU_API_KEY` | ILMU provider key. | Yes |
| `ILMU_BASE_URL` | ILMU API base URL. | No |
| `ILMU_MODEL` | ILMU model override. | No |

## AI Runtime Selection

| Variable | Purpose | Secret |
|---|---|---|
| `AI_DEFAULT_PROVIDER` | Default provider selection. | No |
| `AI_DEFAULT_MODEL` | Default model fallback. | No |
| `AI_PROVIDER_CYBERGUARD` | Provider assignment for CyberGuard chat. | No |
| `AI_PROVIDER_AGENT_ROUTER` | Provider assignment for controlled Agentic planning. | No |
| `AI_PROVIDER_LIGHTWEIGHT` | Provider assignment for lightweight selection tasks. | No |
| `AI_PROVIDER_TRANSLATION` | Provider assignment for translation assistance. | No |
| `AI_PROVIDER_SAFETY` | Provider assignment for safety evaluation. | No |
| `AI_PROVIDER_RUNTIME_DISABLED` | Comma-separated provider IDs disabled at runtime. | No |
| `AI_PROVIDER` | Legacy/default provider alias still read by current config. | No |
| `AI_MODEL` | Legacy/default model alias still read by current config. | No |

## AI Limits

| Variable | Purpose | Secret |
|---|---|---|
| `AI_TIMEOUT_MS` | Provider request timeout. | No |
| `AI_MAX_OUTPUT_TOKENS` | Assistant output token cap. | No |
| `AI_CONTEXT_MESSAGE_LIMIT` | Conversation context message cap. | No |
| `AI_CONTEXT_CHARACTER_LIMIT` | Conversation context character cap. | No |
| `AI_PER_USER_MINUTE_LIMIT` | Per-user minute limit. | No |
| `AI_PER_USER_DAILY_LIMIT` | Per-user daily limit. | No |
| `AI_GENERATION_STALE_MS` | Stale generation recovery window. | No |
| `AI_DAILY_BUDGET_USD` | Optional estimated daily AI budget cap. | No |
| `ACTION_PROPOSAL_TTL_SECONDS` | Learner-controlled action proposal expiry. | No |

## Production Validation Contract

The backend validates production configuration immediately after loading environment variables and before initializing Express, MySQL, SMTP, AI providers, or the network listener. With `NODE_ENV=production`, startup fails safely when:

- `SESSION_SECRET` is absent, is the known development fallback, or is shorter than 32 characters;
- `CLIENT_ORIGIN` is not an origin-only public HTTPS URL;
- `CLIENT_BASE_URL` is not a public HTTPS URL or includes a query or fragment;
- a required database connection field is absent or `DB_PORT` is outside `1` through `65535`;
- managed MySQL TLS is not configured with `DB_SSL_MODE=required`, a non-empty `DB_SSL_CA`, and `DB_SSL_REJECT_UNAUTHORIZED=true`;
- `EMAIL_TRANSPORT=smtp` does not satisfy the accepted SMTP configuration contract; or
- `OPENAI_API_KEY` is absent from the accepted OpenAI-backed external-Beta runtime.

Validation errors identify variable names only. They must not include secret values. Development and test environments retain their current local defaults.

The official React build requires `REACT_APP_API_BASE_URL` to be a public HTTPS API origin in production. It must not contain a path, query, fragment, or localhost address.

`DB_SSL_CA` accepts a real multiline PEM or PEM text whose newlines are represented as literal `\n` sequences. Escaped newlines are recommended for Render secret entry. `DB_SSL_CA_FILE` is not supported. Production must not rely only on the system CA store or disable certificate verification; local development may continue to use non-TLS MySQL.
