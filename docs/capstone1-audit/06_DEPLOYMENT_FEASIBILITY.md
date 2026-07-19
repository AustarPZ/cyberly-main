# 06. Deployment Feasibility

## Summary

Cyberly can be deployed to a public URL, but it requires production configuration work. The application already has clear frontend build scripts, backend start scripts, database bootstrap/migration scripts, CORS/session settings, and environment examples. It still needs production environment values, hosted MySQL, public API base URL configuration, HTTPS cookie review, and operational safeguards before a public pilot.

Evidence:

- Frontend build: `npm --prefix client run build` in `client/package.json`; root `npm run build` in `package.json`.
- Backend start: `npm --prefix server start` in `server/package.json`.
- Database setup: `npm --prefix server run db:ensure`, `migrate`, and `migrate:status` in `server/package.json`.
- CORS/session/trust proxy: `server/server.js`.
- Database config: `server/src/database/pool.js`.
- Environment examples: `server/.env.example`, `client/.env.example`.

## Deployment Options

| Option | Feasibility | Required changes | Risks | Recommendation |
|---|---|---|---|---|
| Option A: Vercel frontend + Render backend + managed MySQL | Feasible | Build `client/` on Vercel; set `REACT_APP_API_BASE_URL` to backend URL; deploy `server/` on Render; configure `CLIENT_ORIGIN` to Vercel URL; configure MySQL env; run `db:ensure`/`migrate`; review secure cookies. | Cross-origin cookies can be tricky; CORS must exactly match frontend origin; `sameSite=lax` may need review if frontend/backend are on separate domains; managed MySQL networking must allow backend access. | Good if the team wants Vercel for React hosting and accepts CORS/session complexity. |
| Option B: Render frontend + Render backend + managed MySQL | Feasible and simplest operationally | Host static frontend and backend in one platform; set API base URL; configure backend origin; configure database and AI provider env; run migrations. | Still needs managed MySQL, environment setup, and production cookie/CORS testing. Static frontend and backend may still be on different Render services/origins. | Recommended Capstone path because it keeps hosting, backend logs, and environment management in one platform. |
| Option C: Vercel-only/serverless adaptation | Low feasibility without refactor | Convert Express backend to serverless functions or a supported API structure; replace long-lived app/session assumptions; adapt MySQL connection pooling; rework route mounting and potentially sessions. | Highest refactor risk; current backend is a persistent Express server with MySQL session store; action proposals are in-memory and do not suit stateless multi-instance/serverless without redesign. | Not recommended for current MVP. |

## Recommended Deployment Architecture

Recommended: Option B, Render frontend + Render backend + managed MySQL.

Reason:

- The backend is an Express server designed to run as a persistent Node process (`server/server.js`).
- Sessions use a MySQL-backed store, which is compatible with a persistent backend and managed MySQL.
- The frontend can be built as static React assets (`client/package.json`).
- Render can host both static and web services, reducing cross-platform debugging during Capstone demonstration.

Option A remains acceptable if the team is comfortable configuring cross-origin cookies between Vercel and Render.

## Deployment Readiness Findings

Implemented/readiness evidence:

- Build command exists: `client/package.json`.
- Backend start command exists: `server/package.json`.
- Health endpoint exists: `GET /api/health` in `server/server.js`.
- Database bootstrap exists: `server/scripts/db-ensure.js`.
- Migration runner exists: `server/scripts/migrate.js`.
- Standard DB name is `cyberly`: `server/src/database/pool.js`, `server/.env.example`, `README.md`.
- CORS origin is configurable: `CLIENT_ORIGIN` in `server/server.js`.
- Frontend API URL is configurable: `REACT_APP_API_BASE_URL` in `client/.env.example`, `client/src/App.jsx`, `client/src/chat/chatApi.js`, `client/src/admin/adminApi.js`.
- Session cookies use HTTP-only cookies and production `secure` flag when `NODE_ENV=production`: `server/server.js`.

Deployment blockers before public URL:

- Production values must be set for `SESSION_SECRET`, `DB_*`, `CLIENT_ORIGIN`, `REACT_APP_API_BASE_URL`, and any AI keys used.
- CORS and cookie behavior must be tested on the real frontend/backend domains.
- MySQL must be hosted and reachable from the backend service.
- Migrations must be run against the production database.
- The current in-memory learner-action proposal store does not survive backend restart or multi-instance deployment; this is acceptable for MVP demo but a limitation for production.
- Rate limiting currently appears focused on authentication in `server/server.js`; broader public pilot rate limiting should be reviewed.
- Public registration is open to `role=user`; Admin provisioning must remain private and not through public registration.

## Static File Notes

The backend currently serves API routes and does not appear to serve the React production build directly. The deployment should therefore host the frontend separately as static assets, or a future backend static-serving configuration would be needed.

