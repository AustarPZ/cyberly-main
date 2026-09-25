import { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TIP_IDS = ['phishing', 'password', 'fakeNews', 'phoneScam'];
export default function DashboardWellnessTip() {
  const { t, i18n } = useTranslation();
  const eligible = TIP_IDS.filter(id => i18n.exists(`dashboard.tips.${id}`));
  const [selected, setSelected] = useState(() => eligible[Math.floor(Math.random() * eligible.length)]);
  const id = eligible.includes(selected) ? selected : eligible[0];
  if (!id) return null;
  return <section id="dashboard-daily-tip" className="dashboard-wellness dashboard-anchor" data-tip-id={id} aria-labelledby="dashboard-tip-heading">
    <h2 id="dashboard-tip-heading">{t('dashboard.astra.wellnessTip')}</h2>
    <p>{t(`dashboard.tips.${id}`)}</p>
    {eligible.length > 1 && <button className="btn-ghost" onClick={() => {
      const others = eligible.filter(value => value !== id);
      setSelected(others[Math.floor(Math.random() * others.length)]);
    }}>{t('dashboard.astra.anotherTip')} <span aria-hidden="true">↻</span></button>}
  </section>;
}
