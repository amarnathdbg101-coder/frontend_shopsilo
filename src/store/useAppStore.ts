import { create } from "zustand";
import { ThemeMode } from "@/types/global";
import { Storage } from "@/utils/storage";
import { Config } from "@/constants/config";

interface AppState {
  themeMode: ThemeMode;
  isOnline: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  setIsOnline: (status: boolean) => void;
  initApp: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
  themeMode: "system",
  isOnline: true,

  setThemeMode: async (mode: ThemeMode) => {
    await Storage.setItem(Config.STORAGE_KEYS.THEME_MODE, mode);
    set({ themeMode: mode });
  },

  setIsOnline: (status: boolean) => {
    set({ isOnline: status });
  },

  initApp: async () => {
    try {
      const savedTheme = await Storage.getItem<ThemeMode>(
        Config.STORAGE_KEYS.THEME_MODE
      );
      if (savedTheme) {
        set({ themeMode: savedTheme });
      }
    } catch (error) {
      console.error("[useAppStore] Init failed:", error);
    }
  },
}));
