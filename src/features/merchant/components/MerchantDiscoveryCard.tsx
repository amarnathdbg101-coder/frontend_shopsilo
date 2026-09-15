import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Sparkles, TrendingUp, Tag } from "lucide-react-native";

interface MerchantDiscoveryCardProps {
  weeklyOrders: number;
  khataCustomers: number;
  rating: number;
  reviewCount: number;
  topItemName?: string;
  topItemSold?: number;
  activeOffersCount: number;
}

export const MerchantDiscoveryCard: React.FC<MerchantDiscoveryCardProps> = ({
  weeklyOrders,
  khataCustomers,
  rating,
  reviewCount,
  topItemName,
  topItemSold,
  activeOffersCount,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  return (
    <View style={[styles.discoveryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.discoveryHeader}>
        <View style={styles.discoveryTitleRow}>
          <Sparkles size={16} color="#eab308" />
          <Text style={[styles.discoveryTitle, { color: colors.text }]}>
            Customer Discovery & Footfall
          </Text>
        </View>
        <View style={styles.liveBadgeRow}>
          <View style={styles.livePulseDot} />
          <Text style={styles.discoveryBadge}>Real-Time Telemetry</Text>
        </View>
      </View>

      <View style={styles.discoveryGrid}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/merchant/pos")}
          style={({ pressed }) => [styles.statBox, { backgroundColor: colors.background }, pressed && styles.pressed]}
        >
          <Text style={[styles.statVal, { color: colors.primary }]}>{weeklyOrders}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Counter Buyers</Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>This week</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/merchant/khata")}
          style={({ pressed }) => [styles.statBox, { backgroundColor: colors.background }, pressed && styles.pressed]}
        >
          <Text style={[styles.statVal, { color: "#10b981" }]}>{khataCustomers}</Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Khata Active</Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>Customers</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/merchant/settings")}
          style={({ pressed }) => [styles.statBox, { backgroundColor: colors.background }, pressed && styles.pressed]}
        >
          <Text style={[styles.statVal, { color: "#f59e0b" }]}>
            {rating > 0 ? rating.toFixed(1) : "New"}
          </Text>
          <Text style={[styles.statLabel, { color: colors.text }]}>Customer Rating</Text>
          <Text style={[styles.statSub, { color: colors.textMuted }]}>
            {reviewCount > 0 ? `${reviewCount} review${reviewCount > 1 ? "s" : ""}` : "Verified store"}
          </Text>
        </Pressable>
      </View>

      <View style={[styles.discoveryFooter, { borderTopColor: colors.surfaceBorder }]}>
        {topItemName ? (
          <>
            <TrendingUp size={13} color="#10b981" />
            <Text numberOfLines={1} style={[styles.discoveryFooterText, { color: colors.textMuted }]}>
              Top Discovered: <Text style={{ color: colors.text, fontWeight: "700" }}>{topItemName}</Text> ({topItemSold || 0} sold)
            </Text>
          </>
        ) : activeOffersCount > 0 ? (
          <>
            <Tag size={13} color="#ec4899" />
            <Text numberOfLines={1} style={[styles.discoveryFooterText, { color: colors.textMuted }]}>
              Active Deals: <Text style={{ color: colors.text, fontWeight: "700" }}>{activeOffersCount} offer(s)</Text> live in customer feed
            </Text>
          </>
        ) : (
          <>
            <Sparkles size={13} color="#eab308" />
            <Text numberOfLines={1} style={[styles.discoveryFooterText, { color: colors.textMuted }]}>
              Local buyers discover your catalog via explore search & counter QR
            </Text>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  discoveryCard: { borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 20, shadowColor: "#0f172a", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  discoveryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  discoveryTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  discoveryTitle: { fontSize: 13, fontWeight: "800" },
  liveBadgeRow: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(16, 185, 129, 0.12)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12 },
  livePulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10b981" },
  discoveryBadge: { fontSize: 10, fontWeight: "800", color: "#10b981", letterSpacing: 0.4 },
  discoveryGrid: { flexDirection: "row", gap: 6 },
  statBox: { flex: 1, paddingVertical: 12, paddingHorizontal: 4, borderRadius: 12, alignItems: "center", minHeight: 86, justifyContent: "center" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.97 }] },
  statVal: { fontSize: 18, fontWeight: "900" },
  statLabel: { fontSize: 11, fontWeight: "700", marginTop: 3, textAlign: "center" },
  statSub: { fontSize: 9, fontWeight: "600", marginTop: 2, textAlign: "center" },
  discoveryFooter: { flexDirection: "row", alignItems: "center", gap: 6, borderTopWidth: 1, paddingTop: 10, marginTop: 10 },
  discoveryFooterText: { fontSize: 11, flex: 1 },
});
