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
  test("separates Assessment next step from the following section by at least 16px", () => {
    const rule = css.match(/(?:^|\})\s*\.assessment-page\s+\.scenario-result-recommendation\s*\{([^}]*)\}/);
    expect(rule).not.toBeNull();
    const declaration = rule[1].match(/margin-block-end:\s*([0-9]+(?:\.[0-9]+)?)(rem|px)\s*;/);
    expect(declaration).not.toBeNull();
    const pixels = Number(declaration[1]) * (declaration[2] === "rem" ? 16 : 1);
    expect(pixels).toBeGreaterThanOrEqual(16);
    // A global rule would alter Scenario Result and cannot satisfy this contract.
    expect(css).not.toMatch(/(?:^|\})\s*\.scenario-result-recommendation\s*\{/);
  });

});
