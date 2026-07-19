# 09. Report Evidence Mapping

| Report area | Implementation evidence | Suggested diagram/table | Responsible role |
|---|---|---|---|
| System architecture | `server/server.js`, `client/src/App.jsx`, `server/src/database/pool.js`, `README.md`, `docs/02-current-architecture.md` | Overall architecture diagram | System Architecture |
| Frontend design | `client/src/App.jsx`, `client/src/App.css`, `client/src/index.css`, `client/src/admin/*`, `client/src/chat/*`, locale files | UI page/component map | Frontend |
| Backend API design | Route files under `server/src/*/*.routes.js`, `server/server.js` route mounting | API endpoint table | Backend, including Database |
| Database design | `server/migrations/*`, `server/src/database/*`, `docs/06-database-schema.md` | ERD or migration-to-table map | Backend, including Database |
| Authentication/session design | `server/server.js`, `server/src/auth/*`, migration `004`, `docs/07-authentication-design.md` | Session sequence diagram | Backend, including Database |
| Learner profile/onboarding | `server/src/profile/*`, `client/src/App.jsx`, migration `005`, `docs/08-learner-profile-design.md` | Onboarding data flow | Frontend |
| Initial Assessment | `server/src/assessment/*`, migrations `006`, `009`, `010`, `docs/09-initial-assessment-design.md` | Assessment flow table | Backend, including Database |
| Scenario engine | `server/src/scenario/*`, migrations `008`, `011`, `012`, `024`, `025`, `docs/11-scenario-engine-design.md` | Scenario attempt sequence | Backend, including Database |
| Progress and recommendations | `server/src/progress/*`, `server/src/scenario/scenarioRecommendation.js`, `docs/10-progress-and-recommendation-design.md`, `docs/LEARNING_PATH_PROGRESS_MODEL.md` | Recommendation-progress flow diagram | Backend, including Database |
| Resources and taxonomy | `server/src/resource/*`, migrations `013`, `014`, `015`, `022`, `023`, `docs/10-cyberly-content-taxonomy-and-roadmap.md` | Content taxonomy table | Cyberly Content |
| Admin governance | `server/src/admin/*`, `client/src/admin/*`, `docs/11-cyberly-admin-governance-summary.md` | Admin module matrix | Backend, including Database |
| AI Chatbot | `server/src/ai/*`, `server/src/ai/providers/*`, `client/src/chat/*`, chat UI in `client/src/App.jsx`, `docs/08-cyberguard-rag-demo-summary.md` | CyberGuard generation sequence | AI Chatbot |
| RAG grounding | `server/src/rag/*`, migrations `020`, `021`, `server/src/ai/ai.repository.js`, `client/src/App.jsx` source components | RAG retrieval/citation flow | AI Chatbot |
| Agentic AI | `server/src/agent/*`, `server/src/agent/actions/*`, `server/src/agent/audit/*`, migration `026`, `docs/09-cyberguard-agentic-ai-summary.md`, `docs/ai/CONTROLLED_AGENTIC_ARCHITECTURE.md` | Chatbot-Agentic boundary diagram | Agentic AI |
| Controlled learner actions | `server/src/agent/actions/actionProposal.service.js`, `client/src/App.jsx`, `client/src/chat/chatApi.js`, `docs/ai/LEARNER_CONTROLLED_ACTIONS.md` | Proposal lifecycle sequence | Agentic AI |
| Adaptive learning | `server/src/adaptive/*`, `server/src/agent/controlledAgentic.service.js`, `docs/ai/ADAPTIVE_LEARNING_INTELLIGENCE.md` | Adaptive context boundary table | System Architecture |
| Localization | `client/src/i18n/*`, `server/src/i18n/locale.js`, localized seed migrations | Locale support matrix | Frontend |
| Deployment feasibility | `README.md`, `package.json`, `client/package.json`, `server/package.json`, `server/server.js`, `.env.example` files | Deployment option comparison | System Architecture |
| Integration quality | `server/scripts/test-*.js`, `client/src/**/*.test.*`, `scripts/verify-locales.js` | Verification command matrix | System Architecture |

## Evidence Use Guidance

- Use code files as primary evidence for implemented behavior.
- Use migration files as primary evidence for database tables and seed content.
- Use docs as explanation of design intent, but do not treat future roadmap sections as implemented features.
- Use tests as supporting evidence that behavior was verified; testing itself should not become a separate Capstone role.

