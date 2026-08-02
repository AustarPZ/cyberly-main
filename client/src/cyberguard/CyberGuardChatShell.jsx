import React from "react";

export default function CyberGuardChatShell({
  sidebar,
  conversation,
  sidebarCollapsed = false,
  label = "CyberGuard conversation workspace",
}) {
  return (
    <section
      className={[
        "cyberguard-chat-shell",
        sidebarCollapsed ? "is-sidebar-collapsed" : "",
      ].filter(Boolean).join(" ")}
      aria-label={label}
    >
      <div className="cyberguard-chat-shell-sidebar">
        {sidebar}
      </div>
      <div className="cyberguard-chat-shell-main">
        {conversation}
      </div>
    </section>
  );
}
