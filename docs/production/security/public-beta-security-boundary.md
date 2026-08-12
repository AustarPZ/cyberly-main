# Public Beta Security Boundary

**Status:** Implemented repository baseline; staging runtime acceptance pending.

This document records the bounded security assumptions for Cyberly's first public beta. It does not claim penetration testing, multi-instance abuse-control durability, or static-site header deployment.

## HTTP Security Headers

The Express API applies Helmet before CORS, request parsing, sessions, and routes. API responses use a deny-by-default CSP, deny framing, disable MIME sniffing, use `Referrer-Policy: no-referrer`, and disable camera, microphone, and geolocation through `Permissions-Policy`. Production API responses include HSTS.

The API CSP is intentionally suitable for JSON responses and must not be copied directly to the React Static Site. The frontend's document CSP and other static-response headers remain a hosting configuration responsibility and require separate staging inspection.

## Origin and CSRF Policy

Cyberly uses a Secure, HttpOnly session cookie across separate sibling frontend and API origins. CORS permits credentials only for the exact `CLIENT_ORIGIN`.

For `POST`, `PUT`, `PATCH`, and `DELETE` requests:

- a supplied `Origin` must exactly equal `CLIENT_ORIGIN` in every environment;
- production requires an `Origin` header;
- missing `Origin` is allowed only in development and test so existing local scripts can operate;
- an unexpected or missing production Origin receives a generic `403 SECURITY_ORIGIN_REJECTED` response.

`GET`, `HEAD`, and `OPTIONS` are not blocked by the mutation-Origin middleware. Production non-browser mutation clients are not supported by this first-beta contract and would require a separately approved authentication mechanism.

## Authentication Abuse Controls

Registration and login use separate process-local fixed-window limiters:

- registration: 10 requests per IP per 15 minutes;
- login: 20 requests per IP per 15 minutes;
- login: 10 requests per normalized-email hash per 15 minutes.

The account-aware key stores a short SHA-256-derived identifier, not the email address. IP and account limits return the same status, code, and message and do not reveal whether an account exists. There is no permanent account lockout.

## CyberGuard Cost Controls

The first beta assumes one Render backend instance. CyberGuard retains:

- per-user minute and daily generation limits;
- one concurrent generation per learner;
- a database check for in-progress generations;
- persisted generation cost estimates;
- a database-backed global estimated daily spend check.

`AI_DAILY_BUDGET_USD` is required and must be greater than zero in production. The owner must choose the value based on the approved beta budget. Process-local burst and per-user counters reset on restart and are not shared across instances; the global estimated daily budget remains based on persisted usage.

## Controlled Agentic Request Protection

Proposal, confirmation, and cancellation requests retain their existing authentication, ownership, confirmation, idempotency, and expiry behavior. They additionally share a process-local limit of 30 requests per authenticated learner per minute. This phase does not certify Controlled Agentic behavior on staging.

## Known Limitations

- The rate-limit stores are process-local and assume one backend instance.
- Static frontend response headers require separate Render configuration and inspection.
- Origin validation is the bounded first-beta CSRF control; no CSRF token framework is used.
- Monitoring, backup/restore, rollback, and Controlled Agentic staging acceptance remain separate release gates.
