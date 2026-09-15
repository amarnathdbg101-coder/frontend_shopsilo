import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable } from "react-native";
import { Clock, Store, Tag, Sparkles } from "lucide-react-native";

interface BannerItem {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  accentBg: string;
  accentBorder: string;
  textColor: string;
  subColor: string;
  badgeBg: string;
  badgeColor: string;
  icon: React.ReactNode;
}

const BANNERS: BannerItem[] = [
  {
    id: "pickup",
    tag: "ZERO ADVANCE",
    title: "Reserve at ₹0 & Pick Up in 15 Min",
    subtitle: "Show your pickup OTP at counter & skip the queue",
    accentBg: "#0f172a",
    accentBorder: "#334155",
    textColor: "#f8fafc",
    subColor: "#94a3b8",
    badgeBg: "#22c55e",
    badgeColor: "#ffffff",
    icon: <Clock size={20} color="#22c55e" />,
  },
  {
    id: "local",
    tag: "VOCAL FOR LOCAL",
    title: "Support Neighborhood Dukandars",
    subtitle: "Direct inventory from verified local shops in your area",
    accentBg: "#1e1b4b",
    accentBorder: "#4338ca",
    textColor: "#ffffff",
    subColor: "#c7d2fe",
    badgeBg: "#6366f1",
    badgeColor: "#ffffff",
    icon: <Store size={20} color="#818cf8" />,
  },
  {
    id: "bargain",
    tag: "SMART BARGAIN",
    title: "Direct Counter Negotiation",
    subtitle: "Send bulk pricing offers directly to shopkeepers",
    accentBg: "#1c1917",
    accentBorder: "#44403c",
    textColor: "#ffffff",
    subColor: "#d6d3d1",
    badgeBg: "#f59e0b",
    badgeColor: "#ffffff",
    icon: <Tag size={20} color="#f59e0b" />,
  },
];

interface HeroBannerCarouselProps {
  onBannerPress?: (id: string) => void;
}

export const HeroBannerCarousel: React.FC<HeroBannerCarouselProps> = ({
  onBannerPress,
}) => {
  return (
    <ScrollView
      horizontal
      pagingEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {BANNERS.map((banner) => (
        <Pressable
          key={banner.id}
          accessibilityRole="button"
          onPress={() => onBannerPress?.(banner.id)}
          style={[
            styles.bannerCard,
            {
              backgroundColor: banner.accentBg,
              borderColor: banner.accentBorder,
            },
          ]}
        >
          <View style={styles.topRow}>
            <View
              style={[styles.tagBadge, { backgroundColor: banner.badgeBg }]}
            >
              <Sparkles size={10} color={banner.badgeColor} />
              <Text style={[styles.tagText, { color: banner.badgeColor }]}>
                {banner.tag}
              </Text>
            </View>
            {banner.icon}
          </View>

          <Text style={[styles.title, { color: banner.textColor }]}>
            {banner.title}
          </Text>
          <Text style={[styles.subtitle, { color: banner.subColor }]}>
            {banner.subtitle}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12, paddingVertical: 6, marginBottom: 14 },
  bannerCard: { width: 290, borderRadius: 16, borderWidth: 1, padding: 16, justifyContent: "space-between" },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  tagBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 },
  tagText: { fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },
  title: { fontSize: 16, fontWeight: "800", lineHeight: 21, marginBottom: 4 },
  subtitle: { fontSize: 12, lineHeight: 16 },
});
