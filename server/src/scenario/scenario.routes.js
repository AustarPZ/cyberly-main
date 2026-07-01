const express = require('express');
const { requireAuth } = require('../auth/middleware');

function createScenarioRouter(scenarioService) {
  const router = express.Router();

  router.get('/api/scenarios', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.listScenarios(req.session.userId, req.query));
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/scenarios/recommended', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.getRecommendedScenarios(req.session.userId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/scenarios/dashboard', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.getScenarioDashboard(req.session.userId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/scenarios/:slug', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.getScenario(req.params.slug));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/scenarios/:slug/attempts', requireAuth, async (req, res, next) => {
    try {
      res.status(201).json(await scenarioService.startOrResume(req.session.userId, req.params.slug));
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/scenario-attempts/:attemptId', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.getAttempt(req.session.userId, req.params.attemptId));
    } catch (error) {
      next(error);
    }
  });

  router.put('/api/scenario-attempts/:attemptId/decisions', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.saveDecision(req.session.userId, req.params.attemptId, req.body));
    } catch (error) {
      next(error);
    }
  });

  router.post('/api/scenario-attempts/:attemptId/complete', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.completeAttempt(req.session.userId, req.params.attemptId));
    } catch (error) {
      next(error);
    }
  });

  router.get('/api/scenario-attempts/:attemptId/result', requireAuth, async (req, res, next) => {
    try {
      res.json(await scenarioService.getResult(req.session.userId, req.params.attemptId));
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createScenarioRouter,
};
