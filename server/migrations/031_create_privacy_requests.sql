CREATE TABLE IF NOT EXISTS privacy_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  public_reference CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  user_id INT UNSIGNED NULL,
  request_type ENUM('CORRECTION', 'DELETION') NOT NULL,
  request_subtype ENUM(
    'ACCOUNT_OR_PROFILE_RECORD',
    'LEARNING_ACTIVITY_RECORD',
    'CHAT_OR_AI_RECORD',
    'OTHER_PERSONAL_DATA',
    'WHOLE_ACCOUNT_AND_ASSOCIATED_DATA',
    'SELECTED_PERSONAL_DATA'
  ) NOT NULL,
  data_category ENUM('PROFILE', 'LEARNING_ACTIVITY', 'CHAT', 'SECURITY_OR_RECOVERY', 'OTHER') NULL,
  request_detail TEXT NULL,
  status ENUM('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'COMPLETED', 'DECLINED', 'CANCELLED')
    NOT NULL DEFAULT 'SUBMITTED',
  locale VARCHAR(8) NOT NULL DEFAULT 'en',
  client_request_id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  active_scope_key VARCHAR(64)
    GENERATED ALWAYS AS (
      CASE
        WHEN request_type = 'DELETION' THEN 'DELETION'
        ELSE CONCAT('CORRECTION:', request_subtype)
      END
    ) STORED,
  active_marker TINYINT
    GENERATED ALWAYS AS (
      CASE
        WHEN status IN ('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION') THEN 1
        ELSE NULL
      END
    ) STORED,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  closed_at DATETIME NULL,
  UNIQUE KEY uq_privacy_requests_public_reference (public_reference),
  UNIQUE KEY uq_privacy_requests_user_client_request (user_id, client_request_id),
  UNIQUE KEY uq_privacy_requests_active_scope (user_id, active_scope_key, active_marker),
  KEY idx_privacy_requests_user_created (user_id, created_at),
  KEY idx_privacy_requests_status_created (status, created_at),
  CONSTRAINT fk_privacy_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS privacy_request_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  request_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('SUBMITTED', 'STATUS_CHANGED', 'CANCELLED') NOT NULL,
  from_status ENUM('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'COMPLETED', 'DECLINED', 'CANCELLED') NULL,
  to_status ENUM('SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'COMPLETED', 'DECLINED', 'CANCELLED') NOT NULL,
  actor_type ENUM('LEARNER', 'OPERATOR', 'SYSTEM') NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_privacy_request_events_request_created (request_id, created_at),
  CONSTRAINT fk_privacy_request_events_request
    FOREIGN KEY (request_id)
    REFERENCES privacy_requests(id)
    ON DELETE CASCADE
);
