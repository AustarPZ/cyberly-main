import { useTranslation } from 'react-i18next';

// Descriptors stay authoritative; S2A titles are presentation metadata only.
export default function DashboardResumeSurface({ guidance, inventory, requestScenarioExactResume, requestAssessmentExactResume }) {
  const { t } = useTranslation();
  const actions = guidance.kind === 'resume' ? [guidance.action] : guidance.kind === 'resume_choice' ? guidance.choices : [];
  if (!actions.length) return null;
  return (
    <section className="card" aria-labelledby="dashboard-exact-resume-title">
      <h2 id="dashboard-exact-resume-title">{t('dashboard.continueLearning')}</h2>
      <div className="scenario-card-actions">
        {actions.map(({ target }) => {
          const isScenario = target.type === 'resume_scenario';
          const metadata = isScenario && inventory?.find(attempt => attempt.attemptId === target.attemptId && attempt.scenarioSlug === target.scenarioSlug);
          const label = isScenario
            ? `${t('dashboard.resumeScenario')}: ${metadata?.title || target.scenarioSlug} (#${target.attemptId})`
            : t('dashboard.resumeAssessment');
          return <button key={`${target.type}:${target.attemptId}`} type="button" className="btn-secondary" onClick={() => {
            if (target.type === 'resume_scenario') requestScenarioExactResume(target);
            if (target.type === 'resume_assessment') requestAssessmentExactResume(target);
          }}>{label}</button>;
        })}
      </div>
    </section>
  );
}
