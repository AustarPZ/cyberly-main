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
  test("I03 attempt has a two-zone task and an independent full-width feedback layer", () => {
    expect(ruleBody(scenarioStyles, ".scenario-page-attempt .scenario-step-card")).toMatch(/grid-template-columns:\s*minmax\(0,\s*0.9fr\) minmax\(0,\s*1.1fr\)/);
    expect(ruleBody(scenarioStyles, ".scenario-page-attempt .scenario-feedback")).toMatch(/scroll-margin-top:\s*calc\(var\(--nav-h\) \+ 1rem\)/);
    expect(ruleBody(scenarioStyles, ".scenario-page-attempt .scenario-choice:disabled")).toMatch(/opacity:\s*1/);
  });

  test("POLISH1 mobile removes whole-page reserved lanes while retaining desktop protection", () => {
    const mobile = scenarioStyles.lastIndexOf("@media (max-width: 40rem)");
    expect(ruleBody(scenarioStyles, ".scenario-page-library", mobile)).toMatch(/--scenario-library-safe-lane:\s*0rem/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro", mobile)).toMatch(/--scenario-intro-safe-lane:\s*0rem/);
    expect(ruleBody(scenarioStyles, ".scenario-page-library")).toMatch(/--scenario-library-safe-lane:\s*6rem/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro")).toMatch(/--scenario-intro-safe-lane:\s*6rem/);
  });

  test("POLISH1 Intro Back has a quiet 44px target with distinct hover and visible focus", () => {
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-intro-back")).toMatch(/min-height:\s*44px/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-intro-back:hover")).toMatch(/background:\s*var\(--color-brand-soft\)/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro :is(button, a):focus-visible")).toMatch(/outline:\s*3px solid/);
  });

  test("I02 Intro uses an editorial surface and quiet guidance without changing other Scenario modes", () => {
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-page-header")).toMatch(/background:\s*transparent/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-briefing")).toMatch(/border:\s*0/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-briefing")).toMatch(/box-shadow:\s*none/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-briefing-summary")).toMatch(/max-width:\s*60ch/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-briefing-notice")).toMatch(/background:\s*transparent/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-actions .cy-button-primary")).toMatch(/background:\s*var\(--color-brand-primary-hover\)/);
  });

  test("I02 keeps an Intro-only reading lane, visible focus and a small mobile supporting illustration", () => {
    expect(ruleBody(scenarioStyles, ".scenario-page-intro")).toMatch(/--scenario-intro-safe-lane:\s*6rem/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro :is(button, a):focus-visible")).toMatch(/outline:\s*3px solid/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-briefing:focus")).toMatch(/outline:\s*none/);
    const mobile = scenarioStyles.lastIndexOf("@media (max-width: 40rem)");
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-decision-visual", mobile)).toMatch(/max-height:\s*7rem/);
    expect(ruleBody(scenarioStyles, ".scenario-page-intro .scenario-actions", mobile)).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)/);
  });
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
