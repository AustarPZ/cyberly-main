import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "scenarios.css"), "utf8");

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

  test("respects reduced motion for decorative and interactive movement", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/animation\s*:\s*none/);
    expect(css).toMatch(/transition\s*:\s*none/);
  });
});
