const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "resources.css"), "utf8");

function extractMediaBlock(stylesheet, mediaPattern) {
  const match = stylesheet.match(mediaPattern);
  if (!match || match.index === undefined) return "";
  const openingBrace = stylesheet.indexOf("{", match.index + match[0].length);
  if (openingBrace === -1) return "";
  let depth = 0;
  for (let index = openingBrace; index < stylesheet.length; index += 1) {
    if (stylesheet[index] === "{") depth += 1;
    else if (stylesheet[index] === "}") {
      depth -= 1;
      if (depth === 0) return stylesheet.slice(openingBrace + 1, index);
    }
  }
  return "";
}

describe("Resources responsive CSS contract", () => {
  test("reader is centered with narrow measure, wrapping and no modal dependency", () => {
    expect(css).toMatch(/\.resources-reader\s*\{[^}]*max-width:\s*48rem[^}]*margin-inline:\s*auto/);
    expect(css).toMatch(/\.resources-source-link\s*\{[^}]*max-width:\s*100%[^}]*overflow-wrap:\s*anywhere/);
    expect(css).not.toContain("resources-dialog");
    expect(css).not.toMatch(/position:\s*fixed/);
  });
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

  test("uses a Resources-only one-row mobile metadata strip", () => {
    const mobileCss = extractMediaBlock(css, /@media\s*\(max-width:\s*40rem\)/);
    expect(mobileCss).toMatch(/\.resources-context-header\s+\.cy-context-header-metadata\s*\{[^}]*width:\s*100%[^}]*max-width:\s*100%[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/);
    expect(mobileCss).toMatch(/\.resources-context-header\s+\.cy-context-header-metadata\s*>\s*\.cy-badge\s*\{[^}]*flex:\s*0\s+0\s+auto[^}]*white-space:\s*nowrap/);
    expect(css).not.toMatch(/(?:^|\})\s*\.cy-context-header-metadata\s*\{[^}]*flex-wrap:\s*nowrap/);
    expect(css).not.toMatch(/(?:html|body|\.resources-page)\s*\{[^}]*overflow-x:\s*hidden/);
    expect(mobileCss).toMatch(/\.resources-filter-scroll\s*\{[^}]*flex-wrap:\s*nowrap[^}]*overflow-x:\s*auto/);
  });

  test("rejects mobile metadata rules that exist only outside the 40rem media block", () => {
    const misplacedCss = `
      .resources-context-header .cy-context-header-metadata { width: 100%; max-width: 100%; flex-wrap: nowrap; overflow-x: auto; }
      .resources-context-header .cy-context-header-metadata > .cy-badge { flex: 0 0 auto; white-space: nowrap; }
      @media (max-width: 40rem) { .resources-filter-scroll { flex-wrap: nowrap; overflow-x: auto; } }
    `;
    expect(misplacedCss).toMatch(/\.resources-context-header\s+\.cy-context-header-metadata\s*\{[^}]*flex-wrap:\s*nowrap/);
    const mobileCss = extractMediaBlock(misplacedCss, /@media\s*\(max-width:\s*40rem\)/);
    expect(mobileCss).not.toMatch(/\.resources-context-header\s+\.cy-context-header-metadata/);
    expect(mobileCss).toContain(".resources-filter-scroll");
  });
});
