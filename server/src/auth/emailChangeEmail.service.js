const {
  createMailTransport,
  escapeHtml,
  normalizeLocale,
  trimString,
} = require('../email/mailTransport');

const COPY = {
  en: {
    subject: 'Verify your new Cyberly email address',
    intro: 'A change to this email address was requested for a Cyberly account.',
    action: 'Verify the new email address using this link:',
    expiry: 'This link expires in 60 minutes.',
    ignore: 'If you did not request this change, you can ignore this email.',
    safety: 'Cyberly will never ask for your password by email.',
  },
  ms: {
    subject: 'Sahkan alamat e-mel Cyberly baharu anda',
    intro: 'Perubahan kepada alamat e-mel ini telah diminta untuk akaun Cyberly.',
    action: 'Sahkan alamat e-mel baharu melalui pautan ini:',
    expiry: 'Pautan ini akan tamat tempoh dalam 60 minit.',
    ignore: 'Jika anda tidak meminta perubahan ini, anda boleh mengabaikan e-mel ini.',
    safety: 'Cyberly tidak akan meminta kata laluan anda melalui e-mel.',
  },
  'zh-CN': {
    subject: '验证您的新 Cyberly 电子邮箱地址',
    intro: '有人请求将一个 Cyberly 账户更改为此电子邮箱地址。',
    action: '请使用以下链接验证新电子邮箱地址：',
    expiry: '此链接将在 60 分钟后失效。',
    ignore: '如果您没有请求此更改，可以忽略这封电子邮件。',
    safety: 'Cyberly 绝不会通过电子邮件索取您的密码。',
  },
};

function buildEmailChangeVerificationLink(clientBaseUrl, rawToken) {
  const baseUrl = trimString(clientBaseUrl).replace(/\/+$/, '');
  if (!baseUrl) return '';
  return `${baseUrl}/#/verify-email-change?token=${encodeURIComponent(String(rawToken || ''))}`;
}

function createEmailChangeSender(options = {}) {
  const fromName = trimString(options.fromName || process.env.EMAIL_FROM_NAME || 'Cyberly');
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  const transport = createMailTransport({ ...options, fromAddress });

  async function sendEmailChangeVerification({ recipientEmail, verificationUrl, locale = 'en' } = {}) {
    if (transport.transport === 'disabled' && !options.send) {
      return { ok: false, disabled: true };
    }
    const normalizedLocale = normalizeLocale(locale);
    const copy = COPY[normalizedLocale];
    const url = trimString(verificationUrl);
    const text = [
      'Cyberly', '', copy.intro, '', copy.action, url, '',
      copy.expiry, '', copy.ignore, '', copy.safety,
    ].join('\n');
    const html = [
      '<p><strong>Cyberly</strong></p>',
      `<p>${escapeHtml(copy.intro)}</p>`,
      `<p>${escapeHtml(copy.action)}</p>`,
      `<p><a href="${escapeHtml(url)}">${escapeHtml(url)}</a></p>`,
      `<p>${escapeHtml(copy.expiry)}</p>`,
      `<p>${escapeHtml(copy.ignore)}</p>`,
      `<p>${escapeHtml(copy.safety)}</p>`,
    ].join('');
    try {
      const result = await transport.send({
        transport: transport.transport,
        fromName,
        fromAddress,
        to: trimString(recipientEmail),
        locale: normalizedLocale,
        verificationUrl: url,
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

  return { transport: transport.transport, sendEmailChangeVerification };
}

module.exports = {
  buildEmailChangeVerificationLink,
  createEmailChangeSender,
};
