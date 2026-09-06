const { ERROR_CODES } = require('../errors/errorCodes');
const { normalizeEmail } = require('../auth/validation');
const { GUARDIAN_LINK_TTL_MS } = require('./guardianLink.constants');
const { normalizeGuardianEmail, normalizeGuardianReference, normalizeGuardianToken, normalizeLocale } = require('./guardianLink.validation');
const { createGuardianLinkToken, hashGuardianLinkToken } = require('./guardianLink.token');
const { mapLearnerGuardianLink, mapPublicGuardianLink } = require('./guardianLink.mapper');
const { buildGuardianVerificationLink } = require('./guardianLinkEmail.service');
const { duplicateIndex } = require('./guardianLink.repository');

function serviceError(status, code, message, extra = {}) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  Object.assign(error, extra);
  return error;
}

function assertEligibleLearner(row, { requireVerified = false } = {}) {
  if (!row || row.role !== 'user' || row.accountStatus !== 'active') {
    throw serviceError(401, ERROR_CODES.AUTH_REQUIRED, 'Authentication is required.');
  }
  if (requireVerified && !row.emailVerifiedAt) {
    throw serviceError(403, ERROR_CODES.EMAIL_VERIFICATION_REQUIRED, 'Verify your email before using Guardian Link.');
  }
}

function createGuardianLinkService({
  repository,
  passwordComparer,
  referenceGenerator,
  tokenFactory = createGuardianLinkToken,
  emailSender,
  clientBaseUrl = '',
  now = () => new Date(),
  logger = console,
}) {
  async function verifyPassword(learner, password) {
    if (!String(password || '')) {
      throw serviceError(400, ERROR_CODES.GUARDIAN_LINK_PASSWORD_REQUIRED, 'Current password is required.');
    }
    if (!await passwordComparer(String(password), learner.passwordHash)) {
      throw serviceError(401, ERROR_CODES.GUARDIAN_LINK_PASSWORD_INVALID, 'Current password is incorrect.');
    }
  }

  async function expireIfOverdue(repo, row, timestamp, audit = {}) {
    if (!row || row.status !== 'PENDING_VERIFICATION' || new Date(row.inviteExpiresAt) > timestamp) return row;
    const updated = await repo.updateRelationship(row.id, {
      status: 'EXPIRED', expiredAt: timestamp, updatedAt: timestamp,
    });
    await repo.insertEvent({ relationshipId: row.id, eventType: 'EXPIRED',
      fromStatus: 'PENDING_VERIFICATION', toStatus: 'EXPIRED', actorType: 'SYSTEM',
      createdAt: timestamp, ...audit });
    return updated;
  }

  function activeConflict(row) {
    throw serviceError(409, ERROR_CODES.GUARDIAN_LINK_ACTIVE_EXISTS,
      'An active Guardian Link already exists.', { existingReference: row?.publicReference });
  }

  async function allocateAndInsert(repo, payload) {
    let lastError;
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const reference = referenceGenerator();
      const token = tokenFactory();
      try {
        const row = await repo.insertRelationship({ ...payload, publicReference: reference,
          inviteTokenHash: token.tokenHash });
        return { row, token };
      } catch (error) {
        const index = duplicateIndex(error);
        if (index === 'uq_guardian_relationships_active_learner') throw error;
        if (!['uq_guardian_relationships_public_reference', 'uq_guardian_relationships_invite_token_hash'].includes(index)) throw error;
        lastError = error;
      }
    }
    throw serviceError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Unable to allocate Guardian Link credentials.', { cause: lastError });
  }

  async function createInvitation({ userId, guardianEmail, currentPassword, locale = 'en', requestIp, userAgent }) {
    const normalizedEmail = normalizeGuardianEmail(guardianEmail);
    const snapshot = await repository.findLearnerCredentialSnapshot(userId);
    assertEligibleLearner(snapshot, { requireVerified: true });
    if (normalizedEmail === normalizeEmail(snapshot.email)) {
      throw serviceError(400, ERROR_CODES.GUARDIAN_LINK_INVALID, 'Your own account email cannot be used as a Guardian contact.');
    }
    await verifyPassword(snapshot, currentPassword);
    let issued;
    try {
      issued = await repository.transaction(async repo => {
        const lockedLearner = await repo.lockLearnerForUpdate(userId);
        assertEligibleLearner(lockedLearner, { requireVerified: true });
        if (normalizedEmail === normalizeEmail(lockedLearner.email)) {
          throw serviceError(400, ERROR_CODES.GUARDIAN_LINK_INVALID, 'Your own account email cannot be used as a Guardian contact.');
        }
        await verifyPassword(lockedLearner, currentPassword);
        const timestamp = now();
        let active = await repo.lockActiveByLearner(userId);
        active = await expireIfOverdue(repo, active, timestamp, { requestIp, userAgent });
        if (active && ['PENDING_VERIFICATION', 'LINKED'].includes(active.status)) activeConflict(active);
        const allocated = await allocateAndInsert(repo, {
          learnerUserId: lockedLearner.id, guardianEmailNormalized: normalizedEmail,
          locale: normalizeLocale(locale), inviteIssuedAt: timestamp,
          inviteExpiresAt: new Date(timestamp.getTime() + GUARDIAN_LINK_TTL_MS),
          createdAt: timestamp, updatedAt: timestamp,
        });
        await repo.insertEvent({ relationshipId: allocated.row.id, eventType: 'INVITED',
          fromStatus: null, toStatus: 'PENDING_VERIFICATION', actorType: 'LEARNER',
          requestIp, userAgent, createdAt: timestamp });
        return { ...allocated, learner: lockedLearner };
      });
    } catch (error) {
      if (duplicateIndex(error) === 'uq_guardian_relationships_active_learner') {
        const active = await repository.findActiveByLearner(userId);
        activeConflict(active);
      }
      throw error;
    }
    const sent = await emailSender.sendGuardianInvitation({ recipientEmail: normalizedEmail,
      learnerDisplayName: issued.learner.displayName,
      verificationUrl: buildGuardianVerificationLink(clientBaseUrl, issued.token.rawToken), locale: issued.row.locale });
    if (sent?.ok !== false) return { created: true, relationship: mapLearnerGuardianLink(issued.row) };

    const compensation = await repository.transaction(async repo => {
      const current = await repo.lockById(issued.row.id);
      if (!current || current.status !== 'PENDING_VERIFICATION' || current.inviteTokenHash !== issued.token.tokenHash) return current;
      const timestamp = now();
      const revoked = await repo.updateRelationship(current.id, { status: 'REVOKED', revokedAt: timestamp, updatedAt: timestamp });
      await repo.insertEvent({ relationshipId: current.id, eventType: 'REVOKED',
        fromStatus: 'PENDING_VERIFICATION', toStatus: 'REVOKED', actorType: 'SYSTEM', createdAt: timestamp });
      return revoked;
    });
    if (compensation?.status === 'REVOKED' && compensation.inviteTokenHash === issued.token.tokenHash) {
      throw serviceError(503, ERROR_CODES.EMAIL_SEND_FAILED, 'Guardian invitation email could not be sent.');
    }
    logger.warn('Guardian invitation delivery warning', { code: ERROR_CODES.EMAIL_SEND_FAILED,
      reference: issued.row.publicReference });
    return { created: true, relationship: mapLearnerGuardianLink(compensation) };
  }

  async function getCurrentRelationship(userId) {
    const learner = await repository.findLearnerCredentialSnapshot(userId);
    assertEligibleLearner(learner);
    return repository.transaction(async repo => {
      const rows = await repo.lockCurrentCandidatesByLearner(userId);
      const timestamp = now();
      for (const row of rows) await expireIfOverdue(repo, row, timestamp);
      return mapLearnerGuardianLink(await repo.findCurrentByLearner(userId));
    });
  }

  async function resendInvitation({ userId, reference, requestIp, userAgent }) {
    const normalizedReference = normalizeGuardianReference(reference);
    const learner = await repository.findLearnerCredentialSnapshot(userId);
    assertEligibleLearner(learner, { requireVerified: true });
    const issued = await repository.transaction(async repo => {
      const lockedLearner = await repo.lockLearnerForUpdate(userId);
      assertEligibleLearner(lockedLearner, { requireVerified: true });
      let row = await repo.lockByLearnerAndReference(userId, normalizedReference);
      if (!row) throw serviceError(404, ERROR_CODES.GUARDIAN_LINK_NOT_FOUND, 'Guardian Link was not found.');
      const timestamp = now();
      row = await expireIfOverdue(repo, row, timestamp, { requestIp, userAgent });
      if (row.status !== 'PENDING_VERIFICATION') {
        throw serviceError(409, ERROR_CODES.GUARDIAN_LINK_NOT_RESENDABLE, 'Guardian Link cannot be resent.');
      }
      const token = tokenFactory();
      const updated = await repo.updateRelationship(row.id, { inviteTokenHash: token.tokenHash,
        inviteIssuedAt: timestamp, inviteExpiresAt: new Date(timestamp.getTime() + GUARDIAN_LINK_TTL_MS),
        inviteUsedAt: null, updatedAt: timestamp });
      await repo.insertEvent({ relationshipId: row.id, eventType: 'RESENT', fromStatus: row.status,
        toStatus: row.status, actorType: 'LEARNER', requestIp, userAgent, createdAt: timestamp });
      return { row: updated, token, learner: lockedLearner };
    });
    const sent = await emailSender.sendGuardianInvitation({ recipientEmail: issued.row.guardianEmailNormalized,
      learnerDisplayName: issued.learner.displayName,
      verificationUrl: buildGuardianVerificationLink(clientBaseUrl, issued.token.rawToken), locale: issued.row.locale });
    if (sent?.ok === false) throw serviceError(503, ERROR_CODES.EMAIL_SEND_FAILED, 'Guardian invitation email could not be sent.');
    return { relationship: mapLearnerGuardianLink(issued.row) };
  }

  function classifyToken(row) {
    if (!row) throw serviceError(400, ERROR_CODES.GUARDIAN_LINK_TOKEN_INVALID_OR_UNAVAILABLE, 'Guardian Link token is invalid or unavailable.');
    if (row.status === 'EXPIRED') throw serviceError(410, ERROR_CODES.GUARDIAN_LINK_TOKEN_EXPIRED, 'Guardian Link token has expired.');
    if (['LINKED', 'DECLINED'].includes(row.status)) throw serviceError(409, ERROR_CODES.GUARDIAN_LINK_TOKEN_TERMINAL, 'Guardian Link decision is already complete.');
    if (row.status !== 'PENDING_VERIFICATION' || row.inviteUsedAt) {
      throw serviceError(400, ERROR_CODES.GUARDIAN_LINK_TOKEN_INVALID_OR_UNAVAILABLE, 'Guardian Link token is invalid or unavailable.');
    }
  }

  async function withPublicToken(rawInput, work) {
    const rawToken = normalizeGuardianToken(rawInput);
    const hash = hashGuardianLinkToken(rawToken);
    return repository.transaction(async repo => {
      let row = await repo.lockByTokenHash(hash);
      if (!row) classifyToken(null);
      row = await expireIfOverdue(repo, row, now());
      classifyToken(row);
      return work(repo, row);
    });
  }

  function inspectToken(rawToken) {
    return withPublicToken(rawToken, async (_repo, row) => mapPublicGuardianLink(row));
  }

  async function decideToken(rawToken, decision, audit = {}) {
    const target = decision === 'ACCEPTED' ? 'LINKED' : 'DECLINED';
    const timestampField = decision === 'ACCEPTED' ? 'linkedAt' : 'declinedAt';
    const result = await withPublicToken(rawToken, async (repo, row) => {
      const timestamp = now();
      const updated = await repo.updateRelationship(row.id, { status: target, [timestampField]: timestamp,
        inviteUsedAt: timestamp, updatedAt: timestamp });
      await repo.insertEvent({ relationshipId: row.id, eventType: decision,
        fromStatus: 'PENDING_VERIFICATION', toStatus: target, actorType: 'GUARDIAN_LINK_TOKEN',
        requestIp: audit.requestIp, userAgent: audit.userAgent, createdAt: timestamp });
      return updated;
    });
    if (decision === 'ACCEPTED') {
      const sent = await emailSender.sendGuardianAcceptedConfirmation({ recipientEmail: result.guardianEmailNormalized,
        learnerDisplayName: result.learnerDisplayName, locale: result.locale });
      if (sent?.ok === false) logger.warn('Guardian accepted-notice delivery warning', { reference: result.publicReference });
    }
    return { status: target };
  }

  const acceptToken = (rawToken, audit) => decideToken(rawToken, 'ACCEPTED', audit);
  const declineToken = (rawToken, audit) => decideToken(rawToken, 'DECLINED', audit);

  async function revokeRelationship({ userId, reference, currentPassword, requestIp, userAgent }) {
    const normalizedReference = normalizeGuardianReference(reference);
    const snapshot = await repository.findLearnerCredentialSnapshot(userId);
    assertEligibleLearner(snapshot);
    await verifyPassword(snapshot, currentPassword);
    const result = await repository.transaction(async repo => {
      const lockedLearner = await repo.lockLearnerForUpdate(userId);
      assertEligibleLearner(lockedLearner);
      await verifyPassword(lockedLearner, currentPassword);
      let row = await repo.lockByLearnerAndReference(userId, normalizedReference);
      if (!row) throw serviceError(404, ERROR_CODES.GUARDIAN_LINK_NOT_FOUND, 'Guardian Link was not found.');
      const timestamp = now();
      row = await expireIfOverdue(repo, row, timestamp, { requestIp, userAgent });
      if (!['PENDING_VERIFICATION', 'LINKED'].includes(row.status)) {
        throw serviceError(409, ERROR_CODES.GUARDIAN_LINK_NOT_REVOCABLE, 'Guardian Link cannot be revoked.');
      }
      const updated = await repo.updateRelationship(row.id, { status: 'REVOKED', revokedAt: timestamp, updatedAt: timestamp });
      await repo.insertEvent({ relationshipId: row.id, eventType: 'REVOKED', fromStatus: row.status,
        toStatus: 'REVOKED', actorType: 'LEARNER', requestIp, userAgent, createdAt: timestamp });
      return updated;
    });
    const sent = await emailSender.sendGuardianRevokedNotice({ recipientEmail: result.guardianEmailNormalized,
      learnerDisplayName: result.learnerDisplayName, locale: result.locale });
    if (sent?.ok === false) logger.warn('Guardian revoked-notice delivery warning', { reference: result.publicReference });
    return mapLearnerGuardianLink(result);
  }

  return { acceptToken, createInvitation, declineToken, getCurrentRelationship,
    inspectToken, resendInvitation, revokeRelationship };
}

module.exports = { createGuardianLinkService };
