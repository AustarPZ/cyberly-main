// Static migration contract checks only: no pool, environment loading or DB access.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { splitSqlStatements, listMigrationFiles } = require('../src/database/migration-utils');
const { getRelatedScenarioSlug } = require('../src/resource/resourceScenarioRegistry');

const filename = '033_repair_verified_resource_sources.sql';
const file = path.join(__dirname, '../migrations', filename);
const statements = () => splitSqlStatements(fs.readFileSync(file, 'utf8'));

test('forward source repair exists after 032 without rewriting seed ownership', () => {
  assert.ok(fs.existsSync(file), 'append-only source correction is missing');
  assert.equal(listMigrationFiles().at(-1), filename);
});

test('repair map is exactly the five authorized complete source tuples', () => {
  const insert = statements().find(s => s.startsWith('INSERT INTO rf01_source_map'));
  const rows = [...insert.slice(insert.indexOf('VALUES') + 6).matchAll(/\(((?:\s*'[^']*'\s*,?)+)\)/g)].map(m => [...m[1].matchAll(/'([^']*)'/g)].map(v => v[1]));
  const expected = [
  [
    "phishing",
    "https://www.csa.gov.sg/our-programmes/cybersecurity-outreach/cybersecurity-awareness/resources/phishing",
    "https://www.csa.gov.sg/our-programmes/cybersecurity-outreach/cybersecurity-campaigns/the-unseen-enemy-campaign/beware-of-phishing-scams/",
    "Cyber Security Agency of Singapore",
    "Cyber Security Agency of Singapore (CSA) — Beware of Phishing Scams",
    "government_cybersecurity_agency",
    "government_cybersecurity_agency",
    "SG",
    "SG",
    "official_agency",
    "official_agency"
  ],
  [
    "online-scams",
    "https://www.nsrc.my/",
    "https://www.malaysia.gov.my/en/categories/safety-community-and-law--order/cybersecurity/nsrc-997-hotline",
    "National Scam Response Centre (NSRC) Malaysia",
    "Government of Malaysia — NSRC 997 Hotline",
    "government_response_center",
    "official_portal",
    "MY",
    "MY",
    "official_national_response",
    "official_portal"
  ],
  [
    "ai-generated-content",
    "https://www.mcmc.gov.my/en/media/press-clippings/understanding-ai-generated-content",
    "https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.100-4.pdf",
    "Malaysian Communications and Multimedia Commission (MCMC)",
    "NIST — Reducing Risks Posed by Synthetic Content",
    "government_regulator_page",
    "official_portal",
    "MY",
    "US",
    "official_press_or_media_page",
    "official_agency"
  ],
  [
    "deepfakes",
    "https://www.interpol.int/en/Crimes/Cybercrime/Deepfakes",
    "https://www.interpol.int/en/How-we-work/Innovation/Projects/Project-SynthWave",
    "INTERPOL — Deepfakes Resource",
    "INTERPOL — Project SynthWave",
    "international_law_enforcement",
    "international_law_enforcement",
    "global",
    "global",
    "recognised_international",
    "recognised_international"
  ],
  [
    "cyberbullying",
    "https://www.unicef.org/malaysia/what-is-cyberbullying",
    "https://www.unicef.org/stories/how-to-stop-cyberbullying",
    "UNICEF Malaysia — Cyberbullying Resources",
    "UNICEF — Cyberbullying: What is it and how to stop it",
    "ngo_child_safety",
    "recognised_ngo",
    "MY",
    "global",
    "recognised_ngo",
    "recognised_ngo"
  ]
];
  assert.deepEqual(rows, expected);
  const oldUrls = expected.map(r => r[1]);
  rows.forEach(r => {
    assert.equal(r.length, 11);
    assert.ok(!oldUrls.includes(r[2]));
    assert.ok(!/cisa\.gov.*Using-AI-Tip-Sheet/i.test(r[2]));
  });
});

test('only source metadata and revision timestamps are update targets', () => {
  const updates = statements().filter(s => /^UPDATE /i.test(s));
  assert.equal(updates.length, 2);
  const assigned = updates.flatMap(s => [...s.split(/\bSET\b/)[1].split(/\bWHERE\b/)[0]
    .matchAll(/(?:^|,)\s*[rt]\.([a-z_]+)\s*=/g)].map(m => m[1]));
  assert.deepEqual(assigned, ['source_url', 'source_type', 'source_country', 'source_authority_level', 'updated_at', 'source_label', 'updated_at']);
  updates.forEach(s => assert.match(s, /JOIN rf01_source_map m ON BINARY r\.slug = BINARY m\.slug/));
  assert.match(updates[1], /t\.locale IN \('en', 'ms', 'zh-CN'\)/);
  assert.ok(statements().every(s => !/^(?:INSERT INTO|DELETE FROM) resource_/i.test(s)));
});

test('locking and fail-closed assertions precede any resource update', () => {
  const all = statements();
  const firstUpdate = all.findIndex(s => /^UPDATE /i.test(s));
  const prefix = all.slice(0, firstUpdate).join('\n');
  assert.equal((prefix.match(/FOR UPDATE/g) || []).length, 2);
  assert.match(prefix, /CREATE TEMPORARY TABLE rf01_assert \(id INT PRIMARY KEY\)/);
  assert.match(prefix, /INSERT INTO rf01_assert VALUES \(1\)/);
  const guards = all.filter(s => s.startsWith('INSERT INTO rf01_assert SELECT 1 WHERE'));
  assert.equal(guards.length, 2);
  assert.match(guards[0], /<> 5/);
  assert.match(guards[1], /<> 15/);
  assert.match(guards[0], /BINARY r\.source_url = BINARY m\.old_url/);
  assert.match(guards[0], /BINARY r\.source_url = BINARY m\.new_url/);
  assert.match(guards[1], /BINARY t\.source_label IN \(BINARY m\.old_label, BINARY m\.new_label\)/);
  // No persistent DDL or transaction boundary may defeat runner rollback.
  assert.ok(all.every(s => !/^(?:ALTER|TRUNCATE|COMMIT|START TRANSACTION|CREATE (?!TEMPORARY)|DROP (?!TEMPORARY))/i.test(s)));
});

test('repeat application does not bump unchanged source/translation revisions', () => {
  const updates = statements().filter(s => /^UPDATE /i.test(s));
  assert.match(updates[0], /WHERE NOT \(/);
  assert.match(updates[0], /EXISTS \(/);
  assert.match(updates[1], /AND BINARY t\.source_label <> BINARY m\.new_label/);
  assert.match(updates[0], /updated_at = CURRENT_TIMESTAMP/);
  assert.match(updates[1], /updated_at = CURRENT_TIMESTAMP\(3\)/);
});

test('phishing keeps the exact canonical Scenario relationship', () => {
  assert.equal(getRelatedScenarioSlug('phishing'), 'suspicious-parcel-delivery-sms');
  for (const slug of ['online-scams', 'deepfakes', 'cyberbullying', 'ai-generated-content']) {
    assert.equal(getRelatedScenarioSlug(slug), null);
  }
});
