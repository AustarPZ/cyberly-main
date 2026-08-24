const assert = require('node:assert/strict');

const MySqlSessionStore = require('../src/auth/mysql-session-store');
const { createSessionVersionRepository } = require('../src/auth/sessionVersion.repository');
const { applyAuthenticatedSession } = require('../src/auth/sessionVersion');

function getSession(store, sid) {
  return new Promise((resolve, reject) => {
    store.get(sid, (error, value) => error ? reject(error) : resolve(value));
  });
}

async function runStoreCases() {
  const cases = [
    { session: { userId: 1 }, currentVersion: 0, valid: true },
    { session: { userId: 1 }, currentVersion: 1, valid: false },
    { session: { userId: 1, sessionVersion: 2 }, currentVersion: 2, valid: true },
    { session: { userId: 1, sessionVersion: 1 }, currentVersion: 2, valid: false },
  ];

  for (const [index, testCase] of cases.entries()) {
    const queries = [];
    const pool = {
      async query(sql, params) {
        queries.push({ sql, params });
        if (sql.includes('FROM sessions')) return [[{ data: testCase.session }]];
        if (sql.includes('FROM users')) return [[{ session_version: testCase.currentVersion }]];
        if (sql.startsWith('DELETE FROM sessions')) return [{ affectedRows: 1 }];
        throw new Error(`Unexpected SQL: ${sql}`);
      },
    };
    const result = await getSession(new MySqlSessionStore(pool, 3600), `sid-${index}`);
    assert.equal(Boolean(result), testCase.valid);
    assert.equal(queries.some(call => call.sql.startsWith('DELETE FROM sessions')), !testCase.valid);
  }
}

async function runRepositoryCases() {
  const calls = [];
  const connection = {
    async query(sql, params) {
      calls.push({ sql, params });
      if (sql.includes('UPDATE users')) return [{ affectedRows: 1 }];
      return [[{ session_version: 3 }]];
    },
  };
  const repository = createSessionVersionRepository(connection);
  assert.equal(await repository.getSessionVersion(7), 3);
  assert.equal(await repository.incrementSessionVersion(7), 3);
  assert.ok(calls.some(call => /session_version = session_version \+ 1/.test(call.sql)));
  assert.ok(calls.every(call => call.params[0] === 7));
}

function runCompositionCases() {
  const session = {};
  applyAuthenticatedSession(session, { id: 7, role: 'user', session_version: 4 });
  assert.deepEqual(session, { userId: 7, role: 'user', sessionVersion: 4 });

  const defaultVersionSession = {};
  applyAuthenticatedSession(defaultVersionSession, { id: 8, role: 'user' });
  assert.equal(defaultVersionSession.sessionVersion, 0);
}

(async () => {
  await runStoreCases();
  await runRepositoryCases();
  runCompositionCases();
  console.log('Session version foundation tests passed: 10 assertions groups.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
