const WINDOWS_RESERVED_NAMES = new Set([
  "con",
  "prn",
  "aux",
  "nul",
  "com1",
  "com2",
  "com3",
  "com4",
  "com5",
  "com6",
  "com7",
  "com8",
  "com9",
  "lpt1",
  "lpt2",
  "lpt3",
  "lpt4",
  "lpt5",
  "lpt6",
  "lpt7",
  "lpt8",
  "lpt9",
]);

const EXPORT_FORMATS = {
  markdown: {
    extension: "md",
    mimeType: "text/markdown;charset=utf-8",
  },
  text: {
    extension: "txt",
    mimeType: "text/plain;charset=utf-8",
  },
};

function textValue(value = "") {
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
}

function normalizeWhitespace(value = "") {
  return textValue(value)
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function stripHtml(value = "") {
  return normalizeWhitespace(value).replace(/<[^>]*>/g, "");
}

function stripMarkdown(value = "") {
  return stripHtml(value)
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)")
    .replace(/[*_~`]+/g, "")
    .replace(/^\s*[-*+]\s+/gm, "- ")
    .trim();
}

function safeUrl(value = "") {
  const raw = textValue(value).trim();
  if (!raw) return "";
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch {
    return "";
  }
}

function safeLabel(value = "") {
  return stripHtml(value).replace(/\s+/g, " ").trim();
}

function replaceFilenameUnsafeCharacters(value = "") {
  const unsafeCharacters = new Set(["<", ">", ":", "\"", "/", "\\", "|", "?", "*"]);
  return Array.from(value).map(char => {
    const code = char.charCodeAt(0);
    return code < 32 || unsafeCharacters.has(char) ? " " : char;
  }).join("");
}

export function hasExportableMessages(messages = []) {
  if (!Array.isArray(messages)) return false;
  return messages.some(message => {
    if (!message || message.role === "system") return false;
    return Boolean(normalizeWhitespace(message.content || message.text));
  });
}

export function buildConversationExportFilename({ title = "", format = "markdown" } = {}) {
  const exportFormat = EXPORT_FORMATS[format] ? format : "markdown";
  let slug = safeLabel(title)
    .toLowerCase()
    .replace(/[\s.]+/g, " ");
  slug = replaceFilenameUnsafeCharacters(slug)
    .replace(/[\s.]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");

  if (!slug || WINDOWS_RESERVED_NAMES.has(slug)) {
    slug = "conversation";
  }

  return `cyberguard-${slug}.${EXPORT_FORMATS[exportFormat].extension}`;
}

function formatExportTimestamp(exportedAt, locale = "en") {
  const date = exportedAt instanceof Date ? exportedAt : new Date(exportedAt || Date.now());
  try {
    return new Intl.DateTimeFormat(locale || "en", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return date.toISOString();
  }
}

function visibleMessages(messages = []) {
  return Array.isArray(messages)
    ? messages.filter(message => message && message.role !== "system")
    : [];
}

function messageContent(message = {}, format = "markdown") {
  const raw = message.content || message.text || "";
  return format === "text" ? stripMarkdown(raw) : stripHtml(raw);
}

function roleLabel(role) {
  return role === "ai" || role === "assistant" ? "CyberGuard" : "Learner";
}

function sourceLines(sources = [], format = "markdown") {
  if (!Array.isArray(sources) || sources.length === 0) return [];
  const lines = format === "markdown" ? ["", "**Sources**"] : ["", "Sources"];
  sources.forEach((source, index) => {
    const title = safeLabel(source.title) || "Source";
    const label = safeLabel(source.sourceLabel || source.sourceOrganisation);
    const snippet = safeLabel(source.snippet);
    const url = safeUrl(source.sourceUrl);
    const parts = [`${index + 1}. ${title}`];
    if (label) parts.push(`- ${label}`);
    if (snippet) parts.push(`- ${snippet}`);
    if (url) parts.push(`- ${url}`);
    lines.push(parts.join(" "));
  });
  return lines;
}

function proposalLines(proposal = null, format = "markdown") {
  if (!proposal || typeof proposal !== "object") return [];
  const title = safeLabel(proposal.title);
  const explanation = safeLabel(proposal.explanation);
  const consequence = safeLabel(proposal.consequence);
  if (!title && !explanation && !consequence) return [];

  const lines = format === "markdown" ? ["", "**Suggested action**"] : ["", "Suggested action"];
  if (title) lines.push(`- ${title}`);
  if (explanation) lines.push(`- ${explanation}`);
  if (consequence) lines.push(`- ${consequence}`);
  return lines;
}

function actionLines(actions = [], format = "markdown") {
  if (!Array.isArray(actions) || actions.length === 0) return [];
  const lines = format === "markdown" ? ["", "**Follow-up actions**"] : ["", "Follow-up actions"];
  actions.forEach(action => {
    const title = safeLabel(action.title);
    const description = safeLabel(action.description);
    if (!title && !description) return;
    lines.push(`- ${[title, description].filter(Boolean).join(" - ")}`);
  });
  return lines;
}

function failedGenerationLines(message = {}, generationByMessageId = {}, format = "markdown") {
  if (message.role !== "user") return [];
  const generation = generationByMessageId?.[message.id] || generationByMessageId?.[String(message.id)];
  if (generation?.status !== "failed") return [];
  const label = format === "markdown" ? "**CyberGuard**" : "CyberGuard";
  return ["", `${label}: [CyberGuard reply was unavailable.]`];
}

function markdownContent({ conversation, messages, exportedAt, locale, generationByMessageId }) {
  const title = safeLabel(conversation?.title) || "CyberGuard conversation";
  const lines = [
    "# CyberGuard Conversation Export",
    "",
    `Product: Cyberly`,
    `Conversation: ${title}`,
    `Exported: ${formatExportTimestamp(exportedAt, locale)}`,
    "",
    "## Messages",
  ];

  visibleMessages(messages).forEach(message => {
    const content = messageContent(message, "markdown");
    if (!content) return;
    lines.push("", `### ${roleLabel(message.role)}`, "", content);
    if (message.role === "ai" || message.role === "assistant") {
      lines.push(
        ...sourceLines(message.sources, "markdown"),
        ...proposalLines(message.proposal, "markdown"),
        ...actionLines(message.actions, "markdown")
      );
    }
    lines.push(...failedGenerationLines(message, generationByMessageId, "markdown"));
  });

  return `${lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim()}\n`;
}

function textContent({ conversation, messages, exportedAt, locale, generationByMessageId }) {
  const title = safeLabel(conversation?.title) || "CyberGuard conversation";
  const lines = [
    "CyberGuard Conversation Export",
    "",
    `Product: Cyberly`,
    `Conversation: ${title}`,
    `Exported: ${formatExportTimestamp(exportedAt, locale)}`,
    "",
    "Messages",
  ];

  visibleMessages(messages).forEach(message => {
    const content = messageContent(message, "text");
    if (!content) return;
    lines.push("", roleLabel(message.role), content);
    if (message.role === "ai" || message.role === "assistant") {
      lines.push(
        ...sourceLines(message.sources, "text"),
        ...proposalLines(message.proposal, "text"),
        ...actionLines(message.actions, "text")
      );
    }
    lines.push(...failedGenerationLines(message, generationByMessageId, "text"));
  });

  return `${lines.join("\n").replace(/\n{4,}/g, "\n\n\n").trim()}\n`;
}

export function buildConversationExport({
  conversation = null,
  messages = [],
  exportedAt = new Date(),
  format = "markdown",
  locale = "en",
  generationByMessageId = {},
} = {}) {
  const exportFormat = EXPORT_FORMATS[format] ? format : "markdown";
  const content = exportFormat === "text"
    ? textContent({ conversation, messages, exportedAt, locale, generationByMessageId })
    : markdownContent({ conversation, messages, exportedAt, locale, generationByMessageId });

  return {
    content,
    filename: buildConversationExportFilename({ title: conversation?.title, format: exportFormat }),
    mimeType: EXPORT_FORMATS[exportFormat].mimeType,
  };
}

export function downloadConversationExport({
  conversation = null,
  messages = [],
  exportedAt = new Date(),
  format = "markdown",
  locale = "en",
  generationByMessageId = {},
} = {}) {
  const exportResult = buildConversationExport({
    conversation,
    messages,
    exportedAt,
    format,
    locale,
    generationByMessageId,
  });
  const blob = new Blob([exportResult.content], { type: exportResult.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = exportResult.filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return exportResult;
}
