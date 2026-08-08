ALTER TABLE users
  ADD COLUMN email_verified_at DATETIME NULL AFTER account_status;

ALTER TABLE users
  ADD COLUMN email_verification_sent_at DATETIME NULL AFTER email_verified_at;

UPDATE users
SET email_verified_at = COALESCE(email_verified_at, CURRENT_TIMESTAMP);

CREATE TABLE IF NOT EXISTS account_verification_tokens (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  token_type VARCHAR(64) NOT NULL,
  token_hash CHAR(64) NOT NULL,
  target_email VARCHAR(254) NULL,
  expires_at DATETIME NOT NULL,
  used_at DATETIME NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  request_ip VARCHAR(45) NULL,
  request_user_agent VARCHAR(255) NULL,
  UNIQUE KEY uq_account_verification_tokens_hash (token_hash),
  KEY idx_account_verification_tokens_user_type (user_id, token_type),
  KEY idx_account_verification_tokens_expires (expires_at),
  CONSTRAINT fk_account_verification_tokens_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);
