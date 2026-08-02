import React from "react";

export default function CyberGuardAssistantMessage({
  messageId,
  answer,
  sources = null,
  proposal = null,
  actions = null,
  label,
}) {
  const id = String(messageId);

  return (
    <article
      className="cyberguard-assistant-message"
      data-testid={`chat-assistant-message-${id}`}
      data-chat-assistant-message-id={id}
      aria-label={label}
    >
      <div
        className="cyberguard-assistant-message-answer"
        data-testid={`chat-message-answer-${id}`}
      >
        {answer}
      </div>
      {sources ? (
        <div
          className="cyberguard-assistant-message-sources"
          data-testid={`chat-message-sources-${id}`}
        >
          {sources}
        </div>
      ) : null}
      {proposal ? (
        <div
          className="cyberguard-assistant-message-proposal"
          data-testid={`chat-message-proposal-${id}`}
        >
          {proposal}
        </div>
      ) : null}
      {actions ? (
        <div
          className="cyberguard-assistant-message-actions"
          data-testid={`chat-message-actions-${id}`}
        >
          {actions}
        </div>
      ) : null}
    </article>
  );
}
