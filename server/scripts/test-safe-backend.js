const { spawnSync } = require('child_process');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });
  if (result.status !== 0) {
    process.exitCode = result.status || 1;
    return false;
  }
  return true;
}

function hasExplicitMigrationTestConfig() {
  return [
    'TEST_DB_HOST',
    'TEST_DB_USER',
    'TEST_DB_PASSWORD',
    'TEST_DB_ADMIN_DATABASE',
  ].every((key) => String(process.env[key] || '').trim());
}

const ok = run(process.execPath, ['scripts/test-migration-foundation-unit.js'], {
  cwd: __dirname + '/..',
});

if (!ok) {
  process.exit();
}

const emailChangeOk = run(process.execPath, ['scripts/test-email-change-foundation.js'], {
  cwd: __dirname + '/..',
});

if (!emailChangeOk) {
  process.exit();
}

const emailChangeRequestOk = run(process.execPath, ['scripts/test-email-change-request.js'], {
  cwd: __dirname + '/..',
});

if (!emailChangeRequestOk) {
  process.exit();
}

const emailChangeConfirmOk = run(process.execPath, ['scripts/test-email-change-confirm.js'], {
  cwd: __dirname + '/..',
});

if (!emailChangeConfirmOk) {
  process.exit();
}

const privacyRequestOk = run(process.execPath, ['scripts/test-privacy-requests.js'], {
  cwd: __dirname + '/..',
});

if (!privacyRequestOk) {
  process.exit();
}

const guardianLinkOk = run(process.execPath, ['scripts/test-guardian-links.js'], {
  cwd: __dirname + '/..',
});

if (!guardianLinkOk) {
  process.exit();
}

if (hasExplicitMigrationTestConfig()) {
  run(process.execPath, ['scripts/test-migrations.js'], {
    cwd: __dirname + '/..',
  });
} else {
  console.log('Skipping isolated migration DB test: TEST_DB_* configuration is not set.');
}
