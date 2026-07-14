import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  getAdminResource,
  listAdminResources,
  updateAdminResourceGovernance,
} from "./adminApi";

const PUBLICATION_OPTIONS = ["", "published", "draft", "archived"];
const REVIEW_OPTIONS = ["", "approved", "needs_review", "draft", "rejected"];
const RAG_OPTIONS = ["", "true", "false"];

function formatDate(value) {
  if (!value) return "";
  return String(value).slice(0, 10);
}

function StatusBadge({ children, tone = "neutral" }) {
  return <span className={`admin-status-badge ${tone}`}>{children}</span>;
}

function MetricCard({ label, value }) {
  return (
    <div className="admin-resource-metric">
      <p>{label}</p>
      <strong>{value ?? 0}</strong>
    </div>
  );
}

function labelFor(t, prefix, value) {
  if (!value) return t("common.notSet");
  return t(`${prefix}.${value}`, { defaultValue: value });
}

function buildPayload(form, initial) {
  const payload = {};
  if (form.publicationStatus !== initial.publicationStatus) payload.publicationStatus = form.publicationStatus;
  if (form.reviewStatus !== initial.reviewStatus) payload.reviewStatus = form.reviewStatus;
  if (form.ragReady !== initial.ragReady) payload.ragReady = form.ragReady;
  if (form.reviewNotes !== (initial.reviewNotes || "")) payload.reviewNotes = form.reviewNotes;
  if (form.nextReviewAt !== formatDate(initial.nextReviewAt)) payload.nextReviewAt = form.nextReviewAt || null;
  return payload;
}

function ConfirmationDialog({ confirmation, onCancel }) {
  const { t } = useTranslation();
  const cancelRef = useRef(null);

  useEffect(() => {
    const previous = document.activeElement;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancel();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (previous && typeof previous.focus === "function") previous.focus();
    };
  }, [onCancel]);

  return (
    <div className="admin-confirm-backdrop" role="presentation">
      <div className="admin-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" aria-describedby="admin-confirm-description">
        <p className="res-tag">{t("admin.resourceGovernance.confirmation.badge")}</p>
        <h3 id="admin-confirm-title">{confirmation.title}</h3>
        <p id="admin-confirm-description">{confirmation.message}</p>
        {confirmation.resourceTitle && <p className="admin-confirm-resource">{confirmation.resourceTitle}</p>}
        <div className="admin-confirm-actions">
          <button type="button" className="btn-secondary" ref={cancelRef} onClick={onCancel}>
            {t("common.cancel")}
          </button>
          <button type="button" className="btn-primary" onClick={confirmation.onConfirm}>
            {confirmation.confirmLabel || t("admin.resourceGovernance.confirmation.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminResourcePage({ requestHashNavigation }) {
  const { t } = useTranslation();
  const lastReviewButtonRef = useRef(null);
  const [filters, setFilters] = useState({
    search: "",
    publicationStatus: "",
    reviewStatus: "",
    ragReady: "",
    page: 1,
    pageSize: 20,
  });
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [form, setForm] = useState(null);
  const [saveState, setSaveState] = useState({ saving: false, message: "", error: "" });
  const [confirmation, setConfirmation] = useState(null);

  const dirty = useMemo(() => {
    if (!detail || !form) return false;
    return Object.keys(buildPayload(form, detail)).length > 0;
  }, [detail, form]);

  const loadList = async (nextFilters = filters) => {
    setLoading(true);
    setError("");
    const result = await listAdminResources(nextFilters);
    if (result.ok) {
      setItems(result.items);
      setSummary(result.summary);
      setPagination(result.pagination);
    } else {
      setError(result.error || t("admin.resourceGovernance.errors.list"));
    }
    setLoading(false);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    listAdminResources(filters).then(result => {
      if (!active) return;
      if (result.ok) {
        setItems(result.items);
        setSummary(result.summary);
        setPagination(result.pagination);
        setError("");
      } else {
        setError(result.error || t("admin.resourceGovernance.errors.list"));
      }
      setLoading(false);
    });
    return () => { active = false; };
  }, [filters, t]);

  const openResource = async (resourceId, triggerElement = null) => {
    lastReviewButtonRef.current = triggerElement;
    setSelectedId(resourceId);
    setDetailLoading(true);
    setDetailError("");
    setSaveState({ saving: false, message: "", error: "" });
    const result = await getAdminResource(resourceId);
    if (result.ok) {
      setDetail(result.resource);
      setForm({
        publicationStatus: result.resource.publicationStatus,
        reviewStatus: result.resource.reviewStatus,
        ragReady: Boolean(result.resource.ragReady),
        reviewNotes: result.resource.reviewNotes || "",
        nextReviewAt: formatDate(result.resource.nextReviewAt),
      });
    } else {
      setDetail(null);
      setForm(null);
      setDetailError(result.error || t("admin.resourceGovernance.errors.detail"));
    }
    setDetailLoading(false);
  };

  const closeDetailNow = useCallback(() => {
    setSelectedId(null);
    setDetail(null);
    setForm(null);
    setDetailError("");
    setSaveState({ saving: false, message: "", error: "" });
    setTimeout(() => {
      lastReviewButtonRef.current?.focus?.();
    }, 0);
  }, []);

  const closeDetail = useCallback(() => {
    if (dirty) {
      setConfirmation({
        title: t("admin.resourceGovernance.confirmation.discardTitle"),
        message: t("admin.resourceGovernance.confirmation.discardMessage"),
        resourceTitle: detail?.title,
        confirmLabel: t("admin.resourceGovernance.confirmation.discardConfirm"),
        onConfirm: () => {
          setConfirmation(null);
          closeDetailNow();
        },
      });
      return;
    }
    closeDetailNow();
  }, [closeDetailNow, detail?.title, dirty, t]);

  const openContentEditor = useCallback((resourceId) => {
    const navigate = () => {
      if (requestHashNavigation) {
        requestHashNavigation(`/admin/resources/${resourceId}/edit`);
      } else {
        window.location.hash = `/admin/resources/${resourceId}/edit`;
      }
    };
    if (dirty) {
      setConfirmation({
        title: t("admin.resourceGovernance.confirmation.discardTitle"),
        message: t("admin.resourceGovernance.confirmation.discardMessage"),
        resourceTitle: detail?.title,
        confirmLabel: t("admin.resourceGovernance.confirmation.discardConfirm"),
        onConfirm: () => {
          setConfirmation(null);
          navigate();
        },
      });
      return;
    }
    navigate();
  }, [detail?.title, dirty, requestHashNavigation, t]);

  const updateFilter = (field, value) => {
    setFilters(current => ({ ...current, [field]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ search: "", publicationStatus: "", reviewStatus: "", ragReady: "", page: 1, pageSize: 20 });
  };

  const performSave = async (payload) => {
    setConfirmation(null);
    setSaveState({ saving: true, message: "", error: "" });
    const result = await updateAdminResourceGovernance(detail.id, payload);
    if (!result.ok) {
      setSaveState({ saving: false, message: "", error: result.error || t("admin.resourceGovernance.errors.save") });
      return;
    }
    setDetail(result.resource);
    setForm({
      publicationStatus: result.resource.publicationStatus,
      reviewStatus: result.resource.reviewStatus,
      ragReady: Boolean(result.resource.ragReady),
      reviewNotes: result.resource.reviewNotes || "",
      nextReviewAt: formatDate(result.resource.nextReviewAt),
    });
    const message = result.automaticChanges.includes("rag_ready_disabled")
      ? t("admin.resourceGovernance.savedWithRagDisabled")
      : t("admin.resourceGovernance.saved");
    setSaveState({ saving: false, message, error: "" });
    await loadList(filters);
  };

  const save = async () => {
    if (!detail || !form || !dirty) return;
    const payload = buildPayload(form, detail);
    const disablesCyberGuard = detail.effectiveRagEligible && (
      payload.ragReady === false ||
      payload.publicationStatus === "draft" ||
      payload.publicationStatus === "archived" ||
      (payload.reviewStatus && payload.reviewStatus !== "approved")
    );
    const changingPublication = payload.publicationStatus === "draft" || payload.publicationStatus === "archived";
    if (changingPublication || disablesCyberGuard) {
      const titleKey = changingPublication
        ? "admin.resourceGovernance.confirmation.publicationTitle"
        : "admin.resourceGovernance.confirmation.aiUseTitle";
      const messageKey = changingPublication && disablesCyberGuard
        ? "admin.resourceGovernance.confirmation.publicationAndAiUseMessage"
        : changingPublication
          ? "admin.resourceGovernance.confirmation.publicationMessage"
          : "admin.resourceGovernance.confirmation.aiUseMessage";
      setConfirmation({
        title: t(titleKey),
        message: t(messageKey),
        resourceTitle: detail.title,
        confirmLabel: t("admin.resourceGovernance.confirmation.saveConfirm"),
        onConfirm: () => performSave(payload),
      });
      return;
    }

    await performSave(payload);
  };

  useEffect(() => {
    if (!selectedId || confirmation) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeDetail();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedId, confirmation, closeDetail]);

  return (
    <div className="admin-resource-governance" aria-labelledby="admin-resource-governance-title">
      <div className="admin-resource-header">
        <div>
          <p className="res-tag">{t("admin.resourceGovernance.badge")}</p>
          <h2 id="admin-resource-governance-title">{t("admin.resourceGovernance.title")}</h2>
          <p>{t("admin.resourceGovernance.description")}</p>
        </div>
      </div>

      <div className="admin-resource-summary" aria-label={t("admin.resourceGovernance.summaryLabel")}>
        <MetricCard label={t("admin.resourceGovernance.metrics.total")} value={summary.total} />
        <MetricCard label={t("admin.resourceGovernance.metrics.published")} value={summary.published} />
        <MetricCard label={t("admin.resourceGovernance.metrics.needsReview")} value={summary.needsReview} />
        <MetricCard label={t("admin.resourceGovernance.metrics.approved")} value={summary.approved} />
        <MetricCard label={t("admin.resourceGovernance.metrics.ragReady")} value={summary.ragReady} />
        <MetricCard label={t("admin.resourceGovernance.metrics.effectivelyEligible")} value={summary.effectivelyRagEligible} />
      </div>
      <p className="admin-resource-summary-note">{t("admin.resourceGovernance.summaryScope")}</p>

      <div className="admin-resource-filters">
        <label>
          <span>{t("admin.resourceGovernance.filters.search")}</span>
          <input
            value={filters.search}
            onChange={event => updateFilter("search", event.target.value)}
            placeholder={t("admin.resourceGovernance.filters.searchPlaceholder")}
          />
        </label>
        <label>
          <span>{t("admin.resourceGovernance.filters.publicationStatus")}</span>
          <select value={filters.publicationStatus} onChange={event => updateFilter("publicationStatus", event.target.value)}>
            {PUBLICATION_OPTIONS.map(option => (
              <option key={option || "all"} value={option}>{option ? labelFor(t, "admin.resourceGovernance.publicationStatus", option) : t("admin.resourceGovernance.filters.all")}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("admin.resourceGovernance.filters.reviewStatus")}</span>
          <select value={filters.reviewStatus} onChange={event => updateFilter("reviewStatus", event.target.value)}>
            {REVIEW_OPTIONS.map(option => (
              <option key={option || "all"} value={option}>{option ? labelFor(t, "admin.resourceGovernance.reviewStatus", option) : t("admin.resourceGovernance.filters.all")}</option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("admin.resourceGovernance.filters.ragReady")}</span>
          <select value={filters.ragReady} onChange={event => updateFilter("ragReady", event.target.value)}>
            {RAG_OPTIONS.map(option => (
              <option key={option || "all"} value={option}>
                {option === "" ? t("admin.resourceGovernance.filters.all") : option === "true" ? t("admin.resourceGovernance.flags.ragReady") : t("admin.resourceGovernance.flags.notRagReady")}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="btn-secondary" onClick={clearFilters}>{t("admin.resourceGovernance.filters.clear")}</button>
      </div>

      {loading ? (
        <p className="admin-resource-state">{t("admin.resourceGovernance.loading")}</p>
      ) : error ? (
        <p className="field-error" role="alert">{error}</p>
      ) : items.length === 0 ? (
        <p className="admin-resource-state">{t("admin.resourceGovernance.empty")}</p>
      ) : (
        <div className="admin-resource-table-wrap" tabIndex={0} aria-label={t("admin.resourceGovernance.table.scrollLabel")}>
          <table className="admin-resource-table">
            <thead>
              <tr>
                <th>{t("admin.resourceGovernance.table.resource")}</th>
                <th>{t("admin.resourceGovernance.table.category")}</th>
                <th>{t("admin.resourceGovernance.table.publication")}</th>
                <th>{t("admin.resourceGovernance.table.review")}</th>
                <th>{t("admin.resourceGovernance.table.rag")}</th>
                <th>{t("admin.resourceGovernance.table.updated")}</th>
                <th>{t("admin.resourceGovernance.table.action")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(resource => (
                <tr key={resource.id}>
                  <td>
                    <strong>{resource.title}</strong>
                    <span>{resource.slug}</span>
                  </td>
                  <td>{resource.displayCategory || resource.category}</td>
                  <td><StatusBadge>{labelFor(t, "admin.resourceGovernance.publicationStatus", resource.publicationStatus)}</StatusBadge></td>
                  <td><StatusBadge tone={resource.reviewStatus === "approved" ? "good" : "warn"}>{labelFor(t, "admin.resourceGovernance.reviewStatus", resource.reviewStatus)}</StatusBadge></td>
                  <td><StatusBadge tone={resource.effectiveRagEligible ? "good" : "warn"}>{resource.effectiveRagEligible ? t("admin.resourceGovernance.flags.effective") : t("admin.resourceGovernance.flags.notEffective")}</StatusBadge></td>
                  <td>{formatDate(resource.updatedAt) || t("common.notSet")}</td>
                  <td><button type="button" className="btn-secondary" onClick={event => openResource(resource.id, event.currentTarget)}>{t("admin.resourceGovernance.reviewAction")}</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="admin-resource-pagination">
        {t("admin.resourceGovernance.pagination", {
          page: pagination.page || 1,
          totalPages: pagination.totalPages || 1,
          totalItems: pagination.totalItems || 0,
        })}
      </p>

      {selectedId && (
        <div className="admin-resource-drawer-backdrop" role="presentation" onMouseDown={event => {
          if (event.target === event.currentTarget) closeDetail();
        }}>
          <aside className="admin-resource-drawer" aria-label={t("admin.resourceGovernance.drawerLabel")} aria-modal="true" role="dialog">
            <div className="admin-resource-drawer-head">
              <div>
                <p className="res-tag">{dirty ? t("admin.resourceGovernance.unsaved") : t("admin.resourceGovernance.drawerBadge")}</p>
                <h3>{detail?.title || t("admin.resourceGovernance.loading")}</h3>
              </div>
              <button type="button" className="btn-secondary" onClick={closeDetail}>{t("common.close")}</button>
            </div>

            {detailLoading ? (
              <p className="admin-resource-state">{t("admin.resourceGovernance.loadingDetail")}</p>
            ) : detailError ? (
              <p className="field-error" role="alert">{detailError}</p>
            ) : detail && form ? (
              <div className="admin-resource-drawer-body">
                <section>
                  <h4>{t("admin.resourceGovernance.detail.overview")}</h4>
                  <p><strong>{detail.slug}</strong></p>
                  <p>{detail.summary || t("common.notSet")}</p>
                  <p>{t("admin.resourceGovernance.detail.translations", { count: detail.translations?.length || 0 })}</p>
                </section>

                <section>
                  <h4>{t("admin.resourceGovernance.detail.source")}</h4>
                  <p>{detail.sourceLabel || t("common.notSet")}</p>
                  <p>{detail.sourceType || t("common.notSet")} · {detail.sourceCountry || t("common.notSet")} · {detail.sourceAuthorityLevel || t("common.notSet")}</p>
                  <p>{t("admin.resourceGovernance.detail.flags", {
                    malaysia: detail.malaysiaGuidanceFlag ? t("common.yes") : t("common.no"),
                    sensitive: detail.sensitiveTopicFlag ? t("common.yes") : t("common.no"),
                  })}</p>
                </section>

                <section>
                  <h4>{t("admin.resourceGovernance.detail.rag")}</h4>
                  <p>{detail.effectiveRagEligible ? t("admin.resourceGovernance.flags.effective") : t("admin.resourceGovernance.flags.notEffective")}</p>
                  {detail.effectiveRagReasons?.length > 0 && (
                    <ul>
                      {detail.effectiveRagReasons.map(reason => <li key={reason}>{t(`admin.resourceGovernance.eligibilityReasons.${reason}`)}</li>)}
                    </ul>
                  )}
                  <p>{t("admin.resourceGovernance.detail.retrievableChunks", { count: detail.retrievableChunkCount || 0 })}</p>
                  {(detail.ragDocuments || []).map(document => (
                    <p key={document.id} className="admin-resource-rag-doc">
                      {document.locale}: {labelFor(t, "admin.resourceGovernance.publicationStatus", document.status)} / {labelFor(t, "admin.resourceGovernance.ragDocumentReviewStatus", document.reviewStatus)} / {document.ragReady ? t("admin.resourceGovernance.flags.ragReady") : t("admin.resourceGovernance.flags.notRagReady")} · {t("admin.resourceGovernance.detail.chunks", { count: document.chunkCount || 0 })}
                    </p>
                  ))}
                </section>

                <section className="admin-resource-form">
                  <h4>{t("admin.resourceGovernance.detail.controls")}</h4>
                  <label>
                    <span>{t("admin.resourceGovernance.filters.publicationStatus")}</span>
                    <select value={form.publicationStatus} onChange={event => setForm(current => ({ ...current, publicationStatus: event.target.value }))}>
                      {PUBLICATION_OPTIONS.filter(Boolean).map(option => <option key={option} value={option}>{labelFor(t, "admin.resourceGovernance.publicationStatus", option)}</option>)}
                    </select>
                  </label>
                  <label>
                    <span>{t("admin.resourceGovernance.filters.reviewStatus")}</span>
                    <select value={form.reviewStatus} onChange={event => setForm(current => ({ ...current, reviewStatus: event.target.value }))}>
                      {REVIEW_OPTIONS.filter(Boolean).map(option => <option key={option} value={option}>{labelFor(t, "admin.resourceGovernance.reviewStatus", option)}</option>)}
                    </select>
                  </label>
                  <label className="admin-resource-checkbox">
                    <input type="checkbox" checked={form.ragReady} onChange={event => setForm(current => ({ ...current, ragReady: event.target.checked }))} />
                    <span>{t("admin.resourceGovernance.fields.ragReady")}</span>
                  </label>
                  <label>
                    <span>{t("admin.resourceGovernance.fields.nextReviewAt")}</span>
                    <input type="date" value={form.nextReviewAt} onChange={event => setForm(current => ({ ...current, nextReviewAt: event.target.value }))} />
                  </label>
                  <label>
                    <span>{t("admin.resourceGovernance.fields.reviewNotes")}</span>
                    <textarea rows={5} value={form.reviewNotes} onChange={event => setForm(current => ({ ...current, reviewNotes: event.target.value }))} />
                  </label>
                </section>

                {saveState.error && <p className="field-error" role="alert">{saveState.error}</p>}
                {saveState.message && <p className="admin-resource-success" role="status">{saveState.message}</p>}

                <div className="admin-resource-drawer-actions">
                  <button type="button" className="btn-secondary" onClick={() => openContentEditor(detail.id)}>{t("admin.resourceEditor.editContent")}</button>
                  <button type="button" className="btn-secondary" onClick={closeDetail}>{t("common.cancel")}</button>
                  <button type="button" className="btn-primary" disabled={!dirty || saveState.saving} onClick={save}>
                    {saveState.saving ? t("common.saving") : t("common.save")}
                  </button>
                </div>
              </div>
            ) : null}
          </aside>
        </div>
      )}
      {confirmation && (
        <ConfirmationDialog
          confirmation={confirmation}
          onCancel={() => setConfirmation(null)}
        />
      )}
    </div>
  );
}
