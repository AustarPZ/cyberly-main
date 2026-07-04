import { useState, createContext, useContext, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import profileMappings from "./profileMappings";
import i18n, { STORAGE_KEY as UI_LANGUAGE_STORAGE_KEY, getStoredUiLanguage} from "./i18n";
import { normalizeLocale, profileLanguageToLocale } from "./i18n/languageMappings";

// ─── Design tokens ────────────────────────────────────────────────
/*const COLORS = {
  teal:   { bg: "#E1F5EE", mid: "#1D9E75", dark: "#085041" },
  coral:  { bg: "#FAECE7", mid: "#D85A30", dark: "#712B13" },
  purple: { bg: "#EEEDFE", mid: "#7F77DD", dark: "#26215C" },
  gray:   { bg: "#F1EFE8", mid: "#888780", dark: "#2C2C2A" },
};
*/

// ─── Global styles ────────────────────────────────────────────────
const globalStyle = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,500;0,9..40,700;1,9..40,300&family=Space+Grotesk:wght@400;600&display=swap');
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: 'DM Sans', sans-serif;
  background: #f7f8f5;
  color: #1a1a18;
  min-height: 100vh;
  overflow-x: hidden;
}
:root {
  --teal:     #1D9E75;
  --teal-lt:  #E1F5EE;
  --coral:    #D85A30;
  --coral-lt: #FAECE7;
  --purple:   #7F77DD;
  --purple-lt:#EEEDFE;
  --gray:     #888780;
  --gray-lt:  #F1EFE8;
  --nav-h:    60px;
}

/* ── Navbar ── */
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--nav-h);
  background: #fff;
  border-bottom: 1px solid rgba(0,0,0,0.08);
  display: flex; align-items: center; gap: 1.25rem;
  padding: 0 1.5rem;
}
.nav-logo {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem; font-weight: 600; color: var(--teal);
  display: flex; align-items: center; gap: 0.4rem;
  background: none; border: none; cursor: pointer; flex: 0 0 auto;
  padding: 0.35rem 0.15rem; border-radius: 8px;
}
.nav-logo:hover, .nav-logo:focus-visible { background: var(--teal-lt); outline: none; }
.nav-primary { display: flex; align-items: center; gap: 0.25rem; flex: 0 1 auto; min-width: 0; }
.nav-utility { margin-left: auto; display: flex; align-items: center; gap: 0.7rem; flex: 0 0 auto; }
.nav-divider { width: 1px; height: 28px; background: rgba(0,0,0,0.1); }
.desktop-auth-actions { display: flex; gap: 0.5rem; align-items: center; }
.mobile-menu-wrap { display: none; position: relative; }
.mobile-menu-button {
  width: 40px; height: 40px; border: 1px solid rgba(0,0,0,0.12); border-radius: 10px;
  background: #fff; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  color: #333; font-size: 1.15rem;
}
.mobile-menu-button:hover,
.mobile-menu-button:focus-visible,
.mobile-menu-button.open {
  background: var(--teal-lt); border-color: rgba(29,158,117,0.35); outline: 2px solid transparent;
}
.mobile-menu-button:focus-visible { box-shadow: 0 0 0 3px rgba(29,158,117,0.25); }
.mobile-menu-panel {
  position: fixed; top: calc(var(--nav-h) + 0.5rem); left: 1rem; right: 1rem; z-index: 150;
  background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px;
  box-shadow: 0 18px 45px rgba(0,0,0,0.18); padding: 0.55rem;
}
.mobile-menu-panel[hidden] { display: none; }
.mobile-nav-item {
  width: 100%; border: none; background: none; cursor: pointer; text-align: left;
  padding: 0.75rem 0.85rem; border-radius: 9px; font-family: 'DM Sans', sans-serif;
  font-size: 0.96rem; color: #333; display: flex; align-items: center; justify-content: space-between;
}
.mobile-nav-item:hover,
.mobile-nav-item:focus-visible,
.mobile-nav-item.active {
  background: var(--teal-lt); outline: none;
}
.mobile-nav-item:focus-visible { box-shadow: inset 0 0 0 2px rgba(29,158,117,0.35); }
.mobile-menu-actions { border-top: 1px solid rgba(0,0,0,0.08); margin-top: 0.45rem; padding-top: 0.45rem; display: grid; gap: 0.45rem; }
.nav-link {
  background: none; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
  color: #555; padding: 0.4rem 0.75rem; border-radius: 8px;
  white-space: nowrap;
}
.nav-link:hover, .nav-link:focus-visible { background: var(--gray-lt); outline: none; box-shadow: inset 0 0 0 2px rgba(29,158,117,0.2); }
.nav-link.active { color: var(--teal); font-weight: 600; background: var(--teal-lt); }
.nav-cta {
  background: var(--teal); color: #fff; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
  padding: 0.45rem 1.1rem; border-radius: 20px;
}
.nav-cta.secondary { background: #fff; color: var(--teal); border: 1px solid rgba(29,158,117,0.35); }
.nav-cta:hover, .nav-cta:focus-visible { opacity: 0.88; outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.18); }
.nav-user { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #555; }
.nav-language {
  display: flex; align-items: center; gap: 0.45rem; color: #555;
}
.nav-language select {
  border: 1px solid rgba(0,0,0,0.14); background: #fff; border-radius: 8px;
  padding: 0.35rem 0.55rem; font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
}
.nav-language select:hover { border-color: rgba(29,158,117,0.35); }
.nav-language select:focus-visible { outline: 2px solid rgba(29,158,117,0.35); outline-offset: 2px; }
.nav-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--teal); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 600;
}
.account-menu-wrap { position: relative; }
.account-trigger {
  border: 1px solid rgba(0,0,0,0.1); background: #fff; border-radius: 999px; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.45rem 0.25rem 0.25rem;
  font-family: 'DM Sans', sans-serif; color: #333;
}
.account-trigger:hover, .account-trigger:focus-visible, .account-trigger.open { background: var(--gray-lt); outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.18); }
.account-name { max-width: 150px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85rem; font-weight: 600; }
.account-chevron { font-size: 0.75rem; color: #777; }
.account-dropdown {
  position: absolute; top: calc(100% + 0.6rem); right: 0; width: min(240px, calc(100vw - 2rem)); z-index: 160;
  background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px;
  box-shadow: 0 14px 35px rgba(0,0,0,0.14); padding: 0.5rem;
}
.account-menu-header { padding: 0.65rem 0.7rem 0.75rem; border-bottom: 1px solid rgba(0,0,0,0.07); margin-bottom: 0.35rem; }
.account-menu-divider { height: 1px; background: rgba(0,0,0,0.08); margin: 0.35rem 0; }
.account-menu-name { font-weight: 700; font-size: 0.92rem; color: #1a1a18; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.account-menu-email { margin-top: 0.15rem; font-size: 0.78rem; color: #777; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.account-menu-item {
  width: 100%; border: none; background: none; cursor: pointer; text-align: left;
  padding: 0.6rem 0.7rem; border-radius: 8px; font-family: 'DM Sans', sans-serif;
  font-size: 0.86rem; color: #333; display: flex; align-items: center; gap: 0.55rem;
}
.account-menu-item:hover, .account-menu-item:focus-visible, .account-menu-item.active { background: var(--gray-lt); outline: none; box-shadow: inset 0 0 0 2px rgba(29,158,117,0.18); }
.account-menu-item.danger { color: var(--coral); font-weight: 600; }
.account-menu-icon { width: 16px; height: 16px; flex: 0 0 16px; color: var(--teal); }
.logout-modal-backdrop {
  position: fixed; inset: 0; z-index: 200; background: rgba(0,0,0,0.36);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.logout-modal {
  width: min(420px, 100%); background: #fff; border-radius: 12px; padding: 1.4rem;
  box-shadow: 0 22px 60px rgba(0,0,0,0.24);
}
.logout-modal h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; margin-bottom: 0.45rem; }
.logout-modal p { color: #666; font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.2rem; }
.logout-modal-actions { display: flex; justify-content: flex-end; gap: 0.65rem; }
.modal-cancel, .modal-confirm {
  border: none; border-radius: 9px; padding: 0.6rem 1rem; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.88rem;
}
.modal-cancel { background: var(--gray-lt); color: #333; }
.modal-confirm { background: var(--coral); color: #fff; }
.modal-cancel:hover, .modal-cancel:focus-visible, .modal-confirm:hover, .modal-confirm:focus-visible { opacity: 0.9; outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.2); }

@media (max-width: 1050px) {
  .navbar { gap: 0.65rem; padding: 0 0.85rem; }
  .nav-primary { display: none; }
  .mobile-menu-wrap { display: block; }
  .nav-utility { gap: 0.5rem; }
  .desktop-auth-actions { display: none; }
  .nav-divider { display: none; }
  .account-name { max-width: min(120px, 22vw); }
  .nav-language { gap: 0.3rem; }
  .nav-language select { max-width: 86px; padding: 0.35rem 0.35rem; }
}

@media (max-width: 560px) {
  .navbar { padding: 0 0.65rem; }
  .nav-logo span:last-child { display: none; }
  .account-name { display: none; }
  .account-trigger { gap: 0.25rem; padding-right: 0.35rem; }
  .nav-language select { max-width: 72px; font-size: 0.78rem; }
}

/* ── Layout ── */
.page-wrap { margin-top: var(--nav-h); min-height: calc(100vh - var(--nav-h)); }

/* ── Sections ── */
.section { max-width: 1000px; margin: 0 auto; padding: 3rem 1.5rem; }
.section-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.75rem; font-weight: 600;
  margin-bottom: 0.5rem;
}
.section-sub { color: #666; font-size: 1rem; margin-bottom: 2rem; }

/* ── Cards ── */
.card {
  background: #fff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.07);
  padding: 1.5rem; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }

/* ── Hero ── */
.hero {
  background: linear-gradient(135deg, var(--teal-lt) 0%, #f7f8f5 60%);
  padding: 5rem 1.5rem 4rem; text-align: center;
}
.hero h1 {
  font-family: 'Space Grotesk', sans-serif; font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 600; margin-bottom: 1rem; color: var(--teal);
}
.hero p { color: #555; font-size: 1.1rem; max-width: 55ch; margin: 0 auto 2rem; }
.hero-cta {
  background: var(--teal); color: #fff; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 1rem; font-weight: 500;
  padding: 0.8rem 2rem; border-radius: 24px;
}
.hero-cta:hover { opacity: 0.88; }

/* ── Stat chips ── */
.stat-row { display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem; }
.stat-chip {
  background: #fff; border-radius: 50px; padding: 0.6rem 1.4rem;
  font-size: 0.875rem; color: #444; box-shadow: 0 2px 8px rgba(0,0,0,0.07);
  display: flex; align-items: center; gap: 0.4rem;
}

/* ── Dashboard ── */
.dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.dash-card {
  background: #fff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.07);
  padding: 1.5rem; cursor: pointer; transition: box-shadow .2s, transform .2s;
}
.dash-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.1); transform: translateY(-2px); }
.dash-icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
.dash-label { font-family: 'Space Grotesk', sans-serif; font-weight: 600; margin-bottom: 0.3rem; }
.dash-desc { color: #777; font-size: 0.875rem; line-height: 1.5; }

/* ── Agent panel ── */
.agent-wrap { max-width: 760px; margin: 0 auto; padding: 2rem 1.5rem; }
.agent-panel { background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.08); overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
.agent-header { background: var(--teal); color: #fff; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.6rem; font-weight: 600; }
.agent-messages { height: 380px; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.agent-bubble { max-width: 80%; padding: 0.65rem 1rem; border-radius: 14px; font-size: 0.875rem; line-height: 1.55; }
.agent-bubble.user { align-self: flex-end; background: var(--teal); color: #fff; border-bottom-right-radius: 4px; }
.agent-bubble.ai { align-self: flex-start; background: var(--gray-lt); color: #1a1a18; border-bottom-left-radius: 4px; }
.agent-bubble.ai.loading { opacity: 0.6; font-style: italic; }
.agent-input-row { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid rgba(0,0,0,0.07); }
.agent-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; padding: 0.55rem 0.85rem; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; outline: none; }
.agent-input:focus { border-color: var(--teal); }
.agent-send { background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.85rem; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
.agent-send:hover { opacity: 0.88; }
.agent-send:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── Auth / Login ── */
.auth-wrap {
  min-height: calc(100vh - var(--nav-h));
  display: flex; align-items: center; justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, var(--teal-lt) 0%, #f7f8f5 70%);
}
.auth-card {
  background: #fff; border-radius: 20px;
  border: 1px solid rgba(0,0,0,0.08);
  padding: 2.5rem; width: 100%; max-width: 460px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}
.auth-logo { text-align: center; margin-bottom: 1.75rem; }
.auth-logo-icon { font-size: 2.5rem; }
.auth-logo-name {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.4rem;
  font-weight: 600; color: var(--teal);
}
.auth-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem;
  font-weight: 600; margin-bottom: 0.35rem;
}
.auth-sub { color: #777; font-size: 0.875rem; margin-bottom: 1.75rem; }

/* Progress bar */
.auth-progress { margin-bottom: 1.75rem; }
.auth-progress-track {
  background: var(--gray-lt); border-radius: 99px; height: 6px; overflow: hidden;
}
.auth-progress-fill {
  height: 100%; border-radius: 99px;
  background: linear-gradient(90deg, var(--teal), #34c490);
  transition: width 0.4s ease;
}
.auth-progress-label {
  display: flex; justify-content: space-between;
  font-size: 0.75rem; color: #999; margin-top: 0.4rem;
}

/* Form fields */
.field { margin-bottom: 1.1rem; }
.field label { display: block; font-size: 0.82rem; font-weight: 500; color: #444; margin-bottom: 0.35rem; }
.field input {
  width: 100%; border: 1.5px solid rgba(0,0,0,0.13); border-radius: 10px;
  padding: 0.65rem 0.9rem; font-family: 'DM Sans', sans-serif; font-size: 0.9rem; outline: none;
}
.field input:focus { border-color: var(--teal); box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
.field-error { color: var(--coral); font-size: 0.78rem; margin-top: 0.3rem; }

/* Question label (onboarding steps) */
.q-label {
  font-family: 'Space Grotesk', sans-serif; font-size: 1rem;
  font-weight: 600; margin-bottom: 1rem; color: #1a1a18; line-height: 1.4;
}
.q-hint { font-size: 0.78rem; color: #999; font-weight: 400; margin-top: 0.2rem; }

/* Option chips */
.opt-grid { display: flex; flex-direction: column; gap: 0.55rem; }
.opt-row { display: flex; flex-wrap: wrap; gap: 0.55rem; }
.opt-btn {
  border: 1.5px solid rgba(0,0,0,0.13); border-radius: 10px;
  background: #fff; padding: 0.6rem 1rem;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
  cursor: pointer; transition: all .18s; text-align: left;
  color: #333;
}
.opt-btn:hover { border-color: var(--teal); background: var(--teal-lt); color: var(--teal); }
.opt-btn.selected {
  border-color: var(--teal); background: var(--teal-lt);
  color: var(--teal); font-weight: 600;
}
.opt-btn.full-width { width: 100%; }

/* Multi-select chip row */
.chip-grid { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.chip-btn {
  border: 1.5px solid rgba(0,0,0,0.13); border-radius: 99px;
  background: #fff; padding: 0.45rem 1rem;
  font-family: 'DM Sans', sans-serif; font-size: 0.82rem;
  cursor: pointer; transition: all .18s; color: #444;
}
.chip-btn:hover { border-color: var(--teal); background: var(--teal-lt); color: var(--teal); }
.chip-btn.selected {
  border-color: var(--teal); background: var(--teal); color: #fff; font-weight: 600;
}
.chip-limit-note { font-size: 0.75rem; color: #aaa; margin-top: 0.5rem; }

/* Nav buttons */
.auth-nav { display: flex; gap: 0.75rem; margin-top: 1.75rem; }
.btn-primary {
  flex: 1; background: var(--teal); color: #fff; border: none;
  border-radius: 10px; padding: 0.75rem; font-family: 'DM Sans', sans-serif;
  font-size: 0.9rem; font-weight: 600; cursor: pointer;
}
.btn-primary:hover { opacity: 0.88; }
.btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
.btn-ghost {
  flex: 0 0 auto; background: none; border: 1.5px solid rgba(0,0,0,0.13);
  border-radius: 10px; padding: 0.75rem 1.1rem;
  font-family: 'DM Sans', sans-serif; font-size: 0.9rem; cursor: pointer;
  color: #555;
}
.btn-ghost:hover, .btn-ghost:focus-visible { background: var(--gray-lt); outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.16); }
.page-back {
  display: inline-flex; align-items: center; gap: 0.45rem;
  background: #fff; border: 1.5px solid rgba(0,0,0,0.13);
  border-radius: 10px; padding: 0.6rem 0.9rem;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 600;
  color: #555; cursor: pointer; margin-bottom: 1.5rem;
}
.page-back:hover, .page-back:focus-visible {
  background: var(--teal-lt); color: var(--teal); outline: none;
  box-shadow: 0 0 0 3px rgba(29,158,117,0.16);
}
.page-state {
  background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
  padding: 1.2rem 1.35rem; color: #555; font-size: 0.9rem; line-height: 1.55;
}
.page-state.error { border-color: rgba(216,90,48,0.25); background: var(--coral-lt); color: #5f4036; }
.page-state.empty { background: #fafafa; }
.page-state-title { font-weight: 700; color: #1a1a18; margin-bottom: 0.25rem; }
.page-state.error .page-state-title { color: var(--coral); }
.success-feedback {
  display: flex; align-items: flex-start; gap: 0.55rem;
  color: #14684f; background: var(--teal-lt); border: 1px solid rgba(29,158,117,0.24);
  border-radius: 10px; padding: 0.7rem 0.85rem; font-size: 0.86rem;
  font-weight: 700; margin-bottom: 0.75rem;
}
.field-error[role="alert"] {
  background: var(--coral-lt); border: 1px solid rgba(216,90,48,0.18);
  border-radius: 9px; padding: 0.55rem 0.7rem;
}
.dashboard-anchor { scroll-margin-top: calc(var(--nav-h) + 1rem); }
.dashboard-shell {
  max-width: 1180px; margin: 0 auto; padding: 2.25rem 1.5rem 3rem;
  display: grid; grid-template-columns: minmax(190px, 230px) minmax(0, 1fr); gap: 1.5rem;
}
.dashboard-section-nav {
  position: sticky; top: calc(var(--nav-h) + 1rem); align-self: start;
  background: #fff; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px;
  padding: 0.85rem; box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}
.dashboard-section-nav-title {
  font-size: 0.76rem; font-weight: 800; color: #77827d; letter-spacing: 0.07em;
  text-transform: uppercase; margin: 0 0 0.55rem 0.25rem;
}
.dashboard-section-nav-list { display: grid; gap: 0.2rem; }
.dashboard-section-nav-button {
  border: none; background: none; cursor: pointer; text-align: left; border-radius: 9px;
  padding: 0.55rem 0.65rem; font-family: 'DM Sans', sans-serif; font-size: 0.84rem;
  color: #56615c;
}
.dashboard-section-nav-button:hover,
.dashboard-section-nav-button:focus-visible,
.dashboard-section-nav-button.active {
  background: var(--teal-lt); color: var(--teal); outline: none;
  box-shadow: inset 0 0 0 2px rgba(29,158,117,0.16);
}
.dashboard-content { min-width: 0; }
@media (max-width: 900px) {
  .dashboard-shell { display: block; padding: 1.25rem 1rem 2.5rem; }
  .dashboard-section-nav {
    position: static; margin-bottom: 1rem; overflow-x: auto; padding: 0.65rem;
  }
  .dashboard-section-nav-list {
    display: flex; gap: 0.35rem; min-width: max-content;
  }
  .dashboard-section-nav-button { white-space: nowrap; }
}

/* Auth switch link */
.auth-switch { text-align: center; margin-top: 1.25rem; font-size: 0.83rem; color: #888; }
.auth-switch button { background: none; border: none; color: var(--teal); cursor: pointer; font-weight: 600; font-size: 0.83rem; }

/* Avatar row */
.avatar { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; color: #fff; background: var(--teal); }

/* ── Team card ── */
.team-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
.team-card { background: #fff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.07); padding: 1.5rem; text-align: center; flex: 1; min-width: 160px; }
.team-card .avatar { margin-bottom: 0.75rem; }

/* ── Chat Widget ── */
.chat-fab {
  position: fixed; bottom: 1.5rem; right: 1.5rem; z-index: 200;
  width: 52px; height: 52px; border-radius: 50%;
  background: var(--teal); color: #fff; border: none; cursor: pointer;
  font-size: 1.4rem; box-shadow: 0 4px 16px rgba(29,158,117,0.4);
  display: flex; align-items: center; justify-content: center;
}
.chat-fab:hover { opacity: 0.88; }
.chat-panel {
  position: fixed; bottom: 4.5rem; right: 1.5rem; z-index: 199;
  width: 340px; background: #fff; border-radius: 16px;
  border: 1px solid rgba(0,0,0,0.1); box-shadow: 0 8px 32px rgba(0,0,0,0.14);
  display: flex; flex-direction: column; overflow: hidden;
  max-height: min(560px, calc(100vh - 6rem));
}
.chat-header {
  background: var(--teal); color: #fff;
  padding: 0.75rem 1rem; font-weight: 600; font-size: 0.875rem;
  display: flex; align-items: center; justify-content: space-between;
  gap: 0.75rem;
}
.chat-header-sub { font-size: 0.75rem; font-weight: 400; opacity: 0.8; }
.chat-header-actions { display: flex; align-items: center; gap: 0.4rem; flex: 0 0 auto; }
.chat-header-button {
  border: 1px solid rgba(255,255,255,0.28); background: rgba(255,255,255,0.12); color: #fff;
  border-radius: 8px; padding: 0.32rem 0.5rem; cursor: pointer; font-size: 0.76rem; font-weight: 700;
}
.chat-header-button:hover, .chat-header-button:focus-visible { outline: none; box-shadow: 0 0 0 3px rgba(255,255,255,0.24); background: rgba(255,255,255,0.18); }
.chat-messages { min-height: 280px; height: 320px; overflow-y: auto; padding: 0.85rem; display: flex; flex-direction: column; gap: 0.6rem; }
.chat-bubble { max-width: 85%; padding: 0.55rem 0.85rem; border-radius: 12px; font-size: 0.82rem; line-height: 1.5; }
.chat-bubble.user { align-self: flex-end; background: var(--teal); color: #fff; border-bottom-right-radius: 3px; }
.chat-bubble.ai { align-self: flex-start; background: var(--gray-lt); border-bottom-left-radius: 3px; }
.chat-bubble.ai.loading { opacity: 0.6; font-style: italic; }
.chat-empty { margin: auto; text-align: center; color: #66736d; line-height: 1.55; padding: 1rem; }
.chat-empty-title { font-weight: 800; color: #1a1a18; margin-bottom: 0.3rem; }
.chat-input-row { display: flex; gap: 0.5rem; padding: 0.65rem 0.75rem; border-top: 1px solid rgba(0,0,0,0.07); align-items: flex-end; }
.chat-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 0.52rem 0.7rem; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; outline: none; resize: none; min-height: 38px; max-height: 110px; }
.chat-input:focus { border-color: var(--teal); }
.chat-send { background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.55rem 0.85rem; cursor: pointer; font-size: 0.85rem; font-weight: 700; min-width: 44px; }
.chat-send:hover, .chat-send:focus-visible { opacity: 0.88; outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.18); }
.chat-send:disabled { opacity: 0.45; cursor: not-allowed; }
.chat-login-prompt { padding: 1.25rem; text-align: center; color: #666; font-size: 0.85rem; }
.chat-login-prompt button { margin-top: 0.75rem; background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.25rem; cursor: pointer; font-size: 0.875rem; }
.dashboard-chat-launcher { margin-bottom: 0.5rem; }
.dashboard-chat-launcher .agent-header { justify-content: space-between; align-items: flex-start; gap: 1rem; }
.dashboard-chat-title { display: flex; align-items: center; gap: 0.55rem; min-width: 0; }
.dashboard-chat-badge {
  flex: 0 0 auto; border: 1px solid rgba(255,255,255,0.35); border-radius: 999px;
  padding: 0.24rem 0.55rem; font-size: 0.72rem; font-weight: 800; background: rgba(255,255,255,0.14);
}
.dashboard-chat-welcome {
  min-height: 210px; display: grid; place-content: center; gap: 0.35rem;
  background: linear-gradient(180deg, #fff 0%, #f7fbf9 100%);
}
.dashboard-chat-welcome .chat-empty-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; }
.dashboard-chat-actions {
  display: flex; justify-content: flex-end; gap: 0.65rem; flex-wrap: wrap; padding: 0 1rem 1rem;
}
.dashboard-chat-actions .btn-ghost { min-height: 42px; }
@media (max-width: 560px) {
  .dashboard-chat-launcher .agent-header { display: grid; }
  .dashboard-chat-badge { justify-self: start; }
  .dashboard-chat-actions { justify-content: stretch; }
  .dashboard-chat-actions .btn-ghost { width: 100%; }
}
.ai-chat-shell {
  max-width: 1180px; margin: 0 auto; padding: 2.25rem 1.5rem 3rem;
  display: grid; grid-template-columns: minmax(230px, 290px) minmax(0, 1fr); gap: 1.25rem;
}
.ai-chat-sidebar, .ai-chat-main {
  background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 14px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.ai-chat-sidebar { padding: 1rem; align-self: start; }
.ai-chat-sidebar-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; }
.ai-chat-list { display: grid; gap: 0.45rem; max-height: 560px; overflow-y: auto; overflow-x: hidden; padding-right: 0.15rem; }
.ai-chat-list-item {
  border: 1px solid rgba(0,0,0,0.08); background: #fff; border-radius: 10px; padding: 0.7rem;
  text-align: left; cursor: pointer; color: #333; min-width: 0;
}
.ai-chat-list-row { position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 40px; gap: 0.35rem; align-items: stretch; }
.ai-chat-list-item:hover, .ai-chat-list-item:focus-visible, .ai-chat-list-item.active {
  outline: none; background: var(--teal-lt); border-color: rgba(29,158,117,0.28);
  box-shadow: inset 0 0 0 2px rgba(29,158,117,0.13);
}
.ai-chat-menu-button {
  border: 1px solid rgba(0,0,0,0.08); background: #fff; border-radius: 10px; cursor: pointer;
  padding: 0; color: #56615c; font-weight: 800; min-width: 40px; min-height: 40px;
}
.ai-chat-menu-button:hover, .ai-chat-menu-button:focus-visible, .ai-chat-menu-button.open {
  background: var(--gray-lt); outline: none; box-shadow: inset 0 0 0 2px rgba(29,158,117,0.14);
}
.ai-chat-menu {
  position: absolute; right: 0; top: calc(100% + 0.25rem); z-index: 20; width: min(160px, 100%);
  background: #fff; border: 1px solid rgba(0,0,0,0.1); border-radius: 10px;
  box-shadow: 0 12px 28px rgba(0,0,0,0.14); padding: 0.35rem;
}
.ai-chat-menu-item {
  width: 100%; border: none; background: none; text-align: left; cursor: pointer;
  padding: 0.6rem 0.65rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; min-height: 40px;
}
.ai-chat-menu-item:hover, .ai-chat-menu-item:focus-visible { background: var(--gray-lt); outline: none; }
.ai-chat-menu-item.danger { color: var(--coral); font-weight: 700; }
.ai-chat-rename-row { display: block; }
.ai-chat-rename-row .ai-chat-list-item { width: 100%; }
.ai-chat-rename-form { display: grid; gap: 0.4rem; }
.ai-chat-rename-input {
  width: 100%; border: 1.5px solid rgba(0,0,0,0.13); border-radius: 8px;
  padding: 0.55rem 0.65rem; font-family: 'DM Sans', sans-serif; font-size: 0.86rem;
}
.ai-chat-rename-input:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
.ai-chat-list-title { font-weight: 800; font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ai-chat-list-time { margin-top: 0.2rem; font-size: 0.72rem; color: #77827d; }
.ai-chat-main { min-height: 620px; display: flex; flex-direction: column; overflow: hidden; }
.ai-chat-main-header { padding: 1rem 1.1rem; border-bottom: 1px solid rgba(0,0,0,0.07); }
.ai-chat-full-messages { flex: 1; min-height: 420px; overflow-y: auto; padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; background: #fbfcfa; }
.ai-chat-full-messages .chat-bubble { max-width: min(680px, 88%); font-size: 0.92rem; }
.dashboard-ai-preview {
  background: #fff; border: 1px solid rgba(29,158,117,0.18); border-radius: 14px;
  padding: 1.25rem; box-shadow: 0 2px 12px rgba(0,0,0,0.05); margin-bottom: 0.5rem;
}
.dashboard-ai-preview-text { color: #52615b; font-size: 0.88rem; line-height: 1.6; margin: 0.65rem 0 1rem; }
@media (max-width: 820px) {
  .ai-chat-shell { display: block; padding: 1.25rem 1rem 2.5rem; }
  .ai-chat-sidebar { margin-bottom: 1rem; }
  .ai-chat-list { max-height: 180px; }
  .ai-chat-main { min-height: 560px; }
  .chat-panel { left: 1rem; right: 1rem; width: auto; }
}
@media (max-width: 430px) {
  .chat-header { align-items: flex-start; }
  .chat-header-actions { flex-direction: column; align-items: stretch; }
  .chat-header-button { font-size: 0.72rem; }
}

/* ── Resources ── */
.res-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 1rem; }
.res-card { background: #fff; border-radius: 14px; border: 1px solid rgba(0,0,0,0.07); padding: 1.25rem; }
.res-tag { display: inline-block; font-size: 0.72rem; font-weight: 600; border-radius: 99px; padding: 0.2rem 0.65rem; margin-bottom: 0.6rem; background: var(--teal-lt); color: var(--teal); }
.res-title { font-weight: 600; margin-bottom: 0.35rem; font-size: 0.95rem; }
.res-desc { color: #666; font-size: 0.82rem; line-height: 1.5; }

/* ── Footer ── */
footer { background: #1a1a18; color: #aaa; text-align: center; padding: 1.75rem 1rem; font-size: 0.85rem; }
footer strong { color: #fff; }
`;

// ─── Context ──────────────────────────────────────────────────────
const AppCtx = createContext(null);
function useApp() { return useContext(AppCtx); }
const ChatCtx = createContext(null);
function useChat() { return useContext(ChatCtx); }

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
const CHAT_STORAGE_PREFIX = "cyberly.chat.v1";
const MAX_CONVERSATION_TITLE_LENGTH = 80;
const PUBLIC_PAGES = new Set(["home", "resources", "about", "login"]);
const PROTECTED_PAGES = new Set(["dashboard", "assessment", "scenarios", "progress", "profile", "ai-chat"]);
const VALID_PAGES = new Set([...PUBLIC_PAGES, ...PROTECTED_PAGES]);

const {
  EDUCATION_LEVELS,
  LANGUAGES,
  FAMILIARITY,
  HELP_OPTIONS,
  LEARNING_STYLES,
  labelFor,
  labelsFor,
} = profileMappings;

function parseHashPage() {
  if (typeof window === "undefined") return "home";
  const raw = window.location.hash.replace(/^#\/?/, "").split(/[/?#]/)[0];
  return VALID_PAGES.has(raw) ? raw : "home";
}

function writeHashPage(page, replace = false) {
  if (typeof window === "undefined") return;
  const nextHash = `#/${VALID_PAGES.has(page) ? page : "home"}`;
  if (window.location.hash === nextHash) return;
  if (replace) {
    window.history.replaceState(null, "", nextHash);
  } else {
    window.location.hash = nextHash;
  }
}

function PageBackButton({ className = "", style }) {
  const { t } = useTranslation();
  const { user, go } = useApp();
  const target = user ? "dashboard" : "home";
  const label = user ? t("common.backToDashboard") : t("common.backToHome");

  return (
    <button
      type="button"
      className={`page-back${className ? ` ${className}` : ""}`}
      style={style}
      onClick={() => go(target)}
      aria-label={label}
    >
      <span aria-hidden="true">←</span>
      <span>{label}</span>
    </button>
  );
}

function PageState({ type = "loading", title, message, actionLabel, onAction }) {
  const isError = type === "error";
  return (
    <div className={`page-state ${type}`} role={isError ? "alert" : "status"} aria-live={isError ? "assertive" : "polite"}>
      {title && <div className="page-state-title">{title}</div>}
      {message && <div>{message}</div>}
      {actionLabel && onAction && (
        <button type="button" className="btn-ghost" style={{ marginTop: "0.85rem" }} onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function SuccessFeedback({ message }) {
  if (!message) return null;
  return (
    <div className="success-feedback" role="status" aria-live="polite">
      <span aria-hidden="true">✓</span>
      <span>{message}</span>
    </div>
  );
}

function ConfirmationDialog({
  title,
  description,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  danger = false,
}) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab") return;

      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="logout-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div
        className="logout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirmation-dialog-title"
        aria-describedby="confirmation-dialog-description"
      >
        <h2 id="confirmation-dialog-title">{title}</h2>
        <p id="confirmation-dialog-description">{description}</p>
        <div className="logout-modal-actions">
          <button type="button" className="modal-cancel" ref={cancelRef} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className={danger ? "modal-confirm" : "modal-cancel"} ref={confirmRef} onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
}

function focusFirstNamedField(fieldNames) {
  window.setTimeout(() => {
    const first = fieldNames
      .map(name => document.querySelector(`[data-field="${name}"]`))
      .find(Boolean);
    first?.focus?.();
  }, 0);
}

function chatStorageKey(userId) {
  return `${CHAT_STORAGE_PREFIX}.${userId}`;
}

function safeReadChatState(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(chatStorageKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.conversations)) return null;
    return {
      activeConversationId: parsed.activeConversationId || parsed.conversations[0]?.id || null,
      conversations: parsed.conversations
        .filter(conversation => conversation?.id && Array.isArray(conversation.messages))
        .map(conversation => ({
          id: String(conversation.id),
          title: String(conversation.title || "New chat"),
          createdAt: conversation.createdAt || new Date().toISOString(),
          updatedAt: conversation.updatedAt || conversation.createdAt || new Date().toISOString(),
          messages: conversation.messages
            .filter(message => message?.role && typeof message.text === "string")
            .map(message => ({
              id: String(message.id || `msg-${Date.now()}`),
              role: message.role === "user" ? "user" : "ai",
              text: message.text,
              createdAt: message.createdAt || new Date().toISOString(),
            })),
        })),
    };
  } catch {
    return null;
  }
}

function safeWriteChatState(userId, state) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chatStorageKey(userId), JSON.stringify({
      activeConversationId: state.activeConversationId,
      conversations: state.conversations,
    }));
  } catch {
    // Temporary local storage is best-effort until backend chat history exists.
  }
}

function createChatId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function titleFromMessage(text) {
  const trimmed = text.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New chat";
  return trimmed.length > 42 ? `${trimmed.slice(0, 39)}...` : trimmed;
}

function normalizeConversationTitle(title) {
  return title.trim().replace(/\s+/g, " ");
}

function ChatProvider({ user, children }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ conversations: [], activeConversationId: null });
  const [sending, setSending] = useState(false);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) {
      setState({ conversations: [], activeConversationId: null });
      setSending(false);
      return;
    }

    setState(safeReadChatState(userId) || { conversations: [], activeConversationId: null });
    setSending(false);
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    safeWriteChatState(userId, state);
  }, [userId, state]);

  const activeConversation = state.conversations.find(conversation => conversation.id === state.activeConversationId) || null;
  const conversations = [...state.conversations].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  function createConversation(initialText = "") {
    if (!userId) return null;
    const now = new Date().toISOString();
    const clean = initialText.trim();
    const initialMessages = clean
      ? [{ id: createChatId("msg"), role: "user", text: clean, createdAt: now }]
      : [];
    const conversation = {
      id: createChatId("chat"),
      title: clean ? titleFromMessage(clean) : t("chat.conversation.newTitle"),
      createdAt: now,
      updatedAt: now,
      messages: initialMessages,
    };
    setState(current => ({
      conversations: [conversation, ...current.conversations],
      activeConversationId: conversation.id,
    }));
    return conversation.id;
  }

  function createConversationFromMessage(text) {
    return createConversation(text);
  }

  function startDashboardConversation(firstMessage) {
    return createConversation(firstMessage);
  }

  function ensureConversation() {
    if (state.activeConversationId && state.conversations.some(conversation => conversation.id === state.activeConversationId)) {
      return state.activeConversationId;
    }
    return createConversation();
  }

  function selectConversation(id) {
    setState(current => current.conversations.some(conversation => conversation.id === id)
      ? { ...current, activeConversationId: id }
      : current);
  }

  function renameConversation(id, title) {
    const nextTitle = normalizeConversationTitle(title);
    if (!nextTitle || nextTitle.length > MAX_CONVERSATION_TITLE_LENGTH) return false;
    setState(current => ({
      ...current,
      conversations: current.conversations.map(conversation => conversation.id === id
        ? { ...conversation, title: nextTitle, updatedAt: new Date().toISOString() }
        : conversation),
    }));
    return true;
  }

  function deleteConversation(id) {
    setState(current => {
      const remaining = current.conversations.filter(conversation => conversation.id !== id);
      const nextActive = current.activeConversationId === id
        ? [...remaining].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))[0]?.id || null
        : current.activeConversationId;
      return {
        conversations: remaining,
        activeConversationId: nextActive,
      };
    });
  }

  async function sendMessage(text) {
    const clean = text.trim();
    if (!clean || sending || !userId) return;
    const now = new Date().toISOString();
    const conversationId = ensureConversation();
    if (!conversationId) return;
    const userMessage = { id: createChatId("msg"), role: "user", text: clean, createdAt: now };

    setSending(true);
    setState(current => ({
      activeConversationId: conversationId,
      conversations: current.conversations.map(conversation => {
        if (conversation.id !== conversationId) return conversation;
        const wasEmpty = conversation.messages.length === 0;
        return {
          ...conversation,
          title: wasEmpty ? titleFromMessage(clean) : conversation.title,
          updatedAt: now,
          messages: [...conversation.messages, userMessage],
        };
      }),
    }));

    try {
      const aiText = await askClaude([{ role: "user", content: clean }], buildSystemPrompt(user), t);
      const aiMessage = {
        id: createChatId("msg"),
        role: "ai",
        text: aiText,
        createdAt: new Date().toISOString(),
      };
      setState(current => ({
        activeConversationId: conversationId,
        conversations: current.conversations.map(conversation => conversation.id === conversationId
          ? { ...conversation, updatedAt: aiMessage.createdAt, messages: [...conversation.messages, aiMessage] }
          : conversation),
      }));
    } catch {
      const aiMessage = {
        id: createChatId("msg"),
        role: "ai",
        text: t("common.somethingWentWrong"),
        createdAt: new Date().toISOString(),
      };
      setState(current => ({
        activeConversationId: conversationId,
        conversations: current.conversations.map(conversation => conversation.id === conversationId
          ? { ...conversation, updatedAt: aiMessage.createdAt, messages: [...conversation.messages, aiMessage] }
          : conversation),
      }));
    } finally {
      setSending(false);
    }
  }

  const value = {
    conversations,
    activeConversation,
    activeConversationId: state.activeConversationId,
    messages: activeConversation?.messages || [],
    sending,
    createConversation,
    createConversationFromMessage,
    startDashboardConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
  };

  return <ChatCtx.Provider value={value}>{children}</ChatCtx.Provider>;
}

function normalizeProfile(profileData) {
  const profile = profileData || {};
  return {
    exists: Boolean(profile.exists),
    aiNickname: profile.aiNickname || "",
    educationLevel: profile.educationLevel || "",
    preferredLanguage: profile.preferredLanguage || "",
    familiarityLevel: profile.familiarityLevel || "",
    helpTopics: Array.isArray(profile.helpTopics) ? profile.helpTopics : [],
    learningStyle: profile.learningStyle || "",
    onboardingCompleted: Boolean(profile.onboardingCompleted),
    onboardingCompletedAt: profile.onboardingCompletedAt || null,
    profileLastConfirmedAt: profile.profileLastConfirmedAt || null,
  };
}

function normalizeSessionUser(userData, profileData) {
  const learnerProfile = normalizeProfile(profileData || userData?.profile || userData?.learnerProfile);
  return {
    ...userData,
    profile: learnerProfile,
    name: userData?.displayName || userData?.name || "Learner",
    displayName: userData?.displayName || userData?.name || "Learner",
    aiNickname: learnerProfile.aiNickname || "",
    helpTopics: learnerProfile.helpTopics || [],
    helpTopicLabels: labelsFor(HELP_OPTIONS, learnerProfile.helpTopics),
    language: labelFor(LANGUAGES, learnerProfile.preferredLanguage, "English"),
    familiarity: labelFor(FAMILIARITY, learnerProfile.familiarityLevel, "Beginner"),
    learningStyle: labelFor(LEARNING_STYLES, learnerProfile.learningStyle),
    educationLevel: labelFor(EDUCATION_LEVELS, learnerProfile.educationLevel),
    learnerProfilePersisted: learnerProfile.exists,
    onboardingCompleted: learnerProfile.onboardingCompleted,
  };
}

function localizedApiError(t, result = {}, fallbackKey = "errors.fallback.generic") {
  if (result.code) {
    const key = `errors.codes.${result.code}`;
    const translated = t(key, { defaultValue: "" });
    if (translated && translated !== key) return translated;
  }

  if (result.message) return result.message;

  return t(fallbackKey, {
    defaultValue: t("errors.fallback.generic"),
  });
}

function apiFailure(data = {}, fallbackKey = "errors.fallback.generic", fallbackErrors = {}) {
  const result = {
    ok: false,
    code: data.code,
    message: data.message,
    errors: data.errors || fallbackErrors,
  };
  return {
    ...result,
    error: localizedApiError(i18n.t.bind(i18n), result, fallbackKey),
  };
}

function networkFailure(fallbackKey = "errors.fallback.network", fallbackErrors = {}) {
  const result = {
    ok: false,
    code: "NETWORK_UNAVAILABLE",
    network: true,
    errors: fallbackErrors,
  };
  return {
    ...result,
    error: localizedApiError(i18n.t.bind(i18n), result, fallbackKey),
  };
}

// Returns { ok: true } or { ok: false, error: string, code?: string }
async function dbRegister(account) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: account.email,
        displayName: account.displayName,
        password: account.password,
        age: account.age,
      })
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) return apiFailure(data, "errors.fallback.register");

    return { ok: true, user: data.user, profile: data.profile };

  } catch (error) {
    console.error("Registration error:", error);
    return networkFailure("errors.fallback.network");
  }
}

async function dbLogin(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    if (!response.ok) return apiFailure(data, "errors.fallback.signIn");

    return { ok: true, user: data.user, profile: data.profile };
  } catch {
    return networkFailure("errors.fallback.network");
  }
}

async function dbMe() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.session");
    return { ok: true, user: data.user, profile: data.profile };
  } catch {
    return networkFailure("errors.fallback.session");
  }
}

async function dbSaveProfile(profile) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.saveProfile");
    return { ok: true, profile: data.profile };
  } catch {
    return networkFailure("errors.fallback.saveProfile");
  }
}

async function dbSaveAccount(account) {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/account`,
      {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
      }
    );

    const data = await response.json().catch(() => ({}));

    if (!response.ok) return apiFailure(data, "errors.fallback.saveAccount");

    return {
      ok: true,
      account: data.account,
    };
  } catch {
    return networkFailure("errors.fallback.saveAccount");
  }
}

function localeQuery(locale) {
  return `locale=${encodeURIComponent(normalizeLocale(locale))}`;
}

async function dbGetInitialAssessment(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments/initial?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadAssessment");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadAssessment");
  }
}

async function dbGetAssessmentStatus(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments/initial/status?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadAssessmentStatus");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadAssessmentStatus");
  }
}

async function dbStartInitialAttempt(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments/initial/attempts?${localeQuery(locale)}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.startAssessment");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.startAssessment");
  }
}

async function dbSaveAssessmentAnswer(attemptId, questionId, selectedOptionKey) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessment-attempts/${attemptId}/answers`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedOptionKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.saveAssessmentAnswer");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.saveAssessmentAnswer");
  }
}

async function dbSubmitAssessment(attemptId, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessment-attempts/${attemptId}/submit?${localeQuery(locale)}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.submitAssessment");
    return { ok: true, result: data };
  } catch {
    return networkFailure("errors.fallback.submitAssessment");
  }
}

async function dbGetProgress() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadProgress");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadProgress");
  }
}

async function dbGetCurrentRecommendation(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/current?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadRecommendation");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadRecommendation");
  }
}

async function dbMarkRecommendationViewed(id, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/${id}/viewed?${localeQuery(locale)}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.updateRecommendation");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.updateRecommendation");
  }
}

async function dbMarkRecommendationCompleted(id, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/${id}/completed?${localeQuery(locale)}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.completeRecommendation");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.completeRecommendation");
  }
}

async function dbGetScenarios(filters = {}, locale) {
  try {
    const params = new URLSearchParams();
    if (filters.topicCode) params.set("topicCode", filters.topicCode);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    params.set("locale", normalizeLocale(locale));
    const response = await fetch(`${API_BASE_URL}/api/scenarios${params.toString() ? `?${params}` : ""}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadScenarios");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadScenarios");
  }
}

async function dbGetScenario(slug, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/${slug}?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadScenario");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadScenario");
  }
}

async function dbStartScenario(slug, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/${slug}/attempts?${localeQuery(locale)}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.startScenario");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.startScenario");
  }
}

async function dbGetScenarioAttempt(attemptId, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.restoreScenario");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.restoreScenario");
  }
}

async function dbSaveScenarioDecision(attemptId, stepId, selectedOptionKey, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}/decisions?${localeQuery(locale)}`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, selectedOptionKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.saveScenarioDecision");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.saveScenarioDecision");
  }
}

async function dbCompleteScenario(attemptId, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}/complete?${localeQuery(locale)}`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.completeScenario");
    return { ok: true, result: data };
  } catch {
    return networkFailure("errors.fallback.completeScenario");
  }
}

async function dbGetScenarioResult(attemptId, locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}/result?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadScenarioResult");
    return { ok: true, result: data };
  } catch {
    return networkFailure("errors.fallback.loadScenarioResult");
  }
}

async function dbGetRecommendedScenarios(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/recommended?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadRecommendedScenarios");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadRecommendedScenarios");
  }
}

async function dbGetScenarioDashboard(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/dashboard?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadScenarioActivity");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadScenarioActivity");
  }
}

async function dbGetResources(locale) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/resources?${localeQuery(locale)}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, "errors.fallback.loadResources");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadResources");
  }
}

async function dbLogout() {
  try {
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Local state still clears even if the network request fails.
  }
}

// ─── Helpers ──────────────────────────────────────────────────────
function getAgeGroup(age) {
  const value = Number(age);
  if (!Number.isInteger(value) || value < 1 || value > 120) {
    return { label: "Invalid age", key: "invalid" };
  }
  if (value <= 12) return { label: "Child (1–12)", key: "child" };
  if (value <= 17) return { label: "Teen (13–17)", key: "teen" };
  if (value <= 24) return { label: "Young adult (18–24)", key: "young_adult" };
  return { label: "Adult (25–120)", key: "adult" };
}

const PROGRESS_TOPIC_META = {
  phishing_and_scams: { label: "Phishing and scams", category: "Scams", icon: "🎣" },
  password_and_account_security: { label: "Password and account security", category: "Passwords", icon: "🔐" },
  privacy_and_personal_information: { label: "Privacy and personal information", category: "Privacy", icon: "🕵️" },
  misinformation_and_deepfakes: { label: "Misinformation and deepfakes", category: "Misinformation", icon: "🧠" },
};

const LEVEL_LABELS = {
  beginner: "Beginner",
  developing: "Developing",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

const SCENARIO_RESULT_LABELS = {
  needs_review: "Needs review",
  developing: "Developing",
  proficient: "Proficient",
  strong: "Strong",
};

function levelLabel(level) {
  return LEVEL_LABELS[level] || "Not measured";
}

function scenarioResultLabel(level) {
  return SCENARIO_RESULT_LABELS[level] || "Not completed";
}

function topicLabel(topicCode, fallback) {
  return PROGRESS_TOPIC_META[topicCode]?.label || fallback || "Recommended topic";
}

// ─── AI helper ────────────────────────────────────────────────────
async function askClaude(messages, systemPrompt, t) {
  void messages;
  void systemPrompt;
  return t("chat.disabledReply");
}

// ─────────────────────────────────────────────────────────────────
// STEP 1 — Account credentials
// ─────────────────────────────────────────────────────────────────
function StepCredentials({ data, onChange, errors }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="auth-title">
        {t("auth.createAccount")}
      </div>

      <div className="auth-sub">
        {t("auth.accountDetailsHint")}
      </div>

      <div className="field">
        <label>
          {t("auth.email")}
        </label>

        <input
          data-field="email"
          type="email"
          placeholder={t("auth.emailPlaceholder")}
          value={data.email}
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "register-email-error" : undefined}
          onChange={event =>
            onChange(
              "email",
              event.target.value
            )
          }
        />

        {errors.email && (
          <div className="field-error" id="register-email-error" role="alert">
            {errors.email}
          </div>
        )}
      </div>

      <div className="field">
        <label>
          {t("auth.displayName")}
        </label>

        <input
          data-field="displayName"
          placeholder={t(
            "auth.displayNamePlaceholder"
          )}
          value={data.displayName}
          aria-invalid={Boolean(errors.displayName)}
          aria-describedby={errors.displayName ? "register-display-name-error" : undefined}
          onChange={event =>
            onChange(
              "displayName",
              event.target.value
            )
          }
        />

        {errors.displayName && (
          <div className="field-error" id="register-display-name-error" role="alert">
            {errors.displayName}
          </div>
        )}
      </div>

      <div className="field">
        <label>
          {t("auth.age")}
        </label>

        <input
          data-field="age"
          type="number"
          placeholder={t(
            "auth.agePlaceholder"
          )}
          value={data.age}
          aria-invalid={Boolean(errors.age)}
          aria-describedby={errors.age ? "register-age-error" : undefined}
          onChange={event =>
            onChange(
              "age",
              event.target.value
            )
          }
        />

        {errors.age && (
          <div className="field-error" id="register-age-error" role="alert">
            {errors.age}
          </div>
        )}
      </div>

      <div className="field">
        <label>
          {t("auth.password")}
        </label>

        <input
          data-field="password"
          type="password"
          placeholder={t(
            "auth.passwordPlaceholder"
          )}
          value={data.password}
          aria-invalid={Boolean(errors.password)}
          aria-describedby={errors.password ? "register-password-error" : undefined}
          onChange={event =>
            onChange(
              "password",
              event.target.value
            )
          }
        />

        {errors.password && (
          <div className="field-error" id="register-password-error" role="alert">
            {errors.password}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 — AI nickname
// ─────────────────────────────────────────────────────────────────
function StepNickname({
  data,
  onChange,
  errors,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="q-label">
        {t("onboarding.nicknameQuestion")}

        <div className="q-hint">
          {t("onboarding.nicknameHint")}
        </div>
      </div>

      <div className="field">
        <input
          data-field="aiNickname"
          placeholder={t(
            "onboarding.nicknamePlaceholder"
          )}
          value={data.aiNickname}
          aria-invalid={Boolean(errors.aiNickname)}
          aria-describedby={errors.aiNickname ? "register-ai-nickname-error" : undefined}
          onChange={event =>
            onChange(
              "aiNickname",
              event.target.value
            )
          }
        />

        {errors.aiNickname && (
          <div className="field-error" id="register-ai-nickname-error" role="alert">
            {errors.aiNickname}
          </div>
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 — Education level
// ─────────────────────────────────────────────────────────────────
function StepEducationLevel({
  data,
  onChange,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="q-label">
        {t("onboarding.educationQuestion")}
      </div>

      <div className="opt-grid">
        {EDUCATION_LEVELS.map(level => (
          <button
            key={level.value}
            data-field="educationLevel"
            className={`opt-btn full-width ${
              data.educationLevel === level.value
                ? "selected"
                : ""
            }`}
            onClick={() =>
              onChange(
                "educationLevel",
                level.value
              )
            }
          >
            {t(
              `profileOptions.education.${level.value}`,
              {
                defaultValue: level.label,
              }
            )}
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 4 — Language preference
// ─────────────────────────────────────────────────────────────────
function StepLanguage({
  data,
  onChange,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="q-label">
        {t("onboarding.languageQuestion")}
      </div>

      <div className="opt-grid">
        {LANGUAGES.map(languageOption => (
          <button
            key={languageOption.value}
            data-field="language"
            className={`opt-btn full-width ${
              data.language ===
              languageOption.value
                ? "selected"
                : ""
            }`}
            onClick={() =>
              onChange(
                "language",
                languageOption.value
              )
            }
          >
            {t(
              `profileOptions.language.${languageOption.value}`,
              {
                defaultValue:
                  languageOption.label,
              }
            )}
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 5 — Cybersecurity familiarity
// ─────────────────────────────────────────────────────────────────
function StepFamiliarity({
  data,
  onChange,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="q-label">
        {t(
          "onboarding.familiarityQuestion"
        )}
      </div>

      <div className="opt-grid">
        {FAMILIARITY.map(level => (
          <button
            key={level.value}
            data-field="familiarity"
            className={`opt-btn full-width ${
              data.familiarity === level.value
                ? "selected"
                : ""
            }`}
            onClick={() =>
              onChange(
                "familiarity",
                level.value
              )
            }
          >
            <strong>
              {t(
                `profileOptions.familiarity.${level.value}.label`,
                {
                  defaultValue:
                    level.label,
                }
              )}
            </strong>

            <div
              style={{
                fontSize: "0.78rem",
                color:
                  data.familiarity ===
                  level.value
                    ? "inherit"
                    : "#888",
                marginTop: "0.2rem",
                fontWeight: 400,
              }}
            >
              {t(
                `profileOptions.familiarity.${level.value}.description`,
                {
                  defaultValue:
                    level.desc,
                }
              )}
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 6 — Help topics (multi-select, up to 3)
// ─────────────────────────────────────────────────────────────────
function StepHelpTopics({
  data,
  onChange,
}) {
  const { t } = useTranslation();
  const selected = data.helpTopics || [];

  function toggle(topicValue) {
    if (selected.includes(topicValue)) {
      onChange(
        "helpTopics",
        selected.filter(
          value => value !== topicValue
        )
      );
    } else if (selected.length < 3) {
      onChange(
        "helpTopics",
        [...selected, topicValue]
      );
    }
  }

  return (
    <>
      <div className="q-label">
        {t("onboarding.helpTopicsQuestion")}

        <div className="q-hint">
          {t("onboarding.helpTopicsHint")}
        </div>
      </div>

      <div className="chip-grid">
        {HELP_OPTIONS.map(topic => (
          <button
            key={topic.value}
            data-field="helpTopics"
            className={`chip-btn ${
              selected.includes(topic.value)
                ? "selected"
                : ""
            }`}
            onClick={() =>
              toggle(topic.value)
            }
            disabled={
              selected.length >= 3 &&
              !selected.includes(topic.value)
            }
          >
            {t(
              `profileOptions.helpTopics.${topic.value}`,
              {
                defaultValue: topic.label,
              }
            )}
          </button>
        ))}
      </div>

      <div className="chip-limit-note">
        {t(
          "onboarding.selectedCount",
          {
            count: selected.length,
            max: 3,
          }
        )}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 7 — Learning style
// ─────────────────────────────────────────────────────────────────
function StepLearningStyle({
  data,
  onChange,
}) {
  const { t } = useTranslation();

  return (
    <>
      <div className="q-label">
        {t(
          "onboarding.learningStyleQuestion"
        )}
      </div>

      <div className="opt-grid">
        {LEARNING_STYLES.map(style => (
          <button
            key={style.value}
            data-field="learningStyle"
            className={`opt-btn full-width ${
              data.learningStyle === style.value
                ? "selected"
                : ""
            }`}
            onClick={() =>
              onChange(
                "learningStyle",
                style.value
              )
            }
          >
            {style.icon}{" "}
            {t(
              `profileOptions.learningStyle.${style.value}`,
              {
                defaultValue:
                  style.label,
              }
            )}
          </button>
        ))}
      </div>
    </>
  );
}
// ─────────────────────────────────────────────────────────────────
// MULTI-STEP REGISTER FORM
// ─────────────────────────────────────────────────────────────────
const TOTAL_STEPS = 7;
const STEP_LABEL_KEYS = [
  "onboarding.account",
  "onboarding.nickname",
  "onboarding.education",
  "onboarding.language",
  "onboarding.experience",
  "onboarding.goals",
  "onboarding.learningStyle",
];

function RegisterPage({ onSwitch }) {
  const { t } = useTranslation();
  const { login } = useApp();

  const [step, setStep] = useState(1);
  const [registeredUser, setRegisteredUser] =
    useState(null);

  const [form, setForm] = useState({
    email: "",
    displayName: "",
    age: "",
    password: "",

    // Step 2–7 — onboarding
    aiNickname: "",
    educationLevel: "",
    language: "",
    familiarity: "",
    helpTopics: [],
    learningStyle: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function set(key, val) {
    setForm(current => ({
      ...current,
      [key]: val,
    }));

    setErrors(current => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));
  }

  // Per-step validation
  function validate() {
    const validationErrors = {};

    if (step === 1) {
      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          form.email.trim()
        )
      ) {
        validationErrors.email =
          t("auth.emailInvalid");
      }

      const displayName =
        form.displayName.trim();

      if (
        !displayName ||
        displayName.length < 2 ||
        displayName.length > 50
      ) {
        validationErrors.displayName =
          t("auth.displayNameRequired");
      }

      if (
        !form.age ||
        Number.isNaN(Number(form.age)) ||
        !Number.isInteger(Number(form.age)) ||
        Number(form.age) < 1 ||
        Number(form.age) > 120
      ) {
        validationErrors.age =
          t("auth.ageInvalid");
      }

      if (
        !form.password ||
        form.password.length < 8 ||
        !/[A-Za-z]/.test(form.password) ||
        !/[0-9]/.test(form.password)
      ) {
        validationErrors.password =
          t("auth.passwordRequirements");
      }
    }

    if (
      step === 2 &&
      !form.aiNickname.trim()
    ) {
      validationErrors.aiNickname =
        t("onboarding.nicknameRequired");
    }

    if (
      step === 3 &&
      !form.educationLevel
    ) {
      validationErrors.educationLevel =
        t("onboarding.educationRequired");
    }

    if (
      step === 4 &&
      !form.language
    ) {
      validationErrors.language =
        t("onboarding.languageRequired");
    }

    if (
      step === 5 &&
      !form.familiarity
    ) {
      validationErrors.familiarity =
        t("onboarding.familiarityRequired");
    }

    if (
      step === 6 &&
      form.helpTopics.length === 0
    ) {
      validationErrors.helpTopics =
        t("onboarding.helpTopicsRequired");
    }

    if (
      step === 7 &&
      !form.learningStyle
    ) {
      validationErrors.learningStyle =
        t("onboarding.learningStyleRequired");
    }

    return validationErrors;
  }

  function next() {
    const validationErrors = validate();

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors);
      focusFirstNamedField(Object.keys(validationErrors));
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep(current => current + 1);
      return;
    }

    handleSubmit();
  }

  function back() {
    setErrors({});
    setStep(current => current - 1);
  }

  function buildLearnerProfilePayload() {
    return {
      aiNickname:
        form.aiNickname.trim(),

      educationLevel:
        form.educationLevel,

      preferredLanguage:
        form.language,

      familiarityLevel:
        form.familiarity,

      helpTopics:
        form.helpTopics,

      learningStyle:
        form.learningStyle,

      onboardingCompleted: true,
    };
  }

  async function handleSubmit() {
    if (loading) return;

    setLoading(true);
    setErrors({});

    try {
      let accountUser = registeredUser;

      if (!accountUser) {
        const result = await dbRegister({
          email:
            form.email.trim(),

          displayName:
            form.displayName.trim(),

          age:
            Number(form.age),

          password:
            form.password,
        });

        if (!result.ok) {
          setErrors({
            form:
              result.error ||
              t("auth.registerFailed"),
          });
          focusFirstNamedField(["email"]);
          return;
        }

        accountUser = result.user;
        setRegisteredUser(result.user);
      }

      const profileResult =
        await dbSaveProfile(
          buildLearnerProfilePayload()
        );

      if (!profileResult.ok) {
        setErrors({
          form:
            t("onboarding.profileSaveFailed"),

          ...profileResult.errors,
        });
        focusFirstNamedField(Object.keys(profileResult.errors || {}));
        return;
      }

      login(
        accountUser,
        profileResult.profile,
        "assessment"
      );
    } catch {
      setErrors({
        form:
          t("common.somethingWentWrong"),
      });
    } finally {
      setLoading(false);
    }
  }

  const progress = Math.round(
    (step / TOTAL_STEPS) * 100
  );

  const stepLabel = t(
    STEP_LABEL_KEYS[step - 1]
  );

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">
            🛡
          </div>

          <div className="auth-logo-name">
            Cyberly
          </div>
        </div>

        {/* Progress */}
        <div className="auth-progress">
          <div className="auth-progress-track">
            <div
              className="auth-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="auth-progress-label">
            <span>
              {t("onboarding.progress", {
                step,
                total: TOTAL_STEPS,
                label: stepLabel,
              })}
            </span>

            <span>
              {progress}%
            </span>
          </div>
        </div>

        {/* Step content */}
        {step === 1 && (
          <StepCredentials
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {step === 2 && (
          <StepNickname
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {step === 3 && (
          <StepEducationLevel
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {step === 4 && (
          <StepLanguage
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {step === 5 && (
          <StepFamiliarity
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {step === 6 && (
          <StepHelpTopics
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {step === 7 && (
          <StepLearningStyle
            data={form}
            onChange={set}
            errors={errors}
          />
        )}

        {errors.form && (
          <div
            className="field-error"
            role="alert"
            style={{
              marginTop: "0.5rem",
            }}
          >
            {errors.form}
          </div>
        )}

        {/* Navigation */}
        <div className="auth-nav">
          {step > 1 && (
            <button
              className="btn-ghost"
              onClick={back}
              disabled={loading}
            >
              ← {t("common.back")}
            </button>
          )}

          <button
            className="btn-primary"
            onClick={next}
            disabled={loading}
          >
            {loading
              ? registeredUser
                ? t(
                    "onboarding.savingProfile"
                  )
                : t(
                    "onboarding.settingUp"
                  )
              : step === TOTAL_STEPS
                ? registeredUser
                  ? t(
                      "onboarding.retrySavingProfile"
                    )
                  : t(
                      "onboarding.letsGo"
                    )
                : t(
                    "onboarding.continue"
                  )}
          </button>
        </div>

        {/* Switch to login */}
        <div className="auth-switch">
          {t("auth.signInPrompt")}{" "}

          <button
            onClick={onSwitch}
            disabled={loading}
          >
            {t("auth.goToLogin")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { t } = useTranslation();
  const { login } = useApp();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        form.email.trim()
      )
    ) {
      e.email = t("auth.emailInvalid");
    }

    if (!form.password) {
      e.password =
        t("auth.passwordRequired");
    }

    return e;
  }

  async function handleSubmit() {
    if (loading) return;

    const validationErrors = validate();

    if (
      Object.keys(validationErrors).length
    ) {
      setErrors(validationErrors);
      focusFirstNamedField(Object.keys(validationErrors));
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const result = await dbLogin(
        form.email.trim(),
        form.password
      );

      if (!result.ok) {
        setErrors({
          form:
            result.error ||
            t("auth.invalidCredentials"),
        });
      } else {
        login(
          result.user,
          result.profile
        );
      }
    } catch {
      setErrors({
        form:
          t("common.somethingWentWrong"),
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            🛡
          </div>

          <div className="auth-logo-name">
            Cyberly
          </div>
        </div>

        <div className="auth-title">
          <h1>
            {t("auth.welcomeBack")}
          </h1>
        </div>

        <div className="auth-sub">
          <p>
            {t("auth.loginDescription")}
          </p>
        </div>

        <div className="field">
          <label>
            {t("auth.email")}
          </label>

          <input
            data-field="email"
            type="email"
            placeholder={t("auth.email")}
            value={form.email}
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? "login-email-error" : undefined}
            onChange={event => {
              setForm(current => ({
                ...current,
                email: event.target.value,
              }));

              setErrors({});
            }}
            onKeyDown={event =>
              event.key === "Enter" &&
              handleSubmit()
            }
          />

          {errors.email && (
            <div className="field-error" id="login-email-error" role="alert">
              {errors.email}
            </div>
          )}
        </div>

        <div className="field">
          <label>
            {t("auth.password")}
          </label>

          <input
            data-field="password"
            type="password"
            placeholder={t("auth.password")}
            value={form.password}
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "login-password-error" : undefined}
            onChange={event => {
              setForm(current => ({
                ...current,
                password: event.target.value,
              }));

              setErrors({});
            }}
            onKeyDown={event =>
              event.key === "Enter" &&
              handleSubmit()
            }
          />

          {errors.password && (
            <div className="field-error" id="login-password-error" role="alert">
              {errors.password}
            </div>
          )}
        </div>

        {errors.form && (
          <div
            className="field-error"
            role="alert"
            style={{
              marginTop: "0.5rem",
            }}
          >
            {errors.form}
          </div>
        )}

        <div
          className="auth-nav"
          style={{
            marginTop: "1.5rem",
          }}
        >
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? t("auth.loading")
              : t("auth.signInButton")}
          </button>
        </div>

        <div className="auth-switch">
          <span>
            {t("auth.registerPrompt")}
          </span>{" "}

          <button
            onClick={onSwitch}
            disabled={loading}
          >
            {t("auth.goToRegister")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Gate (toggles between Login & Register) ─────────────────
function AuthGate() {
  const { t } = useTranslation();
  const { go, authMode, setAuthMode } = useApp();
  const mode = authMode;
  const setMode = setAuthMode;
  return (
    <div>
      <button
        onClick={() => go("home")}
        style={{
          display: "inline-flex", alignItems: "center", gap: "0.4rem",
          background: "none", border: "none", cursor: "pointer",
          color: "#555", fontSize: "0.875rem", fontWeight: 500,
          padding: "1rem 1.5rem",
          transition: "color 0.15s",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--teal)"}
        onMouseLeave={e => e.currentTarget.style.color = "#555"}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        {t("common.backToHome")}
      </button>
      {mode === "login"
        ? <LoginPage    onSwitch={() => setMode("register")} />
        : <RegisterPage onSwitch={() => setMode("login")}    />
      }
    </div>
  );
}

// ─── Build AI system prompt from user profile ─────────────────────
function buildSystemPrompt(user) {
  const group = getAgeGroup(user.age);
  const topics = user.helpTopicLabels?.join(", ") || "general cybersecurity";
  const lang   = user.language      || "English";
  const level  = user.familiarity   || "Beginner";
  const style  = user.learningStyle || "Short explanations";
  const nick   = user.aiNickname    || user.name;
  const educationLevel = user.educationLevel || "";

  return `You are CyberGuard, a friendly cybersecurity AI assistant for Malaysian students on the Cyberly platform.

User profile:
- Call them: ${nick}
- Age group: ${group.label}${educationLevel ? ` (${educationLevel})` : ""}
- Language preference: ${lang}
- Cybersecurity level: ${level}
- Topics of interest: ${topics}
- Learning style: ${style}

Adapt every response to match their level, preferred language, and learning style.
For Beginners: use simple analogies and avoid jargon.
For Intermediate: explain concepts with some technical depth.
For Advanced: engage with technical precision and real-world examples.
If their language is Bahasa Melayu or 中文, respond in that language unless they write in English first.
If Mixed, blend languages naturally.
Keep responses concise and encouraging. Use their nickname when appropriate.`;
}

// ─── Page: Home ───────────────────────────────────────────────────
function HomePage() {
  const { t } = useTranslation();
  const { go, user, openAuth } = useApp();
  const homeCta = user
    ? {
        label: t("home.hero.continueLearning"),
        action: () => go("dashboard"),
      }
    : {
        label: t("home.hero.cta"),
        action: () => openAuth("register"),
      };

  const threatStats = [
    { emoji: "😨", value: "11%", descKey: "home.stats.scamVictim" },
    { emoji: "📧", value: "50%", descKey: "home.stats.scamMessages" },
    { emoji: "🎓", value: "84.6%", descKey: "home.stats.noWorkshop" },
    { emoji: "📱", value: "96%", descKey: "home.stats.dailyOnline" },
  ];

  const topics = [
    { emoji: "🎣", labelKey: "home.topics.phishing" },
    { emoji: "💸", labelKey: "home.topics.onlineScams" },
    { emoji: "📰", labelKey: "home.topics.fakeNews" },
    { emoji: "🤖", labelKey: "home.topics.aiDeepfakes" },
    { emoji: "🔐", labelKey: "home.topics.passwords" },
    { emoji: "🕵️", labelKey: "home.topics.privacy" },
  ];

  const steps = [
    { num: "01", icon: "✍️", titleKey: "home.steps.signUp.title", descKey: "home.steps.signUp.description" },
    { num: "02", icon: "🤖", titleKey: "home.steps.aiTutor.title", descKey: "home.steps.aiTutor.description" },
    { num: "03", icon: "🚀", titleKey: "home.steps.levelUp.title", descKey: "home.steps.levelUp.description" },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <div className="hero">
        <h1>{t("home.hero.title")}</h1>
        <p>
          {t("home.hero.description")}
        </p>
        <button className="hero-cta" onClick={homeCta.action}>
          {homeCta.label}
        </button>
        <div className="stat-row">
          <div className="stat-chip">🎓 {t("home.hero.chips.students")}</div>
          <div className="stat-chip">🌐 {t("home.hero.chips.languages")}</div>
          <div className="stat-chip">🤖 {t("home.hero.chips.aiPersonalised")}</div>
        </div>
      </div>

      {/* ── Threat Stats Strip ── */}
      <div style={{ background: "#1a2e1a", padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            {t("home.threats.eyebrow")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
            {threatStats.map(s => (
              <div key={s.value} style={{
                background: "rgba(255,255,255,0.06)", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.08)",
                padding: "1.25rem", textAlign: "center",
              }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "0.4rem" }}>{s.emoji}</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>{s.value}</div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{t(s.descKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why Cyberly ── */}
      <div className="section">
        <p className="section-title">{t("home.why.title")}</p>
        <p className="section-sub">{t("home.why.description")}</p>
        <div className="card-grid">
          {[
            { icon: "🧠", titleKey: "home.why.cards.adaptive.title", descKey: "home.why.cards.adaptive.description" },
            { icon: "🔒", titleKey: "home.why.cards.skills.title", descKey: "home.why.cards.skills.description" },
            { icon: "🎯", titleKey: "home.why.cards.topics.title", descKey: "home.why.cards.topics.description" },
          ].map(c => (
            <div className="card" key={c.titleKey}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>{c.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>{t(c.titleKey)}</div>
              <div style={{ color: "#666", fontSize: "0.875rem", lineHeight: 1.55 }}>{t(c.descKey)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Cyber Threat of the Week ── */}
      <div className="section" style={{ paddingTop: 0 }}>
        <div style={{
          background: "linear-gradient(135deg, #fff8e1 0%, #fff3e0 100%)",
          border: "1px solid #ffe082", borderRadius: 16,
          padding: "1.75rem 2rem", display: "flex", gap: "1.5rem",
          alignItems: "flex-start", flexWrap: "wrap",
        }}>
          <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>⚠️</div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.5rem" }}>
              <span style={{ background: "#ff9800", color: "#fff", fontSize: "0.7rem", fontWeight: 700, borderRadius: 99, padding: "0.2rem 0.65rem", letterSpacing: "0.05em" }}>
                {t("home.threatOfWeek.badge")}
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.4rem", color: "#1a1a18" }}>
              {t("home.threatOfWeek.title")}
            </div>
            <div style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.65 }}>
              {t("home.threatOfWeek.description")}
            </div>
          </div>
          <button
            onClick={() => go("resources")}
            style={{
              background: "#ff9800", color: "#fff", border: "none",
              borderRadius: 10, padding: "0.65rem 1.25rem",
              fontSize: "0.85rem", fontWeight: 600, cursor: "pointer",
              flexShrink: 0, alignSelf: "center",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#e65100"}
            onMouseLeave={e => e.currentTarget.style.background = "#ff9800"}
          >
            {t("common.learnMore")}
          </button>
        </div>
      </div>

      {/* ── Quick Topic Cards ── */}
      <div className="section" style={{ paddingTop: 0 }}>
        <p className="section-title">{t("home.quickTopics.title")}</p>
        <p className="section-sub">{t("home.quickTopics.description")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {topics.map(topic => (
            <button
              key={topic.labelKey}
              onClick={() => go("resources")}
              style={{
                display: "inline-flex", alignItems: "center", gap: "0.5rem",
                background: "#fff", border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 99, padding: "0.55rem 1.1rem",
                fontSize: "0.875rem", fontWeight: 600, cursor: "pointer",
                color: "#333", transition: "all 0.15s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--teal-lt)";
                e.currentTarget.style.borderColor = "var(--teal)";
                e.currentTarget.style.color = "var(--teal)";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "#fff";
                e.currentTarget.style.borderColor = "rgba(0,0,0,0.08)";
                e.currentTarget.style.color = "#333";
              }}
            >
              <span>{topic.emoji}</span> {t(topic.labelKey)}
            </button>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ background: "var(--teal-lt)", borderTop: "1px solid rgba(29,158,117,0.12)", borderBottom: "1px solid rgba(29,158,117,0.12)", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-title" style={{ textAlign: "center" }}>{t("home.how.title")}</p>
          <p className="section-sub" style={{ textAlign: "center", marginBottom: "2rem" }}>{t("home.how.description")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
            {steps.map((s, i) => (
              <div key={s.num} style={{ display: "flex", gap: "1rem", alignItems: "flex-start" }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: "var(--teal)", color: "#fff",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700,
                  fontSize: "0.85rem", flexShrink: 0,
                }}>
                  {s.num}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "0.3rem" }}>
                    {s.icon} {t(s.titleKey)}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.65 }}>{t(s.descKey)}</div>
                </div>
                {i < steps.length - 1 && (
                  <div style={{ display: "none" }} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom CTA ── */}
      <div style={{ background: "#1a2e1a", padding: "4rem 1.5rem", textAlign: "center" }}>
        <div style={{ maxWidth: 560, margin: "0 auto" }}>
          <div style={{ fontSize: "2.2rem", marginBottom: "0.75rem" }}>🚀</div>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, color: "#fff", marginBottom: "0.75rem" }}>
            {t("home.bottomCta.title")}
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            {t("home.bottomCta.description")}
          </p>
          <button
            className="hero-cta"
            onClick={homeCta.action}
            style={{ fontSize: "1rem", padding: "0.85rem 2.5rem" }}
          >
            {homeCta.label}
          </button>
          <div style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
            {t("home.bottomCta.note")}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page: Dashboard ──────────────────────────────────────────────
const DASHBOARD_SECTIONS = [
  { id: "dashboard-overview", labelKey: "dashboard.sectionNav.overview" },
  { id: "dashboard-learning-profile", labelKey: "dashboard.sectionNav.learningProfile" },
  { id: "dashboard-initial-assessment", labelKey: "dashboard.sectionNav.initialAssessment" },
  { id: "dashboard-measured-progress", labelKey: "dashboard.sectionNav.measuredProgress" },
  { id: "dashboard-recommended-next-step", labelKey: "dashboard.sectionNav.recommendedNextStep" },
  { id: "dashboard-scenario-practice", labelKey: "dashboard.sectionNav.scenarioPractice" },
  { id: "dashboard-topic-mastery", labelKey: "dashboard.sectionNav.topicMastery" },
  { id: "dashboard-quick-actions", labelKey: "dashboard.sectionNav.quickActions" },
  { id: "dashboard-cyberguard-ai", labelKey: "dashboard.sectionNav.cyberGuardAi" },
];

function DashboardPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { user, go, openRecommendedResource } = useApp();
  const assessmentLocale = normalizeLocale(activeI18n.language);
  const [tipIndex] = useState(() => Math.floor(Math.random() * 4));
  const [assessmentStatus, setAssessmentStatus] = useState({ loading: true, status: "pending" });
  const [progressState, setProgressState] = useState({ loading: true, progress: null });
  const [recommendationState, setRecommendationState] = useState({ loading: true, recommendation: null });
  const [scenarioState, setScenarioState] = useState({ loading: true, recommended: [], dashboard: null });
  const [activeSection, setActiveSection] = useState("dashboard-overview");
  const hasLearningProfileSection = Boolean(user?.helpTopics?.length);
  const hasTopicMasterySection = Boolean(progressState.progress?.topics?.length);
  const dashboardSections = DASHBOARD_SECTIONS.filter(section => (
    (section.id !== "dashboard-learning-profile" || hasLearningProfileSection) &&
    (section.id !== "dashboard-topic-mastery" || hasTopicMasterySection)
  ));

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    dbGetAssessmentStatus(assessmentLocale).then(result => {
      if (!active) return;
      if (result.ok) {
        setAssessmentStatus({ loading: false, status: result.status, result: result.result, attempt: result.attempt });
      } else {
        setAssessmentStatus({ loading: false, status: "unknown", error: result.error });
      }
    });
    return () => { active = false; };
  }, [user, assessmentLocale]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  useEffect(() => {
    const sectionIds = DASHBOARD_SECTIONS
      .filter(section => (
        (section.id !== "dashboard-learning-profile" || hasLearningProfileSection) &&
        (section.id !== "dashboard-topic-mastery" || hasTopicMasterySection)
      ))
      .map(section => section.id);
    const sections = sectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return undefined;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveSection(visible.target.id);
      }
    }, {
      rootMargin: "-80px 0px -65% 0px",
      threshold: [0.1, 0.35, 0.6],
    });

    sections.forEach(section => observer.observe(section));
    return () => observer.disconnect();
  }, [hasLearningProfileSection, hasTopicMasterySection]);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([dbGetRecommendedScenarios(assessmentLocale), dbGetScenarioDashboard(assessmentLocale)]).then(([recommendedResult, dashboardResult]) => {
      if (!active) return;
      setScenarioState({
        loading: false,
        recommended: recommendedResult.ok ? recommendedResult.scenarios : [],
        dashboard: dashboardResult.ok ? dashboardResult : null,
        error: recommendedResult.ok && dashboardResult.ok ? null : (recommendedResult.error || dashboardResult.error),
      });
    });
    return () => { active = false; };
  }, [user, assessmentLocale]);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([dbGetProgress(), dbGetCurrentRecommendation(assessmentLocale)]).then(([progressResult, recommendationResult]) => {
      if (!active) return;
      setProgressState(progressResult.ok
        ? { loading: false, progress: progressResult }
        : { loading: false, progress: null, error: progressResult.error });
      setRecommendationState(recommendationResult.ok
        ? { loading: false, recommendation: recommendationResult.recommendation }
        : { loading: false, recommendation: null, error: recommendationResult.error });
    });
    return () => { active = false; };
  }, [user, assessmentLocale]);

  if (!user) { go("login"); return null; }

  const nick  = user.aiNickname || user.name;
  const group = getAgeGroup(user.age);
  const summary = progressState.progress?.summary;
  const topicsMeasured = progressState.progress?.topics || [];
  const recommendation = recommendationState.recommendation;
  const recommendedScenario = scenarioState.recommended?.[0];
  const scenarioDashboard = scenarioState.dashboard;
  const translatedAgeGroup = t(`settings.ageGroups.${group.key}`,{defaultValue: group.label});
  const preferredLanguageValue = user.profile?.preferredLanguage || "";
  const familiarityValue = user.profile?.familiarityLevel || "";
  const educationValue = user.profile?.educationLevel || "";
  const learningStyleValue = user.profile?.learningStyle || "";
  const translatedLanguage = t(`profileOptions.language.${preferredLanguageValue}`,{defaultValue: user.language || "English" });
  const translatedFamiliarity = t(`profileOptions.familiarity.${familiarityValue}.label`,{defaultValue: user.familiarity || t("dashboard.beginner") });
  const translatedEducation = educationValue? t(`profileOptions.education.${educationValue}`,{ defaultValue: user.educationLevel }): "";
  const translatedLearningStyle = learningStyleValue? t( `profileOptions.learningStyle.${learningStyleValue}`, { defaultValue: user.learningStyle,}): "";
  const translatedHelpTopics = (user.profile?.helpTopics || []).map( topicCode => t(`profileOptions.helpTopics.${topicCode}`, { defaultValue: topicCode }));

  async function followRecommendation() {
    if (recommendation?.id) {
      await dbMarkRecommendationViewed(recommendation.id, assessmentLocale);
    }
    if (recommendedScenario) {
      go("scenarios");
    } else if (recommendation?.topicCode) {
      openRecommendedResource(recommendation.topicCode);
    } else {
      go("assessment");
    }
  }

  const quickActions = [
    {
      icon: "📚",
      labelKey: "dashboard.actions.resources",
      descKey: "dashboard.actions.resourcesDescription",
      page: "resources",
      color: "#E3F2FD",
      accent: "#1E88E5",
    },
    {
      icon: "🧭",
      labelKey: "dashboard.actions.assessment",
      descKey: "dashboard.actions.assessmentDescription",
      page: "assessment",
      color: "#FFF3E0",
      accent: "#FB8C00",
    },
    {
      icon: "🎮",
      labelKey: "dashboard.actions.scenarios",
      descKey: "dashboard.actions.scenariosDescription",
      page: "scenarios",
      color: "#E8F5E9",
      accent: "#2E7D32",
    },
    {
      icon: "👤",
      labelKey: "dashboard.actions.profile",
      descKey: "dashboard.actions.profileDescription",
      page: "profile",
      color: "#E1F5EE",
      accent: "#1D9E75",
    },
    {
      icon: "ℹ️",
      labelKey: "dashboard.actions.about",
      descKey: "dashboard.actions.aboutDescription",
      page: "about",
      color: "#F3E5F5",
      accent: "#8E24AA",
    },
    {
      icon: "📊",
      labelKey: "dashboard.actions.progress",
      descKey: "dashboard.actions.progressDescription",
      page: "progress",
      color: "#FFF8E1",
      accent: "#F59E0B",
    },
    {
      icon: "🏠",
      labelKey: "dashboard.actions.home",
      descKey: "dashboard.actions.homeDescription",
      page: "home",
      color: "#E8F5E9",
      accent: "#43A047",
    },
  ];

  const tips = [
    {
      emoji: "🎣",
      tipKey: "dashboard.tips.phishing",
    },
    {
      emoji: "🔐",
      tipKey: "dashboard.tips.password",
    },
    {
      emoji: "🤔",
      tipKey: "dashboard.tips.fakeNews",
    },
    {
      emoji: "📵",
      tipKey: "dashboard.tips.phoneScam",
    },
  ];

  const todayTip = tips[tipIndex];

  function scrollToDashboardSection(sectionId) {
    const target = document.getElementById(sectionId);
    if (!target) return;
    target.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div>
      {/* Welcome hero */}
      <div id="dashboard-overview" className="dashboard-anchor" style={{
        background: "linear-gradient(135deg, var(--teal) 0%, #1a5c4a 100%)",
        padding: "2.5rem 1.5rem", color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              {t("dashboard.yourDashboard")}
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.35rem" }}>
              {t("dashboard.welcomeBack", {name: nick,})} 👋
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
              {translatedAgeGroup} {" · "}{t("dashboard.levelDisplay", { level: translatedFamiliarity })}{translatedEducation ? ` · ${translatedEducation}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {[
              { val: "9", label: "dashboard.stats.topics" },
              { val: "3", label: "dashboard.stats.languages" },
              { val: "AI", label: "dashboard.stats.powered" },
            ].map(stat => (
              <div key={stat.labelKey} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "0.75rem 1rem", textAlign: "center", minWidth: 64 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem" }}>{stat.val}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>{t(stat.label)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="dashboard-shell">
        <aside className="dashboard-section-nav" aria-label={t("dashboard.sectionNav.ariaLabel")}>
          <div className="dashboard-section-nav-title">{t("dashboard.sectionNav.title")}</div>
          <div className="dashboard-section-nav-list">
            {dashboardSections.map(section => (
              <button
                key={section.id}
                type="button"
                className={`dashboard-section-nav-button${activeSection === section.id ? " active" : ""}`}
                onClick={() => scrollToDashboardSection(section.id)}
                aria-current={activeSection === section.id ? "true" : undefined}
              >
                {t(section.labelKey)}
              </button>
            ))}
          </div>
        </aside>

      <div className="dashboard-content">

        {/* Profile summary */}
        {user.helpTopics?.length > 0 && (
          <div id="dashboard-learning-profile" className="card dashboard-anchor" style={{ marginBottom: "2rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, marginBottom: "0.4rem", color: "var(--teal)" }}>🎯 {t("dashboard.learningProfile")}</div>
              <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.7 }}>
                <span>🌐 {translatedLanguage}</span>
                <span style={{ margin: "0 0.5rem" }}>·</span>
                <span>📖 {translatedLearningStyle}</span>
                <span style={{ margin: "0 0.5rem" }}>·</span>
                <span>🎯 {translatedHelpTopics.join(", ")}</span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#5f6f69", marginTop: "0.45rem" }}>
                {t("dashboard.learningProfileDescription")}
              </div>
            </div>
            <button onClick={() => go("profile")} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              {t("dashboard.editProfile")}
            </button>
          </div>
        )}

        <div id="dashboard-initial-assessment" className="card dashboard-anchor" style={{ marginBottom: "2rem", background: "#fff8e1", border: "1px solid #ffe082", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e65100", marginBottom: "0.25rem" }}>
              {assessmentStatus.status === "completed"
                ? t("dashboard.assessment.completed")
                : assessmentStatus.status === "in_progress"
                  ? t("dashboard.assessment.inProgress")
                  : t("dashboard.assessment.pending")}
            </div>
            <div style={{ fontSize: "0.86rem", color: "#5f4a1d", lineHeight: 1.6 }}>
              {assessmentStatus.loading && t("dashboard.assessment.checking")}
              {!assessmentStatus.loading && assessmentStatus.status === "completed" && (
                <> {t("dashboard.assessment.measuredLevel")} {": "} <strong> {t( `levels.${assessmentStatus.result?.attempt?.measuredLevel}`, { defaultValue: assessmentStatus.result?.attempt?.measuredLevel } )} </strong> {" · "} {t("dashboard.assessment.score")} {": "} <strong> { assessmentStatus.result?.attempt?.totalScore } / { assessmentStatus.result?.attempt?.maximumScore} </strong></>
              )}
              {!assessmentStatus.loading && assessmentStatus.status === "in_progress" && t("dashboard.assessment.resumeDescription")}
              {!assessmentStatus.loading && assessmentStatus.status !== "completed" && assessmentStatus.status !== "in_progress" && t("dashboard.assessment.pendingDescription")}
            </div>
          </div>
          <button onClick={() => go("assessment")} style={{ background: "#FB8C00", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
            {assessmentStatus.status === "completed" ? t("dashboard.assessment.viewResults") : assessmentStatus.status === "in_progress" ? t("dashboard.assessment.resume") : t("dashboard.assessment.start")}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div id="dashboard-measured-progress" className="card dashboard-anchor" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>{t("dashboard.progress.title")}</div>
            {progressState.loading ? (
              <PageState message={t("dashboard.progress.loading")} />
            ) : summary?.exists ? (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.45rem", marginBottom: "0.65rem" }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: "#1a1a18" }}>{summary.overallMasteryPercentage}%</span>
                  <span style={{ fontSize: "0.82rem", color: "#666", paddingBottom: "0.35rem" }}>{t( `levels.${summary.measuredLevel}`,{ defaultValue: levelLabel(summary.measuredLevel)})}</span>
                </div>
                <div style={{ background: "#edf3ef", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: "0.7rem" }}>
                  <div style={{ width: `${summary.overallMasteryPercentage}%`, height: "100%", background: "var(--teal)", borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  {t("dashboard.progress.summary", { count: summary.completedTopicCount })}
                </div>
              </>
            ) : (
              <PageState type="empty" message={t("dashboard.progress.empty")} />
            )}
          </div>

          <div id="dashboard-recommended-next-step" className="card dashboard-anchor" style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.18)" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>{t("dashboard.recommendation.title")}</div>
            {recommendationState.loading ? (
              <PageState message={t("dashboard.recommendation.loading")} />
            ) : recommendation ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.35rem", color: "#1a1a18" }}>
                  {recommendation.topicCode ? t( `topics.${recommendation.topicCode}`, { defaultValue: topicLabel(  recommendation.topicCode,  recommendation.topicLabel )}) : t("dashboard.recommendation.initialAssessment")}
                </div>
                <div style={{ fontSize: "0.84rem", color: "#3e5149", lineHeight: 1.55, marginBottom: "0.85rem" }}>
                  {recommendation.reasonText}
                </div>
                <button onClick={followRecommendation} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {recommendedScenario ?  t("dashboard.recommendation.practiceScenario") : recommendation.topicCode ? t("dashboard.recommendation.readResource") : t("dashboard.recommendation.startAssessment")}
                </button>
              </>
            ) : (
              <PageState type="empty" message={t("dashboard.recommendation.empty")} />
            )}
          </div>
        </div>

        <div id="dashboard-scenario-practice" className="dashboard-anchor" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="card" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.35rem" }}>{t("dashboard.scenarios.practiceTitle")}</div>
            {scenarioState.loading ? (
              <PageState message={t("dashboard.scenarios.loadingActivity")} />
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#1a1a18" }}>{scenarioDashboard?.completedCount || 0}</div>
                    <div style={{ fontSize: "0.74rem", color: "#777" }}>{t("dashboard.scenarios.completed")}</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#1a1a18" }}>{scenarioDashboard?.inProgress ? "1" : "0"}</div>
                    <div style={{ fontSize: "0.74rem", color: "#777" }}>{t("dashboard.scenarios.inProgress")}</div>
                  </div>
                </div>
                {scenarioDashboard?.latestCompleted && (
                  <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.55, marginBottom: "0.8rem" }}>
                    {t("dashboard.scenarios.latest")}: <strong>{scenarioDashboard.latestCompleted.title}</strong> · {t( `scenarioResults.${scenarioDashboard.latestCompleted.resultLevel}`, { defaultValue: scenarioResultLabel( scenarioDashboard.latestCompleted.resultLevel)})}
                  </div>
                )}
                <button onClick={() => go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {scenarioDashboard?.inProgress ? t("dashboard.scenarios.continueScenario") : t("dashboard.scenarios.openLibrary")}
                </button>
              </>
            )}
          </div>

          <div className="card" style={{ background: "#E8F5E9", border: "1px solid rgba(46,125,50,0.18)" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.35rem" }}>{t("dashboard.scenarios.recommendedTitle")}</div>
            {scenarioState.loading ? (
              <PageState message={t("dashboard.scenarios.finding")} />
            ) : recommendedScenario ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.02rem", marginBottom: "0.35rem" }}>{recommendedScenario.title}</div>
                <div style={{ fontSize: "0.82rem", color: "#445", lineHeight: 1.55, marginBottom: "0.8rem" }}>
                  {t( `topics.${recommendedScenario.topicCode}`,{ defaultValue: topicLabel( recommendedScenario.topicCode)})} · {t( `levels.${recommendedScenario.difficulty}`, { defaultValue: levelLabel( recommendedScenario.difficulty)})} · {t("dashboard.scenarios.minutes", {count: recommendedScenario.estimatedMinutes})}
                </div>
                <button onClick={() => go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {t("dashboard.recommendation.practiceScenario")}
                </button>
              </>
            ) : (
              <PageState type="empty" message={t("dashboard.scenarios.unlockDescription")} />
            )}
          </div>
        </div>

        {topicsMeasured.length > 0 && (
          <div id="dashboard-topic-mastery" className="dashboard-anchor" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <p className="section-title" style={{ fontSize: "1.1rem", margin: 0 }}>{t("dashboard.topicMastery.title")}</p>
              <button onClick={() => go("progress")} style={{ background: "transparent", color: "var(--teal)", border: "none", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>{t("dashboard.topicMastery.viewProgress")}</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {topicsMeasured.map(topic => (
                <div key={topic.topicCode} className="card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.55rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{PROGRESS_TOPIC_META[topic.topicCode]?.icon} {t(`topics.${topic.topicCode}`,{defaultValue: topicLabel(topic.topicCode, topic.topicLabel)})}</span>
                    <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.82rem" }}>{topic.masteryPercentage}%</span>
                  </div>
                  <div style={{ background: "#edf3ef", borderRadius: 99, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${topic.masteryPercentage}%`, height: "100%", background: "var(--teal)", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#777", marginTop: "0.45rem" }}>{t( `levels.${topic.currentLevel}`,{ defaultValue: levelLabel(topic.currentLevel)})}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily tip */}
        <div style={{
          background: "#fffde7", border: "1px solid #ffe082", borderRadius: 14,
          padding: "1.1rem 1.4rem", display: "flex", gap: "0.85rem",
          alignItems: "flex-start", marginBottom: "2rem",
        }}>
          <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>{todayTip.emoji}</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#e65100", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>{t("dashboard.dailyTip")}</div>
            <div style={{ fontSize: "0.88rem", color: "#444", lineHeight: 1.6 }}>{t(todayTip.tipKey)}</div>
          </div>
        </div>

        {/* Quick actions */}
        <div id="dashboard-quick-actions" className="dashboard-anchor">
        <p className="section-title" style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>{t("dashboard.quickActions.title")}</p>
        <p className="section-sub" style={{ marginBottom: "1.25rem" }}>{t("dashboard.quickActions.description")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {quickActions.map(a => (
            <button
              key={a.labelKey}
              onClick={() => go(a.page)}
              style={{
                background: a.color, border: `1px solid ${a.accent}22`,
                borderRadius: 14, padding: "1.25rem", textAlign: "left",
                cursor: "pointer", transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.1)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)"; }}
            >
              <div style={{ fontSize: "1.6rem", marginBottom: "0.5rem" }}>{a.icon}</div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: a.accent, marginBottom: "0.2rem" }}> {t(a.labelKey)}</div>
              <div style={{ fontSize: "0.8rem", color: "#666"}}>{t(a.descKey)}</div>
            </button>
          ))}
        </div>
        </div>

        {/* CyberGuard AI */}
        <div id="dashboard-cyberguard-ai" className="dashboard-anchor" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div>
            <p className="section-title" style={{ fontSize: "1.1rem", margin: 0 }}>🛡 {t("dashboard.cyberGuard.title")}</p>
            <p className="section-sub" style={{ margin: "0.25rem 0 0" }}>{t("dashboard.cyberGuard.description")}</p>
          </div>
          <span style={{ background: "var(--teal-lt)", color: "var(--teal)", fontSize: "0.72rem", fontWeight: 600, borderRadius: 99, padding: "0.25rem 0.75rem" }}>
            {t("dashboard.cyberGuard.badge")}
          </span>
        </div>
        <DashboardChatPreview />
      </div>
      </div>
    </div>
  );
}

function ChatMessageList({ className = "chat-messages", emptyCompact = false }) {
  const { t } = useTranslation();
  const { messages, sending } = useChat();
  const endRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;
    endRef.current?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "end",
    });
  }, [messages.length, sending]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [messages.length, sending]);

  return (
    <div className={className} role="log" aria-live="polite" aria-label={t("chat.accessibility.messageHistory")}>
      {messages.length === 0 ? (
        <div className="chat-empty">
          <div className="chat-empty-title">{t("chat.empty.title")}</div>
          <div>{emptyCompact ? t("chat.empty.shortDescription") : t("chat.empty.description")}</div>
        </div>
      ) : (
        messages.map(message => (
          <div key={message.id} className={`chat-bubble ${message.role}`} style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
            {message.text}
          </div>
        ))
      )}
      {sending && <div className="chat-bubble ai loading">{t("chat.thinking")}</div>}
      <div ref={endRef} />
    </div>
  );
}

function ChatComposer({ compact = false }) {
  const { t } = useTranslation();
  const { sendMessage, sending } = useChat();
  const [input, setInput] = useState("");

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    await sendMessage(text);
  }

  return (
    <div className="chat-input-row">
      <textarea
        className="chat-input"
        rows={compact ? 1 : 2}
        placeholder={t("chat.placeholder")}
        value={input}
        aria-label={t("chat.accessibility.composer")}
        onChange={event => setInput(event.target.value)}
        onKeyDown={event => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send();
          }
        }}
        disabled={sending}
      />
      <button className="chat-send" onClick={send} disabled={sending || !input.trim()} aria-label={t("chat.accessibility.send")}>
        {sending ? "…" : compact ? "↑" : t("chat.send")}
      </button>
    </div>
  );
}

function DashboardChatPreview() {
  const { t } = useTranslation();
  const { go } = useApp();
  const { conversations, startDashboardConversation, selectConversation } = useChat();
  const [input, setInput] = useState("");
  const [launching, setLaunching] = useState(false);

  function viewHistory() {
    if (conversations[0]) selectConversation(conversations[0].id);
    go("ai-chat");
  }

  function submitLauncher() {
    const clean = input.trim();
    if (!clean || launching) return;
    setLaunching(true);
    const conversationId = startDashboardConversation(clean);
    if (!conversationId) {
      setLaunching(false);
      return;
    }
    setInput("");
    go("ai-chat");
  }

  return (
    <div className="agent-panel dashboard-chat-launcher">
      <div className="agent-header">
        <div className="dashboard-chat-title">
          <span aria-hidden="true">🛡</span>
          <span>{t("dashboard.cyberGuard.title")}</span>
        </div>
        <span className="dashboard-chat-badge">{t("chat.dashboard.ready")}</span>
      </div>
      <div className="chat-empty dashboard-chat-welcome">
        <div className="chat-empty-title">{t("chat.dashboard.launcherTitle")}</div>
        <div>{t("chat.dashboard.launcherDescription")}</div>
      </div>
      <div className="chat-input-row">
        <textarea
          className="chat-input"
          rows={2}
          value={input}
          placeholder={t("chat.dashboard.launcherPlaceholder")}
          aria-label={t("chat.accessibility.dashboardLauncher")}
          onChange={event => setInput(event.target.value)}
          onKeyDown={event => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              submitLauncher();
            }
          }}
        />
        <button className="chat-send" onClick={submitLauncher} disabled={launching || !input.trim()} aria-label={t("chat.accessibility.send")}>
          {t("chat.send")}
        </button>
      </div>
      <div className="dashboard-chat-actions">
        <button className="btn-ghost" onClick={viewHistory}>
          {t("chat.actions.chatHistory")}
        </button>
      </div>
    </div>
  );
}

// ─── Page: Resources ──────────────────────────────────────────────
const TOPIC_COLORS = {
  Scams:             { bg: "#FFF3E0", text: "#E65100", dot: "#FF9800" },
  Misinformation:    { bg: "#F3E5F5", text: "#6A1B9A", dot: "#AB47BC" },
  "AI & Technology": { bg: "#E8F5E9", text: "#1B5E20", dot: "#43A047" },
  Privacy:           { bg: "#E3F2FD", text: "#0D47A1", dot: "#1E88E5" },
  Safety:            { bg: "#FCE4EC", text: "#880E4F", dot: "#E91E63" },
  Passwords:         { bg: "#E0F7FA", text: "#006064", dot: "#00ACC1" },
  Beginner:          { bg: "#E8F5E9", text: "#2E7D32", dot: "#66BB6A" },
};

function ResourcesPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { resourceFocusTopic, clearResourceFocus } = useApp();
  const resourceLocale = normalizeLocale(activeI18n.language);
  const [resourceState, setResourceState] = useState({ loading: true, resources: [] });
  const [selected, setSelected]   = useState(null);
  const [filter,   setFilter]     = useState("All");
  const topic = resourceState.resources.find(resource => resource.slug === selected);

  const categories = ["All", ...Array.from(new Set(resourceState.resources.map(resource => resource.categoryCode)))];
  const filtered = filter === "All"
    ? resourceState.resources
    : resourceState.resources.filter(resource => resource.categoryCode === filter);
  const focusedCategory = resourceFocusTopic ? PROGRESS_TOPIC_META[resourceFocusTopic]?.category : null;
  const categoryLabel = category => t(`resources.categories.${category}`, { defaultValue: category });

  useEffect(() => {
    if (focusedCategory && resourceState.resources.some(resource => resource.categoryCode === focusedCategory)) {
      setFilter(focusedCategory);
    }
  }, [focusedCategory, resourceState.resources]);

  useEffect(() => {
    let active = true;
    setResourceState(current => ({ ...current, loading: true, error: null }));
    dbGetResources(resourceLocale).then(result => {
      if (!active) return;
      if (result.ok) {
        setResourceState({ loading: false, resources: result.resources || [] });
        if (selected && !(result.resources || []).some(resource => resource.slug === selected)) {
          setSelected(null);
        }
      } else {
        setResourceState({ loading: false, resources: [], error: result.error });
      }
    });
    return () => { active = false; };
  }, [resourceLocale, selected]);

  return (
    <div>
      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)",
        padding: "3rem 1.5rem 2.5rem", color: "#fff", textAlign: "center",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📚</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", fontWeight: 600, marginBottom: "0.75rem" }}>
            {t("resources.title")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            {t("resources.description")}
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { val: String(resourceState.resources.length || 9), labelKey: "resources.stats.topicsCovered" },
              { val: "100%", labelKey: "resources.stats.freeToRead" },
              { val: "MY", labelKey: "resources.stats.malaysiaFocused" },
            ].map(s => (
              <div key={s.labelKey} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 1.2rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--teal)" }}>{s.val}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <PageBackButton />

        {focusedCategory && (
          <div className="card" style={{ marginBottom: "1rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", display: "flex", gap: "0.85rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.2rem" }}>{t("resources.focus.title")}</div>
              <div style={{ fontSize: "0.84rem", color: "#455", lineHeight: 1.55 }}>
                {t("resources.focus.description", { topic: t(`topics.${resourceFocusTopic}`, { defaultValue: topicLabel(resourceFocusTopic) }) })}
              </div>
            </div>
            <button onClick={() => { clearResourceFocus(); setFilter("All"); }} style={{ background: "#fff", color: "var(--teal)", border: "1px solid rgba(29,158,117,0.3)", borderRadius: 10, padding: "0.5rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
              {t("resources.focus.showAll")}
            </button>
          </div>
        )}

        {/* Category filter pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              style={{
                background: filter === cat ? "var(--teal)" : "#fff",
                color: filter === cat ? "#fff" : "#555",
                border: filter === cat ? "1px solid var(--teal)" : "1px solid rgba(0,0,0,0.1)",
                borderRadius: 99, padding: "0.4rem 1rem",
                fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {categoryLabel(cat)}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#999", alignSelf: "center" }}>
            {t("resources.guideCount", { count: filtered.length })}
          </span>
        </div>

        {/* Cards grid */}
        {resourceState.loading ? (
          <div className="card">{t("resources.loading")}</div>
        ) : resourceState.error ? (
          <div className="card">{t("resources.error", { defaultValue: resourceState.error })}</div>
        ) : filtered.length === 0 ? (
          <div className="card">{t("resources.empty")}</div>
        ) : (
        <div className="res-grid">
          {filtered.map(resource => {
            const cat = TOPIC_COLORS[resource.categoryCode] || { bg: "#E8EDE8", text: "#1D9E75", dot: "#1D9E75" };
            return (
              <button
                key={resource.id}
                onClick={() => setSelected(resource.slug)}
                style={{
                  background: "#fff", border: "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 14, padding: "1.25rem", textAlign: "left",
                  cursor: "pointer", transition: "box-shadow .2s, transform .2s, border-color .2s",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.05)",
                  display: "flex", flexDirection: "column", gap: "0.6rem",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = "0 6px 20px rgba(29,158,117,0.13)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.borderColor = "var(--teal)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = "0 2px 12px rgba(0,0,0,0.05)";
                  e.currentTarget.style.transform = "translateY(0)";
                  e.currentTarget.style.borderColor = "rgba(0,0,0,0.07)";
                }}
              >
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: cat.bg, color: cat.text,
                  borderRadius: 99, padding: "0.2rem 0.65rem",
                  fontSize: "0.72rem", fontWeight: 600, alignSelf: "flex-start",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.dot, display: "inline-block" }} />
                  {categoryLabel(resource.categoryCode)}
                </span>
                <div className="res-title">{resource.title}</div>
                <div className="res-desc">{resource.summary}</div>
                <span style={{ fontSize: "0.78rem", color: "var(--teal)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                  {t("resources.readGuide")}
                </span>
              </button>
            );
          })}
        </div>
        )}

        {/* Safety tip banner */}
        <div style={{
          marginTop: "2.5rem", background: "var(--teal-lt)",
          border: "1px solid rgba(29,158,117,0.2)", borderRadius: 14,
          padding: "1.25rem 1.5rem", display: "flex", gap: "1rem", alignItems: "center",
        }}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--teal)", marginBottom: "0.2rem" }}>{t("resources.tip.title")}</div>
            <div style={{ fontSize: "0.85rem", color: "#444", lineHeight: 1.6 }}>
              {t("resources.tip.prefix")} <strong>{t("resources.tip.phishing")}</strong> {t("resources.tip.or")} <strong>{t("resources.tip.passwordSecurity")}</strong> {t("resources.tip.suffix")}
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {topic && (
        <div
          onClick={() => setSelected(null)}
          style={{
            position: "fixed", inset: 0, background: "rgba(10,20,10,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 300, padding: "1.5rem",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#fff", borderRadius: 18, maxWidth: 660, width: "100%",
              maxHeight: "85vh", overflowY: "auto", padding: "2.5rem",
              boxShadow: "0 24px 64px rgba(0,0,0,0.22)", position: "relative",
            }}
          >
            <button
              onClick={() => setSelected(null)}
              style={{
                position: "absolute", top: 16, right: 16,
                background: "#F1EFE8", border: "none", borderRadius: "50%",
                width: 34, height: 34, cursor: "pointer", fontSize: 16, color: "#555",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >✕</button>

            {(() => {
              const cat = TOPIC_COLORS[topic.categoryCode] || { bg: "#E8EDE8", text: "#1D9E75", dot: "#1D9E75" };
              return (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: cat.bg, color: cat.text,
                  borderRadius: 99, padding: "0.2rem 0.65rem",
                  fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.9rem",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.dot, display: "inline-block" }} />
                  {categoryLabel(topic.categoryCode)}
                </span>
              );
            })()}

            <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.4rem", fontWeight: 600, marginBottom: "1.25rem", color: "#1a1a18" }}>
              {topic.title}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {topic.content.map((para, i) => (
                <p key={i} style={{ margin: 0, fontSize: "0.9rem", color: "#374237", lineHeight: 1.75 }}>{para}</p>
              ))}
            </div>

            <div style={{ borderTop: "1px solid rgba(0,0,0,0.08)", margin: "1.75rem 0 1.25rem" }} />

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
              <span style={{ fontSize: "0.78rem", color: "#aaa" }}>{t("resources.source")}: <em>{topic.sourceLabel}</em></span>
              <a
                href={topic.sourceUrl} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "var(--teal)", color: "#fff",
                  borderRadius: 10, padding: "0.6rem 1.25rem",
                  fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
                }}
              >{t("common.learnMore")}</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page: About ──────────────────────────────────────────────────
function AboutPage() {
  const { t } = useTranslation();

  const members = [
    { initials: "JJ",  name: "Jayron Poi",     roleKey: "about.team.members.jayron.role", descKey: "about.team.members.jayron.description" },
    { initials: "JH",  name: "Chung Jin Hong", roleKey: "about.team.members.jinHong.role", descKey: "about.team.members.jinHong.description" },
    { initials: "EC",  name: "Edward Chang",   roleKey: "about.team.members.edward.role", descKey: "about.team.members.edward.description" },
    { initials: "AB",  name: "Arman",          roleKey: "about.team.members.arman.role", descKey: "about.team.members.arman.description" },
    { initials: "PW",  name: "Puah Wen Zhen",  roleKey: "about.team.members.puah.role", descKey: "about.team.members.puah.description" },
  ];

  const features = [
    { icon: "🤖", titleKey: "about.features.agentic.title", descKey: "about.features.agentic.description" },
    { icon: "💬", titleKey: "about.features.chatbot.title", descKey: "about.features.chatbot.description" },
    { icon: "🎯", titleKey: "about.features.adaptive.title", descKey: "about.features.adaptive.description" },
    { icon: "🛡",  titleKey: "about.features.simulations.title", descKey: "about.features.simulations.description" },
    { icon: "📊", titleKey: "about.features.progress.title", descKey: "about.features.progress.description" },
    { icon: "🎮", titleKey: "about.features.gamified.title", descKey: "about.features.gamified.description" },
  ];

  const stats = [
    { value: "56%",   labelKey: "about.stats.identifyScams" },
    { value: "11%",   labelKey: "about.stats.scamVictim" },
    { value: "84.6%", labelKey: "about.stats.noWorkshop" },
    { value: "96%",   labelKey: "about.stats.dailyOnline" },
  ];

  const objectives = [
    "about.objectives.items.toolkit",
    "about.objectives.items.chatbot",
    "about.objectives.items.agentic",
    "about.objectives.items.gamified",
    "about.objectives.items.evaluate",
  ];

  return (
    <div>
      {/* Hero banner */}
      <div style={{
        background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)",
        padding: "3.5rem 1.5rem 3rem", textAlign: "center", color: "#fff",
      }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.45)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {t("about.hero.eyebrow")}
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 600, marginBottom: "0.85rem", lineHeight: 1.3 }}>
            {t("about.hero.title")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            {t("about.hero.description")}
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99, padding: "0.45rem 1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.65)" }}>
            🏫 {t("about.hero.collaboration")}
          </div>
        </div>
      </div>

      <div className="section">

        <PageBackButton />

        {/* Stats */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>{t("about.why.title")}</p>
          <p className="section-sub">{t("about.why.description")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {stats.map(s => (
              <div key={s.value} className="card" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: "var(--teal)", marginBottom: "0.4rem" }}>{s.value}</div>
                <div style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.5 }}>{t(s.labelKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>{t("about.built.title")}</p>
          <p className="section-sub">{t("about.built.description")}</p>
          <div className="card-grid">
            {features.map(f => (
              <div key={f.titleKey} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.35rem" }}>{t(f.titleKey)}</div>
                <div style={{ color: "#666", fontSize: "0.82rem", lineHeight: 1.6 }}>{t(f.descKey)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>{t("about.how.title")}</p>
          <p className="section-sub">{t("about.how.description")}</p>
          <div className="card" style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", padding: "1.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {[
                { step: "01", titleKey: "about.how.steps.signUp.title", descKey: "about.how.steps.signUp.description" },
                { step: "02", titleKey: "about.how.steps.path.title", descKey: "about.how.steps.path.description" },
                { step: "03", titleKey: "about.how.steps.learn.title", descKey: "about.how.steps.learn.description" },
                { step: "04", titleKey: "about.how.steps.track.title", descKey: "about.how.steps.track.description" },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: "0.85rem" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--teal)", opacity: 0.5, flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{t(s.titleKey)}</div>
                    <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>{t(s.descKey)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>{t("about.objectives.title")}</p>
          <p className="section-sub">{t("about.objectives.description")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {objectives.map((obj, i) => (
              <div key={i} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1rem 1.25rem" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "var(--teal-lt)",
                  color: "var(--teal)", fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: "0.78rem", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>{i + 1}</div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#444", lineHeight: 1.65 }}>{t(obj)}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>{t("about.team.title")}</p>
          <p className="section-sub">{t("about.team.description")}</p>

          {/* Supervisor */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", padding: "1.25rem 1.5rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>SZ</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Dr Siti Zainab Ibrahim</div>
              <div style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600, marginBottom: "0.2rem" }}>{t("about.team.supervisor.role")}</div>
              <div style={{ fontSize: "0.8rem", color: "#555" }}>{t("about.team.supervisor.description")}</div>
            </div>
          </div>

          <div className="team-grid">
            {members.map(m => (
              <div className="team-card" key={m.name} style={{ padding: "1.5rem 1.25rem" }}>
                <div className="avatar">{m.initials}</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.name}</div>
                <div style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 600, margin: "0.2rem 0 0.5rem" }}>{t(m.roleKey)}</div>
                <div style={{ color: "#777", fontSize: "0.78rem", lineHeight: 1.55 }}>{t(m.descKey)}</div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Page: Initial Assessment ────────────────────────────────────
function AssessmentPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { user, go, registerActivityGuard } = useApp();
  const assessmentLocale = normalizeLocale(activeI18n.language);
  const [assessment, setAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    async function load() {
      setLoading(true);
      setError("");
      const [assessmentResult, statusResult] = await Promise.all([
        dbGetInitialAssessment(assessmentLocale),
        dbGetAssessmentStatus(assessmentLocale),
      ]);
      if (!active) return;
      if (!assessmentResult.ok) {
        setError(assessmentResult.error);
        setLoading(false);
        return;
      }
      setAssessment(assessmentResult.assessment);
      setQuestions(assessmentResult.questions);
      if (statusResult.ok && statusResult.status === "completed") {
        setResult(statusResult.result);
        setAttempt(statusResult.result?.attempt || null);
      } else if (statusResult.ok && statusResult.status === "in_progress") {
        setAttempt(statusResult.attempt);
        setAnswers(Object.fromEntries((statusResult.attempt?.answers || []).map(answer => [answer.questionId, answer.selectedOptionKey])));
      }
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, [user, assessmentLocale]);

  useEffect(() => {
    if (!attempt || attempt.status !== "in_progress" || result) return undefined;
    return registerActivityGuard({
      type: "assessment",
      title: t("assessment.leaveTitle"),
      description: t("assessment.leaveDescription"),
    });
  }, [attempt, result, registerActivityGuard, t]);

  if (!user) { go("login"); return null; }

  async function start() {
    setLoading(true);
    setError("");
    const response = await dbStartInitialAttempt(assessmentLocale);
    setLoading(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    if (response.completed) {
      setResult(response);
      setAttempt(response.attempt);
      return;
    }
    setAttempt(response.attempt);
    setAnswers(Object.fromEntries((response.attempt?.answers || []).map(answer => [answer.questionId, answer.selectedOptionKey])));
  }

  async function selectAnswer(questionId, optionKey) {
    if (!attempt || attempt.status !== "in_progress") return;
    setSaving(true);
    setError("");
    setAnswers(currentAnswers => ({ ...currentAnswers, [questionId]: optionKey }));
    const response = await dbSaveAssessmentAnswer(attempt.id, questionId, optionKey);
    setSaving(false);
    if (!response.ok) {
      setError(response.error);
      setAnswers(currentAnswers => {
        const next = { ...currentAnswers };
        delete next[questionId];
        return next;
      });
    } else {
      setAttempt(response.attempt);
    }
  }

  async function submit() {
    if (!attempt || submitting) return;
    if (Object.keys(answers).length !== questions.length) {
      setError(t("assessment.answerAll"));
      return;
    }
    setConfirmAction("submit");
  }

  async function submitConfirmed() {
    if (!attempt || submitting) return;
    setConfirmAction(null);
    setSubmitting(true);
    setError("");
    const response = await dbSubmitAssessment(attempt.id, assessmentLocale);
    setSubmitting(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setResult(response.result);
    setAttempt(response.result.attempt);
  }

  function closeAssessmentConfirm() {
    setConfirmAction(null);
  }

  function renderIntro() {
    return (
      <div className="section" style={{ maxWidth: 850 }}>
        <div className="card" style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧭</div>
          <h1 className="section-title">{assessment?.title || t("assessment.title")}</h1>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>
            {t("assessment.introduction")}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              {
                value: "12",
                labelKey: "assessment.stats.questions",
              },
              {
                value: "5-10",
                labelKey: "assessment.stats.minutes",
              },
              {
                value: "0",
                labelKey: "assessment.stats.negativeMarks",
              },
              {
                value: "4",
                labelKey: "assessment.stats.topicAreas",
              },
            ].map(stat => (
              <div key={stat.labelKey} style={{ background: "#fff", borderRadius: 10, padding: "0.9rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--teal)", fontWeight: 700, fontSize: "1.2rem" }}>{stat.value}</div>
                <div style={{ fontSize: "0.78rem", color: "#666" }}>{t(stat.labelKey)}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.86rem", color: "#42524d", lineHeight: 1.7, marginBottom: "1rem" }}>
            {t("assessment.measurementNote")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button className="btn-primary" style={{ flex: "0 0 auto", minWidth: 190 }} onClick={start} disabled={loading}>
              {attempt ? t("assessment.resume") : t("assessment.start")}
            </button>
            <button className="btn-ghost" onClick={() => go("dashboard")}>{t("assessment.doLater")}</button>
          </div>
        </div>
      </div>
    );
  }

  function renderAttempt() {
    const question = questions[current];
    const selected = answers[question?.id];
    const answeredCount = Object.keys(answers).length;
    const progress = Math.round(((current + 1) / questions.length) * 100);

    return (
      <div className="section" style={{ maxWidth: 860 }}>
        <PageBackButton style={{ marginBottom: "1rem" }} />
        <div className="card">
          <div className="auth-progress" style={{ marginBottom: "1.25rem" }}>
            <div className="auth-progress-track">
              <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="auth-progress-label">
              <span>{t("assessment.questionProgress", { current: current + 1, total: questions.length })}</span>
              <span>{answeredCount}/{questions.length} {t("assessment.answeredProgress", { answered: answeredCount, total: questions.length })} {saving ? "· " + t("common.saving") : ""}</span>
            </div>
          </div>
          <div className="res-tag">{question?.topicLabel}</div>
          <h2 className="section-title" style={{ fontSize: "1.25rem" }}>{question?.prompt}</h2>
          <div className="opt-grid" style={{ marginTop: "1rem" }}>
            {question?.options.map(option => (
              <button
                key={option.key}
                className={`opt-btn full-width ${selected === option.key ? "selected" : ""}`}
                onClick={() => selectAnswer(question.id, option.key)}
                aria-pressed={selected === option.key}
              >
                <strong>{option.key}.</strong> {option.text}
              </button>
            ))}
          </div>
          <div className="auth-nav">
            <button className="btn-ghost" onClick={() => setCurrent(index => Math.max(0, index - 1))} disabled={current === 0}>{t("assessment.previous")}</button>
            {current < questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent(index => Math.min(questions.length - 1, index + 1))}>{t("assessment.next")}</button>
            ) : (
              <button className="btn-primary" onClick={submit} disabled={submitting || answeredCount !== questions.length}>
                {submitting ? t("assessment.submitting") : t("assessment.submit")}
              </button>
            )}
          </div>
          {answeredCount !== questions.length && current === questions.length - 1 && (
            <div style={{ fontSize: "0.8rem", color: "#777", marginTop: "0.75rem" }}>{t("assessment.finalSubmissionReminder")}</div>
          )}
        </div>
      </div>
    );
  }

  function renderResult() {
    const attemptResult = result?.attempt;
    const strengths = (result?.topicScores || []).filter(topic => topic.classification === "strength");
    const improvements = (result?.topicScores || []).filter(topic => topic.classification === "improvement");
    return (
      <div className="section" style={{ maxWidth: 980 }}>
        <PageBackButton />
        <div className="card" style={{ marginBottom: "1.5rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase" }}>{t("assessment.result")}</div>
          <h1 className="section-title" style={{ marginTop: "0.25rem" }}>{t("assessment.completed")}</h1>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>
            {t("assessment.resultSummary", {
              score: attemptResult?.totalScore,
              maxScore: attemptResult?.maximumScore,
            })}
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem", marginBottom: "1rem" }}>
            <div style={{ background: "#fff", borderRadius: 10, padding: "0.9rem" }}>
              <div style={{ fontSize: "0.76rem", color: "#777", fontWeight: 700, marginBottom: "0.25rem" }}>{t("assessment.measuredLevel")}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--teal)", fontWeight: 700, fontSize: "1.2rem" }}>{attemptResult?.measuredLevel}</div>
            </div>
            <div style={{ background: "#fff", borderRadius: 10, padding: "0.9rem" }}>
              <div style={{ fontSize: "0.76rem", color: "#777", fontWeight: 700, marginBottom: "0.25rem" }}>{t("assessment.score")}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--teal)", fontWeight: 700, fontSize: "1.2rem" }}>{attemptResult?.percentage}%</div>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button className="btn-primary" style={{ flex: "0 0 auto" }} onClick={() => go("dashboard")}>{t("assessment.backToDashboard")}</button>
            <button className="btn-ghost" onClick={() => go("progress")}>{t("assessment.viewProgress")}</button>
          </div>
        </div>

        <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("assessment.topicBreakdown")}</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {(result?.topicScores || []).map(topic => (
            <div key={topic.topicCode} className="card" style={{ padding: "1.1rem" }}>
              <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>{topic.topicLabel}</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{topic.correctCount}/{topic.totalCount} · {topic.percentage}%</div>
              <div style={{ fontSize: "0.78rem", color: "#777", marginTop: "0.3rem" }}>
                {topic.classification === "strength" ? t("assessment.relativeStrength") : t("assessment.areaToImprove")}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>{t("assessment.strengths")}</div>
          <div style={{ fontSize: "0.86rem", color: "#555", lineHeight: 1.7 }}>
            {strengths.length ? strengths.map(topic => topic.topicLabel).join(", ") : t("assessment.noStrengthsYet")}
          </div>
          <div style={{ fontWeight: 700, margin: "1rem 0 0.5rem" }}>{t("assessment.areasToImprove")}</div>
          <div style={{ fontSize: "0.86rem", color: "#555", lineHeight: 1.7 }}>
            {improvements.length ? improvements.map(topic => topic.topicLabel).join(", ") : t("assessment.allTopicsMetThreshold")}
          </div>
        </div>

        <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("assessment.reviewAnswers")}</p>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {(result?.review || []).map(item => (
            <div key={item.questionId} className="card" style={{ padding: "1rem" }}>
              <div className="res-tag">{item.topicLabel}</div>
              <div style={{ fontWeight: 700, marginBottom: "0.55rem" }}>{item.prompt}</div>
              <div style={{ fontSize: "0.84rem", color: item.isCorrect ? "var(--teal)" : "var(--coral)", fontWeight: 700, marginBottom: "0.35rem" }}>
                {item.isCorrect ? t("assessment.correct") : t("assessment.incorrect")}
              </div>
              <div style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.6, marginBottom: "0.35rem" }}>
                {t("assessment.yourAnswer")}: {item.selectedOptionKey} · {t("assessment.correctAnswer")}: {item.correctOptionKey}
              </div>
              <div style={{ fontSize: "0.78rem", color: "#777", fontWeight: 700, marginBottom: "0.2rem" }}>
                {t("assessment.explanation")}
              </div>
              <div style={{ fontSize: "0.84rem", color: "#555", lineHeight: 1.6 }}>{item.explanation}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 980, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}> {t("assessment.baselineLabel")}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", marginTop: "0.35rem" }}> {t("assessment.title")}</h1>
        </div>
      </div>
      {!attempt && !result && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <PageBackButton />
        </div>
      )}
      {error && (
        <div className="section" style={{ paddingBottom: 0 }}>
          <PageState type="error" title={t("assessment.errorTitle")} message={error || t("assessment.error")} />
        </div>
      )}
      {loading ? (
        <div className="section"><PageState title={t("assessment.loadingTitle")} message={t("assessment.loading")} /></div>
      ) : result ? renderResult() : attempt ? renderAttempt() : renderIntro()}
      {confirmAction === "submit" && (
        <ConfirmationDialog
          title={t("assessment.submitConfirmTitle")}
          description={t("assessment.confirmSubmit")}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("assessment.submit")}
          onCancel={closeAssessmentConfirm}
          onConfirm={submitConfirmed}
        />
      )}
    </div>
  );
}

// ─── Page: Scenarios ──────────────────────────────────────────────
function ScenariosPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { user, go, registerActivityGuard } = useApp();
  const scenarioLocale = normalizeLocale(activeI18n.language);
  const [filters, setFilters] = useState({ topicCode: "", difficulty: "" });
  const [library, setLibrary] = useState({ loading: true, scenarios: [], recommended: [] });
  const [view, setView] = useState({ mode: "library" });
  const [selectedChoice, setSelectedChoice] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([
      dbGetScenarios({ topicCode: filters.topicCode, difficulty: filters.difficulty }, scenarioLocale),
      dbGetRecommendedScenarios(scenarioLocale),
    ]).then(([scenarioResult, recommendedResult]) => {
      if (!active) return;
      setLibrary({
        loading: false,
        scenarios: scenarioResult.ok ? scenarioResult.scenarios : [],
        recommended: recommendedResult.ok ? recommendedResult.scenarios : [],
        error: scenarioResult.ok ? null : scenarioResult.error,
      });
    });
    return () => { active = false; };
  }, [user, filters.topicCode, filters.difficulty, scenarioLocale]);

  useEffect(() => {
    let active = true;
    if (!user || view.mode === "library") return () => { active = false; };

    async function reloadScenarioContent() {
      if (view.mode === "intro" && view.scenario?.slug) {
        const result = await dbGetScenario(view.scenario.slug, scenarioLocale);
        if (active && result.ok) setView(current => ({ ...current, scenario: result.scenario, firstStep: result.firstStep }));
      } else if (view.mode === "attempt" && view.attempt?.id && !decisionFeedback) {
        const result = await dbGetScenarioAttempt(view.attempt.id, scenarioLocale);
        if (active && result.ok) setView(current => ({ ...current, ...result }));
      } else if (view.mode === "result" && view.attempt?.id) {
        const result = await dbGetScenarioResult(view.attempt.id, scenarioLocale);
        if (active && result.ok) setView(current => ({ ...current, ...result.result }));
      }
    }

    reloadScenarioContent();
    return () => { active = false; };
  }, [user, scenarioLocale, view.mode, view.scenario?.slug, view.attempt?.id, decisionFeedback]);

  useEffect(() => {
    if (view.mode !== "attempt" || !view.attempt || view.attempt.status === "completed") return undefined;
    return registerActivityGuard({
      type: "scenario",
      title: t("scenarios.leaveTitle"),
      description: t("scenarios.leaveDescription"),
    });
  }, [view.mode, view.attempt, registerActivityGuard, t]);

  if (!user) { go("login"); return null; }

  const recommendedIds = new Set((library.recommended || []).map(item => item.id));

  async function openIntro(slug) {
    setBusy(true);
    setError(null);
    const result = await dbGetScenario(slug, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "intro", scenario: result.scenario, firstStep: result.firstStep });
  }

  async function startScenario(slug) {
    setBusy(true);
    setError(null);
    const result = await dbStartScenario(slug, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSelectedChoice("");
    setDecisionFeedback(null);
    setView({ mode: "attempt", ...result });
  }

  async function openAttempt(attemptId) {
    setBusy(true);
    setError(null);
    const result = await dbGetScenarioAttempt(attemptId, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSelectedChoice("");
    setDecisionFeedback(null);
    setView({ mode: "attempt", ...result });
  }

  async function submitDecision() {
    if (!view.currentStep || !selectedChoice || busy) return;
    setBusy(true);
    setError(null);
    const result = await dbSaveScenarioDecision(view.attempt.id, view.currentStep.id, selectedChoice, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setDecisionFeedback(result.decision);
    setView(current => ({
      ...current,
      attempt: { ...current.attempt, ...result.attempt },
      nextStep: result.nextStep,
      readyToComplete: result.readyToComplete,
    }));
  }

  async function continueAfterFeedback() {
    if (view.nextStep) {
      setView(current => ({ ...current, currentStep: current.nextStep, nextStep: null }));
      setDecisionFeedback(null);
      setSelectedChoice("");
      return;
    }
    await completeScenario();
  }

  async function completeScenario() {
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await dbCompleteScenario(view.attempt.id, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "result", ...result.result });
  }

  async function openResult(attemptId) {
    setBusy(true);
    setError(null);
    const result = await dbGetScenarioResult(attemptId, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "result", ...result.result });
  }

  const filterBar = (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
      <select aria-label={t("scenarios.filters.topic")} value={filters.topicCode} onChange={event => setFilters(current => ({ ...current, topicCode: event.target.value }))} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "0.55rem 0.75rem" }}>
        <option value="">{t("scenarios.filters.allTopics")}</option>
        {Object.entries(PROGRESS_TOPIC_META).map(([value, meta]) => (
          <option key={value} value={value}>
            {t(`topics.${value}`, { defaultValue: meta.label })}
          </option>
        ))}
      </select>
      <select aria-label={t("scenarios.filters.difficulty")} value={filters.difficulty} onChange={event => setFilters(current => ({ ...current, difficulty: event.target.value }))} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "0.55rem 0.75rem" }}>
        <option value="">{t("scenarios.filters.allDifficulties")}</option>
        {["beginner", "developing", "intermediate", "advanced"].map(value => (
          <option key={value} value={value}>
            {t(`levels.${value}`, { defaultValue: levelLabel(value) })}
          </option>
        ))}
      </select>
    </div>
  );

  function renderLibrary() {
    return (
      <>
        {filterBar}
        {library.loading ? (
          <PageState title={t("scenarios.library.loadingTitle")} message={t("scenarios.library.loading")} />
        ) : library.scenarios.length === 0 ? (
          <PageState type="empty" title={t("scenarios.library.empty")} message={t("scenarios.library.emptyDescription")} />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {library.scenarios.map(scenario => {
              const latest = scenario.latestAttempt;
              const isRecommended = recommendedIds.has(scenario.id);
              return (
                <div key={scenario.id} className="card" style={{ border: isRecommended ? "1px solid rgba(46,125,50,0.35)" : "1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.65rem" }}>
                    <span style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.78rem" }}>{t(`topics.${scenario.topicCode}`, { defaultValue: topicLabel(scenario.topicCode) })}</span>
                    {isRecommended && <span style={{ background: "#E8F5E9", color: "#2E7D32", borderRadius: 99, padding: "0.18rem 0.55rem", fontSize: "0.7rem", fontWeight: 700 }}>{t("scenarios.library.recommended")}</span>}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>{scenario.title}</div>
                  <div style={{ color: "#666", fontSize: "0.84rem", lineHeight: 1.55, marginBottom: "0.8rem" }}>{scenario.summary}</div>
                  <div style={{ fontSize: "0.78rem", color: "#777", marginBottom: "0.9rem" }}>
                    {t(`levels.${scenario.difficulty}`, { defaultValue: levelLabel(scenario.difficulty) })} · {t("scenarios.card.minutes", { count: scenario.estimatedMinutes })} · {t("scenarios.card.decisions", { count: scenario.totalSteps })}
                  </div>
                  <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                    {latest?.status === "in_progress" ? (
                      <button onClick={() => openAttempt(latest.id)} className="btn-primary" style={{ minWidth: 0, padding: "0.55rem 0.9rem" }}>{t("scenarios.card.resume")}</button>
                    ) : (
                      <button onClick={() => openIntro(scenario.slug)} className="btn-primary" style={{ minWidth: 0, padding: "0.55rem 0.9rem" }}>{t("scenarios.card.start")}</button>
                    )}
                    {latest?.status === "completed" && (
                      <button onClick={() => openResult(latest.id)} className="btn-ghost">{t("scenarios.card.viewResult")}</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </>
    );
  }

  function renderIntro() {
    const scenario = view.scenario;
    return (
      <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
        <button className="btn-ghost" onClick={() => setView({ mode: "library" })} style={{ marginBottom: "1rem" }}>{t("common.back")}</button>
        <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.35rem" }}>{t(`topics.${scenario.topicCode}`, { defaultValue: topicLabel(scenario.topicCode) })}</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.5rem" }}>{scenario.title}</h2>
        <p style={{ color: "#555", lineHeight: 1.65 }}>{scenario.summary}</p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.82rem", color: "#666", margin: "1rem 0" }}>
          <span>{t(`levels.${scenario.difficulty}`, { defaultValue: levelLabel(scenario.difficulty) })}</span>
          <span>{t("scenarios.card.minutes", { count: scenario.estimatedMinutes })}</span>
          <span>{t("scenarios.card.decisions", { count: scenario.totalSteps })}</span>
        </div>
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 12, padding: "0.9rem", fontSize: "0.84rem", color: "#5f4a1d", lineHeight: 1.6, marginBottom: "1rem" }}>
          {t("scenarios.intro.choiceNotice")}
        </div>
        <button className="btn-primary" onClick={() => startScenario(scenario.slug)} disabled={busy}>{t("scenarios.intro.startPractice")}</button>
      </div>
    );
  }

  function renderAttempt() {
    const step = view.currentStep;
    if (!step) {
      return (
        <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.5rem" }}>{t("scenarios.attempt.readyToComplete")}</h2>
          <p style={{ color: "#555", lineHeight: 1.6 }}>{t("scenarios.attempt.readyToCompleteDescription")}</p>
          <button className="btn-primary" onClick={completeScenario} disabled={busy}>{busy ? t("scenarios.attempt.completing") : t("scenarios.attempt.complete")}</button>
        </div>
      );
    }
    return (
        <div className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
          <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.35rem" }}>
          {t("scenarios.attempt.stepProgress", { current: step.stepOrder, total: view.scenario.totalSteps })}
        </div>
        <div style={{ background: "#edf3ef", borderRadius: 99, height: 8, overflow: "hidden", marginBottom: "1rem" }}>
          <div style={{ width: `${((step.stepOrder - 1) / view.scenario.totalSteps) * 100}%`, background: "#2E7D32", height: "100%" }} />
        </div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.65rem" }}>{view.scenario.title}</h2>
        <p style={{ color: "#333", lineHeight: 1.7, marginBottom: "0.8rem" }}>{step.situationText}</p>
        <div style={{ fontWeight: 700, marginBottom: "0.75rem" }}>{step.promptText}</div>
        <div style={{ display: "grid", gap: "0.65rem", marginBottom: "1rem" }}>
          {step.options.map(option => (
            <button
              key={option.key}
              type="button"
              disabled={Boolean(decisionFeedback)}
              onClick={() => setSelectedChoice(option.key)}
              style={{ textAlign: "left", background: selectedChoice === option.key ? "var(--teal-lt)" : "#fff", border: selectedChoice === option.key ? "1px solid var(--teal)" : "1px solid rgba(0,0,0,0.1)", borderRadius: 12, padding: "0.85rem 1rem", cursor: decisionFeedback ? "default" : "pointer", fontSize: "0.9rem", lineHeight: 1.5 }}
            >
              <strong>{option.key}.</strong> {option.text}
            </button>
          ))}
        </div>
        {!decisionFeedback ? (
          <button className="btn-primary" disabled={!selectedChoice || busy} onClick={submitDecision}>{busy ? t("scenarios.attempt.savingDecision") : t("scenarios.attempt.confirmChoice")}</button>
        ) : (
          <div style={{ background: "#E8F5E9", border: "1px solid rgba(46,125,50,0.22)", borderRadius: 12, padding: "1rem" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.35rem" }}>{t("scenarios.attempt.decisionSaved")}</div>
            <div style={{ fontSize: "0.78rem", color: "#477", fontWeight: 700, marginBottom: "0.2rem" }}>{t("scenarios.result.feedback")}</div>
            <div style={{ fontSize: "0.88rem", color: "#333", lineHeight: 1.65, marginBottom: "0.55rem" }}>{decisionFeedback.feedback}</div>
            <div style={{ fontSize: "0.78rem", color: "#477", fontWeight: 700, marginBottom: "0.2rem" }}>{t("scenarios.result.keyLesson")}</div>
            <div style={{ fontSize: "0.82rem", color: "#566", lineHeight: 1.6, marginBottom: "0.85rem" }}>{decisionFeedback.safetyExplanation}</div>
            <button className="btn-primary" onClick={continueAfterFeedback} disabled={busy}>{view.nextStep ? t("common.next") : busy ? t("scenarios.attempt.completing") : t("scenarios.attempt.complete")}</button>
          </div>
        )}
      </div>
    );
  }

  function renderResult() {
    const result = view;
    return (
      <div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.35rem" }}>{t("scenarios.result.completed")}</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.5rem" }}>{result.scenario.title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", margin: "1rem 0" }}>
          <div><strong>{result.attempt.totalScore}/{result.attempt.maximumScore}</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>{t("scenarios.result.score")}</div></div>
          <div><strong>{result.attempt.percentage}%</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>{t("scenarios.result.percentage")}</div></div>
          <div><strong>{t(`scenarioResults.${result.attempt.resultLevel}`, { defaultValue: scenarioResultLabel(result.attempt.resultLevel) })}</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>{t("scenarios.result.performanceLevel")}</div></div>
          <div><strong>+{result.progressImpact?.masteryDelta || 0}</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>{t("scenarios.result.masteryDelta")}</div></div>
        </div>
        <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, marginBottom: "0.65rem" }}>{t("scenarios.result.decisionsReviewed")}</div>
        <div style={{ display: "grid", gap: "0.85rem", margin: "1.25rem 0" }}>
          {result.review.map(item => (
            <div key={item.id} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "1rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>{t("scenarios.result.step", { step: item.stepOrder })}</div>
              <div style={{ fontSize: "0.8rem", color: "#777", marginBottom: "0.35rem" }}>
                {t("scenarios.result.yourChoice")}: {item.selectedOptionKey}
              </div>
              {item.recommendedOptionKey && (
                <div style={{ fontSize: "0.8rem", color: "#777", marginBottom: "0.35rem" }}>
                  {t("scenarios.result.recommendedChoice")}: {item.recommendedOptionKey}
                </div>
              )}
              <div style={{ fontSize: "0.78rem", color: "#777", fontWeight: 700, marginBottom: "0.2rem" }}>{t("scenarios.result.feedback")}</div>
              <div style={{ fontSize: "0.86rem", color: "#333", lineHeight: 1.6 }}>{item.feedback}</div>
              <div style={{ fontSize: "0.78rem", color: "#777", fontWeight: 700, marginTop: "0.35rem", marginBottom: "0.2rem" }}>{t("scenarios.result.keyLesson")}</div>
              <div style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.55, marginTop: "0.35rem" }}>{item.safetyExplanation}</div>
            </div>
          ))}
        </div>
        {result.recommendation && (
          <div style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.25rem" }}>{t("scenarios.result.updatedRecommendation")}</div>
            <div style={{ fontSize: "0.86rem", color: "#455", lineHeight: 1.6 }}>{result.recommendation.reasonText}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setView({ mode: "library" })}>{t("scenarios.result.returnToLibrary")}</button>
          <button className="btn-ghost" onClick={() => go("dashboard")}>{t("nav.dashboard")}</button>
          <button className="btn-ghost" onClick={() => go("progress")}>{t("scenarios.result.viewProgress")}</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>{t("nav.scenarios")}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.35rem" }}>{t("scenarios.library.title")}</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", lineHeight: 1.6 }}>{t("scenarios.library.description")}</p>
        </div>
      </div>
      <div className="section">
        {view.mode === "library" ? (
          <PageBackButton style={{ marginBottom: "1.5rem" }} />
        ) : view.mode === "attempt" ? (
          <button className="btn-ghost" onClick={() => go("dashboard")} style={{ marginBottom: "1.5rem" }}>
            {t("scenarios.attempt.exit")}
          </button>
        ) : (
          <button className="btn-ghost" onClick={() => setView({ mode: "library" })} style={{ marginBottom: "1.5rem" }}>
            {t("common.back")}
          </button>
        )}
        {error && <div className="field-error" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
        {view.mode === "intro" ? renderIntro() : view.mode === "attempt" ? renderAttempt() : view.mode === "result" ? renderResult() : renderLibrary()}
      </div>
    </div>
  );
}

// ─── Page: Profile ───────────────────────────────────────────────
function ProfilePage() {
  const { t } = useTranslation();

  const {
    user,
    go,
    updateProfile,
    updateAccount,
  } = useApp();

  const [form, setForm] = useState(() => ({
    aiNickname:
      user?.profile?.aiNickname ||
      user?.displayName ||
      "",

    educationLevel:
      user?.profile?.educationLevel ||
      "",

    preferredLanguage:
      user?.profile?.preferredLanguage ||
      "",

    familiarityLevel:
      user?.profile?.familiarityLevel ||
      "",

    helpTopics:
      user?.profile?.helpTopics ||
      [],

    learningStyle:
      user?.profile?.learningStyle ||
      "",
  }));

  const [accountForm, setAccountForm] =
    useState(() => ({
      displayName:
        user?.displayName ||
        user?.name ||
        "",

      age:
        user?.age ||
        "",
    }));

  const [accountErrors, setAccountErrors] =
    useState({});

  const [accountSaving, setAccountSaving] =
    useState(false);

  const [accountSaved, setAccountSaved] =
    useState(false);

  const [errors, setErrors] =
    useState({});

  const [saving, setSaving] =
    useState(false);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {
    if (!accountSaved) return undefined;
    const timeout = window.setTimeout(() => setAccountSaved(false), prefersReducedMotion() ? 2500 : 3500);
    return () => window.clearTimeout(timeout);
  }, [accountSaved]);

  useEffect(() => {
    if (!saved) return undefined;
    const timeout = window.setTimeout(() => setSaved(false), prefersReducedMotion() ? 2500 : 3500);
    return () => window.clearTimeout(timeout);
  }, [saved]);

  if (!user) {
    go("login");
    return null;
  }

  function set(key, value) {
    setForm(current => ({
      ...current,
      [key]: value,
    }));

    setErrors(current => ({
      ...current,
      [key]: undefined,
      form: undefined,
    }));

    setSaved(false);
  }

  function toggleTopic(topicValue) {
    const selected =
      form.helpTopics || [];

    if (selected.includes(topicValue)) {
      set(
        "helpTopics",
        selected.filter(
          item => item !== topicValue
        )
      );
    } else if (selected.length < 3) {
      set(
        "helpTopics",
        [...selected, topicValue]
      );
    }
  }

  function setAccount(key, value) {
    setAccountForm(current => ({
      ...current,
      [key]: value,
    }));

    setAccountErrors(current => ({
      ...current,
      [key]: undefined,
      form: undefined,
      forbidden: undefined,
    }));

    setAccountSaved(false);
  }

  async function saveAccount() {
    if (accountSaving) return;

    setAccountSaving(true);
    setAccountSaved(false);
    setAccountErrors({});

    const result =
      await dbSaveAccount({
        displayName:
          accountForm.displayName,

        age:
          Number(accountForm.age),
      });

    setAccountSaving(false);

    if (!result.ok) {
      setAccountErrors({
        form:
          result.error ||
          t("settings.accountSaveFailed"),

        ...result.errors,
      });
      focusFirstNamedField(Object.keys(result.errors || {}));

      return;
    }

    updateAccount(result.account);

    setAccountForm({
      displayName:
        result.account.displayName ||
        "",

      age:
        result.account.age ||
        "",
    });

    setAccountSaved(true);
  }

  async function save() {
    if (saving) return;

    setSaving(true);
    setSaved(false);
    setErrors({});

    const result =
      await dbSaveProfile({
        ...form,
        onboardingCompleted: true,
      });

    setSaving(false);

    if (!result.ok) {
      setErrors({
        form:
          result.error ||
          t("settings.profileSaveFailed"),

        ...result.errors,
      });
      focusFirstNamedField(Object.keys(result.errors || {}));

      return;
    }

    updateProfile(result.profile);
    setSaved(true);
  }

  const fieldSet = [
    {
      key: "educationLevel",
      labelKey:
        "settings.educationLevel",
      options: EDUCATION_LEVELS,
      translationGroup:
        "education",
    },
    {
      key: "preferredLanguage",
      labelKey:
        "settings.preferredLanguage",
      options: LANGUAGES,
      translationGroup:
        "language",
    },
    {
      key: "familiarityLevel",
      labelKey:
        "settings.familiarity",
      options: FAMILIARITY,
      translationGroup:
        "familiarity",
    },
    {
      key: "learningStyle",
      labelKey:
        "settings.learningStyle",
      options: LEARNING_STYLES,
      translationGroup:
        "learningStyle",
    },
  ];

  function translatedOptionLabel(
    field,
    option
  ) {
    if (
      field.translationGroup ===
      "familiarity"
    ) {
      return t(
        `profileOptions.familiarity.${option.value}.label`,
        {
          defaultValue:
            option.label,
        }
      );
    }

    return t(
      `profileOptions.${field.translationGroup}.${option.value}`,
      {
        defaultValue:
          option.label,
      }
    );
  }

  const ageGroupKey =
    user?.ageGroup ||
    getAgeGroup(user?.age).key;

  const translatedAgeGroup = t(
    `settings.ageGroups.${ageGroupKey}`,
    {
      defaultValue:
        user?.ageGroup ||
        getAgeGroup(user?.age).label,
    }
  );

  return (
    <div>
      {/* Header */}
      <div
        style={{
          background:
            "linear-gradient(135deg, var(--teal) 0%, #1a5c4a 100%)",

          padding:
            "2.5rem 1.5rem",

          color:
            "#fff",
        }}
      >
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize:
                "0.78rem",

              color:
                "rgba(255,255,255,0.6)",

              fontWeight:
                600,

              letterSpacing:
                "0.08em",

              textTransform:
                "uppercase",

              marginBottom:
                "0.4rem",
            }}
          >
            {t("settings.learnerProfile")}
          </div>

          <h1
            style={{
              fontFamily:
                "'Space Grotesk', sans-serif",

              fontSize:
                "clamp(1.4rem, 3vw, 2rem)",

              fontWeight:
                600,

              marginBottom:
                "0.35rem",
            }}
          >
            {t("settings.title")}
          </h1>

          <p
            style={{
              color:
                "rgba(255,255,255,0.7)",

              fontSize:
                "0.9rem",

              lineHeight:
                1.6,
            }}
          >
            {t("settings.description")}
          </p>
        </div>
      </div>

      <div
        className="section"
        style={{
          maxWidth: 900,
        }}
      >
        <PageBackButton style={{ marginBottom: "1.5rem" }} />

        {/* Incomplete onboarding */}
        {!user.onboardingCompleted && (
          <div
            className="card"
            style={{
              marginBottom:
                "1rem",

              background:
                "var(--coral-lt)",

              border:
                "1px solid rgba(216,90,48,0.25)",
            }}
          >
            <div
              style={{
                fontWeight:
                  700,

                color:
                  "var(--coral)",

                marginBottom:
                  "0.25rem",
              }}
            >
              {t(
                "settings.finishOnboarding"
              )}
            </div>

            <div
              style={{
                fontSize:
                  "0.86rem",

                color:
                  "#5f4036",

                lineHeight:
                  1.6,
              }}
            >
              {t(
                "settings.finishOnboardingDescription"
              )}
            </div>
          </div>
        )}

        {/* Account information */}
        <div
          className="card"
          style={{
            marginBottom:
              "1rem",
          }}
        >
          <div
            style={{
              fontFamily:
                "'Space Grotesk', sans-serif",

              fontWeight:
                700,

              marginBottom:
                "1rem",
            }}
          >
            {t(
              "settings.accountInformation"
            )}
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                "1rem",
            }}
          >
            <div className="field">
              <label>
                {t("settings.email")}
              </label>

              <input
                value={
                  user?.email || ""
                }
                readOnly
              />
            </div>

            <div className="field">
              <label>
                {t(
                  "settings.displayName"
                )}
              </label>

              <input
                data-field="displayName"
                value={
                  accountForm.displayName
                }
                maxLength={50}
                aria-invalid={Boolean(accountErrors.displayName)}
                aria-describedby={accountErrors.displayName ? "account-display-name-error" : undefined}
                onChange={event =>
                  setAccount(
                    "displayName",
                    event.target.value
                  )
                }
                placeholder={t(
                  "settings.displayNamePlaceholder"
                )}
              />

              {accountErrors.displayName && (
                <div className="field-error" id="account-display-name-error" role="alert">
                  {
                    accountErrors.displayName
                  }
                </div>
              )}
            </div>

            <div className="field">
              <label>
                {t("settings.age")}
              </label>

              <input
                data-field="age"
                type="number"
                min="1"
                max="120"
                value={
                  accountForm.age
                }
                aria-invalid={Boolean(accountErrors.age)}
                aria-describedby={accountErrors.age ? "account-age-error" : undefined}
                onChange={event =>
                  setAccount(
                    "age",
                    event.target.value
                  )
                }
              />

              {accountErrors.age && (
                <div className="field-error" id="account-age-error" role="alert">
                  {accountErrors.age}
                </div>
              )}
            </div>

            <div className="field">
              <label>
                {t(
                  "settings.ageGroup"
                )}
              </label>

              <input
                value={
                  translatedAgeGroup
                }
                readOnly
              />
            </div>
          </div>

          {(accountErrors.form ||
            accountErrors.forbidden) && (
            <div
              className="field-error"
              role="alert"
              style={{
                marginBottom:
                  "0.75rem",
              }}
            >
              {accountErrors.form ||
                accountErrors.forbidden}
            </div>
          )}

          {accountSaved && <SuccessFeedback message={t("settings.accountSaved")} />}

          <button
            className="btn-primary"
            style={{
              flex:
                "0 0 auto",

              minWidth:
                180,
            }}
            onClick={
              saveAccount
            }
            disabled={
              accountSaving
            }
          >
            {accountSaving
              ? t("settings.saving")
              : t(
                  "settings.saveAccount"
                )}
          </button>
        </div>

        {/* Learning preferences */}
        <div className="card">
          <div
            style={{
              fontFamily:
                "'Space Grotesk', sans-serif",

              fontWeight:
                700,

              marginBottom:
                "1rem",
            }}
          >
            {t(
              "settings.learningPreferences"
            )}
          </div>

          <div className="field">
            <label>
              {t(
                "settings.aiNickname"
              )}
            </label>

            <input
              data-field="aiNickname"
              value={
                form.aiNickname
              }
              maxLength={50}
              aria-invalid={Boolean(errors.aiNickname)}
              aria-describedby={errors.aiNickname ? "profile-ai-nickname-error" : undefined}
              onChange={event =>
                set(
                  "aiNickname",
                  event.target.value
                )
              }
              placeholder={t(
                "settings.aiNicknamePlaceholder"
              )}
            />

            {errors.aiNickname && (
              <div className="field-error" id="profile-ai-nickname-error" role="alert">
                {errors.aiNickname}
              </div>
            )}
          </div>

          <div
            style={{
              display:
                "grid",

              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",

              gap:
                "1rem",
            }}
          >
            {fieldSet.map(field => (
              <div
                className="field"
                key={field.key}
              >
                <label>
                  {t(field.labelKey)}
                </label>

                <select
                  data-field={field.key}
                  value={
                    form[field.key]
                  }
                  aria-invalid={Boolean(errors[field.key])}
                  aria-describedby={errors[field.key] ? `profile-${field.key}-error` : undefined}
                  onChange={event =>
                    set(
                      field.key,
                      event.target.value
                    )
                  }
                  style={{
                    width:
                      "100%",

                    border:
                      "1.5px solid rgba(0,0,0,0.13)",

                    borderRadius:
                      10,

                    padding:
                      "0.65rem 0.9rem",

                    fontFamily:
                      "'DM Sans', sans-serif",

                    fontSize:
                      "0.9rem",

                    background:
                      "#fff",
                  }}
                >
                  <option value="">
                    {t(
                      "settings.chooseOne"
                    )}
                  </option>

                  {field.options.map(
                    option => (
                      <option
                        key={
                          option.value
                        }
                        value={
                          option.value
                        }
                      >
                        {translatedOptionLabel(
                          field,
                          option
                        )}
                      </option>
                    )
                  )}
                </select>

                {errors[field.key] && (
                  <div className="field-error" id={`profile-${field.key}-error`} role="alert">
                    {
                      errors[field.key]
                    }
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="field">
            <label>
              {t(
                "settings.helpTopics"
              )}
            </label>

            <div className="chip-grid">
              {HELP_OPTIONS.map(topic => (
                <button
                  key={
                    topic.value
                  }
                  data-field="helpTopics"
                  className={`chip-btn ${
                    form.helpTopics.includes(
                      topic.value
                    )
                      ? "selected"
                      : ""
                  }`}
                  onClick={() =>
                    toggleTopic(
                      topic.value
                    )
                  }
                  disabled={
                    form.helpTopics
                      .length >= 3 &&
                    !form.helpTopics.includes(
                      topic.value
                    )
                  }
                  type="button"
                >
                  {t(
                    `profileOptions.helpTopics.${topic.value}`,
                    {
                      defaultValue:
                        topic.label,
                    }
                  )}
                </button>
              ))}
            </div>

            <div className="chip-limit-note">
              {t(
                "onboarding.selectedCount",
                {
                  count:
                    form.helpTopics
                      .length,

                  max:
                    3,
                }
              )}
            </div>

            {errors.helpTopics && (
              <div className="field-error">
                {errors.helpTopics}
              </div>
            )}
          </div>

          {errors.form && (
            <div
              className="field-error"
              role="alert"
              style={{
                marginBottom:
                  "0.75rem",
              }}
            >
              {errors.form}
            </div>
          )}

          {saved && <SuccessFeedback message={t("settings.profileSaved")} />}

          <div
            style={{
              display:
                "flex",

              flexWrap:
                "wrap",

              gap:
                "0.75rem",

              alignItems:
                "center",
            }}
          >
            <button
              className="btn-primary"
              style={{
                flex:
                  "0 0 auto",

                minWidth:
                  180,
              }}
              onClick={save}
              disabled={saving}
            >
              {saving
                ? t(
                    "settings.saving"
                  )
                : t(
                    "settings.saveProfile"
                  )}
            </button>

            {user.onboardingCompleted && (
              <button
                className="btn-ghost"
                onClick={() =>
                  go("dashboard")
                }
              >
                {t(
                  "nav.dashboard"
                )}
              </button>
            )}
          </div>

          <div
            style={{
              fontSize:
                "0.76rem",

              color:
                "#777",

              marginTop:
                "1rem",

              lineHeight:
                1.6,
            }}
          >
            {t(
              "settings.identityNote"
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Page: Progress ──────────────────────────────────────────────
function ProgressPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { user, go, openRecommendedResource } = useApp();
  const progressLocale = normalizeLocale(activeI18n.language);
  const [progressState, setProgressState] = useState({ loading: true, progress: null });
  const [recommendationState, setRecommendationState] = useState({ loading: true, recommendation: null });
  const [recommendationCompleting, setRecommendationCompleting] = useState(false);
  const [recommendationCompleteSaved, setRecommendationCompleteSaved] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([dbGetProgress(), dbGetCurrentRecommendation(progressLocale)]).then(([progressResult, recommendationResult]) => {
      if (!active) return;
      setProgressState(progressResult.ok
        ? { loading: false, progress: progressResult }
        : { loading: false, progress: null, error: progressResult.error });
      setRecommendationState(recommendationResult.ok
        ? { loading: false, recommendation: recommendationResult.recommendation }
        : { loading: false, recommendation: null, error: recommendationResult.error });
    });
    return () => { active = false; };
  }, [user, progressLocale]);

  useEffect(() => {
    if (!recommendationCompleteSaved) return undefined;
    const timeout = window.setTimeout(() => setRecommendationCompleteSaved(false), prefersReducedMotion() ? 2500 : 3500);
    return () => window.clearTimeout(timeout);
  }, [recommendationCompleteSaved]);

  if (!user) { go("login"); return null; }

  const nick  = user.aiNickname || user.name;
  const topics = user.helpTopics || [];
  const profileLevelValue = user.profile?.familiarityLevel || "";
  const languageValue = user.profile?.preferredLanguage || "";
  const learningStyleValue = user.profile?.learningStyle || "";
  const profileLevel = profileLevelValue
    ? t(`profileOptions.familiarity.${profileLevelValue}.label`, { defaultValue: user.familiarity || t("dashboard.beginner") })
    : user.familiarity || t("dashboard.beginner");
  const lang = languageValue
    ? t(`profileOptions.language.${languageValue}`, { defaultValue: user.language || "English" })
    : user.language || "English";
  const style = learningStyleValue
    ? t(`profileOptions.learningStyle.${learningStyleValue}`, { defaultValue: user.learningStyle || t("common.notSet") })
    : user.learningStyle || t("common.notSet");

  const allTopics = HELP_OPTIONS;

  const summary = progressState.progress?.summary;
  const measuredTopics = progressState.progress?.topics || [];
  const recommendation = recommendationState.recommendation;
  const measuredLevel = t(`levels.${summary?.measuredLevel}`, { defaultValue: levelLabel(summary?.measuredLevel) });
  const measuredValue = summary?.overallMasteryPercentage || 0;

  const badges = [
    { icon: "🛡", labelKey: "progress.badges.joined", earned: true  },
    { icon: "💬", labelKey: "progress.badges.chatPreview", earned: true  },
    { icon: "📚", labelKey: "progress.badges.exploredResources", earned: topics.length > 0 },
    { icon: "🎯", labelKey: "progress.badges.setGoals", earned: topics.length > 0 },
    { icon: "🌐", labelKey: "progress.badges.multilingual", earned: languageValue && languageValue !== "english" },
    { icon: "🏆", labelKey: "progress.badges.measuredBaseline", earned: Boolean(summary?.exists) },
  ];

  async function completeRecommendation() {
    if (!recommendation?.id || recommendationCompleting) return;
    setRecommendationCompleting(true);
    const result = await dbMarkRecommendationCompleted(recommendation.id, progressLocale);
    setRecommendationCompleting(false);
    if (result.ok) {
      setRecommendationState({ loading: false, recommendation: result.recommendation });
      setRecommendationCompleteSaved(true);
    }
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>{t("progress.title")}</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.3rem" }}>
            {t("progress.heroTitle", { name: nick })}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
            {summary?.exists ? t("progress.measuredLevelSummary", { level: measuredLevel }) : t("progress.profileFamiliaritySummary", { level: profileLevel })} · {lang} · {style}
          </p>
        </div>
      </div>

      <div className="section">
        <PageBackButton style={{ marginBottom: "2rem" }} />

        {/* Profile snapshot */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {[
            { icon: "🎓", labelKey: "progress.snapshot.measuredLevel", value: progressState.loading ? t("common.loading") : measuredLevel },
            { icon: "🌐", labelKey: "progress.snapshot.language", value: lang },
            { icon: "📖", labelKey: "progress.snapshot.style",    value: style },
            { icon: "🎯", labelKey: "progress.snapshot.topics",   value: t("progress.selectedTopics", { count: topics.length }) },
          ].map(s => (
            <div key={s.labelKey} className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>{s.icon}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--teal)", marginBottom: "0.2rem" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#888" }}>{t(s.labelKey)}</div>
            </div>
          ))}
        </div>

        {/* Skill level bar */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.mastery.title")}</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.mastery.description")}</p>
          <div className="card" style={{ padding: "1.5rem" }}>
            {progressState.loading ? (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>{t("progress.mastery.loading")}</div>
            ) : summary?.exists ? (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>{measuredLevel}</span>
                  <span style={{ fontSize: "0.85rem", color: "#888" }}>{measuredValue}%</span>
                </div>
                <div style={{ background: "#eee", borderRadius: 99, height: 10, overflow: "hidden" }}>
                  <div style={{ background: "var(--teal)", width: `${measuredValue}%`, height: "100%", borderRadius: 99, transition: "width 0.6s ease" }} />
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem" }}>
                  {["beginner", "developing", "intermediate", "advanced"].map(l => (
                    <span key={l} style={{ fontSize: "0.72rem", color: t(`levels.${l}`) === measuredLevel ? "var(--teal)" : "#bbb", fontWeight: t(`levels.${l}`) === measuredLevel ? 700 : 400 }}>{t(`levels.${l}`)}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: "0.86rem", color: "#666", lineHeight: 1.6 }}>
                {t("progress.mastery.empty")}
                <button onClick={() => go("assessment")} style={{ display: "block", marginTop: "0.85rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>{t("dashboard.startAssessment")}</button>
              </div>
            )}
          </div>
        </div>

        {measuredTopics.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.assessmentTopics.title")}</p>
            <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.assessmentTopics.description")}</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {measuredTopics.map(topic => (
                <div key={topic.topicCode} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.65rem" }}>
                    <div>
                      <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{PROGRESS_TOPIC_META[topic.topicCode]?.icon || "📘"}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{t(`topics.${topic.topicCode}`, { defaultValue: topicLabel(topic.topicCode, topic.topicLabel) })}</div>
                    </div>
                    <div style={{ color: "var(--teal)", fontWeight: 800 }}>{topic.masteryPercentage}%</div>
                  </div>
                  <div style={{ background: "#edf3ef", borderRadius: 99, height: 9, overflow: "hidden", marginBottom: "0.55rem" }}>
                    <div style={{ width: `${topic.masteryPercentage}%`, background: "var(--teal)", height: "100%", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#666" }}>
                    {t(`levels.${topic.currentLevel}`, { defaultValue: levelLabel(topic.currentLevel) })} · {t("progress.assessmentTopics.source")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendation && (
          <div className="card" style={{ marginBottom: "2.5rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)" }}>
            {recommendationCompleteSaved && <SuccessFeedback message={t("progress.recommendation.completedSaved")} />}
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.3rem" }}>{t("progress.recommendation.title")}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>
              {recommendation.topicCode ? t(`topics.${recommendation.topicCode}`, { defaultValue: topicLabel(recommendation.topicCode, recommendation.topicLabel) }) : t("dashboard.recommendation.initialAssessment")}
            </div>
            <div style={{ fontSize: "0.86rem", color: "#3e5149", lineHeight: 1.6, marginBottom: "1rem" }}>
              {recommendation.reasonText}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={() => recommendation.topicCode ? openRecommendedResource(recommendation.topicCode) : go("assessment")} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                {recommendation.topicCode ? t("dashboard.recommendation.readResource") : t("dashboard.recommendation.startAssessment")}
              </button>
              {recommendation.topicCode && (
                <button onClick={() => go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                  {t("dashboard.recommendation.practiceScenario")}
                </button>
              )}
              {recommendation.topicCode && recommendation.status !== "completed" && (
                <button onClick={completeRecommendation} disabled={recommendationCompleting} style={{ background: "#fff", color: "var(--teal)", border: "1px solid rgba(29,158,117,0.3)", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: recommendationCompleting ? "not-allowed" : "pointer", opacity: recommendationCompleting ? 0.55 : 1 }}>
                  {recommendationCompleting ? t("common.saving") : t("progress.recommendation.markComplete")}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Topics of interest */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.learningTopics.title")}</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.learningTopics.description")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {allTopics.map(topicOption => {
              const active = topics.includes(topicOption.value);
              return (
                <div key={topicOption.value} style={{
                  background: active ? "var(--teal-lt)" : "#f9f9f9",
                  border: active ? "1px solid rgba(29,158,117,0.3)" : "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 10, padding: "0.75rem 1rem",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                }}>
                  <span style={{ fontSize: "1rem" }}>{active ? "✅" : "⬜"}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: active ? 600 : 400, color: active ? "var(--teal)" : "#888" }}>{t(`profileOptions.helpTopics.${topicOption.value}`, { defaultValue: topicOption.label })}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => go("resources")} style={{ marginTop: "1rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            {t("progress.learningTopics.exploreAll")}
          </button>
        </div>

        {/* Badges */}
        <div>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.badges.title")}</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.badges.description")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
            {badges.map(b => (
              <div key={b.labelKey} className="card" style={{
                textAlign: "center", padding: "1.25rem 0.75rem",
                opacity: b.earned ? 1 : 0.4,
                filter: b.earned ? "none" : "grayscale(1)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>{b.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: b.earned ? "#1a1a18" : "#aaa" }}>{t(b.labelKey)}</div>
                {b.earned && <div style={{ fontSize: "0.68rem", color: "var(--teal)", marginTop: "0.25rem", fontWeight: 600 }}>{t("progress.badges.earned")}</div>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function formatChatUpdatedAt(value, t) {
  if (!value) return t("chat.history.unknownTime");
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return t("chat.history.unknownTime");
  }
}

function ConversationHistoryItem({
  conversation,
  active,
  onSelect,
  onRename,
  onDelete,
  openMenu,
  setOpenMenu,
}) {
  const { t } = useTranslation();
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [titleError, setTitleError] = useState("");
  const wrapRef = useRef(null);
  const itemButtonRef = useRef(null);
  const menuButtonRef = useRef(null);
  const inputRef = useRef(null);
  const titleErrorId = `rename-error-${conversation.id}`;
  const menuId = `conversation-menu-${conversation.id}`;

  useEffect(() => {
    setDraftTitle(conversation.title);
  }, [conversation.title]);

  useEffect(() => {
    if (renaming) {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [renaming]);

  useEffect(() => {
    if (openMenu !== conversation.id) return undefined;
    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) setOpenMenu(null);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        menuButtonRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [conversation.id, openMenu, setOpenMenu]);

  function restoreItemFocus() {
    window.setTimeout(() => {
      if (menuButtonRef.current) {
        menuButtonRef.current.focus();
      } else {
        itemButtonRef.current?.focus();
      }
    }, 0);
  }

  function validateTitle() {
    const nextTitle = normalizeConversationTitle(draftTitle);
    if (!nextTitle) {
      setTitleError(t("chat.validation.titleRequired"));
      return null;
    }
    if (nextTitle.length > MAX_CONVERSATION_TITLE_LENGTH) {
      setTitleError(t("chat.validation.titleTooLong", { max: MAX_CONVERSATION_TITLE_LENGTH }));
      return null;
    }
    return nextTitle;
  }

  function saveRename() {
    const nextTitle = validateTitle();
    if (!nextTitle) return;
    const saved = onRename(conversation.id, nextTitle);
    if (!saved) {
      setTitleError(t("chat.validation.titleRequired"));
      return;
    }
    setRenaming(false);
    setTitleError("");
    restoreItemFocus();
  }

  function cancelRename() {
    setDraftTitle(conversation.title);
    setTitleError("");
    setRenaming(false);
    restoreItemFocus();
  }

  if (renaming) {
    return (
      <div className="ai-chat-rename-row">
        <div className="ai-chat-list-item active">
          <div className="ai-chat-rename-form">
            <input
              ref={inputRef}
              className="ai-chat-rename-input"
              value={draftTitle}
              aria-label={t("chat.actions.renameConversation")}
              aria-invalid={Boolean(titleError)}
              aria-describedby={titleError ? titleErrorId : undefined}
              onChange={event => {
                setDraftTitle(event.target.value);
                setTitleError("");
              }}
              onKeyDown={event => {
                if (event.key === "Enter") saveRename();
                if (event.key === "Escape") cancelRename();
              }}
            />
            {titleError && <div id={titleErrorId} className="field-error" role="alert">{titleError}</div>}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button type="button" className="btn-primary" style={{ padding: "0.45rem 0.65rem" }} onClick={saveRename}>
                {t("common.save")}
              </button>
              <button type="button" className="btn-ghost" style={{ padding: "0.45rem 0.65rem" }} onClick={cancelRename}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat-list-row" ref={wrapRef}>
      <button
        type="button"
        ref={itemButtonRef}
        className={`ai-chat-list-item${active ? " active" : ""}`}
        onClick={() => onSelect(conversation.id)}
        aria-current={active ? "true" : undefined}
      >
        <div className="ai-chat-list-title">{conversation.title}</div>
        <div className="ai-chat-list-time">{formatChatUpdatedAt(conversation.updatedAt, t)}</div>
      </button>
      <button
        type="button"
        ref={menuButtonRef}
        className={`ai-chat-menu-button${openMenu === conversation.id ? " open" : ""}`}
        onClick={event => {
          event.stopPropagation();
          setOpenMenu(openMenu === conversation.id ? null : conversation.id);
        }}
        aria-label={t("chat.accessibility.conversationMenu", { title: conversation.title })}
        aria-haspopup="menu"
        aria-expanded={openMenu === conversation.id}
        aria-controls={openMenu === conversation.id ? menuId : undefined}
      >
        ⋯
      </button>
      {openMenu === conversation.id && (
        <div className="ai-chat-menu" id={menuId} role="menu">
          <button type="button" className="ai-chat-menu-item" role="menuitem" onClick={event => {
            event.stopPropagation();
            setOpenMenu(null);
            setRenaming(true);
          }}>
            {t("chat.actions.rename")}
          </button>
          <button type="button" className="ai-chat-menu-item danger" role="menuitem" onClick={event => {
            event.stopPropagation();
            setOpenMenu(null);
            onDelete(conversation, menuButtonRef.current);
          }} aria-label={t("chat.accessibility.deleteConversation", { title: conversation.title })}>
            {t("chat.actions.delete")}
          </button>
        </div>
      )}
    </div>
  );
}

function AIChatPage() {
  const { t } = useTranslation();
  const { user, go } = useApp();
  const { conversations, activeConversation, activeConversationId, createConversation, selectConversation, renameConversation, deleteConversation } = useChat();
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const deleteReturnFocusRef = useRef(null);
  const newChatButtonRef = useRef(null);

  if (!user) { go("login"); return null; }

  function requestDeleteConversation(conversation, returnFocusElement) {
    deleteReturnFocusRef.current = returnFocusElement;
    setDeleteTarget(conversation);
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
    window.setTimeout(() => deleteReturnFocusRef.current?.focus(), 0);
  }

  function confirmDeleteConversation() {
    const returnFocusElement = deleteReturnFocusRef.current;
    deleteConversation(deleteTarget.id);
    setDeleteTarget(null);
    window.setTimeout(() => {
      if (returnFocusElement?.isConnected) {
        returnFocusElement.focus();
      } else {
        newChatButtonRef.current?.focus();
      }
    }, 0);
  }

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.4rem" }}>
            {t("nav.aiChat")}
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", marginBottom: "0.4rem" }}>
            {t("chat.page.title")}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.68)", maxWidth: 680, lineHeight: 1.65 }}>
            {t("chat.page.description")}
          </p>
        </div>
      </div>

      <div className="ai-chat-shell">
        <aside className="ai-chat-sidebar" aria-label={t("chat.history.ariaLabel")}>
          <PageBackButton style={{ marginBottom: "1rem" }} />
          <div className="ai-chat-sidebar-header">
            <div>
              <div style={{ fontWeight: 800 }}>{t("chat.history.title")}</div>
              <div style={{ fontSize: "0.76rem", color: "#77827d" }}>{t("chat.history.description")}</div>
            </div>
            <button className="btn-ghost" style={{ padding: "0.45rem 0.65rem" }} ref={newChatButtonRef} onClick={createConversation} aria-label={t("chat.accessibility.newChat")}>
              +
            </button>
          </div>
          {conversations.length === 0 ? (
            <PageState type="empty" title={t("chat.history.emptyTitle")} message={t("chat.history.emptyDescription")} />
          ) : (
            <div className="ai-chat-list" role="list">
              {conversations.map(conversation => (
                <ConversationHistoryItem
                  key={conversation.id}
                  conversation={conversation}
                  active={conversation.id === activeConversationId}
                  onSelect={selectConversation}
                  onRename={renameConversation}
                  onDelete={requestDeleteConversation}
                  openMenu={openMenu}
                  setOpenMenu={setOpenMenu}
                />
              ))}
            </div>
          )}
        </aside>

        <section className="ai-chat-main" aria-label={t("chat.page.chatAreaLabel")}>
          <div className="ai-chat-main-header">
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {activeConversation?.title || t("chat.conversation.newTitle")}
                </div>
                <div style={{ color: "#77827d", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                  {activeConversation ? t("chat.history.lastUpdated", { time: formatChatUpdatedAt(activeConversation.updatedAt, t) }) : t("chat.history.noActive")}
                </div>
              </div>
              <button className="btn-ghost" onClick={createConversation} aria-label={t("chat.accessibility.newChat")}>
                {t("chat.actions.newChat")}
              </button>
            </div>
          </div>
          <ChatMessageList className="ai-chat-full-messages" />
          <ChatComposer />
        </section>
      </div>
      {deleteTarget && (
        <ConfirmationDialog
          title={t("chat.delete.title")}
          description={t("chat.delete.description", { title: deleteTarget.title })}
          cancelLabel={t("common.cancel")}
          confirmLabel={t("chat.actions.delete")}
          onCancel={closeDeleteDialog}
          onConfirm={confirmDeleteConversation}
          danger
        />
      )}
    </div>
  );
}

// ─── Chat Widget (floating) ────────────────────────────────────────
function ChatWidget() {
  const { t } = useTranslation();
  const { user, go } = useApp();
  const { activeConversation, createConversation } = useChat();
  const [open,     setOpen]     = useState(false);
  const displayName = user?.displayName || user?.name;
  const group = user ? getAgeGroup(user.age) : null;

  function openFullPage() {
    if (user && !activeConversation) createConversation();
    setOpen(false);
    go(user ? "ai-chat" : "login");
  }

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              💬 {t("chat.title")}
              <div className="chat-header-sub">
                {user ? `${displayName} · ${t(`settings.ageGroups.${group.key}`, { defaultValue: group.label })}` : t("chat.guest")}
              </div>
            </div>
            <div className="chat-header-actions">
              {user && (
                <button
                  type="button"
                  className="chat-header-button"
                  onClick={openFullPage}
                  title={t("chat.actions.fullPage")}
                  aria-label={t("chat.accessibility.fullPage")}
                >
                  ↗ {t("chat.actions.fullPage")}
                </button>
              )}
              <button
                type="button"
                className="chat-header-button"
                onClick={() => setOpen(false)}
                aria-label={t("common.close")}
              >
                ×
              </button>
            </div>
          </div>
          {!user ? (
            <div className="chat-messages">
              <div className="chat-login-prompt">
                <p>{t("chat.signInPrompt")}</p>
                <button onClick={() => { setOpen(false); go("login"); }}>{t("chat.signInCta")}</button>
              </div>
            </div>
          ) : (
            <>
              <ChatMessageList emptyCompact />
              <ChatComposer compact />
            </>
          )}
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen(o => !o)} aria-label={t(open ? "common.close" : "chat.accessibility.openWidget")}>
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────
const LANGUAGE_OPTIONS = [
  { locale: "en", label: "English" },
  { locale: "ms", label: "Bahasa Melayu" },
  { locale: "zh-CN", label: "简体中文" },
];

function LanguageSelector() {
  const { t } = useTranslation();
  const [locale, setLocale] = useState(normalizeLocale(i18n.language));

  useEffect(() => {
    function sync(nextLocale) {
      setLocale(normalizeLocale(nextLocale));
    }
    i18n.on("languageChanged", sync);
    return () => i18n.off("languageChanged", sync);
  }, []);

  async function changeLocale(event) {
    const nextLocale = normalizeLocale(event.target.value);
    localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    await i18n.changeLanguage(nextLocale);
  }

  return (
    <label className="nav-language" title={t("nav.languageControlTitle")}>
      <span aria-hidden="true">🌐</span>
      <select value={locale} onChange={changeLocale} aria-label={t("nav.languageAriaLabel")}>
        {LANGUAGE_OPTIONS.map(option => (
          <option key={option.locale} value={option.locale}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

const NAV_ITEMS = [
  { id: "home", labelKey: "nav.home" },
  { id: "dashboard", labelKey: "nav.dashboard" },
  { id: "assessment", labelKey: "nav.assessment" },
  { id: "scenarios", labelKey: "nav.scenarios" },
  { id: "resources", labelKey: "nav.resources" },
  { id: "ai-chat", labelKey: "nav.aiChat" },
  { id: "about", labelKey: "nav.about" },
];

const LOGGED_OUT_NAV_ITEMS = NAV_ITEMS.filter(item =>
  ["home", "resources", "about"].includes(item.id)
);

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    function update() {
      setMatches(mediaQuery.matches);
    }

    update();
    mediaQuery.addEventListener("change", update);
    return () => mediaQuery.removeEventListener("change", update);
  }, [query]);

  return matches;
}

function MobileNavMenu({ page, items, user, openAuth, onNavigate }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const buttonRef = useRef(null);
  const panelId = "mobile-navigation-menu";

  useEffect(() => {
    setOpen(false);
  }, [page, user?.id]);

  useEffect(() => {
    if (!open) return undefined;

    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  function navigate(pageId) {
    setOpen(false);
    onNavigate(pageId);
  }

  function auth(mode) {
    setOpen(false);
    openAuth(mode);
  }

  return (
    <div className="mobile-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={buttonRef}
        className={`mobile-menu-button${open ? " open" : ""}`}
        onClick={() => setOpen(current => !current)}
        aria-label={t(open ? "nav.closeMenuAriaLabel" : "nav.openMenuAriaLabel")}
        aria-expanded={open}
        aria-controls={panelId}
        aria-haspopup="menu"
      >
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      {open && (
        <div className="mobile-menu-panel" id={panelId} role="menu" aria-label={t("nav.mobileNavigationLabel")}>
          {items.map(item => (
            <button
              key={item.id}
              type="button"
              className={`mobile-nav-item${page === item.id ? " active" : ""}`}
              role="menuitem"
              onClick={() => navigate(item.id)}
            >
              <span>{t(item.labelKey)}</span>
            </button>
          ))}
          {!user && (
            <div className="mobile-menu-actions">
              <button type="button" className="mobile-nav-item" role="menuitem" onClick={() => auth("login")}>
                <span>{t("auth.login")}</span>
              </button>
              <button type="button" className="mobile-nav-item" role="menuitem" onClick={() => auth("register")}>
                <span>{t("auth.getStarted")}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AccountMenu({ user, onNavigate, onRequestLogout }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);
  const menuId = "account-navigation-menu";
  const displayName = user?.displayName || user?.name || t("nav.accountMenu.userFallback");
  const email = user?.email;

  useEffect(() => {
    if (!open) return undefined;

    window.setTimeout(() => {
      itemRefs.current[0]?.focus();
    }, 0);

    function handlePointerDown(event) {
      if (!wrapRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    setOpen(false);
  }, [user?.id]);

  function navigate(pageId) {
    setOpen(false);
    onNavigate(pageId);
  }

  function requestLogout() {
    setOpen(false);
    onRequestLogout(triggerRef.current);
  }

  function handleTriggerKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleMenuKeyDown(event, index) {
    const items = itemRefs.current.filter(Boolean);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    }
  }

  return (
    <div className="account-menu-wrap" ref={wrapRef}>
      <button
        type="button"
        ref={triggerRef}
        className={`account-trigger${open ? " open" : ""}`}
        onClick={() => setOpen(current => !current)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={t("nav.accountMenu.triggerAriaLabel", { name: displayName })}
      >
        <span className="nav-avatar" aria-hidden="true">{displayName[0]?.toUpperCase() || "U"}</span>
        <span className="account-name">{displayName}</span>
        <span className="account-chevron" aria-hidden="true">▾</span>
      </button>

      {open && (
        <div className="account-dropdown" id={menuId} role="menu" aria-label={t("nav.accountMenu.menuAriaLabel")}>
          <div className="account-menu-header">
            <div className="account-menu-name">{displayName}</div>
            {email && <div className="account-menu-email">{email}</div>}
          </div>
          <button
            type="button"
            className="account-menu-item"
            role="menuitem"
            ref={element => { itemRefs.current[0] = element; }}
            onKeyDown={event => handleMenuKeyDown(event, 0)}
            onClick={() => navigate("dashboard")}
          >
            {t("nav.dashboard")}
          </button>
          <button
            type="button"
            className="account-menu-item"
            role="menuitem"
            ref={element => { itemRefs.current[1] = element; }}
            onKeyDown={event => handleMenuKeyDown(event, 1)}
            onClick={() => navigate("progress")}
          >
            <svg className="account-menu-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19V5" />
              <path d="M4 19h16" />
              <path d="M8 16v-5" />
              <path d="M12 16V8" />
              <path d="M16 16v-3" />
            </svg>
            <span>{t("nav.accountMenu.personalProgress")}</span>
          </button>
          <button
            type="button"
            className="account-menu-item"
            role="menuitem"
            ref={element => { itemRefs.current[2] = element; }}
            onKeyDown={event => handleMenuKeyDown(event, 2)}
            onClick={() => navigate("profile")}
          >
            {t("nav.accountMenu.profileSettings")}
          </button>
          <div className="account-menu-divider" role="separator" />
          <button
            type="button"
            className="account-menu-item danger"
            role="menuitem"
            ref={element => { itemRefs.current[3] = element; }}
            onKeyDown={event => handleMenuKeyDown(event, 3)}
            onClick={requestLogout}
          >
            {t("nav.accountMenu.logOut")}
          </button>
        </div>
      )}
    </div>
  );
}

function LogoutConfirmModal({ onCancel, onConfirm }) {
  const { t } = useTranslation();
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    cancelRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") onCancel();
      if (event.key !== "Tab") return;

      const focusable = [cancelRef.current, confirmRef.current].filter(Boolean);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div className="logout-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div
        className="logout-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
        aria-describedby="logout-modal-description"
      >
        <h2 id="logout-modal-title">{t("nav.logoutModal.title")}</h2>
        <p id="logout-modal-description">{t("nav.logoutModal.description")}</p>
        <div className="logout-modal-actions">
          <button type="button" className="modal-cancel" ref={cancelRef} onClick={onCancel}>
            {t("nav.logoutModal.cancel")}
          </button>
          <button type="button" className="modal-confirm" ref={confirmRef} onClick={onConfirm}>
            {t("nav.logoutModal.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Navbar({ page }) {
  const { go, user, logout, openAuth } = useApp();
  const { t } = useTranslation();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const isMobileNav = useMediaQuery("(max-width: 1050px)");
  const logoutReturnFocusRef = useRef(null);
  const navItems = user ? NAV_ITEMS : LOGGED_OUT_NAV_ITEMS;

  async function confirmLogout() {
    setLogoutModalOpen(false);
    await logout();
  }

  function requestLogout(focusTarget) {
    logoutReturnFocusRef.current = focusTarget || null;
    setLogoutModalOpen(true);
  }

  function closeLogoutModal() {
    setLogoutModalOpen(false);
    window.setTimeout(() => {
      logoutReturnFocusRef.current?.focus();
      logoutReturnFocusRef.current = null;
    }, 0);
  }

  return (
    <nav className="navbar">
      <button
        type="button"
        className="nav-logo"
        onClick={() => go(user ? "dashboard" : "home")}
        aria-label={t(user ? "nav.brandDashboardAriaLabel" : "nav.brandHomeAriaLabel")}
      >
        <span aria-hidden="true">🛡</span>
        <span>Cyberly</span>
      </button>

      {isMobileNav && (
        <MobileNavMenu
          page={page}
          items={navItems}
          user={user}
          openAuth={openAuth}
          onNavigate={go}
        />
      )}

      <div className="nav-primary" aria-label={t("nav.primaryAriaLabel")}>
        {navItems.map(n => (
          <button key={n.id} className={`nav-link${page === n.id ? " active" : ""}`} onClick={() => go(n.id)}>
            {t(n.labelKey)}
          </button>
        ))}
      </div>

      <div className="nav-utility">
        <LanguageSelector />
        <div className="nav-divider" aria-hidden="true" />
        {user ? (
          <AccountMenu
            user={user}
            onNavigate={go}
            onRequestLogout={requestLogout}
          />
        ) : (
          <div className="desktop-auth-actions">
            <button className="nav-cta secondary" onClick={() => openAuth("login")}>{t("auth.login")}</button>
            <button className="nav-cta" onClick={() => openAuth("register")}>{t("auth.getStarted")}</button>
          </div>
        )}
      </div>

      {logoutModalOpen && (
        <LogoutConfirmModal
          onCancel={closeLogoutModal}
          onConfirm={confirmLogout}
        />
      )}
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  const { t } = useTranslation();
  return (
    <footer>
      <p>{t("footer.builtWithCare")} · <strong>Cyberly</strong> · {new Date().getFullYear()}</p>
      <p style={{ marginTop: "0.4rem", fontSize: "0.78rem" }}>
        {t("footer.description")}
      </p>
    </footer>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  const { t } = useTranslation();
  const [page, setPage] = useState(() => parseHashPage());
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resourceFocusTopic, setResourceFocusTopic] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [activityGuard, setActivityGuard] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const suppressHashGuardRef = useRef(false);
  const userId = user?.id;
  const userProfilePreferredLanguage =
    user?.profile?.preferredLanguage;
  const userPreferredLanguage =
    user?.preferredLanguage;

  useEffect(() => {
    let active = true;
    dbMe().then(result => {
      if (!active) return;
      if (result.ok) {
        const restoredUser = normalizeSessionUser(result.user, result.profile);
        const restoredPage = parseHashPage();
        setUser(restoredUser);
        if (PROTECTED_PAGES.has(restoredPage)) {
          setPage(restoredUser.onboardingCompleted ? restoredPage : "profile");
          writeHashPage(restoredUser.onboardingCompleted ? restoredPage : "profile", true);
        } else if (restoredPage === "login") {
          setPage(restoredUser.onboardingCompleted ? "dashboard" : "profile");
          writeHashPage(restoredUser.onboardingCompleted ? "dashboard" : "profile", true);
        } else {
          setPage(restoredPage);
          writeHashPage(restoredPage, true);
        }
      } else {
        const restoredPage = parseHashPage();
        if (PROTECTED_PAGES.has(restoredPage)) {
          setPage("home");
          writeHashPage("home", true);
        } else {
          setPage(restoredPage);
          writeHashPage(restoredPage, true);
        }
      }
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function handleHashChange() {
      const nextPage = parseHashPage();
      if (suppressHashGuardRef.current) {
        suppressHashGuardRef.current = false;
        setPage(nextPage);
        return;
      }
      if (activityGuard && nextPage !== page) {
        setPendingNavigation({ page: nextPage });
        suppressHashGuardRef.current = true;
        writeHashPage(page, true);
        suppressHashGuardRef.current = false;
        return;
      }
      if (!user && PROTECTED_PAGES.has(nextPage)) {
        setPage("home");
        writeHashPage("home", true);
        return;
      }
      setPage(nextPage);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [activityGuard, page, user]);

  useEffect(() => {
    if (!activityGuard) return undefined;
    function handleBeforeUnload(event) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [activityGuard]);

  useEffect(() => {
    if (!userId) return;

    const storedLocale =
      getStoredUiLanguage();

    if (storedLocale) {
      if (
        normalizeLocale(i18n.language) !==
        storedLocale
      ) {
        i18n.changeLanguage(storedLocale);
      }

      return;
    }

    const profilePreference =
      userProfilePreferredLanguage ||
      userPreferredLanguage;

    const profileLocale =
      profileLanguageToLocale(
        profilePreference
      );

    if (
      normalizeLocale(i18n.language) !==
      profileLocale
    ) {
      i18n.changeLanguage(profileLocale);
    }
  }, [
    userId,
    userProfilePreferredLanguage,
    userPreferredLanguage,
  ]);

  function login(userData, profileData, preferredPage) {
    const nextUser = normalizeSessionUser(userData, profileData);
    setUser(nextUser);
    setPage(preferredPage || (nextUser.onboardingCompleted ? "dashboard" : "profile"));
  }
  function updateProfile(profileData) {
    setUser(current => current ? normalizeSessionUser(current, profileData) : current);
  }
  function updateAccount(accountData) {
    setUser(current => {
      if (!current) return current;

      return {
        ...current,
        ...accountData,
        name:
          accountData.displayName ??
          current.name,

        displayName:
          accountData.displayName ??
          current.displayName ??
          current.name,

        age:
          accountData.age ??
          current.age,

        ageGroup:
          accountData.ageGroup ??
          current.ageGroup,
      };
    });
  }  
  async function logout() {
    await dbLogout();
    setUser(null);
    setResourceFocusTopic(null);
    setActivityGuard(null);
    setPendingNavigation(null);
    setPage("home");
    writeHashPage("home", true);
  }
  function openRecommendedResource(topicCode) {
    setResourceFocusTopic(topicCode);
    go("resources");
  }
  function openAuth(mode = "login") {
    setAuthMode(mode);
    setResourceFocusTopic(null);
    go("login");
  }
  function completeNavigation(nextPage, replace = false) {
    if (nextPage !== "resources") setResourceFocusTopic(null);
    if (nextPage === "login") setAuthMode("login");
    const safePage = VALID_PAGES.has(nextPage) ? nextPage : "home";
    if (!user && PROTECTED_PAGES.has(safePage)) {
      setPage("home");
      writeHashPage("home", true);
      return;
    }
    setPage(safePage);
    writeHashPage(safePage, replace);
  }
  function go(nextPage, options = {}) {
    const safePage = VALID_PAGES.has(nextPage) ? nextPage : "home";
    if (activityGuard && safePage !== page && !options.bypassGuard) {
      setPendingNavigation({ page: safePage });
      return;
    }
    completeNavigation(safePage, options.replace);
  }
  const registerActivityGuard = useCallback((guard) => {
    setActivityGuard(guard);
    return () => {
      setActivityGuard(current => current === guard ? null : current);
    };
  }, []);
  function cancelPendingNavigation() {
    setPendingNavigation(null);
  }
  function confirmPendingNavigation() {
    const target = pendingNavigation?.page || "dashboard";
    setPendingNavigation(null);
    setActivityGuard(null);
    completeNavigation(target);
  }

  const ctx = {
    page,
    go,
    user,
    login,
    logout,
    authMode,
    setAuthMode,
    openAuth,
    updateProfile,
    updateAccount,
    resourceFocusTopic,
    openRecommendedResource,
    clearResourceFocus: () => setResourceFocusTopic(null),
    registerActivityGuard,
  };

  const PAGES = {
    home:      <HomePage />,
    dashboard: <DashboardPage />,
    assessment: <AssessmentPage />,
    scenarios: <ScenariosPage />,
    resources: <ResourcesPage />,
    "ai-chat": <AIChatPage />,
    about:     <AboutPage />,
    progress:  <ProgressPage />,
    profile:   <ProfilePage />,
    login:     <AuthGate />,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <ChatProvider user={user}>
        <style>{globalStyle}</style>
        <Navbar page={page} />
        <main className="page-wrap">
          {checkingSession ? (
            <div className="section">
              <p className="section-title">{t("app.loadingTitle")}</p>
              <p className="section-sub">{t("app.checkingSession")}</p>
            </div>
          ) : (PAGES[page] ?? <HomePage />)}
        </main>
        <Footer />
        {!checkingSession && <ChatWidget />}
        {pendingNavigation && activityGuard && (
          <ConfirmationDialog
            title={activityGuard.title}
            description={activityGuard.description}
            cancelLabel={t("common.continueActivity")}
            confirmLabel={t("common.leavePage")}
            onCancel={cancelPendingNavigation}
            onConfirm={confirmPendingNavigation}
            danger
          />
        )}
      </ChatProvider>
    </AppCtx.Provider>
  );
}
