import { useLayoutEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import PageContainer from "../design-system/layout/PageContainer";
import CompactHeader from "../design-system/headers/CompactHeader";
import { AccountSecurity, LearningPreferences, PrivacySettings } from "./AccountCenterViews";

export default function AccountCenterShell({ view, onNavigate, children }) {
  const { t } = useTranslation();
  const contentRef = useRef(null);
  useLayoutEffect(() => {
    const heading = contentRef.current?.querySelector("h1");
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [view]);
  return <div className="profile-page account-center" data-account-view={view}>
    <PageContainer width="content">
      <div className="account-center-layout">
        <nav className="account-center-nav" aria-label={t("accountCenter.title")}>
          <span className="account-center-label">{t("accountCenter.title")}</span>
          {["profile", "settings"].map(destination => <a key={destination}
            href={`#/${destination}`} aria-current={view === destination ? "page" : undefined}
            onClick={event => {
              if (event.button === 0 && !event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey) {
                event.preventDefault(); onNavigate(destination);
              }
            }}>{t(`nav.${destination}`)}</a>)}
        </nav>
        <div className="account-center-main" ref={contentRef}>
          <CompactHeader className="profile-header" title={t(`nav.${view}`)}
            description={t(`accountCenter.${view}Description`)} />
          <div className="account-center-content">{children}</div>
        </div>
      </div>
    </PageContainer>
  </div>;
}

const SECTIONS = ["learning", "security", "privacy"];
const SECTION_VIEWS = { learning: LearningPreferences, security: AccountSecurity, privacy: PrivacySettings };

export function SettingsSections() {
  const { t } = useTranslation();
  const [section, setSection] = useState("learning");
  const [visited, setVisited] = useState(["learning"]);
  return <>
    <nav className="account-settings-nav" aria-label={t("accountCenter.sectionsLabel")}>
      {SECTIONS.map(key => <button key={key} type="button" aria-pressed={section === key}
        aria-controls={`account-settings-${key}`} onClick={() => {
          setVisited(current => current.includes(key) ? current : [...current, key]);
          setSection(key);
        }}>
        {t(`accountCenter.sections.${key}`)}
      </button>)}
    </nav>
    {visited.map(key => {
      const Section = SECTION_VIEWS[key];
      return <section key={key} id={`account-settings-${key}`} hidden={section !== key}
        aria-labelledby={`account-settings-heading-${key}`}>
        <h2 id={`account-settings-heading-${key}`} className="account-section-heading">{t(`accountCenter.sections.${key}`)}</h2>
        <Section />
      </section>;
    })}
  </>;
}
