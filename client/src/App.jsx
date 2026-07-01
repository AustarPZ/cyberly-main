import { useState, createContext, useContext, useRef, useEffect } from "react";
import profileMappings from "./profileMappings";

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
  display: flex; align-items: center; gap: 0.25rem;
  padding: 0 1.5rem;
}
.nav-logo {
  font-family: 'Space Grotesk', sans-serif;
  font-size: 1.1rem; font-weight: 600; color: var(--teal);
  margin-right: auto; display: flex; align-items: center; gap: 0.4rem;
}
.nav-link {
  background: none; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem;
  color: #555; padding: 0.4rem 0.75rem; border-radius: 8px;
}
.nav-link:hover { background: var(--gray-lt); }
.nav-link.active { color: var(--teal); font-weight: 600; background: var(--teal-lt); }
.nav-cta {
  background: var(--teal); color: #fff; border: none; cursor: pointer;
  font-family: 'DM Sans', sans-serif; font-size: 0.875rem; font-weight: 500;
  padding: 0.45rem 1.1rem; border-radius: 20px; margin-left: 0.5rem;
}
.nav-cta:hover { opacity: 0.88; }
.nav-user { display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; color: #555; }
.nav-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: var(--teal); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 0.75rem; font-weight: 600;
}
.nav-logout {
  font-size: 0.8rem; color: var(--coral); cursor: pointer;
  border: none; background: none; padding: 0.2rem 0.5rem; border-radius: 4px;
}
.nav-logout:hover { background: var(--coral-lt); }

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
.btn-ghost:hover { background: var(--gray-lt); }

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
}
.chat-header {
  background: var(--teal); color: #fff;
  padding: 0.75rem 1rem; font-weight: 600; font-size: 0.875rem;
  display: flex; align-items: center; justify-content: space-between;
}
.chat-header-sub { font-size: 0.75rem; font-weight: 400; opacity: 0.8; }
.chat-messages { height: 280px; overflow-y: auto; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.6rem; }
.chat-bubble { max-width: 85%; padding: 0.55rem 0.85rem; border-radius: 12px; font-size: 0.82rem; line-height: 1.5; }
.chat-bubble.user { align-self: flex-end; background: var(--teal); color: #fff; border-bottom-right-radius: 3px; }
.chat-bubble.ai { align-self: flex-start; background: var(--gray-lt); border-bottom-left-radius: 3px; }
.chat-bubble.ai.loading { opacity: 0.6; font-style: italic; }
.chat-input-row { display: flex; gap: 0.5rem; padding: 0.6rem 0.75rem; border-top: 1px solid rgba(0,0,0,0.07); }
.chat-input { flex: 1; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 0.45rem 0.7rem; font-family: 'DM Sans', sans-serif; font-size: 0.82rem; outline: none; resize: none; }
.chat-input:focus { border-color: var(--teal); }
.chat-send { background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 0.85rem; cursor: pointer; font-size: 0.85rem; font-weight: 500; }
.chat-send:hover { opacity: 0.88; }
.chat-send:disabled { opacity: 0.45; cursor: not-allowed; }
.chat-login-prompt { padding: 1.25rem; text-align: center; color: #666; font-size: 0.85rem; }
.chat-login-prompt button { margin-top: 0.75rem; background: var(--teal); color: #fff; border: none; border-radius: 8px; padding: 0.5rem 1.25rem; cursor: pointer; font-size: 0.875rem; }

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

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

const {
  EDUCATION_LEVELS,
  LANGUAGES,
  FAMILIARITY,
  HELP_OPTIONS,
  LEARNING_STYLES,
  labelFor,
  labelsFor,
} = profileMappings;

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
    name: userData?.displayName || userData?.name || learnerProfile.aiNickname || "Learner",
    aiNickname: learnerProfile.aiNickname || userData?.displayName || userData?.name || "Learner",
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

// Returns { ok: true } or { ok: false, error: string }
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

    if (!response.ok) {
      return { ok: false, error: data.message || "Failed to register. Please try again." };
    }

    return { ok: true, user: data.user, profile: data.profile };

  } catch (error) {
    console.error("Registration error:", error);
    return { ok: false, error: "Network error. Could not connect to the server." };
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
    if (!response.ok) {
      return { ok: false, error: data.message || "Unable to sign in." };
    }

    return { ok: true, user: data.user, profile: data.profile };
  } catch {
    return { ok: false, error: "Network error. Could not connect to the server." };
  }
}

async function dbMe() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false };
    return { ok: true, user: data.user, profile: data.profile };
  } catch {
    return { ok: false };
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
    if (!response.ok) {
      return { ok: false, error: data.message || "Unable to save learner profile.", errors: data.errors || {} };
    }
    return { ok: true, profile: data.profile };
  } catch {
    return { ok: false, error: "Network error. Could not save learner profile." };
  }
}

async function dbGetInitialAssessment() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments/initial`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load assessment." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load assessment." };
  }
}

async function dbGetAssessmentStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments/initial/status`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load assessment status." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load assessment status." };
  }
}

async function dbStartInitialAttempt() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessments/initial/attempts`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to start assessment." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not start assessment." };
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
    if (!response.ok) return { ok: false, error: data.message || "Unable to save answer." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not save answer." };
  }
}

async function dbSubmitAssessment(attemptId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/assessment-attempts/${attemptId}/submit`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to submit assessment." };
    return { ok: true, result: data };
  } catch {
    return { ok: false, error: "Network error. Could not submit assessment." };
  }
}

async function dbGetProgress() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/progress`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load progress." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load progress." };
  }
}

async function dbGetCurrentRecommendation() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/current`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load recommendation." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load recommendation." };
  }
}

async function dbMarkRecommendationViewed(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/${id}/viewed`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to update recommendation." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not update recommendation." };
  }
}

async function dbMarkRecommendationCompleted(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/recommendations/${id}/completed`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to complete recommendation." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not complete recommendation." };
  }
}

async function dbGetScenarios(filters = {}) {
  try {
    const params = new URLSearchParams();
    if (filters.topicCode) params.set("topicCode", filters.topicCode);
    if (filters.difficulty) params.set("difficulty", filters.difficulty);
    const response = await fetch(`${API_BASE_URL}/api/scenarios${params.toString() ? `?${params}` : ""}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load scenarios." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load scenarios." };
  }
}

async function dbGetScenario(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/${slug}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load scenario." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load scenario." };
  }
}

async function dbStartScenario(slug) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/${slug}/attempts`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to start scenario." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not start scenario." };
  }
}

async function dbGetScenarioAttempt(attemptId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to restore scenario." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not restore scenario." };
  }
}

async function dbSaveScenarioDecision(attemptId, stepId, selectedOptionKey) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}/decisions`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stepId, selectedOptionKey }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to save decision." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not save decision." };
  }
}

async function dbCompleteScenario(attemptId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}/complete`, {
      method: "POST",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to complete scenario." };
    return { ok: true, result: data };
  } catch {
    return { ok: false, error: "Network error. Could not complete scenario." };
  }
}

async function dbGetScenarioResult(attemptId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenario-attempts/${attemptId}/result`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load scenario result." };
    return { ok: true, result: data };
  } catch {
    return { ok: false, error: "Network error. Could not load scenario result." };
  }
}

async function dbGetRecommendedScenarios() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/recommended`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load recommended scenarios." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load recommended scenarios." };
  }
}

async function dbGetScenarioDashboard() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scenarios/dashboard`, {
      method: "GET",
      credentials: "include",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, error: data.message || "Unable to load scenario activity." };
    return { ok: true, ...data };
  } catch {
    return { ok: false, error: "Network error. Could not load scenario activity." };
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
async function askClaude(messages, systemPrompt) {
  void messages;
  void systemPrompt;
  return "CyberGuard chat is ready visually, but live AI replies are disabled until the backend AI Gateway phase. Your message is kept only in this page session for now.";
}

// ─────────────────────────────────────────────────────────────────
// STEP 1 — Account credentials
// ─────────────────────────────────────────────────────────────────
function StepCredentials({ data, onChange, errors }) {
  return (
    <>
      <div className="auth-title">Create your account</div>
      <div className="auth-sub">Account details stay with your user account. Learning preferences are saved after onboarding.</div>

      <div className="field">
        <label>Email</label>
        <input
          type="email"
          placeholder="you@example.com"
          value={data.email}
          onChange={e => onChange("email", e.target.value)}
        />
        {errors.email && <div className="field-error">{errors.email}</div>}
      </div>

      <div className="field">
        <label>Display name</label>
        <input
          placeholder="Your name"
          value={data.displayName}
          onChange={e => onChange("displayName", e.target.value)}
        />
        {errors.displayName && <div className="field-error">{errors.displayName}</div>}
      </div>

      <div className="field">
        <label>Age</label>
        <input
          type="number"
          placeholder="e.g. 16"
          value={data.age}
          onChange={e => onChange("age", e.target.value)}
        />
        {errors.age && <div className="field-error">{errors.age}</div>}
      </div>

      <div className="field">
        <label>Password</label>
        <input
          type="password"
          placeholder="At least 8 characters"
          value={data.password}
          onChange={e => onChange("password", e.target.value)}
        />
        {errors.password && <div className="field-error">{errors.password}</div>}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 2 — AI nickname
// ─────────────────────────────────────────────────────────────────
function StepNickname({ data, onChange, errors }) {
  return (
    <>
      <div className="q-label">
        1. What should the AI call you?
        <div className="q-hint">This can be a nickname or alias — it's just for CyberGuard.</div>
      </div>
      <div className="field">
        <input
          placeholder="e.g. Alex, Koko, ZK…"
          value={data.aiNickname}
          onChange={e => onChange("aiNickname", e.target.value)}
        />
        {errors.aiNickname && <div className="field-error">{errors.aiNickname}</div>}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 3 — Education level
// ─────────────────────────────────────────────────────────────────
function StepEducationLevel({ data, onChange }) {
  return (
    <>
      <div className="q-label">2. What education level best fits you?</div>
      <div className="opt-grid">
        {EDUCATION_LEVELS.map(level => (
          <button
            key={level.value}
            className={`opt-btn full-width ${data.educationLevel === level.value ? "selected" : ""}`}
            onClick={() => onChange("educationLevel", level.value)}
          >
            {level.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 4 — Language preference
// ─────────────────────────────────────────────────────────────────
function StepLanguage({ data, onChange }) {
  return (
    <>
      <div className="q-label">3. Which language do you prefer?</div>
      <div className="opt-grid">
        {LANGUAGES.map(lang => (
          <button
            key={lang.value}
            className={`opt-btn full-width ${data.language === lang.value ? "selected" : ""}`}
            onClick={() => onChange("language", lang.value)}
          >
            {lang.label}
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 5 — Cybersecurity familiarity
// ─────────────────────────────────────────────────────────────────
function StepFamiliarity({ data, onChange }) {
  return (
    <>
      <div className="q-label">4. How familiar are you with cybersecurity?</div>
      <div className="opt-grid">
        {FAMILIARITY.map(lvl => (
          <button
            key={lvl.value}
            className={`opt-btn full-width ${data.familiarity === lvl.value ? "selected" : ""}`}
            onClick={() => onChange("familiarity", lvl.value)}
          >
            <strong>{lvl.label}</strong>
            <div style={{ fontSize: "0.78rem", color: data.familiarity === lvl.value ? "inherit" : "#888", marginTop: "0.2rem", fontWeight: 400 }}>
              {lvl.desc}
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
function StepHelpTopics({ data, onChange }) {
  const selected = data.helpTopics || [];
  function toggle(topic) {
    if (selected.includes(topic)) {
      onChange("helpTopics", selected.filter(t => t !== topic));
    } else if (selected.length < 3) {
      onChange("helpTopics", [...selected, topic]);
    }
  }
  return (
    <>
      <div className="q-label">
        5. What would you like help with?
        <div className="q-hint">Choose up to 3 topics.</div>
      </div>
      <div className="chip-grid">
        {HELP_OPTIONS.map(topic => (
          <button
            key={topic.value}
            className={`chip-btn ${selected.includes(topic.value) ? "selected" : ""}`}
            onClick={() => toggle(topic.value)}
            disabled={selected.length >= 3 && !selected.includes(topic.value)}
          >
            {topic.label}
          </button>
        ))}
      </div>
      <div className="chip-limit-note">
        {selected.length}/3 selected
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// STEP 7 — Learning style
// ─────────────────────────────────────────────────────────────────
function StepLearningStyle({ data, onChange }) {
  return (
    <>
      <div className="q-label">6. How do you prefer learning?</div>
      <div className="opt-grid">
        {LEARNING_STYLES.map(style => (
          <button
            key={style.value}
            className={`opt-btn full-width ${data.learningStyle === style.value ? "selected" : ""}`}
            onClick={() => onChange("learningStyle", style.value)}
          >
            {style.icon} {style.label}
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
const STEP_LABELS = [
  "Account",
  "Nickname",
  "Education",
  "Language",
  "Experience",
  "Goals",
  "Learning Style",
];

function RegisterPage({ onSwitch }) {
  const { login } = useApp();
  const [step, setStep] = useState(1);
  const [registeredUser, setRegisteredUser] = useState(null);
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
    setForm(f => ({ ...f, [key]: val }));
    setErrors(e => ({ ...e, [key]: undefined }));
  }

  // Per-step validation
  function validate() {
    const e = {};
    if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
        e.email = "Please enter a valid email address.";
      if (!form.displayName.trim() || form.displayName.trim().length > 100)
        e.displayName = "Display name is required and must be 100 characters or fewer.";
      if (!form.age || isNaN(form.age) || !Number.isInteger(+form.age) || +form.age < 1 || +form.age > 120)
        e.age = "Please enter a whole-number age from 1 to 120.";
      if (!form.password || form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password))
        e.password = "Password must be at least 8 characters and include a letter and a number.";
    }
    if (step === 2) {
      if (!form.aiNickname.trim()) e.aiNickname = "Please enter a nickname for the AI to use.";
    }
    if (step === 3 && !form.educationLevel) e.educationLevel = "Please pick an education level.";
    if (step === 4 && !form.language)   e.language   = "Please pick a language.";
    if (step === 5 && !form.familiarity) e.familiarity = "Please pick your level.";
    if (step === 6 && form.helpTopics.length === 0) e.helpTopics = "Pick at least one topic.";
    if (step === 7 && !form.learningStyle) e.learningStyle = "Please pick a learning style.";
    return e;
  }

  function next() {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }
    if (step < TOTAL_STEPS) { setStep(s => s + 1); return; }
    // Final step — submit
    handleSubmit();
  }

  function back() { setStep(s => s - 1); }

  function buildLearnerProfilePayload() {
    return {
      aiNickname: form.aiNickname.trim(),
      educationLevel: form.educationLevel,
      preferredLanguage: form.language,
      familiarityLevel: form.familiarity,
      helpTopics: form.helpTopics,
      learningStyle: form.learningStyle,
      onboardingCompleted: true,
    };
  }

  async function handleSubmit() {
    setLoading(true);
    try {
      let accountUser = registeredUser;

      if (!accountUser) {
        const result = await dbRegister({
          email:       form.email.trim(),
          displayName: form.displayName.trim(),
          age:         +form.age,
          password:    form.password,
        });

        if (!result.ok) {
          setErrors({ form: result.error });
          return;
        }

        accountUser = result.user;
        setRegisteredUser(result.user);
      }

      const profileResult = await dbSaveProfile(buildLearnerProfilePayload());
      if (!profileResult.ok) {
        setErrors({
          form: "Your account was created, but your learner profile was not saved. Please retry saving your profile before continuing.",
          ...profileResult.errors,
        });
        return;
      }

      login(accountUser, profileResult.profile, "assessment");
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  const progress = Math.round((step / TOTAL_STEPS) * 100);

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-icon">🛡</div>
          <div className="auth-logo-name">Cyberly</div>
        </div>

        {/* Progress */}
        <div className="auth-progress">
          <div className="auth-progress-track">
            <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
          </div>
          <div className="auth-progress-label">
            <span>Step {step} of {TOTAL_STEPS} — {STEP_LABELS[step - 1]}</span>
            <span>{progress}%</span>
          </div>
        </div>

        {/* Step content */}
        {step === 1 && <StepCredentials data={form} onChange={set} errors={errors} />}
        {step === 2 && <StepNickname    data={form} onChange={set} errors={errors} />}
        {step === 3 && <StepEducationLevel data={form} onChange={set} errors={errors} />}
        {step === 4 && <StepLanguage    data={form} onChange={set} errors={errors} />}
        {step === 5 && <StepFamiliarity data={form} onChange={set} errors={errors} />}
        {step === 6 && <StepHelpTopics  data={form} onChange={set} errors={errors} />}
        {step === 7 && <StepLearningStyle data={form} onChange={set} errors={errors} />}

        {errors.form && <div className="field-error" style={{ marginTop: "0.5rem" }}>{errors.form}</div>}

        {/* Navigation */}
        <div className="auth-nav">
          {step > 1 && (
            <button className="btn-ghost" onClick={back}>← Back</button>
          )}
          <button
            className="btn-primary"
            onClick={next}
            disabled={loading}
          >
            {loading
              ? (registeredUser ? "Saving profile…" : "Setting up…")
              : step === TOTAL_STEPS
                ? (registeredUser ? "Retry saving profile" : "🚀 Let's go!")
                : "Continue →"}
          </button>
        </div>

        {/* Switch to login */}
        <div className="auth-switch">
          Already have an account?{" "}
          <button onClick={onSwitch}>Sign in</button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// LOGIN PAGE
// ─────────────────────────────────────────────────────────────────
function LoginPage({ onSwitch }) {
  const { login } = useApp();
  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const e = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Valid email is required.";
    if (!form.password) e.password = "Password is required.";
    return e;
  }

  async function handleSubmit() {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      const result = await dbLogin(form.email.trim(), form.password);
      if (!result.ok) {
        setErrors({ form: result.error });
      } else {
        login(result.user, result.profile);
      }
    } catch {
      setErrors({ form: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🛡</div>
          <div className="auth-logo-name">Cyberly</div>
        </div>
        <div className="auth-title">Welcome back</div>
        <div className="auth-sub">Sign in with your email and password to continue.</div>

        <div className="field">
          <label>Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => { setForm(f => ({ ...f, email: e.target.value })); setErrors({}); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          {errors.email && <div className="field-error">{errors.email}</div>}
        </div>
        <div className="field">
          <label>Password</label>
          <input
            type="password"
            placeholder="Your password"
            value={form.password}
            onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setErrors({}); }}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />
          {errors.password && <div className="field-error">{errors.password}</div>}
        </div>

        {errors.form && <div className="field-error" style={{ marginTop: "0.5rem" }}>{errors.form}</div>}

        <div className="auth-nav" style={{ marginTop: "1.5rem" }}>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </div>

        <div className="auth-switch">
          New here?{" "}
          <button onClick={onSwitch}>Create an account</button>
        </div>
      </div>
    </div>
  );
}

// ─── Auth Gate (toggles between Login & Register) ─────────────────
function AuthGate() {
  const { go } = useApp();
  const [mode, setMode] = useState("login");
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
        Back to Home
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
  const { go } = useApp();

  const threatStats = [
    { emoji: "😨", value: "11%", desc: "of Malaysian teens have fallen victim to an online scam" },
    { emoji: "📧", value: "50%", desc: "of students have received scam-related emails or SMS" },
    { emoji: "🎓", value: "84.6%", desc: "of students never attended a scam awareness workshop" },
    { emoji: "📱", value: "96%", desc: "of Malaysian teens aged 12–17 go online every single day" },
  ];

  const topics = [
    { emoji: "🎣", label: "Phishing" },
    { emoji: "💸", label: "Online Scams" },
    { emoji: "📰", label: "Fake News" },
    { emoji: "🤖", label: "AI & Deepfakes" },
    { emoji: "🔐", label: "Passwords" },
    { emoji: "🕵️", label: "Privacy" },
  ];

  const steps = [
    { num: "01", icon: "✍️", title: "Sign up free", desc: "Create your profile in under a minute — tell us your age, language, and what you want to learn." },
    { num: "02", icon: "🤖", title: "Meet your AI tutor", desc: "CyberGuard AI adapts to your level and chats with you in English, BM, or Chinese." },
    { num: "03", icon: "🚀", title: "Learn & level up", desc: "Explore guides, beat simulations, and track your progress as your cyber skills grow." },
  ];

  return (
    <>
      {/* ── Hero ── */}
      <div className="hero">
        <h1>Stay Safe in the Digital World 🛡</h1>
        <p>
          Cyberly is your personal cybersecurity guide — powered by AI that adapts to your level,
          language, and learning style.
        </p>
        <button className="hero-cta" onClick={() => go("login")}>
          Get started free →
        </button>
        <div className="stat-row">
          <div className="stat-chip">🎓 Built for Malaysian students</div>
          <div className="stat-chip">🌐 Supports 3 languages</div>
          <div className="stat-chip">🤖 AI-personalised</div>
        </div>
      </div>

      {/* ── Threat Stats Strip ── */}
      <div style={{ background: "#1a2e1a", padding: "2.5rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p style={{ textAlign: "center", color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "1.5rem" }}>
            Did you know? — Cyber threats facing Malaysian teens right now
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
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Why Cyberly ── */}
      <div className="section">
        <p className="section-title">Why Cyberly?</p>
        <p className="section-sub">Cybersecurity education that meets you where you are.</p>
        <div className="card-grid">
          {[
            { icon: "🧠", title: "Adaptive AI", desc: "Our AI adjusts explanations based on your experience level and preferred language." },
            { icon: "🔒", title: "Real Skills", desc: "Learn practical skills — spotting scams, protecting accounts, and browsing safely." },
            { icon: "🎯", title: "Focused Topics", desc: "Choose what matters to you — from online safety to cybersecurity careers." },
          ].map(c => (
            <div className="card" key={c.title}>
              <div style={{ fontSize: "1.8rem", marginBottom: "0.6rem" }}>{c.icon}</div>
              <div style={{ fontWeight: 600, marginBottom: "0.35rem" }}>{c.title}</div>
              <div style={{ color: "#666", fontSize: "0.875rem", lineHeight: 1.55 }}>{c.desc}</div>
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
                THREAT OF THE WEEK
              </span>
            </div>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", marginBottom: "0.4rem", color: "#1a1a18" }}>
              AI Voice & Video Scams (Deepfakes)
            </div>
            <div style={{ fontSize: "0.875rem", color: "#555", lineHeight: 1.65 }}>
              Scammers in Malaysia are now using AI to clone the voices and faces of celebrities and family members to trick people into sending money. If you get an unexpected video call or voice message asking for money — even if it looks real — always verify through another channel before acting.
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
            Learn more →
          </button>
        </div>
      </div>

      {/* ── Quick Topic Cards ── */}
      <div className="section" style={{ paddingTop: 0 }}>
        <p className="section-title">What do you want to learn today?</p>
        <p className="section-sub">Pick a topic and jump straight in.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
          {topics.map(t => (
            <button
              key={t.label}
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
              <span>{t.emoji}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ background: "var(--teal-lt)", borderTop: "1px solid rgba(29,158,117,0.12)", borderBottom: "1px solid rgba(29,158,117,0.12)", padding: "3rem 1.5rem" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <p className="section-title" style={{ textAlign: "center" }}>How Cyberly works</p>
          <p className="section-sub" style={{ textAlign: "center", marginBottom: "2rem" }}>Up and running in three simple steps.</p>
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
                    {s.icon} {s.title}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "#555", lineHeight: 1.65 }}>{s.desc}</div>
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
            Ready to level up your cyber skills?
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "2rem" }}>
            Join thousands of Malaysian teens learning how to stay safe online — for free, in your language, at your pace.
          </p>
          <button
            className="hero-cta"
            onClick={() => go("login")}
            style={{ fontSize: "1rem", padding: "0.85rem 2.5rem" }}
          >
            Get started free →
          </button>
          <div style={{ marginTop: "1.25rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.35)" }}>
            No credit card needed · Available in English, BM & 中文
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Page: Dashboard ──────────────────────────────────────────────
function DashboardPage() {
  const { user, go, openRecommendedResource } = useApp();
  const [tipIndex] = useState(() => Math.floor(Math.random() * 4));
  const [assessmentStatus, setAssessmentStatus] = useState({ loading: true, status: "pending" });
  const [progressState, setProgressState] = useState({ loading: true, progress: null });
  const [recommendationState, setRecommendationState] = useState({ loading: true, recommendation: null });
  const [scenarioState, setScenarioState] = useState({ loading: true, recommended: [], dashboard: null });

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    dbGetAssessmentStatus().then(result => {
      if (!active) return;
      if (result.ok) {
        setAssessmentStatus({ loading: false, status: result.status, result: result.result, attempt: result.attempt });
      } else {
        setAssessmentStatus({ loading: false, status: "unknown", error: result.error });
      }
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([dbGetRecommendedScenarios(), dbGetScenarioDashboard()]).then(([recommendedResult, dashboardResult]) => {
      if (!active) return;
      setScenarioState({
        loading: false,
        recommended: recommendedResult.ok ? recommendedResult.scenarios : [],
        dashboard: dashboardResult.ok ? dashboardResult : null,
        error: recommendedResult.ok && dashboardResult.ok ? null : (recommendedResult.error || dashboardResult.error),
      });
    });
    return () => { active = false; };
  }, [user]);

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([dbGetProgress(), dbGetCurrentRecommendation()]).then(([progressResult, recommendationResult]) => {
      if (!active) return;
      setProgressState(progressResult.ok
        ? { loading: false, progress: progressResult }
        : { loading: false, progress: null, error: progressResult.error });
      setRecommendationState(recommendationResult.ok
        ? { loading: false, recommendation: recommendationResult.recommendation }
        : { loading: false, recommendation: null, error: recommendationResult.error });
    });
    return () => { active = false; };
  }, [user]);

  if (!user) { go("login"); return null; }

  const nick  = user.aiNickname || user.name;
  const group = getAgeGroup(user.age);
  const summary = progressState.progress?.summary;
  const topicsMeasured = progressState.progress?.topics || [];
  const recommendation = recommendationState.recommendation;
  const recommendedScenario = scenarioState.recommended?.[0];
  const scenarioDashboard = scenarioState.dashboard;

  async function followRecommendation() {
    if (recommendation?.id) {
      await dbMarkRecommendationViewed(recommendation.id);
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
    { icon: "📚", label: "Browse Resources",  desc: "Guides on scams, privacy & more", page: "resources", color: "#E3F2FD", accent: "#1E88E5" },
    { icon: "🧭", label: "Initial Assessment", desc: "Set your measured baseline", page: "assessment", color: "#FFF3E0", accent: "#FB8C00" },
    { icon: "🎮", label: "Practice Scenarios", desc: "Make safe choices in realistic moments", page: "scenarios", color: "#E8F5E9", accent: "#2E7D32" },
    { icon: "👤", label: "Edit Profile",       desc: "Update your learner preferences", page: "profile",   color: "#E1F5EE", accent: "#1D9E75" },
    { icon: "ℹ️",  label: "About the Project", desc: "Meet the team behind Cyberly",  page: "about",     color: "#F3E5F5", accent: "#8E24AA" },
    { icon: "📊", label: "My Progress",        desc: "See your learning stats & topics", page: "progress",  color: "#FFF8E1", accent: "#F59E0B" },
    { icon: "🏠",  label: "Back to Home",      desc: "Return to the landing page",      page: "home",      color: "#E8F5E9", accent: "#43A047" },
  ];

  const tips = [
    { emoji: "🎣", tip: "Never click links in unexpected emails or SMS — go directly to the official website instead." },
    { emoji: "🔐", tip: "Use a different password for every account. A password manager makes this easy." },
    { emoji: "🤔", tip: "Before sharing news online, verify it on Sebenarnya.my — Malaysia's official fact-check site." },
    { emoji: "📵", tip: "If someone calls claiming to be from a bank or government, hang up and call the official number." },
  ];

  const todayTip = tips[tipIndex];

  return (
    <div>
      {/* Welcome hero */}
      <div style={{
        background: "linear-gradient(135deg, var(--teal) 0%, #1a5c4a 100%)",
        padding: "2.5rem 1.5rem", color: "#fff",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
              Your Dashboard
            </div>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.35rem" }}>
              Welcome back, {nick} 👋
            </h1>
            <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem" }}>
              {group.label} · {user.familiarity || "Beginner"} level{user.educationLevel ? ` · ${user.educationLevel}` : ""}
            </p>
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            {[
              { val: "9", label: "Topics" },
              { val: "3", label: "Languages" },
              { val: "AI", label: "Powered" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.12)", borderRadius: 12, padding: "0.75rem 1rem", textAlign: "center", minWidth: 64 }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem" }}>{s.val}</div>
                <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.6)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">

        {/* Profile summary */}
        {user.helpTopics?.length > 0 && (
          <div className="card" style={{ marginBottom: "2rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontWeight: 600, marginBottom: "0.4rem", color: "var(--teal)" }}>🎯 Your learning profile</div>
              <div style={{ fontSize: "0.85rem", color: "#333", lineHeight: 1.7 }}>
                <span>🌐 {user.language || "English"}</span>
                <span style={{ margin: "0 0.5rem" }}>·</span>
                <span>📖 {user.learningStyle}</span>
                <span style={{ margin: "0 0.5rem" }}>·</span>
                <span>🎯 {user.helpTopicLabels.join(", ")}</span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#5f6f69", marginTop: "0.45rem" }}>
                Learner preferences are saved to your profile and restored after refresh or login.
              </div>
            </div>
            <button onClick={() => go("profile")} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1.1rem", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>
              Edit profile →
            </button>
          </div>
        )}

        <div className="card" style={{ marginBottom: "2rem", background: "#fff8e1", border: "1px solid #ffe082", display: "flex", flexWrap: "wrap", gap: "1rem", alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontWeight: 700, color: "#e65100", marginBottom: "0.25rem" }}>
              {assessmentStatus.status === "completed"
                ? "Initial assessment completed"
                : assessmentStatus.status === "in_progress"
                  ? "Initial assessment in progress"
                  : "Initial assessment pending"}
            </div>
            <div style={{ fontSize: "0.86rem", color: "#5f4a1d", lineHeight: 1.6 }}>
              {assessmentStatus.loading && "Checking assessment status..."}
              {!assessmentStatus.loading && assessmentStatus.status === "completed" && (
                <>Measured level: <strong>{assessmentStatus.result?.attempt?.measuredLevel}</strong> · Score: <strong>{assessmentStatus.result?.attempt?.totalScore}/{assessmentStatus.result?.attempt?.maximumScore}</strong></>
              )}
              {!assessmentStatus.loading && assessmentStatus.status === "in_progress" && "Resume your saved answers and continue when ready."}
              {!assessmentStatus.loading && assessmentStatus.status !== "completed" && assessmentStatus.status !== "in_progress" && "Do it now or later. Adaptive recommendations are not active until this baseline exists."}
            </div>
          </div>
          <button onClick={() => go("assessment")} style={{ background: "#FB8C00", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
            {assessmentStatus.status === "completed" ? "View results" : assessmentStatus.status === "in_progress" ? "Resume" : "Start / do later"}
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="card" style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>Measured progress</div>
            {progressState.loading ? (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>Loading your measured baseline...</div>
            ) : summary?.exists ? (
              <>
                <div style={{ display: "flex", alignItems: "flex-end", gap: "0.45rem", marginBottom: "0.65rem" }}>
                  <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: "#1a1a18" }}>{summary.overallMasteryPercentage}%</span>
                  <span style={{ fontSize: "0.82rem", color: "#666", paddingBottom: "0.35rem" }}>{levelLabel(summary.measuredLevel)}</span>
                </div>
                <div style={{ background: "#edf3ef", borderRadius: 99, height: 10, overflow: "hidden", marginBottom: "0.7rem" }}>
                  <div style={{ width: `${summary.overallMasteryPercentage}%`, height: "100%", background: "var(--teal)", borderRadius: 99 }} />
                </div>
                <div style={{ fontSize: "0.8rem", color: "#666" }}>
                  {summary.completedTopicCount} measured topics · Based on assessment results, not profile preferences.
                </div>
              </>
            ) : (
              <div style={{ fontSize: "0.86rem", color: "#666", lineHeight: 1.6 }}>
                Complete the initial assessment to create measured progress.
              </div>
            )}
          </div>

          <div className="card" style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.18)" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>Recommended next step</div>
            {recommendationState.loading ? (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>Checking recommendation...</div>
            ) : recommendation ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.35rem", color: "#1a1a18" }}>
                  {recommendation.topicCode ? topicLabel(recommendation.topicCode, recommendation.topicLabel) : "Initial assessment"}
                </div>
                <div style={{ fontSize: "0.84rem", color: "#3e5149", lineHeight: 1.55, marginBottom: "0.85rem" }}>
                  {recommendation.reasonText}
                </div>
                <button onClick={followRecommendation} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {recommendedScenario ? "Practice with scenario" : recommendation.topicCode ? "Read resource" : "Start assessment"}
                </button>
              </>
            ) : (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>No active recommendation yet.</div>
            )}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "2rem" }}>
          <div className="card" style={{ border: "1px solid rgba(0,0,0,0.07)" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.35rem" }}>Scenario practice</div>
            {scenarioState.loading ? (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>Loading scenario activity...</div>
            ) : (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "0.75rem", marginBottom: "0.85rem" }}>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#1a1a18" }}>{scenarioDashboard?.completedCount || 0}</div>
                    <div style={{ fontSize: "0.74rem", color: "#777" }}>Completed</div>
                  </div>
                  <div>
                    <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.45rem", fontWeight: 700, color: "#1a1a18" }}>{scenarioDashboard?.inProgress ? "1" : "0"}</div>
                    <div style={{ fontSize: "0.74rem", color: "#777" }}>In progress</div>
                  </div>
                </div>
                {scenarioDashboard?.latestCompleted && (
                  <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.55, marginBottom: "0.8rem" }}>
                    Latest: <strong>{scenarioDashboard.latestCompleted.title}</strong> · {scenarioResultLabel(scenarioDashboard.latestCompleted.resultLevel)}
                  </div>
                )}
                <button onClick={() => go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  {scenarioDashboard?.inProgress ? "Continue scenario" : "Open scenario library"}
                </button>
              </>
            )}
          </div>

          <div className="card" style={{ background: "#E8F5E9", border: "1px solid rgba(46,125,50,0.18)" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.35rem" }}>Recommended scenario</div>
            {scenarioState.loading ? (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>Finding a matching scenario...</div>
            ) : recommendedScenario ? (
              <>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.02rem", marginBottom: "0.35rem" }}>{recommendedScenario.title}</div>
                <div style={{ fontSize: "0.82rem", color: "#445", lineHeight: 1.55, marginBottom: "0.8rem" }}>
                  {topicLabel(recommendedScenario.topicCode)} · {levelLabel(recommendedScenario.difficulty)} · {recommendedScenario.estimatedMinutes} min
                </div>
                <button onClick={() => go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.55rem 1rem", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>
                  Practice with scenario
                </button>
              </>
            ) : (
              <div style={{ fontSize: "0.86rem", color: "#666", lineHeight: 1.6 }}>Complete the assessment to unlock scenario recommendations.</div>
            )}
          </div>
        </div>

        {topicsMeasured.length > 0 && (
          <div style={{ marginBottom: "2rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap" }}>
              <p className="section-title" style={{ fontSize: "1.1rem", margin: 0 }}>Topic mastery</p>
              <button onClick={() => go("progress")} style={{ background: "transparent", color: "var(--teal)", border: "none", fontSize: "0.82rem", fontWeight: 700, cursor: "pointer" }}>View progress →</button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem" }}>
              {topicsMeasured.map(topic => (
                <div key={topic.topicCode} className="card" style={{ padding: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.55rem" }}>
                    <span style={{ fontWeight: 700, fontSize: "0.86rem" }}>{PROGRESS_TOPIC_META[topic.topicCode]?.icon} {topicLabel(topic.topicCode, topic.topicLabel)}</span>
                    <span style={{ color: "var(--teal)", fontWeight: 700, fontSize: "0.82rem" }}>{topic.masteryPercentage}%</span>
                  </div>
                  <div style={{ background: "#edf3ef", borderRadius: 99, height: 8, overflow: "hidden" }}>
                    <div style={{ width: `${topic.masteryPercentage}%`, height: "100%", background: "var(--teal)", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: "0.74rem", color: "#777", marginTop: "0.45rem" }}>{levelLabel(topic.currentLevel)}</div>
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
            <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#e65100", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "0.25rem" }}>Daily Cyber Tip</div>
            <div style={{ fontSize: "0.88rem", color: "#444", lineHeight: 1.6 }}>{todayTip.tip}</div>
          </div>
        </div>

        {/* Quick actions */}
        <p className="section-title" style={{ fontSize: "1.1rem", marginBottom: "0.4rem" }}>Quick actions</p>
        <p className="section-sub" style={{ marginBottom: "1.25rem" }}>Jump to what you need.</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {quickActions.map(a => (
            <button
              key={a.label}
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
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: a.accent, marginBottom: "0.2rem" }}>{a.label}</div>
              <div style={{ fontSize: "0.8rem", color: "#666" }}>{a.desc}</div>
            </button>
          ))}
        </div>

        {/* CyberGuard AI */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          <div>
            <p className="section-title" style={{ fontSize: "1.1rem", margin: 0 }}>🛡 CyberGuard AI</p>
            <p className="section-sub" style={{ margin: "0.25rem 0 0" }}>Preview the chat interface. Live AI replies will use the backend AI Gateway in a later phase.</p>
          </div>
          <span style={{ background: "var(--teal-lt)", color: "var(--teal)", fontSize: "0.72rem", fontWeight: 600, borderRadius: 99, padding: "0.25rem 0.75rem" }}>
            Saved profile preview
          </span>
        </div>
        <AgentPanel />
      </div>
    </div>
  );
}

// ─── Agent Panel ──────────────────────────────────────────────────
function AgentPanel() {
  const { user } = useApp();
  const [messages, setMessages] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const endRef = useRef(null);

  const nick = user?.aiNickname || user?.name || "there";

  useEffect(() => {
    setMessages([{
      role: "ai",
      text: `Hi ${nick}! CyberGuard's chat interface is ready, but live AI replies will be enabled after the backend AI Gateway phase.`,
    }]);
  }, [nick]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(q) {
    if (!q.trim() || loading) return;
    setInput("");
    setError(null);
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const systemPrompt = buildSystemPrompt(user);
      const aiText = await askClaude(
        [...history, { role: "user", content: q }],
        systemPrompt
      );
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
      setHistory(prev => [
        ...prev,
        { role: "user", content: q },
        { role: "assistant", content: aiText },
      ]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="agent-panel">
      <div className="agent-header">🛡 CyberGuard AI</div>
      <div className="agent-messages">
        {messages.map((m, i) => (
          <div key={i} className={`agent-bubble ${m.role}`} style={{ whiteSpace: "pre-wrap" }}>
            {m.text}
          </div>
        ))}
        {loading && <div className="agent-bubble ai loading">CyberGuard is thinking…</div>}
        {error && <p style={{ color: "var(--coral)", fontSize: "0.82rem" }}>⚠️ {error}</p>}
        <div ref={endRef} />
      </div>
      <div className="agent-input-row">
        <input
          className="agent-input"
          placeholder="Ask about cybersecurity…"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage(input)}
          disabled={loading}
        />
        <button
          className="agent-send"
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
        >
          {loading ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}

// ─── Page: Resources ──────────────────────────────────────────────
const TOPICS = [
  {
    id: 1, category: "Scams", title: "Phishing",
    summary: "Recognise the bait before you take it.",
    content: [
      "Phishing is a type of cyber attack where criminals impersonate legitimate organisations — banks, delivery services, or even government agencies — through emails, SMS messages, or fake websites. The goal is to trick you into handing over sensitive information like passwords, credit card numbers, or one-time PINs. These messages often create a false sense of urgency, warning you that your account will be suspended or that a parcel is waiting unless you act immediately.",
      "Modern phishing attacks have become highly sophisticated. Spear phishing targets specific individuals using personal details gathered from social media, making the message feel genuine. Smishing uses SMS, while vishing is conducted over phone calls. Even tech-savvy users fall victim because attackers study their targets carefully and craft believable scenarios tailored to their situation.",
      "To protect yourself, always verify the sender's email address carefully — look for subtle misspellings like 'paypa1.com' instead of 'paypal.com'. Never click links in unsolicited messages; instead, navigate directly to the official website. Enable multi-factor authentication on your accounts so that even if your password is stolen, attackers cannot easily access your data.",
    ],
    source: "https://www.csa.gov.sg/our-programmes/cybersecurity-outreach/cybersecurity-awareness/resources/phishing",
    sourceLabel: "Cyber Security Agency of Singapore",
  },
  {
    id: 2, category: "Scams", title: "Online Scams",
    summary: "Know the tricks fraudsters use to steal your money.",
    content: [
      "Online scams encompass a wide range of fraudulent schemes designed to deceive people into sending money or revealing personal information. Common types include e-commerce scams (fake online shops that take payment but never deliver), investment scams promising unrealistically high returns, love scams where criminals build fake romantic relationships over weeks or months before requesting money, and job scams offering easy income for minimal work.",
      "Malaysia consistently ranks among the countries with high rates of online fraud. The Royal Malaysia Police (PDRM) reported billions in losses annually, with Macau scams, phone scams, and investment fraud being the most prevalent. Victims often feel embarrassed to report these crimes, which allows scammers to continue operating and targeting others.",
      "The best defence is healthy scepticism. If an offer sounds too good to be true, it almost certainly is. Always verify the legitimacy of websites, sellers, and investment platforms before transferring any money. Use secure payment methods with buyer protection, and report suspected scams to the National Scam Response Centre (NSRC) hotline at 997.",
    ],
    source: "https://www.nsrc.my/",
    sourceLabel: "National Scam Response Centre (NSRC) Malaysia",
  },
  {
    id: 3, category: "Misinformation", title: "Misinformation & Fake News",
    summary: "Stop false information from spreading through your network.",
    content: [
      "Misinformation refers to false or inaccurate information spread regardless of intent, while disinformation is deliberately fabricated to deceive. In the social media era, both travel at extraordinary speed. A single misleading post can reach thousands of people within hours, shaping opinions on health, elections, and public safety before any correction can catch up.",
      "Malaysia introduced the Anti-Fake News Act in 2018, reflecting how seriously governments treat this issue. False information about health treatments, political figures, and natural disasters has caused real-world harm — from people refusing vaccines to mob violence triggered by rumours. The viral nature of social media platforms incentivises outrage and novelty over accuracy, making misinformation particularly potent.",
      "Before sharing anything, apply the SIFT method: Stop before reacting, Investigate the source, Find better coverage from credible outlets, and Trace claims back to their origin. Fact-checking websites like Sebenarnya.my (Malaysia's official fact-check portal) and AFP Fact Check provide verified information on viral claims. Remember that sharing false information, even unintentionally, makes you part of the problem.",
    ],
    source: "https://sebenarnya.my/",
    sourceLabel: "Sebenarnya.my — Malaysia's Official Fact Check Portal",
  },
  {
    id: 4, category: "AI & Technology", title: "AI-Generated Content",
    summary: "Understand what machines can create — and why it matters.",
    content: [
      "Artificial intelligence can now generate text, images, audio, and video that are virtually indistinguishable from human-created content. Tools like large language models (LLMs) can write convincing articles, product reviews, and social media posts at scale. AI image generators can produce photorealistic pictures of events that never happened. This capability has enormous legitimate uses — from design and accessibility to education — but also serious risks.",
      "AI-generated content becomes dangerous when it is used without disclosure to deceive. Fake reviews manipulate purchasing decisions. AI-written propaganda floods information ecosystems. Synthetic media is used in scams where criminals impersonate executives or family members in audio or video calls. As these tools become cheaper and easier to use, the volume of synthetic content online is growing rapidly.",
      "Critical evaluation is essential. Look for unnatural repetition, overly formal language, or images with subtle errors (distorted hands, inconsistent backgrounds). Many AI tools now embed watermarks or metadata, and AI-detection platforms are improving. When consuming content on important topics, prioritise established news organisations and primary sources over viral social media posts, regardless of how polished they appear.",
    ],
    source: "https://www.mcmc.gov.my/en/media/press-clippings/understanding-ai-generated-content",
    sourceLabel: "Malaysian Communications and Multimedia Commission (MCMC)",
  },
  {
    id: 5, category: "AI & Technology", title: "Deepfakes",
    summary: "AI-manipulated media and how to spot it.",
    content: [
      "Deepfakes are synthetic media — most commonly videos or audio recordings — in which a person's likeness, voice, or words are digitally replaced or manipulated using artificial intelligence. The technology has advanced so rapidly that high-quality deepfakes can now be created by anyone with a consumer-grade computer and freely available software. While deepfakes have legitimate creative applications in film and entertainment, they are increasingly weaponised for harm.",
      "The threats posed by deepfakes are serious and varied. Politicians and public figures have been targeted with fabricated videos that misrepresent their statements. Revenge porn deepfakes — non-consensual synthetic intimate images — cause devastating psychological harm, particularly to women. Business email compromise scams now use deepfake audio to impersonate CEOs and authorise fraudulent wire transfers. In Malaysia, deepfake scam videos impersonating celebrities and public figures to promote fake investment schemes have become a serious problem.",
      "Detecting deepfakes requires careful observation: look for unnatural blinking patterns, inconsistent lighting on the face, blurry or morphing edges around the hairline, and audio that does not quite match lip movements. Reverse image searches and tools like Microsoft's Video Authenticator can help verify media authenticity. If you receive an unexpected request via video or audio — especially involving money — verify it through an independent channel before acting.",
    ],
    source: "https://www.interpol.int/en/Crimes/Cybercrime/Deepfakes",
    sourceLabel: "INTERPOL — Deepfakes Resource",
  },
  {
    id: 6, category: "Privacy", title: "Privacy & Personal Data",
    summary: "Take control of who knows what about you online.",
    content: [
      "Every time you use an app, browse a website, or make an online purchase, you generate data. This data — your location, browsing habits, purchase history, health information, and more — is collected, analysed, and often sold by companies to advertisers and data brokers. Malaysia's Personal Data Protection Act (PDPA) 2010 provides some legal safeguards, but individuals must also take proactive steps to protect their own privacy.",
      "Data breaches are a constant risk. When companies that hold your information are hacked, your personal details can end up on the dark web, sold to fraudsters, or used for identity theft. Large-scale breaches affecting millions of Malaysians have been reported involving telecommunications companies, financial institutions, and government databases. Once your data is out, it is very difficult to contain.",
      "Minimise your digital footprint by only providing necessary information to online services. Read privacy policies and adjust app permissions — does a flashlight app really need access to your contacts? Use a different strong password for every service (a password manager makes this easy), enable two-factor authentication, and regularly check whether your email appears in known data breaches at HaveIBeenPwned.com.",
    ],
    source: "https://www.pdp.gov.my/jpdpv2/",
    sourceLabel: "Department of Personal Data Protection Malaysia (JPDP)",
  },
  {
    id: 7, category: "Safety", title: "Cyberbullying",
    summary: "Recognise, respond to, and prevent online harassment.",
    content: [
      "Cyberbullying is the use of digital technology — social media, messaging apps, gaming platforms, or email — to repeatedly harass, threaten, humiliate, or target another person. Unlike traditional bullying, it can occur 24 hours a day, reach a vast audience instantly, and follow victims wherever they go. Screenshots and viral sharing mean hurtful content can be nearly impossible to completely remove. Young people are disproportionately affected, but adults experience cyberbullying too, particularly in the form of workplace harassment and coordinated online pile-ons.",
      "The psychological impact of cyberbullying is severe and well-documented: victims commonly experience anxiety, depression, low self-esteem, and in serious cases, suicidal ideation. In Malaysia, cyberbullying is addressed under Section 233 of the Communications and Multimedia Act 1998, which makes it illegal to transmit offensive or menacing content online. Penalties can include fines and imprisonment.",
      "If you or someone you know is being cyberbullied: do not respond to the bully, document everything with screenshots, block and report the user on the platform, and — critically — tell a trusted adult, school counsellor, or contact Talian Kasih at 15999 for support. Bystanders play a powerful role: refusing to share or engage with bullying content and offering support to victims can significantly reduce harm.",
    ],
    source: "https://www.unicef.org/malaysia/what-is-cyberbullying",
    sourceLabel: "UNICEF Malaysia — Cyberbullying Resources",
  },
  {
    id: 8, category: "Passwords", title: "Password Security",
    summary: "Why length beats complexity — and how to remember them.",
    content: [
      "Weak passwords remain the single most common way accounts are compromised. Attackers use automated tools that can try billions of password combinations per second, meaning a short password — even one with numbers and symbols — can be cracked in minutes. The most effective passwords are long passphrases: a string of four or more random words is far harder to crack than a short complex password, and much easier for a human to remember.",
      "Password reuse is equally dangerous. When one website suffers a data breach, attackers take the stolen username-password combinations and automatically try them on hundreds of other sites (a technique called credential stuffing). If you use the same password everywhere, a breach at one obscure forum can lead to your bank account being compromised. Each account you own should have a unique password.",
      "A password manager — such as Bitwarden (free and open source), 1Password, or the password manager built into your browser — solves both problems. It generates and stores long, random, unique passwords for every site, so you only need to remember one master password. Pair this with two-factor authentication (2FA) on all important accounts: even if your password is stolen, an attacker cannot log in without access to your phone or authenticator app.",
    ],
    source: "https://www.cisa.gov/secure-our-world/use-strong-passwords",
    sourceLabel: "CISA — Use Strong Passwords",
  },
  {
    id: 9, category: "Beginner", title: "Digital Citizenship",
    summary: "Be responsible, respectful, and rights-aware online.",
    content: [
      "Digital citizenship refers to the responsible and ethical use of technology and the internet. Just as physical citizenship carries rights and responsibilities, being active online means participating in a shared space that is shaped by how all of us behave. Good digital citizens think critically about the content they consume and share, respect others' privacy and dignity, and contribute constructively to online communities.",
      "The digital world carries real legal responsibilities. Sharing someone else's copyrighted content, posting defamatory statements, distributing intimate images without consent, and inciting hatred online are all illegal in Malaysia under various laws including the Communications and Multimedia Act, the Defamation Act, and the Penal Code. The anonymity of the internet is increasingly illusory — authorities regularly identify and prosecute individuals for online offences.",
      "Practising good digital citizenship starts with small habits: pause before posting to consider how your words might affect others; verify information before sharing it; protect your personal information and respect others'; speak up when you witness online abuse. Digital literacy education is expanding in Malaysian schools, but everyone — regardless of age — benefits from regularly reflecting on how they show up in digital spaces.",
    ],
    source: "https://www.digitalcitizenship.net/",
    sourceLabel: "DigitalCitizenship.net",
  },
];

const TOPIC_COLORS = {
  Scams:             { bg: "#FFF3E0", text: "#E65100", dot: "#FF9800" },
  Misinformation:    { bg: "#F3E5F5", text: "#6A1B9A", dot: "#AB47BC" },
  "AI & Technology": { bg: "#E8F5E9", text: "#1B5E20", dot: "#43A047" },
  Privacy:           { bg: "#E3F2FD", text: "#0D47A1", dot: "#1E88E5" },
  Safety:            { bg: "#FCE4EC", text: "#880E4F", dot: "#E91E63" },
  Passwords:         { bg: "#E0F7FA", text: "#006064", dot: "#00ACC1" },
  Beginner:          { bg: "#E8F5E9", text: "#2E7D32", dot: "#66BB6A" },
};

const RESOURCE_CATEGORIES = ["All", ...Array.from(new Set(TOPICS.map(t => t.category)))];

function ResourcesPage() {
  const { go, resourceFocusTopic, clearResourceFocus } = useApp();
  const [selected, setSelected]   = useState(null);
  const [filter,   setFilter]     = useState("All");
  const topic = TOPICS.find(t => t.id === selected);

  const categories = RESOURCE_CATEGORIES;
  const filtered   = filter === "All" ? TOPICS : TOPICS.filter(t => t.category === filter);
  const focusedCategory = resourceFocusTopic ? PROGRESS_TOPIC_META[resourceFocusTopic]?.category : null;

  useEffect(() => {
    if (focusedCategory && categories.includes(focusedCategory)) {
      setFilter(focusedCategory);
    }
  }, [focusedCategory, categories]);

  const BackBtn = () => (
    <button
      onClick={() => go("home")}
      style={{
        display: "inline-flex", alignItems: "center", gap: "0.4rem",
        background: "none", border: "none", cursor: "pointer",
        color: "#555", fontSize: "0.875rem", fontWeight: 500,
        padding: "0", marginBottom: "1.5rem", transition: "color 0.15s",
      }}
      onMouseEnter={e => e.currentTarget.style.color = "var(--teal)"}
      onMouseLeave={e => e.currentTarget.style.color = "#555"}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 5l-7 7 7 7"/>
      </svg>
      Back to Home
    </button>
  );

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
            Cyber Wellness Resources
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            Curated guides on the cyber threats that matter most to Malaysian teens. Click any card to read the full guide.
          </p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            {[
              { val: "9", label: "Topics covered" },
              { val: "100%", label: "Free to read" },
              { val: "MY", label: "Malaysia focused" },
            ].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.08)", borderRadius: 10, padding: "0.6rem 1.2rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.2rem", color: "var(--teal)" }}>{s.val}</div>
                <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)" }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="section">
        <BackBtn />

        {focusedCategory && (
          <div className="card" style={{ marginBottom: "1rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", display: "flex", gap: "0.85rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.2rem" }}>Recommended focus</div>
              <div style={{ fontSize: "0.84rem", color: "#455", lineHeight: 1.55 }}>
                Showing guides for {topicLabel(resourceFocusTopic)} based on your measured assessment result.
              </div>
            </div>
            <button onClick={() => { clearResourceFocus(); setFilter("All"); }} style={{ background: "#fff", color: "var(--teal)", border: "1px solid rgba(29,158,117,0.3)", borderRadius: 10, padding: "0.5rem 0.9rem", fontSize: "0.8rem", fontWeight: 700, cursor: "pointer" }}>
              Show all guides
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
              {cat}
            </button>
          ))}
          <span style={{ marginLeft: "auto", fontSize: "0.8rem", color: "#999", alignSelf: "center" }}>
            {filtered.length} guide{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Cards grid */}
        <div className="res-grid">
          {filtered.map(t => {
            const cat = TOPIC_COLORS[t.category] || { bg: "#E8EDE8", text: "#1D9E75", dot: "#1D9E75" };
            return (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
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
                  {t.category}
                </span>
                <div className="res-title">{t.title}</div>
                <div className="res-desc">{t.summary}</div>
                <span style={{ fontSize: "0.78rem", color: "var(--teal)", fontWeight: 600, display: "flex", alignItems: "center", gap: 4, marginTop: "auto" }}>
                  Read guide →
                </span>
              </button>
            );
          })}
        </div>

        {/* Safety tip banner */}
        <div style={{
          marginTop: "2.5rem", background: "var(--teal-lt)",
          border: "1px solid rgba(29,158,117,0.2)", borderRadius: 14,
          padding: "1.25rem 1.5rem", display: "flex", gap: "1rem", alignItems: "center",
        }}>
          <span style={{ fontSize: "1.5rem", flexShrink: 0 }}>💡</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: "0.9rem", color: "var(--teal)", marginBottom: "0.2rem" }}>Pro tip</div>
            <div style={{ fontSize: "0.85rem", color: "#444", lineHeight: 1.6 }}>
              Not sure where to start? Try <strong>Phishing</strong> or <strong>Password Security</strong> — they are the most common threats facing Malaysian teens right now.
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
              const cat = TOPIC_COLORS[topic.category] || { bg: "#E8EDE8", text: "#1D9E75", dot: "#1D9E75" };
              return (
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: cat.bg, color: cat.text,
                  borderRadius: 99, padding: "0.2rem 0.65rem",
                  fontSize: "0.72rem", fontWeight: 600, marginBottom: "0.9rem",
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: cat.dot, display: "inline-block" }} />
                  {topic.category}
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
              <span style={{ fontSize: "0.78rem", color: "#aaa" }}>Source: <em>{topic.sourceLabel}</em></span>
              <a
                href={topic.source} target="_blank" rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  background: "var(--teal)", color: "#fff",
                  borderRadius: 10, padding: "0.6rem 1.25rem",
                  fontSize: "0.875rem", fontWeight: 600, textDecoration: "none",
                }}
              >Learn more ↗</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page: About ──────────────────────────────────────────────────
function AboutPage() {
  const { go } = useApp();

  const members = [
    { initials: "JJ",  name: "Jayron Poi",     role: "Web Developer",                   desc: "Ensures logic and webpage usability are functional, and leads implementation of Agentic AI features and adaptive learning tools." },
    { initials: "JH",  name: "Chung Jin Hong", role: "UI/UX Designer",                  desc: "Develops the core wireframe and low-fidelity prototype design, ensuring the interface is tailored to our teenage target demographic." },
    { initials: "EC",  name: "Edward Chang",   role: "System Architect & Chatbot Lead", desc: "Handles backend architecture and AI workflow planning, ensuring components are streamlined for adaptive learning features." },
    { initials: "AB",  name: "Arman",          role: "Agentic AI Personalisation",      desc: "Builds Agentic AI analytics for personalised features and adaptive learning, focusing on user behaviour analysis." },
    { initials: "PW",  name: "Puah Wen Zhen",  role: "Agentic AI Module Lead",          desc: "Leads the implementation of system architecture and the Agentic AI module, with support in chatbot functionalities." },
  ];

  const features = [
    { icon: "🤖", title: "Agentic AI Guidance",      desc: "Autonomous, goal-oriented learning support with scenario-based decision assistance and real-time personalised recommendations." },
    { icon: "💬", title: "Cyber Wellness Chatbot",    desc: "Real-time conversational support that answers cybersecurity questions through natural language interaction." },
    { icon: "🎯", title: "Adaptive Difficulty",       desc: "Auto-selects difficulty based on the user's knowledge and progress for a more effective lesson experience." },
    { icon: "🛡",  title: "Cyber Threat Simulations", desc: "Simulate phishing, scams, and misinformation scenarios to sharpen critical thinking and cybersecurity decisions." },
    { icon: "📊", title: "Progress Tracking",         desc: "Monitors learning progress and engagement patterns to assess effectiveness and drive adaptive recommendations." },
    { icon: "🎮", title: "Gamified Challenges",       desc: "Optional quizzes, achievements, and interactive activities to boost motivation, engagement, and knowledge retention." },
  ];

  const stats = [
    { value: "56%",   label: "of Malaysian teens say they can identify scams" },
    { value: "11%",   label: "have already fallen victim to an online scam" },
    { value: "84.6%", label: "of students never attended a scam awareness workshop" },
    { value: "96%",   label: "of teens aged 12–17 go online daily" },
  ];

  const objectives = [
    "Design and develop an AI-driven Cyber Wellness Toolkit that enhances cybersecurity awareness among Malaysian teenagers aged 13–17.",
    "Create an intelligent cybersecurity chatbot for real-time conversational learning in multiple languages.",
    "Build an Agentic AI module for personalised learning recommendations and adaptive difficulty adjustment.",
    "Incorporate optional gamified learning areas — quizzes, simulations, and real-life cyber threat scenarios.",
    "Evaluate the system through user interaction analysis, pre/post assessments, and feedback collection.",
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
            Capstone Project · Group 20 · Taylor's University
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.6rem, 4vw, 2.4rem)", fontWeight: 600, marginBottom: "0.85rem", lineHeight: 1.3 }}>
            Interactive Cyber Wellness Toolkit for Teens
          </h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.95rem", lineHeight: 1.7, marginBottom: "1.5rem" }}>
            An AI-driven platform built to enhance cybersecurity awareness and promote safer digital behaviour among Malaysian teenagers aged 13–17.
          </p>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 99, padding: "0.45rem 1rem", fontSize: "0.8rem", color: "rgba(255,255,255,0.65)" }}>
            🏫 In collaboration with Cybersecurity Hub DISS – Impact Lab
          </div>
        </div>
      </div>

      <div className="section">

        {/* Back button */}
        <button
          onClick={() => go("home")}
          style={{
            display: "inline-flex", alignItems: "center", gap: "0.4rem",
            background: "none", border: "none", cursor: "pointer",
            color: "#555", fontSize: "0.875rem", fontWeight: 500,
            padding: "0", marginBottom: "2rem", transition: "color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--teal)"}
          onMouseLeave={e => e.currentTarget.style.color = "#555"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7"/>
          </svg>
          Back to Home
        </button>

        {/* Stats */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>Why this matters</p>
          <p className="section-sub">The cyber threat landscape facing Malaysian teenagers is serious and growing.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1rem" }}>
            {stats.map(s => (
              <div key={s.value} className="card" style={{ textAlign: "center", padding: "1.5rem 1rem" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "2rem", fontWeight: 700, color: "var(--teal)", marginBottom: "0.4rem" }}>{s.value}</div>
                <div style={{ fontSize: "0.82rem", color: "#666", lineHeight: 1.5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Features */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>What we built</p>
          <p className="section-sub">A modular, AI-powered toolkit with six core capabilities.</p>
          <div className="card-grid">
            {features.map(f => (
              <div key={f.title} className="card" style={{ padding: "1.25rem" }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "0.6rem" }}>{f.icon}</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem", marginBottom: "0.35rem" }}>{f.title}</div>
                <div style={{ color: "#666", fontSize: "0.82rem", lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* How it works */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>How it works</p>
          <p className="section-sub">Every experience is shaped around the individual learner.</p>
          <div className="card" style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", padding: "1.75rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.25rem" }}>
              {[
                { step: "01", title: "You sign up",         desc: "Complete a short onboarding profile — your age, language, familiarity, and learning goals." },
                { step: "02", title: "AI builds your path", desc: "The Agentic AI module constructs a personalised learning path based on your responses." },
                { step: "03", title: "Learn your way",      desc: "Chat with CyberGuard AI, explore resources, and tackle simulations — all adapted to your level." },
                { step: "04", title: "Track your growth",   desc: "Your progress is tracked to continuously refine recommendations over time." },
              ].map(s => (
                <div key={s.step} style={{ display: "flex", gap: "0.85rem" }}>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "var(--teal)", opacity: 0.5, flexShrink: 0 }}>{s.step}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>{s.title}</div>
                    <div style={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Objectives */}
        <div style={{ marginBottom: "3rem" }}>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>Project objectives</p>
          <p className="section-sub">Five goals that guide everything we build.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {objectives.map((obj, i) => (
              <div key={i} className="card" style={{ display: "flex", gap: "1rem", alignItems: "flex-start", padding: "1rem 1.25rem" }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", background: "var(--teal-lt)",
                  color: "var(--teal)", fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 700, fontSize: "0.78rem", display: "flex", alignItems: "center",
                  justifyContent: "center", flexShrink: 0,
                }}>{i + 1}</div>
                <p style={{ margin: 0, fontSize: "0.88rem", color: "#444", lineHeight: 1.65 }}>{obj}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team */}
        <div>
          <p className="section-title" style={{ fontSize: "1.3rem" }}>Meet the team</p>
          <p className="section-sub">Group 20 — Taylor's University Capstone Project</p>

          {/* Supervisor */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "1.25rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", padding: "1.25rem 1.5rem" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--teal)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "1rem", flexShrink: 0 }}>SZ</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Dr Siti Zainab Ibrahim</div>
              <div style={{ fontSize: "0.8rem", color: "var(--teal)", fontWeight: 600, marginBottom: "0.2rem" }}>Project Supervisor · Cybersecurity Hub DISS – Impact Lab</div>
              <div style={{ fontSize: "0.8rem", color: "#555" }}>Provides guidance, professional oversight, and industry client direction throughout the project.</div>
            </div>
          </div>

          <div className="team-grid">
            {members.map(m => (
              <div className="team-card" key={m.name} style={{ padding: "1.5rem 1.25rem" }}>
                <div className="avatar">{m.initials}</div>
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>{m.name}</div>
                <div style={{ color: "var(--teal)", fontSize: "0.75rem", fontWeight: 600, margin: "0.2rem 0 0.5rem" }}>{m.role}</div>
                <div style={{ color: "#777", fontSize: "0.78rem", lineHeight: 1.55 }}>{m.desc}</div>
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
  const { user, go } = useApp();
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

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    async function load() {
      setLoading(true);
      setError("");
      const [assessmentResult, statusResult] = await Promise.all([
        dbGetInitialAssessment(),
        dbGetAssessmentStatus(),
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
  }, [user]);

  if (!user) { go("login"); return null; }

  async function start() {
    setLoading(true);
    setError("");
    const response = await dbStartInitialAttempt();
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
      setError("Please answer all questions before submitting.");
      return;
    }
    const confirmed = window.confirm("Submit your initial assessment? This baseline result will be preserved.");
    if (!confirmed) return;
    setSubmitting(true);
    setError("");
    const response = await dbSubmitAssessment(attempt.id);
    setSubmitting(false);
    if (!response.ok) {
      setError(response.error);
      return;
    }
    setResult(response.result);
    setAttempt(response.result.attempt);
  }

  function renderIntro() {
    return (
      <div className="section" style={{ maxWidth: 850 }}>
        <div className="card" style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🧭</div>
          <h1 className="section-title">{assessment?.title || "Initial Cyber Wellness Assessment"}</h1>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>
            A 12-question baseline check that helps future Cyberly lessons understand your measured cyber wellness level.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            {[
              ["12", "single-choice questions"],
              ["5-10", "minutes"],
              ["0", "negative marks"],
              ["4", "topic areas"],
            ].map(([value, label]) => (
              <div key={label} style={{ background: "#fff", borderRadius: 10, padding: "0.9rem", textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", color: "var(--teal)", fontWeight: 700, fontSize: "1.2rem" }}>{value}</div>
                <div style={{ fontSize: "0.78rem", color: "#666" }}>{label}</div>
              </div>
            ))}
          </div>
          <p style={{ fontSize: "0.86rem", color: "#42524d", lineHeight: 1.7, marginBottom: "1rem" }}>
            Your self-reported familiarity stays separate from this measured result. No AI is used for questions, scoring, or feedback.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button className="btn-primary" style={{ flex: "0 0 auto", minWidth: 190 }} onClick={start} disabled={loading}>
              {attempt ? "Resume assessment" : "Start assessment"}
            </button>
            <button className="btn-ghost" onClick={() => go("dashboard")}>Do later</button>
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
        <button className="btn-ghost" style={{ marginBottom: "1rem" }} onClick={() => go("dashboard")}>Dashboard</button>
        <div className="card">
          <div className="auth-progress" style={{ marginBottom: "1.25rem" }}>
            <div className="auth-progress-track">
              <div className="auth-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <div className="auth-progress-label">
              <span>Question {current + 1} of {questions.length}</span>
              <span>{answeredCount}/{questions.length} answered {saving ? "· saving..." : ""}</span>
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
            <button className="btn-ghost" onClick={() => setCurrent(index => Math.max(0, index - 1))} disabled={current === 0}>Previous</button>
            {current < questions.length - 1 ? (
              <button className="btn-primary" onClick={() => setCurrent(index => Math.min(questions.length - 1, index + 1))}>Next</button>
            ) : (
              <button className="btn-primary" onClick={submit} disabled={submitting || answeredCount !== questions.length}>
                {submitting ? "Submitting..." : "Submit assessment"}
              </button>
            )}
          </div>
          {answeredCount !== questions.length && current === questions.length - 1 && (
            <div style={{ fontSize: "0.8rem", color: "#777", marginTop: "0.75rem" }}>Answer all questions before final submission.</div>
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
        <div className="card" style={{ marginBottom: "1.5rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)" }}>
          <div style={{ fontSize: "0.78rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase" }}>Initial result</div>
          <h1 className="section-title" style={{ marginTop: "0.25rem" }}>{attemptResult?.measuredLevel} · {attemptResult?.percentage}%</h1>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>
            Score {attemptResult?.totalScore}/{attemptResult?.maximumScore}. This measured level is based only on your answers.
          </p>
          <button className="btn-primary" style={{ flex: "0 0 auto" }} onClick={() => go("dashboard")}>Back to dashboard</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
          {(result?.topicScores || []).map(topic => (
            <div key={topic.topicCode} className="card" style={{ padding: "1.1rem" }}>
              <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.35rem" }}>{topic.topicLabel}</div>
              <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>{topic.correctCount}/{topic.totalCount} · {topic.percentage}%</div>
              <div style={{ fontSize: "0.78rem", color: "#777", marginTop: "0.3rem" }}>{topic.classification === "strength" ? "Relative strength" : "Area to improve"}</div>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontWeight: 700, marginBottom: "0.5rem" }}>Strengths</div>
          <div style={{ fontSize: "0.86rem", color: "#555", lineHeight: 1.7 }}>
            {strengths.length ? strengths.map(topic => topic.topicLabel).join(", ") : "No topic crossed the strength threshold yet. That is okay; this is a starting baseline."}
          </div>
          <div style={{ fontWeight: 700, margin: "1rem 0 0.5rem" }}>Areas to improve</div>
          <div style={{ fontSize: "0.86rem", color: "#555", lineHeight: 1.7 }}>
            {improvements.length ? improvements.map(topic => topic.topicLabel).join(", ") : "All topics met the current strength threshold."}
          </div>
        </div>

        <p className="section-title" style={{ fontSize: "1.1rem" }}>Question review</p>
        <div style={{ display: "grid", gap: "0.9rem" }}>
          {(result?.review || []).map(item => (
            <div key={item.questionId} className="card" style={{ padding: "1rem" }}>
              <div className="res-tag">{item.topicLabel}</div>
              <div style={{ fontWeight: 700, marginBottom: "0.55rem" }}>{item.prompt}</div>
              <div style={{ fontSize: "0.84rem", color: item.isCorrect ? "var(--teal)" : "var(--coral)", fontWeight: 700, marginBottom: "0.35rem" }}>
                Your answer: {item.selectedOptionKey} · Correct answer: {item.correctOptionKey}
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
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>Baseline Assessment</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.5rem, 3vw, 2.2rem)", marginTop: "0.35rem" }}>Initial Cyber Wellness Assessment</h1>
        </div>
      </div>
      {error && <div className="section" style={{ paddingBottom: 0 }}><div className="field-error">{error}</div></div>}
      {loading ? (
        <div className="section"><p className="section-title">Loading assessment...</p></div>
      ) : result ? renderResult() : attempt ? renderAttempt() : renderIntro()}
    </div>
  );
}

// ─── Page: Scenarios ──────────────────────────────────────────────
function ScenariosPage() {
  const { user, go } = useApp();
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
      dbGetScenarios({ topicCode: filters.topicCode, difficulty: filters.difficulty }),
      dbGetRecommendedScenarios(),
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
  }, [user, filters.topicCode, filters.difficulty]);

  if (!user) { go("login"); return null; }

  const recommendedIds = new Set((library.recommended || []).map(item => item.id));

  async function openIntro(slug) {
    setBusy(true);
    setError(null);
    const result = await dbGetScenario(slug);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "intro", scenario: result.scenario, firstStep: result.firstStep });
  }

  async function startScenario(slug) {
    setBusy(true);
    setError(null);
    const result = await dbStartScenario(slug);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setSelectedChoice("");
    setDecisionFeedback(null);
    setView({ mode: "attempt", ...result });
  }

  async function openAttempt(attemptId) {
    setBusy(true);
    setError(null);
    const result = await dbGetScenarioAttempt(attemptId);
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
    const result = await dbSaveScenarioDecision(view.attempt.id, view.currentStep.id, selectedChoice);
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
    setBusy(true);
    setError(null);
    const result = await dbCompleteScenario(view.attempt.id);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "result", ...result.result });
  }

  async function openResult(attemptId) {
    setBusy(true);
    setError(null);
    const result = await dbGetScenarioResult(attemptId);
    setBusy(false);
    if (!result.ok) return setError(result.error);
    setView({ mode: "result", ...result.result });
  }

  const filterBar = (
    <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
      <select value={filters.topicCode} onChange={event => setFilters(current => ({ ...current, topicCode: event.target.value }))} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "0.55rem 0.75rem" }}>
        <option value="">All topics</option>
        {Object.entries(PROGRESS_TOPIC_META).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
      </select>
      <select value={filters.difficulty} onChange={event => setFilters(current => ({ ...current, difficulty: event.target.value }))} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: "0.55rem 0.75rem" }}>
        <option value="">All difficulty</option>
        {["beginner", "developing", "intermediate", "advanced"].map(value => <option key={value} value={value}>{levelLabel(value)}</option>)}
      </select>
    </div>
  );

  function renderLibrary() {
    return (
      <>
        {filterBar}
        {library.loading ? (
          <div className="card">Loading scenarios...</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
            {library.scenarios.map(scenario => {
              const latest = scenario.latestAttempt;
              const isRecommended = recommendedIds.has(scenario.id);
              return (
                <div key={scenario.id} className="card" style={{ border: isRecommended ? "1px solid rgba(46,125,50,0.35)" : "1px solid rgba(0,0,0,0.07)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", marginBottom: "0.65rem" }}>
                    <span style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.78rem" }}>{topicLabel(scenario.topicCode)}</span>
                    {isRecommended && <span style={{ background: "#E8F5E9", color: "#2E7D32", borderRadius: 99, padding: "0.18rem 0.55rem", fontSize: "0.7rem", fontWeight: 700 }}>Recommended</span>}
                  </div>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>{scenario.title}</div>
                  <div style={{ color: "#666", fontSize: "0.84rem", lineHeight: 1.55, marginBottom: "0.8rem" }}>{scenario.summary}</div>
                  <div style={{ fontSize: "0.78rem", color: "#777", marginBottom: "0.9rem" }}>{levelLabel(scenario.difficulty)} · {scenario.estimatedMinutes} min · {scenario.totalSteps} decisions</div>
                  <div style={{ display: "flex", gap: "0.55rem", flexWrap: "wrap" }}>
                    {latest?.status === "in_progress" ? (
                      <button onClick={() => openAttempt(latest.id)} className="btn-primary" style={{ minWidth: 0, padding: "0.55rem 0.9rem" }}>Resume</button>
                    ) : (
                      <button onClick={() => openIntro(scenario.slug)} className="btn-primary" style={{ minWidth: 0, padding: "0.55rem 0.9rem" }}>Start</button>
                    )}
                    {latest?.status === "completed" && (
                      <button onClick={() => openResult(latest.id)} className="btn-ghost">Result</button>
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
        <button className="btn-ghost" onClick={() => setView({ mode: "library" })} style={{ marginBottom: "1rem" }}>Back</button>
        <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.35rem" }}>{topicLabel(scenario.topicCode)}</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.5rem" }}>{scenario.title}</h2>
        <p style={{ color: "#555", lineHeight: 1.65 }}>{scenario.summary}</p>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", fontSize: "0.82rem", color: "#666", margin: "1rem 0" }}>
          <span>{levelLabel(scenario.difficulty)}</span>
          <span>{scenario.estimatedMinutes} minutes</span>
          <span>{scenario.totalSteps} decisions</span>
        </div>
        <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 12, padding: "0.9rem", fontSize: "0.84rem", color: "#5f4a1d", lineHeight: 1.6, marginBottom: "1rem" }}>
          Choices are final once submitted. Feedback appears after each decision, and scoring is calculated by the backend.
        </div>
        <button className="btn-primary" onClick={() => startScenario(scenario.slug)} disabled={busy}>Start scenario</button>
      </div>
    );
  }

  function renderAttempt() {
    const step = view.currentStep;
    if (!step) {
      return (
        <div className="card" style={{ maxWidth: 760, margin: "0 auto" }}>
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.5rem" }}>Ready to complete</h2>
          <p style={{ color: "#555", lineHeight: 1.6 }}>All decisions are submitted. Complete the scenario to calculate your result and apply progress.</p>
          <button className="btn-primary" onClick={completeScenario} disabled={busy}>Complete scenario</button>
        </div>
      );
    }
    return (
      <div className="card" style={{ maxWidth: 820, margin: "0 auto" }}>
        <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.35rem" }}>
          Step {step.stepOrder} of {view.scenario.totalSteps}
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
          <button className="btn-primary" disabled={!selectedChoice || busy} onClick={submitDecision}>Submit choice</button>
        ) : (
          <div style={{ background: "#E8F5E9", border: "1px solid rgba(46,125,50,0.22)", borderRadius: 12, padding: "1rem" }}>
            <div style={{ fontWeight: 700, color: "#2E7D32", marginBottom: "0.35rem" }}>Feedback</div>
            <div style={{ fontSize: "0.88rem", color: "#333", lineHeight: 1.65, marginBottom: "0.55rem" }}>{decisionFeedback.feedback}</div>
            <div style={{ fontSize: "0.82rem", color: "#566", lineHeight: 1.6, marginBottom: "0.85rem" }}>{decisionFeedback.safetyExplanation}</div>
            <button className="btn-primary" onClick={continueAfterFeedback} disabled={busy}>{view.nextStep ? "Continue" : "Complete scenario"}</button>
          </div>
        )}
      </div>
    );
  }

  function renderResult() {
    const result = view;
    return (
      <div className="card" style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ color: "#2E7D32", fontWeight: 700, fontSize: "0.8rem", marginBottom: "0.35rem" }}>Scenario result</div>
        <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", marginBottom: "0.5rem" }}>{result.scenario.title}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem", margin: "1rem 0" }}>
          <div><strong>{result.attempt.totalScore}/{result.attempt.maximumScore}</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>Score</div></div>
          <div><strong>{result.attempt.percentage}%</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>Percentage</div></div>
          <div><strong>{scenarioResultLabel(result.attempt.resultLevel)}</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>Result</div></div>
          <div><strong>+{result.progressImpact?.masteryDelta || 0}</strong><div style={{ color: "#777", fontSize: "0.76rem" }}>Mastery delta</div></div>
        </div>
        <div style={{ display: "grid", gap: "0.85rem", margin: "1.25rem 0" }}>
          {result.review.map(item => (
            <div key={item.id} style={{ border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12, padding: "1rem" }}>
              <div style={{ fontWeight: 700, marginBottom: "0.35rem" }}>Step {item.stepOrder}: choice {item.selectedOptionKey}</div>
              <div style={{ fontSize: "0.86rem", color: "#333", lineHeight: 1.6 }}>{item.feedback}</div>
              <div style={{ fontSize: "0.8rem", color: "#666", lineHeight: 1.55, marginTop: "0.35rem" }}>{item.safetyExplanation}</div>
            </div>
          ))}
        </div>
        {result.recommendation && (
          <div style={{ background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 12, padding: "1rem", marginBottom: "1rem" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.25rem" }}>Updated recommendation</div>
            <div style={{ fontSize: "0.86rem", color: "#455", lineHeight: 1.6 }}>{result.recommendation.reasonText}</div>
          </div>
        )}
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button className="btn-primary" onClick={() => setView({ mode: "library" })}>Scenario library</button>
          <button className="btn-ghost" onClick={() => go("dashboard")}>Dashboard</button>
          <button className="btn-ghost" onClick={() => go("resources")}>Resources</button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.55)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>Scenario Practice</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.35rem" }}>Practice cyber choices</h1>
          <p style={{ color: "rgba(255,255,255,0.65)", fontSize: "0.9rem", lineHeight: 1.6 }}>Short realistic situations with immediate feedback after each final choice.</p>
        </div>
      </div>
      <div className="section">
        <button className="btn-ghost" onClick={() => view.mode === "library" ? go("dashboard") : setView({ mode: "library" })} style={{ marginBottom: "1.5rem" }}>
          ← Back
        </button>
        {error && <div className="field-error" style={{ marginBottom: "1rem" }}>{error}</div>}
        {view.mode === "intro" ? renderIntro() : view.mode === "attempt" ? renderAttempt() : view.mode === "result" ? renderResult() : renderLibrary()}
      </div>
    </div>
  );
}

// ─── Page: Profile ───────────────────────────────────────────────
function ProfilePage() {
  const { user, go, updateProfile } = useApp();
  const [form, setForm] = useState(() => ({
    aiNickname: user?.profile?.aiNickname || user?.displayName || "",
    educationLevel: user?.profile?.educationLevel || "",
    preferredLanguage: user?.profile?.preferredLanguage || "",
    familiarityLevel: user?.profile?.familiarityLevel || "",
    helpTopics: user?.profile?.helpTopics || [],
    learningStyle: user?.profile?.learningStyle || "",
  }));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (!user) { go("login"); return null; }

  function set(key, value) {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined, form: undefined }));
    setSaved(false);
  }

  function toggleTopic(topic) {
    const selected = form.helpTopics || [];
    if (selected.includes(topic)) {
      set("helpTopics", selected.filter(item => item !== topic));
    } else if (selected.length < 3) {
      set("helpTopics", [...selected, topic]);
    }
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    const result = await dbSaveProfile({
      ...form,
      onboardingCompleted: true,
    });
    setSaving(false);

    if (!result.ok) {
      setErrors({ form: result.error, ...result.errors });
      return;
    }

    updateProfile(result.profile);
    setSaved(true);
  }

  const fieldSet = [
    { key: "educationLevel", label: "Education level", options: EDUCATION_LEVELS },
    { key: "preferredLanguage", label: "Preferred language", options: LANGUAGES },
    { key: "familiarityLevel", label: "Cybersecurity familiarity", options: FAMILIARITY },
    { key: "learningStyle", label: "Learning style", options: LEARNING_STYLES },
  ];

  return (
    <div>
      <div style={{ background: "linear-gradient(135deg, var(--teal) 0%, #1a5c4a 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.6)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>
            Learner Profile
          </div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.35rem" }}>
            Shape your Cyberly experience
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            These preferences are saved separately from your account identity. Age and education level stay separate.
          </p>
        </div>
      </div>

      <div className="section" style={{ maxWidth: 900 }}>
        <button
          onClick={() => go(user.onboardingCompleted ? "dashboard" : "login")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "0.875rem", fontWeight: 500, padding: 0, marginBottom: "1.5rem" }}
        >
          ← Back
        </button>

        {!user.onboardingCompleted && (
          <div className="card" style={{ marginBottom: "1rem", background: "var(--coral-lt)", border: "1px solid rgba(216,90,48,0.25)" }}>
            <div style={{ fontWeight: 700, color: "var(--coral)", marginBottom: "0.25rem" }}>Finish onboarding</div>
            <div style={{ fontSize: "0.86rem", color: "#5f4036", lineHeight: 1.6 }}>
              Your account is signed in, but your learner profile is incomplete. Save this profile to continue to the dashboard.
            </div>
          </div>
        )}

        <div className="card">
          <div className="field">
            <label>AI nickname</label>
            <input
              value={form.aiNickname}
              maxLength={50}
              onChange={event => set("aiNickname", event.target.value)}
              placeholder="What should CyberGuard call you?"
            />
            {errors.aiNickname && <div className="field-error">{errors.aiNickname}</div>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
            {fieldSet.map(field => (
              <div className="field" key={field.key}>
                <label>{field.label}</label>
                <select
                  value={form[field.key]}
                  onChange={event => set(field.key, event.target.value)}
                  style={{ width: "100%", border: "1.5px solid rgba(0,0,0,0.13)", borderRadius: 10, padding: "0.65rem 0.9rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.9rem", background: "#fff" }}
                >
                  <option value="">Choose one</option>
                  {field.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
                {errors[field.key] && <div className="field-error">{errors[field.key]}</div>}
              </div>
            ))}
          </div>

          <div className="field">
            <label>Help topics</label>
            <div className="chip-grid">
              {HELP_OPTIONS.map(topic => (
                <button
                  key={topic.value}
                  className={`chip-btn ${form.helpTopics.includes(topic.value) ? "selected" : ""}`}
                  onClick={() => toggleTopic(topic.value)}
                  disabled={form.helpTopics.length >= 3 && !form.helpTopics.includes(topic.value)}
                  type="button"
                >
                  {topic.label}
                </button>
              ))}
            </div>
            <div className="chip-limit-note">{form.helpTopics.length}/3 selected</div>
            {errors.helpTopics && <div className="field-error">{errors.helpTopics}</div>}
          </div>

          {errors.form && <div className="field-error" style={{ marginBottom: "0.75rem" }}>{errors.form}</div>}
          {saved && <div style={{ color: "var(--teal)", fontSize: "0.85rem", fontWeight: 600, marginBottom: "0.75rem" }}>Profile saved.</div>}

          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", alignItems: "center" }}>
            <button className="btn-primary" style={{ flex: "0 0 auto", minWidth: 180 }} onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save profile"}
            </button>
            {user.onboardingCompleted && (
              <button className="btn-ghost" onClick={() => go("dashboard")}>Dashboard</button>
            )}
          </div>

          <div style={{ fontSize: "0.76rem", color: "#777", marginTop: "1rem", lineHeight: 1.6 }}>
            Display name and age editing are deferred to a future account settings endpoint. Age is not inferred from education level, and neither is treated as learning ability.
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Page: Progress ──────────────────────────────────────────────
function ProgressPage() {
  const { user, go, openRecommendedResource } = useApp();
  const [progressState, setProgressState] = useState({ loading: true, progress: null });
  const [recommendationState, setRecommendationState] = useState({ loading: true, recommendation: null });

  useEffect(() => {
    let active = true;
    if (!user) return () => { active = false; };
    Promise.all([dbGetProgress(), dbGetCurrentRecommendation()]).then(([progressResult, recommendationResult]) => {
      if (!active) return;
      setProgressState(progressResult.ok
        ? { loading: false, progress: progressResult }
        : { loading: false, progress: null, error: progressResult.error });
      setRecommendationState(recommendationResult.ok
        ? { loading: false, recommendation: recommendationResult.recommendation }
        : { loading: false, recommendation: null, error: recommendationResult.error });
    });
    return () => { active = false; };
  }, [user]);

  if (!user) { go("login"); return null; }

  const nick  = user.aiNickname || user.name;
  const topics = user.helpTopics || [];
  const profileLevel  = user.familiarity || "Beginner";
  const lang   = user.language    || "English";
  const style  = user.learningStyle || "Not set";

  const allTopics = HELP_OPTIONS;

  const summary = progressState.progress?.summary;
  const measuredTopics = progressState.progress?.topics || [];
  const recommendation = recommendationState.recommendation;
  const measuredLevel = levelLabel(summary?.measuredLevel);
  const measuredValue = summary?.overallMasteryPercentage || 0;

  const badges = [
    { icon: "🛡", label: "Joined Cyberly",     earned: true  },
    { icon: "💬", label: "Chat Preview Open",     earned: true  },
    { icon: "📚", label: "Explored Resources",    earned: topics.length > 0 },
    { icon: "🎯", label: "Set Learning Goals",    earned: topics.length > 0 },
    { icon: "🌐", label: "Multilingual Learner",  earned: lang !== "English" },
    { icon: "🏆", label: "Measured Baseline",     earned: Boolean(summary?.exists) },
  ];

  async function completeRecommendation() {
    if (!recommendation?.id) return;
    const result = await dbMarkRecommendationCompleted(recommendation.id);
    if (result.ok) {
      setRecommendationState({ loading: false, recommendation: result.recommendation });
    }
  }

  return (
    <div>
      {/* Hero */}
      <div style={{ background: "linear-gradient(135deg, #1a2e1a 0%, #2d4a2d 100%)", padding: "2.5rem 1.5rem", color: "#fff" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "0.4rem" }}>My Progress</div>
          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: "clamp(1.4rem, 3vw, 2rem)", fontWeight: 600, marginBottom: "0.3rem" }}>
            {nick}'s Learning Journey 📊
          </h1>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem" }}>
            {summary?.exists ? `${measuredLevel} measured level` : `${profileLevel} profile familiarity`} · {lang} · {style}
          </p>
        </div>
      </div>

      <div className="section">
        {/* Back button */}
        <button
          onClick={() => go("dashboard")}
          style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "none", border: "none", cursor: "pointer", color: "#555", fontSize: "0.875rem", fontWeight: 500, padding: "0", marginBottom: "2rem", transition: "color 0.15s" }}
          onMouseEnter={e => e.currentTarget.style.color = "var(--teal)"}
          onMouseLeave={e => e.currentTarget.style.color = "#555"}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to Dashboard
        </button>

        {/* Profile snapshot */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: "1rem", marginBottom: "2.5rem" }}>
          {[
            { icon: "🎓", label: "Measured level", value: progressState.loading ? "Loading" : measuredLevel },
            { icon: "🌐", label: "Language", value: lang },
            { icon: "📖", label: "Style",    value: style },
            { icon: "🎯", label: "Topics",   value: `${topics.length} selected` },
          ].map(s => (
            <div key={s.label} className="card" style={{ textAlign: "center", padding: "1.25rem 1rem" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.35rem" }}>{s.icon}</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1rem", color: "var(--teal)", marginBottom: "0.2rem" }}>{s.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#888" }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Skill level bar */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>Measured Mastery</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>Calculated from completed assessment topic scores, not from age, education level, or self-reported familiarity.</p>
          <div className="card" style={{ padding: "1.5rem" }}>
            {progressState.loading ? (
              <div style={{ fontSize: "0.86rem", color: "#666" }}>Loading progress...</div>
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
                  {["Beginner", "Developing", "Intermediate", "Advanced"].map(l => (
                    <span key={l} style={{ fontSize: "0.72rem", color: l === measuredLevel ? "var(--teal)" : "#bbb", fontWeight: l === measuredLevel ? 700 : 400 }}>{l}</span>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ fontSize: "0.86rem", color: "#666", lineHeight: 1.6 }}>
                No measured baseline yet. Complete the initial assessment to unlock progress tracking.
                <button onClick={() => go("assessment")} style={{ display: "block", marginTop: "0.85rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>Start assessment</button>
              </div>
            )}
          </div>
        </div>

        {measuredTopics.length > 0 && (
          <div style={{ marginBottom: "2.5rem" }}>
            <p className="section-title" style={{ fontSize: "1.1rem" }}>Assessment Topics</p>
            <p className="section-sub" style={{ marginBottom: "1rem" }}>Topic-level mastery from your initial cyber wellness assessment.</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {measuredTopics.map(topic => (
                <div key={topic.topicCode} className="card">
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", alignItems: "flex-start", marginBottom: "0.65rem" }}>
                    <div>
                      <div style={{ fontSize: "1.25rem", marginBottom: "0.25rem" }}>{PROGRESS_TOPIC_META[topic.topicCode]?.icon || "📘"}</div>
                      <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>{topicLabel(topic.topicCode, topic.topicLabel)}</div>
                    </div>
                    <div style={{ color: "var(--teal)", fontWeight: 800 }}>{topic.masteryPercentage}%</div>
                  </div>
                  <div style={{ background: "#edf3ef", borderRadius: 99, height: 9, overflow: "hidden", marginBottom: "0.55rem" }}>
                    <div style={{ width: `${topic.masteryPercentage}%`, background: "var(--teal)", height: "100%", borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#666" }}>
                    {levelLabel(topic.currentLevel)} · Source: initial assessment
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {recommendation && (
          <div className="card" style={{ marginBottom: "2.5rem", background: "var(--teal-lt)", border: "1px solid rgba(29,158,117,0.2)" }}>
            <div style={{ fontWeight: 700, color: "var(--teal)", marginBottom: "0.3rem" }}>Current recommendation</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: "1.05rem", marginBottom: "0.4rem" }}>
              {recommendation.topicCode ? topicLabel(recommendation.topicCode, recommendation.topicLabel) : "Initial assessment"}
            </div>
            <div style={{ fontSize: "0.86rem", color: "#3e5149", lineHeight: 1.6, marginBottom: "1rem" }}>
              {recommendation.reasonText}
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <button onClick={() => recommendation.topicCode ? openRecommendedResource(recommendation.topicCode) : go("assessment")} style={{ background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                {recommendation.topicCode ? "Read resource" : "Start assessment"}
              </button>
              {recommendation.topicCode && (
                <button onClick={() => go("scenarios")} style={{ background: "#2E7D32", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                  Practice scenario
                </button>
              )}
              {recommendation.topicCode && recommendation.status !== "completed" && (
                <button onClick={completeRecommendation} style={{ background: "#fff", color: "var(--teal)", border: "1px solid rgba(29,158,117,0.3)", borderRadius: 10, padding: "0.6rem 1.1rem", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                  Mark complete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Topics of interest */}
        <div style={{ marginBottom: "2.5rem" }}>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>Topics You're Learning</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>Based on your profile — explore guides for each one.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.75rem" }}>
            {allTopics.map(t => {
              const active = topics.includes(t.value);
              return (
                <div key={t.value} style={{
                  background: active ? "var(--teal-lt)" : "#f9f9f9",
                  border: active ? "1px solid rgba(29,158,117,0.3)" : "1px solid rgba(0,0,0,0.07)",
                  borderRadius: 10, padding: "0.75rem 1rem",
                  display: "flex", alignItems: "center", gap: "0.6rem",
                }}>
                  <span style={{ fontSize: "1rem" }}>{active ? "✅" : "⬜"}</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: active ? 600 : 400, color: active ? "var(--teal)" : "#888" }}>{t.label}</span>
                </div>
              );
            })}
          </div>
          <button onClick={() => go("resources")} style={{ marginTop: "1rem", background: "var(--teal)", color: "#fff", border: "none", borderRadius: 10, padding: "0.6rem 1.25rem", fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
            Explore all guides →
          </button>
        </div>

        {/* Badges */}
        <div>
          <p className="section-title" style={{ fontSize: "1.1rem" }}>Badges</p>
          <p className="section-sub" style={{ marginBottom: "1rem" }}>Achievements unlocked from your activity.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "1rem" }}>
            {badges.map(b => (
              <div key={b.label} className="card" style={{
                textAlign: "center", padding: "1.25rem 0.75rem",
                opacity: b.earned ? 1 : 0.4,
                filter: b.earned ? "none" : "grayscale(1)",
              }}>
                <div style={{ fontSize: "2rem", marginBottom: "0.4rem" }}>{b.icon}</div>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: b.earned ? "#1a1a18" : "#aaa" }}>{b.label}</div>
                {b.earned && <div style={{ fontSize: "0.68rem", color: "var(--teal)", marginTop: "0.25rem", fontWeight: 600 }}>Earned ✓</div>}
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Chat Widget (floating) ────────────────────────────────────────
function ChatWidget() {
  const { user, go } = useApp();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(false);
  const endRef = useRef(null);

  const nick = user?.aiNickname || user?.name;

  useEffect(() => {
    if (!user || messages.length > 0) return;
    setMessages([{
      role: "ai",
      text: `Hi ${nick}! This chat UI is ready, but live CyberGuard replies will be enabled after the backend AI Gateway phase.`,
    }]);
  }, [user, open, messages.length, nick]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const q = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const aiText = await askClaude(
        [...history, { role: "user", content: q }],
        buildSystemPrompt(user)
      );
      setMessages(prev => [...prev, { role: "ai", text: aiText }]);
      setHistory(prev => [
        ...prev,
        { role: "user", content: q },
        { role: "assistant", content: aiText },
      ]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Sorry, something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  const group = user ? getAgeGroup(user.age) : null;

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <div>
              💬 Cyber Wellness Assistant
              <div className="chat-header-sub">
                {user ? `${nick} · ${group.label}` : "Guest"}
              </div>
            </div>
          </div>
          <div className="chat-messages">
            {!user ? (
              <div className="chat-login-prompt">
                <p>Sign in to preview the CyberGuard chat interface with your session profile.</p>
                <button onClick={() => { setOpen(false); go("login"); }}>Sign in / Sign up</button>
              </div>
            ) : (
              <>
                {messages.map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.role}`} style={{ whiteSpace: "pre-wrap" }}>
                    {m.text}
                  </div>
                ))}
                {loading && <div className="chat-bubble ai loading">Thinking…</div>}
                <div ref={endRef} />
              </>
            )}
          </div>
          {user && (
            <div className="chat-input-row">
              <textarea
                className="chat-input"
                rows={1}
                placeholder="Type a question…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              />
              <button className="chat-send" onClick={send} disabled={loading || !input.trim()}>
                {loading ? "…" : "↑"}
              </button>
            </div>
          )}
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen(o => !o)}>
        {open ? "✕" : "💬"}
      </button>
    </>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: "home",      label: "Home"      },
  { id: "dashboard", label: "Dashboard" },
  { id: "assessment", label: "Assessment" },
  { id: "scenarios", label: "Scenarios" },
  { id: "resources", label: "Resources" },
  { id: "about",     label: "About"     },
];

function Navbar({ page }) {
  const { go, user, logout } = useApp();
  const nick = user?.aiNickname || user?.name;
  return (
    <nav className="navbar">
      <div className="nav-logo" onClick={() => go("home")} style={{ cursor: "pointer" }}>🛡 <span>Cyberly</span></div>
      {NAV_ITEMS.map(n => (
        <button key={n.id} className={`nav-link${page === n.id ? " active" : ""}`} onClick={() => go(n.id)}>
          {n.label}
        </button>
      ))}
      {user ? (
        <div className="nav-user">
          <div className="nav-avatar">{(nick || "U")[0].toUpperCase()}</div>
          <span>{nick}</span>
          <button className="nav-logout" onClick={logout}>Sign out</button>
        </div>
      ) : (
        <button className="nav-cta" onClick={() => go("login")}>Sign in</button>
      )}
    </nav>
  );
}

// ─── Footer ───────────────────────────────────────────────────────
function Footer() {
  return (
    <footer>
      <p>Built with care · <strong>Cyberly</strong> · {new Date().getFullYear()}</p>
      <p style={{ marginTop: "0.4rem", fontSize: "0.78rem" }}>
        Cyber wellness education for everyone · AI Gateway coming in a later phase.
      </p>
    </footer>
  );
}

// ─── Root App ─────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [user, setUser] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [resourceFocusTopic, setResourceFocusTopic] = useState(null);

  useEffect(() => {
    let active = true;
    dbMe().then(result => {
      if (!active) return;
      if (result.ok) {
        const restoredUser = normalizeSessionUser(result.user, result.profile);
        setUser(restoredUser);
        setPage(restoredUser.onboardingCompleted ? "dashboard" : "profile");
      }
      setCheckingSession(false);
    });
    return () => { active = false; };
  }, []);

  function login(userData, profileData, preferredPage) {
    const nextUser = normalizeSessionUser(userData, profileData);
    setUser(nextUser);
    setPage(preferredPage || (nextUser.onboardingCompleted ? "dashboard" : "profile"));
  }
  function updateProfile(profileData) {
    setUser(current => current ? normalizeSessionUser(current, profileData) : current);
  }
  async function logout() {
    await dbLogout();
    setUser(null);
    setResourceFocusTopic(null);
    setPage("home");
  }
  function openRecommendedResource(topicCode) {
    setResourceFocusTopic(topicCode);
    setPage("resources");
  }
  function go(nextPage) {
    if (nextPage !== "resources") setResourceFocusTopic(null);
    setPage(nextPage);
  }

  const ctx = {
    page,
    go,
    user,
    login,
    logout,
    updateProfile,
    resourceFocusTopic,
    openRecommendedResource,
    clearResourceFocus: () => setResourceFocusTopic(null),
  };

  const PAGES = {
    home:      <HomePage />,
    dashboard: <DashboardPage />,
    assessment: <AssessmentPage />,
    scenarios: <ScenariosPage />,
    resources: <ResourcesPage />,
    about:     <AboutPage />,
    progress:  <ProgressPage />,
    profile:   <ProfilePage />,
    login:     <AuthGate />,
  };

  return (
    <AppCtx.Provider value={ctx}>
      <style>{globalStyle}</style>
      <Navbar page={page} />
      <main className="page-wrap">
        {checkingSession ? (
          <div className="section">
            <p className="section-title">Loading Cyberly…</p>
            <p className="section-sub">Checking your session.</p>
          </div>
        ) : (PAGES[page] ?? <HomePage />)}
      </main>
      <Footer />
      {!checkingSession && <ChatWidget />}
    </AppCtx.Provider>
  );
}

// --------------------- MYSQL 
