import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Store, MapPin, Star, Clock, Eye } from "lucide-react-native";

interface ShopPreviewCardProps {
  name: string;
  category: string;
  city: string;
  address: string;
  logoUri?: string;
  bannerUri?: string;
  isOpen?: boolean;
  timing?: string;
}

export const ShopPreviewCard: React.FC<ShopPreviewCardProps> = ({
  name,
  category,
  city,
  address,
  logoUri,
  bannerUri,
  isOpen = true,
  timing = "9:00 AM - 9:00 PM",
}) => {
  const { colors, isDark } = useThemeColor();

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.topBadgeRow}>
        <View style={styles.previewTag}>
          <Eye size={12} color="#6366f1" />
          <Text style={styles.previewTagText}>LIVE CUSTOMER VIEW</Text>
        </View>
        <Text style={[styles.previewHint, { color: colors.textMuted }]}>
          How customers see your dukan
        </Text>
      </View>

      {/* Simulated Storefront Card */}
      <View style={[styles.card, { backgroundColor: isDark ? "#18181b" : "#0f172a" }]}>
        {/* Banner */}
        <View style={styles.bannerContainer}>
          {bannerUri ? (
            <Image source={{ uri: bannerUri }} style={styles.bannerImg} contentFit="cover" />
          ) : (
            <View style={[styles.bannerPlaceholder, { backgroundColor: isDark ? "#27272a" : "#1e293b" }]}>
              <Store size={28} color="#475569" />
            </View>
          )}

          {/* Open / Closed Badge on Banner */}
          <View style={[styles.statusBadge, { backgroundColor: isOpen ? "rgba(16,185,129,0.9)" : "rgba(239,68,68,0.9)" }]}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>{isOpen ? "OPEN NOW" : "CLOSED"}</Text>
          </View>

          {/* Timing Chip */}
          <View style={styles.timingChip}>
            <Clock size={11} color="#f8fafc" />
            <Text style={styles.timingText}>{timing}</Text>
          </View>
        </View>

        {/* Content Row with Overlapping Logo */}
        <View style={styles.body}>
          <View style={styles.logoRow}>
            <View style={[styles.logoWrap, { borderColor: isDark ? "#18181b" : "#0f172a" }]}>
              {logoUri ? (
                <Image source={{ uri: logoUri }} style={styles.logoImg} contentFit="cover" />
              ) : (
                <View style={styles.logoPlaceholder}>
                  <Text style={styles.logoInitial}>
                    {name ? name[0].toUpperCase() : "S"}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.metaCol}>
              <Text numberOfLines={1} style={styles.shopName}>
                {name || "Your Store Name"}
              </Text>
              <Text numberOfLines={1} style={styles.categoryText}>
                {category ? category.toUpperCase() : "RETAIL STORE"} • {city || "LOCAL"}
              </Text>
            </View>
          </View>

          {/* Bottom Info Strip */}
          <View style={styles.infoStrip}>
            <View style={styles.infoItem}>
              <MapPin size={12} color="#94a3b8" />
              <Text numberOfLines={1} style={styles.infoText}>
                {address || city || "Add your store location"}
              </Text>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={11} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>4.8 (Verified)</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 12,
    marginBottom: 16,
  },
  topBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  previewTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(99, 102, 241, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  previewTagText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#6366f1",
    letterSpacing: 0.6,
  },
  previewHint: {
    fontSize: 11,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  bannerContainer: {
    width: "100%",
    height: 90,
    position: "relative",
  },
  bannerImg: {
    width: "100%",
    height: "100%",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#fff",
  },
  statusText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.4,
  },
  timingChip: {
    position: "absolute",
    top: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  timingText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#f8fafc",
  },
  body: {
    padding: 12,
    paddingTop: 0,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: -22,
    gap: 10,
    marginBottom: 8,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2.5,
    overflow: "hidden",
    backgroundColor: "#4f46e5",
    elevation: 3,
  },
  logoImg: {
    width: "100%",
    height: "100%",
  },
  logoPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4f46e5",
  },
  logoInitial: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
  },
  metaCol: {
    flex: 1,
    paddingBottom: 2,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "800",
    color: "#f8fafc",
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#38bdf8",
    marginTop: 1,
  },
  infoStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingTop: 8,
    marginTop: 2,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
    marginRight: 8,
  },
  infoText: {
    fontSize: 11,
    color: "#94a3b8",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(245,158,11,0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#f59e0b",
  },
});
