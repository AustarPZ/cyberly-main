const { createSessionVersionRepository } = require('./sessionVersion.repository');

function mapToken(row) {
  if (!row) return null;
  return {
    id: row.id,
    userId: row.user_id,
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

const TOKEN_COLUMNS = `id, user_id, token_type, token_hash, target_email, expires_at,
  used_at, revoked_at, created_at, request_ip, request_user_agent`;

function createScopedRepository(connection) {
  const sessionVersions = createSessionVersionRepository(connection);

  async function revokeActiveTokens(userId, tokenType, revokedAt) {
    const [result] = await connection.query(
      `UPDATE account_verification_tokens
       SET revoked_at = ?
       WHERE user_id = ?
         AND token_type = ?
         AND used_at IS NULL
         AND revoked_at IS NULL`,
      [revokedAt, Number(userId), tokenType]
    );
    return result.affectedRows;
  }

  async function createToken(token) {
    const [result] = await connection.query(
      `INSERT INTO account_verification_tokens (
          user_id, token_type, token_hash, target_email, expires_at,
          request_ip, request_user_agent
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        Number(token.userId), token.tokenType, token.tokenHash, token.targetEmail || null,
        token.expiresAt, token.requestIp || null, token.requestUserAgent || null,
      ]
    );
    return findTokenById(result.insertId);
  }

  async function findTokenById(tokenId) {
    const [rows] = await connection.query(
      `SELECT ${TOKEN_COLUMNS}
       FROM account_verification_tokens
       WHERE id = ?
       LIMIT 1`,
      [Number(tokenId)]
    );
    return mapToken(rows[0]);
  }

  async function findTokenByHash(tokenHash, tokenType) {
    const [rows] = await connection.query(
      `SELECT ${TOKEN_COLUMNS}
       FROM account_verification_tokens
       WHERE token_hash = ? AND token_type = ?
       LIMIT 1`,
      [tokenHash, tokenType]
    );
    return mapToken(rows[0]);
  }

  async function findTokenByHashForUpdate(tokenHash, tokenType) {
    const [rows] = await connection.query(
      `SELECT ${TOKEN_COLUMNS}
       FROM account_verification_tokens
       WHERE token_hash = ? AND token_type = ?
       LIMIT 1
       FOR UPDATE`,
      [tokenHash, tokenType]
    );
    return mapToken(rows[0]);
  }

  async function markTokenUsedIfActive(tokenId, usedAt) {
    const [result] = await connection.query(
      `UPDATE account_verification_tokens
       SET used_at = ?
       WHERE id = ?
         AND used_at IS NULL AND revoked_at IS NULL`,
      [usedAt, Number(tokenId)]
    );
    if (!result.affectedRows) return null;
    return findTokenById(tokenId);
  }

  return {
    revokeActiveTokens,
    createToken,
    findTokenByHash,
    findTokenByHashForUpdate,
    markTokenUsedIfActive,
    getSessionVersion: sessionVersions.getSessionVersion,
    incrementSessionVersion: sessionVersions.incrementSessionVersion,
  };
}

function createPasswordResetRepository(pool) {
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
  createPasswordResetRepository,
};
