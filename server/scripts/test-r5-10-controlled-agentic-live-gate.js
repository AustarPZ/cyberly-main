'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const Module = require('node:module');

// Also reusable as NODE_OPTIONS=--require=<this file> for offline regressions.
// No firewall artifact is written to historical review-evidence.
let networkAttempts = 0;
let blockedImports = 0;
function denyNetwork() {
  networkAttempts += 1;
  throw new Error('OFFLINE_NETWORK_BLOCKED');
}
global.fetch = denyNetwork;
for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  transport.request = denyNetwork;
  transport.get = denyNetwork;
}
for (const name of ['node:net', 'node:tls']) {
  const transport = require(name);
  transport.connect = denyNetwork;
  transport.createConnection = denyNetwork;
}
require('node:net').Socket.prototype.connect = denyNetwork;
const originalLoad = Module._load;
Module._load = function load(request, parent, ...args) {
  const database = /mysql|database[\\/]pool|migrate/.test(request);
  const product = process.env.R510_BLOCK_PRODUCT_IMPORTS === '1' &&
    /server[\\/]src[\\/]|^\.\.?[\\/]src[\\/]|server\.js$/.test(request);
  if (database || product) {
    blockedImports += 1;
    throw new Error('OFFLINE_PRODUCT_IMPORT_BLOCKED');
  }
  return originalLoad.call(this, request, parent, ...args);
};
process.on('exit', () => {
  process.stderr.write(JSON.stringify({ offlineFirewall: 'ACTIVE', networkAttempts, blockedImports }) + '\n');
  if (networkAttempts || blockedImports) process.exitCode = 1;
});

// NODE_OPTIONS can preload this same file before Node marks it as the main module.
if (require.main === module || path.resolve(process.argv[1] || '') === __filename) {
  const harness = path.join(__dirname, 'r5-10-controlled-agentic-live-gate.js');
  const tests = [];
  const test = (name, run) => tests.push({ name, run });
  const baseline = 'cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688';
  const prompt = 'Can you check my current learning progress and tell me which topic I should improve next? Please use my progress.';
  const requiredFiles = [
    'server/server.js', 'server/src/database/pool.js', 'server/src/ai/ai.service.js',
    'server/src/ai/ai.config.js', 'server/src/ai/providers/aiProvider.registry.js',
    'server/src/ai/providers/openai.provider.js', 'server/src/ai/providers/aiProvider.tools.js',
    'server/src/agent/agentModelGateway.js', 'server/src/agent/controlledAgentic.service.js',
    'server/src/agent/controlledToolExecutor.js', 'server/src/agent/agent.toolCatalogue.js',
  ];
  const root = path.resolve(__dirname, '../..');
  const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
  function child(args, env = {}) {
    // Do not pass developer credentials, inherited NODE_OPTIONS or AI_TEST values.
    const safeEnv = Object.fromEntries(['PATH', 'SystemRoot', 'TEMP', 'TMP', 'SystemDrive']
      .filter(key => process.env[key]).map(key => [key, process.env[key]]));
    const result = spawnSync(process.execPath, ['--require', __filename, harness, ...args], {
      cwd: root, encoding: 'utf8', timeout: 15000,
      env: { ...safeEnv, R510_BLOCK_PRODUCT_IMPORTS: '1', ...env },
    });
    assert.equal(result.error, undefined);
    assert.equal(result.status, 0, result.stderr);
    assert.deepEqual(JSON.parse(result.stderr.trim()), {
      offlineFirewall: 'ACTIVE', networkAttempts: 0, blockedImports: 0,
    });
    return JSON.parse(result.stdout.trim());
  }

  test('harness exists before any import or execution', () => assert.ok(fs.existsSync(harness), 'R5_10_HARNESS_MISSING'));
  test('default is inert even with hostile inherited flags', () => {
    const receipt = child([], { NODE_ENV: 'production', AI_CYBERGUARD_LIVE_ENABLED: '1', AI_TEST_MOCK_OPENAI: 'secret-fixture' });
    assert.equal(receipt.result, 'NOT_AUTHORIZED');
    assert.equal(receipt.productBaseSha, baseline);
    for (const key of ['providerCalls', 'logicalCalls', 'plannerCalls', 'finalCalls', 'toolExecutions', 'dbWrites', 'realNetwork']) assert.equal(receipt[key], 0);
    assert.deepEqual(receipt.providerCallsByProvider, { openai: 0, gemini: 0, ilmu: 0 });
    assert.ok(!JSON.stringify(receipt).includes('secret-fixture'));
  });
  test('self-test covers guards without importing product or accessing transports', () => {
    const receipt = child(['--self-test']);
    assert.equal(receipt.result, 'R5_10_OFFLINE_HARNESS_PASS');
    assert.equal(receipt.controlledAgenticLivePass, false);
    assert.equal(receipt.budgetUsd, 0.02);
    for (const key of ['providerCalls', 'toolExecutions', 'dbWrites', 'realNetwork']) assert.equal(receipt[key], 0);
    for (const name of ['planner_good', 'final_good', 'wrong_model', 'wrong_store', 'wrong_tools',
      'extra_call', 'extra_tool_execution', 'wrong_tool_name', 'oversized_request', 'non_openai_destination',
      'budget_breach', 'missing_tool_context', 'replay_invariants', 'normalized_call', 'sticky_stop',
      'missing_usage', 'authorization_interlocks', 'proposal_rejected']) assert.ok(receipt.checks.includes(name), name);
  });
  test('read-only source hashes bind the exact baseline and local checkout', () => {
    const gate = require(harness);
    assert.equal(gate.CONTRACT.productBaseSha, baseline);
    assert.equal(gate.CONTRACT.budgetUsd, 0.02);
    assert.equal(gate.CONTRACT.maxLogicalCalls, 2);
    assert.equal(gate.CONTRACT.maxPhysicalAttempts, 2);
    assert.equal(gate.CONTRACT.maxToolExecutions, 1);
    assert.equal(gate.CONTRACT.plannerMaxOutputTokens, 500);
    assert.equal(gate.CONTRACT.finalMaxOutputTokens, 400);
    assert.equal(gate.CONTRACT.maxRequestBytes, 20000);
    assert.equal(gate.CONTRACT.prompt, prompt);
    assert.equal(gate.CONTRACT.toolName, 'get_learning_progress');
    assert.equal(gate.CONTRACT.renderServiceId, 'srv-d9tiop942hec738b3org');
    assert.equal(gate.CONTRACT.inputUsdPerMillion, 0.75);
    assert.equal(gate.CONTRACT.outputUsdPerMillion, 4.5);
    assert.equal(Object.keys(gate.SOURCE_HASHES).length, 26);
    for (const file of requiredFiles) assert.ok(Object.hasOwn(gate.SOURCE_HASHES, file), file);
    for (const [file, expected] of Object.entries(gate.SOURCE_HASHES)) {
      assert.match(expected, /^[a-f0-9]{64}$/);
      const blob = spawnSync('git', ['show', baseline + ':' + file], { cwd: root, maxBuffer: 2e6 });
      assert.equal(blob.status, 0);
      const baselineBlob = blob.stdout.toString('utf8').replace(/\r\n/g, '\n');
      assert.equal(hash(baselineBlob), expected, file + ' baseline');
      const checkout = fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n');
      assert.equal(hash(checkout), expected, file + ' checkout');
    }
    assert.ok(Object.isFrozen(gate.CONTRACT));
    assert.ok(Object.isFrozen(gate.SOURCE_HASHES));
  });
  test('safe-error allowlist never forwards arbitrary messages or credentials', () => {
    const gate = require(harness);
    assert.ok(gate.SAFE_ERROR_CODES.includes('BUDGET_BREACH'));
    assert.ok(gate.SAFE_ERROR_CODES.includes('SOURCE_HASH_MISMATCH'));
    assert.ok(gate.SAFE_ERROR_CODES.includes('OWNER_AUTHORIZATION_REQUIRED'));
    assert.equal(gate.safeErrorCode(new Error('password=secret-fixture')), 'HARNESS_STOP');
    assert.equal(gate.safeErrorCode(Object.assign(new Error('payload secret-fixture'), { code: 'ERR_ASSERTION' })), 'HARNESS_ASSERTION_FAILED');
    assert.equal(gate.safeErrorCode(new Error('BUDGET_BREACH')), 'BUDGET_BREACH');
  });
  test('source is reviewable plain JS and has no credential printing patterns', () => {
    const source = fs.readFileSync(harness, 'utf8');
    assert.ok(!/\beval\s*\(|new\s+Function\s*\(|from\([^\n]*['"]base64['"]|EncodedCommand/.test(source));
    assert.ok(!/console\.(?:log|error|info|warn)\([^\n]*(?:password|email|apiKey|process\.env|toolResult|response)/i.test(source));
    assert.ok(!/emitReceipt\([^\n]*(?:password|email|toolResult|error\.message)/i.test(source));
    assert.ok(!/process\.(?:stdout|stderr)\.write\([^\n]*(?:password|email|apiKey|error\.message)/i.test(source));
    const pkg = JSON.parse(fs.readFileSync(path.join(root, 'server/package.json'), 'utf8'));
    assert.equal(pkg.scripts['test:r5-10-controlled-agentic-live-gate'], 'node scripts/test-r5-10-controlled-agentic-live-gate.js');
  });
  test('proposal guard matches existing in-memory storage and never queries a fabricated table', () => {
    const source = fs.readFileSync(harness, 'utf8');
    assert.ok(!source.includes('FROM agent_action_proposals'), 'PROPOSALS_ARE_IN_MEMORY');
    const gate = require(harness);
    const state = gate.createGuardState();
    assert.throws(() => gate.blockProposal(state), /ACTION_PROPOSAL_BLOCKED/);
    assert.equal(state.proposalAttempts, 1);
    assert.equal(state.stopped, true);
    assert.equal(state.toolExecutions, 0);
  });
  test('failed attempt usage remains unknown and receipts exclude runtime payloads', () => {
    const gate = require(harness);
    const state = gate.createGuardState();
    state.outboundAttempts = 1;
    state.password = 'private-fixture';
    state.email = 'private-fixture@example.invalid';
    state.toolResult = { data: 'private-fixture' };
    state.providerOutput = 'private-fixture';
    const receipt = gate.safeReceipt(state, 'STOP_REVIEW_REQUIRED');
    assert.equal(receipt.usageComplete, false);
    assert.equal(receipt.transportEstimatedCostUsd, null);
    assert.equal(receipt.knownResponseEstimatedCostUsd, 0);
    assert.ok(!JSON.stringify(receipt).includes('private-fixture'));
  });

  let passed = 0;
  for (const { name, run } of tests) {
    try { run(); passed += 1; process.stdout.write('PASS ' + name + '\n'); }
    catch (error) {
      // Assertions contain only fixed offline fixture values/file names.
      process.stderr.write('FAIL ' + name + ': ' + error.message + '\n');
      process.exitCode = 1;
      if (name === 'harness exists before any import or execution') break;
    }
  }
  process.stdout.write(`${passed}/${tests.length} R5-10 offline harness tests passed\n`);
}
