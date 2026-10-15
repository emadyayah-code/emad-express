import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "./AuthContext";
import { api } from "@/lib/api";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image?: string;
  quantity: number;
  sku?: string;
  source_url?: string;
}

interface CartCtx {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
  total: number;
  count: number;
}

const CartContext = createContext<CartCtx>({} as CartCtx);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const isLoadedRef = useRef(false);
  const activeUserIdRef = useRef<number | null>(null);

  // Compute storage key based on active logged-in user
  const storageKey = user?.id ? `cart_user_${user.id}` : "cart_guest";

  // Effect to load cart whenever active account changes
  useEffect(() => {
    let isCancelled = false;
    isLoadedRef.current = false;
    activeUserIdRef.current = user?.id ?? null;

    async function loadAccountCart() {
      try {
        // 1. First try loading from local per-account storage
        const saved = await AsyncStorage.getItem(storageKey);
        let loadedItems: CartItem[] = [];
        if (saved) {
          try {
            loadedItems = JSON.parse(saved);
          } catch {}
        }

        // 2. If logged in with token, try syncing with account's server cart
        if (token && user?.id) {
          try {
            const serverRes = await api.get("/cart", token);
            if (serverRes?.items && Array.isArray(serverRes.items)) {
              // If server has items, use server cart as authority
              if (serverRes.items.length > 0) {
                loadedItems = serverRes.items;
              } else if (loadedItems.length > 0) {
                // If server cart was empty but local account cart has items, sync to server
                api.post("/cart", { items: loadedItems }, token).catch(() => {});
              }
            }
          } catch {}
        }

        if (!isCancelled) {
          setItems(Array.isArray(loadedItems) ? loadedItems : []);
          isLoadedRef.current = true;
        }
      } catch {
        if (!isCancelled) {
          setItems([]);
          isLoadedRef.current = true;
        }
      }
    }

    loadAccountCart();

    return () => {
      isCancelled = true;
    };
  }, [user?.id, token, storageKey]);

  // Effect to persist cart whenever items change for the current account
  useEffect(() => {
    if (!isLoadedRef.current) return;

    // Save to account-specific local storage immediately
    AsyncStorage.setItem(storageKey, JSON.stringify(items)).catch(() => {});

    // Debounce background server sync to keep UI completely lag-free
    if (token && user?.id) {
      const handler = setTimeout(() => {
        api.post("/cart", { items }, token).catch(() => {});
      }, 800);
      return () => clearTimeout(handler);
    }
  }, [items, storageKey, token, user?.id]);

  function addItem(item: Omit<CartItem, "quantity">) {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }

  function removeItem(id: number) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  function updateQuantity(id: number, qty: number) {
    if (qty <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
    );
  }

  function clearCart() {
    setItems([]);
    AsyncStorage.removeItem(storageKey).catch(() => {});
    if (token && user?.id) {
      api.delete("/cart", token).catch(() => {});
    }
  }

  const total = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0);
  const count = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, total, count }}
    >
      {children}
    </CartContext.Provider>
  );
}
