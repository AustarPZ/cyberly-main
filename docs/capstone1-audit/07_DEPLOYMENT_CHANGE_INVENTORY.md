# 07. Deployment Change Inventory

## Required Before Deployment

| Priority | Change | Reason | Files likely affected | Role owner |
|---|---|---|---|---|
| Required | Set production `server/.env` values on hosting platform. | Backend needs DB, session, CORS, port, and AI provider configuration. | Hosting env settings, `server/.env.example` as reference | System Architecture |
| Required | Set frontend `REACT_APP_API_BASE_URL` to public backend URL. | Frontend defaults to `http://localhost:5000` in code when env is absent. | `client/.env.example`, deployment env, `client/src/App.jsx`, `client/src/chat/chatApi.js`, `client/src/admin/adminApi.js` | Frontend |
| Required | Set backend `CLIENT_ORIGIN` to public frontend URL. | CORS in `server/server.js` allows one configured origin with credentials. | Hosting env, `server/server.js` behavior | Backend, including Database |
| Required | Configure managed MySQL and network access. | Backend uses MySQL through `server/src/database/pool.js`. | Hosting DB settings, `server/src/database/pool.js` behavior | Backend, including Database |
| Required | Run `npm --prefix server run db:ensure` and `npm --prefix server run migrate`. | Database schema must exist before startup features work. | `server/scripts/db-ensure.js`, `server/scripts/migrate.js` | Backend, including Database |
| Required | Use a strong `SESSION_SECRET`. | `server/server.js` has a development fallback that is not suitable for production. | Hosting env, `server/.env.example` | System Architecture |
| Required | Verify HTTPS cookie behavior. | `secure` becomes true in production and cross-origin frontend/backend hosting may affect cookies. | `server/server.js`, hosting domains | System Architecture |
| Required | Keep Admin provisioning private. | Public registration creates normal users; admin role must not be self-service. | Database/user admin process, `server/server.js`, `server/src/admin/admin.middleware.js` | Backend, including Database |

## Recommended Before Public Pilot

| Priority | Change | Reason | Files likely affected | Role owner |
|---|---|---|---|---|
| Recommended | Add broader rate limiting for chat/action endpoints. | Public AI endpoints and action proposals need abuse protection beyond auth rate limiting. | `server/server.js`, AI/action routes | Backend, including Database |
| Recommended | Add production logging policy. | Need safe operational visibility without secrets/prompts/private data. | `server/server.js`, AI/Agentic services | System Architecture |
| Recommended | Persist learner-action proposals or pin backend to one instance. | Current proposal store is in-memory in `server/src/agent/actions/actionProposal.service.js`. | Future migration/service change | Agentic AI |
| Recommended | Configure AI provider budgets and disable unavailable providers. | Provider registry supports purpose assignments and runtime-disabled providers. | `server/src/ai/providers/aiProvider.registry.js`, env | AI Chatbot |
| Recommended | Add health/readiness checks for database and provider status. | `/api/health` checks DB only; provider tests are Admin-triggered. | `server/server.js`, `server/src/admin/admin.routes.js` | System Architecture |
| Recommended | Review Admin public exposure. | Admin endpoints are protected, but public URL makes role enforcement and audit more important. | `server/src/admin/*`, `client/src/admin/*` | Backend, including Database |
| Recommended | Add backup/reset guidance for managed MySQL. | Migration rollback is not implemented. | README/deployment docs | System Architecture |
| Recommended | Confirm RAG ingestion process for production content. | RAG demo needs `rag:ingest` after migrations/content changes, but user asked not to run it in this audit. | `server/scripts/rag-ingest.js`, deployment docs | AI Chatbot |

## Optional Production Improvements

| Priority | Change | Reason | Files likely affected | Role owner |
|---|---|---|---|---|
| Optional | Serve static frontend from Express for single-origin deployment. | Could simplify cookies/CORS, but changes deployment shape. | `server/server.js`, build pipeline | System Architecture |
| Optional | Add observability dashboards. | Helps production monitoring but not needed for Capstone 1 MVP. | Hosting platform, logging config | System Architecture |
| Optional | Add queue/background jobs for RAG ingestion. | Useful if content grows. | `server/src/rag/*`, future Admin RAG module | AI Chatbot |
| Optional | Add fine-grained Admin roles and audit logs. | Future governance hardening. | Future migrations/admin modules | Backend, including Database |
| Optional | Move from session cookies to production SSO/OAuth. | Not needed for MVP; higher complexity. | Auth modules | System Architecture |

