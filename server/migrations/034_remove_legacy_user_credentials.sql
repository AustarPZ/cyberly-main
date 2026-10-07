-- Validate existing rows before removing any legacy compatibility schema.
-- A violated enforced CHECK aborts before either column or trigger is dropped.
ALTER TABLE users
  ADD CONSTRAINT chk_users_legacy_credentials_empty
  CHECK (
    (username IS NULL OR TRIM(username) = '')
    AND (password IS NULL OR TRIM(password) = '')
  ) ENFORCED;

DROP TRIGGER IF EXISTS users_before_insert_legacy_defaults;

ALTER TABLE users
  DROP CHECK chk_users_legacy_credentials_empty,
  DROP COLUMN username,
  DROP COLUMN password;
