const assert = require('node:assert/strict');
const mysql = require('mysql2/promise');
const {
  buildAdminDatabaseConfig,
  buildTestDatabaseConfig,
  createIsolatedDatabaseName,
  redactConfigForError,
  validateTestDatabaseEnvironment,
} = require('../src/database/migration-test-safety');
const { listMigrationFilesThrough, runMigrations } = require('../src/database/migration-runner');
const {
  assertExists,
  columnExists,
  foreignKeyExists,
  indexExists,
  migrationRecorded,
  tableExists,
  triggerExists,
} = require('../src/database/schema-assertions');

function getSafeDatabaseErrorSummary(error = {}) {
  return {
    code: error.code || 'UNKNOWN_DATABASE_ERROR',
    errno: error.errno || null,
    sqlState: error.sqlState || null,
  };
}

function quoteIdentifier(identifier) {
  if (!/^cyberly_test_[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error('Unsafe test database identifier.');
  }
  return `\`${identifier}\``;
}

async function createAdminConnection(testConfig) {
  return mysql.createConnection(buildAdminDatabaseConfig(testConfig));
}

async function createDatabase(testConfig, databaseName) {
  const connection = await createAdminConnection(testConfig);
  try {
    await connection.query(
      `CREATE DATABASE ${quoteIdentifier(databaseName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function dropDatabase(testConfig, databaseName) {
  const connection = await createAdminConnection(testConfig);
  try {
    await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(databaseName)}`);
  } finally {
    await connection.end();
  }
}

async function createTestConnection(testConfig, databaseName) {
  return mysql.createConnection(buildTestDatabaseConfig(testConfig, databaseName));
}

async function assertFreshSchema(connection) {
  const expectedTables = [
    'schema_migrations',
    'users',
    'sessions',
    'learner_profiles',
    'assessment_definitions',
    'assessment_questions',
    'assessment_attempts',
    'assessment_answers',
    'assessment_topic_scores',
    'learner_topic_progress',
    'learner_progress_summary',
    'learner_recommendations',
    'scenario_definitions',
    'scenario_steps',
    'scenario_attempts',
    'scenario_decisions',
    'scenario_progress_events',
    'resource_articles',
    'resource_article_translations',
    'chat_conversations',
    'chat_messages',
    'chat_message_generations',
    'chat_message_actions',
    'chat_message_sources',
    'rag_documents',
    'rag_chunks',
    'agentic_execution_traces',
    'account_verification_tokens',
    'email_change_requests',
    'privacy_requests',
    'privacy_request_events',
  ];

  for (const table of expectedTables) {
    await assertExists(`table ${table}`, tableExists(connection, table));
  }

  const expectedUserColumns = [
    'username',
    'password',
    'password_hash',
    'email',
    'display_name',
    'age',
    'age_group',
    'role',
    'account_status',
    'email_verified_at',
    'email_verification_sent_at',
    'session_version',
  ];

  for (const column of expectedUserColumns) {
    await assertExists(`users.${column}`, columnExists(connection, 'users', column));
  }

  await assertExists('users email unique index', indexExists(connection, 'users', 'uq_users_email'));
  await assertExists('legacy username unique index', indexExists(connection, 'users', 'uq_users_username'));
  await assertExists(
    'users insert compatibility trigger',
    triggerExists(connection, 'users_before_insert_legacy_defaults')
  );
  await assertExists(
    'users age-group update trigger',
    triggerExists(connection, 'users_before_update_age_group')
  );
  await assertExists(
    'learner_profiles user uniqueness',
    indexExists(connection, 'learner_profiles', 'uq_learner_profiles_user_id')
  );
  await assertExists(
    'learner_profiles user foreign key',
    foreignKeyExists(connection, 'learner_profiles', 'fk_learner_profiles_user')
  );
  await assertExists(
    'learner_profiles avatar preset column',
    columnExists(connection, 'learner_profiles', 'avatar_preset')
  );
  const [[avatarPresetColumn]] = await connection.query(
    `SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE, COLUMN_DEFAULT
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'learner_profiles'
       AND COLUMN_NAME = 'avatar_preset'`
  );
  if (
    avatarPresetColumn?.DATA_TYPE !== 'varchar'
    || Number(avatarPresetColumn?.CHARACTER_MAXIMUM_LENGTH) !== 32
    || avatarPresetColumn?.IS_NULLABLE !== 'YES'
    || avatarPresetColumn?.COLUMN_DEFAULT !== null
  ) {
    throw new Error('learner_profiles.avatar_preset must be nullable VARCHAR(32) with a NULL default.');
  }
  await assertExists(
    'chat messages conversation foreign key',
    foreignKeyExists(connection, 'chat_messages', 'fk_chat_messages_conversation')
  );
  await assertExists(
    'rag chunks document foreign key',
    foreignKeyExists(connection, 'rag_chunks', 'fk_rag_chunks_document')
  );
  await assertExists(
    'migration 026 recorded',
    migrationRecorded(connection, '026_create_agentic_execution_traces.sql')
  );
  await assertExists(
    'verification token user foreign key',
    foreignKeyExists(connection, 'account_verification_tokens', 'fk_account_verification_tokens_user')
  );
  await assertExists(
    'verification token hash uniqueness',
    indexExists(connection, 'account_verification_tokens', 'uq_account_verification_tokens_hash')
  );
  await assertExists(
    'verification token user/type index',
    indexExists(connection, 'account_verification_tokens', 'idx_account_verification_tokens_user_type')
  );
  await assertExists(
    'verification token expiry index',
    indexExists(connection, 'account_verification_tokens', 'idx_account_verification_tokens_expires')
  );
  await assertExists(
    'migration 027 recorded',
    migrationRecorded(connection, '027_add_email_verification_foundation.sql')
  );
  await assertExists(
    'migration 028 recorded',
    migrationRecorded(connection, '028_add_avatar_preset_to_learner_profiles.sql')
  );
  await assertExists(
    'migration 029 recorded',
    migrationRecorded(connection, '029_add_session_version_to_users.sql')
  );
  await assertExists(
    'migration 030 recorded',
    migrationRecorded(connection, '030_create_email_change_requests.sql')
  );
  await assertExists(
    'email change token hash uniqueness',
    indexExists(connection, 'email_change_requests', 'uq_email_change_requests_token_hash')
  );
  await assertExists(
    'email change active user uniqueness',
    indexExists(connection, 'email_change_requests', 'uq_email_change_requests_active_user')
  );
  await assertExists(
    'email change active candidate uniqueness',
    indexExists(connection, 'email_change_requests', 'uq_email_change_requests_active_email')
  );
  await assertExists(
    'email change user/created index',
    indexExists(connection, 'email_change_requests', 'idx_email_change_requests_user_created')
  );
  await assertExists(
    'email change expiry index',
    indexExists(connection, 'email_change_requests', 'idx_email_change_requests_expires')
  );
  await assertExists(
    'email change user foreign key',
    foreignKeyExists(connection, 'email_change_requests', 'fk_email_change_requests_user')
  );
  await assertExists(
    'migration 031 recorded',
    migrationRecorded(connection, '031_create_privacy_requests.sql')
  );
  for (const [label, table, name] of [
    ['privacy request public reference uniqueness', 'privacy_requests', 'uq_privacy_requests_public_reference'],
    ['privacy request client id uniqueness', 'privacy_requests', 'uq_privacy_requests_user_client_request'],
    ['privacy request active scope uniqueness', 'privacy_requests', 'uq_privacy_requests_active_scope'],
    ['privacy request user/created index', 'privacy_requests', 'idx_privacy_requests_user_created'],
    ['privacy request status/created index', 'privacy_requests', 'idx_privacy_requests_status_created'],
    ['privacy request event timeline index', 'privacy_request_events', 'idx_privacy_request_events_request_created'],
  ]) await assertExists(label, indexExists(connection, table, name));
  await assertExists(
    'privacy request user foreign key',
    foreignKeyExists(connection, 'privacy_requests', 'fk_privacy_requests_user')
  );
  await assertExists(
    'privacy request event foreign key',
    foreignKeyExists(connection, 'privacy_request_events', 'fk_privacy_request_events_request')
  );

  const [privacyColumns] = await connection.query(
    `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE, COLUMN_DEFAULT, EXTRA, GENERATION_EXPRESSION
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'privacy_requests'`
  );
  const privacyByName = new Map(privacyColumns.map(column => [column.COLUMN_NAME, column]));
  assert.equal(privacyByName.get('id')?.COLUMN_TYPE, 'bigint unsigned');
  assert.equal(privacyByName.get('user_id')?.COLUMN_TYPE, 'int unsigned');
  assert.equal(privacyByName.get('user_id')?.IS_NULLABLE, 'YES');
  assert.equal(Number(privacyByName.get('public_reference')?.CHARACTER_MAXIMUM_LENGTH), 26);
  assert.equal(Number(privacyByName.get('client_request_id')?.CHARACTER_MAXIMUM_LENGTH), 36);
  assert.match(String(privacyByName.get('request_type')?.COLUMN_TYPE), /'CORRECTION','DELETION'/i);
  assert.match(String(privacyByName.get('status')?.COLUMN_TYPE), /'NEEDS_INFORMATION'/i);
  assert.match(String(privacyByName.get('active_scope_key')?.EXTRA), /STORED GENERATED/i);
  assert.match(String(privacyByName.get('active_scope_key')?.GENERATION_EXPRESSION), /CORRECTION/i);
  assert.match(String(privacyByName.get('active_marker')?.EXTRA), /STORED GENERATED/i);
  assert.match(String(privacyByName.get('active_marker')?.GENERATION_EXPRESSION), /SUBMITTED/i);

  const [privacyIndexRows] = await connection.query(
    `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'privacy_requests'
       AND INDEX_NAME = 'uq_privacy_requests_active_scope'
     ORDER BY SEQ_IN_INDEX`
  );
  assert.deepEqual(privacyIndexRows.map(row => row.COLUMN_NAME), [
    'user_id', 'active_scope_key', 'active_marker',
  ]);

  const [foreignKeyRules] = await connection.query(
    `SELECT CONSTRAINT_NAME, DELETE_RULE
     FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND CONSTRAINT_NAME IN ('fk_privacy_requests_user', 'fk_privacy_request_events_request')`
  );
  const ruleByName = new Map(foreignKeyRules.map(rule => [rule.CONSTRAINT_NAME, rule.DELETE_RULE]));
  assert.equal(ruleByName.get('fk_privacy_requests_user'), 'SET NULL');
  assert.equal(ruleByName.get('fk_privacy_request_events_request'), 'CASCADE');

  await connection.beginTransaction();
  try {
    const [learnerResult] = await connection.query(
      `INSERT INTO users (
         email, display_name, age, age_group, password_hash, role,
         account_status, email_verified_at
       ) VALUES ('privacy-migration@example.test', 'Privacy Migration', 16, 'teen',
                 'not-a-real-password-hash', 'user', 'active', CURRENT_TIMESTAMP)`
    );
    const userId = Number(learnerResult.insertId);
    const insertRequest = (reference, subtype, clientId, status = 'SUBMITTED') => connection.query(
      `INSERT INTO privacy_requests (
         public_reference, user_id, request_type, request_subtype, request_detail,
         status, client_request_id
       ) VALUES (?, ?, 'CORRECTION', ?, 'Synthetic isolated migration row', ?, ?)`,
      [reference, userId, subtype, status, clientId]
    );
    await insertRequest('CY-PR-00000000000000000001', 'ACCOUNT_OR_PROFILE_RECORD', '550e8400-e29b-41d4-a716-446655440001');
    await assert.rejects(
      insertRequest('CY-PR-00000000000000000002', 'ACCOUNT_OR_PROFILE_RECORD', '550e8400-e29b-41d4-a716-446655440002'),
      error => error.code === 'ER_DUP_ENTRY'
    );
    await insertRequest('CY-PR-00000000000000000003', 'CHAT_OR_AI_RECORD', '550e8400-e29b-41d4-a716-446655440003');
    await insertRequest('CY-PR-00000000000000000004', 'ACCOUNT_OR_PROFILE_RECORD', '550e8400-e29b-41d4-a716-446655440004', 'CANCELLED');
    await insertRequest('CY-PR-00000000000000000005', 'ACCOUNT_OR_PROFILE_RECORD', '550e8400-e29b-41d4-a716-446655440005', 'COMPLETED');
    await connection.query(
      `INSERT INTO privacy_requests (
         public_reference, user_id, request_type, request_subtype, data_category,
         request_detail, status, client_request_id
       ) VALUES
         ('CY-PR-00000000000000000007', ?, 'DELETION', 'WHOLE_ACCOUNT_AND_ASSOCIATED_DATA',
          NULL, NULL, 'SUBMITTED', '550e8400-e29b-41d4-a716-446655440007')`, [userId]
    );
    await assert.rejects(
      connection.query(
        `INSERT INTO privacy_requests (
           public_reference, user_id, request_type, request_subtype, data_category,
           request_detail, status, client_request_id
         ) VALUES
           ('CY-PR-00000000000000000008', ?, 'DELETION', 'SELECTED_PERSONAL_DATA',
            'CHAT', 'Synthetic isolated migration row', 'SUBMITTED',
            '550e8400-e29b-41d4-a716-446655440008')`, [userId]
      ),
      error => error.code === 'ER_DUP_ENTRY'
    );
    await assert.rejects(
      insertRequest('CY-PR-00000000000000000006', 'OTHER_PERSONAL_DATA', '550e8400-e29b-41d4-a716-446655440001'),
      error => error.code === 'ER_DUP_ENTRY'
    );
    const [generatedRows] = await connection.query(
      `SELECT active_scope_key, active_marker FROM privacy_requests
       WHERE user_id = ? ORDER BY id`, [userId]
    );
    assert.equal(generatedRows[0].active_scope_key, 'CORRECTION:ACCOUNT_OR_PROFILE_RECORD');
    assert.equal(Number(generatedRows[0].active_marker), 1);
    assert.equal(generatedRows[2].active_marker, null);
  } finally {
    await connection.rollback();
  }

  const [emailChangeColumns] = await connection.query(
    `SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE, CHARACTER_MAXIMUM_LENGTH,
            IS_NULLABLE, COLUMN_DEFAULT, EXTRA, GENERATION_EXPRESSION
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'email_change_requests'`
  );
  const emailChangeByName = new Map(emailChangeColumns.map(column => [column.COLUMN_NAME, column]));
  assert.equal(emailChangeByName.get('user_id')?.COLUMN_TYPE, 'int unsigned');
  assert.equal(Number(emailChangeByName.get('new_email_normalized')?.CHARACTER_MAXIMUM_LENGTH), 254);
  assert.equal(Number(emailChangeByName.get('token_hash')?.CHARACTER_MAXIMUM_LENGTH), 64);
  assert.equal(Number(emailChangeByName.get('locale')?.CHARACTER_MAXIMUM_LENGTH), 8);
  assert.equal(emailChangeByName.get('locale')?.COLUMN_DEFAULT, 'en');
  const activeMarker = emailChangeByName.get('active_marker');
  assert.equal(activeMarker?.DATA_TYPE, 'tinyint');
  assert.equal(activeMarker?.IS_NULLABLE, 'YES');
  assert.match(String(activeMarker?.EXTRA), /STORED GENERATED/i);
  assert.match(String(activeMarker?.GENERATION_EXPRESSION), /used_at/i);
  assert.match(String(activeMarker?.GENERATION_EXPRESSION), /revoked_at/i);

  const [emailChangeIndexes] = await connection.query(
    `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'email_change_requests'
       AND INDEX_NAME IN (
         'uq_email_change_requests_active_user',
         'uq_email_change_requests_active_email'
       )
     ORDER BY INDEX_NAME, SEQ_IN_INDEX`
  );
  const indexColumns = emailChangeIndexes.reduce((result, index) => {
    if (!result[index.INDEX_NAME]) result[index.INDEX_NAME] = [];
    result[index.INDEX_NAME].push(index.COLUMN_NAME);
    return result;
  }, {});
  assert.deepEqual(indexColumns.uq_email_change_requests_active_user, [
    'user_id',
    'active_marker',
  ]);
  assert.deepEqual(indexColumns.uq_email_change_requests_active_email, [
    'new_email_normalized',
    'active_marker',
  ]);

  const [[sessionVersionColumn]] = await connection.query(
    `SELECT DATA_TYPE, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'users'
       AND COLUMN_NAME = 'session_version'`
  );
  if (
    sessionVersionColumn?.DATA_TYPE !== 'int'
    || !String(sessionVersionColumn?.COLUMN_TYPE || '').includes('unsigned')
    || sessionVersionColumn?.IS_NULLABLE !== 'NO'
    || Number(sessionVersionColumn?.COLUMN_DEFAULT) !== 0
  ) {
    throw new Error('users.session_version must be INT UNSIGNED NOT NULL DEFAULT 0.');
  }

  const migrationFiles = listMigrationFilesThrough();
  const [rows] = await connection.query('SELECT COUNT(*) AS count FROM schema_migrations');
  if (Number(rows[0]?.count || 0) !== migrationFiles.length) {
    throw new Error(`Expected ${migrationFiles.length} applied migrations, found ${rows[0]?.count || 0}.`);
  }
}

async function run() {
  const testConfig = validateTestDatabaseEnvironment(process.env);
  const databaseName = createIsolatedDatabaseName('migrations');
  let created = false;

  try {
    await createDatabase(testConfig, databaseName);
    created = true;

    const connection = await createTestConnection(testConfig, databaseName);
    try {
      await runMigrations({ connection });
      await assertFreshSchema(connection);
      await runMigrations({ connection });
      await assertFreshSchema(connection);
    } finally {
      await connection.end();
    }

    console.log(`Isolated fresh migration test passed for ${databaseName}.`);
  } finally {
    if (created) {
      try {
        await dropDatabase(testConfig, databaseName);
        console.log(`Dropped isolated test database ${databaseName}.`);
      } catch (cleanupError) {
        console.error('Failed to drop isolated test database:', {
          database: databaseName,
          host: redactConfigForError(buildAdminDatabaseConfig(testConfig)).host,
          error: getSafeDatabaseErrorSummary(cleanupError),
        });
      }
    }
  }
}

run().catch((error) => {
  console.error('Isolated migration test failed:', error.message);
  process.exitCode = 1;
});
