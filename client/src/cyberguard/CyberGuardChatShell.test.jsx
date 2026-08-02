import { render, screen, within } from "@testing-library/react";
import CyberGuardChatShell from "./CyberGuardChatShell";

describe("CyberGuardChatShell", () => {
  const sidebar = (
    <nav aria-label="Conversation history">
      <button type="button">Collapse history</button>
      <span>Saved chat</span>
    </nav>
  );
  const conversation = (
    <section aria-label="Active chat conversation">
      <div role="log" aria-label="Chat message history" aria-live="polite">
        Message history
      </div>
      <form aria-label="Chat composer">
        <textarea aria-label="Type your chat message" />
      </form>
    </section>
  );

  test("renders a presentation-only workspace region with sidebar before conversation", () => {
    render(
      <CyberGuardChatShell
        label="CyberGuard conversation workspace"
        sidebar={sidebar}
        conversation={conversation}
      />
    );

    const shell = screen.getByRole("region", { name: "CyberGuard conversation workspace" });
    const shellChildren = Array.from(shell.children);
    const sidebarRegion = shell.querySelector(".cyberguard-chat-shell-sidebar");
    const mainRegion = shell.querySelector(".cyberguard-chat-shell-main");

    expect(shell).toHaveClass("cyberguard-chat-shell");
    expect(shell).not.toHaveClass("is-sidebar-collapsed");
    expect(sidebarRegion).toBeInTheDocument();
    expect(mainRegion).toBeInTheDocument();
    expect(shellChildren.indexOf(sidebarRegion)).toBeLessThan(shellChildren.indexOf(mainRegion));
    expect(within(sidebarRegion).getByRole("navigation", { name: "Conversation history" })).toBeInTheDocument();
    expect(within(mainRegion).getByRole("log", { name: "Chat message history" })).toBeInTheDocument();
  });

  test("applies a controlled collapsed modifier without removing content", () => {
    render(
      <CyberGuardChatShell
        label="CyberGuard conversation workspace"
        sidebar={sidebar}
        conversation={conversation}
        sidebarCollapsed
      />
    );

    const shell = screen.getByRole("region", { name: "CyberGuard conversation workspace" });
    expect(shell).toHaveClass("is-sidebar-collapsed");
    expect(screen.getByText("Saved chat")).toBeInTheDocument();
    expect(screen.getByRole("log", { name: "Chat message history" })).toBeInTheDocument();
  });

  test("does not own chat state, drawer markup, widget markup, or inline styles", () => {
    render(
      <CyberGuardChatShell
        label="CyberGuard conversation workspace"
        sidebar={sidebar}
        conversation={conversation}
      />
    );

    const shell = screen.getByRole("region", { name: "CyberGuard conversation workspace" });
    expect(shell.querySelector("[style]")).not.toBeInTheDocument();
    expect(shell.querySelector(".ai-chat-drawer-layer")).not.toBeInTheDocument();
    expect(shell.querySelector(".chat-panel")).not.toBeInTheDocument();
  });
});
