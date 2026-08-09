const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const dotenv = require('dotenv');

const {
  validateDatabaseConfig,
  validateDatabaseTlsConfig,
} = require('../src/config/productionConfig');

const SERVER_ROOT = path.resolve(__dirname, '..');
const STAGING_ENV_PATH = path.join(SERVER_ROOT, '.env.staging.local');

function loadStagingEnvironment(envPath = STAGING_ENV_PATH, targetEnvironment = process.env) {
  if (!fs.existsSync(envPath)) {
    throw new Error('Missing server/.env.staging.local. Create it from server/.env.staging.example.');
  }

  const result = dotenv.config({
    path: envPath,
    processEnv: targetEnvironment,
    override: true,
    quiet: true,
  });
  if (result.error) throw new Error('Unable to load server/.env.staging.local.');
  return targetEnvironment;
}

function validateStagingDatabaseEnvironment(env) {
  if (String(env.NODE_ENV || '').trim().toLowerCase() !== 'production') {
    throw new Error('NODE_ENV must be production for the staging database wrapper.');
  }
  validateDatabaseConfig(env);
  validateDatabaseTlsConfig(env);
}

function getApprovedCommand(commandName) {
  if (commandName === 'migrate') {
    return {
      executable: process.execPath,
      args: ['scripts/migrate.js'],
      cwd: SERVER_ROOT,
    };
  }
  if (commandName === 'migrate:status') {
    return {
      executable: process.execPath,
      args: ['scripts/migrate.js', '--status'],
      cwd: SERVER_ROOT,
    };
  }
  if (commandName === 'verify-content') {
    return {
      executable: process.execPath,
      args: ['scripts/staging-verify-content.js'],
      cwd: SERVER_ROOT,
    };
  }
  if (commandName === 'rag:ingest') {
    return {
      executable: process.execPath,
      args: ['scripts/rag-ingest.js'],
      cwd: SERVER_ROOT,
    };
  }
  throw new Error(`Staging command is not approved: ${commandName || '(missing)'}`);
}

function main(argv = process.argv) {
  const command = getApprovedCommand(argv[2]);
  loadStagingEnvironment();
  validateStagingDatabaseEnvironment(process.env);

  console.log(`Running approved staging command: ${argv[2]}`);
  const result = spawnSync(command.executable, command.args, {
    cwd: command.cwd,
    env: process.env,
    stdio: 'inherit',
  });
  if (result.error) throw new Error('Unable to start the approved staging command.');
  process.exitCode = Number.isInteger(result.status) ? result.status : 1;
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Staging environment error: ${error.message}`);
    process.exitCode = 1;
  }
}

module.exports = {
  STAGING_ENV_PATH,
  getApprovedCommand,
  loadStagingEnvironment,
  main,
  validateStagingDatabaseEnvironment,
};
