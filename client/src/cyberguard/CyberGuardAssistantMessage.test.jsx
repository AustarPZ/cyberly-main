import { render, screen, within } from "@testing-library/react";
import CyberGuardAssistantMessage from "./CyberGuardAssistantMessage";

function follows(before, after) {
  return Boolean(before.compareDocumentPosition(after) & Node.DOCUMENT_POSITION_FOLLOWING);
}

describe("CyberGuardAssistantMessage", () => {
  test("keeps supplied assistant regions inside one ordered root", () => {
    const { container } = render(
      <CyberGuardAssistantMessage
        messageId={42}
        label="CyberGuard reply"
        answer={<div>Answer content</div>}
        sources={<section>Source content</section>}
        proposal={<div>Proposal content</div>}
        actions={<div>Action content</div>}
      />
    );

    const root = screen.getByTestId("chat-assistant-message-42");
    const answer = within(root).getByTestId("chat-message-answer-42");
    const sources = within(root).getByTestId("chat-message-sources-42");
    const proposal = within(root).getByTestId("chat-message-proposal-42");
    const actions = within(root).getByTestId("chat-message-actions-42");

    expect(root).toHaveAttribute("data-chat-assistant-message-id", "42");
    expect(root).toHaveAccessibleName("CyberGuard reply");
    expect(within(answer).getByText("Answer content")).toBeInTheDocument();
    expect(within(sources).getByText("Source content")).toBeInTheDocument();
    expect(within(proposal).getByText("Proposal content")).toBeInTheDocument();
    expect(within(actions).getByText("Action content")).toBeInTheDocument();
    expect(follows(answer, sources)).toBe(true);
    expect(follows(sources, proposal)).toBe(true);
    expect(follows(proposal, actions)).toBe(true);
    expect(container.querySelector("[style]")).not.toBeInTheDocument();
    expect(screen.queryByRole("log")).not.toBeInTheDocument();
    expect(root).not.toHaveAttribute("aria-live");
    expect(root).not.toHaveAttribute("role", "alert");
  });

  test("does not render empty wrappers for missing optional regions", () => {
    render(
      <CyberGuardAssistantMessage
        messageId="minimal"
        answer={<div>Only answer</div>}
      />
    );

    const root = screen.getByTestId("chat-assistant-message-minimal");
    expect(within(root).getByTestId("chat-message-answer-minimal")).toBeInTheDocument();
    expect(within(root).queryByTestId("chat-message-sources-minimal")).not.toBeInTheDocument();
    expect(within(root).queryByTestId("chat-message-proposal-minimal")).not.toBeInTheDocument();
    expect(within(root).queryByTestId("chat-message-actions-minimal")).not.toBeInTheDocument();
  });
});
