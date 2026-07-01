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

These are retained while legacy source remains in the project. Current `/api/auth/*` routes do not store plaintext passwords and do not depend on legacy password values.

## Sessions Table Design

Phase 1B.1 adds a `sessions` table for server-side authentication sessions:

- `sid`: session identifier primary key
- `expires`: session expiry timestamp
- `data`: JSON session payload

The application stores only minimal session data: `userId` and `role`.

## Learner Profiles Table Design

Phase 1B.2 adds `learner_profiles` with one row per user:

- `id`: unsigned auto-increment primary key
- `user_id`: unique foreign key to `users.id`
- `ai_nickname`: optional display nickname for learning interactions
- `education_level`: `form_1`, `form_2`, `form_3`, `form_4`, `form_5`, `other`, or `prefer_not_to_say`
- `preferred_language`: `english`, `bahasa_melayu`, `chinese`, or `mixed`
- `familiarity_level`: `beginner`, `intermediate`, or `advanced`
- `help_topics`: validated JSON array with up to three approved topic identifiers
- `learning_style`: `step_by_step`, `short_explanations`, or `quizzes_and_challenges`
- `onboarding_completed`: boolean completion flag
- `onboarding_completed_at`: timestamp set the first time onboarding is completed
- `profile_last_confirmed_at`: timestamp updated when the profile is confirmed or saved
- `created_at`, `updated_at`

`learner_profiles.user_id` uses `ON DELETE CASCADE` so deleting a user also deletes that user's learner preferences and avoids orphaned personal data.

The table does not store assessment results, recommendation state, chat history, or inferred learning ability.

## Initial Assessment Tables

Phase 1C.1 adds:

- `assessment_definitions`: versioned assessment metadata. Version 1 of `initial-cyber-wellness-v1` is published with 12 questions.
- `assessment_questions`: fixed question bank with topic, options JSON, correct option, explanation, difficulty, display order, and status.
- `assessment_attempts`: user-owned attempt records with status, score, percentage, measured level, and timestamps.
- `assessment_answers`: one selected option per question per attempt. Correctness and awarded score are calculated by the backend.
- `assessment_topic_scores`: topic-level correct count, total count, and percentage per completed attempt.

Assessment attempt rows cascade when a user is deleted. Answers and topic scores cascade when an attempt is deleted. Assessment definitions and questions use restrictive deletion rules so completed baseline records are not silently broken.

Measured levels:

- `0-39`: beginner
- `40-69`: developing
- `70-84`: intermediate
- `85-100`: advanced

Measured level is not stored in `users` or `learner_profiles`.

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

Authentication middleware blocks missing sessions. Role middleware currently protects `/api/admin/ping` and can be reused for future admin APIs.

## Legacy Compatibility Decisions

The existing manually-created `users` table contained zero rows when migrations were introduced. It already had `id`, `username`, `age`, `password`, `email`, `role`, and timestamps.

The migration keeps `username` and `password` temporarily because legacy source remains in the project. It adds `display_name`, `password_hash`, `age_group`, and `account_status` for the email/password authentication schema.

Compatibility triggers populate safe defaults from legacy fields during inserts and update `age_group` when age changes. The current trigger no longer copies legacy password values into `password_hash`.

## Rollback Limitation

Rollback is not implemented yet. Production database changes require a verified backup before applying migrations.
