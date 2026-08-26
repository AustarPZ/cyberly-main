const REQUEST_COLUMNS = `
  id,
  user_id,
  new_email_normalized,
  token_hash,
  locale,
  expires_at,
  used_at,
  revoked_at,
  created_at
`;

function mapEmailChangeRequest(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    newEmailNormalized: row.new_email_normalized,
    tokenHash: row.token_hash,
    locale: row.locale,
    expiresAt: row.expires_at,
    usedAt: row.used_at || null,
    revokedAt: row.revoked_at || null,
    createdAt: row.created_at,
  };
}

function mapEmailChangeLearner(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at || null,
    sessionVersion: Number(row.session_version || 0),
  };
}

function isActiveReservationConflict(error = {}) {
  if (error.code !== 'ER_DUP_ENTRY') return false;
  const detail = `${error.sqlMessage || ''} ${error.message || ''}`;
  return /uq_email_change_requests_active_(user|email)/i.test(detail);
}

function createScopedRepository(connection) {
  async function findById(requestId) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS}
       FROM email_change_requests
       WHERE id = ?
       LIMIT 1`,
      [Number(requestId)]
    );
    return mapEmailChangeRequest(rows[0]);
  }

  async function lockLearnerForUpdate(userId) {
    const [rows] = await connection.query(
      `SELECT id, email, password_hash, role, account_status,
              email_verified_at, session_version
       FROM users
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [Number(userId)]
    );
    return mapEmailChangeLearner(rows[0]);
  }

  async function findCanonicalEmailOwner(newEmailNormalized) {
    const [rows] = await connection.query(
      `SELECT id
       FROM users
       WHERE email = ?
       LIMIT 1`,
      [newEmailNormalized]
    );
    return rows[0] ? { id: Number(rows[0].id) } : null;
  }

  async function revokeExpiredActiveRequests({
    userId,
    newEmailNormalized,
    revokedAt,
  }) {
    const [result] = await connection.query(
      `UPDATE email_change_requests
       SET revoked_at = ?
       WHERE used_at IS NULL
         AND revoked_at IS NULL
         AND expires_at <= ?
         AND (user_id = ? OR new_email_normalized = ?)`,
      [revokedAt, revokedAt, Number(userId), newEmailNormalized]
    );
    return result.affectedRows;
  }

  async function revokeActiveForUser(userId, revokedAt) {
    const [result] = await connection.query(
      `UPDATE email_change_requests
       SET revoked_at = ?
       WHERE user_id = ?
         AND used_at IS NULL
         AND revoked_at IS NULL`,
      [revokedAt, Number(userId)]
    );
    return result.affectedRows;
  }

  async function createRequest(request) {
    const [result] = await connection.query(
      `INSERT INTO email_change_requests (
         user_id,
         new_email_normalized,
         token_hash,
         locale,
         expires_at,
         created_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        Number(request.userId),
        request.newEmailNormalized,
        request.tokenHash,
        request.locale || 'en',
        request.expiresAt,
        request.createdAt || new Date(),
      ]
    );
    return findById(result.insertId);
  }

  async function findByTokenHash(tokenHash) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS}
       FROM email_change_requests
       WHERE token_hash = ?
       LIMIT 1`,
      [tokenHash]
    );
    return mapEmailChangeRequest(rows[0]);
  }

  async function findByTokenHashForUpdate(tokenHash) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS}
       FROM email_change_requests
       WHERE token_hash = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash]
    );
    return mapEmailChangeRequest(rows[0]);
  }

  async function markUsedIfActive(requestId, usedAt) {
    const [result] = await connection.query(
      `UPDATE email_change_requests
       SET used_at = ?
       WHERE id = ?
         AND used_at IS NULL
         AND revoked_at IS NULL`,
      [usedAt, Number(requestId)]
    );
    return result.affectedRows === 1 ? findById(requestId) : null;
  }

  async function revokeByIdIfActive(requestId, revokedAt) {
    const [result] = await connection.query(
      `UPDATE email_change_requests
       SET revoked_at = ?
       WHERE id = ?
         AND used_at IS NULL
         AND revoked_at IS NULL`,
      [revokedAt, Number(requestId)]
    );
    return result.affectedRows === 1;
  }

  async function revokeOtherActiveForUser(userId, exceptRequestId, revokedAt) {
    const [result] = await connection.query(
      `UPDATE email_change_requests
       SET revoked_at = ?
       WHERE user_id = ?
         AND id <> ?
         AND used_at IS NULL
         AND revoked_at IS NULL`,
      [revokedAt, Number(userId), Number(exceptRequestId)]
    );
    return result.affectedRows;
  }

  async function listActiveForUser(userId) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS}
       FROM email_change_requests
       WHERE user_id = ?
         AND used_at IS NULL
         AND revoked_at IS NULL
       ORDER BY id DESC`,
      [Number(userId)]
    );
    return rows.map(mapEmailChangeRequest);
  }

  return {
    createRequest,
    findById,
    findByTokenHash,
    findByTokenHashForUpdate,
    findCanonicalEmailOwner,
    listActiveForUser,
    lockLearnerForUpdate,
    markUsedIfActive,
    revokeActiveForUser,
    revokeByIdIfActive,
    revokeExpiredActiveRequests,
    revokeOtherActiveForUser,
  };
}

function createEmailChangeRepository(pool) {
  const repository = createScopedRepository(pool);
  repository.transaction = async function transaction(work) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await work(createScopedRepository(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  };
  return repository;
}

module.exports = {
  createEmailChangeRepository,
  isActiveReservationConflict,
  mapEmailChangeLearner,
  mapEmailChangeRequest,
};
