import React from "react";
import { StyleSheet, Text, View, FlatList, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useFavoriteShopsStore } from "@/store/useFavoriteShopsStore";
import { Shop } from "@/features/shops/types";
import { AppImage } from "@/components/AppImage";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Heart, Store, MapPin, Trash2, ArrowRight } from "lucide-react-native";

interface FavoriteShopsListProps {
  onShopPress: (shop: Shop) => void;
}

export const FavoriteShopsList: React.FC<FavoriteShopsListProps> = ({ onShopPress }) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { favoriteShops, removeFavorite } = useFavoriteShopsStore();

  if (favoriteShops.length === 0) {
    return (
      <View style={[styles.emptyBox, { borderColor: colors.surfaceBorder, backgroundColor: colors.surface }]}>
        <View style={styles.heartIconWrap}>
          <Heart size={36} color="#ef4444" />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No Favorite Stores Yet</Text>
        <Text style={[styles.emptySub, { color: colors.textMuted }]}>
          Tap the heart icon on any store to save your favorite neighborhood shops here for quick inventory access.
        </Text>
        <Pressable onPress={() => router.push("/shops" as never)} style={[styles.exploreBtn, { backgroundColor: colors.primary }]}>
          <Text style={[styles.exploreBtnText, { color: colors.primaryForeground }]}>Explore Nearby Stores</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <FlatList
      data={favoriteShops}
      keyExtractor={(item) => item.id || item.slug}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: shop }) => {
        const isOpen = shop.is_currently_open !== false;
        const banner = shop.logo_url || (shop.banners && shop.banners[0]) || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80";

        return (
          <Pressable
            onPress={() => onShopPress(shop)}
            style={[styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={styles.cardHeader}>
              <AppImage source={banner} width={52} height={52} borderRadius={10} />
              <View style={styles.cardInfo}>
                <View style={styles.nameRow}>
                  <Text numberOfLines={1} style={[styles.shopName, { color: colors.text }]}>
                    {shop.name}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: isOpen ? "#f0fdf4" : "#fef2f2" }]}>
                    <Text style={[styles.statusText, { color: isOpen ? "#16a34a" : "#dc2626" }]}>
                      {isOpen ? "Open" : "Closed"}
                    </Text>
                  </View>
                </View>

                {shop.category && (
                  <View style={styles.categoryRow}>
                    <Store size={11} color={colors.primary} />
                    <Text style={[styles.categoryText, { color: colors.primary }]}>{shop.category}</Text>
                  </View>
                )}

                {(shop.city || shop.address) && (
                  <View style={styles.addressRow}>
                    <MapPin size={11} color={colors.textMuted} />
                    <Text numberOfLines={1} style={[styles.addressText, { color: colors.textMuted }]}>
                      {shop.city ? `${shop.city}${shop.pincode ? ` (${shop.pincode})` : ""}` : shop.address}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
              <Pressable onPress={() => removeFavorite(shop.id)} hitSlop={8} style={styles.removeBtn}>
                <Trash2 size={13} color={colors.textMuted} />
                <Text style={[styles.removeText, { color: colors.textMuted }]}>Remove</Text>
              </Pressable>
              <View style={styles.viewStoreRow}>
                <Text style={[styles.viewStoreText, { color: colors.primary }]}>Open Storefront</Text>
                <ArrowRight size={13} color={colors.primary} />
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  listContent: { paddingBottom: 95 },
  emptyBox: { alignItems: "center", justifyContent: "center", padding: 28, borderWidth: 1, borderRadius: 16, borderStyle: "dashed", marginTop: 24, gap: 10 },
  heartIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#fee2e2", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  emptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },
  exploreBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10, marginTop: 8 },
  exploreBtnText: { fontSize: 13, fontWeight: "800" },
  shopCard: { borderRadius: 14, borderWidth: 1, padding: 12, marginBottom: 12 },
  cardHeader: { flexDirection: "row", gap: 10, alignItems: "center" },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shopName: { fontSize: 15, fontWeight: "800", flex: 1, marginRight: 6 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800" },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  categoryText: { fontSize: 11, fontWeight: "700" },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  addressText: { fontSize: 11, flex: 1 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, paddingTop: 8, marginTop: 8 },
  removeBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 2 },
  removeText: { fontSize: 11, fontWeight: "600" },
  viewStoreRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  viewStoreText: { fontSize: 12, fontWeight: "800" },
});
