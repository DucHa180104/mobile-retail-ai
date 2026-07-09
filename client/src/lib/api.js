const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "";
const AUTH_NOTICE_STORAGE_KEY = "mobile-retail-auth-notice";
export const AUTH_REDIRECT_EVENT = "mobile-retail-auth-redirect";

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

export function buildApiUrl(path = "") {
  if (!path) {
    return API_BASE_URL || "/";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  return API_BASE_URL ? `${API_BASE_URL}${normalizedPath}` : normalizedPath;
}

export function resolveMediaUrl(path = "") {
  if (!path || typeof path !== "string") {
    return "";
  }

  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (path.startsWith("/uploads/")) {
    return buildApiUrl(path);
  }

  return path;
}

let isGlobalFetchHandlerInstalled = false;
let lastAuthRedirectAt = 0;

export function installGlobalAuthFetchHandler() {
  if (typeof window === "undefined" || isGlobalFetchHandlerInstalled) {
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const authHeader = getAuthorizationHeader(input, init);

    if (authHeader) {
      const authMessage = await getAuthRedirectMessage(response);

      if (authMessage) {
        dispatchAuthRedirect(authMessage);
      }
    }

    return response;
  };

  isGlobalFetchHandlerInstalled = true;
}

export function consumeAuthNotice() {
  if (typeof window === "undefined") {
    return "";
  }

  const message = sessionStorage.getItem(AUTH_NOTICE_STORAGE_KEY) || "";
  sessionStorage.removeItem(AUTH_NOTICE_STORAGE_KEY);
  return message;
}

function dispatchAuthRedirect(message) {
  const now = Date.now();

  if (now - lastAuthRedirectAt < 1000) {
    return;
  }

  lastAuthRedirectAt = now;
  sessionStorage.setItem(AUTH_NOTICE_STORAGE_KEY, message);
  window.dispatchEvent(
    new CustomEvent(AUTH_REDIRECT_EVENT, {
      detail: { message }
    })
  );
}

function getAuthorizationHeader(input, init) {
  const headers = init?.headers || input?.headers;

  if (!headers) {
    return "";
  }

  if (headers instanceof Headers) {
    return headers.get("Authorization") || headers.get("authorization") || "";
  }

  if (Array.isArray(headers)) {
    const matchedHeader = headers.find(([key]) => String(key).toLowerCase() === "authorization");
    return matchedHeader?.[1] || "";
  }

  return headers.Authorization || headers.authorization || "";
}

async function getAuthRedirectMessage(response) {
  if (response.status === 401) {
    return "Phien dang nhap da het han. Vui long dang nhap lai.";
  }

  if (response.status !== 403) {
    return "";
  }

  try {
    const data = await response.clone().json();
    const message = String(data?.message || "").toLowerCase();

    if (message.includes("account has been disabled") || message.includes("tai khoan da bi khoa")) {
      return "Tai khoan cua ban da bi khoa. Vui long lien he quan tri vien.";
    }
  } catch {
    return "";
  }

  return "";
}
