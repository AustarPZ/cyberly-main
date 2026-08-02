# Cyberly Project Rules

## Project Identity

- Project name: Cyberly.
- Purpose: AI-supported cyber wellness learning companion for Malaysian teenagers aged 13-17.
- Stack: React frontend, Express/Node backend, MySQL database.
- Current product target: Cyberly Public Beta 0.9, controlled public beta.
- Core design principle: make every learner feel capable of taking the next safe step.
- Current release scope takes precedence over future ideas.

## Database Rules

- The standard database name is `cyberly`.
- Do not use `cyberwell`.
- Do not introduce new `cyberwell` references in code, docs, examples, or setup instructions.
- All schema changes must be numbered migrations in `server/migrations/`.
- Migrations should be safe to run from a fresh database and should be idempotent where practical.
- Do not directly edit production-like data without a migration or an explicit user instruction.
- Run migrations after schema changes.

## Environment Rules

- `server/.env` is local and must not be committed.
- Do not modify `server/.env` unless the user explicitly asks.
- `server/.env.example` must remain safe and must use `DB_NAME=cyberly`.
- API keys, provider keys, session secrets, passwords, and other secrets must never be printed, committed, logged, or exposed to the frontend.

## Development Workflow

- Inspect the current implementation before editing.
- Audit before changing learner-facing behaviour.
- Keep changes narrow and phase-scoped.
- Do not modify unrelated modules.
- Do not change API response formats unless required by the task and covered by tests.
- Do not commit, push, reset, stash, switch branches, or create branches unless the user explicitly asks.
- Do not run destructive cleanup without explicit approval.
- Retain the current technology stack unless a dedicated migration is approved.
- Distinguish verified current implementation from proposed target design.
- Do not claim implementation based only on documentation.
- New changes must include verification evidence appropriate to the phase.
- Avoid unrelated refactoring.

## Product Experience Rules

- Cyberly should feel encouraging, trustworthy, empowering, curious, and optimistic.
- Protect learner safety and privacy in every learner-facing change.
- Public Beta 0.9 product-experience specifications live in `docs/production/product-experience/`.
- Read relevant product-experience docs before learner-facing UI work.
- Documentation is guidance until runtime code and verification prove implementation.

## AI and RAG Rules

- RAG must use reviewed/RAG-ready content.
- Do not expose prompts, provider keys, raw private learner data, raw assessment answers, or raw scenario decisions.
- Sources are citations/evidence, not arbitrary action routes.
- Safety checks must remain before harmful cyber guidance.

## Agentic AI Rules

- Current Agentic AI is backend-orchestrated and read-only.
- Do not implement uncontrolled OpenAI tool calling without explicit phase approval.
- Do not allow tools that mutate scores, execute SQL, expose secrets, or bypass safety.
- Learning routes must not auto-start activities or modify progress unless a future confirmation workflow is implemented.

## Admin Rules

- The currently verified Admin implementation is governance-focused and includes read-only Resource Review Metadata.
- Planned Admin capabilities must not be described as currently implemented.
- Admin editing, Malaysia Guide management, Assessment/Challenge management, FAQ & Guidance management, account management, analytics, and AI-assisted drafting may only be implemented through an explicitly approved scoped phase.
- AI-generated Admin content must remain draft-only until human review and explicit publication.
- Admin endpoints must enforce server-side role checks.
- Admin interfaces must not expose passwords, secrets, or unnecessary private learner data.

## Testing Rules

After relevant changes, run the appropriate checks:

```powershell
npm --prefix server run test:auth
npm --prefix server run test:rag
npm --prefix server run test:ai
npm --prefix server run test:agent
npm --prefix server run test:chat
npm --prefix server run test:assessment
npm --prefix server run test:scenario
npm --prefix server run test:progress
node scripts/verify-locales.js
npm run build
```

For database setup or migration changes, also run:

```powershell
npm --prefix server run db:ensure
npm --prefix server run migrate
```

Run `npm --prefix server run rag:ingest` when CyberGuard RAG demo content must be refreshed.

## Reporting Rules

Every Codex report should include:

- files changed
- commands run
- tests/build results
- database/migration impact
- unresolved assumptions
- whether manual browser verification is still needed
