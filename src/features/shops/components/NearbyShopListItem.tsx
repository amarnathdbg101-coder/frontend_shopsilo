import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Shop } from "@/features/shops/types";
import { AppImage } from "@/components/AppImage";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useFavoriteShopsStore } from "@/store/useFavoriteShopsStore";
import { MapPin, Clock, Heart, Navigation } from "lucide-react-native";

interface NearbyShopListItemProps {
  shop: Shop;
  onPress: (shop: Shop) => void;
}

export const NearbyShopListItem: React.FC<NearbyShopListItemProps> = ({ shop, onPress }) => {
  const { colors } = useThemeColor();
  const isFav = useFavoriteShopsStore((s) => s.isFavorite(shop.id));
  const toggleFavorite = useFavoriteShopsStore((s) => s.toggleFavorite);

  const bannerImg =
    shop.banners && shop.banners.length > 0
      ? shop.banners[0]
      : shop.logo_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80";

  const formattedDistance =
    typeof shop.distance_km === "number"
      ? shop.distance_km < 1
        ? `${Math.round(shop.distance_km * 1000)} m away`
        : `${shop.distance_km.toFixed(1)} km away`
      : undefined;

  return (
    <Pressable
      onPress={() => onPress(shop)}
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
    >
      <View style={styles.imageWrap}>
        <AppImage source={bannerImg} height={96} borderRadius={10} />
        {formattedDistance && (
          <View style={styles.distanceBadge}>
            <Navigation size={10} color="#ffffff" />
            <Text style={styles.distanceText}>{formattedDistance}</Text>
          </View>
        )}
      </View>

      <View style={styles.detailsCol}>
        <View style={styles.topRow}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {shop.name}
          </Text>
          <Pressable
            hitSlop={8}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(shop);
            }}
            style={styles.heartBtn}
          >
            <Heart
              size={17}
              color={isFav ? "#ef4444" : colors.textMuted}
              fill={isFav ? "#ef4444" : "transparent"}
            />
          </Pressable>
        </View>

        {shop.category && (
          <Text numberOfLines={1} style={[styles.category, { color: colors.primary }]}>
            {shop.category}
          </Text>
        )}

        {shop.address && (
          <View style={styles.infoRow}>
            <MapPin size={12} color={colors.textMuted} />
            <Text numberOfLines={1} style={[styles.infoText, { color: colors.textMuted }]}>
              {shop.address} {shop.city ? `• ${shop.city}` : ""}
            </Text>
          </View>
        )}

        <View style={styles.bottomRow}>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: shop.is_currently_open !== false ? "#f0fdf4" : "#fef2f2" },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: shop.is_currently_open !== false ? "#16a34a" : "#dc2626" },
              ]}
            >
              {shop.is_currently_open !== false ? "Open Now" : "Closed"}
            </Text>
          </View>

          {shop.timing && (
            <View style={styles.timeRow}>
              <Clock size={11} color={colors.textMuted} />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{shop.timing}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", borderRadius: 16, borderWidth: 1, padding: 10, gap: 12, marginBottom: 10 },
  imageWrap: { width: 96, position: "relative" },
  distanceBadge: { position: "absolute", bottom: 4, left: 4, right: 4, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 3, backgroundColor: "rgba(0,0,0,0.75)", paddingVertical: 2, borderRadius: 6 },
  distanceText: { fontSize: 9, fontWeight: "800", color: "#ffffff" },
  detailsCol: { flex: 1, justifyContent: "space-between", paddingVertical: 2 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 15, fontWeight: "800", flex: 1, marginRight: 4 },
  heartBtn: { padding: 4 },
  category: { fontSize: 11, fontWeight: "700", marginTop: 1 },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  infoText: { fontSize: 11, flex: 1 },
  bottomRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 },
  statusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "800" },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  timeText: { fontSize: 10 },
});
