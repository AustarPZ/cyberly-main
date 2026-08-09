const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  CONTENT_CONTRACT,
  CONTENT_QUERIES,
  assertReadOnlyQueries,
  verifyContentRows,
} = require('./staging-verify-content');
const { listMigrationFiles } = require('../src/database/migration-utils');

function runReadOnlyContractTests() {
  assert.doesNotThrow(() => assertReadOnlyQueries(CONTENT_QUERIES));
  for (const sql of Object.values(CONTENT_QUERIES)) {
    assert.match(sql.trim(), /^(?:SELECT|WITH)\b/i);
    assert.doesNotMatch(sql, /\b(?:INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP|TRUNCATE|CALL|SET)\b/i);
  }
}

function runContentContractTests() {
  assert.equal(CONTENT_CONTRACT.migrations, 27);
  assert.equal(CONTENT_CONTRACT.assessment.questions, 12);
  assert.equal(CONTENT_CONTRACT.assessment.topics.length, 4);
  assert.equal(CONTENT_CONTRACT.scenarios.definitions, 8);
  assert.equal(CONTENT_CONTRACT.scenarios.steps, 24);
  assert.equal(CONTENT_CONTRACT.resources.articles, 9);
  assert.equal(CONTENT_CONTRACT.resources.ragEligibleArticles, 6);
  assert.deepEqual(CONTENT_CONTRACT.locales, ['en', 'ms', 'zh-CN']);

  const result = verifyContentRows({
    migrationFiles: listMigrationFiles(),
    assessment: {
      definitions: 1,
      questions: 12,
      topics: 4,
      englishQuestions: 12,
      msDefinitions: 1,
      msQuestions: 12,
      msOptions: 48,
      zhDefinitions: 1,
      zhQuestions: 12,
      zhOptions: 48,
    },
    assessmentTopics: [...CONTENT_CONTRACT.assessment.topics],
    scenario: {
      definitions: 8,
      publishedDefinitions: 8,
      steps: 24,
      options: 72,
      enDefinitions: 8,
      enSteps: 24,
      enOptions: 72,
      msDefinitions: 8,
      msSteps: 24,
      msOptions: 72,
      zhDefinitions: 8,
      zhSteps: 24,
      zhOptions: 72,
    },
    resource: {
      articles: 9,
      publishedArticles: 9,
      completeMetadata: 9,
      enTranslations: 9,
      msTranslations: 9,
      zhTranslations: 9,
      ragEligibleArticles: 6,
      ragEligibleTranslations: 18,
    },
    rag: {
      documents: 0,
      chunks: 0,
      duplicateIdentities: 0,
      orphanChunks: 0,
      missingEligibleTranslations: 18,
    },
  });

  assert.equal(result.ragState, 'empty');
  assert.equal(result.rag.expectedDocuments, 18);
}

function runProviderIsolationTest() {
  const files = [
    'rag-ingest.js',
    '../src/rag/rag.service.js',
    '../src/rag/rag.repository.js',
    '../src/rag/rag.chunker.js',
  ];
  for (const relativePath of files) {
    const source = fs.readFileSync(path.resolve(__dirname, relativePath), 'utf8');
    assert.doesNotMatch(source, /require\([^)]*(?:\/ai\/|openai|gemini|provider|embedding)[^)]*\)/i);
  }
}

runReadOnlyContractTests();
runContentContractTests();
runProviderIsolationTest();
console.log('Staging content verifier tests passed.');
