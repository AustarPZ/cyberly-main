# Authentication Design

## Phase 1B.1 Scope

Phase 1B.1 completes the authentication and session foundation only. It does not add learner-profile persistence, assessments, AI providers, an admin portal, or experiment export.

## Backend Routes

- `POST /api/auth/register`: validates email, display name, password, and age; creates a `user` role account; starts a session.
- `POST /api/auth/login`: authenticates by email and password; starts a session.
- `GET /api/auth/me`: restores the current authenticated user from the server-side session.
- `POST /api/auth/logout`: destroys the current session and clears the session cookie.
- `GET /api/admin/ping`: protected admin-only route used to verify role middleware.

## Session Model

Authentication uses `express-session` with a custom MySQL-backed store in `server/src/auth/mysql-session-store.js`.

Session payloads are intentionally minimal:

- `userId`
- `role`

Registration and login regenerate the session before storing these values. This keeps authentication state server-side and avoids storing sensitive identity data in browser storage.

## Cookie Settings

The session cookie is configured as:

- HTTP-only
- `sameSite=lax`
- `secure=false` in local development and test
- `secure=true` when `NODE_ENV=production`

The frontend sends requests with `credentials: include`, and the backend CORS configuration uses an explicit `CLIENT_ORIGIN` with credentials enabled.

## Password Storage

Passwords are hashed with bcrypt before storage. API responses exclude password and password-hash fields. The current `/api/auth/register` route inserts `password_hash` only and does not write plaintext passwords into the legacy `password` column.

## Validation

Registration validates:

- email format
- display name required and no longer than 100 characters
- password at least 8 characters with at least one letter and one number
- age as a whole number from 1 to 120

Age groups use backend values:

- `child`
- `teen`
- `young_adult`
- `adult`

## Frontend Integration

The official frontend in `client/` uses:

- `POST /api/auth/register` for account creation
- `POST /api/auth/login` for login
- `GET /api/auth/me` during app startup to restore an authenticated session
- `POST /api/auth/logout` for logout

Seven-step onboarding data is preserved only in the current frontend session after registration. It is displayed as not yet persisted and should move to learner-profile storage in a later phase.

## Verification

`GET /api/auth/me` returns the safe user and normalized learner profile. The learner profile is loaded from MySQL for restoration convenience, but it is not stored in the server-side session.

`server/scripts/test-auth.js` verifies registration, login, session restore, logout, duplicate email handling, invalid age rejection, weak password rejection, role enforcement, safe response shape, password hashing, and cleanup of the named Phase 1B.1 test account.
