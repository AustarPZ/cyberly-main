const assert = require('node:assert/strict');

const { validateStagingDatabaseEnvironment } = require('./run-with-staging-env');
const { createPool } = require('../src/database/pool');
const { listMigrationFiles } = require('../src/database/migration-utils');

const CONTENT_CONTRACT = Object.freeze({
  repositoryMigrationCount: 29,
  allowedPendingMigrationFiles: Object.freeze([
    '029_add_session_version_to_users.sql',
  ]),
  locales: Object.freeze(['en', 'ms', 'zh-CN']),
  assessment: Object.freeze({
    slug: 'initial-cyber-wellness-v1',
    questions: 12,
    options: 48,
    topics: Object.freeze([
      'phishing_and_scams',
      'password_and_account_security',
      'privacy_and_personal_information',
      'misinformation_and_deepfakes',
    ]),
  }),
  scenarios: Object.freeze({ definitions: 8, steps: 24, options: 72 }),
  resources: Object.freeze({ articles: 9, ragEligibleArticles: 6 }),
});

const CONTENT_QUERIES = Object.freeze({
  migrationFiles: `
    SELECT filename
    FROM schema_migrations
    ORDER BY migration_id
  `,
  assessment: `
    SELECT
      COUNT(DISTINCT ad.id) AS definitions,
      COUNT(DISTINCT aq.id) AS questions,
      COUNT(DISTINCT aq.topic_code) AS topics,
      SUM(CASE WHEN aq.prompt <> '' AND aq.explanation <> '' THEN 1 ELSE 0 END) AS englishQuestions,
      (SELECT COUNT(*) FROM assessment_definition_translations adt WHERE adt.locale = 'ms') AS msDefinitions,
      (SELECT COUNT(*) FROM assessment_question_translations aqt WHERE aqt.locale = 'ms') AS msQuestions,
      (SELECT COUNT(*) FROM assessment_option_translations aot WHERE aot.locale = 'ms') AS msOptions,
      (SELECT COUNT(*) FROM assessment_definition_translations adt WHERE adt.locale = 'zh-CN') AS zhDefinitions,
      (SELECT COUNT(*) FROM assessment_question_translations aqt WHERE aqt.locale = 'zh-CN') AS zhQuestions,
      (SELECT COUNT(*) FROM assessment_option_translations aot WHERE aot.locale = 'zh-CN') AS zhOptions
    FROM assessment_definitions ad
    JOIN assessment_questions aq ON aq.assessment_id = ad.id
    WHERE ad.slug = 'initial-cyber-wellness-v1'
      AND ad.version = 1
      AND ad.status = 'published'
      AND aq.status = 'published'
  `,
  assessmentTopics: `
    SELECT DISTINCT aq.topic_code
    FROM assessment_questions aq
    JOIN assessment_definitions ad ON ad.id = aq.assessment_id
    WHERE ad.slug = 'initial-cyber-wellness-v1'
      AND ad.version = 1
      AND aq.status = 'published'
    ORDER BY aq.topic_code
  `,
  scenario: `
    SELECT
      COUNT(DISTINCT sd.id) AS definitions,
      SUM(CASE WHEN sd.status = 'published' THEN 1 ELSE 0 END) AS publishedDefinitions,
      (SELECT COUNT(*) FROM scenario_steps) AS steps,
      (SELECT COALESCE(SUM(JSON_LENGTH(ss.options_json)), 0) FROM scenario_steps ss) AS options,
      (SELECT COUNT(*) FROM scenario_definition_translations sdt WHERE sdt.locale = 'en') AS enDefinitions,
      (SELECT COUNT(*) FROM scenario_step_translations sst WHERE sst.locale = 'en') AS enSteps,
      (SELECT COUNT(*) FROM scenario_option_translations sot WHERE sot.locale = 'en') AS enOptions,
      (SELECT COUNT(*) FROM scenario_definition_translations sdt WHERE sdt.locale = 'ms') AS msDefinitions,
      (SELECT COUNT(*) FROM scenario_step_translations sst WHERE sst.locale = 'ms') AS msSteps,
      (SELECT COUNT(*) FROM scenario_option_translations sot WHERE sot.locale = 'ms') AS msOptions,
      (SELECT COUNT(*) FROM scenario_definition_translations sdt WHERE sdt.locale = 'zh-CN') AS zhDefinitions,
      (SELECT COUNT(*) FROM scenario_step_translations sst WHERE sst.locale = 'zh-CN') AS zhSteps,
      (SELECT COUNT(*) FROM scenario_option_translations sot WHERE sot.locale = 'zh-CN') AS zhOptions
    FROM scenario_definitions sd
    WHERE sd.version = 1
  `,
  resource: `
    SELECT
      COUNT(*) AS articles,
      SUM(CASE WHEN ra.status = 'published' THEN 1 ELSE 0 END) AS publishedArticles,
      SUM(CASE WHEN ra.source_url IS NOT NULL
                    AND ra.source_type IS NOT NULL
                    AND ra.source_country IS NOT NULL
                    AND ra.source_authority_level IS NOT NULL
                    AND ra.review_status IS NOT NULL
                    AND ra.rag_ready_reason IS NOT NULL
               THEN 1 ELSE 0 END) AS completeMetadata,
      (SELECT COUNT(*) FROM resource_article_translations rat WHERE rat.locale = 'en') AS enTranslations,
      (SELECT COUNT(*) FROM resource_article_translations rat WHERE rat.locale = 'ms') AS msTranslations,
      (SELECT COUNT(*) FROM resource_article_translations rat WHERE rat.locale = 'zh-CN') AS zhTranslations,
      SUM(CASE WHEN ra.status = 'published' AND ra.review_status = 'approved' AND ra.rag_ready = 1
               THEN 1 ELSE 0 END) AS ragEligibleArticles,
      (SELECT COUNT(*)
         FROM resource_article_translations rat
         JOIN resource_articles eligible ON eligible.id = rat.resource_id
        WHERE eligible.status = 'published'
          AND eligible.review_status = 'approved'
          AND eligible.rag_ready = 1) AS ragEligibleTranslations
    FROM resource_articles ra
  `,
  rag: `
    SELECT
      (SELECT COUNT(*) FROM rag_documents) AS documents,
      (SELECT COUNT(*) FROM rag_chunks) AS chunks,
      (SELECT COUNT(*) FROM (
         SELECT resource_id, locale, content_type
         FROM rag_documents
         GROUP BY resource_id, locale, content_type
         HAVING COUNT(*) > 1
       ) duplicate_documents) AS duplicateIdentities,
      (SELECT COUNT(*)
         FROM rag_chunks rc
         LEFT JOIN rag_documents rd ON rd.id = rc.document_id
        WHERE rd.id IS NULL) AS orphanChunks,
      (SELECT COUNT(*)
         FROM resource_article_translations rat
         JOIN resource_articles ra ON ra.id = rat.resource_id
         LEFT JOIN rag_documents rd
           ON rd.resource_id = ra.id
          AND rd.locale = rat.locale
          AND rd.content_type = 'resource'
        WHERE ra.status = 'published'
          AND ra.review_status = 'approved'
          AND ra.rag_ready = 1
          AND rd.id IS NULL) AS missingEligibleTranslations
  `,
});

function assertReadOnlyQueries(queries) {
  for (const [name, sql] of Object.entries(queries)) {
    assert.match(sql.trim(), /^(?:SELECT|WITH)\b/i, `${name} must begin with SELECT or WITH`);
    assert.doesNotMatch(
      sql,
      /\b(?:INSERT|UPDATE|DELETE|REPLACE|ALTER|CREATE|DROP|TRUNCATE|CALL|SET)\b/i,
      `${name} must remain read-only`
    );
  }
}

function numericRow(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key, Number(value)]));
}

function verifyMigrationState(appliedMigrationFiles, repositoryMigrationFiles = listMigrationFiles()) {
  assert.equal(
    repositoryMigrationFiles.length,
    CONTENT_CONTRACT.repositoryMigrationCount,
    'repository migration inventory does not match the content contract'
  );

  const uniqueApplied = new Set(appliedMigrationFiles);
  assert.equal(uniqueApplied.size, appliedMigrationFiles.length, 'duplicate applied migration record');
  assert.ok(
    appliedMigrationFiles.length <= repositoryMigrationFiles.length,
    'more applied migrations than repository migrations'
  );

  const expectedAppliedPrefix = repositoryMigrationFiles.slice(0, appliedMigrationFiles.length);
  assert.deepEqual(
    appliedMigrationFiles,
    expectedAppliedPrefix,
    'applied migration sequence does not match repository order'
  );

  const pending = repositoryMigrationFiles.slice(appliedMigrationFiles.length);
  const allowedPending = new Set(CONTENT_CONTRACT.allowedPendingMigrationFiles);
  assert.ok(
    pending.every((filename) => allowedPending.has(filename)),
    `unexpected pending migration: ${pending.join(', ') || '(none)'}`
  );

  return {
    repositoryCount: repositoryMigrationFiles.length,
    appliedCount: appliedMigrationFiles.length,
    highestApplied: appliedMigrationFiles.at(-1) || null,
    pending,
  };
}

function verifyContentRows(rows, expectedMigrationFiles = listMigrationFiles()) {
  const migrations = verifyMigrationState(rows.migrationFiles, expectedMigrationFiles);

  const assessment = numericRow(rows.assessment);
  assert.equal(assessment.definitions, 1);
  assert.equal(assessment.questions, CONTENT_CONTRACT.assessment.questions);
  assert.equal(assessment.topics, CONTENT_CONTRACT.assessment.topics.length);
  assert.equal(assessment.englishQuestions, CONTENT_CONTRACT.assessment.questions);
  for (const prefix of ['ms', 'zh']) {
    assert.equal(assessment[`${prefix}Definitions`], 1);
    assert.equal(assessment[`${prefix}Questions`], CONTENT_CONTRACT.assessment.questions);
    assert.equal(assessment[`${prefix}Options`], CONTENT_CONTRACT.assessment.options);
  }
  assert.deepEqual([...rows.assessmentTopics].sort(), [...CONTENT_CONTRACT.assessment.topics].sort());

  const scenario = numericRow(rows.scenario);
  assert.equal(scenario.definitions, CONTENT_CONTRACT.scenarios.definitions);
  assert.equal(scenario.publishedDefinitions, CONTENT_CONTRACT.scenarios.definitions);
  assert.equal(scenario.steps, CONTENT_CONTRACT.scenarios.steps);
  assert.equal(scenario.options, CONTENT_CONTRACT.scenarios.options);
  for (const prefix of ['en', 'ms', 'zh']) {
    assert.equal(scenario[`${prefix}Definitions`], CONTENT_CONTRACT.scenarios.definitions);
    assert.equal(scenario[`${prefix}Steps`], CONTENT_CONTRACT.scenarios.steps);
    assert.equal(scenario[`${prefix}Options`], CONTENT_CONTRACT.scenarios.options);
  }

  const resource = numericRow(rows.resource);
  assert.equal(resource.articles, CONTENT_CONTRACT.resources.articles);
  assert.equal(resource.publishedArticles, CONTENT_CONTRACT.resources.articles);
  assert.equal(resource.completeMetadata, CONTENT_CONTRACT.resources.articles);
  for (const prefix of ['en', 'ms', 'zh']) {
    assert.equal(resource[`${prefix}Translations`], CONTENT_CONTRACT.resources.articles);
  }
  assert.equal(resource.ragEligibleArticles, CONTENT_CONTRACT.resources.ragEligibleArticles);
  assert.equal(
    resource.ragEligibleTranslations,
    CONTENT_CONTRACT.resources.ragEligibleArticles * CONTENT_CONTRACT.locales.length
  );

  const rag = numericRow(rows.rag);
  const expectedDocuments = resource.ragEligibleTranslations;
  assert.equal(rag.duplicateIdentities, 0);
  assert.equal(rag.orphanChunks, 0);

  let ragState;
  if (rag.documents === 0 && rag.chunks === 0 && rag.missingEligibleTranslations === expectedDocuments) {
    ragState = 'empty';
  } else if (
    rag.documents === expectedDocuments &&
    rag.chunks > 0 &&
    rag.missingEligibleTranslations === 0
  ) {
    ragState = 'populated';
  } else {
    throw new Error('RAG tables are in an unexpected partial or inconsistent state.');
  }

  return { migrations, assessment, scenario, resource, rag: { ...rag, expectedDocuments }, ragState };
}

async function collectContentRows(pool) {
  assertReadOnlyQueries(CONTENT_QUERIES);
  const [migrationRows] = await pool.query(CONTENT_QUERIES.migrationFiles);
  const [[assessment]] = await pool.query(CONTENT_QUERIES.assessment);
  const [topicRows] = await pool.query(CONTENT_QUERIES.assessmentTopics);
  const [[scenario]] = await pool.query(CONTENT_QUERIES.scenario);
  const [[resource]] = await pool.query(CONTENT_QUERIES.resource);
  const [[rag]] = await pool.query(CONTENT_QUERIES.rag);
  return {
    migrationFiles: migrationRows.map((row) => row.filename),
    assessment,
    assessmentTopics: topicRows.map((row) => row.topic_code),
    scenario,
    resource,
    rag,
  };
}

async function run() {
  validateStagingDatabaseEnvironment(process.env);
  const pool = createPool();
  try {
    const result = verifyContentRows(await collectContentRows(pool));
    console.log('Staging content verification passed.');
    const highestMigration = result.migrations.highestApplied?.split('_')[0] || 'none';
    const pendingMigrations = result.migrations.pending.map((filename) => filename.split('_')[0]);
    console.log(
      `Migrations: repository ${result.migrations.repositoryCount}, applied ${result.migrations.appliedCount}, `
      + `highest ${highestMigration}, pending ${pendingMigrations.join(', ') || 'none'}.`
    );
    console.log(`Assessment: ${result.assessment.questions} questions across ${result.assessment.topics} topics.`);
    console.log(`Scenarios: ${result.scenario.definitions} published definitions, ${result.scenario.steps} steps.`);
    console.log(`Resources: ${result.resource.articles} published, ${result.resource.ragEligibleArticles} RAG eligible.`);
    console.log(`RAG state: ${result.ragState}. Documents: ${result.rag.documents}. Chunks: ${result.rag.chunks}.`);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  run().catch((error) => {
    console.error(`Staging content verification failed: ${error.message}`);
    process.exitCode = 1;
  });
}

module.exports = {
  CONTENT_CONTRACT,
  CONTENT_QUERIES,
  assertReadOnlyQueries,
  collectContentRows,
  verifyMigrationState,
  verifyContentRows,
};
