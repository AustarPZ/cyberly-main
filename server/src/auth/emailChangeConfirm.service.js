const { ERROR_CODES } = require('../errors/errorCodes');
const { normalizeEmail } = require('./validation');
const {
  classifyEmailChangeRequest,
  hashEmailChangeToken,
} = require('./emailChangeToken.service');

function confirmError(status, code, message) {
  const error = new Error(message);
  error.status = status;
  error.code = code;
  return error;
}

function invalidTokenError() {
  return confirmError(
    400,
    ERROR_CODES.EMAIL_CHANGE_TOKEN_INVALID_OR_UNAVAILABLE,
    'Email change token is invalid or unavailable.'
  );
}

function unavailableEmailError() {
  return confirmError(
    409,
    ERROR_CODES.EMAIL_CHANGE_EMAIL_UNAVAILABLE,
    'Email address is unavailable.'
  );
}

function isCanonicalEmailConflict(error = {}) {
  if (error.code !== 'ER_DUP_ENTRY') return false;
  const detail = `${error.sqlMessage || ''} ${error.message || ''}`;
  return /uq_users_email/i.test(detail);
}

function isEligibleLearner(learner) {
  return Boolean(
    learner
    && learner.role === 'user'
    && learner.accountStatus === 'active'
    && learner.emailVerifiedAt
  );
}

function createEmailChangeConfirmService({
  repository,
  noticeSender,
  now = () => new Date(),
  logger = console,
} = {}) {
  async function confirmEmailChange({
    rawToken,
    sessionUserId = null,
    sessionVersion,
    continueSession,
    destroySession,
  } = {}) {
    const token = String(rawToken || '').trim();
    if (!token) throw invalidTokenError();
    const tokenHash = hashEmailChangeToken(token);
    const confirmed = await repository.transaction(async repo => {
      const confirmedAt = now();
      const changeRequest = await repo.findByTokenHashForUpdate(tokenHash);
      if (classifyEmailChangeRequest(changeRequest, confirmedAt) !== 'active') {
        throw invalidTokenError();
      }
      const learner = await repo.lockLearnerForUpdate(changeRequest.userId);
      if (!isEligibleLearner(learner)) throw invalidTokenError();
      const candidate = normalizeEmail(changeRequest.newEmailNormalized);
      if (!candidate) throw invalidTokenError();
      if (await repo.findCanonicalEmailOwner(candidate)) throw unavailableEmailError();

      let updated;
      try {
        updated = await repo.updateLearnerCanonicalEmail({
          userId: learner.id,
          newEmailNormalized: candidate,
          confirmedAt,
          previousSessionVersion: learner.sessionVersion,
        });
      } catch (error) {
        if (isCanonicalEmailConflict(error)) throw unavailableEmailError();
        throw error;
      }
      if (!updated) throw invalidTokenError();
      if (!await repo.markUsedIfActive(changeRequest.id, confirmedAt)) throw invalidTokenError();
      await repo.revokeOtherActiveForUser(learner.id, changeRequest.id, confirmedAt);
      return {
        learnerId: learner.id,
        role: learner.role,
        oldEmail: learner.email,
        locale: changeRequest.locale || 'en',
        preConfirmSessionVersion: learner.sessionVersion,
        sessionVersion: updated.sessionVersion,
      };
    });

    let sessionStatus = 'signed_out';
    if (sessionUserId && Number(sessionUserId) !== confirmed.learnerId) {
      sessionStatus = 'unrelated';
    } else if (sessionUserId && Number(sessionUserId) === confirmed.learnerId) {
      const sessionCanContinue = typeof sessionVersion === 'number'
        && Number.isInteger(sessionVersion)
        && sessionVersion >= 0
        && sessionVersion === confirmed.preConfirmSessionVersion;
      if (sessionCanContinue && continueSession) {
        try {
          await continueSession({
            userId: confirmed.learnerId,
            role: confirmed.role,
            sessionVersion: confirmed.sessionVersion,
          });
          sessionStatus = 'continued';
        } catch {
          try {
            await destroySession?.();
          } catch {
            logger.error('EMAIL_CHANGE_SESSION_CLEANUP_FAILED');
          }
        }
      } else {
        try {
          await destroySession?.();
        } catch {
          logger.error('EMAIL_CHANGE_SESSION_CLEANUP_FAILED');
        }
      }
    }

    try {
      const delivery = await noticeSender.sendEmailChangeNotice({
        recipientEmail: confirmed.oldEmail,
        locale: confirmed.locale,
      });
      if (delivery?.ok === false || delivery?.disabled) {
        logger.error('EMAIL_CHANGE_OLD_NOTICE_FAILED');
      }
    } catch {
      logger.error('EMAIL_CHANGE_OLD_NOTICE_FAILED');
    }

    return { status: 'confirmed', sessionStatus };
  }

  return { confirmEmailChange };
}

module.exports = {
  createEmailChangeConfirmService,
  isCanonicalEmailConflict,
};
