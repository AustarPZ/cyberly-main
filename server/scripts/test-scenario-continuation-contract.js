const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createScenarioRepository } = require('../src/scenario/scenario.repository');
const { createScenarioService } = require('../src/scenario/scenario.service');

// No pool/bootstrap import: this double models fixture rows, not a SQL engine.
// SQL assertions make a missing scope predicate/filter/limit regression observable.
const definition = (id = 10, status = 'published') => ({
  id, slug: `scenario-${id}`, title: `Base ${id}`, status,
  topic_code: 'phishing_and_scams', difficulty: 'beginner',
});
const attempt = (id, scenarioId = 10, extra = {}) => ({
  id, scenario_id: scenarioId, user_id: 7, status: 'in_progress',
  current_step_order: 2, started_at: '2026-01-01 00:00:00', ...extra,
});
const forbidden = () => { throw new Error('Forbidden write or external dependency'); };

function setup({ attempts = [], definitions = [definition()], translations = [], failAt = 0, corrupt, userId = 7 } = {}) {
  const calls = [];
  const pool = {
    getConnection: forbidden, execute: forbidden, beginTransaction: forbidden,
    commit: forbidden, rollback: forbidden,
    async query(sql, params) {
      const query = sql.replace(/\s+/g, ' ').trim();
      assert.match(query, /^SELECT /);
      assert.doesNotMatch(query, /\b(INSERT|UPDATE|DELETE|REPLACE|ALTER|DROP|CREATE|TRUNCATE|START TRANSACTION|COMMIT|ROLLBACK|CALL)\b/i);
      calls.push({ query, params });
      if (calls.length === failAt) throw new Error('Controlled query failure');
      if (query.startsWith('SELECT COUNT(*)')) {
        assert.match(query, /WHERE user_id = \? AND status = 'completed'/);
        assert.deepEqual(params, [userId]);
        return [[{ completed_count: attempts.filter(row => row.user_id === params[0] && row.status === 'completed').length }]];
      }
      const completed = query.includes("sa.status = 'completed'");
      assert.match(query, new RegExp(`WHERE sa\\.user_id = \\? AND sa\\.status = '${completed ? 'completed' : 'in_progress'}'`));
      assert.equal(params.length, 2);
      assert.equal(params[1], userId);
      assert.match(query, /COALESCE\(requested.title, english.title, sd.title\) AS title/);
      assert.match(query, /LEFT JOIN scenario_definition_translations requested ON requested.scenario_id = sd.id AND requested.locale = \?/);
      assert.match(query, /LEFT JOIN scenario_definition_translations english ON english.scenario_id = sd.id AND english.locale = 'en'/);
      if (completed) {
        assert.match(query, /ORDER BY sa.completed_at DESC, sa.id DESC LIMIT 1$/);
      } else {
        assert.match(query, /LEFT JOIN scenario_definitions sd ON sd.id = sa.scenario_id/);
        assert.match(query, /sd.id AS definition_id/);
        assert.match(query, /ORDER BY sa.started_at DESC, sa.id DESC$/);
        assert.match(query, /WHERE sa.user_id = \? AND sa.status = 'in_progress' ORDER BY/);
        assert.doesNotMatch(query, /\b(LIMIT|OFFSET|DISTINCT|GROUP BY)\b/i);
        assert.doesNotMatch(query, /sd\.status|sd\.topic_code\s*=|sd\.difficulty\s*=/);
        assert.doesNotMatch(query, /sa\.\*|selected_option|percentage|total_score|result_level/);
      }
      const rows = attempts.filter(row => row.user_id === params[1] && row.status === (completed ? 'completed' : 'in_progress'))
        .sort((a, b) => {
          const key = completed ? 'completed_at' : 'started_at';
          return String(b[key]).localeCompare(String(a[key])) || b.id - a.id;
        }).map(row => {
          const scenario = definitions.find(item => item.id === row.scenario_id);
          const localized = locale => translations.find(item => item.scenario_id === row.scenario_id && item.locale === locale)?.title;
          return { ...row, definition_id: scenario?.id ?? null, slug: scenario?.slug ?? null,
            title: localized(params[0]) ?? localized('en') ?? scenario?.title ?? null,
            topic_code: scenario?.topic_code ?? null, difficulty: scenario?.difficulty ?? null };
        });
      return [completed ? rows.slice(0, 1) : (corrupt ? corrupt(rows) : rows)];
    },
  };
  const repository = createScenarioRepository(pool);
  // Keep actual query implementation; every other repository/service dependency
  // is forbidden on the dashboard path, including reads that reconcile records.
  const guardedRepository = new Proxy(repository, {
    get(target, key) { return key === 'listCompletedScenarioStats' ? target[key] : forbidden; },
  });
  const progress = new Proxy({}, { get: () => forbidden });
  return { repository, calls, service: createScenarioService(guardedRepository, progress) };
}

test('zero unfinished returns confirmed empty array and legacy null', async () => {
  const { service, calls } = setup();
  assert.deepEqual(await service.getScenarioDashboard(7, 'en'), {
    completedCount: 0, latestCompleted: null, inProgress: null, inProgressAttempts: [],
  });
  assert.equal(calls.length, 3);
});

test('one attempt preserves every legacy field and exposes only three new fields', async () => {
  const { service } = setup({ attempts: [attempt(21)] });
  assert.deepEqual(await service.getScenarioDashboard(7, 'en'), {
    completedCount: 0, latestCompleted: null,
    inProgress: { attemptId: 21, slug: 'scenario-10', title: 'Base 10', topicCode: 'phishing_and_scams', difficulty: 'beginner', currentStepOrder: 2 },
    inProgressAttempts: [{ attemptId: 21, scenarioSlug: 'scenario-10', title: 'Base 10' }],
  });
});

test('enumerates different Scenarios and distinct attempts for the same Scenario', async () => {
  const { service } = setup({ attempts: [attempt(30), attempt(2, 11), attempt(8)], definitions: [definition(), definition(11)] });
  const result = await service.getScenarioDashboard(7);
  assert.deepEqual(result.inProgressAttempts, [
    { attemptId: 2, scenarioSlug: 'scenario-11', title: 'Base 11' },
    { attemptId: 8, scenarioSlug: 'scenario-10', title: 'Base 10' },
    { attemptId: 30, scenarioSlug: 'scenario-10', title: 'Base 10' },
  ]);
});

test('legacy latest uses timestamp then ID; public identity ordering cannot mutate repository rows', async () => {
  const { repository } = setup({ attempts: [attempt(40), attempt(2, 10, { started_at: '2026-02-01' }), attempt(3, 10, { started_at: '2026-02-01' })] });
  const stats = await repository.listCompletedScenarioStats(7);
  assert.equal(stats.inProgress, stats.inProgressAttempts[0]);
  stats.inProgressAttempts.forEach(Object.freeze);
  Object.freeze(stats.inProgressAttempts);
  Object.freeze(stats);
  const service = createScenarioService({ listCompletedScenarioStats: async () => stats }, new Proxy({}, { get: () => forbidden }));
  const result = await service.getScenarioDashboard(7);
  assert.equal(result.inProgress.attemptId, 3);
  assert.deepEqual(result.inProgressAttempts.map(row => row.attemptId), [2, 3, 40]);
  assert.deepEqual(stats.inProgressAttempts.map(row => row.id), [3, 2, 40]);
});

for (const status of ['published', 'archived', 'draft']) {
  test(`${status} definition does not affect unfinished membership`, async () => {
    const { service } = setup({ attempts: [attempt(21)], definitions: [definition(10, status)] });
    assert.deepEqual((await service.getScenarioDashboard(7)).inProgressAttempts, [{ attemptId: 21, scenarioSlug: 'scenario-10', title: 'Base 10' }]);
  });
}

test('owner/status scope excludes other users, completed and abandoned attempts', async () => {
  const { service } = setup({ attempts: [attempt(1), attempt(2, 10, { user_id: 8 }), attempt(3, 10, { status: 'abandoned' }),
    attempt(4, 10, { status: 'completed', completed_at: '2026-03-01', percentage: 80, result_level: 'proficient' })] });
  const result = await service.getScenarioDashboard(7);
  assert.deepEqual(result.inProgressAttempts.map(row => row.attemptId), [1]);
  assert.equal(result.completedCount, 1);
  assert.deepEqual(result.latestCompleted, { attemptId: 4, slug: 'scenario-10', title: 'Base 10', topicCode: 'phishing_and_scams', difficulty: 'beginner', percentage: 80, resultLevel: 'proficient' });
});

test('a different authenticated owner is bound without exposing the first owner', async () => {
  const { service } = setup({ userId: 8, attempts: [attempt(1), attempt(2, 10, { user_id: 8 })] });
  assert.deepEqual((await service.getScenarioDashboard(8)).inProgressAttempts, [
    { attemptId: 2, scenarioSlug: 'scenario-10', title: 'Base 10' },
  ]);
});

test('locale changes title only; missing translations fall back to English then base', async () => {
  const translations = [{ scenario_id: 10, locale: 'en', title: 'English' }, { scenario_id: 10, locale: 'ms', title: 'Bahasa Melayu' }, { scenario_id: 10, locale: 'zh-CN', title: '中文' }];
  for (const [locale, title] of [['en', 'English'], ['ms', 'Bahasa Melayu'], ['zh-CN', '中文']]) {
    const { service } = setup({ attempts: [attempt(21)], translations });
    assert.deepEqual((await service.getScenarioDashboard(7, locale)).inProgressAttempts, [{ attemptId: 21, scenarioSlug: 'scenario-10', title }]);
  }
  for (const [entries, title] of [[translations.slice(0, 1), 'English'], [[], 'Base 10']]) {
    const { service } = setup({ attempts: [attempt(21)], translations: entries });
    assert.equal((await service.getScenarioDashboard(7, 'ms')).inProgressAttempts[0].title, title);
  }
});

for (const failAt of [1, 2, 3]) {
  test(`query ${failAt} failure propagates instead of returning empty coverage`, async () => {
    await assert.rejects(setup({ failAt }).service.getScenarioDashboard(7), /Controlled query failure/);
  });
}

test('orphan among valid attempts rejects the entire response', async () => {
  await assert.rejects(setup({ attempts: [attempt(1), attempt(2, 999)] }).service.getScenarioDashboard(7), /^Error: Invalid unfinished scenario contract$/);
});

for (const patch of [{ id: 0 }, { id: '21' }, { id: Number.MAX_SAFE_INTEGER + 1 }, { definition_id: null },
  { definition_id: 99 }, { scenario_id: -1 }, { slug: 'bad/slug' }, { slug: null }, { title: null }]) {
  test(`malformed unfinished row rejects rather than filtering: ${JSON.stringify(patch)}`, async () => {
    const { service } = setup({ attempts: [attempt(21)], corrupt: rows => [{ ...rows[0], ...patch }] });
    await assert.rejects(service.getScenarioDashboard(7), /Invalid unfinished scenario contract/);
  });
}

test('duplicate returned attempt ID is an integrity failure, not silent deduplication', async () => {
  await assert.rejects(setup({ attempts: [attempt(21)], corrupt: rows => [rows[0], rows[0]] }).service.getScenarioDashboard(7), /Invalid unfinished scenario contract/);
});

test('missing repository array cannot manufacture complete empty coverage', async () => {
  const service = createScenarioService({ listCompletedScenarioStats: async () => ({ completedCount: 0, latestCompleted: null, inProgress: null }) }, {});
  await assert.rejects(service.getScenarioDashboard(7), /Invalid unfinished scenario contract/);
});

test('one complete SELECT serves both unfinished outputs without any mutation or recommendation calls', async () => {
  const { service, calls } = setup({ attempts: Array.from({ length: 150 }, (_, index) => attempt(index + 1)) });
  const result = await service.getScenarioDashboard(7);
  assert.equal(result.inProgressAttempts.length, 150);
  assert.equal(result.inProgress.attemptId, 150);
  assert.equal(calls.length, 3);
  assert.equal(calls.filter(call => call.query.includes("sa.status = 'in_progress'")).length, 1);
});
