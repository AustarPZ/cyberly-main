import fs from "fs";
import path from "path";

const cssPath = path.join(__dirname, "about.css");
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";

describe("About CSS contract", () => {
  test("owns About presentation through a token-based namespace", () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(css).toMatch(/\.cy-about-page\s*\{/);
    expect(css).toMatch(/var\(--cyberly-/);
    expect(css).not.toMatch(/^\s*(?:h1|h2|button)\s*\{/m);
    expect(css).not.toMatch(/(^|[}\s])\.card(?:[\s:{.#]|$)/m);
    expect(css).not.toContain("!important");
  });

  test("provides bounded responsive layouts without masking overflow", () => {
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).toMatch(/minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
    expect(css).not.toMatch(/(?:html|body|\.cy-about-page)[^{]*\{[^}]*overflow-x:\s*hidden/);
    expect(css).not.toMatch(/(?:height|min-height):\s*100(?:d)?vh/);
  });

  test("stacks the team presentation safely on narrow screens", () => {
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)[\s\S]*\.cy-about-supervisor\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.cy-about-team-grid\s*\{[^}]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*[^)]+\),\s*1fr\)\)/);
  });
});
