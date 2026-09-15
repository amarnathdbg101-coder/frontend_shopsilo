import React from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { TrendingUp, Tag } from "lucide-react-native";

interface ProductPricingSectionProps {
  price: string;
  setPrice: (v: string) => void;
  costPrice: string;
  setCostPrice: (v: string) => void;
  comparePrice: string;
  setComparePrice: (v: string) => void;
}

export const ProductPricingSection: React.FC<ProductPricingSectionProps> = ({
  price,
  setPrice,
  costPrice,
  setCostPrice,
  comparePrice,
  setComparePrice,
}) => {
  const { colors } = useThemeColor();

  const numPrice = parseFloat(price) || 0;
  const numCost = parseFloat(costPrice) || 0;
  const numMRP = parseFloat(comparePrice) || 0;

  const unitProfit = numPrice > 0 && numCost > 0 ? numPrice - numCost : null;
  const marginPct = unitProfit && numPrice > 0 ? Math.round((unitProfit / numPrice) * 100) : null;
  const discountPct = numMRP > numPrice && numMRP > 0 ? Math.round(((numMRP - numPrice) / numMRP) * 100) : null;

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Pricing & Asli Munafa</Text>

      <View style={styles.inputRow}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Selling Price (₹) *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 150"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            accessibilityLabel="Selling price in rupees"
            value={price}
            onChangeText={(text) => setPrice(text.replace(/[^0-9.]/g, ''))}
          />
        </View>

        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>MRP (₹)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 180"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            accessibilityLabel="MRP maximum retail price in rupees"
            value={comparePrice}
            onChangeText={(text) => setComparePrice(text.replace(/[^0-9.]/g, ''))}
          />
        </View>

        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Cost / Kharid (₹)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 120"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            accessibilityLabel="Cost or purchase price in rupees"
            value={costPrice}
            onChangeText={(text) => setCostPrice(text.replace(/[^0-9.]/g, ''))}
          />
        </View>
      </View>

      {unitProfit !== null && (
        <View style={[styles.badge, { backgroundColor: unitProfit >= 0 ? "#f0fdf4" : "#fef2f2" }]}>
          <TrendingUp size={14} color={unitProfit >= 0 ? "#16a34a" : "#dc2626"} />
          <Text style={[styles.badgeText, { color: unitProfit >= 0 ? "#16a34a" : "#dc2626" }]}>
            Munafa per piece: {formatCurrency(unitProfit)} ({marginPct}%)
          </Text>
        </View>
      )}

      {discountPct !== null && (
        <View style={[styles.badge, { backgroundColor: "rgba(37,99,235,0.08)", marginTop: 4 }]}>
          <Tag size={14} color="#2563eb" />
          <Text style={[styles.badgeText, { color: "#2563eb" }]}>
            Customer Discount: {discountPct}% OFF on MRP
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 4, backgroundColor: "rgba(99, 102, 241, 0.04)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(99, 102, 241, 0.14)", padding: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "900", marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8 },
  col: { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 14, fontWeight: "700" },
  badge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 8 },
  badgeText: { fontSize: 12, fontWeight: "700" },
});
