import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "scenarios.css"), "utf8");

function blockFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || "";
}

function remPaddingFor(selector) {
  const value = blockFor(selector).match(/padding\s*:\s*([\d.]+)rem(?:\s*;|\s)/)?.[1];
  return value ? Number(value) : 0;
}

describe("Scenario Decision Trail responsive CSS", () => {
  test.each([
    ".scenario-page-library .cy-button-primary:hover",
    ".scenario-page-intro .scenario-actions .cy-button-primary:hover",
  ])("POLISH1 %s locks readable foreground, background and border without an undefined token", selector => {
    const hover = blockFor(selector);
    expect(hover).toMatch(/color:\s*var\(--text-on-brand\)/);
    expect(hover).toMatch(/border-color:\s*var\(--scenario-primary-hover\)/);
    expect(hover).toMatch(/background:\s*var\(--scenario-primary-hover\)/);
    expect(css).toMatch(/--scenario-primary-hover:\s*color-mix\(in srgb, var\(--color-brand-primary-hover\) 85%, black\)/);
  });

  test("PERSIST1 canonical recommendation owns orange on a white surface without an arrival target", () => {
    expect(blockFor(".scenario-library-card.recommended")).toMatch(/border-color:\s*var\(--cyberly-warning\)/);
    expect(blockFor(".scenario-page-library .scenario-library-card.recommended")).toMatch(/background:\s*var\(--surface-raised\)/);
    expect(blockFor(".scenario-library-card.recommended::before")).toMatch(/background:\s*var\(--cyberly-warning\)/);
    expect(blockFor(".scenario-page-library .scenario-library-card.recommended::before")).toMatch(/display:\s*block/);
  });

  test("PERSIST1 arrival state adds green focus only, never independent orange emphasis", () => {
    expect(blockFor(".scenario-library-card.highlighted")).not.toMatch(/border-color|box-shadow/);
    expect(blockFor(".scenario-library-card.highlighted::before")).not.toMatch(/background/);
    expect(blockFor(".scenario-library-card.highlighted:focus")).toMatch(/outline:\s*3px solid var\(--cyberly-interactive-focus\)/);
    expect(blockFor(".scenario-library-card.highlighted:focus")).toMatch(/outline-offset:\s*3px/);
  });
  test("I01 limits green primary and compact orientation to Library, preserving other Scenario surfaces", () => {
    expect(blockFor(".scenario-page-library .cy-button-primary")).toMatch(/background:\s*var\(--color-brand-primary-hover\)/);
    expect(blockFor(".scenario-library-header")).toMatch(/background:\s*transparent/);
    expect(blockFor(".scenario-page-library .scenario-content")).toMatch(/padding-block:/);
    expect(blockFor(".scenario-page-library .scenario-library-section")).toMatch(/padding-block:\s*0/);
    expect(blockFor(".scenario-page-library")).toMatch(/--scenario-library-safe-lane:/);
    expect(css).toMatch(/\.cy-app-shell:has\(\.scenario-page\) > footer\.cy-app-footer/);
  });

  test("keeps Scenario presentation scoped and touch-friendly", () => {
    expect(css).toMatch(/\.scenario-page\s*\{/);
    expect(css).toMatch(/\.scenario-library-grid\s*\{/);
    expect(css).toMatch(/\.scenario-choice\s*\{/);
    expect(css).toMatch(/\.scenario-choice\[aria-pressed="true"\]/);
    expect(css).toMatch(/min-height\s*:\s*44px/);
    expect(css).not.toMatch(/!important/);
    expect(css).not.toMatch(/overflow-x\s*:\s*hidden/);
  });

  test("stacks the library and controls without giant mobile flex items", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
    expect(css).toMatch(/\.scenario-library-grid[\s\S]*grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.scenario-filter-control[\s\S]*width\s*:\s*100%/);
    expect(css).toMatch(/\.scenario-actions\s*>\s*button[\s\S]*flex\s*:\s*0\s+0\s+auto/);
  });

  test("keeps Scenario library content inside a standard card inset", () => {
    expect(remPaddingFor(".scenario-library-card")).toBeGreaterThanOrEqual(1);
    expect(blockFor(".scenario-library-card")).toMatch(/min-width\s*:\s*0/);
    expect(blockFor(".scenario-library-card.recommended")).toMatch(/border-color\s*:/);
    expect(blockFor(".scenario-library-card.highlighted:focus")).toMatch(/outline\s*:/);
    expect(css).not.toMatch(/(?:html|body|\.scenario-page)[^{]*\{[^}]*overflow-x\s*:\s*hidden/);
  });

  test("respects reduced motion for decorative and interactive movement", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/animation\s*:\s*none/);
    expect(css).toMatch(/transition\s*:\s*none/);
  });
});
