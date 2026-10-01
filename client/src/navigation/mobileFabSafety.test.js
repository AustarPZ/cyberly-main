import fs from "fs";
import path from "path";

const read = file => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

describe("STG mobile FAB safe lane", () => {
  test.each(["home/home", "about/about", "resources/resources", "assessment/assessment", "profile/profile", "dashboard/dashboard", "auth/auth"])("%s does not reserve horizontal space for the launcher", file => {
    const css = read(`${file}.css`);
    expect(css).not.toMatch(/--(?:cy-home-content|about-reading|resources-safe)-clearance/);
    expect(css).not.toMatch(/(?:padding|margin)-inline-end:\s*(?:calc\([^;]*\+\s*)?4(?:\.5)?rem/);
    expect(css).not.toMatch(/width:\s*calc\(100% - 4\.5rem\)/);
  });

  test("shared mobile end clearance includes launcher size, offset, gap and safe area", () => {
    const css = read("navigation/shell.css");
    expect(css).toMatch(/@media\s*\(max-width:\s*820px\)/);
    expect(css).toMatch(/\.cy-app-shell-with-floating\s*\{[^}]*padding-bottom:\s*calc\(52px \+ 1\.5rem \+ 1rem \+ env\(safe-area-inset-bottom, 0px\)\)/);
    expect(read("App.jsx")).toContain("bottom: calc(1.5rem + env(safe-area-inset-bottom, 0px))");
    expect(read("App.jsx")).toContain("right: calc(1.5rem + env(safe-area-inset-right, 0px))");
    expect(css).not.toMatch(/\.cy-app-shell[^{}]*\{[^}]*(?:padding-inline|margin-inline|overflow-x|width:)/);
  });

  test("preserves desktop launcher geometry and mobile full-screen companion", () => {
    const app = read("App.jsx");
    expect(app).toMatch(/\.chat-fab\s*\{\s*position: fixed; bottom: 1\.5rem; right: 1\.5rem;/);
    expect(app).toMatch(/@media \(max-width: 820px\)\s*\{\s*\.chat-panel\s*\{\s*inset: 0;\s*width: 100vw;\s*height: 100vh;\s*height: 100dvh;/);
  });
});
