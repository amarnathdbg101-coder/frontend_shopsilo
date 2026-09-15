import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useAppStore } from "@/store/useAppStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ThemeMode } from "@/types/global";
import { Sun, Moon, Monitor } from "lucide-react-native";

export const DrawerThemeSelector: React.FC = () => {
  const { colors } = useThemeColor();
  const { themeMode, setThemeMode } = useAppStore();

  const options: { label: string; value: ThemeMode; icon: typeof Sun }[] = [
    { label: "Light", value: "light", icon: Sun },
    { label: "Dark", value: "dark", icon: Moon },
    { label: "System", value: "system", icon: Monitor },
  ];

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textMuted }]}>APPEARANCE</Text>
      <View style={[styles.pillTrack, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
        {options.map((opt) => {
          const isSelected = themeMode === opt.value;
          const IconComp = opt.icon;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setThemeMode(opt.value)}
              style={[
                styles.pillBtn,
                isSelected && { backgroundColor: colors.primary, shadowColor: colors.primary, elevation: 2 },
              ]}
            >
              <IconComp
                size={14}
                color={isSelected ? colors.primaryForeground : colors.textMuted}
              />
              <Text
                style={[
                  styles.pillText,
                  { color: isSelected ? colors.primaryForeground : colors.textMuted },
                ]}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  heading: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  pillTrack: { flexDirection: "row", borderRadius: 12, padding: 3, borderWidth: 1, gap: 2 },
  pillBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 7, borderRadius: 9 },
  pillText: { fontSize: 11, fontWeight: "700" },
});
