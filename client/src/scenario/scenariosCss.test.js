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
    expect(blockFor(".scenario-library-card.highlighted")).toMatch(/border-color\s*:/);
    expect(css).not.toMatch(/(?:html|body|\.scenario-page)[^{]*\{[^}]*overflow-x\s*:\s*hidden/);
  });

  test("respects reduced motion for decorative and interactive movement", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/animation\s*:\s*none/);
    expect(css).toMatch(/transition\s*:\s*none/);
  });
});
