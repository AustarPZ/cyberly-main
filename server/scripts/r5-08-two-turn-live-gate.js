'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');

const PRODUCT_BASE_SHA = '923871a2e185e8f7efc85838005f61ab1c0650c7';
const BUDGET_USD = 0.02;
const MAX_FINAL_CALLS = 2;
const MAX_OUTPUT_TOKENS = 400;
const MAX_REQUEST_BYTES = 10000;
const PORT = 51236;
const PROMPT_1 = 'Explain three safe checks for a suspicious phishing link before clicking it. Keep it concise.';
const PROMPT_2 = 'For that phishing link, what should I check next about the sender and URL before I do anything? Keep it concise.';

const HASHES = {
  'server/server.js': '0dc8f440df8b2004587530c4efb0a6e109a98ea785cdf9ee1504037c56542d3b',
  'server/src/ai/ai.config.js': 'c8a6c9f0bcf2d06f5a022831bcf60a76002a6a47a5e83f35098e20c4cc57daa4',
  'server/src/ai/ai.service.js': '2cd13ad108064cca2579ae5359e8ed86c9178426c84ce178647886e902a292fa',
  'server/src/ai/ai.repository.js': '095508d6e8b3da4a625d5d65ba065aac092be1ee70d6cdafc0430a0335f81ca0',
  'server/src/ai/providers/aiProvider.registry.js': 'cfd9505011647cc6fa9cc1abe74b432e3679229374604490504ebcaa275e1d49',
  'server/src/ai/providers/openai.provider.js': 'd80f1b502379a254bac8d3d956c18b22436ece89e503d4f6dc2f209b0d706bb2'
};

function hashText(value) {
  return crypto.createHash('sha256').update(String(value || '')).digest('hex');
}

function checkCallLimit(count, code) {
  assert.ok(count < MAX_FINAL_CALLS, code);
}

function checkRequest(body, callIndex, state) {
  const liveState = state || {};
  assert.equal(body.model, 'gpt-5.4-mini');
  assert.equal(body.store, false);
  assert.ok(!body.tools || body.tools.length === 0);
  assert.ok(Number(body.max_output_tokens) > 0 && Number(body.max_output_tokens) <= MAX_OUTPUT_TOKENS);
  assert.ok(Buffer.byteLength(JSON.stringify(body)) <= MAX_REQUEST_BYTES, 'REQUEST_SIZE_STOP');
  assert.ok(Array.isArray(body.input), 'INPUT_ARRAY_REQUIRED');

  const roles = body.input.map(item => item.role);
  if (callIndex === 1) {
    assert.deepEqual(roles, ['user']);
    assert.equal(hashText(body.input[0].content), hashText(PROMPT_1));
  } else if (callIndex === 2) {
    assert.deepEqual(roles, ['user', 'assistant', 'user']);
    assert.ok(liveState.expectedAssistantHash, 'TURN1_ASSISTANT_HASH_REQUIRED');
    assert.equal(hashText(body.input[1].content), liveState.expectedAssistantHash, 'TURN1_ASSISTANT_HISTORY_MISMATCH');
    assert.equal(hashText(body.input[2].content), hashText(PROMPT_2), 'TURN2_USER_HISTORY_MISMATCH');
  } else {
    throw new Error('FINAL_CALL_LIMIT_EXCEEDED');
  }
  return roles.join('>');
}

// This file is inert unless explicitly executed with all deployment interlocks.
// No application, database or provider modules are imported by offline modes.
function emitReceipt(receipt) {
  process.stdout.write(JSON.stringify(receipt) + '\n');
}

function safeErrorCode(error) {
  const allowed = new Set([
    'OWNER_AUTHORIZATION_REQUIRED', 'BUDGET_AUTHORIZATION_REQUIRED',
    'RENDER_SERVICE_MISMATCH', 'DEPLOY_COMMIT_REQUIRED', 'DEPLOY_COMMIT_MISMATCH',
    'HARNESS_SHA256_REQUIRED', 'HARNESS_SHA256_MISMATCH', 'PRODUCTION_REQUIRED',
    'PUBLIC_LIVE_FLAG_ENABLED', 'PUBLIC_AGENTIC_FLAG_ENABLED', 'INHERITED_AI_TEST_VALUE',
    'REQUEST_SIZE_STOP', 'INPUT_ARRAY_REQUIRED', 'TURN1_ASSISTANT_HASH_REQUIRED',
    'TURN1_ASSISTANT_HISTORY_MISMATCH', 'TURN2_USER_HISTORY_MISMATCH',
    'FINAL_CALL_LIMIT_EXCEEDED', 'THIRD_OUTBOUND_BLOCKED', 'THIRD_LOGICAL_CALL_BLOCKED',
    'OUTBOUND_DESTINATION_BLOCKED', 'PLANNER_BLOCKED', 'BUDGET_BREACH'
  ]);
  // Never forward arbitrary exception messages, assertion values or provider payloads.
  if (allowed.has(error?.message)) return error.message.slice(0, 120);
  if (Object.keys(HASHES).some(name => error?.message === 'SOURCE_HASH_MISMATCH:' + name)) {
    return 'SOURCE_HASH_MISMATCH';
  }
  return error?.code === 'ERR_ASSERTION' ? 'HARNESS_ASSERTION_FAILED' : 'HARNESS_STOP';
}

let executionSummary;

async function runHarness() {
  if (process.argv.includes('--self-test')) {
    const base = { model: 'gpt-5.4-mini', store: false, max_output_tokens: 400 };
    const one = { ...base, input: [{ role: 'user', content: PROMPT_1 }] };
    checkRequest(one, 1);
    const state = { expectedAssistantHash: hashText('fixture assistant') };
    const two = {
      ...base,
      input: [
        { role: 'user', content: PROMPT_1 },
        { role: 'assistant', content: 'fixture assistant' },
        { role: 'user', content: PROMPT_2 }
      ]
    };
    checkRequest(two, 2, state);
    const badCases = [
      { ...one, model: 'other' },
      { ...one, tools: [{}] },
      { ...one, max_output_tokens: 401 },
      { ...one, max_output_tokens: 0 },
      { ...one, store: true },
      { ...one, input: null },
      { ...one, input: [{ role: 'assistant', content: PROMPT_1 }] },
      { ...one, instructions: 'x'.repeat(MAX_REQUEST_BYTES + 1000) }
    ];
    for (const bad of badCases) assert.throws(() => checkRequest(bad, 1));
    assert.throws(() => checkRequest(two, 2));
    assert.throws(() => checkRequest(two, 2, { expectedAssistantHash: hashText('different assistant') }));
    assert.throws(() => checkRequest({ ...two, input: two.input.slice(1) }, 2, state));
    assert.throws(() => checkRequest({ ...two, input: [two.input[0], two.input[1], { role: 'user', content: 'different current prompt' }] }, 2, state));
    assert.throws(() => checkRequest(one, 3), /FINAL_CALL_LIMIT_EXCEEDED/);
    for (const code of ['THIRD_LOGICAL_CALL_BLOCKED', 'THIRD_OUTBOUND_BLOCKED']) {
      checkCallLimit(0, code);
      checkCallLimit(1, code);
      assert.throws(() => checkCallLimit(2, code), new RegExp(code));
    }
    emitReceipt({
      result: 'R5_08_LIVE_OFFLINE_GUARDS_PASS',
      providerCalls: 0,
      dbWrites: 0,
      budgetUsd: BUDGET_USD,
      maxFinalCalls: MAX_FINAL_CALLS
    });
    return;
  }

  if (!process.argv.includes('--execute')) {
    emitReceipt({
      result: 'NOT_AUTHORIZED',
      productBaseSha: PRODUCT_BASE_SHA,
      providerCalls: 0,
      dbWrites: 0
    });
    return;
  }

  assert.equal(process.env.R508_OWNER_AUTHORIZED, PRODUCT_BASE_SHA, 'OWNER_AUTHORIZATION_REQUIRED');
  assert.equal(process.env.R508_BUDGET_USD, '0.02', 'BUDGET_AUTHORIZATION_REQUIRED');
  assert.equal(process.env.RENDER_SERVICE_ID, 'srv-d9tiop942hec738b3org', 'RENDER_SERVICE_MISMATCH');
  assert.ok(process.env.R508_DEPLOY_COMMIT, 'DEPLOY_COMMIT_REQUIRED');
  assert.equal(process.env.R508_DEPLOY_COMMIT, process.env.RENDER_GIT_COMMIT, 'DEPLOY_COMMIT_MISMATCH');
  const harnessSha256 = crypto.createHash('sha256').update(fs.readFileSync(__filename)).digest('hex');
  assert.ok(process.env.R508_HARNESS_SHA256, 'HARNESS_SHA256_REQUIRED');
  assert.equal(process.env.R508_HARNESS_SHA256, harnessSha256, 'HARNESS_SHA256_MISMATCH');
  assert.equal(process.env.NODE_ENV, 'production', 'PRODUCTION_REQUIRED');
  assert.notEqual(process.env.AI_CYBERGUARD_LIVE_ENABLED, '1', 'PUBLIC_LIVE_FLAG_ENABLED');
  assert.notEqual(process.env.AI_CYBERGUARD_AGENTIC_ENABLED, '1', 'PUBLIC_AGENTIC_FLAG_ENABLED');
  for (const key of Object.keys(process.env)) {
    if (/^AI_TEST_/.test(key)) assert.ok(!process.env[key], 'INHERITED_AI_TEST_VALUE');
  }

  const root = path.resolve(process.env.R508_REPO_ROOT || process.cwd());
  for (const [name, expected] of Object.entries(HASHES)) {
    const actual = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, name))).digest('hex');
    assert.equal(actual, expected, 'SOURCE_HASH_MISMATCH:' + name);
  }

  for (const method of ['log', 'info', 'warn', 'error', 'debug', 'trace', 'dir', 'table']) console[method] = () => {};

  const req = createRequire(path.join(root, 'server/package.json'));
  const nativeFetch = global.fetch;
  const state = { expectedAssistantHash: null };
  const summary = executionSummary = {
    productBaseSha: PRODUCT_BASE_SHA,
    deploymentCommit: process.env.R508_DEPLOY_COMMIT,
    harnessSha256,
    result: 'NOT_EXECUTED',
    providerCalls: 0,
    logicalCalls: 0,
    outboundAttempts: 0,
    transportRoles: [],
    plannerCalls: 0,
    unexpectedFetchAttempts: 0,
    retries: 0,
    budgetUsd: BUDGET_USD,
    maxFinalCalls: MAX_FINAL_CALLS
  };

  let httpServer;
  const pools = [];
  let pool;

  global.fetch = async (input, options) => {
    const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url);
    if (url.origin === 'http://127.0.0.1:' + PORT && !url.username && !url.password) {
      return nativeFetch(input, { ...options, redirect: 'error' });
    }
    if (url.href !== 'https://api.openai.com/v1/responses') {
      summary.unexpectedFetchAttempts += 1;
      throw new Error('OUTBOUND_DESTINATION_BLOCKED');
    }

    checkCallLimit(summary.outboundAttempts, 'THIRD_OUTBOUND_BLOCKED');
    const raw = options && options.body ? options.body : (input instanceof Request ? await input.clone().text() : '');
    assert.ok(Buffer.byteLength(raw) <= MAX_REQUEST_BYTES, 'REQUEST_SIZE_STOP');
    const body = JSON.parse(raw);
    const callIndex = summary.outboundAttempts + 1;
    const roleSequence = checkRequest(body, callIndex, state);
    summary.transportRoles.push(roleSequence);
    summary.outboundAttempts += 1;
    summary.providerCalls = summary.outboundAttempts;
    return nativeFetch(input, { ...options, redirect: 'error' });
  };

  async function main() {
    Object.assign(process.env, {
      AI_CYBERGUARD_LIVE_ENABLED: '1',
      AI_CYBERGUARD_AGENTIC_ENABLED: '0',
      AI_PROVIDER_CYBERGUARD: 'openai',
      AI_DEFAULT_PROVIDER: 'openai',
      AI_PROVIDER: 'openai',
      AI_MODEL: 'gpt-5.4-mini',
      AI_DEFAULT_MODEL: 'gpt-5.4-mini',
      OPENAI_MODEL: 'gpt-5.4-mini',
      AI_MAX_OUTPUT_TOKENS: String(MAX_OUTPUT_TOKENS),
      AI_CONTEXT_MESSAGE_LIMIT: '12',
      AI_CONTEXT_CHARACTER_LIMIT: '8000',
      AI_PER_USER_MINUTE_LIMIT: '20',
      PORT: String(PORT),
      EMAIL_TRANSPORT: 'disabled'
    });

    const poolModule = req('./src/database/pool');
    const originalCreatePool = poolModule.createPool;
    poolModule.createPool = (...args) => {
      const instance = originalCreatePool(...args);
      pools.push(instance);
      return instance;
    };
    pool = poolModule.createPool();

    const openaiModule = req('./src/ai/providers/openai.provider');
    const originalCreateProvider = openaiModule.createOpenAiProvider;
    openaiModule.createOpenAiProvider = config => {
      assert.equal(config.maxRetries, 0);
      const provider = originalCreateProvider(config);
      const originalGenerate = provider.generate;
      provider.generate = async (...args) => {
        checkCallLimit(summary.logicalCalls, 'THIRD_LOGICAL_CALL_BLOCKED');
        summary.logicalCalls += 1;
        return originalGenerate(...args);
      };
      const originalReply = provider.generateReply;
      provider.generateReply = async (...args) => {
        checkCallLimit(summary.logicalCalls, 'THIRD_LOGICAL_CALL_BLOCKED');
        summary.logicalCalls += 1;
        return originalReply(...args);
      };
      return provider;
    };

    const plannerModule = req('./src/agent/controlledAgentic.service');
    const originalPlanner = plannerModule.createControlledAgenticService;
    plannerModule.createControlledAgenticService = (...args) => {
      const planner = originalPlanner(...args);
      planner.planAndExecute = async () => {
        summary.plannerCalls += 1;
        throw new Error('PLANNER_BLOCKED');
      };
      return planner;
    };

    const express = req('express');
    express.application.listen = function listen(port, cb) {
      httpServer = req('node:http').createServer(this);
      return httpServer.listen(Number(port), '127.0.0.1', cb);
    };

    req('./server.js');
    if (!httpServer.listening) await new Promise(resolve => httpServer.once('listening', resolve));

    const localBase = 'http://127.0.0.1:' + PORT;
    let cookie = '';
    async function request(method, route, body) {
      const response = await fetch(localBase + route, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Origin: process.env.CLIENT_ORIGIN,
          'X-Forwarded-Proto': 'https',
          ...(cookie ? { Cookie: cookie } : {})
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: 'error'
      });
      const headers = response.headers.getSetCookie();
      if (headers.length) cookie = headers.map(value => value.split(';')[0]).join('; ');
      return { status: response.status, body: await response.json() };
    }

    assert.equal((await request('GET', '/api/health')).status, 200);

    const email = 'r508-live-' + crypto.randomUUID() + '@example.invalid';
    const password = crypto.randomBytes(32).toString('hex');
    const passwordHash = await req('bcrypt').hash(password, 10);
    const insertSql = "INSERT INTO users (email,display_name,age,age_group,password_hash,role,account_status,email_verified_at) VALUES (?, 'R5-08 synthetic two-turn certification',16,'teen',?,'user','active',CURRENT_TIMESTAMP)";
    const [insert] = await pool.query(insertSql, [email, passwordHash]);
    summary.userId = insert.insertId;

    const login = await request('POST', '/api/auth/login', { email, password });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.id, summary.userId);

    const conversation = await request('POST', '/api/chat/conversations', {
      message: { role: 'user', content: PROMPT_1 },
      locale: 'en'
    });
    assert.equal(conversation.status, 201);
    summary.conversationId = conversation.body.conversation.id;
    const turn1UserId = conversation.body.messages[0].id;
    summary.turn1UserMessageId = turn1UserId;

    const firstRoute = '/api/chat/conversations/' + summary.conversationId + '/messages/' + turn1UserId + '/generate';
    const first = await request('POST', firstRoute, { locale: 'en' });
    assert.equal(first.status, 201);
    assert.equal(first.body.generation.status, 'completed');
    assert.equal(first.body.proposal, null);
    assert.ok(first.body.assistantMessage.content.length > 0);
    assert.ok(Array.isArray(first.body.actions) && first.body.actions.length > 0 && first.body.actions.length <= 3);
    assert.ok(Array.isArray(first.body.sources) && first.body.sources.length > 0 && first.body.sources.length <= 4);
    summary.turn1AssistantMessageId = first.body.assistantMessage.id;
    summary.turn1Actions = first.body.actions.length;
    summary.turn1Sources = first.body.sources.length;
    const [persistedTurn1] = await pool.query(
      'SELECT content FROM chat_messages WHERE id = ? AND conversation_id = ? AND role = ?',
      [summary.turn1AssistantMessageId, summary.conversationId, 'assistant']
    );
    assert.equal(persistedTurn1.length, 1);
    state.expectedAssistantHash = hashText(persistedTurn1[0].content);
    assert.equal(state.expectedAssistantHash, hashText(first.body.assistantMessage.content), 'TURN1_ASSISTANT_HISTORY_MISMATCH');

    const secondMessageRoute = '/api/chat/conversations/' + summary.conversationId + '/messages';
    const secondMessage = await request('POST', secondMessageRoute, { content: PROMPT_2 });
    assert.equal(secondMessage.status, 201);
    const turn2UserId = secondMessage.body.message.id;
    summary.turn2UserMessageId = turn2UserId;

    const secondRoute = '/api/chat/conversations/' + summary.conversationId + '/messages/' + turn2UserId + '/generate';
    const second = await request('POST', secondRoute, { locale: 'en' });
    assert.equal(second.status, 201);
    assert.equal(second.body.generation.status, 'completed');
    assert.equal(second.body.proposal, null);
    assert.ok(second.body.assistantMessage.content.length > 0);
    assert.ok(Array.isArray(second.body.actions) && second.body.actions.length > 0 && second.body.actions.length <= 3);
    assert.ok(Array.isArray(second.body.sources) && second.body.sources.length > 0 && second.body.sources.length <= 4);
    summary.turn2AssistantMessageId = second.body.assistantMessage.id;
    summary.turn2Actions = second.body.actions.length;
    summary.turn2Sources = second.body.sources.length;

    assert.equal(summary.logicalCalls, 2);
    assert.equal(summary.outboundAttempts, 2);
    assert.deepEqual(summary.transportRoles, ['user', 'user>assistant>user']);
    assert.equal(summary.plannerCalls, 0);
    assert.equal(summary.unexpectedFetchAttempts, 0);

    const generationSql = 'SELECT id,user_message_id,assistant_message_id,status,input_tokens,output_tokens,estimated_cost_usd FROM chat_message_generations WHERE conversation_id = ? ORDER BY id';
    const [generations] = await pool.query(generationSql, [summary.conversationId]);
    assert.equal(generations.length, 2);
    assert.deepEqual(generations.map(row => row.status), ['completed', 'completed']);
    assert.deepEqual(generations.map(row => Number(row.user_message_id)), [Number(turn1UserId), Number(turn2UserId)]);
    assert.deepEqual(generations.map(row => Number(row.assistant_message_id)), [Number(summary.turn1AssistantMessageId), Number(summary.turn2AssistantMessageId)]);
    summary.inputTokens = generations.reduce((sum, row) => sum + Number(row.input_tokens || 0), 0);
    summary.outputTokens = generations.reduce((sum, row) => sum + Number(row.output_tokens || 0), 0);
    summary.estimatedCostUsd = generations.reduce((sum, row) => sum + Number(row.estimated_cost_usd || 0), 0);
    assert.ok(summary.inputTokens > 0 && summary.outputTokens > 0 && summary.estimatedCostUsd > 0);
    assert.ok(summary.estimatedCostUsd <= BUDGET_USD, 'BUDGET_BREACH');

    const [messages] = await pool.query('SELECT id,role,reply_to_message_id FROM chat_messages WHERE conversation_id = ? ORDER BY id', [summary.conversationId]);
    assert.equal(messages.length, 4);
    assert.deepEqual(messages.map(row => row.role), ['user', 'assistant', 'user', 'assistant']);
    assert.equal(Number(messages[1].reply_to_message_id), Number(turn1UserId));
    assert.equal(Number(messages[3].reply_to_message_id), Number(turn2UserId));

    const traceSql = 'SELECT trace_json FROM agentic_execution_traces WHERE conversation_id = ? AND message_id = ? ORDER BY id DESC LIMIT 1';
    const [turn2Traces] = await pool.query(traceSql, [summary.conversationId, turn2UserId]);
    assert.equal(turn2Traces.length, 1);
    const trace = typeof turn2Traces[0].trace_json === 'string' ? JSON.parse(turn2Traces[0].trace_json) : turn2Traces[0].trace_json;
    assert.equal(trace.planning.used, false);
    assert.equal(trace.planning.fallbackReason, 'runtime_disabled');
    assert.equal(trace.toolExecution.toolName, null);
    assert.equal(trace.limits.maxToolExecutions, 0);
    assert.equal(trace.limits.modelRequestCount, 0);
    assert.equal(trace.limits.toolExecutionCount, 0);
    summary.agentic = {
      planningUsed: false,
      fallbackReason: trace.planning.fallbackReason,
      maxToolExecutions: trace.limits.maxToolExecutions,
      modelRequestCount: trace.limits.modelRequestCount,
      toolExecutionCount: trace.limits.toolExecutionCount
    };

    async function outputCounts() {
      const [[messageCount]] = await pool.query('SELECT COUNT(*) AS n FROM chat_messages WHERE conversation_id = ?', [summary.conversationId]);
      const [[generationCount]] = await pool.query('SELECT COUNT(*) AS n FROM chat_message_generations WHERE conversation_id = ?', [summary.conversationId]);
      const [[actionCount]] = await pool.query('SELECT COUNT(*) AS n FROM chat_message_actions WHERE conversation_id = ?', [summary.conversationId]);
      const [[sourceCount]] = await pool.query('SELECT COUNT(*) AS n FROM chat_message_sources WHERE conversation_id = ?', [summary.conversationId]);
      return {
        messages: Number(messageCount.n),
        generations: Number(generationCount.n),
        actions: Number(actionCount.n),
        sources: Number(sourceCount.n)
      };
    }

    const beforeReplay = await outputCounts();
    summary.counts = beforeReplay;
    const secondActionIds = second.body.actions.map(item => item.id);
    const secondSourceIds = second.body.sources.map(item => item.id);
    const replay = await request('POST', secondRoute, { locale: 'en' });
    assert.equal(replay.status, 200);
    assert.equal(replay.body.assistantMessage.id, summary.turn2AssistantMessageId);
    assert.equal(replay.body.generation.id, second.body.generation.id);
    assert.deepEqual(replay.body.actions.map(item => item.id), secondActionIds);
    assert.deepEqual(replay.body.sources.map(item => item.id), secondSourceIds);
    assert.deepEqual(await outputCounts(), beforeReplay);
    assert.equal(summary.logicalCalls, 2);
    assert.equal(summary.outboundAttempts, 2);
    assert.equal(summary.plannerCalls, 0);

    assert.equal((await request('GET', '/api/health')).status, 200);
    summary.result = 'R5_08_TWO_TURN_PRODUCT_PASS_PENDING_CONTROL_TOWER_REVIEW';
  }

  await main()
    .catch(error => {
      summary.result = 'STOP_REVIEW_REQUIRED';
      summary.safeErrorCode = safeErrorCode(error);
      process.exitCode = 1;
    })
    .finally(async () => {
      if (httpServer) await new Promise(resolve => httpServer.close(resolve));
      for (const instance of pools) await instance.end().catch(() => {});
      emitReceipt(summary);
    });

}

runHarness().catch(error => {
  emitReceipt({
    ...(executionSummary || { productBaseSha: PRODUCT_BASE_SHA, providerCalls: 0, dbWrites: 0 }),
    result: 'STOP_REVIEW_REQUIRED',
    safeErrorCode: safeErrorCode(error)
  });
  process.exitCode = 1;
});
