const express = require('express');
const { requireAuth } = require('../auth/middleware');

function createAiRouter(aiService, options = {}) {
  const router = express.Router();
  const requireVerifiedEmail = options.requireVerifiedEmail || ((_req, _res, next) => next());

  router.post('/conversations/:conversationId/messages/:messageId/generate', requireAuth, requireVerifiedEmail, async (req, res, next) => {
    try {
      const result = await aiService.generateReply(
        req.session.userId,
        req.params.conversationId,
        req.params.messageId,
        {
          ...(req.body || {}),
          trustedActionContext: {
            sessionId: req.sessionID || req.session?.id || '',
            role: req.session.role,
          },
        }
      );
      res.status(result.statusCode).json(result.body);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createAiRouter,
};
