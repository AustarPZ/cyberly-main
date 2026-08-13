import { createRef } from "react";
import { render, screen } from "@testing-library/react";
import { PageContainer } from "./layout/PageContainer";
import { PageSection } from "./layout/PageSection";
import { ContextHeader } from "./headers/ContextHeader";
import { Surface } from "./primitives/Surface";
import { Badge } from "./primitives/Badge";
import { PageState } from "./feedback/PageState";

describe("Cyberly shared foundation", () => {
  test("PageContainer provides semantic, bounded width variants and class extension", () => {
    render(<PageContainer as="main" width="reading" className="extra">Content</PageContainer>);
    const container = screen.getByRole("main");
    expect(container).toHaveClass("cy-page-container", "cy-page-container-reading", "extra");
  });

  test("PageSection provides rhythm without forcing card semantics", () => {
    const { container } = render(<PageSection as="section">Section</PageSection>);
    expect(container.firstChild).toHaveClass("cy-page-section");
    expect(container.firstChild).not.toHaveClass("cy-surface");
  });

  test("ContextHeader renders one semantic heading and optional content slots", () => {
    render(
      <ContextHeader
        eyebrow="Explore"
        title="Resources"
        description="Learn practical cyber wellness skills."
        metadata={<span>9 guides</span>}
        actions={<button type="button">Filter</button>}
      />
    );
    expect(screen.getByRole("heading", { level: 1, name: "Resources" })).toBeInTheDocument();
    expect(screen.getByText("Explore")).toBeInTheDocument();
    expect(screen.getByText("9 guides")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Filter" })).toBeInTheDocument();
  });

  test("ContextHeader exposes an opt-in programmatic heading focus target", () => {
    const headingRef = createRef();
    render(
      <ContextHeader
        title="Resource detail"
        headingLevel={2}
        headingRef={headingRef}
        headingTabIndex={-1}
      />
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Resource detail" });
    expect(headingRef.current).toBe(heading);
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(screen.getAllByRole("heading")).toHaveLength(1);
  });

  test("Surface is a non-interactive semantic visual container", () => {
    const { container } = render(<Surface as="article" variant="subdued" className="extra">Guide</Surface>);
    expect(container.firstChild.tagName).toBe("ARTICLE");
    expect(container.firstChild).toHaveClass("cy-surface", "cy-surface-subdued", "extra");
    expect(container.firstChild).not.toHaveAttribute("role", "button");
  });

  test("Badge exposes visible text and a bounded semantic tone", () => {
    render(<Badge tone="success">Reviewed</Badge>);
    expect(screen.getByText("Reviewed")).toHaveClass("cy-badge", "cy-badge-success");
  });

  test("PageState preserves loading, empty, error, and optional action semantics", () => {
    const onAction = jest.fn();
    const { rerender } = render(<PageState title="Loading" message="Please wait" />);
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "polite");

    rerender(<PageState type="empty" title="No resources" message="Try another filter" />);
    expect(screen.getByRole("status")).toHaveClass("empty");

    rerender(<PageState type="error" title="Unable to load" message="Try again" actionLabel="Retry" onAction={onAction} />);
    expect(screen.getByRole("alert")).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
  });
});
