export const ADMIN_SECTIONS = [
  {
    id: "resources",
    path: "/admin/resources",
    enabled: true,
    labelKey: "admin.navigation.resources",
    descriptionKey: "admin.navigation.resourcesDescription",
  },
  {
    id: "scenarios",
    path: "/admin/scenarios",
    enabled: false,
    labelKey: "admin.navigation.scenarios",
    descriptionKey: "admin.navigation.scenariosDescription",
  },
  {
    id: "assessments",
    path: "/admin/assessments",
    enabled: false,
    labelKey: "admin.navigation.assessments",
    descriptionKey: "admin.navigation.assessmentsDescription",
  },
  {
    id: "faq-guidance",
    path: "/admin/faq-guidance",
    enabled: false,
    labelKey: "admin.navigation.faqGuidance",
    descriptionKey: "admin.navigation.faqGuidanceDescription",
  },
  {
    id: "ai-agentic",
    path: "/admin/ai-agentic",
    enabled: false,
    labelKey: "admin.navigation.aiAgentic",
    descriptionKey: "admin.navigation.aiAgenticDescription",
  },
];

export function getAdminSectionFromHash(hashValue = typeof window !== "undefined" ? window.location.hash : "") {
  const normalized = String(hashValue || "").replace(/^#\/?/, "");
  const [, sectionId] = normalized.split("/");
  return ADMIN_SECTIONS.find(section => section.id === sectionId && section.enabled) || ADMIN_SECTIONS[0];
}

export function getAdminResourceEditorIdFromHash(hashValue = typeof window !== "undefined" ? window.location.hash : "") {
  const normalized = String(hashValue || "").replace(/^#\/?/, "");
  const [page, sectionId, resourceId, action] = normalized.split("/");
  if (page !== "admin" || sectionId !== "resources" || action !== "edit") return null;
  const numericId = Number(resourceId);
  return Number.isInteger(numericId) && numericId > 0 ? numericId : null;
}
