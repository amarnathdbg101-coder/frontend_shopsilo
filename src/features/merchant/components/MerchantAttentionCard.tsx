import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, ChevronRight, PackageCheck } from "lucide-react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface MerchantAttentionCardProps {
  lowStockCount: number;
  activeReservations: number;
  onPress: () => void;
}

export const MerchantAttentionCard: React.FC<MerchantAttentionCardProps> = ({
  lowStockCount,
  activeReservations,
  onPress,
}) => {
  const { colors } = useThemeColor();
  const hasAttention = lowStockCount > 0 || activeReservations > 0;
  const Icon = hasAttention ? AlertTriangle : CheckCircle2;
  const accent = hasAttention ? "#b45309" : "#15803d";
  const background = hasAttention ? "#fffbeb" : "#f0fdf4";
  const border = hasAttention ? "#fde68a" : "#bbf7d0";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={hasAttention ? "View store tasks needing attention" : "View store status"}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: background, borderColor: border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: hasAttention ? "#fef3c7" : "#dcfce7" }]}>
        <Icon size={18} color={accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.text }]}> 
          {hasAttention ? "A few things need your attention" : "Your store is in good shape"}
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]} numberOfLines={2}>
          {hasAttention
            ? `${lowStockCount ? `${lowStockCount} low-stock item${lowStockCount === 1 ? "" : "s"}` : ""}${lowStockCount && activeReservations ? " • " : ""}${activeReservations ? `${activeReservations} pickup${activeReservations === 1 ? "" : "s"} pending` : ""}`
            : "No urgent inventory or pickup tasks right now."}
        </Text>
      </View>
      {hasAttention ? <PackageCheck size={18} color={accent} /> : <ChevronRight size={18} color={accent} />}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 14, borderWidth: 1, marginBottom: 18 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  iconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, gap: 2 },
  title: { fontSize: 13, fontWeight: "800" },
  description: { fontSize: 11, lineHeight: 16 },
});