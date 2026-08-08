const { ERROR_CODES } = require('../errors/errorCodes');

function emailVerificationErrorResponse() {
  return {
    error: {
      code: ERROR_CODES.EMAIL_VERIFICATION_REQUIRED,
      message: 'Please verify your email before asking CyberGuard to generate a new response.',
    },
    action: 'verify_email',
  };
}

function createRequireVerifiedEmail(pool) {
  if (!pool) {
    throw new Error('Email verification guard requires a database pool.');
  }

  return async function requireVerifiedEmail(req, res, next) {
    try {
      const userId = Number(req.session?.userId);
      if (!Number.isInteger(userId) || userId <= 0) {
        return res.status(401).json({
          error: {
            code: ERROR_CODES.AUTH_REQUIRED,
            message: 'Authentication required.',
          },
        });
      }

      const [rows] = await pool.query(
        `SELECT id, email_verified_at, account_status
         FROM users
         WHERE id = ?
         LIMIT 1`,
        [userId]
      );
      const user = rows[0];
      if (!user || user.account_status !== 'active') {
        return res.status(401).json({
          error: {
            code: ERROR_CODES.AUTH_REQUIRED,
            message: 'Authentication required.',
          },
        });
      }

      if (!user.email_verified_at) {
        return res.status(403).json(emailVerificationErrorResponse());
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  createRequireVerifiedEmail,
  emailVerificationErrorResponse,
};
