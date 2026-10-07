const assert = require('node:assert/strict');

// Install transport tripwires before loading production code. All ILMU requests
// use injected fetch; a future accidental real transport fails this suite.
let networkAttempts = 0;
const restorations = [];
function blockTransport(target, key) {
  const original = target[key];
  target[key] = () => {
    networkAttempts += 1;
    throw new Error('Real network is prohibited in tool normalization tests.');
  };
  restorations.push(() => { target[key] = original; });
}
blockTransport(globalThis, 'fetch');
for (const moduleName of ['node:http', 'node:https']) {
  const transport = require(moduleName);
  blockTransport(transport, 'request');
  blockTransport(transport, 'get');
}
blockTransport(require('node:net').Socket.prototype, 'connect');
blockTransport(require('node:tls'), 'connect');

const {
  PROHIBITED_TOOL_NAMES,
  normalizeReturnedToolCalls,
  toOpenAiTools,
  toChatCompletionsTools,
  toGeminiTools,
} = require('../src/ai/providers/aiProvider.tools');
const { createIlmuProvider } = require('../src/ai/providers/ilmu.provider');

const tests = [];
function test(name, run) { tests.push({ name, run }); }

const tools = [{
  name: 'search_published_resources',
  description: 'Search reviewed resources.',
  inputSchema: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
    additionalProperties: false,
  },
  riskLevel: 'low',
  mode: 'read',
  allowedRoles: ['backend'],
}];
const expectedResponsesTools = [{
  type: 'function',
  name: 'search_published_resources',
  description: 'Search reviewed resources.',
  parameters: {
    type: 'object',
    properties: { query: { type: 'string' } },
    required: ['query'],
    additionalProperties: false,
  },
}];
const expectedChatTools = [{
  type: 'function',
  function: {
    name: 'search_published_resources',
    description: 'Search reviewed resources.',
    parameters: {
      type: 'object',
      properties: { query: { type: 'string' } },
      required: ['query'],
      additionalProperties: false,
    },
  },
}];

test('OpenAI raw Responses call preserves call_id and parses JSON arguments', () => {
  assert.deepEqual(normalizeReturnedToolCalls('openai', [{
    type: 'function_call', id: 'fc_item_1', call_id: 'call_real_1',
    name: 'search_published_resources', arguments: '{"query":"phishing"}',
  }]), [{
    callId: 'call_real_1', toolName: 'search_published_resources',
    arguments: { query: 'phishing' }, provider: 'openai',
  }]);
});

for (const provider of ['openai', 'gemini', 'ilmu']) {
  test(`${provider}: existing callId wins over call_id and id`, () => {
    const [call] = normalizeReturnedToolCalls(provider, [{
      callId: 'canonical-1', call_id: 'wire-1', id: 'item-1',
      toolName: 'get_learning_progress', arguments: {},
    }]);
    assert.equal(call.callId, 'canonical-1');
  });
  test(`${provider}: fallback to id when call_id is absent`, () => {
    const [call] = normalizeReturnedToolCalls(provider, [{ id: 'item-1', name: 'get_learning_progress', args: {} }]);
    assert.equal(call.callId, 'item-1');
  });
  test(`${provider}: missing IDs have deterministic original-index fallbacks`, () => {
    const input = [{ name: 'get_learning_progress', args: {} }, { name: 'get_current_recommendations', args: {} }];
    const result = normalizeReturnedToolCalls(provider, input);
    assert.deepEqual(result.map(call => call.callId), [`${provider}-tool-call-1`, `${provider}-tool-call-2`]);
    assert.deepEqual(normalizeReturnedToolCalls(provider, input), result);
  });
  test(`${provider}: tool names are trimmed`, () => {
    const [call] = normalizeReturnedToolCalls(provider, [{ name: '  get_learning_progress\n', args: {} }]);
    assert.equal(call.toolName, 'get_learning_progress');
  });
  test(`${provider}: direct object args preserve identity and nested semantics`, () => {
    const args = Object.freeze({ query: 'phishing', filters: { tags: ['safe'], enabled: false, count: 0, optional: null } });
    const [call] = normalizeReturnedToolCalls(provider, [{ name: 'search_published_resources', args }]);
    assert.strictEqual(call.arguments, args);
    assert.equal(Object.getPrototypeOf(call.arguments), Object.prototype);
    assert.deepEqual(call.arguments, { query: 'phishing', filters: { tags: ['safe'], enabled: false, count: 0, optional: null } });
  });
}

for (const [label, input] of [
  ['canonical arguments', { toolName: 'search_published_resources', arguments: '{"query":"phishing"}' }],
  ['Gemini args', { name: 'search_published_resources', args: '{"query":"phishing"}' }],
  ['Chat Completions function.arguments', { function: { name: 'search_published_resources', arguments: '{"query":"phishing"}' } }],
]) {
  test(`JSON object text from ${label} becomes a plain object`, () => {
    const [call] = normalizeReturnedToolCalls('ilmu', [input]);
    assert.deepEqual(call.arguments, { query: 'phishing' });
    assert.equal(Object.getPrototypeOf(call.arguments), Object.prototype);
  });
}

for (const [label, arguments] of [
  ['malformed JSON', '{"query":'], ['array', '[]'], ['number', '42'],
  ['boolean true', 'true'], ['boolean false', 'false'], ['null', 'null'], ['string primitive', '"phishing"'],
]) {
  test(`${label} argument text throws without echoing the payload`, () => {
    assert.throws(() => normalizeReturnedToolCalls('openai', [{
      name: 'search_published_resources', arguments,
    }]), error => {
      assert.equal(error.code, 'AI_TOOL_CALL_INVALID');
      assert.equal(error.message, 'Tool call arguments must be a plain object.');
      return true;
    });
  });
}
for (const [label, arguments] of [
  ['array', []], ['number', 0], ['boolean', false], ['null', null], ['Date', new Date(0)],
]) {
  test(`direct ${label} arguments throw`, () => {
    assert.throws(() => normalizeReturnedToolCalls('gemini', [{ name: 'get_learning_progress', arguments }]));
  });
}
for (const arguments of ['', ' \n\t ']) {
  test(`blank argument text ${JSON.stringify(arguments)} becomes an empty object`, () => {
    const [call] = normalizeReturnedToolCalls('openai', [{ name: 'get_learning_progress', arguments }]);
    assert.deepEqual(call.arguments, {});
  });
}
test('absent arguments retain the empty-object default', () => {
  assert.deepEqual(normalizeReturnedToolCalls('gemini', [{ name: 'get_learning_progress' }])[0].arguments, {});
});
test('null-prototype plain object args remain accepted without copying', () => {
  const args = Object.assign(Object.create(null), { query: 'phishing' });
  assert.strictEqual(normalizeReturnedToolCalls('gemini', [{ name: 'search_published_resources', args }])[0].arguments, args);
});
test('explicit invalid arguments do not fall through to valid args', () => {
  assert.throws(() => normalizeReturnedToolCalls('openai', [{ name: 'get_learning_progress', arguments: false, args: {} }]));
});
test('one malformed call rejects the whole returned list', () => {
  assert.throws(() => normalizeReturnedToolCalls('openai', [
    { name: 'get_learning_progress', arguments: {} },
    { name: 'search_published_resources', arguments: '{bad' },
  ]));
});
test('empty returned names are excluded', () => {
  assert.deepEqual(normalizeReturnedToolCalls('openai', [{ name: ' \n ', arguments: {} }]), []);
});
test('filtering excluded calls does not renumber fallback IDs', () => {
  assert.deepEqual(normalizeReturnedToolCalls('openai', [
    { name: 'execute_sql', args: {} }, { name: 'get_learning_progress', args: {} },
  ]).map(call => call.callId), ['openai-tool-call-2']);
});

test('Responses serializer stays exactly flat and excludes internal metadata', () => {
  assert.deepEqual(toOpenAiTools(tools), expectedResponsesTools);
});
test('Chat Completions serializer is exactly nested and excludes internal metadata', () => {
  assert.equal(typeof toChatCompletionsTools, 'function', 'distinct Chat Completions serializer is required');
  assert.deepEqual(toChatCompletionsTools(tools), expectedChatTools);
});
test('Gemini serializer retains functionDeclarations and parametersJsonSchema', () => {
  assert.deepEqual(toGeminiTools(tools), [{ functionDeclarations: [{
    name: 'search_published_resources',
    description: 'Search reviewed resources.',
    parametersJsonSchema: {
      type: 'object', properties: { query: { type: 'string' } },
      required: ['query'], additionalProperties: false,
    },
  }] }]);
});
test('empty serializers retain their respective wire defaults', () => {
  assert.deepEqual(toOpenAiTools([]), []);
  assert.equal(toGeminiTools([]), undefined);
  assert.equal(typeof toChatCompletionsTools, 'function');
  assert.deepEqual(toChatCompletionsTools([]), []);
});

for (const name of PROHIBITED_TOOL_NAMES) {
  test(`returned prohibited name ${name} is excluded after trimming`, () => {
    assert.deepEqual(normalizeReturnedToolCalls('openai', [{ name: ` ${name} `, arguments: '{bad' }]), []);
  });
  for (const [label, serialize] of [
    ['Responses', toOpenAiTools], ['Chat Completions', toChatCompletionsTools], ['Gemini', toGeminiTools],
  ]) {
    test(`${label} rejects prohibited declaration ${name}`, () => {
      assert.equal(typeof serialize, 'function', `${label} serializer is required`);
      assert.throws(() => serialize([{ name: ` ${name} `, inputSchema: {} }]), /Invalid tool declaration/);
    });
  }
}

function ilmuFixture(arguments = '{"query":"phishing"}') {
  const requests = [];
  const provider = createIlmuProvider({
    apiKey: 'offline-fixture', baseUrl: 'https://ilmu.example.test/v1/', model: 'fixture-model',
    fetchImpl: async (url, options) => {
      requests.push({ url, options });
      return {
        ok: true, status: 200, headers: { get: () => null },
        json: async () => ({
          id: 'chatcmpl-fixture', model: 'fixture-model', object: 'chat.completion',
          choices: [{ index: 0, finish_reason: 'tool_calls', message: {
            role: 'assistant', content: null,
            tool_calls: [{ id: 'call_ilmu_1', type: 'function', function: { name: 'search_published_resources', arguments } }],
          } }],
          usage: { prompt_tokens: 3, completion_tokens: 2, total_tokens: 5 },
        }),
      };
    },
  });
  return { provider, requests };
}
test('ILMU injected fetch emits Chat Completions body and preserves request settings', async () => {
  const { provider, requests } = ilmuFixture();
  const result = await provider.generate({
    systemInstruction: 'Fixture instruction.', messages: [{ role: 'user', content: 'Fixture request.' }],
    tools, toolChoice: 'auto', maxOutputTokens: 12, temperature: 0.2,
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'https://ilmu.example.test/v1/chat/completions');
  assert.equal(requests[0].options.method, 'POST');
  assert.equal(requests[0].options.headers['Content-Type'], 'application/json');
  assert.equal(requests[0].options.headers.Authorization === 'Bearer offline-fixture', true);
  assert.equal(requests[0].options.signal instanceof AbortSignal, true);
  assert.deepEqual(JSON.parse(requests[0].options.body), {
    model: 'fixture-model', messages: [
      { role: 'system', content: 'Fixture instruction.' }, { role: 'user', content: 'Fixture request.' },
    ], max_tokens: 12, temperature: 0.2, tools: expectedChatTools, tool_choice: 'auto',
  });
  assert.deepEqual(result.usage, { inputTokens: 3, outputTokens: 2, totalTokens: 5 });
  assert.equal(result.providerRequestId, 'chatcmpl-fixture');
  assert.equal(result.finishReason, 'tool_calls');
});
test('ILMU injected response normalizes function.arguments and call ID', async () => {
  const { provider } = ilmuFixture();
  const result = await provider.generate({ tools });
  assert.deepEqual(result.toolCalls, [{
    callId: 'call_ilmu_1', toolName: 'search_published_resources',
    arguments: { query: 'phishing' }, provider: 'ilmu',
  }]);
});
for (const arguments of ['{bad', '[]', '42', 'false', 'null', '"text"']) {
  test(`ILMU injected malformed/nonobject response ${arguments} rejects`, async () => {
    const { provider } = ilmuFixture(arguments);
    await assert.rejects(provider.generate({ tools }), error => {
      assert.equal(error.code, 'AI_TOOL_CALL_INVALID');
      return true;
    });
  });
}

async function run() {
  let failures = 0;
  try {
    for (const { name, run: runTest } of tests) {
      try {
        await runTest();
        console.log(`PASS: ${name}`);
      } catch (error) {
        failures += 1;
        console.error(`FAIL: ${name}\n${error.message}`);
      }
    }
    assert.equal(networkAttempts, 0, 'no real transport may be attempted');
    console.log(`Tool normalization: ${tests.length - failures}/${tests.length} passed; ${failures} failed.`);
    console.log('Live provider calls OpenAI/Gemini/ILMU = 0/0/0; real network = 0; real tool executions = 0.');
    if (failures) process.exitCode = 1;
  } finally {
    restorations.reverse().forEach(restore => restore());
  }
}
run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
