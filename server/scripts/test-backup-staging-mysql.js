const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { PassThrough } = require('node:stream');

const {
  buildBackupFilename,
  buildDumpArguments,
  createBackup,
  validateBackupEnvironment,
  verifyChecksum,
} = require('./backup-staging-mysql');

const FAKE_PASSWORD = 'not-a-real-password';
const FAKE_CA = '-----BEGIN CERTIFICATE-----\nFAKE_BACKUP_CA\n-----END CERTIFICATE-----';

function validEnvironment(overrides = {}) {
  return {
    NODE_ENV: 'production',
    DB_HOST: 'mysql.example.test',
    DB_PORT: '3306',
    DB_NAME: 'defaultdb',
    DB_USER: 'backup_user',
    DB_PASSWORD: FAKE_PASSWORD,
    DB_SSL_MODE: 'required',
    DB_SSL_CA: FAKE_CA,
    DB_SSL_REJECT_UNAUTHORIZED: 'true',
    ...overrides,
  };
}

function createMockDump({ output = '-- safe fake dump\n', exitCode = 0 } = {}) {
  const calls = [];
  const spawn = (executable, args, options) => {
    calls.push({ executable, args, options });
    const child = {
      stdout: new PassThrough(),
      stderr: new PassThrough(),
      once(event, callback) {
        if (event === 'error') child.onError = callback;
        if (event === 'close') child.onClose = callback;
        return child;
      },
    };
    process.nextTick(() => {
      child.stdout.end(output);
      child.stderr.end(exitCode ? 'fake dump failure' : '');
      child.onClose?.(exitCode);
    });
    return child;
  };
  return { calls, spawn };
}

async function run() {
  assert.throws(() => validateBackupEnvironment(validEnvironment({ DB_HOST: '' })), /DB_HOST/);
  assert.throws(
    () => validateBackupEnvironment(validEnvironment({ DB_SSL_MODE: 'disabled' })),
    /DB_SSL_MODE/
  );
  assert.throws(
    () => validateBackupEnvironment(validEnvironment({ DB_SSL_REJECT_UNAUTHORIZED: 'false' })),
    /DB_SSL_REJECT_UNAUTHORIZED/
  );

  const filename = buildBackupFilename('staging', new Date('2026-08-12T01:02:03Z'));
  assert.equal(filename, 'cyberly-staging-20260812-010203Z.sql.gz');
  assert.equal(filename.includes(FAKE_PASSWORD), false);

  const args = buildDumpArguments('C:\\private\\client.cnf', 'defaultdb');
  assert.deepEqual(args, [
    '--defaults-extra-file=C:\\private\\client.cnf',
    '--single-transaction',
    '--quick',
    '--routines',
    '--triggers',
    '--set-gtid-purged=OFF',
    '--default-character-set=utf8mb4',
    '--hex-blob',
    '--no-tablespaces',
    'defaultdb',
  ]);
  assert.equal(args.join(' ').includes(FAKE_PASSWORD), false);

  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberly-backup-test-'));
  try {
    const missingToolOutput = [];
    await assert.rejects(
      () => createBackup({
        env: validEnvironment(),
        outputDirectory: root,
        resolveExecutable: () => null,
        logger: (value) => missingToolOutput.push(value),
      }),
      /mysqldump is not available/
    );
    assert.equal(missingToolOutput.join('\n').includes(FAKE_PASSWORD), false);
    assert.deepEqual(fs.readdirSync(root), []);

    const failedDump = createMockDump({ exitCode: 2 });
    await assert.rejects(
      () => createBackup({
        env: validEnvironment(),
        outputDirectory: root,
        resolveExecutable: () => 'mysqldump',
        spawnImpl: failedDump.spawn,
        now: () => new Date('2026-08-12T01:02:03Z'),
        logger: () => {},
      }),
      /mysqldump failed/
    );
    assert.deepEqual(fs.readdirSync(root), []);

    const collisionPath = path.join(root, 'cyberly-staging-20260812-010203Z.sql.gz');
    fs.writeFileSync(collisionPath, 'existing-valid-backup');
    await assert.rejects(
      () => createBackup({
        env: validEnvironment(),
        outputDirectory: root,
        resolveExecutable: () => 'mysqldump',
        spawnImpl: createMockDump().spawn,
        now: () => new Date('2026-08-12T01:02:03Z'),
        logger: () => {},
      }),
      /already exists/
    );
    assert.equal(fs.readFileSync(collisionPath, 'utf8'), 'existing-valid-backup');
    fs.rmSync(collisionPath);

    const successfulDump = createMockDump();
    const safeOutput = [];
    const result = await createBackup({
      env: validEnvironment(),
      outputDirectory: root,
      resolveExecutable: () => 'mysqldump',
      spawnImpl: successfulDump.spawn,
      now: () => new Date('2026-08-12T01:02:03Z'),
      logger: (value) => safeOutput.push(value),
    });

    assert.equal(fs.existsSync(result.backupPath), true);
    assert.equal(fs.existsSync(result.checksumPath), true);
    assert.equal(await verifyChecksum(result.backupPath, result.checksumPath), true);
    assert.equal(successfulDump.calls.length, 1);
    assert.equal(successfulDump.calls[0].args.join(' ').includes(FAKE_PASSWORD), false);
    assert.equal(JSON.stringify(successfulDump.calls[0].options).includes(FAKE_PASSWORD), false);
    assert.equal(safeOutput.join('\n').includes(FAKE_PASSWORD), false);
    assert.equal(safeOutput.join('\n').includes(FAKE_CA), false);

    fs.appendFileSync(result.backupPath, 'corruption');
    assert.equal(await verifyChecksum(result.backupPath, result.checksumPath), false);

    const expectedDigest = crypto
      .createHash('sha256')
      .update(fs.readFileSync(result.backupPath).subarray(0, -'corruption'.length))
      .digest('hex');
    assert.match(fs.readFileSync(result.checksumPath, 'utf8'), new RegExp(`^${expectedDigest}  `));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }

  const ignoreFile = fs.readFileSync(path.resolve(__dirname, '..', '..', '.gitignore'), 'utf8');
  assert.match(ignoreFile, /^\/backups\/private\/$/m);

  console.log('Staging MySQL backup offline verification passed.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
