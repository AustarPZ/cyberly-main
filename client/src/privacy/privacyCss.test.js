import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(__dirname, "privacy.css"), "utf8");

describe("Privacy Notice CSS contract", () => {
  test("uses self-contained responsive spacing without undefined token references", () => {
    expect(css).not.toMatch(/var\(--(?:space|radius)-/);
    expect(css).toMatch(/\.cy-privacy-document\s*\{[^}]*overflow-wrap:\s*anywhere;/s);
    expect(css).toMatch(/@media\s*\(max-width:\s*40rem\)/);
  });

  test("does not conceal document overflow globally", () => {
    expect(css).not.toMatch(/(?:html|body)[^{]*\{[^}]*overflow-x:\s*hidden/s);
  });
});
