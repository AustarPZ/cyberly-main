'use strict';

// Install the existing network/DB firewall before loading the gate or adapter.
require('../../review-evidence/r5-02/network-firewall.cjs');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const originalLoad = Module._load;
const serverSourceRoot = path.resolve(__dirname, '../src').replaceAll('\\', '/').toLowerCase() + '/';
let forbiddenImportAttempts = 0;
Module._load = function(request, ...rest) {
  const resolved = Module._resolveFilename(request, rest[0], rest[1]).replaceAll('\\', '/').toLowerCase();
  const applicationPath = resolved.startsWith(serverSourceRoot) ? resolved.slice(serverSourceRoot.length) : null;
  const forbiddenPackage = /^(?:dotenv|mysql|mysql2)(?:\/|$)/.test(request);
  // SDK resource modules include chat APIs; only application source is excluded.
  const forbiddenApplication = applicationPath !== null && /(?:^|\/)(?:db|database|chat|rag|runtime)(?:[/._-]|$)|\.service\.js$|\.repository\.js$|\.registry\.js$|(?:^|\/)ai\.provider\.js$|runtime.*\.js$/.test(applicationPath);
  if (forbiddenPackage || forbiddenApplication) {
    forbiddenImportAttempts++;
    throw new Error('Offline chat gate import firewall');
  }
  return originalLoad.call(this, request, ...rest);
};

const gatePath = path.join(__dirname, 'ai-provider-chat-gate.js');
const fixtureSecret = 'offline-fixture-secret-only';
const SYSTEM = 'Cyberly internal bounded chat capability check. Use only the supplied conversation context. Reply with the requested token exactly and with no extra text.';
const MESSAGES = [
  { role: 'user', content: "Remember the token from the assistant's next message for my following question." },
  { role: 'assistant', content: 'CYBERLY_CHAT_47' },
  { role: 'user', content: 'What token did the assistant just give me? Reply with the token only.' },
];
const EXPECTED_REPLY = 'CYBERLY_CHAT_47';
const env = { OPENAI_API_KEY: fixtureSecret, AI_LIVE_GATE_AUTHORIZED: '1' };
const args = ['--execute', '--provider', 'openai', '--model', 'gpt-5.4-mini', '--authorization-id', 'R5-04A-OWNER-OFFLINE-FIXTURE', '--budget-usd', '0.01', '--candidate-sha', '53aab9a51c04d70c521ee230de0fda8f5e391b3d'];
const EMPTY_DIAGNOSTICS = {
  returnedModel: null, returnedModelAvailable: null, returnedModelSafe: null,
  requestedModelMatch: null, rawModelMatch: null,
  modelIdentityPolicyVersion: 'openai-gpt-5.4-mini-r5-03d-v1',
  modelIdentityAccepted: null, approvedSnapshotMatch: null,
  finishReasonMatch: null, responseTextMatch: null, outputSafetyAccepted: null,
  toolCallCount: null, toolCallCountMatch: null,
  messageCount: 3, assistantHistoryIncluded: true, roleSequence: 'user,assistant,user',
  failedChatChecks: [],
};
const HEALTHY_DIAGNOSTICS = {
  ...EMPTY_DIAGNOSTICS,
  returnedModel: 'gpt-5.4-mini', returnedModelAvailable: true, returnedModelSafe: true,
  requestedModelMatch: true, rawModelMatch: true,
  modelIdentityAccepted: true, approvedSnapshotMatch: false,
  finishReasonMatch: true, responseTextMatch: true, outputSafetyAccepted: true,
  toolCallCount: 0, toolCallCountMatch: true,
};
const PRIVATE_TOOL = {
  type: 'function_call', id: 'fc_private_fixture', call_id: 'call_private_fixture',
  name: 'fixture_private_tool', arguments: '{"private":"fixture_tool_argument"}', status: 'completed',
};
const caseNames = [];
const failures = [];
let fixtureOutboundAttempts = 0;
let runGate;

function withArg(flag, value, base = args) {
  const changed = [...base];
  changed[changed.indexOf(flag) + 1] = value;
  return changed;
}
function withoutArg(flag) {
  const changed = [...args];
  changed.splice(changed.indexOf(flag), flag === '--execute' ? 1 : 2);
  return changed;
}
function output(text = EXPECTED_REPLY) {
  return [{ type: 'message', role: 'assistant', content: [{ type: 'output_text', text, annotations: [] }] }];
}
function response(patch = {}, status = 200, headers = {}) {
  const body = status === 200 ? {
    id: 'resp_fixture', object: 'response', status: 'completed', model: 'gpt-5.4-mini',
    output: output(), usage: { input_tokens: 20, output_tokens: 5, total_tokens: 25 }, ...patch,
  } : { error: { message: fixtureSecret, type: 'fixture_failure' } };
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', 'x-request-id': 'req_fixture', ...headers } });
}
function noOutbound() {
  throw new Error('A preflight/guard refusal reached the fixture HTTP boundary');
}
function fixtureFetch(handler = () => response()) {
  return async (...request) => {
    fixtureOutboundAttempts++;
    return handler(...request);
  };
}
function noLeak(result, ...markers) {
  const serialized = JSON.stringify(result);
  for (const marker of [fixtureSecret, SYSTEM, EXPECTED_REPLY, ...markers]) {
    assert.equal(serialized.includes(marker), false, 'Gate result leaked a private fixture value');
  }
  for (const key of ['text', 'content', 'output', 'output_text', 'messages', 'systemInstruction', 'toolCalls', 'toolArguments', 'rawMetadata']) {
    assert.equal(Object.hasOwn(result, key), false, `Gate result exposed ${key}`);
  }
}
function evaluated(result) {
  assert.equal(result.gateVersion, 'r5-04a-v1');
  assert.equal(result.purpose, 'bounded_provider_chat');
  assert.equal(result.conversationContractVersion, 'chat-context-v1');
  assert.equal(result.testState, 'tested');
  assert.equal(result.logicalCallsAuthorized, 1);
  assert.equal(result.logicalCallsActual, 1);
  assert.equal(result.transportAttemptsAuthorized, 1);
  assert.equal(result.transportInvocationsActual, 1);
  assert.equal(result.actualOutboundAttempts, 1);
  assert.equal(result.maxOutputTokens, 16);
  assert.equal(result.maxRetries, 0);
  assert.equal(result.retryCount, 0);
  assert.equal(result.unexpectedDuplicateAttempt, false);
  assert.equal(Number.isFinite(result.latencyMs) && result.latencyMs >= 0, true);
  assert.equal(Number.isNaN(Date.parse(result.timestamp)), false);
  assert.equal(result.providerReportedCostUsd, null);
  noLeak(result);
}
function invalid(result, patch) {
  evaluated(result);
  assert.equal(result.authState, 'valid');
  assert.equal(result.chatState, 'fail');
  assert.equal(result.resultCode, 'INVALID_CHAT_RESPONSE');
  assert.deepEqual(result.chatDiagnostics, { ...HEALTHY_DIAGNOSTICS, ...patch });
}
async function check(name, task) {
  assert.equal(caseNames.includes(name), false, 'Fixture case names must be unique');
  caseNames.push(name);
  try { await task(); }
  catch (error) {
    failures.push({ case: name, message: String(error.stack || error.message).replaceAll(fixtureSecret, '[fixture-secret-redacted]') });
  }
}
async function fixture(patch = {}, alternateArgs = args, alternateEnv = env, gate = runGate) {
  let attempts = 0;
  const result = await gate(alternateArgs, alternateEnv, { fetchImpl: fixtureFetch(() => { attempts++; return response(patch); }) });
  assert.equal(attempts, 1, 'Only one HTTP fixture attempt is allowed');
  noLeak(result);
  return result;
}
// Wrapping the factory preserves the installed SDK and real adapter generate path.
// It exposes otherwise unreachable adversarial adapter/transport boundary cases.
async function withRealAdapterWrapper(wrapper, task) {
  const providerPath = require.resolve('../src/ai/providers/openai.provider');
  const oldProvider = require.cache[providerPath];
  const oldGate = require.cache[gatePath];
  try {
    require.cache[providerPath] = {
      ...oldProvider,
      exports: { ...oldProvider.exports, createOpenAiProvider(config) { return wrapper(oldProvider.exports.createOpenAiProvider, config); } },
    };
    delete require.cache[gatePath];
    await task(require(gatePath).runGate);
  } finally {
    require.cache[providerPath] = oldProvider;
    require.cache[gatePath] = oldGate;
  }
}

async function conversationContractCases() {
  await check('assistant history exclusively owns expected token', async () => {
    assert.equal(MESSAGES.length, 3);
    assert.deepEqual(MESSAGES.map(message => message.role), ['user', 'assistant', 'user']);
    assert.equal(MESSAGES[0].content.includes(EXPECTED_REPLY), false);
    assert.equal(MESSAGES[1].content, EXPECTED_REPLY);
    assert.equal(MESSAGES[2].content.includes(EXPECTED_REPLY), false);
  });
}

async function preflightCases() {
  const refusals = [
    ['missing execute', withoutArg('--execute'), env, 'NOT_AUTHORIZED'],
    ['missing provider', withoutArg('--provider'), env, 'PROVIDER_REQUIRED'],
    ['missing model', withoutArg('--model'), env, 'MODEL_REQUIRED'],
    ['missing authorization ID', withoutArg('--authorization-id'), env, 'AUTHORIZATION_ID_REQUIRED'],
    ['missing budget', withoutArg('--budget-usd'), env, 'BUDGET_REQUIRED'],
    ['missing authorization environment', args, { ...env, AI_LIVE_GATE_AUTHORIZED: undefined }, 'NOT_AUTHORIZED'],
    ['authorization environment exact 1', args, { ...env, AI_LIVE_GATE_AUTHORIZED: 'true' }, 'NOT_AUTHORIZED'],
    ['missing provider key', args, { ...env, OPENAI_API_KEY: undefined }, 'AI_PROVIDER_NOT_CONFIGURED'],
    ['disabled provider runtime', args, { ...env, AI_PROVIDER_RUNTIME_DISABLED: ' gemini, OpenAI ' }, 'AI_RUNTIME_DISABLED'],
    ['gemini preflight refusal', withArg('--provider', 'gemini'), env, 'PROVIDER_NOT_YET_HARDENED'],
    ['ilmu preflight refusal', withArg('--provider', 'ilmu'), env, 'PROVIDER_NOT_YET_HARDENED'],
    ['unknown provider', withArg('--provider', 'other'), env, 'PROVIDER_REQUIRED'],
    ['unknown model pricing', withArg('--model', 'unknown-model'), env, 'UNKNOWN_MODEL_PRICING'],
    ['snapshot cannot be requested', withArg('--model', 'gpt-5.4-mini-2026-03-17'), env, 'UNKNOWN_MODEL_PRICING'],
    ['budget below reserve', withArg('--budget-usd', '0.00083999'), env, 'BUDGET_INSUFFICIENT'],
    ['invalid candidate SHA', withArg('--candidate-sha', 'not-a-sha'), env, 'CANDIDATE_SHA_INVALID'],
    ['candidate SHA final newline refusal', withArg('--candidate-sha', '53aab9a51c04d70c521ee230de0fda8f5e391b3d\n'), env, 'CANDIDATE_SHA_INVALID'],
    ['authorization ID final newline refusal', withArg('--authorization-id', 'ValidFixture\n'), env, 'AUTHORIZATION_ID_REQUIRED'],
    ['authorization ID equal to provider key', withArg('--authorization-id', fixtureSecret), env, 'AUTHORIZATION_ID_REQUIRED'],
    ['authorization ID containing provider key is refused without leakage', withArg('--authorization-id', `Owner_${fixtureSecret}`), env, 'AUTHORIZATION_ID_REQUIRED'],
  ];
  for (const id of ['sk-private', 'AIzaPrivate', 'space id', 'A'.repeat(97), '123start']) {
    refusals.push([`invalid authorization ID ${refusals.length + 1}`, withArg('--authorization-id', id), env, 'AUTHORIZATION_ID_REQUIRED']);
  }
  for (const budget of ['0', '-1', 'NaN', 'Infinity', '1e-2', '0.01USD']) {
    refusals.push([`invalid budget ${budget}`, withArg('--budget-usd', budget), env, 'BUDGET_REQUIRED']);
  }
  for (const extra of [['--prompt', 'anything'], ['--max-output-tokens', '17'], ['--system', 'anything'], ['--provider', 'ilmu'], ['--execute']]) {
    refusals.push([`forbidden or duplicate argument ${extra.join(' ')}`, [...args, ...extra], env, 'INVALID_ARGUMENTS']);
  }
  refusals.push(['argument missing value', [...args, '--candidate-sha'], env, 'INVALID_ARGUMENTS']);
  for (const [name, argv, environment, code] of refusals) await check(name, async () => {
    const result = await runGate(argv, environment, { fetchImpl: noOutbound });
    assert.equal(result.resultCode, code);
    assert.equal(result.testState, 'not_tested');
    assert.equal(result.authState, 'not_tested');
    assert.equal(result.chatState, 'not_tested');
    assert.equal(result.logicalCallsAuthorized, 0);
    assert.equal(result.logicalCallsActual, 0);
    assert.equal(result.transportAttemptsAuthorized, 0);
    assert.equal(result.transportInvocationsActual, 0);
    assert.equal(result.actualOutboundAttempts, 0);
    assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
    noLeak(result);
  });
  await check('transport must be available before authorization', async () => {
    const result = await runGate(args, env, { fetchImpl: null });
    assert.equal(result.resultCode, 'TRANSPORT_UNAVAILABLE');
    assert.equal(result.actualOutboundAttempts, 0);
    assert.equal(result.logicalCallsAuthorized, 0);
    assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
    noLeak(result);
  });
}

async function responseCases() {
  await check('alias success through installed SDK and exact bounded conversation request', async () => {
    let requests = 0;
    const result = await runGate(args, env, { fetchImpl: fixtureFetch((url, options) => {
      requests++;
      assert.equal(String(url), 'https://api.openai.com/v1/responses');
      assert.equal(options.method, 'POST');
      assert.equal(options.redirect, 'error');
      assert.equal(options.signal instanceof AbortSignal, true);
      const body = JSON.parse(options.body);
      assert.deepEqual(Object.keys(body).sort(), ['input', 'instructions', 'max_output_tokens', 'model', 'store']);
      assert.equal(body.model, 'gpt-5.4-mini');
      assert.equal(body.instructions, SYSTEM);
      assert.deepEqual(body.input, MESSAGES);
      assert.equal(body.max_output_tokens, 16);
      assert.equal(body.store, false);
      for (const field of ['tools', 'text', 'format', 'previous_response_id', 'conversation', 'learnerContext', 'ragContext', 'routeContext', 'metadata']) {
        assert.equal(Object.hasOwn(body, field), false, `Forbidden serialized field ${field}`);
      }
      return response();
    }) });
    assert.equal(requests, 1);
    evaluated(result);
    assert.equal(result.authState, 'valid');
    assert.equal(result.chatState, 'pass');
    assert.equal(result.resultCode, 'CHAT_PASS');
    assert.deepEqual(result.chatDiagnostics, HEALTHY_DIAGNOSTICS);
    assert.equal(result.authorizationId, 'R5-04A-OWNER-OFFLINE-FIXTURE');
    assert.equal(result.candidateGitSha, '53aab9a51c04d70c521ee230de0fda8f5e391b3d');
    assert.equal(result.providerResponseId, 'resp_fixture');
    assert.equal(result.providerResponseIdAvailable, true);
    assert.equal(result.httpRequestId, 'req_fixture');
    assert.equal(result.httpRequestIdAvailable, true);
    assert.equal(result.finishReason, 'completed');
    assert.deepEqual(result.usage, { inputTokens: 20, outputTokens: 5, totalTokens: 25 });
    assert.equal(result.estimatedCostUsd, 0.0000375);
  });
  await check('runtime factory and purpose enforce fixed limits using real adapter', async () => {
    let creations = 0;
    let generations = 0;
    await withRealAdapterWrapper((create, config) => {
      creations++;
      assert.equal(config.apiKey, fixtureSecret);
      assert.equal(config.model, 'gpt-5.4-mini');
      assert.equal(config.maxRetries, 0);
      assert.equal(config.timeoutMs, 20000);
      assert.equal(config.maxOutputTokens, 16);
      assert.equal(typeof config.fetchImpl, 'function');
      assert.equal(config.mockMode, undefined);
      assert.equal(config.testMockMode, undefined);
      const provider = create(config);
      return { ...provider, async generate(request) {
        generations++;
        assert.equal(request.systemInstruction, SYSTEM);
        assert.deepEqual(request.messages, MESSAGES);
        assert.equal(request.maxOutputTokens, 16);
        assert.deepEqual(request.tools, []);
        assert.deepEqual(request.metadata, { purpose: 'bounded_provider_chat' });
        for (const field of ['learnerContext', 'ragContext', 'routeContext', 'previous_response_id', 'conversation']) assert.equal(Object.hasOwn(request, field), false);
        return provider.generate(request);
      } };
    }, async gate => assert.equal((await fixture({}, args, env, gate)).resultCode, 'CHAT_PASS'));
    assert.equal(creations, 1);
    assert.equal(generations, 1);
  });
  await check('optional candidate SHA absence remains bounded', async () => {
    const result = await fixture({}, withoutArg('--candidate-sha'));
    assert.equal(result.candidateGitSha, null);
    assert.equal(result.resultCode, 'CHAT_PASS');
  });
  await check('exact planning reserve permits one call', async () => {
    const result = await fixture({}, withArg('--budget-usd', '0.00084'));
    assert.equal(result.resultCode, 'CHAT_PASS');
    assert.equal(result.authorizedBudgetUsd, 0.00084);
  });
  await check('approved exact snapshot success', async () => {
    const result = await fixture({ model: 'gpt-5.4-mini-2026-03-17' });
    evaluated(result);
    assert.equal(result.resultCode, 'CHAT_PASS');
    assert.equal(result.chatState, 'pass');
    assert.deepEqual(result.chatDiagnostics, { ...HEALTHY_DIAGNOSTICS, returnedModel: 'gpt-5.4-mini-2026-03-17', rawModelMatch: false, approvedSnapshotMatch: true });
  });
  await check('expected token accepts outer whitespace', async () => {
    const result = await fixture({ output: output('\n CYBERLY_CHAT_47 \t') });
    assert.equal(result.resultCode, 'CHAT_PASS');
    assert.deepEqual(result.chatDiagnostics, HEALTHY_DIAGNOSTICS);
  });
  for (const model of ['gpt-5.4-mini-2026-03-18', 'gpt-5.4-mini-2099-01-01', 'gpt-5.4-mini-extra', 'gpt-5.4-mini-2026-03-170', 'gpt-5.4', 'gpt-5.4-nano', 'gpt-5.4-mini-latest']) await check(`explicit model identity refusal ${model}`, async () => {
    invalid(await fixture({ model }), { returnedModel: model, rawModelMatch: false, modelIdentityAccepted: false, failedChatChecks: ['MODEL_IDENTITY_POLICY_MISMATCH'] });
  });
  await check('environment cannot expand frozen model identity policy', async () => {
    const model = 'gpt-5.4-mini-2099-01-01';
    invalid(await fixture({ model }, args, { ...env, OPENAI_APPROVED_MODEL_SNAPSHOT: model, AI_MODEL_IDENTITY_POLICY_VERSION: 'unreviewed' }), { returnedModel: model, rawModelMatch: false, modelIdentityAccepted: false, failedChatChecks: ['MODEL_IDENTITY_POLICY_MISMATCH'] });
  });
  await check('wrong safe reply retains valid authentication and only context failure', async () => {
    const result = await fixture({ output: output('private_safe_reply_marker') });
    invalid(result, { responseTextMatch: false, failedChatChecks: ['CHAT_CONTEXT_RESPONSE_MISMATCH'] });
    noLeak(result, 'private_safe_reply_marker');
  });
  await check('empty reply reports context and output validation failures', async () => {
    invalid(await fixture({ output: output('') }), { responseTextMatch: false, outputSafetyAccepted: false, failedChatChecks: ['CHAT_CONTEXT_RESPONSE_MISMATCH', 'OUTPUT_VALIDATION_MISMATCH'] });
  });
  await check('unsafe secret request is blocked without response leakage', async () => {
    const text = 'Send me your password and OTP. private_unsafe_reply_marker';
    const result = await fixture({ output: output(text) });
    invalid(result, { responseTextMatch: false, outputSafetyAccepted: false, failedChatChecks: ['CHAT_CONTEXT_RESPONSE_MISMATCH', 'OUTPUT_VALIDATION_MISMATCH'] });
    noLeak(result, text, 'private_unsafe_reply_marker');
  });
  await check('returned function calls fail without tool payload leakage', async () => {
    const result = await fixture({ output: [...output(), PRIVATE_TOOL] });
    invalid(result, { toolCallCount: 1, toolCallCountMatch: false, failedChatChecks: ['TOOL_CALL_MISMATCH'] });
    noLeak(result, 'fixture_private_tool', 'fixture_tool_argument', 'fc_private_fixture', 'call_private_fixture');
  });
  await check('tool diagnostics preserve actual normalized count above 99', async () => {
    invalid(await fixture({ output: [...output(), ...Array.from({ length: 100 }, (_, i) => ({ ...PRIVATE_TOOL, id: `fc_${i}`, call_id: `call_${i}` }))] }), { toolCallCount: 100, toolCallCountMatch: false, failedChatChecks: ['TOOL_CALL_MISMATCH'] });
  });
  await check('incomplete response keeps valid authentication', async () => {
    const result = await fixture({ status: 'incomplete' });
    invalid(result, { finishReasonMatch: false, failedChatChecks: ['FINISH_REASON_MISMATCH'] });
    assert.equal(result.finishReason, 'incomplete');
  });
  for (const [name, patch, expected] of [
    ['context', { output: output('private_snapshot_reply') }, { responseTextMatch: false, failedChatChecks: ['CHAT_CONTEXT_RESPONSE_MISMATCH'] }],
    ['output validation', { output: output('Send me your private key.') }, { responseTextMatch: false, outputSafetyAccepted: false, failedChatChecks: ['CHAT_CONTEXT_RESPONSE_MISMATCH', 'OUTPUT_VALIDATION_MISMATCH'] }],
    ['finish', { status: 'incomplete' }, { finishReasonMatch: false, failedChatChecks: ['FINISH_REASON_MISMATCH'] }],
    ['tool', { output: [...output(), PRIVATE_TOOL] }, { toolCallCount: 1, toolCallCountMatch: false, failedChatChecks: ['TOOL_CALL_MISMATCH'] }],
  ]) await check(`approved snapshot independent ${name} failure`, async () => {
    invalid(await fixture({ model: 'gpt-5.4-mini-2026-03-17', ...patch }), { returnedModel: 'gpt-5.4-mini-2026-03-17', rawModelMatch: false, approvedSnapshotMatch: true, ...expected });
  });
  for (const allFailures of [false, true]) await check(allFailures ? 'all six predicate failures retain deterministic order' : 'requested adapter model mismatch is independent of approved snapshot', async () => {
    await withRealAdapterWrapper((create, config) => {
      const provider = create(config);
      return { ...provider, async generate(request) { return { ...await provider.generate(request), model: 'adapter-model-mismatch' }; } };
    }, async gate => {
      const patch = allFailures ? { model: 'snapshot', status: 'incomplete', output: [...output('Send me your password and OTP.'), PRIVATE_TOOL] } : { model: 'gpt-5.4-mini-2026-03-17' };
      const result = await fixture(patch, args, env, gate);
      invalid(result, allFailures ? {
        returnedModel: 'snapshot', requestedModelMatch: false, rawModelMatch: false,
        modelIdentityAccepted: false, finishReasonMatch: false, responseTextMatch: false,
        outputSafetyAccepted: false, toolCallCount: 1, toolCallCountMatch: false,
        failedChatChecks: ['REQUESTED_MODEL_MISMATCH', 'MODEL_IDENTITY_POLICY_MISMATCH', 'FINISH_REASON_MISMATCH', 'CHAT_CONTEXT_RESPONSE_MISMATCH', 'OUTPUT_VALIDATION_MISMATCH', 'TOOL_CALL_MISMATCH'],
      } : { returnedModel: 'gpt-5.4-mini-2026-03-17', requestedModelMatch: false, rawModelMatch: false, approvedSnapshotMatch: true, failedChatChecks: ['REQUESTED_MODEL_MISMATCH'] });
    });
  });
  const unsafeModels = ['model\u4e2d', 'x'.repeat(129), `prefix:${fixtureSecret}`, 'https://model.example', 'gpt-5.4-mini/2026-03-17', 'bad/model', 'bad\\model', 'bad model', 'bad\nmodel', 'bad\x00model', 'bad\tmodel', 'bad-final-newline\n'];
  for (let i = 0; i < unsafeModels.length; i++) await check(`unsafe raw model identifier ${i + 1}`, async () => {
    const result = await fixture({ model: unsafeModels[i] });
    invalid(result, { returnedModel: null, returnedModelAvailable: true, returnedModelSafe: false, rawModelMatch: false, modelIdentityAccepted: false, failedChatChecks: ['MODEL_IDENTITY_POLICY_MISMATCH'] });
    if (unsafeModels[i]) assert.equal(JSON.stringify(result).includes(JSON.stringify(unsafeModels[i]).slice(1, -1)), false);
  });
  await check('missing raw model reports unavailable identity', async () => {
    invalid(await fixture({ model: null }), { returnedModel: null, returnedModelAvailable: false, returnedModelSafe: null, rawModelMatch: false, modelIdentityAccepted: false, failedChatChecks: ['MODEL_IDENTITY_POLICY_MISMATCH'] });
  });
  await check('empty provider model is unavailable after actual adapter normalization', async () => {
    invalid(await fixture({ model: '' }), { returnedModel: null, returnedModelAvailable: false, returnedModelSafe: null, rawModelMatch: false, modelIdentityAccepted: false, failedChatChecks: ['MODEL_IDENTITY_POLICY_MISMATCH'] });
  });
  await check('safe raw model identifier permits exact 128 character boundary', async () => {
    const model = 'A_0.-:'.repeat(21) + 'Ab';
    assert.equal(model.length, 128);
    invalid(await fixture({ model }), { returnedModel: model, rawModelMatch: false, modelIdentityAccepted: false, failedChatChecks: ['MODEL_IDENTITY_POLICY_MISMATCH'] });
  });
}

async function failureCases() {
  for (const [status, code] of [[401, 'AI_AUTH_FAILED'], [403, 'AI_AUTH_FAILED'], [429, 'AI_RATE_LIMITED'], [500, 'AI_PROVIDER_UNAVAILABLE'], [503, 'AI_PROVIDER_UNAVAILABLE']]) await check(`HTTP ${status} does not retry and leaves predicates unevaluated`, async () => {
    let attempts = 0;
    const result = await runGate(args, env, { fetchImpl: fixtureFetch(() => { attempts++; return response({}, status); }) });
    assert.equal(attempts, 1);
    evaluated(result);
    assert.equal(result.resultCode, code);
    assert.equal(result.authState, status === 401 || status === 403 ? 'invalid' : 'unknown');
    assert.equal(result.chatState, 'fail');
    assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
  });
  for (const [name, error, code] of [
    // The installed SDK wraps AbortError; the unchanged adapter currently maps it
    // to AI_REQUEST_FAILED. Preserve that verified contract while testing bounds.
    ['timeout', Object.assign(new Error(fixtureSecret), { name: 'AbortError' }), 'AI_REQUEST_FAILED'],
    ['network', new Error(fixtureSecret), 'AI_REQUEST_FAILED'],
  ]) await check(`${name} failure does not retry and leaks no error text`, async () => {
    const result = await runGate(args, env, { fetchImpl: fixtureFetch(() => { throw error; }) });
    evaluated(result);
    assert.equal(result.resultCode, code);
    assert.equal(result.authState, 'unknown');
    assert.equal(result.chatState, 'fail');
    assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
  });
  await check('redirect response has no followup outbound attempt', async () => {
    const result = await runGate(args, env, { fetchImpl: fixtureFetch((url, options) => {
      assert.equal(options.redirect, 'error');
      return new Response(null, { status: 302, headers: { location: 'https://evil.example/' } });
    }) });
    evaluated(result);
    assert.equal(result.authState, 'unknown');
    assert.equal(result.chatState, 'fail');
    assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
  });
}

async function accountingAndIdCases() {
  for (const [name, usage] of [['missing usage', undefined], ['empty usage', {}], ['negative usage', { input_tokens: -1, output_tokens: 5, total_tokens: 4 }], ['noninteger usage', { input_tokens: 1.5, output_tokens: 5, total_tokens: 6.5 }]]) await check(`${name} yields no estimated cost`, async () => {
    const result = await fixture({ usage });
    assert.equal(result.usage, null);
    assert.equal(result.estimatedCostUsd, null);
    assert.equal(result.resultCode, 'CHAT_PASS');
  });
  await check('known usage prices input at 0.75 and output at 4.5 per million', async () => {
    const result = await fixture({ usage: { input_tokens: 1024, output_tokens: 16, total_tokens: 1040 } });
    assert.equal(result.estimatedCostUsd, 0.00084);
    assert.deepEqual(result.usage, { inputTokens: 1024, outputTokens: 16, totalTokens: 1040 });
    assert.equal(result.resultCode, 'CHAT_PASS');
  });
  for (const [name, usage, budget] of [
    ['output usage exceeds fixed token ceiling', { input_tokens: 20, output_tokens: 17, total_tokens: 37 }, '0.01'],
    ['provider usage exceeds authorized budget', { input_tokens: 2000, output_tokens: 16, total_tokens: 2016 }, '0.00084'],
  ]) await check(name, async () => {
    const result = await fixture({ usage }, withArg('--budget-usd', budget));
    evaluated(result);
    assert.equal(result.resultCode, 'BUDGET_OR_USAGE_EXCEEDED');
    assert.equal(result.authState, 'valid');
    assert.equal(result.chatState, 'fail');
    assert.deepEqual(result.chatDiagnostics, HEALTHY_DIAGNOSTICS);
  });
  await check('budget usage failure takes precedence while chat diagnostics are preserved', async () => {
    const result = await fixture({
      output: output('private_precedence_reply'),
      usage: { input_tokens: 2000, output_tokens: 16, total_tokens: 2016 },
    }, withArg('--budget-usd', '0.00084'));
    evaluated(result);
    assert.equal(result.resultCode, 'BUDGET_OR_USAGE_EXCEEDED');
    assert.equal(result.authState, 'valid');
    assert.equal(result.chatState, 'fail');
    assert.deepEqual(result.chatDiagnostics, { ...HEALTHY_DIAGNOSTICS, responseTextMatch: false, failedChatChecks: ['CHAT_CONTEXT_RESPONSE_MISMATCH'] });
    assert.deepEqual(result.usage, { inputTokens: 2000, outputTokens: 16, totalTokens: 2016 });
    assert.equal(result.estimatedCostUsd, 0.001572);
    noLeak(result, 'private_precedence_reply');
  });
  for (const [name, responseId, requestId, accepted] of [
    ['safe ID suffix boundary', `resp_${'a'.repeat(100)}`, `req_${'b'.repeat(100)}`, true],
    ['ID suffix exceeds boundary', `resp_${'a'.repeat(101)}`, `req_${'b'.repeat(101)}`, false],
    ['IDs with incorrect prefixes', 'other_fixture', 'other_fixture', false],
    ['IDs with unsafe punctuation', 'resp_bad/value', 'req_bad:value', false],
    ['IDs with secret suffix', `resp_${fixtureSecret}`, `req_${fixtureSecret}`, false],
    ['IDs with empty suffix', 'resp_', 'req_', false],
    ['missing response and HTTP IDs', null, null, false],
  ]) await check(name, async () => {
    const headers = requestId === null ? { 'x-request-id': '' } : { 'x-request-id': requestId };
    const result = await runGate(args, env, { fetchImpl: fixtureFetch(() => response({ id: responseId }, 200, headers)) });
    evaluated(result);
    assert.equal(result.resultCode, 'CHAT_PASS');
    assert.equal(result.providerResponseId, accepted ? responseId : null);
    assert.equal(result.httpRequestId, accepted ? requestId : null);
    assert.equal(result.providerResponseIdAvailable, accepted);
    assert.equal(result.httpRequestIdAvailable, accepted);
  });
  await check('response and HTTP IDs with final newline are rejected', async () => {
    // Headers trims edge whitespace. Wrap only normalized IDs after the real
    // SDK/adapter returns to exercise the same safe-ID boundary adversarially.
    await withRealAdapterWrapper((create, config) => {
      const provider = create(config);
      return { ...provider, async generate(request) {
        return { ...await provider.generate(request), providerResponseId: 'resp_fixture\n', httpRequestId: 'req_fixture\n' };
      } };
    }, async gate => {
      const result = await fixture({}, args, env, gate);
      evaluated(result);
      assert.equal(result.resultCode, 'CHAT_PASS');
      assert.equal(result.providerResponseId, null);
      assert.equal(result.httpRequestId, null);
      assert.equal(result.providerResponseIdAvailable, false);
      assert.equal(result.httpRequestIdAvailable, false);
    });
  });
}

async function transportGuardCases() {
  for (const destination of ['https://evil.example/v1/responses', 'http://api.openai.com/v1/responses', 'https://api.openai.com/v1/chat/completions', 'https://api.openai.com/v1/responses?x=1', 'https://api.openai.com/v1/responses#fragment', 'https://api.openai.com:444/v1/responses', 'https://user@api.openai.com/v1/responses', 'https://user:pass@api.openai.com/v1/responses']) await check(`inherited transport destination rejection ${destination}`, async () => {
    await withRealAdapterWrapper((create, config) => create({ ...config, fetchImpl: (input, options) => config.fetchImpl(destination, options) }), async gate => {
      const result = await gate(args, env, { fetchImpl: noOutbound });
      assert.equal(result.resultCode, 'DESTINATION_REJECTED');
      assert.equal(result.actualOutboundAttempts, 0);
      assert.equal(result.transportInvocationsActual, 1);
      assert.equal(result.testState, 'not_tested');
      assert.equal(result.authState, 'not_tested');
      assert.equal(result.chatState, 'not_tested');
      assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
      noLeak(result);
    });
  });
  for (const method of ['GET', 'PUT']) await check(`inherited transport rejects ${method}`, async () => {
    await withRealAdapterWrapper((create, config) => create({ ...config, fetchImpl: (input, options) => config.fetchImpl(input, { ...options, method }) }), async gate => {
      const result = await gate(args, env, { fetchImpl: noOutbound });
      assert.equal(result.resultCode, 'DESTINATION_REJECTED');
      assert.equal(result.actualOutboundAttempts, 0);
      assert.equal(result.transportInvocationsActual, 1);
      assert.equal(result.chatState, 'not_tested');
      noLeak(result);
    });
  });
  await check('inherited transport overrides redirect follow to error', async () => {
    await withRealAdapterWrapper((create, config) => create({ ...config, fetchImpl: (input, options) => config.fetchImpl(input, { ...options, redirect: 'follow' }) }), async gate => {
      const result = await gate(args, env, { fetchImpl: fixtureFetch((input, options) => {
        assert.equal(options.redirect, 'error');
        return response();
      }) });
      evaluated(result);
      assert.equal(result.resultCode, 'CHAT_PASS');
    });
  });
  await check('inherited transport prevents second real SDK request', async () => {
    await withRealAdapterWrapper((create, config) => {
      const provider = create(config);
      return { ...provider, async generate(request) { await provider.generate(request); return provider.generate(request); } };
    }, async gate => {
      const result = await gate(args, env, { fetchImpl: fixtureFetch() });
      assert.equal(result.resultCode, 'TRANSPORT_ATTEMPT_LIMIT');
      assert.equal(result.logicalCallsActual, 1);
      assert.equal(result.transportInvocationsActual, 2);
      assert.equal(result.actualOutboundAttempts, 1);
      assert.equal(result.retryCount, 0);
      assert.equal(result.unexpectedDuplicateAttempt, true);
      assert.equal(result.chatState, 'fail');
      assert.deepEqual(result.chatDiagnostics, EMPTY_DIAGNOSTICS);
      noLeak(result);
    });
  });
}

async function run() {
  assert.ok(fs.existsSync(gatePath), 'bounded chat Gate implementation is required');
  ({ runGate } = require(gatePath));
  assert.equal(typeof runGate, 'function');
  await conversationContractCases();
  await preflightCases();
  await responseCases();
  await failureCases();
  await accountingAndIdCases();
  await transportGuardCases();
  assert.equal(forbiddenImportAttempts, 0);
  if (failures.length) {
    console.log(JSON.stringify({ result: 'FAIL', cases: caseNames.length, caseNames, failures, fixtureOutboundAttempts, forbiddenImportAttempts, liveProviderCalls: { openai: 0, gemini: 0, ilmu: 0 } }));
    throw new Error(`${failures.length} offline bounded chat expectations failed`);
  }
  console.log(JSON.stringify({ result: 'PASS', cases: caseNames.length, caseNames, fixtureOutboundAttempts, forbiddenImportAttempts, unexpectedRealNetworkAttempts: 0, liveProviderCalls: { openai: 0, gemini: 0, ilmu: 0 }, note: 'Installed SDK and real adapter exercised with in-memory HTTP fixtures; no live certification' }));
}
run().catch(error => {
  console.error(String(error.stack || 'Offline chat-gate verification failed').replaceAll(fixtureSecret, '[fixture-secret-redacted]'));
  process.exitCode = 1;
});
