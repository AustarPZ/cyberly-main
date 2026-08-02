import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CyberGuardWorkspaceHeader from "./CyberGuardWorkspaceHeader";

const mockIconButtonRenderSpy = jest.fn();

jest.mock("../design-system/primitives/IconButton", () => {
  const React = require("react");
  const MockIconButton = React.forwardRef(({ label, variant, className = "", children, ...props }, ref) => {
    mockIconButtonRenderSpy({ label, variant, className, ...props, ref });
    return (
      <button
        ref={ref}
        type="button"
        aria-label={label}
        className={["cy-icon-button", `cy-icon-button-${variant || "quiet"}`, className].filter(Boolean).join(" ")}
        data-variant={variant}
        {...props}
      >
        {children}
      </button>
    );
  });
  MockIconButton.displayName = "MockIconButton";
  return {
    __esModule: true,
    default: MockIconButton,
  };
});

describe("CyberGuardWorkspaceHeader", () => {
  const defaultProps = {
    title: "CyberGuard",
    description: "Ask focused cyber-wellness questions, review safer next steps, and keep learning at your pace.",
    conversationLabel: "Current chat",
    conversationTitle: "Phishing safety baseline",
    historyLabel: "Open chat history",
    newChatLabel: "New Chat",
    onOpenHistory: jest.fn(),
    onNewChat: jest.fn(),
  };

  beforeEach(() => {
    mockIconButtonRenderSpy.mockClear();
  });

  test("renders a compact semantic header with approved CyberGuard copy", () => {
    render(<CyberGuardWorkspaceHeader {...defaultProps} />);

    const header = screen.getByRole("banner", { name: "CyberGuard" });
    expect(header.tagName).toBe("HEADER");
    expect(screen.getByRole("heading", { level: 1, name: "CyberGuard" })).toBeInTheDocument();
    expect(screen.getAllByText("CyberGuard")).toHaveLength(1);
    expect(screen.getByText(defaultProps.description)).toBeInTheDocument();
    expect(screen.queryByText(/AI Gateway phase/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Live AI replies/i)).not.toBeInTheDocument();
  });

  test("renders active conversation context only when provided", () => {
    const { rerender } = render(<CyberGuardWorkspaceHeader {...defaultProps} />);
    expect(screen.getByText("Phishing safety baseline")).toBeInTheDocument();
    expect(screen.getByText("Current chat")).toBeInTheDocument();

    rerender(
      <CyberGuardWorkspaceHeader
        {...defaultProps}
        conversationTitle=""
      />
    );

    expect(screen.queryByText("Phishing safety baseline")).not.toBeInTheDocument();
    expect(screen.queryByText("Current chat")).not.toBeInTheDocument();
  });

  test("renders history and new-chat controls as real buttons with accessible names and variants", () => {
    render(<CyberGuardWorkspaceHeader {...defaultProps} />);

    const history = screen.getByRole("button", { name: "Open chat history" });
    const newChat = screen.getByRole("button", { name: "New Chat" });

    expect(history.tagName).toBe("BUTTON");
    expect(newChat.tagName).toBe("BUTTON");
    expect(history).toHaveClass("cy-icon-button");
    expect(history).toHaveClass("cyberguard-workspace-history-control");
    expect(newChat).toHaveClass("cy-button");
    expect(newChat).toHaveClass("cy-button-primary");
  });

  test("renders the approved IconButton primitive for history control", () => {
    const onOpenHistory = jest.fn();
    const historyButtonRef = { current: null };

    render(
      <CyberGuardWorkspaceHeader
        {...defaultProps}
        onOpenHistory={onOpenHistory}
        historyButtonRef={historyButtonRef}
        historyControls="ai-chat-history-drawer"
        historyExpanded={false}
        historyDisabled
      />
    );

    expect(mockIconButtonRenderSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        label: "Open chat history",
        variant: "quiet",
        onClick: onOpenHistory,
        disabled: true,
        "aria-controls": "ai-chat-history-drawer",
        "aria-expanded": false,
        className: "cyberguard-workspace-history-control",
        ref: historyButtonRef,
      })
    );
  });

  test("activates callbacks once and respects disabled state", async () => {
    const onOpenHistory = jest.fn();
    const onNewChat = jest.fn();
    const { rerender } = render(
      <CyberGuardWorkspaceHeader
        {...defaultProps}
        onOpenHistory={onOpenHistory}
        onNewChat={onNewChat}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Open chat history" }));
    await userEvent.click(screen.getByRole("button", { name: "New Chat" }));

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
    expect(onNewChat).toHaveBeenCalledTimes(1);

    rerender(
      <CyberGuardWorkspaceHeader
        {...defaultProps}
        onOpenHistory={onOpenHistory}
        onNewChat={onNewChat}
        historyDisabled
        newChatDisabled
      />
    );

    expect(screen.getByRole("button", { name: "Open chat history" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "New Chat" })).toBeDisabled();

    await userEvent.click(screen.getByRole("button", { name: "Open chat history" }));
    await userEvent.click(screen.getByRole("button", { name: "New Chat" }));

    expect(onOpenHistory).toHaveBeenCalledTimes(1);
    expect(onNewChat).toHaveBeenCalledTimes(1);
  });

  test("does not add arbitrary inline colour styling", () => {
    render(<CyberGuardWorkspaceHeader {...defaultProps} />);

    const styledNodes = Array.from(screen.getByRole("banner", { name: "CyberGuard" }).querySelectorAll("[style]"));
    expect(styledNodes).toHaveLength(0);
  });
});
