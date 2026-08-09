const assert = require('assert');
const path = require('path');

const {
  listMigrationFiles,
  readMigration,
  splitSqlStatements,
} = require('../src/database/migration-utils');

const migrationsDir = path.resolve(__dirname, '../migrations');
const migration012 = '012_seed_scenario_ms_zhCN_translations.sql';
const expectedTemporaryTables = [
  'tmp_scenario_definition_translations',
  'tmp_scenario_step_translations',
  'tmp_scenario_option_translations',
];

function getCreateTableStatements(filename) {
  return splitSqlStatements(readMigration(filename, migrationsDir)).filter((statement) =>
    /^CREATE\s+(?:TEMPORARY\s+)?TABLE\b/i.test(statement)
  );
}

function getCreatedTableName(statement) {
  const match = statement.match(
    /^CREATE\s+(?:TEMPORARY\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-z0-9_]+)`?/i
  );
  assert.ok(match, `Unable to identify table in statement: ${statement.slice(0, 80)}`);
  return match[1];
}

function hasPrimaryKey(statement) {
  return /\bPRIMARY\s+KEY(?:\s*\(|\b)/i.test(statement);
}

function runMigration012ContractTests() {
  const sql = readMigration(migration012, migrationsDir);
  const temporaryTables = getCreateTableStatements(migration012).filter((statement) =>
    /^CREATE\s+TEMPORARY\s+TABLE\b/i.test(statement)
  );

  assert.deepEqual(
    temporaryTables.map(getCreatedTableName),
    expectedTemporaryTables,
    'migration 012 must retain its three expected temporary tables'
  );

  for (const statement of temporaryTables) {
    assert.ok(
      hasPrimaryKey(statement),
      `${getCreatedTableName(statement)} must define a primary key for sql_require_primary_key`
    );
  }

  assert.match(sql, /INSERT INTO scenario_definition_translations/i);
  assert.match(sql, /INSERT INTO scenario_step_translations/i);
  assert.match(sql, /INSERT INTO scenario_option_translations/i);
  assert.match(sql, /'ms'/);
  assert.match(sql, /'zh-CN'/);
}

function runPendingMigrationCompatibilityTests() {
  const pendingFiles = listMigrationFiles(migrationsDir).filter((filename) => {
    const migrationId = Number(filename.slice(0, 3));
    return migrationId >= 12 && migrationId <= 27;
  });

  for (const filename of pendingFiles) {
    for (const statement of getCreateTableStatements(filename)) {
      assert.ok(
        hasPrimaryKey(statement),
        `${filename}: ${getCreatedTableName(statement)} must define a primary key`
      );
    }
  }
}

runMigration012ContractTests();
runPendingMigrationCompatibilityTests();
console.log('Migration primary-key compatibility tests passed.');
