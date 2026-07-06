const { ERROR_CODES } = require('../errors/errorCodes');
const { normalizeLocale } = require('../i18n/locale');
const { mapConversation, mapMessage } = require('../chat/chat.mapper');
const { validatePositiveId } = require('../chat/chat.validation');
const { estimateCostUsd } = require('./ai.config');
const {
  buildCyberGuardSystemPrompt,
  createLearnerContext,
  limitConversationMessages,
} = require('./ai.prompts');
const { isUnsafeUserRequest, validateProviderOutput } = require('./ai.safety');

const minuteBuckets = new Map();
const dayBuckets = new Map();
const activeUsers = new Set();

function httpError(status, code, message, details) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  if (details) error.details = details;
  return error;
}

function invalidIdError() {
  return httpError(400, ERROR_CODES.CHAT_INVALID_ID, 'A valid conversation and message id are required.');
}

function notFoundError() {
  return httpError(404, ERROR_CODES.CHAT_CONVERSATION_NOT_FOUND, 'Chat conversation was not found.');
}

function invalidTargetError() {
  return httpError(400, ERROR_CODES.CHAT_INVALID_MESSAGE, 'Only user messages can generate assistant replies.');
}

function rateLimitError() {
  return httpError(429, ERROR_CODES.AI_RATE_LIMITED, 'AI generation limit reached. Please try again later.');
}

function configured(config) {
  return Boolean(config.openAiApiKey || config.testMockMode) && config.provider === 'openai';
}

function generationStaleCutoff(config) {
  return new Date(Date.now() - Number(config.generationStaleMs || 60000));
}

function isStaleGeneration(generation, config) {
  if (!generation || !['pending', 'in_progress'].includes(generation.status)) return false;
  if (!generation.updated_at) return false;
  return new Date(generation.updated_at).getTime() < generationStaleCutoff(config).getTime();
}

function pruneBucket(bucket, now, windowMs) {
  bucket.timestamps = bucket.timestamps.filter(value => now - value < windowMs);
}

function checkAndRecordRate(userId, config) {
  const now = Date.now();
  const minute = minuteBuckets.get(userId) || { timestamps: [] };
  const day = dayBuckets.get(userId) || { timestamps: [] };
  pruneBucket(minute, now, 60 * 1000);
  pruneBucket(day, now, 24 * 60 * 60 * 1000);

  if (minute.timestamps.length >= config.perUserMinuteLimit || day.timestamps.length >= config.perUserDailyLimit) {
    minuteBuckets.set(userId, minute);
    dayBuckets.set(userId, day);
    throw rateLimitError();
  }

  minute.timestamps.push(now);
  day.timestamps.push(now);
  minuteBuckets.set(userId, minute);
  dayBuckets.set(userId, day);
}

function mapGeneration(row) {
  if (!row) return null;
  return {
    id: row.id,
    conversationId: row.conversation_id,
    userMessageId: row.user_message_id,
    assistantMessageId: row.assistant_message_id || null,
    status: row.status,
    provider: row.provider,
    model: row.model,
    providerRequestId: row.provider_request_id || null,
    errorCode: row.error_code || null,
    inputTokens: row.input_tokens === null || row.input_tokens === undefined ? null : Number(row.input_tokens),
    outputTokens: row.output_tokens === null || row.output_tokens === undefined ? null : Number(row.output_tokens),
    estimatedCostUsd: row.estimated_cost_usd === null || row.estimated_cost_usd === undefined ? null : Number(row.estimated_cost_usd),
    durationMs: row.duration_ms === null || row.duration_ms === undefined ? null : Number(row.duration_ms),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
  };
}

function normalizeProviderFailure(error) {
  if (error?.code === ERROR_CODES.AI_TIMEOUT) return httpError(503, ERROR_CODES.AI_TIMEOUT, 'AI provider timed out.');
  if (error?.code === ERROR_CODES.AI_RATE_LIMITED) return httpError(429, ERROR_CODES.AI_RATE_LIMITED, 'AI provider is rate limited.');
  if (error?.code === ERROR_CODES.AI_NOT_CONFIGURED) return httpError(503, ERROR_CODES.AI_NOT_CONFIGURED, 'AI provider is not configured.');
  return httpError(503, ERROR_CODES.AI_PROVIDER_UNAVAILABLE, 'AI provider is unavailable.');
}

function createAiService(repository, provider, config) {
  async function loadOwnedTarget(userId, conversationIdInput, messageIdInput) {
    const conversationId = validatePositiveId(conversationIdInput);
    const messageId = validatePositiveId(messageIdInput);
    if (!conversationId || !messageId) throw invalidIdError();

    const conversation = await repository.findConversationForUser(userId, conversationId);
    if (!conversation) throw notFoundError();
    const userMessage = await repository.findMessage(conversationId, messageId);
    if (!userMessage) throw notFoundError();
    if (userMessage.role !== 'user') throw invalidTargetError();
    return { conversationId, messageId, conversation, userMessage };
  }

  async function completedResponse(userId, generation, userMessage) {
    const assistantMessage = await repository.findAssistantMessage(generation.assistant_message_id);
    const conversation = await repository.findConversationForUser(userId, generation.conversation_id);
    return {
      statusCode: 200,
      body: {
        conversation: mapConversation(conversation),
        userMessage: mapMessage(userMessage),
        assistantMessage: mapMessage(assistantMessage),
        generation: mapGeneration(generation),
      },
    };
  }

  async function generateReply(userId, conversationIdInput, messageIdInput, input = {}) {
    const target = await loadOwnedTarget(userId, conversationIdInput, messageIdInput);
    if (!configured(config)) {
      throw httpError(503, ERROR_CODES.AI_NOT_CONFIGURED, 'AI provider is not configured.');
    }

    let generation = await repository.createGeneration(target.conversationId, target.messageId, config.provider, config.model);
    if (generation.status === 'completed') {
      return completedResponse(userId, generation, target.userMessage);
    }
    if (generation.status === 'in_progress' && !isStaleGeneration(generation, config)) {
      throw httpError(409, ERROR_CODES.AI_GENERATION_IN_PROGRESS, 'AI generation is already in progress.');
    }

    if (isUnsafeUserRequest(target.userMessage.content)) {
      generation = await repository.markGenerationFailed(generation.id, ERROR_CODES.AI_UNSAFE_REQUEST, 0);
      throw httpError(400, ERROR_CODES.AI_UNSAFE_REQUEST, 'This request cannot be answered safely.', { generation: mapGeneration(generation) });
    }

    if (activeUsers.has(userId)) {
      throw httpError(409, ERROR_CODES.AI_GENERATION_IN_PROGRESS, 'AI generation is already in progress.');
    }
    activeUsers.add(userId);
    let userLockAcquired = true;

    if (await repository.countInProgressForUser(userId, generationStaleCutoff(config)) > 0) {
      activeUsers.delete(userId);
      userLockAcquired = false;
      throw httpError(409, ERROR_CODES.AI_GENERATION_IN_PROGRESS, 'AI generation is already in progress.');
    }

    if (config.dailyBudgetUsd !== null) {
      const spent = await repository.sumEstimatedCostToday();
      if (spent >= config.dailyBudgetUsd) {
        activeUsers.delete(userId);
        userLockAcquired = false;
        throw rateLimitError();
      }
    }

    try {
      checkAndRecordRate(userId, config);
    } catch (error) {
      activeUsers.delete(userId);
      userLockAcquired = false;
      throw error;
    }
    const startedAt = Date.now();

    try {
      generation = await repository.markGenerationInProgress(generation.id);
      const locale = normalizeLocale(input.locale || target.conversation.locale);
      const learnerContext = createLearnerContext(locale);
      const allMessages = await repository.listLatestMessages(
        target.conversationId,
        config.contextMessageLimit
      );
      const messages = limitConversationMessages(
        allMessages,
        config.contextMessageLimit,
        config.contextCharacterLimit
      );

      const providerResult = await provider.generateReply({
        systemPrompt: buildCyberGuardSystemPrompt(),
        learnerContext,
        messages,
      });
      const validation = validateProviderOutput(providerResult.content);
      const durationMs = Date.now() - startedAt;
      if (!validation.ok) {
        await repository.markGenerationFailed(generation.id, ERROR_CODES.AI_INVALID_RESPONSE, durationMs);
        throw httpError(503, ERROR_CODES.AI_INVALID_RESPONSE, 'AI provider returned an invalid response.');
      }

      const usage = {
        providerRequestId: providerResult.providerRequestId || null,
        inputTokens: Number(providerResult.inputTokens || 0),
        outputTokens: Number(providerResult.outputTokens || 0),
        estimatedCostUsd: estimateCostUsd({
          inputTokens: providerResult.inputTokens,
          outputTokens: providerResult.outputTokens,
        }, config),
        durationMs,
      };

      let completed;
      try {
        completed = await repository.withTransaction(connection =>
          repository.completeGeneration(userId, generation, { content: validation.content, locale }, usage, connection)
        );
      } catch (error) {
        await repository.markGenerationFailed(generation.id, ERROR_CODES.AI_ASSISTANT_PERSISTENCE_FAILED, durationMs);
        throw httpError(503, ERROR_CODES.AI_ASSISTANT_PERSISTENCE_FAILED, 'Assistant reply could not be saved.');
      }

      return {
        statusCode: 201,
        body: {
          conversation: mapConversation(completed.conversation),
          userMessage: mapMessage(target.userMessage),
          assistantMessage: mapMessage(completed.assistantMessage),
          generation: mapGeneration(completed.generation),
        },
      };
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      if (error.code && error.status && error.code.startsWith('AI_')) {
        if (![ERROR_CODES.AI_INVALID_RESPONSE, ERROR_CODES.AI_ASSISTANT_PERSISTENCE_FAILED].includes(error.code)) {
          await repository.markGenerationFailed(generation.id, error.code, durationMs).catch(() => {});
        }
        throw error;
      }
      const normalized = normalizeProviderFailure(error);
      await repository.markGenerationFailed(generation.id, normalized.code, durationMs).catch(() => {});
      throw normalized;
    } finally {
      if (userLockAcquired) activeUsers.delete(userId);
    }
  }

  return {
    generateReply,
  };
}

module.exports = {
  createAiService,
};
