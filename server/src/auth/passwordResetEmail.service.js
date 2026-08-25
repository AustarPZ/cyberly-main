const {
  createMailTransport,
  escapeHtml,
  normalizeLocale,
  trimString,
} = require('../email/mailTransport');

const COPY = {
  en: {
    subject: 'Reset your Cyberly password',
    intro: 'A password reset was requested for your Cyberly account.',
    action: 'Reset your password using this link:',
    expiry: 'This link expires in 30 minutes.',
    ignore: 'If you did not request this password reset, you can ignore this email.',
    safety: 'Cyberly will never ask for your password by email.',
  },
  ms: {
    subject: 'Tetapkan semula kata laluan Cyberly anda',
    intro: 'Permintaan untuk menetapkan semula kata laluan akaun Cyberly anda telah diterima.',
    action: 'Tetapkan semula kata laluan anda melalui pautan ini:',
    expiry: 'Pautan ini akan tamat tempoh dalam 30 minit.',
    ignore: 'Jika anda tidak meminta penetapan semula kata laluan ini, anda boleh mengabaikan e-mel ini.',
    safety: 'Cyberly tidak akan meminta kata laluan anda melalui e-mel.',
  },
  'zh-CN': {
    subject: '重设您的 Cyberly 密码',
    intro: '我们收到了重设您的 Cyberly 账户密码的请求。',
    action: '请使用以下链接重设密码：',
    expiry: '此链接将在 30 分钟后失效。',
    ignore: '如果此请求并非由您提出，您可以忽略这封电子邮件。',
    safety: 'Cyberly 绝不会通过电子邮件索取您的密码。',
  },
};

function safePasswordResetEmailError() {
  return {
    code: 'EMAIL_SEND_FAILED',
    category: 'email_transport_failed',
    message: 'Password reset email could not be sent.',
  };
}

function buildPasswordResetLink(clientBaseUrl, rawToken) {
  const baseUrl = trimString(clientBaseUrl).replace(/\/+$/, '');
  if (!baseUrl) return '';
  return `${baseUrl}/#/reset-password?token=${encodeURIComponent(String(rawToken || ''))}`;
}

function buildPasswordResetBody(copy, resetUrl) {
  const text = [
    'Cyberly', '', copy.intro, '', copy.action, resetUrl, '',
    copy.expiry, '', copy.ignore, '', copy.safety,
  ].join('\n');
  const html = [
    '<p><strong>Cyberly</strong></p>',
    `<p>${escapeHtml(copy.intro)}</p>`,
    `<p>${escapeHtml(copy.action)}</p>`,
    `<p><a href="${escapeHtml(resetUrl)}">${escapeHtml(resetUrl)}</a></p>`,
    `<p>${escapeHtml(copy.expiry)}</p>`,
    `<p>${escapeHtml(copy.ignore)}</p>`,
    `<p>${escapeHtml(copy.safety)}</p>`,
  ].join('');
  return { text, html };
}

function createPasswordResetSender(options = {}) {
  const fromName = trimString(options.fromName || process.env.EMAIL_FROM_NAME || 'Cyberly');
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  const transport = createMailTransport({ ...options, fromAddress });

  async function sendPasswordReset({ recipientEmail, resetUrl, locale = 'en' } = {}) {
    if (transport.transport === 'disabled' && !options.send) {
      return { ok: true, disabled: true };
    }
    const normalizedLocale = normalizeLocale(locale);
    const copy = COPY[normalizedLocale];
    const body = buildPasswordResetBody(copy, trimString(resetUrl));
    const message = {
      transport: transport.transport,
      fromName,
      fromAddress,
      to: trimString(recipientEmail),
      locale: normalizedLocale,
      resetUrl: trimString(resetUrl),
      subject: copy.subject,
      ...body,
    };
    try {
      const result = await transport.send(message);
      if (result?.ok === false) {
        return { ok: false, disabled: false, error: safePasswordResetEmailError() };
      }
      return { ok: true, disabled: Boolean(result?.disabled) };
    } catch {
      return { ok: false, disabled: false, error: safePasswordResetEmailError() };
    }
  }

  return { transport: transport.transport, sendPasswordReset };
}

module.exports = {
  buildPasswordResetLink,
  createPasswordResetSender,
  safePasswordResetEmailError,
};
