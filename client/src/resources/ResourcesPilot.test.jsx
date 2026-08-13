import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import i18n from "../i18n";
import { restoreSession } from "../api/authApi";
import { listResources } from "../api/resourceApi";

jest.mock("react-markdown", () => ({
  __esModule: true,
  default: ({ children }) => <div>{children}</div>,
}));
jest.mock("remark-gfm", () => ({ __esModule: true, default: () => {} }));

jest.mock("../api/authApi", () => ({
  register: jest.fn(), login: jest.fn(), restoreSession: jest.fn(),
  refreshCurrentUser: jest.fn(), verifyEmail: jest.fn(),
  resendVerificationEmail: jest.fn(), logout: jest.fn(),
}));

jest.mock("../api/resourceApi", () => ({ listResources: jest.fn() }));

const resources = [
  {
    id: 1,
    slug: "spot-phishing",
    categoryCode: "Scams",
    title: "Spot phishing messages",
    summary: "Check urgency, sender details, and suspicious links.",
    content: ["Pause before opening a link.", "Verify through an official channel."],
    sourceLabel: "CyberSecurity Malaysia",
    sourceUrl: "https://example.test/phishing",
  },
  {
    id: 2,
    slug: "protect-privacy",
    categoryCode: "Privacy",
    title: "Protect personal information",
    summary: "Share less and review privacy settings.",
    content: ["Review what an app needs before sharing."],
    sourceLabel: "Official privacy guide",
    sourceUrl: "https://example.test/privacy",
  },
];

async function renderResources(result = { ok: true, data: { resources } }) {
  window.localStorage.clear();
  window.history.replaceState({}, "", "#/resources");
  await i18n.changeLanguage("en");
  restoreSession.mockResolvedValue({ ok: false, error: "Not authenticated" });
  listResources.mockResolvedValue(result);
  render(<App />);
  await waitFor(() => expect(listResources).toHaveBeenCalledWith({ locale: "en" }));
}

describe("Resources design foundation pilot", () => {
  beforeEach(() => {
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: false, media: query, addEventListener: jest.fn(), removeEventListener: jest.fn(),
      addListener: jest.fn(), removeListener: jest.fn(),
    }));
    window.scrollTo = jest.fn();
    Object.defineProperty(window, "scrollY", { configurable: true, value: 0 });
  });
  afterEach(() => jest.clearAllMocks());

  test("renders a compact contextual library with operable filters and resource cards", async () => {
    await renderResources();

    expect(await screen.findByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(document.querySelector(".resources-page .cy-context-header")).toBeInTheDocument();
    expect(document.querySelector(".resources-page .resources-legacy-hero")).not.toBeInTheDocument();

    const privacyFilter = screen.getByRole("button", { name: "Privacy & Personal Data Protection" });
    await userEvent.click(privacyFilter);
    expect(screen.queryByRole("button", { name: /Spot phishing messages/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Protect personal information/ })).toBeInTheDocument();
    expect(screen.getAllByText("Privacy & Personal Data Protection")).toHaveLength(2);
  });

  test("keeps the Resource Library behind an accessible detail dialog with a safe source link", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 480 });
    await renderResources();
    window.scrollTo.mockClear();
    await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeVisible();
    const dialog = screen.getByRole("dialog", { name: "Spot phishing messages" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("heading", { level: 2, name: "Spot phishing messages" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Close" })).toHaveFocus();
    expect(window.scrollY).toBe(480);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(screen.getByRole("link", { name: /Learn more/ })).toHaveAttribute("target", "_blank");
    expect(screen.getByRole("link", { name: /Learn more/ })).toHaveAttribute("rel", "noopener noreferrer");
  });

  test("Escape closes the dialog and restores the originating card without changing Library scroll", async () => {
    Object.defineProperty(window, "scrollY", { configurable: true, value: 360 });
    await renderResources();
    window.scrollTo.mockClear();
    const resourceCard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    await userEvent.click(resourceCard);
    await userEvent.keyboard("{Escape}");

    const restoredCard = await screen.findByRole("button", { name: /Spot phishing messages/ });
    await waitFor(() => expect(restoredCard).toHaveFocus());
    expect(window.scrollY).toBe(360);
    expect(window.scrollTo).not.toHaveBeenCalled();
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeInTheDocument();
  });

  test("opening and closing detail does not refetch, while locale changes still reload", async () => {
    await renderResources();
    await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));
    await userEvent.click(screen.getByRole("button", { name: "Close" }));
    await waitFor(() => expect(screen.getByRole("heading", { level: 1, name: "Cyber Wellness Resources" })).toBeInTheDocument());
    expect(listResources).toHaveBeenCalledTimes(1);

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Choose interface language" }), "ms");
    await waitFor(() => expect(listResources).toHaveBeenCalledWith({ locale: "ms" }));
    expect(listResources).toHaveBeenCalledTimes(2);
  });

  test("returns safely to the library when a localized catalogue no longer contains the selected Resource", async () => {
    await renderResources();
    await userEvent.click(await screen.findByRole("button", { name: /Spot phishing messages/ }));
    listResources.mockResolvedValue({ ok: true, data: { resources: [resources[1]] } });

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Choose interface language" }), "ms");

    const libraryHeading = await screen.findByRole("heading", { level: 1, name: "Sumber Kesihatan Siber" });
    await waitFor(() => expect(libraryHeading).toHaveFocus());
    expect(screen.queryByRole("heading", { level: 1, name: "Spot phishing messages" })).not.toBeInTheDocument();
    expect(listResources).toHaveBeenLastCalledWith({ locale: "ms" });
  });

  test("uses canonical PageState for loading, errors, and empty results", async () => {
    let resolveResources;
    const pending = new Promise(resolve => { resolveResources = resolve; });
    await renderResources(pending);
    expect(screen.getByRole("status")).toHaveClass("page-state", "loading");

    await act(async () => resolveResources({ ok: true, data: { resources: [] } }));
    await waitFor(() => expect(screen.getByRole("status")).toHaveClass("page-state", "empty"));
  });

  test("uses the canonical alert state when Resource loading fails", async () => {
    await renderResources({ ok: false, data: { message: "Unable to load resources." } });
    expect(await screen.findByRole("alert")).toHaveClass("page-state", "error");
  });
});
