function createSessionVersionRepository(connection) {
  async function getSessionVersion(userId) {
    const [rows] = await connection.query(
      `SELECT session_version
       FROM users
       WHERE id = ?
       LIMIT 1`,
      [Number(userId)]
    );
    return rows[0] ? Number(rows[0].session_version) : null;
  }

  async function incrementSessionVersion(userId) {
    const numericUserId = Number(userId);
    const [result] = await connection.query(
      `UPDATE users
       SET session_version = session_version + 1
       WHERE id = ?`,
      [numericUserId]
    );
    if (!result.affectedRows) return null;
    return getSessionVersion(numericUserId);
  }

  return {
    getSessionVersion,
    incrementSessionVersion,
  };
}

module.exports = {
  createSessionVersionRepository,
};
