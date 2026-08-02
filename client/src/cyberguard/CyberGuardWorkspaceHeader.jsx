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
          <h1 id="cyberguard-workspace-title" className="cyberguard-workspace-heading">
            {title}
          </h1>
          <p className="cyberguard-workspace-description">{description}</p>
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
