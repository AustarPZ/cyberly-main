const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "cyberlyAurora.css");
const css = fs.readFileSync(cssPath, "utf8");

function readTokenValue(name) {
  const match = css.match(new RegExp(`${name}:\\s*([^;]+);`));
  return match ? match[1].trim() : "";
}

describe("Cyberly Aurora CSS tokens", () => {
  test("exposes shared semantic brand, surface, text, border, status, focus, and motion roles", () => {
    [
      "--cyberly-brand-primary",
      "--cyberly-brand-accent",
      "--cyberly-interactive-focus",
      "--cyberly-page-bg",
      "--cyberly-surface-primary",
      "--cyberly-surface-secondary",
      "--cyberly-text-primary",
      "--cyberly-text-secondary",
      "--cyberly-border-soft",
      "--cyberly-success",
      "--cyberly-warning",
      "--cyberly-danger",
      "--cyberly-focus-ring",
      "--cyberly-shadow-overlay",
      "--cyberly-motion-fast",
    ].forEach(tokenName => {
      expect(css).toContain(`${tokenName}:`);
    });

    expect(css).toMatch(/:root\s*{/);
  });

  test("defines approved Cyberly Aurora tokens once as CSS Custom Properties", () => {
    expect(css).toContain("--cyberly-indigo-600: #5356D9;");
    expect(css).toContain("--cyberly-mint-500: #25BFA2;");
    expect(css).toContain("--cyberly-coral-500: #FF6F61;");
    expect(css).toContain("--cyberly-gold-500: #F5B942;");
    expect(css).toContain("--cyberly-error: #D64550;");

    expect(css.match(/#5356D9/g)).toHaveLength(1);
    expect(css.match(/#25BFA2/g)).toHaveLength(1);
    expect(css.match(/#FF6F61/g)).toHaveLength(1);
    expect(css.match(/#F5B942/g)).toHaveLength(1);
    expect(css.match(/#D64550/g)).toHaveLength(1);
  });

  test("contains every approved CyberGuard pilot token name", () => {
    [
      "--cyberly-indigo-600",
      "--cyberly-mint-500",
      "--cyberly-coral-500",
      "--cyberly-gold-500",
      "--cyberly-page-bg",
      "--cyberly-surface-primary",
      "--cyberly-surface-secondary",
      "--cyberly-text-primary",
      "--cyberly-text-secondary",
      "--cyberly-border-soft",
      "--cyberly-success",
      "--cyberly-warning",
      "--cyberly-error",
      "--cyberly-info",
      "--cyberly-focus-ring",
      "--cyberly-radius-control",
      "--cyberly-radius-panel",
      "--cyberly-space-page-gutter",
      "--cyberly-chat-message-max",
      "--cyberly-chat-drawer-width",
      "--cyberly-motion-fast",
      "--cyberly-motion-panel",
    ].forEach(tokenName => {
      expect(css).toContain(`${tokenName}:`);
    });
  });

  test("keeps brand roles distinct from functional roles", () => {
    expect(readTokenValue("--cyberly-coral-500")).not.toBe(readTokenValue("--cyberly-error"));
    expect(readTokenValue("--cyberly-gold-500")).not.toBe(readTokenValue("--cyberly-warning"));
    expect(readTokenValue("--cyberly-indigo-600")).not.toBe(readTokenValue("--cyberly-info"));
  });
});
