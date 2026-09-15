import * as SecureStore from "expo-secure-store";
import { Config } from "@/constants/config";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export const SecureStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(Config.STORAGE_KEYS.ACCESS_TOKEN);
    } catch (error) {
      console.error("[SecureStorage] Failed to get access token:", error);
      return null;
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(Config.STORAGE_KEYS.REFRESH_TOKEN);
    } catch (error) {
      console.error("[SecureStorage] Failed to get refresh token:", error);
      return null;
    }
  },

  async setTokens(tokens: TokenPair): Promise<void> {
    if (!tokens || typeof tokens.accessToken !== "string" || !tokens.accessToken) {
      console.warn("[SecureStorage] Skip setting invalid access token:", tokens);
      return;
    }

    const access = String(tokens.accessToken);
    const refresh = typeof tokens.refreshToken === "string" && tokens.refreshToken ? String(tokens.refreshToken) : access;

    try {
      await Promise.all([
        SecureStore.setItemAsync(Config.STORAGE_KEYS.ACCESS_TOKEN, access),
        SecureStore.setItemAsync(Config.STORAGE_KEYS.REFRESH_TOKEN, refresh),
      ]);
    } catch (error) {
      console.error("[SecureStorage] Failed to set tokens:", error);
      throw error;
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(Config.STORAGE_KEYS.ACCESS_TOKEN),
        SecureStore.deleteItemAsync(Config.STORAGE_KEYS.REFRESH_TOKEN),
      ]);
    } catch (error) {
      console.error("[SecureStorage] Failed to clear tokens:", error);
    }
  },
};
