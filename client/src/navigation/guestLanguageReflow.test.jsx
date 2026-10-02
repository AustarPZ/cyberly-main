import { render, screen, cleanup } from "@testing-library/react";
import fs from "fs";
import path from "path";
import postcss from "postcss";
import GlobalNavigation from "./GlobalNavigation";
import "../i18n";

afterEach(() => { cleanup(); document.head.querySelectorAll("style").forEach(style => style.remove()); });

test.each([320, 390, 1024])("guest language selector can size to the full language label at %s", width => {
  window.matchMedia = jest.fn().mockReturnValue({ matches: true, addEventListener: jest.fn(), removeEventListener: jest.fn() });
  const css = postcss.parse(fs.readFileSync(path.join(__dirname, "shell.css"), "utf8"));
  css.walkAtRules("media", rule => {
    const max = rule.params.match(/max-width:\s*(\d+)px/);
    if (!max || width > Number(max[1])) rule.remove(); else rule.replaceWith(...rule.nodes);
  });
  const style = document.createElement("style"); style.textContent = css.toString(); document.head.appendChild(style);
  const language = <label className="nav-language">Language<select defaultValue="ms"><option value="ms">Bahasa Melayu</option></select></label>;
  const view = render(<GlobalNavigation user={null} page="login" languageControl={language} logo="logo.png" />);
  expect(getComputedStyle(screen.getByRole("combobox")).maxWidth).toBe("none");
  view.rerender(<GlobalNavigation user={{ id: 1, displayName: "Learner" }} page="dashboard" languageControl={language} logo="logo.png" />);
  if (width <= 600) expect(getComputedStyle(screen.getByRole("combobox")).maxWidth).toBe("76px");
});
