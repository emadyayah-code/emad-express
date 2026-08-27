import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const DOMAIN = process.env.EXPO_PUBLIC_DOMAIN || "emadexpress.ayadicmed.com";
const BASE = `https://${DOMAIN}/api`;

interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, phone: string, password: string) => Promise<void>;
  loginWithGoogle: (googleData: { email: string; password?: string; name?: string }) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.multiGet(["user", "token"]).then(([userItem, tokenItem]) => {
      if (userItem[1]) { try { setUser(JSON.parse(userItem[1])); } catch {} }
      if (tokenItem[1]) setToken(tokenItem[1]);
      setLoading(false);
    });
  }, []);

  async function login(email: string, password: string) {
    const res = await fetch(`${BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { throw new Error(data.message || "فشل تسجيل الدخول"); }
    const authToken = data.access_token || data.token;
    setUser(data.user);
    setToken(authToken);
    await AsyncStorage.multiSet([["user", JSON.stringify(data.user)], ["token", authToken]]);
  }

  async function loginWithGoogle(googleData: { email: string; password?: string; name?: string }) {
    const res = await fetch(`${BASE}/auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(googleData),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { throw new Error(data.message || "فشل تسجيل الدخول عبر Google"); }
    const authToken = data.access_token || data.token;
    setUser(data.user);
    setToken(authToken);
    if (authToken) {
      await AsyncStorage.multiSet([["user", JSON.stringify(data.user)], ["token", authToken]]);
    }
  }

  async function register(name: string, email: string, phone: string, password: string) {
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim(), password }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { throw new Error(data.message || "فشل إنشاء الحساب"); }
    const authToken = data.access_token || data.token;
    setUser(data.user);
    setToken(authToken);
    if (authToken) {
      await AsyncStorage.multiSet([["user", JSON.stringify(data.user)], ["token", authToken]]);
    }
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(["user", "token"]);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
