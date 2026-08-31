const express = require('express');
const { requireAuth } = require('../auth/middleware');
const { ERROR_CODES } = require('../errors/errorCodes');

const REFERENCE_PATTERN = /^CY-PR-[0-9A-HJKMNP-TV-Z]{20}$/;

function createPrivacyRequestRouter(service, rateLimits) {
  const router = express.Router();

  router.post('/requests', requireAuth, rateLimits.submissionIp, rateLimits.submissionUser, async (req, res, next) => {
    try {
      const result = await service.createRequest(req.session.userId, req.body, req.session.language || 'en');
      res.status(result.created ? 201 : 200).json({ request: result.request });
    } catch (error) { next(error); }
  });

  router.get('/requests', requireAuth, rateLimits.readUser, async (req, res, next) => {
    try {
      res.json({ requests: await service.listRequests(req.session.userId) });
    } catch (error) { next(error); }
  });

  router.get('/requests/:reference', requireAuth, rateLimits.readUser, async (req, res, next) => {
    try {
      res.json({ request: await service.getRequest(req.session.userId, req.params.reference) });
    } catch (error) { next(error); }
  });

  router.post('/requests/:reference/cancel', requireAuth, rateLimits.cancellationUser, async (req, res, next) => {
    try {
      res.json({ request: await service.cancelRequest(req.session.userId, req.params.reference) });
    } catch (error) { next(error); }
  });

  router.use((error, _req, res, next) => {
    if (error.code !== ERROR_CODES.PRIVACY_REQUEST_ALREADY_ACTIVE) return next(error);
    const candidate = String(error.existingReference || '').trim().toUpperCase();
    const body = {
      code: ERROR_CODES.PRIVACY_REQUEST_ALREADY_ACTIVE,
      message: 'An active Privacy Request already exists for this scope.',
    };
    if (REFERENCE_PATTERN.test(candidate)) {
      body.details = { existingReference: candidate };
    }
    return res.status(409).json(body);
  });

  return router;
}

module.exports = { createPrivacyRequestRouter };
