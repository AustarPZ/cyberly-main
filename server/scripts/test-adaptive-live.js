const assert = require('node:assert/strict');

const { createAiConfig } = require('../src/ai/ai.config');
const { createAiProvider } = require('../src/ai/ai.provider');
const { createControlledAgenticService } = require('../src/agent/controlledAgentic.service');
const { createControlledToolExecutor } = require('../src/agent/controlledToolExecutor');

const PROMPTS = [
  'What should I study next?',
  'Which topic should I improve?',
  'Why should I practise account security?',
  'Am I improving?',
  'Recommend a scenario for me.',
  'Hello.',
  'Explain phishing in simple words.',
];

function safePreview(value) {
  return String(value || '').replace(/\s+/g, ' ').slice(0, 120);
}

function assertNoSensitiveText(value) {
  const text = JSON.stringify(value);
  for (const forbidden of [
    'OPENAI_API_KEY',
    'GEMINI_API_KEY',
    'ILMU_API_KEY',
    'password_hash',
    'rawAssessmentAnswers',
    'rawScenarioDecisions',
    'systemInstruction',
    'Reviewed Cyberly Sources',
  ]) {
    assert.equal(text.includes(forbidden), false, `live acceptance output must not include ${forbidden}`);
  }
}

function createFixtureAdaptiveService() {
  return {
    async getAdaptiveContext({ userId, locale }) {
      assert.equal(userId, 31001);
      return {
        learnerId: userId,
        locale,
        educationLevel: 'form_3',
        learningStyle: 'checklist',
        signalQuality: {
          overall: 'medium',
          assessmentAvailable: true,
          progressAvailable: true,
          scenarioHistoryAvailable: true,
          recommendationDataAvailable: true,
        },
        strengths: [{ topicLabel: 'phishing and scams', confidence: 'high' }],
        supportPriorities: [{
          topicId: 'password_and_account_security',
          topicLabel: 'password and account security',
          supportNeed: 'guided_practice',
          confidence: 'medium',
          reasons: [{ learnerExplanation: 'The current data suggests practical account-security practice may help.' }],
        }],
        responseGuidance: {
          explanationDepth: 'step_by_step',
          pacing: 'one concept at a time',
          preferredFormats: ['checklist'],
        },
        recommendedNextSteps: [
          { type: 'attempt_scenario', topicId: 'password_and_account_security', learnerActionRequired: true },
        ],
      };
    },
  };
}

function createFixtureExecutor() {
  return createControlledToolExecutor({
    handlers: {
      get_learning_progress: async () => ({
        learnerLevel: { code: 'L3', label: 'Developing', confidence: 'medium' },
        primaryFocus: { topicCode: 'password_and_account_security', topicLabel: 'password and account security' },
      }),
      get_current_recommendations: async () => ({
        topicCode: 'password_and_account_security',
        reasonCode: 'weak_topic',
      }),
      search_published_resources: async ({ input }) => ({
        items: [{
          title: `Safe resource for ${input.query}`,
          internalTarget: { page: 'resources', resourceSlug: 'password-safety' },
        }],
      }),
      list_recommended_scenarios: async () => ({
        items: [{
          title: 'Account security practice',
          internalTarget: { page: 'scenarios', scenarioSlug: 'account-security-practice' },
          completionStatus: 'not_completed',
        }],
      }),
      get_learner_profile: async () => ({
        educationLevel: 'form_3',
        learningStyle: 'checklist',
      }),
    },
  });
}

async function run() {
  if (process.env.AI_LIVE_TEST !== '1') {
    console.log('Adaptive live acceptance skipped. Set AI_LIVE_TEST=1 to run one focused OpenAI planner acceptance check.');
    return;
  }

  const config = createAiConfig({
    ...process.env,
    AI_PROVIDER_CYBERGUARD: 'openai',
    AI_DEFAULT_PROVIDER: 'openai',
    AI_PROVIDER_RUNTIME_DISABLED: process.env.AI_PROVIDER_RUNTIME_DISABLED || 'gemini',
  });
  const provider = createAiProvider(config);
  const router = provider.registry.resolveForPurpose('agent_route_planning');
  assert.equal(router.id, 'openai');
  assert.equal(router.configured, true);
  assert.equal(router.capabilities.toolCalling, true);

  const service = createControlledAgenticService({
    providerRegistry: provider.registry,
    adaptiveLearningService: createFixtureAdaptiveService(),
    executor: createFixtureExecutor(),
  });

  const results = [];
  for (const prompt of PROMPTS) {
    const result = await service.planAndExecute({
      userMessage: prompt,
      messages: [{ role: 'user', content: prompt }],
      context: {
        userId: 31001,
        role: 'user',
        accountStatus: 'active',
        requestedLocale: 'en',
        requestId: `adaptive-live-${results.length + 1}`,
      },
    });
    assert.equal(result.modelRequestCount <= 1, true);
    assert.equal(result.toolExecutionCount <= 1, true);
    if (result.plannerProvider) assert.equal(result.plannerProvider, 'openai');
    assertNoSensitiveText(result);
    results.push({
      prompt: safePreview(prompt),
      eligible: result.agenticEligible,
      used: result.agenticUsed,
      proposedTool: result.proposedTool,
      toolExecuted: result.toolExecuted,
      toolStatus: result.toolStatus,
      modelRequestCount: result.modelRequestCount,
      toolExecutionCount: result.toolExecutionCount,
      fallbackReason: result.fallbackReason,
      safeErrorCode: result.safeErrorCode,
    });
  }

  console.log(JSON.stringify({
    ok: true,
    provider: 'openai',
    geminiUsed: false,
    ilmuUsedForPlanning: false,
    results,
  }, null, 2));
}

run().catch(error => {
  console.error(error.code || error.message);
  process.exitCode = 1;
});
