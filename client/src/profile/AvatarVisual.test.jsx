import { render } from "@testing-library/react";
import AvatarVisual from "./AvatarVisual";
import { AVATAR_PRESET_IDS } from "./avatarModel";

describe("AvatarVisual", () => {
  test.each(AVATAR_PRESET_IDS)("renders the controlled %s variant as decorative artwork", presetId => {
    const { container } = render(<AvatarVisual presetId={presetId} />);
    const visual = container.querySelector(`.avatar-visual--${presetId}`);
    const svg = visual?.querySelector("svg");

    expect(visual).toBeInTheDocument();
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).not.toHaveAttribute("role");
    expect(svg?.querySelector("text")).not.toBeInTheDocument();
    expect(container.querySelector("img")).not.toBeInTheDocument();
  });

  test("renders nothing for an unknown or unsafe preset", () => {
    const { container, rerender } = render(<AvatarVisual presetId="https://example.test/avatar.png" />);
    expect(container).toBeEmptyDOMElement();

    rerender(<AvatarVisual presetId="data:image/svg+xml;base64,unsafe" />);
    expect(container).toBeEmptyDOMElement();
  });
});
