import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Shop } from "@/features/shops/types";
import { ShopCard } from "@/features/shops/components/ShopCard";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Store } from "lucide-react-native";

interface NearbyShopsSectionProps {
  shops: Shop[];
  onShopPress: (shop: Shop) => void;
}

export const NearbyShopsSection: React.FC<NearbyShopsSectionProps> = ({
  shops,
  onShopPress,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  if (shops.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleWithIcon}>
          <Store size={18} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>
            Nearby Local Stores
          </Text>
        </View>
        <Pressable onPress={() => router.push("/shops" as never)} style={styles.seeAllBtn}>
          <Text style={[styles.badge, { color: colors.primary }]}>
            Radius Search →
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.subtitle, { color: colors.textMuted }]}>
        Support neighborhood dukandars with 15-minute counter pickup
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {shops.map((shop) => (
          <ShopCard key={shop.id} shop={shop} onPress={onShopPress} />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  titleWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
  },
  seeAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  subtitle: {
    fontSize: 12,
    marginBottom: 10,
  },
  scrollList: {
    paddingVertical: 2,
  },
});
