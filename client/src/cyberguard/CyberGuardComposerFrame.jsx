import React from "react";

export default function CyberGuardComposerFrame({
  label,
  guidance = "",
  status = "",
  loading = false,
  onSubmit,
  input,
  submitControl,
}) {
  return (
    <form
      className="cyberguard-composer-frame"
      aria-label={label}
      aria-busy={loading ? "true" : undefined}
      onSubmit={onSubmit}
    >
      <div className="cyberguard-composer-main">
        {input}
        {submitControl}
      </div>
      {guidance ? (
        <p className="cyberguard-composer-guidance">
          {guidance}
        </p>
      ) : null}
      {status ? (
        <p className="cyberguard-composer-status" aria-live="polite">
          {status}
        </p>
      ) : null}
    </form>
  );
}
