CREATE TABLE IF NOT EXISTS email_change_requests (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  new_email_normalized VARCHAR(254) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  locale VARCHAR(8) NOT NULL DEFAULT 'en',
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  active_marker TINYINT
    GENERATED ALWAYS AS (
      CASE
        WHEN used_at IS NULL AND revoked_at IS NULL THEN 1
        ELSE NULL
      END
    ) STORED,
  UNIQUE KEY uq_email_change_requests_token_hash (token_hash),
  UNIQUE KEY uq_email_change_requests_active_user (user_id, active_marker),
  UNIQUE KEY uq_email_change_requests_active_email (new_email_normalized, active_marker),
  KEY idx_email_change_requests_user_created (user_id, created_at),
  KEY idx_email_change_requests_expires (expires_at),
  CONSTRAINT fk_email_change_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
