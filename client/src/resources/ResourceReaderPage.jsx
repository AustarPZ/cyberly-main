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
  const navigate = (event, hash) => {
    if (!onNavigate || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault(); onNavigate(hash);
  };
  const resource = current.resource;
  const sourceUrl = sourceDestination(resource?.sourceUrl);
  const relatedSlug = resource?.relatedScenario?.slug;
  const relatedHash = typeof relatedSlug === "string" && /^[a-z0-9][a-z0-9_-]{0,139}$/.test(relatedSlug) ? `#/scenarios/${relatedSlug}` : null;

  return (
    <PageContainer className="resources-reader">
      <a className="resources-reader-back" href="#/resources" onClick={event => navigate(event, "#/resources")}>{t("resources.reader.back")}</a>
      {current.status === "success" ? (
        <article aria-labelledby="resource-reader-title">
          <header>
            <Badge tone="brand">{t(`resources.categories.${resource.categoryCode}`, { defaultValue: resource.categoryCode })}</Badge>
            <h1 id="resource-reader-title" ref={headingRef} tabIndex={-1}>{resource.title}</h1>
            <p className="resources-reader-lead">{resource.summary}</p>
          </header>
          <div className="resources-reader-body">{(resource.content || []).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
          {(resource.sourceLabel || sourceUrl) && <div className="resources-source-row">
            {resource.sourceLabel && <span>{t("resources.source")}: <span>{resource.sourceLabel}</span></span>}
            {sourceUrl && <a className="resources-source-link" href={sourceUrl} target="_blank" rel="noopener noreferrer">{t("resources.reader.externalSource")}</a>}
          </div>}
          {relatedHash && <aside className="resources-reader-practice"><a href={relatedHash} onClick={event => navigate(event, relatedHash)}>{t("resources.reader.practice")} <span aria-hidden="true">&rarr;</span></a></aside>}
        </article>
      ) : <div ref={headingRef} tabIndex={-1}>
        <PageState type={current.status === "error" ? "error" : current.status === "unavailable" ? "empty" : "loading"}
          title={t(current.status === "loading" ? "resources.loading" : current.status === "unavailable" ? "resources.reader.unavailable" : "resources.error")}
          actionLabel={current.status === "error" ? t("resources.reader.retry") : undefined}
          onAction={current.status === "error" ? () => setAttempt(value => value + 1) : undefined} />
      </div>}
    </PageContainer>
  );
}
