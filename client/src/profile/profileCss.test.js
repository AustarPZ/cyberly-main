import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "profile.css"), "utf8");

describe("Learner Profile responsive CSS", () => {
  test("keeps Profile presentation scoped, readable and touch friendly", () => {
    expect(css).toMatch(/\.profile-page\s*\{/);
    expect(css).toMatch(/\.profile-form-control[\s\S]*min-height\s*:\s*44px/);
    expect(css).toMatch(/\.profile-topic-chip[\s\S]*min-height\s*:\s*44px/);
    expect(css).toMatch(/\.profile-topic-chip\[aria-pressed="true"\]/);
    expect(css).toMatch(/\.profile-page[\s\S]*:focus-visible/);
    expect(css).not.toMatch(/!important/);
    expect(css).not.toMatch(/overflow-x\s*:\s*hidden/);
  });

  test("uses bounded grids and stacks account and preference controls on small screens", () => {
    expect(css).toMatch(/\.profile-form-grid[\s\S]*grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    expect(css).toMatch(/\.profile-topic-grid[\s\S]*grid-template-columns\s*:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*12rem\),\s*1fr\)\)/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
    expect(css).toMatch(/\.profile-form-grid[\s\S]*grid-template-columns\s*:\s*minmax\(0,\s*1fr\)/);
    expect(css).toMatch(/\.profile-actions[\s\S]*flex-direction\s*:\s*column/);
  });

  test("keeps the avatar selector touch friendly, visibly selected and bounded to two mobile columns", () => {
    expect(css).toMatch(/\.profile-avatar-selector[\s\S]*border\s*:\s*0/);
    expect(css).toMatch(/\.profile-avatar-grid[\s\S]*grid-template-columns\s*:\s*repeat\(auto-fit,\s*minmax\(min\(100%,\s*8rem\),\s*1fr\)\)/);
    expect(css).toMatch(/\.profile-avatar-option[\s\S]*min-height\s*:\s*44px/);
    expect(css).toMatch(/\.profile-avatar-option:has\(input:checked\)/);
    expect(css).toMatch(/\.profile-avatar-selected/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)[\s\S]*\.profile-avatar-grid[\s\S]*grid-template-columns\s*:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
  });

  test("does not retain the legacy Profile gradient or introduce unbounded movement", () => {
    expect(css).not.toMatch(/linear-gradient/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/transition\s*:\s*none/);
  });

  test("keeps the Email Change secure operation scoped, touch friendly and responsive", () => {
    expect(css).toMatch(/\.profile-email-change\s*\{/);
    expect(css).toMatch(/\.profile-email-change[\s\S]*min-width\s*:\s*0/);
    expect(css).toMatch(/\.profile-email-change[\s\S]*\.cy-button[\s\S]*min-height\s*:\s*44px/);
    expect(css).toMatch(/\.profile-email-change[\s\S]*:focus-visible/);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)[\s\S]*\.profile-email-change[\s\S]*\.cy-button[\s\S]*width\s*:\s*100%/);
    expect(css).not.toMatch(/\.profile-email-change[^}]*overflow-x\s*:\s*hidden/);
  });
});
