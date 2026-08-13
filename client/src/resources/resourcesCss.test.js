const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "resources.css"), "utf8");

describe("Resources responsive CSS contract", () => {
  test("supports a 320px viewport without concealing overflow defects", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*20rem\)/);
    expect(css).toMatch(/repeat\(auto-fit,\s*minmax\(min\(100%,/);
    expect(css).toContain("min-height: var(--cyberly-control-min-height)");
    expect(css).toContain("overflow-wrap: anywhere");
    expect(css).not.toMatch(/overflow-x:\s*hidden/);
    expect(css).not.toContain("!important");
  });

  test("preserves keyboard focus and reduced-motion behavior", () => {
    expect(css).toContain(":focus-visible");
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  });

  test("uses a bounded one-row mobile Topic rail without hiding document overflow", () => {
    expect(css).toContain(".resources-filter-region");
    expect(css).toContain(".resources-filter-scroll");
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
    expect(css).toMatch(/\.resources-filter-scroll\s*\{[^}]*flex-wrap:\s*nowrap/);
    expect(css).toMatch(/\.resources-filter-scroll\s*\{[^}]*overflow-x:\s*auto/);
    expect(css).toMatch(/\.resources-filter\s*\{[^}]*flex:\s*0\s+0\s+auto/);
    expect(css).toMatch(/\.resources-filter\s*\{[^}]*white-space:\s*nowrap/);
    expect(css).not.toMatch(/(?:html|body|\.resources-page)\s*\{[^}]*overflow-x:\s*hidden/);
  });
});
