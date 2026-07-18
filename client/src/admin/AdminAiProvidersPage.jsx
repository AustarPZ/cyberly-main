import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAdminAiProviders, testAdminAiProvider } from "./adminApi";

const PROVIDER_LABELS = {
  openai: "OpenAI",
  gemini: "Gemini",
  ilmu: "ILMU",
};

const CAPABILITIES = [
  ["chat", "admin.ai.capabilities.chat"],
  ["structuredOutput", "admin.ai.capabilities.structuredOutput"],
  ["toolCalling", "admin.ai.capabilities.toolCalling"],
  ["streaming", "admin.ai.capabilities.streaming"],
  ["usageReporting", "admin.ai.capabilities.usageReporting"],
];

const PURPOSE_KEYS = {
  cyberguard_chat: "admin.ai.purposes.cyberguard",
  agent_route_planning: "admin.ai.purposes.agentRouter",
  lightweight_tool_selection: "admin.ai.purposes.lightweight",
  translation_assistance: "admin.ai.purposes.translation",
  safety_evaluation: "admin.ai.purposes.safety",
};

function statusClass(configured, runtimeAvailable) {
  if (!configured) return "admin-status-badge review-draft";
  return runtimeAvailable === false ? "admin-status-badge publication-draft" : "admin-status-badge review-approved";
}

function runtimeReasonKey(provider) {
  if (!provider.configured) return "admin.ai.providers.notConfigured";
  if (provider.runtimeAvailable !== false) return "admin.ai.providers.runtimeAvailable";
  if (provider.lastRuntimeError === "AI_AUTH_FAILED") return "admin.ai.providers.runtimeAuthFailed";
  return "admin.ai.providers.runtimeUnavailable";
}

function ProviderTestResult({ result }) {
  const { t } = useTranslation();
  if (!result) return null;
  const success = result.status === "success";
  return (
    <div className={`admin-ai-test-result ${success ? "success" : "failed"}`} role="status" aria-live="polite">
      <strong>{success ? t("admin.ai.providers.connectionSuccessful") : t("admin.ai.providers.connectionFailed")}</strong>
      {success ? (
        <span>{t("admin.ai.providers.testLatency", { latency: result.latencyMs ?? 0 })}</span>
      ) : (
        <span>{result.code || result.error || t("admin.ai.providers.safeFailure")}</span>
      )}
      <dl className="admin-ai-runtime-details">
        <div>
          <dt>{t("admin.ai.providers.runtimeOk")}</dt>
          <dd>{success ? t("common.yes") : t("common.no")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.providers.lastTest")}</dt>
          <dd>{result.testedAt ? new Date(result.testedAt).toLocaleString() : t("admin.ai.providers.notTested")}</dd>
        </div>
        {success && (
          <>
            <div>
              <dt>{t("admin.ai.providers.finishReason")}</dt>
              <dd>{result.finishReason || t("common.notSet")}</dd>
            </div>
            <div>
              <dt>{t("admin.ai.providers.requestIdAvailable")}</dt>
              <dd>{result.providerRequestId ? t("common.yes") : t("common.no")}</dd>
            </div>
          </>
        )}
      </dl>
      {success && result.textPreview && <small>{result.textPreview}</small>}
    </div>
  );
}

function ProviderCard({ provider, onTest, testing, result }) {
  const { t } = useTranslation();
  const label = PROVIDER_LABELS[provider.id] || provider.id;
  const runtimeUnavailable = provider.configured && provider.runtimeAvailable === false;
  return (
    <article className="admin-ai-provider-card">
      <div className="admin-ai-provider-head">
        <div>
          <p className="res-tag">{t("admin.ai.providers.provider")}</p>
          <h3>{label}</h3>
        </div>
        <div className="admin-ai-provider-statuses" aria-label={t("admin.ai.providers.status")}>
          <span className={statusClass(provider.configured, provider.runtimeAvailable)}>
            {provider.configured ? t("admin.ai.providers.configured") : t("admin.ai.providers.notConfigured")}
          </span>
          {provider.configured && (
            <span className={statusClass(provider.configured, provider.runtimeAvailable)}>
              {provider.runtimeAvailable === false
                ? t("admin.ai.providers.runtimeUnavailable")
                : t("admin.ai.providers.runtimeAvailable")}
            </span>
          )}
        </div>
      </div>
      <dl className="admin-ai-provider-meta">
        <div>
          <dt>{t("admin.ai.providers.model")}</dt>
          <dd>{provider.model || t("common.notSet")}</dd>
        </div>
      </dl>
      <div className="admin-ai-capability-list" aria-label={t("admin.ai.providers.capabilities")}>
        {CAPABILITIES.map(([key, labelKey]) => {
          const implemented = Boolean(provider.capabilities?.[key]);
          return (
            <span key={key} className={implemented ? "implemented" : "not-implemented"}>
              {t(labelKey)}
              <strong>{implemented ? t("common.yes") : t("common.no")}</strong>
            </span>
          );
        })}
      </div>
      <dl className="admin-ai-runtime-summary">
        <div>
          <dt>{t("admin.ai.providers.runtimeOk")}</dt>
          <dd>
            {result
              ? (result.status === "success" ? t("common.yes") : t("common.no"))
              : (provider.runtimeAvailable === false ? t("common.no") : t("admin.ai.providers.notTested"))}
          </dd>
        </div>
        {provider.configured && (
          <div>
            <dt>{t("admin.ai.providers.runtimeState")}</dt>
            <dd>{t(runtimeReasonKey(provider))}</dd>
          </div>
        )}
        <div>
          <dt>{t("admin.ai.providers.lastTest")}</dt>
          <dd>{result?.testedAt ? new Date(result.testedAt).toLocaleString() : t("admin.ai.providers.notTested")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.providers.latency")}</dt>
          <dd>{Number.isFinite(Number(result?.latencyMs)) ? t("admin.ai.providers.testLatency", { latency: result.latencyMs }) : t("admin.ai.providers.notTested")}</dd>
        </div>
      </dl>
      {provider.effectivePurposes?.length > 0 && (
        <p className="admin-ai-purpose-note">
          {t("admin.ai.providers.usedFor", {
            purposes: provider.effectivePurposes.map(purpose => t(PURPOSE_KEYS[purpose], { defaultValue: purpose })).join(", "),
          })}
        </p>
      )}
      <button
        type="button"
        className="btn-secondary"
        onClick={() => onTest(provider.id)}
        disabled={!provider.configured || testing}
      >
        {testing ? t("admin.ai.providers.testing") : t("admin.ai.providers.testConnection")}
      </button>
      {!provider.configured && <p className="admin-resource-summary-note">{t("admin.ai.providers.notConfiguredHelp")}</p>}
      {runtimeUnavailable && (
        <p className="admin-resource-summary-note">
          {provider.id === "gemini"
            ? t("admin.ai.providers.geminiRuntimeUnavailableNote")
            : t("admin.ai.providers.runtimeUnavailableNote")}
        </p>
      )}
      <ProviderTestResult result={result} />
    </article>
  );
}

function ControlledAgenticRuntime({ runtime }) {
  const { t } = useTranslation();
  if (!runtime) return null;
  const tools = Array.isArray(runtime.allowedTools) ? runtime.allowedTools : [];
  return (
    <section className="admin-ai-panel" aria-labelledby="admin-agentic-runtime-title">
      <p className="res-tag">{t("admin.ai.agentic.badge")}</p>
      <h3 id="admin-agentic-runtime-title">{t("admin.ai.agentic.title")}</h3>
      <p>{t("admin.ai.agentic.description")}</p>
      <dl className="admin-ai-purpose-list">
        <div>
          <dt>{t("admin.ai.agentic.productionRouter")}</dt>
          <dd>{PROVIDER_LABELS[runtime.productionRouter] || runtime.productionRouter || "OpenAI"}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.agentic.executionMode")}</dt>
          <dd>{t("admin.ai.agentic.singleStep")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.agentic.maxModelCalls")}</dt>
          <dd>{runtime.maxModelCalls ?? 2}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.agentic.maxToolExecutions")}</dt>
          <dd>{runtime.maxToolExecutions ?? 1}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.agentic.approvedTools")}</dt>
          <dd>{tools.length}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.agentic.autonomousLoop")}</dt>
          <dd>{t("admin.ai.agentic.disabled")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.agentic.writeActions")}</dt>
          <dd>{t("admin.ai.agentic.disabled")}</dd>
        </div>
      </dl>
      <ul className="admin-ai-safety-list">
        <li>{t("admin.ai.agentic.readOnly")}</li>
        <li>{t("admin.ai.agentic.backendControlled")}</li>
        <li>{t("admin.ai.agentic.deterministicFallback")}</li>
        <li>{t("admin.ai.agentic.toolValidation")}</li>
        <li>{t("admin.ai.agentic.secureSessionIdentity")}</li>
        <li>{t("admin.ai.agentic.noAutomaticProgressChanges")}</li>
      </ul>
      <div className="admin-ai-tool-list" aria-label={t("admin.ai.agentic.toolListLabel")}>
        {tools.map(tool => (
          <article key={tool.name} className="admin-ai-tool-card">
            <h4>{tool.name}</h4>
            <p>{tool.description}</p>
            <dl>
              <div>
                <dt>{t("admin.ai.agentic.mode")}</dt>
                <dd>{t("admin.ai.agentic.readOnlyShort")}</dd>
              </div>
              <div>
                <dt>{t("admin.ai.agentic.allowedRole")}</dt>
                <dd>{(tool.allowedRoles || []).join(", ") || "user"}</dd>
              </div>
              <div>
                <dt>{t("admin.ai.agentic.riskLevel")}</dt>
                <dd>{tool.riskLevel}</dd>
              </div>
            </dl>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdaptiveLearningRuntime({ runtime }) {
  const { t } = useTranslation();
  if (!runtime) return null;
  const sources = Array.isArray(runtime.dataSources) ? runtime.dataSources : [];
  const rules = Array.isArray(runtime.rulesSummary) ? runtime.rulesSummary : [];
  return (
    <section className="admin-ai-panel" aria-labelledby="admin-adaptive-runtime-title">
      <p className="res-tag">{t("admin.ai.adaptive.badge")}</p>
      <h3 id="admin-adaptive-runtime-title">{t("admin.ai.adaptive.title")}</h3>
      <p>{t("admin.ai.adaptive.description")}</p>
      <dl className="admin-ai-purpose-list">
        <div>
          <dt>{t("admin.ai.adaptive.status")}</dt>
          <dd>{t("admin.ai.adaptive.enabled")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.adaptive.mode")}</dt>
          <dd>{t("admin.ai.adaptive.deterministicExplainable")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.adaptive.persistentAiRecommendations")}</dt>
          <dd>{runtime.persistentAiRecommendations ? t("admin.ai.adaptive.enabled") : t("admin.ai.adaptive.disabled")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.adaptive.automaticDifficultyChanges")}</dt>
          <dd>{runtime.automaticDifficultyChanges ? t("admin.ai.adaptive.enabled") : t("admin.ai.adaptive.disabled")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.adaptive.automaticScoreChanges")}</dt>
          <dd>{runtime.automaticScoreChanges ? t("admin.ai.adaptive.enabled") : t("admin.ai.adaptive.disabled")}</dd>
        </div>
        <div>
          <dt>{t("admin.ai.adaptive.learnerChoiceRequired")}</dt>
          <dd>{runtime.learnerChoiceRequired ? t("admin.ai.adaptive.enabled") : t("common.no")}</dd>
        </div>
      </dl>
      <div className="admin-ai-tool-list" aria-label={t("admin.ai.adaptive.dataSources")}>
        {sources.map(source => (
          <span key={source} className="admin-status-badge publication-draft">
            {t(`admin.ai.adaptive.sources.${source}`, { defaultValue: source })}
          </span>
        ))}
      </div>
      <ul className="admin-ai-safety-list">
        {rules.map(rule => (
          <li key={rule}>{t(`admin.ai.adaptive.rules.${rule}`, { defaultValue: rule })}</li>
        ))}
        <li>{t("admin.ai.adaptive.basedOnAvailableRecords")}</li>
        <li>{t("admin.ai.adaptive.youAreAlwaysInControl")}</li>
      </ul>
    </section>
  );
}

export default function AdminAiProvidersPage() {
  const { t } = useTranslation();
  const [state, setState] = useState({
    loading: true,
    error: "",
    providers: [],
    defaultProvider: null,
    purposeAssignments: {},
    controlledAgenticRuntime: null,
    adaptiveLearningRuntime: null,
  });
  const [testingProvider, setTestingProvider] = useState(null);
  const testingProviderRef = useRef(null);
  const [testResults, setTestResults] = useState({});

  useEffect(() => {
    let active = true;
    getAdminAiProviders().then(result => {
      if (!active) return;
      if (!result.ok) {
        setState(current => ({ ...current, loading: false, error: result.error || t("admin.ai.providers.errors.load") }));
        return;
      }
      setState({
        loading: false,
        error: "",
        providers: result.providers,
        defaultProvider: result.defaultProvider,
        purposeAssignments: result.purposeAssignments,
        controlledAgenticRuntime: result.controlledAgenticRuntime,
        adaptiveLearningRuntime: result.adaptiveLearningRuntime,
      });
    });
    return () => { active = false; };
  }, [t]);

  const purposeRows = useMemo(() => Object.entries(state.purposeAssignments || {}), [state.purposeAssignments]);

  async function runProviderTest(providerId) {
    if (testingProviderRef.current) return;
    testingProviderRef.current = providerId;
    setTestingProvider(providerId);
    setTestResults(current => ({ ...current, [providerId]: null }));
    try {
      const result = await testAdminAiProvider(providerId);
      setTestResults(current => ({
        ...current,
        [providerId]: result.ok
          ? result.result
          : { status: "failed", code: result.code, error: result.error, httpStatus: result.status },
      }));
    } finally {
      testingProviderRef.current = null;
      setTestingProvider(null);
    }
  }

  if (state.loading) {
    return <p className="admin-resource-state" role="status">{t("admin.ai.providers.loading")}</p>;
  }
  if (state.error) {
    return <p className="field-error" role="alert">{state.error}</p>;
  }

  return (
    <div className="admin-ai-page" aria-labelledby="admin-ai-title">
      <section className="admin-ai-hero">
        <div>
          <p className="res-tag">{t("admin.ai.badge")}</p>
          <h2 id="admin-ai-title">{t("admin.ai.providers.title")}</h2>
          <p>{t("admin.ai.providers.description")}</p>
        </div>
        <span className="admin-status-badge publication-draft">
          {t("admin.ai.providers.defaultProvider", { provider: state.defaultProvider || t("common.notSet") })}
        </span>
      </section>

      <section className="admin-ai-cost-note" aria-label={t("admin.ai.providers.costNoteLabel")}>
        <strong>{t("admin.ai.providers.costNoteTitle")}</strong>
        <span>{t("admin.ai.providers.costNote")}</span>
      </section>

      <section className="admin-ai-provider-grid" aria-label={t("admin.ai.providers.configuration")}>
        {state.providers.map(provider => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            testing={testingProvider === provider.id}
            result={testResults[provider.id]}
            onTest={runProviderTest}
          />
        ))}
      </section>

      <section className="admin-ai-panel">
        <p className="res-tag">{t("admin.ai.purposes.title")}</p>
        <h3>{t("admin.ai.purposes.heading")}</h3>
        <dl className="admin-ai-purpose-list">
          {purposeRows.map(([purpose, provider]) => (
            <div key={purpose}>
              <dt>{t(PURPOSE_KEYS[purpose], { defaultValue: purpose })}</dt>
              <dd>{PROVIDER_LABELS[provider] || provider}</dd>
            </div>
          ))}
        </dl>
      </section>

      <ControlledAgenticRuntime runtime={state.controlledAgenticRuntime} />
      <AdaptiveLearningRuntime runtime={state.adaptiveLearningRuntime} />

      <section className="admin-ai-panel">
        <p className="res-tag">{t("admin.ai.safety.badge")}</p>
        <h3>{t("admin.ai.safety.title")}</h3>
        <ul className="admin-ai-safety-list">
          <li>{t("admin.ai.safety.readOnlyTools")}</li>
          <li>{t("admin.ai.safety.backendControlled")}</li>
          <li>{t("admin.ai.safety.noScoreChanges")}</li>
          <li>{t("admin.ai.safety.noProgressMutation")}</li>
          <li>{t("admin.ai.safety.learnerControlled")}</li>
        </ul>
      </section>
    </div>
  );
}
