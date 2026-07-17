const API_BASE = import.meta.env.VITE_API_URL || "/api";

export type AuthTokens = { accessToken: string; refreshToken: string };

function getToken() {
  return localStorage.getItem("sahayak_access");
}

export function setTokens(tokens: AuthTokens) {
  localStorage.setItem("sahayak_access", tokens.accessToken);
  localStorage.setItem("sahayak_refresh", tokens.refreshToken);
}

export function clearTokens() {
  localStorage.removeItem("sahayak_access");
  localStorage.removeItem("sahayak_refresh");
}

export async function api<T>(
  path: string,
  options: RequestInit & { form?: FormData } = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!options.form && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: options.form || options.body,
  });

  if (res.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      headers.set("Authorization", `Bearer ${getToken()}`);
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers,
        body: options.form || options.body,
      });
      if (!retry.ok) throw new Error(await retry.text());
      return retry.json();
    }
  }

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const data = await res.json();
      msg = data.error || JSON.stringify(data);
    } catch {
      msg = await res.text();
    }
    throw new Error(msg || "Request failed");
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("application/json")) return res.json();
  return res as unknown as T;
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem("sahayak_refresh");
  if (!refreshToken) return false;
  const res = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) {
    clearTokens();
    return false;
  }
  const data = await res.json();
  localStorage.setItem("sahayak_access", data.accessToken);
  return true;
}
