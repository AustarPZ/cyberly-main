const {
  createMailTransport,
  escapeHtml,
  normalizeLocale,
  trimString,
} = require('../email/mailTransport');

const COPY = {
  en: {
    subject: 'Your Cyberly email address was changed',
    body: 'The email address for your Cyberly account was changed.',
    safety: 'If you did not expect this change, secure your account and contact Cyberly support.',
  },
  ms: {
    subject: 'Alamat e-mel Cyberly anda telah ditukar',
    body: 'Alamat e-mel untuk akaun Cyberly anda telah ditukar.',
    safety: 'Jika anda tidak menjangkakan perubahan ini, lindungi akaun anda dan hubungi sokongan Cyberly.',
  },
  'zh-CN': {
    subject: '您的 Cyberly 电子邮箱地址已更改',
    body: '您的 Cyberly 账户电子邮箱地址已更改。',
    safety: '如果这不是您预期的更改，请保护您的账户并联系 Cyberly 支持。',
  },
};

function createEmailChangeNoticeSender(options = {}) {
  const fromName = trimString(options.fromName || process.env.EMAIL_FROM_NAME || 'Cyberly');
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  const transport = createMailTransport({ ...options, fromAddress });

  async function sendEmailChangeNotice({ recipientEmail, locale = 'en' } = {}) {
    if (transport.transport === 'disabled' && !options.send) {
      return { ok: false, disabled: true };
    }
    const normalizedLocale = normalizeLocale(locale);
    const copy = COPY[normalizedLocale];
    const text = ['Cyberly', '', copy.body, '', copy.safety].join('\n');
    const html = [
      '<p><strong>Cyberly</strong></p>',
      `<p>${escapeHtml(copy.body)}</p>`,
      `<p>${escapeHtml(copy.safety)}</p>`,
    ].join('');
    try {
      const result = await transport.send({
        transport: transport.transport,
        fromName,
        fromAddress,
        to: trimString(recipientEmail),
        locale: normalizedLocale,
        subject: copy.subject,
        text,
        html,
      });
      return result?.ok === false
        ? { ok: false, disabled: false }
        : { ok: true, disabled: Boolean(result?.disabled) };
    } catch {
      return { ok: false, disabled: false };
    }
  }

  return { transport: transport.transport, sendEmailChangeNotice };
}

module.exports = { createEmailChangeNoticeSender };
