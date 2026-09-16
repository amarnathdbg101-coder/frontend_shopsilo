// Live Go Backend Base URL on Render
const LIVE_BACKEND_URL = "https://api.shopsilo.in";

export const Config = {
  // Prioritize process.env.EXPO_PUBLIC_API_URL for local LAN / development testing
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || LIVE_BACKEND_URL,

  // Timeout duration (in ms) for API requests
  API_TIMEOUT_MS: 20000,

  // Storage keys for persisting user and auth data
  STORAGE_KEYS: {
    ACCESS_TOKEN: "shopsilo_access_token",
    REFRESH_TOKEN: "shopsilo_refresh_token",
    USER_DATA: "shopsilo_user_data",
    THEME_MODE: "shopsilo_theme_mode",
  },
} as const;
