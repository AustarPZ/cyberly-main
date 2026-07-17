import { useEffect, useMemo, useState } from "react";
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

function statusClass(configured) {
  return configured ? "admin-status-badge review-approved" : "admin-status-badge review-draft";
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
      {success && result.textPreview && <small>{result.textPreview}</small>}
    </div>
  );
}

function ProviderCard({ provider, onTest, testing, result }) {
  const { t } = useTranslation();
  const label = PROVIDER_LABELS[provider.id] || provider.id;
  return (
    <article className="admin-ai-provider-card">
      <div className="admin-ai-provider-head">
        <div>
          <p className="res-tag">{t("admin.ai.providers.provider")}</p>
          <h3>{label}</h3>
        </div>
        <span className={statusClass(provider.configured)}>
          {provider.configured ? t("admin.ai.providers.configured") : t("admin.ai.providers.notConfigured")}
        </span>
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
      <ProviderTestResult result={result} />
    </article>
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
  });
  const [testingProvider, setTestingProvider] = useState(null);
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
      });
    });
    return () => { active = false; };
  }, [t]);

  const purposeRows = useMemo(() => Object.entries(state.purposeAssignments || {}), [state.purposeAssignments]);

  async function runProviderTest(providerId) {
    if (testingProvider) return;
    setTestingProvider(providerId);
    setTestResults(current => ({ ...current, [providerId]: null }));
    const result = await testAdminAiProvider(providerId);
    setTestingProvider(null);
    setTestResults(current => ({
      ...current,
      [providerId]: result.ok
        ? result.result
        : { status: "failed", code: result.code, error: result.error, httpStatus: result.status },
    }));
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
