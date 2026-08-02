# Cyberly Production Documentation

This folder contains production-oriented documentation for the current Cyberly implementation.

Cyberly is an AI-supported cyber wellness learning companion for Malaysian teenagers aged 13-17. The production project currently consists of:

- `client/`: the official React frontend.
- `server/`: the official Express/Node backend.
- MySQL: the application database, with schema managed by numbered migrations in `server/migrations/`.

The root `src/` and root `public/` legacy React application have been removed from the production workspace. New frontend work should be done only in `client/`.

## Documentation Map

- `architecture-specification/`: proposed target production architecture and ADR register. This is not fully implemented and remains subject to current-system audit.
- `product-experience/`: proposed and approved Public Beta 0.9 product-experience foundation. The CyberGuard pilot document now includes the Public Beta 0.9 freeze baseline and handoff evidence; other experience documents remain target design guidance unless they include separate implementation evidence.
- `audits/current-system/`: repository-derived current implementation inventory. This records current facts from migrations, runtime code, services, repositories, tests, and documentation without live database verification.
- `gap-analysis/`: production gap, risk, dependency, priority, and release-blocker register comparing the target architecture with the current implementation inventory.
- `architecture/system-overview.md`: current runtime architecture and major subsystems.
- `deployment/current-deployment.md`: deployable shape, required runtime configuration, and prototype deployment notes.
- `deployment/deployment-roadmap.md`: future deployment hardening work.
- `configuration/environment-variables.md`: frontend and backend environment variables by purpose.
- `testing/migration-test-foundation.md`: isolated migration-test safety contract and fresh-schema verification guide.

## Production Rules

- Do not commit `.env` files or secrets.
- Use `cyberly` as the standard database name.
- Run database changes through numbered migrations.
- Keep public frontend variables limited to non-secret values.
- Keep AI provider keys, database credentials, and session secrets backend-only.
