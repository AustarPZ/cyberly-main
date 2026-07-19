# 08. Environment Variable Inventory

No secret values were read or reproduced for this audit. This inventory lists variable names only, based on `server/.env.example`, `client/.env.example`, `server/server.js`, `server/src/database/pool.js`, `server/src/ai/ai.config.js`, and `server/src/ai/providers/aiProvider.registry.js`.

## Frontend Public Configuration

| Variable | Purpose | Evidence | Notes |
|---|---|---|---|
| `REACT_APP_API_BASE_URL` | Public backend API base URL used by the React app. | `client/.env.example`, `client/src/App.jsx`, `client/src/chat/chatApi.js`, `client/src/admin/adminApi.js` | Safe to expose because it is a public API origin, not a secret. Defaults to localhost in code if unset. |

## Backend Private Configuration

| Variable | Purpose | Evidence | Notes |
|---|---|---|---|
| `PORT` | Backend listen port. | `server/server.js`, `server/.env.example` | Hosting platform may inject this. |
| `CLIENT_ORIGIN` | CORS allowed frontend origin. | `server/server.js`, `server/.env.example` | Must match deployed frontend URL when credentials are used. |
| `NODE_ENV` | Production/test behavior, including cookie `secure`. | `server/server.js`, `server/.env.example` | Set to `production` on hosted backend. |

## Database

| Variable | Purpose | Evidence | Notes |
|---|---|---|---|
| `DB_HOST` | MySQL host. | `server/src/database/pool.js`, `server/.env.example` | Private backend setting. |
| `DB_PORT` | MySQL port. | `server/src/database/pool.js`, `server/.env.example` | Defaults to `3306`. |
| `DB_USER` | MySQL username. | `server/src/database/pool.js`, `server/.env.example` | Secret-sensitive. |
| `DB_PASSWORD` | MySQL password. | `server/src/database/pool.js`, `server/.env.example` | Secret. |
| `DB_NAME` | MySQL database name. | `server/src/database/pool.js`, `server/.env.example`, `README.md` | Standard value is `cyberly`. Do not use `cyberwell`. |

## Sessions

| Variable | Purpose | Evidence | Notes |
|---|---|---|---|
| `SESSION_SECRET` | Express-session signing secret. | `server/server.js`, `server/.env.example` | Required strong secret for deployment. |
| `SESSION_NAME` | Session cookie name. | `server/server.js`, `server/.env.example` | Defaults to `cyberly.sid`. |
| `SESSION_TTL_SECONDS` | Session lifetime. | `server/server.js`, `server/.env.example` | Defaults to 86400 seconds. |

## AI Providers and Runtime

| Variable | Purpose | Evidence | Notes |
|---|---|---|---|
| `OPENAI_API_KEY` | OpenAI provider key. | `server/.env.example`, `server/src/ai/providers/aiProvider.registry.js` | Secret. |
| `OPENAI_MODEL` | OpenAI model name. | `server/.env.example`, provider registry | Non-secret. |
| `GEMINI_API_KEY` | Gemini provider key. | `server/.env.example`, provider registry | Secret. Runtime disabled by default in example. |
| `GEMINI_MODEL` | Gemini model name. | `server/.env.example`, provider registry | Non-secret. |
| `ILMU_API_KEY` | ILMU provider key. | `server/.env.example`, provider registry | Secret. |
| `ILMU_BASE_URL` | ILMU API base URL. | `server/.env.example`, provider registry | Non-secret but backend-private config. |
| `ILMU_MODEL` | ILMU model name. | `server/.env.example`, provider registry | Non-secret. |
| `AI_DEFAULT_PROVIDER` | Default provider selection. | `server/.env.example`, provider registry | Example uses OpenAI. |
| `AI_DEFAULT_MODEL` | Default model fallback. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_PROVIDER_CYBERGUARD` | Provider purpose assignment for CyberGuard chat. | `server/.env.example`, provider registry | Non-secret. |
| `AI_PROVIDER_AGENT_ROUTER` | Provider assignment for Agent Router planning. | `server/.env.example`, provider registry | Non-secret; current controlled architecture expects OpenAI. |
| `AI_PROVIDER_LIGHTWEIGHT` | Provider assignment for lightweight selection. | `server/.env.example`, provider registry | Non-secret. |
| `AI_PROVIDER_TRANSLATION` | Provider assignment for translation assistance. | `server/.env.example`, provider registry | Non-secret. |
| `AI_PROVIDER_SAFETY` | Provider assignment for safety evaluation. | `server/.env.example`, provider registry | Non-secret. |
| `AI_PROVIDER_RUNTIME_DISABLED` | Comma-separated runtime-disabled providers. | `server/.env.example`, provider registry | Example disables Gemini. |
| `AI_PROVIDER` | Legacy/default provider setting. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_MODEL` | Legacy/default model setting. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_TIMEOUT_MS` | Provider timeout. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_MAX_OUTPUT_TOKENS` | Output cap. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_CONTEXT_MESSAGE_LIMIT` | Chat context message cap. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_CONTEXT_CHARACTER_LIMIT` | Chat context character cap. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_PER_USER_MINUTE_LIMIT` | Per-user minute rate limit. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_PER_USER_DAILY_LIMIT` | Per-user daily rate limit. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_GENERATION_STALE_MS` | Stale generation recovery window. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `AI_DAILY_BUDGET_USD` | Optional estimated daily AI spend cap. | `server/.env.example`, `server/src/ai/ai.config.js` | Non-secret. |
| `ACTION_PROPOSAL_TTL_SECONDS` | Learner action proposal expiry. | `server/server.js` | Not in example currently; consider documenting if used in deployment. |

## Admin/Bootstrap

No public admin registration variable was found. Admin access is role-based through server-side user records and `server/src/admin/admin.middleware.js`. Public registration in `server/server.js` creates `role='user'`.

## Flags and Risks

- Hardcoded localhost defaults exist in frontend API files and backend CORS fallback. This is acceptable for local development but must be overridden for deployment.
- `SESSION_SECRET` has a development fallback in `server/server.js`; deployment must provide a strong secret.
- Client-side secret risk is low as long as only `REACT_APP_API_BASE_URL` is used in the frontend. AI provider keys belong only in backend environment variables.
- `ACTION_PROPOSAL_TTL_SECONDS` is used in `server/server.js` but is not currently shown in `server/.env.example`.

