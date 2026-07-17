import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminAiProvidersPage from "./AdminAiProvidersPage";
import { getAdminAiProviders, testAdminAiProvider } from "./adminApi";

jest.mock("./adminApi", () => ({
  getAdminAiProviders: jest.fn(),
  testAdminAiProvider: jest.fn(),
}));

jest.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key, options = {}) => options.defaultValue || key,
  }),
}));

const providerPayload = {
  providers: [
    {
      id: "openai",
      configured: true,
      model: "gpt-test",
      capabilities: { chat: true, structuredOutput: true, toolCalling: true, streaming: false, usageReporting: true },
      effectivePurposes: ["cyberguard_chat"],
    },
    {
      id: "gemini",
      configured: false,
      model: "gemini-test",
      capabilities: { chat: true, structuredOutput: true, toolCalling: true, streaming: false, usageReporting: true },
      effectivePurposes: [],
    },
    {
      id: "ilmu",
      configured: false,
      model: "nemo-test",
      capabilities: { chat: true, structuredOutput: false, toolCalling: true, streaming: false, usageReporting: true },
      effectivePurposes: ["agent_route_planning"],
    },
  ],
  defaultProvider: "openai",
  purposeAssignments: {
    cyberguard_chat: "openai",
    agent_route_planning: "ilmu",
    lightweight_tool_selection: "openai",
  },
};

describe("AdminAiProvidersPage", () => {
  beforeEach(() => {
    getAdminAiProviders.mockResolvedValue({ ok: true, ...providerPayload });
    testAdminAiProvider.mockResolvedValue({
      ok: true,
      result: { provider: "openai", status: "success", latencyMs: 42, textPreview: "OK", usage: { totalTokens: 5 } },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("loads provider metadata without automatically testing connections or rendering secrets", async () => {
    render(<AdminAiProvidersPage />);

    expect(await screen.findByText("admin.ai.providers.title")).toBeInTheDocument();
    expect(screen.getByText("OpenAI")).toBeInTheDocument();
    expect(screen.getByText("Gemini")).toBeInTheDocument();
    expect(screen.getByText("ILMU")).toBeInTheDocument();
    expect(screen.getByText("gpt-test")).toBeInTheDocument();
    expect(screen.getAllByText("admin.ai.providers.configured").length).toBeGreaterThan(0);
    expect(screen.getAllByText("admin.ai.providers.notConfigured").length).toBeGreaterThan(0);
    expect(JSON.stringify(document.body.textContent)).not.toContain("API_KEY");
    expect(testAdminAiProvider).not.toHaveBeenCalled();
  });

  test("runs one explicit provider test and prevents duplicate clicks while testing", async () => {
    render(<AdminAiProvidersPage />);

    await screen.findByText("OpenAI");
    const button = screen.getAllByRole("button", { name: "admin.ai.providers.testConnection" })[0];
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(testAdminAiProvider).toHaveBeenCalledTimes(1));
    expect(testAdminAiProvider).toHaveBeenCalledWith("openai");
    expect(await screen.findByText("admin.ai.providers.connectionSuccessful")).toBeInTheDocument();
    expect(screen.getByText(/42/)).toBeInTheDocument();
  });

  test("renders safe failure and read-only safety boundaries", async () => {
    testAdminAiProvider.mockResolvedValueOnce({
      ok: false,
      code: "AI_AUTH_FAILED",
      error: "AI_AUTH_FAILED (401)",
      status: 401,
    });
    render(<AdminAiProvidersPage />);

    await screen.findByText("OpenAI");
    fireEvent.click(screen.getAllByRole("button", { name: "admin.ai.providers.testConnection" })[0]);

    expect(await screen.findByText("admin.ai.providers.connectionFailed")).toBeInTheDocument();
    expect(screen.getByText("AI_AUTH_FAILED")).toBeInTheDocument();
    expect(screen.getByText("admin.ai.safety.readOnlyTools")).toBeInTheDocument();
    expect(screen.getByText("admin.ai.safety.backendControlled")).toBeInTheDocument();
    expect(screen.getByText("admin.ai.safety.learnerControlled")).toBeInTheDocument();
  });
});
