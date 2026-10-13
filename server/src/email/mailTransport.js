const EMAIL_TRANSPORT_DISABLED = 'disabled';
const EMAIL_TRANSPORT_SMTP = 'smtp';
const EMAIL_TRANSPORT_BREVO = 'brevo';
const EMAIL_TRANSPORT_TEST = 'test';
const EMAIL_TRANSPORT_TEST_SUCCESS = 'test-success';
const EMAIL_TRANSPORT_TEST_FAIL = 'test-fail';
const BREVO_EMAIL_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const BREVO_TIMEOUT_MS = 10000;

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

function getBrevoOptions(options = {}) {
  return {
    brevoApiKey: trimString(options.brevoApiKey ?? process.env.BREVO_API_KEY),
    fromAddress: trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS),
    clientBaseUrl: trimString(options.clientBaseUrl ?? process.env.CLIENT_BASE_URL),
  };
}

function isEmailAddress(value) {
  return /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(value) && !/[\x00-\x1f\x7f]/.test(value);
}

function validateBrevoConfiguration(options = {}) {
  const config = getBrevoOptions(options);
  const fields = [];
  if (!config.brevoApiKey || /[\x00-\x20\x7f]/.test(config.brevoApiKey)) fields.push('BREVO_API_KEY');
  if (!isEmailAddress(config.fromAddress)) fields.push('EMAIL_FROM_ADDRESS');
  try {
    const url = new URL(config.clientBaseUrl);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash ||
      ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname.toLowerCase())) {
      fields.push('CLIENT_BASE_URL');
    }
  } catch {
    fields.push('CLIENT_BASE_URL');
  }
  // Validation exposes field names only, never credentials or provider data.
  return fields.length ? { ok: false, fields } : { ok: true };
}

function createBrevoTransport(options = {}) {
  return {
    async send(message = {}) {
      let timer;
      try {
        const config = getBrevoOptions(options);
        if (!validateBrevoConfiguration(config).ok) return { ok: false, disabled: false };
        const to = trimString(message.to);
        const subject = trimString(message.subject);
        const html = typeof message.html === 'string' ? message.html : '';
        const text = typeof message.text === 'string' ? message.text : '';
        if (!isEmailAddress(to) || !subject || (!html.trim() && !text.trim())) {
          return { ok: false, disabled: false };
        }
        const fetchImpl = options.fetchImpl ?? globalThis.fetch;
        if (typeof fetchImpl !== 'function') return { ok: false, disabled: false };
        const controller = new AbortController();
        const requestedTimeout = Number(options.brevoTimeoutMs);
        // Tests can shorten the deadline; no caller can extend the 10-second bound.
        const timeoutMs = Number.isInteger(requestedTimeout) && requestedTimeout > 0
          ? Math.min(requestedTimeout, BREVO_TIMEOUT_MS) : BREVO_TIMEOUT_MS;
        const timeout = new Promise(resolve => {
          timer = setTimeout(() => { controller.abort(); resolve(false); }, timeoutMs);
        });
        const send = (async () => {
          const response = await fetchImpl(BREVO_EMAIL_ENDPOINT, {
            method: 'POST',
            redirect: 'error',
            headers: { 'api-key': config.brevoApiKey, 'content-type': 'application/json', accept: 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              sender: { name: trimString(message.fromName) || 'Cyberly', email: config.fromAddress },
              to: [{ email: to }],
              subject,
              ...(html.trim() ? { htmlContent: html } : { textContent: text }),
            }),
          });
          if (response?.status !== 201) {
            await response?.body?.cancel();
            return false;
          }
          const data = await response.json();
          return typeof data?.messageId === 'string' && Boolean(data.messageId.trim());
        })();
        // Covers both fetch and response parsing, even if an injected fetch ignores abort.
        const ok = await Promise.race([send, timeout]);
        return { ok, disabled: false };
      } catch {
        return { ok: false, disabled: false };
      } finally {
        clearTimeout(timer);
      }
    },
  };
}

function createMailTransport(options = {}) {
  const transport = normalizeTransport(options.transport || process.env.EMAIL_TRANSPORT);
  if (options.send) return { transport, send: options.send };
  if (transport === EMAIL_TRANSPORT_SMTP) {
    return { transport, ...createSmtpTransport(options) };
  }
  if (transport === EMAIL_TRANSPORT_BREVO) {
    return { transport, ...createBrevoTransport(options) };
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
  EMAIL_TRANSPORT_BREVO,
  EMAIL_TRANSPORT_TEST,
  EMAIL_TRANSPORT_TEST_SUCCESS,
  EMAIL_TRANSPORT_TEST_FAIL,
  createMailTransport,
  escapeHtml,
  normalizeLocale,
  normalizeTransport,
  trimString,
  validateSmtpConfiguration,
  validateBrevoConfiguration,
};
