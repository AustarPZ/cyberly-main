import { render, screen } from "@testing-library/react";
import CyberGuardAiNotice from "./CyberGuardAiNotice";

describe("CyberGuardAiNotice", () => {
  const title = "AI-supported guidance";
  const description = "CyberGuard may make mistakes. Check important information with trusted sources or a trusted adult. Learner-controlled actions still require your confirmation.";

  test("renders persistent transparency copy as an informational aside", () => {
    render(<CyberGuardAiNotice title={title} description={description} />);

    const notice = screen.getByRole("complementary", { name: title });
    expect(notice.tagName).toBe("ASIDE");
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
    expect(notice).not.toHaveAttribute("role", "alert");
    expect(notice).not.toHaveAttribute("aria-live", "assertive");
  });

  test("uses deterministic labelled and described relationships", () => {
    render(<CyberGuardAiNotice title={title} description={description} />);

    const notice = screen.getByRole("complementary", { name: title });
    expect(notice).toHaveAttribute("aria-labelledby", "cyberguard-ai-notice-title");
    expect(notice).toHaveAttribute("aria-describedby", "cyberguard-ai-notice-description");
    expect(document.getElementById("cyberguard-ai-notice-title")).toHaveTextContent(title);
    expect(document.getElementById("cyberguard-ai-notice-description")).toHaveTextContent(description);
  });

  test("does not imply automatic learner-controlled actions", () => {
    render(<CyberGuardAiNotice title={title} description={description} />);

    expect(screen.queryByText(/automatically/i)).not.toBeInTheDocument();
    expect(screen.getByText(/require your confirmation/i)).toBeInTheDocument();
  });
});

