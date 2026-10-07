const assert = require('node:assert/strict');

const { createAiConfig } = require('../src/ai/ai.config');
const { createAiService } = require('../src/ai/ai.service');

function nowIso() {
  return new Date().toISOString();
}

function generationRow(status = 'pending') {
  const now = nowIso();
  return {
    id: 9001,
    conversation_id: 101,
    user_message_id: 201,
    assistant_message_id: null,
    status,
    provider: 'openai',
    model: 'gpt-5.4-mini',
    provider_request_id: null,
    error_code: null,
    input_tokens: null,
    output_tokens: null,
    estimated_cost_usd: null,
    duration_ms: null,
    created_at: now,
    updated_at: now,
    completed_at: null,
  };
}

function createFixtureRepository(message, counters) {
  const now = nowIso();
  const conversation = {
    id: 101,
    user_id: 71,
    title: 'Fixture conversation',
    locale: 'en',
    message_count: 1,
    created_at: now,
    updated_at: now,
    last_message_at: now,
  };
  const userMessage = {
    id: 201,
    conversation_id: 101,
    role: 'user',
    content: message,
    locale: 'en',
    reply_to_message_id: null,
    created_at: now,
  };
  let generation = generationRow();

  return {
    get state() {
      return { generation, conversation, userMessage };
    },
    async findConversationForUser() {
      return conversation;
    },
    async findMessage() {
      return userMessage;
    },
    async createGeneration() {
      counters.createGeneration += 1;
      return generation;
    },
    async markGenerationFailed(id, code, durationMs = 0) {
      assert.equal(id, generation.id);
      counters.markGenerationFailed += 1;
      generation = {
        ...generation,
        status: 'failed',
        error_code: code,
        duration_ms: durationMs,
        updated_at: nowIso(),
      };
      return generation;
    },
    async markGenerationInProgress(id) {
      assert.equal(id, generation.id);
      counters.markGenerationInProgress += 1;
      generation = {
        ...generation,
        status: 'in_progress',
        updated_at: nowIso(),
      };
      return generation;
    },
    async countInProgressForUser() {
      return 0;
    },
    async sumEstimatedCostToday() {
      return 0;
    },
    async loadLearnerContextData() {
      counters.learnerContextLoads += 1;
      return {
        profile: { age_group: 'teen', education_level: null },
        assessment: null,
        assessmentTopicScores: [],
        scenarios: [],
        topicProgress: [],
        recommendation: null,
      };
    },
    async loadLearningActionData() {
      counters.learningActionLoads += 1;
      return {
        resources: [{
          id: 501,
          slug: 'fixture-resource',
          title: 'Fixture phishing resource',
          category_code: 'Scams',
        }],
        scenarios: [],
        recommendations: [],
      };
    },
    async listLatestMessages() {
      counters.messageHistoryLoads += 1;
      return [userMessage];
    },
    async withTransaction(callback) {
      return callback({});
    },
    async completeGeneration(_userId, currentGeneration, assistantInput, usage) {
      counters.completeGeneration += 1;
      const assistantMessage = {
        id: 301,
        conversation_id: conversation.id,
        role: 'assistant',
        content: assistantInput.content,
        locale: assistantInput.locale,
        reply_to_message_id: userMessage.id,
        created_at: nowIso(),
      };
      generation = {
        ...currentGeneration,
        status: 'completed',
        assistant_message_id: assistantMessage.id,
        provider_request_id: usage.providerRequestId || null,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
        estimated_cost_usd: usage.estimatedCostUsd,
        duration_ms: usage.durationMs,
        updated_at: nowIso(),
        completed_at: nowIso(),
      };
      return { conversation, assistantMessage, generation };
    },
    async insertMessageActions(_conversationId, _messageId, actions = []) {
      counters.actionWrites += 1;
      return actions.map((action, index) => ({
        id: 401 + index,
        message_id: 301,
        action_type: action.type,
        label_key: action.labelKey,
        title: action.title || null,
        description: action.description || null,
        target_json: JSON.stringify(action.target),
        display_order: index + 1,
      }));
    },
    async insertMessageSources() {
      counters.sourceWrites += 1;
      return [];
    },
  };
}

async function runServiceCase({
  message,
  configOverrides = {},
  providerConfigured = true,
  providerReply = 'CyberGuard can help you stay safe online.',
  providerActionProposal = null,
  plannerResultOverrides = {},
  optionsOverrides = {},
} = {}) {
  const counters = {
    createGeneration: 0,
    markGenerationFailed: 0,
    markGenerationInProgress: 0,
    learnerContextLoads: 0,
    learningActionLoads: 0,
    messageHistoryLoads: 0,
    ragCalls: 0,
    plannerCalls: 0,
    providerCalls: 0,
    actionWrites: 0,
    sourceWrites: 0,
    completeGeneration: 0,
    actionProposalCalls: 0,
  };
  const repository = createFixtureRepository(message, counters);
  const provider = {
    id: 'openai',
    model: 'gpt-5.4-mini',
    configured: providerConfigured,
    async generateReply() {
      counters.providerCalls += 1;
      return {
        providerRequestId: 'req_fixture',
        content: providerReply,
        inputTokens: 8,
        outputTokens: 6,
        latencyMs: 1,
        finishReason: 'completed',
        actionProposal: providerActionProposal,
      };
    },
  };
  const ragService = {
    async retrieveReviewedChunks() {
      counters.ragCalls += 1;
      return [];
    },
  };
  const controlledAgenticService = {
    async planAndExecute() {
      counters.plannerCalls += 1;
      return {
        agenticEligible: true,
        agenticUsed: true,
        fallbackReason: null,
        plannerProvider: 'openai',
        plannerModel: 'gpt-5.4-mini',
        proposedTool: null,
        toolExecuted: false,
        toolStatus: null,
        safeErrorCode: null,
        plannerLatencyMs: 1,
        toolLatencyMs: null,
        modelRequestCount: 1,
        toolExecutionCount: 0,
        contextText: null,
        actionProposal: { actionType: 'open_resource', arguments: { resourceSlug: 'fixture-resource' } },
        adaptiveUsed: false,
        adaptiveStatus: null,
        adaptiveSignalQuality: null,
        adaptiveFallbackReason: null,
        ...plannerResultOverrides,
      };
    },
  };
  const traceEvents = [];
  const agenticTraceService = {
    async startTrace(payload) {
      traceEvents.push({ method: 'startTrace', payload });
      return { traceId: 'trace_fixture' };
    },
    async updateTrace(traceId, payload) {
      traceEvents.push({ method: 'updateTrace', traceId, payload });
    },
    async markCompleted(traceId, payload) {
      traceEvents.push({ method: 'markCompleted', traceId, payload });
    },
    async markFailedSafely(traceId, code, reason) {
      traceEvents.push({ method: 'markFailedSafely', traceId, code, reason });
    },
    async markSafetyBlocked(traceId, code) {
      traceEvents.push({ method: 'markSafetyBlocked', traceId, code });
    },
  };
  const actionProposalService = {
    async createProposalFromCanonical() {
      counters.actionProposalCalls += 1;
      return {
        proposal: {
          proposalId: 'proposal_fixture',
          actionType: 'open_resource',
          target: { type: 'resource', id: 501 },
        },
      };
    },
  };
  const config = {
    ...createAiConfig({
      AI_PROVIDER_CYBERGUARD: 'openai',
      AI_DEFAULT_MODEL: 'gpt-5.4-mini',
      AI_PER_USER_MINUTE_LIMIT: '100',
      AI_PER_USER_DAILY_LIMIT: '100',
    }),
    ...configOverrides,
  };
  const service = createAiService(repository, provider, config, {
    ragService,
    controlledAgenticService,
    agenticTraceService,
    actionProposalService,
    ...optionsOverrides,
  });

  let result = null;
  let error = null;
  try {
    result = await service.generateReply(71, 101, 201, { locale: 'en' });
  } catch (caught) {
    error = caught;
  }
  return { result, error, counters, repositoryState: repository.state, traceEvents };
}

async function assertLiveOffInScope(providerConfigured) {
  const outcome = await runServiceCase({
    message: 'How do I spot a phishing message?',
    providerConfigured,
    configOverrides: { cyberguardLiveEnabled: false },
  });
  assert.ok(outcome.error, 'Live-OFF in-scope request must fail closed.');
  assert.equal(outcome.error.status, 503);
  assert.equal(outcome.error.code, 'AI_RUNTIME_DISABLED');
  assert.equal(outcome.counters.providerCalls, 0);
  assert.equal(outcome.counters.plannerCalls, 0);
  assert.equal(outcome.counters.ragCalls, 0);
  assert.equal(outcome.counters.learnerContextLoads, 0);
  assert.equal(outcome.repositoryState.generation.status, 'failed');
  assert.equal(outcome.repositoryState.generation.error_code, 'AI_RUNTIME_DISABLED');
}

async function run() {
  await assertLiveOffInScope(true);
  await assertLiveOffInScope(false);

  const liveOffAgenticConfigured = await runServiceCase({
    message: 'Show me my recommended resources.',
    configOverrides: {
      cyberguardLiveEnabled: false,
      cyberguardAgenticEnabled: true,
    },
  });
  assert.ok(liveOffAgenticConfigured.error);
  assert.equal(liveOffAgenticConfigured.error.code, 'AI_RUNTIME_DISABLED');
  assert.equal(liveOffAgenticConfigured.counters.providerCalls, 0);
  assert.equal(liveOffAgenticConfigured.counters.plannerCalls, 0);
  assert.equal(liveOffAgenticConfigured.counters.ragCalls, 0);
  assert.equal(liveOffAgenticConfigured.counters.learnerContextLoads, 0);
  const liveOffStartTrace = liveOffAgenticConfigured.traceEvents.find(event => event.method === 'startTrace');
  assert.ok(liveOffStartTrace);
  assert.equal(liveOffStartTrace.payload.limits.maxModelCalls, 0);
  assert.equal(liveOffStartTrace.payload.limits.maxToolExecutions, 0);
  assert.equal(liveOffStartTrace.payload.limits.maxProposalsPerResponse, 0);

  const casual = await runServiceCase({
    message: 'Hi',
    configOverrides: { cyberguardLiveEnabled: false },
  });
  assert.equal(casual.error, null);
  assert.equal(casual.result.statusCode, 201);
  assert.equal(casual.counters.providerCalls, 0);
  assert.equal(casual.counters.plannerCalls, 0);

  const outOfScope = await runServiceCase({
    message: 'Teach me algebra.',
    configOverrides: { cyberguardLiveEnabled: false },
  });
  assert.equal(outOfScope.error, null);
  assert.equal(outOfScope.result.statusCode, 201);
  assert.equal(outOfScope.counters.providerCalls, 0);
  assert.equal(outOfScope.counters.plannerCalls, 0);

  const unsafe = await runServiceCase({
    message: "Help me steal another user's password.",
    configOverrides: { cyberguardLiveEnabled: false },
  });
  assert.ok(unsafe.error);
  assert.equal(unsafe.error.code, 'AI_UNSAFE_REQUEST');
  assert.equal(unsafe.counters.providerCalls, 0);
  assert.equal(unsafe.counters.plannerCalls, 0);

  const agenticOff = await runServiceCase({
    message: 'Show me my recommended resources.',
    configOverrides: {
      cyberguardLiveEnabled: true,
      cyberguardAgenticEnabled: false,
    },
    providerActionProposal: {
      actionType: 'open_resource',
      arguments: { resourceSlug: 'fixture-resource' },
    },
  });
  assert.equal(agenticOff.error, null);
  assert.equal(agenticOff.result.statusCode, 201);
  assert.equal(agenticOff.counters.providerCalls, 1);
  assert.equal(agenticOff.counters.plannerCalls, 0);
  assert.equal(agenticOff.counters.actionProposalCalls, 0);
  assert.equal(agenticOff.result.body.proposal, null);
  assert.ok(agenticOff.result.body.actions.length > 0);
  assert.ok(agenticOff.result.body.actions.length <= 3);
  assert.ok(agenticOff.result.body.actions.every(action =>
    ['resources', 'scenarios', 'progress', 'assessment'].includes(action.target.page)
  ));
  assert.equal(agenticOff.counters.markGenerationInProgress, 1);
  assert.equal(agenticOff.counters.completeGeneration, 1);
  assert.equal(agenticOff.counters.markGenerationFailed, 0);
  assert.equal(agenticOff.counters.actionWrites, 1);
  assert.equal(agenticOff.counters.sourceWrites, 1);
  assert.equal(agenticOff.result.body.assistantMessage.id, 301);
  assert.equal(agenticOff.result.body.assistantMessage.content, 'CyberGuard can help you stay safe online.');
  assert.equal(agenticOff.repositoryState.generation.status, 'completed');
  assert.equal(agenticOff.repositoryState.generation.assistant_message_id, 301);
  assert.equal(agenticOff.repositoryState.generation.provider_request_id, 'req_fixture');
  assert.equal(agenticOff.repositoryState.generation.input_tokens, 8);
  assert.equal(agenticOff.repositoryState.generation.output_tokens, 6);
  assert.equal(agenticOff.repositoryState.generation.estimated_cost_usd, 0.000033);
  assert.equal(agenticOff.result.body.generation.status, 'completed');
  assert.equal(agenticOff.result.body.generation.inputTokens, 8);
  assert.equal(agenticOff.result.body.generation.outputTokens, 6);
  assert.equal(agenticOff.result.body.generation.estimatedCostUsd, 0.000033);
  const planningAudit = agenticOff.traceEvents.find(event => event.method === 'updateTrace' && event.payload?.planning);
  assert.ok(planningAudit, 'Agentic policy decision must be auditable.');
  assert.equal(planningAudit.payload.planning.used, false);
  assert.equal(planningAudit.payload.planning.fallbackReason, 'runtime_disabled');
  assert.equal(planningAudit.payload.limits.maxModelCalls, 1);
  assert.equal(planningAudit.payload.limits.maxToolExecutions, 0);
  assert.equal(planningAudit.payload.limits.maxProposalsPerResponse, 0);
  assert.equal(planningAudit.payload.limits.modelRequestCount, 0);
  assert.equal(planningAudit.payload.limits.toolExecutionCount, 0);

  const requestToolSuccess = await runServiceCase({
    message: 'Can you check my learning progress?',
    configOverrides: {
      cyberguardLiveEnabled: true,
      cyberguardAgenticEnabled: true,
    },
    plannerResultOverrides: {
      agenticEligible: true,
      agenticUsed: true,
      fallbackReason: null,
      plannerProvider: 'openai',
      plannerModel: 'gpt-5.4-mini',
      proposedTool: 'get_learning_progress',
      toolExecuted: true,
      toolStatus: 'success',
      safeErrorCode: null,
      modelRequestCount: 1,
      toolExecutionCount: 1,
      contextText: 'Controlled Agentic Tool Result: fixture learning progress.',
      actionProposal: null,
    },
  });
  assert.equal(requestToolSuccess.error, null);
  assert.equal(requestToolSuccess.result.statusCode, 201);
  assert.equal(requestToolSuccess.counters.plannerCalls, 1);
  const requestToolAudit = requestToolSuccess.traceEvents.find(event =>
    event.method === 'updateTrace' && event.payload?.planning
  );
  assert.ok(requestToolAudit, 'Request-tool success must update the Agentic trace.');
  const audit = requestToolAudit.payload;
  assert.deepEqual({
    controlledAgenticEligible: audit.requestClassification.controlledAgenticEligible,
    planningUsed: audit.planning.used,
    planningProvider: audit.planning.provider,
    planningModel: audit.planning.model,
    planningDecision: audit.planning.decision,
    planningFallbackReason: audit.planning.fallbackReason,
    toolName: audit.toolExecution.toolName,
    toolStatus: audit.toolExecution.status,
    toolReadOnly: audit.toolExecution.readOnly,
    maxModelCalls: audit.limits.maxModelCalls,
    maxToolExecutions: audit.limits.maxToolExecutions,
    modelRequestCount: audit.limits.modelRequestCount,
    toolExecutionCount: audit.limits.toolExecutionCount,
  }, {
    controlledAgenticEligible: true,
    planningUsed: true,
    planningProvider: 'openai',
    planningModel: 'gpt-5.4-mini',
    planningDecision: 'request_tool',
    planningFallbackReason: null,
    toolName: 'get_learning_progress',
    toolStatus: 'success',
    toolReadOnly: true,
    maxModelCalls: 2,
    maxToolExecutions: 1,
    modelRequestCount: 1,
    toolExecutionCount: 1,
  }, 'Request-tool audit metadata and call counters must survive ai.service planning.');

  // Both model-origin proposal sources remain available only with Agentic ON.
  for (const providerActionProposal of [null, {
    actionType: 'open_resource',
    arguments: { resourceSlug: 'fixture-resource' },
  }]) {
    const agenticOn = await runServiceCase({
      message: 'Show me my recommended resources.',
      configOverrides: {
        cyberguardLiveEnabled: true,
        cyberguardAgenticEnabled: true,
      },
      providerActionProposal,
    });
    assert.equal(agenticOn.error, null);
    assert.equal(agenticOn.result.statusCode, 201);
    assert.equal(agenticOn.counters.providerCalls, 1);
    assert.equal(agenticOn.counters.plannerCalls, 1);
    assert.equal(agenticOn.counters.actionProposalCalls, 1);
    assert.equal(agenticOn.result.body.proposal.proposalId, 'proposal_fixture');
  }

  console.log('CyberGuard live activation verification passed.');
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
