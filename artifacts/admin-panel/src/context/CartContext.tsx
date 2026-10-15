import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { useCustomerAuth } from "./CustomerAuthContext";
import { getApiBase } from "@/lib/api";

export interface CartItem {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  price: number;
  image?: string;
  quantity: number;
  sku?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: any, qty?: number) => void;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, delta: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType>({} as CartContextType);
export const useCart = () => useContext(CartContext);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { customer, customerToken } = useCustomerAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const isLoadedRef = useRef(false);

  // Storage key is strictly isolated per customer account ID
  const storageKey = customer?.id
    ? `emad_store_cart_user_${customer.id}`
    : "emad_store_cart_guest";

  // Load account cart on initial mount or when customer changes (login / logout)
  useEffect(() => {
    let isCancelled = false;
    isLoadedRef.current = false;

    async function loadCart() {
      let loaded: CartItem[] = [];
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          loaded = JSON.parse(saved);
        }
      } catch {}

      // If logged in, also sync with server cart
      if (customerToken && customer?.id) {
        try {
          const res = await fetch(`${getApiBase()}/cart`, {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${customerToken}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.items && Array.isArray(data.items)) {
              if (data.items.length > 0) {
                loaded = data.items;
              } else if (loaded.length > 0) {
                // Sync local account items to server
                fetch(`${getApiBase()}/cart`, {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${customerToken}`,
                  },
                  body: JSON.stringify({ items: loaded }),
                }).catch(() => {});
              }
            }
          }
        } catch {}
      }

      if (!isCancelled) {
        setItems(Array.isArray(loaded) ? loaded : []);
        isLoadedRef.current = true;
      }
    }

    loadCart();

    return () => {
      isCancelled = true;
    };
  }, [customer?.id, customerToken, storageKey]);

  // Save cart whenever items change for the current account
  useEffect(() => {
    if (!isLoadedRef.current) return;

    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {}

    // If logged in, sync with server cart
    if (customerToken && customer?.id) {
      fetch(`${getApiBase()}/cart`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }
  }, [items, storageKey, customerToken, customer?.id]);

  const addToCart = (product: any, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + qty } : i
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name_ar || product.name || product.name_en || "منتج",
          name_ar: product.name_ar,
          name_en: product.name_en,
          price: Number(product.price) || 0,
          image: product.image,
          quantity: qty,
          sku: product.sku,
        },
      ];
    });
  };

  const removeFromCart = (id: number) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateQuantity = (id: number, delta: number) => {
    setItems((prev) =>
      prev
        .map((i) => {
          if (i.id === id) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const clearCart = () => {
    setItems([]);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    if (customerToken && customer?.id) {
      fetch(`${getApiBase()}/cart`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
      }).catch(() => {});
    }
  };

  const totalItems = items.reduce((sum, i) => sum + (Number(i.quantity) || 1), 0);
  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
