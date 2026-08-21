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
});
