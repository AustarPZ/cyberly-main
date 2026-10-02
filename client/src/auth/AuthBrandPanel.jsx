import { useTranslation } from "react-i18next";
import logo from "../assets/CyberlyLogo-transparent.png";

export default function AuthBrandPanel() {
  const { t } = useTranslation();
  return (
    <aside className="cy-auth-brand" aria-label="Cyberly">
      <div className="cy-auth-brand-intro">
        <img src={logo} alt="Cyberly" />
        <p className="cy-auth-brand-title">{t("auth.experience.confidence")}</p>
      </div>
    </aside>
  );
}
