const OpenAI = require('openai');
const { ERROR_CODES } = require('../errors/errorCodes');

let mockFailOnceUsed = false;

function providerError(code, message, status = 503) {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  return error;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function buildResponsesInstructions(systemPrompt, learnerContext) {
  return `${systemPrompt}\n\nLearner context: ${JSON.stringify(learnerContext)}`;
}

function buildResponsesInput(messages) {
  return messages.map(message => ({
    role: message.role === 'assistant' ? 'assistant' : 'user',
    content: message.content,
  }));
}

function usageFromResponse(response) {
  const usage = response?.usage || {};
  return {
    inputTokens: usage.input_tokens || usage.prompt_tokens || 0,
    outputTokens: usage.output_tokens || usage.completion_tokens || 0,
  };
}

function normalizeProviderError(error) {
  if (error?.name === 'AbortError' || error?.code === ERROR_CODES.AI_TIMEOUT) {
    return providerError(ERROR_CODES.AI_TIMEOUT, 'The AI provider timed out.', 503);
  }
  const status = Number(error?.status || error?.response?.status || 0);
  if (status === 429) return providerError(ERROR_CODES.AI_RATE_LIMITED, 'The AI provider is rate limited.', 429);
  return providerError(ERROR_CODES.AI_PROVIDER_UNAVAILABLE, 'The AI provider is unavailable.', 503);
}

async function mockGenerate(config, request) {
  const mode = config.testMockMode;
  if (mode === 'timeout') throw providerError(ERROR_CODES.AI_TIMEOUT, 'Mock timeout.', 503);
  if (mode === 'rate-limit') throw providerError(ERROR_CODES.AI_RATE_LIMITED, 'Mock rate limit.', 429);
  if (mode === 'provider-error') throw providerError(ERROR_CODES.AI_PROVIDER_UNAVAILABLE, 'Mock provider error.', 503);
  if (mode === 'empty') {
    return { providerRequestId: 'mock-empty', content: '', inputTokens: 12, outputTokens: 0 };
  }
  if (mode === 'unsafe-output') {
    return { providerRequestId: 'mock-unsafe', content: 'Send me your password and OTP.', inputTokens: 12, outputTokens: 8 };
  }
  if (mode === 'delay') await delay(500);
  if (mode === 'fail-once' && !mockFailOnceUsed) {
    mockFailOnceUsed = true;
    throw providerError(ERROR_CODES.AI_PROVIDER_UNAVAILABLE, 'Mock fail once.', 503);
  }
  if (mode === 'context') {
    const chars = request.messages.reduce((sum, message) => sum + String(message.content || '').length, 0);
    const learnerKeys = Object.keys(request.learnerContext).sort().join(',');
    return {
      providerRequestId: 'mock-context',
      content: `locale=${request.learnerContext.locale} ageBand=${request.learnerContext.ageBand} learnerKeys=${learnerKeys} messageCount=${request.messages.length} chars=${chars}`,
      inputTokens: 100,
      outputTokens: 25,
    };
  }
  return {
    providerRequestId: 'mock-success',
    content: 'CyberGuard can help you learn this safely. Check the sender, links, urgency, and requests for secrets before you act.',
    inputTokens: 120,
    outputTokens: 36,
  };
}

function createAiProvider(config) {
  const client = config.openAiApiKey
    ? new OpenAI({ apiKey: config.openAiApiKey })
    : null;

  async function generateReply(request) {
    if (config.testMockMode) return mockGenerate(config, request);
    if (!client) throw providerError(ERROR_CODES.AI_NOT_CONFIGURED, 'AI provider is not configured.', 503);
    if (config.provider !== 'openai') throw providerError(ERROR_CODES.AI_NOT_CONFIGURED, 'AI provider is not configured.', 503);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);
    try {
      const response = await client.responses.create({
        model: config.model,
        instructions: buildResponsesInstructions(request.systemPrompt, request.learnerContext),
        input: buildResponsesInput(request.messages),
        max_output_tokens: config.maxOutputTokens,
        store: false,
      }, { signal: controller.signal });
      const usage = usageFromResponse(response);
      return {
        providerRequestId: response.id || null,
        content: response.output_text || '',
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      };
    } catch (error) {
      throw normalizeProviderError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  return {
    generateReply,
  };
}

module.exports = {
  createAiProvider,
};
