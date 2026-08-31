const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const express = require('express');
const { applicationErrorMiddleware } = require('../src/errors/applicationError.middleware');

const {
  PRIVACY_REQUEST_STATUSES,
  buildActiveScopeKey,
  isCancellableStatus,
} = require('../src/privacy/privacyRequest.constants');
const {
  normalizeCreatePrivacyRequest,
  normalizePrivacyReference,
} = require('../src/privacy/privacyRequest.validation');
const {
  createPrivacyRequestReferenceGenerator,
} = require('../src/privacy/privacyRequest.reference');
const { mapLearnerPrivacyRequest } = require('../src/privacy/privacyRequest.mapper');
const { createPrivacyRequestService } = require('../src/privacy/privacyRequest.service');
const { createPrivacyRequestRateLimiters } = require('../src/privacy/privacyRequest.rateLimits');
const { createPrivacyRequestRouter } = require('../src/privacy/privacyRequest.routes');

const NOW = new Date('2026-08-29T10:00:00.000Z');
const CLIENT_ID = '550e8400-e29b-41d4-a716-446655440000';
const PASSWORD = 'Correct-Horse-42';

function learner(overrides = {}) {
  return {
    id: 41,
    passwordHash: 'stored-password-hash',
    role: 'user',
    accountStatus: 'active',
    emailVerifiedAt: NOW,
    ...overrides,
  };
}

function request(overrides = {}) {
  return {
    id: 1,
    userId: 41,
    publicReference: 'CY-PR-0123456789ABCDEFGHJK',
    requestType: 'CORRECTION',
    requestSubtype: 'ACCOUNT_OR_PROFILE_RECORD',
    dataCategory: null,
    requestDetail: 'Incorrect profile record.',
    status: 'SUBMITTED',
    locale: 'en',
    clientRequestId: CLIENT_ID,
    createdAt: NOW,
    updatedAt: NOW,
    closedAt: null,
    ...overrides,
  };
}

function createHarness({ credential = learner(), lockedCredential = credential, passwordValid = true } = {}) {
  const rows = [];
  const events = [];
  const calls = [];
  const repository = {
    async findLearnerCredentialSnapshot(userId) {
      calls.push('snapshot');
      return credential ? { ...credential, id: Number(userId) } : null;
    },
    async findByUserAndClientRequestId(userId, clientRequestId) {
      return rows.find(row => row.userId === userId && row.clientRequestId === clientRequestId) || null;
    },
    async findActiveByUserAndScope(userId, scope) {
      return rows.find(row => row.userId === userId
        && buildActiveScopeKey(row.requestType, row.requestSubtype) === scope
        && isCancellableStatus(row.status)) || null;
    },
    async listByUser(userId) {
      return rows.filter(row => row.userId === userId).sort((a, b) => b.id - a.id);
    },
    async findByUserAndReference(userId, reference) {
      return rows.find(row => row.userId === userId && row.publicReference === reference) || null;
    },
    async transaction(work) {
      calls.push('begin');
      const snapshotRows = rows.map(row => ({ ...row }));
      const snapshotEvents = events.map(event => ({ ...event }));
      const repo = {
        async lockLearnerForUpdate() { calls.push('lock'); return lockedCredential; },
        findByUserAndClientRequestId: repository.findByUserAndClientRequestId,
        findActiveByUserAndScope: repository.findActiveByUserAndScope,
        async insertRequest(payload) {
          const row = request({ id: rows.length + 1, ...payload });
          rows.push(row);
          return row;
        },
        async insertEvent(payload) { events.push({ id: events.length + 1, ...payload }); },
        findByUserAndReferenceForUpdate: repository.findByUserAndReference,
        async cancelIfStatus({ requestId, statuses, cancelledAt }) {
          const row = rows.find(item => item.id === requestId);
          if (!row || !statuses.includes(row.status)) return null;
          row.status = 'CANCELLED';
          row.closedAt = cancelledAt;
          row.updatedAt = cancelledAt;
          return row;
        },
      };
      try {
        const value = await work(repo);
        calls.push('commit');
        return value;
      } catch (error) {
        rows.splice(0, rows.length, ...snapshotRows);
        events.splice(0, events.length, ...snapshotEvents);
        calls.push('rollback');
        throw error;
      }
    },
  };
  const service = createPrivacyRequestService({
    repository,
    passwordComparer: async password => passwordValid && password === PASSWORD,
    referenceGenerator: () => `CY-PR-${String(rows.length + 1).padStart(20, '0')}`,
    now: () => NOW,
  });
  return { calls, events, repository, rows, service };
}

async function expectCode(promise, code, status) {
  await assert.rejects(promise, error => {
    assert.equal(error.code, code);
    if (status) assert.equal(error.status, status);
    return true;
  });
}

async function captureError(promise, code, status) {
  try {
    await promise;
  } catch (error) {
    assert.equal(error.code, code);
    assert.equal(error.status, status);
    return error;
  }
  assert.fail(`Expected ${code}.`);
}

function testConstantsAndValidation() {
  assert.deepEqual(PRIVACY_REQUEST_STATUSES, [
    'SUBMITTED', 'UNDER_REVIEW', 'NEEDS_INFORMATION', 'COMPLETED', 'DECLINED', 'CANCELLED',
  ]);
  assert.equal(buildActiveScopeKey('DELETION', 'SELECTED_PERSONAL_DATA'), 'DELETION');
  assert.equal(buildActiveScopeKey('CORRECTION', 'CHAT_OR_AI_RECORD'), 'CORRECTION:CHAT_OR_AI_RECORD');
  assert.equal(isCancellableStatus('NEEDS_INFORMATION'), true);
  assert.equal(isCancellableStatus('COMPLETED'), false);

  assert.deepEqual(normalizeCreatePrivacyRequest({
    type: 'CORRECTION', subtype: 'ACCOUNT_OR_PROFILE_RECORD',
    detail: '  Incorrect\r\nrecord.  ', clientRequestId: CLIENT_ID,
  }), {
    type: 'CORRECTION', subtype: 'ACCOUNT_OR_PROFILE_RECORD', dataCategory: null,
    detail: 'Incorrect\nrecord.', clientRequestId: CLIENT_ID, currentPassword: null,
  });
  assert.equal(normalizeCreatePrivacyRequest({
    type: 'DELETION', subtype: 'WHOLE_ACCOUNT_AND_ASSOCIATED_DATA',
    clientRequestId: CLIENT_ID, currentPassword: PASSWORD,
  }).detail, null);
  assert.equal(normalizeCreatePrivacyRequest({
    type: 'DELETION', subtype: 'SELECTED_PERSONAL_DATA', dataCategory: 'CHAT',
    detail: 'Remove chat records.', clientRequestId: CLIENT_ID, currentPassword: PASSWORD,
  }).dataCategory, 'CHAT');

  for (const body of [
    { type: 'CORRECTION', subtype: 'SELECTED_PERSONAL_DATA', detail: 'x', clientRequestId: CLIENT_ID },
    { type: 'DELETION', subtype: 'SELECTED_PERSONAL_DATA', dataCategory: 'ARBITRARY', detail: 'x', clientRequestId: CLIENT_ID, currentPassword: PASSWORD },
    { type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: '', clientRequestId: CLIENT_ID },
    { type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: 'x'.repeat(1001), clientRequestId: CLIENT_ID },
    { type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: 'x\u0000', clientRequestId: CLIENT_ID },
    { type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: 'x', clientRequestId: CLIENT_ID, status: 'COMPLETED' },
    { type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: 'x', clientRequestId: CLIENT_ID, currentPassword: PASSWORD },
    { type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: 'x', clientRequestId: CLIENT_ID, userId: 99 },
  ]) assert.throws(() => normalizeCreatePrivacyRequest(body), error => error.code === 'PRIVACY_REQUEST_INVALID');
}

function testReferenceAndMapper() {
  const generator = createPrivacyRequestReferenceGenerator();
  const references = new Set(Array.from({ length: 50 }, () => generator()));
  assert.equal(references.size, 50);
  for (const reference of references) assert.match(reference, /^CY-PR-[0-9A-HJKMNP-TV-Z]{20}$/);
  assert.equal(normalizePrivacyReference('cy-pr-0123456789abcdefghjk'), 'CY-PR-0123456789ABCDEFGHJK');
  assert.throws(() => normalizePrivacyReference('CY-PR-BAD'), error => error.code === 'PRIVACY_REQUEST_INVALID');

  const mapped = mapLearnerPrivacyRequest(request());
  assert.deepEqual(Object.keys(mapped), [
    'reference', 'type', 'subtype', 'dataCategory', 'detail', 'status',
    'submittedAt', 'updatedAt', 'cancellable',
  ]);
  assert.equal(JSON.stringify(mapped).includes('clientRequestId'), false);
  assert.equal(JSON.stringify(mapped).includes('userId'), false);
}

async function testService() {
  let harness = createHarness();
  const correction = await harness.service.createRequest(41, {
    type: 'CORRECTION', subtype: 'ACCOUNT_OR_PROFILE_RECORD', detail: 'Incorrect profile record.',
    clientRequestId: CLIENT_ID,
  });
  assert.equal(correction.created, true);
  assert.equal(correction.request.status, 'SUBMITTED');
  assert.deepEqual(harness.calls, ['snapshot', 'begin', 'lock', 'commit']);
  assert.equal(harness.events.length, 1);
  assert.equal(harness.events[0].eventType, 'SUBMITTED');
  assert.equal(JSON.stringify(harness.rows).includes(PASSWORD), false);

  const replay = await harness.service.createRequest(41, {
    type: 'CORRECTION', subtype: 'ACCOUNT_OR_PROFILE_RECORD', detail: 'Incorrect profile record.',
    clientRequestId: CLIENT_ID,
  });
  assert.equal(replay.created, false);
  assert.equal(replay.request.reference, correction.request.reference);
  await expectCode(harness.service.createRequest(41, {
    type: 'CORRECTION', subtype: 'ACCOUNT_OR_PROFILE_RECORD', detail: 'Changed payload.',
    clientRequestId: CLIENT_ID,
  }), 'PRIVACY_REQUEST_IDEMPOTENCY_CONFLICT', 409);
  const activeCorrectionError = await captureError(harness.service.createRequest(41, {
    type: 'CORRECTION', subtype: 'ACCOUNT_OR_PROFILE_RECORD', detail: 'Another request.',
    clientRequestId: '550e8400-e29b-41d4-a716-446655440001',
  }), 'PRIVACY_REQUEST_ALREADY_ACTIVE', 409);
  assert.equal(activeCorrectionError.existingReference, correction.request.reference);
  assert.equal(activeCorrectionError.details, undefined);

  harness = createHarness({ passwordValid: false });
  await expectCode(harness.service.createRequest(41, {
    type: 'DELETION', subtype: 'WHOLE_ACCOUNT_AND_ASSOCIATED_DATA',
    clientRequestId: CLIENT_ID, currentPassword: PASSWORD,
  }), 'PRIVACY_REQUEST_PASSWORD_INVALID', 401);
  assert.deepEqual(harness.calls, ['snapshot']);
  assert.equal(harness.rows.length, 0);

  harness = createHarness();
  await expectCode(harness.service.createRequest(41, {
    type: 'DELETION', subtype: 'WHOLE_ACCOUNT_AND_ASSOCIATED_DATA', clientRequestId: CLIENT_ID,
  }), 'PRIVACY_REQUEST_PASSWORD_REQUIRED', 400);
  const deletion = await harness.service.createRequest(41, {
    type: 'DELETION', subtype: 'WHOLE_ACCOUNT_AND_ASSOCIATED_DATA',
    clientRequestId: CLIENT_ID, currentPassword: PASSWORD,
  });
  assert.equal(deletion.request.type, 'DELETION');
  assert.equal(JSON.stringify(deletion).includes(PASSWORD), false);
  const activeDeletionError = await captureError(harness.service.createRequest(41, {
    type: 'DELETION', subtype: 'SELECTED_PERSONAL_DATA', dataCategory: 'CHAT',
    detail: 'Remove chat records.', currentPassword: PASSWORD,
    clientRequestId: '550e8400-e29b-41d4-a716-446655440002',
  }), 'PRIVACY_REQUEST_ALREADY_ACTIVE', 409);
  assert.equal(activeDeletionError.existingReference, deletion.request.reference);
  assert.equal(activeDeletionError.details, undefined);

  const listed = await harness.service.listRequests(41);
  assert.equal(listed.length, 1);
  assert.equal((await harness.service.getRequest(41, deletion.request.reference)).reference, deletion.request.reference);
  await expectCode(harness.service.getRequest(99, deletion.request.reference), 'PRIVACY_REQUEST_NOT_FOUND', 404);
  const cancelled = await harness.service.cancelRequest(41, deletion.request.reference);
  assert.equal(cancelled.status, 'CANCELLED');
  assert.equal(cancelled.cancellable, false);
  assert.equal(harness.events.filter(event => event.eventType === 'CANCELLED').length, 1);
  await expectCode(harness.service.cancelRequest(41, deletion.request.reference), 'PRIVACY_REQUEST_NOT_CANCELLABLE', 409);

  for (const credential of [learner({ role: 'admin' }), learner({ accountStatus: 'disabled' })]) {
    harness = createHarness({ credential });
    await expectCode(harness.service.listRequests(41), credential.role === 'admin' ? 'AUTH_FORBIDDEN' : 'AUTH_ACCOUNT_DISABLED');
  }

  harness = createHarness({
    credential: learner({ passwordHash: 'snapshot-hash' }),
    lockedCredential: learner({ passwordHash: 'rotated-hash' }),
  });
  const correctionAfterPasswordRotation = await harness.service.createRequest(41, {
    type: 'CORRECTION', subtype: 'OTHER_PERSONAL_DATA', detail: 'Correction detail.',
    clientRequestId: '550e8400-e29b-41d4-a716-446655440009',
  });
  assert.equal(correctionAfterPasswordRotation.request.status, 'SUBMITTED');

  for (const sourceStatus of ['UNDER_REVIEW', 'NEEDS_INFORMATION']) {
    harness = createHarness();
    const created = await harness.service.createRequest(41, {
      type: 'CORRECTION', subtype: 'OTHER_PERSONAL_DATA', detail: 'Correction detail.',
      clientRequestId: `550e8400-e29b-41d4-a716-4466554400${sourceStatus === 'UNDER_REVIEW' ? '10' : '11'}`,
    });
    harness.rows[0].status = sourceStatus;
    const result = await harness.service.cancelRequest(41, created.request.reference);
    assert.equal(result.status, 'CANCELLED');
    assert.equal(harness.rows[0].closedAt, NOW);
    const cancellationEvents = harness.events.filter(event => event.eventType === 'CANCELLED');
    assert.equal(cancellationEvents.length, 1);
    assert.equal(cancellationEvents[0].fromStatus, sourceStatus);
    await expectCode(
      harness.service.cancelRequest(41, created.request.reference),
      'PRIVACY_REQUEST_NOT_CANCELLABLE', 409
    );
    assert.equal(harness.events.filter(event => event.eventType === 'CANCELLED').length, 1);
  }

  for (const terminalStatus of ['COMPLETED', 'DECLINED', 'CANCELLED']) {
    harness = createHarness();
    const created = await harness.service.createRequest(41, {
      type: 'CORRECTION', subtype: 'OTHER_PERSONAL_DATA', detail: 'Correction detail.',
      clientRequestId: `550e8400-e29b-41d4-a716-4466554400${terminalStatus === 'COMPLETED' ? '12' : terminalStatus === 'DECLINED' ? '13' : '14'}`,
    });
    harness.rows[0].status = terminalStatus;
    await expectCode(
      harness.service.cancelRequest(41, created.request.reference),
      'PRIVACY_REQUEST_NOT_CANCELLABLE', 409
    );
    assert.equal(harness.events.filter(event => event.eventType === 'CANCELLED').length, 0);
  }
}

async function testDuplicateRaceRecovery() {
  const existing = request({
    id: 77,
    publicReference: 'CY-PR-0123456789ABCDEFGHJK',
    requestType: 'CORRECTION',
    requestSubtype: 'CHAT_OR_AI_RECORD',
    requestDetail: 'Concurrent request.',
    clientRequestId: '550e8400-e29b-41d4-a716-446655440099',
  });
  let raceVisible = false;
  const duplicate = new Error("Duplicate entry for key 'uq_privacy_requests_active_scope'");
  duplicate.code = 'ER_DUP_ENTRY';
  const repository = {
    async findLearnerCredentialSnapshot() { return learner(); },
    async findByUserAndClientRequestId() { return null; },
    async findActiveByUserAndScope(userId) { return raceVisible && userId === 41 ? existing : null; },
    async transaction(work) {
      return work({
        async lockLearnerForUpdate() { return learner(); },
        async findByUserAndClientRequestId() { return null; },
        async findActiveByUserAndScope() { return null; },
        async insertRequest() { raceVisible = true; throw duplicate; },
      });
    },
  };
  const service = createPrivacyRequestService({
    repository,
    passwordComparer: async () => true,
    referenceGenerator: () => 'CY-PR-0123456789ABCDEFGHJM',
    now: () => NOW,
  });
  const error = await captureError(service.createRequest(41, {
    type: 'CORRECTION', subtype: 'CHAT_OR_AI_RECORD', detail: 'Concurrent request.',
    clientRequestId: CLIENT_ID,
  }), 'PRIVACY_REQUEST_ALREADY_ACTIVE', 409);
  assert.equal(error.existingReference, existing.publicReference);
  assert.equal(error.details, undefined);
}

function runLimiter(limiter, req) {
  return new Promise(resolve => {
    const response = { headers: {}, statusCode: 200,
      set(name, value) { this.headers[name] = value; },
      status(code) { this.statusCode = code; return this; },
      json(body) { resolve({ status: this.statusCode, headers: this.headers, body }); },
    };
    limiter(req, response, () => resolve({ status: 200, headers: response.headers }));
  });
}

async function testRateLimits() {
  const limits = createPrivacyRequestRateLimiters({ now: () => 0 });
  const req = { ip: '127.0.0.1', session: { userId: 41 } };
  for (let i = 0; i < 5; i += 1) assert.equal((await runLimiter(limits.submissionUser, req)).status, 200);
  const blocked = await runLimiter(limits.submissionUser, req);
  assert.equal(blocked.status, 429);
  assert.equal(blocked.body.code, 'PRIVACY_REQUEST_RATE_LIMITED');
  assert.ok(blocked.headers['Retry-After']);
  for (let i = 0; i < 10; i += 1) assert.equal((await runLimiter(limits.submissionIp, req)).status, 200);
  assert.equal((await runLimiter(limits.submissionIp, req)).status, 429);
  for (let i = 0; i < 10; i += 1) assert.equal((await runLimiter(limits.cancellationUser, req)).status, 200);
  assert.equal((await runLimiter(limits.cancellationUser, req)).status, 429);
  for (let i = 0; i < 60; i += 1) assert.equal((await runLimiter(limits.readUser, req)).status, 200);
  assert.equal((await runLimiter(limits.readUser, req)).status, 429);
}

async function testHttpRoutes() {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (req.headers['x-test-user']) req.session = { userId: Number(req.headers['x-test-user']) };
    next();
  });
  const pass = (_req, _res, next) => next();
  const service = {
    async createRequest(userId, body) {
      if (body.mode === 'duplicate' || body.mode === 'malformed-duplicate') {
        const error = new Error('An active Privacy Request already exists for this scope.');
        error.status = 409;
        error.code = 'PRIVACY_REQUEST_ALREADY_ACTIVE';
        error.existingReference = body.mode === 'duplicate'
          ? 'CY-PR-0123456789ABCDEFGHJK'
          : 'CY-PR-<private-unexpected-value>';
        error.details = { internalField: 'must-not-pass-through', userId: 41 };
        throw error;
      }
      if (body.mode === 'generic-details') {
        const error = new Error('Generic application error.');
        error.status = 503;
        error.code = 'AI_TEST_ERROR';
        error.details = {
          internalField: 'private', providerMetadata: 'private', traceData: 'private',
        };
        throw error;
      }
      return { created: true, request: { reference: `CY-PR-${String(userId).padStart(20, '0')}` } };
    },
    async listRequests() { return []; },
    async getRequest(_userId, reference) { return { reference }; },
    async cancelRequest(_userId, reference) { return { reference, status: 'CANCELLED' }; },
  };
  app.use('/api/privacy', createPrivacyRequestRouter(service, {
    submissionIp: pass, submissionUser: pass, cancellationUser: pass, readUser: pass,
  }));
  app.use(applicationErrorMiddleware);
  const server = await new Promise(resolve => {
    const listener = app.listen(0, '127.0.0.1', () => resolve(listener));
  });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    let response = await fetch(`${base}/api/privacy/requests`);
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, 'AUTH_REQUIRED');
    response = await fetch(`${base}/api/privacy/requests`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': '41' }, body: '{}',
    });
    assert.equal(response.status, 201);
    assert.deepEqual(Object.keys(await response.json()), ['request']);
    response = await fetch(`${base}/api/privacy/requests`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': '41' },
      body: JSON.stringify({ mode: 'duplicate' }),
    });
    assert.equal(response.status, 409);
    let errorBody = await response.json();
    assert.deepEqual(errorBody.details, { existingReference: 'CY-PR-0123456789ABCDEFGHJK' });
    assert.deepEqual(Object.keys(errorBody.details), ['existingReference']);
    assert.doesNotMatch(JSON.stringify(errorBody), /internalField|userId|clientRequestId|password|hash|event/);
    response = await fetch(`${base}/api/privacy/requests`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': '41' },
      body: JSON.stringify({ mode: 'malformed-duplicate' }),
    });
    assert.equal(response.status, 409);
    errorBody = await response.json();
    assert.equal(errorBody.details, undefined);
    assert.doesNotMatch(JSON.stringify(errorBody), /private-unexpected-value|internalField|userId/);
    response = await fetch(`${base}/api/privacy/requests`, {
      method: 'POST', headers: { 'content-type': 'application/json', 'x-test-user': '41' },
      body: JSON.stringify({ mode: 'generic-details' }),
    });
    assert.equal(response.status, 503);
    errorBody = await response.json();
    assert.deepEqual(errorBody, { code: 'AI_TEST_ERROR', message: 'Generic application error.' });
    assert.doesNotMatch(JSON.stringify(errorBody), /details|internalField|providerMetadata|traceData/);
    response = await fetch(`${base}/api/privacy/requests/CY-PR-00000000000000000041/cancel`, {
      method: 'POST', headers: { 'x-test-user': '41' },
    });
    assert.equal(response.status, 200);
    assert.equal((await response.json()).request.status, 'CANCELLED');
  } finally {
    await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

function testRouteAndMigrationContracts() {
  const serverSource = fs.readFileSync(path.resolve(__dirname, '../server.js'), 'utf8');
  assert.match(serverSource, /app\.use\(['"]\/api\/privacy['"],\s*createPrivacyRequestRouter/);
  const routeSource = fs.readFileSync(
    path.resolve(__dirname, '../src/privacy/privacyRequest.routes.js'), 'utf8'
  );
  for (const route of [
    "router.post('/requests'",
    "router.get('/requests'",
    "router.get('/requests/:reference'",
    "router.post('/requests/:reference/cancel'",
  ]) assert.ok(routeSource.includes(route), `missing route ${route}`);
  assert.doesNotMatch(routeSource, /execute|\/status|\/admin/i);

  const migration = fs.readFileSync(
    path.resolve(__dirname, '../migrations/031_create_privacy_requests.sql'), 'utf8'
  );
  assert.match(migration, /CREATE TABLE IF NOT EXISTS privacy_requests/i);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS privacy_request_events/i);
  assert.match(migration, /ON DELETE SET NULL/i);
  assert.match(migration, /ON DELETE CASCADE/i);
  assert.match(migration, /uq_privacy_requests_active_scope/i);
  assert.doesNotMatch(migration, /DELETE\s+FROM\s+users|DROP\s+TABLE|CREATE\s+TRIGGER/i);
}

(async () => {
  testConstantsAndValidation();
  testReferenceAndMapper();
  await testService();
  await testDuplicateRaceRecovery();
  await testRateLimits();
  await testHttpRoutes();
  testRouteAndMigrationContracts();
  console.log('Privacy Request backend verification passed.');
})().catch(error => {
  console.error(error.stack || error.code || error.message);
  process.exitCode = 1;
});
