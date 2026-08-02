import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CyberGuardQuickPrompts from "./CyberGuardQuickPrompts";

const prompts = [
  { id: "spot-suspicious-message", label: "How can I tell if a message might be a scam?" },
  { id: "strengthen-account-safety", label: "What can I do to make my account safer?" },
  { id: "protect-personal-information", label: "How should I decide what personal information to share?" },
  { id: "check-online-information", label: "How can I check whether an online claim is trustworthy?" },
  { id: "extra-prompt", label: "This prompt should not render." },
];

describe("CyberGuardQuickPrompts", () => {
  test("renders up to four stable prompt buttons in input order", () => {
    render(
      <CyberGuardQuickPrompts
        label="Quick-start prompts"
        prompts={prompts}
        onSelectPrompt={jest.fn()}
      />
    );

    const group = screen.getByRole("group", { name: "Quick-start prompts" });
    const buttons = screen.getAllByRole("button");
    expect(group).toHaveClass("cyberguard-quick-prompts");
    expect(buttons).toHaveLength(4);
    expect(buttons.map(button => button.textContent)).toEqual(prompts.slice(0, 4).map(prompt => prompt.label));
    buttons.forEach((button, index) => {
      expect(button).toHaveAttribute("type", "button");
      expect(button).toHaveAttribute("data-prompt-id", prompts[index].id);
      expect(button).toHaveClass("cyberguard-quick-prompt");
    });
  });

  test("selects a prompt without submitting or depending on providers", async () => {
    const onSelectPrompt = jest.fn();
    const onSubmit = jest.fn();
    const { container } = render(
      <CyberGuardQuickPrompts
        prompts={prompts.slice(0, 1)}
        onSelectPrompt={onSelectPrompt}
        onSubmit={onSubmit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: prompts[0].label }));

    expect(onSelectPrompt).toHaveBeenCalledWith(prompts[0]);
    expect(onSubmit).not.toHaveBeenCalled();
    expect(container.querySelector("[style]")).not.toBeInTheDocument();
  });

  test("disabled state prevents prompt selection", async () => {
    const onSelectPrompt = jest.fn();
    render(
      <CyberGuardQuickPrompts
        prompts={prompts.slice(0, 1)}
        onSelectPrompt={onSelectPrompt}
        disabled
      />
    );

    const button = screen.getByRole("button", { name: prompts[0].label });
    expect(button).toBeDisabled();

    await userEvent.click(button);

    expect(onSelectPrompt).not.toHaveBeenCalled();
  });
});
