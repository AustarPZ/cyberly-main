import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import i18n from "../i18n";
import { getResourceBySlug } from "../api/resourceApi";
import ResourceReaderPage from "./ResourceReaderPage";

jest.mock("../api/resourceApi", () => ({ getResourceBySlug: jest.fn() }));
const resource = { slug: "phishing", title: "Phishing guide", categoryCode: "Scams", summary: "Pause first", content: ["Check the sender", "Use a trusted channel"], sourceLabel: "Publisher", sourceUrl: "https://example.org/source", relatedScenario: { slug: "parcel" } };
const reply = (overrides = {}) => ({ ok: true, data: { resource: { ...resource, ...overrides } } });
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };
beforeEach(async () => { jest.clearAllMocks(); await i18n.changeLanguage("en"); getResourceBySlug.mockResolvedValue(reply()); });

test("detail owns content, heading focus, attribution and exact practice route without modal behavior", async () => {
  const onNavigate = jest.fn();
  render(<ResourceReaderPage slug="phishing" onNavigate={onNavigate} />);
  const heading = await screen.findByRole("heading", { level: 1, name: resource.title });
  expect(getResourceBySlug).toHaveBeenCalledWith("phishing", { locale: "en" });
  expect(heading).toHaveFocus();
  expect(screen.getByText(resource.summary)).toBeInTheDocument();
  expect(screen.getByText(resource.content[1])).toBeInTheDocument();
  expect(screen.getByText("Scams & Social Engineering")).toBeInTheDocument();
  expect(screen.getByText("Publisher")).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /View external source/i })).toHaveAttribute("rel", "noopener noreferrer");
  expect(screen.getByRole("link", { name: /View external source/i })).toHaveAttribute("target", "_blank");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  expect(document.body.style.overflow).not.toBe("hidden");
  await userEvent.click(screen.getByRole("link", { name: /Put the idea into practice/i }));
  expect(onNavigate).toHaveBeenCalledWith("#/scenarios/parcel");
  expect(screen.queryByText(/mark.*(read|complete)/i)).not.toBeInTheDocument();
});

test.each([null, "javascript:alert(1)"])("label without usable source URL has no external action (%s)", async sourceUrl => {
  getResourceBySlug.mockResolvedValue(reply({ sourceUrl, relatedScenario: null }));
  render(<ResourceReaderPage slug="phishing" />);
  expect(await screen.findByText("Publisher")).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /View external source/i })).not.toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /practice/i })).not.toBeInTheDocument();
});

test("missing attribution is omitted", async () => {
  getResourceBySlug.mockResolvedValue(reply({ sourceUrl: null, sourceLabel: null }));
  const { container } = render(<ResourceReaderPage slug="phishing" />);
  await screen.findByText(resource.title);
  expect(container.querySelector(".resources-source-row")).toBeNull();
});

test("loading, unavailable and malformed routes are truthful", async () => {
  const pending = deferred(); getResourceBySlug.mockReturnValue(pending.promise);
  const { rerender } = render(<ResourceReaderPage slug="phishing" />);
  expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
  await act(async () => pending.resolve({ ok: false, status: 404, data: { code: "RESOURCE_NOT_FOUND" } }));
  expect(await screen.findByText(/This guide is unavailable/i)).toBeInTheDocument();
  rerender(<ResourceReaderPage slug={null} />);
  expect(getResourceBySlug).toHaveBeenCalledTimes(1);
});

test.each(["network", "server"])("%s failure can retry same slug and locale", async kind => {
  if (kind === "network") getResourceBySlug.mockRejectedValueOnce(new Error("offline"));
  else getResourceBySlug.mockResolvedValueOnce({ ok: false, status: 500 });
  render(<ResourceReaderPage slug="phishing" />);
  await screen.findByRole("alert");
  await userEvent.click(screen.getByRole("button", { name: /retry/i }));
  await screen.findByText(resource.title);
  expect(getResourceBySlug).toHaveBeenLastCalledWith("phishing", { locale: "en" });
  expect(getResourceBySlug).toHaveBeenCalledTimes(2);
});

test("late old-slug and old-locale responses cannot replace current detail", async () => {
  const oldSlug = deferred(); const oldLocale = deferred();
  getResourceBySlug.mockReturnValueOnce(oldSlug.promise).mockReturnValueOnce(oldLocale.promise).mockResolvedValue(reply({ title: "Current translation" }));
  const { rerender } = render(<ResourceReaderPage slug="phishing" />);
  rerender(<ResourceReaderPage slug="privacy" />);
  await act(async () => i18n.changeLanguage("ms"));
  await screen.findByText("Current translation");
  await act(async () => { oldSlug.resolve(reply({ title: "Old slug" })); oldLocale.resolve(reply({ title: "Old locale" })); });
  expect(screen.queryByText("Old slug")).toBeNull(); expect(screen.queryByText("Old locale")).toBeNull();
  expect(getResourceBySlug).toHaveBeenLastCalledWith("privacy", { locale: "ms" });
});
