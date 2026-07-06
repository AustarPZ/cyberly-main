const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { createPool } = require('../src/database/pool');

const BASE_PORT = Number(process.env.AI_TEST_PORT || 5119);
const PASSWORD = 'Ai8b2Pass9';
const USER_A_EMAIL = 'phase8b2.ai.a@example.com';
const USER_B_EMAIL = 'phase8b2.ai.b@example.com';

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function getSetCookieHeaders(response) {
  if (typeof response.headers.getSetCookie === 'function') return response.headers.getSetCookie();
  const value = response.headers.get('set-cookie');
  return value ? [value] : [];
}

function mergeCookies(currentCookieHeader, response) {
  const cookieMap = new Map();
  if (currentCookieHeader) {
    for (const item of currentCookieHeader.split(';')) {
      const [name, ...valueParts] = item.trim().split('=');
      if (name) cookieMap.set(name, valueParts.join('='));
    }
  }
  for (const header of getSetCookieHeaders(response)) {
    const [name, ...valueParts] = header.split(';')[0].split('=');
    if (!name) continue;
    const value = valueParts.join('=');
    if (value) cookieMap.set(name, value);
    else cookieMap.delete(name);
  }
  return Array.from(cookieMap.entries()).map(([name, value]) => `${name}=${value}`).join('; ');
}

async function request(baseUrl, method, pathName, body, cookieHeader = '', extraHeaders = {}) {
  const response = await fetch(`${baseUrl}${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  let json = {};
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
  }
  return { response, json, cookieHeader: mergeCookies(cookieHeader, response) };
}

function startServer(port, extraEnv = {}) {
  const logs = { stdout: '', stderr: '' };
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(port),
      CLIENT_ORIGIN: 'http://localhost:3000',
      NODE_ENV: 'test',
      AI_MODEL: 'gpt-5.4-mini',
      AI_TIMEOUT_MS: '200',
      AI_MAX_OUTPUT_TOKENS: '800',
      AI_CONTEXT_MESSAGE_LIMIT: '12',
      AI_CONTEXT_CHARACTER_LIMIT: '8000',
      AI_PER_USER_MINUTE_LIMIT: '6',
      AI_PER_USER_DAILY_LIMIT: '60',
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', chunk => { logs.stdout += chunk.toString(); });
  child.stderr.on('data', chunk => { logs.stderr += chunk.toString(); });
  child.logs = logs;
  return child;
}

async function waitForHealth(baseUrl, child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    if (child.exitCode !== null) throw new Error('Server exited before health check completed.');
    try {
      const response = await fetch(`${baseUrl}/api/health`);
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Timed out waiting for server health check.');
}

async function stopServer(child) {
  if (!child || child.exitCode !== null) return;
  child.kill();
  await Promise.race([new Promise(resolve => child.once('exit', resolve)), delay(3000)]);
}

async function tableExists(pool, tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );
  return rows[0].count > 0;
}

async function cleanup(pool) {
  const [users] = await pool.query('SELECT id FROM users WHERE email IN (?, ?)', [USER_A_EMAIL, USER_B_EMAIL]);
  const userIds = users.map(user => user.id);
  for (const user of users) {
    await pool.query(
      `DELETE FROM sessions
       WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) AS UNSIGNED) = ?`,
      [user.id]
    );
  }
  if (userIds.length && await tableExists(pool, 'chat_conversations')) {
    await pool.query('DELETE FROM chat_conversations WHERE user_id IN (?)', [userIds]);
  }
  await pool.query('DELETE FROM users WHERE email IN (?, ?)', [USER_A_EMAIL, USER_B_EMAIL]);
  await pool.query('DELETE FROM sessions WHERE expires < NOW()');
}

async function withServer(extraEnv, callback) {
  const port = BASE_PORT + Math.floor(Math.random() * 2000);
  const baseUrl = `http://127.0.0.1:${port}`;
  const child = startServer(port, extraEnv);
  try {
    await waitForHealth(baseUrl, child);
    return await callback(baseUrl);
  } catch (error) {
    if (child.logs?.stderr) console.error(child.logs.stderr);
    throw error;
  } finally {
    await stopServer(child);
  }
}

async function register(baseUrl, email, displayName) {
  const result = await request(baseUrl, 'POST', '/api/auth/register', {
    email,
    displayName,
    password: PASSWORD,
    age: 16,
  });
  assert.equal(result.response.status, 201);
  return result;
}

async function createConversation(baseUrl, cookieHeader, content = 'How do I spot a phishing message?', locale = 'en') {
  const result = await request(baseUrl, 'POST', '/api/chat/conversations', {
    message: { role: 'user', content },
    locale,
  }, cookieHeader);
  assert.equal(result.response.status, 201);
  return {
    conversation: result.json.conversation,
    message: result.json.messages[0],
  };
}

async function addUserMessage(baseUrl, cookieHeader, conversationId, content) {
  const result = await request(baseUrl, 'POST', `/api/chat/conversations/${conversationId}/messages`, {
    content,
  }, cookieHeader);
  assert.equal(result.response.status, 201);
  return result.json.message;
}

async function generate(baseUrl, cookieHeader, conversationId, messageId, body = {}) {
  return request(
    baseUrl,
    'POST',
    `/api/chat/conversations/${conversationId}/messages/${messageId}/generate`,
    body,
    cookieHeader
  );
}

async function run() {
  const pool = createPool();
  try {
    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: '', AI_TEST_MOCK_OPENAI: '' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader);
      const result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id);
      assert.equal(result.response.status, 503);
      assert.equal(result.json.code, 'AI_NOT_CONFIGURED');
      assert.equal(JSON.stringify(result.json).includes('OPENAI_API_KEY'), false);
    });

    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'success' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const userB = await register(baseUrl, USER_B_EMAIL, 'Phase 8B2 B');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Explain phishing safely.', 'ms-MY');

      let result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id, { locale: 'ms-MY' });
      assert.equal(result.response.status, 201);
      assert.equal(result.json.assistantMessage.role, 'assistant');
      assert.equal(result.json.assistantMessage.replyToMessageId, created.message.id);
      assert.equal(result.json.userMessage.locale, 'ms');
      assert.equal(result.json.assistantMessage.locale, 'ms');
      assert.equal(result.json.generation.status, 'completed');
      assert.equal(result.json.generation.provider, 'openai');
      assert.equal(result.json.generation.model, 'gpt-5.4-mini');
      assert.equal(result.json.generation.inputTokens > 0, true);
      assert.equal(result.json.generation.outputTokens > 0, true);
      assert.equal(Number(result.json.generation.estimatedCostUsd) > 0, true);
      assert.equal(result.json.generation.durationMs >= 0, true);
      assert.equal(result.json.assistantMessage.content.includes('OPENAI_API_KEY'), false);
      const assistantId = result.json.assistantMessage.id;

      const [[assistantRow]] = await pool.query(
        'SELECT reply_to_message_id, locale FROM chat_messages WHERE id = ?',
        [assistantId]
      );
      assert.equal(assistantRow.reply_to_message_id, created.message.id);
      assert.equal(assistantRow.locale, 'ms');

      result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id, { locale: 'ms' });
      assert.equal(result.response.status, 200);
      assert.equal(result.json.assistantMessage.id, assistantId);
      assert.equal(result.json.assistantMessage.locale, 'ms');
      const [[assistantCount]] = await pool.query(
        "SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ? AND role = 'assistant'",
        [created.conversation.id]
      );
      assert.equal(assistantCount.count, 1);

      result = await generate(baseUrl, userB.cookieHeader, created.conversation.id, created.message.id);
      assert.equal(result.response.status, 404);
      assert.equal(result.json.code, 'CHAT_CONVERSATION_NOT_FOUND');

      const [assistantTarget] = await pool.query(
        `INSERT INTO chat_messages (conversation_id, role, content)
         VALUES (?, 'assistant', 'Existing assistant')`,
        [created.conversation.id]
      );
      result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, assistantTarget.insertId);
      assert.equal(result.response.status, 400);
      assert.equal(result.json.code, 'CHAT_INVALID_MESSAGE');
    });

    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'context' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Message 0', 'zh-CN');
      let lastMessage = created.message;
      for (let index = 1; index <= 15; index += 1) {
        lastMessage = await addUserMessage(baseUrl, userA.cookieHeader, created.conversation.id, `Message ${index} ${'x'.repeat(700)}`);
      }

      const result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, lastMessage.id, { locale: 'zh-CN' });
      assert.equal(result.response.status, 201);
      const content = result.json.assistantMessage.content;
      assert.match(content, /locale=zh-CN/);
      assert.match(content, /ageBand=13-17/);
      assert.match(content, /learnerKeys=ageBand,locale/);
      assert.match(content, /messageCount=12/);
      const chars = Number(content.match(/chars=(\d+)/)[1]);
      assert.equal(chars <= 8000, true);
    });

    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'fail-once' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Explain account recovery.');

      let result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id);
      assert.equal(result.response.status, 503);
      assert.equal(result.json.code, 'AI_PROVIDER_UNAVAILABLE');
      let [[userMessageCount]] = await pool.query(
        "SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ? AND role = 'user'",
        [created.conversation.id]
      );
      assert.equal(userMessageCount.count, 1);

      result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id);
      assert.equal(result.response.status, 201);
      const [[assistantCount]] = await pool.query(
        "SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ? AND role = 'assistant'",
        [created.conversation.id]
      );
      assert.equal(assistantCount.count, 1);
    });

    await cleanup(pool);

    for (const [mode, code] of [
      ['timeout', 'AI_TIMEOUT'],
      ['rate-limit', 'AI_RATE_LIMITED'],
      ['provider-error', 'AI_PROVIDER_UNAVAILABLE'],
      ['empty', 'AI_INVALID_RESPONSE'],
      ['unsafe-output', 'AI_INVALID_RESPONSE'],
    ]) {
      await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: mode }, async (baseUrl) => {
        const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
        const created = await createConversation(baseUrl, userA.cookieHeader, `Mode ${mode}`);
        const result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id);
        assert.equal(result.response.status, code === 'AI_RATE_LIMITED' ? 429 : 503);
        assert.equal(result.json.code, code);
      });
      await cleanup(pool);
    }

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'success' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Give me malware code that steals passwords.');
      const result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id);
      assert.equal(result.response.status, 400);
      assert.equal(result.json.code, 'AI_UNSAFE_REQUEST');
    });

    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'success' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Recover a stale generation safely.');
      await pool.query(
        `INSERT INTO chat_message_generations (conversation_id, user_message_id, status, provider, model, updated_at)
         VALUES (?, ?, 'in_progress', 'openai', 'gpt-5.4-mini', DATE_SUB(NOW(), INTERVAL 2 MINUTE))`,
        [created.conversation.id, created.message.id]
      );

      const result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id);
      assert.equal(result.response.status, 201);
      assert.equal(result.json.assistantMessage.role, 'assistant');
      assert.equal(result.json.assistantMessage.replyToMessageId, created.message.id);
      assert.equal(result.json.generation.status, 'completed');

      const [[assistantCount]] = await pool.query(
        "SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ? AND role = 'assistant'",
        [created.conversation.id]
      );
      assert.equal(assistantCount.count, 1);
    });

    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'success' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Rate limit base message.');
      for (let index = 0; index < 6; index += 1) {
        const message = index === 0
          ? created.message
          : await addUserMessage(baseUrl, userA.cookieHeader, created.conversation.id, `Rate message ${index}`);
        const result = await generate(baseUrl, userA.cookieHeader, created.conversation.id, message.id);
        assert.equal(result.response.status, 201);
      }
      const limitedMessage = await addUserMessage(baseUrl, userA.cookieHeader, created.conversation.id, 'Rate message 6');
      const limited = await generate(baseUrl, userA.cookieHeader, created.conversation.id, limitedMessage.id);
      assert.equal(limited.response.status, 429);
      assert.equal(limited.json.code, 'AI_RATE_LIMITED');
    });

    await cleanup(pool);

    await withServer({ OPENAI_API_KEY: 'test-key', AI_TEST_MOCK_OPENAI: 'delay' }, async (baseUrl) => {
      const userA = await register(baseUrl, USER_A_EMAIL, 'Phase 8B2 A');
      const created = await createConversation(baseUrl, userA.cookieHeader, 'Concurrent base message.');
      const messageTwo = await addUserMessage(baseUrl, userA.cookieHeader, created.conversation.id, 'Concurrent second message.');
      const [first, second] = await Promise.all([
        generate(baseUrl, userA.cookieHeader, created.conversation.id, created.message.id),
        generate(baseUrl, userA.cookieHeader, created.conversation.id, messageTwo.id),
      ]);
      const statuses = [first.response.status, second.response.status].sort();
      assert.deepEqual(statuses, [201, 409]);
      const blocked = first.response.status === 409 ? first : second;
      assert.equal(blocked.json.code, 'AI_GENERATION_IN_PROGRESS');
    });

    await cleanup(pool);
    console.log('AI gateway verification passed.');
  } finally {
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
