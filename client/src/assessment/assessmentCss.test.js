const fs = require("fs");
const path = require("path");

const css = fs.readFileSync(path.join(__dirname, "assessment.css"), "utf8");

describe("Assessment responsive CSS contract", () => {
  test("keeps stacked mobile question actions compact and usable", () => {
    const mobileStart = css.indexOf("@media (max-width: 25rem)");
    const mobileCss = css.slice(mobileStart);

    expect(mobileStart).toBeGreaterThan(-1);
    expect(mobileCss).toMatch(
      /\.assessment-question-actions\s*>\s*button\s*\{[^}]*flex:\s*0\s+0\s+auto[^}]*width:\s*100%/
    );
    expect(css).not.toMatch(/(?:html|body|\.assessment-page)\s*\{[^}]*overflow-x:\s*hidden/);
  });
});
