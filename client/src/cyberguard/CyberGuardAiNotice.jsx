import React from "react";

function NoticeIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M12 3.5 20 7v5.4c0 4.6-3.3 7.5-8 8.6-4.7-1.1-8-4-8-8.6V7l8-3.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <path d="M12 8v5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
      <path d="M12 16.2h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.3" />
    </svg>
  );
}

export default function CyberGuardAiNotice({ title, description }) {
  return (
    <aside
      className="cyberguard-ai-notice"
      aria-labelledby="cyberguard-ai-notice-title"
      aria-describedby="cyberguard-ai-notice-description"
    >
      <span className="cyberguard-ai-notice-icon">
        <NoticeIcon />
      </span>
      <div className="cyberguard-ai-notice-copy">
        <h2 id="cyberguard-ai-notice-title">{title}</h2>
        <p id="cyberguard-ai-notice-description">{description}</p>
      </div>
    </aside>
  );
}
