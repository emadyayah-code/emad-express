import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface FavoriteProduct {
  id: number;
  name: string;
  name_ar?: string;
  name_en?: string;
  price: number;
  image: string;
  category_id?: number;
  description?: string;
  description_ar?: string;
  description_en?: string;
}

interface FavoritesCtx {
  favorites: FavoriteProduct[];
  isFavorite: (id: number) => boolean;
  toggleFavorite: (product: FavoriteProduct) => Promise<void>;
  removeFavorite: (id: number) => Promise<void>;
  clearFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesCtx>({} as FavoritesCtx);
export const useFavorites = () => useContext(FavoritesContext);

const STORAGE_KEY = "emad_user_favorites";

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteProduct[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        try {
          setFavorites(JSON.parse(data));
        } catch {}
      }
    });
  }, []);

  async function toggleFavorite(product: FavoriteProduct) {
    let next: FavoriteProduct[];
    const exists = favorites.some((f) => f.id === product.id);
    if (exists) {
      next = favorites.filter((f) => f.id !== product.id);
    } else {
      next = [product, ...favorites];
    }
    setFavorites(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function removeFavorite(id: number) {
    const next = favorites.filter((f) => f.id !== id);
    setFavorites(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }

  async function clearFavorites() {
    setFavorites([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  function isFavorite(id: number) {
    return favorites.some((f) => f.id === id);
  }

  return (
    <FavoritesContext.Provider value={{ favorites, isFavorite, toggleFavorite, removeFavorite, clearFavorites }}>
      {children}
    </FavoritesContext.Provider>
  );
}
