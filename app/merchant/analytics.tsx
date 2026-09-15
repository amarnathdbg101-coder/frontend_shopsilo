import React, { useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { useProfitReport, useProductMatrix } from "@/features/merchant/api/useAnalytics";
import { useRouter } from "expo-router";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  CircleDollarSign,
  Award,
  Clock,
  Sparkles,
  Tag,
} from "lucide-react-native";

export default function AnalyticsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [period, setPeriod] = useState<"day" | "week" | "month">("month");

  const { data: profit, isLoading: loadingProfit } = useProfitReport(period);
  const { data: matrix, isLoading: loadingMatrix } = useProductMatrix();

  const isProfitable = (profit?.net_profit ?? 0) >= 0;
  const bestProfitable = matrix?.best_profitable ?? [];
  const deadStock = matrix?.old_dead_stock ?? [];

  const isLoading = loadingProfit || loadingMatrix;

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.periodTabs}>
          {(["day", "week", "month"] as const).map((p) => (
            <Pressable
              key={p}
              accessibilityRole="button"
              onPress={() => setPeriod(p)}
              style={[
                styles.tab,
                {
                  backgroundColor: period === p ? colors.primary : colors.surface,
                  borderColor: period === p ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              <Text style={[styles.tabText, { color: period === p ? "#fff" : colors.text }]}>
                {p === "day" ? "Today" : p === "week" ? "This Week" : "This Month"}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading && !profit ? (
          <LoadingState message="Calculating Asli Munafa & Intelligence..." />
        ) : (
          <>
            {/* Real Pocket Profit Hero */}
            <View style={[styles.profitHero, { backgroundColor: isProfitable ? "#f0fdf4" : "#fef2f2", borderColor: isProfitable ? "#86efac" : "#fca5a5" }]}>
              <View style={styles.heroHeader}>
                <CircleDollarSign size={20} color={isProfitable ? "#16a34a" : "#dc2626"} />
                <Text style={[styles.heroSub, { color: isProfitable ? "#16a34a" : "#dc2626" }]}>
                  Asli Pocket Munafa (Net Profit)
                </Text>
              </View>

              <Text style={[styles.netProfitValue, { color: isProfitable ? "#16a34a" : "#dc2626" }]}>
                {formatCurrency(profit?.net_profit ?? 0)}
              </Text>

              <View style={styles.marginRow}>
                {isProfitable ? <ArrowUpRight size={16} color="#16a34a" /> : <ArrowDownRight size={16} color="#dc2626" />}
                <Text style={[styles.marginText, { color: isProfitable ? "#16a34a" : "#dc2626" }]}>
                  Margin: {profit?.profit_margin_percentage?.toFixed(1) ?? "0"}%
                </Text>
              </View>
            </View>

            {/* Formula P&L Breakdown */}
            <View style={[styles.breakdownCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.breakdownTitle, { color: colors.text }]}>HISAAB-KITAAB KA FORMULA</Text>

              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Kul Bikri (Gross Revenue)</Text>
                <Text style={[styles.rowVal, { color: colors.text }]}>+{formatCurrency(profit?.total_revenue ?? 0)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Maal Ki Kharid Cost (COGS)</Text>
                <Text style={[styles.rowVal, { color: "#dc2626" }]}>-{formatCurrency(profit?.total_cost ?? 0)}</Text>
              </View>

              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.textMuted }]}>Dukan Ke Roz Ke Kharche (Overheads)</Text>
                <Text style={[styles.rowVal, { color: "#dc2626" }]}>-{formatCurrency(profit?.total_expenses ?? 0)}</Text>
              </View>

              <View style={[styles.row, styles.totalRow, { borderTopColor: colors.surfaceBorder }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>Pocket Profit (Asal Bachat)</Text>
                <Text style={[styles.totalVal, { color: isProfitable ? "#16a34a" : "#dc2626" }]}>
                  {formatCurrency(profit?.net_profit ?? 0)}
                </Text>
              </View>
            </View>

            {/* Best Profitable Products */}
            {bestProfitable.length > 0 && (
              <View style={[styles.matrixCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <View style={styles.matrixHeader}>
                  <Award size={18} color="#f59e0b" />
                  <Text style={[styles.matrixTitle, { color: colors.text }]}>
                    SABSE ZYADA MUNAFA DENE WALE PRODUCTS
                  </Text>
                </View>

                {bestProfitable.slice(0, 5).map((item, idx) => (
                  <View
                    key={item.product_id || idx}
                    style={[styles.productRow, { borderBottomColor: colors.surfaceBorder }]}
                  >
                    <View style={styles.productLeft}>
                      <Text style={[styles.prodName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.prodSub, { color: colors.textMuted }]}>
                        {item.total_sold_qty} bika • Margin: {item.profit_margin_pct?.toFixed(0)}%
                      </Text>
                    </View>
                    <Text style={styles.profitBadge}>+{formatCurrency(item.total_profit)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Dead Stock & Fast Clearance */}
            {deadStock.length > 0 && (
              <View style={[styles.matrixCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <View style={styles.matrixHeader}>
                  <Clock size={18} color="#dc2626" />
                  <Text style={[styles.matrixTitle, { color: colors.text }]}>
                    DEAD STOCK (PURANA PADA MAAL)
                  </Text>
                </View>
                <Text style={[styles.deadStockHint, { color: colors.textMuted }]}>
                  In samano ko discount ya promotional offer lagakar counter se jaldi nikalne ki koshish karein.
                </Text>

                {deadStock.slice(0, 5).map((item, idx) => (
                  <View
                    key={item.product_id || idx}
                    style={[styles.productRow, { borderBottomColor: colors.surfaceBorder }]}
                  >
                    <View style={styles.productLeft}>
                      <Text style={[styles.prodName, { color: colors.text }]}>{item.name}</Text>
                      <Text style={[styles.prodSub, { color: colors.textMuted }]}>
                        Stock: {item.current_stock} pcs • {item.days_in_stock} dino se pada hai
                      </Text>
                    </View>

                    <Pressable
                      accessibilityRole="button"
                      onPress={() => router.push("/merchant/offers")}
                      style={styles.clearanceBtn}
                    >
                      <Tag size={12} color="#92400e" />
                      <Text style={styles.clearanceBtnText}>Offer Banayein</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 12, gap: 12 },
  periodTabs: { flexDirection: "row", gap: 8 },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabText: { fontSize: 12, fontWeight: "700" },
  profitHero: { borderRadius: 16, borderWidth: 1, padding: 18, alignItems: "center" },
  heroHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  heroSub: { fontSize: 13, fontWeight: "700" },
  netProfitValue: { fontSize: 32, fontWeight: "900", marginVertical: 4 },
  marginRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  marginText: { fontSize: 13, fontWeight: "700" },
  breakdownCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 10 },
  breakdownTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.5 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { fontSize: 13 },
  rowVal: { fontSize: 13, fontWeight: "700" },
  totalRow: { borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  totalLabel: { fontSize: 14, fontWeight: "800" },
  totalVal: { fontSize: 16, fontWeight: "900" },
  matrixCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  matrixHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  matrixTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  deadStockHint: { fontSize: 12, lineHeight: 16, marginBottom: 10 },
  productRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  productLeft: { flex: 1, marginRight: 8 },
  prodName: { fontSize: 13, fontWeight: "700" },
  prodSub: { fontSize: 11, marginTop: 2 },
  profitBadge: { fontSize: 13, fontWeight: "800", color: "#16a34a" },
  clearanceBtn: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  clearanceBtnText: { color: "#92400e", fontSize: 11, fontWeight: "700" },
});
