import i18n from "../i18n";

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";

function localizedApiError(result = {}, fallbackKey = "errors.fallback.generic") {
  if (result.code) {
    const key = `errors.codes.${result.code}`;
    const translated = i18n.t(key, { defaultValue: "" });
    if (translated && translated !== key) return translated;
  }

  if (result.message) return result.message;

  return i18n.t(fallbackKey, {
    defaultValue: i18n.t("errors.fallback.generic"),
  });
}

function apiFailure(data = {}, fallbackKey = "errors.fallback.generic", fallbackErrors = {}) {
  const result = {
    ok: false,
    code: data.code,
    message: data.message,
    errors: data.errors || fallbackErrors,
  };

  return {
    ...result,
    error: localizedApiError(result, fallbackKey),
  };
}

function networkFailure(fallbackKey = "errors.fallback.network", fallbackErrors = {}) {
  const result = {
    ok: false,
    code: "NETWORK_UNAVAILABLE",
    network: true,
    errors: fallbackErrors,
  };

  return {
    ...result,
    error: localizedApiError(result, fallbackKey),
  };
}

async function chatRequest(path, options = {}, fallbackKey) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return apiFailure(data, fallbackKey);
    return { ok: true, ...data };
  } catch (error) {
    if (error?.name === "AbortError") {
      return { ok: false, aborted: true, code: "REQUEST_ABORTED", error: "" };
    }
    return networkFailure(fallbackKey);
  }
}

export function listChatConversations(limit = 50, options = {}) {
  const safeLimit = Number.isFinite(Number(limit)) ? Number(limit) : 50;
  return chatRequest(
    `/api/chat/conversations?limit=${encodeURIComponent(safeLimit)}`,
    { method: "GET", signal: options.signal },
    "errors.fallback.loadChatConversations"
  );
}

export function createChatConversation(payload = {}, options = {}) {
  return chatRequest(
    "/api/chat/conversations",
    { method: "POST", body: JSON.stringify(payload), signal: options.signal },
    "errors.fallback.createChatConversation"
  );
}

export function getChatConversation(conversationId, options = {}) {
  return chatRequest(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}`,
    { method: "GET", signal: options.signal },
    "errors.fallback.loadChatMessages"
  );
}

export function renameChatConversation(conversationId, title, options = {}) {
  return chatRequest(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}`,
    { method: "PATCH", body: JSON.stringify({ title }), signal: options.signal },
    "errors.fallback.renameChatConversation"
  );
}

export function deleteChatConversation(conversationId, options = {}) {
  return chatRequest(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}`,
    { method: "DELETE", signal: options.signal },
    "errors.fallback.deleteChatConversation"
  );
}

export function createChatUserMessage(conversationId, payload = {}, options = {}) {
  return chatRequest(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    { method: "POST", body: JSON.stringify(payload), signal: options.signal },
    "errors.fallback.sendChatMessage"
  );
}

export function generateChatAssistantReply(conversationId, messageId, payload = {}, options = {}) {
  return chatRequest(
    `/api/chat/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/generate`,
    { method: "POST", body: JSON.stringify(payload), signal: options.signal },
    "errors.fallback.generateChatReply"
  );
}
