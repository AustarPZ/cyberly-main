import { useTranslation } from "react-i18next";

export default function AuthAccessHelp() {
  const { t } = useTranslation();
  return (
    <div className="cy-auth-access-help" role="group" aria-label={t("auth.experience.accessHelp")}>
      <div className="cy-auth-recovery-links">
        <a className="cy-auth-forgot-link" href="#/forgot-password">{t("auth.passwordReset.forgotLink")}</a>
        <a className="cy-auth-forgot-link" href="#/forgot-password">{t("auth.passwordReset.findAccountLink")}</a>
      </div>
    </div>
  );
}
