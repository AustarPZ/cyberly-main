import React from "react";
import Button from "../design-system/primitives/Button";
import IconButton from "../design-system/primitives/IconButton";

function HistoryIcon() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="20" height="20">
      <path
        d="M4 6.5h16M4 12h16M4 17.5h16"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="2"
      />
    </svg>
  );
}

function CompanionMark() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 24 24" width="24" height="24">
      <path d="M12 2.8 19 5.7v5.1c0 4.6-2.8 8.5-7 10.4-4.2-1.9-7-5.8-7-10.4V5.7L12 2.8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" />
      <path d="m8.7 12 2.1 2.1 4.6-4.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
    </svg>
  );
}

export default function CyberGuardWorkspaceHeader({
  title,
  description,
  conversationLabel,
  conversationTitle,
  updatedLabel,
  historyLabel,
  newChatLabel,
  onOpenHistory,
  onNewChat,
  historyButtonRef,
  historyControls,
  historyExpanded,
  historyDisabled = false,
  newChatDisabled = false,
}) {
  const hasConversation = Boolean(String(conversationTitle || "").trim());

  return (
    <header
      className="cyberguard-workspace-header"
      role="banner"
      aria-labelledby="cyberguard-workspace-title"
    >
      <div className="cyberguard-workspace-header-main">
        <div className="cyberguard-workspace-copy">
          <span className="cyberguard-workspace-identity-mark" aria-hidden="true">
            <CompanionMark />
          </span>
          <div className="cyberguard-workspace-copy-text">
            <h1 id="cyberguard-workspace-title" className="cyberguard-workspace-heading">
              {title}
            </h1>
            <p className="cyberguard-workspace-description">{description}</p>
          </div>
        </div>

        <div className="cyberguard-workspace-actions">
          <IconButton
            ref={historyButtonRef}
            label={historyLabel}
            variant="quiet"
            className="cyberguard-workspace-history-control"
            onClick={onOpenHistory}
            disabled={historyDisabled}
            aria-controls={historyControls}
            aria-expanded={typeof historyExpanded === "boolean" ? historyExpanded : undefined}
          >
            <HistoryIcon />
          </IconButton>
          <Button variant="primary" onClick={onNewChat} disabled={newChatDisabled}>
            {newChatLabel}
          </Button>
        </div>
      </div>

      {hasConversation && (
        <div className="cyberguard-workspace-conversation">
          <span className="cyberguard-workspace-conversation-label">{conversationLabel}</span>
          <span className="cyberguard-workspace-conversation-title">{conversationTitle}</span>
          {updatedLabel && <span className="cyberguard-workspace-conversation-meta">{updatedLabel}</span>}
        </div>
      )}
    </header>
  );
}
