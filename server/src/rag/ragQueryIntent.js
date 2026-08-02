const MAX_ENRICHED_QUERY_LENGTH = 240;

const SCAM_QUERY_TERMS = [
  'phishing',
  'scam',
  'sms',
  'otp',
  'banking message',
  'malicious link',
  'impersonation',
  'pancingan',
  'penipuan',
  'mesej bank',
  'pautan mencurigakan',
  '钓鱼',
  '诈骗',
  '银行',
  '短信',
  '验证码',
  '链接',
];

const SCAM_CATEGORY_CODES = ['Scams'];
const SCAM_RESOURCE_SLUGS = ['phishing', 'online-scams'];

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function includesAny(text, terms) {
  return terms.some(term => text.includes(term));
}

function hasPhishingAndScamIntent(query) {
  const text = normalizeText(query);
  if (!text) return false;
  if (includesAny(text, ['fake news', 'misinformation', 'deepfake', 'disinformation', 'berita palsu', 'maklumat palsu', '假新闻', '错误信息', '深度伪造'])) {
    return false;
  }
  return (
    includesAny(text, [
      'phishing',
      'scam',
      'smishing',
      'otp',
      'one-time password',
      'verification code',
      'suspicious sms',
      'fake sms',
      'bank message',
      'banking message',
      'fake bank',
      'delivery sms',
      'delivery text',
      'malicious link',
      'suspicious link',
      'impersonat',
      'pancingan',
      'penipuan',
      'sms mencurigakan',
      'mesej bank',
      'mesej meminta otp',
      'pautan penipuan',
      'pautan mencurigakan',
      '钓鱼',
      '诈骗',
      '假银行',
      '可疑短信',
      '验证码',
      '短信要求',
      '短信中的',
      '短信里的',
    ]) ||
    /\b(fake|suspicious)\b.{0,40}\b(bank|banking|sms|text|message|delivery|link)\b/i.test(text) ||
    /\b(bank|banking|sms|text|message|delivery|link)\b.{0,40}\b(fake|suspicious|scam|otp|click)\b/i.test(text)
  );
}

function createRagQueryIntent(query) {
  if (hasPhishingAndScamIntent(query)) {
    return {
      intent: 'phishing_and_scams',
      categoryCodes: SCAM_CATEGORY_CODES,
      preferredResourceSlugs: SCAM_RESOURCE_SLUGS,
      queryTerms: SCAM_QUERY_TERMS,
      allowEnglishFallback: true,
      minimumScore: 2,
    };
  }

  return {
    intent: 'generic_cyber_wellness',
    categoryCodes: [],
    preferredResourceSlugs: [],
    queryTerms: [],
    allowEnglishFallback: true,
    minimumScore: 0,
  };
}

function enrichRagQuery(query, intent = createRagQueryIntent(query)) {
  const original = String(query || '').replace(/\s+/g, ' ').trim();
  const terms = Array.isArray(intent?.queryTerms) ? intent.queryTerms : [];
  const lower = normalizeText(original);
  const additions = [];

  for (const term of terms) {
    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm || lower.includes(normalizedTerm)) continue;
    additions.push(term);
  }

  return [original, ...additions]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, MAX_ENRICHED_QUERY_LENGTH)
    .trim();
}

module.exports = {
  MAX_ENRICHED_QUERY_LENGTH,
  createRagQueryIntent,
  enrichRagQuery,
};
