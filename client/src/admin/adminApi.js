const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function failure(data = {}, fallback = "Request failed.") {
  return {
    ok: false,
    error: data.message || data.code || fallback,
    code: data.code || null,
    errors: data.errors || {},
  };
}

function networkFailure() {
  return {
    ok: false,
    error: "Network error. Please try again.",
    code: null,
    errors: {},
  };
}

async function parseJson(response) {
  return response.json().catch(() => ({}));
}

export async function listAdminResources(filters = {}) {
  try {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null && String(value).trim() !== "") {
        params.set(key, value);
      }
    }
    const response = await fetch(`${API_BASE_URL}/api/admin/resources${params.toString() ? `?${params}` : ""}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await parseJson(response);
    if (!response.ok) return failure(data, "Unable to load resources.");
    return {
      ok: true,
      items: Array.isArray(data.items) ? data.items : [],
      pagination: data.pagination || {},
      summary: data.summary || {},
    };
  } catch {
    return networkFailure();
  }
}

export async function getAdminResource(resourceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/resources/${resourceId}`, {
      method: "GET",
      credentials: "include",
    });
    const data = await parseJson(response);
    if (!response.ok) return failure(data, "Unable to load resource.");
    return { ok: true, resource: data.resource };
  } catch {
    return networkFailure();
  }
}

export async function updateAdminResourceGovernance(resourceId, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/resources/${resourceId}/governance`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response);
    if (!response.ok) return failure(data, "Unable to save resource governance.");
    return {
      ok: true,
      resource: data.resource,
      automaticChanges: Array.isArray(data.automaticChanges) ? data.automaticChanges : [],
    };
  } catch {
    return networkFailure();
  }
}

export async function getAdminResourceContent(resourceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/resources/${resourceId}/content`, {
      method: "GET",
      credentials: "include",
    });
    const data = await parseJson(response);
    if (!response.ok) return failure(data, "Unable to load resource content.");
    return {
      ok: true,
      resource: data.resource,
      translations: data.translations || {},
    };
  } catch {
    return networkFailure();
  }
}

export async function updateAdminResourceContent(resourceId, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/resources/${resourceId}/content`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await parseJson(response);
    if (!response.ok) return failure(data, "Unable to save resource content.");
    return {
      ok: true,
      resource: data.resource,
      translation: data.translation,
      ragSync: data.ragSync || {},
    };
  } catch {
    return networkFailure();
  }
}
