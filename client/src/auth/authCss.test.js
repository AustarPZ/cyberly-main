import fs from "fs";
import path from "path";

const cssPath = path.join(__dirname, "auth.css");
const css = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, "utf8") : "";

describe("Auth route CSS contract", () => {
  test("owns Auth presentation through a token-based route namespace", () => {
    expect(fs.existsSync(cssPath)).toBe(true);
    expect(css).toMatch(/\.cy-auth-route\s*\{/);
    expect(css).toMatch(/var\(--cyberly-/);
    expect(css).not.toMatch(/(^|[}\s])(?:h[1-6]|button|body)\s*\{/m);
    expect(css).not.toMatch(/(^|[}\s])\.card(?:[\s:{.#]|$)/m);
    expect(css).not.toContain("!important");
  });

  test("supports shrink-safe scrolling layouts without masking page overflow", () => {
    expect(css).toMatch(/min-width:\s*0/);
    expect(css).toMatch(/max-width:\s*100%/);
    expect(css).toMatch(/overflow-wrap:\s*anywhere/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
    expect(css).not.toMatch(/(?:html|body|\.cy-auth-route)[^{]*\{[^}]*overflow-x:\s*hidden/);
    expect(css).not.toMatch(/(?:height|min-height):\s*100(?:d)?vh/);
  });

  test("provides a reduced-motion contract for progress presentation", () => {
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/\.cy-auth-progress-fill[^}]*transition:\s*none/);
  });

  test("keeps the Auth reading surface calm rather than decorative", () => {
    expect(css).not.toMatch(/(?:radial|linear)-gradient/);
    expect(css).not.toContain("var(--cyberly-indigo-600)");
  });

  test("scopes primary and secondary action emphasis to Auth", () => {
    expect(css).toMatch(/\.cy-auth-route\s+\.cy-button-primary\s*\{/);
    expect(css).toMatch(/\.cy-auth-route\s+\.cy-button-quiet\s*\{/);
    expect(css).toMatch(/\.cy-auth-switch\s+\.cy-button\s*\{[^}]*border:/);
  });

  test("protects wrapped action text and input sizing within the panel", () => {
    expect(css).toMatch(/\.cy-auth-panel\s+\.cy-button\s*\{[^}]*white-space:\s*normal/);
    expect(css).toMatch(/\.cy-auth-field\s+input\s*\{[^}]*box-sizing:\s*border-box/);
  });

  test("STG mobile Auth keeps normal shell width and existing panel and action layout", () => {
    const mobileRules = css.slice(css.indexOf("@media (max-width: 40rem)"));
    expect(mobileRules).not.toMatch(/\.cy-auth-shell\s*\{[^}]*padding-inline-end:/);
    expect(mobileRules).toMatch(/\.cy-auth-panel\s*\{\s*padding:\s*1\.1rem/);
    expect(mobileRules).toMatch(/\.cy-auth-actions\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/);
    expect(mobileRules).toMatch(/\.cy-auth-actions \.cy-button\s*\{[^}]*width:\s*100%/);
  });
});
