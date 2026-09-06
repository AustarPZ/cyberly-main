CREATE TABLE IF NOT EXISTS guardian_relationships (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  public_reference CHAR(26) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  learner_user_id INT UNSIGNED NULL,
  guardian_email_normalized VARCHAR(254) NOT NULL,
  status ENUM('PENDING_VERIFICATION', 'LINKED', 'DECLINED', 'EXPIRED', 'REVOKED')
    NOT NULL DEFAULT 'PENDING_VERIFICATION',
  locale VARCHAR(8) NOT NULL DEFAULT 'en',
  invite_token_hash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
  invite_issued_at DATETIME NOT NULL,
  invite_expires_at DATETIME NOT NULL,
  invite_used_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  linked_at DATETIME NULL,
  declined_at DATETIME NULL,
  expired_at DATETIME NULL,
  revoked_at DATETIME NULL,
  active_marker TINYINT GENERATED ALWAYS AS (
    CASE WHEN status IN ('PENDING_VERIFICATION', 'LINKED') THEN 1 ELSE NULL END
  ) STORED,
  UNIQUE KEY uq_guardian_relationships_public_reference (public_reference),
  UNIQUE KEY uq_guardian_relationships_invite_token_hash (invite_token_hash),
  UNIQUE KEY uq_guardian_relationships_active_learner (learner_user_id, active_marker),
  KEY idx_guardian_relationships_learner_created (learner_user_id, created_at),
  KEY idx_guardian_relationships_status_expiry (status, invite_expires_at),
  CONSTRAINT fk_guardian_relationships_learner
    FOREIGN KEY (learner_user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS guardian_relationship_events (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  relationship_id BIGINT UNSIGNED NOT NULL,
  event_type ENUM('INVITED', 'RESENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED') NOT NULL,
  from_status ENUM('PENDING_VERIFICATION', 'LINKED', 'DECLINED', 'EXPIRED', 'REVOKED') NULL,
  to_status ENUM('PENDING_VERIFICATION', 'LINKED', 'DECLINED', 'EXPIRED', 'REVOKED') NOT NULL,
  actor_type ENUM('LEARNER', 'GUARDIAN_LINK_TOKEN', 'SYSTEM') NOT NULL,
  request_ip VARCHAR(45) NULL,
  user_agent VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_guardian_relationship_events_relationship_created (relationship_id, created_at),
  CONSTRAINT fk_guardian_relationship_events_relationship
    FOREIGN KEY (relationship_id) REFERENCES guardian_relationships(id) ON DELETE RESTRICT
);
