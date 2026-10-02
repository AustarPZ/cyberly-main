import fs from "fs";
import path from "path";
import postcss from "postcss";

// JSDOM does not evaluate viewport media queries. Apply only matching rules;
// final browser QA verifies their geometry with the full production cascade.
function layout(width) {
  const style = document.createElement("style");
  style.textContent = ["auth.css", "authExperience.css"].map(file => {
    const root = postcss.parse(fs.readFileSync(path.join(__dirname, file), "utf8"));
    root.walkAtRules("media", rule => {
      const max = rule.params.match(/max-width:\s*([\d.]+)(px|rem)/);
      if (!max || width > Number(max[1]) * (max[2] === "rem" ? 16 : 1)) rule.remove();
      else rule.replaceWith(...rule.nodes);
    });
    return root.toString();
  }).join("\n");
  document.head.appendChild(style);
  document.body.innerHTML = '<div class="cy-auth-experience"><aside class="cy-auth-brand"><div class="cy-auth-brand-intro"><img /></div></aside><div class="cy-auth-panel cy-auth-login"><div class="cy-auth-switch"><button class="cy-button cy-button-quiet">Create an account</button></div></div><div class="cy-auth-register"><div class="cy-auth-actions"><button class="cy-button cy-button-quiet">Back</button><button class="cy-button cy-button-primary">Continue</button></div></div></div>';
  return selector => getComputedStyle(document.querySelector(selector));
}

afterEach(() => { document.head.querySelectorAll("style").forEach(style => style.remove()); document.body.innerHTML = ""; });

test.each([1440, 1024])("desktop logo is larger and centered at %s", width => {
  const css = layout(width);
  expect(css(".cy-auth-brand").display).toBe("flex");
  expect(css(".cy-auth-brand").alignItems).toBe("center");
  expect(css(".cy-auth-brand").justifyContent).toBe("center");
  expect(css(".cy-auth-brand-intro").textAlign).toBe("center");
  expect(parseFloat(css(".cy-auth-brand img").width)).toBeGreaterThan(7);
});

test.each([1023, 390, 320])("mobile form uses the full single-column shell without brand at %s", width => {
  const css = layout(width);
  expect(css(".cy-auth-brand").display).toBe("none");
  expect(css(".cy-auth-experience").gridTemplateColumns).toBe("minmax(0, 1fr)");
  expect(css(".cy-auth-panel").width).toBe("100%");
});

test.each([1440, 390])("Login switch stays compact and quiet at %s", width => {
  const css = layout(width);
  expect(css(".cy-auth-switch").flexDirection).not.toBe("column");
  expect(css(".cy-auth-switch button").width).not.toBe("100%");
  expect(css(".cy-auth-switch button").backgroundColor).toBe("transparent");
  expect(css(".cy-auth-switch button").fontSize).toBe("0.85rem");
});

test("Signup primary sits at the opposite edge from Back, including when Back is absent", () => {
  const css = layout(1440);
  expect(css(".cy-auth-register .cy-button-primary").marginInlineStart).toBe("auto");
  document.querySelector(".cy-auth-register .cy-button-quiet").remove();
  expect(css(".cy-auth-register .cy-button-primary").marginInlineStart).toBe("auto");
});
