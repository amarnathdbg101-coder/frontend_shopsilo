import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { AppImage } from "@/components/AppImage";
import { Shop } from "@/features/shops/types";
import { ShopActionButtons } from "@/features/shops/components/ShopActionButtons";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Star, MapPin, Clock, Store } from "lucide-react-native";

interface ShopHeaderInfoProps {
  shop: Shop;
}

export const ShopHeaderInfo: React.FC<ShopHeaderInfoProps> = ({ shop }) => {
  const { colors } = useThemeColor();

  const bannerImg =
    shop.banners && shop.banners.length > 0
      ? shop.banners[0]
      : shop.logo_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80";

  const isOpen = shop.is_currently_open !== false;
  const timingText =
    shop.opening_time && shop.closing_time
      ? `${shop.opening_time} - ${shop.closing_time}`
      : shop.timing;

  const fullAddress = [shop.address, shop.city, shop.pincode].filter(Boolean).join(", ");

  return (
    <View style={[styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      {/* Banner with Logo Overlay */}
      <View style={styles.bannerWrap}>
        <AppImage source={bannerImg} height={140} borderRadius={12} />
        {shop.logo_url && (
          <View style={[styles.logoOverlay, { borderColor: colors.surface }]}>
            <AppImage source={shop.logo_url} width={50} height={50} borderRadius={25} />
          </View>
        )}
      </View>

      <View style={styles.shopInfo}>
        <View style={styles.titleRow}>
          <Text style={[styles.shopName, { color: colors.text }]}>{shop.name}</Text>
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? "#f0fdf4" : "#fef2f2" }]}>
            <Text style={[styles.statusText, { color: isOpen ? "#16a34a" : "#dc2626" }]}>
              {isOpen ? "Open Now" : "Closed"}
            </Text>
          </View>
        </View>

        {shop.category && (
          <View style={styles.categoryRow}>
            <Store size={12} color={colors.primary} />
            <Text style={[styles.categoryText, { color: colors.primary }]}>{shop.category}</Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.ratingBadge}>
            <Star size={13} color="#eab308" fill="#eab308" />
            <Text style={styles.ratingText}>
              {shop.average_rating > 0 ? shop.average_rating.toFixed(1) : "New"} ({shop.total_reviews})
            </Text>
          </View>

          {timingText && (
            <View style={styles.timeBadge}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={[styles.timeText, { color: colors.textMuted }]}>{timingText}</Text>
            </View>
          )}
        </View>

        {fullAddress ? (
          <View style={styles.addressRow}>
            <MapPin size={13} color={colors.textMuted} />
            <Text style={[styles.addressText, { color: colors.textMuted }]}>{fullAddress}</Text>
          </View>
        ) : null}

        {/* 1-Tap Contact & Directions: WhatsApp, Call, Google Maps */}
        <ShopActionButtons shop={shop} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  shopCard: { borderRadius: 16, borderWidth: 1, padding: 12, marginBottom: 8 },
  bannerWrap: { position: "relative", marginBottom: 6 },
  logoOverlay: { position: "absolute", bottom: -10, left: 12, borderWidth: 2, borderRadius: 27, overflow: "hidden" },
  shopInfo: { marginTop: 8 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  shopName: { fontSize: 19, fontWeight: "800", flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: "800" },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  categoryText: { fontSize: 12, fontWeight: "700" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 12, fontWeight: "800" },
  timeBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  timeText: { fontSize: 12 },
  addressRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  addressText: { fontSize: 12, flex: 1 },
});
