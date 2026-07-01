# Database Schema

## Current Database

- Database name: `cyberwell`
- Database engine: MySQL 8.0 local development server
- ORM: none

No real credentials are documented in this repository.

## Migration Approach

The project uses versioned SQL migration files in `server/migrations/` and a Node.js runner at `server/scripts/migrate.js`.

Applied migrations are recorded in the `schema_migrations` table:

- `migration_id`
- `filename`
- `applied_at`

The runner loads `server/.env` locally, discovers `.sql` files in deterministic filename order, skips already-applied migrations, and stops on first failure.

## Commands

Check migration status:

```bash
cd server
npm run migrate:status
```

Apply pending migrations:

```bash
cd server
npm run migrate
```

## Users Table Design

Target columns now present:

- `id`: unsigned auto-increment primary key
- `email`: `varchar(255)`, not null, unique
- `display_name`: `varchar(100)`, not null
- `age`: unsigned integer-compatible type, not null
- `age_group`: `child`, `teen`, `young_adult`, or `adult`
- `password_hash`: `varchar(255)`, not null
- `role`: `user` or `admin`, default `user`
- `account_status`: `active` or `disabled`, default `active`
- `created_at`: timestamp
- `updated_at`: timestamp

Temporary legacy compatibility columns:

- `username`
- `password`

These are retained until the authentication routes are repaired.

## Age-Group Rules

- `1-12`: `child`
- `13-17`: `teen`
- `18-24`: `young_adult`
- `25-120`: `adult`

The database includes an age range check for `age BETWEEN 1 AND 120`. Application-layer validation is still required.

Age and age group must not be used as the main measure of learning ability. Adaptive difficulty should be based on assessment performance and learner mastery.

## Role Rules

- Public registration creates `user` accounts only.
- Public admin self-registration is prohibited.
- The first admin will later be created through a secure seed or setup process.
- Additional admins may only be created by an authorised admin.

## Account Status Rules

- `active`: account can be used.
- `disabled`: account should be blocked by future authentication middleware.

Authentication middleware is not implemented yet.

## Legacy Compatibility Decisions

The existing manually-created `users` table contained zero rows when migrations were introduced. It already had `id`, `username`, `age`, `password`, `email`, `role`, and timestamps.

The migration keeps `username` and `password` temporarily because current backend routes still reference them. It adds `display_name`, `password_hash`, `age_group`, and `account_status` for the future email/password authentication schema.

Compatibility triggers populate future columns from legacy fields during inserts and update `age_group` when age changes. These triggers are temporary and should be revisited during the authentication repair phase.

## Rollback Limitation

Rollback is not implemented in Phase 1B.0. Production database changes require a verified backup before applying migrations.
