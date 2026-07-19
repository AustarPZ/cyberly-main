# 04. Cross-Role Dependencies

| From role | To role | Information/artifact exchanged | Example |
|---|---|---|---|
| Cyberly Content | Frontend | Localized labels, Resource/Scenario wording, taxonomy labels, learner-friendly copy. | Locale files in `client/src/i18n/locales/*.json`; taxonomy labels rendered in `client/src/App.jsx`. |
| Cyberly Content | Backend, including Database | Seed content, source metadata, review status, RAG-ready decisions, scenario steps. | Resource/Scenario seed migrations `008`, `012`, `014`, `015`, `025`; Resource metadata migration `022`. |
| Cyberly Content | AI Chatbot | Reviewed Resource content, source labels, safety wording, RAG-ready corpus. | `server/src/rag/rag.service.js`, `server/src/rag/rag.policy.js`, `docs/08-cyberguard-rag-demo-summary.md`. |
| Cyberly Content | Agentic AI | Topic taxonomy, learning sequence, content relationships, reviewed route candidates. | Read-only route builder in `server/src/agent/agent.tools.js`; roadmap in `docs/10-cyberly-content-taxonomy-and-roadmap.md`. |
| Backend, including Database | Frontend | API contracts, auth/session behavior, safe response shapes, errors. | `server/server.js`, `server/src/*/*.routes.js`; client fetch wrappers in `client/src/App.jsx`, `client/src/admin/adminApi.js`, `client/src/chat/chatApi.js`. |
| Backend, including Database | AI Chatbot | Learner context data, chat persistence, generation status, RAG source persistence. | `server/src/ai/ai.repository.js`, `server/src/chat/*`, migrations `016`-`021`. |
| Backend, including Database | Agentic AI | Safe learner data and repositories for read-only tools and bounded proposals. | `server/src/agent/agent.tools.js`, `server/src/agent/actions/actionCatalogue.js`. |
| Backend, including Database | Cyberly Content | Admin review metadata storage and CMS API constraints. | `server/src/admin/admin.resourceMetadata.js`, `server/src/admin/admin.resourceContent.js`, `server/src/admin/admin.scenarioManagement.js`. |
| AI Chatbot | Frontend | Assistant messages, sources, action cards, proposal metadata, refusal states. | `server/src/ai/ai.service.js`; UI rendering in `client/src/App.jsx`. |
| AI Chatbot | Agentic AI | Conversation context, route/planner context, trusted target context, proposal candidates. | `server/src/ai/ai.service.js` calls controlled planning and proposal creation. |
| AI Chatbot | Cyberly Content | RAG coverage gaps, source quality requirements, citation needs. | `docs/08-cyberguard-rag-demo-summary.md`, `docs/11-cyberly-admin-governance-summary.md`. |
| Agentic AI | Frontend | Proposal card states, confirmation/cancel semantics, safe navigation result. | `server/src/agent/actions/actionProposal.service.js`, `client/src/App.jsx`, `client/src/chat/chatApi.js`. |
| Agentic AI | Backend, including Database | Trace persistence, proposal confirmation execution, allowed bounded writes. | `server/src/agent/audit/*`, migration `026`, `server/src/agent/actions/*`. |
| Agentic AI | AI Chatbot | Sanitized tool context and action proposal metadata for final reply. | `server/src/agent/controlledAgentic.service.js`, `server/src/ai/ai.service.js`. |
| System Architecture | Frontend | Routing boundaries, source/action hierarchy, responsive deployment assumptions. | `README.md`, `AGENTS.md`, `docs/02-current-architecture.md`. |
| System Architecture | Backend, including Database | Migration conventions, database naming, session/security boundaries, API contract expectations. | `AGENTS.md`, `README.md`, `server/src/database/pool.js`. |
| System Architecture | AI Chatbot | Safety precedence, RAG boundary, provider boundary, prompt/data separation. | `docs/ai/CYBERGUARD_SCOPE_BOUNDARY.md`, `docs/ai/cyberguard-runtime-flow.md`. |
| System Architecture | Agentic AI | Bounded tool-calling architecture, confirmation boundary, audit requirements. | `docs/ai/CONTROLLED_AGENTIC_ARCHITECTURE.md`, `docs/ai/LEARNER_CONTROLLED_ACTIONS.md`. |
| System Architecture | Cyberly Content | Taxonomy structure, governance roadmap, Admin content workflow constraints. | `docs/10-cyberly-content-taxonomy-and-roadmap.md`, `docs/11-cyberly-admin-governance-summary.md`. |
| All roles | System Architecture | Constraints, integration bugs, API or UI feedback, deployment blockers. | Tests/scripts and docs under `server/scripts/`, `client/src/**/*.test.*`, `docs/`. |

## Key Dependency Notes

- Content quality directly affects RAG trustworthiness and Agentic route quality.
- Backend APIs are the trust boundary; frontend cannot be responsible for scoring, authorization, or trusted mutation.
- AI Chatbot can suggest language and actions, but deterministic backend logic owns persisted action targets.
- Agentic AI proposals can display in the chat UI, but execution authority stays with backend confirmation checks.
- Deployment belongs mainly to System Architecture, but requires Frontend environment configuration and Backend database/session/provider readiness.

