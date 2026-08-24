const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const {
  CONTENT_CONTRACT,
  CONTENT_QUERIES,
  assertReadOnlyQueries,
  verifyMigrationState,
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
  const repositoryMigrations = listMigrationFiles();
  const migrationsThrough028 = repositoryMigrations.slice(0, -1);

  assert.equal(CONTENT_CONTRACT.repositoryMigrationCount, 29);
  assert.equal(repositoryMigrations.length, 29);
  assert.deepEqual(CONTENT_CONTRACT.allowedPendingMigrationFiles, [
    '029_add_session_version_to_users.sql',
  ]);

  const preMigrationState = verifyMigrationState(migrationsThrough028, repositoryMigrations);
  assert.equal(preMigrationState.repositoryCount, 29);
  assert.equal(preMigrationState.appliedCount, 28);
  assert.equal(preMigrationState.highestApplied, '028_add_avatar_preset_to_learner_profiles.sql');
  assert.deepEqual(preMigrationState.pending, ['029_add_session_version_to_users.sql']);

  const postMigrationState = verifyMigrationState(repositoryMigrations, repositoryMigrations);
  assert.equal(postMigrationState.appliedCount, 29);
  assert.equal(postMigrationState.highestApplied, '029_add_session_version_to_users.sql');
  assert.deepEqual(postMigrationState.pending, []);

  assert.throws(
    () => verifyMigrationState([...repositoryMigrations, '030_untracked.sql'], repositoryMigrations),
    /more applied migrations than repository migrations/
  );
  assert.throws(
    () => verifyMigrationState([...migrationsThrough028, migrationsThrough028[27]], repositoryMigrations),
    /duplicate applied migration/
  );
  assert.throws(
    () => verifyMigrationState(repositoryMigrations.filter((_, index) => index !== 10), repositoryMigrations),
    /applied migration sequence does not match repository order/
  );
  assert.throws(
    () => verifyMigrationState([...migrationsThrough028.slice(0, -1), repositoryMigrations[28]], repositoryMigrations),
    /applied migration sequence does not match repository order/
  );
  assert.throws(
    () => verifyMigrationState(repositoryMigrations.slice(0, -2), repositoryMigrations),
    /unexpected pending migration/
  );

  assert.equal(CONTENT_CONTRACT.assessment.questions, 12);
  assert.equal(CONTENT_CONTRACT.assessment.topics.length, 4);
  assert.equal(CONTENT_CONTRACT.scenarios.definitions, 8);
  assert.equal(CONTENT_CONTRACT.scenarios.steps, 24);
  assert.equal(CONTENT_CONTRACT.resources.articles, 9);
  assert.equal(CONTENT_CONTRACT.resources.ragEligibleArticles, 6);
  assert.deepEqual(CONTENT_CONTRACT.locales, ['en', 'ms', 'zh-CN']);

  const result = verifyContentRows({
    migrationFiles: migrationsThrough028,
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
  }, repositoryMigrations);

  assert.equal(result.ragState, 'empty');
  assert.equal(result.rag.expectedDocuments, 18);
  assert.deepEqual(result.migrations, preMigrationState);

  assert.throws(() => verifyContentRows({
    migrationFiles: migrationsThrough028,
    assessment: {
      definitions: 1,
      questions: 11,
      topics: 4,
      englishQuestions: 11,
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
  }, repositoryMigrations), /11 !== 12/);
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
