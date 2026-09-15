import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Shop } from "@/features/shops/types";
import { Store, ChevronRight, Settings, Sparkles } from "lucide-react-native";

interface MerchantShopProfileCardProps {
  shop?: Shop | null;
}

export const MerchantShopProfileCard: React.FC<MerchantShopProfileCardProps> = ({ shop }) => {
  const router = useRouter();

  const isOpen = shop?.is_open ?? true;
  const rating = typeof shop?.average_rating === "number" ? shop.average_rating : 4.8;
  const reviewCount = typeof shop?.total_reviews === "number" ? shop.total_reviews : 0;

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.titleRow}>
          <Store size={18} color="#f59e0b" />
          <Text style={styles.cardTitle}>Aapki Dukan Overview</Text>
        </View>

        <View
          style={[
            styles.statusBadge,
            { backgroundColor: isOpen ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isOpen ? "#22c55e" : "#ef4444" },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: isOpen ? "#4ade80" : "#f87171" },
            ]}
          >
            {isOpen ? "KHULI HAI" : "BAND"}
          </Text>
        </View>
      </View>

      <View style={styles.shopInfoBlock}>
        <Text numberOfLines={1} style={styles.shopName}>
          {shop?.name || "ShopSilo Partner Store"}
        </Text>
        <Text style={styles.shopMeta}>
          {shop?.category ? shop.category.toUpperCase() : "COUNTER COMMERCE"} • ★ {rating.toFixed(1)} ({reviewCount} reviews)
        </Text>
      </View>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/merchant/dashboard")}
          style={styles.primaryBtn}
        >
          <Sparkles size={14} color="#ffffff" />
          <Text style={styles.primaryBtnText}>Open Merchant OS</Text>
          <ChevronRight size={14} color="#ffffff" />
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/merchant/settings")}
          style={styles.secondaryBtn}
        >
          <Settings size={14} color="#94a3b8" />
          <Text style={styles.secondaryBtnText}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#0f172a",
    borderColor: "#334155",
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardTitle: {
    color: "#f8fafc",
    fontSize: 14,
    fontWeight: "700",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.4,
  },
  shopInfoBlock: {
    marginBottom: 12,
  },
  shopName: {
    fontSize: 20,
    fontWeight: "800",
    color: "#f8fafc",
  },
  shopMeta: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
    paddingTop: 12,
  },
  primaryBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#4f46e5",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: "#1e293b",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  secondaryBtnText: {
    color: "#94a3b8",
    fontSize: 12,
    fontWeight: "700",
  },
});
