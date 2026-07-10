import {
  attachActionGroupsToMessages,
  attachSourceGroupsToMessages,
  getScenarioActionSlug,
  mapServerActions,
  mapServerSources,
  dedupeChatSources,
  resolveChatActionTarget,
  resolveChatSourceTarget,
  resolveSafeSourceUrl,
} from "./chatActions";
import enLocale from "../i18n/locales/en.json";

test("resource and scenario taxonomy labels use aligned display names", () => {
  expect(enLocale.resources.categories.Safety).toBe("Online Safety & Digital Wellbeing");
  expect(enLocale.resources.categories.Beginner).toBe("Beginner / Digital Foundations");
  expect(enLocale.topics.misinformation_and_deepfakes).toBe("Misinformation, Media & AI Safety");
  expect(enLocale.resources.categories.UnknownResourceCategory || "UnknownResourceCategory").toBe("UnknownResourceCategory");
  expect(enLocale.topics.unknown_scenario_topic || "unknown_scenario_topic").toBe("unknown_scenario_topic");
});

test("attaches action groups only to matching assistant messages", () => {
  const messages = [
    { id: 1, role: "user", text: "Question" },
    { id: 2, role: "ai", text: "Answer" },
    { id: 3, role: "ai", text: "Other answer" },
  ];

  const result = attachActionGroupsToMessages(messages, [
    {
      messageId: 2,
      actions: [
        {
          id: 10,
          type: "resource",
          labelKey: "chat.actions.startResource",
          title: "Phishing",
          description: "Read this.",
          target: { page: "resources", resourceSlug: "phishing", url: "https://example.com" },
          displayOrder: 1,
        },
      ],
    },
    {
      messageId: 1,
      actions: [{ id: 11, type: "progress", labelKey: "chat.actions.viewProgress", target: { page: "progress" } }],
    },
    {
      messageId: 999,
      actions: [{ id: 12, type: "assessment", labelKey: "chat.actions.startAssessment", target: { page: "assessment" } }],
    },
  ]);

  expect(result[0].actions).toBeUndefined();
  expect(result[1].actions).toHaveLength(1);
  expect(result[1].actions[0].target).toEqual({ page: "resources", resourceSlug: "phishing" });
  expect(result[2].actions).toEqual([]);
});

test("maps flat generate actions and filters unsupported targets", () => {
  const actions = mapServerActions([
    { id: 1, type: "scenario", labelKey: "chat.actions.startScenario", target: { page: "scenarios", scenarioSlug: "safe-scenario" } },
    { id: 2, type: "external", labelKey: "chat.actions.bad", target: { page: "https://bad.example" } },
  ]);

  expect(actions).toEqual([
    {
      id: 1,
      type: "scenario",
      labelKey: "chat.actions.startScenario",
      title: "",
      description: "",
      target: { page: "scenarios", scenarioSlug: "safe-scenario" },
      displayOrder: 0,
    },
  ]);
});

test("uses safe fallback label and slug-first scenario lookup", () => {
  const actions = mapServerActions([
    { id: 3, type: "resources", target: { page: "resources" } },
  ]);

  expect(actions[0].labelKey).toBe("chat.actions.continueLearning");
  expect(getScenarioActionSlug(
    { scenarioSlug: "safe-scenario", scenarioId: 100 },
    [{ id: 100, slug: "filtered-or-stale-scenario" }]
  )).toBe("safe-scenario");
  expect(getScenarioActionSlug(
    { scenarioId: 100 },
    [{ id: 100, slug: "id-only-scenario" }]
  )).toBe("id-only-scenario");
});

test("resolves only supported internal action targets", () => {
  expect(resolveChatActionTarget({ page: "progress", sectionId: "progress-recommendation" })).toEqual({
    page: "progress",
    sectionId: "progress-recommendation",
  });
  expect(resolveChatActionTarget({ page: "resources", resourceSlug: "phishing", route: "/resources/phishing" })).toEqual({
    page: "resources",
    resourceSlug: "phishing",
  });
  expect(resolveChatActionTarget({ page: "https://example.com" })).toBeNull();
  expect(resolveChatActionTarget({ page: "resources", url: "https://example.com" })).toEqual({ page: "resources" });
});

test("attaches source groups only to matching assistant messages", () => {
  const messages = [
    { id: 1, role: "user", text: "Question" },
    { id: 2, role: "ai", text: "Answer" },
    { id: 3, role: "ai", text: "Other answer" },
  ];

  const result = attachSourceGroupsToMessages(messages, [
    {
      messageId: 2,
      sources: [
        {
          id: 20,
          messageId: 2,
          title: "Phishing",
          sourceLabel: "Cyberly Resource",
          sourceUrl: "https://example.com/source",
          locale: "en",
          snippet: "Phishing uses urgency.",
          internalTarget: { page: "resources", resourceSlug: "phishing", route: "/bad" },
          citationOrder: 1,
        },
      ],
    },
    {
      messageId: 1,
      sources: [{ id: 21, title: "Should not attach", snippet: "Nope", internalTarget: { page: "resources" } }],
    },
  ]);

  expect(result[0].sources).toBeUndefined();
  expect(result[1].sources).toHaveLength(1);
  expect(result[1].sources[0].internalTarget).toEqual({ page: "resources", resourceSlug: "phishing" });
  expect(result[2].sources).toEqual([]);
});

test("maps server sources and filters malformed entries while sanitizing targets", () => {
  const sources = mapServerSources([
    {
      id: 1,
      title: "Safe source",
      sourceOrganisation: "Cyberly",
      sourceUrl: "https://example.com/source",
      locale: "ms",
      snippet: "A safe citation.",
      internalTarget: { page: "resources", resourceId: 10, url: "https://bad.example" },
      citationOrder: 2,
    },
    { id: 2, title: "No snippet", internalTarget: { page: "resources" } },
    {
      id: 3,
      title: "External source",
      sourceUrl: "https://example.com/external",
      snippet: "External citation metadata is still useful.",
      internalTarget: { page: "progress" },
      citationOrder: 3,
    },
    {
      id: 4,
      title: "Unsafe URL",
      sourceUrl: "javascript:alert(1)",
      snippet: "The source remains readable, but the URL is removed.",
      citationOrder: 4,
    },
  ]);

  expect(sources).toEqual([
    {
      id: 1,
      title: "Safe source",
      sourceLabel: "",
      sourceOrganisation: "Cyberly",
      sourceUrl: "https://example.com/source",
      locale: "ms",
      snippet: "A safe citation.",
      internalTarget: { page: "resources", resourceId: 10 },
      citationOrder: 2,
    },
    {
      id: 3,
      title: "External source",
      sourceLabel: "",
      sourceOrganisation: "",
      sourceUrl: "https://example.com/external",
      locale: "",
      snippet: "External citation metadata is still useful.",
      internalTarget: null,
      citationOrder: 3,
    },
    {
      id: 4,
      title: "Unsafe URL",
      sourceLabel: "",
      sourceOrganisation: "",
      sourceUrl: "",
      locale: "",
      snippet: "The source remains readable, but the URL is removed.",
      internalTarget: null,
      citationOrder: 4,
    },
  ]);
});

test("resolves only supported internal source targets", () => {
  expect(resolveChatSourceTarget({ page: "resources", resourceSlug: "phishing", route: "/resources/phishing" })).toEqual({
    page: "resources",
    resourceSlug: "phishing",
  });
  expect(resolveChatSourceTarget({ page: "progress", sectionId: "progress-recommendation" })).toBeNull();
  expect(resolveChatSourceTarget({ page: "resources", url: "https://example.com" })).toEqual({ page: "resources" });
});

test("resolves only safe external source URLs", () => {
  expect(resolveSafeSourceUrl("https://example.com/source")).toBe("https://example.com/source");
  expect(resolveSafeSourceUrl("http://example.com/source")).toBe("http://example.com/source");
  expect(resolveSafeSourceUrl("javascript:alert(1)")).toBe("");
  expect(resolveSafeSourceUrl("not a url")).toBe("");
});

test("deduplicates sources by internal resource slug and keeps the shortest useful snippet", () => {
  const sources = mapServerSources([
    {
      id: 1,
      title: "Phishing",
      sourceLabel: "Cyber Security Agency of Singapore",
      locale: "en",
      snippet: "This is a longer repeated phishing snippet with extra wording.",
      internalTarget: { page: "resources", resourceSlug: "phishing" },
      citationOrder: 2,
    },
    {
      id: 2,
      title: "Phishing",
      sourceLabel: "Cyber Security Agency of Singapore",
      locale: "en",
      snippet: "Short phishing snippet.",
      internalTarget: { page: "resources", resourceSlug: "phishing" },
      citationOrder: 1,
    },
  ]);

  expect(sources).toHaveLength(1);
  expect(sources[0]).toMatchObject({
    id: 2,
    title: "Phishing",
    snippet: "Short phishing snippet.",
    citationOrder: 1,
    internalTarget: { page: "resources", resourceSlug: "phishing" },
  });
});

test("deduplicates sources by source URL when no resource slug is available", () => {
  const sources = dedupeChatSources([
    {
      id: 1,
      title: "Suspicious links",
      sourceLabel: "Official guide",
      sourceOrganisation: "",
      sourceUrl: "https://example.com/guide",
      locale: "en",
      snippet: "First snippet",
      internalTarget: null,
      citationOrder: 1,
    },
    {
      id: 2,
      title: "Suspicious links again",
      sourceLabel: "Official guide",
      sourceOrganisation: "",
      sourceUrl: "https://example.com/guide",
      locale: "en",
      snippet: "Second snippet",
      internalTarget: null,
      citationOrder: 2,
    },
  ]);

  expect(sources).toHaveLength(1);
  expect(sources[0].sourceUrl).toBe("https://example.com/guide");
});

test("deduplicates sources by normalized title, label, and locale fallback", () => {
  const sources = dedupeChatSources([
    {
      id: 1,
      title: "  Phishing Safety ",
      sourceLabel: "Cyberly Resource",
      sourceOrganisation: "",
      sourceUrl: "",
      locale: "ms",
      snippet: "Longer fallback duplicate snippet.",
      internalTarget: null,
      citationOrder: 2,
    },
    {
      id: 2,
      title: "phishing safety",
      sourceLabel: "Cyberly Resource",
      sourceOrganisation: "",
      sourceUrl: "",
      locale: "ms",
      snippet: "Short fallback.",
      internalTarget: null,
      citationOrder: 1,
    },
  ]);

  expect(sources).toHaveLength(1);
  expect(sources[0]).toMatchObject({
    id: 2,
    title: "phishing safety",
    snippet: "Short fallback.",
    citationOrder: 1,
  });
});
