const ALLOWED_TYPES = new Set(["resource", "scenario", "progress", "assessment", "resources", "scenarios"]);
const ALLOWED_PAGES = new Set(["resources", "scenarios", "progress", "assessment"]);
const ALLOWED_SOURCE_PAGES = new Set(["resources"]);
const ALLOWED_TARGET_FIELDS = new Set([
  "page",
  "resourceId",
  "resourceSlug",
  "scenarioId",
  "scenarioSlug",
  "sectionId",
]);
const ALLOWED_SOURCE_TARGET_FIELDS = new Set(["page", "resourceId", "resourceSlug"]);

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

export function resolveChatSourceTarget(target = {}) {
  if (!target || typeof target !== "object" || !ALLOWED_SOURCE_PAGES.has(target.page)) return null;
  const safeTarget = {};
  Object.entries(target).forEach(([key, value]) => {
    if (ALLOWED_SOURCE_TARGET_FIELDS.has(key) && value !== undefined && value !== null && value !== "") {
      safeTarget[key] = value;
    }
  });
  return safeTarget.page ? safeTarget : null;
}

export function resolveSafeSourceUrl(sourceUrl = "") {
  if (!sourceUrl || typeof sourceUrl !== "string") return "";
  try {
    const parsed = new URL(sourceUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function normalizeSourceKeyPart(value = "") {
  return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
}

function getSourceDedupeKey(source = {}) {
  const resourceSlug = source.internalTarget?.resourceSlug;
  if (resourceSlug) return `resource:${normalizeSourceKeyPart(resourceSlug)}`;
  if (source.sourceUrl) return `url:${normalizeSourceKeyPart(source.sourceUrl)}`;
  const label = source.sourceLabel || source.sourceOrganisation || "";
  return [
    "title",
    normalizeSourceKeyPart(source.title),
    normalizeSourceKeyPart(label),
    normalizeSourceKeyPart(source.locale),
  ].join(":");
}

function getUsefulSnippet(source = {}) {
  return String(source.snippet || "").trim();
}

function choosePreferredSource(current, next) {
  if (!current) return next;
  if (next.citationOrder < current.citationOrder) return next;
  if (next.citationOrder > current.citationOrder) return current;
  const currentSnippet = getUsefulSnippet(current);
  const nextSnippet = getUsefulSnippet(next);
  if (nextSnippet && (!currentSnippet || nextSnippet.length < currentSnippet.length)) return next;
  return current.id <= next.id ? current : next;
}

export function dedupeChatSources(sources = []) {
  if (!Array.isArray(sources)) return [];
  const byKey = new Map();
  sources.forEach(source => {
    if (!source?.title || !source?.snippet) return;
    const key = getSourceDedupeKey(source);
    byKey.set(key, choosePreferredSource(byKey.get(key), source));
  });
  return Array.from(byKey.values()).sort((a, b) => {
    if (a.citationOrder !== b.citationOrder) return a.citationOrder - b.citationOrder;
    return a.id - b.id;
  });
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

export function mapServerSources(sources = []) {
  if (!Array.isArray(sources)) return [];
  const mappedSources = sources
    .map(source => {
      if (!source || !source.title || !source.snippet) return null;
      const internalTarget = resolveChatSourceTarget(source.internalTarget);
      return {
        id: Number(source.id),
        title: String(source.title || ""),
        sourceLabel: source.sourceLabel || "",
        sourceOrganisation: source.sourceOrganisation || "",
        sourceUrl: resolveSafeSourceUrl(source.sourceUrl || ""),
        locale: source.locale || "",
        snippet: String(source.snippet || ""),
        internalTarget,
        citationOrder: Number(source.citationOrder || 0),
      };
    })
    .filter(source => (
      source &&
      Number.isInteger(source.id) &&
      source.id > 0 &&
      source.title &&
      source.snippet
    ))
    .sort((a, b) => {
      if (a.citationOrder !== b.citationOrder) return a.citationOrder - b.citationOrder;
      return a.id - b.id;
    });
  return dedupeChatSources(mappedSources);
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

export function attachSourceGroupsToMessages(messages = [], sourceGroups = []) {
  if (!Array.isArray(messages) || !Array.isArray(sourceGroups)) return messages;
  const sourcesByMessageId = new Map();
  sourceGroups.forEach(group => {
    const messageId = Number(group?.messageId);
    if (!messageId) return;
    sourcesByMessageId.set(messageId, mapServerSources(group.sources || []));
  });

  return messages.map(message => {
    if (message.role !== "ai") return message;
    return {
      ...message,
      sources: sourcesByMessageId.get(Number(message.id)) || [],
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

export function withMessageSources(message, sources = []) {
  if (!message || message.role !== "ai") return message;
  return {
    ...message,
    sources: mapServerSources(sources),
  };
}

export function getScenarioActionSlug(target = {}, scenarios = []) {
  if (target.scenarioSlug) return target.scenarioSlug;
  if (!target.scenarioId) return null;
  const match = scenarios.find(scenario => Number(scenario.id) === Number(target.scenarioId));
  return match?.slug || null;
}
