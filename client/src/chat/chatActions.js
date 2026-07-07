const ALLOWED_TYPES = new Set(["resource", "scenario", "progress", "assessment", "resources", "scenarios"]);
const ALLOWED_PAGES = new Set(["resources", "scenarios", "progress", "assessment"]);
const ALLOWED_TARGET_FIELDS = new Set([
  "page",
  "resourceId",
  "resourceSlug",
  "scenarioId",
  "scenarioSlug",
  "sectionId",
]);

export function resolveChatActionTarget(target = {}) {
  if (!target || typeof target !== "object" || !ALLOWED_PAGES.has(target.page)) return null;
  const safeTarget = {};
  Object.entries(target).forEach(([key, value]) => {
    if (ALLOWED_TARGET_FIELDS.has(key) && value !== undefined && value !== null && value !== "") {
      safeTarget[key] = value;
    }
  });
  return safeTarget.page ? safeTarget : null;
}

export function mapServerActions(actions = []) {
  if (!Array.isArray(actions)) return [];
  return actions
    .map(action => {
      if (!action || !ALLOWED_TYPES.has(action.type)) return null;
      const target = resolveChatActionTarget(action.target);
      if (!target) return null;
      return {
        id: Number(action.id),
        type: action.type,
        labelKey: action.labelKey || "chat.actions.continueLearning",
        title: action.title || "",
        description: action.description || "",
        target,
        displayOrder: Number(action.displayOrder || 0),
      };
    })
    .filter(action => action && Number.isInteger(action.id) && action.id > 0)
    .sort((a, b) => {
      if (a.displayOrder !== b.displayOrder) return a.displayOrder - b.displayOrder;
      return a.id - b.id;
    });
}

export function attachActionGroupsToMessages(messages = [], actionGroups = []) {
  if (!Array.isArray(messages) || !Array.isArray(actionGroups)) return messages;
  const actionsByMessageId = new Map();
  actionGroups.forEach(group => {
    const messageId = Number(group?.messageId);
    if (!messageId) return;
    actionsByMessageId.set(messageId, mapServerActions(group.actions || []));
  });

  return messages.map(message => {
    if (message.role !== "ai") return message;
    return {
      ...message,
      actions: actionsByMessageId.get(Number(message.id)) || [],
    };
  });
}

export function withMessageActions(message, actions = []) {
  if (!message || message.role !== "ai") return message;
  return {
    ...message,
    actions: mapServerActions(actions),
  };
}

export function getScenarioActionSlug(target = {}, scenarios = []) {
  if (target.scenarioSlug) return target.scenarioSlug;
  if (!target.scenarioId) return null;
  const match = scenarios.find(scenario => Number(scenario.id) === Number(target.scenarioId));
  return match?.slug || null;
}
