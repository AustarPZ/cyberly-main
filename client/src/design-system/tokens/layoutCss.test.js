const fs = require("fs");
const path = require("path");

const cssPath = path.join(__dirname, "layout.css");

describe("Cyberly shared layout tokens", () => {
  test("defines responsive gutters, bounded widths, rhythm, controls, and layers", () => {
    const css = fs.readFileSync(cssPath, "utf8");

    [
      "--cyberly-page-gutter",
      "--cyberly-content-max",
      "--cyberly-reading-max",
      "--cyberly-workspace-max",
      "--cyberly-section-space",
      "--cyberly-control-min-height",
      "--cyberly-layer-nav",
      "--cyberly-layer-dialog",
    ].forEach(tokenName => {
      expect(css).toContain(`${tokenName}:`);
    });

    expect(css).toMatch(/--cyberly-page-gutter:\s*clamp\(/);
    expect(css).toMatch(/--cyberly-content-max:\s*(75rem|80rem|1200px|1280px)/);
  });
});
