import { render } from "@testing-library/react";
import AssessmentCheckpointVisual from "./AssessmentCheckpointVisual";

describe("AssessmentCheckpointVisual", () => {
  test("stays decorative and contains the checkpoint visual vocabulary", () => {
    const { container } = render(<AssessmentCheckpointVisual />);
    const visual = container.querySelector(".assessment-checkpoint-visual");

    expect(visual).toBeInTheDocument();
    expect(visual.querySelector("svg")).toHaveAttribute("role", "presentation");
    expect(visual.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(visual.querySelector(".assessment-checkpoint-marker")).toBeInTheDocument();
    expect(visual.querySelector(".assessment-checkpoint-compass")).toBeInTheDocument();
    expect(visual.querySelector("button, a, input")).not.toBeInTheDocument();
  });
});
