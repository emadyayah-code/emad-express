import React, { createContext, useContext, useState, useEffect } from "react";
import { api, setToken, clearToken } from "./api";

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface AuthCtx {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const u = sessionStorage.getItem("user");
      if (u) {
        const parsed = JSON.parse(u);
        if (parsed && parsed.role === "admin" && parsed.email === "ealakhly@gmail.com") {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  // Automatically wipe credentials from session whenever tab/window closes or unloads
  useEffect(() => {
    const handleUnload = () => {
      try {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      } catch {}
    };
    window.addEventListener("beforeunload", handleUnload);
    window.addEventListener("pagehide", handleUnload);
    return () => {
      window.removeEventListener("beforeunload", handleUnload);
      window.removeEventListener("pagehide", handleUnload);
    };
  }, []);

  async function login(email: string, password: string) {
    setLoading(true);
    try {
      const normalizedEmail = email.trim().toLowerCase();
      // Strictly allow only ealakhly@gmail.com to access the admin panel
      if (normalizedEmail !== "ealakhly@gmail.com" && normalizedEmail !== "admin@emadexpress.com") {
        throw new Error("عذراً، هذا البريد ليس للمدير العام. لوحة التحكم مخصصة للمدير العام فقط.");
      }

      const data = await api.post("/auth/login", { email: normalizedEmail, password });
      if (!data.user || data.user.role !== "admin" || data.user.email !== "ealakhly@gmail.com") {
        throw new Error("عذراً، هذا الحساب ليس لديه صلاحية الدخول للوحة التحكم. الدخول مقتصر على المدير العام فقط.");
      }

      const token = data.token || data.access_token;
      if (token) setToken(token);
      setUser(data.user);
      sessionStorage.setItem("user", JSON.stringify(data.user));
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearToken();
    setUser(null);
    try {
      sessionStorage.clear();
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch {}
    window.location.href = "/login";
  }

  return <AuthContext.Provider value={{ user, login, logout, loading }}>{children}</AuthContext.Provider>;
}
