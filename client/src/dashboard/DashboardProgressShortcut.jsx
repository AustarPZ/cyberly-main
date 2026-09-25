import { useTranslation } from 'react-i18next';
import { normalizeLearningPathProgress } from '../progress/progressSemantics';

// The parent gates provenance before this shared observation is normalized.
export default function DashboardProgressShortcut({ value, loading, onActivate }) {
  const { t } = useTranslation();
  return <button className="dashboard-progress-shortcut" onClick={onActivate}>
    <span>{t('dashboard.astra.myProgress')}</span>
    <strong>{value ? `${normalizeLearningPathProgress(value).displayedPercent}%` : '—'}</strong>
    {!value && <span className="sr-only">{t(loading ? 'dashboard.progress.loading' : 'dashboard.integrated.progressUnavailable')}</span>}
    <span aria-hidden="true">↓</span>
  </button>;
}
