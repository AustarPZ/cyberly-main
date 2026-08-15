import { render } from "@testing-library/react";
import DashboardExplorerVisual from "./DashboardExplorerVisual";

describe("DashboardExplorerVisual", () => {
  test("renders a decorative journey scene without semantic or interactive ownership", () => {
    const { container } = render(<DashboardExplorerVisual />);

    expect(container.querySelector(".dashboard-explorer-visual")).toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".dashboard-explorer-companion-zone")).toBeInTheDocument();
    expect(container.querySelector("h1, h2, main, button, a")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent(/CyberGuard|mascot|companion/i);
  });
});
