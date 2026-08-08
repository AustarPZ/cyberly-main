const fs = require("fs");
const path = require("path");

const appPath = path.join(__dirname, "..", "App.jsx");
const appSource = fs.readFileSync(appPath, "utf8");

function ruleBody(source, selector, startAt = 0) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.slice(startAt).match(new RegExp(`${escaped}\\s*\\{([\\s\\S]*?)\\}`, "m"));
  return match ? match[1] : "";
}

describe("Scenario detail responsive layout", () => {
  test("keeps the desktop grid and overrides it with a shrink-safe mobile column", () => {
    const baseIndex = appSource.indexOf(".scenario-detail-layout {");
    const mobileIndex = appSource.indexOf("@media (max-width: 820px)", baseIndex);
    const baseLayout = ruleBody(appSource, ".scenario-detail-layout", baseIndex);
    const mobileLayout = ruleBody(appSource, ".scenario-detail-layout", mobileIndex);

    expect(baseIndex).toBeGreaterThan(-1);
    expect(mobileIndex).toBeGreaterThan(baseIndex);
    expect(baseLayout).toMatch(/grid-template-columns\s*:\s*minmax\(120px,\s*1fr\)\s+minmax\(0,\s*900px\)\s+minmax\(120px,\s*1fr\)/);
    expect(baseLayout).toMatch(/min-width\s*:\s*0/);
    expect(mobileLayout).toMatch(/grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
    expect(mobileLayout).toMatch(/width\s*:\s*100%/);
  });

  test("keeps scenario content shrink-safe without character-breaking overflow hacks", () => {
    expect(ruleBody(appSource, ".scenario-detail-main")).toMatch(/min-width\s*:\s*0/);
    expect(appSource).not.toMatch(/\.scenario-detail(?:-layout|-main)?[^}]*word-break\s*:\s*break-all/);
    expect(appSource).not.toMatch(/\.scenario-detail(?:-layout|-main)?[^}]*overflow\s*:\s*hidden/);
  });

  test("retains the accessible Start Practice action", () => {
    expect(appSource).toContain('className="btn-primary" onClick={() => startScenario(scenario.slug)}');
    expect(appSource).toContain('t("scenarios.intro.startPractice")');
  });
});
