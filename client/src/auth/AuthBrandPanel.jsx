import { useTranslation } from "react-i18next";
import logo from "../assets/CyberlyLogo-transparent.png";

export default function AuthBrandPanel({ mode }) {
  const { t } = useTranslation();
  return (
    <aside className="cy-auth-brand" aria-label="Cyberly">
      <div className="cy-auth-brand-intro">
        <img src={logo} alt="Cyberly" />
        <div>
          <p className="cy-auth-brand-label">{t(`auth.experience.${mode}Label`)}</p>
          <p className="cy-auth-brand-title">{t(`auth.experience.${mode}Welcome`)}</p>
        </div>
      </div>
      <ul className="cy-auth-brand-values">
        {["learn", "practice", "confidence"].map(value => (
          <li key={value}>
            <span>{t(`auth.experience.${value}`)}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
