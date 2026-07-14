import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { getAdminResourceContent, updateAdminResourceContent } from "./adminApi";
import AdminResourceContentForm from "./AdminResourceContentForm";
import AdminResourceLanguageTabs, { localeLabel, RESOURCE_EDITOR_LOCALES } from "./AdminResourceLanguageTabs";
import AdminResourceLearnerPreview from "./AdminResourceLearnerPreview";

function emptyTranslation(locale) {
  return {
    locale,
    title: "",
    summary: "",
    body: "",
    updatedAt: null,
    exists: false,
  };
}

function formFromTranslation(locale, translation) {
  const item = translation || emptyTranslation(locale);
  return {
    title: item.title || "",
    summary: item.summary || "",
    body: item.body || "",
  };
}

function formsEqual(first, second) {
  return first.title === second.title && first.summary === second.summary && first.body === second.body;
}

function validateForm(t, form) {
  const errors = {};
  if (!form.title.trim()) errors.title = t("admin.resourceEditor.validation.titleRequired");
  if (form.title.trim().length > 180) errors.title = t("admin.resourceEditor.validation.titleTooLong", { max: 180 });
  if (!form.summary.trim()) errors.summary = t("admin.resourceEditor.validation.summaryRequired");
  if (form.summary.trim().length > 500) errors.summary = t("admin.resourceEditor.validation.summaryTooLong", { max: 500 });
  if (!form.body.trim()) errors.body = t("admin.resourceEditor.validation.bodyRequired");
  if (form.body.trim().length > 24000) errors.body = t("admin.resourceEditor.validation.bodyTooLong", { max: 24000 });
  return errors;
}

export default function AdminResourceEditorPage({
  registerActivityGuard,
  requestGuardedAction,
  requestHashNavigation,
  resourceId,
}) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resource, setResource] = useState(null);
  const [translations, setTranslations] = useState({});
  const [activeLocale, setActiveLocale] = useState("en");
  const [form, setForm] = useState(emptyTranslation("en"));
  const [saveState, setSaveState] = useState({ saving: false, message: "", error: "" });
  const [validationErrors, setValidationErrors] = useState({});

  const activeTranslation = translations[activeLocale] || null;
  const savedForm = useMemo(() => formFromTranslation(activeLocale, activeTranslation), [activeLocale, activeTranslation]);
  const dirty = !formsEqual(form, savedForm);

  useEffect(() => {
    if (!dirty || !registerActivityGuard) return undefined;
    return registerActivityGuard({
      source: "resource-editor",
      resourceId,
      locale: activeLocale,
      key: `resource-editor:${resourceId}:${activeLocale}`,
      title: t("admin.resourceEditor.discardTitle"),
      description: t("admin.resourceEditor.discardLocaleMessage", { locale: localeLabel(t, activeLocale) }),
      logoutDescription: t("admin.resourceEditor.logoutMessage"),
      messageKey: "admin.resourceEditor.discardLocaleMessage",
    });
  }, [activeLocale, dirty, registerActivityGuard, resourceId, t]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const result = await getAdminResourceContent(resourceId);
    if (!result.ok) {
      setResource(null);
      setTranslations({});
      setError(result.error || t("admin.resourceEditor.errors.load"));
      setLoading(false);
      return;
    }
    setResource(result.resource);
    setTranslations(result.translations || {});
    const nextLocale = RESOURCE_EDITOR_LOCALES.includes(activeLocale) ? activeLocale : "en";
    setForm(formFromTranslation(nextLocale, result.translations?.[nextLocale]));
    setSaveState({ saving: false, message: "", error: "" });
    setValidationErrors({});
    setLoading(false);
  }, [activeLocale, resourceId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const switchLocale = (locale) => {
    if (locale === activeLocale) return;
    const perform = () => {
      setActiveLocale(locale);
      setForm(formFromTranslation(locale, translations[locale]));
      setValidationErrors({});
      setSaveState({ saving: false, message: "", error: "" });
    };
    if (dirty) {
      requestGuardedAction?.(perform, {
        actionType: "locale-switch",
        guard: {
          key: `resource-editor:${resourceId}:${activeLocale}`,
          title: t("admin.resourceEditor.discardTitle"),
          description: t("admin.resourceEditor.discardLocaleMessage", { locale: localeLabel(t, activeLocale) }),
        },
      });
      return;
    }
    perform();
  };

  const goBack = () => {
    requestHashNavigation?.("/admin/resources", {
      guard: {
        title: t("admin.resourceEditor.discardTitle"),
        description: t("admin.resourceEditor.discardBackMessage", { locale: localeLabel(t, activeLocale) }),
      },
    });
  };

  const reset = () => {
    setForm(savedForm);
    setValidationErrors({});
    setSaveState({ saving: false, message: "", error: "" });
  };

  const save = async () => {
    const errors = validateForm(t, form);
    setValidationErrors(errors);
    if (Object.keys(errors).length) return;

    setSaveState({ saving: true, message: "", error: "" });
    const result = await updateAdminResourceContent(resourceId, {
      locale: activeLocale,
      title: form.title,
      summary: form.summary,
      body: form.body,
      expectedUpdatedAt: activeTranslation?.updatedAt || null,
    });

    if (!result.ok) {
      const stale = result.code === "ADMIN_RESOURCE_CONTENT_STALE";
      setSaveState({
        saving: false,
        message: "",
        error: stale ? t("admin.resourceEditor.errors.stale") : (result.error || t("admin.resourceEditor.errors.save")),
      });
      return;
    }

    setResource(result.resource || resource);
    setTranslations(current => ({
      ...current,
      [activeLocale]: result.translation,
    }));
    setForm(formFromTranslation(activeLocale, result.translation));
    setValidationErrors({});
    setSaveState({
      saving: false,
      message: result.ragSync?.attempted && !result.ragSync?.succeeded
        ? t("admin.resourceEditor.savedRagFailed")
        : result.ragSync?.attempted
          ? t("admin.resourceEditor.savedRagSynced")
          : t("admin.resourceEditor.saved"),
      error: "",
    });
  };

  if (loading) {
    return <p className="admin-resource-state" role="status">{t("admin.resourceEditor.loading")}</p>;
  }

  if (error || !resource) {
    return (
      <div className="admin-resource-editor-empty">
        <p className="field-error" role="alert">{error || t("admin.resourceEditor.errors.notFound")}</p>
        <button type="button" className="btn-secondary" onClick={goBack}>
          {t("admin.resourceEditor.backToResources")}
        </button>
      </div>
    );
  }

  const categoryLabel = t(`resources.categories.${resource.categoryCode}`, { defaultValue: resource.category || resource.categoryCode });

  return (
    <div className="admin-resource-editor">
      <div className="admin-resource-editor-toolbar">
        <button type="button" className="btn-secondary" onClick={goBack}>
          {t("admin.resourceEditor.backToResources")}
        </button>
        {dirty && <span className="admin-resource-editor-dirty">{t("admin.resourceEditor.unsavedChanges")}</span>}
      </div>

      <section className="admin-resource-editor-identity">
        <div>
          <p className="res-tag">{resource.slug}</p>
          <h2>{t("admin.resourceEditor.title")}</h2>
          <p>{t("admin.resourceEditor.description")}</p>
        </div>
        <div className="admin-resource-editor-badges" aria-label={t("admin.resourceEditor.governanceStatus")}>
          <span className="admin-status-badge">{resource.publicationStatus}</span>
          <span className={`admin-status-badge ${resource.reviewStatus === "approved" ? "good" : "warn"}`}>{resource.reviewStatus}</span>
          <span className={`admin-status-badge ${resource.effectiveRagEligible ? "good" : "warn"}`}>
            {resource.effectiveRagEligible ? t("admin.resourceGovernance.flags.effective") : t("admin.resourceGovernance.flags.notEffective")}
          </span>
        </div>
      </section>

      <AdminResourceLanguageTabs
        activeLocale={activeLocale}
        dirtyLocale={dirty ? activeLocale : null}
        onSelect={switchLocale}
        translations={translations}
      />

      <div className="admin-resource-editor-grid">
        <AdminResourceContentForm
          dirty={dirty}
          errors={validationErrors}
          form={form}
          onChange={(field, value) => {
            setForm(current => ({ ...current, [field]: value }));
            setSaveState(current => ({ ...current, message: "", error: "" }));
          }}
          onReset={reset}
          onSave={save}
          saveState={saveState}
        />
        <AdminResourceLearnerPreview
          categoryLabel={categoryLabel}
          form={form}
          localeLabel={localeLabel(t, activeLocale)}
        />
      </div>

      {saveState.error && saveState.error === t("admin.resourceEditor.errors.stale") && (
        <button type="button" className="btn-secondary" onClick={load}>
          {t("admin.resourceEditor.reloadLatest")}
        </button>
      )}
    </div>
  );
}
