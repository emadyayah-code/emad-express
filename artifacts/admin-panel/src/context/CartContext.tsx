import React, { createContext, useContext, useState, useEffect } from "react";

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
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("emad_store_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("emad_store_cart", JSON.stringify(items));
    } catch {}
  }, [items]);

  const addToCart = (product: any, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) => (i.id === product.id ? { ...i, quantity: i.quantity + qty } : i));
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

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal }}
    >
      {children}
    </CartContext.Provider>
  );
}
