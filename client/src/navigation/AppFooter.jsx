import { useTranslation } from "react-i18next";
import "./shell.css";

export default function AppFooter({ onNavigate, helpHref }) {
  const { t } = useTranslation();
  function follow(event, target) {
    if (onNavigate && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
      event.preventDefault(); onNavigate(target);
    }
  }
  return <footer className="cy-app-footer">
    <div className="cy-footer-identity"><p>{t("footer.builtWithCare")} · <strong>Cyberly</strong> · {new Date().getFullYear()}</p><p>{t("footer.description")}</p></div>
    <div className="cy-footer-links">
      <a href="#/about" onClick={event => follow(event, "about")}>{t("footer.aboutCyberly")}</a>
      <a className="cy-footer-privacy-link" href="#/privacy" onClick={event => follow(event, "privacy")}>{t("privacyNotice.linkLabel")}</a>
      {helpHref && <a href={helpHref} onClick={event => follow(event, helpHref.replace("#/", ""))}>{t("nav.help")}</a>}
    </div>
  </footer>;
}
