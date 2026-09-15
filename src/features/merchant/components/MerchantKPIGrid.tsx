import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ShopDailyDigest } from "@/features/shops/types";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { CreditCard, BookOpen, Boxes, AlertTriangle } from "lucide-react-native";

interface MerchantKPIGridProps {
  digest?: ShopDailyDigest;
  onPressTodaySales?: () => void;
  onPressKhata?: () => void;
  onPressPickups?: () => void;
  onPressAlerts?: () => void;
}

export const MerchantKPIGrid: React.FC<MerchantKPIGridProps> = ({
  digest,
  onPressTodaySales,
  onPressKhata,
  onPressPickups,
  onPressAlerts,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.grid}>
      <Pressable
        accessibilityRole="button"
        onPress={onPressTodaySales}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, pressed && styles.pressed]}
      >
        <View style={styles.cardHeader}>
          <CreditCard size={18} color="#16a34a" />
          <Text style={styles.badgeGreen}>Today</Text>
        </View>
        <Text style={[styles.val, { color: colors.text }]}>
          {formatCurrency(digest?.today_sales_amount ?? 0)}
        </Text>
        <Text style={[styles.lbl, { color: colors.textMuted }]}>
          {digest?.today_sales_count ?? 0} Sales Bills →
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPressKhata}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, pressed && styles.pressed]}
      >
        <View style={styles.cardHeader}>
          <BookOpen size={18} color="#dc2626" />
          <Text style={styles.badgeRed}>Market</Text>
        </View>
        <Text style={[styles.val, { color: colors.text }]}>
          {formatCurrency(digest?.total_khata_udhar ?? 0)}
        </Text>
        <Text style={[styles.lbl, { color: colors.textMuted }]}>
          {digest?.total_khata_customers ?? 0} Udhar Customers →
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPressPickups}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, pressed && styles.pressed]}
      >
        <View style={styles.cardHeader}>
          <Boxes size={18} color="#2563eb" />
          <Text style={styles.badgeBlue}>Catalog</Text>
        </View>
        <Text style={[styles.val, { color: colors.text }]}>
          Store Products
        </Text>
        <Text style={[styles.lbl, { color: colors.textMuted }]}>
          View & Edit Catalog →
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onPressAlerts}
        style={({ pressed }) => [styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }, pressed && styles.pressed]}
      >
        <View style={styles.cardHeader}>
          <AlertTriangle size={18} color="#f59e0b" />
          <Text style={styles.badgeAmber}>Alerts</Text>
        </View>
        <Text style={[styles.val, { color: colors.text }]}>
          {digest?.low_stock_count ?? 0}
        </Text>
        <Text style={[styles.lbl, { color: colors.textMuted }]}>
          Items Low on Stock →
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  card: { width: "48%", padding: 13, borderRadius: 14, borderWidth: 1, gap: 4, minHeight: 112, justifyContent: "space-between", shadowColor: "#0f172a", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 1 },
  pressed: { opacity: 0.82, transform: [{ scale: 0.985 }] },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  val: { fontSize: 16, fontWeight: "800", marginTop: 4 },
  lbl: { fontSize: 11, fontWeight: "600" },
  badgeGreen: { fontSize: 10, fontWeight: "700", color: "#16a34a", backgroundColor: "#dcfce7", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  badgeRed: { fontSize: 10, fontWeight: "700", color: "#dc2626", backgroundColor: "#fee2e2", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  badgeBlue: { fontSize: 10, fontWeight: "700", color: "#2563eb", backgroundColor: "#dbeafe", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
  badgeAmber: { fontSize: 10, fontWeight: "700", color: "#b45309", backgroundColor: "#fef3c7", paddingHorizontal: 5, paddingVertical: 2, borderRadius: 6 },
});
