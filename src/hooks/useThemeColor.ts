import { useColorScheme } from "react-native";
import { Colors } from "@/constants/colors";
import { useAppStore } from "@/store/useAppStore";

export const useThemeColor = () => {
  const systemColorScheme = useColorScheme();
  const themeMode = useAppStore((state) => state.themeMode);

  const activeTheme =
    themeMode === "system"
      ? systemColorScheme === "dark"
        ? "dark"
        : "light"
      : themeMode;

  const isDark = activeTheme === "dark";
  const colors = Colors[activeTheme];

  return {
    colors,
    isDark,
    activeTheme,
  };
};
