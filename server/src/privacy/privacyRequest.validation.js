const { ERROR_CODES } = require('../errors/errorCodes');
const {
  CORRECTION_SUBTYPES,
  DATA_CATEGORIES,
  DELETION_SUBTYPES,
} = require('./privacyRequest.constants');

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const REFERENCE_PATTERN = /^CY-PR-[0-9A-HJKMNP-TV-Z]{20}$/;
const CONTROL_PATTERN = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;
const ALLOWED_FIELDS = new Set(['type', 'subtype', 'dataCategory', 'detail', 'clientRequestId', 'currentPassword']);

function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  error.code = ERROR_CODES.PRIVACY_REQUEST_INVALID;
  return error;
}

function normalizeDetail(value, { required }) {
  if (value === undefined || value === null || value === '') {
    if (required) throw invalid('Request detail is required.');
    return null;
  }
  if (typeof value !== 'string') throw invalid('Request detail must be plain text.');
  const normalized = value.replace(/\r\n?/g, '\n').trim();
  if (!normalized && required) throw invalid('Request detail is required.');
  if (CONTROL_PATTERN.test(normalized)) throw invalid('Request detail contains prohibited characters.');
  if ([...normalized].length > 1000) throw invalid('Request detail must not exceed 1000 characters.');
  return normalized || null;
}

function normalizeCreatePrivacyRequest(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw invalid('Invalid Privacy Request.');
  for (const key of Object.keys(body)) {
    if (!ALLOWED_FIELDS.has(key)) throw invalid('Privacy Request contains an unsupported field.');
  }
  const type = body.type;
  const subtype = body.subtype;
  if (type === 'CORRECTION') {
    if (!CORRECTION_SUBTYPES.includes(subtype)) throw invalid('Invalid correction request subtype.');
    if (body.dataCategory !== undefined && body.dataCategory !== null) throw invalid('Correction requests do not accept a data category.');
    if (body.currentPassword !== undefined) throw invalid('Correction requests do not accept a current password.');
  } else if (type === 'DELETION') {
    if (!DELETION_SUBTYPES.includes(subtype)) throw invalid('Invalid deletion request subtype.');
  } else {
    throw invalid('Invalid Privacy Request type.');
  }

  let dataCategory = null;
  if (subtype === 'SELECTED_PERSONAL_DATA') {
    if (!DATA_CATEGORIES.includes(body.dataCategory)) throw invalid('A valid data category is required.');
    dataCategory = body.dataCategory;
  } else if (body.dataCategory !== undefined && body.dataCategory !== null) {
    throw invalid('This request subtype does not accept a data category.');
  }

  const clientRequestId = String(body.clientRequestId || '').trim().toLowerCase();
  if (!UUID_PATTERN.test(clientRequestId)) throw invalid('A valid client request ID is required.');
  const detailRequired = type === 'CORRECTION' || subtype === 'SELECTED_PERSONAL_DATA';
  return {
    type,
    subtype,
    dataCategory,
    detail: normalizeDetail(body.detail, { required: detailRequired }),
    clientRequestId,
    currentPassword: type === 'DELETION' ? String(body.currentPassword || '') : null,
  };
}

function normalizePrivacyReference(value) {
  const reference = String(value || '').trim().toUpperCase();
  if (!REFERENCE_PATTERN.test(reference)) throw invalid('Invalid Privacy Request reference.');
  return reference;
}

module.exports = {
  normalizeCreatePrivacyRequest,
  normalizePrivacyReference,
};
