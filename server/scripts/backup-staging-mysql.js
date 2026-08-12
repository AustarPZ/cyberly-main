const crypto = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawn, spawnSync } = require('node:child_process');
const { pipeline } = require('node:stream/promises');
const { createGzip } = require('node:zlib');

const {
  validateDatabaseConfig,
  validateDatabaseTlsConfig,
} = require('../src/config/productionConfig');

const REPOSITORY_ROOT = path.resolve(__dirname, '..', '..');
const DEFAULT_OUTPUT_DIRECTORY = path.join(REPOSITORY_ROOT, 'backups', 'private');

function validateBackupEnvironment(env) {
  if (String(env.NODE_ENV || '').trim().toLowerCase() !== 'production') {
    throw new Error('NODE_ENV must be production for staging backup operations.');
  }
  validateDatabaseConfig(env);
  validateDatabaseTlsConfig(env);
  return env;
}

function buildBackupFilename(environmentName, date = new Date()) {
  const normalizedEnvironment = String(environmentName || '').trim().toLowerCase();
  if (!/^[a-z0-9-]+$/.test(normalizedEnvironment)) {
    throw new Error('Backup environment name is invalid.');
  }
  const timestamp = date.toISOString().replace(/[-:]/g, '').replace('T', '-').replace(/\.\d{3}Z$/, 'Z');
  return `cyberly-${normalizedEnvironment}-${timestamp}.sql.gz`;
}

function buildDumpArguments(optionFilePath, databaseName) {
  return [
    `--defaults-extra-file=${optionFilePath}`,
    '--single-transaction',
    '--quick',
    '--routines',
    '--triggers',
    '--set-gtid-purged=OFF',
    '--default-character-set=utf8mb4',
    '--hex-blob',
    '--no-tablespaces',
    databaseName,
  ];
}

function safeOptionValue(value, fieldName) {
  const text = String(value ?? '');
  if (!text || /[\r\n\0]/.test(text)) {
    throw new Error(`${fieldName} contains an unsupported value.`);
  }
  return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
}

function writeTemporaryClientFiles(env, temporaryDirectory) {
  const caPath = path.join(temporaryDirectory, 'mysql-ca.pem');
  const optionPath = path.join(temporaryDirectory, 'mysql-client.cnf');
  const ca = String(env.DB_SSL_CA).replace(/\\n/g, '\n').trim();
  fs.writeFileSync(caPath, `${ca}\n`, { encoding: 'utf8', mode: 0o600 });
  const optionFile = [
    '[client]',
    `host=${safeOptionValue(env.DB_HOST, 'DB_HOST')}`,
    `port=${Number(env.DB_PORT)}`,
    `user=${safeOptionValue(env.DB_USER, 'DB_USER')}`,
    `password=${safeOptionValue(env.DB_PASSWORD, 'DB_PASSWORD')}`,
    'ssl-mode=VERIFY_IDENTITY',
    `ssl-ca=${safeOptionValue(caPath, 'DB_SSL_CA path')}`,
    '',
  ].join('\n');
  fs.writeFileSync(optionPath, optionFile, { encoding: 'utf8', mode: 0o600 });
  return optionPath;
}

function resolveMysqldump(spawnSyncImpl = spawnSync) {
  const result = spawnSyncImpl('mysqldump', ['--version'], {
    encoding: 'utf8',
    windowsHide: true,
    stdio: 'ignore',
  });
  if (result.error || result.status !== 0) return null;
  return 'mysqldump';
}

function childEnvironment() {
  const allowed = ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'ComSpec', 'TEMP', 'TMP', 'HOME'];
  return Object.fromEntries(
    allowed.filter((name) => process.env[name] !== undefined).map((name) => [name, process.env[name]])
  );
}

async function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  await pipeline(fs.createReadStream(filePath), hash);
  return hash.digest('hex');
}

async function verifyChecksum(backupPath, checksumPath) {
  const expected = fs.readFileSync(checksumPath, 'utf8').trim().split(/\s+/)[0];
  if (!/^[a-f0-9]{64}$/i.test(expected)) return false;
  const actual = await sha256File(backupPath);
  return crypto.timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(expected, 'hex'));
}

async function createBackup({
  env = process.env,
  outputDirectory = DEFAULT_OUTPUT_DIRECTORY,
  resolveExecutable = resolveMysqldump,
  spawnImpl = spawn,
  now = () => new Date(),
  logger = console.log,
} = {}) {
  validateBackupEnvironment(env);
  const executable = resolveExecutable();
  if (!executable) throw new Error('mysqldump is not available. Install a MySQL 8 client before backup.');

  const filename = buildBackupFilename('staging', now());
  const backupPath = path.join(outputDirectory, filename);
  const checksumPath = `${backupPath}.sha256`;
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), 'cyberly-mysql-backup-'));
  fs.chmodSync(temporaryDirectory, 0o700);
  let backupOwned = false;
  let checksumOwned = false;

  try {
    fs.mkdirSync(outputDirectory, { recursive: true });
    const optionPath = writeTemporaryClientFiles(env, temporaryDirectory);
    const outputHandle = fs.openSync(backupPath, 'wx', 0o600);
    backupOwned = true;
    const outputStream = fs.createWriteStream(null, { fd: outputHandle, autoClose: true });
    const child = spawnImpl(executable, buildDumpArguments(optionPath, env.DB_NAME), {
      env: childEnvironment(),
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      if (stderr.length < 4096) stderr += String(chunk).slice(0, 4096 - stderr.length);
    });

    const childResult = new Promise((resolve, reject) => {
      child.once('error', () => reject(new Error('Unable to start mysqldump.')));
      child.once('close', (code) => resolve(code));
    });
    await Promise.all([
      pipeline(child.stdout, createGzip({ level: 9 }), outputStream),
      childResult.then((code) => {
        if (code !== 0) throw new Error('mysqldump failed; no backup was retained.');
      }),
    ]);

    const digest = await sha256File(backupPath);
    fs.writeFileSync(checksumPath, `${digest}  ${filename}\n`, {
      encoding: 'utf8',
      mode: 0o600,
      flag: 'wx',
    });
    checksumOwned = true;
    const size = fs.statSync(backupPath).size;
    logger(`Backup completed: ${filename}`);
    logger(`Backup size: ${size} bytes`);
    logger(`SHA-256 generated: ${path.basename(checksumPath)}`);
    logger(`Timestamp: ${now().toISOString()}`);
    return { backupPath, checksumPath, filename, size };
  } catch (error) {
    if (backupOwned) fs.rmSync(backupPath, { force: true });
    if (checksumOwned) fs.rmSync(checksumPath, { force: true });
    if (error.code === 'EEXIST') throw new Error('Backup output already exists; no file was overwritten.');
    throw error;
  } finally {
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}

async function main(argv = process.argv) {
  validateBackupEnvironment(process.env);
  const executable = resolveMysqldump();
  if (!executable) throw new Error('mysqldump is not available. Install a MySQL 8 client before backup.');
  if (argv.includes('--check')) {
    console.log('Staging backup prerequisites passed: verified TLS configuration and mysqldump available.');
    return;
  }
  await createBackup({ resolveExecutable: () => executable });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Staging backup failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  DEFAULT_OUTPUT_DIRECTORY,
  buildBackupFilename,
  buildDumpArguments,
  createBackup,
  main,
  resolveMysqldump,
  validateBackupEnvironment,
  verifyChecksum,
};
