import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import ExplorerHeroSurface from "./ExplorerHeroSurface";

describe("ExplorerHeroSurface", () => {
  test("composes page identity, semantic content, and an optional decorative visual", () => {
    const { container } = render(
      <ExplorerHeroSurface
        identity="Your Dashboard"
        icon={<span>Compass</span>}
        visual={<div data-testid="journey-visual">Journey</div>}
        className="dashboard-explorer"
      >
        <header>Header content</header>
      </ExplorerHeroSurface>
    );

    expect(container.firstChild).toHaveClass("cy-explorer-hero", "dashboard-explorer");
    expect(screen.getByText("Your Dashboard")).toBeVisible();
    expect(screen.getByText("Header content")).toBeVisible();
    expect(screen.getByTestId("journey-visual").closest(".cy-explorer-hero-visual"))
      .toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector("main")).not.toBeInTheDocument();
    expect(container.querySelector("h1")).not.toBeInTheDocument();
  });

  test("does not create an empty visual region when no visual is supplied", () => {
    const { container } = render(
      <ExplorerHeroSurface identity="My Progress">
        <div>Progress header</div>
      </ExplorerHeroSurface>
    );

    expect(container.querySelector(".cy-explorer-hero-visual")).not.toBeInTheDocument();
    expect(container.querySelector(".cy-explorer-hero-layout"))
      .toHaveClass("cy-explorer-hero-layout-content-only");
  });

  test("defines responsive, overflow-safe, and reduced-motion CSS contracts", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "foundation.css"), "utf8");

    expect(css).toMatch(/\.cy-explorer-hero-layout\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.cy-page-identity\s*\{[^}]*font-weight:\s*700/);
    expect(css).toMatch(/\.cy-explorer-hero-visual\s*\{[^}]*min-width:\s*0[^}]*overflow:\s*hidden/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)[\s\S]*?\.cy-explorer-hero-layout\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.cy-explorer-hero-visual\s*\{[^}]*animation:\s*none/);
    expect(css).not.toMatch(/(?:html|body|\.cy-app-shell)\s*\{[^}]*overflow-x:\s*hidden/);
    expect(css).not.toContain("!important");
  });
});
