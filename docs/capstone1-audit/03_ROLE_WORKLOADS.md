# 03. Role Workloads

## Frontend

### Responsibility Summary

The Frontend role owns the React learner and admin experience: page rendering, routing, layout, interaction clarity, responsive behavior, localization display, forms, loading/empty/error states, chat source/action presentation, and safe client-side navigation.

### Major Modules

- `client/src/App.jsx`
- `client/src/App.css`
- `client/src/index.css`
- `client/src/chat/*`
- `client/src/admin/*`
- `client/src/i18n/*`
- `client/src/navigation/*`
- `client/src/progress/*`
- `client/src/product/*`

### Detailed Tasks

- Implement and maintain learner pages: Home, Register, Login, Dashboard, Resources, Assessment, Scenarios, Progress, About, CyberGuard.
- Render server-owned data safely without inventing trusted state.
- Maintain hash routing and Admin routing helpers.
- Implement Resource and Scenario navigation bridges from chat actions and recommendations.
- Render compact RAG source metadata below assistant answers.
- Render deterministic action cards and learner-controlled action proposal states.
- Implement Admin Resource/Scenario CMS pages, lifecycle dialogs, translation tabs, previews, source forms, metadata forms, and AI provider/status pages.
- Maintain UI localization in English, Malay, and Simplified Chinese.
- Preserve responsive behavior for desktop, tablet, and mobile.

### Inputs From Other Roles

- Backend API contracts and response shapes.
- AI Chatbot source/action/proposal payloads.
- Agentic AI proposal status and confirmation semantics.
- Cyberly Content translations, taxonomy labels, Resource/Scenario content.
- System Architecture navigation and integration boundaries.

### Outputs To Other Roles

- UI behavior expectations and API integration issues to Backend.
- Readability and source/action hierarchy feedback to AI Chatbot.
- Admin workflow usability constraints to Content and System Architecture.

### Explicit Exclusions

- Trusted scoring.
- Database persistence.
- Recommendation ranking.
- AI generation.
- Agentic validation.
- Secret handling.

## Backend, Including Database

### Responsibility Summary

The Backend role owns Express APIs, authentication, authorization, validation, business rules, repositories, MySQL schema/migrations, assessment/scenario scoring, progress calculations, recommendation lifecycle, CMS lifecycle, and safe data mapping.

### Major Modules

- `server/server.js`
- `server/src/database/*`
- `server/migrations/*`
- `server/src/auth/*`
- `server/src/profile/*`
- `server/src/account/*`
- `server/src/assessment/*`
- `server/src/progress/*`
- `server/src/scenario/*`
- `server/src/resource/*`
- `server/src/admin/*`
- `server/scripts/*`

### Detailed Tasks

- Maintain database migration chain and fresh-clone reproducibility.
- Enforce session authentication and admin authorization.
- Validate request bodies and route parameters.
- Persist learner profile, assessment, scenario, progress, recommendations, chat, sources, actions, resource review metadata, and agentic traces.
- Own assessment scoring and scenario scoring.
- Own recommendation freshness, candidate selection, and Learning Path Progress.
- Implement Resource and Scenario CMS lifecycle rules.
- Provide safe response mappers that avoid secrets, password hashes, raw answers, raw decisions, and internal prompt data.

### Inputs From Other Roles

- Frontend API needs and UX states.
- Cyberly Content schemas and review decisions.
- AI Chatbot persistence requirements for messages/sources/actions.
- Agentic AI trace/proposal persistence and safety needs.
- System Architecture security and deployment constraints.

### Outputs To Other Roles

- Stable API contracts.
- Database tables and migrations.
- Safe service behavior and lifecycle rules.
- Deployment setup scripts and health endpoint.

### Explicit Exclusions

- Learner-facing prose style.
- Content editorial decisions.
- Model prompt wording, except where required for safe API integration.
- Frontend layout.

## AI Chatbot

### Responsibility Summary

The AI Chatbot role owns CyberGuard conversational behavior: provider integration, prompt construction, scope classification, safety validation, RAG grounding, Cyber Wellness language, contextual learning guidance, multilingual response context, provider fallback, and deterministic learning action cards.

### Major Modules

- `server/src/ai/*`
- `server/src/ai/providers/*`
- `server/src/ai/scope/*`
- `server/src/rag/*`
- `server/src/wellness/*`
- Chat rendering touchpoints in `client/src/App.jsx` and `client/src/chat/*`
- Documentation in `docs/08-cyberguard-rag-demo-summary.md` and `docs/ai/*`

### Detailed Tasks

- Build safe system prompt, learner context, RAG context, route context, and capped conversation context.
- Call configured provider through backend gateway.
- Validate provider output before persistence.
- Refuse unsafe requests and redirect out-of-scope requests.
- Retrieve reviewed Resource chunks and persist source snapshots.
- Generate deterministic query-aware action cards with safe internal targets.
- Support contextual Cyberly learning guidance for prompts such as "What should I study next?"
- Keep provider diagnostics and prompt details hidden from learners.

### Inputs From Other Roles

- Backend learner state and persistence APIs.
- Cyberly Content reviewed Resource corpus and source metadata.
- Agentic AI controlled planning context and proposals.
- Frontend display constraints for sources/actions.
- System Architecture safety boundaries.

### Outputs To Other Roles

- Assistant replies, persisted sources, action cards, and proposal metadata.
- Provider runtime status to Admin.
- Requirements for content quality and RAG readiness.

### Explicit Exclusions

- Direct trusted state mutation.
- Database schema ownership.
- Admin publishing.
- Scenario/assessment scoring.

## Agentic AI

### Responsibility Summary

The Agentic AI role owns bounded planning and learner-controlled actions: read-only tools, tool registry, controlled planner, proposal creation, validation, confirmation, cancellation, expiry, replay protection, idempotency, trusted target validation, and trace/audit.

### Major Modules

- `server/src/agent/agent.*.js`
- `server/src/agent/controlledAgentic.service.js`
- `server/src/agent/agentModelGateway.js`
- `server/src/agent/controlledToolExecutor.js`
- `server/src/agent/actions/*`
- `server/src/agent/audit/*`
- Admin trace/status display in `client/src/admin/AdminAiProvidersPage.jsx`
- Proposal UI in `client/src/App.jsx`

### Detailed Tasks

- Maintain read-only tool allowlist and safe output shapes.
- Keep model planning bounded to a single model step and at most one tool execution.
- Validate tool arguments and reject model-supplied identity.
- Build learner-controlled action proposals that require explicit confirmation.
- Ensure cancellation and navigation confirmations do not mutate learner scores/progress.
- Restrict bounded writes to allowed recommendation viewed/completed fields.
- Record sanitized agentic traces for Admin inspection.
- Prevent proposal replay and handle expiry safely.

### Inputs From Other Roles

- Backend safe learner data services.
- AI Chatbot final-generation integration point.
- Frontend confirmation/cancel UI requirements.
- System Architecture action safety policy.

### Outputs To Other Roles

- Safe planning context for CyberGuard.
- Proposal cards and confirmation results.
- Admin-visible sanitized traces and runtime status.

### Explicit Exclusions

- Uncontrolled OpenAI tool calling.
- Autonomous multi-step execution.
- Score mutation.
- Scenario auto-start/auto-complete.
- SQL or secret access.
- Durable proposal storage in current MVP.

## Cyberly Content

### Responsibility Summary

The Cyberly Content role owns educational substance: taxonomy, assessment questions/explanations, scenario narratives/choices/feedback, Resource guides, cyber-wellness materials, Malaysia-focused context, translations, source quality, age appropriateness, and editorial governance.

### Major Modules/Artifacts

- `docs/10-cyberly-content-taxonomy-and-roadmap.md`
- `docs/TOPIC_TAXONOMY.md`
- `docs/planning/*`
- Seed migrations `006`, `008`, `010`, `012`, `014`, `015`, `025`
- Admin content forms in `client/src/admin/*`
- Resource/Scenario tables in migrations

### Detailed Tasks

- Define and maintain taxonomy categories and topic mappings.
- Draft and review assessment content.
- Draft and review scenario narratives, choices, feedback, and translations.
- Draft and review Resource guides and summaries.
- Review source URLs, source organizations, authority, age appropriateness, and Malaysia-specific claims.
- Decide which published content is RAG-ready.
- Prepare future FAQ, Safety Summary, Malaysia Guidance, and content relationship material.

### Inputs From Other Roles

- Admin tooling from Frontend/Backend.
- RAG quality needs from AI Chatbot.
- Route planning needs from Agentic AI.
- Architecture taxonomy and data-model guidance from System Architecture.

### Outputs To Other Roles

- Reviewed content and translations.
- Source metadata and governance decisions.
- Content relationship plans and learning sequence decisions.

### Explicit Exclusions

- API implementation.
- Database migrations.
- Model provider integration.
- Trusted scoring code.
- Frontend rendering logic.

## System Architecture

### Responsibility Summary

System Architecture owns cross-module design: architecture, module boundaries, data flow, API contracts, security boundaries, Chatbot/Agentic separation, recommendation learning loop, technology selection, deployment architecture, and consistency across roles.

### Major Modules/Artifacts

- `server/server.js`
- `README.md`
- `AGENTS.md`
- Architecture/design docs in `docs/`
- AI docs in `docs/ai/`
- Migration and package script conventions

### Detailed Tasks

- Define frontend/backend/database/AI integration boundaries.
- Keep Admin, RAG, Agentic AI, recommendations, progress, and content governance aligned.
- Decide deployment architecture and production prerequisites.
- Maintain database naming/setup rules and migration strategy.
- Ensure safety boundaries are preserved across implementation.
- Coordinate cross-role evidence for Capstone report.

### Inputs From Other Roles

- Implementation constraints and API requirements from all roles.
- Content taxonomy and governance needs.
- Deployment/platform limitations.

### Outputs To Other Roles

- Architecture diagrams.
- Responsibility boundaries.
- Deployment plan.
- Shared conventions for safety, data flow, and evidence.

### Explicit Exclusions

- Absorbing feature implementation owned by a specialist role.
- Editing content substance.
- Directly changing scores, prompts, or UI unless explicitly assigned.

