import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { Product } from "@/features/catalog/types";
import { AppImage } from "@/components/AppImage";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Clock } from "lucide-react-native";

interface ProductCardProps {
  product: Product;
  onPress: (product: Product) => void;
  isTablet?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(
  ({ product, onPress, isTablet = false }) => {
    const { colors } = useThemeColor();

    const fallbackImage = "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80";

    const productName = product.name || (product as any).title || "Product";
    const productImg =
      product.images && product.images.length > 0
        ? product.images[0]
        : (product as any).image_url || fallbackImage;

    const discountPercent =
      product.compare_price && product.compare_price > product.price
        ? Math.round(
            ((product.compare_price - product.price) / product.compare_price) * 100
          )
        : 0;

    const imageHeight = isTablet ? 185 : 145;

    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => onPress(product)}
        style={({ pressed }) => [
          styles.container,
          isTablet && styles.tabletContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.imageWrap, { height: imageHeight }]}>
          <AppImage
            source={productImg}
            height={imageHeight}
            width="100%"
            borderRadius={8}
            style={styles.image}
          />
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        <View style={styles.details}>
          <Text
            numberOfLines={2}
            style={[styles.title, { color: colors.text, fontSize: isTablet ? 14 : 13 }]}
          >
            {productName}
          </Text>

          <View style={styles.priceRow}>
            <View style={styles.priceGroup}>
              <Text style={[styles.price, { color: colors.primary, fontSize: isTablet ? 16 : 15 }]}>
                {formatCurrency(product.price)}
              </Text>
              {product.compare_price && product.compare_price > product.price && (
                <Text style={[styles.comparePrice, { color: colors.textMuted }]}>
                  {formatCurrency(product.compare_price)}
                </Text>
              )}
            </View>

            <View style={styles.pickupPill}>
              <Clock size={10} color="#166534" />
              <Text style={styles.pickupPillText}>Reserve</Text>
            </View>
          </View>
        </View>
      </Pressable>
    );
  }
);

ProductCard.displayName = "ProductCard";

const styles = StyleSheet.create({
  container: { flex: 1, borderRadius: 16, borderWidth: 1, padding: 10, marginBottom: 12, marginHorizontal: 3, overflow: "hidden" },
  tabletContainer: { marginHorizontal: 6, marginBottom: 18 },
  pressed: { opacity: 0.92, transform: [{ scale: 0.98 }] },
  imageWrap: { position: "relative", backgroundColor: "transparent", borderRadius: 10, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  image: { width: "100%", height: "100%" },
  discountBadge: { position: "absolute", top: 6, left: 6, backgroundColor: "#ef4444", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  discountText: { color: "#ffffff", fontSize: 10, fontWeight: "800" },
  details: { marginTop: 8, gap: 4 },
  title: { fontWeight: "700", minHeight: 32 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 2 },
  priceGroup: { flexDirection: "row", alignItems: "baseline", gap: 6 },
  price: { fontWeight: "900" },
  comparePrice: { fontSize: 11, textDecorationLine: "line-through" },
  pickupPill: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#dcfce7", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 },
  pickupPillText: { fontSize: 10, fontWeight: "800", color: "#166534" },
});
