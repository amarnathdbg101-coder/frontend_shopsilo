import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface SearchHistoryState {
  recentSearches: string[];
  addSearchTerm: (term: string) => void;
  removeSearchTerm: (term: string) => void;
  clearHistory: () => void;
}

export const useSearchHistoryStore = create<SearchHistoryState>()(
  persist(
    (set, get) => ({
      recentSearches: ["Tata Salt", "Aashirvaad Atta", "Fortune Oil", "Dettol Soap"],

      addSearchTerm: (term: string) => {
        const clean = term.trim();
        if (!clean || clean.length < 2) return;
        const current = get().recentSearches;
        const filtered = current.filter((t) => t.toLowerCase() !== clean.toLowerCase());
        const updated = [clean, ...filtered].slice(0, 8); // Keep top 8 recent searches
        set({ recentSearches: updated });
      },

      removeSearchTerm: (term: string) => {
        const filtered = get().recentSearches.filter((t) => t !== term);
        set({ recentSearches: filtered });
      },

      clearHistory: () => set({ recentSearches: [] }),
    }),
    {
      name: "shopsilo_recent_searches",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
