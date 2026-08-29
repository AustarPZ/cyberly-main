import { useTranslation } from "react-i18next";
import PageContainer from "../design-system/layout/PageContainer";
import PageIdentity from "../design-system/visual/PageIdentity";

export default function PrivacyNoticePage() {
  const { t } = useTranslation();
  const introduction = t("privacyNotice.introduction", { returnObjects: true });
  const sections = t("privacyNotice.sections", { returnObjects: true });

  return (
    <div className="cy-privacy-page">
      <PageContainer width="reading" className="cy-privacy-container">
        <article className="cy-privacy-document" aria-labelledby="privacy-notice-title">
          <header className="cy-privacy-header">
            <PageIdentity label={t("privacyNotice.identity")} icon="ID" />
            <h1 id="privacy-notice-title">{t("privacyNotice.title")}</h1>
            {introduction.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
          </header>

          {sections.map(section => (
            <section className="cy-privacy-section" key={section.title}>
              <h2>{section.title}</h2>
              {section.contact && (
                <p>
                  {section.contact.before}
                  <a href="mailto:privacy@cyberly.my">privacy@cyberly.my</a>
                  {section.contact.after}
                </p>
              )}
              {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
              {section.items && (
                <ul>
                  {section.items.map(item => <li key={item}>{item}</li>)}
                </ul>
              )}
              {section.trailingParagraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
            </section>
          ))}
        </article>
      </PageContainer>
    </div>
  );
}
