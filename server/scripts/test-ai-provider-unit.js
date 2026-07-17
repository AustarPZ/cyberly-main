const assert = require('node:assert/strict');

const {
  AI_PROVIDER_IDS,
  createProviderRegistry,
  createProviderSelectionPolicy,
} = require('../src/ai/providers/aiProvider.registry');
const {
  createProviderError,
  normalizeProviderError,
} = require('../src/ai/providers/aiProvider.errors');
const {
  normalizeToolDeclarations,
  normalizeReturnedToolCalls,
} = require('../src/ai/providers/aiProvider.tools');
const { buildResponsesInput } = require('../src/ai/providers/openai.provider');
const { buildGeminiContents } = require('../src/ai/providers/gemini.provider');
const { createIlmuProvider } = require('../src/ai/providers/ilmu.provider');

function assertNoSecrets(value) {
  const text = JSON.stringify(value);
  for (const secret of ['sk-test-openai', 'gemini-secret', 'ilmu-secret', 'Authorization', 'Bearer ']) {
    assert.equal(text.includes(secret), false, `serialized status should not contain ${secret}`);
  }
}

async function run() {
  assert.deepEqual(AI_PROVIDER_IDS, ['openai', 'gemini', 'ilmu']);

  const registry = createProviderRegistry({
    env: {
      NODE_ENV: 'test',
      OPENAI_API_KEY: 'sk-test-openai',
      OPENAI_MODEL: 'gpt-test',
      GEMINI_API_KEY: 'gemini-secret',
      GEMINI_MODEL: 'gemini-test',
      ILMU_API_KEY: 'ilmu-secret',
      ILMU_BASE_URL: 'https://ilmu.example.test/v1',
      ILMU_MODEL: 'nemo-test',
      AI_DEFAULT_PROVIDER: 'openai',
      AI_PROVIDER_CYBERGUARD: 'gemini',
      AI_PROVIDER_AGENT_ROUTER: 'ilmu',
      AI_PROVIDER_LIGHTWEIGHT: 'openai',
      AI_TEST_MOCK_PROVIDER: 'success',
    },
  });

  assert.equal(registry.resolve('openai').id, 'openai');
  assert.equal(registry.resolve('gemini').id, 'gemini');
  assert.equal(registry.resolve('ilmu').id, 'ilmu');
  assert.throws(() => registry.resolve('unknown'), /Unknown AI provider/);

  const status = registry.getSafeStatus();
  assert.equal(status.defaultProvider, 'openai');
  assert.equal(status.purposeAssignments.cyberguard_chat, 'gemini');
  assert.equal(status.purposeAssignments.agent_route_planning, 'ilmu');
  assert.equal(status.providers.find(provider => provider.id === 'gemini').configured, true);
  assertNoSecrets(status);

  const missing = createProviderRegistry({ env: { NODE_ENV: 'test' } }).getSafeStatus();
  assert.equal(missing.providers.find(provider => provider.id === 'gemini').configured, false);

  assert.deepEqual(buildResponsesInput([
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' },
  ]), [
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' },
  ]);

  assert.deepEqual(buildGeminiContents([
    { role: 'user', content: 'hello' },
    { role: 'assistant', content: 'hi' },
  ]), [
    { role: 'user', parts: [{ text: 'hello' }] },
    { role: 'model', parts: [{ text: 'hi' }] },
  ]);

  const ilmuRequests = [];
  const ilmu = createIlmuProvider({
    apiKey: 'ilmu-secret',
    baseUrl: 'https://ilmu.example.test/v1/',
    model: 'nemo-test',
    fetchImpl: async (url, options) => {
      ilmuRequests.push({ url, options });
      return {
        ok: true,
        status: 200,
        headers: { get: key => key.toLowerCase() === 'x-request-id' ? 'req-ilmu' : null },
        json: async () => ({
          id: 'chatcmpl-ilmu',
          choices: [{ finish_reason: 'stop', message: { content: 'OK' } }],
          usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
        }),
      };
    },
  });
  const ilmuResult = await ilmu.generate({
    systemInstruction: 'system',
    messages: [{ role: 'user', content: 'ping' }],
    maxOutputTokens: 8,
  });
  assert.equal(ilmuRequests[0].url, 'https://ilmu.example.test/v1/chat/completions');
  assert.equal(JSON.parse(ilmuRequests[0].options.body).model, 'nemo-test');
  assert.equal(ilmuResult.provider, 'ilmu');
  assert.equal(ilmuResult.text, 'OK');
  assert.equal(ilmuResult.usage.totalTokens, 5);

  const canonicalTools = normalizeToolDeclarations([
    {
      name: 'get_learner_context',
      description: 'Read learner context.',
      inputSchema: { type: 'object', properties: { locale: { type: 'string' } } },
      riskLevel: 'low',
      mode: 'read',
      allowedRoles: ['backend'],
    },
  ]);
  assert.equal(canonicalTools[0].name, 'get_learner_context');
  assert.equal(canonicalTools[0].mode, 'read');
  assert.throws(() => normalizeToolDeclarations([{ name: 'execute_sql', inputSchema: {} }]), /Invalid tool/);

  const calls = normalizeReturnedToolCalls('gemini', [
    { id: 'call-1', name: 'get_learner_context', args: { locale: 'en' } },
  ]);
  assert.deepEqual(calls, [{ callId: 'call-1', toolName: 'get_learner_context', arguments: { locale: 'en' }, provider: 'gemini' }]);

  assert.equal(normalizeProviderError(createProviderError('AI_RATE_LIMITED', 'limited', 429)).code, 'AI_RATE_LIMITED');
  assert.equal(normalizeProviderError({ name: 'AbortError' }).code, 'AI_PROVIDER_TIMEOUT');
  assert.equal(normalizeProviderError({ status: 401 }).code, 'AI_AUTH_FAILED');
  assert.equal(normalizeProviderError({ status: 429 }).code, 'AI_RATE_LIMITED');
  assert.equal(normalizeProviderError({ status: 400, message: 'context length' }).code, 'AI_CONTEXT_LIMIT');

  const selection = createProviderSelectionPolicy({ AI_DEFAULT_PROVIDER: 'openai', AI_PROVIDER_CYBERGUARD: 'gemini' });
  assert.equal(selection.providerForPurpose('cyberguard_chat'), 'gemini');
  assert.equal(selection.providerForPurpose('translation_assistance'), 'openai');
  assert.throws(() => selection.providerForPurpose('made_up'), /Unknown AI purpose/);
  assert.throws(() => createProviderSelectionPolicy({ AI_DEFAULT_PROVIDER: 'made_up' }), /Unknown AI provider/);

  console.log('AI provider unit verification passed.');
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
