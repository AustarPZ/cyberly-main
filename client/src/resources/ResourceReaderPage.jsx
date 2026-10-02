import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { getResourceBySlug } from "../api/resourceApi";
import { normalizeLocale } from "../i18n/languageMappings";
import PageContainer from "../design-system/layout/PageContainer";
import PageState from "../design-system/feedback/PageState";
import Badge from "../design-system/primitives/Badge";

function sourceDestination(value) {
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

export default function ResourceReaderPage({ slug, onNavigate }) {
  const { t, i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ key: null, status: "loading" });
  const headingRef = useRef(null);
  const articleRef = useRef(null);
  const mobileContentsRef = useRef(null);
  const [activeSection, setActiveSection] = useState("reader-overview");
  const key = `${slug}:${locale}:${attempt}`;
  const current = state.key === key ? state : { status: slug ? "loading" : "unavailable" };

  useEffect(() => {
    let active = true;
    if (!slug) { setState({ key, status: "unavailable" }); return undefined; }
    setState({ key, status: "loading" });
    getResourceBySlug(slug, { locale }).then(result => {
      if (!active) return;
      if (result.ok && result.data?.resource) setState({ key, status: "success", resource: result.data.resource });
      else setState({ key, status: result.status === 404 ? "unavailable" : "error" });
    }).catch(() => { if (active) setState({ key, status: "error" }); });
    return () => { active = false; };
  }, [slug, locale, attempt, key]);

  useEffect(() => { headingRef.current?.focus({ preventScroll: true }); }, [key, current.status]);
  useEffect(() => {
    setActiveSection("reader-overview");
    if (current.status !== "success" || !window.IntersectionObserver) return undefined;
    const observer = new IntersectionObserver(entries => {
      const visible = entries.find(entry => entry.isIntersecting);
      if (visible) setActiveSection(visible.target.id);
    }, { rootMargin: "-15% 0px -60% 0px" });
    articleRef.current?.querySelectorAll("[data-reader-section]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [key, current.status]);
  const showSection = id => {
    const section = articleRef.current?.querySelector(`#${id}`);
    if (!section) return;
    if (mobileContentsRef.current) mobileContentsRef.current.open = false;
    setActiveSection(id);
    section.focus({ preventScroll: true });
    section.scrollIntoView({ behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
  };
  const navigate = (event, hash) => {
    if (!onNavigate || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); onNavigate(hash);
  };
  const resource = current.resource;
  const sourceUrl = sourceDestination(resource?.sourceUrl);
  const relatedSlug = resource?.relatedScenario?.slug;
  const relatedHash = typeof relatedSlug === "string" && /^[a-z0-9][a-z0-9_-]{0,139}$/.test(relatedSlug) ? `#/scenarios/${relatedSlug}` : null;
  const sections = [["reader-overview", t("resources.reader.introduction")], ["reader-content", t("resources.reader.readGuide")]];
  if (resource?.sourceLabel || sourceUrl || relatedHash) sections.push(["reader-next", t("resources.reader.sourcesNext")]);
  const sectionButtons = sections.map(([id, label]) => <button key={id} type="button" aria-current={activeSection === id ? "location" : undefined} onClick={() => showSection(id)}>{label}</button>);

  return (
    <PageContainer className="resources-reader">
      <a className="resources-reader-back" href="#/resources" onClick={event => navigate(event, "#/resources")}>{t("resources.reader.back")}</a>
      {current.status === "success" ? (
        <div className="resources-reader-workspace">
          <nav className="resources-reader-nav" aria-label={t("resources.reader.inGuide")}><h2>{t("resources.reader.inGuide")}</h2>{sectionButtons}</nav>
          <details className="resources-reader-mobile-nav" ref={mobileContentsRef}>
            <summary>{t("resources.reader.onPage")}</summary>
            <nav aria-label={t("resources.reader.onPage")}>{sectionButtons}</nav>
          </details>
        <article ref={articleRef} aria-labelledby="resource-reader-title">
          <header id="reader-overview" data-reader-section tabIndex={-1}>
            <Badge tone="brand">{t(`resources.categories.${resource.categoryCode}`, { defaultValue: resource.categoryCode })}</Badge>
            <h1 id="resource-reader-title" ref={headingRef} tabIndex={-1}>{resource.title}</h1>
            <p className="resources-reader-lead">{resource.summary}</p>
          </header>
          <section className="resources-reader-body" id="reader-content" data-reader-section tabIndex={-1} aria-labelledby="reader-content-title">
            <h2 id="reader-content-title">{t("resources.reader.readGuide")}</h2>
            {(resource.content || []).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          </section>
          {(resource.sourceLabel || sourceUrl || relatedHash) && <section id="reader-next" data-reader-section tabIndex={-1} aria-labelledby="reader-next-title">
          <h2 id="reader-next-title">{t("resources.reader.sourcesNext")}</h2>
          {(resource.sourceLabel || sourceUrl) && <div className="resources-source-row">
            {resource.sourceLabel && <span>{t("resources.source")}: <span>{resource.sourceLabel}</span></span>}
            {sourceUrl && <a className="resources-source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{t("resources.reader.externalSource")}</a>}
          </div>}
          {relatedHash && <aside className="resources-reader-practice"><a href={relatedHash} onClick={event => navigate(event, relatedHash)}>{t("resources.reader.practice")} <span aria-hidden="true">&rarr;</span></a></aside>}
          </section>}
        </article>
        </div>
      ) : <div ref={headingRef} tabIndex={-1}>
        <PageState type={current.status === "error" ? "error" : current.status === "unavailable" ? "empty" : "loading"}
          title={t(current.status === "loading" ? "resources.loading" : current.status === "unavailable" ? "resources.reader.unavailable" : "resources.error")}
          actionLabel={current.status === "error" ? t("resources.reader.retry") : undefined}
          onAction={current.status === "error" ? () => setAttempt(value => value + 1) : undefined} />
      </div>}
    </PageContainer>
  );
}
