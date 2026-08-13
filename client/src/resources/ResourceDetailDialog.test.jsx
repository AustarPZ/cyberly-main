import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ResourceDetailDialog from "./ResourceDetailDialog";

const resource = {
  slug: "spot-phishing",
  title: "Spot phishing messages",
  summary: "Check urgency, sender details, and suspicious links.",
  content: ["Pause before opening a link.", "Verify through an official channel."],
  sourceLabel: "CyberSecurity Malaysia",
  sourceUrl: "https://example.test/phishing",
};

function renderDialog(onClose = jest.fn()) {
  render(
    <ResourceDetailDialog
      resource={resource}
      categoryLabel="Scams & Social Engineering"
      sourceLabel="Source"
      learnMoreLabel="Learn more"
      closeLabel="Close"
      onClose={onClose}
    />
  );
  return onClose;
}

describe("ResourceDetailDialog", () => {
  test("renders an accessible modal with an h2 title and safe source link", () => {
    renderDialog();

    const dialog = screen.getByRole("dialog", { name: "Spot phishing messages" });
    const title = screen.getByRole("heading", { level: 2, name: "Spot phishing messages" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(dialog).toHaveAttribute("aria-labelledby", title.id);
    expect(dialog).toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("heading", { level: 1, name: "Spot phishing messages" })).not.toBeInTheDocument();
    expect(screen.getByText("Pause before opening a link.")).toBeVisible();
    expect(screen.getByText("CyberSecurity Malaysia")).toBeVisible();
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: "Learn more" })).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("focuses Close and traps Tab and Shift+Tab inside the dialog", async () => {
    renderDialog();
    const close = screen.getByRole("button", { name: "Close" });
    const source = screen.getByRole("link", { name: "Learn more" });

    expect(close).toHaveFocus();
    await userEvent.tab();
    expect(source).toHaveFocus();
    await userEvent.tab();
    expect(close).toHaveFocus();
    await userEvent.tab({ shift: true });
    expect(source).toHaveFocus();
  });

  test("supports Escape, backdrop, and close-button dismissal without treating dialog clicks as backdrop clicks", async () => {
    const onClose = renderDialog();
    const dialog = screen.getByRole("dialog");

    await userEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await userEvent.click(screen.getByTestId("resource-dialog-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);

    onClose.mockClear();
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("prevents default focus transfer only for a true backdrop mouse down", () => {
    const onClose = renderDialog();
    const backdrop = screen.getByTestId("resource-dialog-backdrop");
    const dialog = screen.getByRole("dialog");

    const backdropMouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    backdrop.dispatchEvent(backdropMouseDown);
    expect(backdropMouseDown.defaultPrevented).toBe(true);
    expect(onClose).not.toHaveBeenCalled();

    const dialogMouseDown = new MouseEvent("mousedown", { bubbles: true, cancelable: true });
    dialog.dispatchEvent(dialogMouseDown);
    expect(dialogMouseDown.defaultPrevented).toBe(false);
    expect(onClose).not.toHaveBeenCalled();

    fireEvent.click(dialog);
    expect(onClose).not.toHaveBeenCalled();
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test("locks background scrolling while mounted and restores the previous body overflow", () => {
    document.body.style.overflow = "clip";
    const { unmount } = render(
      <ResourceDetailDialog
        resource={resource}
        categoryLabel="Scams & Social Engineering"
        sourceLabel="Source"
        learnMoreLabel="Learn more"
        closeLabel="Close"
        onClose={jest.fn()}
      />
    );

    expect(document.body).toHaveStyle({ overflow: "hidden" });
    unmount();
    expect(document.body).toHaveStyle({ overflow: "clip" });
    document.body.style.overflow = "";
  });
});
