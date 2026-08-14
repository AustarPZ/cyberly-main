import fs from "fs";
import path from "path";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import SectionNav from "./SectionNav";

const items = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity History" },
];

describe("SectionNav", () => {
  test("renders accessible presentational navigation with active semantics", () => {
    render(
      <SectionNav
        ariaLabel="Progress page sections"
        title="Progress sections"
        items={items}
        activeId="overview"
        onSelect={jest.fn()}
      />
    );

    expect(screen.getByRole("complementary", { name: "Progress page sections" })).toBeInTheDocument();
    expect(screen.getByText("Progress sections")).toBeVisible();
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("type", "button");
    expect(screen.getByRole("button", { name: "Overview" })).toHaveAttribute("aria-current", "location");
    expect(screen.getByRole("button", { name: "Activity History" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
  });

  test("reports the selected item id without owning selection state", () => {
    const onSelect = jest.fn();
    render(
      <SectionNav
        ariaLabel="Progress page sections"
        title="Progress sections"
        items={items}
        activeId="overview"
        onSelect={onSelect}
      />
    );

    userEvent.click(screen.getByRole("button", { name: "Activity History" }));

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("activity");
  });

  test("provides a responsive local-scroll styling contract without concealing overflow", () => {
    const css = fs.readFileSync(path.join(__dirname, "..", "foundation.css"), "utf8");

    expect(css).toMatch(/\.cy-section-nav\s*\{[^}]*position:\s*sticky/);
    expect(css).toMatch(/\.cy-section-nav-list\s*\{[^}]*display:\s*grid/);
    expect(css).toMatch(/\.cy-section-nav-button:focus-visible/);
    expect(css).toMatch(/@media\s*\(max-width:\s*56\.25rem\)/);
    expect(css).toMatch(/\.cy-section-nav\s*\{[^}]*position:\s*static/);
    expect(css).toMatch(/\.cy-section-nav-list\s*\{[^}]*display:\s*flex[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.cy-section-nav-button\s*\{[^}]*white-space:\s*nowrap/);
    expect(css).not.toMatch(/(?:html|body|\.cy-app-shell)\s*\{[^}]*overflow-x:\s*hidden/);
    expect(css).not.toContain("!important");
  });
});
