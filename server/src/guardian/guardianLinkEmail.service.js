const { createMailTransport, escapeHtml, normalizeLocale, trimString } = require('../email/mailTransport');

const COPY = {
  en: {
    invitationSubject: 'Cyberly Guardian Link invitation',
    invitation: name => [
      `${name} invited this email address as their Guardian contact.`,
      'Guardian Link is optional.',
      'Use the link within 72 hours to Accept or Decline the invitation:',
      'Accept confirms control of this email address for this limited Guardian Link. Decline rejects the invitation.',
      'No Guardian account is created. Cyberly does not verify legal guardianship, parenthood, custody or consent authority, and the Guardian contact receives no access to the learner’s account, learning information or Privacy Requests.',
      'If you do not recognize this invitation, ignore it and do not share the link.',
    ],
    acceptedSubject: 'Cyberly Guardian Link confirmed',
    accepted: name => [`Guardian Link for ${name} was confirmed.`,
      'No Guardian account is created. Cyberly does not verify legal guardianship, parenthood, custody or consent authority, and the Guardian contact receives no access to the learner’s account, learning information or Privacy Requests.'],
    revokedSubject: 'Cyberly Guardian Link ended',
    revoked: name => [`Guardian Link for ${name} was ended.`,
      'No Guardian account or access to learner activity, progress, chats, recovery, privacy requests, or product controls was created. Email control did not verify legal guardianship.'],
  },
  ms: {
    invitationSubject: 'Jemputan Pautan Penjaga Cyberly',
    invitation: name => [
      `${name} menjemput alamat e-mel ini sebagai kenalan Penjaga mereka.`,
      'Pautan Penjaga adalah pilihan.',
      'Gunakan pautan dalam tempoh 72 jam untuk Terima atau Tolak jemputan:',
      'Terima mengesahkan kawalan alamat e-mel ini untuk Pautan Penjaga yang terhad. Tolak menolak jemputan.',
      'Tiada akaun Penjaga diwujudkan. Cyberly tidak mengesahkan penjagaan sah, status ibu atau bapa, hak penjagaan atau kuasa memberikan persetujuan, dan kenalan Penjaga tidak mendapat akses kepada akaun, maklumat pembelajaran atau Permintaan Privasi pelajar.',
      'Jika anda tidak mengenali jemputan ini, abaikannya dan jangan kongsi pautan.',
    ],
    acceptedSubject: 'Pautan Penjaga Cyberly disahkan',
    accepted: name => [`Pautan Penjaga untuk ${name} telah disahkan.`,
      'Tiada akaun Penjaga diwujudkan. Cyberly tidak mengesahkan penjagaan sah, status ibu atau bapa, hak penjagaan atau kuasa memberikan persetujuan, dan kenalan Penjaga tidak mendapat akses kepada akaun, maklumat pembelajaran atau Permintaan Privasi pelajar.'],
    revokedSubject: 'Pautan Penjaga Cyberly ditamatkan',
    revoked: name => [`Pautan Penjaga untuk ${name} telah ditamatkan.`,
      'Tiada akaun Penjaga atau akses kepada aktiviti, kemajuan, sembang, pemulihan, permintaan privasi atau kawalan produk pelajar diwujudkan. Kawalan e-mel tidak mengesahkan penjagaan sah.'],
  },
  'zh-CN': {
    invitationSubject: 'Cyberly 监护人关联邀请',
    invitation: name => [
      `${name} 邀请此电子邮箱成为其监护人联系人。`,
      '监护人关联是可选功能。',
      '请在 72 小时内使用此链接接受或拒绝邀请：',
      '接受仅确认您控制此电子邮箱并同意建立有限的监护人关联；拒绝则表示不接受邀请。',
      '系统不会创建监护人账户。Cyberly 不验证法定监护关系、亲子关系、监护权或同意授权，监护人联系人也不会获得学习者账户、学习信息或隐私申请的访问权限。',
      '如果您不认识此邀请，请忽略并且不要分享链接。',
    ],
    acceptedSubject: 'Cyberly 监护人关联已确认',
    accepted: name => [`与 ${name} 的监护人关联已确认。`,
      '系统不会创建监护人账户。Cyberly 不验证法定监护关系、亲子关系、监护权或同意授权，监护人联系人也不会获得学习者账户、学习信息或隐私申请的访问权限。'],
    revokedSubject: 'Cyberly 监护人关联已终止',
    revoked: name => [`与 ${name} 的监护人关联已终止。`,
      '系统未创建监护人账户，也未授予学习活动、进度、聊天、账户恢复、隐私请求或产品控制权限。电子邮箱控制权不代表已核实法定监护人身份。'],
  },
};

function buildGuardianVerificationLink(clientBaseUrl, rawToken) {
  const base = trimString(clientBaseUrl).replace(/\/+$/, '');
  return base ? `${base}/#/guardian-link/verify?token=${encodeURIComponent(String(rawToken || ''))}` : '';
}

function createGuardianLinkSender(options = {}) {
  const transport = createMailTransport(options);
  const fromName = trimString(options.fromName || process.env.EMAIL_FROM_NAME || 'Cyberly');
  const fromAddress = trimString(options.fromAddress ?? process.env.EMAIL_FROM_ADDRESS);
  async function send(subject, recipientEmail, lines, locale, extra = {}) {
    if (transport.transport === 'disabled' && !options.send) return { ok: false, disabled: true };
    const selectedLocale = normalizeLocale(locale);
    const text = ['Cyberly', '', ...lines].join('\n');
    const html = lines.map(line => `<p>${escapeHtml(line)}</p>`).join('');
    try {
      const result = await transport.send({ transport: transport.transport, fromName, fromAddress,
        to: trimString(recipientEmail), locale: selectedLocale, subject, text, html, ...extra });
      return result?.ok === false ? { ok: false } : { ok: true, disabled: Boolean(result?.disabled) };
    } catch { return { ok: false }; }
  }
  function sendGuardianInvitation({ recipientEmail, learnerDisplayName, verificationUrl, locale = 'en' }) {
    const selectedLocale = normalizeLocale(locale);
    const copy = COPY[selectedLocale];
    return send(copy.invitationSubject, recipientEmail,
      [...copy.invitation(trimString(learnerDisplayName)), verificationUrl], selectedLocale, { verificationUrl });
  }
  function sendGuardianAcceptedConfirmation({ recipientEmail, learnerDisplayName, locale = 'en' }) {
    const selectedLocale = normalizeLocale(locale);
    const copy = COPY[selectedLocale];
    return send(copy.acceptedSubject, recipientEmail, copy.accepted(trimString(learnerDisplayName)), selectedLocale);
  }
  function sendGuardianRevokedNotice({ recipientEmail, learnerDisplayName, locale = 'en' }) {
    const selectedLocale = normalizeLocale(locale);
    const copy = COPY[selectedLocale];
    return send(copy.revokedSubject, recipientEmail, copy.revoked(trimString(learnerDisplayName)), selectedLocale);
  }
  return { sendGuardianInvitation, sendGuardianAcceptedConfirmation, sendGuardianRevokedNotice };
}

module.exports = { buildGuardianVerificationLink, createGuardianLinkSender };
