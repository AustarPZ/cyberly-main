import { render, screen } from "@testing-library/react";
import PageIdentity from "./PageIdentity";

describe("PageIdentity", () => {
  test("renders a textual page label without introducing heading or main semantics", () => {
    const { container } = render(<PageIdentity label="Your Dashboard" />);

    expect(screen.getByText("Your Dashboard")).toHaveClass("cy-page-identity-label");
    expect(container.firstChild).toHaveClass("cy-page-identity");
    expect(container.querySelector("h1, h2, h3, h4, h5, h6")).not.toBeInTheDocument();
    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(container.querySelector(".cy-page-identity-icon")).not.toBeInTheDocument();
  });

  test("renders an optional decorative icon and supports a custom class", () => {
    const { container } = render(
      <PageIdentity
        label="My Progress"
        icon={<span data-testid="progress-mark">P</span>}
        className="progress-identity"
      />
    );

    expect(container.firstChild).toHaveClass("cy-page-identity", "progress-identity");
    expect(screen.getByTestId("progress-mark").closest(".cy-page-identity-icon"))
      .toHaveAttribute("aria-hidden", "true");
  });
});
