import { render, screen } from "@testing-library/react";
import CompactHeader from "./CompactHeader";

const fs = require("fs");
const path = require("path");

describe("CompactHeader", () => {
  test("renders a compact semantic header with optional regions", () => {
    const { container } = render(
      <CompactHeader
        eyebrow="Learning hub"
        title="Welcome back"
        description="Continue your journey."
        metadata={<span>Teen learner</span>}
        actions={<button type="button">Continue</button>}
        className="dashboard-header"
      />
    );

    expect(screen.getByRole("heading", { level: 1, name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByText("Learning hub")).toBeInTheDocument();
    expect(screen.getByText("Continue your journey.")).toBeInTheDocument();
    expect(screen.getByText("Teen learner")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continue" })).toBeInTheDocument();
    expect(container.firstChild).toHaveClass("cy-compact-header", "dashboard-header");
  });

  test("supports a configurable heading and omits unused optional wrappers", () => {
    const { container } = render(<CompactHeader title="Section" headingLevel={2} />);
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
    expect(container.querySelector(".cy-compact-header-eyebrow")).not.toBeInTheDocument();
    expect(container.querySelector(".cy-compact-header-description")).not.toBeInTheDocument();
    expect(container.querySelector(".cy-compact-header-metadata")).not.toBeInTheDocument();
    expect(container.querySelector(".cy-compact-header-actions")).not.toBeInTheDocument();
  });

  test("bounds invalid heading levels to legal H1-H6 semantics", () => {
    const { rerender } = render(<CompactHeader title="Low level" headingLevel={0} />);
    expect(screen.getByRole("heading", { level: 1, name: "Low level" })).toBeInTheDocument();

    rerender(<CompactHeader title="High level" headingLevel={7} />);
    expect(screen.getByRole("heading", { level: 6, name: "High level" })).toBeInTheDocument();

    rerender(<CompactHeader title="Invalid level" headingLevel="not-a-heading" />);
    expect(screen.getByRole("heading", { level: 1, name: "Invalid level" })).toBeInTheDocument();

    rerender(<CompactHeader title="Numeric string" headingLevel="2" />);
    expect(screen.getByRole("heading", { level: 2, name: "Numeric string" })).toBeInTheDocument();

    rerender(<CompactHeader title="Fractional level" headingLevel={2.5} />);
    expect(screen.getByRole("heading", { level: 1, name: "Fractional level" })).toBeInTheDocument();
    expect(document.querySelector("h2\\.5")).not.toBeInTheDocument();
  });

  test("keeps the compact header fluid and 320px-safe without concealing overflow", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "foundation.css"), "utf8");
    expect(css).toMatch(/\.cy-compact-header-title\s*\{[^}]*font-size:\s*clamp\(/);
    expect(css).toMatch(/\.cy-compact-header-metadata,[\s\S]*?flex-wrap:\s*wrap/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
    expect(css).toMatch(/\.cy-compact-header\s*\{[^}]*flex-direction:\s*column/);
    expect(css).toContain("min-height: var(--cyberly-control-min-height)");
    expect(css).not.toMatch(/(?:html|body|\.cy-app-shell)\s*\{[^}]*overflow-x:\s*hidden/);
    expect(css).not.toContain("!important");
  });
});
