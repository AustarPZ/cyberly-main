'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const CONTRACT = Object.freeze({
  productBaseSha: 'cc8739a1f6ea5a419c40ffaa1e6183d8cca5b688',
  renderServiceId: 'srv-d9tiop942hec738b3org',
  model: 'gpt-5.4-mini', budgetUsd: 0.02,
  maxLogicalCalls: 2, maxPhysicalAttempts: 2, maxToolExecutions: 1,
  plannerMaxOutputTokens: 500, finalMaxOutputTokens: 400, maxRequestBytes: 20000,
  inputUsdPerMillion: 0.75, outputUsdPerMillion: 4.5,
  port: 51237, endpoint: 'https://api.openai.com/v1/responses',
  prompt: 'Can you check my current learning progress and tell me which topic I should improve next? Please use my progress.',
  toolName: 'get_learning_progress',
});
const TOOL_NAMES = Object.freeze([
  'get_learner_profile', 'get_learning_progress', 'get_current_recommendations',
  'search_published_resources', 'list_recommended_scenarios',
]);
// SHA256 of exact baseline Git blobs. Only CRLF -> LF is canonicalized.
const SOURCE_HASHES = Object.freeze({
  'server/server.js': '0dc8f440df8b2004587530c4efb0a6e109a98ea785cdf9ee1504037c56542d3b',
  'server/src/database/pool.js': '52ea4a6b7c1120cb5a98bad8b3fa144ada7e89cc1787996d2b77de1895c6b858',
  'server/src/ai/ai.service.js': '0703cede60cc3abde139958b36162cff461961a01e224d47a678ba33cae891a0',
  'server/src/ai/ai.config.js': 'c8a6c9f0bcf2d06f5a022831bcf60a76002a6a47a5e83f35098e20c4cc57daa4',
  'server/src/ai/ai.repository.js': '095508d6e8b3da4a625d5d65ba065aac092be1ee70d6cdafc0430a0335f81ca0',
  'server/src/ai/ai.provider.js': 'da5ae20fdab3799898335df3380749503c3d97d0fd1b2cf33ec9e2171367b9fe',
  'server/src/ai/ai.routes.js': '8c276f6cc0296251cb6cc76f610d3c3cdc4fa405c0a74c758bde8e5b3e056715',
  'server/src/ai/providers/aiProvider.registry.js': 'cfd9505011647cc6fa9cc1abe74b432e3679229374604490504ebcaa275e1d49',
  'server/src/ai/providers/openai.provider.js': 'd80f1b502379a254bac8d3d956c18b22436ece89e503d4f6dc2f209b0d706bb2',
  'server/src/ai/providers/aiProvider.tools.js': 'e62724f422ac8556ef9bb7e1860748c2c9c33d3bd6d90ff5bbe17560ffc5d465',
  'server/src/agent/agentModelGateway.js': '48f1bfa1900a9197c24160dcb60695b30fcbadb69a807810bbae5b0e621c7851',
  'server/src/agent/controlledAgentic.service.js': 'd0c086d91aa4d0ed5adfb1d1a5d3e0cb3f62689c5e4ad444d3ccee90a8499ec2',
  'server/src/agent/controlledToolExecutor.js': '4370ec96b54d1e1e84e5c31d8be973ad207b4276ceaa9c29e265ff9fceba9c48',
  'server/src/agent/agent.toolCatalogue.js': 'd6053db6d2bab22793fe3ee332efb6c8af6c95237b0b9428c6f1d18fb8803e3b',
  'server/src/agent/agent.tools.js': '12c79edb9d5964f0a7cc53d22e924e8c1e397ca7a8142798ca351a8db2dc4f3d',
  'server/src/agent/agent.service.js': 'c61477d56fed60644535ccbb19561ed26f6248cc90bc0e268a3ee6a13a8803df',
  'server/src/agent/agenticEligibility.js': 'f4debbfe4a8eb64b2d4b167edfc21c7f321f01ada1b4f51e974e5c6a5c5896c2',
  'server/src/agent/audit/agenticTrace.repository.js': '5498befa69f7e8946a44c59e3d5972928793d11fee45fe5bded480ebb4e58ef6',
  'server/src/agent/audit/agenticTrace.sanitizer.js': '7d6860060efda8c31faf94e2e26c5e224ff89a0af460111a6d3dc38fafee3617',
  'server/src/adaptive/adaptiveLearning.service.js': '70edfea9cda93b8b602ff70b6572fc03457026ebc5ef82cf76005df0ed0d5f0b',
  'server/src/ai/ai.learnerContext.js': 'bd88c02029d07aa06fe1b7077a199ca5e5121ef761bb49c57f6651af7dd0cf12',
  'server/src/agent/actions/actionProposal.service.js': 'f915b043c4044dcd460be678cb800c849127c977f3819b023bf50d3f2da0a95b',
  'server/src/config/productionConfig.js': 'e439f47ac81896775b85d2218a40fe0332d835dc66bbce3b3683cae00d52779f',
  'server/src/agent/audit/agenticTrace.service.js': '116f9845802cd11d0609d284ba3ef563a51b2cfb54c8d816c289c1ed7c43aa5c',
  'server/src/agent/audit/agenticTrace.constants.js': 'd169df9b4f5e9f2076b511ea9d1a796a223a5ea77812d9badfac0c67fa95eef1',
  'server/src/agent/agent.policy.js': 'd992586bb804d15ef27c828f0c9242f25a781f5d1dc0f09ad6fecf7951d79b1a',
});
const SAFE_ERROR_CODES = Object.freeze([
  'OWNER_AUTHORIZATION_REQUIRED', 'BUDGET_AUTHORIZATION_REQUIRED', 'RENDER_SERVICE_MISMATCH',
  'DEPLOY_COMMIT_REQUIRED', 'DEPLOY_COMMIT_MISMATCH', 'HARNESS_SHA256_REQUIRED',
  'HARNESS_SHA256_MISMATCH', 'PRODUCTION_REQUIRED', 'PUBLIC_LIVE_FLAG_ENABLED',
  'PUBLIC_AGENTIC_FLAG_ENABLED', 'INHERITED_AI_TEST_VALUE', 'SOURCE_HASH_MISMATCH',
  'INVALID_ARGUMENTS', 'OUTBOUND_DESTINATION_BLOCKED', 'OUTBOUND_METHOD_BLOCKED',
  'REQUEST_SIZE_STOP', 'REQUEST_SHAPE_REJECTED', 'PLANNER_REQUEST_REJECTED',
  'FINAL_REQUEST_REJECTED', 'LOGICAL_CALL_LIMIT', 'PHYSICAL_ATTEMPT_LIMIT',
  'CALL_ORDER_REJECTED', 'CONCURRENT_CALL_BLOCKED', 'TOOL_EXECUTION_LIMIT',
  'TOOL_CALL_REJECTED', 'NORMALIZED_CALL_REJECTED', 'TOOL_RESULT_REJECTED',
  'PROVIDER_CONFIG_REJECTED', 'PROVIDER_FALLBACK_BLOCKED', 'USAGE_INVALID',
  'RESPONSE_METADATA_REJECTED', 'BUDGET_BREACH', 'HARNESS_ALREADY_STOPPED',
  'REPLAY_INVARIANT_FAILED', 'LEARNING_STATE_CHANGED', 'TRACE_ASSERTION_FAILED',
  'PRODUCT_ASSERTION_FAILED', 'SERVER_START_FAILED', 'HARNESS_TIMEOUT', 'ACTION_PROPOSAL_BLOCKED',
]);
function fail(code) { throw new Error(code); }
function ensure(condition, code) { if (!condition) fail(code); }
function sha256(bytes) { return crypto.createHash('sha256').update(bytes).digest('hex'); }
function plainObject(value) {
  return value !== null && typeof value === 'object' &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value));
}
function safeErrorCode(error) {
  if (SAFE_ERROR_CODES.includes(error?.message)) return error.message;
  return error?.code === 'ERR_ASSERTION' ? 'HARNESS_ASSERTION_FAILED' : 'HARNESS_STOP';
}
function emitReceipt(receipt) { process.stdout.write(JSON.stringify(receipt) + '\n'); }
function zeroReceipt(result) {
  return {
    result, productBaseSha: CONTRACT.productBaseSha, controlledAgenticLivePass: false,
    providerCalls: 0, providerCallsByProvider: { openai: 0, gemini: 0, ilmu: 0 },
    logicalCalls: 0, plannerCalls: 0, finalCalls: 0, physicalResponses: 0,
    toolExecutions: 0, dbWrites: 0, realNetwork: 0, retries: 0, providerFallback: 0,
    budgetUsd: CONTRACT.budgetUsd,
  };
}
function checkAuthorization(env, harnessHash) {
  ensure(env.R510_OWNER_AUTHORIZED === CONTRACT.productBaseSha, 'OWNER_AUTHORIZATION_REQUIRED');
  ensure(env.R510_BUDGET_USD === '0.02', 'BUDGET_AUTHORIZATION_REQUIRED');
  ensure(env.RENDER_SERVICE_ID === CONTRACT.renderServiceId, 'RENDER_SERVICE_MISMATCH');
  ensure(/^[a-f0-9]{40}$/.test(env.R510_DEPLOY_COMMIT || ''), 'DEPLOY_COMMIT_REQUIRED');
  ensure(env.R510_DEPLOY_COMMIT === env.RENDER_GIT_COMMIT, 'DEPLOY_COMMIT_MISMATCH');
  ensure(/^[a-f0-9]{64}$/.test(env.R510_HARNESS_SHA256 || ''), 'HARNESS_SHA256_REQUIRED');
  ensure(env.R510_HARNESS_SHA256 === harnessHash, 'HARNESS_SHA256_MISMATCH');
  ensure(env.NODE_ENV === 'production', 'PRODUCTION_REQUIRED');
  ensure(env.AI_CYBERGUARD_LIVE_ENABLED !== '1', 'PUBLIC_LIVE_FLAG_ENABLED');
  ensure(env.AI_CYBERGUARD_AGENTIC_ENABLED !== '1', 'PUBLIC_AGENTIC_FLAG_ENABLED');
  ensure(!Object.keys(env).some(key => /^AI_TEST_/.test(key)), 'INHERITED_AI_TEST_VALUE');
}
function verifySourceHashes(root) {
  for (const [file, expected] of Object.entries(SOURCE_HASHES)) {
    let actual;
    try { actual = sha256(fs.readFileSync(path.join(root, file), 'utf8').replace(/\r\n/g, '\n')); }
    catch { fail('SOURCE_HASH_MISMATCH'); }
    ensure(actual === expected, 'SOURCE_HASH_MISMATCH');
  }
}
function checkDestination(input, method) {
  let url;
  try { url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url); }
  catch { fail('OUTBOUND_DESTINATION_BLOCKED'); }
  ensure(!url.username && !url.password && !url.hash, 'OUTBOUND_DESTINATION_BLOCKED');
  if (url.origin === 'http://127.0.0.1:' + CONTRACT.port) return 'local';
  ensure(url.href === CONTRACT.endpoint, 'OUTBOUND_DESTINATION_BLOCKED');
  ensure(method === 'POST', 'OUTBOUND_METHOD_BLOCKED');
  return 'openai';
}
function checkRequest(body, phase) {
  ensure(plainObject(body) && body.model === CONTRACT.model && body.store === false &&
    body.stream !== true && Array.isArray(body.input), 'REQUEST_SHAPE_REJECTED');
  ensure(Buffer.byteLength(JSON.stringify(body)) <= CONTRACT.maxRequestBytes, 'REQUEST_SIZE_STOP');
  ensure(body.input.some(item => item.role === 'user' && item.content === CONTRACT.prompt), 'REQUEST_SHAPE_REJECTED');
  if (phase === 'planner') {
    ensure(body.max_output_tokens === 500 && /controlled agentic planner/i.test(body.instructions || '') &&
      Array.isArray(body.tools) && body.tools.length === 5, 'PLANNER_REQUEST_REJECTED');
    ensure(JSON.stringify(body.tools.map(tool => tool.name).sort()) === JSON.stringify([...TOOL_NAMES].sort()), 'PLANNER_REQUEST_REJECTED');
    for (const tool of body.tools) {
      ensure(plainObject(tool) && tool.type === 'function' && typeof tool.description === 'string' &&
        plainObject(tool.parameters) && tool.parameters.type === 'object' &&
        Object.keys(tool).every(key => ['type', 'name', 'description', 'parameters'].includes(key)), 'PLANNER_REQUEST_REJECTED');
    }
  } else {
    ensure(phase === 'final' && !Object.hasOwn(body, 'tools') &&
      Number.isInteger(body.max_output_tokens) && body.max_output_tokens > 0 && body.max_output_tokens <= 400 &&
      String(body.instructions || '').includes('Controlled Agentic Tool Result'), 'FINAL_REQUEST_REJECTED');
  }
}
function createGuardState() {
  return {
    ...zeroReceipt('NOT_EXECUTED'), outboundAttempts: 0, activeCall: null,
    normalizedPlanner: false, toolSuccess: false, stopped: false, firstStopCode: null,
    transportInputTokens: 0, transportOutputTokens: 0, transportTotalTokens: 0,
    transportEstimatedCostUsd: 0, dbWriteStatements: 0, unexpectedFetchAttempts: 0, proposalAttempts: 0,
  };
}
function latch(state, error) {
  state.stopped = true;
  state.firstStopCode ||= safeErrorCode(error);
}
function guarded(state, run) {
  try { ensure(!state.stopped, 'HARNESS_ALREADY_STOPPED'); return run(); }
  catch (error) { latch(state, error); throw error; }
}
function beginLogical(state, phase) {
  guarded(state, () => {
    ensure(state.logicalCalls < 2, 'LOGICAL_CALL_LIMIT');
    ensure(state.activeCall === null, 'CONCURRENT_CALL_BLOCKED');
    if (phase === 'planner') ensure(state.logicalCalls === 0, 'CALL_ORDER_REJECTED');
    else ensure(phase === 'final' && state.plannerCalls === 1 && state.physicalResponses === 1 &&
      state.normalizedPlanner && state.toolSuccess, 'CALL_ORDER_REJECTED');
    state.logicalCalls += 1;
    state[phase === 'planner' ? 'plannerCalls' : 'finalCalls'] += 1;
    state.activeCall = phase;
  });
}
function takePhysicalAttempt(state, body) {
  guarded(state, () => {
    ensure(state.outboundAttempts < 2, 'PHYSICAL_ATTEMPT_LIMIT');
    ensure(state.activeCall === (state.outboundAttempts === 0 ? 'planner' : 'final'), 'CALL_ORDER_REJECTED');
    checkRequest(body, state.activeCall);
    state.outboundAttempts += 1;
    state.providerCalls = state.outboundAttempts;
    state.providerCallsByProvider.openai = state.outboundAttempts;
    state.realNetwork = state.outboundAttempts;
  });
}
function checkNormalizedResult(result) {
  ensure(result?.provider === 'openai' && result?.model === CONTRACT.model &&
    !result.actionProposal && Array.isArray(result.toolCalls) && result.toolCalls.length === 1, 'NORMALIZED_CALL_REJECTED');
  const call = result.toolCalls[0];
  ensure(plainObject(call) && Object.keys(call).sort().join(',') === 'arguments,callId,provider,toolName' &&
    typeof call.callId === 'string' && call.callId.trim().length > 0 && call.provider === 'openai', 'NORMALIZED_CALL_REJECTED');
  checkToolCall(call);
}
function checkToolCall(call) {
  ensure(call?.toolName === CONTRACT.toolName && plainObject(call.arguments) &&
    !Object.hasOwn(call.arguments, 'userId'), 'TOOL_CALL_REJECTED');
}
function takeToolExecution(state, call) {
  guarded(state, () => {
    ensure(state.toolExecutions < 1, 'TOOL_EXECUTION_LIMIT');
    ensure(state.normalizedPlanner && state.physicalResponses === 1 && state.activeCall === null, 'CALL_ORDER_REJECTED');
    checkToolCall(call);
    state.toolExecutions += 1;
  });
}
function blockProposal(state) {
  state.proposalAttempts += 1;
  const error = new Error('ACTION_PROPOSAL_BLOCKED');
  latch(state, error);
  throw error;
}
function accountPhysicalResponse(state, metadata, phase) {
  guarded(state, () => {
    ensure(metadata?.status === 'completed' &&
      [CONTRACT.model, 'gpt-5.4-mini-2026-03-17'].includes(metadata.model), 'RESPONSE_METADATA_REJECTED');
    const usage = metadata.usage;
    ensure(usage && Number.isSafeInteger(usage.input_tokens) && usage.input_tokens > 0 &&
      Number.isSafeInteger(usage.output_tokens) && usage.output_tokens > 0 &&
      usage.output_tokens <= (phase === 'planner' ? 500 : 400) &&
      Number.isSafeInteger(usage.total_tokens) && usage.total_tokens === usage.input_tokens + usage.output_tokens, 'USAGE_INVALID');
    state.physicalResponses += 1;
    state.transportInputTokens += usage.input_tokens;
    state.transportOutputTokens += usage.output_tokens;
    state.transportTotalTokens += usage.total_tokens;
    // Do not use the persisted final-generation estimate: planner usage is separate.
    state.transportEstimatedCostUsd = (state.transportInputTokens * 0.75 + state.transportOutputTokens * 4.5) / 1000000;
    ensure(state.transportEstimatedCostUsd <= CONTRACT.budgetUsd, 'BUDGET_BREACH');
  });
}
function counters(state) {
  return {
    logicalCalls: state.logicalCalls, outboundAttempts: state.outboundAttempts,
    physicalResponses: state.physicalResponses, plannerCalls: state.plannerCalls,
    finalCalls: state.finalCalls, toolExecutions: state.toolExecutions,
  };
}
function checkExactCounters(state) {
  ensure(!state.stopped && JSON.stringify(counters(state)) === JSON.stringify({
    logicalCalls: 2, outboundAttempts: 2, physicalResponses: 2,
    plannerCalls: 1, finalCalls: 1, toolExecutions: 1,
  }), 'PRODUCT_ASSERTION_FAILED');
}
function replyIds(body) {
  return {
    assistant: body.assistantMessage.id, generation: body.generation.id,
    actions: body.actions.map(item => item.id), sources: body.sources.map(item => item.id),
  };
}
function checkReplay(before, after) {
  ensure(JSON.stringify(before) === JSON.stringify(after), 'REPLAY_INVARIANT_FAILED');
}
function checkTrace(trace) {
  const predicates = [
    trace?.requestClassification?.controlledAgenticEligible === true,
    trace?.planning?.used === true, trace?.planning?.provider === 'openai',
    trace?.planning?.decision === 'request_tool', trace?.planning?.fallbackReason === null,
    trace?.toolExecution?.toolName === CONTRACT.toolName, trace?.toolExecution?.status === 'success',
    trace?.toolExecution?.readOnly === true, trace?.limits?.maxModelCalls === 2,
    trace?.limits?.maxToolExecutions === 1, trace?.limits?.modelRequestCount === 1,
    trace?.limits?.toolExecutionCount === 1,
  ];
  ensure(predicates.every(Boolean), 'TRACE_ASSERTION_FAILED');
}

function selfTest() {
  const checks = [];
  const pass = (name, run) => { run(); checks.push(name); };
  const rejects = (name, run) => pass(name, () => assert.throws(run));
  const planner = {
    model: CONTRACT.model, store: false, max_output_tokens: 500,
    instructions: 'You are CyberGuard controlled Agentic planner.',
    input: [{ role: 'user', content: CONTRACT.prompt }],
    tools: TOOL_NAMES.map(name => ({ type: 'function', name, description: 'Fixture read-only declaration', parameters: { type: 'object', properties: {} } })),
  };
  const final = { ...planner, max_output_tokens: 400, instructions: 'Controlled Agentic Tool Result: fixture' };
  delete final.tools;
  const call = { callId: 'fixture-call', toolName: 'get_learning_progress', arguments: {}, provider: 'openai' };
  const normalized = { provider: 'openai', model: CONTRACT.model, toolCalls: [call] };
  const metadata = { status: 'completed', model: CONTRACT.model, usage: { input_tokens: 1000, output_tokens: 100, total_tokens: 1100 } };
  function prepared() {
    const state = createGuardState();
    beginLogical(state, 'planner'); takePhysicalAttempt(state, planner);
    accountPhysicalResponse(state, metadata, 'planner');
    checkNormalizedResult(normalized); state.normalizedPlanner = true; state.activeCall = null;
    takeToolExecution(state, call); state.toolSuccess = true;
    return state;
  }
  pass('planner_good', () => checkRequest(planner, 'planner'));
  pass('final_good', () => checkRequest(final, 'final'));
  rejects('wrong_model', () => checkRequest({ ...planner, model: 'other' }, 'planner'));
  rejects('wrong_store', () => checkRequest({ ...final, store: true }, 'final'));
  rejects('wrong_tools', () => checkRequest({ ...planner, tools: planner.tools.slice(1) }, 'planner'));
  rejects('duplicate_tools', () => checkRequest({ ...planner, tools: planner.tools.map(() => planner.tools[0]) }, 'planner'));
  rejects('nested_tools', () => checkRequest({ ...planner, tools: planner.tools.map(tool => ({ type: 'function', function: tool })) }, 'planner'));
  rejects('internal_metadata', () => checkRequest({ ...planner, tools: planner.tools.map(tool => ({ ...tool, mode: 'read_only' })) }, 'planner'));
  rejects('final_tools', () => checkRequest({ ...final, tools: [] }, 'final'));
  rejects('planner_output_cap', () => checkRequest({ ...planner, max_output_tokens: 501 }, 'planner'));
  rejects('final_output_cap', () => checkRequest({ ...final, max_output_tokens: 401 }, 'final'));
  rejects('oversized_request', () => checkRequest({ ...final, instructions: final.instructions + 'x'.repeat(20000) }, 'final'));
  rejects('missing_tool_context', () => checkRequest({ ...final, instructions: 'fixture' }, 'final'));
  rejects('missing_original_prompt', () => checkRequest({ ...final, input: [] }, 'final'));
  rejects('missing_planner_identity', () => checkRequest({ ...planner, instructions: 'fixture' }, 'planner'));
  pass('destination_good', () => {
    assert.equal(checkDestination(CONTRACT.endpoint, 'POST'), 'openai');
    assert.equal(checkDestination('http://127.0.0.1:51237/api/health', 'GET'), 'local');
  });
  for (const url of ['https://api.gemini.com', CONTRACT.endpoint + '?x=1', CONTRACT.endpoint + '#x',
    'https://user:secret@api.openai.com/v1/responses', 'https://api.openai.com:444/v1/responses',
    'http://127.0.0.1:51238/api/health']) rejects('non_openai_destination', () => checkDestination(url, 'POST'));
  rejects('wrong_method', () => checkDestination(CONTRACT.endpoint, 'GET'));
  pass('normalized_call', () => checkNormalizedResult(normalized));
  for (const bad of [{ ...call, callId: '' }, { ...call, provider: 'ilmu' }, { ...call, arguments: ' {} ' },
    { ...call, arguments: [] }, { ...call, arguments: null }, { ...call, arguments: { userId: 123 } }])
    rejects('bad_normalized_call', () => checkNormalizedResult({ ...normalized, toolCalls: [bad] }));
  rejects('multiple_normalized_calls', () => checkNormalizedResult({ ...normalized, toolCalls: [call, call] }));
  rejects('action_proposal', () => checkNormalizedResult({ ...normalized, actionProposal: {} }));
  rejects('proposal_rejected', () => blockProposal(createGuardState()));
  rejects('wrong_tool_name', () => checkToolCall({ ...call, toolName: 'get_learner_profile' }));
  rejects('extra_tool_execution', () => takeToolExecution(prepared(), call));
  rejects('final_before_planner', () => beginLogical(createGuardState(), 'final'));
  rejects('concurrent_final', () => { const state = prepared(); state.activeCall = 'planner'; beginLogical(state, 'final'); });
  pass('full_counter_path', () => {
    const state = prepared(); beginLogical(state, 'final'); takePhysicalAttempt(state, final);
    accountPhysicalResponse(state, metadata, 'final'); state.activeCall = null;
    checkExactCounters(state);
    assert.equal(state.transportEstimatedCostUsd, 0.0024); // Both 1000/100 physical responses.
    rejects('extra_call', () => beginLogical(state, 'planner'));
  });
  rejects('extra_physical_attempt', () => { const state = prepared(); state.outboundAttempts = 2; takePhysicalAttempt(state, final); });
  rejects('budget_breach', () => accountPhysicalResponse(createGuardState(), {
    ...metadata, usage: { input_tokens: 30000, output_tokens: 1, total_tokens: 30001 },
  }, 'planner'));
  rejects('combined_budget_breach', () => {
    const state = createGuardState();
    const usage = { input_tokens: 14000, output_tokens: 100, total_tokens: 14100 };
    accountPhysicalResponse(state, { ...metadata, usage }, 'planner');
    accountPhysicalResponse(state, { ...metadata, usage }, 'final');
  });
  for (const usage of [null, {}, { input_tokens: -1, output_tokens: 1, total_tokens: 0 },
    { input_tokens: 100, output_tokens: 0, total_tokens: 100 }, { input_tokens: 100, output_tokens: 401, total_tokens: 501 }])
    rejects('missing_usage', () => accountPhysicalResponse(createGuardState(), { ...metadata, usage }, 'final'));
  pass('sticky_stop', () => {
    const state = prepared(); latch(state, new Error('private fixture exception'));
    assert.throws(() => beginLogical(state, 'final'), /HARNESS_ALREADY_STOPPED/);
    assert.equal(state.logicalCalls, 1); assert.equal(state.firstStopCode, 'HARNESS_STOP');
  });
  pass('replay_invariants', () => {
    const before = { ids: { assistant: 2, generation: 1, actions: [3], sources: [4] }, counts: { messages: 2, generations: 1 }, calls: { logicalCalls: 2, toolExecutions: 1 } };
    checkReplay(before, structuredClone(before));
    for (const after of [ { ...before, ids: { ...before.ids, assistant: 3 } },
      { ...before, counts: { ...before.counts, messages: 3 } },
      { ...before, calls: { ...before.calls, logicalCalls: 3 } },
      { ...before, calls: { ...before.calls, toolExecutions: 2 } } ]) assert.throws(() => checkReplay(before, after));
  });
  pass('authorization_interlocks', () => {
    const harnessHash = 'a'.repeat(64);
    const env = { R510_OWNER_AUTHORIZED: CONTRACT.productBaseSha, R510_BUDGET_USD: '0.02',
      RENDER_SERVICE_ID: CONTRACT.renderServiceId, R510_DEPLOY_COMMIT: 'b'.repeat(40),
      RENDER_GIT_COMMIT: 'b'.repeat(40), R510_HARNESS_SHA256: harnessHash, NODE_ENV: 'production' };
    checkAuthorization(env, harnessHash);
    for (const [key, bad] of Object.entries({ R510_OWNER_AUTHORIZED: 'other', R510_BUDGET_USD: '0.020',
      RENDER_SERVICE_ID: 'other', R510_DEPLOY_COMMIT: '', RENDER_GIT_COMMIT: 'c'.repeat(40),
      R510_HARNESS_SHA256: 'c'.repeat(64), NODE_ENV: 'test', AI_CYBERGUARD_LIVE_ENABLED: '1',
      AI_CYBERGUARD_AGENTIC_ENABLED: '1', AI_TEST_UNRECOGNIZED: '1' })) assert.throws(() => checkAuthorization({ ...env, [key]: bad }, harnessHash));
    assert.throws(() => checkAuthorization({ ...env, AI_TEST_EMPTY: '' }, harnessHash));
  });
  return { ...zeroReceipt('R5_10_OFFLINE_HARNESS_PASS'), checks };
}

let executionState;
async function runLive() {
  const harnessSha256 = sha256(fs.readFileSync(__filename));
  checkAuthorization(process.env, harnessSha256);
  const root = path.resolve(__dirname, '../..');
  verifySourceHashes(root);
  // This is the first product import boundary. Offline modes never reach it.
  for (const method of ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'table']) console[method] = () => {};
  const req = createRequire(path.join(root, 'server/package.json'));
  const state = executionState = createGuardState();
  state.deploymentCommit = process.env.R510_DEPLOY_COMMIT;
  state.harnessSha256 = harnessSha256;
  const nativeFetch = global.fetch;
  const abort = new AbortController();
  let httpServer;
  const pools = [];
  let learningSnapshot;
  let pool;
  let cookie = '';
  let seedComplete = false;
  const watchdog = setTimeout(() => {
    latch(state, new Error('HARNESS_TIMEOUT')); abort.abort();
    emitReceipt(safeReceipt(state, 'STOP_REVIEW_REQUIRED'));
    process.exit(1);
  }, 60000);

  global.fetch = async (input, options = {}) => {
    try {
      const method = options.method || (input instanceof Request ? input.method : 'GET');
      const destination = checkDestination(input, method);
      const signal = AbortSignal.any([abort.signal, ...(options.signal ? [options.signal] : input instanceof Request && input.signal ? [input.signal] : [])]);
      if (destination === 'local') return await nativeFetch(input, { ...options, redirect: 'error', signal });
      ensure(!state.stopped, 'HARNESS_ALREADY_STOPPED');
      const raw = options.body ?? (input instanceof Request ? await input.clone().text() : '');
      ensure(typeof raw === 'string' && Buffer.byteLength(raw) <= 20000, 'REQUEST_SIZE_STOP');
      const body = JSON.parse(raw);
      const phase = state.activeCall;
      takePhysicalAttempt(state, body);
      const response = await nativeFetch(input, { ...options, redirect: 'error', signal });
      // Inspect metadata/usage only. Do not retain, inspect or print output fields.
      const { model, status, usage } = await response.clone().json();
      accountPhysicalResponse(state, { model, status, usage }, phase);
      return response;
    } catch (error) {
      if (safeErrorCode(error) === 'OUTBOUND_DESTINATION_BLOCKED') state.unexpectedFetchAttempts += 1;
      latch(state, error); throw error;
    }
  };

  async function request(method, route, body) {
    const response = await fetch('http://127.0.0.1:' + CONTRACT.port + route, {
      method, headers: { 'Content-Type': 'application/json', Origin: process.env.CLIENT_ORIGIN,
        'X-Forwarded-Proto': 'https', ...(cookie ? { Cookie: cookie } : {}) },
      body: body === undefined ? undefined : JSON.stringify(body), redirect: 'error',
    });
    const cookies = response.headers.getSetCookie();
    if (cookies.length) cookie = cookies.map(value => value.split(';')[0]).join('; ');
    return { status: response.status, body: await response.json() };
  }
  async function learningState() {
    const snapshot = {};
    for (const table of ['learner_profiles', 'learner_progress_summary', 'learner_topic_progress',
      'learner_recommendations', 'assessment_attempts', 'scenario_attempts', 'scenario_progress_events']) {
      const [rows] = await pool.query('SELECT * FROM ' + table + ' WHERE user_id = ? ORDER BY id', [state.userId]);
      snapshot[table] = rows;
    }
    for (const [table, parent] of [['assessment_answers', 'assessment_attempts'],
      ['assessment_topic_scores', 'assessment_attempts'], ['scenario_decisions', 'scenario_attempts']]) {
      const [rows] = await pool.query('SELECT child.* FROM ' + table + ' child JOIN ' + parent +
        ' parent ON parent.id = child.attempt_id WHERE parent.user_id = ? ORDER BY child.id', [state.userId]);
      snapshot[table] = rows;
    }
    return JSON.stringify(snapshot);
  }
  async function outputCounts() {
    const counts = {};
    for (const table of ['chat_messages', 'chat_message_generations', 'chat_message_actions', 'chat_message_sources']) {
      const [[row]] = await pool.query('SELECT COUNT(*) AS n FROM ' + table + ' WHERE conversation_id = ?', [state.conversationId]);
      counts[table] = Number(row.n);
    }
    // Product proposals use an in-memory store; the patched store forbids set().
    counts.proposals = state.proposalAttempts;
    return counts;
  }
  async function traceCount() {
    const [[row]] = await pool.query('SELECT COUNT(*) AS n FROM agentic_execution_traces WHERE conversation_id = ?', [state.conversationId]);
    return Number(row.n);
  }

  try {
    Object.assign(process.env, {
      AI_CYBERGUARD_LIVE_ENABLED: '1', AI_CYBERGUARD_AGENTIC_ENABLED: '1',
      AI_PROVIDER_CYBERGUARD: 'openai', AI_PROVIDER_AGENT_ROUTER: 'openai',
      AI_DEFAULT_PROVIDER: 'openai', AI_PROVIDER: 'openai',
      AI_PROVIDER_LIGHTWEIGHT: 'openai', AI_PROVIDER_TRANSLATION: 'openai', AI_PROVIDER_SAFETY: 'openai',
      AI_MODEL: CONTRACT.model, AI_DEFAULT_MODEL: CONTRACT.model, OPENAI_MODEL: CONTRACT.model,
      AI_MAX_OUTPUT_TOKENS: '400', AI_CONTEXT_MESSAGE_LIMIT: '12', AI_CONTEXT_CHARACTER_LIMIT: '8000',
      AI_PER_USER_MINUTE_LIMIT: '20', AI_PROVIDER_RUNTIME_DISABLED: 'gemini,ilmu',
      PORT: String(CONTRACT.port), EMAIL_TRANSPORT: 'disabled', DOTENV_CONFIG_QUIET: 'true',
    });
    req('./src/config/productionConfig').validateProductionConfig(process.env);
    const openaiModule = req('./src/ai/providers/openai.provider');
    const originalProvider = openaiModule.createOpenAiProvider;
    openaiModule.createOpenAiProvider = config => {
      ensure(config.maxRetries === 0 && config.model === CONTRACT.model &&
        !config.testMockMode && !config.mockMode, 'PROVIDER_CONFIG_REJECTED');
      const provider = originalProvider({ ...config, fetchImpl: global.fetch });
      const generate = provider.generate.bind(provider);
      const reply = provider.generateReply.bind(provider);
      provider.generate = async requestBody => {
        try {
          ensure(requestBody.metadata?.purpose === 'agent_route_planning', 'CALL_ORDER_REJECTED');
          beginLogical(state, 'planner');
          const result = await generate(requestBody);
          guarded(state, () => checkNormalizedResult(result));
          state.normalizedPlanner = true;
          return result;
        } catch (error) { latch(state, error); throw error; }
        finally { state.activeCall = null; }
      };
      provider.generateReply = async requestBody => {
        try {
          beginLogical(state, 'final');
          const result = await reply(requestBody);
          ensure(!result.actionProposal, 'PRODUCT_ASSERTION_FAILED');
          return result;
        } catch (error) { latch(state, error); throw error; }
        finally { state.activeCall = null; }
      };
      return provider;
    };
    for (const [file, factory] of [['gemini.provider', 'createGeminiProvider'], ['ilmu.provider', 'createIlmuProvider']]) {
      req('./src/ai/providers/' + file)[factory] = () => fail('PROVIDER_FALLBACK_BLOCKED');
    }
    const catalogue = req('./src/agent/agent.toolCatalogue');
    const definition = catalogue.getControlledToolDefinition(CONTRACT.toolName);
    ensure(definition.mode === 'read_only' && definition.allowedRoles.includes('user'), 'TOOL_CALL_REJECTED');
    const executorModule = req('./src/agent/controlledToolExecutor');
    const originalExecutor = executorModule.createControlledToolExecutor;
    executorModule.createControlledToolExecutor = options => {
      const executor = originalExecutor(options);
      const execute = executor.executeToolCall.bind(executor);
      executor.executeToolCall = async input => {
        try {
          ensure(input.context?.userId === state.userId && input.context?.role === 'user', 'TOOL_CALL_REJECTED');
          takeToolExecution(state, input.toolCall);
          const result = await execute(input);
          ensure(result.status === 'success' && result.toolName === CONTRACT.toolName, 'TOOL_RESULT_REJECTED');
          state.toolSuccess = true;
          return result;
        } catch (error) { latch(state, error); throw error; }
      };
      return executor;
    };
    const proposalModule = req('./src/agent/actions/actionProposal.service');
    const originalProposalService = proposalModule.createActionProposalService;
    proposalModule.createActionProposalService = options => {
      const store = proposalModule.createInMemoryProposalStore();
      store.set = () => blockProposal(state);
      return originalProposalService({ ...options, store });
    };
    const poolModule = req('./src/database/pool');
    const originalPool = poolModule.createPool;
    poolModule.createPool = (...args) => {
      const instance = originalPool(...args);
      pools.push(instance);
      const query = instance.query.bind(instance);
      instance.query = async (sql, values) => {
        const write = /^\s*(INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP|TRUNCATE)\b/i.test(sql);
        if (write) state.dbWriteStatements += 1;
        const result = await query(sql, values);
        if (write) state.dbWrites += Number(result[0]?.affectedRows || 0);
        return result;
      };
      return instance;
    };
    pool = poolModule.createPool();
    const express = req('express');
    express.application.listen = function listen(port, callback) {
      ensure(Number(port) === CONTRACT.port, 'SERVER_START_FAILED');
      httpServer = req('node:http').createServer(this);
      return httpServer.listen(CONTRACT.port, '127.0.0.1', callback);
    };
    req('./server.js');
    if (!httpServer?.listening) await new Promise((resolve, reject) => {
      ensure(httpServer, 'SERVER_START_FAILED');
      httpServer.once('listening', resolve); httpServer.once('error', reject);
    });
    ensure((await request('GET', '/api/health')).status === 200, 'PRODUCT_ASSERTION_FAILED');
    state.healthBefore = 200;

    const email = 'r510-' + crypto.randomUUID() + '@example.invalid';
    const password = crypto.randomBytes(32).toString('hex');
    const passwordHash = await req('bcrypt').hash(password, 10);
    const [insert] = await pool.query("INSERT INTO users (email,display_name,age,age_group,password_hash,role,account_status,email_verified_at) VALUES (?, 'R5-10 synthetic certification',16,'teen',?,'user','active',CURRENT_TIMESTAMP)", [email, passwordHash]);
    state.userId = insert.insertId;
    await pool.query("INSERT INTO learner_progress_summary (user_id,overall_mastery_percentage,measured_level,total_activity_count,last_progress_at) VALUES (?,35,'beginner',1,CURRENT_TIMESTAMP)", [state.userId]);
    await pool.query("INSERT INTO learner_topic_progress (user_id,topic_code,current_level,mastery_percentage,source_type,activity_count,last_activity_at) VALUES (?,'phishing_and_scams','beginner',35,'admin_adjustment',1,CURRENT_TIMESTAMP)", [state.userId]);
    const login = await request('POST', '/api/auth/login', { email, password });
    ensure(login.status === 200 && login.body.user.id === state.userId, 'PRODUCT_ASSERTION_FAILED');
    seedComplete = true;
    learningSnapshot = await learningState();
    const conversation = await request('POST', '/api/chat/conversations', { message: { role: 'user', content: CONTRACT.prompt }, locale: 'en' });
    ensure(conversation.status === 201, 'PRODUCT_ASSERTION_FAILED');
    state.conversationId = conversation.body.conversation.id;
    state.userMessageId = conversation.body.messages[0].id;
    const route = '/api/chat/conversations/' + state.conversationId + '/messages/' + state.userMessageId + '/generate';
    const generated = await request('POST', route, { locale: 'en' });
    ensure(generated.status === 201 && generated.body.generation.status === 'completed' &&
      generated.body.proposal === null && typeof generated.body.assistantMessage.content === 'string' &&
      generated.body.assistantMessage.content.trim().length > 0, 'PRODUCT_ASSERTION_FAILED');
    checkExactCounters(state);
    ensure(state.transportTotalTokens > 0 && state.transportEstimatedCostUsd <= 0.02, 'BUDGET_BREACH');
    const [generations] = await pool.query('SELECT id,status,input_tokens,output_tokens FROM chat_message_generations WHERE conversation_id = ? ORDER BY id', [state.conversationId]);
    ensure(generations.length === 1 && generations[0].status === 'completed' &&
      Number(generations[0].input_tokens) > 0 && Number(generations[0].output_tokens) > 0, 'PRODUCT_ASSERTION_FAILED');
    state.finalInputTokens = Number(generations[0].input_tokens);
    state.finalOutputTokens = Number(generations[0].output_tokens);
    const [traces] = await pool.query('SELECT trace_json FROM agentic_execution_traces WHERE conversation_id = ? AND message_id = ? ORDER BY id', [state.conversationId, state.userMessageId]);
    ensure(traces.length === 1, 'TRACE_ASSERTION_FAILED');
    const trace = typeof traces[0].trace_json === 'string' ? JSON.parse(traces[0].trace_json) : traces[0].trace_json;
    checkTrace(trace);
    state.traceAssertionsPassed = true;
    ensure(await learningState() === learningSnapshot, 'LEARNING_STATE_CHANGED');
    state.learningStateUnchanged = true;
    const before = { ids: replyIds(generated.body), counts: await outputCounts(), counters: counters(state) };
    ensure(before.counts.proposals === 0, 'PRODUCT_ASSERTION_FAILED');
    const beforeTraces = await traceCount();
    const replay = await request('POST', route, { locale: 'en' });
    ensure(replay.status === 200 && replay.body.proposal === null && replay.body.generation.status === 'completed', 'PRODUCT_ASSERTION_FAILED');
    checkReplay(before, { ids: replyIds(replay.body), counts: await outputCounts(), counters: counters(state) });
    checkExactCounters(state);
    ensure(await learningState() === learningSnapshot, 'LEARNING_STATE_CHANGED');
    state.replayTraceRowsAdded = (await traceCount()) - beforeTraces;
    // Existing R5-08 audit limitation: replay starts a fresh trace before cache return.
    ensure(state.replayTraceRowsAdded === 1, 'TRACE_ASSERTION_FAILED');
    state.replayUnchanged = true;
    state.generationId = generated.body.generation.id;
    state.assistantMessageId = generated.body.assistantMessage.id;
    state.outputRowCounts = before.counts;
    ensure((await request('GET', '/api/health')).status === 200, 'PRODUCT_ASSERTION_FAILED');
    state.healthAfter = 200;
    state.result = 'R5_10_PRODUCT_PASS_PENDING_CONTROL_TOWER_REVIEW';
  } catch (error) {
    latch(state, error);
    state.result = 'STOP_REVIEW_REQUIRED';
    process.exitCode = 1;
  } finally {
    // Close process resources only. Synthetic data is intentionally preserved.
    if (seedComplete && learningSnapshot) {
      try { state.learningStateUnchanged = await learningState() === learningSnapshot; }
      catch { state.learningStateUnchanged = false; }
      if (!state.learningStateUnchanged) { latch(state, new Error('LEARNING_STATE_CHANGED')); state.result = 'STOP_REVIEW_REQUIRED'; process.exitCode = 1; }
    }
    abort.abort();
    if (httpServer) {
      httpServer.closeAllConnections();
      await new Promise(resolve => httpServer.close(resolve));
    }
    for (const instance of pools) await instance.end().catch(() => {});
    clearTimeout(watchdog);
    emitReceipt(safeReceipt(state, state.result));
  }
}
function safeReceipt(state, result) {
  // Explicit receipt allowlist. Never spread runtime objects or exception values.
  const receipt = zeroReceipt(result);
  for (const key of ['deploymentCommit', 'harnessSha256', 'providerCalls', 'providerCallsByProvider',
    'logicalCalls', 'plannerCalls', 'finalCalls', 'outboundAttempts', 'physicalResponses',
    'toolExecutions', 'proposalAttempts', 'dbWrites', 'dbWriteStatements', 'realNetwork', 'unexpectedFetchAttempts',
    'transportInputTokens', 'transportOutputTokens', 'transportTotalTokens', 'transportEstimatedCostUsd',
    'finalInputTokens', 'finalOutputTokens', 'userId', 'conversationId', 'userMessageId',
    'generationId', 'assistantMessageId', 'healthBefore', 'healthAfter', 'traceAssertionsPassed',
    'learningStateUnchanged', 'replayUnchanged', 'replayTraceRowsAdded', 'outputRowCounts']) {
    if (state[key] !== undefined) receipt[key] = state[key];
  }
  receipt.maxLogicalCalls = 2; receipt.maxPhysicalAttempts = 2; receipt.maxToolExecutions = 1;
  receipt.syntheticDataPreserved = Boolean(state.userId);
  receipt.usageComplete = state.physicalResponses === state.outboundAttempts;
  receipt.knownResponseEstimatedCostUsd = state.transportEstimatedCostUsd;
  if (!receipt.usageComplete) receipt.transportEstimatedCostUsd = null;
  if (state.firstStopCode) receipt.safeErrorCode = state.firstStopCode;
  return receipt;
}
async function runHarness(args = process.argv.slice(2)) {
  if (args.length === 0) { emitReceipt(zeroReceipt('NOT_AUTHORIZED')); return; }
  ensure(args.length === 1 && ['--self-test', '--execute'].includes(args[0]), 'INVALID_ARGUMENTS');
  if (args[0] === '--self-test') { emitReceipt(selfTest()); return; }
  await runLive();
}
module.exports = { CONTRACT, SOURCE_HASHES, SAFE_ERROR_CODES, safeErrorCode, checkAuthorization,
  checkRequest, checkDestination, checkNormalizedResult, createGuardState, beginLogical,
  takePhysicalAttempt, takeToolExecution, blockProposal, accountPhysicalResponse, checkReplay, checkTrace, safeReceipt, runHarness };
if (require.main === module) runHarness().catch(error => {
  emitReceipt(executionState ? safeReceipt(executionState, 'STOP_REVIEW_REQUIRED') : {
    ...zeroReceipt('STOP_REVIEW_REQUIRED'), safeErrorCode: safeErrorCode(error),
  });
  process.exitCode = 1;
});
