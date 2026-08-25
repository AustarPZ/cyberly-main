const {
  EMAIL_TRANSPORT_DISABLED,
  EMAIL_TRANSPORT_SMTP,
  EMAIL_TRANSPORT_TEST,
  EMAIL_TRANSPORT_TEST_SUCCESS,
  EMAIL_TRANSPORT_TEST_FAIL,
  createMailTransport,
  escapeHtml,
  normalizeLocale,
  trimString,
  validateSmtpConfiguration: validateSharedSmtpConfiguration,
} = require('../email/mailTransport');

function safeEmailError() {
  return {
    code: 'EMAIL_SEND_FAILED',
    category: 'email_transport_failed',
    message: 'Verification email could not be sent.',
  };
}

function buildVerificationLink(clientBaseUrl, rawToken) {
  const baseUrl = trimString(clientBaseUrl).replace(/\/+$/, '');
  if (!baseUrl) return '';
  return `${baseUrl}/#/verify-email?token=${encodeURIComponent(String(rawToken || ''))}`;
}

function buildEmailBody({ learnerName, verificationUrl, expiresAt }) {
  const greeting = learnerName ? `Hi ${learnerName},` : 'Hi,';
  const expiresText = expiresAt ? `This link expires at ${new Date(expiresAt).toISOString()}.` : 'This link expires soon.';
  const text = [
    greeting,
    '',
    'Please verify your Cyberly email address using this link:',
    verificationUrl,
    '',
    expiresText,
    '',
    'If you did not create a Cyberly account, you can ignore this email.',
  ].join('\n');

  const html = [
    '<p>',
    escapeHtml(greeting),
    '</p>',
    '<p>Please verify your Cyberly email address using this link:</p>',
    `<p><a href="${escapeHtml(verificationUrl)}">${escapeHtml(verificationUrl)}</a></p>`,
    `<p>${escapeHtml(expiresText)}</p>`,
    '<p>If you did not create a Cyberly account, you can ignore this email.</p>',
  ].join('');

  return { text, html };
}

function validateSmtpConfiguration(options = {}) {
  const validation = validateSharedSmtpConfiguration(options);
  return validation.ok ? validation : { ok: false, error: safeEmailError() };
}

function createEmailVerificationSender(options = {}) {
  const fromName = trimString(options.fromName || process.env.EMAIL_FROM_NAME || 'Cyberly');
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  const sender = createMailTransport({ ...options, fromAddress });

  async function sendEmailVerification({
    recipientEmail,
    learnerName = '',
    verificationUrl,
    expiresAt,
    locale = 'en',
  } = {}) {
    const message = {
      transport: sender.transport,
      fromName,
      fromAddress,
      to: trimString(recipientEmail),
      learnerName: trimString(learnerName),
      verificationUrl: trimString(verificationUrl),
      expiresAt,
      locale: normalizeLocale(locale),
      subject: 'Verify your Cyberly email',
      ...buildEmailBody({ learnerName, verificationUrl, expiresAt }),
    };

    try {
      const result = await sender.send(message);
      if (result?.ok === false) {
        return {
          ok: false,
          error: safeEmailError(),
        };
      }
      return {
        ok: true,
        disabled: Boolean(result?.disabled),
      };
    } catch (error) {
      return {
        ok: false,
        error: safeEmailError(error),
      };
    }
  }

  return {
    transport: sender.transport,
    sendEmailVerification,
  };
}

module.exports = {
  EMAIL_TRANSPORT_DISABLED,
  EMAIL_TRANSPORT_SMTP,
  EMAIL_TRANSPORT_TEST,
  EMAIL_TRANSPORT_TEST_SUCCESS,
  EMAIL_TRANSPORT_TEST_FAIL,
  buildVerificationLink,
  createEmailVerificationSender,
  safeEmailError,
  validateSmtpConfiguration,
};
