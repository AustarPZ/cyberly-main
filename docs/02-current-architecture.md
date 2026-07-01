# Current Architecture

## Structure

- `client/`: official React frontend.
- `server/`: Express backend with MySQL access through `mysql2`.
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

- Registration sends `name`, while the backend expects `username`.
- Frontend expects a returned user object, while backend registration returns only a message.
- Login uses in-memory mock data instead of `/api/login`.
- Learner profile fields are not persisted.
- AI calls are made from the frontend instead of through a backend gateway.
- No migration system exists.

## Verified Connection Status

Server startup was verified after local `server/.env` was created. Dotenv loads environment variables without exposing values, Express starts on port `5000`, and MySQL connects successfully.

Read-only verification using `SELECT DATABASE()` confirmed the selected database is `cyberwell`.

## Verified Frontend Build Status

The official `client/` production build completes successfully after removing generated root dependencies. The build still reports one React Hook dependency warning in `client/src/App.jsx`, but no blocking build errors remain.
