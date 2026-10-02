import { createContext, useContext } from "react";
import { useTranslation } from "react-i18next";
import Surface from "../design-system/primitives/Surface";
import Badge from "../design-system/primitives/Badge";
import Button from "../design-system/primitives/Button";
import AvatarVisual from "./AvatarVisual";
import { AVATAR_PRESET_IDS, getInitialAvatarText } from "./avatarModel";
import GuardianLinkSection from "../guardian/GuardianLinkSection";
import { normalizeLocale } from "../i18n/languageMappings";
import profileMappings from "../profileMappings";

const { LANGUAGES, HELP_OPTIONS } = profileMappings;
export const AccountCenterContext = createContext(null);

export function ProfileOverview() {
  const { t } = useTranslation();
  const { MIN_LEARNER_AGE, MAX_LEARNER_AGE, user, go, form, set, profileAvatar, displayName, translatedAgeGroup, translatedPreferredLanguage, translatedFamiliarity, accountForm, accountErrors, accountSaved, accountSaving, setAccount, saveAccount, errors, saved, saving, save, SuccessFeedback } = useContext(AccountCenterContext);
  return (<>
          <Surface className="profile-identity-summary">
            <div className="profile-avatar" aria-hidden="true">
              {profileAvatar.type === "preset"
                ? <AvatarVisual presetId={profileAvatar.presetId} />
                : profileAvatar.text}
            </div>
            <div className="profile-identity-copy">
              <div className="profile-identity-name">{displayName}</div>
              <div className="profile-identity-badges">
                <Badge tone="brand">{translatedAgeGroup}</Badge>
                <Badge>{translatedPreferredLanguage}</Badge>
                <Badge>{translatedFamiliarity}</Badge>
              </div>
            </div>
          </Surface>

          {!user.onboardingCompleted && (
            <Surface as="aside" variant="subdued" className="profile-onboarding-notice" aria-labelledby="profile-onboarding-title">
              <div id="profile-onboarding-title" className="profile-notice-title">{t("settings.finishOnboarding")}</div>
              <p>{t("settings.finishOnboardingDescription")}</p>
            </Surface>
          )}

          <Surface as="section" className="profile-panel" aria-labelledby="profile-account-title">
            <h2 id="profile-account-title" className="profile-section-title">{t("settings.accountInformation")}</h2>
            <div className="profile-form-grid">
              <div className="profile-field">
                <label htmlFor="profile-display-name">{t("settings.displayName")}</label>
                <input
                  id="profile-display-name"
                  className="profile-form-control"
                  data-field="displayName"
                  value={accountForm.displayName}
                  maxLength={50}
                  aria-invalid={Boolean(accountErrors.displayName)}
                  aria-describedby={accountErrors.displayName ? "account-display-name-error" : undefined}
                  onChange={event => setAccount("displayName", event.target.value)}
                  placeholder={t("settings.displayNamePlaceholder")}
                />
                {accountErrors.displayName && <div className="field-error" id="account-display-name-error" role="alert">{accountErrors.displayName}</div>}
              </div>
              <div className="profile-field">
                <label htmlFor="profile-age">{t("settings.age")}</label>
                <input
                  id="profile-age"
                  className="profile-form-control"
                  data-field="age"
                  type="number"
                  min={MIN_LEARNER_AGE}
                  max={MAX_LEARNER_AGE}
                  value={accountForm.age}
                  aria-invalid={Boolean(accountErrors.age)}
                  aria-describedby={accountErrors.age ? "account-age-error" : undefined}
                  onChange={event => setAccount("age", event.target.value)}
                />
                {accountErrors.age && <div className="field-error" id="account-age-error" role="alert">{accountErrors.age}</div>}
              </div>
              <div className="profile-field">
                <label htmlFor="profile-age-group">{t("settings.ageGroup")}</label>
                <input id="profile-age-group" className="profile-form-control" value={translatedAgeGroup} readOnly />
              </div>
            </div>
            {(accountErrors.form || accountErrors.forbidden) && <div className="field-error profile-form-message" role="alert">{accountErrors.form || accountErrors.forbidden}</div>}
            {accountSaved && <SuccessFeedback message={t("settings.accountSaved")} />}
            <div className="profile-actions">
              <Button variant="primary" loading={accountSaving} loadingLabel={t("settings.saving")} onClick={saveAccount}>
                {t("settings.saveAccount")}
              </Button>
            </div>
          </Surface>

          <Surface as="section" className="profile-avatar-panel" aria-labelledby="profile-avatar-title">
            <h2 id="profile-avatar-title" className="profile-section-title">{t("settings.avatar.title")}</h2>
            <fieldset className="profile-avatar-selector" aria-describedby="profile-avatar-description">
              <legend>{t("settings.avatar.legend")}</legend>
              <p id="profile-avatar-description" className="profile-avatar-description">{t("settings.avatar.description")}</p>
              <div className="profile-avatar-grid">
                {[null, ...AVATAR_PRESET_IDS].map(presetId => {
                  const selected = form.avatarPreset === presetId;
                  const value = presetId || "initials";
                  const label = presetId
                    ? t(`settings.avatar.options.${presetId}`)
                    : t("settings.avatar.useInitials");
                  return (
                    <label className="profile-avatar-option" key={value}>
                      <input
                        type="radio"
                        name="avatarPreset"
                        value={value}
                        checked={selected}
                        onChange={() => set("avatarPreset", presetId)}
                      />
                      <span className="profile-avatar-option-visual" aria-hidden="true">
                        {presetId
                          ? <AvatarVisual presetId={presetId} />
                          : <span className="profile-avatar-option-initials">{getInitialAvatarText(displayName)}</span>}
                      </span>
                      <span className="profile-avatar-option-label">{label}</span>
                      {selected && <span className="profile-avatar-selected" aria-hidden="true">{t("settings.avatar.selected")}</span>}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          </Surface>

<div className="profile-panel account-profile-save">            {errors.form && <div className="field-error profile-form-message" role="alert">{errors.form}</div>}
            {saved && <SuccessFeedback message={t("settings.profileSaved")} />}
            <div className="profile-actions">
              <Button variant="primary" loading={saving} loadingLabel={t("settings.saving")} onClick={save}>
                {t("settings.saveProfile")}
              </Button>
              {user.onboardingCompleted && <Button variant="quiet" onClick={() => go("dashboard")}>{t("nav.dashboard")}</Button>}
            </div>
</div>
<Surface as="aside" variant="subdued" className="profile-panel account-related-settings">
<h2 className="profile-section-title">{t("settings.learningPreferences")}</h2>
<p>{t("accountCenter.relatedSettings")}</p><a className="cy-button cy-button-secondary" href="#/settings" onClick={event => { event.preventDefault(); go("settings"); }}>{t("accountCenter.openSettings")}</a></Surface>
  </>);
}

export function LearningPreferences() {
  const { t } = useTranslation();
  const { user, go, form, set, errors, saved, saving, save, changeProfileLanguage, fieldSet, translatedOptionLabel, toggleTopic, SuccessFeedback } = useContext(AccountCenterContext);
  return (<>
          <Surface as="section" className="profile-panel" aria-labelledby="account-settings-heading-learning">
                          <div className="profile-field">
                <label htmlFor="profile-preferredLanguage">{t("settings.preferredLanguage")}</label>
                <select
                  id="profile-preferredLanguage"
                  className="profile-form-control"
                  data-field="preferredLanguage"
                  value={form.preferredLanguage}
                  aria-invalid={Boolean(errors.preferredLanguage)}
                  aria-describedby={errors.preferredLanguage ? "profile-preferredLanguage-error" : undefined}
                  onChange={event => changeProfileLanguage(event.target.value)}
                >
                  {["english", "bahasa_melayu", "chinese"].map(value => {
                    const option = LANGUAGES.find(language => language.value === value);
                    return <option key={value} value={value}>{t(`profileOptions.language.${value}`, { defaultValue: option?.label || value })}</option>;
                  })}
                </select>
                {errors.preferredLanguage && <div className="field-error" id="profile-preferredLanguage-error" role="alert">{errors.preferredLanguage}</div>}
              </div>

            <div className="profile-field profile-field-wide">
              <label htmlFor="profile-ai-nickname">{t("settings.aiNickname")}</label>
              <input
                id="profile-ai-nickname"
                className="profile-form-control"
                data-field="aiNickname"
                value={form.aiNickname}
                maxLength={50}
                aria-invalid={Boolean(errors.aiNickname)}
                aria-describedby={errors.aiNickname ? "profile-ai-nickname-error" : undefined}
                onChange={event => set("aiNickname", event.target.value)}
                placeholder={t("settings.aiNicknamePlaceholder")}
              />
              {errors.aiNickname && <div className="field-error" id="profile-ai-nickname-error" role="alert">{errors.aiNickname}</div>}
            </div>

            <div className="profile-form-grid">
              {fieldSet.map(field => {
                const inputId = `profile-${field.key}`;
                return (
                  <div className="profile-field" key={field.key}>
                    <label htmlFor={inputId}>{t(field.labelKey)}</label>
                    <select
                      id={inputId}
                      className="profile-form-control"
                      data-field={field.key}
                      value={form[field.key]}
                      aria-invalid={Boolean(errors[field.key])}
                      aria-describedby={errors[field.key] ? `profile-${field.key}-error` : undefined}
                      onChange={event => set(field.key, event.target.value)}
                    >
                      <option value="">{t("settings.chooseOne")}</option>
                      {field.options.map(option => <option key={option.value} value={option.value}>{translatedOptionLabel(field, option)}</option>)}
                    </select>
                    {errors[field.key] && <div className="field-error" id={`profile-${field.key}-error`} role="alert">{errors[field.key]}</div>}
                  </div>
                );
              })}
            </div>

            <fieldset className="profile-topic-fieldset">
              <legend>{t("settings.helpTopics")}</legend>
              <div className="profile-topic-grid">
                {HELP_OPTIONS.map(topic => {
                  const selected = form.helpTopics.includes(topic.value);
                  return (
                    <button
                      key={topic.value}
                      data-field="helpTopics"
                      className="profile-topic-chip"
                      aria-pressed={selected}
                      onClick={() => toggleTopic(topic.value)}
                      disabled={form.helpTopics.length >= 3 && !selected}
                      type="button"
                    >
                      <span className="profile-topic-state" aria-hidden="true">{selected ? "OK" : "+"}</span>
                      <span>{t(`profileOptions.helpTopics.${topic.value}`, { defaultValue: topic.label })}</span>
                    </button>
                  );
                })}
              </div>
              <div className="chip-limit-note">{t("onboarding.selectedCount", { count: form.helpTopics.length, max: 3 })}</div>
              {errors.helpTopics && <div className="field-error" role="alert">{errors.helpTopics}</div>}
            </fieldset>

            {errors.form && <div className="field-error profile-form-message" role="alert">{errors.form}</div>}
            {saved && <SuccessFeedback message={t("settings.profileSaved")} />}
            <div className="profile-actions">
              <Button variant="primary" loading={saving} loadingLabel={t("settings.saving")} onClick={save}>
                {t("settings.saveProfile")}
              </Button>
              {user.onboardingCompleted && <Button variant="quiet" onClick={() => go("dashboard")}>{t("nav.dashboard")}</Button>}
            </div>
            <p className="profile-identity-note">{t("settings.identityNote")}</p>
          </Surface>

  </>);
}

export function AccountSecurity() {
  const { t } = useTranslation();
  const { user, emailChangeEligible, emailChangeOpen, setEmailChangeOpen, emailChangeStatus, emailChangeResultRef, emailChangeExpiry, closeEmailChange, submitEmailChange, emailChangeInputRef, emailChangeForm, emailChangeErrors, updateEmailChangeField } = useContext(AccountCenterContext);
  return (<>
<Surface as="section" className="profile-panel profile-settings-panel">
              <div className="profile-field">
                <label htmlFor="profile-email">{t("settings.email")}</label>
                <input id="profile-email" className="profile-form-control" value={user?.email || ""} readOnly />
              </div>
            {emailChangeEligible && <div className="profile-email-change">
              {!emailChangeOpen && (
                <Button type="button" variant="secondary" onClick={() => setEmailChangeOpen(true)}>
                  {t("auth.emailChange.changeAction")}
                </Button>
              )}
              {emailChangeOpen && emailChangeStatus === "accepted" && (
                <div className="profile-email-change-result" role="status" aria-live="polite">
                  <h3 ref={emailChangeResultRef} tabIndex="-1" className="profile-section-title">{t("auth.emailChange.acceptedTitle")}</h3>
                  <p>{t("auth.emailChange.acceptedDescription")}</p>
                  <p>{t("auth.emailChange.expiryGuidance", { minutes: Math.max(1, Math.round(emailChangeExpiry / 60)) })}</p>
                  <p>{t("auth.emailChange.canonicalUnchanged")}</p>
                  <div className="profile-actions">
                    <Button type="button" variant="quiet" onClick={closeEmailChange}>{t("common.close")}</Button>
                  </div>
                </div>
              )}
              {emailChangeOpen && emailChangeStatus !== "accepted" && (
                <form className="profile-email-change-form" onSubmit={submitEmailChange} noValidate>
                  <h3 className="profile-section-title">{t("auth.emailChange.formTitle")}</h3>
                  <p id="email-change-description" className="profile-email-change-description">{t("auth.emailChange.secureDescription")}</p>
                  <p>{t("auth.emailChange.canonicalUnchanged")}</p>
                  <div className="profile-form-grid">
                    <div className="profile-field">
                      <label htmlFor="email-change-new">{t("auth.emailChange.newEmail")}</label>
                      <input ref={emailChangeInputRef} id="email-change-new" className="profile-form-control" type="email" autoComplete="email"
                        value={emailChangeForm.newEmail} aria-invalid={Boolean(emailChangeErrors.newEmail)}
                        aria-describedby={emailChangeErrors.newEmail ? "email-change-new-error" : "email-change-description"}
                        onChange={event => updateEmailChangeField("newEmail", event.target.value)} />
                      {emailChangeErrors.newEmail && <div id="email-change-new-error" className="field-error" role="alert">{emailChangeErrors.newEmail}</div>}
                    </div>
                    <div className="profile-field">
                      <label htmlFor="email-change-password">{t("auth.emailChange.currentPassword")}</label>
                      <input id="email-change-password" className="profile-form-control" type="password" autoComplete="current-password"
                        value={emailChangeForm.currentPassword} aria-invalid={Boolean(emailChangeErrors.currentPassword)}
                        aria-describedby={emailChangeErrors.currentPassword ? "email-change-password-error" : undefined}
                        onChange={event => updateEmailChangeField("currentPassword", event.target.value)} />
                      {emailChangeErrors.currentPassword && <div id="email-change-password-error" className="field-error" role="alert">{emailChangeErrors.currentPassword}</div>}
                    </div>
                  </div>
                  {emailChangeErrors.form && <div className="field-error profile-form-message" role="alert">{emailChangeErrors.form}</div>}
                  <div className="profile-actions">
                    <Button type="submit" variant="primary" loading={emailChangeStatus === "submitting"} loadingLabel={t("auth.emailChange.submitting")}>{t("auth.emailChange.submit")}</Button>
                    <Button type="button" variant="quiet" disabled={emailChangeStatus === "submitting"} onClick={closeEmailChange}>{t("common.cancel")}</Button>
                  </div>
                </form>
              )}
            </div>}

</Surface>
  </>);
}

export function PrivacySettings() {
  const { t, i18n: activeI18n } = useTranslation();
  const { go } = useContext(AccountCenterContext);
  return (<>
<Surface as="section" className="profile-panel profile-settings-panel">
<a href="#/privacy" onClick={event => { event.preventDefault(); go("privacy"); }}>{t("privacyNotice.title")}</a>
            <div className="profile-privacy-requests">
              <h3 className="profile-section-title">{t("privacyRequests.title")}</h3>
              <p>{t("privacyRequests.overview")}</p>
              <Button type="button" variant="secondary" onClick={() => go("privacy-requests")}>
                {t("privacyRequests.actions.manage")}
              </Button>
            </div>
            <GuardianLinkSection locale={normalizeLocale(activeI18n.language)} />

</Surface>
  </>);
}

