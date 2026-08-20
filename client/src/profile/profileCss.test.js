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

  test("does not retain the legacy Profile gradient or introduce unbounded movement", () => {
    expect(css).not.toMatch(/linear-gradient/);
    expect(css).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(css).toMatch(/transition\s*:\s*none/);
  });
});
