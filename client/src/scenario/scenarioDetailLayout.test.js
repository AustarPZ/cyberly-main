const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "App.jsx");
const appSource = fs.readFileSync(appPath, "utf8");
const scenarioStylesPath = path.join(__dirname, "scenarios.css");
const scenarioStyles = fs.readFileSync(scenarioStylesPath, "utf8");

function ruleBody(source, selector, startAt = 0) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.slice(startAt).match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match ? match[1] : "";
}

describe("Scenario detail responsive layout", () => {
  test("keeps the detail layout in a shrink-safe content column", () => {
    const baseIndex = scenarioStyles.indexOf(".scenario-detail-layout {");
    const baseLayout = ruleBody(scenarioStyles, ".scenario-detail-layout", baseIndex);

    expect(baseIndex).toBeGreaterThan(-1);
    expect(baseLayout).toMatch(/grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
    expect(baseLayout).toMatch(/min-width\s*:\s*0/);
  });

  test("keeps scenario content shrink-safe without character-breaking overflow hacks", () => {
    expect(ruleBody(scenarioStyles, ".scenario-detail-main")).toMatch(/min-width\s*:\s*0/);
    expect(scenarioStyles).not.toMatch(/\.scenario-detail(?:-layout|-main)?[^}]*word-break\s*:\s*break-all/);
    expect(scenarioStyles).not.toMatch(/\.scenario-detail(?:-layout|-main)?[^}]*overflow\s*:\s*hidden/);
  });

  test("retains the accessible Start Practice action", () => {
    expect(appSource).toContain('onClick={() => startScenario(scenario.slug)}');
    expect(appSource).toContain('t("scenarios.intro.startPractice")');
  });
});
