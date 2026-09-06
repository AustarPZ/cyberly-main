const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { ERROR_CODES } = require('../errors/errorCodes');
const { GUARDIAN_REFERENCE_PATTERN } = require('./guardianLink.constants');

function audit(req) {
  return {
    requestIp: req.ip || req.socket?.remoteAddress || null,
    userAgent: String(req.get?.('user-agent') || '').slice(0, 255) || null,
  };
}

function createGuardianLinkRouter(service, rateLimits, { requireVerifiedEmail }) {
  const router = express.Router();

  router.post('/token/inspect', rateLimits.publicInspectByIp, rateLimits.publicInspectByToken, async (req, res, next) => {
    try { res.json(await service.inspectToken(req.body?.token)); } catch (error) { next(error); }
  });
  router.post('/token/accept', rateLimits.publicDecisionByIp, rateLimits.publicDecisionByToken, async (req, res, next) => {
    try { res.json(await service.acceptToken(req.body?.token, audit(req))); } catch (error) { next(error); }
  });
  router.post('/token/decline', rateLimits.publicDecisionByIp, rateLimits.publicDecisionByToken, async (req, res, next) => {
    try { res.json(await service.declineToken(req.body?.token, audit(req))); } catch (error) { next(error); }
  });

  router.get('/', requireAuth, rateLimits.readByLearner, async (req, res, next) => {
    try { res.json({ relationship: await service.getCurrentRelationship(req.session.userId) }); } catch (error) { next(error); }
  });
  router.post('/invitations', requireAuth, requireVerifiedEmail, rateLimits.createByIp, rateLimits.createByLearner,
    async (req, res, next) => {
      try {
        const result = await service.createInvitation({ userId: req.session.userId,
          guardianEmail: req.body?.guardianEmail, currentPassword: req.body?.currentPassword,
          locale: req.body?.locale || req.session.language || 'en', ...audit(req) });
        res.status(201).json({ relationship: result.relationship });
      } catch (error) { next(error); }
    });
  router.post('/:reference/resend', requireAuth, requireVerifiedEmail,
    rateLimits.resendByIp, rateLimits.resendByRelationship, async (req, res, next) => {
      try {
        const result = await service.resendInvitation({ userId: req.session.userId,
          reference: req.params.reference, ...audit(req) });
        res.status(202).json({ relationship: result.relationship });
      } catch (error) { next(error); }
    });
  router.post('/:reference/revoke', requireAuth, rateLimits.revokeByLearner, async (req, res, next) => {
    try {
      res.json({ relationship: await service.revokeRelationship({ userId: req.session.userId,
        reference: req.params.reference, currentPassword: req.body?.currentPassword, ...audit(req) }) });
    } catch (error) { next(error); }
  });

  router.use((error, _req, res, next) => {
    if (error.code !== ERROR_CODES.GUARDIAN_LINK_ACTIVE_EXISTS) return next(error);
    const reference = String(error.existingReference || '').trim().toUpperCase();
    const body = { code: error.code, message: 'An active Guardian Link already exists.' };
    if (GUARDIAN_REFERENCE_PATTERN.test(reference)) body.details = { existingReference: reference };
    return res.status(409).json(body);
  });
  return router;
}

module.exports = { createGuardianLinkRouter };
