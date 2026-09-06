const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const { assertSafeTestDatabaseName, createIsolatedDatabaseName, buildTestDatabaseConfig,
  validateTestDatabaseEnvironment } = require('../src/database/migration-test-safety');
const { runMigrations } = require('../src/database/migration-runner');
const { createGuardianLinkRepository } = require('../src/guardian/guardianLink.repository');
const { createGuardianLinkService } = require('../src/guardian/guardianLink.service');
const { hashGuardianLinkToken } = require('../src/guardian/guardianLink.token');

const REQUIRED_ENV = ['TEST_DB_HOST', 'TEST_DB_USER', 'TEST_DB_PASSWORD', 'TEST_DB_ADMIN_DATABASE'];
const reference = value => `CY-GL-${String(value).padStart(20, '0')}`;
const tokenHash = value => hashGuardianLinkToken(`guardian-mysql-token-${value}`);

async function expectDuplicate(work, indexName) {
  await assert.rejects(work, error => error.code === 'ER_DUP_ENTRY' && String(error.message).includes(indexName));
}

async function main() {
  if (!REQUIRED_ENV.every(key => String(process.env[key] || '').trim())) {
    throw new Error('Mandatory Guardian Link migration evidence requires explicit loopback TEST_DB_* configuration.');
  }
  const config = validateTestDatabaseEnvironment(process.env);
  const database = assertSafeTestDatabaseName(createIsolatedDatabaseName('guardian_link'));
  const admin = await mysql.createConnection({ host: config.host, port: config.port,
    user: config.user, password: config.password, database: config.adminDatabase });
  let pool;
  try {
    await admin.query(`CREATE DATABASE \`${database}\``);
    pool = mysql.createPool({ ...buildTestDatabaseConfig(config, database), connectionLimit: 6 });
    const migrationConnection = await pool.getConnection();
    try {
      await runMigrations({ connection: migrationConnection });
      await runMigrations({ connection: migrationConnection });
    } finally { migrationConnection.release(); }
    const [[migrationCount]] = await pool.query('SELECT COUNT(*) AS count FROM schema_migrations');
    assert.equal(Number(migrationCount.count), 32);
    const [tables] = await pool.query(
      `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=?
       AND TABLE_NAME IN ('guardian_relationships','guardian_relationship_events')`, [database]);
    assert.deepEqual(tables.map(row => row.TABLE_NAME).sort(), ['guardian_relationship_events', 'guardian_relationships']);

    const addUser = async email => {
      const [result] = await pool.query(
        `INSERT INTO users (email,display_name,age,age_group,password_hash,role,account_status,email_verified_at)
         VALUES (?,'Guardian Test Learner',16,'teen','test-hash','user','active',CURRENT_TIMESTAMP)`, [email]);
      return Number(result.insertId);
    };
    const addRelationship = ({ ref, userId, status, token, expiresAt = new Date(Date.now() + 3600000) }) => pool.query(
      `INSERT INTO guardian_relationships
       (public_reference,learner_user_id,guardian_email_normalized,status,invite_token_hash,
        invite_issued_at,invite_expires_at,created_at,updated_at)
       VALUES (?,?,'guardian@example.test',?,?,NOW(),?,NOW(),NOW())`,
      [ref, userId, status, tokenHash(token), expiresAt]);

    const markerUser = await addUser('guardian-marker@example.test');
    for (const [index, status] of ['PENDING_VERIFICATION', 'LINKED', 'DECLINED', 'EXPIRED', 'REVOKED'].entries()) {
      await addRelationship({ ref: reference(index + 1), userId: markerUser, status, token: `marker-${index}` });
      const [[stored]] = await pool.query('SELECT active_marker FROM guardian_relationships WHERE invite_token_hash=?',
        [tokenHash(`marker-${index}`)]);
      assert.equal(stored.active_marker === null ? null : Number(stored.active_marker),
        ['PENDING_VERIFICATION', 'LINKED'].includes(status) ? 1 : null);
      await pool.query("UPDATE guardian_relationships SET status='REVOKED',revoked_at=NOW() WHERE invite_token_hash=?",
        [tokenHash(`marker-${index}`)]);
    }

    const activeUser = await addUser('guardian-active@example.test');
    await addRelationship({ ref: reference(20), userId: activeUser, status: 'PENDING_VERIFICATION', token: 'active-1' });
    await expectDuplicate(() => addRelationship({ ref: reference(21), userId: activeUser,
      status: 'PENDING_VERIFICATION', token: 'active-2' }), 'uq_guardian_relationships_active_learner');
    await pool.query("UPDATE guardian_relationships SET status='DECLINED',declined_at=NOW() WHERE learner_user_id=?", [activeUser]);
    await addRelationship({ ref: reference(22), userId: activeUser, status: 'LINKED', token: 'active-3' });
    await expectDuplicate(() => addRelationship({ ref: reference(23), userId: activeUser,
      status: 'PENDING_VERIFICATION', token: 'active-4' }), 'uq_guardian_relationships_active_learner');
    await pool.query("UPDATE guardian_relationships SET status='REVOKED',revoked_at=NOW() WHERE learner_user_id=? AND status='LINKED'", [activeUser]);
    await addRelationship({ ref: reference(24), userId: activeUser, status: 'PENDING_VERIFICATION', token: 'active-5' });
    await expectDuplicate(() => addRelationship({ ref: reference(24), userId: markerUser,
      status: 'REVOKED', token: 'unique-ref' }), 'uq_guardian_relationships_public_reference');
    await expectDuplicate(() => addRelationship({ ref: reference(25), userId: markerUser,
      status: 'REVOKED', token: 'active-5' }), 'uq_guardian_relationships_invite_token_hash');

    const fkUser = await addUser('guardian-fk@example.test');
    const [fkResult] = await addRelationship({ ref: reference(30), userId: fkUser, status: 'REVOKED', token: 'fk' });
    await pool.query(
      `INSERT INTO guardian_relationship_events
       (relationship_id,event_type,from_status,to_status,actor_type,created_at)
       VALUES (?,'REVOKED','PENDING_VERIFICATION','REVOKED','SYSTEM',NOW())`, [fkResult.insertId]);
    await assert.rejects(() => pool.query('DELETE FROM guardian_relationships WHERE id=?', [fkResult.insertId]),
      error => error.code === 'ER_ROW_IS_REFERENCED_2');
    await pool.query('DELETE FROM users WHERE id=?', [fkUser]);
    const [[fkRow]] = await pool.query('SELECT learner_user_id FROM guardian_relationships WHERE id=?', [fkResult.insertId]);
    assert.equal(fkRow.learner_user_id, null);
    const [[events]] = await pool.query('SELECT COUNT(*) AS count FROM guardian_relationship_events WHERE relationship_id=?', [fkResult.insertId]);
    assert.equal(Number(events.count), 1);

    const repository = createGuardianLinkRepository(pool);
    let generatedReference = 100;
    let generatedToken = 100;
    const service = createGuardianLinkService({ repository, passwordComparer: async () => true,
      referenceGenerator: () => reference(generatedReference++),
      tokenFactory: () => { const rawToken = `mysql-token-${String(generatedToken++).padStart(32, '0')}`;
        return { rawToken, tokenHash: hashGuardianLinkToken(rawToken) }; },
      emailSender: { sendGuardianInvitation: async () => ({ ok: true }),
        sendGuardianAcceptedConfirmation: async () => ({ ok: true }),
        sendGuardianRevokedNotice: async () => ({ ok: true }) },
      clientBaseUrl: 'https://example.test', now: () => new Date(), logger: { warn() {} } });

    const lazyUser = await addUser('guardian-lazy@example.test');
    await addRelationship({ ref: reference(40), userId: lazyUser, status: 'PENDING_VERIFICATION',
      token: 'lazy', expiresAt: new Date(Date.now() - 60000) });
    assert.equal((await service.getCurrentRelationship(lazyUser)).status, 'EXPIRED');
    await service.getCurrentRelationship(lazyUser);
    const [[expired]] = await pool.query(
      `SELECT status,active_marker,expired_at,
       (SELECT COUNT(*) FROM guardian_relationship_events e WHERE e.relationship_id=r.id AND e.event_type='EXPIRED') events
       FROM guardian_relationships r WHERE learner_user_id=?`, [lazyUser]);
    assert.equal(expired.status, 'EXPIRED');
    assert.equal(expired.active_marker, null);
    assert.ok(expired.expired_at);
    assert.equal(Number(expired.events), 1);
    await service.createInvitation({ userId: lazyUser, guardianEmail: 'new-guardian@example.test', currentPassword: 'password' });

    const concurrentUser = await addUser('guardian-concurrent@example.test');
    const outcomes = await Promise.allSettled([
      service.createInvitation({ userId: concurrentUser, guardianEmail: 'guardian-a@example.test', currentPassword: 'password' }),
      service.createInvitation({ userId: concurrentUser, guardianEmail: 'guardian-b@example.test', currentPassword: 'password' }),
    ]);
    assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1);
    assert.equal(outcomes.find(outcome => outcome.status === 'rejected').reason.code, 'GUARDIAN_LINK_ACTIVE_EXISTS');
    const [[activeCount]] = await pool.query(
      'SELECT COUNT(*) count FROM guardian_relationships WHERE learner_user_id=? AND active_marker=1', [concurrentUser]);
    assert.equal(Number(activeCount.count), 1);
    const [[versionRow]] = await pool.query('SELECT VERSION() version');
    console.log(`Guardian Link isolated MySQL verification passed (${database}, MySQL ${versionRow.version}).`);
  } finally {
    if (pool) await pool.end();
    await admin.query(`DROP DATABASE IF EXISTS \`${database}\``);
    await admin.end();
  }
}

main().catch(error => {
  console.error('Guardian Link isolated migration test failed:', error.code || error.message);
  process.exitCode = 1;
});
