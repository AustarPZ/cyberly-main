# Implementation Roadmap

1. Baseline
   - Confirm `client/` as official frontend.
   - Keep root React app as legacy.
   - Verify frontend build and backend startup status.
   - Add project documentation and environment templates.

2. Database Migration Management
   - Completed foundation: migration tooling, `schema_migrations`, and aligned `users` schema.
   - Future work: rollback strategy and production backup workflow.

3. Authentication Repair
   - Completed foundation: frontend calls `/api/auth/register` and `/api/auth/login`.
   - Completed foundation: login uses email and password.
   - Completed foundation: persistent MySQL-backed server sessions.
   - Completed foundation: session restore, logout, auth guards, role guard, and focused auth verification.

4. Learner Profile Persistence
   - Completed foundation: one learner profile per user.
   - Completed foundation: seven-step onboarding saves education level, language, familiarity, help topics, learning style, and AI nickname.
   - Completed foundation: profile restore after refresh and later login.
   - Future work: account settings for display name and age editing.

5. Assessment System
   - Completed foundation: fixed 12-question Initial Cyber Wellness Assessment.
   - Completed foundation: backend scoring, measured level, topic scores, in-progress resume, and completed result restore.
   - Future work: post-test questionnaires, controlled retakes, admin/research reset, and richer assessment analytics.

6. Progress And Recommendation
   - Track activity and mastery.
   - Generate adaptive recommendations from assessment performance and learner progress in a later phase.

7. Scenario Engine
   - Add scenario content, branching decisions, scoring, and attempts.

8. AI Gateway
   - Move provider calls server-side.
   - Add ILMU, OpenAI, and optional Gemini provider adapters.

9. Chatbot
   - Persist chat sessions and messages.
   - Apply safety and localisation rules.

10. Agentic Learning Orchestrator
   - Add workflow state, learning goals, next-step planning, and recommendation handoff.

11. Admin Portal
   - Add secure admin provisioning and management views.
   - Reuse the existing role-check middleware for protected admin APIs.

12. AI Usage And Cost Monitoring
   - Track provider, model, tokens or units, latency, and estimated cost.

13. Experiment Export
   - Add CSV research exports.
   - Add JSON technical/debug exports.

14. Testing And Deployment
   - Add unit, integration, and end-to-end tests.
   - Add production deployment configuration and operational checks.
