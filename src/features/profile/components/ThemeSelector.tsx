import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Moon, Sun, Monitor } from "lucide-react-native";
import { ThemeMode } from "@/types/global";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ThemeSelectorProps {
  currentMode: ThemeMode;
  onSelectMode: (mode: ThemeMode) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentMode,
  onSelectMode,
}) => {
  const { colors, activeTheme } = useThemeColor();

  const themeOptions: { label: string; value: ThemeMode; icon: React.ReactNode }[] = [
    {
      label: "Light",
      value: "light",
      icon: (
        <Sun
          size={18}
          color={currentMode === "light" ? colors.primaryForeground : colors.text}
        />
      ),
    },
    {
      label: "Dark",
      value: "dark",
      icon: (
        <Moon
          size={18}
          color={currentMode === "dark" ? colors.primaryForeground : colors.text}
        />
      ),
    },
    {
      label: "System",
      value: "system",
      icon: (
        <Monitor
          size={18}
          color={currentMode === "system" ? colors.primaryForeground : colors.text}
        />
      ),
    },
  ];

  return (
    <View
      style={[
        styles.sectionCard,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
        Currently using {activeTheme} theme
      </Text>

      <View style={styles.themeSelector}>
        {themeOptions.map((option) => {
          const isSelected = currentMode === option.value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="button"
              onPress={() => onSelectMode(option.value)}
              style={[
                styles.themeButton,
                {
                  backgroundColor: isSelected ? colors.primary : "transparent",
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              {option.icon}
              <Text
                style={[
                  styles.themeButtonText,
                  {
                    color: isSelected
                      ? colors.primaryForeground
                      : colors.text,
                  },
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  themeSelector: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  themeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  themeButtonText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
