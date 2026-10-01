import fs from "fs";
import path from "path";

const cssPath = path.join(__dirname, "home.css");
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";

describe("Home route CSS contract", () => {
  test("owns the Home presentation through a route-scoped token-based stylesheet", () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(css).toMatch(/\.cy-home-page\s*\{/);
    expect(css).toMatch(/var\(--cyberly-/);
    expect(css).not.toMatch(/(^|[}\s])\.hero(?:[\s:{.#]|$)/m);
    expect(css).not.toMatch(/(^|[}\s])\.card(?:[\s:{.#]|$)/m);
    expect(css).not.toMatch(/(^|})\s*(?:h[1-6]|button|body)\s*\{/m);
  });

  test("provides shrink-safe responsive layouts without masking page overflow", () => {
    expect(css).toMatch(/minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/@media\s*\(max-width:\s*63\.9375rem\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*47\.9375rem\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*24\.3125rem\)/);
    expect(css).not.toMatch(/(?:html|body|\.cy-home-page)[^{]*\{[^}]*overflow-x:\s*hidden/);
  });

  test("contains no priority overrides or legacy hard-coded brand colors", () => {
    expect(css).not.toContain("!important");
    expect(css).not.toMatch(/#1a2e1a|#2d4a2d|#ff9800|#e65100|#fff8e1|#fff3e0|#ffe082/i);
  });

  test("binds Home to the current public surface roles without competing decorative brands", () => {
    expect(css).toMatch(/--cyberly-page-bg:\s*var\(--surface-page\)/);
    expect(css).not.toMatch(/var\(--cyberly-(?:indigo|coral|gold)-\d+\)/);
    expect(css).not.toMatch(/\.cy-home-awareness-band\s*\{[^}]*background:\s*var\(--cyberly-text-primary\)/);
  });

  test("owns a calm Hero and green primary emphasis locally", () => {
    expect(css).toMatch(/\.cy-home-hero\s*\{[^}]*background:\s*var\(--surface-raised\)/);
    expect(css).toMatch(/\.cy-home-page\s+\.cy-button-primary\s*\{[^}]*background:\s*var\(--color-brand-primary-hover\)/);
  });

  test("keeps controls wrap-safe with visible keyboard focus", () => {
    expect(css).toMatch(/\.cy-home-page\s+\.cy-button\s*\{[^}]*white-space:\s*normal/);
    expect(css).toMatch(/\.cy-home-page\s+\.cy-button:focus-visible\s*\{[^}]*outline:/);
  });

  test("uses normal content width with shared shell clearance and keeps reduced motion", () => {
    expect(css).not.toContain("--cy-home-content-clearance");
    expect(css).toContain("prefers-reduced-motion: reduce");
    expect(css).not.toMatch(/\.cy-home-page\s*\{[^}]*padding-inline-end:/);
  });
});
