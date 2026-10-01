import fs from "fs";
import path from "path";

const cssPath = path.join(__dirname, "about.css");
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";

function blockFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return css.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`))?.[1] || "";
}

function remPaddingFor(selector) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blocks = [...css.matchAll(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "g"))];
  return Math.max(0, ...blocks.map(match => {
    const value = match[1].match(/padding\s*:\s*([\d.]+)rem(?:\s*;|\s)/)?.[1];
    return value ? Number(value) : 0;
  }));
}

describe("About CSS contract", () => {
  test("binds About to current neutral surface and text roles", () => {
    const page = blockFor(".cy-about-page");
    ["--surface-page", "--surface-raised", "--surface-subtle", "--text-primary", "--text-secondary", "--border-default"].forEach(role => {
      expect(page).toContain(`var(${role})`);
    });
    expect(blockFor(".cy-about-header")).toContain("background: var(--cyberly-surface-primary)");
    expect(blockFor(".cy-about-header")).toContain("var(--shadow-card)");
  });

  test("uses shared typography and restrained brand information roles", () => {
    expect(css).not.toMatch(/linear-gradient|cyberly-indigo|Space Grotesk/);
    expect(blockFor(".cy-about-avatar")).toContain("var(--surface-interactive)");
    expect(blockFor(".cy-about-agentic-note")).toContain("var(--cyberly-surface-secondary)");
  });

  test("keeps content and Back wrap-safe with a local mobile reading lane", () => {
    expect(blockFor(".cy-about-back")).toMatch(/white-space:\s*normal/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)[\s\S]*padding-inline-end:\s*var\(--about-reading-clearance\)/);
    expect(css).not.toMatch(/\.cy-about-page\s*\{[^}]*(?:padding-inline-end|width:\s*calc)/);
    expect(css).not.toMatch(/overflow(?:-x)?:\s*(?:hidden|clip)/);
  });

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

  test("keeps About content surfaces away from their boundaries", () => {
    [
      ".cy-about-capability-card",
      ".cy-about-team-card",
      ".cy-about-supervisor",
      ".cy-about-purpose",
    ].forEach(selector => {
      expect(remPaddingFor(selector)).toBeGreaterThanOrEqual(1);
    });
  });

  test("does not reset standard About surface padding to zero on mobile", () => {
    expect(css).not.toMatch(/@media\s*\(max-width:\s*40rem\)[\s\S]*?\.cy-about-(?:capability-card|team-card|supervisor|purpose)\s*\{[^}]*padding\s*:\s*0(?:\s|;)/);
  });
});
