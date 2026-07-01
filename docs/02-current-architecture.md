# Current Architecture

## Structure

- `client/`: official React frontend.
- `server/`: Express backend with MySQL access through `mysql2`.
- `server/migrations/`: versioned SQL migrations.
- `server/scripts/migrate.js`: migration runner and status checker.
- `server/scripts/test-auth.js`: Phase 1B.1 authentication verification script.
- `server/scripts/test-profile.js`: Phase 1B.2 learner-profile persistence and authorization verification script.
- `server/src/database/`: database pool, migration helpers, and age-group utility.
- `server/src/auth/`: authentication validation, route guards, and MySQL session-store adapter.
- `server/src/profile/`: learner-profile routes, service, repository, validation, and response mapping.
- `src/` and root `public/`: legacy React frontend retained for reference only.
- MySQL database: `cyberwell`.

## Official Frontend Decision

`client/` is the official frontend for all new work.

## Legacy Root Frontend

The root React app is legacy. It must not be extended, but it has not been deleted.

The generated root `node_modules/` folder was removed during baseline repair because Create React App was resolving the React ESLint plugin from both root dependencies and `client/` dependencies. Root source files and package files remain intact.

## Current Entry Points

- Official frontend: `client/src/index.js`
- Official frontend app: `client/src/App.jsx`
- Backend: `server/server.js`

## Current MySQL Configuration

The backend currently attempts to connect to:

- host: `localhost`
- user: `root`
- database: `cyberwell`
- password: loaded from `process.env.DB_PASSWORD`

## Current Integration Gaps

- Learner profile fields are persisted in `learner_profiles`.
- Live AI calls are disabled until a backend gateway exists.
- Migration tooling now exists for backend database changes.
- Admin portal UI and admin-user provisioning are not implemented.
- Resource, progress, and learning content are still mostly static frontend data.

## Verified Connection Status

Server startup was verified after local `server/.env` was created. Dotenv loads environment variables without exposing values, Express starts on port `5000`, and MySQL connects successfully.

Read-only verification using `SELECT DATABASE()` confirmed the selected database is `cyberwell`.

## Verified Frontend Build Status

The official `client/` production build completes successfully after removing generated root dependencies. No blocking build errors remain.

The official frontend now follows the newer `v6_App.jsx` UI reference for the landing page, seven-step onboarding, login, dashboard, progress page, resources, and chatbot presentation. Mock authentication and direct browser AI-provider calls from the reference were not preserved.

Frontend authentication calls:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `GET /api/profile`
- `PUT /api/profile`

Backend authentication uses MySQL-backed `express-session` cookies. Session data is intentionally minimal: `userId` and `role`. Cookies are HTTP-only, `sameSite=lax`, locally `secure=false`, and expected to become `secure=true` in production.

Public registration always creates `role=user`. The `/api/admin/ping` endpoint verifies that role-based middleware is in place for future admin routes.

Learner-profile onboarding fields are saved after registration using `PUT /api/profile`. `GET /api/auth/me` returns both the safe user and normalized profile so refresh restores the dashboard state without storing profile payloads in the session.

## Migration Status

The lightweight SQL migration system is installed. Applied migrations:

- `001_create_schema_migrations.sql`
- `002_align_users_table.sql`
- `003_preserve_legacy_users_compatibility.sql`
- `004_harden_users_and_create_sessions.sql`
- `005_create_learner_profiles.sql`

The `users` table is aligned for email/password authentication. Legacy `username` and `password` columns remain nullable for compatibility with old source, but current `/api/auth/*` routes use `email`, `display_name`, `age`, `age_group`, `password_hash`, `role`, and `account_status`.

The `sessions` table stores server-side session state and expiry timestamps.

The `learner_profiles` table stores one profile per user with a cascading foreign key to `users.id`.
