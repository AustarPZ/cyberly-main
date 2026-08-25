const EMAIL_TRANSPORT_DISABLED = 'disabled';
const EMAIL_TRANSPORT_SMTP = 'smtp';
const EMAIL_TRANSPORT_TEST = 'test';
const EMAIL_TRANSPORT_TEST_SUCCESS = 'test-success';
const EMAIL_TRANSPORT_TEST_FAIL = 'test-fail';

function normalizeLocale(locale) {
  const value = String(locale || 'en').trim().toLowerCase();
  if (value.startsWith('ms')) return 'ms';
  if (value.startsWith('zh')) return 'zh-CN';
  return 'en';
}

function normalizeTransport(value) {
  return String(value || EMAIL_TRANSPORT_DISABLED).trim().toLowerCase() || EMAIL_TRANSPORT_DISABLED;
}

function trimString(value) {
  return String(value || '').trim();
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parsePort(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= 65535 ? parsed : null;
}

function parseBoolean(value) {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  return null;
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
    return { ok: false };
  }

  return {
    ok: true,
    config: {
      host: smtp.host,
      port,
      secure,
      auth: { user: smtp.user, pass: smtp.password },
    },
  };
}

function createSmtpTransport(options = {}) {
  let mailer = null;
  return {
    async send(message) {
      const validation = validateSmtpConfiguration(options);
      if (!validation.ok) return { ok: false };
      if (!mailer) {
        const createTransport = options.createTransport || require('nodemailer').createTransport;
        mailer = createTransport(validation.config);
      }
      await mailer.sendMail({
        from: { name: message.fromName, address: message.fromAddress },
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
      });
      return { ok: true, disabled: false };
    },
  };
}

function createMailTransport(options = {}) {
  const transport = normalizeTransport(options.transport || process.env.EMAIL_TRANSPORT);
  if (options.send) return { transport, send: options.send };
  if (transport === EMAIL_TRANSPORT_SMTP) {
    return { transport, ...createSmtpTransport(options) };
  }
  if (transport === EMAIL_TRANSPORT_TEST_FAIL) {
    return { transport, async send() { return { ok: false, disabled: false }; } };
  }
  if (transport === EMAIL_TRANSPORT_TEST || transport === EMAIL_TRANSPORT_TEST_SUCCESS) {
    return { transport, async send() { return { ok: true, disabled: false }; } };
  }
  return { transport, async send() { return { ok: true, disabled: true }; } };
}

module.exports = {
  EMAIL_TRANSPORT_DISABLED,
  EMAIL_TRANSPORT_SMTP,
  EMAIL_TRANSPORT_TEST,
  EMAIL_TRANSPORT_TEST_SUCCESS,
  EMAIL_TRANSPORT_TEST_FAIL,
  createMailTransport,
  escapeHtml,
  normalizeLocale,
  normalizeTransport,
  trimString,
  validateSmtpConfiguration,
};
