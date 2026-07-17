const { createOpenAiProvider } = require('./openai.provider');
const { createGeminiProvider } = require('./gemini.provider');
const { createIlmuProvider } = require('./ilmu.provider');
const { publicProviderError } = require('./aiProvider.errors');

const AI_PROVIDER_IDS = ['openai', 'gemini', 'ilmu'];
const AI_PURPOSE_IDS = [
  'cyberguard_chat',
  'agent_route_planning',
  'lightweight_tool_selection',
  'translation_assistance',
  'safety_evaluation',
];

function providerError(id) {
  return new Error(`Unknown AI provider: ${id}`);
}

function normalizedProviderId(value, fallback = 'openai') {
  const id = String(value || fallback).trim().toLowerCase() || fallback;
  if (!AI_PROVIDER_IDS.includes(id)) throw providerError(id);
  return id;
}

function modelForProvider(id, env = process.env) {
  if (id === 'gemini') return String(env.GEMINI_MODEL || 'gemini-2.5-flash').trim();
  if (id === 'ilmu') return String(env.ILMU_MODEL || 'nemo-super').trim();
  return String(env.OPENAI_MODEL || env.AI_DEFAULT_MODEL || env.AI_MODEL || 'gpt-5.4-mini').trim();
}

function providerConfig(id, env = process.env) {
  const timeoutMs = Number(env.AI_TIMEOUT_MS || 20000);
  const maxOutputTokens = Number(env.AI_MAX_OUTPUT_TOKENS || 800);
  const common = {
    model: modelForProvider(id, env),
    timeoutMs: Number.isFinite(timeoutMs) ? timeoutMs : 20000,
    maxOutputTokens: Number.isFinite(maxOutputTokens) ? maxOutputTokens : 800,
    testMockMode: env.NODE_ENV === 'test' ? String(env.AI_TEST_MOCK_PROVIDER || env.AI_TEST_MOCK_OPENAI || '').trim() : '',
  };
  if (id === 'gemini') {
    return { ...common, apiKey: String(env.GEMINI_API_KEY || '').trim() };
  }
  if (id === 'ilmu') {
    return {
      ...common,
      apiKey: String(env.ILMU_API_KEY || '').trim(),
      baseUrl: String(env.ILMU_BASE_URL || 'https://api.ilmu.ai/v1').trim(),
    };
  }
  return { ...common, apiKey: String(env.OPENAI_API_KEY || '').trim() };
}

function createProviderSelectionPolicy(env = process.env) {
  const defaultProvider = normalizedProviderId(env.AI_DEFAULT_PROVIDER || env.AI_PROVIDER || 'openai');
  const assignments = {
    cyberguard_chat: normalizedProviderId(env.AI_PROVIDER_CYBERGUARD || defaultProvider),
    agent_route_planning: normalizedProviderId(env.AI_PROVIDER_AGENT_ROUTER || defaultProvider),
    lightweight_tool_selection: normalizedProviderId(env.AI_PROVIDER_LIGHTWEIGHT || defaultProvider),
    translation_assistance: normalizedProviderId(env.AI_PROVIDER_TRANSLATION || defaultProvider),
    safety_evaluation: normalizedProviderId(env.AI_PROVIDER_SAFETY || defaultProvider),
  };
  return {
    defaultProvider,
    assignments,
    providerForPurpose(purposeId) {
      if (!AI_PURPOSE_IDS.includes(purposeId)) throw new Error(`Unknown AI purpose: ${purposeId}`);
      return assignments[purposeId] || defaultProvider;
    },
  };
}

function createProviderRegistry({ env = process.env, overrides = {} } = {}) {
  const selection = createProviderSelectionPolicy(env);
  const instances = new Map();

  function build(id) {
    if (overrides[id]) return overrides[id];
    const config = providerConfig(id, env);
    if (id === 'gemini') return createGeminiProvider(config);
    if (id === 'ilmu') return createIlmuProvider(config);
    return createOpenAiProvider(config);
  }

  function resolve(id) {
    const providerId = normalizedProviderId(id);
    if (!instances.has(providerId)) instances.set(providerId, build(providerId));
    return instances.get(providerId);
  }

  function purposesForProvider(providerId) {
    return Object.entries(selection.assignments)
      .filter(([, id]) => id === providerId)
      .map(([purpose]) => purpose);
  }

  function getSafeStatus() {
    return {
      providers: AI_PROVIDER_IDS.map(id => {
        const provider = resolve(id);
        return {
          id,
          configured: Boolean(provider.configured),
          model: provider.model || modelForProvider(id, env),
          capabilities: provider.capabilities || {},
          effectivePurposes: purposesForProvider(id),
        };
      }),
      defaultProvider: selection.defaultProvider,
      purposeAssignments: { ...selection.assignments },
    };
  }

  async function testProvider(id) {
    const provider = resolve(id);
    if (!provider.configured) {
      const error = new Error(`${id} is not configured.`);
      error.code = 'AI_PROVIDER_NOT_CONFIGURED';
      error.status = 503;
      throw error;
    }
    const result = await provider.generate({
      systemInstruction: 'Cyberly internal provider health check. Reply with OK.',
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      maxOutputTokens: 12,
      temperature: 0,
      tools: [],
      metadata: { purpose: 'admin_provider_test' },
    });
    return {
      provider: id,
      model: provider.model,
      status: 'success',
      latencyMs: Number(result.latencyMs || 0),
      textPreview: String(result.text || '').slice(0, 80),
      usage: result.usage || null,
      testedAt: new Date().toISOString(),
    };
  }

  async function safeTestProvider(id) {
    try {
      return await testProvider(id);
    } catch (error) {
      const safe = publicProviderError(error);
      return {
        provider: id,
        model: resolve(id).model,
        status: 'failed',
        code: safe.code,
        httpStatus: safe.status,
        latencyMs: null,
        testedAt: new Date().toISOString(),
      };
    }
  }

  return {
    resolve,
    getSafeStatus,
    testProvider,
    safeTestProvider,
    selection,
  };
}

module.exports = {
  AI_PROVIDER_IDS,
  AI_PURPOSE_IDS,
  createProviderRegistry,
  createProviderSelectionPolicy,
  normalizedProviderId,
  providerConfig,
};
