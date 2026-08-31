const { isCancellableStatus } = require('./privacyRequest.constants');

function toIso(value) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function mapLearnerPrivacyRequest(row) {
  return {
    reference: row.publicReference,
    type: row.requestType,
    subtype: row.requestSubtype,
    dataCategory: row.dataCategory || null,
    detail: row.requestDetail || null,
    status: row.status,
    submittedAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
    cancellable: isCancellableStatus(row.status),
  };
}

module.exports = { mapLearnerPrivacyRequest };
