import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Button from '../design-system/primitives/Button';
import Surface from '../design-system/primitives/Surface';
import PageState from '../design-system/feedback/PageState';
import DashboardResumeSurface from './DashboardResumeSurface';
import DashboardActionVisual from './DashboardActionVisual';

const sameStamp = (a, b) => Boolean(a && b && a.scopeKey === b.scopeKey && a.revision === b.revision);
const slug = value => typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,139}$/.test(value);
const keys = (value, expected) => Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value,key));

// A presentation/action safety gate for the EXISTING normalized observation.
// It neither creates targets nor changes the frozen guidance priority.
export function isActionableDashboardRecommendation(observation, stamp, recommendation) {
  if (!sameStamp(observation?.stamp, stamp) || observation.state !== 'ready') return false;
  const value = observation.value;
  if (!Number.isSafeInteger(value?.id) || value.id <= 0 || !['active','viewed'].includes(value.lifecycle)) return false;
  if (recommendation?.id !== value.id || recommendation.status !== value.lifecycle) return false;
  const target = value.target;
  const raw = recommendation.target;
  if (!target || !raw) return false;
  switch (target.type) {
    case 'resources':
      return keys(target,['type']) && raw.page === 'resources' && (raw.resourceSlug === undefined || slug(raw.resourceSlug));
    case 'assessment': case 'scenarios':
      return keys(target,['type']) && raw.page === target.type;
    case 'scenario_intro':
      return keys(target,['type','scenarioSlug']) && slug(target.scenarioSlug) && raw.page === 'scenarios' && raw.scenarioSlug === target.scenarioSlug;
    case 'progress':
      return keys(target,['type','sectionId']) && (target.sectionId === null || slug(target.sectionId)) && raw.page === 'progress' && (raw.sectionId ?? null) === target.sectionId;
    default: return false;
  }
}

export default function DashboardNextStepArea(props) {
  return <ScopedNextStep key={JSON.stringify(props.stamp)} {...props} />;
}

function ScopedNextStep({ stamp, guidance, inventory, recommendationObservation: observation, recommendation,
  recommendationTitle, requestScenarioExactResume, requestAssessmentExactResume, onFollow, onComplete, onRetry,
  completing = false, completionError = false, successFeedback = null }) {
  const { t } = useTranslation();
  const [manualFamily, setManualFamily] = useState(null);
  const savedLabels = useRef(new Map());
  const currentGuidance = sameStamp(guidance?.stamp,stamp);
  const hasResume = currentGuidance && ['resume','resume_choice'].includes(guidance.kind);
  const currentRecommendation = sameStamp(observation?.stamp,stamp);
  const actionable = isActionableDashboardRecommendation(observation,stamp,recommendation);
  const recommendationAbsent = currentRecommendation && (observation.state === 'empty-confirmed'
    || (observation.state === 'ready' && observation.value?.lifecycle === 'completed'));
  const hasRecommendationPanel = !recommendationAbsent;
  const family = manualFamily === 'recommended' && recommendationAbsent && hasResume ? 'continue'
    : manualFamily || (hasResume ? 'continue' : 'recommended');
  const ownerLoading = currentGuidance && guidance.kind === 'loading' && guidance.owners.some(owner => owner !== 'recommendation');
  const ownerUnknown = !currentGuidance || (guidance.kind === 'recovery' && guidance.issues.some(issue => issue.owner !== 'recommendation'));

  useEffect(() => {
    const reveal = () => setManualFamily('recommended');
    const anchor = document.getElementById('dashboard-recommended-next-step');
    anchor?.addEventListener('dashboard:reveal-recommendation',reveal);
    return () => anchor?.removeEventListener('dashboard:reveal-recommendation',reveal);
  }, []);

  return <Surface as="section" id="dashboard-recommended-next-step" className="dashboard-anchor dashboard-next-step" aria-labelledby="dashboard-next-step-eyebrow">
    <div className="dashboard-action-copy">
    <p id="dashboard-next-step-eyebrow" className="dashboard-next-step-eyebrow">{t('dashboard.nextStep.eyebrow')}</p>
    <h2 id="progress-recommendation" className="progress-anchor">{t(family === 'continue' ? 'dashboard.continueLearning' : 'dashboard.recommendation.title')}</h2>
    {hasResume && hasRecommendationPanel && <div className="dashboard-next-step-controls">
      {['continue','recommended'].map(value => <Button key={value} className="btn-ghost" aria-pressed={family === value} onClick={() => setManualFamily(value)}>{t(`dashboard.nextStep.${value}`)}</Button>)}
    </div>}
    <div className="dashboard-next-step-body">
      {ownerLoading && <PageState message={t('dashboard.nextStep.ownerLoading')} />}
      {ownerUnknown && <PageState type="error" message={t('dashboard.nextStep.ownerUnavailable')} actionLabel={t('dashboard.integrated.retry')} onAction={onRetry} />}
      {family === 'continue' ? (hasResume ? <DashboardResumeSurface guidance={guidance} inventory={inventory} labelRegistry={savedLabels.current}
        requestScenarioExactResume={requestScenarioExactResume} requestAssessmentExactResume={requestAssessmentExactResume} />
        : !ownerLoading && !ownerUnknown && <PageState type="empty" message={t('dashboard.nextStep.continueEmpty')} />)
        : <div className="dashboard-recommendation-panel">
          {successFeedback}
          {completionError && <p role="alert">{t('dashboard.integrated.completionUnavailable')}</p>}
          {currentRecommendation && observation.state === 'loading' ? <PageState message={t('dashboard.recommendation.loading')} />
            : recommendationAbsent ? <PageState type="empty" message={t('dashboard.recommendation.empty')} />
              : actionable ? <>
                <h3>{recommendationTitle}</h3>
                <p className="dashboard-next-step-reason">{recommendation.reasonText}</p>
                <div className="dashboard-next-step-actions">
                  <Button variant="primary" disabled={completing} onClick={onFollow}>{t(recommendation.target.page === 'scenarios' ? 'dashboard.recommendation.practiceScenario'
                    : recommendation.target.page === 'resources' ? 'dashboard.recommendation.readResource'
                      : recommendation.target.page === 'assessment' ? 'dashboard.recommendation.startAssessment' : 'guidance.actions.openRecommendation')}</Button>
                  {recommendation.topicCode && <Button variant="quiet" className="btn-ghost" onClick={onComplete} loading={completing} loadingLabel={t('common.saving')}>{t('progress.recommendation.markComplete')}</Button>}
                </div>
              </> : <PageState type="error" message={t('dashboard.integrated.recommendationUnavailable')} actionLabel={t('dashboard.integrated.retry')} onAction={onRetry} />}
        </div>}
    </div>
    </div>
    <DashboardActionVisual family={family} targetType={actionable ? observation.value.target.type : null} />
  </Surface>;
}
