const EMAIL_TRANSPORT_DISABLED = 'disabled';
const EMAIL_TRANSPORT_SMTP = 'smtp';
const EMAIL_TRANSPORT_TEST = 'test';
const EMAIL_TRANSPORT_TEST_SUCCESS = 'test-success';
const EMAIL_TRANSPORT_TEST_FAIL = 'test-fail';

function normalizeLocale(locale) {
  const value = String(locale || 'en').trim();
  if (value.toLowerCase().startsWith('ms')) return 'ms';
  if (value.toLowerCase().startsWith('zh')) return 'zh-CN';
  return 'en';
}

function safeEmailError() {
  return {
    code: 'EMAIL_SEND_FAILED',
    category: 'email_transport_failed',
    message: 'Verification email could not be sent.',
  };
}

function normalizeTransport(value) {
  return String(value || EMAIL_TRANSPORT_DISABLED).trim().toLowerCase() || EMAIL_TRANSPORT_DISABLED;
}

function parsePort(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return null;
  }
  return parsed;
}

function parseBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
}

function trimString(value) {
  return String(value || '').trim();
}

function buildVerificationLink(clientBaseUrl, rawToken) {
  const baseUrl = trimString(clientBaseUrl).replace(/\/+$/, '');
  if (!baseUrl) return '';
  return `${baseUrl}/#/verify-email?token=${encodeURIComponent(String(rawToken || ''))}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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

function getSmtpOptions(options = {}) {
  const smtp = options.smtp || {};
  return {
    host: trimString(smtp.host ?? process.env.SMTP_HOST),
    port: smtp.port ?? process.env.SMTP_PORT,
    secure: smtp.secure ?? process.env.SMTP_SECURE,
    user: trimString(smtp.user ?? process.env.SMTP_USER),
    password: trimString(smtp.password ?? process.env.SMTP_PASSWORD),
  };
}

function validateSmtpConfiguration(options = {}) {
  const smtp = getSmtpOptions(options);
  const port = parsePort(smtp.port);
  const secure = parseBoolean(smtp.secure);
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  const clientBaseUrl = trimString(options.clientBaseUrl ?? process.env.CLIENT_BASE_URL);

  if (!smtp.host || !smtp.user || !smtp.password || !port || secure === null || !fromAddress || !clientBaseUrl) {
    return {
      ok: false,
      error: safeEmailError(),
    };
  }

  return {
    ok: true,
    config: {
      host: smtp.host,
      port,
      secure,
      auth: {
        user: smtp.user,
        pass: smtp.password,
      },
    },
  };
}

function createNoopTransport() {
  return {
    async send() {
      return {
        ok: true,
        disabled: true,
      };
    },
  };
}

function createTestSuccessTransport() {
  return {
    async send() {
      return {
        ok: true,
        disabled: false,
      };
    },
  };
}

function createTestFailTransport() {
  return {
    async send() {
      return {
        ok: false,
      };
    },
  };
}

function createSmtpTransport(options = {}) {
  let mailer = null;

  return {
    async send(message) {
      const validation = validateSmtpConfiguration(options);
      if (!validation.ok) {
        return validation;
      }

      if (!mailer) {
        const createTransport = options.createTransport || require('nodemailer').createTransport;
        mailer = createTransport(validation.config);
      }

      const { text, html } = buildEmailBody(message);
      await mailer.sendMail({
        from: {
          name: message.fromName,
          address: message.fromAddress,
        },
        to: message.to,
        subject: message.subject,
        text,
        html,
      });

      return {
        ok: true,
      };
    },
  };
}

function createDefaultTransport(transport, options = {}) {
  if (transport === EMAIL_TRANSPORT_SMTP) {
    return createSmtpTransport(options);
  }
  if (transport === EMAIL_TRANSPORT_TEST_FAIL) {
    return createTestFailTransport();
  }
  if (transport === EMAIL_TRANSPORT_TEST || transport === EMAIL_TRANSPORT_TEST_SUCCESS) {
    return createTestSuccessTransport();
  }
  return createNoopTransport();
}

function createEmailVerificationSender(options = {}) {
  const transport = normalizeTransport(options.transport || process.env.EMAIL_TRANSPORT);
  const fromName = trimString(options.fromName || process.env.EMAIL_FROM_NAME || 'Cyberly');
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  const sender = options.send
    ? { send: options.send }
    : createDefaultTransport(transport, {
      ...options,
      fromAddress,
    });

  async function sendEmailVerification({
    recipientEmail,
    learnerName = '',
    verificationUrl,
    expiresAt,
    locale = 'en',
  } = {}) {
    const message = {
      transport,
      fromName,
      fromAddress,
      to: trimString(recipientEmail),
      learnerName: trimString(learnerName),
      verificationUrl: trimString(verificationUrl),
      expiresAt,
      locale: normalizeLocale(locale),
      subject: 'Verify your Cyberly email',
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
    transport,
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
