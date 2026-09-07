const assert = require('node:assert/strict');
const { test } = require('node:test');
const { createResourceService } = require('../src/resource/resource.service');
const { createScenarioRepository } = require('../src/scenario/scenario.repository');

const target = 'suspicious-parcel-delivery-sms';
const row = {
  id: 1, slug: 'phishing', category_code: 'Scams', title: 'Phishing',
  summary: 'A guide', content_json: '["Paragraph"]', source_url: null,
  source_label: null, display_order: 1,
};
const expected = {
  id: 1, slug: 'phishing', categoryCode: 'Scams', title: 'Phishing',
  summary: 'A guide', content: ['Paragraph'], sourceUrl: null,
  sourceLabel: null, displayOrder: 1,
};

function setup({ slug = 'phishing', status = 'published', missing = false, failure = null } = {}) {
  const queries = [];
  // Exercise the actual published lookup without accessing a database.
  const scenarioRepository = createScenarioRepository({
    async query(sql, params) {
      queries.push(params);
      assert.match(sql, /sd\.status = 'published'/);
      assert.match(sql, /sd\.slug = \?/);
      assert.match(sql, /ORDER BY sd\.version DESC/);
      if (failure) throw failure;
      return [status === 'published' && params[1] === target
        ? [{ slug: target, id: 99, title: 'Private detail', content: 'Do not expose' }]
        : []];
    },
  });
  const repository = {
    async listPublishedResources() { return [{ ...row, slug }]; },
    async findPublishedBySlug(requestedSlug) {
      assert.equal(requestedSlug, slug);
      return missing ? null : { ...row, slug };
    },
  };
  return { service: createResourceService(repository, scenarioRepository), queries };
}

test('published approved pair adds only a slug to Resource detail in every locale', async () => {
  for (const locale of ['en', 'ms', 'zh-CN']) {
    const { service, queries } = setup();
    assert.deepEqual(await service.getResource(' Phishing ', locale), {
      resource: { ...expected, relatedScenario: { slug: target } },
    });
    assert.equal(queries.length, 1);
    assert.equal(queries[0][1], target);
  }
});

test('list retains exact existing shape and never resolves a Scenario', async () => {
  const { service, queries } = setup();
  assert.deepEqual(await service.listResources('en'), { resources: [expected] });
  assert.equal(queries.length, 0);
});

test('unmapped and prototype-like slugs have no relation or fallback query', async () => {
  for (const slug of ['password-security', 'constructor', '__proto__', 'tostring']) {
    const { service, queries } = setup({ slug });
    assert.deepEqual(await service.getResource(slug), {
      resource: { ...expected, slug, relatedScenario: null },
    });
    assert.equal(queries.length, 0);
  }
});

test('missing, draft and archived targets leave the article successful with null relation', async () => {
  for (const status of ['missing', 'draft', 'archived']) {
    const { service, queries } = setup({ status });
    assert.deepEqual(await service.getResource('phishing'), {
      resource: { ...expected, relatedScenario: null },
    });
    assert.equal(queries.length, 1);
  }
});

test('missing Resource preserves 404 and does not resolve a Scenario', async () => {
  const { service, queries } = setup({ missing: true });
  await assert.rejects(service.getResource('phishing'), {
    status: 404, code: 'RESOURCE_NOT_FOUND',
  });
  assert.equal(queries.length, 0);
});

test('lookup infrastructure failure is not disguised as an absent relation', async () => {
  const failure = new Error('Controlled lookup failure');
  const { service } = setup({ failure });
  await assert.rejects(service.getResource('phishing'), error => error === failure);
});

test('registry returns only the approved mapping, including safe prototype-key rejection', () => {
  const { getRelatedScenarioSlug } = require('../src/resource/resourceScenarioRegistry');
  assert.equal(getRelatedScenarioSlug('phishing'), target);
  for (const slug of ['unknown', 'constructor', '__proto__', 'toString']) {
    assert.equal(getRelatedScenarioSlug(slug), null);
  }
});

test('list-only construction remains supported; missing mapped dependency fails explicitly', async () => {
  const repository = {
    async listPublishedResources() { return [row]; },
    async findPublishedBySlug() { return row; },
  };
  for (const dependency of [undefined, {}]) {
    const service = createResourceService(repository, dependency);
    assert.deepEqual(await service.listResources(), { resources: [expected] });
    await assert.rejects(service.getResource('phishing'), /Scenario repository.*findPublishedBySlug/);
  }
});
