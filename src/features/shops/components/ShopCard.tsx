import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Shop } from "@/features/shops/types";
import { AppImage } from "@/components/AppImage";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useFavoriteShopsStore } from "@/store/useFavoriteShopsStore";
import { Star, MapPin, Zap, Heart } from "lucide-react-native";

interface ShopCardProps {
  shop: Shop;
  onPress: (shop: Shop) => void;
}

export const ShopCard: React.FC<ShopCardProps> = React.memo(({ shop, onPress }) => {
  const { colors } = useThemeColor();
  const isFav = useFavoriteShopsStore((s) => s.isFavorite(shop.id));
  const toggleFavorite = useFavoriteShopsStore((s) => s.toggleFavorite);

  const bannerSource =
    shop.logo_url ||
    (shop.banners && shop.banners.length > 0
      ? shop.banners[0]
      : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500&q=80");

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(shop)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.imageWrap}>
        <AppImage
          source={bannerSource}
          height={115}
          borderRadius={12}
          contentFit="cover"
        />
        <Pressable
          hitSlop={8}
          onPress={(e) => {
            e.stopPropagation();
            toggleFavorite(shop);
          }}
          style={styles.heartBtn}
        >
          <Heart
            size={16}
            color={isFav ? "#ef4444" : "#ffffff"}
            fill={isFav ? "#ef4444" : "rgba(0,0,0,0.3)"}
          />
        </Pressable>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: shop.is_currently_open ? "#16a34a" : "#dc2626" },
          ]}
        >
          <Text style={styles.statusText}>
            {shop.is_currently_open ? "Open Now" : "Closed"}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {shop.name}
        </Text>

        <View style={styles.pickupRow}>
          <Zap size={12} color="#16a34a" />
          <Text style={styles.pickupText}>Instant Counter Pickup</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.ratingBox}>
            <Star size={13} color="#eab308" fill="#eab308" />
            <Text style={[styles.ratingText, { color: colors.text }]}>
              {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"}
            </Text>
          </View>

          {shop.address && (
            <View style={styles.addressBox}>
              <MapPin size={12} color={colors.textMuted} />
              <Text
                numberOfLines={1}
                style={[styles.addressText, { color: colors.textMuted }]}
              >
                {shop.city ? shop.city : shop.address}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

ShopCard.displayName = "ShopCard";

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 10, width: 230, marginRight: 12 },
  pressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  imageWrap: { position: "relative" },
  heartBtn: { position: "absolute", top: 8, left: 8, backgroundColor: "rgba(0,0,0,0.35)", padding: 5, borderRadius: 999 },
  statusBadge: { position: "absolute", top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  statusText: { fontSize: 10, fontWeight: "700", color: "#ffffff" },
  content: { marginTop: 8, gap: 3 },
  name: { fontSize: 15, fontWeight: "700" },
  pickupRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  pickupText: { fontSize: 11, fontWeight: "600", color: "#16a34a" },
  metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  ratingBox: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "700" },
  addressBox: { flexDirection: "row", alignItems: "center", gap: 3, flex: 1, justifyContent: "flex-end" },
  addressText: { fontSize: 11 },
});
