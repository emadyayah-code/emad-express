import React, { createContext, useContext, useState, useEffect } from "react";
import { getApiBase } from "@/lib/api";

export interface CustomerUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  customerToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<any>;
  register: (name: string, email: string, phone: string, password: string) => Promise<any>;
  logout: () => void;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  authModalTab: "login" | "register";
  setAuthModalTab: (tab: "login" | "register") => void;
  openLoginModal: () => void;
  openRegisterModal: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [customer, setCustomer] = useState<CustomerUser | null>(() => {
    try {
      const saved = localStorage.getItem("customer_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [customerToken, setCustomerToken] = useState<string | null>(() => {
    return localStorage.getItem("customer_token") || null;
  });

  const [loading, setLoading] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<"login" | "register">("login");

  const openLoginModal = () => {
    setAuthModalTab("login");
    setAuthModalOpen(true);
  };

  const openRegisterModal = () => {
    setAuthModalTab("register");
    setAuthModalOpen(true);
  };

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "فشل تسجيل الدخول. تحقق من البريد وكلمة المرور.");
      }

      const token = data.access_token || data.token;
      const user = data.user;

      setCustomer(user);
      setCustomerToken(token);
      localStorage.setItem("customer_user", JSON.stringify(user));
      localStorage.setItem("customer_token", token);
      setAuthModalOpen(false);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (name: string, email: string, phone: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          password,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "فشل إنشاء الحساب. قد يكون البريد مسجلاً مسبقاً.");
      }

      const token = data.access_token || data.token;
      const user = data.user;

      setCustomer(user);
      setCustomerToken(token);
      localStorage.setItem("customer_user", JSON.stringify(user));
      localStorage.setItem("customer_token", token);
      setAuthModalOpen(false);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setCustomer(null);
    setCustomerToken(null);
    localStorage.removeItem("customer_user");
    localStorage.removeItem("customer_token");
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        customerToken,
        loading,
        login,
        register,
        logout,
        authModalOpen,
        setAuthModalOpen,
        authModalTab,
        setAuthModalTab,
        openLoginModal,
        openRegisterModal,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) {
    throw new Error("useCustomerAuth must be used within a CustomerAuthProvider");
  }
  return ctx;
}
