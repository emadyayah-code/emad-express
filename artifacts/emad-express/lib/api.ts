import AsyncStorage from "@react-native-async-storage/async-storage";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "emadexpress.ayadicmed.com";
const BASE = `https://${DOMAIN}/api`;

export function getApiBase() {
  return BASE;
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem("token");
  } catch {
    return null;
  }
}

async function request(path: string, opts: RequestInit = {}, customToken?: string | null) {
  const token = customToken || (await getToken());
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((opts.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  const url = path.startsWith("http") ? path : `${BASE}${path.startsWith("/") ? path : `/${path}`}`;
  const res = await fetch(url, { ...opts, headers });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
    const error: any = new Error(err.message || `HTTP ${res.status}`);
    error.response = { data: err, status: res.status };
    throw error;
  }
  return res.json();
}

export const api = {
  post: (path: string, body?: unknown, token?: string | null) =>
    request(path, { method: "POST", body: body ? JSON.stringify(body) : undefined }, token),
  get: (path: string, token?: string | null) => request(path, { method: "GET" }, token),
  put: (path: string, body?: unknown, token?: string | null) =>
    request(path, { method: "PUT", body: body ? JSON.stringify(body) : undefined }, token),
  delete: (path: string, token?: string | null) => request(path, { method: "DELETE" }, token),
};
