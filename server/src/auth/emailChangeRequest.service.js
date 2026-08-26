const { ERROR_CODES } = require('../errors/errorCodes');
const { isValidEmail, normalizeEmail } = require('./validation');
const { isActiveReservationConflict } = require('./emailChange.repository');
const { buildEmailChangeVerificationLink } = require('./emailChangeEmail.service');

function requestError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function assertEligibleLearner(learner) {
  if (!learner) throw requestError(401, ERROR_CODES.AUTH_REQUIRED, 'Authentication required.');
  if (learner.role !== 'user') throw requestError(403, ERROR_CODES.AUTH_FORBIDDEN, 'Learner access required.');
  if (learner.accountStatus !== 'active') {
    throw requestError(403, ERROR_CODES.AUTH_ACCOUNT_DISABLED, 'This account is disabled.');
  }
  if (!learner.emailVerifiedAt) {
    throw requestError(403, ERROR_CODES.EMAIL_VERIFICATION_REQUIRED, 'Email verification is required.');
  }
}

function createEmailChangeRequestService({
  repository,
  passwordComparer,
  tokenFactory,
  sender,
  clientBaseUrl,
  now = () => new Date(),
} = {}) {
  async function requestEmailChange({ userId, newEmail, currentPassword, locale = 'en' } = {}) {
    const password = String(currentPassword || '');
    if (!password.trim()) {
      throw requestError(400, ERROR_CODES.EMAIL_CHANGE_PASSWORD_REQUIRED, 'Current password is required.');
    }
    const candidate = normalizeEmail(newEmail);
    if (!isValidEmail(candidate)) {
      throw requestError(400, ERROR_CODES.EMAIL_CHANGE_EMAIL_INVALID, 'A valid new email address is required.');
    }

    const snapshot = await repository.findLearnerCredentialSnapshot(userId);
    assertEligibleLearner(snapshot);
    if (!await passwordComparer(password, snapshot.passwordHash)) {
      throw requestError(401, ERROR_CODES.EMAIL_CHANGE_PASSWORD_INVALID, 'Current password is invalid.');
    }

    const issued = tokenFactory();
    let created;
    try {
      created = await repository.transaction(async repo => {
        const locked = await repo.lockLearnerForUpdate(userId);
        assertEligibleLearner(locked);
        if (locked.id !== snapshot.id || locked.passwordHash !== snapshot.passwordHash) {
          throw requestError(401, ERROR_CODES.EMAIL_CHANGE_PASSWORD_INVALID, 'Current password is invalid.');
        }
        if (normalizeEmail(locked.email) === candidate) {
          throw requestError(409, ERROR_CODES.EMAIL_CHANGE_EMAIL_UNAVAILABLE, 'Email address is unavailable.');
        }
        const mutationTime = now();
        await repo.revokeExpiredActiveRequests({
          userId: locked.id,
          newEmailNormalized: candidate,
          revokedAt: mutationTime,
        });
        if (await repo.findCanonicalEmailOwner(candidate)) {
          throw requestError(409, ERROR_CODES.EMAIL_CHANGE_EMAIL_UNAVAILABLE, 'Email address is unavailable.');
        }
        await repo.revokeActiveForUser(locked.id, mutationTime);
        return repo.createRequest({
          userId: locked.id,
          newEmailNormalized: candidate,
          tokenHash: issued.tokenHash,
          locale,
          expiresAt: issued.expiresAt,
          createdAt: mutationTime,
        });
      });
    } catch (error) {
      if (isActiveReservationConflict(error)) {
        throw requestError(409, ERROR_CODES.EMAIL_CHANGE_EMAIL_UNAVAILABLE, 'Email address is unavailable.');
      }
      throw error;
    }

    let delivery;
    try {
      delivery = await sender.sendEmailChangeVerification({
        recipientEmail: candidate,
        verificationUrl: buildEmailChangeVerificationLink(clientBaseUrl, issued.rawToken),
        locale,
      });
    } catch {
      delivery = { ok: false, disabled: false };
    }
    if (delivery?.ok === false || delivery?.disabled) {
      try {
        await repository.revokeByIdIfActive(created.id, now());
      } catch {
        throw requestError(
          500,
          ERROR_CODES.INTERNAL_SERVER_ERROR,
          'Email change request cleanup failed.'
        );
      }
      throw requestError(503, ERROR_CODES.EMAIL_SEND_FAILED, 'Verification email could not be sent.');
    }
    return { status: 'accepted', expiresInSeconds: 3600 };
  }

  return { requestEmailChange };
}

module.exports = {
  createEmailChangeRequestService,
};
