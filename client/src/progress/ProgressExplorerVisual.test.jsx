import { render } from "@testing-library/react";
import ProgressExplorerVisual from "./ProgressExplorerVisual";

describe("ProgressExplorerVisual", () => {
  test("renders a decorative mountain journey without semantic or interactive ownership", () => {
    const { container } = render(<ProgressExplorerVisual />);

    expect(container.querySelector(".progress-explorer-visual")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".progress-explorer-mountains")).toBeInTheDocument();
    expect(container.querySelector(".progress-explorer-path")).toBeInTheDocument();
    expect(container.querySelectorAll(".progress-explorer-milestone")).toHaveLength(3);
    expect(container.querySelector(".progress-explorer-destination")).toBeInTheDocument();
    expect(container.querySelector(".progress-explorer-companion-zone")).toBeInTheDocument();
    expect(container.querySelector("h1, h2, main, button, a")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/CyberGuard|mascot|companion/i);
  });
});
