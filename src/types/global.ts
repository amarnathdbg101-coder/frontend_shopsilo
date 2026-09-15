export type ThemeMode = "light" | "dark" | "system";

export interface AppNotification {
  id: string;
  type: "success" | "error" | "info" | "warning";
  message: string;
  timestamp: number;
}
