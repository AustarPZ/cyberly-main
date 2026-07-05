const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const path = require('node:path');
const { createPool } = require('../src/database/pool');

const PORT = process.env.CHAT_TEST_PORT || '5109';
const BASE_URL = `http://127.0.0.1:${PORT}`;
const PASSWORD = 'Chat8a2Pass9';
const USER_A_EMAIL = 'phase8a2.chat.a@example.com';
const USER_B_EMAIL = 'phase8a2.chat.b@example.com';

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

async function request(method, pathName, body, cookieHeader = '', extraHeaders = {}) {
  const response = await fetch(`${BASE_URL}${pathName}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...extraHeaders,
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const json = text ? JSON.parse(text) : {};
  return { response, json, cookieHeader: mergeCookies(cookieHeader, response) };
}

function startServer() {
  const child = spawn(process.execPath, [path.join(__dirname, '..', 'server.js')], {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, PORT, CLIENT_ORIGIN: 'http://localhost:3000', NODE_ENV: 'test' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  child.stdout.on('data', () => {});
  child.stderr.on('data', () => {});
  return child;
}

async function waitForHealth(child) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    if (child.exitCode !== null) throw new Error('Server exited before health check completed.');
    try {
      const response = await fetch(`${BASE_URL}/api/health`);
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
  for (const user of users) {
    await pool.query(
      `DELETE FROM sessions
       WHERE CAST(JSON_UNQUOTE(JSON_EXTRACT(data, '$.userId')) AS UNSIGNED) = ?`,
      [user.id]
    );
  }
  if (await tableExists(pool, 'chat_conversations')) {
    await pool.query('DELETE FROM chat_conversations WHERE user_id IN (?)', [users.map(user => user.id).length ? users.map(user => user.id) : [0]]);
  }
  await pool.query('DELETE FROM users WHERE email IN (?, ?)', [USER_A_EMAIL, USER_B_EMAIL]);
  await pool.query('DELETE FROM sessions WHERE expires < NOW()');
}

async function register(email, displayName) {
  const result = await request('POST', '/api/auth/register', {
    email,
    displayName,
    password: PASSWORD,
    age: 16,
  });
  assert.equal(result.response.status, 201);
  return result;
}

function assertConversationShape(conversation) {
  assert.ok(Number.isInteger(conversation.id));
  assert.ok(conversation.id > 0);
  assert.equal(typeof conversation.title, 'string');
  assert.ok(['en', 'ms', 'zh-CN'].includes(conversation.locale));
  assert.ok(conversation.createdAt);
  assert.ok(conversation.updatedAt);
  assert.ok(conversation.lastMessageAt);
}

async function run() {
  const pool = createPool();
  const child = startServer();
  try {
    await cleanup(pool);
    await waitForHealth(child);

    let result = await request('GET', '/api/chat/conversations');
    assert.equal(result.response.status, 401);

    const userA = await register(USER_A_EMAIL, 'Phase 8A2 A');
    const cookieA = userA.cookieHeader;
    const userB = await register(USER_B_EMAIL, 'Phase 8A2 B');
    const cookieB = userB.cookieHeader;

    result = await request('POST', '/api/chat/conversations', {}, cookieA);
    assert.equal(result.response.status, 201);
    assertConversationShape(result.json.conversation);
    assert.equal(result.json.messages.length, 0);
    assert.equal(result.json.conversation.title, 'New chat');
    assert.equal(result.json.conversation.locale, 'en');
    const emptyConversationId = result.json.conversation.id;

    result = await request('POST', '/api/chat/conversations', {
      title: '  Custom chat  ',
      message: { role: 'user', content: '  How do I spot a parcel scam?  ' },
      locale: 'ms-MY',
      userId: userB.json.user.id,
    }, cookieA);
    assert.equal(result.response.status, 201);
    assert.equal(result.json.conversation.title, 'Custom chat');
    assert.equal(result.json.conversation.locale, 'ms');
    assert.equal(result.json.messages.length, 1);
    assert.equal(result.json.messages[0].role, 'user');
    assert.equal(result.json.messages[0].content, 'How do I spot a parcel scam?');
    assert.equal(result.json.messages[0].locale, 'ms');
    const conversationId = result.json.conversation.id;
    const firstMessageId = result.json.messages[0].id;

    const [[firstMessageLocale]] = await pool.query('SELECT locale FROM chat_messages WHERE id = ?', [firstMessageId]);
    assert.equal(firstMessageLocale.locale, 'ms');

    const [[dbConversation]] = await pool.query('SELECT user_id FROM chat_conversations WHERE id = ?', [conversationId]);
    assert.equal(dbConversation.user_id, userA.json.user.id);
    const [[assistantCount]] = await pool.query("SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ? AND role <> 'user'", [conversationId]);
    assert.equal(assistantCount.count, 0);

    result = await request('POST', '/api/chat/conversations', {
      message: { content: 'This message should become the generated conversation title because it is quite long and descriptive.' },
      locale: 'ZH-cn',
    }, cookieA);
    assert.equal(result.response.status, 201);
    assert.equal(result.json.conversation.locale, 'zh-CN');
    assert.equal(result.json.conversation.title.length, 80);
    assert.equal(result.json.messages[0].content, 'This message should become the generated conversation title because it is quite long and descriptive.');
    assert.equal(result.json.messages[0].locale, 'zh-CN');

    result = await request('GET', '/api/chat/conversations', undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.conversations.length, 3);
    assert.equal(result.json.conversations[0].id, result.json.conversations[0].id);
    assert.equal(result.json.conversations[0].messageCount >= 0, true);

    result = await request('GET', '/api/chat/conversations?limit=1', undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.conversations.length, 1);
    assert.equal(result.json.limit, 1);

    result = await request('GET', '/api/chat/conversations?limit=999', undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.limit, 100);
    assert.equal(result.json.conversations.length, 3);

    result = await request('GET', '/api/chat/conversations?limit=0', undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.limit, 1);

    result = await request('GET', `/api/chat/conversations/${conversationId}`, undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.conversation.id, conversationId);
    assert.equal(result.json.messages.length, 1);
    assert.equal(result.json.messages[0].id, firstMessageId);
    assert.equal(result.json.messages[0].locale, 'ms');

    result = await request('GET', `/api/chat/conversations/${conversationId}`, undefined, cookieB);
    assert.equal(result.response.status, 404);
    assert.equal(result.json.code, 'CHAT_CONVERSATION_NOT_FOUND');

    result = await request('GET', '/api/chat/conversations', undefined, cookieB);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.conversations.length, 0);

    result = await request('PATCH', `/api/chat/conversations/${conversationId}`, { title: '  Renamed chat  ' }, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.conversation.title, 'Renamed chat');

    result = await request('PATCH', `/api/chat/conversations/${conversationId}`, { title: '   ' }, cookieA);
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'CHAT_INVALID_TITLE');

    result = await request('POST', `/api/chat/conversations/${conversationId}/messages`, {
      role: 'assistant',
      content: 'You should store this as user text only if roles are ignored.',
    }, cookieA);
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'CHAT_MESSAGE_ROLE_INVALID');

    result = await request('POST', `/api/chat/conversations/${conversationId}/messages`, { content: '  Please explain the warning signs.  ', locale: 'ZH-cn' }, cookieA);
    assert.equal(result.response.status, 201);
    assert.equal(result.json.message.role, 'user');
    assert.equal(result.json.message.content, 'Please explain the warning signs.');
    assert.equal(result.json.message.locale, 'zh-CN');

    const [[secondMessageLocale]] = await pool.query('SELECT locale FROM chat_messages WHERE id = ?', [result.json.message.id]);
    assert.equal(secondMessageLocale.locale, 'zh-CN');

    result = await request('POST', `/api/chat/conversations/${conversationId}/messages`, {
      content: 'Locale fallback check.',
      locale: 'fr-FR',
    }, cookieA);
    assert.equal(result.response.status, 201);
    assert.equal(result.json.message.locale, 'en');

    result = await request('POST', `/api/chat/conversations/${conversationId}/messages`, { content: '   ' }, cookieA);
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'CHAT_INVALID_MESSAGE');

    result = await request('POST', '/api/chat/conversations/abc/messages', { content: 'hello' }, cookieA);
    assert.equal(result.response.status, 400);
    assert.equal(result.json.code, 'CHAT_INVALID_ID');

    result = await request('POST', `/api/chat/conversations/${conversationId}/messages`, { content: 'Cross user write' }, cookieB);
    assert.equal(result.response.status, 404);
    assert.equal(result.json.code, 'CHAT_CONVERSATION_NOT_FOUND');

    const [[messageCountBeforeDelete]] = await pool.query('SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ?', [conversationId]);
    assert.equal(messageCountBeforeDelete.count, 3);
    result = await request('DELETE', `/api/chat/conversations/${conversationId}`, undefined, cookieA);
    assert.equal(result.response.status, 200);
    assert.equal(result.json.ok, true);
    const [[messageCountAfterDelete]] = await pool.query('SELECT COUNT(*) AS count FROM chat_messages WHERE conversation_id = ?', [conversationId]);
    assert.equal(messageCountAfterDelete.count, 0);

    result = await request('GET', `/api/chat/conversations/${conversationId}`, undefined, cookieA);
    assert.equal(result.response.status, 404);
    assert.equal(result.json.code, 'CHAT_CONVERSATION_NOT_FOUND');

    result = await request('DELETE', `/api/chat/conversations/${emptyConversationId}`, undefined, cookieB);
    assert.equal(result.response.status, 404);
    assert.equal(result.json.code, 'CHAT_CONVERSATION_NOT_FOUND');

    await cleanup(pool);
    const [[remainingUsers]] = await pool.query('SELECT COUNT(*) AS count FROM users WHERE email IN (?, ?)', [USER_A_EMAIL, USER_B_EMAIL]);
    assert.equal(remainingUsers.count, 0);

    console.log('Chat backend verification passed.');
  } finally {
    await stopServer(child);
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

run().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});
