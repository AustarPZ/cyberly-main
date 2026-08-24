ALTER TABLE users
  ADD COLUMN session_version INT UNSIGNED NOT NULL DEFAULT 0 AFTER email_verification_sent_at;
