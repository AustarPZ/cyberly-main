const REQUEST_COLUMNS = `
  id, public_reference, user_id, request_type, request_subtype, data_category,
  request_detail, status, locale, client_request_id, created_at, updated_at, closed_at
`;

function mapLearner(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    passwordHash: row.password_hash,
    role: row.role,
    accountStatus: row.account_status,
    emailVerifiedAt: row.email_verified_at || null,
  };
}

function mapRequest(row) {
  if (!row) return null;
  return {
    id: Number(row.id),
    publicReference: row.public_reference,
    userId: row.user_id === null ? null : Number(row.user_id),
    requestType: row.request_type,
    requestSubtype: row.request_subtype,
    dataCategory: row.data_category || null,
    requestDetail: row.request_detail || null,
    status: row.status,
    locale: row.locale,
    clientRequestId: row.client_request_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    closedAt: row.closed_at || null,
  };
}

function duplicateIndex(error = {}) {
  if (error.code !== 'ER_DUP_ENTRY') return null;
  const detail = `${error.sqlMessage || ''} ${error.message || ''}`;
  for (const name of [
    'uq_privacy_requests_public_reference',
    'uq_privacy_requests_user_client_request',
    'uq_privacy_requests_active_scope',
  ]) if (detail.includes(name)) return name;
  return null;
}

function createScopedRepository(connection) {
  async function findLearnerCredentialSnapshot(userId) {
    const [rows] = await connection.query(
      `SELECT id, password_hash, role, account_status, email_verified_at
       FROM users WHERE id = ? LIMIT 1`, [Number(userId)]
    );
    return mapLearner(rows[0]);
  }

  async function lockLearnerForUpdate(userId) {
    const [rows] = await connection.query(
      `SELECT id, password_hash, role, account_status, email_verified_at
       FROM users WHERE id = ? LIMIT 1 FOR UPDATE`, [Number(userId)]
    );
    return mapLearner(rows[0]);
  }

  async function findById(id) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS} FROM privacy_requests WHERE id = ? LIMIT 1`, [Number(id)]
    );
    return mapRequest(rows[0]);
  }

  async function findByUserAndClientRequestId(userId, clientRequestId) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS} FROM privacy_requests
       WHERE user_id = ? AND client_request_id = ? LIMIT 1`,
      [Number(userId), clientRequestId]
    );
    return mapRequest(rows[0]);
  }

  async function findActiveByUserAndScope(userId, activeScopeKey) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS} FROM privacy_requests
       WHERE user_id = ? AND active_scope_key = ? AND active_marker = 1 LIMIT 1`,
      [Number(userId), activeScopeKey]
    );
    return mapRequest(rows[0]);
  }

  async function findByUserAndReference(userId, reference) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS} FROM privacy_requests
       WHERE user_id = ? AND public_reference = ? LIMIT 1`, [Number(userId), reference]
    );
    return mapRequest(rows[0]);
  }

  async function findByUserAndReferenceForUpdate(userId, reference) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS} FROM privacy_requests
       WHERE user_id = ? AND public_reference = ? LIMIT 1 FOR UPDATE`, [Number(userId), reference]
    );
    return mapRequest(rows[0]);
  }

  async function listByUser(userId) {
    const [rows] = await connection.query(
      `SELECT ${REQUEST_COLUMNS} FROM privacy_requests
       WHERE user_id = ? ORDER BY created_at DESC, id DESC`, [Number(userId)]
    );
    return rows.map(mapRequest);
  }

  async function insertRequest(payload) {
    const [result] = await connection.query(
      `INSERT INTO privacy_requests (
         public_reference, user_id, request_type, request_subtype, data_category,
         request_detail, status, locale, client_request_id, created_at, updated_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'SUBMITTED', ?, ?, ?, ?)`,
      [payload.publicReference, Number(payload.userId), payload.requestType, payload.requestSubtype,
        payload.dataCategory, payload.requestDetail, payload.locale || 'en', payload.clientRequestId,
        payload.createdAt, payload.createdAt]
    );
    return findById(result.insertId);
  }

  async function insertEvent(payload) {
    await connection.query(
      `INSERT INTO privacy_request_events (
         request_id, event_type, from_status, to_status, actor_type, created_at
       ) VALUES (?, ?, ?, ?, ?, ?)`,
      [Number(payload.requestId), payload.eventType, payload.fromStatus || null,
        payload.toStatus, payload.actorType, payload.createdAt]
    );
  }

  async function cancelIfStatus({ requestId, statuses, cancelledAt }) {
    const placeholders = statuses.map(() => '?').join(', ');
    const [result] = await connection.query(
      `UPDATE privacy_requests SET status = 'CANCELLED', closed_at = ?, updated_at = ?
       WHERE id = ? AND status IN (${placeholders})`,
      [cancelledAt, cancelledAt, Number(requestId), ...statuses]
    );
    return result.affectedRows === 1 ? findById(requestId) : null;
  }

  return {
    cancelIfStatus,
    findActiveByUserAndScope,
    findByUserAndClientRequestId,
    findByUserAndReference,
    findByUserAndReferenceForUpdate,
    findLearnerCredentialSnapshot,
    insertEvent,
    insertRequest,
    listByUser,
    lockLearnerForUpdate,
  };
}

function createPrivacyRequestRepository(pool) {
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
    } finally {
      connection.release();
    }
  };
  return repository;
}

module.exports = {
  createPrivacyRequestRepository,
  duplicateIndex,
  mapRequest,
};
