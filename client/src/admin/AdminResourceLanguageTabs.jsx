import { useTranslation } from "react-i18next";

export const RESOURCE_EDITOR_LOCALES = ["en", "ms", "zh-CN"];

export function localeLabel(t, locale) {
  return t(`admin.resourceEditor.locales.${locale}`, { defaultValue: locale });
}

export default function AdminResourceLanguageTabs({ activeLocale, dirtyLocale, onSelect, translations }) {
  const { t } = useTranslation();

  return (
    <div className="admin-resource-language-tabs" role="tablist" aria-label={t("admin.resourceEditor.languageTabs")}>
      {RESOURCE_EDITOR_LOCALES.map(locale => {
        const exists = Boolean(translations?.[locale]);
        const dirty = dirtyLocale === locale;
        return (
          <button
            key={locale}
            type="button"
            role="tab"
            aria-selected={activeLocale === locale}
            className={`admin-resource-language-tab${activeLocale === locale ? " active" : ""}${dirty ? " dirty" : ""}`}
            onClick={() => onSelect(locale)}
          >
            <span>{localeLabel(t, locale)}</span>
            <small>
              {dirty
                ? t("admin.resourceEditor.status.unsaved")
                : exists
                  ? t("admin.resourceEditor.status.exists")
                  : t("admin.resourceEditor.status.missing")}
            </small>
          </button>
        );
      })}
    </div>
  );
}
