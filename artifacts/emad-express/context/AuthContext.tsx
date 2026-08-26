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
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || "فشل تسجيل الدخول"); }
    const data = await res.json();
    setUser(data.user);
    setToken(data.access_token);
    await AsyncStorage.multiSet([["user", JSON.stringify(data.user)], ["token", data.access_token]]);
  }

  async function register(name: string, email: string, phone: string, password: string) {
    const res = await fetch(`${BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password }),
    });
    if (!res.ok) { const e = await res.json(); throw new Error(e.message || "فشل إنشاء الحساب"); }
    const data = await res.json();
    setUser(data.user);
    setToken(data.access_token);
    await AsyncStorage.multiSet([["user", JSON.stringify(data.user)], ["token", data.access_token]]);
  }

  async function logout() {
    setUser(null);
    setToken(null);
    await AsyncStorage.multiRemove(["user", "token"]);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
