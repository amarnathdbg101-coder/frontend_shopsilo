import React, { ReactNode } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ChevronRight } from "lucide-react-native";

interface MerchantToolCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  onPress?: () => void;
  badgeText?: string;
  badgeColor?: string;
}

export const MerchantToolCard: React.FC<MerchantToolCardProps> = ({
  icon,
  title,
  description,
  onPress,
  badgeText,
  badgeColor = "#ef4444",
}) => {
  const { colors } = useThemeColor();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.iconContainer}>{icon}</View>
      <View style={styles.info}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {badgeText && (
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
              <Text style={styles.badgeText}>{badgeText}</Text>
            </View>
          )}
        </View>
        <Text style={[styles.desc, { color: colors.textMuted }]}>{description}</Text>
      </View>
      <ChevronRight size={18} color={colors.textMuted} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, borderWidth: 1, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.045, shadowRadius: 7, elevation: 1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  iconContainer: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(37, 99, 235, 0.08)", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 15, fontWeight: "800" },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 999 },
  badgeText: { fontSize: 10, fontWeight: "800", color: "#ffffff" },
  desc: { fontSize: 12, marginTop: 2 },
});
