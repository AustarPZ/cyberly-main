const express = require('express');
const { requireAuth } = require('../../auth/middleware');
const { createAgentActionRateLimiter } = require('../../security/rateLimitPolicies');

const agentActionRateLimit = createAgentActionRateLimiter();

function createActionProposalRouter(actionProposalService) {
  const router = express.Router();

  router.post('/api/agent/actions/proposals', requireAuth, agentActionRateLimit, async (req, res, next) => {
    try {
      res.status(201).json(await actionProposalService.createProposalFromRequest(req));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/agent/actions/proposals/:proposalId/confirm', requireAuth, agentActionRateLimit, async (req, res, next) => {
    try {
      res.json(await actionProposalService.confirmProposalFromRequest(req));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/agent/actions/proposals/:proposalId/cancel', requireAuth, agentActionRateLimit, async (req, res, next) => {
    try {
      res.json(await actionProposalService.cancelProposalFromRequest(req));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createActionProposalRouter,
};
