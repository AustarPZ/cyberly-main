const { ERROR_CODES } = require('../errors/errorCodes');
const { CANCELLABLE_STATUSES, buildActiveScopeKey } = require('./privacyRequest.constants');
const { mapLearnerPrivacyRequest } = require('./privacyRequest.mapper');
const { duplicateIndex } = require('./privacyRequest.repository');
const { normalizeCreatePrivacyRequest, normalizePrivacyReference } = require('./privacyRequest.validation');

function requestError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function activeRequestError(row) {
  const error = requestError(
    409,
    ERROR_CODES.PRIVACY_REQUEST_ALREADY_ACTIVE,
    'An active Privacy Request already exists for this scope.'
  );
  error.existingReference = row.publicReference;
  return error;
}

function assertEligibleLearner(learner) {
  if (!learner) throw requestError(401, ERROR_CODES.AUTH_REQUIRED, 'Authentication required.');
  if (learner.role !== 'user') throw requestError(403, ERROR_CODES.AUTH_FORBIDDEN, 'Learner access required.');
  if (learner.accountStatus !== 'active') {
    throw requestError(403, ERROR_CODES.AUTH_ACCOUNT_DISABLED, 'This account is disabled.');
  }
}

function sameSemanticPayload(row, normalized) {
  return row.requestType === normalized.type
    && row.requestSubtype === normalized.subtype
    && (row.dataCategory || null) === normalized.dataCategory
    && (row.requestDetail || null) === normalized.detail;
}

function createPrivacyRequestService({
  repository,
  passwordComparer,
  referenceGenerator,
  now = () => new Date(),
} = {}) {
  async function requireLearner(userId) {
    const learner = await repository.findLearnerCredentialSnapshot(userId);
    assertEligibleLearner(learner);
    return learner;
  }

  async function createRequest(userId, body, locale = 'en') {
    const normalized = normalizeCreatePrivacyRequest(body);
    const snapshot = await requireLearner(userId);
    if (normalized.type === 'DELETION') {
      if (!normalized.currentPassword.trim()) {
        throw requestError(400, ERROR_CODES.PRIVACY_REQUEST_PASSWORD_REQUIRED, 'Current password is required.');
      }
      if (!await passwordComparer(normalized.currentPassword, snapshot.passwordHash)) {
        throw requestError(401, ERROR_CODES.PRIVACY_REQUEST_PASSWORD_INVALID, 'Current password is invalid.');
      }
    }

    const existing = await repository.findByUserAndClientRequestId(snapshot.id, normalized.clientRequestId);
    if (existing) {
      if (!sameSemanticPayload(existing, normalized)) {
        throw requestError(409, ERROR_CODES.PRIVACY_REQUEST_IDEMPOTENCY_CONFLICT, 'Client request ID was already used for a different request.');
      }
      return { created: false, request: mapLearnerPrivacyRequest(existing) };
    }

    const scope = buildActiveScopeKey(normalized.type, normalized.subtype);
    const active = await repository.findActiveByUserAndScope(snapshot.id, scope);
    if (active) {
      throw activeRequestError(active);
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await repository.transaction(async repo => {
          const locked = await repo.lockLearnerForUpdate(snapshot.id);
          assertEligibleLearner(locked);
          if (locked.id !== snapshot.id) {
            throw requestError(401, ERROR_CODES.AUTH_REQUIRED, 'Authentication required.');
          }
          if (
            normalized.type === 'DELETION'
            && !await passwordComparer(normalized.currentPassword, locked.passwordHash)
          ) {
            throw requestError(401, ERROR_CODES.PRIVACY_REQUEST_PASSWORD_INVALID, 'Current password is invalid.');
          }
          const replay = await repo.findByUserAndClientRequestId(snapshot.id, normalized.clientRequestId);
          if (replay) {
            if (!sameSemanticPayload(replay, normalized)) {
              throw requestError(409, ERROR_CODES.PRIVACY_REQUEST_IDEMPOTENCY_CONFLICT, 'Client request ID was already used for a different request.');
            }
            return { created: false, row: replay };
          }
          const duplicate = await repo.findActiveByUserAndScope(snapshot.id, scope);
          if (duplicate) {
            throw activeRequestError(duplicate);
          }
          const createdAt = now();
          const row = await repo.insertRequest({
            publicReference: referenceGenerator(),
            userId: snapshot.id,
            requestType: normalized.type,
            requestSubtype: normalized.subtype,
            dataCategory: normalized.dataCategory,
            requestDetail: normalized.detail,
            locale,
            clientRequestId: normalized.clientRequestId,
            createdAt,
          });
          await repo.insertEvent({
            requestId: row.id,
            eventType: 'SUBMITTED',
            fromStatus: null,
            toStatus: 'SUBMITTED',
            actorType: 'LEARNER',
            createdAt,
          });
          return { created: true, row };
        });
        return { created: created.created, request: mapLearnerPrivacyRequest(created.row) };
      } catch (error) {
        const index = duplicateIndex(error);
        if (index === 'uq_privacy_requests_public_reference' && attempt < 4) continue;
        if (index === 'uq_privacy_requests_user_client_request') {
          const replay = await repository.findByUserAndClientRequestId(snapshot.id, normalized.clientRequestId);
          if (replay && sameSemanticPayload(replay, normalized)) {
            return { created: false, request: mapLearnerPrivacyRequest(replay) };
          }
          throw requestError(409, ERROR_CODES.PRIVACY_REQUEST_IDEMPOTENCY_CONFLICT, 'Client request ID was already used for a different request.');
        }
        if (index === 'uq_privacy_requests_active_scope') {
          const duplicate = await repository.findActiveByUserAndScope(snapshot.id, scope);
          if (duplicate) throw activeRequestError(duplicate);
          throw requestError(409, ERROR_CODES.PRIVACY_REQUEST_ALREADY_ACTIVE, 'An active Privacy Request already exists for this scope.');
        }
        throw error;
      }
    }
    throw requestError(500, ERROR_CODES.INTERNAL_SERVER_ERROR, 'Unable to allocate a Privacy Request reference.');
  }

  async function listRequests(userId) {
    const learner = await requireLearner(userId);
    return (await repository.listByUser(learner.id)).map(mapLearnerPrivacyRequest);
  }

  async function getRequest(userId, referenceInput) {
    const reference = normalizePrivacyReference(referenceInput);
    const learner = await requireLearner(userId);
    const row = await repository.findByUserAndReference(learner.id, reference);
    if (!row) throw requestError(404, ERROR_CODES.PRIVACY_REQUEST_NOT_FOUND, 'Privacy Request not found.');
    return mapLearnerPrivacyRequest(row);
  }

  async function cancelRequest(userId, referenceInput) {
    const reference = normalizePrivacyReference(referenceInput);
    const learner = await requireLearner(userId);
    const cancelled = await repository.transaction(async repo => {
      const row = await repo.findByUserAndReferenceForUpdate(learner.id, reference);
      if (!row) throw requestError(404, ERROR_CODES.PRIVACY_REQUEST_NOT_FOUND, 'Privacy Request not found.');
      if (!CANCELLABLE_STATUSES.includes(row.status)) {
        throw requestError(409, ERROR_CODES.PRIVACY_REQUEST_NOT_CANCELLABLE, 'Privacy Request cannot be cancelled.');
      }
      const fromStatus = row.status;
      const cancelledAt = now();
      const updated = await repo.cancelIfStatus({ requestId: row.id, statuses: CANCELLABLE_STATUSES, cancelledAt });
      if (!updated) throw requestError(409, ERROR_CODES.PRIVACY_REQUEST_NOT_CANCELLABLE, 'Privacy Request cannot be cancelled.');
      await repo.insertEvent({
        requestId: row.id,
        eventType: 'CANCELLED',
        fromStatus,
        toStatus: 'CANCELLED',
        actorType: 'LEARNER',
        createdAt: cancelledAt,
      });
      return updated;
    });
    return mapLearnerPrivacyRequest(cancelled);
  }

  return { cancelRequest, createRequest, getRequest, listRequests };
}

module.exports = { createPrivacyRequestService };
