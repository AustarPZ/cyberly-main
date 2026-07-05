const SECRET_REQUEST_PATTERNS = [
  /\b(send|share|tell|give)\b.{0,40}\b(password|otp|one[- ]time password|private key|recovery code)\b/i,
  /\b(password|otp|private key|recovery code)\b.{0,40}\b(send|share|tell|give)\b/i,
];

const UNSAFE_INPUT_PATTERNS = [
  /\b(steal|harvest|dump|exfiltrate)\b.{0,60}\b(password|credential|cookie|token|otp)\b/i,
  /\b(malware|ransomware|keylogger|trojan)\b.{0,60}\b(code|script|build|create|write|make)\b/i,
  /\b(phishing kit|credential phishing|fake login page)\b/i,
  /\b(bypass|evade)\b.{0,60}\b(antivirus|detection|firewall|mfa|2fa)\b/i,
  /\b(exploit|hack into|break into)\b.{0,60}\b(account|server|wifi|website|database)\b/i,
  /\b(dox|doxx|doxxing)\b/i,
];

const UNSAFE_OUTPUT_PATTERNS = [
  /\bhere(?:'s| is)\b.{0,40}\b(malware|keylogger|phishing kit|exploit)\b/i,
  /\brun this exploit\b/i,
  /\bsteal\b.{0,40}\b(credentials|passwords|cookies|tokens)\b/i,
];

function isUnsafeUserRequest(content) {
  const text = String(content || '');
  return UNSAFE_INPUT_PATTERNS.some(pattern => pattern.test(text));
}

function validateProviderOutput(content) {
  const text = String(content || '').trim();
  if (!text) return { ok: false, reason: 'empty' };
  if (SECRET_REQUEST_PATTERNS.some(pattern => pattern.test(text))) {
    return { ok: false, reason: 'secret_request' };
  }
  if (UNSAFE_OUTPUT_PATTERNS.some(pattern => pattern.test(text))) {
    return { ok: false, reason: 'unsafe_output' };
  }
  return { ok: true, content: text };
}

module.exports = {
  isUnsafeUserRequest,
  validateProviderOutput,
};
