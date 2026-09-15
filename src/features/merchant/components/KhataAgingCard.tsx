import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { KhataAgingReport } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { Clock } from "lucide-react-native";

interface KhataAgingCardProps {
  aging?: KhataAgingReport;
}

export const KhataAgingCard: React.FC<KhataAgingCardProps> = ({ aging }) => {
  const { colors } = useThemeColor();

  if (!aging) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.topRow}>
        <View style={styles.labelGroup}>
          <Clock size={16} color="#dc2626" />
          <Text style={[styles.headerTitle, { color: colors.text }]}>Udhar Aging Analysis</Text>
        </View>
        <Text style={[styles.totalOutstanding, { color: "#dc2626" }]}>
          {formatCurrency(aging.total_outstanding)}
        </Text>
      </View>

      <View style={styles.bucketsRow}>
        <View style={[styles.bucket, { backgroundColor: colors.surfaceBorder }]}>
          <Text style={[styles.bucketLabel, { color: colors.textMuted }]}>0-30 Days</Text>
          <Text style={[styles.bucketValue, { color: "#16a34a" }]}>
            {formatCurrency(aging.bucket_0_to_30)}
          </Text>
        </View>

        <View style={[styles.bucket, { backgroundColor: colors.surfaceBorder }]}>
          <Text style={[styles.bucketLabel, { color: colors.textMuted }]}>31-60 Days</Text>
          <Text style={[styles.bucketValue, { color: "#f59e0b" }]}>
            {formatCurrency(aging.bucket_31_to_60)}
          </Text>
        </View>

        <View style={[styles.bucket, { backgroundColor: colors.surfaceBorder }]}>
          <Text style={[styles.bucketLabel, { color: colors.textMuted }]}>60+ Days</Text>
          <Text style={[styles.bucketValue, { color: "#dc2626" }]}>
            {formatCurrency(aging.bucket_60_plus)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  labelGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerTitle: { fontSize: 13, fontWeight: "700" },
  totalOutstanding: { fontSize: 16, fontWeight: "800" },
  bucketsRow: { flexDirection: "row", gap: 8 },
  bucket: { flex: 1, padding: 8, borderRadius: 8, alignItems: "center" },
  bucketLabel: { fontSize: 10, fontWeight: "600", marginBottom: 2 },
  bucketValue: { fontSize: 13, fontWeight: "800" },
});
