# Implementation Roadmap

1. Baseline
   - Confirm `client/` as official frontend.
   - Keep root React app as legacy.
   - Verify frontend build and backend startup status.
   - Add project documentation and environment templates.

2. Database Migration Management
   - Add migration tooling.
   - Capture the current `cyberwell` schema.
   - Add repeatable local setup instructions.

3. Authentication Repair
   - Align frontend and backend field contracts.
   - Move login to email and password.
   - Add persistent session or token handling.

4. Learner Profile Persistence
   - Store age, age category, school year, language, familiarity, learning goals, and learning style.

5. Assessment System
   - Add assessment questions, attempts, answers, scoring, and baseline cyber wellness profile.

6. Progress And Recommendation
   - Track activity and mastery.
   - Generate adaptive recommendations from performance and learner progress.

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
   - Add admin authentication, role checks, and management views.

12. AI Usage And Cost Monitoring
   - Track provider, model, tokens or units, latency, and estimated cost.

13. Experiment Export
   - Add CSV research exports.
   - Add JSON technical/debug exports.

14. Testing And Deployment
   - Add unit, integration, and end-to-end tests.
   - Add production deployment configuration and operational checks.
