const assert = require('node:assert/strict');

const { createPasswordResetRepository } = require('../src/auth/passwordReset.repository');

async function run() {
  const calls = [];
  const connection = {
    async beginTransaction() { calls.push({ sql: 'BEGIN' }); },
    async commit() { calls.push({ sql: 'COMMIT' }); },
    async rollback() { calls.push({ sql: 'ROLLBACK' }); },
    release() { calls.push({ sql: 'RELEASE' }); },
    async query(sql, params) {
      calls.push({ sql: sql.replace(/\s+/g, ' ').trim(), params });
      if (sql.includes('SELECT id, user_id')) {
        return [[{
          id: 4, user_id: 7, token_type: 'password_reset', token_hash: 'abc', target_email: null,
          expires_at: new Date('2026-08-24T09:00:00.000Z'), used_at: null, revoked_at: null,
          created_at: new Date('2026-08-24T08:00:00.000Z'), request_ip: null, request_user_agent: null,
        }]];
      }
      if (sql.includes('SELECT session_version')) return [[{ session_version: 2 }]];
      return [{ affectedRows: 1, insertId: 4 }];
    },
  };
  const pool = {
    query: connection.query.bind(connection),
    async getConnection() { return connection; },
  };
  const repository = createPasswordResetRepository(pool);

  await repository.transaction(async (repo) => {
    const token = await repo.findTokenByHashForUpdate('abc', 'password_reset');
    assert.equal(token.userId, 7);
    assert.equal(await repo.incrementSessionVersion(7), 2);
    assert.ok(await repo.markTokenUsedIfActive(4, new Date('2026-08-24T08:05:00.000Z')));
  });

  assert.equal(
    await repository.revokeTokenByIdIfActive(4, 'password_reset', new Date('2026-08-24T08:06:00.000Z')),
    true
  );

  assert.ok(calls.some(call => /FOR UPDATE$/.test(call.sql)));
  assert.ok(calls.some(call => /used_at IS NULL AND revoked_at IS NULL/.test(call.sql)));
  assert.ok(calls.some(call => /session_version = session_version \+ 1/.test(call.sql)));
  assert.ok(calls.some(call => (
    /WHERE id = \? AND token_type = \?/.test(call.sql)
    && /used_at IS NULL/.test(call.sql)
    && /revoked_at IS NULL/.test(call.sql)
    && call.params[2] === 'password_reset'
  )));
  assert.deepEqual(calls.filter(call => ['BEGIN', 'COMMIT', 'ROLLBACK', 'RELEASE'].includes(call.sql)).map(call => call.sql), [
    'BEGIN', 'COMMIT', 'RELEASE',
  ]);

  console.log('Password reset repository transaction tests passed: 9 assertions.');
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
