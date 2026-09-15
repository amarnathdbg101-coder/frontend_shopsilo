import { create } from "zustand";
import { Storage } from "@/utils/storage";
import { Shop } from "@/features/shops/types";

const STORAGE_KEY = "shopsilo_favorite_shops";

interface FavoriteShopsState {
  favoriteShops: Shop[];
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  toggleFavorite: (shop: Shop) => Promise<boolean>;
  isFavorite: (shopIdOrSlug: string) => boolean;
  removeFavorite: (shopId: string) => Promise<void>;
}

export const useFavoriteShopsStore = create<FavoriteShopsState>((set, get) => ({
  favoriteShops: [],
  isHydrated: false,

  hydrate: async () => {
    try {
      const stored = await Storage.getItem<Shop[]>(STORAGE_KEY);
      if (stored && Array.isArray(stored)) {
        set({ favoriteShops: stored, isHydrated: true });
        return;
      }
    } catch {
      // ignore
    }
    set({ isHydrated: true });
  },

  toggleFavorite: async (shop: Shop) => {
    const { favoriteShops } = get();
    const exists = favoriteShops.some(
      (s) => s.id === shop.id || (s.slug && shop.slug && s.slug === shop.slug)
    );
    let updated: Shop[];
    let nowFavorited: boolean;

    if (exists) {
      updated = favoriteShops.filter(
        (s) => s.id !== shop.id && s.slug !== shop.slug
      );
      nowFavorited = false;
    } else {
      updated = [shop, ...favoriteShops];
      nowFavorited = true;
    }

    set({ favoriteShops: updated });
    await Storage.setItem(STORAGE_KEY, updated).catch(() => {});
    return nowFavorited;
  },

  isFavorite: (shopIdOrSlug: string) => {
    if (!shopIdOrSlug) return false;
    return get().favoriteShops.some(
      (s) => s.id === shopIdOrSlug || s.slug === shopIdOrSlug
    );
  },

  removeFavorite: async (shopId: string) => {
    const updated = get().favoriteShops.filter((s) => s.id !== shopId);
    set({ favoriteShops: updated });
    await Storage.setItem(STORAGE_KEY, updated).catch(() => {});
  },
}));

useFavoriteShopsStore.getState().hydrate();

