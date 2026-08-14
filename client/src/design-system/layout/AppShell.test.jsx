import { render, screen } from "@testing-library/react";
import AppShell from "./AppShell";

describe("AppShell", () => {
  test("composes navigation, one main landmark, footer, and floating content", () => {
    const { container } = render(
      <AppShell
        navigation={<nav aria-label="Primary">Navigation</nav>}
        footer={<footer>Footer</footer>}
        floating={<aside>Floating</aside>}
        mainClassName="custom-main"
      >
        <p>Route content</p>
      </AppShell>
    );

    const main = screen.getByRole("main");
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(main).toHaveClass("cy-app-shell-main", "custom-main");
    expect(main).toContainElement(screen.getByText("Route content"));
    expect(container.firstChild).toHaveClass("cy-app-shell");
    expect(container.firstChild).not.toHaveAttribute("role");

    const navigation = screen.getByRole("navigation", { name: "Primary" });
    const footer = screen.getByText("Footer").closest("footer");
    const floating = screen.getByText("Floating").closest("aside");
    expect(navigation.compareDocumentPosition(main) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(main).not.toContainElement(floating);
  });

  test("omits optional slots without adding empty wrappers", () => {
    const { container } = render(<AppShell>Content</AppShell>);
    expect(screen.getByRole("main")).toHaveTextContent("Content");
    expect(container.querySelectorAll(".cy-app-shell > *")).toHaveLength(1);
  });
});
