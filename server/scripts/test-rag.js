const assert = require('node:assert/strict');
const { createPool } = require('../src/database/pool');
const { createRagRepository } = require('../src/rag/rag.repository');
const { createRagService } = require('../src/rag/rag.service');
const {
  MAX_ENRICHED_QUERY_LENGTH,
  createRagQueryIntent,
  enrichRagQuery,
} = require('../src/rag/ragQueryIntent');

async function tableExists(pool, tableName) {
  const [rows] = await pool.query(
    `SELECT COUNT(*) AS count
     FROM INFORMATION_SCHEMA.TABLES
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?`,
    [tableName]
  );
  return Number(rows[0]?.count || 0) > 0;
}

async function cleanup(pool) {
  if (await tableExists(pool, 'rag_chunks')) {
    await pool.query('DELETE FROM rag_chunks');
  }
  if (await tableExists(pool, 'rag_documents')) {
    await pool.query('DELETE FROM rag_documents');
  }
  if (await tableExists(pool, 'resource_article_translations')) {
    await pool.query("DELETE FROM resource_article_translations WHERE locale = 'test'");
  }
  if (await tableExists(pool, 'resource_articles')) {
    await pool.query("DELETE FROM resource_articles WHERE slug LIKE 'rag-test-%'");
  }
}

async function insertResource(pool, {
  slug,
  status = 'published',
  reviewStatus = 'approved',
  ragReady = true,
  categoryCode = 'Scams',
  locale = 'en',
  title,
  summary,
  body,
  sourceLabel = 'Reviewed Source',
  sourceUrl = 'https://example.test/reviewed',
}) {
  const [resourceResult] = await pool.query(
    `INSERT INTO resource_articles (slug, category_code, source_url, display_order, status, review_status, rag_ready)
     VALUES (?, ?, ?, 999, ?, ?, ?)`,
    [slug, categoryCode, sourceUrl, status, reviewStatus, ragReady ? 1 : 0]
  );
  await pool.query(
    `INSERT INTO resource_article_translations (
        resource_id, locale, title, summary, content_json, source_label
     )
     VALUES (?, ?, ?, ?, JSON_ARRAY(JSON_OBJECT('heading', 'Body', 'body', ?)), ?)`,
    [resourceResult.insertId, locale, title, summary, body, sourceLabel]
  );
  return resourceResult.insertId;
}

function sourceKey(chunk) {
  return chunk.internalTarget?.resourceSlug || chunk.documentId || chunk.sourceUrl || chunk.title;
}

function assertUniqueResources(results) {
  const keys = results.map(sourceKey).filter(Boolean);
  assert.equal(new Set(keys).size, keys.length);
}

function assertNoWeakScamSources(results) {
  const weakSlugs = new Set([
    'misinformation-fake-news',
    'ai-generated-content',
    'deepfakes',
    'privacy-personal-data',
    'cyberbullying',
    'password-security',
    'digital-citizenship',
  ]);
  for (const result of results) {
    assert.equal(weakSlugs.has(result.internalTarget?.resourceSlug), false);
  }
}

function assertRelevantScamResults(results, options = {}) {
  assert.equal(results.length <= 4, true);
  assertUniqueResources(results);
  assertNoWeakScamSources(results);
  if (results.length) {
    const firstSlug = results[0].internalTarget?.resourceSlug;
    assert.equal(['phishing', 'online-scams', 'rag-test-phishing', 'rag-test-online-scams', 'rag-test-ms'].includes(firstSlug), true);
    if (
      results.some(item => item.internalTarget?.resourceSlug === 'phishing' && (!options.preferredLocale || item.locale === options.preferredLocale)) &&
      (!options.preferredLocale || results[0].locale === options.preferredLocale)
    ) {
      assert.equal(firstSlug, 'phishing');
    }
  }
}

function assertScamIntent(query) {
  const intent = createRagQueryIntent(query);
  assert.equal(intent.intent, 'phishing_and_scams');
  assert.deepEqual(intent.categoryCodes, ['Scams']);
  assert.equal(intent.preferredResourceSlugs.includes('phishing'), true);
  assert.equal(intent.preferredResourceSlugs.includes('online-scams'), true);
  return intent;
}

function assertEnrichedScamQuery(query, expectedTerms = []) {
  const original = String(query);
  const intent = assertScamIntent(query);
  const enriched = enrichRagQuery(original, intent);
  assert.equal(original, String(query));
  assert.equal(enriched.startsWith(original.trim()), true);
  assert.equal(enriched.length <= MAX_ENRICHED_QUERY_LENGTH, true);
  for (const term of expectedTerms) {
    assert.equal(enriched.toLowerCase().includes(term.toLowerCase()), true);
  }
  return enriched;
}

function assertSafeChunk(chunk) {
  assert.ok(Number.isInteger(chunk.chunkId));
  assert.ok(Number.isInteger(chunk.documentId));
  assert.equal(typeof chunk.title, 'string');
  assert.equal(typeof chunk.locale, 'string');
  assert.equal(typeof chunk.snippet, 'string');
  assert.ok(chunk.snippet.length > 0);
  assert.ok(chunk.internalTarget);
  assert.equal(chunk.internalTarget.page, 'resources');
  assert.equal(Object.hasOwn(chunk.internalTarget, 'route'), false);
  assert.equal(Object.hasOwn(chunk.internalTarget, 'url'), false);
  assert.equal(Object.hasOwn(chunk, 'content'), false);
  assert.equal(Object.hasOwn(chunk, 'providerRequestId'), false);
  assert.equal(Object.hasOwn(chunk, 'inputTokens'), false);
}

async function run() {
  const pool = createPool();
  const repository = createRagRepository(pool);
  const service = createRagService(repository);

  try {
    await cleanup(pool);

    assert.equal(await tableExists(pool, 'rag_documents'), true);
    assert.equal(await tableExists(pool, 'rag_chunks'), true);

    assertEnrichedScamQuery('fake banking message', ['phishing', 'scam', 'sms', 'otp']);
    assertEnrichedScamQuery('suspicious SMS scam', ['phishing', 'otp']);
    assertEnrichedScamQuery('bank message asking for OTP', ['phishing', 'scam']);
    assertEnrichedScamQuery('phishing link in SMS', ['scam', 'otp']);
    assertEnrichedScamQuery('mesej bank palsu', ['phishing', 'scam', 'pautan']);
    assertEnrichedScamQuery('SMS mencurigakan', ['phishing', 'otp']);
    assertEnrichedScamQuery('假银行短信', ['phishing', 'scam', '钓鱼', '验证码']);
    assertEnrichedScamQuery('可疑短信', ['phishing', 'scam', '银行', '钓鱼']);
    assert.equal(createRagQueryIntent('Is this fake news?').intent, 'generic_cyber_wellness');
    const longQuery = `${'fake banking message '.repeat(40)}OTP`;
    assert.equal(enrichRagQuery(longQuery).length <= MAX_ENRICHED_QUERY_LENGTH, true);

    await insertResource(pool, {
      slug: 'rag-test-phishing',
      title: 'Phishing red flags',
      summary: 'Learn how to spot suspicious links and urgent messages.',
      body: 'A phishing scam often uses urgency, fake banking messages, suspicious SMS, strange links, requests for OTPs, malicious links, impersonation, or payment pressure.',
      sourceLabel: 'Cyberly Reviewed Resource',
    });
    await insertResource(pool, {
      slug: 'rag-test-online-scams',
      title: 'Online scam warnings',
      summary: 'Learn how to check fake bank SMS, delivery text scams, and suspicious payment messages.',
      body: 'Scammers may impersonate a bank, delivery company, or trusted service. Treat OTP requests, urgent links, and payment pressure in SMS messages as warning signs.',
      sourceLabel: 'Cyberly Reviewed Resource',
    });
    await insertResource(pool, {
      slug: 'rag-test-draft',
      status: 'draft',
      title: 'Draft unsafe draft',
      summary: 'This draft should not be available.',
      body: 'draft-only-secret-keyword',
    });
    await insertResource(pool, {
      slug: 'rag-test-ms',
      locale: 'ms',
      title: 'Tanda pancingan data',
      summary: 'Kenal pasti pautan mencurigakan dan mesej mendesak.',
      body: 'Pancingan data sering menggunakan pautan pelik, tekanan segera, dan permintaan OTP.',
      sourceLabel: 'Sumber Semakan Cyberly',
    });

    const firstIngest = await service.ingestPublishedResources();
    assert.equal(firstIngest.documents >= 2, true);
    assert.equal(firstIngest.chunks > 0, true);

    const [[docCountAfterFirst]] = await pool.query('SELECT COUNT(*) AS count FROM rag_documents');
    const [[chunkCountAfterFirst]] = await pool.query('SELECT COUNT(*) AS count FROM rag_chunks');
    const secondIngest = await service.ingestPublishedResources();
    const [[docCountAfterSecond]] = await pool.query('SELECT COUNT(*) AS count FROM rag_documents');
    const [[chunkCountAfterSecond]] = await pool.query('SELECT COUNT(*) AS count FROM rag_chunks');
    assert.equal(docCountAfterSecond.count, docCountAfterFirst.count);
    assert.equal(chunkCountAfterSecond.count, chunkCountAfterFirst.count);
    assert.equal(secondIngest.documents >= firstIngest.documents, true);

    const [chunkRows] = await pool.query(
      `SELECT rd.title, rc.heading, rc.chunk_text
       FROM rag_chunks rc
       JOIN rag_documents rd ON rd.id = rc.document_id
       WHERE rd.content_type = 'resource'
         AND rd.title = 'Phishing red flags'
       ORDER BY rc.chunk_index`
    );
    assert.equal(chunkRows.some(row => row.chunk_text.includes('Phishing red flags')), true);
    assert.equal(chunkRows.some(row => row.chunk_text.includes('suspicious links')), true);
    assert.equal(chunkRows.some(row => row.chunk_text.includes('payment pressure')), true);

    let results = await service.retrieveReviewedChunks({
      query: 'phishing suspicious links OTP',
      locale: 'en',
      limit: 4,
    });
    assert.equal(results.length > 0, true);
    results.forEach(assertSafeChunk);
    assert.equal(results.some(item => item.title === 'Phishing red flags'), true);
    assert.equal(results.some(item => item.snippet.includes('draft-only-secret-keyword')), false);

    const [[draftDocCount]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM rag_documents
       WHERE title = 'Draft unsafe draft'`
    );
    assert.equal(draftDocCount.count, 0);

    await pool.query(
      `UPDATE rag_documents
       SET rag_ready = 0
       WHERE title = 'Phishing red flags'`
    );
    results = await service.retrieveReviewedChunks({
      query: 'phishing suspicious links OTP',
      locale: 'en',
      limit: 4,
    });
    assert.equal(results.some(item => item.title === 'Phishing red flags'), false);
    await pool.query(
      `UPDATE rag_documents
       SET rag_ready = 1
       WHERE title = 'Phishing red flags'`
    );

    const msResults = await service.retrieveReviewedChunks({
      query: 'pautan pelik OTP',
      locale: 'ms-MY',
      limit: 4,
    });
    assert.equal(msResults.length > 0, true);
    assert.equal(msResults[0].locale, 'ms');
    assert.equal(msResults.some(item => item.title === 'Tanda pancingan data'), true);

    const fallbackResults = await service.retrieveReviewedChunks({
      query: 'payment pressure suspicious links',
      locale: 'zh-CN',
      limit: 4,
    });
    assert.equal(fallbackResults.length > 0, true);
    assert.equal(fallbackResults.some(item => item.locale === 'en'), true);

    await assert.rejects(
      service.retrieveReviewedChunks({ query: '   ', locale: 'en' }),
      /RAG query is required/
    );

    const categoryResults = await service.retrieveReviewedChunks({
      query: 'OTP pressure',
      locale: 'en',
      categoryCode: 'Scams',
      limit: 4,
    });
    assert.equal(categoryResults.length > 0, true);
    categoryResults.forEach(assertSafeChunk);

    for (const query of [
      'fake banking message',
      'suspicious SMS scam',
      'bank message asking for OTP',
      'phishing link in SMS',
      'fake delivery text message',
    ]) {
      results = await service.retrieveReviewedChunks({ query, locale: 'en', limit: 4 });
      assertRelevantScamResults(results, { preferredLocale: 'en' });
    }

    for (const query of [
      'mesej bank palsu',
      'SMS mencurigakan',
      'mesej meminta OTP',
      'pautan penipuan dalam SMS',
    ]) {
      results = await service.retrieveReviewedChunks({ query, locale: 'ms', limit: 4 });
      assertRelevantScamResults(results, { preferredLocale: 'ms' });
      assert.equal(results.some(item => item.locale === 'ms'), true);
    }

    for (const query of [
      '假银行短信',
      '可疑短信',
      '短信要求验证码',
      '短信中的钓鱼链接',
    ]) {
      results = await service.retrieveReviewedChunks({ query, locale: 'zh-CN', limit: 4 });
      assertRelevantScamResults(results, { preferredLocale: 'zh-CN' });
      assert.equal(results.length > 0, true);
    }

    console.log('RAG foundation verification passed.');
  } finally {
    await cleanup(pool).catch(() => {});
    await pool.end();
  }
}

run().catch(error => {
  console.error(error.stack || error.message);
  process.exitCode = 1;
});
