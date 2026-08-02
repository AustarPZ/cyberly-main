import { render, screen } from "@testing-library/react";
import CyberGuardEmptyState from "./CyberGuardEmptyState";

describe("CyberGuardEmptyState", () => {
  test("renders a semantic empty-state region with heading and description", () => {
    render(
      <CyberGuardEmptyState
        label="Start a CyberGuard conversation"
        title="Start with a cyber-safety question"
        description="Ask about suspicious messages or privacy choices."
        prompts={<button type="button">Try a prompt</button>}
      />
    );

    const region = screen.getByRole("region", { name: "Start with a cyber-safety question" });
    expect(region).toHaveClass("cyberguard-empty-state");
    expect(region).toHaveAttribute("aria-labelledby", "cyberguard-empty-state-title");
    expect(region).toHaveAttribute("aria-describedby", "cyberguard-empty-state-description");
    expect(screen.getByRole("heading", { level: 2, name: "Start with a cyber-safety question" })).toBeInTheDocument();
    expect(screen.getByText("Ask about suspicious messages or privacy choices.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try a prompt" })).toBeInTheDocument();
  });

  test("does not create chat runtime regions or alert semantics", () => {
    const { container } = render(
      <CyberGuardEmptyState
        title="Start with a cyber-safety question"
        description="Ask about suspicious messages or privacy choices."
        prompts={<span>Prompt content</span>}
      />
    );

    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    expect(screen.queryByRole("form")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(container.querySelector("[style]")).not.toBeInTheDocument();
  });
});
