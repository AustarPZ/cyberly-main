const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  getApprovedCommand,
  loadStagingEnvironment,
  validateStagingDatabaseEnvironment,
} = require('./run-with-staging-env');

const tempDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberly-staging-env-'));
const envPath = path.join(tempDirectory, '.env.staging.local');
const fakeCa = '-----BEGIN CERTIFICATE-----\\nFAKE_STAGING_CA\\n-----END CERTIFICATE-----';

try {
  fs.writeFileSync(envPath, [
    'NODE_ENV=production',
    'DB_HOST=mysql.example.internal',
    'DB_PORT=3306',
    'DB_NAME=defaultdb',
    'DB_USER=staging_user',
    'DB_PASSWORD=fake-staging-password',
    'DB_SSL_MODE=required',
    `DB_SSL_CA=${fakeCa}`,
    'DB_SSL_REJECT_UNAUTHORIZED=true',
  ].join('\n'));

  const targetEnvironment = { DB_HOST: 'development-host' };
  loadStagingEnvironment(envPath, targetEnvironment);
  assert.equal(targetEnvironment.NODE_ENV, 'production');
  assert.equal(targetEnvironment.DB_HOST, 'mysql.example.internal');
  assert.equal(targetEnvironment.DB_NAME, 'defaultdb');
  assert.equal(targetEnvironment.DB_SSL_CA, fakeCa);

  assert.doesNotThrow(() => validateStagingDatabaseEnvironment(targetEnvironment));
  assert.throws(
    () => validateStagingDatabaseEnvironment({ ...targetEnvironment, DB_SSL_MODE: 'disabled' }),
    /DB_SSL_MODE/
  );

  const command = getApprovedCommand('migrate:status');
  assert.equal(command.executable, process.execPath);
  assert.deepEqual(command.args.slice(-2), ['scripts/migrate.js', '--status']);

  const migrateCommand = getApprovedCommand('migrate');
  assert.equal(migrateCommand.executable, process.execPath);
  assert.deepEqual(migrateCommand.args, ['scripts/migrate.js']);

  const verifyContentCommand = getApprovedCommand('verify-content');
  assert.equal(verifyContentCommand.executable, process.execPath);
  assert.deepEqual(verifyContentCommand.args, ['scripts/staging-verify-content.js']);

  const ragIngestCommand = getApprovedCommand('rag:ingest');
  assert.equal(ragIngestCommand.executable, process.execPath);
  assert.deepEqual(ragIngestCommand.args, ['scripts/rag-ingest.js']);
  const backupCheckCommand = getApprovedCommand('backup:check');
  assert.deepEqual(backupCheckCommand.args, ['scripts/backup-staging-mysql.js', '--check']);
  const backupCommand = getApprovedCommand('backup');
  assert.deepEqual(backupCommand.args, ['scripts/backup-staging-mysql.js']);
  assert.throws(() => getApprovedCommand('db:ensure'), /not approved/);
  assert.throws(() => getApprovedCommand('start'), /not approved/);
  assert.throws(() => getApprovedCommand('unknown'), /not approved/);
} finally {
  fs.rmSync(tempDirectory, { recursive: true, force: true });
}

console.log('Staging environment loader verification passed.');
