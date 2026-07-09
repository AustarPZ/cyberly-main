const { spawnSync } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');
const { getDatabaseConfig } = require('../src/database/pool');
const { listMigrationFiles } = require('../src/database/migration-utils');

const SERVER_ROOT = path.resolve(__dirname, '..');
const TEST_DB_NAME = `cyberly_migration_test_${Date.now()}`;

function quoteIdentifier(identifier) {
  if (!/^[A-Za-z0-9_]+$/.test(identifier)) {
    throw new Error('Unsafe database identifier.');
  }
  return `\`${identifier}\``;
}

async function createAdminConnection() {
  const config = getDatabaseConfig();
  return mysql.createConnection({
    ...config,
    database: undefined,
    multipleStatements: false,
  });
}

async function createDatabase(dbName) {
  const connection = await createAdminConnection();
  try {
    await connection.query(
      `CREATE DATABASE ${quoteIdentifier(dbName)} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } finally {
    await connection.end();
  }
}

async function dropDatabase(dbName) {
  const connection = await createAdminConnection();
  try {
    await connection.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(dbName)}`);
  } finally {
    await connection.end();
  }
}

function runMigrations(dbName) {
  const result = spawnSync(process.execPath, ['scripts/migrate.js'], {
    cwd: SERVER_ROOT,
    env: {
      ...process.env,
      DB_NAME: dbName,
    },
    encoding: 'utf8',
  });

  if (result.status !== 0) {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
    throw new Error(`Migration smoke test failed with exit code ${result.status}.`);
  }
}

async function assertFreshSchema(dbName) {
  const config = getDatabaseConfig();
  const connection = await mysql.createConnection({
    ...config,
    database: dbName,
    multipleStatements: false,
  });

  try {
    const expectedTables = [
      'users',
      'sessions',
      'learner_profiles',
      'assessment_definitions',
      'assessment_questions',
      'assessment_attempts',
      'learner_topic_progress',
      'learner_progress_summary',
      'learner_recommendations',
      'scenario_definitions',
      'scenario_steps',
      'scenario_attempts',
      'resource_articles',
      'resource_article_translations',
      'chat_conversations',
      'chat_messages',
      'chat_message_generations',
      'chat_message_actions',
      'rag_documents',
      'rag_chunks',
      'chat_message_sources',
      'schema_migrations',
    ];

    const [tables] = await connection.query(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ?`,
      [dbName]
    );
    const tableNames = new Set(tables.map(row => row.TABLE_NAME));
    for (const table of expectedTables) {
      if (!tableNames.has(table)) {
        throw new Error(`Expected table missing after fresh migrations: ${table}`);
      }
    }

    const [[migrationCount]] = await connection.query('SELECT COUNT(*) AS count FROM schema_migrations');
    const migrationFiles = listMigrationFiles();
    if (Number(migrationCount.count) !== migrationFiles.length) {
      throw new Error(`Expected ${migrationFiles.length} applied migrations, found ${migrationCount.count}.`);
    }

    const [[assessmentCount]] = await connection.query('SELECT COUNT(*) AS count FROM assessment_questions');
    const [[scenarioCount]] = await connection.query('SELECT COUNT(*) AS count FROM scenario_definitions');
    const [[resourceCount]] = await connection.query('SELECT COUNT(*) AS count FROM resource_articles');
    if (Number(assessmentCount.count) < 12) throw new Error('Assessment seed data is missing.');
    if (Number(scenarioCount.count) < 8) throw new Error('Scenario seed data is missing.');
    if (Number(resourceCount.count) < 1) throw new Error('Resource seed data is missing.');
  } finally {
    await connection.end();
  }
}

async function run() {
  try {
    await dropDatabase(TEST_DB_NAME);
    await createDatabase(TEST_DB_NAME);
    runMigrations(TEST_DB_NAME);
    await assertFreshSchema(TEST_DB_NAME);
    console.log(`Fresh migration smoke test passed for ${TEST_DB_NAME}.`);
  } finally {
    await dropDatabase(TEST_DB_NAME).catch(() => {});
  }
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
