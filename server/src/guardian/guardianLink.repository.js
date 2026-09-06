const RELATIONSHIP_COLUMNS = `
  gr.id, gr.public_reference, gr.learner_user_id, gr.guardian_email_normalized,
  gr.status, gr.locale, gr.invite_token_hash, gr.invite_issued_at, gr.invite_expires_at,
  gr.invite_used_at, gr.created_at, gr.updated_at, gr.linked_at, gr.declined_at,
  gr.expired_at, gr.revoked_at, u.display_name AS learner_display_name
`;

function mapLearner(row) {
  if (!row) return null;
  return {
    id: Number(row.id), email: row.email, displayName: row.display_name,
    passwordHash: row.password_hash, role: row.role, accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at || null,
  };
}

function mapRelationship(row) {
  if (!row) return null;
  return {
    id: Number(row.id), publicReference: row.public_reference,
    learnerUserId: row.learner_user_id === null ? null : Number(row.learner_user_id),
    learnerDisplayName: row.learner_display_name || '',
    guardianEmailNormalized: row.guardian_email_normalized, status: row.status, locale: row.locale,
    inviteTokenHash: row.invite_token_hash, inviteIssuedAt: row.invite_issued_at,
    inviteExpiresAt: row.invite_expires_at, inviteUsedAt: row.invite_used_at || null,
    createdAt: row.created_at, updatedAt: row.updated_at, linkedAt: row.linked_at || null,
    declinedAt: row.declined_at || null, expiredAt: row.expired_at || null,
    revokedAt: row.revoked_at || null,
  };
}

function duplicateIndex(error = {}) {
  if (error.code !== 'ER_DUP_ENTRY') return null;
  const detail = `${error.sqlMessage || ''} ${error.message || ''}`;
  return ['uq_guardian_relationships_public_reference', 'uq_guardian_relationships_invite_token_hash',
    'uq_guardian_relationships_active_learner'].find(name => detail.includes(name)) || null;
}

function createScopedRepository(connection) {
  const select = `SELECT ${RELATIONSHIP_COLUMNS} FROM guardian_relationships gr
    LEFT JOIN users u ON u.id = gr.learner_user_id`;
  async function findLearnerCredentialSnapshot(userId) {
    const [rows] = await connection.query(
      `SELECT id, email, display_name, password_hash, role, account_status, email_verified_at
       FROM users WHERE id = ? LIMIT 1`, [Number(userId)]);
    return mapLearner(rows[0]);
  }
  async function lockLearnerForUpdate(userId) {
    const [rows] = await connection.query(
      `SELECT id, email, display_name, password_hash, role, account_status, email_verified_at
       FROM users WHERE id = ? LIMIT 1 FOR UPDATE`, [Number(userId)]);
    return mapLearner(rows[0]);
  }
  async function findActiveByLearner(userId) {
    const [rows] = await connection.query(`${select}
      WHERE gr.learner_user_id = ? AND gr.active_marker = 1 ORDER BY gr.id ASC LIMIT 1`, [Number(userId)]);
    return mapRelationship(rows[0]);
  }
  async function lockActiveByLearner(userId) {
    const [rows] = await connection.query(`${select}
      WHERE gr.learner_user_id = ? AND gr.active_marker = 1 ORDER BY gr.id ASC LIMIT 1 FOR UPDATE`, [Number(userId)]);
    return mapRelationship(rows[0]);
  }
  async function lockCurrentCandidatesByLearner(userId) {
    const [rows] = await connection.query(`${select}
      WHERE gr.learner_user_id = ? ORDER BY gr.id ASC FOR UPDATE`, [Number(userId)]);
    return rows.map(mapRelationship);
  }
  async function findCurrentByLearner(userId) {
    const active = await findActiveByLearner(userId);
    if (active) return active;
    const [rows] = await connection.query(`${select}
      WHERE gr.learner_user_id = ? ORDER BY gr.created_at DESC, gr.id DESC LIMIT 1`, [Number(userId)]);
    return mapRelationship(rows[0]);
  }
  async function findByLearnerAndReference(userId, reference) {
    const [rows] = await connection.query(`${select}
      WHERE gr.learner_user_id = ? AND gr.public_reference = ? LIMIT 1`, [Number(userId), reference]);
    return mapRelationship(rows[0]);
  }
  async function lockByLearnerAndReference(userId, reference) {
    const [rows] = await connection.query(`${select}
      WHERE gr.learner_user_id = ? AND gr.public_reference = ? LIMIT 1 FOR UPDATE`, [Number(userId), reference]);
    return mapRelationship(rows[0]);
  }
  async function lockByTokenHash(hash) {
    const [rows] = await connection.query(`${select}
      WHERE gr.invite_token_hash = ? LIMIT 1 FOR UPDATE`, [hash]);
    return mapRelationship(rows[0]);
  }
  async function lockById(id) {
    const [rows] = await connection.query(`${select} WHERE gr.id = ? LIMIT 1 FOR UPDATE`, [Number(id)]);
    return mapRelationship(rows[0]);
  }
  async function findById(id) {
    const [rows] = await connection.query(`${select} WHERE gr.id = ? LIMIT 1`, [Number(id)]);
    return mapRelationship(rows[0]);
  }
  async function insertRelationship(payload) {
    const [result] = await connection.query(
      `INSERT INTO guardian_relationships (
        public_reference, learner_user_id, guardian_email_normalized, status, locale,
        invite_token_hash, invite_issued_at, invite_expires_at, created_at, updated_at
      ) VALUES (?, ?, ?, 'PENDING_VERIFICATION', ?, ?, ?, ?, ?, ?)`,
      [payload.publicReference, Number(payload.learnerUserId), payload.guardianEmailNormalized,
        payload.locale, payload.inviteTokenHash, payload.inviteIssuedAt, payload.inviteExpiresAt,
        payload.createdAt, payload.updatedAt]);
    return findById(result.insertId);
  }
  async function updateRelationship(id, patch) {
    const columns = {
      status: 'status', inviteTokenHash: 'invite_token_hash', inviteIssuedAt: 'invite_issued_at',
      inviteExpiresAt: 'invite_expires_at', inviteUsedAt: 'invite_used_at', updatedAt: 'updated_at',
      linkedAt: 'linked_at', declinedAt: 'declined_at', expiredAt: 'expired_at', revokedAt: 'revoked_at',
    };
    const entries = Object.entries(patch).filter(([key]) => columns[key]);
    if (!entries.length) return findById(id);
    await connection.query(`UPDATE guardian_relationships SET ${entries.map(([key]) => `${columns[key]} = ?`).join(', ')} WHERE id = ?`,
      [...entries.map(([, value]) => value), Number(id)]);
    return findById(id);
  }
  async function insertEvent(payload) {
    await connection.query(
      `INSERT INTO guardian_relationship_events (
        relationship_id, event_type, from_status, to_status, actor_type, request_ip, user_agent, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [Number(payload.relationshipId), payload.eventType, payload.fromStatus || null, payload.toStatus,
        payload.actorType, payload.requestIp || null, payload.userAgent || null, payload.createdAt]);
  }
  return { findLearnerCredentialSnapshot, lockLearnerForUpdate, findActiveByLearner,
    lockActiveByLearner, lockCurrentCandidatesByLearner, findCurrentByLearner,
    findByLearnerAndReference, lockByLearnerAndReference, lockByTokenHash, lockById,
    insertRelationship, updateRelationship, insertEvent };
}

function createGuardianLinkRepository(pool) {
  const repository = createScopedRepository(pool);
  repository.transaction = async work => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(createScopedRepository(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally { connection.release(); }
  };
  return repository;
}

module.exports = { createGuardianLinkRepository, duplicateIndex, mapRelationship };
