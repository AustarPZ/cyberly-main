const { createPool, getDatabaseErrorSummary } = require('../src/database/pool');
const {
  getMigrationId,
  listMigrationFiles,
  readMigration,
  splitSqlStatements,
} = require('../src/database/migration-utils');

async function hasSchemaMigrationsTable(connection) {
  const [rows] = await connection.query(`
    SELECT COUNT(*) AS count
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'schema_migrations'
  `);
  return rows[0].count > 0;
}

async function getAppliedMigrations(connection) {
  if (!(await hasSchemaMigrationsTable(connection))) {
    return new Map();
  }

  const [rows] = await connection.query(`
    SELECT migration_id, filename, applied_at
    FROM schema_migrations
    ORDER BY migration_id
  `);

  return new Map(rows.map((row) => [row.filename, row]));
}

async function printStatus(connection, migrationFiles) {
  const applied = await getAppliedMigrations(connection);

  console.log('Migration status:');
  for (const filename of migrationFiles) {
    const state = applied.has(filename) ? 'applied' : 'pending';
    console.log(`- ${filename}: ${state}`);
  }
}

async function applyMigration(connection, filename) {
  const migrationId = getMigrationId(filename);
  const sql = readMigration(filename);
  const statements = splitSqlStatements(sql);

  console.log(`Applying ${filename}`);
  await connection.beginTransaction();
  try {
    for (const statement of statements) {
      await connection.query(statement);
    }

    await connection.query(
      `
        INSERT INTO schema_migrations (migration_id, filename)
        VALUES (?, ?)
      `,
      [migrationId, filename]
    );

    await connection.commit();
    console.log(`Applied ${filename}`);
  } catch (error) {
    await connection.rollback();
    console.error(`Failed ${filename}: ${error.code || error.message}`);
    throw error;
  }
}

async function migrate(connection, migrationFiles) {
  const applied = await getAppliedMigrations(connection);

  for (const filename of migrationFiles) {
    if (applied.has(filename)) {
      console.log(`Skipping ${filename}`);
      continue;
    }

    await applyMigration(connection, filename);
  }
}

async function main() {
  const isStatus = process.argv.includes('--status');
  const pool = createPool();
  const connection = await pool.getConnection();

  try {
    const migrationFiles = listMigrationFiles();

    if (isStatus) {
      await printStatus(connection, migrationFiles);
      return;
    }

    await migrate(connection, migrationFiles);
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Migration database connection failed:', getDatabaseErrorSummary(error));
  process.exitCode = 1;
});
