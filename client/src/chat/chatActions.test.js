import {
  attachActionGroupsToMessages,
  getScenarioActionSlug,
  mapServerActions,
  resolveChatActionTarget,
} from "./chatActions";

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
