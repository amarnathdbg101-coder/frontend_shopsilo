import { create } from "zustand";
import { User } from "@/features/auth/types";
import { SecureStorage } from "@/utils/secure-storage";
import { Storage } from "@/utils/storage";
import { Config } from "@/constants/config";

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isHydrated: boolean;

  setAuth: (user: User, accessToken: string, refreshToken?: string) => Promise<void>;
  setAccessToken: (token: string) => void;
  setUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  hydrate: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isAuthenticated: false,
  isLoading: false,
  isHydrated: false,

  setAuth: async (user: User, accessToken: string, refreshToken?: string) => {
    await SecureStorage.setTokens({
      accessToken,
      refreshToken: refreshToken || accessToken,
    });
    await Storage.setItem(Config.STORAGE_KEYS.USER_DATA, user);

    set({
      user,
      accessToken,
      isAuthenticated: true,
    });
  },

  setAccessToken: (accessToken: string) => {
    set({ accessToken });
  },

  setUser: async (user: User) => {
    await Storage.setItem(Config.STORAGE_KEYS.USER_DATA, user);
    set({ user });
  },

  logout: async () => {
    await SecureStorage.clearTokens();
    await Storage.removeItem(Config.STORAGE_KEYS.USER_DATA);

    set({
      user: null,
      accessToken: null,
      isAuthenticated: false,
    });
  },

  hydrate: async () => {
    try {
      const [accessToken, user] = await Promise.all([
        SecureStorage.getAccessToken(),
        Storage.getItem<User>(Config.STORAGE_KEYS.USER_DATA),
      ]);

      if (accessToken && user) {
        set({
          user,
          accessToken,
          isAuthenticated: true,
          isHydrated: true,
        });
      } else {
        set({
          user: null,
          accessToken: null,
          isAuthenticated: false,
          isHydrated: true,
        });
      }
    } catch (error) {
      console.error("[useAuthStore] Hydration failed:", error);
      set({
        user: null,
        accessToken: null,
        isAuthenticated: false,
        isHydrated: true,
      });
    }
  },
}));
