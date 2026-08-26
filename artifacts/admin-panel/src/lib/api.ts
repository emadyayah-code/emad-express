const BASE = `${import.meta.env.BASE_URL}api`.replace(/\/+/g, "/").replace(/\/$/, "");

export function getApiBase() {
  return BASE;
}

let authToken: string | null = localStorage.getItem("token");

export function setToken(token: string) {
  authToken = token;
  localStorage.setItem("token", token);
}
export function clearToken() {
  authToken = null;
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}
export function getToken() {
  return authToken;
}

async function request(path: string, opts: RequestInit = {}) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string> || {}),
  };
  if (authToken) headers["Authorization"] = `Bearer ${authToken}`;
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
