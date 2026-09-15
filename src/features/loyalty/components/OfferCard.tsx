import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { StoreOffer } from "@/features/loyalty/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Tag, Store, Lock, CheckCircle2, ArrowRight } from "lucide-react-native";

interface OfferCardProps {
  offer: StoreOffer;
  onPress?: () => void;
}

export const OfferCard: React.FC<OfferCardProps> = ({ offer, onPress }) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  const handlePress = () => {
    if (onPress) onPress();
    if (offer.shop_slug) {
      router.push(`/shop/${offer.shop_slug}`);
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.discountBadge}>
          <Tag size={13} color="#ffffff" />
          <Text style={styles.discountText}>{offer.discount_text}</Text>
        </View>

        {offer.is_unlocked ? (
          <View style={styles.unlockedBadge}>
            <CheckCircle2 size={12} color="#16a34a" />
            <Text style={styles.unlockedText}>UNLOCKED</Text>
          </View>
        ) : (
          <View style={styles.lockedBadge}>
            <Lock size={12} color="#b45309" />
            <Text style={styles.lockedText}>
              {offer.min_points_required} Pts Required
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, { color: colors.text }]}>{offer.title}</Text>
      {offer.description ? (
        <Text
          numberOfLines={2}
          style={[styles.description, { color: colors.textMuted }]}
        >
          {offer.description}
        </Text>
      ) : null}

      <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
        <View style={styles.shopInfo}>
          <Store size={14} color={colors.primary} />
          <Text
            numberOfLines={1}
            style={[styles.shopName, { color: colors.text }]}
          >
            {offer.shop_name || "Local Store"}
          </Text>
        </View>
        <ArrowRight size={15} color={colors.textMuted} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 10, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  discountBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ef4444", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  unlockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#dcfce7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  unlockedText: { color: "#166534", fontSize: 10, fontWeight: "800" },
  lockedBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fef3c7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  lockedText: { color: "#92400e", fontSize: 10, fontWeight: "800" },
  title: { fontSize: 15, fontWeight: "700" },
  description: { fontSize: 12, lineHeight: 16 },
  footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: 1, paddingTop: 8, marginTop: 4 },
  shopInfo: { flexDirection: "row", alignItems: "center", gap: 6, flex: 1 },
  shopName: { fontSize: 12, fontWeight: "600" },
});
