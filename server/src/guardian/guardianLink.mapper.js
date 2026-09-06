function toIso(value) { return value ? new Date(value).toISOString() : null; }

function mapLearnerGuardianLink(row) {
  if (!row) return null;
  const terminalAt = row.status === 'DECLINED' ? row.declinedAt
    : row.status === 'EXPIRED' ? row.expiredAt
      : row.status === 'REVOKED' ? row.revokedAt : null;
  return {
    reference: row.publicReference,
    guardianEmail: row.guardianEmailNormalized,
    status: row.status,
    locale: row.locale,
    invitedAt: toIso(row.inviteIssuedAt),
    expiresAt: toIso(row.inviteExpiresAt),
    updatedAt: toIso(row.updatedAt),
    terminalAt: toIso(terminalAt),
    canResend: row.status === 'PENDING_VERIFICATION',
    canRevoke: ['PENDING_VERIFICATION', 'LINKED'].includes(row.status),
  };
}

function mapPublicGuardianLink(row) {
  return {
    learnerDisplayName: row.learnerDisplayName,
    expiresAt: toIso(row.inviteExpiresAt),
    canAccept: row.status === 'PENDING_VERIFICATION',
    canDecline: row.status === 'PENDING_VERIFICATION',
    informationCode: 'VERIFIED_EMAIL_NOT_LEGAL_GUARDIANSHIP',
  };
}

module.exports = { mapLearnerGuardianLink, mapPublicGuardianLink };
