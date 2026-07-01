# Cyberly

Cyberly is an AI-powered cyber wellness toolkit prototype for Malaysian teenagers, with a broader general-user mode for other age groups.

## Project Structure

- `client/` is the official frontend and should be used for all new frontend work.
- `server/` is the Express backend.
- `src/` and root `public/` are a legacy React frontend and must not be extended.
- `cyberwell` is the current local MySQL development database.

## Local Requirements

- Node.js: verified locally with `v24.13.0`
- npm: verified locally with `11.6.2`
- MySQL Server must be running before starting the backend.

## Environment Files

Use the templates below and create local `.env` files as needed:

- `client/.env.example`
- `server/.env.example`

Do not commit real `.env` files or secrets.

## Start The Frontend

```bash
cd client
npm start
```

The frontend runs separately from the backend.

## Start The Backend

```bash
cd server
npm start
```

The backend expects MySQL to be available and the `cyberwell` database to exist.

## Authentication Foundation

Phase 1B.1 implements server-side authentication with MySQL-backed sessions:

- Registration: `POST /api/auth/register`
- Login: `POST /api/auth/login`
- Restore current session: `GET /api/auth/me`
- Logout: `POST /api/auth/logout`
- Admin authorization check: `GET /api/admin/ping`
- Learner profile read/update: `GET /api/profile`, `PUT /api/profile`

Session cookies are HTTP-only, use `sameSite=lax`, and are sent by the official frontend with `credentials: include`. Public registration always creates `role=user`; admin self-registration is not allowed. Passwords are stored with bcrypt hashes only.

Seven-step onboarding preferences are saved to `learner_profiles` after account creation. The session still stores only `userId` and `role`.

## Database Migrations

Run migration status:

```bash
cd server
npm run migrate:status
```

Apply pending migrations:

```bash
cd server
npm run migrate
```

Migrations are stored in `server/migrations/` and tracked in the `schema_migrations` table. Rollback is not implemented yet; take a database backup before production changes.

## Baseline Notes

- The official frontend is `client/`.
- The root React app is legacy and retained only for reference.
- `client/src/App.jsx` has been aligned with the newer `v6_App.jsx` UI reference while replacing mock auth with backend auth calls.
- The generated root `node_modules/` folder was removed to prevent Create React App from resolving duplicate ESLint plugins across root and `client/`.
- `client/` production build has been verified successfully.
- `server/.env` loads locally without committing or printing secrets.
- The backend has been verified connecting to the local `cyberwell` MySQL database.
- The `users`, `sessions`, and `learner_profiles` tables are now under migration management while preserving legacy `username` and `password` columns temporarily.
- Frontend registration calls `POST /api/auth/register`; login calls `POST /api/auth/login`.
- Frontend startup calls `GET /api/auth/me` to restore an existing session, and logout calls `POST /api/auth/logout`.
- Seven-step onboarding preferences are persisted with `PUT /api/profile` and restored through `GET /api/auth/me`.
- Profile editing is available for learner-profile fields. Display name and age editing are deferred to a future account settings endpoint.
- AI provider calls will later be routed through the backend.
- Browser-side direct AI provider calls are disabled.

## Verification

```bash
cd server
npm run migrate:status
npm run migrate
npm run test:auth
npm run test:profile
```

```bash
cd client
npm run test:profile-mappings
npm run build
```
