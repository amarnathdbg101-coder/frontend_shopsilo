import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useDrawerStore } from "@/store/useDrawerStore";
import { useLocationStore } from "@/store/useLocationStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Menu, MapPin, ChevronDown, Store, ShoppingBag, ScanBarcode } from "lucide-react-native";

interface HomeHeaderProps {
  onLocationPress?: () => void;
}

export const HomeHeader: React.FC<HomeHeaderProps> = ({ onLocationPress }) => {
  const router = useRouter();
  const { isDark } = useThemeColor();
  const { user } = useAuthStore();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const currentLocation = useLocationStore((s) => s.currentLocation);
  const radiusKm = useLocationStore((s) => s.radiusKm);
  const isMerchant = user?.role === "shop";

  return (
    <View style={[styles.appBar, { backgroundColor: isDark ? "#18181b" : "#0f172a", borderColor: isDark ? "#27272a" : "#1e293b" }]}>
      <View style={styles.topRow}>
        <Pressable accessibilityRole="button" onPress={openDrawer} style={styles.menuBtn}>
          <Menu size={18} color="#f8fafc" />
        </Pressable>

        <View style={styles.brandCol}>
          <View style={styles.brandRow}>
            <ShoppingBag size={17} color="#38bdf8" />
            <Text style={styles.brandText}>Shop<Text style={{ color: "#38bdf8" }}>Silo</Text></Text>
          </View>
          <Text style={styles.brandSub}>LOCAL • COUNTER PICKUP</Text>
        </View>

        <View style={styles.rightActions}>
          {isMerchant ? (
            <Pressable onPress={() => router.push("/merchant/dashboard")} style={styles.merchantPill}>
              <Store size={12} color="#f59e0b" />
              <Text style={styles.merchantText}>Dukandar</Text>
            </Pressable>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => router.push("/(tabs)/orders")} style={styles.ordersPill}>
              <ShoppingBag size={13} color="#38bdf8" />
              <Text style={styles.ordersText}>Orders</Text>
            </Pressable>
          )}
        </View>
      </View>

      <Pressable accessibilityRole="button" onPress={onLocationPress} style={styles.locationPill}>
        <View style={styles.locLeft}>
          <MapPin size={13} color="#f59e0b" />
          <Text numberOfLines={1} style={styles.locText}>
            {currentLocation.formattedAddress || "Select Local Area"}
          </Text>
          <ChevronDown size={12} color="#94a3b8" />
        </View>
        <View style={styles.statusPill}>
          <View style={styles.liveDot} />
          <Text style={styles.statusText}>{radiusKm || 10}km Radius</Text>
        </View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  appBar: { borderRadius: 18, borderWidth: 1, padding: 12, marginBottom: 12, elevation: 4 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  menuBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  brandCol: { alignItems: "center" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  brandText: { fontSize: 18, fontWeight: "900", color: "#f8fafc", letterSpacing: 0.2 },
  brandSub: { fontSize: 9, fontWeight: "700", color: "#94a3b8", letterSpacing: 0.8, marginTop: 1 },
  rightActions: { flexDirection: "row", alignItems: "center" },
  ordersPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(56,189,248,0.12)", borderColor: "rgba(56,189,248,0.3)", borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 10 },
  ordersText: { fontSize: 11, fontWeight: "700", color: "#38bdf8" },
  merchantPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(245,158,11,0.15)", borderColor: "rgba(245,158,11,0.3)", borderWidth: 1, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  merchantText: { fontSize: 11, fontWeight: "700", color: "#f59e0b" },
  locationPill: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.08)", borderColor: "rgba(255,255,255,0.12)", borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  locLeft: { flexDirection: "row", alignItems: "center", gap: 5, flex: 1, marginRight: 8 },
  locText: { fontSize: 12, fontWeight: "700", color: "#f8fafc", maxWidth: 200 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(34,197,94,0.15)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22c55e" },
  statusText: { fontSize: 10, fontWeight: "700", color: "#4ade80" },
});
