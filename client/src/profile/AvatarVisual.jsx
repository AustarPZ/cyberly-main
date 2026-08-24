import { normalizeAvatarPreset } from "./avatarModel";

function AvatarMotif({ presetId }) {
  switch (presetId) {
    case "explorer_orbit":
      return (
        <>
          <circle className="avatar-visual-soft" cx="32" cy="32" r="11" />
          <ellipse cx="32" cy="32" rx="23" ry="11" transform="rotate(-24 32 32)" />
          <circle className="avatar-visual-accent" cx="50" cy="21" r="4" />
        </>
      );
    case "explorer_peak":
      return (
        <>
          <path className="avatar-visual-soft" d="M9 49 27 18l10 17 7-10 12 24Z" />
          <path d="m17 48 10-17 6 10 5-7 9 14" />
          <path className="avatar-visual-accent" d="m24 24 3-6 4 7" />
        </>
      );
    case "explorer_compass":
      return (
        <>
          <circle className="avatar-visual-soft" cx="32" cy="32" r="23" />
          <circle cx="32" cy="32" r="18" />
          <path className="avatar-visual-accent" d="m39 18-4 17-17 11 11-17Z" />
          <circle cx="32" cy="32" r="3" />
        </>
      );
    case "explorer_spark":
      return (
        <>
          <circle className="avatar-visual-soft" cx="32" cy="32" r="22" />
          <path className="avatar-visual-accent" d="m32 10 5.4 15.1L53 30l-15.6 5L32 54l-5.4-19L11 30l15.6-4.9Z" />
          <circle cx="32" cy="30" r="5" />
        </>
      );
    case "explorer_wave":
      return (
        <>
          <circle className="avatar-visual-soft" cx="32" cy="32" r="23" />
          <path d="M8 35c8-13 14 13 24 0s16 13 24 0" />
          <path className="avatar-visual-accent" d="M10 25c7-10 13 10 22 0s15 10 22 0" />
          <path d="M13 45h38" />
        </>
      );
    case "explorer_horizon":
      return (
        <>
          <circle className="avatar-visual-soft" cx="32" cy="32" r="23" />
          <path className="avatar-visual-accent" d="M22 34a10 10 0 0 1 20 0" />
          <path d="M8 38h48M14 45h36M23 52h18" />
          <path d="M32 13v8M18 19l6 6M46 19l-6 6" />
        </>
      );
    default:
      return null;
  }
}

export default function AvatarVisual({ presetId, className = "" }) {
  const normalizedPreset = normalizeAvatarPreset(presetId);
  if (!normalizedPreset) return null;

  return (
    <span className={`avatar-visual avatar-visual--${normalizedPreset}${className ? ` ${className}` : ""}`}>
      <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <AvatarMotif presetId={normalizedPreset} />
      </svg>
    </span>
  );
}
