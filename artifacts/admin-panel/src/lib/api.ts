const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/").replace(/\/$/, "");

export function getApiBase() {
  return BASE;
}

export function setToken(token: string) {
  if (token && token !== "undefined" && token !== "null") {
    localStorage.setItem("token", token);
  }
}

export function clearToken() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getToken(): string | null {
  const t = localStorage.getItem("token");
  if (!t || t === "undefined" || t === "null") return null;
  return t;
}

async function request(path: string, opts: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export const api = {
  post: (path: string, body: unknown) => request(path, { method: "POST", body: JSON.stringify(body) }),
  get: (path: string) => request(path),
  put: (path: string, body: unknown) => request(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: (path: string) => request(path, { method: "DELETE" }),
};
