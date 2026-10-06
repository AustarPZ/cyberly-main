'use strict';
// DB-free entry point: no dotenv, runtime, service, repository or registry imports.
const { createOpenAiProvider } = require('../src/ai/providers/openai.provider');
const { validateProviderOutput } = require('../src/ai/ai.safety');
const { createBoundedTransport, createLogicalGuard } = require('./ai-provider-live-gate');

const GATE_VERSION = 'r5-04a-v1';
const CONVERSATION_CONTRACT_VERSION = 'chat-context-v1';
const PURPOSE = 'bounded_provider_chat';
const MODEL_IDENTITY_POLICY_VERSION = 'openai-gpt-5.4-mini-r5-03d-v1';
// Frozen reviewed identities and prices; never supplied by environment or CLI.
const MODEL_IDENTITIES = Object.freeze({
  'gpt-5.4-mini': Object.freeze(['gpt-5.4-mini', 'gpt-5.4-mini-2026-03-17']),
});
const MODEL_PRICES = Object.freeze({
  'gpt-5.4-mini': Object.freeze({ input: 0.75, output: 4.50 }),
});
const SYSTEM = 'Cyberly internal bounded chat capability check. Use only the supplied conversation context. Reply with the requested token exactly and with no extra text.';
const MESSAGES = Object.freeze([
  Object.freeze({ role: 'user', content: "Remember the token from the assistant's next message for my following question." }),
  Object.freeze({ role: 'assistant', content: 'CYBERLY_CHAT_47' }),
  Object.freeze({ role: 'user', content: 'What token did the assistant just give me? Reply with the token only.' }),
]);
const EXPECTED_REPLY = 'CYBERLY_CHAT_47';
const CHAT_CHECKS = Object.freeze([
  ['requestedModelMatch', 'REQUESTED_MODEL_MISMATCH'],
  ['modelIdentityAccepted', 'MODEL_IDENTITY_POLICY_MISMATCH'],
  ['finishReasonMatch', 'FINISH_REASON_MISMATCH'],
  ['responseTextMatch', 'CHAT_CONTEXT_RESPONSE_MISMATCH'],
  ['outputSafetyAccepted', 'OUTPUT_VALIDATION_MISMATCH'],
  ['toolCallCountMatch', 'TOOL_CALL_MISMATCH'],
]);
const FAILURE_CODES = new Set([
  'NOT_AUTHORIZED', 'INVALID_ARGUMENTS', 'AUTHORIZATION_ID_REQUIRED',
  'PROVIDER_REQUIRED', 'MODEL_REQUIRED', 'UNKNOWN_MODEL_PRICING',
  'BUDGET_REQUIRED', 'CANDIDATE_SHA_INVALID', 'PROVIDER_NOT_YET_HARDENED',
  'AI_PROVIDER_NOT_CONFIGURED', 'AI_RUNTIME_DISABLED', 'TRANSPORT_UNAVAILABLE',
  'BUDGET_INSUFFICIENT', 'DESTINATION_REJECTED', 'TRANSPORT_ATTEMPT_LIMIT',
  'LOGICAL_CALL_LIMIT', 'CALL_ACCOUNTING_MISMATCH', 'BUDGET_OR_USAGE_EXCEEDED',
  'INVALID_CHAT_RESPONSE', 'AI_AUTH_FAILED', 'AI_RATE_LIMITED',
  'AI_PROVIDER_TIMEOUT', 'AI_PROVIDER_UNAVAILABLE', 'AI_REQUEST_FAILED',
]);

function guardError(code) { return Object.assign(new Error(code), { code }); }

// JS `$` may match before a final newline; require the entire identifier to match.
function matchesExactly(value, pattern) {
  if (typeof value !== 'string') return false;
  const match = pattern.exec(value);
  return Boolean(match && match[0] === value);
}

function parseArgs(argv) {
  const values = {};
  const flags = new Set(['--execute', '--provider', '--model', '--authorization-id', '--budget-usd', '--candidate-sha']);
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    if (!flags.has(flag) || Object.hasOwn(values, flag)) throw guardError('INVALID_ARGUMENTS');
    if (flag === '--execute') values[flag] = true;
    else {
      const value = argv[++i];
      if (!value || value.startsWith('--')) throw guardError('INVALID_ARGUMENTS');
      values[flag] = value;
    }
  }
  return values;
}

function safeId(value, prefix, secret) {
  return matchesExactly(value, new RegExp(`^${prefix}_[A-Za-z0-9_-]{1,100}$`))
    && !value.includes(secret) ? value : null;
}

function knownUsage(value) {
  if (!value || !['inputTokens', 'outputTokens', 'totalTokens'].every(field => Number.isSafeInteger(value[field]) && value[field] >= 0)) return null;
  return { inputTokens: value.inputTokens, outputTokens: value.outputTokens, totalTokens: value.totalTokens };
}

function emptyChatDiagnostics() {
  return {
    returnedModel: null, returnedModelAvailable: null, returnedModelSafe: null,
    requestedModelMatch: null, rawModelMatch: null,
    modelIdentityPolicyVersion: MODEL_IDENTITY_POLICY_VERSION,
    modelIdentityAccepted: null, approvedSnapshotMatch: null,
    finishReasonMatch: null, responseTextMatch: null, outputSafetyAccepted: null,
    toolCallCount: null, toolCallCountMatch: null,
    messageCount: MESSAGES.length,
    assistantHistoryIncluded: MESSAGES.some(message => message.role === 'assistant'),
    roleSequence: MESSAGES.map(message => message.role).join(','),
    failedChatChecks: [],
  };
}

// Only safe metadata, counts and booleans are returned; no text or tool payloads.
function chatDiagnostics(response, requestedModel, secret) {
  const rawModel = response.rawMetadata?.model;
  const available = rawModel !== undefined && rawModel !== null;
  const safe = available ? matchesExactly(rawModel, /^[A-Za-z0-9_.:-]{1,128}$/) && !rawModel.includes(secret) : null;
  const modelIdentityAccepted = Boolean(safe && Object.hasOwn(MODEL_IDENTITIES, requestedModel) && MODEL_IDENTITIES[requestedModel].includes(rawModel));
  const toolCount = Array.isArray(response.toolCalls) ? response.toolCalls.length : 0;
  const diagnostics = {
    ...emptyChatDiagnostics(),
    returnedModel: safe ? rawModel : null,
    returnedModelAvailable: available, returnedModelSafe: safe,
    requestedModelMatch: response.model === requestedModel,
    rawModelMatch: rawModel === requestedModel,
    modelIdentityAccepted,
    approvedSnapshotMatch: modelIdentityAccepted && rawModel !== requestedModel,
    finishReasonMatch: response.finishReason === 'completed',
    responseTextMatch: String(response.text || '').trim() === EXPECTED_REPLY,
    outputSafetyAccepted: validateProviderOutput(response.text).ok === true,
    toolCallCount: toolCount, toolCallCountMatch: toolCount === 0,
  };
  diagnostics.failedChatChecks = CHAT_CHECKS.filter(([field]) => !diagnostics[field]).map(([, code]) => code);
  return diagnostics;
}

async function runGate(argv, env = process.env, { fetchImpl = global.fetch } = {}) {
  const started = Date.now();
  const counters = { logicalCallCount: 0, transportInvocationCount: 0, actualOutboundAttemptCount: 0 };
  const result = {
    gateVersion: GATE_VERSION, conversationContractVersion: CONVERSATION_CONTRACT_VERSION,
    purpose: PURPOSE, authorizationId: null, provider: null, model: null, candidateGitSha: null,
    configured: false, enabled: false,
    testState: 'not_tested', authState: 'not_tested', chatState: 'not_tested',
    logicalCallsAuthorized: 0, logicalCallsActual: 0,
    transportAttemptsAuthorized: 0, transportInvocationsActual: 0, actualOutboundAttempts: 0,
    maxOutputTokens: 16, maxRetries: 0, usage: null, estimatedCostUsd: null,
    providerReportedCostUsd: null, authorizedBudgetUsd: null, latencyMs: 0,
    providerResponseId: null, providerResponseIdAvailable: false,
    httpRequestId: null, httpRequestIdAvailable: false, finishReason: null,
    chatDiagnostics: emptyChatDiagnostics(), resultCode: 'NOT_AUTHORIZED',
    retryCount: 0, unexpectedDuplicateAttempt: false, timestamp: null,
  };
  let key = '';
  try {
    const opts = parseArgs(argv);
    if (!opts['--execute'] || env.AI_LIVE_GATE_AUTHORIZED !== '1') throw guardError('NOT_AUTHORIZED');
    key = String(env.OPENAI_API_KEY || '').trim();
    const authorizationId = opts['--authorization-id'];
    if (!authorizationId || !matchesExactly(authorizationId, /^[A-Za-z][A-Za-z0-9_-]{0,95}$/)
      || /^(sk-|AIza)/.test(authorizationId) || (key && authorizationId.includes(key))) throw guardError('AUTHORIZATION_ID_REQUIRED');
    if (!['openai', 'gemini', 'ilmu'].includes(opts['--provider'])) throw guardError('PROVIDER_REQUIRED');
    if (!opts['--model']) throw guardError('MODEL_REQUIRED');
    if (opts['--provider'] === 'openai' && !Object.hasOwn(MODEL_PRICES, opts['--model'])) throw guardError('UNKNOWN_MODEL_PRICING');
    const budget = Number(opts['--budget-usd']);
    if (!opts['--budget-usd'] || !matchesExactly(opts['--budget-usd'], /^\d+(\.\d+)?$/) || !Number.isFinite(budget) || budget <= 0) throw guardError('BUDGET_REQUIRED');
    if (opts['--candidate-sha'] && !matchesExactly(opts['--candidate-sha'], /^[a-f0-9]{40}$/)) throw guardError('CANDIDATE_SHA_INVALID');
    result.authorizationId = authorizationId;
    result.provider = opts['--provider'];
    result.authorizedBudgetUsd = budget;
    result.candidateGitSha = opts['--candidate-sha'] || null;
    if (result.provider !== 'openai') throw guardError('PROVIDER_NOT_YET_HARDENED');
    result.model = opts['--model'];
    result.configured = Boolean(key);
    const disabled = String(env.AI_PROVIDER_RUNTIME_DISABLED === undefined ? 'gemini' : env.AI_PROVIDER_RUNTIME_DISABLED).split(',').map(id => id.trim().toLowerCase());
    result.enabled = !disabled.includes('openai');
    if (!result.configured) throw guardError('AI_PROVIDER_NOT_CONFIGURED');
    if (!result.enabled) throw guardError('AI_RUNTIME_DISABLED');
    if (typeof fetchImpl !== 'function') throw guardError('TRANSPORT_UNAVAILABLE');
    const prices = MODEL_PRICES[result.model];
    // Governance reserve only; this is not a provider-side hard billing cap.
    const reserve = (1024 * prices.input + 16 * prices.output) / 1000000;
    if (budget < reserve) throw guardError('BUDGET_INSUFFICIENT');
    result.logicalCallsAuthorized = 1;
    result.transportAttemptsAuthorized = 1;
    const transport = createBoundedTransport({ fetchImpl, counters });
    const provider = createOpenAiProvider({ apiKey: key, model: result.model, maxRetries: 0, timeoutMs: 20000, maxOutputTokens: 16, fetchImpl: transport });
    const logical = createLogicalGuard(counters);
    result.testState = 'tested'; result.authState = 'unknown'; result.chatState = 'fail';
    const response = await logical(() => provider.generate({
      systemInstruction: SYSTEM,
      messages: MESSAGES.map(message => ({ ...message })),
      maxOutputTokens: 16, tools: [], metadata: { purpose: PURPOSE },
    }));
    result.authState = 'valid';
    result.chatDiagnostics = chatDiagnostics(response, result.model, key);
    if (counters.logicalCallCount !== 1 || counters.transportInvocationCount !== 1 || counters.actualOutboundAttemptCount !== 1) throw guardError('CALL_ACCOUNTING_MISMATCH');
    result.providerResponseId = safeId(response.providerResponseId, 'resp', key);
    result.httpRequestId = safeId(response.httpRequestId, 'req', key);
    result.finishReason = ['completed', 'incomplete', 'failed'].includes(response.finishReason) ? response.finishReason : null;
    result.usage = response.rawMetadata?.usageAvailable ? knownUsage(response.usage) : null;
    if (result.usage) {
      result.estimatedCostUsd = Number(((result.usage.inputTokens * prices.input + result.usage.outputTokens * prices.output) / 1000000).toFixed(8));
    }
    // Operational budget/output bounds take precedence while diagnostics preserve semantic failures.
    if (result.usage && (result.usage.outputTokens > 16 || result.estimatedCostUsd > budget)) throw guardError('BUDGET_OR_USAGE_EXCEEDED');
    if (result.chatDiagnostics.failedChatChecks.length) throw guardError('INVALID_CHAT_RESPONSE');
    result.chatState = 'pass'; result.resultCode = 'CHAT_PASS';
  } catch (error) {
    const failureCode = counters.guardFailureCode || error.code;
    result.resultCode = FAILURE_CODES.has(failureCode) ? failureCode : 'GATE_FAILED';
    if (result.testState === 'tested' && result.resultCode === 'AI_AUTH_FAILED') result.authState = 'invalid';
    if (counters.actualOutboundAttemptCount === 0) {
      result.testState = 'not_tested'; result.authState = 'not_tested'; result.chatState = 'not_tested';
    }
  }
  result.logicalCallsActual = counters.logicalCallCount;
  result.transportInvocationsActual = counters.transportInvocationCount;
  result.actualOutboundAttempts = counters.actualOutboundAttemptCount;
  result.unexpectedDuplicateAttempt = counters.transportInvocationCount > 1;
  result.retryCount = Math.max(0, counters.actualOutboundAttemptCount - 1);
  result.providerResponseIdAvailable = Boolean(result.providerResponseId);
  result.httpRequestIdAvailable = Boolean(result.httpRequestId);
  result.latencyMs = Date.now() - started;
  result.timestamp = new Date().toISOString();
  return result;
}

if (require.main === module) {
  runGate(process.argv.slice(2)).then(result => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (result.resultCode !== 'CHAT_PASS') process.exitCode = 1;
  }).catch(() => {
    process.stdout.write(`${JSON.stringify({ gateVersion: GATE_VERSION, resultCode: 'GATE_FAILED', actualOutboundAttempts: 0 })}\n`);
    process.exitCode = 1;
  });
}

module.exports = { runGate, chatDiagnostics, GATE_VERSION, CONVERSATION_CONTRACT_VERSION, SYSTEM, MESSAGES, EXPECTED_REPLY };
