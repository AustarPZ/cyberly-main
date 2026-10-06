const assert = require('node:assert/strict');
const { before, after, test } = require('node:test');

// Deny real transports before loading the adapter; no env loader or DB imports.
let networkAttempts = 0;
function denyNetwork() {
  networkAttempts += 1;
  throw new Error('R5-08 acceptance forbids real network');
}
require('node:net').Socket.prototype.connect = denyNetwork;
require('node:tls').connect = denyNetwork;
for (const name of ['node:http', 'node:https']) {
  const transport = require(name);
  transport.request = denyNetwork;
  transport.get = denyNetwork;
}
globalThis.fetch = denyNetwork;

const { createOpenAiProvider } = require('../src/ai/providers/openai.provider');
const firstUser = { role: 'user', content: 'How can I spot phishing? raw-first-user-marker' };
const secondUser = { role: 'user', content: 'Is that suspicious link safe? raw-second-user-marker' };
let first;
let second;

before(async () => {
  const provider = createOpenAiProvider({
    apiKey: 'synthetic-secret-marker', model: 'offline-fixture', testMockMode: 'context', fetchImpl: denyNetwork,
  });
  const context = {
    learnerContext: { locale: 'en', ageBand: '13-17', email: 'private-email-marker', aiNickname: 'private-nickname-marker' },
    ragContext: 'Reviewed Cyberly Sources:\n[1] Title: reviewed fixture',
  };
  first = await provider.generate({ ...context, messages: [firstUser] });
  second = await provider.generate({ ...context, messages: [firstUser, { role: 'assistant', content: first.content }, secondUser] });
});

test('mock context calls have process-local indices exactly 1 and 2', () => {
  assert.match(first.content, /(?:^| )mockContextCallIndex=1(?: |$)/);
  assert.match(second.content, /(?:^| )mockContextCallIndex=2(?: |$)/);
});

test('second input preserves user > assistant > user role order', () => {
  assert.match(first.content, /(?:^| )roleSequence=user(?: |$)/);
  assert.match(second.content, /(?:^| )roleSequence=user>assistant>user(?: |$)/);
});

test('second context counts exactly one prior assistant', () => {
  assert.match(first.content, /(?:^| )assistantHistoryCount=0(?: |$)/);
  assert.match(second.content, /(?:^| )assistantHistoryCount=1(?: |$)/);
});

test('assistant history is absent on turn 1 and present on turn 2', () => {
  assert.match(first.content, /(?:^| )priorAssistantHistory=false(?: |$)/);
  assert.match(second.content, /(?:^| )priorAssistantHistory=true(?: |$)/);
});

test('history recognition observes the actual first assistant content', () => {
  assert.match(first.content, /(?:^| )sourceCount=1(?: |$)/);
  assert.match(first.content, /(?:^| )priorAssistantContentSeen=false(?: |$)/);
  assert.match(second.content, /(?:^| )priorAssistantContentSeen=true(?: |$)/);
});

test('current user is last for both Provider inputs', () => {
  assert.match(first.content, /(?:^| )currentUserLast=true(?: |$)/);
  assert.match(second.content, /(?:^| )currentUserLast=true(?: |$)/);
});

test('existing context aggregates account for the complete bounded transcript', () => {
  assert.match(first.content, /(?:^| )messageCount=1(?: |$)/);
  assert.match(second.content, /(?:^| )messageCount=3(?: |$)/);
  const expectedChars = firstUser.content.length + first.content.length + secondUser.content.length;
  assert.equal(Number(second.content.match(/(?:^| )chars=(\d+)(?: |$)/)[1]), expectedChars);
  assert.ok(expectedChars <= 8000);
  assert.match(second.content, /hasReviewedSources=true/);
});

test('diagnostics do not echo raw messages, private fields or synthetic secrets', () => {
  for (const result of [first, second]) {
    const serialized = JSON.stringify(result);
    for (const marker of ['raw-first-user-marker', 'raw-second-user-marker', 'private-email-marker',
      'private-nickname-marker', 'synthetic-secret-marker']) {
      assert.equal(serialized.includes(marker), false, 'raw fixture marker must remain private');
    }
  }
  assert.equal(second.content.includes(first.content), false, 'prior assistant content must not be echoed');
});

after(() => {
  console.log(`R5-08 network attempts=${networkAttempts}; live Provider calls OpenAI/Gemini/ILMU=0/0/0`);
  assert.equal(networkAttempts, 0);
});
