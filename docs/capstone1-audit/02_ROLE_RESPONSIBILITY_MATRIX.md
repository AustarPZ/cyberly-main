# 02. Role Responsibility Matrix

## Role Assignment Table

| Task | Primary role | Supporting role(s) | Responsibility boundary | Evidence |
|---|---|---|---|---|
| React page routing and learner navigation | Frontend | System Architecture | Owns hash routing, page state, scroll behavior, learner navigation. | `client/src/App.jsx`, `client/src/chat/chatActions.js` |
| Learner UI pages | Frontend | Cyberly Content | Owns Dashboard, Assessment, Resources, Scenarios, Progress, CyberGuard UI rendering. | `client/src/App.jsx`, `client/src/App.css` |
| Admin UI shell and CMS screens | Frontend | Backend, including Database | Owns Admin workspace, forms, lifecycle dialogs, preview, section navigation. | `client/src/admin/*` |
| Localization rendering | Frontend | Cyberly Content | Owns i18next setup and rendering of localized labels. Content supplies translations. | `client/src/i18n/index.js`, `client/src/i18n/locales/*.json` |
| API client integration | Frontend | Backend, including Database | Owns fetch calls, credentials, UI error/loading states; does not own server validation. | `client/src/App.jsx`, `client/src/chat/chatApi.js`, `client/src/admin/adminApi.js` |
| Authentication and session security | Backend, including Database | System Architecture | Owns registration/login/logout/session restore, safe user shape, session store, role checks. | `server/server.js`, `server/src/auth/*`, migration `004` |
| MySQL schema and migrations | Backend, including Database | System Architecture | Owns numbered migrations, foreign keys, seed data, migration runner, fresh-clone database path. | `server/migrations/*`, `server/scripts/migrate.js`, `server/scripts/db-ensure.js` |
| Initial Assessment scoring | Backend, including Database | Cyberly Content | Owns trusted scoring and persistence. Content owns question substance and explanations. | `server/src/assessment/*`, migrations `006`, `009`, `010` |
| Scenario engine and scoring | Backend, including Database | Cyberly Content, Frontend | Owns attempts, decisions, completion, idempotency, progress impact. Content owns scenario narratives. | `server/src/scenario/*`, migration `008` |
| Scenario recommended candidate selection | Backend, including Database | System Architecture | Owns canonical deterministic selector and exclusion of stale completed strong scenarios. | `server/src/scenario/scenarioRecommendation.js`, `server/src/progress/progress.service.js` |
| Progress and Learning Path Progress | Backend, including Database | System Architecture, Frontend | Owns source-of-truth calculation and recommendation lifecycle; frontend renders it. | `server/src/progress/*`, `docs/LEARNING_PATH_PROGRESS_MODEL.md` |
| Resource public learning API | Backend, including Database | Cyberly Content, Frontend | Owns published Resource queries and mapping. Content owns guide substance and source quality. | `server/src/resource/*`, migrations `013`-`015`, `022`, `023` |
| Resource CMS governance APIs | Backend, including Database | Cyberly Content, Frontend | Owns validation, lifecycle, metadata, publication control. Content owns review decisions. | `server/src/admin/admin.routes.js`, `server/src/admin/admin.resourceMetadata.js`, `server/src/admin/admin.resourceContent.js` |
| Scenario CMS governance APIs | Backend, including Database | Cyberly Content, Frontend | Owns scenario admin validation/lifecycle; content owns narratives, choices, feedback. | `server/src/admin/admin.scenarioManagement.js`, `server/src/admin/admin.routes.js` |
| CyberGuard conversation persistence | Backend, including Database | AI Chatbot, Frontend | Owns conversations, messages, generations, actions, sources persistence and ownership. | `server/src/chat/*`, `server/src/ai/ai.repository.js`, migrations `016`-`021` |
| CyberGuard natural-language response generation | AI Chatbot | Backend, including Database, Cyberly Content | Owns prompt construction, provider call, safety language, grounded response style. | `server/src/ai/ai.service.js`, `server/src/ai/ai.prompts.js`, `server/src/ai/providers/*` |
| Scope classification and unsafe boundaries | AI Chatbot | System Architecture | Owns conversational scope, contextual learning guidance, refusal/boundary response. | `server/src/ai/scope/cyberGuardScope.classifier.js`, `server/src/ai/ai.safety.js` |
| RAG retrieval and citations | AI Chatbot | Backend, including Database, Cyberly Content | Owns retrieval/prompt grounding and citation metadata. Content governs RAG-ready sources. | `server/src/rag/*`, migrations `020`, `021`, `docs/08-cyberguard-rag-demo-summary.md` |
| Deterministic chat action cards | AI Chatbot | Backend, including Database, Frontend | Owns backend action selection; frontend owns presentation and safe navigation. | `server/src/ai/ai.learningActions.js`, `client/src/chat/chatActions.js`, `client/src/App.jsx` |
| AI provider gateway | AI Chatbot | System Architecture | Owns provider registry, provider selection, safe status, OpenAI/Gemini/ILMU wrappers. | `server/src/ai/providers/*`, `docs/AI_PROVIDER_SETUP.md` |
| Read-only Agent tool registry | Agentic AI | Backend, including Database | Owns approved tools, validation, safe outputs, tool execution service. | `server/src/agent/agent.*.js` |
| Controlled single-step planning | Agentic AI | AI Chatbot, System Architecture | Owns bounded planner, tool catalogue, tool call validation, at most one tool execution. | `server/src/agent/controlledAgentic.service.js`, `server/src/agent/agentModelGateway.js`, `server/src/agent/controlledToolExecutor.js` |
| Learner-controlled action proposals | Agentic AI | Frontend, Backend, including Database | Owns proposal validation, confirmation/cancel, expiry, replay/idempotency. Frontend renders confirmation UI. | `server/src/agent/actions/*`, `client/src/App.jsx`, `client/src/chat/chatApi.js` |
| Agentic trace/audit | Agentic AI | Backend, including Database, Admin frontend | Owns trace lifecycle and sanitization; Admin displays safe summaries. | `server/src/agent/audit/*`, migration `026`, `client/src/admin/AdminAiProvidersPage.jsx` |
| Content taxonomy | Cyberly Content | System Architecture, Frontend | Owns category definitions, learner-facing taxonomy, content gaps. | `docs/10-cyberly-content-taxonomy-and-roadmap.md`, `docs/TOPIC_TAXONOMY.md` |
| Resource educational substance | Cyberly Content | Frontend, Backend, including Database | Owns titles, summaries, body text, sources, translations, age suitability. | migrations `014`, `015`, admin Resource forms |
| Scenario narratives and feedback | Cyberly Content | Backend, including Database, Frontend | Owns scenario situations, prompts, choices, feedback, translations. Backend owns scoring persistence. | migrations `008`, `011`, `012`, `025`, admin Scenario editor |
| Source metadata governance | Cyberly Content | Backend, including Database, Admin frontend | Owns source authority and review decisions; backend stores metadata. | migration `022`, `docs/11-cyberly-admin-governance-summary.md` |
| Overall system architecture | System Architecture | All roles | Owns module boundaries, API contracts, integration, deployment architecture, security boundary decisions. | `server/server.js`, `README.md`, `AGENTS.md`, docs architecture files |
| Deployment planning | System Architecture | Frontend, Backend, including Database | Owns public URL architecture and environment/security requirements. | `README.md`, `server/server.js`, `client/.env.example`, `server/.env.example` |

## Adaptive Learning Role Split

| Adaptive task | Primary role | Supporting role(s) | Responsibility boundary | Evidence |
|---|---|---|---|---|
| Adaptive signal calculation | Backend, including Database | System Architecture | Deterministic data access and safe learner state summary. | `server/src/adaptive/adaptiveLearning.service.js`, `server/src/adaptive/adaptiveLearning.rules.js` |
| Adaptive explanation wording | AI Chatbot | Cyberly Content | Converts safe adaptive context into learner-friendly CyberGuard response. | `server/src/adaptive/adaptiveLearning.explanations.js`, `server/src/ai/ai.service.js` |
| Adaptive use inside controlled planner | Agentic AI | AI Chatbot | Supplies bounded adaptive context to controlled Agentic planning. | `server/src/agent/controlledAgentic.service.js` |
| Adaptive runtime status and boundaries | System Architecture | Backend, including Database | Defines no automatic score/profile changes and no hidden mutation boundary. | `server/src/admin/admin.routes.js`, `docs/ai/ADAPTIVE_LEARNING_INTELLIGENCE.md` |

