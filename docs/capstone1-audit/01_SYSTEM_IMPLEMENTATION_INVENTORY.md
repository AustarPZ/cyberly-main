# 01. System Implementation Inventory

## Repository Map

| Path/module | Purpose | Main feature area | Primary role |
|---|---|---|---|
| `client/` | Official React frontend application. | Learner UI, Admin UI, CyberGuard UI | Frontend |
| `client/src/App.jsx` | Main React app, hash routing, learner pages, chat rendering, page-level API wrappers. | Frontend integration | Frontend |
| `client/src/App.css`, `client/src/index.css` | Global visual system and responsive styling. | UI/UX | Frontend |
| `client/src/chat/chatApi.js` | Chat and learner-action proposal API client. | CyberGuard frontend integration | Frontend |
| `client/src/chat/chatActions.js` | Safe target mapping, source/action dedupe, proposal payload mapping, scenario navigation helpers. | Action cards and proposals | Frontend |
| `client/src/admin/` | Admin workspace, Resource CMS, Scenario CMS, AI provider/status pages, lifecycle dialogs. | Admin/CMS UI | Frontend |
| `client/src/i18n/` | i18next setup and locale JSON files for English, Malay, and Simplified Chinese. | Localization | Frontend |
| `client/src/progress/` | Frontend progress semantics helpers and tests. | Learning Path display | Frontend |
| `client/src/product/` | Product wording and semantics helpers. | Product consistency | Frontend |
| `server/server.js` | Express app creation, service wiring, session/CORS setup, auth routes, route mounting. | Backend entry point | Backend, including Database |
| `server/src/database/` | MySQL pool, migration helpers, age-group utility. | Database access | Backend, including Database |
| `server/migrations/` | Numbered SQL migrations from base schema through agentic traces. | Schema and seed data | Backend, including Database |
| `server/scripts/migrate.js` | Migration runner and status checker. | Deployment/database setup | Backend, including Database |
| `server/scripts/db-ensure.js` | Creates configured database if missing. | Fresh-clone setup | Backend, including Database |
| `server/src/auth/` | Auth validation, `requireAuth`, MySQL session store. | Authentication/session | Backend, including Database |
| `server/src/profile/` | Learner onboarding/profile service, repository, routes, mapper. | Learner profile | Backend, including Database |
| `server/src/account/` | Account read/update API. | Account settings | Backend, including Database |
| `server/src/assessment/` | Initial assessment routes, scoring, repository, mapper, validation. | Assessment | Backend, including Database |
| `server/src/progress/` | Progress, recommendations, Learning Path Progress, activity composition. | Progress/recommendations | Backend, including Database |
| `server/src/scenario/` | Scenario library, attempts, decisions, scoring, recommendation selection. | Scenario practice | Backend, including Database |
| `server/src/resource/` | Public Resource repository/service/routes plus governance semantics. | Resource learning | Backend, including Database |
| `server/src/chat/` | Conversation/message persistence and chat mapping. | Persistent chat | Backend, including Database |
| `server/src/ai/` | CyberGuard generation, prompt construction, provider gateway, safety, learner context, action cards, scope classifier. | AI Chatbot | AI Chatbot |
| `server/src/ai/providers/` | OpenAI, Gemini, ILMU provider wrappers and provider registry/status logic. | AI provider gateway | AI Chatbot |
| `server/src/rag/` | RAG ingestion, policy, chunking, retrieval, citation mapping. | RAG grounding | AI Chatbot |
| `server/src/agent/` | Read-only tools, controlled planning, learner-controlled proposals, action policy/catalogue, audit traces. | Agentic AI | Agentic AI |
| `server/src/adaptive/` | Deterministic adaptive learning summaries and rules. | Adaptive learning intelligence | System Architecture |
| `server/src/wellness/` | Cyber Wellness scope/guidance classifiers and non-diagnostic guidance. | Cyber wellness guidance | AI Chatbot |
| `server/src/admin/` | Admin authorization, Resource/Scenario management helpers, provider status/traces, review endpoints. | Admin governance APIs | Backend, including Database |
| `server/scripts/test-*.js` | Focused backend verification scripts. | Evidence/supporting checks | System Architecture |
| `docs/` | Approved design summaries, architecture, progress semantics, AI/RAG/Agentic/Admin documentation. | Capstone documentation | System Architecture |
| `docs/planning/` | Workbook and import-preview planning artifacts. | Content planning | Cyberly Content |
| `README.md` | Fresh-clone setup, scripts, database standard, troubleshooting. | Setup documentation | System Architecture |
| `AGENTS.md` | Project rules for future Codex work. | Development governance | System Architecture |
| `src/`, root `public/` | Legacy React frontend retained for reference only. | Legacy reference | Frontend |

## Grouped Feature Inventory

### Core Learner System

Implemented:

- Registration, login, session restore, logout, and legacy compatibility routes are in `server/server.js`; password validation utilities are in `server/src/auth/validation.js`; session protection is in `server/src/auth/middleware.js` and `server/src/auth/mysql-session-store.js`.
- Learner onboarding/profile persistence uses `server/src/profile/*` and frontend profile/onboarding flows in `client/src/App.jsx`.
- Dashboard, Resources, Scenarios, Assessment, Progress, and CyberGuard pages are implemented in `client/src/App.jsx`.
- Initial Assessment uses `server/src/assessment/*` and migrations `006`, `009`, and `010`.
- Progress, recommendation lifecycle, Learning Path Progress, activity composition, recommendation viewed/completed endpoints, and recent activity use `server/src/progress/*` and migration `007`.
- Scenario Library and scenario attempt flow use `server/src/scenario/*` and migrations `008`, `011`, `012`, `024`, and `025`.
- Resource learning content uses `server/src/resource/*` and migrations `013`, `014`, `015`, `022`, and `023`.
- Localization is implemented with `client/src/i18n/index.js` and locale files in `client/src/i18n/locales/`; backend locale normalization is in `server/src/i18n/locale.js`.

Partially implemented or future-only:

- Resource completion tracking is explicitly future-only in `docs/LEARNING_PATH_PROGRESS_MODEL.md`.
- Learning Path versioning and configurable progress contribution values are future-only in `docs/LEARNING_PATH_PROGRESS_MODEL.md`.

### Admin and CMS

Implemented:

- Admin access policy is in `server/src/admin/admin.middleware.js`; Admin routes are mounted at `/api/admin` in `server/server.js`.
- Admin status and provider/Agentic runtime status are in `server/src/admin/admin.routes.js`.
- Resource review, list/detail, creation, metadata/content update, publication, archive/restore/delete lifecycle, and governance endpoints are in `server/src/admin/admin.routes.js`, with helpers in `server/src/admin/admin.resourceMetadata.js`, `server/src/admin/admin.resourceContent.js`, and `server/src/resource/resource.governance.js`.
- Scenario management, creation, metadata/steps/translation updates, publication, archive/restore/delete lifecycle, and validation are in `server/src/admin/admin.routes.js` and `server/src/admin/admin.scenarioManagement.js`.
- Admin frontend pages and shared admin components are in `client/src/admin/`.
- Agentic trace inspector APIs are in `server/src/admin/admin.routes.js`; trace services are in `server/src/agent/audit/*`.

Future-only:

- FAQ/Safety Summary Management, Malaysia Guidance Management, AI Safety Evaluation Panel workflows, Content Relationship editor, and workbook import workflow are documented in `docs/11-cyberly-admin-governance-summary.md` but are not implemented as full modules.

### AI Chatbot

Implemented:

- CyberGuard conversation persistence uses `server/src/chat/*` and migrations `016`, `017`, and `018`.
- Generation flow, safety checks, learner context, RAG retrieval, provider call, source persistence, action cards, controlled agentic planning, and trace updates are coordinated in `server/src/ai/ai.service.js`.
- Prompt construction is in `server/src/ai/ai.prompts.js`.
- Provider gateway and providers are in `server/src/ai/ai.provider.js` and `server/src/ai/providers/*`.
- Scope classification is in `server/src/ai/scope/cyberGuardScope.classifier.js`; unsafe request checks are in `server/src/ai/ai.safety.js`.
- RAG foundation is in `server/src/rag/*`, with schema in migrations `020` and `021`.
- Frontend chat UI, Markdown, sources, proposals, and action cards are in `client/src/App.jsx`, `client/src/chat/chatApi.js`, and `client/src/chat/chatActions.js`.

### Agentic AI

Implemented:

- Read-only tool registry/service is in `server/src/agent/agent.policy.js`, `agent.registry.js`, `agent.tools.js`, `agent.service.js`, and `agent.mapper.js`.
- Single-step controlled model planning is in `server/src/agent/controlledAgentic.service.js`, `agentModelGateway.js`, `controlledToolExecutor.js`, and `agent.toolCatalogue.js`.
- Learner-controlled action proposals are in `server/src/agent/actions/*` and frontend proposal UI in `client/src/App.jsx`.
- Agentic execution traces use `server/src/agent/audit/*` and migration `026`.

Boundaries:

- Current Agentic AI is backend-orchestrated, bounded, and confirmation-controlled. It is not an uncontrolled autonomous agent, as documented in `docs/ai/CONTROLLED_AGENTIC_ARCHITECTURE.md` and `docs/09-cyberguard-agentic-ai-summary.md`.

### Adaptive Learning

Implemented:

- Deterministic adaptive learning service/rules/explanations are in `server/src/adaptive/*`.
- Adaptive context can be used by controlled Agentic planning in `server/src/agent/controlledAgentic.service.js`.
- Admin runtime status exposes adaptive learning status in `server/src/admin/admin.routes.js`.

Role split:

- Backend owns data access and deterministic computation.
- AI Chatbot owns how adaptive context is included in CyberGuard response generation.
- Agentic AI owns using adaptive context inside the controlled planner boundary.
- System Architecture owns cross-module semantics and safety boundaries.

## End-to-End Implementation Trace

| Feature | Frontend | API | Backend service | Repository/data | DB tables | AI/Agentic | Primary role |
|---|---|---|---|---|---|---|---|
| Registration | `client/src/App.jsx` Register page and API wrapper | `POST /api/auth/register` in `server/server.js` | Inline auth flow in `server/server.js` | MySQL query in `server/server.js`; validation in `server/src/auth/validation.js` | `users`, `sessions` | Not applicable | Backend, including Database |
| Login/logout/session restore | `client/src/App.jsx` Login and session restore | `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout` | Inline auth/session helpers in `server/server.js` | `MySqlSessionStore` in `server/src/auth/mysql-session-store.js` | `users`, `sessions` | Not applicable | Backend, including Database |
| Learner profile/onboarding | `client/src/App.jsx` onboarding/profile state | `GET /api/profile`, `PUT /api/profile` | `server/src/profile/profile.service.js` | `server/src/profile/profile.repository.js` | `learner_profiles`, `users` | Not applicable | Backend, including Database |
| Account update | `client/src/App.jsx` account API wrapper | `/api/account` mounted in `server/server.js` | `server/src/account/account.service.js` | `server/src/account/account.repository.js` | `users` | Not applicable | Backend, including Database |
| Dashboard | `client/src/App.jsx` `DashboardPage` | `/api/progress`, `/api/recommendations/current`, `/api/scenarios/recommended`, `/api/scenarios/dashboard` | `progress.service.js`, `scenario.service.js` | `progress.repository.js`, `scenario.repository.js` | progress, recommendations, scenario attempts | CyberGuard can reuse recommendation context separately | Frontend |
| Initial Assessment | `client/src/App.jsx` `AssessmentPage` | `/api/assessments/initial`, `/api/assessments/initial/attempts`, `/api/assessment-attempts/:id/*` | `server/src/assessment/assessment.service.js` | `server/src/assessment/assessment.repository.js` | `assessment_definitions`, `assessment_questions`, `assessment_attempts`, `assessment_answers`, `assessment_topic_scores` | Not applicable | Backend, including Database |
| Assessment Results | `client/src/App.jsx` result rendering | `GET /api/assessments/initial/result`, `GET /api/assessments/initial/status` | `assessment.service.js` | `assessment.repository.js` | assessment attempts/topic scores | Not applicable | Backend, including Database |
| Resources | `client/src/App.jsx` `ResourcesPage` | `GET /api/resources`, `GET /api/resources/:slug` | `server/src/resource/resource.service.js` | `server/src/resource/resource.repository.js` | `resource_articles`, `resource_article_translations` | RAG ingests reviewed Resources separately | Backend, including Database |
| Scenario Library | `client/src/App.jsx` `ScenariosPage` | `GET /api/scenarios`, `GET /api/scenarios/recommended`, `GET /api/scenarios/dashboard` | `server/src/scenario/scenario.service.js` | `server/src/scenario/scenario.repository.js`, `scenarioRecommendation.js` | `scenario_definitions`, attempts, decisions | CyberGuard action cards can navigate to scenarios | Backend, including Database |
| Scenario flow | `client/src/App.jsx` scenario intro/attempt/result state | `POST /api/scenarios/:slug/attempts`, `GET /api/scenario-attempts/:id`, `PUT /api/scenario-attempts/:id/decisions`, `POST /api/scenario-attempts/:id/complete` | `scenario.service.js` | `scenario.repository.js` | `scenario_attempts`, `scenario_decisions`, `scenario_progress_events` | Not applicable | Backend, including Database |
| Scenario scoring/results | `client/src/App.jsx` result display | `GET /api/scenario-attempts/:id/result` | `scenario.service.js`, `scenario.scoring.js` | `scenario.repository.js` | scenario attempts/decisions/progress events | Not applicable | Backend, including Database |
| Current recommendation | `client/src/App.jsx` Dashboard/Progress cards | `GET /api/recommendations/current`, viewed/completed endpoints | `progress.service.js` | `progress.repository.js`, `progress.rules.js`, `scenarioRecommendation.js` | `learner_recommendations`, topic progress | CyberGuard learner context/action cards use this data | Backend, including Database |
| Learning Path Progress | `client/src/App.jsx`, `client/src/progress/progressSemantics.js` | `GET /api/progress` | `learning-path-progress.service.js`, `progress.composition.js` | `progress.repository.js` | assessment attempts, scenario attempts, recommendations | Not applicable | Backend, including Database |
| Activity history | `client/src/App.jsx` Progress/Dashboard display | `GET /api/progress` | `progress.service.js` | `progress.repository.js` recent activity queries | assessment attempts, scenario attempts, recommendations | Not applicable | Backend, including Database |
| Localization | `client/src/i18n/*` | Locale query params across routes | `server/src/i18n/locale.js` | Localized repository joins | translation tables for assessment/scenario/resources | AI generation receives normalized locale | Frontend |
| CyberGuard chat UI | `client/src/App.jsx`, `client/src/chat/*` | `/api/chat/conversations`, `/api/chat/.../messages`, `/generate` | `chat.service.js`, `ai.service.js` | `chat.repository.js`, `ai.repository.js` | `chat_conversations`, `chat_messages`, `chat_message_generations` | AI Chatbot generation | AI Chatbot |
| RAG citations | `client/src/App.jsx` `ChatSourceGroup` | Generate response and conversation detail source groups | `ai.service.js`, `rag.service.js` | `rag.repository.js`, `ai.repository.js` | `rag_documents`, `rag_chunks`, `chat_message_sources` | RAG prompt grounding | AI Chatbot |
| Action cards | `client/src/App.jsx` `ChatActionGroup`, `client/src/chat/chatActions.js` | Generate response and conversation detail action groups | `ai.learningActions.js`, `ai.service.js` | `ai.repository.js` | `chat_message_actions` | Deterministic; not LLM-invented routes | AI Chatbot |
| Contextual next-step guidance | `client/src/App.jsx` CyberGuard UI | Chat generate endpoint | `ai.service.js` | `ai.repository.js`, `progress.service.js` via learner/action data | chat/progress/recommendations/scenarios | Scope classifier in `ai/scope` | AI Chatbot |
| Read-only Agent route planning | CyberGuard UI in `client/src/App.jsx` | Chat generate endpoint | `agent.service.js`, `agent.tools.js`, `ai.service.js` | resource/scenario/progress/RAG services | existing learner/content tables | Backend-orchestrated Agentic route context | Agentic AI |
| Controlled Agentic tool planning | CyberGuard UI in `client/src/App.jsx` | Chat generate endpoint | `controlledAgentic.service.js`, `agentModelGateway.js`, `controlledToolExecutor.js` | approved safe tool handlers | existing learner/content tables | One planner model call, at most one tool | Agentic AI |
| Learner-controlled proposals | `client/src/App.jsx` proposal cards; `client/src/chat/chatApi.js` | `/api/agent/actions/proposals`, confirm, cancel | `actionProposal.service.js` | action catalogue/validation in `server/src/agent/actions/*` | No durable proposal table; bounded writes may touch recommendations | Controlled proposal execution | Agentic AI |
| Agentic trace inspector | `client/src/admin/AdminAiProvidersPage.jsx` | `/api/admin/ai/traces`, `/api/admin/ai/traces/:traceId` | `agenticTrace.service.js` | `agenticTrace.repository.js` | `agentic_execution_traces` | Sanitized traces | Agentic AI |
| Admin access | `client/src/App.jsx`, Admin nav/shell | `/api/admin/status`, `/api/admin/ping` | `admin.middleware.js` | user role query | `users` | Not applicable | Backend, including Database |
| Resource CMS | `client/src/admin/AdminResource*` | `/api/admin/resources*` | `admin.routes.js`, `admin.resourceMetadata.js`, `admin.resourceContent.js` | Resource admin SQL helpers | resource tables, RAG document tables for governance sync | RAG-ready metadata affects RAG | Backend, including Database |
| Scenario CMS | `client/src/admin/AdminScenario*` | `/api/admin/scenarios*` | `admin.routes.js`, `admin.scenarioManagement.js` | Scenario admin SQL helpers | scenario definitions/steps/translations/publication history | Not applicable | Backend, including Database |
| AI Admin page | `client/src/admin/AdminAiProvidersPage.jsx` | `/api/admin/ai/providers`, provider test endpoint | `admin.routes.js`, provider registry | provider status only; no secret output | Not applicable | Provider runtime status and Agentic runtime status | AI Chatbot |
