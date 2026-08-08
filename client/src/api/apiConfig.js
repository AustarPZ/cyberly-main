const DEVELOPMENT_API_BASE_URL = "http://localhost:5000";

export function normalizeApiBaseUrl(value = "") {
  return String(value || "").trim().replace(/\/+$/, "");
}

export function resolveApiBaseUrl(env = process.env) {
  const configuredBaseUrl = normalizeApiBaseUrl(env.REACT_APP_API_BASE_URL);

  if (env.NODE_ENV === "production") {
    let parsed;
    try {
      parsed = new URL(configuredBaseUrl);
    } catch {
      throw new Error("REACT_APP_API_BASE_URL must be a valid HTTPS API origin in production.");
    }

    if (
      parsed.protocol !== "https:" ||
      ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname.toLowerCase()) ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    ) {
      throw new Error("REACT_APP_API_BASE_URL must be a valid HTTPS API origin in production.");
    }
    return parsed.origin;
  }

  if (configuredBaseUrl) return configuredBaseUrl;

  return DEVELOPMENT_API_BASE_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
