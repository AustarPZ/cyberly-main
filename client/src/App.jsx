import { Fragment, useState, createContext, useContext, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { useTranslation } from "react-i18next";
import remarkGfm from "remark-gfm";
import "./design-system/tokens/cyberlyAurora.css";
import "./design-system/tokens/layout.css";
import "./design-system/foundation.css";
import "./resources/resources.css";
import "./cyberguard/cyberguardLayout.css";
import "./dashboard/dashboard.css";
import "./progress/progress.css";
import "./assessment/assessment.css";
import "./scenario/scenarios.css";
import "./profile/profile.css";
import "./home/home.css";
import "./auth/auth.css";
import CyberGuardWorkspaceHeader from "./cyberguard/CyberGuardWorkspaceHeader";
import CyberGuardAiNotice from "./cyberguard/CyberGuardAiNotice";
import CyberGuardChatShell from "./cyberguard/CyberGuardChatShell";
import CyberGuardEmptyState from "./cyberguard/CyberGuardEmptyState";
import CyberGuardQuickPrompts from "./cyberguard/CyberGuardQuickPrompts";
import CyberGuardComposerFrame from "./cyberguard/CyberGuardComposerFrame";
import CyberGuardAssistantMessage from "./cyberguard/CyberGuardAssistantMessage";
import Button from "./design-system/primitives/Button";
import AppShell from "./design-system/layout/AppShell";
import PageContainer from "./design-system/layout/PageContainer";
import PageSection from "./design-system/layout/PageSection";
import CompactHeader from "./design-system/headers/CompactHeader";
import ContextHeader from "./design-system/headers/ContextHeader";
import SectionNav from "./design-system/navigation/SectionNav";
import ExplorerHeroSurface from "./design-system/visual/ExplorerHeroSurface";
import DashboardExplorerVisual from "./dashboard/DashboardExplorerVisual";
import ProgressExplorerVisual from "./progress/ProgressExplorerVisual";
import AssessmentCheckpointVisual from "./assessment/AssessmentCheckpointVisual";
import ScenarioDecisionVisual from "./scenario/ScenarioDecisionVisual";
import PageIdentity from "./design-system/visual/PageIdentity";
import Surface from "./design-system/primitives/Surface";
import Badge from "./design-system/primitives/Badge";
import PageState from "./design-system/feedback/PageState";
import ResourceDetailDialog from "./resources/ResourceDetailDialog";
import profileMappings from "./profileMappings";
import i18n, { STORAGE_KEY as UI_LANGUAGE_STORAGE_KEY, getStoredUiLanguage} from "./i18n";
import { normalizeLocale, profileLanguageToLocale } from "./i18n/languageMappings";
import { maskEmailAddress } from "./utils/maskEmailAddress";
import {
  clearEmailVerificationResult,
  loadEmailVerificationResult,
  saveEmailVerificationResult,
} from "./utils/emailVerificationResultStorage";
import {
  login as loginAccount,
  logout as logoutSession,
  register as registerAccount,
  resendVerificationEmail,
  verifyEmail,
  restoreSession,
} from "./api/authApi";
import { saveAccount as saveAccountRequest } from "./api/accountApi";
import { saveProfile as saveProfileRequest } from "./api/profileApi";
import {
  createInitialAssessmentAttempt,
  getInitialAssessment,
  getInitialAssessmentStatus,
  saveAssessmentAnswer,
  submitAssessmentAttempt,
} from "./api/assessmentApi";
import { getProgress } from "./api/progressApi";
import {
  getCurrentRecommendation,
  markRecommendationCompleted,
  markRecommendationViewed,
} from "./api/recommendationApi";
import {
  completeScenarioAttempt,
  getRecommendedScenarios,
  getScenarioAttempt,
  getScenarioAttemptResult,
  getScenarioBySlug,
  getScenarioDashboard,
  listScenarios,
  saveScenarioDecision,
  startScenarioAttempt,
} from "./api/scenarioApi";
import { listResources } from "./api/resourceApi";
import {
  createChatConversation,
  createChatUserMessage,
  cancelLearnerActionProposal,
  confirmLearnerActionProposal,
  deleteChatConversation,
  generateChatAssistantReply,
  getChatConversation,
  listChatConversations,
  renameChatConversation,
  createLearnerActionProposal,
} from "./chat/chatApi";
import {
  buildAutomaticConversationTitle,
  isDefaultConversationTitle,
  MAX_CONVERSATION_TITLE_LENGTH,
  normalizeConversationTitle,
  shouldApplyAutomaticConversationTitleResult,
  shouldRequestAutomaticConversationTitle,
} from "./chat/chatTitle";
import {
  partitionPinnedConversations,
  readPinnedConversationIds,
  togglePinnedConversationId,
  writePinnedConversationIds,
} from "./chat/chatPinning";
import {
  partitionArchivedConversations,
  readArchivedConversationIds,
  toggleArchivedConversationId,
  writeArchivedConversationIds,
} from "./chat/chatArchiving";
import {
  downloadConversationExport,
  hasExportableMessages,
} from "./chat/chatExport";
import {
  attachActionGroupsToMessages,
  attachSourceGroupsToMessages,
  buildProposalPayloadForChatAction,
  buildRecommendedScenarioNavigation,
  consumeRecommendedScenarioTarget,
  dedupeActionsAgainstProposal,
  isScenarioHighlightMatch,
  parseScenarioHighlightTargetFromHash,
  readRecommendedScenarioTarget,
  resolveChatActionTarget,
  resolveChatSourceTarget,
  withMessageActions,
  withMessageProposal,
  withMessageSources,
} from "./chat/chatActions";
import AdminResourcePage from "./admin/AdminResourcePage";
import AdminResourceEditorPage from "./admin/AdminResourceEditorPage";
import AdminResourceCreatePage from "./admin/AdminResourceCreatePage";
import AdminResourceMetadataPage from "./admin/AdminResourceMetadataPage";
import AdminScenarioEditorPage from "./admin/AdminScenarioEditorPage";
import AdminScenarioPage from "./admin/AdminScenarioPage";
import AdminAiProvidersPage from "./admin/AdminAiProvidersPage";
import AdminWorkspace from "./admin/AdminWorkspace";
import { getAdminStatus } from "./admin/adminApi";
import { buildAdminHash, parseAdminRoute } from "./admin/adminRouteState";
import {
  ADMIN_SECTIONS,
  getAdminResourceEditorIdFromHash,
  getAdminResourceGovernanceIdFromHash,
  getAdminResourceMetadataIdFromHash,
  getAdminScenarioEditorIdFromHash,
  getAdminSectionFromHash,
  isAdminScenarioCreateRoute,
  isAdminResourceCreateRoute,
} from "./admin/adminSections";
import {
  createPendingAction,
  createPendingRouteTransition,
  normalizeHashRoute,
  resolveSessionRestoreHash,
  routeIdentityFromHash,
  shouldGuardAction,
  shouldBlockRouteTransition,
} from "./navigation/navigationGuardState";
import {
  getProgressSections,
  buildLearningPathSegments,
  formatLearningPathPoints,
  mapAssessmentTopicResult,
  normalizeLearningPathProgress,
  normalizeActivityComposition,
  normalizeRecentLearningActivity,
  PROGRESS_SECTION_IDS,
} from "./progress/progressSemantics";
import {
  buildResourceHeaderStats,
  getAchievementDefinitions,
  getLearningInterestStateKey,
} from "./product/productSemantics";
import cyberlyNavbarLogo from "./assets/Cyberly-navbar-logo-transparent.png";
import cyberlyAuthLogo from "./assets/CyberlyLogo-transparent.png";

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
  background: var(--surface-page);
  color: var(--text-primary);
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
  --color-brand-primary: #1D9E75;
  --color-brand-primary-hover: #15795c;
  --color-brand-soft: #E1F5EE;
  --color-brand-border: #8fd7c2;
  --surface-page: #f2f6f1;
  --surface-raised: #ffffff;
  --surface-muted: #f7faf7;
  --surface-subtle: #eef6f1;
  --surface-interactive: #e7f7f0;
  --surface-overlay: rgba(18, 30, 24, 0.46);
  --border-subtle: #e3ebe5;
  --border-default: #cfded6;
  --border-strong: #aebfb6;
  --border-focus: #1D9E75;
  --text-primary: #1d2a22;
  --text-secondary: #46554c;
  --text-muted: #647169;
  --text-on-brand: #ffffff;
  --status-success-surface: #e4f7ef;
  --status-success-border: #9bdac5;
  --status-warning-surface: #fff3df;
  --status-warning-border: #efc783;
  --status-danger-surface: #faece7;
  --status-danger-border: #e4a18a;
  --status-neutral-surface: #f1f4f1;
  --status-neutral-border: #d6dfd8;
  --shadow-card: 0 4px 14px rgba(24, 45, 35, 0.07);
  --shadow-raised: 0 10px 26px rgba(24, 45, 35, 0.1);
  --shadow-dialog: 0 22px 60px rgba(18, 30, 24, 0.25);
}

/* ── Navbar ── */
.navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 100;
  height: var(--nav-h);
  background: rgba(255, 255, 255, 0.96);
  border-bottom: 1px solid var(--border-default);
  box-shadow: 0 2px 12px rgba(24, 45, 35, 0.06);
  display: flex; align-items: center; gap: 1.25rem;
  padding: 0 1.5rem;
}
.navbar.cyberguard-nav-flow {
  position: static;
  height: auto;
  min-height: var(--nav-h);
  flex-wrap: wrap;
}
.nav-logo {
  display: flex; align-items: center; justify-content: center;
  background: none; border: none; cursor: pointer; flex: 0 0 auto;
  padding: 0.2rem 0.15rem; border-radius: 8px;
  max-width: min(220px, 34vw);
}
.nav-logo:hover, .nav-logo:focus-visible { background: var(--teal-lt); outline: none; }
.navbar-logo {
  display: block;
  width: auto;
  height: 48px;
  max-width: 100%;
  object-fit: contain;
}
.nav-primary { display: flex; align-items: center; gap: 0.25rem; flex: 0 1 auto; min-width: 0; }
.nav-utility { margin-left: auto; display: flex; align-items: center; gap: 0.7rem; flex: 0 0 auto; }
.nav-divider { width: 1px; height: 28px; background: rgba(0,0,0,0.1); }
.desktop-auth-actions { display: flex; gap: 0.5rem; align-items: center; }
.mobile-menu-wrap { display: none; position: relative; }
.mobile-menu-button {
  width: 40px; height: 40px; border: 1px solid var(--border-default); border-radius: 10px;
  background: var(--surface-raised); cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  color: var(--text-primary); font-size: 1.15rem;
}
.mobile-menu-button:hover,
.mobile-menu-button:focus-visible,
.mobile-menu-button.open {
  background: var(--teal-lt); border-color: rgba(29,158,117,0.35); outline: 2px solid transparent;
}
.mobile-menu-button:focus-visible { box-shadow: 0 0 0 3px rgba(29,158,117,0.25); }
.mobile-menu-panel {
  position: fixed; top: calc(var(--nav-h) + 0.5rem); left: 1rem; right: 1rem; z-index: 150;
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 12px;
  box-shadow: var(--shadow-raised); padding: 0.55rem;
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
  color: var(--text-secondary); padding: 0.4rem 0.75rem; border-radius: 8px;
  white-space: nowrap;
}
.nav-link:hover, .nav-link:focus-visible { background: var(--surface-subtle); outline: none; box-shadow: inset 0 0 0 2px rgba(29,158,117,0.2); }
.nav-link.active { color: var(--color-brand-primary); font-weight: 600; background: var(--surface-interactive); box-shadow: inset 0 -2px 0 var(--color-brand-primary); }
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
  border: 1px solid var(--border-default); background: var(--surface-raised); border-radius: 8px;
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
  border: 1px solid var(--border-default); background: var(--surface-raised); border-radius: 999px; cursor: pointer;
  display: flex; align-items: center; gap: 0.5rem; padding: 0.25rem 0.45rem 0.25rem 0.25rem;
  font-family: 'DM Sans', sans-serif; color: #333;
}
.account-trigger:hover, .account-trigger:focus-visible, .account-trigger.open { background: var(--surface-subtle); outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.18); }
.account-name { max-width: 150px; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 0.85rem; font-weight: 600; }
.account-chevron { font-size: 0.75rem; color: #777; }
.account-dropdown {
  position: absolute; top: calc(100% + 0.6rem); right: 0; width: min(240px, calc(100vw - 2rem)); z-index: 160;
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 10px;
  box-shadow: var(--shadow-raised); padding: 0.5rem;
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
  position: fixed; inset: 0; z-index: 200; background: var(--surface-overlay);
  display: flex; align-items: center; justify-content: center; padding: 1.5rem;
}
.logout-modal {
  width: min(420px, 100%); background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 12px; padding: 1.4rem;
  box-shadow: var(--shadow-dialog);
}
.logout-modal h2 { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; margin-bottom: 0.45rem; }
.logout-modal p { color: var(--text-secondary); font-size: 0.92rem; line-height: 1.6; margin-bottom: 1.2rem; }
.logout-modal-actions { display: flex; justify-content: flex-end; gap: 0.65rem; }
.modal-cancel, .modal-confirm {
  border: none; border-radius: 9px; padding: 0.6rem 1rem; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-weight: 700; font-size: 0.88rem;
}
.modal-cancel { background: var(--gray-lt); color: #333; }
.modal-confirm { background: var(--coral); color: #fff; }
.modal-cancel:hover, .modal-cancel:focus-visible, .modal-confirm:hover, .modal-confirm:focus-visible { opacity: 0.9; outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.2); }
.logout-modal.admin-dialog {
  border-color: var(--admin-border-default);
  box-shadow: var(--admin-shadow-dialog);
}
.logout-modal.admin-dialog h2 { color: var(--admin-text-primary); }
.logout-modal.admin-dialog p { color: var(--admin-text-secondary); }
.logout-modal.admin-dialog .modal-cancel {
  background: var(--admin-surface-muted);
  color: var(--admin-text-primary);
  border: 1px solid var(--admin-border-default);
}
.logout-modal.admin-dialog .modal-confirm {
  background: var(--admin-brand-primary);
  color: var(--admin-text-on-brand);
}
.logout-modal.admin-dialog .modal-cancel:hover,
.logout-modal.admin-dialog .modal-cancel:focus-visible,
.logout-modal.admin-dialog .modal-confirm:hover,
.logout-modal.admin-dialog .modal-confirm:focus-visible {
  opacity: 1;
  box-shadow: 0 0 0 3px rgba(86,101,122,0.2);
}

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
  .nav-logo { max-width: min(160px, 42vw); }
  .navbar-logo { height: 36px; }
  .auth-logo-image { height: 96px; max-width: 82%; }
  .account-name { display: none; }
  .account-trigger { gap: 0.25rem; padding-right: 0.35rem; }
  .nav-language select { max-width: 72px; font-size: 0.78rem; }
}

/* ── Layout ── */
.page-wrap { margin-top: var(--nav-h); min-height: calc(100vh - var(--nav-h)); }
.page-wrap.cyberguard-page-wrap {
  margin-top: 0;
  min-height: calc(100vh - var(--nav-h));
  min-height: calc(100dvh - var(--nav-h));
  height: auto;
  overflow: visible;
}

/* ── Sections ── */
.section { max-width: 1000px; margin: 0 auto; padding: 3rem 1.5rem; }
.section-title {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.75rem; font-weight: 600;
  margin-bottom: 0.5rem;
}
.section-sub { color: var(--text-secondary); font-size: 1rem; margin-bottom: 2rem; }

/* ── Cards ── */
.card {
  background: var(--surface-raised); border-radius: 14px; border: 1px solid var(--border-default);
  padding: 1.5rem; box-shadow: var(--shadow-card);
}
.card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1rem; }
.admin-theme {
  --admin-brand-primary: #56657A;
  --admin-brand-primary-hover: #445267;
  --admin-brand-primary-active: #39475A;
  --admin-brand-soft: #E8EDF2;
  --admin-brand-subtle: #F0F3F6;
  --admin-brand-border: #A9B4C0;
  --admin-surface-page: #E8EDF3;
  --admin-workspace-canvas: #EDF1F5;
  --admin-surface-raised: #FFFFFF;
  --admin-surface-muted: #F4F6F8;
  --admin-surface-subtle: #F7F8FA;
  --admin-surface-interactive: #E8EDF2;
  --admin-border-subtle: #D9E0E7;
  --admin-border-default: #B9C4CF;
  --admin-border-strong: #98A6B5;
  --admin-border-focus: #56657A;
  --admin-text-primary: #202A35;
  --admin-text-secondary: #66727F;
  --admin-text-muted: #7C8793;
  --admin-text-on-brand: #FFFFFF;
  --admin-shadow-card: 0 6px 20px rgba(32, 42, 53, 0.07);
  --admin-shadow-raised: 0 10px 30px rgba(32, 42, 53, 0.10);
  --admin-shadow-dialog: 0 18px 48px rgba(32, 42, 53, 0.18);
  --surface-raised: var(--admin-surface-raised);
  --surface-muted: var(--admin-surface-muted);
  --surface-subtle: var(--admin-surface-subtle);
  --surface-interactive: var(--admin-surface-interactive);
  --border-default: var(--admin-border-default);
  --color-brand-border: var(--admin-brand-border);
  --color-brand-primary: var(--admin-brand-primary);
  --text-primary: var(--admin-text-primary);
  --text-secondary: var(--admin-text-secondary);
  --text-muted: var(--admin-text-muted);
  --shadow-card: var(--admin-shadow-card);
}
.admin-workspace {
  width: min(1760px, 96vw); margin: 0 auto; padding: 1.25rem 0 2rem;
  display: grid; grid-template-columns: minmax(220px, 248px) minmax(0, 1fr); gap: 1rem;
}
.admin-theme.admin-workspace {
  background: var(--admin-workspace-canvas);
  border-radius: 18px;
  padding: 1.25rem;
}
.admin-workspace-sidebar {
  position: sticky; top: calc(var(--nav-h) + 1rem); align-self: start;
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 14px;
  padding: 1rem; box-shadow: var(--shadow-card);
}
.admin-theme .admin-workspace-sidebar {
  background: linear-gradient(180deg, var(--admin-brand-subtle), var(--admin-surface-raised));
  border-color: var(--admin-border-default);
}
.admin-workspace-sidebar-heading { display: grid; gap: 0.35rem; margin-bottom: 1rem; }
.admin-workspace-sidebar-heading h2 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.08rem; color: var(--text-primary);
}
.admin-workspace-sidebar-heading p:last-child { color: var(--text-muted); font-size: 0.84rem; line-height: 1.45; }
.admin-section-nav { display: grid; gap: 0.35rem; }
.admin-section-nav-item {
  width: 100%; min-height: 44px; border: 1px solid transparent; border-radius: 10px;
  background: transparent; color: var(--text-secondary); cursor: pointer; text-align: left;
  padding: 0.65rem 0.7rem; font-family: 'DM Sans', sans-serif; font-weight: 800;
  display: grid; gap: 0.15rem; white-space: normal;
}
.admin-section-nav-item:hover, .admin-section-nav-item:focus-visible {
  background: var(--surface-interactive); border-color: var(--color-brand-border); outline: none;
  box-shadow: 0 0 0 3px rgba(29,158,117,0.13);
}
.admin-theme .admin-section-nav-item:hover,
.admin-theme .admin-section-nav-item:focus-visible {
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
.admin-section-nav-item.active {
  background: var(--surface-interactive); border-color: var(--color-brand-border);
  box-shadow: inset 4px 0 0 var(--color-brand-primary); color: #14684f;
}
.admin-theme .admin-section-nav-item.active {
  color: var(--admin-brand-primary-active);
  box-shadow: inset 4px 0 0 var(--admin-brand-primary);
}
.admin-section-nav-item.disabled {
  cursor: not-allowed; opacity: 0.78; background: var(--surface-muted); color: var(--text-muted);
}
.admin-section-nav-item small { font-size: 0.72rem; color: #77827d; font-weight: 700; }
.admin-workspace-main { min-width: 0; display: grid; gap: 1rem; align-content: start; }
.admin-workspace-main-header {
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 14px; padding: 1.15rem 1.25rem;
  box-shadow: var(--shadow-card); display: flex; align-items: flex-start;
  justify-content: space-between; gap: 1rem; min-width: 0;
}
.admin-workspace-main-header h1 {
  font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.35rem, 2vw, 1.85rem); margin-bottom: 0.35rem;
}
.admin-workspace-main-header p:last-child { color: var(--text-muted); line-height: 1.55; max-width: 76ch; }
.admin-workspace-status {
  flex: 0 0 auto; min-width: 160px; border: 1px solid var(--border-default); border-radius: 10px;
  padding: 0.65rem 0.75rem; background: var(--surface-muted); display: grid; gap: 0.15rem;
}
.admin-workspace-status strong { color: #14684f; text-transform: capitalize; }
.admin-workspace-status span { color: #5c6a61; font-size: 0.82rem; line-height: 1.35; }
.admin-theme .admin-workspace-status strong { color: var(--admin-brand-primary-active); }
.admin-theme .admin-workspace-status span { color: var(--admin-text-secondary); }
.admin-workspace-content {
  min-width: 0; background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 14px;
  padding: 1.15rem; box-shadow: var(--shadow-card);
}
.admin-theme .admin-workspace-content {
  background: transparent;
  border: 0;
  box-shadow: none;
  padding: 0;
}
.admin-resource-governance { display: grid; gap: 1rem; min-width: 0; }
.admin-theme .admin-workspace-main-header,
.admin-theme .admin-resource-header,
.admin-theme .admin-resource-summary,
.admin-theme .admin-resource-filters,
.admin-theme .admin-resource-table-wrap,
.admin-theme .admin-resource-editor-toolbar,
.admin-theme .admin-resource-action-header,
.admin-theme .admin-resource-create-preview,
.admin-theme .admin-resource-content-form,
.admin-theme .admin-resource-next-steps,
.admin-theme .admin-resource-editor-identity {
  background: var(--admin-surface-raised);
  border-color: var(--admin-border-default);
  box-shadow: var(--admin-shadow-card);
}
.admin-theme .admin-resource-header,
.admin-theme .admin-resource-summary,
.admin-theme .admin-resource-filters,
.admin-theme .admin-resource-editor-toolbar {
  border: 1px solid var(--admin-border-default);
  border-radius: 12px;
  padding: 1rem;
}
.admin-resource-header h2 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.2rem; margin-bottom: 0.35rem;
}
.admin-resource-header p:last-child { color: var(--text-secondary); line-height: 1.55; max-width: 70ch; font-size: 0.92rem; }
.admin-resource-summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.7rem; }
.admin-resource-metric {
  border: 1px solid var(--border-default); border-radius: 8px; padding: 0.8rem; background: var(--surface-muted);
}
.admin-resource-metric p { color: #5c6a61; font-size: 0.82rem; line-height: 1.25; margin-bottom: 0.3rem; }
.admin-resource-metric strong { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; color: #1f3328; }
.admin-resource-filters {
  display: grid; grid-template-columns: minmax(190px, 1.5fr) repeat(3, minmax(140px, 1fr)) auto;
  gap: 0.7rem; align-items: end;
}
.admin-resource-filters label, .admin-resource-form label {
  display: grid; gap: 0.3rem; font-size: 0.8rem; font-weight: 700; color: var(--text-secondary);
}
.admin-resource-filters input, .admin-resource-filters select,
.admin-resource-form input, .admin-resource-form select, .admin-resource-form textarea {
  width: 100%; border: 1.5px solid var(--border-default); border-radius: 10px;
  padding: 0.62rem 0.75rem; font: inherit; background: var(--surface-raised); color: var(--text-primary);
}
.admin-resource-filters input:focus, .admin-resource-filters select:focus,
.admin-resource-form input:focus, .admin-resource-form select:focus, .admin-resource-form textarea:focus {
  border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(29,158,117,0.14); outline: none;
}
.admin-resource-form input[aria-invalid="true"],
.admin-resource-form select[aria-invalid="true"],
.admin-resource-form textarea[aria-invalid="true"] {
  border-color: var(--status-danger-border);
  box-shadow: 0 0 0 3px rgba(218,82,70,0.12);
}
.admin-theme .admin-resource-filters input:focus,
.admin-theme .admin-resource-filters select:focus,
.admin-theme .admin-resource-form input:focus,
.admin-theme .admin-resource-form select:focus,
.admin-theme .admin-resource-form textarea:focus {
  border-color: var(--admin-border-focus);
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
.admin-resource-table-wrap {
  overflow-x: auto; border: 1px solid var(--border-default); border-radius: 10px;
  max-width: 100%; scrollbar-gutter: stable;
}
.admin-resource-table-wrap:focus-within { box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
.admin-theme .admin-resource-table-wrap:focus-within { box-shadow: 0 0 0 3px rgba(86,101,122,0.14); }
.admin-resource-table { width: 100%; min-width: 980px; border-collapse: collapse; font-size: 0.88rem; table-layout: auto; }
.admin-resource-table th, .admin-resource-table td { padding: 0.75rem; border-bottom: 1px solid var(--border-subtle); text-align: left; vertical-align: top; }
.admin-resource-table th { background: var(--surface-muted); color: var(--text-secondary); font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.04em; }
.admin-resource-table tbody tr:hover { background: var(--surface-muted); }
.admin-theme .admin-resource-table tbody tr:hover { background: var(--admin-brand-subtle); }
.admin-resource-table th:nth-child(3), .admin-resource-table th:nth-child(4), .admin-resource-table th:nth-child(5),
.admin-resource-table td:nth-child(3), .admin-resource-table td:nth-child(4), .admin-resource-table td:nth-child(5) {
  width: 136px; white-space: nowrap;
}
.admin-resource-table th:nth-child(6), .admin-resource-table td:nth-child(6) { width: 168px; white-space: nowrap; }
.admin-resource-table th:nth-child(7), .admin-resource-table td:nth-child(7) { width: 112px; white-space: nowrap; }
.admin-resource-table td strong { display: block; color: #1f3328; }
.admin-resource-table td span { display: block; color: #66726b; font-size: 0.8rem; margin-top: 0.15rem; }
.admin-theme .admin-resource-table td strong { color: var(--admin-text-primary); }
.admin-theme .admin-resource-table td span,
.admin-theme .admin-resource-state,
.admin-theme .admin-resource-pagination,
.admin-theme .admin-resource-summary-note { color: var(--admin-text-secondary); }
.admin-resource-table .btn-secondary { white-space: nowrap; }
.admin-resource-row-actions { display: flex; gap: 0.45rem; flex-wrap: wrap; align-items: center; }
.admin-status-badge {
  display: inline-flex; align-items: center; min-height: 26px; border-radius: 999px;
  padding: 0.2rem 0.55rem; background: var(--status-neutral-surface); border: 1px solid var(--status-neutral-border); color: #4c5852; font-size: 0.76rem; font-weight: 800;
  white-space: nowrap; word-break: keep-all;
}
.admin-status-badge.good { background: var(--status-success-surface); border-color: var(--status-success-border); color: #14684f; }
.admin-status-badge.warn { background: var(--status-warning-surface); border-color: var(--status-warning-border); color: #7a4a14; }
.admin-status-badge.danger { background: var(--status-danger-surface); border-color: var(--status-danger-border); color: #8a3e25; }
.admin-status-badge.publication-published { background: #e7f0ff; border-color: #8fb4ef; color: #17437a; }
.admin-status-badge.publication-draft { background: #edf2f7; border-color: #9aa9ba; color: #263545; }
.admin-status-badge.publication-archived { background: #c8c8c8; border-color: #aaa0bd; color: #3d344d; }
.admin-status-badge.review-draft { background: #fff6df; border-color: #e7b85e; color: #6c4109; }
.admin-status-badge.review-needs_review { background: #fff0d8; border-color: #ef9d38; color: #7b3d00; }
.admin-status-badge.review-approved { background: #e4f7ef; border-color: #73c7a9; color: #0d5d44; }
.admin-status-badge.review-rejected { background: #fae8e6; border-color: #d98c83; color: #7a2f2a; }
.admin-status-badge.cyberguard-enabled { background: #ddf7f1; border-color: #64c6b3; color: #075c52; }
.admin-status-badge.cyberguard-disabled { background: #eef1f4; border-color: #aab3bd; color: #2e3946; }
.admin-resource-state, .admin-resource-pagination { color: #5c6a61; font-size: 0.9rem; line-height: 1.5; }
.admin-resource-summary-note { color: #66726b; font-size: 0.82rem; line-height: 1.45; margin-top: -0.35rem; }
.admin-ai-page { display: grid; gap: 1rem; }
.admin-ai-hero,
.admin-ai-cost-note,
.admin-ai-panel,
.admin-ai-provider-card {
  background: var(--surface-card);
  border: 1px solid var(--border-subtle);
  border-radius: 14px;
  box-shadow: var(--shadow-sm);
}
.admin-theme .admin-ai-hero,
.admin-theme .admin-ai-cost-note,
.admin-theme .admin-ai-panel,
.admin-theme .admin-ai-provider-card {
  background: var(--admin-surface-panel);
  border-color: var(--admin-border-subtle);
}
.admin-ai-hero {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem;
}
.admin-ai-hero h2,
.admin-ai-panel h3,
.admin-ai-provider-card h3 { color: var(--admin-text-primary); }
.admin-ai-hero p:last-child,
.admin-ai-panel,
.admin-ai-provider-card,
.admin-ai-cost-note { color: var(--admin-text-secondary); line-height: 1.5; }
.admin-ai-cost-note {
  display: flex;
  gap: 0.55rem;
  align-items: center;
  padding: 0.8rem 1rem;
  background: #f4f7fb;
}
.admin-ai-cost-note strong { color: var(--admin-text-primary); }
.admin-ai-provider-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(245px, 1fr));
  gap: 0.9rem;
}
.admin-ai-provider-card {
  display: grid;
  gap: 0.8rem;
  padding: 1rem;
  align-content: start;
}
.admin-ai-provider-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.8rem;
}
.admin-ai-provider-statuses {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.35rem;
}
.admin-ai-provider-meta {
  display: grid;
  gap: 0.4rem;
  margin: 0;
}
.admin-ai-provider-meta div,
.admin-ai-runtime-summary div,
.admin-ai-runtime-details div,
.admin-ai-purpose-list div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  border-top: 1px solid var(--admin-border-subtle);
  padding-top: 0.55rem;
}
.admin-ai-provider-meta dt,
.admin-ai-runtime-summary dt,
.admin-ai-runtime-details dt,
.admin-ai-purpose-list dt { color: var(--admin-text-secondary); font-size: 0.82rem; }
.admin-ai-provider-meta dd,
.admin-ai-runtime-summary dd,
.admin-ai-runtime-details dd,
.admin-ai-purpose-list dd { color: var(--admin-text-primary); font-weight: 700; text-align: right; }
.admin-ai-capability-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}
.admin-ai-capability-list span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 1px solid var(--admin-border-subtle);
  border-radius: 999px;
  padding: 0.28rem 0.55rem;
  font-size: 0.78rem;
  background: #f7f9fb;
  color: var(--admin-text-secondary);
}
.admin-ai-capability-list span.implemented strong { color: #17437a; }
.admin-ai-capability-list span.not-implemented { opacity: 0.72; }
.admin-ai-purpose-note { color: var(--admin-text-secondary); font-size: 0.84rem; line-height: 1.4; }
.admin-ai-runtime-summary,
.admin-ai-runtime-details {
  display: grid;
  gap: 0.4rem;
  margin: 0;
}
.admin-ai-runtime-summary {
  border-radius: 10px;
  background: #f8fafc;
  border: 1px solid var(--admin-border-subtle);
  padding: 0.65rem;
}
.admin-ai-runtime-details {
  margin-top: 0.35rem;
}
.admin-ai-test-result {
  display: grid;
  gap: 0.25rem;
  border-radius: 10px;
  border: 1px solid var(--border-subtle);
  padding: 0.7rem;
  font-size: 0.84rem;
}
.admin-ai-test-result.success { background: #eef8f3; border-color: #9fd5bd; }
.admin-ai-test-result.failed { background: #fff3ed; border-color: #e1a181; }
.admin-ai-test-result strong { color: var(--admin-text-primary); }
.admin-ai-test-result small {
  color: var(--admin-text-secondary);
  overflow-wrap: anywhere;
}
.admin-ai-panel {
  padding: 1rem;
  display: grid;
  gap: 0.7rem;
}
.admin-ai-purpose-list {
  display: grid;
  gap: 0.55rem;
  margin: 0;
}
.admin-ai-safety-list {
  display: grid;
  gap: 0.45rem;
  padding-left: 1.2rem;
  color: var(--admin-text-secondary);
}
.admin-ai-tool-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.75rem;
}
.admin-ai-tool-card {
  border: 1px solid var(--admin-border-default, var(--border-subtle));
  border-radius: 8px;
  padding: 0.85rem;
  background: var(--surface-raised);
  display: grid;
  gap: 0.55rem;
}
.admin-ai-tool-card h4 {
  margin: 0;
  color: var(--admin-text-primary);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}
.admin-ai-tool-card p {
  margin: 0;
  color: var(--admin-text-secondary);
  font-size: 0.86rem;
  line-height: 1.45;
}
.admin-ai-tool-card dl {
  display: grid;
  gap: 0.35rem;
  margin: 0;
}
.admin-ai-tool-card dl div {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  font-size: 0.82rem;
}
.admin-ai-tool-card dt { color: var(--admin-text-secondary); }
.admin-ai-tool-card dd {
  margin: 0;
  color: var(--admin-text-primary);
  font-weight: 700;
  text-align: right;
}
.admin-ai-trace-filters,
.admin-ai-trace-pagination {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.7rem;
}
.admin-ai-trace-filters label {
  display: grid;
  gap: 0.25rem;
  min-width: min(220px, 100%);
  color: var(--admin-text-secondary);
  font-size: 0.84rem;
}
.admin-ai-trace-filters select {
  min-height: 44px;
  border: 1px solid var(--admin-border-default, var(--border-subtle));
  border-radius: 8px;
  padding: 0.55rem 0.7rem;
  background: var(--surface-raised);
  color: var(--admin-text-primary);
}
.admin-ai-trace-list {
  display: grid;
  gap: 0.45rem;
  overflow-x: auto;
}
.admin-ai-trace-row {
  display: grid;
  grid-template-columns: minmax(130px, 0.9fr) minmax(120px, 0.8fr) minmax(110px, 0.8fr) minmax(160px, 1.1fr) minmax(140px, 1fr) minmax(110px, auto);
  gap: 0.55rem;
  align-items: center;
  padding: 0.65rem;
  border: 1px solid var(--admin-border-subtle, var(--border-subtle));
  border-radius: 8px;
  background: var(--surface-raised);
  min-width: 820px;
}
.admin-ai-trace-row.heading {
  background: transparent;
  color: var(--admin-text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}
.admin-ai-trace-row span {
  overflow-wrap: anywhere;
}
.admin-ai-trace-detail {
  border: 1px solid var(--admin-border-default, var(--border-subtle));
  border-radius: 8px;
  padding: 0.85rem;
  background: var(--surface-subtle);
  display: grid;
  gap: 0.7rem;
}
.admin-ai-trace-timeline {
  display: grid;
  gap: 0.4rem;
  padding-left: 1.2rem;
  margin: 0;
}
.admin-ai-trace-timeline li {
  color: var(--admin-text-secondary);
}
.admin-ai-trace-timeline strong {
  color: var(--admin-text-primary);
  margin-right: 0.5rem;
}
.admin-resource-drawer-backdrop {
  position: fixed; inset: 0; z-index: 220; background: rgba(18, 30, 24, 0.35);
  display: flex; justify-content: flex-end;
}
.admin-theme .admin-resource-drawer-backdrop { background: rgba(32, 42, 53, 0.34); }
.admin-resource-drawer {
  width: min(520px, 100vw); height: 100%; overflow-y: auto; background: var(--surface-raised);
  box-shadow: -12px 0 30px rgba(0,0,0,0.16); padding: 1.25rem;
}
.admin-theme .admin-resource-drawer {
  border-left: 1px solid var(--admin-border-default);
  box-shadow: -12px 0 32px rgba(32,42,53,0.16);
}
.admin-resource-drawer-head {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
  border-bottom: 1px solid #e4ece7; padding-bottom: 1rem; margin-bottom: 1rem;
}
.admin-resource-drawer-head h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; line-height: 1.2; }
.admin-resource-drawer-body { display: grid; gap: 1.05rem; }
.admin-resource-drawer-top-actions {
  display: flex; justify-content: flex-end; align-items: center; gap: 0.6rem; flex-wrap: wrap;
}
.admin-resource-drawer-body section {
  border: 1.5px solid var(--border-default); border-radius: 10px; padding: 0.95rem;
  display: grid; gap: 0.5rem; background: var(--surface-muted);
}
.admin-resource-drawer-body h4 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: #1f3328;
  padding-bottom: 0.35rem; border-bottom: 1px solid #dfe8e3;
}
.admin-resource-drawer-body p, .admin-resource-drawer-body li {
  color: #5c6a61; font-size: 0.88rem; line-height: 1.5;
}
.admin-resource-drawer-body ul { padding-left: 1.1rem; }
.admin-resource-form { background: var(--surface-subtle) !important; border-color: var(--color-brand-border) !important; }
.admin-theme .admin-resource-form,
.admin-theme .admin-resource-drawer-body section {
  background: var(--admin-surface-muted) !important;
  border-color: var(--admin-border-default) !important;
}
.admin-resource-checkbox { grid-template-columns: auto 1fr; align-items: center; justify-content: start; }
.admin-resource-checkbox input { width: auto; min-width: 18px; min-height: 18px; }
.admin-resource-create,
.admin-resource-metadata {
  display: grid; gap: 1rem; min-width: 0;
}
.admin-resource-create-grid {
  display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(300px, 0.65fr); gap: 1rem; align-items: start;
}
.admin-resource-create-form,
.admin-resource-create-preview {
  display: grid; gap: 1rem; min-width: 0;
}
.admin-resource-form section { display: grid; gap: 0.75rem; }
.admin-resource-form h3,
.admin-resource-create-preview h3 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: #1f3328;
}
.admin-theme .admin-resource-form h3,
.admin-theme .admin-resource-create-preview h3,
.admin-theme .admin-resource-drawer-head h3,
.admin-theme .admin-resource-drawer-body h4 { color: var(--admin-text-primary); }
.admin-resource-form-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.75rem;
}
.admin-resource-form-grid.three { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.admin-resource-form-grid input, .admin-resource-form-grid select { min-width: 0; }
.admin-resource-form-action { align-self: end; display: grid; gap: 0.3rem; }
.admin-resource-form-action small,
.admin-resource-form label small {
  color: var(--text-muted); font-size: 0.76rem; line-height: 1.35;
}
.admin-resource-source-form { display: grid; gap: 1rem; }
.admin-resource-source-actions { display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; }
.admin-resource-source-missing { color: var(--text-muted); font-size: 0.84rem; font-weight: 700; }
.admin-resource-warning {
  color: #7a4a14; background: var(--status-warning-surface); border: 1px solid var(--status-warning-border);
  border-radius: 9px; padding: 0.65rem 0.75rem; font-size: 0.84rem; line-height: 1.45;
}
.admin-resource-checkbox-stack { display: grid; gap: 0.55rem; align-content: center; }
.admin-resource-create-actions,
.admin-resource-toolbar-actions {
  display: flex; gap: 0.65rem; flex-wrap: wrap; align-items: center; justify-content: flex-end;
}
.admin-resource-next-steps {
  border: 1px solid var(--border-default); border-radius: 12px; padding: 1rem; background: var(--surface-muted);
}
.admin-resource-next-steps ul { margin: 0.55rem 0 0; padding-left: 1.1rem; color: var(--text-secondary); line-height: 1.6; }
.admin-resource-success {
  color: #14684f; background: var(--teal-lt); border: 1px solid rgba(29,158,117,0.24);
  border-radius: 9px; padding: 0.65rem 0.75rem; font-size: 0.86rem; font-weight: 700;
}
.admin-resource-drawer-actions { display: flex; justify-content: flex-end; gap: 0.7rem; padding-bottom: 1rem; }
.admin-quick-review-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 42px;
  gap: 0.65rem;
  align-items: stretch;
}
.admin-quick-review-edit {
  width: 100%;
  min-height: 42px;
}
.admin-lifecycle-trigger.admin-quick-review-lifecycle {
  margin-left: 0;
  width: 42px;
  min-width: 42px;
}
.admin-resource-rag-doc { font-size: 0.8rem !important; background: var(--surface-muted); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 0.45rem 0.55rem; }
.admin-resource-editor { display: grid; gap: 1rem; min-width: 0; }
.admin-resource-editor-toolbar {
  display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
}
.admin-scenario-editor-header {
  border: 1px solid var(--admin-border-default); border-radius: 12px; padding: 0.9rem 1rem;
  background: var(--admin-surface-raised); box-shadow: var(--admin-shadow-card);
  display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}
.admin-scenario-editor-header-main,
.admin-scenario-editor-header-actions {
  display: flex; align-items: center; gap: 0.65rem; flex-wrap: wrap; min-width: 0;
}
.admin-scenario-editor-header-main h2 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.08rem; color: var(--admin-text-primary);
}
.admin-scenario-back-button { min-height: 40px; }
.admin-scenario-editor-tabs {
  display: inline-flex; flex-wrap: wrap; gap: 0.4rem;
}
.admin-scenario-editor-tabs button {
  min-height: 40px; border: 1px solid var(--admin-border-default); border-radius: 10px;
  background: var(--admin-surface-muted); color: var(--admin-text-secondary); cursor: pointer;
  padding: 0.5rem 0.75rem; font: inherit; font-weight: 800;
}
.admin-scenario-editor-tabs button:hover,
.admin-scenario-editor-tabs button:focus-visible {
  border-color: var(--admin-brand-border); background: var(--admin-brand-subtle); outline: none;
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
.admin-scenario-editor-tabs button.active,
.admin-scenario-editor-tabs button[aria-selected="true"] {
  background: var(--admin-brand-soft); color: var(--admin-brand-primary-active); border-color: var(--admin-brand-border);
  box-shadow: inset 0 -3px 0 var(--admin-brand-primary);
}
.admin-scenario-lifecycle-actions {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap;
}
.admin-scenario-create-grid.creating {
  grid-template-columns: minmax(0, 1fr);
}
.admin-scenario-create-grid.preview-only {
  grid-template-columns: minmax(0, 1fr);
  width: 100%;
  display: flex;
  justify-content: center;
}
.admin-scenario-create-grid.preview-only .admin-scenario-create-form {
  display: none;
}
.admin-scenario-create-grid.preview-only .admin-scenario-create-preview {
  width: min(100%, 900px);
}
.admin-scenario-create-grid.creating .admin-scenario-create-preview {
  width: 100%;
}
.admin-scenario-create-form .admin-resource-form {
  display: grid;
  gap: 0.9rem;
}
.admin-scenario-section-heading {
  margin-top: 0.35rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--admin-border-subtle);
}
.admin-scenario-create-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  padding-top: 0.3rem;
}
.admin-scenario-completeness {
  border: 1px solid var(--admin-border-subtle);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  background: var(--admin-surface-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem 0.75rem;
  align-items: center;
  color: var(--admin-text-secondary);
  font-size: 0.86rem;
}
.admin-scenario-completeness strong {
  color: var(--admin-text-primary);
}
.admin-scenario-structure-badge {
  display: inline-flex !important;
  width: fit-content;
  margin-top: 0.35rem !important;
  border-radius: 999px;
  padding: 0.18rem 0.5rem;
  font-size: 0.72rem !important;
  font-weight: 800;
  border: 1px solid var(--admin-border-subtle);
}
.admin-scenario-structure-badge.ready {
  color: #14684f !important;
  background: var(--teal-lt);
  border-color: rgba(29,158,117,0.22);
}
.admin-scenario-structure-badge.needs-work {
  color: #7a4a14 !important;
  background: var(--status-warning-surface);
  border-color: var(--status-warning-border);
}
.admin-scenario-preview-metadata {
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
  margin-top: 0.7rem;
}
.admin-scenario-preview-metadata span {
  border: 1px solid var(--admin-border-subtle);
  border-radius: 999px;
  background: var(--admin-surface-muted);
  color: var(--admin-text-secondary);
  font-size: 0.78rem;
  font-weight: 800;
  padding: 0.24rem 0.55rem;
}
.admin-scenario-preview-progress {
  display: grid;
  gap: 0.35rem;
  color: var(--admin-text-secondary);
  font-size: 0.84rem;
  font-weight: 800;
}
.admin-scenario-preview-progress progress {
  width: 100%;
  height: 10px;
  accent-color: var(--admin-brand-primary);
}
.admin-scenario-learner-preview-card {
  display: grid;
  gap: 0.75rem;
  border: 1px solid var(--admin-border-default);
  border-radius: 12px;
  padding: 1rem;
  background: var(--admin-surface-raised);
}
.admin-scenario-learner-preview-card h4 {
  font-family: 'Space Grotesk', sans-serif;
  color: var(--admin-text-primary);
  font-size: 1.05rem;
}
.admin-scenario-learner-preview-card p {
  color: var(--admin-text-secondary);
  line-height: 1.55;
}
.admin-scenario-preview-choices {
  display: grid;
  gap: 0.55rem;
}
.admin-scenario-preview-choices button {
  width: 100%;
  min-height: 44px;
  border: 1px solid var(--admin-border-default);
  border-radius: 10px;
  background: var(--admin-surface-muted);
  color: var(--admin-text-primary);
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.6rem 0.75rem;
  text-align: left;
  font: inherit;
  opacity: 1;
}
.admin-scenario-preview-choices button strong {
  flex: 0 0 auto;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  display: grid;
  place-items: center;
  background: var(--admin-brand-soft);
  color: var(--admin-brand-primary-active);
}
.admin-scenario-preview-feedback {
  border: 1px dashed var(--admin-border-default);
  border-radius: 10px;
  padding: 0.65rem 0.75rem;
  color: var(--admin-text-secondary);
  background: var(--admin-surface-muted);
  font-size: 0.88rem;
}
.admin-scenario-preview-nav {
  display: flex;
  justify-content: space-between;
  gap: 0.65rem;
  flex-wrap: wrap;
}
.admin-resource-action-header {
  border: 1px solid var(--border-default); border-radius: 12px; padding: 1rem;
  display: grid; gap: 0.85rem; min-width: 0;
}
.admin-resource-action-header.compact { padding: 0.9rem 1rem; }
.admin-resource-action-main {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; flex-wrap: wrap;
}
.admin-resource-action-main h2 {
  font-family: 'Space Grotesk', sans-serif; font-size: clamp(1.2rem, 2vw, 1.55rem); line-height: 1.2; color: var(--admin-text-primary);
  overflow-wrap: anywhere;
}
.admin-resource-action-row {
  display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;
  border-top: 1px solid var(--admin-border-subtle); padding-top: 0.85rem;
}
.admin-resource-action-row.compact { justify-content: flex-start; }
.admin-resource-back-button { min-height: 40px; }
.admin-resource-action-tabs {
  display: inline-flex; flex-wrap: wrap; gap: 0.4rem;
}
.admin-resource-action-tabs button {
  min-height: 40px; border: 1px solid var(--admin-border-default); border-radius: 10px;
  background: var(--admin-surface-muted); color: var(--admin-text-secondary); cursor: pointer;
  padding: 0.5rem 0.75rem; font: inherit; font-weight: 800;
}
.admin-resource-action-tabs button:hover,
.admin-resource-action-tabs button:focus-visible {
  border-color: var(--admin-brand-border); background: var(--admin-brand-subtle); outline: none;
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
.admin-resource-action-tabs button.active,
.admin-resource-action-tabs button[aria-selected="true"] {
  background: var(--admin-brand-soft); color: var(--admin-brand-primary-active); border-color: var(--admin-brand-border);
  box-shadow: inset 0 -3px 0 var(--admin-brand-primary);
}
.admin-resource-lifecycle-actions {
  display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap;
}
.admin-lifecycle-trigger {
  min-height: 42px; border-radius: 12px; border: 1px solid #d98c83;
  background: #fae8e6; color: #7a2f2a; cursor: pointer; font: inherit; font-weight: 900;
  display: inline-flex; align-items: center; justify-content: center; gap: 0.45rem; margin-left: auto;
  padding: 0.48rem 0.75rem;
}
.admin-lifecycle-trigger.compact {
  width: 42px; padding: 0.48rem;
}
.admin-lifecycle-trigger svg {
  width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
}
.admin-lifecycle-trigger:hover,
.admin-lifecycle-trigger:focus-visible {
  background: #f6d9d5; outline: none; box-shadow: 0 0 0 3px rgba(217,140,131,0.28);
}
.btn-danger-muted {
  border: 1px solid var(--status-danger-border); border-radius: 9px; padding: 0.55rem 0.85rem;
  background: var(--status-danger-surface); color: #8a3e25; font-family: 'DM Sans', sans-serif;
  font-size: 0.84rem; font-weight: 800; cursor: pointer;
}
.btn-danger-muted:hover,
.btn-danger-muted:focus-visible {
  background: #f6ded7; outline: none; box-shadow: 0 0 0 3px rgba(216,90,48,0.16);
}
.btn-danger-muted:disabled { cursor: not-allowed; opacity: 0.55; }
.admin-lifecycle-dialog { max-height: min(90vh, 680px); overflow-y: auto; }
.admin-lifecycle-operation-grid { display: grid; gap: 0.75rem; margin-top: 0.75rem; }
.admin-lifecycle-operation {
  border: 1px solid var(--admin-border-default); border-radius: 10px; padding: 0.8rem;
  background: var(--admin-surface-muted); display: grid; gap: 0.55rem;
}
.admin-lifecycle-operation h4 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1rem; color: var(--admin-text-primary);
  display: flex; align-items: center; gap: 0.45rem;
}
.admin-lifecycle-operation h4 svg {
  width: 20px; height: 20px; flex: 0 0 auto; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
}
.admin-lifecycle-operation p { color: var(--admin-text-secondary); line-height: 1.5; font-size: 0.88rem; }
.admin-lifecycle-operation.danger { border-color: #d98c83; background: #fff7f6; }
.admin-lifecycle-error { display: grid; gap: 0.7rem; align-items: start; }
.admin-lifecycle-reasons { padding-left: 1.1rem; color: var(--admin-text-secondary); line-height: 1.55; font-size: 0.88rem; }
.admin-lifecycle-confirm-field {
  display: grid; gap: 0.35rem; color: var(--admin-text-secondary); font-size: 0.84rem; font-weight: 800;
}
.admin-lifecycle-confirm-field input {
  width: 100%; border: 1.5px solid var(--admin-border-default); border-radius: 10px;
  padding: 0.62rem 0.75rem; font: inherit; color: var(--admin-text-primary);
}
.admin-lifecycle-confirm-field input:focus {
  border-color: var(--admin-border-focus); box-shadow: 0 0 0 3px rgba(86,101,122,0.16); outline: none;
}
.admin-resource-breadcrumb {
  display: flex; align-items: center; gap: 0.45rem; flex-wrap: wrap;
  color: var(--admin-text-secondary); font-size: 0.9rem; min-width: 0;
}
.admin-resource-breadcrumb button {
  border: 0; background: transparent; color: var(--admin-brand-primary);
  font: inherit; font-weight: 800; padding: 0.2rem 0; cursor: pointer;
}
.admin-resource-breadcrumb button:focus-visible,
.admin-more-actions-button:focus-visible,
.admin-more-actions-menu button:focus-visible {
  outline: 3px solid rgba(86,101,122,0.28); outline-offset: 2px;
}
.admin-resource-breadcrumb strong, .admin-resource-breadcrumb span { overflow-wrap: anywhere; }
.admin-resource-lifecycle-actions { position: relative; justify-content: flex-end; }
.admin-more-actions-button::after { content: "▾"; margin-left: 0.35rem; font-size: 0.75rem; }
.admin-more-actions-menu {
  position: absolute; right: 0; top: calc(100% + 0.35rem); z-index: 20;
  min-width: 220px; padding: 0.35rem; border: 1px solid var(--admin-border-default);
  border-radius: 10px; background: var(--admin-surface-raised); box-shadow: var(--admin-shadow-card);
  display: grid; gap: 0.2rem;
}
.admin-more-actions-menu button {
  min-height: 40px; border: 0; border-radius: 8px; padding: 0.55rem 0.65rem;
  text-align: left; background: transparent; color: var(--admin-text-primary); cursor: pointer; font-weight: 800;
}
.admin-more-actions-menu button:hover { background: var(--admin-surface-muted); }
.admin-more-actions-menu button.danger { color: #8a3e25; }
.admin-lifecycle-slug {
  display: inline-block; max-width: 100%; overflow-wrap: anywhere;
  background: var(--admin-surface-muted); border: 1px solid var(--admin-border-default);
  border-radius: 8px; padding: 0.3rem 0.45rem; color: var(--admin-text-primary);
}
.admin-lifecycle-reason-heading,
.admin-lifecycle-helper { color: var(--admin-text-secondary); font-size: 0.88rem; margin: 0.25rem 0; }
.admin-lifecycle-counts {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 0.45rem; margin: 0.65rem 0 0;
}
.admin-lifecycle-counts div {
  border: 1px solid var(--admin-border-subtle); border-radius: 8px; padding: 0.45rem 0.55rem;
  background: var(--admin-surface-muted);
}
.admin-lifecycle-counts dt { font-size: 0.72rem; color: var(--admin-text-secondary); font-weight: 800; }
.admin-lifecycle-counts dd { margin: 0.15rem 0 0; color: var(--admin-text-primary); font-weight: 900; }
.admin-governance-grid {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem;
}
.admin-governance-card {
  border: 1px solid var(--admin-border-default); border-radius: 12px; padding: 1rem;
  background: var(--admin-surface-raised); box-shadow: var(--admin-shadow-card); min-width: 0;
}
.admin-governance-card h3 { font-family: 'Space Grotesk', sans-serif; font-size: 1rem; margin-bottom: 0.55rem; }
.admin-resource-editor-dirty {
  color: #8a3e25; background: var(--status-danger-surface); border: 1px solid var(--status-danger-border); border-radius: 999px;
  padding: 0.28rem 0.65rem; font-size: 0.78rem; font-weight: 800;
}
.admin-resource-editor-identity {
  border: 1px solid var(--border-default); border-radius: 12px; padding: 1rem;
  background: var(--surface-muted); display: flex; justify-content: space-between; gap: 1rem; flex-wrap: wrap;
}
.admin-resource-editor-identity h2 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; margin-bottom: 0.3rem;
}
.admin-resource-editor-identity p:last-child { color: #66726b; font-size: 0.9rem; line-height: 1.5; max-width: 72ch; }
.admin-resource-editor-badges { display: flex; gap: 0.4rem; flex-wrap: wrap; align-content: flex-start; }
.admin-resource-language-tabs,
.admin-translation-tabs {
  display: flex; gap: 0.55rem; overflow-x: auto; padding-bottom: 0.1rem;
}
.admin-resource-language-tab,
.admin-translation-tab {
  min-width: 150px; min-height: 48px; border: 1.5px solid var(--border-default); border-radius: 10px;
  background: var(--surface-raised); color: var(--text-secondary); cursor: pointer; padding: 0.55rem 0.7rem;
  display: grid; gap: 0.12rem; text-align: left; font-family: 'DM Sans', sans-serif;
}
.admin-resource-language-tab span,
.admin-translation-tab-language { font-weight: 800; }
.admin-resource-language-tab small,
.admin-translation-tab-meta { color: #66726b; font-weight: 700; font-size: 0.72rem; display: inline-flex; gap: 0.28rem; align-items: center; flex-wrap: wrap; }
.admin-translation-tab-meta strong { color: inherit; }
.admin-resource-language-tab:hover, .admin-resource-language-tab:focus-visible,
.admin-translation-tab:hover, .admin-translation-tab:focus-visible {
  border-color: rgba(29,158,117,0.35); outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
}
.admin-theme .admin-resource-language-tab:hover,
.admin-theme .admin-resource-language-tab:focus-visible,
.admin-theme .admin-translation-tab:hover,
.admin-theme .admin-translation-tab:focus-visible {
  border-color: var(--admin-brand-border);
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
.admin-resource-language-tab.active,
.admin-translation-tab.active {
  background: var(--surface-interactive); border-color: var(--color-brand-border); color: #14684f;
  box-shadow: inset 0 -3px 0 var(--color-brand-primary);
}
.admin-theme .admin-resource-language-tab.active,
.admin-theme .admin-translation-tab.active {
  color: var(--admin-brand-primary-active);
  box-shadow: inset 0 -3px 0 var(--admin-brand-primary);
}
.admin-resource-language-tab.dirty,
.admin-translation-tab.dirty { border-color: rgba(231,111,81,0.45); }
.admin-translation-tab.complete { border-color: rgba(29,158,117,0.28); }
.admin-translation-tab.missing, .admin-translation-tab.incomplete { border-color: rgba(190,132,44,0.32); }
.admin-editor-status-grid {
  display: grid; grid-template-columns: minmax(0, 1fr) minmax(280px, 0.85fr); gap: 0.85rem; align-items: stretch;
}
.admin-translation-coverage,
.admin-publication-control {
  border: 1px solid var(--border-default); border-radius: 12px; background: var(--surface-raised); padding: 0.9rem;
  display: grid; gap: 0.65rem; min-width: 0;
}
.admin-translation-coverage-head,
.admin-publication-control-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap;
}
.admin-translation-coverage-head h3,
.admin-publication-control-head h3 {
  font-size: 1rem; line-height: 1.25; color: var(--admin-text-primary, #1f3328);
}
.admin-translation-coverage-list,
.admin-lifecycle-counts.admin-translation-coverage-list {
  display: grid; gap: 0.42rem; margin: 0;
}
.admin-translation-coverage-list div {
  display: flex; justify-content: space-between; gap: 0.75rem; border-top: 1px solid var(--admin-border-subtle, #e2e8e3); padding-top: 0.42rem;
}
.admin-translation-coverage-list dt { font-weight: 800; color: var(--admin-text-primary, #1f3328); }
.admin-translation-coverage-list dd { display: inline-flex; gap: 0.45rem; margin: 0; color: #66726b; flex-wrap: wrap; justify-content: flex-end; }
.admin-publication-reasons {
  background: #fff8eb; border: 1px solid #f1d8a8; color: #6b4f16; border-radius: 10px; padding: 0.65rem 0.75rem;
}
.admin-publication-reasons ul { margin: 0.35rem 0 0; padding-left: 1.1rem; }
.admin-publication-warning {
  background: #f9faf7; border: 1px solid var(--admin-border-subtle, #e2e8e3); border-radius: 10px; color: #66726b; padding: 0.55rem 0.65rem; font-size: 0.86rem; line-height: 1.45;
}
.admin-publication-actions { display: flex; flex-wrap: wrap; gap: 0.55rem; align-items: center; }
.admin-resource-editor-grid {
  display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(300px, 0.75fr);
  gap: 1rem; align-items: start; min-width: 0;
}
.admin-resource-content-form, .admin-resource-preview {
  border: 1px solid var(--border-default); border-radius: 12px; padding: 1rem; background: var(--surface-raised);
}
.admin-resource-content-form { display: grid; gap: 0.85rem; }
.admin-resource-content-form label {
  display: grid; gap: 0.3rem; font-size: 0.82rem; font-weight: 800; color: #445047;
}
.admin-resource-content-form input, .admin-resource-content-form textarea {
  width: 100%; border: 1.5px solid var(--border-default); border-radius: 10px;
  padding: 0.68rem 0.75rem; font: inherit; color: var(--text-primary); background: var(--surface-raised);
}
.admin-resource-content-form input:focus, .admin-resource-content-form textarea:focus {
  border-color: var(--border-focus); box-shadow: 0 0 0 3px rgba(29,158,117,0.14); outline: none;
}
.admin-theme .admin-resource-content-form input:focus,
.admin-theme .admin-resource-content-form textarea:focus {
  border-color: var(--admin-border-focus);
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
.admin-resource-content-form [aria-invalid="true"] {
  border-color: var(--coral); box-shadow: 0 0 0 3px rgba(231,111,81,0.12);
}
.admin-resource-content-form small { color: #66726b; font-weight: 600; line-height: 1.35; }
.admin-resource-body-textarea { min-height: 320px; line-height: 1.55; resize: vertical; }
.admin-resource-editor-actions {
  display: flex; justify-content: flex-end; gap: 0.7rem; flex-wrap: wrap;
}
.admin-resource-preview {
  position: sticky; top: calc(var(--nav-h) + 1rem); display: grid; gap: 0.85rem;
  background: var(--surface-muted);
  max-height: calc(100vh - var(--nav-h) - 2rem); overflow-y: auto;
}
.admin-resource-preview-head {
  display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; flex-wrap: wrap;
}
.admin-resource-preview-head span { color: #66726b; font-size: 0.8rem; font-weight: 800; }
.admin-resource-preview-category {
  justify-self: start; border-radius: 999px; padding: 0.24rem 0.65rem;
  background: var(--surface-interactive); border: 1px solid var(--color-brand-border); color: var(--teal); font-size: 0.74rem; font-weight: 800;
}
.admin-resource-preview h2 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.25rem; line-height: 1.25; color: #1f3328;
}
.admin-resource-preview-summary { color: #5c6a61; font-weight: 700; line-height: 1.55; }
.admin-resource-preview-body { display: grid; gap: 0.85rem; }
.admin-resource-preview-body p {
  color: #374237; font-size: 0.9rem; line-height: 1.75; overflow-wrap: anywhere;
  background: rgba(255,255,255,0.58); border: 1px solid var(--border-subtle); border-radius: 8px;
  padding: 0.55rem 0.65rem;
}
.admin-resource-preview-empty { color: #88928c !important; font-style: italic; }
.admin-theme .admin-resource-preview .res-tag {
  color: #14684f;
  background: var(--teal-lt);
}
.admin-scenario-step-card,
.admin-scenario-option-card {
  display: grid;
  gap: 0.7rem;
  border: 1px solid var(--border-subtle);
  border-radius: 10px;
  padding: 0.85rem;
  background: rgba(255,255,255,0.68);
}
.admin-theme .admin-scenario-step-card,
.admin-theme .admin-scenario-option-card {
  border-color: var(--admin-border);
  background: rgba(248,250,252,0.92);
}
.admin-scenario-step-card h4,
.admin-scenario-option-card strong {
  color: var(--admin-text-primary);
}
.admin-scenario-preview-list {
  display: grid;
  gap: 0.55rem;
  margin: 0.7rem 0;
  padding-left: 1.15rem;
}
.admin-scenario-preview-list li {
  color: var(--admin-text-primary);
  line-height: 1.45;
}
.admin-scenario-preview-list span {
  display: block;
  color: var(--admin-text-secondary);
  font-size: 0.8rem;
}
.admin-resource-editor-empty { display: grid; gap: 1rem; justify-items: start; }
.admin-confirm-backdrop {
  position: fixed; inset: 0; z-index: 260; background: var(--surface-overlay);
  display: grid; place-items: center; padding: 1rem;
}
.admin-confirm-dialog {
  width: min(460px, 100%); background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 12px;
  box-shadow: var(--shadow-dialog); padding: 1.1rem; display: grid; gap: 0.7rem;
}
.admin-confirm-dialog h3 {
  font-family: 'Space Grotesk', sans-serif; font-size: 1.12rem; line-height: 1.25; color: #1f3328;
}
.admin-confirm-dialog p { color: #5c6a61; font-size: 0.9rem; line-height: 1.55; }
.admin-confirm-resource {
  background: #f8fbf8; border: 1px solid #dfe8e3; border-radius: 9px; padding: 0.6rem 0.7rem;
  color: #1f3328 !important; font-weight: 700; overflow-wrap: anywhere;
}
.admin-confirm-actions { display: flex; justify-content: flex-end; gap: 0.7rem; margin-top: 0.2rem; }
@media (max-width: 860px) {
  .admin-workspace {
    width: min(100% - 1.5rem, 1180px); padding: 1rem 0 1.5rem;
    grid-template-columns: 1fr;
  }
  .admin-workspace-sidebar {
    position: static; padding: 0.85rem; overflow: hidden;
  }
  .admin-workspace-sidebar-heading { margin-bottom: 0.75rem; }
  .admin-section-nav {
    display: flex; overflow-x: auto; gap: 0.45rem; padding-bottom: 0.1rem;
  }
  .admin-section-nav-item {
    flex: 0 0 auto; width: auto; min-width: 150px; white-space: nowrap;
  }
  .admin-workspace-main-header { flex-direction: column; }
  .admin-workspace-status { width: 100%; }
  .admin-resource-filters { grid-template-columns: 1fr 1fr; }
  .admin-resource-editor-grid { grid-template-columns: 1fr; }
  .admin-editor-status-grid { grid-template-columns: 1fr; }
  .admin-resource-create-grid { grid-template-columns: 1fr; }
  .admin-resource-preview { position: static; max-height: none; }
}
@media (max-width: 560px) {
  .admin-workspace { width: min(100% - 1rem, 100%); }
  .admin-workspace-content, .admin-workspace-main-header { padding: 0.9rem; border-radius: 12px; }
  .admin-section-nav-item { min-width: 136px; }
  .admin-resource-filters, .admin-resource-summary { grid-template-columns: 1fr; }
  .admin-ai-hero,
  .admin-ai-cost-note,
  .admin-ai-provider-head,
  .admin-ai-provider-meta div,
  .admin-ai-runtime-summary div,
  .admin-ai-runtime-details div,
  .admin-ai-purpose-list div {
    flex-direction: column;
    align-items: stretch;
  }
  .admin-ai-provider-grid { grid-template-columns: 1fr; }
  .admin-ai-provider-meta dd,
  .admin-ai-runtime-summary dd,
  .admin-ai-runtime-details dd,
  .admin-ai-purpose-list dd { text-align: left; }
  .admin-ai-trace-list { overflow-x: visible; }
  .admin-ai-trace-row,
  .admin-ai-trace-row.heading {
    min-width: 0;
    grid-template-columns: 1fr;
    align-items: stretch;
  }
  .admin-ai-trace-row.heading { display: none; }
  .admin-ai-trace-row .btn-secondary { width: 100%; }
  .admin-ai-trace-filters label { min-width: 100%; }
  .admin-resource-form-grid,
  .admin-resource-form-grid.three { grid-template-columns: 1fr; }
  .admin-resource-table { min-width: 900px; }
  .admin-resource-drawer { width: 100vw; padding: 1rem; }
  .admin-resource-drawer-head { flex-direction: column; }
  .admin-resource-drawer-actions { flex-direction: column-reverse; }
  .admin-resource-action-row { align-items: stretch; }
  .admin-resource-action-tabs, .admin-resource-lifecycle-actions { width: 100%; }
  .admin-resource-action-tabs button { flex: 1 1 130px; }
  .admin-resource-lifecycle-actions > button { width: 100%; }
  .admin-more-actions-menu { position: static; margin-top: 0.35rem; width: 100%; }
  .admin-resource-editor-actions { flex-direction: column-reverse; }
  .admin-resource-create-actions, .admin-resource-toolbar-actions { justify-content: flex-start; }
  .admin-resource-editor-actions .btn-primary, .admin-resource-editor-actions .btn-secondary,
  .admin-resource-drawer-actions .btn-primary, .admin-resource-drawer-actions .btn-secondary { width: 100%; }
  .admin-resource-language-tab, .admin-translation-tab { min-width: 132px; }
  .admin-translation-coverage-list div { display: grid; gap: 0.2rem; }
  .admin-translation-coverage-list dd { justify-content: flex-start; }
  .admin-publication-actions .btn-primary, .admin-publication-actions .btn-secondary { width: 100%; }
  .admin-confirm-actions { flex-direction: column-reverse; }
}

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
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 50px; padding: 0.6rem 1.4rem;
  font-size: 0.875rem; color: var(--text-secondary); box-shadow: var(--shadow-card);
  display: flex; align-items: center; gap: 0.4rem;
}

/* ── Dashboard ── */
.dash-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem; }
.dash-card {
  background: var(--surface-raised); border-radius: 14px; border: 1px solid var(--border-default);
  padding: 1.5rem; cursor: pointer; transition: box-shadow .2s, transform .2s;
}
.dash-card:hover { box-shadow: var(--shadow-raised); transform: translateY(-2px); border-color: var(--border-strong); }
.dash-icon { font-size: 1.8rem; margin-bottom: 0.75rem; }
.dash-label { font-family: 'Space Grotesk', sans-serif; font-weight: 600; margin-bottom: 0.3rem; }
.dash-desc { color: #777; font-size: 0.875rem; line-height: 1.5; }

/* ── Agent panel ── */
.agent-wrap { max-width: 760px; margin: 0 auto; padding: 2rem 1.5rem; }
.agent-panel { background: var(--surface-raised); border-radius: 16px; border: 1px solid var(--border-default); overflow: hidden; box-shadow: var(--shadow-card); }
.agent-header { background: var(--teal); color: #fff; padding: 1rem 1.25rem; display: flex; align-items: center; gap: 0.6rem; font-weight: 600; }
.agent-messages { height: 380px; overflow-y: auto; padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
.agent-bubble { max-width: 80%; padding: 0.65rem 1rem; border-radius: 14px; font-size: 0.875rem; line-height: 1.55; }
.agent-bubble.user { align-self: flex-end; background: var(--teal); color: #fff; border-bottom-right-radius: 4px; }
.agent-bubble.ai { align-self: flex-start; background: var(--gray-lt); color: #1a1a18; border-bottom-left-radius: 4px; }
.agent-bubble.ai.loading { opacity: 0.6; font-style: italic; }
.agent-input-row { display: flex; gap: 0.5rem; padding: 0.75rem 1rem; border-top: 1px solid var(--border-subtle); }
.agent-input { flex: 1; border: 1px solid var(--border-default); border-radius: 10px; padding: 0.55rem 0.85rem; font-family: 'DM Sans', sans-serif; font-size: 0.875rem; outline: none; }
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
.auth-logo { text-align: center; margin-bottom: 1.45rem; }
.auth-logo-image {
  display: block;
  width: auto;
  height: 118px;
  max-width: 78%;
  object-fit: contain;
  margin: 0 auto;
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
.btn-secondary {
  background: #fff; border: 1.5px solid rgba(0,0,0,0.13); border-radius: 10px;
  padding: 0.65rem 0.9rem; font-family: 'DM Sans', sans-serif; font-size: 0.86rem;
  font-weight: 700; color: #405247; cursor: pointer;
}
.btn-secondary:hover, .btn-secondary:focus-visible {
  background: var(--teal-lt); color: var(--teal); outline: none;
  box-shadow: 0 0 0 3px rgba(29,158,117,0.16);
}
.btn-secondary:disabled { opacity: 0.5; cursor: not-allowed; }
.admin-theme .btn-primary {
  background: var(--admin-brand-primary);
  color: var(--admin-text-on-brand);
  border: 1px solid var(--admin-brand-primary);
}
.admin-theme .btn-primary:hover {
  background: var(--admin-brand-primary-hover);
  opacity: 1;
}
.admin-theme .btn-primary:active {
  background: var(--admin-brand-primary-active);
}
.admin-theme .btn-primary:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(86,101,122,0.24);
}
.admin-theme .btn-secondary {
  background: var(--admin-surface-raised);
  border-color: var(--admin-border-default);
  color: var(--admin-text-primary);
}
.admin-theme .btn-secondary:hover,
.admin-theme .btn-secondary:focus-visible {
  background: var(--admin-brand-soft);
  border-color: var(--admin-brand-border);
  color: var(--admin-brand-primary-active);
  box-shadow: 0 0 0 3px rgba(86,101,122,0.16);
}
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
.progress-anchor { scroll-margin-top: calc(var(--nav-h) + 1rem); }
.progress-shell {
  max-width: 1180px; margin: 0 auto; padding: 2rem 1.5rem 3rem;
  display: grid; grid-template-columns: minmax(190px, 230px) minmax(0, 1fr); gap: 1.5rem;
}
.progress-content { min-width: 0; }
.activity-composition-card {
  padding: 1.15rem; margin-bottom: 1.2rem;
  border-color: rgba(29,158,117,0.16);
}
.activity-composition-header {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
  margin-bottom: 0.85rem;
}
.activity-composition-total {
  flex: 0 0 auto; color: var(--teal); font-weight: 800; font-size: 0.84rem;
  background: var(--teal-lt); border: 1px solid rgba(29,158,117,0.18);
  border-radius: 999px; padding: 0.35rem 0.65rem;
}
.activity-composition-bar {
  display: flex; overflow: hidden; width: 100%; height: 18px;
  background: #eef2ee; border-radius: 999px; border: 1px solid rgba(0,0,0,0.08);
}
.activity-composition-segment {
  min-width: 2px; height: 100%; border-right: 2px solid rgba(255,255,255,0.75);
}
.activity-composition-segment:last-child { border-right: 0; }
.activity-composition-segment.assessment_topics { background: #1D9E75; }
.activity-composition-segment.completed_scenarios { background: #2E7D32; }
.activity-composition-segment.completed_recommendations { background: #C9841D; }
.activity-composition-segment.learning_events { background: #5C6BC0; }
.learning-path-card {
  padding: 1.15rem; margin-bottom: 1.2rem;
  border-color: rgba(29,158,117,0.18);
  background: linear-gradient(180deg, #ffffff 0%, #f7fbf9 100%);
}
.learning-path-card.compact { margin-bottom: 0; }
.learning-path-header {
  display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;
  margin-bottom: 0.9rem;
}
.learning-path-percent {
  font-family: 'Space Grotesk', sans-serif; font-size: 2.25rem; font-weight: 700;
  color: var(--teal); line-height: 1;
}
.learning-path-bar {
  display: flex; overflow: hidden; width: 100%; height: 18px;
  background: #eef2ee; border-radius: 999px; border: 1px solid rgba(0,0,0,0.08);
}
.learning-path-segment {
  min-width: 2px; height: 100%; border-right: 2px solid rgba(255,255,255,0.75);
}
.learning-path-segment:last-child { border-right: 0; }
.learning-path-segment.assessment { background: #1D9E75; }
.learning-path-segment.scenarios { background: #2E7D32; }
.learning-path-segment.engagement { background: #C9841D; }
.learning-path-segment.remaining { background: #dfe6e2; }
.learning-path-breakdown {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem; margin-top: 1rem;
}
.learning-path-component {
  padding: 0.8rem; border-radius: 10px; background: #fff; border: 1px solid rgba(0,0,0,0.07);
  min-width: 0;
}
.learning-path-component-label { font-weight: 800; color: #27332f; font-size: 0.84rem; }
.learning-path-component-value { font-family: 'Space Grotesk', sans-serif; color: var(--teal); font-weight: 700; margin-top: 0.25rem; }
.learning-path-component-meta { font-size: 0.76rem; color: #61716b; margin-top: 0.25rem; line-height: 1.45; }
.learning-path-disclaimer { margin-top: 0.85rem; color: #61716b; font-size: 0.8rem; line-height: 1.55; }
.activity-composition-legend {
  display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.65rem; margin-top: 0.9rem;
}
.activity-composition-legend-item {
  display: flex; align-items: flex-start; gap: 0.55rem; min-width: 0;
  padding: 0.65rem; border-radius: 10px; background: #fafafa; border: 1px solid rgba(0,0,0,0.06);
}
.activity-composition-dot {
  width: 0.72rem; height: 0.72rem; border-radius: 50%; margin-top: 0.16rem; flex: 0 0 auto;
}
.activity-composition-dot.assessment_topics { background: #1D9E75; }
.activity-composition-dot.completed_scenarios { background: #2E7D32; }
.activity-composition-dot.completed_recommendations { background: #C9841D; }
.activity-composition-dot.learning_events { background: #5C6BC0; }
.activity-composition-disclaimer {
  margin-top: 0.85rem; color: #61716b; font-size: 0.8rem; line-height: 1.55;
}
.recent-activity-list {
  display: grid; gap: 0.55rem; margin-top: 0.7rem;
}
.recent-activity-item {
  display: flex; justify-content: space-between; gap: 1rem; align-items: flex-start;
  padding: 0.7rem 0; border-bottom: 1px solid rgba(0,0,0,0.07);
}
.recent-activity-item:last-child { border-bottom: 0; }
.assessment-results-grid {
  display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem;
}
.home-how-grid {
  display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.25rem;
  max-width: 930px; margin-inline: auto;
}
.home-how-step { display: flex; gap: 1rem; align-items: flex-start; min-width: 0; }
.home-how-number {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--teal); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Space Grotesk', sans-serif; font-weight: 700;
  font-size: 0.85rem; flex: 0 0 44px;
}
.home-how-copy { min-width: 0; text-align: left; }
.home-how-title { font-weight: 700; font-size: 1rem; margin-bottom: 0.3rem; }
.home-how-description { font-size: 0.85rem; color: #555; line-height: 1.65; }
@media (max-width: 900px) {
  .progress-shell { display: block; padding: 1.25rem 1rem 2.5rem; }
  .home-how-grid { grid-template-columns: 1fr; max-width: 560px; }
}
@media (max-width: 560px) {
  .activity-composition-header { display: block; }
  .learning-path-header { display: block; }
  .learning-path-percent { margin-top: 0.7rem; }
  .learning-path-breakdown { grid-template-columns: 1fr; }
  .activity-composition-total { display: inline-flex; margin-top: 0.65rem; }
  .activity-composition-legend { grid-template-columns: 1fr; }
  .recent-activity-item { display: block; }
  .assessment-results-grid { grid-template-columns: 1fr; }
  .home-how-grid { gap: 1rem; }
  .home-how-step { gap: 0.85rem; }
}

/* Auth switch link */
.auth-switch { text-align: center; margin-top: 1.25rem; font-size: 0.83rem; color: #888; }
.auth-switch button { background: none; border: none; color: var(--teal); cursor: pointer; font-weight: 600; font-size: 0.83rem; }

/* Avatar row */
.avatar { width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 0.75rem; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 1.1rem; color: #fff; background: var(--teal); }

/* ── Team card ── */
.team-grid { display: flex; gap: 1rem; flex-wrap: wrap; }
.team-card { background: var(--surface-raised); border-radius: 14px; border: 1px solid var(--border-default); padding: 1.5rem; text-align: center; flex: 1; min-width: 160px; box-shadow: var(--shadow-card); }
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
  width: 340px; background: var(--surface-raised); border-radius: 16px;
  border: 1px solid var(--border-default); box-shadow: var(--shadow-raised);
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
.chat-bubble.user { align-self: flex-end; background: var(--teal); color: #fff; border-bottom-right-radius: 3px; white-space: pre-wrap; overflow-wrap: anywhere; }
.chat-bubble.ai { align-self: flex-start; background: var(--gray-lt); border-bottom-left-radius: 3px; overflow-wrap: anywhere; }
.chat-bubble.ai.loading { opacity: 0.6; font-style: italic; }
.chat-markdown { overflow-wrap: anywhere; word-break: normal; line-height: 1.55; }
.chat-markdown > *:first-child { margin-top: 0; }
.chat-markdown > *:last-child { margin-bottom: 0; }
.chat-markdown p { margin: 0 0 0.55rem; }
.chat-markdown h1, .chat-markdown h2, .chat-markdown h3, .chat-markdown h4 {
  margin: 0.75rem 0 0.35rem; line-height: 1.25; font-family: 'Space Grotesk', sans-serif;
}
.chat-markdown h1 { font-size: 1.05rem; }
.chat-markdown h2 { font-size: 1rem; }
.chat-markdown h3, .chat-markdown h4 { font-size: 0.94rem; }
.chat-markdown ul, .chat-markdown ol { margin: 0.35rem 0 0.65rem 1.15rem; padding-left: 0.45rem; }
.chat-markdown li { margin: 0.22rem 0; }
.chat-markdown blockquote {
  margin: 0.65rem 0; padding: 0.15rem 0 0.15rem 0.75rem;
  border-left: 3px solid rgba(29,158,117,0.35); color: #52615b;
}
.chat-markdown code {
  font-family: Consolas, Monaco, 'Courier New', monospace; background: rgba(0,0,0,0.07);
  border-radius: 5px; padding: 0.08rem 0.25rem; font-size: 0.88em;
}
.chat-markdown pre {
  margin: 0.65rem 0; max-width: 100%; overflow-x: auto; background: #202724; color: #f7fbf9;
  border-radius: 8px; padding: 0.75rem; -webkit-overflow-scrolling: touch;
}
.chat-markdown pre code { background: transparent; color: inherit; padding: 0; white-space: pre; }
.chat-markdown .chat-table-wrap { max-width: 100%; overflow-x: auto; margin: 0.65rem 0; }
.chat-markdown table { border-collapse: collapse; min-width: 100%; font-size: 0.9em; }
.chat-markdown th, .chat-markdown td { border: 1px solid rgba(0,0,0,0.12); padding: 0.4rem 0.5rem; text-align: left; }
.chat-markdown th { background: rgba(29,158,117,0.08); }
.chat-markdown a { color: #0d6b52; font-weight: 700; overflow-wrap: anywhere; }
.chat-source-group {
  align-self: flex-start; width: min(680px, 88%); display: grid; gap: 0.42rem;
  margin: -0.28rem 0 0.3rem; padding: 0.46rem 0.58rem;
  border: 1px solid rgba(29,158,117,0.12); border-radius: 9px;
  background: rgba(247,251,249,0.74);
}
.chat-source-group.compact { width: 100%; padding: 0.42rem 0.5rem; }
.chat-source-summary {
  display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; min-width: 0;
}
.chat-source-summary-text {
  min-width: 0; color: #53635d; font-size: 0.76rem; font-weight: 750; line-height: 1.35;
  overflow-wrap: anywhere;
}
.chat-source-toggle {
  min-height: 32px; flex: 0 0 auto; border: 1px solid rgba(29,158,117,0.2); background: var(--surface-raised);
  color: #0d6b52; border-radius: 999px; padding: 0.25rem 0.58rem; font-size: 0.72rem;
  font-weight: 800; cursor: pointer;
}
.chat-source-toggle:hover, .chat-source-toggle:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.12);
}
.chat-source-list {
  display: grid; gap: 0.36rem; padding-top: 0.18rem; border-top: 1px solid rgba(29,158,117,0.1);
}
.chat-source-item {
  min-width: 0; display: grid; gap: 0.28rem;
}
.chat-source-title { font-size: 0.82rem; font-weight: 800; color: #1a1a18; overflow-wrap: anywhere; line-height: 1.3; }
.chat-source-meta { font-size: 0.72rem; color: #65736d; overflow-wrap: anywhere; }
.chat-source-snippet { font-size: 0.76rem; color: #405049; line-height: 1.45; overflow-wrap: anywhere; }
.chat-source-actions { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; }
.chat-source-button, .chat-source-link {
  min-height: 34px; display: inline-flex; align-items: center; justify-content: center;
  border-radius: 8px; padding: 0.34rem 0.56rem; font-size: 0.72rem; font-weight: 800;
  text-decoration: none; cursor: pointer;
}
.chat-source-button {
  border: 1px solid rgba(29,158,117,0.22); background: var(--surface-raised); color: #0d6b52;
}
.chat-source-link {
  border: 1px solid var(--border-default); background: var(--surface-raised); color: #46524e;
}
.chat-source-button:hover, .chat-source-button:focus-visible,
.chat-source-link:hover, .chat-source-link:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.14);
}
.chat-source-group.compact .chat-source-summary { justify-content: flex-start; }
.chat-action-group {
  align-self: flex-start; width: min(680px, 88%); display: grid; gap: 0.55rem;
  margin: -0.25rem 0 0.35rem;
}
.chat-action-group.compact { width: 100%; }
.chat-action-card {
  background: var(--surface-raised); border: 1px solid rgba(29,158,117,0.22); border-left: 3px solid var(--teal);
  border-radius: 10px; padding: 0.7rem; display: grid; grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.65rem; align-items: center; box-shadow: 0 3px 12px rgba(0,0,0,0.045);
}
.chat-action-card.unavailable { opacity: 0.62; border-left-color: #aaa; }
.chat-action-card-copy { min-width: 0; }
.chat-action-card-kicker {
  font-size: 0.68rem; color: var(--teal); font-weight: 800; text-transform: uppercase; margin-bottom: 0.18rem;
}
.chat-action-card-title {
  font-size: 0.86rem; font-weight: 800; color: #1a1a18; line-height: 1.3; overflow-wrap: anywhere;
}
.chat-action-card-description {
  margin-top: 0.22rem; color: #596861; font-size: 0.78rem; line-height: 1.45; overflow-wrap: anywhere;
}
.chat-action-card-button {
  min-height: 44px; border: 1px solid rgba(29,158,117,0.28); background: var(--teal-lt); color: #0d6b52;
  border-radius: 9px; padding: 0.5rem 0.72rem; font-size: 0.76rem; font-weight: 800; cursor: pointer;
  white-space: nowrap;
}
.chat-action-card-button:hover, .chat-action-card-button:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.16); background: #d4f0e6;
}
.chat-action-card-button:disabled { cursor: not-allowed; background: #f2f2f2; color: #777; border-color: rgba(0,0,0,0.12); }
.chat-action-proposal {
  grid-column: 1 / -1; border-top: 1px solid var(--border-subtle); padding-top: 0.58rem;
  display: grid; gap: 0.36rem; color: #405149; font-size: 0.78rem; line-height: 1.45;
}
.chat-action-proposal-heading {
  font-size: 0.68rem; color: #63736d; font-weight: 800; text-transform: uppercase;
}
.chat-action-proposal-title { font-size: 0.84rem; color: #202a25; font-weight: 800; overflow-wrap: anywhere; }
.chat-action-proposal p { margin: 0; overflow-wrap: anywhere; }
.chat-action-proposal-note { color: #5d6b66; }
.chat-action-proposal-actions { display: flex; flex-wrap: wrap; gap: 0.46rem; margin-top: 0.15rem; }
.chat-action-proposal-confirm,
.chat-action-proposal-cancel {
  min-height: 40px; border-radius: 8px; padding: 0.46rem 0.72rem;
  font-size: 0.74rem; font-weight: 800; cursor: pointer;
}
.chat-action-proposal-confirm {
  border: 1px solid rgba(29,158,117,0.28); background: var(--teal); color: #fff;
}
.chat-action-proposal-cancel {
  border: 1px solid var(--border-default); background: var(--surface-raised); color: #44514c;
}
.chat-action-proposal-confirm:hover, .chat-action-proposal-confirm:focus-visible,
.chat-action-proposal-cancel:hover, .chat-action-proposal-cancel:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.16);
}
.chat-action-group.compact .chat-action-card {
  grid-template-columns: 1fr; gap: 0.5rem; padding: 0.65rem;
}
.chat-action-group.compact .chat-action-card-button { width: 100%; white-space: normal; }
.chat-status-notice {
  align-self: stretch; background: var(--teal-lt); color: #14684f;
  border: 1px solid rgba(29,158,117,0.24); border-radius: 8px;
  padding: 0.65rem 0.8rem; font-size: 0.8rem; line-height: 1.45;
}
.chat-status-notice.generating { display: flex; align-items: center; gap: 0.55rem; }
.chat-status-notice.failed {
  background: var(--coral-lt); color: #7a2f18; border-color: rgba(216,90,48,0.24);
}
.chat-status-spinner {
  width: 14px; height: 14px; border-radius: 999px;
  border: 2px solid rgba(29,158,117,0.22); border-top-color: var(--teal);
  flex: 0 0 auto; animation: chat-spin 0.8s linear infinite;
}
.chat-generation-retry {
  margin-top: 0.55rem; border: 1px solid rgba(216,90,48,0.28); background: #fff;
  color: #7a2f18; border-radius: 8px; padding: 0.45rem 0.7rem;
  font-weight: 800; cursor: pointer; min-height: 40px;
}
.chat-generation-retry:hover, .chat-generation-retry:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(216,90,48,0.16);
}
.chat-generation-retry:disabled { opacity: 0.55; cursor: not-allowed; }
@keyframes chat-spin { to { transform: rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  .chat-status-spinner { animation: none; }
}
.chat-empty { margin: auto; text-align: center; color: #66736d; line-height: 1.55; padding: 1rem; }
.chat-empty-title { font-weight: 800; color: #1a1a18; margin-bottom: 0.3rem; }
.chat-input-row { display: flex; gap: 0.5rem; padding: 0.65rem 0.75rem; border-top: 1px solid var(--border-subtle); align-items: flex-end; }
.chat-input { flex: 1; border: 1px solid var(--border-default); border-radius: 8px; padding: 0.52rem 0.7rem; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; outline: none; resize: none; min-height: 38px; max-height: 110px; }
.chat-input:focus { border-color: var(--teal); }
.chat-send { background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.55rem 0.85rem; cursor: pointer; font-size: 0.85rem; font-weight: 700; min-width: 44px; }
.chat-send:hover, .chat-send:focus-visible { opacity: 0.88; outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.18); }
.chat-send:disabled { opacity: 0.45; cursor: not-allowed; }
.chat-composer-wrap { border-top: 1px solid rgba(0,0,0,0.07); }
.chat-composer-wrap .chat-input-row { border-top: none; }
.chat-composer-error { margin: 0 0.75rem 0.65rem; }
.chat-verification-lock {
  margin: 0.35rem 0.75rem 0.65rem;
  color: #51615b;
  font-size: 0.82rem;
  line-height: 1.45;
}
.email-verification-reminder {
  max-width: 1120px;
  margin: 1rem auto;
  padding: 1rem;
  border: 1px solid rgba(29, 158, 117, 0.22);
  border-radius: 12px;
  background: #f4fffb;
  box-shadow: 0 10px 28px rgba(13, 59, 47, 0.08);
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
}
.email-verification-reminder.compact {
  margin: 0.75rem auto;
}
.email-verification-reminder h2 {
  margin: 0 0 0.25rem;
  color: var(--teal);
  font-size: 1rem;
}
.email-verification-reminder p {
  margin: 0;
  color: #51615b;
  line-height: 1.5;
}
.email-verification-email {
  margin-top: 0.35rem !important;
  font-weight: 700;
}
.email-verification-actions {
  display: flex;
  gap: 0.6rem;
  flex-wrap: wrap;
  align-items: center;
}
.email-verification-status {
  grid-column: 1 / -1;
  color: #51615b;
  font-size: 0.86rem;
}
.email-verification-page {
  max-width: 760px;
}
.email-verification-page h1:focus {
  outline: 3px solid var(--teal);
  outline-offset: 4px;
}
@media (max-width: 720px) {
  .email-verification-reminder {
    grid-template-columns: 1fr;
  }
}
.chat-login-prompt { padding: 1.25rem; text-align: center; color: #666; font-size: 0.85rem; }
.chat-login-prompt button { margin-top: 0.75rem; background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.25rem; cursor: pointer; font-size: 0.875rem; }
.dashboard-chat-launcher { margin-bottom: 0.5rem; }
.dashboard-cyberguard-heading {
  display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap;
  gap: 0.75rem 1rem; margin-bottom: 0.75rem;
}
.dashboard-chat-welcome {
  min-height: 210px; display: grid; place-content: center; gap: 0.35rem;
  background: linear-gradient(180deg, var(--surface-raised) 0%, var(--surface-muted) 100%);
}
.dashboard-chat-welcome .chat-empty-title { font-family: 'Space Grotesk', sans-serif; font-size: 1.05rem; }
@media (max-width: 560px) {
  .dashboard-cyberguard-heading .btn-ghost { width: 100%; }
  .chat-source-group { width: 100%; }
  .chat-source-summary { align-items: flex-start; flex-direction: column; }
  .chat-source-actions { display: grid; grid-template-columns: 1fr; }
  .chat-source-button, .chat-source-link { width: 100%; }
  .chat-action-group { width: 100%; }
  .chat-action-card { grid-template-columns: 1fr; }
  .chat-action-card-button { width: 100%; white-space: normal; }
}
.ai-chat-sidebar-header { display: flex; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.85rem; }
.ai-chat-sidebar-title-block { min-width: 0; }
.ai-chat-sidebar-actions { display: flex; align-items: center; gap: 0.45rem; flex: 0 0 auto; }
.ai-chat-sidebar-rail-actions { display: grid; gap: 0.65rem; justify-items: center; width: 100%; }
.ai-chat-icon-button {
  width: 40px; height: 40px; border: 1px solid var(--border-default); background: var(--surface-raised);
  border-radius: 10px; cursor: pointer; display: inline-flex; align-items: center; justify-content: center;
  color: #3f4a45; font-size: 1.15rem; font-weight: 900; line-height: 1;
}
.ai-chat-icon-button:hover, .ai-chat-icon-button:focus-visible {
  outline: none; background: var(--teal-lt); box-shadow: 0 0 0 3px rgba(29,158,117,0.16);
}
.ai-chat-list { display: grid; align-content: start; gap: 0.45rem; min-height: 0; overflow-y: auto; overflow-x: hidden; padding-right: 0.15rem; }
.ai-chat-list-item {
  position: relative; display: grid; grid-template-columns: minmax(0, 1fr) 40px; gap: 0.35rem;
  align-items: start; border: 1px solid var(--border-default); background: var(--surface-raised);
  border-radius: 10px; padding: 0.62rem 0.58rem 0.62rem 0.7rem; color: #333; min-width: 0;
}
.ai-chat-list-row { min-width: 0; }
.ai-chat-list-select {
  min-width: 0; border: none; background: none; color: inherit; text-align: left; cursor: pointer;
  padding: 0.08rem 0; border-radius: 8px; font-family: 'DM Sans', sans-serif;
}
.ai-chat-list-item:hover, .ai-chat-list-item:focus-within, .ai-chat-list-item.active {
  outline: none; background: var(--teal-lt); border-color: rgba(29,158,117,0.28);
  box-shadow: inset 0 0 0 2px rgba(29,158,117,0.13);
}
.ai-chat-list-select:focus-visible {
  outline: none; box-shadow: 0 0 0 3px rgba(29,158,117,0.18);
}
.ai-chat-menu-button {
  justify-self: end; border: 1px solid var(--border-default); background: var(--surface-raised); border-radius: 10px; cursor: pointer;
  padding: 0; color: #56615c; font-weight: 800; min-width: 40px; min-height: 40px; line-height: 1;
}
.ai-chat-menu-button:hover, .ai-chat-menu-button:focus-visible, .ai-chat-menu-button.open {
  background: var(--gray-lt); outline: none; box-shadow: inset 0 0 0 2px rgba(29,158,117,0.14);
}
.ai-chat-menu {
  position: fixed; z-index: 260; width: 168px;
  background: var(--surface-raised); border: 1px solid var(--border-default); border-radius: 10px;
  box-shadow: var(--shadow-raised); padding: 0.35rem;
}
.ai-chat-menu-item {
  width: 100%; border: none; background: none; text-align: left; cursor: pointer;
  padding: 0.6rem 0.65rem; border-radius: 8px; font-family: 'DM Sans', sans-serif; min-height: 40px;
}
.ai-chat-menu-item:hover, .ai-chat-menu-item:focus-visible { background: var(--gray-lt); outline: none; }
.ai-chat-menu-item.danger { color: var(--coral); font-weight: 700; }
.ai-chat-rename-row { display: block; }
.ai-chat-rename-row .ai-chat-list-item { width: 100%; display: block; }
.ai-chat-rename-form { display: grid; gap: 0.4rem; }
.ai-chat-rename-input {
  width: 100%; border: 1.5px solid var(--border-default); border-radius: 8px;
  padding: 0.55rem 0.65rem; font-family: 'DM Sans', sans-serif; font-size: 0.86rem;
}
.ai-chat-rename-input:focus { outline: none; border-color: var(--teal); box-shadow: 0 0 0 3px rgba(29,158,117,0.12); }
.ai-chat-list-title { font-weight: 800; font-size: 0.88rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.ai-chat-list-time { margin-top: 0.2rem; font-size: 0.72rem; color: #77827d; }
.ai-chat-main-header { flex: 0 0 auto; padding: 1rem 1.1rem; border-bottom: 1px solid var(--border-subtle); }
.chat-migration-notice { margin-bottom: 0.85rem; }
.dashboard-ai-preview {
  background: var(--surface-raised); border: 1px solid rgba(29,158,117,0.22); border-radius: 14px;
  padding: 1.25rem; box-shadow: var(--shadow-card); margin-bottom: 0.5rem;
}
.dashboard-ai-preview-text { color: #52615b; font-size: 0.88rem; line-height: 1.6; margin: 0.65rem 0 1rem; }
@media (max-width: 820px) {
  .chat-panel { left: 1rem; right: 1rem; width: auto; }
}
@media (max-width: 430px) {
  .chat-header { align-items: flex-start; }
  .chat-header-actions { flex-direction: column; align-items: stretch; }
  .chat-header-button { font-size: 0.72rem; }
}

/* ── Resources ── */
.res-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px,1fr)); gap: 1rem; }
.res-card { background: var(--surface-raised); border-radius: 14px; border: 1px solid var(--border-default); padding: 1.25rem; box-shadow: var(--shadow-card); }
.res-card:hover { border-color: var(--border-strong); }
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

const CHAT_STORAGE_PREFIX = "cyberly.chat.v1";
const CHAT_ACTIVE_STORAGE_PREFIX = "cyberly.chat.activeConversation.v1";
const CHAT_NOTICE_STORAGE_PREFIX = "cyberly.chat.backendMigrationNotice.v1";
const CHAT_GENERATION_POLL_INTERVAL_MS = 2000;
const CHAT_GENERATION_POLL_MAX_MS = 30000;
const PUBLIC_PAGES = new Set(["home", "resources", "about", "login"]);
const PROTECTED_PAGES = new Set(["dashboard", "assessment", "scenarios", "progress", "profile", "ai-chat", "admin"]);
const VERIFICATION_PAGES = new Set(["verify-email"]);
const VALID_PAGES = new Set([...PUBLIC_PAGES, ...PROTECTED_PAGES]);
VERIFICATION_PAGES.forEach(page => VALID_PAGES.add(page));

const {
  EDUCATION_LEVELS,
  LANGUAGES,
  FAMILIARITY,
  HELP_OPTIONS,
  LEARNING_STYLES,
  labelFor,
  labelsFor,
} = profileMappings;

function parseHashPage(hashValue = typeof window === "undefined" ? "#/home" : window.location.hash) {
  const raw = normalizeHashRoute(hashValue).replace(/^#\/?/, "").split(/[/?#]/)[0];
  return VALID_PAGES.has(raw) ? raw : "home";
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
  adminTheme = false,
}) {
  const cancelRef = useRef(null);
  const confirmRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
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
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") {
        window.setTimeout(() => previousFocus.focus(), 0);
      }
    };
  }, [onCancel]);

  return (
    <div className="logout-modal-backdrop" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div
        className={`logout-modal${adminTheme ? " admin-theme admin-dialog" : ""}`}
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

function ExportConversationDialog({
  title,
  description,
  conversationTitle,
  formatLabel,
  format,
  setFormat,
  cancelLabel,
  exportLabel,
  markdownLabel,
  textLabel,
  disabled,
  error = "",
  returnFocusHandled = false,
  onCancel,
  onExport,
}) {
  const markdownRef = useRef(null);
  const textRef = useRef(null);
  const cancelRef = useRef(null);
  const exportRef = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    markdownRef.current?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        onCancel();
        return;
      }
      if (event.key !== "Tab") return;

      const focusable = [markdownRef.current, textRef.current, cancelRef.current, exportRef.current]
        .filter(element => element && !element.disabled);
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

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (!returnFocusHandled && previousFocus && typeof previousFocus.focus === "function") {
        window.setTimeout(() => previousFocus.focus(), 0);
      }
    };
  }, [onCancel, returnFocusHandled]);

  const dialog = (
    <div className="logout-modal-backdrop cyberguard-export-dialog-layer" role="presentation" onMouseDown={event => {
      if (event.target === event.currentTarget) onCancel();
    }}>
      <div
        className="logout-modal ai-chat-export-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chat-export-dialog-title"
        aria-describedby="chat-export-dialog-description"
      >
        <h2 id="chat-export-dialog-title">{title}</h2>
        <p id="chat-export-dialog-description">{description}</p>
        <div className="ai-chat-export-conversation-title">{conversationTitle}</div>
        <fieldset className="ai-chat-export-format">
          <legend>{formatLabel}</legend>
          <label>
            <input
              ref={markdownRef}
              type="radio"
              name="chat-export-format"
              value="markdown"
              checked={format === "markdown"}
              onChange={() => setFormat("markdown")}
            />
            {markdownLabel}
          </label>
          <label>
            <input
              ref={textRef}
              type="radio"
              name="chat-export-format"
              value="text"
              checked={format === "text"}
              onChange={() => setFormat("text")}
            />
            {textLabel}
          </label>
        </fieldset>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="logout-modal-actions">
          <button type="button" className="modal-cancel" ref={cancelRef} onClick={onCancel}>
            {cancelLabel}
          </button>
          <button type="button" className="modal-cancel" ref={exportRef} onClick={onExport} disabled={disabled}>
            {exportLabel}
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return dialog;
  return createPortal(dialog, document.body);
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

function chatActiveStorageKey(userId) {
  return `${CHAT_ACTIVE_STORAGE_PREFIX}.${userId}`;
}

function chatNoticeStorageKey(userId) {
  return `${CHAT_NOTICE_STORAGE_PREFIX}.${userId}`;
}

function readSavedActiveConversationId(userId) {
  if (!userId || typeof window === "undefined") return null;
  try {
    const saved = window.localStorage.getItem(chatActiveStorageKey(userId));
    const id = Number(saved);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

function writeSavedActiveConversationId(userId, conversationId) {
  if (!userId || typeof window === "undefined") return;
  try {
    if (conversationId) {
      window.localStorage.setItem(chatActiveStorageKey(userId), String(conversationId));
    } else {
      window.localStorage.removeItem(chatActiveStorageKey(userId));
    }
  } catch {
    // Lightweight UI recovery is best-effort only.
  }
}

function hasLegacyChatHistory(userId) {
  if (!userId || typeof window === "undefined") return false;
  try {
    return Boolean(window.localStorage.getItem(chatStorageKey(userId)));
  } catch {
    return false;
  }
}

function hasAcknowledgedChatNotice(userId) {
  if (!userId || typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(chatNoticeStorageKey(userId)) === "acknowledged";
  } catch {
    return true;
  }
}

function acknowledgeChatNotice(userId) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chatNoticeStorageKey(userId), "acknowledged");
  } catch {
    // Non-blocking notice acknowledgement is best-effort.
  }
}

function chatSidebarStorageKey(userId) {
  return `cyberly.chat.sidebarCollapsed.v1.${userId}`;
}

function readChatSidebarCollapsed(userId) {
  if (!userId || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(chatSidebarStorageKey(userId)) === "true";
  } catch {
    return false;
  }
}

function writeChatSidebarCollapsed(userId, collapsed) {
  if (!userId || typeof window === "undefined") return;
  try {
    window.localStorage.setItem(chatSidebarStorageKey(userId), collapsed ? "true" : "false");
  } catch {
    // Sidebar preference is local UI state only.
  }
}

function mapServerConversation(conversation) {
  return {
    id: Number(conversation.id),
    title: conversation.title,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    lastMessageAt: conversation.lastMessageAt || conversation.updatedAt,
    messageCount: Number(conversation.messageCount || 0),
  };
}

function mapServerMessage(message) {
  return {
    id: Number(message.id),
    conversationId: Number(message.conversationId),
    role: message.role === "assistant" ? "ai" : message.role,
    text: message.content,
    content: message.content,
    locale: message.locale,
    replyToMessageId: message.replyToMessageId ? Number(message.replyToMessageId) : null,
    createdAt: message.createdAt,
  };
}

function mapServerMessagesWithActions(messages = [], actionGroups = [], sourceGroups = []) {
  return attachSourceGroupsToMessages(
    attachActionGroupsToMessages(messages.map(mapServerMessage), actionGroups),
    sourceGroups
  );
}

const SAFE_AI_GENERATION_ERROR_CODES = new Set([
  "AI_NOT_CONFIGURED",
  "AI_RUNTIME_DISABLED",
  "AI_AUTH_FAILED",
  "AI_PROVIDER_UNAVAILABLE",
  "AI_TIMEOUT",
  "AI_RATE_LIMITED",
  "AI_CONTEXT_LIMIT",
  "AI_REQUEST_FAILED",
  "AI_UNSAFE_REQUEST",
  "AI_INVALID_RESPONSE",
  "AI_OUTPUT_BLOCKED",
  "AI_GENERATION_IN_PROGRESS",
  "AI_ASSISTANT_PERSISTENCE_FAILED",
]);

const RETRYABLE_AI_GENERATION_ERROR_CODES = new Set([
  "AI_PROVIDER_UNAVAILABLE",
  "AI_TIMEOUT",
  "AI_RATE_LIMITED",
  "AI_REQUEST_FAILED",
  "AI_INVALID_RESPONSE",
]);

function isRetryableGenerationError(code) {
  return RETRYABLE_AI_GENERATION_ERROR_CODES.has(code);
}

function localizedGenerationError(code) {
  if (SAFE_AI_GENERATION_ERROR_CODES.has(code)) {
    const key = `errors.codes.${code}`;
    const translated = i18n.t(key, { defaultValue: "" });
    if (translated && translated !== key) return translated;
  }
  return i18n.t("chat.generation.failedDescription");
}

function recoveredGenerationState(generations = [], messages = []) {
  const assistantReplyIds = new Set(
    messages
      .filter(message => message.role === "ai" && message.replyToMessageId)
      .map(message => Number(message.replyToMessageId))
  );
  return generations.reduce((acc, generation) => {
    const userMessageId = Number(generation.userMessageId);
    if (!userMessageId) return acc;
    if (generation.status === "completed" && assistantReplyIds.has(userMessageId)) return acc;

    if (generation.status === "pending" || generation.status === "in_progress") {
      acc[userMessageId] = { status: "generating", errorCode: null, error: "" };
      return acc;
    }

    if (generation.status === "failed" || generation.status === "completed") {
      acc[userMessageId] = {
        status: "failed",
        errorCode: SAFE_AI_GENERATION_ERROR_CODES.has(generation.errorCode) ? generation.errorCode : null,
        error: localizedGenerationError(generation.errorCode),
        retryable: isRetryableGenerationError(generation.errorCode),
      };
    }
    return acc;
  }, {});
}

function mergeRecoveredGenerationState(current, messages = [], recovered = {}) {
  const userMessageIds = new Set(
    messages
      .filter(message => message.role === "user")
      .map(message => Number(message.id))
  );
  const next = { ...current };
  userMessageIds.forEach(id => {
    delete next[id];
  });
  return { ...next, ...recovered };
}

function ChatMarkdown({ children }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a({ href, children: linkChildren, ...props }) {
          return (
            <a href={href || "#"} target="_blank" rel="noopener noreferrer" {...props}>
              {linkChildren}
            </a>
          );
        },
        img({ alt, src }) {
          return <span>{alt || src || ""}</span>;
        },
        table({ children: tableChildren }) {
          return <div className="chat-table-wrap"><table>{tableChildren}</table></div>;
        },
      }}
    >
      {String(children || "")}
    </ReactMarkdown>
  );
}

function translatedActionLabel(t, labelKey) {
  const translated = t(labelKey, { defaultValue: "" });
  if (translated && translated !== labelKey) return translated;
  return t("chat.actions.continueLearning");
}

function proposalActionButtonLabel(t, proposal, fallback) {
  const actionType = proposal?.actionType;
  if (actionType === "open_resource") return t("chat.proposals.openResource");
  if (actionType === "open_scenario") return t("chat.proposals.viewScenario");
  if (actionType === "open_recommendation") return t("chat.proposals.viewRecommendation");
  if (actionType === "mark_recommendation_viewed") return t("chat.proposals.markRecommendationViewed");
  if (actionType === "mark_recommendation_completed") return t("chat.proposals.markRecommendationCompleted");
  return fallback || t("chat.proposals.confirm");
}

function targetForConfirmedProposalResult(result = {}) {
  return resolveChatActionTarget(result?.target);
}

function ChatMessageProposal({ proposal: initialProposal }) {
  const { t } = useTranslation();
  const { handleChatAction } = useApp();
  const [proposalState, setProposalState] = useState({
    status: initialProposal?.status === "pending" ? "ready" : (initialProposal?.status || "idle"),
    proposal: initialProposal || null,
    result: null,
    error: "",
  });
  const proposal = proposalState.proposal;
  if (!initialProposal && !proposal) return null;

  async function confirmProposal() {
    if (!proposal?.proposalId || !proposal?.confirmationToken) return;
    setProposalState(current => ({ ...current, status: "processing", error: "" }));
    const result = await confirmLearnerActionProposal(proposal.proposalId, proposal.confirmationToken);
    if (!result.ok) {
      const expired = result.code === "ACTION_PROPOSAL_EXPIRED";
      setProposalState(current => ({
        ...current,
        status: expired ? "expired" : "failed",
        error: expired ? t("chat.proposals.noLongerAvailable") : (result.error || t("chat.proposals.failed")),
      }));
      return;
    }
    setProposalState({
      status: "completed",
      proposal: result.proposal || { ...proposal, status: "completed" },
      result: result.result || null,
      error: "",
    });
    const confirmedTarget = targetForConfirmedProposalResult(result.result);
    if (confirmedTarget) handleChatAction({ target: confirmedTarget });
  }

  async function cancelProposal() {
    if (!proposal?.proposalId) return;
    setProposalState(current => ({ ...current, status: "processing", error: "" }));
    const result = await cancelLearnerActionProposal(proposal.proposalId);
    setProposalState({
      status: result.ok ? "cancelled" : "failed",
      proposal: result.proposal || proposal,
      result: null,
      error: result.ok ? "" : (result.error || t("chat.proposals.failed")),
    });
  }

  return (
    <div className={`chat-action-proposal model-origin ${proposalState.status}`} role={proposalState.status === "failed" ? "alert" : "status"}>
      <div className="chat-action-proposal-heading">{t("chat.proposals.suggestedAction")}</div>
      {proposal && (
        <>
          <div className="chat-action-proposal-title">{proposal.title || t("chat.proposals.reviewAction")}</div>
          <p>{proposal.explanation || t("chat.proposals.nothingChanged")}</p>
          <p className="chat-action-proposal-note">{proposal.consequence || t("chat.proposals.confirmationRequired")}</p>
          {proposal.requiresConfirmation && (
            <p className="chat-action-proposal-note">{t("chat.proposals.noScoreProgressChange")}</p>
          )}
        </>
      )}
      {proposalState.status === "processing" && <p>{t("chat.proposals.processing")}</p>}
      {proposalState.status === "completed" && <p>{t("chat.proposals.completed")}</p>}
      {proposalState.status === "cancelled" && <p>{t("chat.proposals.cancelled")}</p>}
      {proposalState.status === "expired" && <p>{t("chat.proposals.noLongerAvailable")}</p>}
      {proposalState.error && <p className="field-error">{proposalState.error}</p>}
      {proposalState.status === "ready" && proposal && (
        <div className="chat-action-proposal-actions">
          <button type="button" className="chat-action-proposal-confirm" onClick={confirmProposal}>
            {proposal.requiresConfirmation ? t("chat.proposals.confirm") : proposalActionButtonLabel(t, proposal)}
          </button>
          <button type="button" className="chat-action-proposal-cancel" onClick={cancelProposal}>
            {t("chat.proposals.cancel")}
          </button>
        </div>
      )}
      {proposalState.status === "failed" && (
        <button type="button" className="chat-action-proposal-cancel" onClick={() => setProposalState({ status: "idle", proposal: null, result: null, error: "" })}>
          {t("chat.proposals.dismiss")}
        </button>
      )}
    </div>
  );
}

function ChatActionCard({ action, compact = false }) {
  const { t } = useTranslation();
  const { handleChatAction } = useApp();
  const [proposalState, setProposalState] = useState({ status: "idle", proposal: null, result: null, error: "" });
  const target = resolveChatActionTarget(action?.target);
  const unavailable = !target;
  const label = translatedActionLabel(t, action?.labelKey);
  const title = action?.title || label;
  const description = compact ? "" : action?.description;
  const proposalPayload = buildProposalPayloadForChatAction(action);
  const proposal = proposalState.proposal;
  const proposalBusy = proposalState.status === "creating" || proposalState.status === "processing";

  async function reviewAction() {
    if (!target) return;
    if (!proposalPayload) {
      handleChatAction({ ...action, target });
      return;
    }
    setProposalState({ status: "creating", proposal: null, result: null, error: "" });
    const result = await createLearnerActionProposal(proposalPayload);
    if (!result.ok) {
      setProposalState({
        status: "failed",
        proposal: null,
        result: null,
        error: result.error || t("chat.proposals.failed"),
      });
      return;
    }
    setProposalState({ status: "ready", proposal: result.proposal, result: null, error: "" });
  }

  async function confirmProposal() {
    if (!proposal?.proposalId || !proposal?.confirmationToken) return;
    setProposalState(current => ({ ...current, status: "processing", error: "" }));
    const result = await confirmLearnerActionProposal(proposal.proposalId, proposal.confirmationToken);
    if (!result.ok) {
      const expired = result.code === "ACTION_PROPOSAL_EXPIRED";
      setProposalState(current => ({
        ...current,
        status: expired ? "expired" : "failed",
        error: expired ? t("chat.proposals.noLongerAvailable") : (result.error || t("chat.proposals.failed")),
      }));
      return;
    }
    setProposalState({
      status: "completed",
      proposal: result.proposal || { ...proposal, status: "completed" },
      result: result.result || null,
      error: "",
    });
    const confirmedTarget = resolveChatActionTarget(result.result?.target);
    if (confirmedTarget) handleChatAction({ target: confirmedTarget });
  }

  async function cancelProposal() {
    if (!proposal?.proposalId) {
      setProposalState({ status: "cancelled", proposal: null, result: null, error: "" });
      return;
    }
    setProposalState(current => ({ ...current, status: "processing", error: "" }));
    const result = await cancelLearnerActionProposal(proposal.proposalId);
    setProposalState({
      status: result.ok ? "cancelled" : "failed",
      proposal: result.proposal || proposal,
      result: null,
      error: result.ok ? "" : (result.error || t("chat.proposals.failed")),
    });
  }

  return (
    <div className={`chat-action-card${unavailable ? " unavailable" : ""}`}>
      <div className="chat-action-card-copy">
        <div className="chat-action-card-kicker">{label}</div>
        <div className="chat-action-card-title">{title}</div>
        {description && <div className="chat-action-card-description">{description}</div>}
      </div>
      <button
        type="button"
        className="chat-action-card-button"
        onClick={reviewAction}
        disabled={unavailable || proposalBusy}
        aria-label={unavailable
          ? t("chat.actionCards.unavailable")
          : t("chat.actionCards.openAction", { title })}
      >
        {proposalState.status === "creating" ? t("chat.proposals.processing") : (unavailable ? t("chat.actionCards.unavailable") : label)}
      </button>
      {proposalState.status !== "idle" && proposalPayload && (
        <div className={`chat-action-proposal ${proposalState.status}`} role={proposalState.status === "failed" ? "alert" : "status"}>
          <div className="chat-action-proposal-heading">{t("chat.proposals.suggestedAction")}</div>
          {proposal && (
            <>
              <div className="chat-action-proposal-title">{proposal.title || t("chat.proposals.reviewAction")}</div>
              <p>{proposal.explanation || t("chat.proposals.nothingChanged")}</p>
              <p className="chat-action-proposal-note">{proposal.consequence || t("chat.proposals.confirmationRequired")}</p>
              {proposal.requiresConfirmation && (
                <p className="chat-action-proposal-note">{t("chat.proposals.noScoreProgressChange")}</p>
              )}
            </>
          )}
          {!proposal && proposalState.status === "creating" && <p>{t("chat.proposals.processing")}</p>}
          {proposalState.status === "completed" && <p>{t("chat.proposals.completed")}</p>}
          {proposalState.status === "cancelled" && <p>{t("chat.proposals.cancelled")}</p>}
          {proposalState.status === "expired" && <p>{t("chat.proposals.noLongerAvailable")}</p>}
          {proposalState.error && <p className="field-error">{proposalState.error}</p>}
          {proposalState.status === "ready" && proposal && (
            <div className="chat-action-proposal-actions">
              <button type="button" className="chat-action-proposal-confirm" onClick={confirmProposal}>
                {proposal.requiresConfirmation ? t("chat.proposals.confirm") : proposalActionButtonLabel(t, proposal, label)}
              </button>
              <button type="button" className="chat-action-proposal-cancel" onClick={cancelProposal}>
                {t("chat.proposals.cancel")}
              </button>
            </div>
          )}
          {proposalState.status === "failed" && (
            <button type="button" className="chat-action-proposal-cancel" onClick={() => setProposalState({ status: "idle", proposal: null, result: null, error: "" })}>
              {t("chat.proposals.dismiss")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ChatActionGroup({ actions = [], compact = false }) {
  const { t } = useTranslation();
  const visibleActions = Array.isArray(actions) ? actions : [];
  if (!visibleActions.length) return null;

  return (
    <div className={`chat-action-group${compact ? " compact" : ""}`} role="group" aria-label={t("chat.actionCards.groupLabel")}>
      {visibleActions.map(action => (
        <ChatActionCard key={action.id} action={action} compact={compact} />
      ))}
    </div>
  );
}

function truncateSourceSnippet(snippet = "", maxLength = 150) {
  const normalized = String(snippet || "").trim().replace(/\s+/g, " ");
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}...`;
}

function sourceSummaryText(t, count) {
  return count === 1
    ? t("chat.sources.summaryOne", { count })
    : t("chat.sources.summaryMany", { count });
}

function ChatSourceItem({ source }) {
  const { t } = useTranslation();
  const { handleChatAction } = useApp();
  const target = resolveChatSourceTarget(source?.internalTarget);
  const sourceMeta = source?.sourceLabel || source?.sourceOrganisation || "";
  const title = source?.title || t("chat.sources.sourceUnavailable");
  const snippet = truncateSourceSnippet(source?.snippet);

  return (
    <div className="chat-source-item">
      <div className="chat-source-title">{title}</div>
      {sourceMeta && <div className="chat-source-meta">{sourceMeta}</div>}
      {snippet && <div className="chat-source-snippet">{snippet}</div>}
      <div className="chat-source-actions">
        {target && (
          <button
            type="button"
            className="chat-source-button"
            onClick={() => handleChatAction({ target })}
            aria-label={t("chat.sources.openResource", { title })}
          >
            {t("chat.sources.openResource", { title })}
          </button>
        )}
        {source?.sourceUrl && (
          <a
            className="chat-source-link"
            href={source.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={t("chat.sources.openExternal", { title })}
          >
            {t("chat.sources.externalLabel")}
          </a>
        )}
      </div>
    </div>
  );
}

function ChatSourceGroup({ sources = [], compact = false, idScope = "" }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const visibleSources = Array.isArray(sources) ? sources : [];
  if (!visibleSources.length) return null;
  const count = visibleSources.length;
  const groupIdSuffix = visibleSources.map(source => source.id).join("-");
  const groupId = idScope ? `chat-sources-${idScope}-${groupIdSuffix}` : `chat-sources-${groupIdSuffix}`;

  return (
    <section className={`chat-source-group${compact ? " compact" : ""}`} aria-label={t("chat.sources.groupLabel")}>
      <div className="chat-source-summary">
        <div className="chat-source-summary-text">
          {compact ? sourceSummaryText(t, count) : `${t("chat.sources.heading")} · ${count}`}
        </div>
        {!compact && (
          <button
            type="button"
            className="chat-source-toggle"
            aria-expanded={expanded}
            aria-controls={groupId}
            onClick={() => setExpanded(current => !current)}
          >
            {expanded ? t("chat.sources.hide") : t("chat.sources.show")}
          </button>
        )}
      </div>
      {!compact && expanded && (
        <div id={groupId} className="chat-source-list">
          {visibleSources.map(source => (
            <ChatSourceItem key={source.id} source={source} />
          ))}
        </div>
      )}
    </section>
  );
}

function mergeMessageById(messages, nextMessage) {
  if (!nextMessage?.id) return messages;
  const exists = messages.some(message => message.id === nextMessage.id);
  if (exists) {
    return messages.map(message => message.id === nextMessage.id ? { ...message, ...nextMessage } : message);
  }
  return [...messages, nextMessage];
}

function pruneGenerationForCompletedReplies(messages, generationState) {
  const repliedToIds = new Set(
    messages
      .filter(message => message.role === "ai" && message.replyToMessageId)
      .map(message => Number(message.replyToMessageId))
  );
  if (repliedToIds.size === 0) return generationState;
  let changed = false;
  const next = { ...generationState };
  repliedToIds.forEach(id => {
    if (next[id]) {
      delete next[id];
      changed = true;
    }
  });
  return changed ? next : generationState;
}

function ChatProvider({ user, children }) {
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [activeMessages, setActiveMessages] = useState([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [mutatingConversationId, setMutatingConversationId] = useState(null);
  const [error, setError] = useState("");
  const [conversationError, setConversationError] = useState("");
  const [mutationError, setMutationError] = useState("");
  const [legacyNoticeVisible, setLegacyNoticeVisible] = useState(false);
  const [generationByMessageId, setGenerationByMessageId] = useState({});
  const listRequestRef = useRef(0);
  const detailRequestRef = useRef(0);
  const userIdRef = useRef(null);
  const activeConversationIdRef = useRef(null);
  const conversationsRef = useRef([]);
  const automaticTitleRequestsRef = useRef(new Set());
  const generationPollTimeoutRef = useRef(null);
  const userId = user?.id;
  const emailVerificationRequired = Boolean(user && !user.emailVerified);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  const loadConversations = useCallback(async () => {
    if (!userIdRef.current) return;
    const requestId = listRequestRef.current + 1;
    listRequestRef.current = requestId;
    setInitialLoading(true);
    setError("");
    setConversationError("");

    const result = await listChatConversations(50);
    if (requestId !== listRequestRef.current || !userIdRef.current) return;

    if (!result.ok) {
      setConversations([]);
      setActiveConversationId(null);
      setActiveMessages([]);
      setError(result.error);
      setInitialLoading(false);
      return;
    }

    const nextConversations = (result.conversations || []).map(mapServerConversation);
    const savedActiveId = readSavedActiveConversationId(userIdRef.current);
    const restoredId = nextConversations.some(conversation => conversation.id === savedActiveId)
      ? savedActiveId
      : nextConversations[0]?.id || null;

    setConversations(nextConversations);
    setActiveConversationId(restoredId);
    setActiveMessages([]);
    writeSavedActiveConversationId(userIdRef.current, restoredId);
    setLegacyNoticeVisible(
      hasLegacyChatHistory(userIdRef.current) &&
      !hasAcknowledgedChatNotice(userIdRef.current)
    );
    setInitialLoading(false);
  }, []);

  const applyConversationDetailResult = useCallback((result, conversationId, requestUserId, options = {}) => {
    if (userIdRef.current !== requestUserId) return false;

    if (!result.ok) {
      if (result.code === "CHAT_CONVERSATION_NOT_FOUND") {
        setConversations(current => {
          const remaining = current.filter(conversation => conversation.id !== conversationId);
          const nextActiveId = activeConversationIdRef.current === conversationId ? remaining[0]?.id || null : activeConversationIdRef.current;
          if (activeConversationIdRef.current === conversationId) {
            setActiveConversationId(nextActiveId);
            setActiveMessages([]);
            writeSavedActiveConversationId(requestUserId, nextActiveId);
          }
          return remaining;
        });
        if (options.setErrors !== false) setConversationError("");
        return false;
      }

      if (options.setErrors !== false) {
        setActiveMessages([]);
        setConversationError(result.error);
      }
      return false;
    }

    const loadedMessages = mapServerMessagesWithActions(result.messages || [], result.actions || [], result.sources || []);
    const recoveredGenerations = recoveredGenerationState(result.generations || [], loadedMessages);

    if (activeConversationIdRef.current === conversationId) {
      setActiveMessages(loadedMessages);
    }
    setGenerationByMessageId(current =>
      pruneGenerationForCompletedReplies(
        loadedMessages,
        mergeRecoveredGenerationState(current, loadedMessages, recoveredGenerations)
      )
    );
    if (result.conversation) {
      const mapped = mapServerConversation(result.conversation);
      setConversations(current => {
        if (current.some(conversation => conversation.id === mapped.id)) {
          return current.map(conversation => conversation.id === mapped.id ? mapped : conversation);
        }
        return [mapped, ...current];
      });
    }
    return true;
  }, []);

  useEffect(() => {
    userIdRef.current = userId || null;
    listRequestRef.current += 1;
    detailRequestRef.current += 1;
    automaticTitleRequestsRef.current.clear();

    if (!userId) {
      setConversations([]);
      setActiveConversationId(null);
      setActiveMessages([]);
      setInitialLoading(false);
      setConversationLoading(false);
      setSending(false);
      setSyncing(false);
      setMutatingConversationId(null);
      setError("");
      setConversationError("");
      setMutationError("");
      setLegacyNoticeVisible(false);
      setGenerationByMessageId({});
      return;
    }

    setConversations([]);
    setActiveConversationId(null);
    setActiveMessages([]);
    setSending(false);
    setSyncing(false);
    setMutationError("");
    setGenerationByMessageId({});
    loadConversations();
  }, [userId, loadConversations]);

  useEffect(() => {
    if (!userId || !activeConversationId) {
      setActiveMessages([]);
      setConversationLoading(false);
      setConversationError("");
      return;
    }

    writeSavedActiveConversationId(userId, activeConversationId);
    const requestId = detailRequestRef.current + 1;
    detailRequestRef.current = requestId;
    setConversationLoading(true);
    setConversationError("");

    getChatConversation(activeConversationId).then(result => {
      if (requestId !== detailRequestRef.current || userIdRef.current !== userId) return;
      applyConversationDetailResult(result, activeConversationId, userId, { setErrors: true });
      setConversationLoading(false);
    });
  }, [userId, activeConversationId, applyConversationDetailResult]);

  const activeConversation = conversations.find(conversation => conversation.id === activeConversationId) || null;
  const generationActive = Object.values(generationByMessageId).some(item => item.status === "generating");
  const activeGeneratingMessageIds = activeMessages
    .filter(message => message.role === "user" && generationByMessageId[message.id]?.status === "generating")
    .map(message => Number(message.id))
    .filter(Boolean)
    .sort((a, b) => a - b);
  const activeGenerationPollKey = userId && activeConversationId && activeGeneratingMessageIds.length > 0
    ? `${userId}:${activeConversationId}:${activeGeneratingMessageIds.join(",")}`
    : "";

  useEffect(() => {
    if (generationPollTimeoutRef.current && generationPollTimeoutRef.current.key !== activeGenerationPollKey) {
      generationPollTimeoutRef.current = null;
    }
    if (!userId || !activeConversationId || !activeGenerationPollKey || conversationLoading) return undefined;
    if (generationPollTimeoutRef.current?.key === activeGenerationPollKey) return undefined;

    let stopped = false;
    let inFlight = false;
    let timerId = null;
    let controller = null;
    const startedAt = Date.now();
    const requestUserId = userId;
    const requestConversationId = activeConversationId;

    const stop = () => {
      stopped = true;
      if (timerId) window.clearTimeout(timerId);
      if (controller) controller.abort();
    };

    const scheduleNext = () => {
      if (stopped) return;
      if (Date.now() - startedAt >= CHAT_GENERATION_POLL_MAX_MS) {
        generationPollTimeoutRef.current = { key: activeGenerationPollKey };
        return;
      }
      timerId = window.setTimeout(runPoll, CHAT_GENERATION_POLL_INTERVAL_MS);
    };

    const runPoll = async () => {
      if (stopped || inFlight) return;
      if (userIdRef.current !== requestUserId || activeConversationIdRef.current !== requestConversationId) return;
      inFlight = true;
      controller = new AbortController();
      const result = await getChatConversation(requestConversationId, { signal: controller.signal });
      inFlight = false;
      if (stopped || result.aborted) return;
      if (userIdRef.current !== requestUserId || activeConversationIdRef.current !== requestConversationId) return;

      if (result.ok || result.code === "CHAT_CONVERSATION_NOT_FOUND") {
        applyConversationDetailResult(result, requestConversationId, requestUserId, { setErrors: false });
      }
      if (result.code === "AUTH_REQUIRED" || result.code === "CHAT_CONVERSATION_NOT_FOUND") return;
      scheduleNext();
    };

    timerId = window.setTimeout(runPoll, CHAT_GENERATION_POLL_INTERVAL_MS);
    return stop;
  }, [userId, activeConversationId, activeGenerationPollKey, conversationLoading, applyConversationDetailResult]);

  function clearGenerationState(userMessageId) {
    setGenerationByMessageId(current => {
      if (!current[userMessageId]) return current;
      const next = { ...current };
      delete next[userMessageId];
      return next;
    });
  }

  function setGenerationState(userMessageId, state) {
    setGenerationByMessageId(current => ({
      ...current,
      [userMessageId]: state,
    }));
  }

  async function generateReply(conversationIdInput, userMessageIdInput) {
    const conversationId = Number(conversationIdInput);
    const userMessageId = Number(userMessageIdInput);
    if (!conversationId || !userMessageId || !userIdRef.current) return { ok: false };
    if (emailVerificationRequired) {
      setMutationError(i18n.t("auth.emailVerification.cyberGuardLock"));
      return { ok: false, code: "EMAIL_VERIFICATION_REQUIRED", error: i18n.t("auth.emailVerification.cyberGuardLock") };
    }
    if (generationActive || generationByMessageId[userMessageId]?.status === "generating") return { ok: false };

    const requestUserId = userIdRef.current;
    setMutationError("");
    setGenerationState(userMessageId, { status: "generating", errorCode: null, error: "" });

    const result = await generateChatAssistantReply(conversationId, userMessageId, {
      locale: normalizeLocale(i18n.language),
    });

    if (userIdRef.current !== requestUserId) return { ok: false };

    if (!result.ok) {
      setGenerationState(userMessageId, {
        status: "failed",
        errorCode: SAFE_AI_GENERATION_ERROR_CODES.has(result.code) ? result.code : null,
        error: result.error || i18n.t("chat.generation.failedDescription"),
        retryable: isRetryableGenerationError(result.code),
      });
      return { ok: false, error: result.error, code: result.code };
    }

    const conversation = mapServerConversation(result.conversation);
    const userMessage = mapServerMessage(result.userMessage);
    const assistantMessage = withMessageProposal(
      withMessageSources(
        withMessageActions(mapServerMessage(result.assistantMessage), result.actions || []),
        result.sources || []
      ),
      result.proposal || null
    );

    setConversations(current => {
      if (!current.some(item => item.id === conversation.id)) return current;
      return [conversation, ...current.filter(item => item.id !== conversation.id)];
    });

    if (activeConversationIdRef.current === conversation.id) {
      setActiveMessages(current => mergeMessageById(mergeMessageById(current, userMessage), assistantMessage));
    }
    clearGenerationState(userMessageId);
    return { ok: true, assistantMessage };
  }

  async function maybeApplyAutomaticConversationTitle({
    conversationId,
    messageContent,
    requestUserId,
    fallbackConversation,
    firstLearnerMessageId,
  }) {
    const automaticTitle = buildAutomaticConversationTitle(
      messageContent,
      MAX_CONVERSATION_TITLE_LENGTH
    );
    if (!conversationId || !automaticTitle || !requestUserId) return;
    const requestKey = `${Number(conversationId)}:${firstLearnerMessageId || "first-message"}`;
    if (automaticTitleRequestsRef.current.has(requestKey)) return;

    const currentConversation = conversationsRef.current.find(
      conversation => conversation.id === conversationId
    ) || fallbackConversation;
    if (!shouldRequestAutomaticConversationTitle({
      conversation: currentConversation,
      candidateTitle: automaticTitle,
    })) return;

    const titleAtRequestStart = currentConversation.title;
    automaticTitleRequestsRef.current.add(requestKey);

    try {
      const result = await renameChatConversation(conversationId, automaticTitle);
      if (!result.ok || !result.conversation) return;

      const mapped = mapServerConversation(result.conversation);
      setConversations(current => current.map(conversation => {
        if (conversation.id !== mapped.id) return conversation;
        if (!shouldApplyAutomaticConversationTitleResult({
          currentConversation: conversation,
          requestedConversationId: conversationId,
          titleAtRequestStart,
          returnedConversation: mapped,
          currentUserId: userIdRef.current,
          requestUserId,
        })) {
          return conversation;
        }
        return mapped;
      }));
    } finally {
      automaticTitleRequestsRef.current.delete(requestKey);
    }
  }

  function createConversation() {
    if (!userId) return null;
    setActiveConversationId(null);
    setActiveMessages([]);
    setConversationError("");
    setMutationError("");
    setGenerationByMessageId({});
    writeSavedActiveConversationId(userId, null);
    return null;
  }

  async function createConversationFromMessage(text) {
    return startDashboardConversation(text);
  }

  async function startDashboardConversation(firstMessage) {
    const clean = String(firstMessage || "").trim();
    if (!clean || syncing || generationActive || !userIdRef.current) return { ok: false };
    if (emailVerificationRequired) {
      setMutationError(i18n.t("auth.emailVerification.cyberGuardLock"));
      return { ok: false, code: "EMAIL_VERIFICATION_REQUIRED", error: i18n.t("auth.emailVerification.cyberGuardLock") };
    }
    const requestUserId = userIdRef.current;
    setSyncing(true);
    setMutationError("");

    const result = await createChatConversation({
      message: { role: "user", content: clean },
      locale: normalizeLocale(i18n.language),
    });

    if (userIdRef.current !== requestUserId) return { ok: false };
    setSyncing(false);

    if (!result.ok) {
      setMutationError(result.error);
      return { ok: false, error: result.error };
    }

    const conversation = mapServerConversation(result.conversation);
    const messages = (result.messages || []).map(mapServerMessage);
    setConversations(current => [conversation, ...current.filter(item => item.id !== conversation.id)]);
    setActiveConversationId(conversation.id);
    setActiveMessages(messages);
    writeSavedActiveConversationId(userIdRef.current, conversation.id);
    const firstUserMessage = messages.find(message => message.role === "user");
    if (firstUserMessage && isDefaultConversationTitle(conversation.title)) {
      maybeApplyAutomaticConversationTitle({
        conversationId: conversation.id,
        messageContent: firstUserMessage.content || firstUserMessage.text,
        requestUserId,
        fallbackConversation: conversation,
        firstLearnerMessageId: firstUserMessage.id,
      });
    }
    if (firstUserMessage) {
      generateReply(conversation.id, firstUserMessage.id);
    }
    return { ok: true, conversationId: conversation.id, messageId: firstUserMessage?.id || null };
  }

  function selectConversation(id) {
    const conversationId = Number(id);
    if (!conversations.some(conversation => conversation.id === conversationId)) return;
    setActiveConversationId(conversationId);
    setConversationError("");
    setMutationError("");
    writeSavedActiveConversationId(userId, conversationId);
  }

  async function renameConversation(id, title) {
    const nextTitle = normalizeConversationTitle(title);
    const conversationId = Number(id);
    if (!nextTitle || nextTitle.length > MAX_CONVERSATION_TITLE_LENGTH || mutatingConversationId) return false;
    setMutatingConversationId(conversationId);
    setMutationError("");
    const result = await renameChatConversation(conversationId, nextTitle);
    setMutatingConversationId(null);
    if (!userIdRef.current) return false;
    if (!result.ok) {
      setMutationError(result.error);
      return false;
    }
    const mapped = mapServerConversation(result.conversation);
    setConversations(current => current.map(conversation => conversation.id === mapped.id ? mapped : conversation));
    return true;
  }

  async function deleteConversation(id) {
    const conversationId = Number(id);
    if (!conversationId || mutatingConversationId) return false;
    setMutatingConversationId(conversationId);
    setMutationError("");
    const result = await deleteChatConversation(conversationId);
    setMutatingConversationId(null);
    if (!userIdRef.current) return false;
    if (!result.ok) {
      setMutationError(result.error);
      return false;
    }
    setConversations(current => {
      const remaining = current.filter(conversation => conversation.id !== conversationId);
      const nextActiveId = activeConversationId === conversationId ? remaining[0]?.id || null : activeConversationId;
      setActiveConversationId(nextActiveId);
      if (activeConversationId === conversationId) {
        setActiveMessages([]);
        setGenerationByMessageId({});
      }
      writeSavedActiveConversationId(userIdRef.current, nextActiveId);
      return remaining;
    });
    return true;
  }

  async function sendMessage(text) {
    const clean = text.trim();
    if (!clean || sending || syncing || generationActive || !userIdRef.current) return { ok: false };
    if (emailVerificationRequired) {
      setMutationError(i18n.t("auth.emailVerification.cyberGuardLock"));
      return { ok: false, code: "EMAIL_VERIFICATION_REQUIRED", error: i18n.t("auth.emailVerification.cyberGuardLock") };
    }
    const requestUserId = userIdRef.current;
    const shouldAutoTitleAfterFirstMessage = Boolean(
      activeConversation &&
      Number(activeConversation.messageCount || 0) === 0 &&
      activeMessages.filter(message => message.role === "user").length === 0 &&
      isDefaultConversationTitle(activeConversation.title)
    );

    setSending(true);
    setMutationError("");

    if (!activeConversationId) {
      const created = await startDashboardConversation(clean);
      setSending(false);
      return created;
    }

    const result = await createChatUserMessage(activeConversationId, {
      role: "user",
      content: clean,
      locale: normalizeLocale(i18n.language),
    });
    setSending(false);
    if (!userIdRef.current) return { ok: false };
    if (!result.ok) {
      setMutationError(result.error);
      return { ok: false, error: result.error };
    }

    const message = mapServerMessage(result.message);
    const conversation = mapServerConversation(result.conversation);
    setActiveMessages(current => [...current, message]);
    setConversations(current => [conversation, ...current.filter(item => item.id !== conversation.id)]);
    if (shouldAutoTitleAfterFirstMessage && isDefaultConversationTitle(conversation.title)) {
      maybeApplyAutomaticConversationTitle({
        conversationId: conversation.id,
        messageContent: message.content || message.text,
        requestUserId,
        firstLearnerMessageId: message.id,
      });
    }
    generateReply(conversation.id, message.id);
    return { ok: true, message };
  }

  async function retryGeneration(conversationId, userMessageId) {
    return generateReply(conversationId, userMessageId);
  }

  function dismissLegacyNotice() {
    acknowledgeChatNotice(userIdRef.current);
    setLegacyNoticeVisible(false);
  }

  const value = {
    conversations,
    activeConversation,
    activeConversationId,
    messages: activeMessages,
    activeMessages,
    initialLoading,
    conversationLoading,
    sending,
    syncing,
    generating: generationActive,
    generationByMessageId,
    mutatingConversationId,
    error,
    conversationError,
    mutationError,
    emailVerificationRequired,
    legacyNoticeVisible,
    disabledAssistantNotice: activeMessages.length > 0,
    createConversation,
    createConversationFromMessage,
    startDashboardConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    sendMessage,
    generateReply,
    retryGeneration,
    retry: loadConversations,
    retryConversation: () => {
      const id = activeConversationId;
      setActiveConversationId(null);
      window.setTimeout(() => setActiveConversationId(id), 0);
    },
    dismissLegacyNotice,
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
  const hasEmailVerified = Object.hasOwn(userData || {}, "emailVerified");
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
    emailVerified: hasEmailVerified ? Boolean(userData.emailVerified) : false,
    emailVerifiedAt: userData?.emailVerifiedAt || null,
    emailVerificationNotice: userData?.emailVerificationNotice || null,
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
  const errorData = data.error && typeof data.error === "object" ? data.error : data;
  const result = {
    ok: false,
    code: errorData.code,
    message: errorData.message,
    errors: data.errors || fallbackErrors,
    retryAfterSeconds: data.retryAfterSeconds,
    canResend: data.canResend,
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
    const result = await registerAccount(account);
    const data = result.data || {};

    if (!result.ok) return apiFailure(data, "errors.fallback.register");

    return { ok: true, user: data.user, profile: data.profile, verification: data.verification || null };

  } catch (error) {
    console.error("Registration error:", error);
    return networkFailure("errors.fallback.network");
  }
}

async function dbLogin(email, password) {
  try {
    const result = await loginAccount(email, password);
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.signIn");

    return { ok: true, user: data.user, profile: data.profile };
  } catch {
    return networkFailure("errors.fallback.network");
  }
}

async function dbMe() {
  try {
    const result = await restoreSession();
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.session");
    return { ok: true, user: data.user, profile: data.profile };
  } catch {
    return networkFailure("errors.fallback.session");
  }
}

async function dbAdminStatus() {
  try {
    const result = await getAdminStatus();
    const data = result.status || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.generic");
    return { ok: true, status: data };
  } catch {
    return networkFailure("errors.fallback.network");
  }
}

async function dbSaveProfile(profile) {
  try {
    const result = await saveProfileRequest(profile);
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.saveProfile");
    return { ok: true, profile: data.profile };
  } catch {
    return networkFailure("errors.fallback.saveProfile");
  }
}

async function dbSaveAccount(account) {
  try {
    const result = await saveAccountRequest(account);
    const data = result.data || {};

    if (!result.ok) return apiFailure(data, "errors.fallback.saveAccount");

    return {
      ok: true,
      account: data.account,
    };
  } catch {
    return networkFailure("errors.fallback.saveAccount");
  }
}

async function dbGetInitialAssessment(locale) {
  try {
    const result = await getInitialAssessment({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadAssessment");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadAssessment");
  }
}

async function dbGetAssessmentStatus(locale) {
  try {
    const result = await getInitialAssessmentStatus({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadAssessmentStatus");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadAssessmentStatus");
  }
}

async function dbStartInitialAttempt(locale) {
  try {
    const result = await createInitialAssessmentAttempt({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.startAssessment");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.startAssessment");
  }
}

async function dbSaveAssessmentAnswer(attemptId, questionId, selectedOptionKey) {
  try {
    const result = await saveAssessmentAnswer(attemptId, { questionId, selectedOptionKey });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.saveAssessmentAnswer");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.saveAssessmentAnswer");
  }
}

async function dbSubmitAssessment(attemptId, locale) {
  try {
    const result = await submitAssessmentAttempt(attemptId, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.submitAssessment");
    return { ok: true, result: data };
  } catch {
    return networkFailure("errors.fallback.submitAssessment");
  }
}

async function dbGetProgress() {
  try {
    const result = await getProgress();
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadProgress");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadProgress");
  }
}

async function dbGetCurrentRecommendation(locale) {
  try {
    const result = await getCurrentRecommendation({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadRecommendation");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadRecommendation");
  }
}

async function dbMarkRecommendationViewed(id, locale) {
  try {
    const result = await markRecommendationViewed(id, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.updateRecommendation");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.updateRecommendation");
  }
}

async function dbMarkRecommendationCompleted(id, locale) {
  try {
    const result = await markRecommendationCompleted(id, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.completeRecommendation");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.completeRecommendation");
  }
}

async function dbGetScenarios(filters = {}, locale) {
  try {
    const result = await listScenarios({
      topicCode: filters.topicCode,
      difficulty: filters.difficulty,
      locale: normalizeLocale(locale),
    });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadScenarios");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadScenarios");
  }
}

async function dbGetScenario(slug, locale) {
  try {
    const result = await getScenarioBySlug(slug, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadScenario");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadScenario");
  }
}

async function dbStartScenario(slug, locale) {
  try {
    const result = await startScenarioAttempt(slug, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.startScenario");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.startScenario");
  }
}

async function dbGetScenarioAttempt(attemptId, locale) {
  try {
    const result = await getScenarioAttempt(attemptId, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.restoreScenario");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.restoreScenario");
  }
}

async function dbSaveScenarioDecision(attemptId, stepId, selectedOptionKey, locale) {
  try {
    const result = await saveScenarioDecision(attemptId, { stepId, selectedOptionKey }, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.saveScenarioDecision");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.saveScenarioDecision");
  }
}

async function dbCompleteScenario(attemptId, locale) {
  try {
    const result = await completeScenarioAttempt(attemptId, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.completeScenario");
    return { ok: true, result: data };
  } catch {
    return networkFailure("errors.fallback.completeScenario");
  }
}

async function dbGetScenarioResult(attemptId, locale) {
  try {
    const result = await getScenarioAttemptResult(attemptId, { locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadScenarioResult");
    return { ok: true, result: data };
  } catch {
    return networkFailure("errors.fallback.loadScenarioResult");
  }
}

async function dbGetRecommendedScenarios(locale) {
  try {
    const result = await getRecommendedScenarios({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadRecommendedScenarios");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadRecommendedScenarios");
  }
}

async function dbGetScenarioDashboard(locale) {
  try {
    const result = await getScenarioDashboard({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadScenarioActivity");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadScenarioActivity");
  }
}

async function dbGetResources(locale) {
  try {
    const result = await listResources({ locale: normalizeLocale(locale) });
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.loadResources");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.loadResources");
  }
}

async function dbLogout() {
  try {
    await logoutSession();
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
  phishing_and_scams: { label: "Scams & Social Engineering", category: "Scams", icon: "🎣" },
  password_and_account_security: { label: "Passwords & Account Security", category: "Passwords", icon: "🔐" },
  privacy_and_personal_information: { label: "Privacy & Personal Data Protection", category: "Privacy", icon: "🕵️" },
  misinformation_and_deepfakes: { label: "Misinformation, Media & AI Safety", category: "Misinformation", icon: "🧠" },
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

const ACTIVITY_SEGMENT_ICONS = {
  assessment_topics: "◇",
  completed_scenarios: "✓",
  completed_recommendations: "→",
  learning_events: "•",
};

function activitySegmentLabelKey(segmentId) {
  return `progress.activityComposition.segments.${segmentId}`;
}

function activitySegmentCountKey(segmentId) {
  return `progress.activityComposition.segmentCounts.${segmentId}`;
}

function recentActivityLabelKey(type) {
  return `progress.recentActivity.types.${type}`;
}

function learningPathSegmentLabelKey(segmentId) {
  return `progress.learningPath.segments.${segmentId}`;
}

function learningPathComponentLabelKey(componentId) {
  return `progress.learningPath.components.${componentId}`;
}

function learningPathStatusMessageKey(componentId, status) {
  if (componentId === "assessment" && status === "not_completed") return "progress.learningPath.noAssessment";
  if (componentId === "scenarios" && status === "no_eligible_scenarios") return "progress.learningPath.noEligibleScenarios";
  if (componentId === "engagement" && status === "none_completed") return "progress.learningPath.noCompletedRecommendations";
  return null;
}

function LearningPathProgressPanel({ value, t, compact = false, onViewJourney }) {
  const progress = normalizeLearningPathProgress(value);
  const segments = buildLearningPathSegments(progress);
  const components = [
    {
      id: "assessment",
      data: progress.assessment,
      meta: progress.assessment.totalQuestions > 0
        ? t("progress.learningPath.assessmentCount", {
          correct: progress.assessment.correctAnswers,
          total: progress.assessment.totalQuestions,
        })
        : t("progress.learningPath.noAssessment"),
    },
    {
      id: "scenarios",
      data: progress.scenarios,
      meta: progress.scenarios.totalEligible > 0
        ? t("progress.learningPath.scenarioCount", {
          completed: progress.scenarios.completedUnique,
          total: progress.scenarios.totalEligible,
        })
        : t("progress.learningPath.noEligibleScenarios"),
    },
    {
      id: "engagement",
      data: progress.engagement,
      meta: progress.engagement.completedRecommendations > 0
        ? t("progress.learningPath.recommendationCount", {
          count: progress.engagement.completedRecommendations,
        })
        : t("progress.learningPath.noCompletedRecommendations"),
    },
  ];
  const reachedCore = progress.displayedPercent >= 100;

  return (
    <div className={`card learning-path-card${compact ? " compact" : ""}`}>
      <div className="learning-path-header">
        <div>
          <p className="section-title" style={{ fontSize: compact ? "1rem" : "1.1rem", marginBottom: "0.25rem" }}>
            {t("progress.learningPath.title")}
          </p>
          <p className="section-sub" style={{ marginBottom: 0 }}>
            {reachedCore ? t("progress.learningPath.coreReached") : t("progress.learningPath.shortDescription")}
          </p>
        </div>
        <div className="learning-path-percent" aria-label={t("progress.learningPath.percentAria", { percent: progress.displayedPercent })}>
          {progress.displayedPercent}%
        </div>
      </div>
      <div
        className="learning-path-bar"
        role="img"
        aria-label={t("progress.learningPath.barAriaLabel", { percent: progress.displayedPercent })}
      >
        {segments.map(segment => (
          <span
            key={segment.id}
            className={`learning-path-segment ${segment.id}`}
            style={{ width: `${segment.width}%` }}
            title={t(learningPathSegmentLabelKey(segment.id), { defaultValue: segment.id })}
          />
        ))}
      </div>
      {!compact && (
        <>
          <div className="learning-path-breakdown" aria-label={t("progress.learningPath.breakdownTitle")}>
            <div style={{ gridColumn: "1 / -1", fontWeight: 800, color: "#27332f", fontSize: "0.9rem" }}>
              {t("progress.learningPath.breakdownTitle")}
            </div>
            {components.map(component => {
              const statusKey = learningPathStatusMessageKey(component.id, component.data.status);
              return (
                <div key={component.id} className="learning-path-component">
                  <div className="learning-path-component-label">
                    {t(learningPathComponentLabelKey(component.id))}
                  </div>
                  <div className="learning-path-component-value">
                    {t("progress.learningPath.pointsOutOf", {
                      earned: formatLearningPathPoints(component.data.earnedPoints),
                      maximum: formatLearningPathPoints(component.data.maximumPoints),
                    })}
                  </div>
                  <div className="learning-path-component-meta">
                    {statusKey ? t(statusKey) : component.meta}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="learning-path-disclaimer">
            {t("progress.learningPath.disclaimer")}
          </div>
        </>
      )}
      {compact && (
        <>
          <div className="learning-path-disclaimer">
            {t("progress.learningPath.shortDisclaimer")}
          </div>
          {onViewJourney && (
            <button onClick={onViewJourney} style={{ marginTop: "0.75rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
              {t("progress.learningPath.viewJourney")}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 1 — Account credentials
// ─────────────────────────────────────────────────────────────────
function StepCredentials({ data, onChange, errors }) {
  const { t } = useTranslation();

  return (
    <>
      <h1 className="cy-auth-step-title">
        {t("auth.createAccount")}
      </h1>

      <p className="cy-auth-step-description">
        {t("auth.accountDetailsHint")}
      </p>

      <div className="cy-auth-field">
        <label htmlFor="register-email">
          {t("auth.email")}
        </label>

        <input
          id="register-email"
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

      <div className="cy-auth-field">
        <label htmlFor="register-display-name">
          {t("auth.displayName")}
        </label>

        <input
          id="register-display-name"
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

      <div className="cy-auth-field">
        <label htmlFor="register-age">
          {t("auth.age")}
        </label>

        <input
          id="register-age"
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

      <div className="cy-auth-field">
        <label htmlFor="register-password">
          {t("auth.password")}
        </label>

        <input
          id="register-password"
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
      <h1 className="cy-auth-step-title">{t("onboarding.nicknameQuestion")}</h1>
      <p className="cy-auth-step-description" id="register-nickname-hint">{t("onboarding.nicknameHint")}</p>

      <div className="cy-auth-field">
        <label className="cy-auth-visually-hidden" htmlFor="register-ai-nickname">{t("onboarding.aiNickname")}</label>
        <input
          id="register-ai-nickname"
          data-field="aiNickname"
          placeholder={t(
            "onboarding.nicknamePlaceholder"
          )}
          value={data.aiNickname}
          aria-invalid={Boolean(errors.aiNickname)}
          aria-describedby={errors.aiNickname ? "register-ai-nickname-error register-nickname-hint" : "register-nickname-hint"}
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
      <h1 className="cy-auth-step-title">{t("onboarding.educationQuestion")}</h1>

      <div className="cy-auth-option-grid">
        {EDUCATION_LEVELS.map(level => (
          <button
            key={level.value}
            data-field="educationLevel"
            className={`cy-auth-option ${
              data.educationLevel === level.value
                ? "selected"
                : ""
            }`}
            aria-pressed={data.educationLevel === level.value}
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
      <h1 className="cy-auth-step-title">{t("onboarding.languageQuestion")}</h1>

      <div className="cy-auth-option-grid">
        {LANGUAGES.map(languageOption => (
          <button
            key={languageOption.value}
            data-field="language"
            className={`cy-auth-option ${
              data.language ===
              languageOption.value
                ? "selected"
                : ""
            }`}
            aria-pressed={data.language === languageOption.value}
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
      <h1 className="cy-auth-step-title">{t("onboarding.familiarityQuestion")}</h1>

      <div className="cy-auth-option-grid">
        {FAMILIARITY.map(level => (
          <button
            key={level.value}
            data-field="familiarity"
            className={`cy-auth-option ${
              data.familiarity === level.value
                ? "selected"
                : ""
            }`}
            aria-pressed={data.familiarity === level.value}
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

            <span className="cy-auth-option-description">
              {t(
                `profileOptions.familiarity.${level.value}.description`,
                {
                  defaultValue:
                    level.desc,
                }
              )}
            </span>
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
      <h1 className="cy-auth-step-title">
        {t("onboarding.helpTopicsQuestion")}
      </h1>
      <p className="cy-auth-step-description">{t("onboarding.helpTopicsHint")}</p>

      <div className="cy-auth-chip-grid">
        {HELP_OPTIONS.map(topic => (
          <button
            key={topic.value}
            data-field="helpTopics"
            className={`cy-auth-chip ${
              selected.includes(topic.value)
                ? "selected"
                : ""
            }`}
            aria-pressed={selected.includes(topic.value)}
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

      <div className="cy-auth-selection-count" aria-live="polite">
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
      <h1 className="cy-auth-step-title">{t("onboarding.learningStyleQuestion")}</h1>

      <div className="cy-auth-option-grid">
        {LEARNING_STYLES.map(style => (
          <button
            key={style.value}
            data-field="learningStyle"
            className={`cy-auth-option ${
              data.learningStyle === style.value
                ? "selected"
                : ""
            }`}
            aria-pressed={data.learningStyle === style.value}
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

        accountUser = {
          ...result.user,
          emailVerificationNotice: result.verification || null,
        };
        setRegisteredUser(accountUser);
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
    <div className="cy-auth-shell">
      <Surface className="cy-auth-panel cy-auth-register">
        <div className="cy-auth-logo">
          <img className="auth-logo-image" src={cyberlyAuthLogo} alt="Cyberly" />
        </div>
        <PageIdentity label={t("auth.createAccount")} icon="◇" className="cy-auth-identity" />

        <div
          className="cy-auth-progress"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={TOTAL_STEPS}
          aria-valuenow={step}
          aria-valuetext={t("onboarding.progress", { step, total: TOTAL_STEPS, label: stepLabel })}
        >
          <div className="cy-auth-progress-track" aria-hidden="true">
            <div
              className="cy-auth-progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />
          </div>

          <div className="cy-auth-progress-label">
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
            className="field-error cy-auth-form-error"
            role="alert"
          >
            {errors.form}
          </div>
        )}

        {/* Navigation */}
        <div className="cy-auth-actions">
          {step > 1 && (
            <Button
              variant="quiet"
              onClick={back}
              disabled={loading}
            >
              ← {t("common.back")}
            </Button>
          )}

          <Button
            variant="primary"
            onClick={next}
            loading={loading}
            loadingLabel={registeredUser ? t("onboarding.savingProfile") : t("onboarding.settingUp")}
          >
            {step === TOTAL_STEPS
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
          </Button>
        </div>

        <div className="cy-auth-switch">
          {t("auth.signInPrompt")}{" "}

          <Button
            variant="quiet"
            onClick={onSwitch}
            disabled={loading}
          >
            {t("auth.goToLogin")}
          </Button>
        </div>
      </Surface>
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
    <div className="cy-auth-shell">
      <Surface className="cy-auth-panel cy-auth-login">
        <div className="cy-auth-logo">
          <img className="auth-logo-image" src={cyberlyAuthLogo} alt="Cyberly" />
        </div>
        <PageIdentity label={t("auth.login")} icon="◇" className="cy-auth-identity" />

        <h1 className="cy-auth-step-title">{t("auth.welcomeBack")}</h1>

        <p className="cy-auth-step-description">{t("auth.loginDescription")}</p>

        <div className="cy-auth-field">
          <label htmlFor="login-email">
            {t("auth.email")}
          </label>

          <input
            id="login-email"
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

        <div className="cy-auth-field">
          <label htmlFor="login-password">
            {t("auth.password")}
          </label>

          <input
            id="login-password"
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
            className="field-error cy-auth-form-error"
            role="alert"
          >
            {errors.form}
          </div>
        )}

        <div className="cy-auth-actions cy-auth-login-actions">
          <Button
            variant="primary"
            onClick={handleSubmit}
            loading={loading}
            loadingLabel={t("auth.loading")}
          >
            {t("auth.signInButton")}
          </Button>
        </div>

        <div className="cy-auth-switch">
          <span>
            {t("auth.registerPrompt")}
          </span>{" "}

          <Button
            variant="quiet"
            onClick={onSwitch}
            disabled={loading}
          >
            {t("auth.goToRegister")}
          </Button>
        </div>
      </Surface>
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
    <div className="cy-auth-route">
      <PageContainer width="reading" className="cy-auth-route-container">
      <Button
        variant="quiet"
        className="cy-auth-back"
        onClick={() => go("home")}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 5l-7 7 7 7"/>
        </svg>
        {t("common.backToHome")}
      </Button>
      {mode === "login"
        ? <LoginPage    onSwitch={() => setMode("register")} />
        : <RegisterPage onSwitch={() => setMode("login")}    />
      }
      </PageContainer>
    </div>
  );
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
    { emoji: "😨", labelKey: "home.stats.scamVictimLabel", descKey: "home.stats.scamVictim" },
    { emoji: "📧", labelKey: "home.stats.scamMessagesLabel", descKey: "home.stats.scamMessages" },
    { emoji: "🎓", labelKey: "home.stats.noWorkshopLabel", descKey: "home.stats.noWorkshop" },
    { emoji: "📱", labelKey: "home.stats.dailyOnlineLabel", descKey: "home.stats.dailyOnline" },
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
    <div className="cy-home-page">
      <PageContainer className="cy-home-hero-wrap">
        <ExplorerHeroSurface
          identity="Cyberly"
          icon="◇"
          className="cy-home-hero"
          visual={(
            <div className="cy-home-gateway-visual">
              <span className="cy-home-gateway-ring" />
              <span className="cy-home-gateway-path" />
              <span className="cy-home-gateway-shield" />
              <span className="cy-home-gateway-node cy-home-gateway-node-one" />
              <span className="cy-home-gateway-node cy-home-gateway-node-two" />
              <span className="cy-home-gateway-node cy-home-gateway-node-three" />
            </div>
          )}
        >
          <h1 className="cy-home-hero-title">{t("home.hero.title")}</h1>
          <p className="cy-home-hero-description">{t("home.hero.description")}</p>
          <Button variant="primary" className="cy-home-primary-action" onClick={homeCta.action}>
            {homeCta.label}
          </Button>
          <ul className="cy-home-hero-signals" aria-label={t("home.hero.title")}>
            <li><Badge tone="brand">🎓 {t("home.hero.chips.students")}</Badge></li>
            <li><Badge tone="neutral">🌐 {t("home.hero.chips.languages")}</Badge></li>
            <li><Badge tone="success">🤖 {t("home.hero.chips.aiPersonalised")}</Badge></li>
          </ul>
        </ExplorerHeroSurface>
      </PageContainer>

      <div className="cy-home-awareness-band">
        <PageContainer>
          <PageSection className="cy-home-awareness-section">
            <h2 className="cy-home-section-title cy-home-awareness-title">{t("home.threats.eyebrow")}</h2>
            <ul className="cy-home-stat-grid">
              {threatStats.map(stat => (
                <li key={stat.labelKey} className="cy-home-stat-item">
                  <span className="cy-home-stat-icon" aria-hidden="true">{stat.emoji}</span>
                  <strong className="cy-home-stat-value">{t(stat.labelKey)}</strong>
                  <span className="cy-home-stat-description">{t(stat.descKey)}</span>
                </li>
              ))}
            </ul>
          </PageSection>
        </PageContainer>
      </div>

      <PageContainer>
        <PageSection className="cy-home-section">
          <div className="cy-home-section-heading">
            <h2 className="cy-home-section-title">{t("home.why.title")}</h2>
            <p className="cy-home-section-description">{t("home.why.description")}</p>
          </div>
          <ul className="cy-home-feature-grid">
            {[
              { icon: "🧠", titleKey: "home.why.cards.adaptive.title", descKey: "home.why.cards.adaptive.description" },
              { icon: "🔒", titleKey: "home.why.cards.skills.title", descKey: "home.why.cards.skills.description" },
              { icon: "🎯", titleKey: "home.why.cards.topics.title", descKey: "home.why.cards.topics.description" },
            ].map(item => (
              <Surface as="li" key={item.titleKey} className="cy-home-feature-card">
                <span className="cy-home-feature-icon" aria-hidden="true">{item.icon}</span>
                <h3>{t(item.titleKey)}</h3>
                <p>{t(item.descKey)}</p>
              </Surface>
            ))}
          </ul>
        </PageSection>

        <PageSection className="cy-home-section cy-home-threat-section">
          <Surface className="cy-home-threat-card" variant="subdued">
            <div className="cy-home-threat-icon" aria-hidden="true">!</div>
            <div className="cy-home-threat-copy">
              <Badge tone="warning">{t("home.threatOfWeek.badge")}</Badge>
              <h2 className="cy-home-section-title">{t("home.threatOfWeek.title")}</h2>
              <p>{t("home.threatOfWeek.description")}</p>
            </div>
            <Button variant="secondary" onClick={() => go("resources")}>
              {t("common.learnMore")}
            </Button>
          </Surface>
        </PageSection>

        <PageSection className="cy-home-section">
          <div className="cy-home-section-heading">
            <h2 className="cy-home-section-title">{t("home.quickTopics.title")}</h2>
            <p className="cy-home-section-description">{t("home.quickTopics.description")}</p>
          </div>
          <ul className="cy-home-topic-list">
            {topics.map(topic => (
              <li key={topic.labelKey}>
                <Button variant="secondary" className="cy-home-topic-button" onClick={() => go("resources")}>
                  <span aria-hidden="true">{topic.emoji}</span>
                  <span>{t(topic.labelKey)}</span>
                </Button>
              </li>
            ))}
          </ul>
        </PageSection>
      </PageContainer>

      <div className="cy-home-journey-band">
        <PageContainer>
          <PageSection className="cy-home-section cy-home-journey-section">
            <div className="cy-home-section-heading cy-home-section-heading-centered">
              <h2 className="cy-home-section-title">{t("home.how.title")}</h2>
              <p className="cy-home-section-description">{t("home.how.description")}</p>
            </div>
            <ol className="cy-home-journey-list">
              {steps.map(stepItem => (
                <li key={stepItem.num} className="cy-home-journey-step">
                  <span className="cy-home-journey-number" aria-hidden="true">{stepItem.num}</span>
                  <div>
                    <h3><span aria-hidden="true">{stepItem.icon}</span> {t(stepItem.titleKey)}</h3>
                    <p>{t(stepItem.descKey)}</p>
                  </div>
                </li>
              ))}
            </ol>
          </PageSection>
        </PageContainer>
      </div>

      <PageContainer width="reading">
        <PageSection className="cy-home-final-section">
          <Surface className="cy-home-final-card">
            <span className="cy-home-final-mark" aria-hidden="true">◇</span>
            <h2 className="cy-home-section-title">{t("home.bottomCta.title")}</h2>
            <p>{t("home.bottomCta.description")}</p>
            <Button variant="primary" className="cy-home-primary-action" onClick={homeCta.action}>
              {homeCta.label}
            </Button>
            <small>{t("home.bottomCta.note")}</small>
          </Surface>
        </PageSection>
      </PageContainer>
    </div>
  );
}

// ─── Page: Dashboard ──────────────────────────────────────────────
const DASHBOARD_SECTIONS = [
  { id: "dashboard-overview", labelKey: "dashboard.sectionNav.overview" },
  { id: "dashboard-learning-profile", labelKey: "dashboard.sectionNav.learningProfile" },
  { id: "dashboard-measured-progress", labelKey: "dashboard.sectionNav.measuredProgress" },
  { id: "dashboard-initial-assessment", labelKey: "dashboard.sectionNav.initialAssessment" },
  { id: "dashboard-recommended-next-step", labelKey: "dashboard.sectionNav.recommendedNextStep" },
  { id: "dashboard-scenario-practice", labelKey: "dashboard.sectionNav.scenarioPractice" },
  { id: "dashboard-topic-mastery", labelKey: "dashboard.sectionNav.topicMastery" },
  { id: "dashboard-quick-actions", labelKey: "dashboard.sectionNav.quickActions" },
  { id: "dashboard-cyberguard-ai", labelKey: "dashboard.sectionNav.cyberGuardAi" },
];

const PROGRESS_SECTIONS = [
  ...getProgressSections({ hasAssessmentResults: true, hasRecommendation: true }),
];

function DashboardPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const { user, go, openRecommendedResource, openScenarioTarget } = useApp();
  const { conversations, selectConversation, initialLoading: chatHistoryLoading } = useChat();
  const assessmentLocale = normalizeLocale(activeI18n.language);
  const [tipIndex] = useState(() => Math.floor(Math.random() * 4));
  const [assessmentStatus, setAssessmentStatus] = useState({ loading: true, status: "pending" });
  const [progressState, setProgressState] = useState({ loading: true, progress: null });
  const [recommendationState, setRecommendationState] = useState({ loading: true, recommendation: null });
  const [scenarioState, setScenarioState] = useState({ loading: true, recommended: [], dashboard: null });
  const [activeSection, setActiveSection] = useState("dashboard-overview");
  const dashboardAssessmentResults = (progressState.progress?.assessmentTopicResults || []).map(mapAssessmentTopicResult);
  const hasLearningProfileSection = Boolean(user?.helpTopics?.length);
  const hasTopicMasterySection = Boolean(dashboardAssessmentResults.length);
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

    const isAtPageEnd = () => {
      const tolerance = 4;
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0
      );
      const maxScrollY = Math.max(0, documentHeight - window.innerHeight);

      if (maxScrollY <= tolerance) return false;
      return window.scrollY >= maxScrollY - tolerance;
    };

    const observer = new IntersectionObserver((entries) => {
      if (isAtPageEnd()) {
        setActiveSection(sectionIds[sectionIds.length - 1]);
        return;
      }

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

    const updateActiveSectionAtPageEnd = () => {
      if (isAtPageEnd()) setActiveSection(sectionIds[sectionIds.length - 1]);
    };

    sections.forEach(section => observer.observe(section));
    window.addEventListener("scroll", updateActiveSectionAtPageEnd, { passive: true });
    updateActiveSectionAtPageEnd();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveSectionAtPageEnd);
    };
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
  const dashboardLearningPathProgress = progressState.progress?.learningPathProgress;
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
      openScenarioTarget(recommendedScenario, "dashboard");
    } else if (recommendation?.topicCode) {
      openRecommendedResource(recommendation.topicCode);
    } else {
      go("assessment");
    }
  }

  function viewDashboardChatHistory() {
    const latestConversation = conversations.reduce((latest, conversation) => {
      if (!latest) return conversation;
      const latestTime = Date.parse(latest.updatedAt || latest.createdAt || 0);
      const currentTime = Date.parse(conversation.updatedAt || conversation.createdAt || 0);
      return currentTime > latestTime ? conversation : latest;
    }, null);
    if (latestConversation) selectConversation(latestConversation.id);
    go("ai-chat");
  }

  const quickActions = [
    {
      icon: "📚",
      labelKey: "dashboard.actions.resources",
      descKey: "dashboard.actions.resourcesDescription",
      page: "resources",
    },
    {
      icon: "🧭",
      labelKey: "dashboard.actions.assessment",
      descKey: "dashboard.actions.assessmentDescription",
      page: "assessment",
    },
    {
      icon: "🎮",
      labelKey: "dashboard.actions.scenarios",
      descKey: "dashboard.actions.scenariosDescription",
      page: "scenarios",
    },
    {
      icon: "👤",
      labelKey: "dashboard.actions.profile",
      descKey: "dashboard.actions.profileDescription",
      page: "profile",
    },
    {
      icon: "ℹ️",
      labelKey: "dashboard.actions.about",
      descKey: "dashboard.actions.aboutDescription",
      page: "about",
    },
    {
      icon: "📊",
      labelKey: "dashboard.actions.progress",
      descKey: "dashboard.actions.progressDescription",
      page: "progress",
    },
    {
      icon: "🏠",
      labelKey: "dashboard.actions.home",
      descKey: "dashboard.actions.homeDescription",
      page: "home",
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
      <PageContainer id="dashboard-overview" className="dashboard-anchor">
        <ExplorerHeroSurface
          identity={t("dashboard.yourDashboard")}
          icon={<span aria-hidden="true">◇</span>}
          visual={<DashboardExplorerVisual />}
          className="dashboard-explorer-hero"
        >
          <CompactHeader
            title={`${t("dashboard.welcomeBack", { name: nick })} 👋`}
            description={t("dashboard.continueLearning")}
            metadata={(
              <>
                <span>{translatedAgeGroup}</span>
                <span aria-hidden="true">·</span>
                <span>{t("dashboard.levelDisplay", { level: translatedFamiliarity })}</span>
                {translatedEducation && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>{translatedEducation}</span>
                  </>
                )}
              </>
            )}
          />
        </ExplorerHeroSurface>
      </PageContainer>

      <div className="dashboard-shell">
        <SectionNav
          ariaLabel={t("dashboard.sectionNav.ariaLabel")}
          title={t("dashboard.sectionNav.title")}
          items={dashboardSections.map(section => ({ id: section.id, label: t(section.labelKey) }))}
          activeId={activeSection}
          onSelect={scrollToDashboardSection}
        />

      <div className="dashboard-content">

        {/* Profile summary */}
        {user.helpTopics?.length > 0 && (
          <div id="dashboard-learning-profile" className="card dashboard-anchor dashboard-journey-surface" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
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

        <div id="dashboard-measured-progress" className="dashboard-anchor">
          {progressState.loading ? (
            <div className="card learning-path-card compact">
              <PageState message={t("dashboard.progress.loading")} />
            </div>
          ) : dashboardLearningPathProgress ? (
            <LearningPathProgressPanel
              value={dashboardLearningPathProgress}
              t={t}
              compact
              onViewJourney={() => go("progress")}
            />
          ) : (
            <div className="card learning-path-card compact">
              <PageState type="empty" message={t("dashboard.progress.empty")} />
              <button onClick={() => go("progress")} style={{ marginTop: "0.75rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                {t("dashboard.progress.viewJourney")}
              </button>
            </div>
          )}
        </div>

        <div id="dashboard-initial-assessment" className="card dashboard-anchor dashboard-next-surface" style={{ display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
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
                <>{t("dashboard.assessment.completedDescription")}</>
              )}
              {!assessmentStatus.loading && assessmentStatus.status === "in_progress" && t("dashboard.assessment.resumeDescription")}
              {!assessmentStatus.loading && assessmentStatus.status !== "completed" && assessmentStatus.status !== "in_progress" && t("dashboard.assessment.pendingDescription")}
            </div>
          </div>
          <button onClick={() => go("assessment")} style={{ background: "#FB8C00", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
            {assessmentStatus.status === "completed" ? t("dashboard.assessment.viewResults") : assessmentStatus.status === "in_progress" ? t("dashboard.assessment.resume") : t("dashboard.assessment.start")}
          </button>
        </div>

        <div>
          <div id="dashboard-recommended-next-step" className="card dashboard-anchor dashboard-journey-surface">
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

        <div id="dashboard-scenario-practice" className="dashboard-anchor dashboard-practice-grid">
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
                <button onClick={() => recommendedScenario ? openScenarioTarget(recommendedScenario, "dashboard") : go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {t("dashboard.recommendation.practiceScenario")}
                </button>
              </>
            ) : (
              <PageState type="empty" message={t("dashboard.scenarios.unlockDescription")} />
            )}
          </div>
        </div>

        {dashboardAssessmentResults.length > 0 && (
          <div id="dashboard-topic-mastery" className="dashboard-anchor" style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <p className="section-title" style={{ fontSize: "1.1rem", margin: 0 }}>{t("dashboard.topicMastery.title")}</p>
              <button onClick={() => go("progress")} style={{ background: "transparent", color: "var(--teal)", border: "none", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>{t("dashboard.topicMastery.viewProgress")}</button>
            </div>
            <div className="assessment-results-grid">
              {dashboardAssessmentResults.map(topic => (
                <div key={topic.topicCode} className="card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.55rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{PROGRESS_TOPIC_META[topic.topicCode]?.icon} {t(`topics.${topic.topicCode}`,{defaultValue: topicLabel(topic.topicCode, topic.topicLabel)})}</span>
                    <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.82rem" }}>
                      {t("progress.assessmentResults.correctOutOfTotal", { correct: topic.correctCount, total: topic.totalCount })}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#777", marginTop: "0.45rem" }}>
                    {t("progress.assessmentResults.assessmentResult", {
                      level: t(`levels.${topic.resultLevel}`, { defaultValue: levelLabel(topic.resultLevel) }),
                    })} · {t("progress.assessmentResults.source")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Daily tip */}
        <div className="dashboard-field-note">
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
        <div className="dashboard-action-grid">
          {quickActions.map(a => (
            <button key={a.labelKey} className="dashboard-action-card" onClick={() => go(a.page)}>
              <div className="dashboard-action-icon" aria-hidden="true">{a.icon}</div>
              <div className="dashboard-action-title">{t(a.labelKey)}</div>
              <div className="dashboard-action-description">{t(a.descKey)}</div>
            </button>
          ))}
        </div>
        </div>

        {/* CyberGuard AI */}
        <div id="dashboard-cyberguard-ai" className="dashboard-anchor dashboard-cyberguard-heading">
          <div>
            <p className="section-title" style={{ fontSize: "1.1rem", margin: 0 }}>🛡 {t("dashboard.cyberGuard.title")}</p>
            <p className="section-sub" style={{ margin: "0.25rem 0 0" }}>{t("dashboard.cyberGuard.description")}</p>
          </div>
          <button className="btn-ghost" onClick={viewDashboardChatHistory} disabled={chatHistoryLoading}>
            {t("chat.actions.chatHistory")}
          </button>
        </div>
        <DashboardChatPreview />
      </div>
      </div>
    </div>
  );
}

function ChatMessageList({ className = "chat-messages", emptyCompact = false, emptyState = null }) {
  const { t } = useTranslation();
  const {
    activeConversationId,
    messages,
    sending,
    generating,
    initialLoading,
    conversationLoading,
    conversationError,
    retryConversation,
    generationByMessageId,
    retryGeneration,
    emailVerificationRequired,
  } = useChat();
  const endRef = useRef(null);
  const shouldAutoScrollRef = useRef(false);
  const previousEmptyConversationKeyRef = useRef(null);

  useEffect(() => {
    const container = endRef.current?.parentElement;
    const emptyConversationKey = activeConversationId || "__no-active-conversation__";
    if (
      container &&
      !initialLoading &&
      !conversationLoading &&
      !conversationError &&
      messages.length === 0 &&
      previousEmptyConversationKeyRef.current !== emptyConversationKey
    ) {
      container.scrollTop = 0;
      shouldAutoScrollRef.current = false;
      previousEmptyConversationKeyRef.current = emptyConversationKey;
      return;
    }
    if (messages.length > 0) {
      previousEmptyConversationKeyRef.current = null;
    }
    if (!shouldAutoScrollRef.current) return;
    if (!container) return;
    const visibleMessages = messages.filter(message => message.role !== "system");
    const lastMessage = visibleMessages[visibleMessages.length - 1];
    const behavior = prefersReducedMotion() ? "auto" : "smooth";
    if (lastMessage?.role === "ai") {
      const answerTarget = container.querySelector(`[data-testid="chat-message-answer-${lastMessage.id}"]`);
      const target = answerTarget || container.querySelector(`[data-chat-message-id="${lastMessage.id}"]`);
      if (!target) {
        container.scrollTo({ top: container.scrollHeight, behavior });
        return;
      }
      const shortAssistantReply = target && target.offsetHeight < container.clientHeight * 0.38;
      container.scrollTo({
        top: shortAssistantReply ? container.scrollHeight : Math.max(0, target.offsetTop - 12),
        behavior,
      });
      return;
    }
    container.scrollTo({
      top: container.scrollHeight,
      behavior,
    });
  }, [
    activeConversationId,
    initialLoading,
    conversationLoading,
    conversationError,
    messages,
    messages.length,
    sending,
    generating,
    generationByMessageId,
  ]);

  useEffect(() => {
    shouldAutoScrollRef.current = true;
  }, [messages.length, sending, generating, generationByMessageId]);

  return (
    <div className={className} role="log" aria-live="polite" aria-label={t("chat.accessibility.messageHistory")}>
      {initialLoading ? (
        <div className="chat-empty" role="status">
          <div className="chat-empty-title">{t("chat.loading.conversations")}</div>
          <div>{t("chat.loading.pleaseWait")}</div>
        </div>
      ) : conversationLoading ? (
        <div className="chat-empty" role="status">
          <div className="chat-empty-title">{t("chat.loading.messages")}</div>
          <div>{t("chat.loading.pleaseWait")}</div>
        </div>
      ) : conversationError ? (
        <PageState
          type="error"
          title={t("chat.errors.syncFailed")}
          message={conversationError}
          actionLabel={t("common.retry")}
          onAction={retryConversation}
        />
      ) : messages.length === 0 ? (
        emptyState || (
        <div className="chat-empty">
          <div className="chat-empty-title">{t("chat.empty.title")}</div>
          <div>{emptyCompact ? t("chat.empty.shortDescription") : t("chat.empty.description")}</div>
        </div>
        )
      ) : (
        <>
          {messages.filter(message => message.role !== "system").map(message => {
            const generation = message.role === "user" ? generationByMessageId[message.id] : null;
            const messageSources = message.sources || [];
            const messageProposal = message.proposal || null;
            const messageActions = message.role === "ai"
              ? dedupeActionsAgainstProposal(message.actions || [], messageProposal)
              : [];
            return (
              <Fragment key={message.id}>
                {message.role === "ai" ? (
                  <CyberGuardAssistantMessage
                    messageId={message.id}
                    label={t("chat.accessibility.assistantMessage", { id: message.id, defaultValue: "CyberGuard assistant reply" })}
                    answer={(
                      <div
                        className="chat-bubble ai"
                        data-chat-message-id={message.id}
                      >
                        <div className="chat-markdown">
                          <ChatMarkdown>{message.text}</ChatMarkdown>
                        </div>
                      </div>
                    )}
                    sources={messageSources.length ? (
                      <ChatSourceGroup sources={messageSources} compact={emptyCompact} idScope={message.id} />
                    ) : null}
                    proposal={messageProposal ? (
                      <ChatMessageProposal proposal={messageProposal} />
                    ) : null}
                    actions={messageActions.length ? (
                      <ChatActionGroup actions={messageActions} compact={emptyCompact} />
                    ) : null}
                  />
                ) : (
                  <div
                    className="chat-bubble user"
                    data-chat-message-id={message.id}
                  >
                    {message.text}
                  </div>
                )}
                {generation?.status === "generating" && (
                  <div className="chat-status-notice generating" role="status" aria-live="polite">
                    <span className="chat-status-spinner" aria-hidden="true" />
                    <span>{t("chat.generation.preparing")}</span>
                  </div>
                )}
                {generation?.status === "failed" && (
                  <div className="chat-status-notice failed" role="alert" aria-live="assertive">
                    <div>
                      <strong>{t("chat.generation.failedTitle")}</strong>
                      <div>{generation.error || t("chat.generation.failedDescription")}</div>
                      {generation.retryable && (
                        <button
                          type="button"
                          className="chat-generation-retry"
                          onClick={() => retryGeneration(message.conversationId, message.id)}
                          disabled={generating || emailVerificationRequired}
                          aria-label={t("chat.accessibility.retryGeneration")}
                        >
                          {t("chat.generation.retry")}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </Fragment>
            );
          })}
        </>
      )}
      {sending && <div className="chat-status-notice" role="status" aria-live="polite">{t("chat.sending")}</div>}
      <div ref={endRef} />
    </div>
  );
}

function ChatComposer({
  compact = false,
  draftRequest = null,
  onDraftAccepted,
  useComposerFrame = false,
  composerLabel = "",
  composerGuidance = "",
}) {
  const { t } = useTranslation();
  const { sendMessage, sending, syncing, generating, conversationLoading, mutationError, emailVerificationRequired } = useChat();
  const [input, setInput] = useState("");
  const inputRef = useRef(null);
  const lastDraftRequestIdRef = useRef(null);

  useEffect(() => {
    if (!draftRequest?.requestId) return;
    if (lastDraftRequestIdRef.current === draftRequest.requestId) return;
    lastDraftRequestIdRef.current = draftRequest.requestId;
    setInput(draftRequest.text || "");
    onDraftAccepted?.(draftRequest.requestId);
  }, [draftRequest, onDraftAccepted]);

  async function send(event) {
    event?.preventDefault?.();
    const text = input.trim();
    if (!text || sending || syncing || generating || conversationLoading || emailVerificationRequired) return;
    const result = await sendMessage(text);
    if (result?.ok) {
      setInput("");
    } else {
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  const interactionDisabled = sending || syncing || generating || conversationLoading || emailVerificationRequired;
  const busy = sending || syncing || generating;
  const statusText = sending || syncing
    ? t("chat.sending")
    : generating
      ? t("chat.generation.preparingShort")
      : "";
  const textarea = (
    <textarea
      ref={inputRef}
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
      disabled={interactionDisabled}
    />
  );

  if (useComposerFrame) {
    return (
      <div className="chat-composer-wrap">
        <CyberGuardComposerFrame
          label={composerLabel || t("chat.pilot.composer.label")}
          guidance={composerGuidance || t("chat.pilot.composer.guidance")}
          status={statusText}
          loading={busy}
          onSubmit={send}
          input={textarea}
          submitControl={(
            <Button
              className="chat-send"
              type="submit"
              variant="primary"
              loading={sending || syncing}
              loadingLabel={t("chat.sending")}
              disabled={interactionDisabled || !input.trim()}
              aria-label={t("chat.accessibility.send")}
            >
              {generating ? t("chat.generation.preparingShort") : t("chat.send")}
            </Button>
          )}
        />
        {emailVerificationRequired && (
          <div className="chat-verification-lock" role="status">
            {t("auth.emailVerification.cyberGuardLock")}
          </div>
        )}
        {mutationError && <div className="field-error chat-composer-error" role="alert">{mutationError}</div>}
      </div>
    );
  }

  return (
    <div className="chat-composer-wrap">
      <div className="chat-input-row">
        {textarea}
        <button className="chat-send" onClick={send} disabled={interactionDisabled || !input.trim()} aria-label={t("chat.accessibility.send")}>
          {sending || syncing ? (compact ? "…" : t("chat.sending")) : generating ? (compact ? "…" : t("chat.generation.preparingShort")) : compact ? "↑" : t("chat.send")}
        </button>
      </div>
      {emailVerificationRequired && (
        <div className="chat-verification-lock" role="status">
          {t("auth.emailVerification.cyberGuardLock")}
        </div>
      )}
      {mutationError && <div className="field-error chat-composer-error" role="alert">{mutationError}</div>}
    </div>
  );
}

function DashboardChatPreview() {
  const { t } = useTranslation();
  const { go } = useApp();
  const { startDashboardConversation, syncing, generating, mutationError, emailVerificationRequired } = useChat();
  const [input, setInput] = useState("");
  const [launching, setLaunching] = useState(false);
  const [launcherError, setLauncherError] = useState("");

  async function submitLauncher() {
    const clean = input.trim();
    if (!clean || launching || syncing || generating || emailVerificationRequired) return;
    setLaunching(true);
    setLauncherError("");
    const result = await startDashboardConversation(clean);
    if (!result?.ok) {
      setLauncherError(result?.error || t("chat.errors.unableToCreate"));
      setLaunching(false);
      return;
    }
    setInput("");
    go("ai-chat");
    setLaunching(false);
  }

  return (
    <div className="agent-panel dashboard-chat-launcher">
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
          disabled={emailVerificationRequired || launching || syncing || generating}
        />
        <button className="chat-send" onClick={submitLauncher} disabled={emailVerificationRequired || launching || syncing || generating || !input.trim()} aria-label={t("chat.accessibility.send")}>
          {launching || syncing ? t("chat.sending") : t("chat.send")}
        </button>
      </div>
      {emailVerificationRequired && (
        <div className="chat-verification-lock" role="status">
          {t("auth.emailVerification.cyberGuardLock")}
        </div>
      )}
      {(launcherError || mutationError) && (
        <div className="field-error chat-composer-error" role="alert">
          {launcherError || mutationError}
        </div>
      )}
    </div>
  );
}

// ─── Page: Resources ──────────────────────────────────────────────
function ResourcesPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const {
    resourceFocusTopic,
    clearResourceFocus,
    pendingResourceTarget,
    clearPendingResourceTarget,
  } = useApp();
  const resourceLocale = normalizeLocale(activeI18n.language);
  const [resourceState, setResourceState] = useState({ loading: true, resources: [] });
  const [selected, setSelected]   = useState(null);
  const [filter,   setFilter]     = useState("All");
  const libraryHeadingRef = useRef(null);
  const resourceCardRefs = useRef(new Map());
  const returnFocusSlugRef = useRef(null);
  const restoreLibraryRef = useRef(false);
  const libraryScrollYRef = useRef(0);
  const focusRestoreTaskRef = useRef(null);
  const topic = resourceState.resources.find(resource => resource.slug === selected);

  const categories = ["All", ...Array.from(new Set(resourceState.resources.map(resource => resource.categoryCode)))];
  const filtered = filter === "All"
    ? resourceState.resources
    : resourceState.resources.filter(resource => resource.categoryCode === filter);
  const resourceHeaderStats = buildResourceHeaderStats(resourceState.resources);
  const focusedCategory = resourceFocusTopic ? PROGRESS_TOPIC_META[resourceFocusTopic]?.category : null;
  const categoryLabel = category => t(`resources.categories.${category}`, { defaultValue: category });

  const cancelFocusRestoreTask = useCallback(() => {
    const task = focusRestoreTaskRef.current;
    if (!task) return;
    focusRestoreTaskRef.current = null;
    if (task.type === "frame") window.cancelAnimationFrame?.(task.id);
    else window.clearTimeout(task.id);
  }, []);

  const openResource = useCallback((resourceSlug) => {
    cancelFocusRestoreTask();
    restoreLibraryRef.current = false;
    returnFocusSlugRef.current = resourceSlug;
    libraryScrollYRef.current = window.scrollY;
    setSelected(resourceSlug);
  }, [cancelFocusRestoreTask]);

  useEffect(() => {
    if (focusedCategory && resourceState.resources.some(resource => resource.categoryCode === focusedCategory)) {
      setFilter(focusedCategory);
    }
  }, [focusedCategory, resourceState.resources]);

  useEffect(() => {
    if (!pendingResourceTarget || resourceState.loading) return;
    const target = resourceState.resources.find(resource => (
      (pendingResourceTarget.resourceSlug && resource.slug === pendingResourceTarget.resourceSlug) ||
      (pendingResourceTarget.resourceId && Number(resource.id) === Number(pendingResourceTarget.resourceId))
    ));
    if (target) {
      openResource(target.slug);
      setFilter(target.categoryCode || "All");
    }
    clearPendingResourceTarget();
  }, [pendingResourceTarget, resourceState.loading, resourceState.resources, clearPendingResourceTarget, openResource]);

  useEffect(() => {
    if (selected || !restoreLibraryRef.current || resourceState.loading) return;
    cancelFocusRestoreTask();
    const task = {
      type: typeof window.requestAnimationFrame === "function" ? "frame" : "timer",
      id: null,
    };
    const restoreFocus = () => {
      if (focusRestoreTaskRef.current !== task || !restoreLibraryRef.current) return;
      focusRestoreTaskRef.current = null;
      const returnTarget = resourceCardRefs.current.get(returnFocusSlugRef.current) || libraryHeadingRef.current;
      returnTarget?.focus?.({ preventScroll: true });
      if (window.scrollY !== libraryScrollYRef.current) {
        window.scrollTo({ top: libraryScrollYRef.current, behavior: "auto" });
      }
      restoreLibraryRef.current = false;
    };
    focusRestoreTaskRef.current = task;
    task.id = task.type === "frame"
      ? window.requestAnimationFrame(restoreFocus)
      : window.setTimeout(restoreFocus, 0);
  }, [selected, resourceState.loading, resourceState.resources, cancelFocusRestoreTask]);

  useEffect(() => () => cancelFocusRestoreTask(), [cancelFocusRestoreTask]);

  useEffect(() => {
    let active = true;
    setResourceState(current => ({ ...current, loading: true, error: null }));
    dbGetResources(resourceLocale).then(result => {
      if (!active) return;
      if (result.ok) {
        const nextResources = result.resources || [];
        setResourceState({ loading: false, resources: nextResources });
        setSelected(current => {
          if (current && !nextResources.some(resource => resource.slug === current)) {
            restoreLibraryRef.current = true;
            return null;
          }
          return current;
        });
      } else {
        setResourceState({ loading: false, resources: [], error: result.error });
      }
    });
    return () => { active = false; };
  }, [resourceLocale]);

  function returnToLibrary() {
    cancelFocusRestoreTask();
    restoreLibraryRef.current = true;
    setSelected(null);
  }

  return (
    <div className="resources-page">
      <PageContainer>
        <PageSection>
          <PageBackButton />
          <ContextHeader
            className="resources-context-header"
            title={t("resources.title")}
            headingRef={libraryHeadingRef}
            headingTabIndex={-1}
            description={t("resources.description")}
            metadata={resourceHeaderStats.map(s => (
              <Badge key={s.labelKey} tone="neutral">
                {s.singleLine ? t(s.labelKey) : `${resourceState.loading && s.labelKey !== "resources.stats.malaysiaFocused" ? "…" : s.value} ${t(s.labelKey)}`}
              </Badge>
            ))}
          />

        {focusedCategory && (
          <Surface variant="subdued" className="resources-focus">
            <div>
              <div className="resources-focus-title">{t("resources.focus.title")}</div>
              <div className="resources-focus-copy">
                {t("resources.focus.description", { topic: t(`topics.${resourceFocusTopic}`, { defaultValue: topicLabel(resourceFocusTopic) }) })}
              </div>
            </div>
            <button type="button" className="resources-filter" onClick={() => { clearResourceFocus(); setFilter("All"); }}>
              {t("resources.focus.showAll")}
            </button>
          </Surface>
        )}

        <div className="resources-filter-region">
          <div className="resources-filter-scroll">
            {categories.map(cat => (
              <button
                type="button"
                key={cat}
                className={`resources-filter${filter === cat ? " active" : ""}`}
                aria-pressed={filter === cat}
                onClick={() => setFilter(cat)}
              >
                {categoryLabel(cat)}
              </button>
            ))}
          </div>
          <span className="resources-guide-count">
            {t("resources.guideCount", { count: filtered.length })}
          </span>
        </div>

        {resourceState.loading ? (
          <PageState type="loading" message={t("resources.loading")} />
        ) : resourceState.error ? (
          <PageState type="error" message={t("resources.error", { defaultValue: resourceState.error })} />
        ) : filtered.length === 0 ? (
          <PageState type="empty" message={t("resources.empty")} />
        ) : (
        <div className="resources-grid">
          {filtered.map(resource => {
            return (
              <button
                type="button"
                key={resource.id}
                ref={node => {
                  if (node) resourceCardRefs.current.set(resource.slug, node);
                  else resourceCardRefs.current.delete(resource.slug);
                }}
                className="resources-card"
                onClick={() => openResource(resource.slug)}
              >
                <Badge tone="brand">{categoryLabel(resource.categoryCode)}</Badge>
                <span className="resources-card-title">{resource.title}</span>
                <span className="resources-card-description">{resource.summary}</span>
                <span className="resources-card-action">{t("resources.readGuide")}</span>
              </button>
            );
          })}
        </div>
        )}

        <Surface variant="subdued" className="resources-tip">
          <span className="resources-tip-icon" aria-hidden="true">💡</span>
          <div>
            <div className="resources-tip-title">{t("resources.tip.title")}</div>
            <div className="resources-tip-copy">
              {t("resources.tip.prefix")} <strong>{t("resources.tip.phishing")}</strong> {t("resources.tip.or")} <strong>{t("resources.tip.passwordSecurity")}</strong> {t("resources.tip.suffix")}
            </div>
          </div>
        </Surface>
        {topic && (
          <ResourceDetailDialog
            resource={topic}
            categoryLabel={categoryLabel(topic.categoryCode)}
            sourceLabel={t("resources.source")}
            learnMoreLabel={t("common.learnMore")}
            closeLabel={t("common.close")}
            onClose={returnToLibrary}
          />
        )}
        </PageSection>
      </PageContainer>
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

  function renderCheckpointHero(title, description) {
    return (
      <PageContainer>
        <ExplorerHeroSurface
          identity={t("assessment.baselineLabel")}
          icon="⌖"
          visual={<AssessmentCheckpointVisual />}
          className="assessment-checkpoint-hero"
        >
          <CompactHeader title={title} description={description} />
        </ExplorerHeroSurface>
      </PageContainer>
    );
  }

  function renderTaskHeader() {
    return (
      <div className="assessment-task-identity">
        <PageIdentity label={t("assessment.baselineLabel")} icon="⌖" />
      </div>
    );
  }

  function renderIntro() {
    return (
      <>
        {renderCheckpointHero(assessment?.title || t("assessment.title"), t("assessment.introduction"))}
        <PageContainer width="reading" className="assessment-content">
          <PageSection>
            <PageBackButton />
            <Surface className="assessment-intro">
              <div className="assessment-briefing-grid">
                {[
                  { value: "12", labelKey: "assessment.stats.questions" },
                  { value: "5-10", labelKey: "assessment.stats.minutes" },
                  { value: "0", labelKey: "assessment.stats.negativeMarks" },
                  { value: "4", labelKey: "assessment.stats.topicAreas" },
                ].map(stat => (
                  <div className="assessment-briefing-stat" key={stat.labelKey}>
                    <div className="assessment-briefing-value">{stat.value}</div>
                    <div className="assessment-briefing-label">{t(stat.labelKey)}</div>
                  </div>
                ))}
              </div>
              <p className="assessment-measurement-note">{t("assessment.measurementNote")}</p>
              <div className="assessment-actions">
                <Button variant="primary" onClick={start} disabled={loading}>
                  {attempt ? t("assessment.resume") : t("assessment.start")}
                </Button>
                <Button variant="quiet" onClick={() => go("dashboard")}>{t("assessment.doLater")}</Button>
              </div>
            </Surface>
          </PageSection>
        </PageContainer>
      </>
    );
  }

  function renderAttempt() {
    const question = questions[current];
    const selected = answers[question?.id];
    const answeredCount = Object.keys(answers).length;
    const progress = Math.round(((current + 1) / questions.length) * 100);

    return (
      <PageContainer width="reading" className="assessment-question-shell">
        <PageSection>
          {renderTaskHeader()}
          <PageBackButton />
          <Surface className="assessment-question-card">
          <div className="auth-progress assessment-question-progress">
            <div className="auth-progress-track">
              <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="auth-progress-label">
              <span>{t("assessment.questionProgress", { current: current + 1, total: questions.length })}</span>
              <span>{answeredCount}/{questions.length} {t("assessment.answeredProgress", { answered: answeredCount, total: questions.length })} {saving ? "· " + t("common.saving") : ""}</span>
            </div>
          </div>
          <div className="res-tag assessment-question-topic">{question?.topicLabel}</div>
          <h1 className="assessment-question-title">{question?.prompt}</h1>
          <div className="assessment-options">
            {question?.options.map(option => (
              <button
                key={option.key}
                className="assessment-option"
                onClick={() => selectAnswer(question.id, option.key)}
                aria-pressed={selected === option.key}
              >
                <strong>{option.key}.</strong> {option.text}
              </button>
            ))}
          </div>
          <div className="assessment-question-actions">
            <Button variant="quiet" onClick={() => setCurrent(index => Math.max(0, index - 1))} disabled={current === 0}>{t("assessment.previous")}</Button>
            {current < questions.length - 1 ? (
              <Button variant="primary" onClick={() => setCurrent(index => Math.min(questions.length - 1, index + 1))}>{t("assessment.next")}</Button>
            ) : (
              <Button variant="primary" onClick={submit} disabled={submitting || answeredCount !== questions.length}>
                {submitting ? t("assessment.submitting") : t("assessment.submit")}
              </Button>
            )}
          </div>
          {answeredCount !== questions.length && current === questions.length - 1 && (
            <div className="assessment-reminder">{t("assessment.finalSubmissionReminder")}</div>
          )}
          </Surface>
        </PageSection>
      </PageContainer>
    );
  }

  function renderResult() {
    const attemptResult = result?.attempt;
    const strengths = (result?.topicScores || []).filter(topic => topic.classification === "strength");
    const improvements = (result?.topicScores || []).filter(topic => topic.classification === "improvement");
    return (
      <>
        {renderCheckpointHero(t("assessment.completed"), t("assessment.resultSummary", {
          score: attemptResult?.totalScore,
          maxScore: attemptResult?.maximumScore,
        }))}
        <PageContainer className="assessment-content">
          <PageSection>
            <PageBackButton />
            <Surface className="assessment-result-summary">
          <div className="assessment-result-label">{t("assessment.result")}</div>
          <p className="section-sub">
            {t("assessment.resultSummary", {
              score: attemptResult?.totalScore,
              maxScore: attemptResult?.maximumScore,
            })}
          </p>
          <div className="assessment-result-metrics">
            <div className="assessment-result-metric">
              <div className="assessment-result-label">{t("assessment.measuredLevel")}</div>
              <div className="assessment-result-value">{attemptResult?.measuredLevel}</div>
            </div>
            <div className="assessment-result-metric">
              <div className="assessment-result-label">{t("assessment.score")}</div>
              <div className="assessment-result-value">{attemptResult?.percentage}%</div>
            </div>
          </div>
          <div className="assessment-actions">
            <Button variant="primary" onClick={() => go("dashboard")}>{t("assessment.backToDashboard")}</Button>
            <Button variant="quiet" onClick={() => go("progress")}>{t("assessment.viewProgress")}</Button>
          </div>
            </Surface>

        <h2 className="section-title">{t("assessment.topicBreakdown")}</h2>
        <div className="assessment-topic-grid">
          {(result?.topicScores || []).map(topic => (
            <Surface key={topic.topicCode} className="assessment-topic-result">
              <div className="assessment-result-value">{topic.topicLabel}</div>
              <div>{topic.correctCount}/{topic.totalCount} · {topic.percentage}%</div>
              <div className="assessment-topic-result-label">
                {topic.classification === "strength" ? t("assessment.relativeStrength") : t("assessment.areaToImprove")}
              </div>
            </Surface>
          ))}
        </div>

        <Surface className="assessment-insights">
          <div className="section-title">{t("assessment.strengths")}</div>
          <div className="assessment-insight-copy">
            {strengths.length ? strengths.map(topic => topic.topicLabel).join(", ") : t("assessment.noStrengthsYet")}
          </div>
          <div className="section-title assessment-review-heading">{t("assessment.areasToImprove")}</div>
          <div className="assessment-insight-copy">
            {improvements.length ? improvements.map(topic => topic.topicLabel).join(", ") : t("assessment.allTopicsMetThreshold")}
          </div>
        </Surface>

        <h2 className="section-title assessment-review-heading">{t("assessment.reviewAnswers")}</h2>
        <div className="assessment-review-list">
          {(result?.review || []).map(item => (
            <Surface key={item.questionId} className="assessment-review-card">
              <div className="res-tag">{item.topicLabel}</div>
              <div className="section-title">{item.prompt}</div>
              <div className={`assessment-review-status ${item.isCorrect ? "is-correct" : "is-incorrect"}`}>
                {item.isCorrect ? t("assessment.correct") : t("assessment.incorrect")}
              </div>
              <div className="assessment-review-detail">
                {t("assessment.yourAnswer")}: {item.selectedOptionKey} · {t("assessment.correctAnswer")}: {item.correctOptionKey}
              </div>
              <div className="assessment-result-label assessment-review-heading">
                {t("assessment.explanation")}
              </div>
              <div className="assessment-review-explanation">{item.explanation}</div>
            </Surface>
          ))}
        </div>
          </PageSection>
        </PageContainer>
      </>
    );
  }

  return (
    <div className="assessment-page">
      {error && (
        <PageContainer width="reading" className="assessment-content">
          <PageState type="error" title={t("assessment.errorTitle")} message={error || t("assessment.error")} />
        </PageContainer>
      )}
      {loading ? (
        <>
          {renderCheckpointHero(t("assessment.title"), t("assessment.loading"))}
          <PageContainer width="reading" className="assessment-content">
            <PageState title={t("assessment.loadingTitle")} message={t("assessment.loading")} />
          </PageContainer>
        </>
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
  const {
    user,
    go,
    requestGuardedAction,
    registerActivityGuard,
    pendingScenarioTarget,
    acceptedHash,
    requestHashNavigation,
    clearPendingScenarioTarget,
  } = useApp();
  const scenarioLocale = normalizeLocale(activeI18n.language);
  const [filters, setFilters] = useState({ topicCode: "", difficulty: "" });
  const [library, setLibrary] = useState({ loading: true, scenarios: [], recommended: [] });
  const [view, setView] = useState({ mode: "library" });
  const [selectedChoice, setSelectedChoice] = useState("");
  const [decisionFeedback, setDecisionFeedback] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [highlightedScenarioTarget, setHighlightedScenarioTarget] = useState(null);
  const scenarioIntroRef = useRef(null);
  const scenarioCardRefs = useRef(new Map());
  const lastScrolledHighlightRef = useRef("");
  const highlightedScenarioSlug = highlightedScenarioTarget?.scenarioSlug || highlightedScenarioTarget?.slug || null;
  const highlightedScenarioId = highlightedScenarioTarget?.scenarioId || highlightedScenarioTarget?.id || null;

  function clearHighlightedScenario() {
    setHighlightedScenarioTarget(null);
    lastScrolledHighlightRef.current = "";
  }

  function clearHighlightForScenario(scenario = {}) {
    setHighlightedScenarioTarget(current => (
      isScenarioHighlightMatch(current, scenario) ? null : current
    ));
    if (isScenarioHighlightMatch(highlightedScenarioTarget, scenario)) {
      lastScrolledHighlightRef.current = "";
    }
  }

  async function refreshScenarioLibrary() {
    const [scenarioResult, recommendedResult] = await Promise.all([
      dbGetScenarios({ topicCode: filters.topicCode, difficulty: filters.difficulty }, scenarioLocale),
      dbGetRecommendedScenarios(scenarioLocale),
    ]);
    setLibrary({
      loading: false,
      scenarios: scenarioResult.ok ? scenarioResult.scenarios : [],
      recommended: recommendedResult.ok ? recommendedResult.scenarios : [],
      error: scenarioResult.ok ? null : scenarioResult.error,
    });
  }

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
        if (active && result.ok) setView(current => ({ ...current, scenario: result.scenario, firstStep: result.firstStep, locale: result.locale }));
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
      source: "scenario",
      title: t("scenarios.leaveTitle"),
      description: t("scenarios.leaveDescription"),
      cancelLabel: t("scenarios.continueScenario"),
      confirmLabel: t("scenarios.leaveScenario"),
      onLeave: () => {
        setSelectedChoice("");
        setDecisionFeedback(null);
        setView({ mode: "library" });
      },
    });
  }, [view.mode, view.attempt, registerActivityGuard, t]);

  useEffect(() => {
    const hashScenarioTarget = parseScenarioHighlightTargetFromHash(acceptedHash);
    if (!user) return;
    if (hashScenarioTarget) {
      buildRecommendedScenarioNavigation(hashScenarioTarget, "legacy");
      requestHashNavigation("#/scenarios", { replace: true });
      return;
    }

    const storedScenarioTarget = readRecommendedScenarioTarget();
    const targetScenario = pendingScenarioTarget || storedScenarioTarget;
    if (!targetScenario || library.loading) return;

    const targetSlug = targetScenario.scenarioSlug || targetScenario.slug || null;
    const targetId = targetScenario.scenarioId || targetScenario.id || null;

    const scenarioMatch = library.scenarios.find(scenario => (
      (targetSlug && scenario.slug === targetSlug)
      || (targetId && Number(scenario.id) === Number(targetId))
    ));
    const scenarioSlug = scenarioMatch?.slug || null;
    if (!scenarioSlug && (filters.topicCode || filters.difficulty)) {
      setFilters({ topicCode: "", difficulty: "" });
      return;
    }
    if (!scenarioSlug) {
      setHighlightedScenarioTarget(null);
      setError(t("scenarios.library.targetUnavailable"));
      if (pendingScenarioTarget) clearPendingScenarioTarget();
      consumeRecommendedScenarioTarget();
      return;
    }

    setError(null);
    setView(current => current.mode === "library" ? current : { mode: "library" });
    setHighlightedScenarioTarget({ scenarioSlug, source: targetScenario.source || "unknown" });
    consumeRecommendedScenarioTarget();
    if (pendingScenarioTarget) clearPendingScenarioTarget();
  }, [
    user,
    pendingScenarioTarget,
    acceptedHash,
    library.loading,
    library.scenarios,
    filters.topicCode,
    filters.difficulty,
    requestHashNavigation,
    clearPendingScenarioTarget,
    t,
  ]);

  useEffect(() => {
    if (!highlightedScenarioSlug || view.mode !== "library" || library.loading) return;
    const key = highlightedScenarioSlug;
    if (lastScrolledHighlightRef.current === key) return;
    const element = scenarioCardRefs.current.get(highlightedScenarioSlug);
    if (!element) return;
    lastScrolledHighlightRef.current = key;
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    window.setTimeout(() => element.focus?.({ preventScroll: true }), 0);
  }, [highlightedScenarioSlug, acceptedHash, view.mode, library.loading]);

  useEffect(() => {
    if ((!highlightedScenarioSlug && !highlightedScenarioId) || library.loading) return;
    const highlightedScenario = library.scenarios.find(scenario => isScenarioHighlightMatch({
      scenarioSlug: highlightedScenarioSlug,
      scenarioId: highlightedScenarioId,
    }, scenario));
    if (!highlightedScenario) {
      clearHighlightedScenario();
      return;
    }
    const hasCanonicalRecommendation = (library.recommended || []).some(scenario => Number(scenario.id) === Number(highlightedScenario.id));
    if ((library.recommended || []).length > 0 && !hasCanonicalRecommendation) {
      clearHighlightedScenario();
    }
  }, [highlightedScenarioSlug, highlightedScenarioId, library.loading, library.scenarios, library.recommended]);

  useEffect(() => {
    if (view.mode !== "intro") return;
    window.setTimeout(() => scenarioIntroRef.current?.focus?.(), 0);
  }, [view.mode, view.scenario?.slug]);

  if (!user) { go("login"); return null; }

  const recommendedIds = new Set((library.recommended || []).map(item => item.id));

  async function openIntro(slug) {
    clearHighlightForScenario({ slug });
    setBusy(true);
    setError(null);
    const result = await dbGetScenario(slug, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "intro", scenario: result.scenario, firstStep: result.firstStep, locale: result.locale });
  }

  async function startScenario(slug) {
    clearHighlightForScenario({ slug });
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
    const scenario = library.scenarios.find(item => Number(item.latestAttempt?.id) === Number(attemptId));
    clearHighlightForScenario(scenario);
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

  function syncCompletedScenarioInLibrary(result) {
    const scenarioId = Number(result?.scenario?.id || view.scenario?.id);
    const attempt = result?.attempt;
    if (!scenarioId || !attempt?.id) return;
    const latestAttempt = {
      id: attempt.id,
      status: attempt.status,
      resultLevel: attempt.resultLevel,
      percentage: attempt.percentage,
    };
    setLibrary(current => ({
      ...current,
      scenarios: current.scenarios.map(scenario => (
        Number(scenario.id) === scenarioId
          ? { ...scenario, latestAttempt }
          : scenario
      )),
      recommended: current.recommended.map(scenario => (
        Number(scenario.id) === scenarioId
          ? { ...scenario, latestAttempt }
          : scenario
      )),
    }));
  }

  async function completeScenario() {
    if (busy) return;
    clearHighlightForScenario(view.scenario);
    setBusy(true);
    setError(null);
    const result = await dbCompleteScenario(view.attempt.id, scenarioLocale);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    syncCompletedScenarioInLibrary(result.result);
    await refreshScenarioLibrary();
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

  function exitActiveScenario() {
    const leave = () => {
      setSelectedChoice("");
      setDecisionFeedback(null);
      setView({ mode: "library" });
    };
    requestGuardedAction?.(leave, {
      actionType: "scenario-exit",
      guard: {
        source: "scenario",
        key: `scenario:${view.attempt?.id || "active"}`,
        title: t("scenarios.leaveTitle"),
        description: t("scenarios.leaveDescription"),
        cancelLabel: t("scenarios.continueScenario"),
        confirmLabel: t("scenarios.leaveScenario"),
        onLeave: leave,
      },
    });
  }

  function renderLocaleFallbackNotice(localeInfo) {
    if (!localeInfo?.fallbackUsed) return null;
    return (
      <div className="scenario-locale-fallback" role="status">
        {t("scenarios.localeFallback", {
          requested: t(`admin.scenarioEditor.locales.${localeInfo.requestedLocale}`, { defaultValue: localeInfo.requestedLocale }),
          displayed: t(`admin.scenarioEditor.locales.${localeInfo.resolvedLocale}`, { defaultValue: localeInfo.resolvedLocale }),
        })}
      </div>
    );
  }

  const filterBar = (
    <Surface variant="outlined" className="scenario-library-filters">
      <select className="scenario-filter-control" aria-label={t("scenarios.filters.topic")} value={filters.topicCode} onChange={event => setFilters(current => ({ ...current, topicCode: event.target.value }))}>
        <option value="">{t("scenarios.filters.allTopics")}</option>
        {Object.entries(PROGRESS_TOPIC_META).map(([value, meta]) => (
          <option key={value} value={value}>
            {t(`topics.${value}`, { defaultValue: meta.label })}
          </option>
        ))}
      </select>
      <select className="scenario-filter-control" aria-label={t("scenarios.filters.difficulty")} value={filters.difficulty} onChange={event => setFilters(current => ({ ...current, difficulty: event.target.value }))}>
        <option value="">{t("scenarios.filters.allDifficulties")}</option>
        {["beginner", "developing", "intermediate", "advanced"].map(value => (
          <option key={value} value={value}>
            {t(`levels.${value}`, { defaultValue: levelLabel(value) })}
          </option>
        ))}
      </select>
    </Surface>
  );

  function renderScenarioHeader(title, description, { compact = false, visual = false } = {}) {
    return (
      <header className={`scenario-page-header${compact ? " scenario-page-header-compact" : ""}${view.mode === "library" ? " scenario-library-header" : ""}`}>
        <PageContainer width="wide" className="scenario-page-header-layout">
          <div className="scenario-page-header-copy">
            <PageIdentity label={t("nav.scenarios")} icon="◇" />
            <h1>{title}</h1>
            {description && <p>{description}</p>}
          </div>
          {visual && (
            <div className="scenario-page-header-visual" aria-hidden="true">
              <ScenarioDecisionVisual />
            </div>
          )}
        </PageContainer>
      </header>
    );
  }

  function renderLibrary() {
    return (
      <PageSection className="scenario-library-section">
        <div className="scenario-library-toolbar">{filterBar}</div>
        {library.loading ? (
          <PageState title={t("scenarios.library.loadingTitle")} message={t("scenarios.library.loading")} />
        ) : library.scenarios.length === 0 ? (
          <PageState type="empty" title={t("scenarios.library.empty")} message={t("scenarios.library.emptyDescription")} />
        ) : (
          <div className="scenario-library-grid">
            {library.scenarios.map(scenario => {
              const latest = scenario.latestAttempt;
              const isRecommended = recommendedIds.has(scenario.id);
              const isHighlighted = highlightedScenarioTarget?.scenarioSlug === scenario.slug;
              return (
                <Surface
                  key={scenario.id}
                  ref={element => {
                    if (element) scenarioCardRefs.current.set(scenario.slug, element);
                    else scenarioCardRefs.current.delete(scenario.slug);
                  }}
                  tabIndex={isHighlighted ? -1 : undefined}
                  className={`scenario-library-card${isRecommended ? " recommended" : ""}${isHighlighted ? " highlighted" : ""}`}
                >
                  <div className="scenario-card-heading">
                    <span className="scenario-card-topic">{t(`topics.${scenario.topicCode}`, { defaultValue: topicLabel(scenario.topicCode) })}</span>
                    {(isHighlighted || isRecommended) && (
                      <Badge tone={isHighlighted ? "warning" : "brand"} className="scenario-recommended-badge">
                        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
                          <path d="M12 3.6l2.35 4.76 5.25.76-3.8 3.7.9 5.23L12 15.58l-4.7 2.47.9-5.23-3.8-3.7 5.25-.76L12 3.6z" />
                        </svg>
                        <span>{isHighlighted ? t("scenarios.library.recommendedNext") : t("scenarios.library.recommended")}</span>
                      </Badge>
                    )}
                  </div>
                  <h2 className="scenario-card-title">{scenario.title}</h2>
                  <p className="scenario-card-summary">{scenario.summary}</p>
                  <div className="scenario-card-meta">
                    <Badge>{t(`levels.${scenario.difficulty}`, { defaultValue: levelLabel(scenario.difficulty) })}</Badge>
                    <Badge>{t("scenarios.card.minutes", { count: scenario.estimatedMinutes })}</Badge>
                    <Badge>{t("scenarios.card.decisions", { count: scenario.totalSteps })}</Badge>
                  </div>
                  {latest?.status && (
                    <div className="scenario-card-status">
                      <Badge tone={latest.status === "completed" ? "success" : "warning"}>
                        {latest.status === "completed" ? t("scenarios.result.completed") : t("scenarios.card.resume")}
                      </Badge>
                    </div>
                  )}
                  <div className="scenario-card-actions">
                    {latest?.status === "in_progress" ? (
                      <Button variant="primary" onClick={() => openAttempt(latest.id)}>{t("scenarios.card.resume")}</Button>
                    ) : (
                      <Button variant="primary" onClick={() => openIntro(scenario.slug)}>{t("scenarios.card.start")}</Button>
                    )}
                    {latest?.status === "completed" && (
                      <Button onClick={() => openResult(latest.id)}>{t("scenarios.card.viewResult")}</Button>
                    )}
                  </div>
                </Surface>
              );
            })}
          </div>
        )}
      </PageSection>
    );
  }

  function renderIntro() {
    const scenario = view.scenario;
    return (
      <Surface className="scenario-briefing" ref={scenarioIntroRef} tabIndex={-1}>
        <div className="scenario-briefing-copy">
          <Badge tone="brand">{t(`topics.${scenario.topicCode}`, { defaultValue: topicLabel(scenario.topicCode) })}</Badge>
          <p className="scenario-briefing-summary">{scenario.summary}</p>
          <div className="scenario-briefing-meta">
            <Badge>{t(`levels.${scenario.difficulty}`, { defaultValue: levelLabel(scenario.difficulty) })}</Badge>
            <Badge>{t("scenarios.card.minutes", { count: scenario.estimatedMinutes })}</Badge>
            <Badge>{t("scenarios.card.decisions", { count: scenario.totalSteps })}</Badge>
          </div>
          <div className="scenario-briefing-notice">{t("scenarios.intro.choiceNotice")}</div>
          {renderLocaleFallbackNotice(view.locale)}
          <div className="scenario-actions">
            <Button variant="primary" onClick={() => startScenario(scenario.slug)} loading={busy} loadingLabel={t("common.loading")}>{t("scenarios.intro.startPractice")}</Button>
          </div>
        </div>
        <div aria-hidden="true">
          <ScenarioDecisionVisual />
        </div>
      </Surface>
    );
  }

  function renderAttempt() {
    const step = view.currentStep;
    const decisionClassification = ["safest", "partial", "unsafe"].includes(decisionFeedback?.classification)
      ? decisionFeedback.classification
      : null;
    if (!step) {
      return (
        <Surface className="scenario-ready">
          <p>{t("scenarios.attempt.readyToCompleteDescription")}</p>
          <div className="scenario-actions">
            <Button variant="primary" onClick={completeScenario} loading={busy} loadingLabel={t("scenarios.attempt.completing")}>{t("scenarios.attempt.complete")}</Button>
          </div>
        </Surface>
      );
    }
    return (
      <div className="scenario-attempt-shell">
        <div className="scenario-attempt-progress">
          <div className="scenario-attempt-progress-label">{t("scenarios.attempt.stepProgress", { current: step.stepOrder, total: view.scenario.totalSteps })}</div>
          <div className="scenario-progress-track" aria-hidden="true">
            <div className="scenario-progress-value" style={{ width: `${((step.stepOrder - 1) / view.scenario.totalSteps) * 100}%` }} />
          </div>
        </div>
        <Surface className="scenario-step-card">
          <div className="scenario-situation-label">{view.scenario.title}</div>
          <p className="scenario-situation">{step.situationText}</p>
          <div className="scenario-choice-list">
            {step.options.map(option => (
              <button key={option.key} type="button" className="scenario-choice" disabled={Boolean(decisionFeedback)} aria-pressed={selectedChoice === option.key} onClick={() => setSelectedChoice(option.key)}>
                <span className="scenario-choice-key">{option.key}.</span>
                <span>{option.text}</span>
                <span className="scenario-choice-marker" aria-hidden="true">&#10003;</span>
              </button>
            ))}
          </div>
          {!decisionFeedback ? (
            <div className="scenario-actions">
              <Button variant="primary" disabled={!selectedChoice} loading={busy} loadingLabel={t("scenarios.attempt.savingDecision")} onClick={submitDecision}>{t("scenarios.attempt.confirmChoice")}</Button>
            </div>
          ) : (
            <Surface variant="subdued" className="scenario-feedback">
              <div className="scenario-feedback-title">{t("scenarios.attempt.decisionSaved")}</div>
              {decisionClassification && (
                <div className={`scenario-feedback-outcome is-${decisionClassification}`}>
                  <span>{t("scenarios.attempt.outcomeLabel")}</span>
                  <strong>{t(`scenarios.attempt.outcomes.${decisionClassification}`)}</strong>
                </div>
              )}
              <div className="scenario-feedback-label">{t("scenarios.result.feedback")}</div>
              <p>{decisionFeedback.feedback}</p>
              <div className="scenario-feedback-label">{t("scenarios.result.keyLesson")}</div>
              <p>{decisionFeedback.safetyExplanation}</p>
              <div className="scenario-actions">
                <Button variant="primary" onClick={continueAfterFeedback} loading={busy} loadingLabel={t("scenarios.attempt.completing")}>{view.nextStep ? t("common.next") : t("scenarios.attempt.complete")}</Button>
              </div>
            </Surface>
          )}
        </Surface>
      </div>
    );
  }

  function renderResult() {
    const result = view;
    return (
      <div className="scenario-result-summary">
        <div className="scenario-result-metrics">
          <Surface variant="outlined" className="scenario-result-metric"><strong>{result.attempt.totalScore}/{result.attempt.maximumScore}</strong><span>{t("scenarios.result.score")}</span></Surface>
          <Surface variant="outlined" className="scenario-result-metric"><strong>{result.attempt.percentage}%</strong><span>{t("scenarios.result.percentage")}</span></Surface>
          <Surface variant="outlined" className="scenario-result-metric"><strong>{t(`scenarioResults.${result.attempt.resultLevel}`, { defaultValue: scenarioResultLabel(result.attempt.resultLevel) })}</strong><span>{t("scenarios.result.performanceLevel")}</span></Surface>
          <Surface variant="outlined" className="scenario-result-metric"><strong>+{result.progressImpact?.masteryDelta || 0}</strong><span>{t("scenarios.result.masteryDelta")}</span></Surface>
        </div>
        <h2>{t("scenarios.result.decisionsReviewed")}</h2>
        <div className="scenario-result-review-list">
          {result.review.map(item => (
            <Surface key={item.id} variant="outlined" className="scenario-result-review">
              <h2>{t("scenarios.result.step", { step: item.stepOrder })}</h2>
              <div className="scenario-result-review-meta">
                <span>{t("scenarios.result.yourChoice")}: {item.selectedOptionKey}</span>
                {item.recommendedOptionKey && <span>{t("scenarios.result.recommendedChoice")}: {item.recommendedOptionKey}</span>}
              </div>
              <div className="scenario-feedback-label">{t("scenarios.result.feedback")}</div>
              <p>{item.feedback}</p>
              <div className="scenario-feedback-label">{t("scenarios.result.keyLesson")}</div>
              <p>{item.safetyExplanation}</p>
            </Surface>
          ))}
        </div>
        {result.recommendation && (
          <Surface variant="subdued" className="scenario-result-recommendation">
            <strong>{t("scenarios.result.updatedRecommendation")}</strong>
            <p>{result.recommendation.reasonText}</p>
          </Surface>
        )}
        <div className="scenario-actions">
          <Button variant="primary" onClick={() => setView({ mode: "library" })}>{t("scenarios.result.returnToLibrary")}</Button>
          <Button onClick={() => go("dashboard")}>{t("nav.dashboard")}</Button>
          <Button onClick={() => go("progress")}>{t("scenarios.result.viewProgress")}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`scenario-page scenario-page-${view.mode}`}>
      {view.mode === "library" && renderScenarioHeader(t("scenarios.library.title"), t("scenarios.library.description"), { visual: true })}
      {view.mode === "intro" && renderScenarioHeader(view.scenario.title, null, { visual: false })}
      {view.mode === "attempt" && renderScenarioHeader(view.currentStep?.promptText || t("scenarios.attempt.readyToComplete"), null, { compact: true })}
      {view.mode === "result" && renderScenarioHeader(view.scenario.title, t("scenarios.result.completed"), { visual: true })}
      <PageContainer width="wide" className="scenario-content">
        {error && <div className="field-error" role="alert" style={{ marginBottom: "1rem" }}>{error}</div>}
        {view.mode === "library" ? (
          <>
            <PageBackButton />
            {renderLibrary()}
          </>
        ) : view.mode === "attempt" ? (
          <>
            <Button variant="quiet" onClick={exitActiveScenario}>{t("scenarios.attempt.exit")}</Button>
            {renderLocaleFallbackNotice(view.locale)}
            {renderAttempt()}
          </>
        ) : view.mode === "intro" ? (
          <div className="scenario-detail-layout">
            <div className="scenario-detail-back-rail">
              <Button variant="quiet" onClick={() => setView({ mode: "library" })}>{t("scenarios.library.backToLibrary")}</Button>
            </div>
            <div className="scenario-detail-main">
              {renderIntro()}
            </div>
            <div aria-hidden="true" />
          </div>
        ) : (
          renderResult()
        )}
      </PageContainer>
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

  const preferredLanguage = LANGUAGES.find(option => option.value === form.preferredLanguage);
  const translatedPreferredLanguage = preferredLanguage
    ? t(`profileOptions.language.${preferredLanguage.value}`, { defaultValue: preferredLanguage.label })
    : t("settings.chooseOne");
  const familiarity = FAMILIARITY.find(option => option.value === form.familiarityLevel);
  const translatedFamiliarity = familiarity
    ? t(`profileOptions.familiarity.${familiarity.value}.label`, { defaultValue: familiarity.label })
    : t("settings.chooseOne");
  const displayName = accountForm.displayName || user.displayName || user.name || "";
  const profileInitial = displayName.trim().charAt(0).toUpperCase() || "C";

  return (
    <div className="profile-page">
      <PageContainer width="content">
        <CompactHeader
          className="profile-header"
          eyebrow={<PageIdentity label={t("settings.learnerProfile")} icon="ID" />}
          title={t("settings.title")}
          description={t("settings.description")}
        />
        <PageBackButton className="profile-back" />

        <PageSection className="profile-content">
          <Surface className="profile-identity-summary">
            <div className="profile-avatar" aria-hidden="true">{profileInitial}</div>
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
                <label htmlFor="profile-email">{t("settings.email")}</label>
                <input id="profile-email" className="profile-form-control" value={user?.email || ""} readOnly />
              </div>
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
                  min="1"
                  max="120"
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

          <Surface as="section" className="profile-panel" aria-labelledby="profile-preferences-title">
            <h2 id="profile-preferences-title" className="profile-section-title">{t("settings.learningPreferences")}</h2>
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
        </PageSection>
      </PageContainer>
    </div>
  );
}


// ─── Page: Progress ──────────────────────────────────────────────
function ProgressPage() {
  const { t, i18n: activeI18n } = useTranslation();
  const {
    user,
    go,
    openRecommendedResource,
    openScenarioTarget,
    pendingProgressSection,
    clearPendingProgressSection,
  } = useApp();
  const progressLocale = normalizeLocale(activeI18n.language);
  const [progressState, setProgressState] = useState({ loading: true, progress: null });
  const [recommendationState, setRecommendationState] = useState({ loading: true, recommendation: null });
  const [recommendationCompleting, setRecommendationCompleting] = useState(false);
  const [recommendationCompleteSaved, setRecommendationCompleteSaved] = useState(false);
  const [activeProgressSection, setActiveProgressSection] = useState(PROGRESS_SECTION_IDS.OVERVIEW);

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

  const assessmentTopicResults = (progressState.progress?.assessmentTopicResults || []).map(mapAssessmentTopicResult);
  const activityComposition = normalizeActivityComposition(progressState.progress?.activityComposition);
  const recentLearningActivity = normalizeRecentLearningActivity(progressState.progress?.recentLearningActivity);
  const hasAssessmentResultsSection = Boolean(assessmentTopicResults.length);
  const hasRecommendationSection = Boolean(recommendationState.recommendation);
  const progressSections = PROGRESS_SECTIONS.filter(section => (
    (section.optional !== "assessmentResults" || hasAssessmentResultsSection) &&
    (section.optional !== "recommendation" || hasRecommendationSection)
  ));

  useEffect(() => {
    const visibleSectionIds = PROGRESS_SECTIONS
      .filter(section => (
        (section.optional !== "assessmentResults" || hasAssessmentResultsSection) &&
        (section.optional !== "recommendation" || hasRecommendationSection)
      ))
      .map(section => section.id);

    setActiveProgressSection(current => (
      visibleSectionIds.includes(current)
        ? current
        : visibleSectionIds[0] || PROGRESS_SECTION_IDS.OVERVIEW
    ));

    const sections = visibleSectionIds
      .map(id => document.getElementById(id))
      .filter(Boolean);

    if (sections.length === 0) return undefined;

    const isAtPageEnd = () => {
      const tolerance = 4;
      const documentHeight = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0
      );
      const maxScrollY = Math.max(0, documentHeight - window.innerHeight);

      if (maxScrollY <= tolerance) return false;
      return window.scrollY >= maxScrollY - tolerance;
    };

    const observer = new IntersectionObserver((entries) => {
      if (isAtPageEnd()) {
        setActiveProgressSection(visibleSectionIds[visibleSectionIds.length - 1]);
        return;
      }

      const visible = entries
        .filter(entry => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveProgressSection(visible.target.id);
      }
    }, {
      rootMargin: "-80px 0px -65% 0px",
      threshold: [0.1, 0.35, 0.6],
    });

    const updateActiveSectionAtPageEnd = () => {
      if (isAtPageEnd()) {
        setActiveProgressSection(visibleSectionIds[visibleSectionIds.length - 1]);
      }
    };

    sections.forEach(section => observer.observe(section));
    window.addEventListener("scroll", updateActiveSectionAtPageEnd, { passive: true });
    updateActiveSectionAtPageEnd();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateActiveSectionAtPageEnd);
    };
  }, [hasAssessmentResultsSection, hasRecommendationSection]);

  useEffect(() => {
    if (!pendingProgressSection) return;
    const validSectionIds = progressSections.map(section => section.id);
    if (!validSectionIds.includes(pendingProgressSection)) {
      if (!progressState.loading && !recommendationState.loading) clearPendingProgressSection();
      return;
    }

    window.setTimeout(() => {
      const target = document.getElementById(pendingProgressSection);
      if (target) {
        target.setAttribute("tabindex", "-1");
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
        target.focus({ preventScroll: true });
      }
      clearPendingProgressSection();
    }, 0);
  }, [
    pendingProgressSection,
    progressSections,
    progressState.loading,
    recommendationState.loading,
    clearPendingProgressSection,
  ]);

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
  const learningPathProgress = progressState.progress?.learningPathProgress;
  const recommendation = recommendationState.recommendation;
  const activitySegments = activityComposition.segments;

  const achievements = getAchievementDefinitions({
    hasJoined: true,
    hasHelpTopics: topics.length > 0,
    hasMultipleLanguages: languageValue && languageValue !== "english",
    hasAssessmentBaseline: Boolean(summary?.exists),
  });

  async function completeRecommendation() {
    if (!recommendation?.id || recommendationCompleting) return;
    setRecommendationCompleting(true);
    const result = await dbMarkRecommendationCompleted(recommendation.id, progressLocale);
    setRecommendationCompleting(false);
    if (result.ok) {
      setRecommendationState({ loading: false, recommendation: result.recommendation });
      const progressResult = await dbGetProgress();
      setProgressState(progressResult.ok
        ? { loading: false, progress: progressResult }
        : { loading: false, progress: null, error: progressResult.error });
      setRecommendationCompleteSaved(true);
    }
  }

  function scrollToProgressSection(sectionId) {
    document.getElementById(sectionId)?.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      block: "start",
    });
  }

  return (
    <div>
      <PageContainer>
        <ExplorerHeroSurface
          identity={t("progress.title")}
          icon={<span aria-hidden="true">↗</span>}
          visual={<ProgressExplorerVisual />}
          className="progress-explorer-hero"
        >
          <CompactHeader
            title={t("progress.heroTitle", { name: nick })}
            description={summary?.exists
              ? t("progress.baselineSummary", { count: assessmentTopicResults.length })
              : t("progress.profileFamiliaritySummary", { level: profileLevel })}
            metadata={(
              <>
                <span>{lang}</span>
                <span aria-hidden="true">·</span>
                <span>{style}</span>
              </>
            )}
          />
        </ExplorerHeroSurface>
      </PageContainer>

      <div className="progress-shell">
        <SectionNav
          ariaLabel={t("progress.sectionNav.ariaLabel")}
          title={t("progress.sectionNav.title")}
          items={progressSections.map((section) => ({
            id: section.id,
            label: t(section.labelKey),
          }))}
          activeId={activeProgressSection}
          onSelect={scrollToProgressSection}
        />

        <div className="progress-content">
          <PageBackButton style={{ marginBottom: "2rem" }} />

        <div id={PROGRESS_SECTION_IDS.OVERVIEW} className="progress-anchor progress-overview-surface" style={{ marginBottom: "2.5rem" }}>
          {progressState.loading ? (
            <div className="card learning-path-card">
              <PageState message={t("common.loading")} />
            </div>
          ) : (
            <LearningPathProgressPanel value={learningPathProgress} t={t} />
          )}

          <div className="card activity-composition-card">
            <div className="activity-composition-header">
              <div>
                <p className="section-title" style={{ fontSize: "1.1rem", marginBottom: "0.25rem" }}>
                  {t("progress.activityComposition.title")}
                </p>
                <p className="section-sub" style={{ marginBottom: 0 }}>
                  {t("progress.activityComposition.description")}
                </p>
              </div>
              {activityComposition.totalRecordedActivities > 0 && (
                <div className="activity-composition-total">
                  {t("progress.activityComposition.recordedActivitiesCount", { count: activityComposition.totalRecordedActivities })}
                </div>
              )}
            </div>
            {progressState.loading ? (
              <PageState message={t("common.loading")} />
            ) : activitySegments.length > 0 ? (
              <>
                <div
                  className="activity-composition-bar"
                  role="img"
                  aria-label={t("progress.activityComposition.barAriaLabel")}
                >
                  {activitySegments.map(segment => (
                    <span
                      key={segment.id}
                      className={`activity-composition-segment ${segment.id}`}
                      style={{ width: `${segment.sharePercentage}%` }}
                      title={t("progress.activityComposition.segmentShare", {
                        label: t(activitySegmentLabelKey(segment.id), { defaultValue: segment.label }),
                        share: segment.sharePercentage,
                        count: segment.count,
                      })}
                    />
                  ))}
                </div>
                <div className="activity-composition-legend" aria-label={t("progress.activityComposition.legendLabel")}>
                  {activitySegments.map(segment => (
                    <div key={segment.id} className="activity-composition-legend-item">
                      <span className={`activity-composition-dot ${segment.id}`} aria-hidden="true" />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: "0.86rem", color: "#26312d" }}>
                          <span aria-hidden="true" style={{ marginRight: "0.35rem" }}>{ACTIVITY_SEGMENT_ICONS[segment.id] || "•"}</span>
                          {t(activitySegmentLabelKey(segment.id), { defaultValue: segment.label })}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#61716b", lineHeight: 1.45 }}>
                          {t(activitySegmentCountKey(segment.id), {
                            count: segment.count,
                            defaultValue: segment.displayValue,
                          })} · {t("progress.activityComposition.shareOfActivity", { share: segment.sharePercentage })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {activitySegments.length === 1 && (
                  <div className="activity-composition-disclaimer">
                    {t("progress.activityComposition.singleCategory", {
                      label: t(activitySegmentLabelKey(activitySegments[0].id), { defaultValue: activitySegments[0].label }),
                    })}
                  </div>
                )}
              </>
            ) : (
              <PageState type="empty" message={t("progress.activityComposition.empty")} />
            )}
            <div className="activity-composition-disclaimer">
              {activitySegments.length === 1 && activitySegments[0].id === "assessment_topics"
                ? `${t("progress.activityComposition.assessmentOnlyNote")} `
                : ""}
              {t("progress.activityComposition.explanation")} {t("progress.activityComposition.disclaimer")}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem" }}>
            {[
              { icon: "🎓", labelKey: "progress.snapshot.assessmentStatus", value: progressState.loading ? t("common.loading") : (summary?.exists ? t("progress.snapshot.baselineAvailable") : t("progress.snapshot.noBaseline")) },
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
        </div>

        {assessmentTopicResults.length > 0 && (
          <div id={PROGRESS_SECTION_IDS.ASSESSMENT_RESULTS} className="progress-anchor progress-checkpoint-surface" style={{ marginBottom: "2.5rem" }}>
            <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.assessmentResults.title")}</p>
            <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.assessmentResults.description")}</p>
            <div className="assessment-results-grid">
              {assessmentTopicResults.map(topic => (
                <div key={topic.topicCode} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.65rem" }}>
                    <div>
                      <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{PROGRESS_TOPIC_META[topic.topicCode]?.icon || "📘"}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{t(`topics.${topic.topicCode}`, { defaultValue: topicLabel(topic.topicCode, topic.topicLabel) })}</div>
                    </div>
                    <div style={{ color: "var(--teal)", fontWeight: 800 }}>
                      {t("progress.assessmentResults.correctOutOfTotal", { correct: topic.correctCount, total: topic.totalCount })}
                    </div>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#666" }}>
                    {t("progress.assessmentResults.assessmentResult", {
                      level: t(`levels.${topic.resultLevel}`, { defaultValue: levelLabel(topic.resultLevel) }),
                    })} · {t("progress.assessmentResults.source")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendation && (
          <div id="progress-recommendation" className="card progress-anchor progress-recommendation-surface" style={{ marginBottom: "2.5rem" }}>
            {recommendationCompleteSaved && <SuccessFeedback message={t("progress.recommendation.completedSaved")} />}
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.3rem" }}>{t("progress.currentFocus.title")}</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>
              {recommendation.topicCode ? t(`topics.${recommendation.topicCode}`, { defaultValue: topicLabel(recommendation.topicCode, recommendation.topicLabel) }) : t("dashboard.recommendation.initialAssessment")}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#496157", lineHeight: 1.5, marginBottom: "0.55rem" }}>
              {t("progress.currentFocus.basedOn")} · {t("progress.currentFocus.suggestedNextStep")}
            </div>
            <div style={{ fontSize: "0.86rem", color: "#3e5149", lineHeight: 1.6, marginBottom: "1rem" }}>
              {recommendation.reasonText}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={() => recommendation.topicCode ? openRecommendedResource(recommendation.topicCode) : go("assessment")} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                {recommendation.topicCode ? t("dashboard.recommendation.readResource") : t("dashboard.recommendation.startAssessment")}
              </button>
              {recommendation.topicCode && (
                <button onClick={() => recommendation.target ? openScenarioTarget(recommendation.target, "progress") : go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
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

        {/* Learning activity and topics */}
        <div id={PROGRESS_SECTION_IDS.LEARNING_ACTIVITY} className="progress-anchor progress-activity-trail" style={{ marginBottom: "2.5rem" }}>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.learningActivity.title")}</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.learningActivity.description")}</p>
          <div className="card" style={{ marginBottom: "1rem", padding: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>
              {t("progress.recentActivity.title")}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6 }}>
              {t("progress.recentActivity.description")}
            </div>
            {recentLearningActivity.length > 0 ? (
              <div className="recent-activity-list">
                {recentLearningActivity.map((activity, index) => (
                  <div key={`${activity.type}-${activity.occurredAt}-${index}`} className="recent-activity-item">
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "0.84rem", color: "#27332f" }}>
                        {t(recentActivityLabelKey(activity.type), { defaultValue: activity.label })}
                      </div>
                      {activity.topicCode && (
                        <div style={{ fontSize: "0.76rem", color: "#69756f", marginTop: "0.15rem" }}>
                          {t(`topics.${activity.topicCode}`, { defaultValue: topicLabel(activity.topicCode) })}
                        </div>
                      )}
                    </div>
                    <time style={{ fontSize: "0.76rem", color: "#7c8882" }} dateTime={activity.occurredAt}>
                      {new Intl.DateTimeFormat(progressLocale, { month: "short", day: "numeric" }).format(new Date(activity.occurredAt))}
                    </time>
                  </div>
                ))}
              </div>
            ) : (
              <PageState type="empty" message={t("progress.recentActivity.empty")} />
            )}
          </div>

          <div style={{ marginBottom: "0.85rem" }}>
            <div style={{ fontWeight: 700, color: "#24322e", marginBottom: "0.25rem" }}>
              {t("progress.learningInterests.title")}
            </div>
            <div style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.6 }}>
              {t("progress.learningInterests.description")}
            </div>
          </div>
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
                  <span style={{ fontSize: "0.85rem", fontWeight: active ? 600 : 400, color: active ? "var(--teal)" : "#888" }}>
                    {t(`profileOptions.helpTopics.${topicOption.value}`, { defaultValue: topicOption.label })}
                    <span style={{ display: "block", marginTop: "0.12rem", fontSize: "0.72rem", color: active ? "#357a63" : "#888", fontWeight: 700 }}>
                      {t(getLearningInterestStateKey(active))}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
          <button onClick={() => go("resources")} style={{ marginTop: "1rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            {t("progress.learningActivity.exploreAll")}
          </button>
        </div>

        {/* Achievements */}
        <div id={PROGRESS_SECTION_IDS.BADGES} className="progress-anchor progress-achievement-grid">
          <p className="section-title" style={{ fontSize: "1.1rem" }}>{t("progress.achievements.title")}</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>{t("progress.achievements.description")}</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
            {achievements.map(b => (
              <div key={b.labelKey} className="card" style={{
                textAlign: "center", padding: "1.25rem 0.75rem",
                opacity: b.earned ? 1 : 0.4,
                filter: b.earned ? "none" : "grayscale(1)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>{b.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: b.earned ? "#1a1a18" : "#aaa" }}>{t(b.labelKey)}</div>
                {b.earned && <div style={{ fontSize: "0.68rem", color: "var(--teal)", marginTop: "0.25rem", fontWeight: 600 }}>{t("progress.achievements.earned")}</div>}
              </div>
            ))}
          </div>
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

function EmailVerificationReminder({ compact = false }) {
  const { t } = useTranslation();
  const { user, refreshCurrentUserState } = useApp();
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [retryAfter, setRetryAfter] = useState(0);
  const timerRef = useRef(null);
  const latestUserIdRef = useRef(user?.id || null);

  useEffect(() => () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    latestUserIdRef.current = user?.id || null;
  }, [user?.id]);

  useEffect(() => {
    setStatus("idle");
    const notice = user?.emailVerificationNotice;
    if (!notice || user?.emailVerified) {
      setMessage("");
    } else if (notice.emailTransportDisabled) {
      setMessage(t("auth.emailVerification.deliveryDisabled"));
    } else if (notice.emailSent) {
      setMessage(t("auth.emailVerification.resendSuccess"));
    } else if (notice.emailSendFailed) {
      setMessage(t("auth.emailVerification.sendFailure"));
    } else {
      setMessage("");
    }
    setRetryAfter(0);
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [t, user?.id, user?.emailVerified, user?.emailVerificationNotice]);

  function startCooldown(seconds) {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    setRetryAfter(safeSeconds);
    if (timerRef.current) window.clearInterval(timerRef.current);
    if (!safeSeconds) return;
    timerRef.current = window.setInterval(() => {
      setRetryAfter(current => {
        if (current <= 1) {
          window.clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return current - 1;
      });
    }, 1000);
  }

  async function resend() {
    if (status === "sending") return;
    const requestUserId = user?.id;
    setStatus("sending");
    setMessage("");
    const result = await dbResendVerificationEmail();
    if (requestUserId !== latestUserIdRef.current) return;
    if (!result.ok) {
      if (result.code === "EMAIL_VERIFICATION_RESEND_COOLDOWN") {
        setStatus("cooldown");
        startCooldown(result.retryAfterSeconds);
        setMessage(t("auth.emailVerification.cooldown", { seconds: result.retryAfterSeconds || 0 }));
      } else {
        setStatus("failed");
        setMessage(t("auth.emailVerification.sendFailure"));
      }
      return;
    }
    if (result.alreadyVerified) {
      setStatus("alreadyVerified");
      await refreshCurrentUserState?.();
      return;
    }
    if (result.emailSendFailed) {
      setStatus("failed");
      setMessage(t("auth.emailVerification.sendFailure"));
      startCooldown(0);
      return;
    }
    setStatus("sent");
    startCooldown(result.cooldownSeconds);
    setMessage(result.emailTransportDisabled
      ? t("auth.emailVerification.deliveryDisabled")
      : t("auth.emailVerification.resendSuccess"));
  }

  async function refresh() {
    if (status === "refreshing") return;
    setStatus("refreshing");
    const refreshed = await refreshCurrentUserState?.();
    if (refreshed?.user?.emailVerified) {
      setMessage("");
      return;
    }
    setStatus("stillUnverified");
    setMessage(t("auth.emailVerification.stillUnverified"));
  }

  if (!user || user.emailVerified) return null;

  return (
    <aside className={`email-verification-reminder cy-auth-reminder${compact ? " compact" : ""}`} aria-labelledby="email-verification-reminder-title">
      <div>
        <h2 id="email-verification-reminder-title">{t("auth.emailVerification.bannerTitle")}</h2>
        <p>{t("auth.emailVerification.bannerDescription")}</p>
        {user.email && <p className="email-verification-email">{maskEmailAddress(user.email)}</p>}
      </div>
      <div className="email-verification-actions">
        <Button type="button" variant="secondary" onClick={resend} disabled={status === "sending" || retryAfter > 0}>
          {status === "sending"
            ? t("auth.emailVerification.sending")
            : retryAfter > 0
              ? t("auth.emailVerification.waitSeconds", { seconds: retryAfter })
              : t("auth.emailVerification.resend")}
        </Button>
        <Button type="button" variant="primary" onClick={refresh} disabled={status === "refreshing"}>
          {status === "refreshing" ? t("auth.emailVerification.refreshing") : t("auth.emailVerification.refreshStatus")}
        </Button>
      </div>
      {message && <p className="email-verification-status" role={status === "failed" ? "alert" : "status"} aria-live={status === "failed" ? "assertive" : "polite"}>{message}</p>}
    </aside>
  );
}

function EmailVerificationPage() {
  const { t } = useTranslation();
  const { user, go, refreshCurrentUserState, applyVerifiedEmailResult } = useApp();
  const headingRef = useRef(null);
  const currentUserIdRef = useRef(user?.id || null);
  const refreshCurrentUserStateRef = useRef(refreshCurrentUserState);
  const applyVerifiedEmailResultRef = useRef(applyVerifiedEmailResult);
  const verificationTokenRef = useRef(undefined);
  const verificationRequestRef = useRef(null);
  const [state, setState] = useState({
    status: "verifying",
    code: null,
    verifiedUser: null,
    differentAccount: false,
  });

  if (verificationTokenRef.current === undefined) {
    const hash = String(window.location.hash || "");
    const query = hash.includes("?") ? hash.slice(hash.indexOf("?")) : "";
    verificationTokenRef.current = new URLSearchParams(query).get("token") || "";
  }

  useEffect(() => {
    currentUserIdRef.current = user?.id || null;
    refreshCurrentUserStateRef.current = refreshCurrentUserState;
    applyVerifiedEmailResultRef.current = applyVerifiedEmailResult;
  }, [applyVerifiedEmailResult, refreshCurrentUserState, user?.id]);

  useEffect(() => {
    let active = true;
    const token = verificationTokenRef.current;
    window.history.replaceState({ ...(window.history.state || {}) }, "", "#/verify-email");
    if (!token) {
      const restoredResult = loadEmailVerificationResult();
      if (restoredResult) {
        setState({
          status: restoredResult.status === "already_verified" ? "alreadyVerified" : "success",
          code: null,
          verifiedUser: null,
          differentAccount: restoredResult.differentAccount,
        });
      } else {
        setState({
          status: "invalid",
          code: "EMAIL_VERIFICATION_TOKEN_REQUIRED",
          verifiedUser: null,
          differentAccount: false,
        });
      }
      return () => { active = false; };
    }
    clearEmailVerificationResult();
    setState({ status: "verifying", code: null, verifiedUser: null, differentAccount: false });
    if (!verificationRequestRef.current) {
      verificationRequestRef.current = dbVerifyEmail(token);
    }
    verificationRequestRef.current.then(async result => {
      if (!active) return;
      if (result.ok) {
        const verifiedUser = result.user || null;
        const differentAccount = Boolean(
          currentUserIdRef.current && verifiedUser?.id && verifiedUser.id !== currentUserIdRef.current
        );
        saveEmailVerificationResult({
          status: result.alreadyVerified ? "already_verified" : "verified",
          differentAccount,
        });
        setState({
          status: result.alreadyVerified ? "alreadyVerified" : "success",
          code: null,
          verifiedUser,
          differentAccount,
        });
        applyVerifiedEmailResultRef.current?.(verifiedUser);
        if (currentUserIdRef.current && verifiedUser?.id === currentUserIdRef.current) {
          await refreshCurrentUserStateRef.current?.();
        }
        return;
      }
      clearEmailVerificationResult();
      const code = result.code || "EMAIL_VERIFICATION_TOKEN_INVALID";
      if (code === "EMAIL_VERIFICATION_TOKEN_EXPIRED") {
        setState({ status: "expired", code, verifiedUser: null, differentAccount: false });
      } else if (code === "EMAIL_VERIFICATION_TOKEN_REVOKED") {
        setState({ status: "revoked", code, verifiedUser: null, differentAccount: false });
      } else {
        setState({ status: "invalid", code, verifiedUser: null, differentAccount: false });
      }
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (state.status !== "verifying") {
      window.setTimeout(() => headingRef.current?.focus(), 0);
    }
  }, [state.status]);

  const titleKey = {
    verifying: "auth.emailVerification.verifying",
    success: "auth.emailVerification.successTitle",
    alreadyVerified: "auth.emailVerification.alreadyVerifiedTitle",
    expired: "auth.emailVerification.expiredTitle",
    revoked: "auth.emailVerification.revokedTitle",
    invalid: "auth.emailVerification.invalidTitle",
  }[state.status] || "auth.emailVerification.invalidTitle";
  const descriptionKey = {
    verifying: "auth.emailVerification.verifyingDescription",
    success: "auth.emailVerification.successDescription",
    alreadyVerified: "auth.emailVerification.alreadyVerifiedDescription",
    expired: "auth.emailVerification.expiredDescription",
    revoked: "auth.emailVerification.revokedDescription",
    invalid: "auth.emailVerification.invalidDescription",
  }[state.status] || "auth.emailVerification.invalidDescription";
  const differentAccount = Boolean(state.differentAccount);

  return (
    <div className="cy-auth-route cy-auth-verification-route">
      <PageContainer width="reading" className="cy-auth-route-container">
        <Surface as="section" className="cy-auth-panel cy-auth-verification" aria-live={state.status === "verifying" ? "polite" : undefined}>
          <PageIdentity label={t("auth.emailVerification.bannerTitle")} icon="✓" className="cy-auth-identity" />
          <h1 className="cy-auth-step-title" ref={headingRef} tabIndex={-1}>{t(titleKey)}</h1>
          <p className="cy-auth-step-description">{t(descriptionKey)}</p>
          {differentAccount && <p className="email-verification-status">{t("auth.emailVerification.differentAccount")}</p>}
          <div className="email-verification-actions cy-auth-actions">
            {user ? (
              <>
                <Button type="button" variant="primary" onClick={() => go("ai-chat")}>{t("auth.emailVerification.continueCyberGuard")}</Button>
                <Button type="button" variant="secondary" onClick={() => go("dashboard")}>{t("auth.emailVerification.continueDashboard")}</Button>
              </>
            ) : (
              <Button type="button" variant="primary" onClick={() => go("login")}>{t("auth.emailVerification.loginToResend")}</Button>
            )}
          </div>
        </Surface>
      </PageContainer>
    </div>
  );
}

async function dbVerifyEmail(token) {
  try {
    const result = await verifyEmail(token);
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.generic");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.network");
  }
}

async function dbResendVerificationEmail() {
  try {
    const result = await resendVerificationEmail();
    const data = result.data || {};
    if (!result.ok) return apiFailure(data, "errors.fallback.generic");
    return { ok: true, ...data };
  } catch {
    return networkFailure("errors.fallback.network");
  }
}

const CHAT_HISTORY_GROUPS = [
  { key: "today", labelKey: "chat.history.groups.today" },
  { key: "yesterday", labelKey: "chat.history.groups.yesterday" },
  { key: "earlier", labelKey: "chat.history.groups.earlier" },
];

function localDayStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function getChatHistoryGroupKey(conversation, now) {
  const value = conversation?.updatedAt;
  if (!value) return "earlier";
  const timestamp = new Date(value);
  const timestampMs = timestamp.getTime();
  if (Number.isNaN(timestampMs)) return "earlier";

  const todayStart = localDayStart(now);
  const tomorrowStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1).getTime();
  const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();

  if (timestampMs >= todayStart && timestampMs < tomorrowStart) return "today";
  if (timestampMs >= yesterdayStart && timestampMs < todayStart) return "yesterday";
  return "earlier";
}

function groupChatHistoryConversations(conversations, now) {
  const grouped = {
    today: [],
    yesterday: [],
    earlier: [],
  };

  conversations.forEach(conversation => {
    grouped[getChatHistoryGroupKey(conversation, now)].push(conversation);
  });

  return CHAT_HISTORY_GROUPS
    .map(group => ({ ...group, conversations: grouped[group.key] }))
    .filter(group => group.conversations.length > 0);
}

function ConversationHistoryItem({
  conversation,
  active,
  pinned,
  archived = false,
  onSelect,
  onTogglePin,
  onToggleArchive,
  onRename,
  onDelete,
  onExport,
  exportable = false,
  mutating,
  openMenu,
  setOpenMenu,
  menuPortalDisabled = false,
}) {
  const { t } = useTranslation();
  const [renaming, setRenaming] = useState(false);
  const [draftTitle, setDraftTitle] = useState(conversation.title);
  const [titleError, setTitleError] = useState("");
  const wrapRef = useRef(null);
  const itemButtonRef = useRef(null);
  const menuButtonRef = useRef(null);
  const menuRef = useRef(null);
  const inputRef = useRef(null);
  const [menuPosition, setMenuPosition] = useState(null);
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
    function updateMenuPosition() {
      const trigger = menuButtonRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const menuWidth = 168;
      const menuHeight = archived ? 128 : 208;
      const gap = 6;
      const margin = 8;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const fitsBelow = rect.bottom + gap + menuHeight <= viewportHeight - margin;
      const top = fitsBelow
        ? rect.bottom + gap
        : Math.max(margin, rect.top - gap - menuHeight);
      const left = Math.min(
        Math.max(margin, rect.right - menuWidth),
        Math.max(margin, viewportWidth - menuWidth - margin)
      );
      setMenuPosition({ top, left });
    }
    function handlePointerDown(event) {
      if (
        wrapRef.current?.contains(event.target) ||
        menuRef.current?.contains(event.target)
      ) {
        return;
      }
      setOpenMenu(null);
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpenMenu(null);
        menuButtonRef.current?.focus();
      }
    }
    updateMenuPosition();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [archived, conversation.id, openMenu, setOpenMenu]);

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

  async function saveRename() {
    const nextTitle = validateTitle();
    if (!nextTitle) return;
    const saved = await onRename(conversation.id, nextTitle);
    if (!saved) {
      setTitleError(t("chat.errors.unableToRename"));
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
              disabled={mutating}
            />
            {titleError && <div id={titleErrorId} className="field-error" role="alert">{titleError}</div>}
            <div style={{ display: "flex", gap: "0.4rem" }}>
              <button type="button" className="btn-primary" style={{ padding: "0.45rem 0.65rem" }} onClick={saveRename} disabled={mutating}>
                {mutating ? t("common.saving") : t("common.save")}
              </button>
              <button type="button" className="btn-ghost" style={{ padding: "0.45rem 0.65rem" }} onClick={cancelRename} disabled={mutating}>
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
      <div className={`ai-chat-list-item${active ? " active" : ""}`}>
        <button
          type="button"
          ref={itemButtonRef}
          className="ai-chat-list-select"
          onClick={() => {
            setOpenMenu(null);
            onSelect(conversation.id);
          }}
          aria-current={active ? "true" : undefined}
          disabled={mutating}
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
          disabled={mutating}
        >
          ⋯
        </button>
      </div>
      {!menuPortalDisabled && openMenu === conversation.id && menuPosition && typeof document !== "undefined" && createPortal(
        <div
          ref={menuRef}
          className="ai-chat-menu"
          id={menuId}
          role="menu"
          style={{ top: menuPosition.top, left: menuPosition.left }}
          aria-label={t("chat.accessibility.conversationMenu", { title: conversation.title })}
          onMouseDown={event => event.stopPropagation()}
        >
          {!archived && (
            <>
              <button type="button" className="ai-chat-menu-item" role="menuitem" disabled={mutating} onClick={event => {
                event.stopPropagation();
                setOpenMenu(null);
                setRenaming(true);
              }}>
                {t("chat.actions.rename")}
              </button>
              <button type="button" className="ai-chat-menu-item" role="menuitem" disabled={mutating} onClick={event => {
                event.stopPropagation();
                setOpenMenu(null);
                onTogglePin(conversation.id);
                restoreItemFocus();
              }}>
                {t(pinned ? "chat.actions.unpinConversation" : "chat.actions.pinConversation")}
              </button>
            </>
          )}
          <button type="button" className="ai-chat-menu-item" role="menuitem" disabled={mutating} onClick={event => {
            event.stopPropagation();
            setOpenMenu(null);
            onToggleArchive(conversation.id);
            restoreItemFocus();
          }}>
            {t(archived ? "chat.actions.unarchiveConversation" : "chat.actions.archiveConversation")}
          </button>
          {active && onExport && (
            <button type="button" className="ai-chat-menu-item" role="menuitem" disabled={mutating || !exportable} onClick={event => {
              event.stopPropagation();
              if (!exportable) return;
              setOpenMenu(null);
              onExport(conversation, menuButtonRef.current);
            }}>
              {t("chat.actions.exportConversation")}
            </button>
          )}
          <button type="button" className="ai-chat-menu-item danger" role="menuitem" disabled={mutating} onClick={event => {
            event.stopPropagation();
            setOpenMenu(null);
            onDelete(conversation, menuButtonRef.current);
          }} aria-label={t("chat.accessibility.deleteConversation", { title: conversation.title })}>
            {t("chat.actions.delete")}
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}

function AdminPage({ acceptedHash }) {
  const { t } = useTranslation();
  const { user, go, registerActivityGuard, requestGuardedAction, requestHashNavigation, completeGuardedActivity } = useApp();
  const adminRoute = useMemo(() => parseAdminRoute(acceptedHash), [acceptedHash]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(user?.role === "admin"));
  const [error, setError] = useState("");
  const activeSection = adminRoute.notFound ? getAdminSectionFromHash("#/admin/resources") : getAdminSectionFromHash(adminRoute.canonicalHash);
  const editorResourceId = getAdminResourceEditorIdFromHash(adminRoute.canonicalHash);
  const governanceResourceId = getAdminResourceGovernanceIdFromHash(adminRoute.canonicalHash);
  const metadataResourceId = getAdminResourceMetadataIdFromHash(adminRoute.canonicalHash);
  const creatingResource = isAdminResourceCreateRoute(adminRoute.canonicalHash);
  const editorScenarioId = getAdminScenarioEditorIdFromHash(adminRoute.canonicalHash);
  const creatingScenario = isAdminScenarioCreateRoute(adminRoute.canonicalHash);

  useEffect(() => {
    if (adminRoute.shouldReplace) {
      requestHashNavigation(adminRoute.canonicalHash, { replace: true });
    }
  }, [adminRoute, requestHashNavigation]);

  const handleSectionNavigate = useCallback((section) => {
    return requestHashNavigation(buildAdminHash({ section: section.id }));
  }, [requestHashNavigation]);

  useEffect(() => {
    let active = true;
    if (user?.role !== "admin") {
      setLoading(false);
      setStatus(null);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    dbAdminStatus().then(result => {
      if (!active) return;
      if (result.ok) {
        setStatus(result.status);
      } else {
        setError(result.error || t("admin.status.error"));
      }
      setLoading(false);
    });

    return () => { active = false; };
  }, [t, user?.role]);

  if (!user) {
    go("login");
    return null;
  }

  if (user.role !== "admin") {
    return (
      <section className="section">
        <div className="card">
          <p className="res-tag">{t("admin.accessDenied.badge")}</p>
          <h1 className="section-title">{t("admin.accessDenied.title")}</h1>
          <p className="section-sub">{t("admin.accessDenied.description")}</p>
          <button className="btn-primary" type="button" onClick={() => go("dashboard")}>
            {t("common.backToDashboard")}
          </button>
        </div>
      </section>
    );
  }

  return (
    <AdminWorkspace sections={ADMIN_SECTIONS} activeSection={activeSection} status={status} onSectionNavigate={handleSectionNavigate}>
      {loading ? (
        <div className="card" role="status" aria-live="polite">
          <p style={{ color: "#666", lineHeight: 1.6 }}>{t("admin.status.loading")}</p>
        </div>
      ) : error ? (
        <div className="card">
          <p className="field-error" role="alert">{error}</p>
        </div>
      ) : adminRoute.notFound ? (
        <div className="card">
          <p className="res-tag">{t("admin.notFound.badge")}</p>
          <h2>{t("admin.notFound.title")}</h2>
          <p className="section-sub">{t("admin.notFound.description")}</p>
          <button type="button" className="btn-primary" onClick={() => requestHashNavigation(buildAdminHash({ section: "resources" }), { replace: true })}>
            {t("admin.notFound.backToResources")}
          </button>
        </div>
      ) : activeSection.id === "scenarios" && creatingScenario ? (
        <AdminScenarioEditorPage
          creating
          registerActivityGuard={registerActivityGuard}
          completeGuardedActivity={completeGuardedActivity}
          requestGuardedAction={requestGuardedAction}
          requestHashNavigation={requestHashNavigation}
        />
      ) : activeSection.id === "scenarios" && editorScenarioId ? (
        <AdminScenarioEditorPage
          scenarioId={editorScenarioId}
          registerActivityGuard={registerActivityGuard}
          completeGuardedActivity={completeGuardedActivity}
          requestGuardedAction={requestGuardedAction}
          requestHashNavigation={requestHashNavigation}
        />
      ) : activeSection.id === "scenarios" ? (
        <AdminScenarioPage requestHashNavigation={requestHashNavigation} />
      ) : activeSection.id === "ai-agentic" ? (
        <AdminAiProvidersPage />
      ) : creatingResource ? (
        <AdminResourceCreatePage
          registerActivityGuard={registerActivityGuard}
          requestHashNavigation={requestHashNavigation}
        />
      ) : metadataResourceId ? (
        <AdminResourceMetadataPage
          resourceId={metadataResourceId}
          registerActivityGuard={registerActivityGuard}
          requestGuardedAction={requestGuardedAction}
          requestHashNavigation={requestHashNavigation}
        />
      ) : editorResourceId ? (
        <AdminResourceEditorPage
          resourceId={editorResourceId}
          registerActivityGuard={registerActivityGuard}
          requestGuardedAction={requestGuardedAction}
          requestHashNavigation={requestHashNavigation}
        />
      ) : (
        <AdminResourcePage
          initialQuickReviewId={governanceResourceId}
          requestHashNavigation={requestHashNavigation}
        />
      )}
    </AdminWorkspace>
  );
}

function AIChatPage() {
  const { t } = useTranslation();
  const { user, go } = useApp();
  const {
    conversations,
    activeConversation,
    activeConversationId,
    messages,
    sending,
    syncing,
    generating,
    conversationLoading,
    conversationError,
    createConversation,
    selectConversation,
    renameConversation,
    deleteConversation,
    initialLoading,
    error,
    retry,
    mutationError,
    mutatingConversationId,
    generationByMessageId,
    legacyNoticeVisible,
    dismissLegacyNotice,
  } = useChat();
  const [openMenu, setOpenMenu] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [exportTarget, setExportTarget] = useState(null);
  const [exportFormat, setExportFormat] = useState("markdown");
  const [exportError, setExportError] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => readChatSidebarCollapsed(user?.id));
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const [historySearch, setHistorySearch] = useState("");
  const [historyView, setHistoryView] = useState("chats");
  const [collapsedHistoryGroups, setCollapsedHistoryGroups] = useState({});
  const [pinnedConversationIds, setPinnedConversationIds] = useState(() => readPinnedConversationIds(user?.id));
  const [archivedConversationIds, setArchivedConversationIds] = useState(() => readArchivedConversationIds(user?.id));
  const [historyUsesDrawer, setHistoryUsesDrawer] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
    return window.matchMedia("(max-width: 820px)").matches;
  });
  const [composerDraftRequest, setComposerDraftRequest] = useState(null);
  const deleteReturnFocusRef = useRef(null);
  const exportReturnFocusRef = useRef(null);
  const newChatButtonRef = useRef(null);
  const historyDrawerTriggerRef = useRef(null);
  const historyDrawerRef = useRef(null);
  const historyListId = "ai-chat-history-panel";
  const historyDrawerId = "ai-chat-history-drawer";
  const quickPrompts = useMemo(() => [
    {
      id: "spot-suspicious-message",
      label: t("chat.pilot.quickPrompts.spotSuspiciousMessage"),
    },
    {
      id: "strengthen-account-safety",
      label: t("chat.pilot.quickPrompts.strengthenAccountSafety"),
    },
    {
      id: "protect-personal-information",
      label: t("chat.pilot.quickPrompts.protectPersonalInformation"),
    },
    {
      id: "check-online-information",
      label: t("chat.pilot.quickPrompts.checkOnlineInformation"),
    },
  ], [t]);

  useEffect(() => {
    setSidebarCollapsed(readChatSidebarCollapsed(user?.id));
  }, [user?.id]);

  useEffect(() => {
    setPinnedConversationIds(readPinnedConversationIds(user?.id));
  }, [user?.id]);

  useEffect(() => {
    setArchivedConversationIds(readArchivedConversationIds(user?.id));
    setHistoryView("chats");
    setHistorySearch("");
  }, [user?.id]);

  useEffect(() => {
    writeChatSidebarCollapsed(user?.id, sidebarCollapsed);
  }, [sidebarCollapsed, user?.id]);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return undefined;
    const query = window.matchMedia("(max-width: 820px)");
    const syncHistoryMode = event => {
      setHistoryUsesDrawer(Boolean(event.matches));
    };
    setHistoryUsesDrawer(Boolean(query.matches));
    if (typeof query.addEventListener === "function") {
      query.addEventListener("change", syncHistoryMode);
      return () => query.removeEventListener("change", syncHistoryMode);
    }
    query.addListener(syncHistoryMode);
    return () => query.removeListener(syncHistoryMode);
  }, []);

  useEffect(() => {
    if (!historyDrawerOpen) return undefined;
    function handleKeyDown(event) {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (exportTarget || openMenu) return;
      if (historySearch) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation?.();
        setHistorySearch("");
        window.setTimeout(() => document.getElementById("ai-chat-history-search-drawer")?.focus(), 0);
        return;
      }
      setHistoryDrawerOpen(false);
      window.setTimeout(() => historyDrawerTriggerRef.current?.focus(), 0);
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [exportTarget, historyDrawerOpen, historySearch, openMenu]);

  useEffect(() => {
    if (!historyDrawerOpen) return;
    window.setTimeout(() => historyDrawerRef.current?.focus(), 0);
  }, [historyDrawerOpen]);

  if (!user) { go("login"); return null; }

  function toggleSidebarCollapsed() {
    setSidebarCollapsed(current => !current);
    setOpenMenu(null);
  }

  function openHistoryDrawer() {
    setHistoryDrawerOpen(true);
    setOpenMenu(null);
  }

  function handleWorkspaceHistoryAction() {
    if (historyUsesDrawer) {
      openHistoryDrawer();
      return;
    }
    toggleSidebarCollapsed();
  }

  function closeHistoryDrawer() {
    setHistoryDrawerOpen(false);
    window.setTimeout(() => historyDrawerTriggerRef.current?.focus(), 0);
  }

  function handleSelectConversation(id) {
    selectConversation(id);
    setHistoryDrawerOpen(false);
  }

  function handleCreateConversation() {
    setHistorySearch("");
    setHistoryView("chats");
    createConversation();
    setHistoryDrawerOpen(false);
  }

  function clearHistorySearch() {
    setHistorySearch("");
  }

  function handleHistorySearchKeyDown(event) {
    if (event.key !== "Escape" || !historySearch) return;
    event.preventDefault();
    event.stopPropagation();
    event.nativeEvent?.stopImmediatePropagation?.();
    clearHistorySearch();
  }

  function toggleHistoryGroup(groupKey) {
    setCollapsedHistoryGroups(previous => ({
      ...previous,
      [groupKey]: !previous[groupKey],
    }));
  }

  function toggleConversationPinned(conversationId) {
    const visibleConversationIds = new Set(conversations.map(conversation => Number(conversation.id)));
    setPinnedConversationIds(current => (
      writePinnedConversationIds(
        user?.id,
        togglePinnedConversationId(
          current.filter(id => visibleConversationIds.has(Number(id))),
          conversationId
        )
      )
    ));
  }

  function toggleConversationArchived(conversationId) {
    const visibleConversationIds = new Set(conversations.map(conversation => Number(conversation.id)));
    const wasArchived = archivedConversationIds.includes(Number(conversationId));
    setArchivedConversationIds(current => {
      return writeArchivedConversationIds(
        user?.id,
        toggleArchivedConversationId(
          current.filter(id => visibleConversationIds.has(Number(id))),
          conversationId
        )
      );
    });
    if (wasArchived) {
      setHistoryView("chats");
      setHistorySearch("");
    }
  }

  function setConversationHistoryView(nextView) {
    setHistoryView(nextView);
    setHistorySearch("");
  }

  function handleQuickPromptSelect(prompt) {
    if (sending || syncing || generating || conversationLoading) return;
    setComposerDraftRequest({
      requestId: `${prompt.id}-${Date.now()}`,
      text: prompt.label,
    });
  }

  function requestDeleteConversation(conversation, returnFocusElement) {
    deleteReturnFocusRef.current = returnFocusElement;
    setDeleteError("");
    setDeleteTarget(conversation);
  }

  function requestExportConversation(conversation, returnFocusElement) {
    exportReturnFocusRef.current = returnFocusElement;
    setExportFormat("markdown");
    setExportError("");
    setExportTarget(conversation);
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
    window.setTimeout(() => deleteReturnFocusRef.current?.focus(), 0);
  }

  function closeExportDialog() {
    setExportTarget(null);
    setExportError("");
    window.setTimeout(() => exportReturnFocusRef.current?.focus(), 0);
  }

  function confirmExportConversation() {
    if (!exportTarget || !hasExportableMessages(messages)) return;
    try {
      downloadConversationExport({
        conversation: exportTarget,
        messages,
        format: exportFormat,
        locale: normalizeLocale(i18n.language),
        generationByMessageId,
      });
      closeExportDialog();
    } catch {
      setExportError(t("chat.export.error"));
    }
  }

  async function confirmDeleteConversation() {
    const returnFocusElement = deleteReturnFocusRef.current;
    const deleted = await deleteConversation(deleteTarget.id);
    if (!deleted) {
      setDeleteError(t("chat.errors.unableToDelete"));
      return;
    }
    setPinnedConversationIds(current => (
      writePinnedConversationIds(
        user?.id,
        current.filter(id => id !== Number(deleteTarget.id))
      )
    ));
    setArchivedConversationIds(current => (
      writeArchivedConversationIds(
        user?.id,
        current.filter(id => id !== Number(deleteTarget.id))
      )
    ));
    setDeleteTarget(null);
    window.setTimeout(() => {
      if (returnFocusElement?.isConnected) {
        returnFocusElement.focus();
      } else {
        newChatButtonRef.current?.focus();
      }
    }, 0);
  }

  const activeConversationExportable = hasExportableMessages(messages);

  function renderHistoryContent({ compact = false, drawer = false } = {}) {
    const archivedView = historyView === "archived";
    const normalizedHistorySearch = historySearch.trim().toLocaleLowerCase();
    const searchActive = Boolean(normalizedHistorySearch);
    const { archivedConversations, activeConversations } = partitionArchivedConversations(
      conversations,
      archivedConversationIds
    );
    const viewConversations = archivedView ? archivedConversations : activeConversations;
    const visibleConversations = normalizedHistorySearch
      ? viewConversations.filter(conversation =>
        String(conversation.title || "").toLocaleLowerCase().includes(normalizedHistorySearch)
      )
      : viewConversations;
    const groupedConversations = archivedView
      ? []
      : (() => {
          const { pinnedConversations, unpinnedConversations } = partitionPinnedConversations(
            visibleConversations,
            pinnedConversationIds
          );
          return [
            ...(pinnedConversations.length > 0
              ? [{
                  key: "pinned",
                  labelKey: "chat.history.groups.pinned",
                  conversations: pinnedConversations,
                }]
              : []),
            ...groupChatHistoryConversations(unpinnedConversations, new Date()),
          ];
        })();

    if (compact) {
      return (
        <div className="ai-chat-sidebar-rail-actions">
          <button
            type="button"
            className="ai-chat-icon-button"
            onClick={toggleSidebarCollapsed}
            aria-label={t("chat.accessibility.expandHistory")}
            aria-expanded={!sidebarCollapsed}
            aria-controls={historyListId}
            title={t("chat.actions.expandHistory")}
          >
            ›
          </button>
          <button
            type="button"
            className="ai-chat-icon-button"
            onClick={handleCreateConversation}
            aria-label={t("chat.accessibility.newChat")}
            title={t("chat.actions.newChat")}
          >
            +
          </button>
        </div>
      );
    }

    return (
      <>
        {!drawer && <PageBackButton style={{ marginBottom: "1rem" }} />}
        <div className="ai-chat-sidebar-header">
          <div className="ai-chat-sidebar-title-block">
            <div style={{ fontWeight: 800 }}>{t("chat.history.title")}</div>
            <div style={{ fontSize: "0.76rem", color: "#77827d" }}>{t("chat.history.description")}</div>
          </div>
          <div className="ai-chat-sidebar-actions">
            {!drawer && (
              <button
                type="button"
                className="ai-chat-icon-button"
                onClick={toggleSidebarCollapsed}
                aria-label={t("chat.accessibility.collapseHistory")}
                aria-expanded={!sidebarCollapsed}
                aria-controls={historyListId}
                title={t("chat.actions.collapseHistory")}
              >
                ‹
              </button>
            )}
            <button className="btn-ghost" style={{ padding: "0.45rem 0.65rem" }} ref={newChatButtonRef} onClick={handleCreateConversation} aria-label={t("chat.accessibility.newChat")}>
              +
            </button>
          </div>
        </div>
        {!error && !initialLoading && conversations.length > 0 && (
          <div className="ai-chat-history-view-switch" role="group" aria-label={t("chat.history.viewSwitchLabel")}>
            <button
              type="button"
              className={`ai-chat-history-view-button${!archivedView ? " active" : ""}`}
              aria-pressed={!archivedView}
              onClick={() => setConversationHistoryView("chats")}
            >
              {t("chat.history.views.chats")}
            </button>
            <button
              type="button"
              className={`ai-chat-history-view-button${archivedView ? " active" : ""}`}
              aria-pressed={archivedView}
              onClick={() => setConversationHistoryView("archived")}
            >
              {t("chat.history.views.archived")}
            </button>
          </div>
        )}
        {!error && !initialLoading && conversations.length > 0 && (
          <div className="ai-chat-history-search" role="search">
            <label
              className="ai-chat-history-search-label"
              htmlFor={`ai-chat-history-search-${drawer ? "drawer" : "sidebar"}`}
            >
              {t("chat.history.searchLabel")}
            </label>
            <div className="ai-chat-history-search-row">
              <input
                id={`ai-chat-history-search-${drawer ? "drawer" : "sidebar"}`}
                className="ai-chat-history-search-input"
                type="search"
                value={historySearch}
                placeholder={t("chat.history.searchPlaceholder")}
                onChange={event => setHistorySearch(event.target.value)}
                onKeyDown={handleHistorySearchKeyDown}
              />
              {historySearch && (
                <button
                  type="button"
                  className="ai-chat-history-search-clear"
                  onClick={clearHistorySearch}
                  aria-label={t("chat.history.clearSearch")}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        )}
        {legacyNoticeVisible && (
          <PageState
            type="empty"
            title={t("chat.migrationNotice.title")}
            message={t("chat.migrationNotice.description")}
            actionLabel={t("chat.migrationNotice.acknowledge")}
            onAction={dismissLegacyNotice}
          />
        )}
        {error ? (
          <PageState
            type="error"
            title={t("chat.errors.syncFailed")}
            message={error}
            actionLabel={t("common.retry")}
            onAction={retry}
          />
        ) : initialLoading ? (
          <PageState type="loading" title={t("chat.loading.conversations")} message={t("chat.loading.pleaseWait")} />
        ) : conversations.length === 0 ? (
          <PageState type="empty" title={t("chat.history.emptyTitle")} message={t("chat.history.emptyDescription")} />
        ) : viewConversations.length === 0 ? (
          <PageState
            type="empty"
            title={archivedView ? t("chat.history.emptyArchivedTitle") : t("chat.history.emptyTitle")}
            message={archivedView ? t("chat.history.emptyArchivedDescription") : t("chat.history.emptyDescription")}
          />
        ) : visibleConversations.length === 0 ? (
          <div className="ai-chat-history-no-results" role="status">
            {t(archivedView ? "chat.history.noArchivedSearchResults" : "chat.history.noSearchResults")}
          </div>
        ) : archivedView ? (
          <div className="ai-chat-list" role="list">
            {visibleConversations.map(conversation => (
              <ConversationHistoryItem
                key={conversation.id}
                conversation={conversation}
                active={conversation.id === activeConversationId}
                pinned={pinnedConversationIds.includes(Number(conversation.id))}
                archived
                onSelect={handleSelectConversation}
                onTogglePin={toggleConversationPinned}
                onToggleArchive={toggleConversationArchived}
                onRename={renameConversation}
                onDelete={requestDeleteConversation}
                onExport={requestExportConversation}
                exportable={conversation.id === activeConversationId && activeConversationExportable}
                mutating={mutatingConversationId === conversation.id}
                openMenu={openMenu}
                setOpenMenu={setOpenMenu}
                menuPortalDisabled={historyDrawerOpen && !drawer}
              />
            ))}
          </div>
        ) : (
          <div className="ai-chat-list" role="list">
            {groupedConversations.map(group => (
              <section className="ai-chat-history-group" key={group.key}>
                {(() => {
                  const groupLabel = t(group.labelKey);
                  const groupHeadingId = `ai-chat-history-${drawer ? "drawer" : "sidebar"}-${group.key}-heading`;
                  const groupListId = `ai-chat-history-${drawer ? "drawer" : "sidebar"}-${group.key}-items`;
                  const groupExpanded = searchActive || !collapsedHistoryGroups[group.key];
                  return (
                    <>
                      <div className="ai-chat-history-group-header">
                        <h3 id={groupHeadingId} className="ai-chat-history-group-heading">{groupLabel}</h3>
                        <button
                          type="button"
                          className="ai-chat-history-group-control"
                          aria-expanded={groupExpanded}
                          aria-controls={groupListId}
                          aria-label={t(
                            groupExpanded ? "chat.history.groups.collapse" : "chat.history.groups.expand",
                            { group: groupLabel }
                          )}
                          onClick={() => toggleHistoryGroup(group.key)}
                        >
                          <span
                            className={`ai-chat-history-group-chevron${groupExpanded ? " is-expanded" : ""}`}
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                      <div
                        id={groupListId}
                        className={`ai-chat-history-group-list${groupExpanded ? "" : " is-collapsed"}`}
                        aria-labelledby={groupHeadingId}
                      >
                        {groupExpanded && group.conversations.map(conversation => (
                          <ConversationHistoryItem
                            key={conversation.id}
                            conversation={conversation}
                            active={conversation.id === activeConversationId}
                            pinned={pinnedConversationIds.includes(Number(conversation.id))}
                            archived={false}
                            onSelect={handleSelectConversation}
                            onTogglePin={toggleConversationPinned}
                            onToggleArchive={toggleConversationArchived}
                            onRename={renameConversation}
                            onDelete={requestDeleteConversation}
                            onExport={requestExportConversation}
                            exportable={conversation.id === activeConversationId && activeConversationExportable}
                            mutating={mutatingConversationId === conversation.id}
                            openMenu={openMenu}
                            setOpenMenu={setOpenMenu}
                            menuPortalDisabled={historyDrawerOpen && !drawer}
                          />
                        ))}
                      </div>
                    </>
                  );
                })()}
              </section>
            ))}
          </div>
        )}
        {mutationError && <div className="field-error" role="alert" style={{ marginTop: "0.75rem" }}>{mutationError}</div>}
      </>
    );
  }

  const activeConversationTitle = activeConversation?.title || t("chat.conversation.newTitle");
  const activeConversationMeta = activeConversation
    ? t("chat.history.lastUpdated", { time: formatChatUpdatedAt(activeConversation.updatedAt, t) })
    : t("chat.history.noActive");
  const showFullPageEmptyState = Boolean(
    !initialLoading &&
    !conversationLoading &&
    !conversationError &&
    messages.length === 0
  );
  const quickPromptSelectionDisabled = sending || syncing || generating || conversationLoading;
  const fullPageEmptyState = showFullPageEmptyState ? (
    <CyberGuardEmptyState
      title={t("chat.pilot.empty.title")}
      description={t("chat.pilot.empty.description")}
      prompts={(
        <CyberGuardQuickPrompts
          label={t("chat.pilot.quickPrompts.groupLabel")}
          prompts={quickPrompts}
          disabled={quickPromptSelectionDisabled}
          onSelectPrompt={handleQuickPromptSelect}
        />
      )}
    />
  ) : null;

  return (
    <div className="cyberguard-theme cyberguard-page">
      <CyberGuardWorkspaceHeader
        title={t("chat.pilot.header.title")}
        description={t("chat.pilot.header.description")}
        conversationLabel={t("chat.pilot.header.currentConversation")}
        conversationTitle={activeConversationTitle}
        updatedLabel={activeConversationMeta}
        historyLabel={historyUsesDrawer
          ? t("chat.accessibility.openHistory")
          : sidebarCollapsed
            ? t("chat.accessibility.expandHistory")
            : t("chat.accessibility.collapseHistory")}
        newChatLabel={t("chat.actions.newChat")}
        onOpenHistory={handleWorkspaceHistoryAction}
        onNewChat={handleCreateConversation}
        historyButtonRef={historyDrawerTriggerRef}
        historyControls={historyUsesDrawer ? historyDrawerId : historyListId}
        historyExpanded={historyUsesDrawer ? historyDrawerOpen : !sidebarCollapsed}
        newChatDisabled={initialLoading}
      />
      <CyberGuardAiNotice
        title={t("chat.pilot.notice.title")}
        description={t("chat.pilot.notice.description")}
      />

      <CyberGuardChatShell
        sidebarCollapsed={sidebarCollapsed}
        sidebar={
          <aside id={historyListId} className={`ai-chat-sidebar${sidebarCollapsed ? " collapsed" : ""}`} aria-label={t("chat.history.ariaLabel")}>
            {renderHistoryContent({ compact: sidebarCollapsed })}
          </aside>
        }
        conversation={
          <section className="ai-chat-main" aria-label={t("chat.page.chatAreaLabel")}>
            <div className="ai-chat-main-header">
              <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ minWidth: 0, flex: "1 1 auto" }}>
                  <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {activeConversationTitle}
                  </div>
                  <div style={{ color: "#77827d", fontSize: "0.8rem", marginTop: "0.15rem" }}>
                    {activeConversationMeta}
                  </div>
                </div>
              </div>
            </div>
            <ChatMessageList
              className="ai-chat-full-messages cyberguard-chat-shell-messages"
              emptyState={fullPageEmptyState}
            />
            <div className="cyberguard-chat-shell-composer">
              <ChatComposer
                draftRequest={composerDraftRequest}
                useComposerFrame
                composerLabel={t("chat.pilot.composer.label")}
                composerGuidance={t("chat.pilot.composer.guidance")}
              />
            </div>
          </section>
        }
      />
      {historyDrawerOpen && (
        <div className="ai-chat-drawer-layer">
          <button
            type="button"
            className="ai-chat-drawer-backdrop"
            onClick={closeHistoryDrawer}
            aria-label={t("chat.accessibility.closeHistory")}
          />
          <aside
            id={historyDrawerId}
            className="ai-chat-drawer"
            role="dialog"
            ref={historyDrawerRef}
            tabIndex={-1}
            aria-label={t("chat.history.ariaLabel")}
          >
            <div className="ai-chat-drawer-top">
              <div style={{ fontWeight: 800 }}>{t("chat.history.title")}</div>
              <button
                type="button"
                className="ai-chat-icon-button"
                onClick={closeHistoryDrawer}
                aria-label={t("chat.accessibility.closeHistory")}
              >
                ×
              </button>
            </div>
            {renderHistoryContent({ drawer: true })}
          </aside>
        </div>
      )}
      {deleteTarget && (
        <ConfirmationDialog
          title={t("chat.delete.title")}
          description={t("chat.delete.description", { title: deleteTarget.title })}
          cancelLabel={t("common.cancel")}
          confirmLabel={mutatingConversationId === deleteTarget.id ? t("chat.actions.deleting") : t("chat.actions.delete")}
          onCancel={closeDeleteDialog}
          onConfirm={confirmDeleteConversation}
          danger
        />
      )}
      {exportTarget && (
        <ExportConversationDialog
          title={t("chat.export.title")}
          description={t("chat.export.description")}
          conversationTitle={exportTarget.title}
          formatLabel={t("chat.export.formatLabel")}
          format={exportFormat}
          setFormat={setExportFormat}
          cancelLabel={t("common.cancel")}
          exportLabel={t("chat.export.confirm")}
          markdownLabel={t("chat.export.formats.markdown")}
          textLabel={t("chat.export.formats.text")}
          disabled={!activeConversationExportable}
          error={exportError}
          returnFocusHandled={Boolean(exportReturnFocusRef.current)}
          onCancel={closeExportDialog}
          onExport={confirmExportConversation}
        />
      )}
      {deleteTarget && deleteError && (
        <div className="field-error" role="alert" style={{ position: "fixed", left: "50%", bottom: "1rem", transform: "translateX(-50%)", zIndex: 220 }}>
          {deleteError}
        </div>
      )}
    </div>
  );
}

// ─── Chat Widget (floating) ────────────────────────────────────────
function ChatWidget() {
  const { t } = useTranslation();
  const { user, go } = useApp();
  const [open,     setOpen]     = useState(false);
  const displayName = user?.displayName || user?.name;
  const group = user ? getAgeGroup(user.age) : null;

  function openFullPage() {
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
  const { requestGuardedAction, activityGuard } = useApp();
  const { t } = useTranslation();
  const [locale, setLocale] = useState(normalizeLocale(i18n.language));
  const selectRef = useRef(null);

  useEffect(() => {
    function sync(nextLocale) {
      setLocale(normalizeLocale(nextLocale));
    }
    i18n.on("languageChanged", sync);
    return () => i18n.off("languageChanged", sync);
  }, []);

  async function applyLocale(nextLocale) {
    localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    await i18n.changeLanguage(nextLocale);
  }

  function changeLocale(event) {
    const nextLocale = normalizeLocale(event.target.value);
    const currentInterfaceLocale = normalizeLocale(i18n.language);
    if (nextLocale === currentInterfaceLocale) return;

    const execute = async () => {
      try {
        await applyLocale(nextLocale);
      } catch (error) {
        console.error("Unable to change interface language", error);
        setLocale(normalizeLocale(i18n.language));
      }
    };

    const blocker = activityGuard?.source === "resource-content"
      ? {
          ...activityGuard,
          title: t("admin.resourceEditor.discardTitle"),
          description: t("admin.resourceEditor.discardInterfaceLocaleMessage", {
            locale: t(`admin.resourceEditor.locales.${activityGuard.locale}`, {
              defaultValue: activityGuard.locale || "",
            }),
          }),
          cancelLabel: t("admin.resourceEditor.continueEditing"),
          confirmLabel: t("admin.resourceEditor.discardAndChangeLanguage"),
        }
      : activityGuard;
    const shouldBypassScenarioGuard = blocker?.source === "scenario";

    const appliedImmediately = requestGuardedAction?.(execute, {
      actionType: "interface-locale-change",
      guard: blocker,
      bypassGuard: shouldBypassScenarioGuard,
      meta: {
        currentInterfaceLocale,
        nextLocale,
        editorTranslationLocale: activityGuard?.source === "resource-content" ? activityGuard.locale : null,
      },
      onCancel: () => {
        setLocale(currentInterfaceLocale);
        window.setTimeout(() => selectRef.current?.focus(), 0);
      },
    });

    if (!appliedImmediately) {
      setLocale(currentInterfaceLocale);
      return;
    }
  }

  return (
    <label className="nav-language" title={t("nav.languageControlTitle")}>
      <span aria-hidden="true">🌐</span>
      <select ref={selectRef} value={locale} onChange={changeLocale} aria-label={t("nav.languageAriaLabel")}>
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
  { id: "admin", labelKey: "nav.admin", adminOnly: true },
  { id: "about", labelKey: "nav.about" },
];

const LOGGED_OUT_NAV_ITEMS = NAV_ITEMS.filter(item =>
  ["home", "resources", "about"].includes(item.id)
);

function navigationItemsForUser(user) {
  if (!user) return LOGGED_OUT_NAV_ITEMS;
  return NAV_ITEMS.filter(item => !item.adminOnly || user.role === "admin");
}

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
          {user?.role === "admin" && (
            <button
              type="button"
              className="account-menu-item"
              role="menuitem"
              ref={element => { itemRefs.current[3] = element; }}
              onKeyDown={event => handleMenuKeyDown(event, 3)}
              onClick={() => navigate("admin")}
            >
              {t("nav.accountMenu.adminConsole")}
            </button>
          )}
          <div className="account-menu-divider" role="separator" />
          <button
            type="button"
            className="account-menu-item danger"
            role="menuitem"
            ref={element => { itemRefs.current[4] = element; }}
            onKeyDown={event => handleMenuKeyDown(event, 4)}
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
  const { go, user, logout, openAuth, requestLogoutWithGuard } = useApp();
  const { t } = useTranslation();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const isMobileNav = useMediaQuery("(max-width: 1050px)");
  const logoutReturnFocusRef = useRef(null);
  const navItems = navigationItemsForUser(user);

  async function confirmLogout() {
    setLogoutModalOpen(false);
    await logout();
  }

  function requestLogout(focusTarget) {
    if (requestLogoutWithGuard?.()) return;
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
    <nav className={`navbar${page === "ai-chat" ? " cyberguard-nav-flow" : ""}`}>
      <button
        type="button"
        className="nav-logo"
        onClick={() => go(user ? "dashboard" : "home")}
        aria-label={t(user ? "nav.brandDashboardAriaLabel" : "nav.brandHomeAriaLabel")}
      >
        <img className="navbar-logo" src={cyberlyNavbarLogo} alt="Cyberly" />
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
  const [acceptedHash, setAcceptedHash] = useState(() => normalizeHashRoute(typeof window === "undefined" ? "#/home" : window.location.hash));
  const [page, setPage] = useState(() => parseHashPage(acceptedHash));
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resourceFocusTopic, setResourceFocusTopic] = useState(null);
  const [pendingResourceTarget, setPendingResourceTarget] = useState(null);
  const [pendingScenarioTarget, setPendingScenarioTarget] = useState(null);
  const [pendingProgressSection, setPendingProgressSection] = useState(null);
  const [authMode, setAuthMode] = useState("login");
  const [activityGuard, setActivityGuard] = useState(null);
  const [pendingNavigation, setPendingNavigation] = useState(null);
  const appUserIdRef = useRef(null);
  const suppressHashGuardRef = useRef(null);
  const acceptedHashRef = useRef(acceptedHash);
  const activityGuardRef = useRef(null);
  const historyIndexRef = useRef(
    typeof window === "undefined" || !Number.isInteger(window.history.state?.cyberlyHistoryIndex)
      ? 0
      : window.history.state.cyberlyHistoryIndex
  );
  const userId = user?.id;
  const userProfilePreferredLanguage =
    user?.profile?.preferredLanguage;
  const userPreferredLanguage =
    user?.preferredLanguage;

  useEffect(() => {
    appUserIdRef.current = user?.id || null;
  }, [user?.id]);

  const acceptHashRoute = useCallback((hashValue, historyIndex = historyIndexRef.current) => {
    const nextHash = normalizeHashRoute(hashValue);
    if (parseHashPage(nextHash) !== "verify-email") clearEmailVerificationResult();
    acceptedHashRef.current = nextHash;
    historyIndexRef.current = Number.isInteger(historyIndex) ? historyIndex : historyIndexRef.current;
    setAcceptedHash(nextHash);
    setPage(parseHashPage(nextHash));
  }, []);

  const commitHashRoute = useCallback((hashValue, options = {}) => {
    if (typeof window === "undefined") return;
    const nextHash = normalizeHashRoute(hashValue);
    const currentHash = normalizeHashRoute(window.location.hash);
    const replace = Boolean(options.replace);
    const nextIndex = replace ? historyIndexRef.current : historyIndexRef.current + 1;
    const state = {
      ...(window.history.state || {}),
      cyberlyHistoryIndex: nextIndex,
      route: nextHash,
    };

    if (currentHash !== nextHash || replace) {
      window.history[replace ? "replaceState" : "pushState"](state, "", nextHash);
    } else {
      window.history.replaceState(state, "", nextHash);
    }

    acceptHashRoute(nextHash, nextIndex);
  }, [acceptHashRoute]);

  useEffect(() => {
    activityGuardRef.current = activityGuard;
  }, [activityGuard]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const currentHash = normalizeHashRoute(window.location.hash);
    const existingIndex = window.history.state?.cyberlyHistoryIndex;
    if (Number.isInteger(existingIndex)) {
      historyIndexRef.current = existingIndex;
      acceptHashRoute(currentHash, existingIndex);
      return;
    }
    window.history.replaceState({
      ...(window.history.state || {}),
      cyberlyHistoryIndex: historyIndexRef.current,
      route: currentHash,
    }, "", currentHash);
    acceptHashRoute(currentHash, historyIndexRef.current);
  }, [acceptHashRoute]);

  useEffect(() => {
    let active = true;
    dbMe().then(result => {
      if (!active) return;
      if (result.ok) {
        const restoredUser = normalizeSessionUser(result.user, result.profile);
        const currentHash = normalizeHashRoute(window.location.hash);
        const restoredPage = parseHashPage(currentHash);
        appUserIdRef.current = restoredUser.id || null;
        setUser(restoredUser);
        if (PROTECTED_PAGES.has(restoredPage)) {
          commitHashRoute(resolveSessionRestoreHash({
            currentHash,
            restoredPage,
            onboardingCompleted: restoredUser.onboardingCompleted,
          }), { replace: true });
        } else if (restoredPage === "login") {
          commitHashRoute(`/${restoredUser.onboardingCompleted ? "dashboard" : "profile"}`, { replace: true });
        } else if (VERIFICATION_PAGES.has(restoredPage)) {
          commitHashRoute(currentHash, { replace: true });
        } else {
          commitHashRoute(`/${restoredPage}`, { replace: true });
        }
      } else {
        const currentHash = normalizeHashRoute(window.location.hash);
        const restoredPage = parseHashPage(currentHash);
        if (PROTECTED_PAGES.has(restoredPage)) {
          commitHashRoute("/home", { replace: true });
        } else if (VERIFICATION_PAGES.has(restoredPage)) {
          commitHashRoute(currentHash, { replace: true });
        } else {
          commitHashRoute(`/${restoredPage}`, { replace: true });
        }
      }
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, [commitHashRoute]);

  useEffect(() => {
    function handleHashChange() {
      const nextHash = normalizeHashRoute(window.location.hash);
      if (suppressHashGuardRef.current) {
        const suppress = suppressHashGuardRef.current;
        suppressHashGuardRef.current = false;
        const nextIndex = Number.isInteger(window.history.state?.cyberlyHistoryIndex)
          ? window.history.state.cyberlyHistoryIndex
          : historyIndexRef.current;
        if (suppress.accept) {
          acceptHashRoute(nextHash, nextIndex);
        }
        return;
      }

      const blocker = activityGuardRef.current;
      const requestedIndex = window.history.state?.cyberlyHistoryIndex;
      const acceptedIndex = historyIndexRef.current;
      if (shouldBlockRouteTransition({ blocker, acceptedHash: acceptedHashRef.current, requestedHash: nextHash })) {
        const pending = createPendingRouteTransition({
          acceptedHash: acceptedHashRef.current,
          requestedHash: nextHash,
          acceptedIndex,
          requestedIndex,
        });
        setPendingNavigation({ ...pending, guard: blocker });
        if (Number.isInteger(pending.historyDelta) && pending.historyDelta !== 0) {
          suppressHashGuardRef.current = { accept: false };
          window.history.go(-pending.historyDelta);
        } else {
          window.history.replaceState({
            ...(window.history.state || {}),
            cyberlyHistoryIndex: acceptedIndex,
            route: acceptedHashRef.current,
          }, "", acceptedHashRef.current);
        }
        return;
      }

      const nextPage = parseHashPage(nextHash);
      if (!user && PROTECTED_PAGES.has(nextPage)) {
        commitHashRoute("/home", { replace: true });
        return;
      }
      const nextIndex = Number.isInteger(requestedIndex) ? requestedIndex : acceptedIndex;
      acceptHashRoute(nextHash, nextIndex);
    }

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, [acceptHashRoute, commitHashRoute, user]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page]);

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
    appUserIdRef.current = nextUser.id || null;
    setUser(nextUser);
    commitHashRoute(`/${preferredPage || (nextUser.onboardingCompleted ? "dashboard" : "profile")}`, { replace: true });
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
  async function refreshCurrentUserState() {
    const requestUserId = appUserIdRef.current;
    const result = await dbMe();
    if (!result.ok) return result;
    if (requestUserId !== appUserIdRef.current) return { ok: false, stale: true };
    const nextUser = normalizeSessionUser(result.user, result.profile);
    if (requestUserId && nextUser.id !== requestUserId) return { ok: false };
    if (requestUserId !== appUserIdRef.current) return { ok: false, stale: true };
    setUser(nextUser);
    return { ok: true, user: nextUser, profile: result.profile };
  }
  function applyVerifiedEmailResult(verifiedUser) {
    if (!verifiedUser?.id) return;
    setUser(current => {
      if (!current || current.id !== verifiedUser.id) return current;
      return {
        ...current,
        emailVerified: Boolean(verifiedUser.emailVerified),
        emailVerifiedAt: verifiedUser.emailVerifiedAt || current.emailVerifiedAt || null,
      };
    });
  }
  async function logout() {
    appUserIdRef.current = null;
    clearEmailVerificationResult();
    await dbLogout();
    setUser(null);
    setResourceFocusTopic(null);
    setPendingResourceTarget(null);
    setPendingScenarioTarget(null);
    setPendingProgressSection(null);
    setActivityGuard(null);
    setPendingNavigation(null);
    commitHashRoute("/home", { replace: true });
  }
  function openRecommendedResource(topicCode) {
    setResourceFocusTopic(topicCode);
    setPendingResourceTarget(null);
    go("resources");
  }
  function openScenarioTarget(target = {}, source = "cyberguard") {
    const safeTarget = resolveChatActionTarget({ page: "scenarios", ...target });
    const scenarioTarget = {
      scenarioId: safeTarget?.scenarioId ? Number(safeTarget.scenarioId) : null,
      scenarioSlug: safeTarget?.scenarioSlug || null,
    };
    setPendingScenarioTarget(null);
    requestHashNavigation(buildRecommendedScenarioNavigation(scenarioTarget, source));
  }
  function openAuth(mode = "login") {
    setResourceFocusTopic(null);
    go("login", { authMode: mode });
  }
  function completeNavigation(nextPage, replace = false, requestedAuthMode) {
    if (nextPage !== "resources") {
      setResourceFocusTopic(null);
      setPendingResourceTarget(null);
    }
    if (nextPage !== "scenarios") setPendingScenarioTarget(null);
    if (nextPage !== "progress") setPendingProgressSection(null);
    if (nextPage === "login") {
      setAuthMode(requestedAuthMode === "register" ? "register" : "login");
    }
    const safePage = VALID_PAGES.has(nextPage) ? nextPage : "home";
    if (!user && PROTECTED_PAGES.has(safePage)) {
      commitHashRoute("/home", { replace: true });
      return;
    }
    commitHashRoute(`/${safePage}`, { replace });
  }
  function go(nextPage, options = {}) {
    const safePage = VALID_PAGES.has(nextPage) ? nextPage : "home";
    const targetHash = `#/${safePage}`;
    const blocker = options.guard || activityGuardRef.current;
    if (shouldBlockRouteTransition({ blocker, acceptedHash: acceptedHashRef.current, requestedHash: targetHash }) && !options.bypassGuard) {
      setPendingNavigation({ type: "hash", hash: targetHash, guard: blocker });
      return;
    }
    completeNavigation(safePage, options.replace, options.authMode);
  }
  function requestHashNavigation(hashValue, options = {}) {
    const nextHash = normalizeHashRoute(hashValue);
    const blocker = options.guard || activityGuardRef.current;
    if (shouldBlockRouteTransition({ blocker, acceptedHash: acceptedHashRef.current, requestedHash: nextHash }) && !options.bypassGuard) {
      setPendingNavigation({ type: "hash", hash: nextHash, guard: blocker });
      return false;
    }
    commitHashRoute(nextHash, { replace: options.replace });
    return true;
  }
  function completeGuardedActivity({ blockerKey, destinationHash, replace = false } = {}) {
    const currentBlocker = activityGuardRef.current;
    if (currentBlocker && currentBlocker.key !== blockerKey) return false;
    if (currentBlocker?.key === blockerKey) {
      activityGuardRef.current = null;
      setActivityGuard(null);
    }
    setPendingNavigation(current => current?.guard?.key === blockerKey ? null : current);
    commitHashRoute(destinationHash, { replace });
    return true;
  }
  function requestGuardedAction(action, options = {}) {
    if (typeof action !== "function") return false;
    const blocker = options.guard || activityGuardRef.current;
    if (shouldGuardAction({ blocker, bypassGuard: options.bypassGuard })) {
      setPendingNavigation(createPendingAction({
        actionType: options.actionType || "generic",
        execute: action,
        guard: blocker,
        meta: options.meta || null,
        onCancel: options.onCancel || null,
      }));
      return false;
    }
    action();
    return true;
  }
  function requestLogoutWithGuard() {
    const blocker = activityGuardRef.current;
    if (!blocker) return false;
    setPendingNavigation({
      type: "logout",
      guard: {
        ...blocker,
        title: t("nav.logoutModal.title"),
        description:
          blocker.logoutDescription
          || blocker.description
          || t("nav.logoutModal.description"),
        cancelLabel: blocker.cancelLabel || t("nav.logoutModal.cancel"),
        confirmLabel: t("nav.logoutModal.confirm"),
      },
    });
    return true;
  }
  function handleChatAction(action) {
    const target = resolveChatActionTarget(action?.target);
    if (!target) return false;

    if (target.page === "resources") {
      setResourceFocusTopic(null);
      setPendingResourceTarget({
        resourceId: target.resourceId ? Number(target.resourceId) : null,
        resourceSlug: target.resourceSlug || null,
      });
      go("resources");
      return true;
    }

    if (target.page === "scenarios") {
      openScenarioTarget(target);
      return true;
    }

    if (target.page === "progress") {
      setPendingProgressSection(target.sectionId || null);
      go("progress");
      return true;
    }

    if (target.page === "assessment") {
      go("assessment");
      return true;
    }

    return false;
  }
  const registerActivityGuard = useCallback((guard) => {
    const nextGuard = {
      ...guard,
      key: guard?.key || `${guard?.source || "activity"}:${guard?.resourceId || "unknown"}:${guard?.locale || "default"}`,
    };
    activityGuardRef.current = nextGuard;
    setActivityGuard(nextGuard);
    return () => {
      setActivityGuard(current => {
        if (current?.key !== nextGuard.key) return current;
        if (activityGuardRef.current?.key === nextGuard.key) activityGuardRef.current = null;
        return null;
      });
    };
  }, []);
  function cancelPendingNavigation() {
    pendingNavigation?.onCancel?.();
    setPendingNavigation(null);
  }
  async function confirmPendingNavigation() {
    const target = pendingNavigation || { type: "page", page: "dashboard" };
    setPendingNavigation(null);
    activityGuardRef.current = null;
    setActivityGuard(null);
    if (target.type === "logout") {
      target.guard?.onLeave?.();
      await logout();
      return;
    }
    if (target.guard?.source === "scenario") {
      target.guard.onLeave?.();
      commitHashRoute("/scenarios", { replace: true });
      return;
    }
    if (target.type === "hash") {
      if (Number.isInteger(target.historyDelta) && target.historyDelta !== 0) {
        suppressHashGuardRef.current = { accept: true };
        window.history.go(target.historyDelta);
      } else {
        commitHashRoute(target.hash);
      }
      return;
    }
    if (target.type === "action") {
      await target.execute?.();
      return;
    }
    completeNavigation(target.page || "dashboard");
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
    refreshCurrentUserState,
    applyVerifiedEmailResult,
    resourceFocusTopic,
    pendingResourceTarget,
    pendingScenarioTarget,
    pendingProgressSection,
    openRecommendedResource,
    openScenarioTarget,
    clearResourceFocus: () => setResourceFocusTopic(null),
    clearPendingResourceTarget: () => setPendingResourceTarget(null),
    clearPendingScenarioTarget: () => setPendingScenarioTarget(null),
    clearPendingProgressSection: () => setPendingProgressSection(null),
    handleChatAction,
    acceptedHash,
    registerActivityGuard,
    requestHashNavigation,
    completeGuardedActivity,
    requestGuardedAction,
    requestLogoutWithGuard,
    activityGuard,
    hasActivityGuard: Boolean(activityGuard),
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
    admin:     <AdminPage acceptedHash={acceptedHash} />,
    login:     <AuthGate />,
    "verify-email": <EmailVerificationPage />,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <ChatProvider user={user}>
        <style>{globalStyle}</style>
        <AppShell
          navigation={<Navbar page={page} />}
          mainClassName={`page-wrap${page === "ai-chat" ? " cyberguard-page-wrap" : ""}`}
          footer={page !== "ai-chat" ? <Footer /> : null}
          floating={!checkingSession && page !== "ai-chat" ? <ChatWidget /> : null}
        >
          {checkingSession ? (
            <div className="section">
              <p className="section-title">{t("app.loadingTitle")}</p>
              <p className="section-sub">{t("app.checkingSession")}</p>
            </div>
          ) : (
            <>
              {user && !user.emailVerified && page !== "login" && <EmailVerificationReminder compact={page === "ai-chat"} />}
              {PAGES[page] ?? <HomePage />}
            </>
          )}
        </AppShell>
        {pendingNavigation && (pendingNavigation.guard || activityGuard) && (
          <ConfirmationDialog
            title={(pendingNavigation.guard || activityGuard).title}
            description={(pendingNavigation.guard || activityGuard).description}
            cancelLabel={(pendingNavigation.guard || activityGuard).cancelLabel || t("common.continueActivity")}
            confirmLabel={(pendingNavigation.guard || activityGuard).confirmLabel || t("common.leavePage")}
            onCancel={cancelPendingNavigation}
            onConfirm={confirmPendingNavigation}
            danger
            adminTheme={
              String((pendingNavigation.guard || activityGuard).source || "").startsWith("resource-") ||
              routeIdentityFromHash(acceptedHash).page === "admin"
            }
          />
        )}
      </ChatProvider>
    </AppCtx.Provider>
  );
}
