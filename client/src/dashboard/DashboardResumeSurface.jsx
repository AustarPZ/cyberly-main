import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../design-system/primitives/Button';

// Descriptors stay authoritative; S2A titles are presentation metadata only.
export default function DashboardResumeSurface({ guidance, inventory, labelRegistry, requestScenarioExactResume, requestAssessmentExactResume }) {
  const { t } = useTranslation();
  const labels = useRef(new Map());
  const sessionLabels = labelRegistry || labels.current;
  const actions = guidance.kind === 'resume' ? [guidance.action] : guidance.kind === 'resume_choice' ? guidance.choices : [];
  if (!actions.length) return null;
  return (
    <section aria-label={t('dashboard.continueLearning')}>
      <div className="dashboard-resume-choices">
        {actions.map(({ target }) => {
          const isScenario = target.type === 'resume_scenario';
          const metadata = isScenario && inventory?.find(attempt => attempt.attemptId === target.attemptId && attempt.scenarioSlug === target.scenarioSlug);
          const title = typeof metadata?.title === 'string' && metadata.title.trim() ? metadata.title : t('dashboard.nextStep.savedPractice');
          const repeated = isScenario && actions.filter(action => action.target.type === 'resume_scenario' && inventory?.find(item => item.attemptId === action.target.attemptId && item.scenarioSlug === action.target.scenarioSlug)?.title === metadata?.title).length > 1;
          const identity = `${target.type}:${target.attemptId}`;
          if (repeated && !sessionLabels.has(identity)) sessionLabels.set(identity, sessionLabels.size + 1);
          const label = isScenario
            ? `${t('dashboard.resumeScenario')}: ${title}`
            : t('dashboard.resumeAssessment');
          return <Button key={identity} className="dashboard-resume-choice" onClick={() => {
            if (target.type === 'resume_scenario') requestScenarioExactResume(target);
            if (target.type === 'resume_assessment') requestAssessmentExactResume(target);
          }}><span>{label}</span>{sessionLabels.has(identity) && <span className="dashboard-resume-label">{t('dashboard.nextStep.savedPracticeNumber', { number: sessionLabels.get(identity) })}</span>}</Button>;
        })}
      </div>
    </section>
  );
}
