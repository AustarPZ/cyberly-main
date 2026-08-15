import { render } from "@testing-library/react";
import ScenarioDecisionVisual from "./ScenarioDecisionVisual";

test("renders a decorative decision trail without controls or learner data", () => {
  const { container } = render(<ScenarioDecisionVisual />);
  const visual = container.querySelector(".scenario-decision-visual");

  expect(visual).toBeInTheDocument();
  expect(visual).toHaveAttribute("role", "presentation");
  expect(visual).toHaveAttribute("aria-hidden", "true");
  expect(visual.querySelector(".scenario-decision-route")).toBeInTheDocument();
  expect(visual.querySelector(".scenario-decision-signposts")).toBeInTheDocument();
  expect(visual.querySelector(".scenario-decision-device")).toBeInTheDocument();
  expect(visual.querySelector(".scenario-decision-shield")).toBeInTheDocument();
  expect(visual.querySelectorAll("button, a, input, text")).toHaveLength(0);
});
