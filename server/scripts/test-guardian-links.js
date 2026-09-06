const assert = require('node:assert/strict');

const {
  GUARDIAN_LINK_STATUSES,
  GUARDIAN_LINK_EVENTS,
  GUARDIAN_LINK_ACTORS,
} = require('../src/guardian/guardianLink.constants');
const {
  normalizeGuardianEmail,
  normalizeGuardianReference,
  normalizeGuardianToken,
} = require('../src/guardian/guardianLink.validation');
const { createGuardianLinkReferenceGenerator } = require('../src/guardian/guardianLink.reference');
const { createGuardianLinkToken, hashGuardianLinkToken } = require('../src/guardian/guardianLink.token');
const { mapLearnerGuardianLink, mapPublicGuardianLink } = require('../src/guardian/guardianLink.mapper');
const { createGuardianLinkService } = require('../src/guardian/guardianLink.service');
const { createGuardianLinkRateLimiters } = require('../src/guardian/guardianLink.rateLimits');
const { createGuardianLinkSender } = require('../src/guardian/guardianLinkEmail.service');
const { createGuardianLinkRouter } = require('../src/guardian/guardianLink.routes');
const { createOriginProtection } = require('../src/security/httpSecurity');
const { applicationErrorMiddleware } = require('../src/errors/applicationError.middleware');
const express = require('express');

function assertRejectsCode(work, code, status) {
  return assert.rejects(work, error => error.code === code && error.status === status);
}

function learner(overrides = {}) {
  return {
    id: 7,
    email: 'learner@example.test',
    displayName: 'Test Learner',
    passwordHash: 'hash:correct-password',
    role: 'user',
    accountStatus: 'active',
    emailVerifiedAt: new Date('2026-01-01T00:00:00Z'),
    ...overrides,
  };
}

function relationship(overrides = {}) {
  return {
    id: 11,
    publicReference: 'CY-GL-0123456789ABCDEFGHJK',
    learnerUserId: 7,
    learnerDisplayName: 'Test Learner',
    guardianEmailNormalized: 'guardian@example.test',
    status: 'PENDING_VERIFICATION',
    locale: 'en',
    inviteTokenHash: 'a'.repeat(64),
    inviteIssuedAt: new Date('2026-08-01T00:00:00Z'),
    inviteExpiresAt: new Date('2026-08-04T00:00:00Z'),
    inviteUsedAt: null,
    createdAt: new Date('2026-08-01T00:00:00Z'),
    updatedAt: new Date('2026-08-01T00:00:00Z'),
    linkedAt: null,
    declinedAt: null,
    expiredAt: null,
    revokedAt: null,
    ...overrides,
  };
}

function createMemoryRepository(initial = {}) {
  const state = {
    learner: learner(initial.learner),
    rows: (initial.rows || []).map(row => relationship(row)),
    events: [],
    lockOrder: [],
    nextId: 20,
    compensationHook: initial.compensationHook || null,
  };

  const clone = value => value ? { ...value } : null;
  const byReference = reference => state.rows.find(row => row.publicReference === reference) || null;
  const byHash = hash => state.rows.find(row => row.inviteTokenHash === hash) || null;
  const active = () => state.rows.find(row => row.learnerUserId === state.learner.id &&
    ['PENDING_VERIFICATION', 'LINKED'].includes(row.status)) || null;

  function scoped() {
    return {
      async findLearnerCredentialSnapshot() { return clone(state.learner); },
      async lockLearnerForUpdate() { state.lockOrder.push('learner'); return clone(state.learner); },
      async findActiveByLearner() { return clone(active()); },
      async lockActiveByLearner() { state.lockOrder.push('active'); return clone(active()); },
      async findCurrentByLearner() {
        const current = active() || [...state.rows].sort((a, b) =>
          b.createdAt - a.createdAt || b.id - a.id)[0];
        return clone(current);
      },
      async lockCurrentCandidatesByLearner() {
        state.lockOrder.push('relationships');
        return state.rows.filter(row => row.learnerUserId === state.learner.id)
          .sort((a, b) => a.id - b.id).map(clone);
      },
      async findByLearnerAndReference(_userId, reference) { return clone(byReference(reference)); },
      async lockByLearnerAndReference(_userId, reference) {
        state.lockOrder.push('relationship'); return clone(byReference(reference));
      },
      async lockByTokenHash(hash) { state.lockOrder.push('token-relationship'); return clone(byHash(hash)); },
      async lockById(id) {
        state.lockOrder.push('relationship-only');
        if (state.compensationHook) await state.compensationHook(state);
        return clone(state.rows.find(row => row.id === id));
      },
      async insertRelationship(payload) {
        const row = relationship({ id: state.nextId++, ...payload });
        state.rows.push(row);
        return clone(row);
      },
      async updateRelationship(id, patch) {
        const row = state.rows.find(candidate => candidate.id === id);
        Object.assign(row, patch);
        return clone(row);
      },
      async insertEvent(event) { state.events.push({ ...event }); },
    };
  }

  const repository = scoped();
  repository.transaction = async work => work(scoped());
  repository.state = state;
  return repository;
}

function createService(repository, overrides = {}) {
  let referenceCounter = 0;
  let tokenCounter = 0;
  return createGuardianLinkService({
    repository,
    passwordComparer: async (plain, hash) => hash === `hash:${plain}`,
    referenceGenerator: () => `CY-GL-${String(referenceCounter++).padStart(20, '0')}`,
    tokenFactory: () => {
      const rawToken = `guardian-token-${String(tokenCounter++).padStart(30, '0')}`;
      return { rawToken, tokenHash: hashGuardianLinkToken(rawToken) };
    },
    emailSender: {
      sendGuardianInvitation: async () => ({ ok: true }),
      sendGuardianAcceptedConfirmation: async () => ({ ok: true }),
      sendGuardianRevokedNotice: async () => ({ ok: true }),
    },
    clientBaseUrl: 'https://staging.cyberly.my',
    now: () => new Date('2026-08-02T00:00:00Z'),
    logger: { warn() {} },
    ...overrides,
  });
}

async function run() {
  const disabledSender = createGuardianLinkSender({ transport: 'disabled' });
  assert.deepEqual(await disabledSender.sendGuardianInvitation({
    recipientEmail: 'guardian@example.test', learnerDisplayName: 'Test Learner',
    verificationUrl: 'https://example.test/#/guardian-link/verify?token=secret', locale: 'en',
  }), { ok: false, disabled: true });

  const capturedMessages = [];
  const localizedSender = createGuardianLinkSender({
    transport: 'test',
    send: async message => { capturedMessages.push(message); return { ok: true, disabled: false }; },
  });
  for (const locale of ['en', 'ms', 'zh-CN']) {
    await localizedSender.sendGuardianInvitation({
      recipientEmail: 'guardian@example.test', learnerDisplayName: '<Test Learner>',
      verificationUrl: 'https://example.test/#/guardian-link/verify?token=encoded-token', locale,
    });
    await localizedSender.sendGuardianAcceptedConfirmation({
      recipientEmail: 'guardian@example.test', learnerDisplayName: '<Test Learner>', locale,
    });
    await localizedSender.sendGuardianRevokedNotice({
      recipientEmail: 'guardian@example.test', learnerDisplayName: '<Test Learner>', locale,
    });
  }
  assert.equal(capturedMessages.length, 9);
  assert.deepEqual(capturedMessages.map(message => message.locale), [
    'en', 'en', 'en', 'ms', 'ms', 'ms', 'zh-CN', 'zh-CN', 'zh-CN',
  ]);
  assert.equal(new Set(capturedMessages.filter((_, index) => index % 3 === 0).map(message => message.subject)).size, 3);
  for (const index of [0, 3, 6]) {
    assert.match(capturedMessages[index].text, /encoded-token/);
    assert.match(capturedMessages[index].html, /&lt;Test Learner&gt;/);
    assert.doesNotMatch(capturedMessages[index].html, /<Test Learner>/);
  }
  for (const index of [1, 2, 4, 5, 7, 8]) assert.doesNotMatch(capturedMessages[index].text, /encoded-token/);
  assert.notEqual(capturedMessages[0].text, capturedMessages[3].text);
  assert.notEqual(capturedMessages[3].text, capturedMessages[6].text);
  const disclosureByLocale = [
    'No Guardian account is created. Cyberly does not verify legal guardianship, parenthood, custody or consent authority, and the Guardian contact receives no access to the learner’s account, learning information or Privacy Requests.',
    'Tiada akaun Penjaga diwujudkan. Cyberly tidak mengesahkan penjagaan sah, status ibu atau bapa, hak penjagaan atau kuasa memberikan persetujuan, dan kenalan Penjaga tidak mendapat akses kepada akaun, maklumat pembelajaran atau Permintaan Privasi pelajar.',
    '系统不会创建监护人账户。Cyberly 不验证法定监护关系、亲子关系、监护权或同意授权，监护人联系人也不会获得学习者账户、学习信息或隐私申请的访问权限。',
  ];
  for (let localeIndex = 0; localeIndex < disclosureByLocale.length; localeIndex += 1) {
    const invitationIndex = localeIndex * 3;
    const acceptedIndex = invitationIndex + 1;
    assert.match(capturedMessages[invitationIndex].text, new RegExp(disclosureByLocale[localeIndex].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.match(capturedMessages[acceptedIndex].text, new RegExp(disclosureByLocale[localeIndex].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(capturedMessages[2].text, /No Guardian account or access to learner activity, progress, chats, recovery, privacy requests, or product controls was created\./);
  assert.match(capturedMessages[5].text, /Tiada akaun Penjaga atau akses kepada aktiviti, kemajuan, sembang, pemulihan, permintaan privasi atau kawalan produk pelajar diwujudkan\./);
  assert.match(capturedMessages[8].text, /系统未创建监护人账户，也未授予学习活动、进度、聊天、账户恢复、隐私请求或产品控制权限。/);

  const routeService = {
    inspectToken: async () => ({ canAccept: true }),
    acceptToken: async () => ({ status: 'LINKED' }),
    declineToken: async () => ({ status: 'DECLINED' }),
    getCurrentRelationship: async () => null,
    createInvitation: async () => ({ relationship: { status: 'PENDING_VERIFICATION' } }),
    resendInvitation: async () => ({ relationship: { status: 'PENDING_VERIFICATION' } }),
    revokeRelationship: async () => ({ status: 'REVOKED' }),
  };
  const pass = (_req, _res, next) => next();
  const routeApp = express();
  routeApp.use(createOriginProtection({ allowedOrigin: 'https://allowed.example', requireOrigin: true }));
  routeApp.use(express.json());
  routeApp.use((req, _res, next) => {
    if (req.get('x-test-user')) req.session = { userId: 7, verified: req.get('x-test-verified') === 'yes' };
    next();
  });
  routeApp.use('/api/guardian-link', createGuardianLinkRouter(routeService, {
    publicInspectByIp: pass, publicInspectByToken: pass,
    publicDecisionByIp: pass, publicDecisionByToken: pass, readByLearner: pass,
    createByIp: pass, createByLearner: pass, resendByIp: pass,
    resendByRelationship: pass, revokeByLearner: pass,
  }, {
    requireVerifiedEmail: (req, res, next) => req.session?.verified
      ? next() : res.status(403).json({ code: 'EMAIL_VERIFICATION_REQUIRED' }),
  }));
  routeApp.use(applicationErrorMiddleware);
  const routeServer = await new Promise(resolve => {
    const instance = routeApp.listen(0, '127.0.0.1', () => resolve(instance));
  });
  try {
    const base = `http://127.0.0.1:${routeServer.address().port}/api/guardian-link`;
    const post = (path, headers = {}) => fetch(`${base}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify({ token: 'guardian-token-value-0000000000000000',
        guardianEmail: 'guardian@example.test', currentPassword: 'password' }),
    });
    assert.equal((await post('/token/inspect')).status, 403);
    assert.equal((await post('/token/inspect', { origin: 'https://allowed.example' })).status, 200);
    assert.equal((await fetch(base)).status, 401);
    assert.equal((await post('/invitations', { origin: 'https://allowed.example', 'x-test-user': 'yes' })).status, 403);
    assert.equal((await post('/invitations', { origin: 'https://allowed.example',
      'x-test-user': 'yes', 'x-test-verified': 'yes' })).status, 201);
  } finally {
    await new Promise(resolve => routeServer.close(resolve));
  }

  let decisionCalls = 0;
  const limitedRouteApp = express();
  limitedRouteApp.use(express.json());
  limitedRouteApp.use('/api/guardian-link', createGuardianLinkRouter({
    ...routeService,
    acceptToken: async () => { decisionCalls += 1; return { status: 'LINKED' }; },
  }, createGuardianLinkRateLimiters({ now: () => 0 }), { requireVerifiedEmail: pass }));
  limitedRouteApp.use(applicationErrorMiddleware);
  const limitedRouteServer = await new Promise(resolve => {
    const instance = limitedRouteApp.listen(0, '127.0.0.1', () => resolve(instance));
  });
  try {
    const base = `http://127.0.0.1:${limitedRouteServer.address().port}/api/guardian-link`;
    const postToken = path => fetch(`${base}${path}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token: 'guardian-public-budget-token' }),
    });
    for (let index = 0; index < 5; index += 1) {
      assert.equal((await postToken('/token/inspect')).status, 200);
    }
    assert.equal((await postToken('/token/accept')).status, 200);
    assert.equal(decisionCalls, 1);
  } finally {
    await new Promise(resolve => limitedRouteServer.close(resolve));
  }

  assert.deepEqual(GUARDIAN_LINK_STATUSES, [
    'PENDING_VERIFICATION', 'LINKED', 'DECLINED', 'EXPIRED', 'REVOKED',
  ]);
  assert.deepEqual(GUARDIAN_LINK_EVENTS, ['INVITED', 'RESENT', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED']);
  assert.deepEqual(GUARDIAN_LINK_ACTORS, ['LEARNER', 'GUARDIAN_LINK_TOKEN', 'SYSTEM']);

  const generateReference = createGuardianLinkReferenceGenerator({ randomBytes: size => Buffer.alloc(size, 0xff) });
  assert.match(generateReference(), /^CY-GL-[0-9A-HJKMNP-TV-Z]{20}$/);
  assert.equal(generateReference().length, 26);

  const generatedToken = createGuardianLinkToken({ randomBytes: size => Buffer.alloc(size, 7) });
  assert.equal(Buffer.from(generatedToken.rawToken, 'base64url').length, 32);
  assert.match(generatedToken.tokenHash, /^[a-f0-9]{64}$/);
  assert.equal(generatedToken.tokenHash, hashGuardianLinkToken(generatedToken.rawToken));

  assert.equal(normalizeGuardianEmail(' Guardian@Example.TEST '), 'guardian@example.test');
  assert.throws(() => normalizeGuardianEmail('x'.repeat(255)), error => error.code === 'GUARDIAN_LINK_INVALID');
  assert.equal(normalizeGuardianReference('CY-GL-0123456789ABCDEFGHJK'), 'CY-GL-0123456789ABCDEFGHJK');
  assert.throws(() => normalizeGuardianReference('cy-gl-0123456789abcdefghjk'),
    error => error.code === 'GUARDIAN_LINK_INVALID');
  assert.throws(() => normalizeGuardianReference('CY-GL-I123'), error => error.code === 'GUARDIAN_LINK_INVALID');
  assert.equal(normalizeGuardianToken(' guardian-token-value '), 'guardian-token-value');
  assert.throws(() => normalizeGuardianToken(''), error => error.code === 'GUARDIAN_LINK_TOKEN_REQUIRED');

  const pending = relationship();
  assert.deepEqual(Object.keys(mapLearnerGuardianLink(pending)), [
    'reference', 'guardianEmail', 'status', 'locale', 'invitedAt', 'expiresAt',
    'updatedAt', 'terminalAt', 'canResend', 'canRevoke',
  ]);
  assert.equal(mapLearnerGuardianLink(pending).terminalAt, null);
  assert.deepEqual(mapPublicGuardianLink(pending), {
    learnerDisplayName: 'Test Learner',
    expiresAt: '2026-08-04T00:00:00.000Z',
    canAccept: true,
    canDecline: true,
    informationCode: 'VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP',
  });

  const createRepo = createMemoryRepository();
  const created = await createService(createRepo).createInvitation({
    userId: 7,
    guardianEmail: ' GUARDIAN@example.test ',
    currentPassword: 'correct-password',
    locale: 'en',
    requestIp: '127.0.0.1',
    userAgent: 'test',
  });
  assert.equal(created.created, true);
  assert.equal(created.relationship.status, 'PENDING_VERIFICATION');
  assert.deepEqual(createRepo.state.lockOrder.slice(0, 2), ['learner', 'active']);
  assert.deepEqual(createRepo.state.events.map(event => event.eventType), ['INVITED']);

  await assertRejectsCode(() => createService(createMemoryRepository()).createInvitation({
    userId: 7, guardianEmail: 'learner@example.test', currentPassword: 'correct-password',
  }), 'GUARDIAN_LINK_INVALID', 400);
  await assertRejectsCode(() => createService(createMemoryRepository()).createInvitation({
    userId: 7, guardianEmail: 'guardian@example.test', currentPassword: 'wrong',
  }), 'GUARDIAN_LINK_PASSWORD_INVALID', 401);
  await assertRejectsCode(() => createService(createMemoryRepository({ rows: [{}] })).createInvitation({
    userId: 7, guardianEmail: 'other@example.test', currentPassword: 'correct-password',
  }), 'GUARDIAN_LINK_ACTIVE_EXISTS', 409);

  const expiredRepo = createMemoryRepository({
    rows: [{ inviteExpiresAt: new Date('2026-08-01T00:00:00Z') }],
  });
  const current = await createService(expiredRepo).getCurrentRelationship(7);
  assert.equal(current.status, 'EXPIRED');
  assert.deepEqual(expiredRepo.state.events.map(event => event.eventType), ['EXPIRED']);
  await createService(expiredRepo).getCurrentRelationship(7);
  assert.equal(expiredRepo.state.events.length, 1);

  const resendRepo = createMemoryRepository({ rows: [{}] });
  const oldHash = resendRepo.state.rows[0].inviteTokenHash;
  const resent = await createService(resendRepo).resendInvitation({ userId: 7, reference: pending.publicReference });
  assert.equal(resent.relationship.status, 'PENDING_VERIFICATION');
  assert.notEqual(resendRepo.state.rows[0].inviteTokenHash, oldHash);
  assert.equal(resendRepo.state.events[0].eventType, 'RESENT');

  const inspectToken = 'guardian-inspect-token-value-000000000000';
  const inspectRepo = createMemoryRepository({ rows: [{ inviteTokenHash: hashGuardianLinkToken(inspectToken) }] });
  const inspected = await createService(inspectRepo).inspectToken(inspectToken);
  assert.equal(inspected.learnerDisplayName, 'Test Learner');
  assert.equal(Object.hasOwn(inspected, 'guardianEmail'), false);

  const acceptRepo = createMemoryRepository({ rows: [{ inviteTokenHash: hashGuardianLinkToken(inspectToken) }] });
  const accepted = await createService(acceptRepo).acceptToken(inspectToken, { requestIp: '127.0.0.1' });
  assert.deepEqual(accepted, { status: 'LINKED' });
  assert.equal(acceptRepo.state.events[0].eventType, 'ACCEPTED');
  await assertRejectsCode(() => createService(acceptRepo).acceptToken(inspectToken),
    'GUARDIAN_LINK_TOKEN_TERMINAL', 409);

  const declineRepo = createMemoryRepository({ rows: [{ inviteTokenHash: hashGuardianLinkToken(inspectToken) }] });
  assert.deepEqual(await createService(declineRepo).declineToken(inspectToken), { status: 'DECLINED' });
  assert.equal(declineRepo.state.events[0].eventType, 'DECLINED');

  const revokeRepo = createMemoryRepository({ rows: [{}] });
  const revoked = await createService(revokeRepo).revokeRelationship({
    userId: 7, reference: pending.publicReference, currentPassword: 'correct-password',
  });
  assert.equal(revoked.status, 'REVOKED');
  assert.deepEqual(revokeRepo.state.lockOrder.slice(0, 2), ['learner', 'relationship']);

  const failedInitialRepo = createMemoryRepository();
  const failedInitialService = createService(failedInitialRepo, {
    emailSender: {
      sendGuardianInvitation: async () => ({ ok: false }),
      sendGuardianAcceptedConfirmation: async () => ({ ok: true }),
      sendGuardianRevokedNotice: async () => ({ ok: true }),
    },
  });
  await assertRejectsCode(() => failedInitialService.createInvitation({
    userId: 7, guardianEmail: 'guardian@example.test', currentPassword: 'correct-password',
  }), 'EMAIL_SEND_FAILED', 503);
  assert.equal(failedInitialRepo.state.rows[0].status, 'REVOKED');
  assert.deepEqual(failedInitialRepo.state.events.map(event => event.eventType), ['INVITED', 'REVOKED']);

  const disabledCreateRepo = createMemoryRepository();
  await assertRejectsCode(() => createService(disabledCreateRepo, { emailSender: disabledSender }).createInvitation({
    userId: 7, guardianEmail: 'guardian@example.test', currentPassword: 'correct-password',
  }), 'EMAIL_SEND_FAILED', 503);
  assert.equal(disabledCreateRepo.state.rows[0].status, 'REVOKED');
  assert.deepEqual(disabledCreateRepo.state.events.map(event => event.eventType), ['INVITED', 'REVOKED']);

  const lostRaceRepo = createMemoryRepository({
    compensationHook: async state => { state.rows[0].status = 'LINKED'; },
  });
  const lostRaceResult = await createService(lostRaceRepo, {
    emailSender: {
      sendGuardianInvitation: async () => ({ ok: false }),
      sendGuardianAcceptedConfirmation: async () => ({ ok: true }),
      sendGuardianRevokedNotice: async () => ({ ok: true }),
    },
  }).createInvitation({
    userId: 7, guardianEmail: 'guardian@example.test', currentPassword: 'correct-password',
  });
  assert.equal(lostRaceResult.relationship.status, 'LINKED');

  const failedResendRepo = createMemoryRepository({ rows: [{}] });
  await assertRejectsCode(() => createService(failedResendRepo, {
    emailSender: {
      sendGuardianInvitation: async () => ({ ok: false }),
      sendGuardianAcceptedConfirmation: async () => ({ ok: true }),
      sendGuardianRevokedNotice: async () => ({ ok: true }),
    },
  }).resendInvitation({ userId: 7, reference: pending.publicReference }), 'EMAIL_SEND_FAILED', 503);
  assert.equal(failedResendRepo.state.rows[0].status, 'PENDING_VERIFICATION');
  assert.notEqual(failedResendRepo.state.rows[0].inviteTokenHash, oldHash);

  let nowMs = 0;
  const limits = createGuardianLinkRateLimiters({ now: () => nowMs });
  assert.equal(typeof limits.createByLearner, 'function');
  assert.equal(typeof limits.publicInspectByToken, 'function');
  assert.equal(typeof limits.publicInspectByIp, 'function');
  assert.equal(typeof limits.publicDecisionByToken, 'function');
  assert.equal(typeof limits.publicDecisionByIp, 'function');
  const req = { session: { userId: 7 }, ip: '127.0.0.1', body: { token: 'secret-token' }, params: {} };
  const headers = {};
  const res = { set(name, value) { headers[name] = value; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; } };
  for (let i = 0; i < 5; i += 1) limits.createByLearner(req, res, () => {});
  limits.createByLearner(req, res, () => { throw new Error('limit should block'); });
  assert.equal(res.statusCode, 429);
  assert.equal(res.body.code, 'GUARDIAN_LINK_RATE_LIMITED');
  assert.equal(typeof headers['Retry-After'], 'string');

  function invokeLimiter(limiter, request) {
    const responseHeaders = {};
    const response = {
      set(name, value) { responseHeaders[name] = value; },
      status(value) { this.statusCode = value; return this; },
      json(value) { this.body = value; },
    };
    let allowed = false;
    limiter(request, response, () => { allowed = true; });
    return { allowed, response, responseHeaders };
  }

  const publicLimits = createGuardianLinkRateLimiters({ now: () => nowMs });
  const publicRequest = { ip: '198.51.100.8', body: { token: 'private-guardian-token' }, params: {} };
  for (let index = 0; index < 5; index += 1) {
    assert.equal(invokeLimiter(publicLimits.publicInspectByIp, publicRequest).allowed, true);
    assert.equal(invokeLimiter(publicLimits.publicInspectByToken, publicRequest).allowed, true);
  }
  assert.equal(invokeLimiter(publicLimits.publicDecisionByIp, publicRequest).allowed, true);
  assert.equal(invokeLimiter(publicLimits.publicDecisionByToken, publicRequest).allowed, true);

  const inspectTokenLimits = createGuardianLinkRateLimiters({ now: () => nowMs });
  for (let index = 0; index < 30; index += 1) {
    assert.equal(invokeLimiter(inspectTokenLimits.publicInspectByToken, publicRequest).allowed, true);
  }
  const inspectTokenBlocked = invokeLimiter(inspectTokenLimits.publicInspectByToken, publicRequest);
  assert.equal(inspectTokenBlocked.allowed, false);
  assert.equal(inspectTokenBlocked.response.statusCode, 429);
  assert.equal(inspectTokenBlocked.response.body.code, 'GUARDIAN_LINK_RATE_LIMITED');
  assert.equal(typeof inspectTokenBlocked.responseHeaders['Retry-After'], 'string');
  assert.doesNotMatch(JSON.stringify(inspectTokenBlocked), /private-guardian-token/);
  assert.equal(invokeLimiter(inspectTokenLimits.publicDecisionByToken, publicRequest).allowed, true);

  const inspectIpLimits = createGuardianLinkRateLimiters({ now: () => nowMs });
  for (let index = 0; index < 60; index += 1) {
    assert.equal(invokeLimiter(inspectIpLimits.publicInspectByIp, publicRequest).allowed, true);
  }
  assert.equal(invokeLimiter(inspectIpLimits.publicInspectByIp, publicRequest).response.statusCode, 429);
  assert.equal(invokeLimiter(inspectIpLimits.publicDecisionByIp, publicRequest).allowed, true);

  const sharedDecisionLimits = createGuardianLinkRateLimiters({ now: () => nowMs });
  for (let index = 0; index < 5; index += 1) {
    assert.equal(invokeLimiter(sharedDecisionLimits.publicDecisionByToken, publicRequest).allowed, true);
  }
  assert.equal(invokeLimiter(sharedDecisionLimits.publicDecisionByToken, publicRequest).response.statusCode, 429);
  for (let index = 0; index < 20; index += 1) {
    assert.equal(invokeLimiter(sharedDecisionLimits.publicDecisionByIp, publicRequest).allowed, true);
  }
  assert.equal(invokeLimiter(sharedDecisionLimits.publicDecisionByIp, publicRequest).response.statusCode, 429);

  console.log('Guardian Link backend contract tests passed.');
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
