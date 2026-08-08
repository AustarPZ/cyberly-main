function mapUserVerificationState(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    email: row.email,
    emailVerifiedAt: row.email_verified_at || null,
    emailVerificationSentAt: row.email_verification_sent_at || null,
  };
}

function mapToken(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    userId: Number(row.user_id),
    tokenType: row.token_type,
    tokenHash: row.token_hash,
    targetEmail: row.target_email || null,
    expiresAt: row.expires_at,
    usedAt: row.used_at || null,
    revokedAt: row.revoked_at || null,
    createdAt: row.created_at,
    requestIp: row.request_ip || null,
    requestUserAgent: row.request_user_agent || null,
  };
}

function createEmailVerificationRepository(pool) {
  async function transaction(callback) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(createEmailVerificationRepository(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async function getUserVerificationState(userId) {
    const [rows] = await pool.query(
      `SELECT id, email, email_verified_at, email_verification_sent_at
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [userId]
    );
    return mapUserVerificationState(rows[0]);
  }

  async function setUserVerificationState(userId, patch = {}) {
    const fields = [];
    const params = [];
    if (Object.hasOwn(patch, 'emailVerifiedAt')) {
      fields.push('email_verified_at = ?');
      params.push(patch.emailVerifiedAt);
    }
    if (Object.hasOwn(patch, 'emailVerificationSentAt')) {
      fields.push('email_verification_sent_at = ?');
      params.push(patch.emailVerificationSentAt);
    }
    if (!fields.length) return getUserVerificationState(userId);
    params.push(userId);
    await pool.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return getUserVerificationState(userId);
  }

  async function revokeActiveTokens(userId, tokenType, revokedAt) {
    const [result] = await pool.query(
      `UPDATE account_verification_tokens
       SET revoked_at = ?
       WHERE user_id = ?
         AND token_type = ?
         AND used_at IS NULL
         AND revoked_at IS NULL`,
      [revokedAt, userId, tokenType]
    );
    return result.affectedRows || 0;
  }

  async function createToken(record) {
    const [result] = await pool.query(
      `INSERT INTO account_verification_tokens (
          user_id, token_type, token_hash, target_email, expires_at,
          request_ip, request_user_agent
       )
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        record.userId,
        record.tokenType,
        record.tokenHash,
        record.targetEmail || null,
        record.expiresAt,
        record.requestIp || null,
        record.requestUserAgent || null,
      ]
    );
    const [rows] = await pool.query(
      `SELECT id, user_id, token_type, token_hash, target_email, expires_at,
              used_at, revoked_at, created_at, request_ip, request_user_agent
       FROM account_verification_tokens
       WHERE id = ?
       LIMIT 1`,
      [result.insertId]
    );
    return mapToken(rows[0]);
  }

  async function findTokenByHash(tokenHash, tokenType) {
    const [rows] = await pool.query(
      `SELECT id, user_id, token_type, token_hash, target_email, expires_at,
              used_at, revoked_at, created_at, request_ip, request_user_agent
       FROM account_verification_tokens
       WHERE token_hash = ?
         AND token_type = ?
       LIMIT 1`,
      [tokenHash, tokenType]
    );
    return mapToken(rows[0]);
  }

  async function markTokenUsed(tokenId, usedAt) {
    await pool.query(
      `UPDATE account_verification_tokens
       SET used_at = COALESCE(used_at, ?)
       WHERE id = ?`,
      [usedAt, tokenId]
    );
    const [rows] = await pool.query(
      `SELECT id, user_id, token_type, token_hash, target_email, expires_at,
              used_at, revoked_at, created_at, request_ip, request_user_agent
       FROM account_verification_tokens
       WHERE id = ?
       LIMIT 1`,
      [tokenId]
    );
    return mapToken(rows[0]);
  }

  return {
    transaction,
    getUserVerificationState,
    setUserVerificationState,
    revokeActiveTokens,
    createToken,
    findTokenByHash,
    markTokenUsed,
  };
}

module.exports = {
  createEmailVerificationRepository,
  mapToken,
  mapUserVerificationState,
};
