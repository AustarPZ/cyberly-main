import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";
import { IconButton } from "./IconButton";

describe("Button primitive", () => {
  test("renders a semantic native button with controlled variant classes", () => {
    render(<Button variant="primary">Continue</Button>);

    const button = screen.getByRole("button", { name: "Continue" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("cy-button");
    expect(button).toHaveClass("cy-button-primary");
  });

  test("supports only the approved variant class names", () => {
    const { rerender } = render(<Button variant="primary">Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveClass("cy-button-primary");

    rerender(<Button variant="secondary">Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveClass("cy-button-secondary");

    rerender(<Button variant="quiet">Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveClass("cy-button-quiet");

    rerender(<Button variant="danger">Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveClass("cy-button-danger");

    rerender(<Button variant="custom">Action</Button>);
    expect(screen.getByRole("button", { name: "Action" })).toHaveClass("cy-button-secondary");
    expect(screen.getByRole("button", { name: "Action" })).not.toHaveClass("cy-button-custom");
  });

  test("does not activate when disabled", async () => {
    const onClick = jest.fn();
    render(<Button disabled onClick={onClick}>Save</Button>);

    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("uses visible loading text, aria-busy, and native disabled state", async () => {
    const onClick = jest.fn();
    render(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save changes
      </Button>
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Saving");
    expect(button).not.toHaveTextContent("Save changes");

    await userEvent.click(button);
    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  test("filters arbitrary styling props while allowing safe className extension", () => {
    render(
      <Button
        color="red"
        tone="brand"
        style={{ background: "red" }}
        className="extra-class"
      >
        Filtered
      </Button>
    );

    const button = screen.getByRole("button", { name: "Filtered" });
    expect(button).toHaveClass("extra-class");
    expect(button).not.toHaveAttribute("color");
    expect(button).not.toHaveAttribute("tone");
    expect(button).not.toHaveAttribute("style");
  });
});

describe("IconButton primitive", () => {
  test("renders a semantic native icon button with a required accessible label", () => {
    render(
      <IconButton label="Open chat history" variant="primary">
        <span aria-hidden="true">+</span>
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Open chat history" });
    expect(button.tagName).toBe("BUTTON");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveAttribute("aria-label", "Open chat history");
    expect(button).toHaveClass("cy-icon-button");
    expect(button).toHaveClass("cy-icon-button-primary");
    expect(button).toHaveTextContent("+");
  });

  test("throws when label is empty", () => {
    const spy = jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => render(<IconButton label=" ">×</IconButton>)).toThrow(
      "IconButton requires a non-empty label."
    );

    spy.mockRestore();
  });

  test("supports only quiet and primary variants", () => {
    const { rerender } = render(<IconButton label="Menu">☰</IconButton>);
    expect(screen.getByRole("button", { name: "Menu" })).toHaveClass("cy-icon-button-quiet");

    rerender(<IconButton label="Menu" variant="primary">☰</IconButton>);
    expect(screen.getByRole("button", { name: "Menu" })).toHaveClass("cy-icon-button-primary");

    rerender(<IconButton label="Menu" variant="danger">☰</IconButton>);
    expect(screen.getByRole("button", { name: "Menu" })).toHaveClass("cy-icon-button-quiet");
    expect(screen.getByRole("button", { name: "Menu" })).not.toHaveClass("cy-icon-button-danger");
  });

  test("filters arbitrary styling props", () => {
    render(
      <IconButton
        label="Close"
        color="red"
        tone="brand"
        style={{ background: "red" }}
      >
        ×
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).not.toHaveAttribute("color");
    expect(button).not.toHaveAttribute("tone");
    expect(button).not.toHaveAttribute("style");
  });

  test("does not activate when disabled", async () => {
    const onClick = jest.fn();
    render(
      <IconButton label="Close" disabled onClick={onClick}>
        ×
      </IconButton>
    );

    const button = screen.getByRole("button", { name: "Close" });
    expect(button).toBeDisabled();

    await userEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

