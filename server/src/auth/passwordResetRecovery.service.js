const { PASSWORD_RESET_TOKEN_TYPE } = require('./passwordResetToken.service');
const { buildPasswordResetLink } = require('./passwordResetEmail.service');

function createPasswordResetRecoveryService({
  repository,
  tokenService,
  sender,
  clientBaseUrl,
  now = () => new Date(),
  logger = console,
} = {}) {
  async function requestPasswordReset({ email, locale = 'en', requestIp = null, requestUserAgent = null } = {}) {
    const account = await repository.findAccountByEmail(email);
    if (!account || account.role !== 'user' || account.accountStatus !== 'active') {
      return { eligible: false };
    }

    const issued = await tokenService.issuePasswordResetToken({
      userId: account.id,
      requestIp,
      requestUserAgent,
    });
    let delivery;
    try {
      delivery = await sender.sendPasswordReset({
        recipientEmail: account.email,
        resetUrl: buildPasswordResetLink(clientBaseUrl, issued.rawToken),
        expiresAt: issued.expiresAt,
        locale,
      });
    } catch {
      delivery = { ok: false, disabled: false };
    }

    if (delivery?.ok !== false) {
      return { eligible: true, delivered: !delivery.disabled, disabled: Boolean(delivery.disabled) };
    }

    logger.error('PASSWORD_RESET_EMAIL_SEND_FAILED');
    try {
      const revoked = await repository.revokeTokenByIdIfActive(
        issued.token.id,
        PASSWORD_RESET_TOKEN_TYPE,
        now()
      );
      if (!revoked) logger.error('PASSWORD_RESET_TOKEN_REVOKE_FAILED');
    } catch {
      logger.error('PASSWORD_RESET_TOKEN_REVOKE_FAILED');
    }
    return { eligible: true, delivered: false, disabled: false };
  }

  return { requestPasswordReset };
}

module.exports = { createPasswordResetRecoveryService };
