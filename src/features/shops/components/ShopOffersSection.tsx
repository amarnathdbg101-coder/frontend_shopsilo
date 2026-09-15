import React from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { useShopOffers } from "@/features/loyalty/api/useLoyalty";
import { OfferCard } from "@/features/loyalty/components/OfferCard";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Tag } from "lucide-react-native";

interface ShopOffersSectionProps {
  shopSlug: string;
}

export const ShopOffersSection: React.FC<ShopOffersSectionProps> = ({ shopSlug }) => {
  const { colors } = useThemeColor();
  const { data: offers = [] } = useShopOffers(shopSlug);

  if (offers.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Tag size={15} color="#ea580c" />
        <Text style={[styles.title, { color: colors.text }]}>Store Deals & Coupons</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.list}>
        {offers.map((offer) => (
          <View key={offer.id} style={styles.cardWrap}>
            <OfferCard offer={offer} />
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12, marginTop: 4 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  title: { fontSize: 15, fontWeight: "800" },
  list: { gap: 10, paddingRight: 16 },
  cardWrap: { width: 260 },
});
