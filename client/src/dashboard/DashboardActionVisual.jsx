import { useTranslation } from 'react-i18next';

// Local DOM illustration adapted from approved v2.3 app.js art()/style.css phone.
// Family-only visuals intentionally carry no invented activity facts or answers.
const SYMBOLS = { resources: '▤', assessment: '◇', scenarios: '◇', scenario_intro: '◇', progress: '↗', continue: '↗' };
export default function DashboardActionVisual({ family, targetType }) {
  const { t } = useTranslation();
  const kind = family === 'continue' ? 'continue' : targetType;
  return <div className="dashboard-action-visual" aria-hidden="true">
    <div className="dashboard-visual-paper">
      <span className="dashboard-visual-symbol">{SYMBOLS[kind] || '◇'}</span>
      <span>{t('dashboard.astra.visualLabel')}</span>
      <div className="dashboard-visual-lines"><i /><i /><i /></div>
    </div>
  </div>;
}
