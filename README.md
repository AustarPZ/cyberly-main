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

## Baseline Notes

- The official frontend is `client/`.
- The root React app is legacy and retained only for reference.
- The generated root `node_modules/` folder was removed to prevent Create React App from resolving duplicate ESLint plugins across root and `client/`.
- `client/` production build has been verified successfully.
- `server/.env` loads locally without committing or printing secrets.
- The backend has been verified connecting to the local `cyberwell` MySQL database.
- Authentication is not production-ready yet.
- Database migrations are not configured yet.
- AI provider calls will later be routed through the backend.
