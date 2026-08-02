import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CyberGuardComposerFrame from "./CyberGuardComposerFrame";

describe("CyberGuardComposerFrame", () => {
  test("renders a semantic composer form around supplied controls", async () => {
    const onSubmit = jest.fn(event => event.preventDefault());
    const input = <textarea aria-label="Type your chat message" defaultValue="Draft" />;
    const submitControl = <button type="submit">Send</button>;

    const { container } = render(
      <CyberGuardComposerFrame
        label="Message CyberGuard"
        guidance="Review and edit your message before sending."
        status="Sending..."
        loading
        onSubmit={onSubmit}
        input={input}
        submitControl={submitControl}
      />
    );

    const form = screen.getByRole("form", { name: "Message CyberGuard" });
    expect(form).toHaveClass("cyberguard-composer-frame");
    expect(form).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("textbox", { name: "Type your chat message" })).toHaveValue("Draft");
    expect(screen.getByRole("button", { name: "Send" })).toBeInTheDocument();
    expect(screen.getByText("Review and edit your message before sending.")).toHaveClass("cyberguard-composer-guidance");
    expect(screen.getByText("Sending...")).toHaveClass("cyberguard-composer-status");
    expect(screen.getByText("Sending...")).toHaveAttribute("aria-live", "polite");
    expect(container.querySelectorAll("textarea")).toHaveLength(1);
    expect(container.querySelectorAll("button[type='submit']")).toHaveLength(1);
    expect(container.querySelector("[style]")).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  test("does not own draft state or require chat providers", async () => {
    const onChange = jest.fn();
    render(
      <CyberGuardComposerFrame
        label="Message CyberGuard"
        onSubmit={event => event.preventDefault()}
        input={<textarea aria-label="Type your chat message" value="" onChange={onChange} />}
        submitControl={<button type="submit">Send</button>}
      />
    );

    await userEvent.type(screen.getByRole("textbox", { name: "Type your chat message" }), "hello");

    expect(onChange).toHaveBeenCalled();
  });
});
