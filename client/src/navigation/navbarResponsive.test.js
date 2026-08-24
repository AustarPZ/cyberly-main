import fs from "fs";
import path from "path";

const appSource = fs.readFileSync(path.join(__dirname, "..", "App.jsx"), "utf8");

describe("narrow mobile navbar contract", () => {
  test("reclaims horizontal space without clipping account access", () => {
    expect(appSource).toMatch(/@media\s*\(max-width:\s*360px\)/);
    expect(appSource).toMatch(/@media\s*\(max-width:\s*360px\)[\s\S]*?\.navbar\s*\{[^}]*gap:\s*0\.25rem;[^}]*padding:\s*0\s+0\.25rem;/);
    expect(appSource).toMatch(/@media\s*\(max-width:\s*360px\)[\s\S]*?\.navbar-logo\s*\{[^}]*height:\s*34px;/);
    expect(appSource).toMatch(/@media\s*\(max-width:\s*360px\)[\s\S]*?\.nav-utility\s*\{[^}]*gap:\s*0\.25rem;/);
    expect(appSource).toMatch(/@media\s*\(max-width:\s*360px\)[\s\S]*?\.account-trigger\s*\{[^}]*min-height:\s*44px;/);
    expect(appSource).not.toMatch(/@media\s*\(max-width:\s*360px\)[\s\S]*?\.navbar\s*\{[^}]*overflow-x:\s*hidden/);
  });

  test("keeps controlled preset artwork inside the existing compact avatar geometry", () => {
    expect(appSource).toMatch(/\.nav-avatar\s*\{[^}]*width:\s*30px;[^}]*height:\s*30px;/);
    expect(appSource).toMatch(/\.nav-avatar\s+\.avatar-visual\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/);
    expect(appSource).toMatch(/<AvatarVisual\s+presetId=\{avatarModel\.presetId\}/);
    expect(appSource).toMatch(/getInitialAvatarText/);
  });
});
