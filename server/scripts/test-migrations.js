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
