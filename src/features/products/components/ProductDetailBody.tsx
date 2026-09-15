import React from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, useWindowDimensions } from "react-native";
import { useRouter } from "expo-router";
import { AppImage } from "@/components/AppImage";
import { Product } from "@/features/catalog/types";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store/useAuthStore";
import {
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Store,
  MapPin,
  ArrowRight,
  Tag,
  ShieldCheck,
  Package,
  Layers,
  BarChart2,
  SlidersHorizontal,
} from "lucide-react-native";
import { useShopProducts } from "@/features/shops/api/useShopDetail";

interface ProductDetailBodyProps {
  product: Product;
}

export const ProductDetailBody: React.FC<ProductDetailBodyProps> = ({ product }) => {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  const user = useAuthStore((s) => s.user);
  const isMerchant = user?.role === "shop" || user?.role === "admin";

  const { data: shopProducts = [] } = useShopProducts(product.shop_slug ?? "");
  const relatedProducts = shopProducts
    .filter((p) => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 6);

  const images = product.images && product.images.length > 0 ? product.images : [];
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = !isOutOfStock && product.stock_quantity <= (product.min_stock || product.low_stock_threshold || 5);

  // Price calculations
  const price = product.price || 0;
  const comparePrice = product.compare_price || 0;
  const costPrice = product.cost_price || 0;
  const hasDiscount = comparePrice > price;
  const savingsAmount = hasDiscount ? comparePrice - price : 0;
  const discountPercent = hasDiscount ? Math.round((savingsAmount / comparePrice) * 100) : 0;

  // Merchant profit calculations
  const profitPerPiece = costPrice > 0 && price > costPrice ? price - costPrice : null;
  const profitMarginPercent = profitPerPiece && price > 0 ? Math.round((profitPerPiece / price) * 100) : null;

  // Attributes (JSONB object)
  const attrs = (product as any).attributes || {};
  const attrEntries = Object.entries(attrs).filter(([k, v]) => k && v && String(v).trim());

  // Tags array
  const tagsList = Array.isArray(product.tags)
    ? product.tags
    : typeof product.tags === "string"
    ? (product.tags as string).split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletScroll]}>
      {/* 🖼️ Product Image Carousel */}
      <View style={styles.imageSection}>
        {images.length > 0 ? (
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carouselContent}>
            {images.map((img, idx) => (
              <View key={idx} style={[styles.imageContainer, { width: isTablet ? 360 : width - 32 }]}>
                <AppImage
                  source={img}
                  height={isTablet ? 320 : 260}
                  width={isTablet ? 360 : width - 32}
                  borderRadius={16}
                  contentFit="contain"
                />
              </View>
            ))}
          </ScrollView>
        ) : (
          <AppImage
            source="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"
            height={isTablet ? 320 : 260}
            borderRadius={16}
            contentFit="contain"
          />
        )}
      </View>

      {/* 🏷️ Title & Category */}
      <View style={styles.titleSection}>
        <View style={styles.categoryBadgeRow}>
          {product.category_name ? (
            <View style={[styles.categoryBadge, { backgroundColor: isDark ? "rgba(99, 102, 241, 0.15)" : "#eef2ff" }]}>
              <Layers size={11} color={colors.primary} />
              <Text style={[styles.categoryBadgeText, { color: colors.primary }]}>{product.category_name}</Text>
            </View>
          ) : null}

          {product.is_featured && (
            <View style={styles.featuredBadge}>
              <Sparkles size={11} color="#ffffff" />
              <Text style={styles.featuredBadgeText}>Featured</Text>
            </View>
          )}
        </View>

        <Text style={[styles.name, { color: colors.text }]}>{product.name}</Text>
        {product.sku ? <Text style={[styles.skuText, { color: colors.textMuted }]}>SKU / Code: {product.sku}</Text> : null}
      </View>

      {/* 💰 Price & Savings Card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.priceRow}>
          <Text style={[styles.price, { color: colors.primary }]}>{formatCurrency(price)}</Text>
          {hasDiscount && (
            <Text style={[styles.comparePrice, { color: colors.textMuted }]}>{formatCurrency(comparePrice)}</Text>
          )}
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>{discountPercent}% OFF</Text>
            </View>
          )}
        </View>

        {hasDiscount && (
          <View style={styles.savingsRow}>
            <Tag size={13} color="#16a34a" />
            <Text style={styles.savingsText}>You Save {formatCurrency(savingsAmount)} on MRP!</Text>
          </View>
        )}

        {/* Stock Status Badge */}
        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockBadge,
              { backgroundColor: isOutOfStock ? "#fee2e2" : isLowStock ? "#fef3c7" : "#dcfce7" },
            ]}
          >
            {isOutOfStock ? (
              <AlertTriangle size={13} color="#dc2626" />
            ) : isLowStock ? (
              <AlertTriangle size={13} color="#b45309" />
            ) : (
              <CheckCircle2 size={13} color="#16a34a" />
            )}
            <Text
              style={[
                styles.stockText,
                { color: isOutOfStock ? "#dc2626" : isLowStock ? "#b45309" : "#16a34a" },
              ]}
            >
              {isOutOfStock
                ? "Out of Stock"
                : isLowStock
                ? `Low Stock: Only ${product.stock_quantity} left`
                : `In Stock: ${product.stock_quantity} available in store`}
            </Text>
          </View>

          {product.allow_bargain !== false && (
            <View style={styles.bargainBadge}>
              <Sparkles size={11} color="#854d0e" />
              <Text style={styles.bargainBadgeText}>Bargain Allowed</Text>
            </View>
          )}
        </View>
      </View>

      {/* 💼 MERCHANT EXCLUSIVE PROFIT & COST INSIGHT BOX */}
      {isMerchant && (
        <View style={[styles.merchantBox, { backgroundColor: isDark ? "rgba(124, 58, 237, 0.12)" : "#f3e8ff", borderColor: "#7c3aed" }]}>
          <View style={styles.merchantHeader}>
            <BarChart2 size={16} color="#7c3aed" />
            <Text style={styles.merchantTitle}>Dukandar Profit & Cost Intelligence</Text>
          </View>

          <View style={styles.merchantGrid}>
            <View style={styles.merchantCol}>
              <Text style={styles.merchantLabel}>Cost Price (Kharid):</Text>
              <Text style={styles.merchantVal}>{costPrice > 0 ? formatCurrency(costPrice) : "Not set"}</Text>
            </View>

            <View style={styles.merchantCol}>
              <Text style={styles.merchantLabel}>Net Profit per Item:</Text>
              <Text style={[styles.merchantVal, { color: (profitPerPiece || 0) >= 0 ? "#16a34a" : "#dc2626" }]}>
                {profitPerPiece !== null ? `${formatCurrency(profitPerPiece)} (${profitMarginPercent}%)` : "N/A"}
              </Text>
            </View>

            {product.floor_price ? (
              <View style={styles.merchantCol}>
                <Text style={styles.merchantLabel}>Min Bargain Limit:</Text>
                <Text style={styles.merchantVal}>{formatCurrency(product.floor_price)}</Text>
              </View>
            ) : null}

            <View style={styles.merchantCol}>
              <Text style={styles.merchantLabel}>Reorder Alert Stock:</Text>
              <Text style={styles.merchantVal}>{product.min_stock || 5} pcs</Text>
            </View>
          </View>
        </View>
      )}

      {/* 🏪 Local Store Verification Card */}
      {product.shop_name && (
        <Pressable
          accessibilityRole="button"
          onPress={() => product.shop_slug && router.push(`/shop/${product.shop_slug}`)}
          style={[styles.shopCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        >
          <View style={styles.shopCardHeader}>
            <View style={[styles.shopIconCircle, { backgroundColor: colors.background }]}>
              <Store size={18} color={colors.primary} />
            </View>

            <View style={styles.shopCardInfo}>
              <View style={styles.shopNameRow}>
                <Text style={[styles.shopCardTitle, { color: colors.text }]}>{product.shop_name}</Text>
                <ShieldCheck size={14} color="#16a34a" />
              </View>
              {(product.shop_address || product.shop_city) && (
                <View style={styles.shopLocationRow}>
                  <MapPin size={11} color={colors.textMuted} />
                  <Text style={[styles.shopCardSub, { color: colors.textMuted }]}>
                    {[product.shop_address, product.shop_city].filter(Boolean).join(", ")}
                  </Text>
                </View>
              )}
            </View>

            {product.shop_slug && <ArrowRight size={16} color={colors.primary} />}
          </View>
        </Pressable>
      )}

      {/* 📋 Product Specifications & Attributes */}
      {attrEntries.length > 0 && (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.sectionHeader}>
            <SlidersHorizontal size={15} color={colors.primary} />
            <Text style={[styles.sectionHeading, { color: colors.text }]}>Product Specifications</Text>
          </View>

          <View style={styles.attrGrid}>
            {attrEntries.map(([key, val], idx) => (
              <View key={idx} style={[styles.attrItem, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.attrKey, { color: colors.textMuted }]}>{key}</Text>
                <Text style={[styles.attrVal, { color: colors.text }]}>{String(val)}</Text>
              </View>
            ))}
            {product.weight ? (
              <View style={[styles.attrItem, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <Text style={[styles.attrKey, { color: colors.textMuted }]}>Weight</Text>
                <Text style={[styles.attrVal, { color: colors.text }]}>{product.weight} kg</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* 📄 Description */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.sectionHeader}>
          <Package size={15} color={colors.primary} />
          <Text style={[styles.sectionHeading, { color: colors.text }]}>About Product</Text>
        </View>
        <Text style={[styles.description, { color: colors.text }]}>
          {product.description || "No detailed description provided for this product."}
        </Text>

        {tagsList.length > 0 && (
          <View style={styles.tagsContainer}>
            <Text style={[styles.tagsHeading, { color: colors.textMuted }]}>Keywords & Tags:</Text>
            <View style={styles.chipsRow}>
              {tagsList.map((tag, idx) => (
                <View key={idx} style={[styles.tagChip, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.tagChipText, { color: colors.textMuted }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 🛍️ Related Products */}
      {relatedProducts.length > 0 && (
        <View style={styles.relatedContainer}>
          <Text style={[styles.sectionHeading, { color: colors.text }]}>More Products From Same Store</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.relatedScroll}>
            {relatedProducts.map((rel) => (
              <Pressable
                key={rel.id}
                accessibilityRole="button"
                onPress={() => router.push(`/product/${rel.id}`)}
                style={[styles.relatedCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <AppImage
                  source={rel.images && rel.images.length > 0 ? rel.images[0] : ""}
                  height={110}
                  width={110}
                  borderRadius={10}
                  contentFit="cover"
                />
                <Text style={[styles.relatedName, { color: colors.text }]} numberOfLines={1}>
                  {rel.name}
                </Text>
                <Text style={[styles.relatedPrice, { color: colors.primary }]}>
                  {formatCurrency(rel.price)}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: { padding: 16, paddingBottom: 100, gap: 12 },
  tabletScroll: { maxWidth: 720, alignSelf: "center", width: "100%" },
  imageSection: { alignItems: "center" },
  carouselContent: { gap: 10 },
  imageContainer: { alignItems: "center", justifyContent: "center" },
  titleSection: { gap: 4 },
  categoryBadgeRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  categoryBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  categoryBadgeText: { fontSize: 11, fontWeight: "700" },
  featuredBadge: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#7c3aed", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  featuredBadgeText: { color: "#ffffff", fontSize: 10, fontWeight: "800" },
  name: { fontSize: 20, fontWeight: "800", lineHeight: 26, marginTop: 2 },
  skuText: { fontSize: 11, fontWeight: "600" },
  card: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  price: { fontSize: 26, fontWeight: "900" },
  comparePrice: { fontSize: 15, textDecorationLine: "line-through" },
  discountBadge: { backgroundColor: "#ef4444", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  discountText: { color: "#ffffff", fontSize: 11, fontWeight: "800" },
  savingsRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  savingsText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  stockRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  stockBadge: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  stockText: { fontSize: 11, fontWeight: "700" },
  bargainBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fef9c3", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  bargainBadgeText: { fontSize: 11, fontWeight: "700", color: "#854d0e" },
  merchantBox: { borderWidth: 1, borderRadius: 14, padding: 12, gap: 10 },
  merchantHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  merchantTitle: { fontSize: 13, fontWeight: "800", color: "#7c3aed" },
  merchantGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  merchantCol: { minWidth: "45%", flex: 1 },
  merchantLabel: { fontSize: 10, fontWeight: "600", color: "#6b21a8" },
  merchantVal: { fontSize: 13, fontWeight: "800", color: "#581c87", marginTop: 1 },
  shopCard: { borderWidth: 1, borderRadius: 14, padding: 12 },
  shopCardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  shopIconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  shopCardInfo: { flex: 1 },
  shopNameRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  shopCardTitle: { fontSize: 14, fontWeight: "800" },
  shopLocationRow: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  shopCardSub: { fontSize: 11 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  sectionHeading: { fontSize: 14, fontWeight: "800" },
  description: { fontSize: 13, lineHeight: 20 },
  attrGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  attrItem: { width: "48%", borderWidth: 1, borderRadius: 8, padding: 8 },
  attrKey: { fontSize: 10, fontWeight: "600" },
  attrVal: { fontSize: 12, fontWeight: "700", marginTop: 1 },
  tagsContainer: { marginTop: 8, gap: 4 },
  tagsHeading: { fontSize: 11, fontWeight: "600" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tagChip: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  tagChipText: { fontSize: 10, fontWeight: "600" },
  relatedContainer: { marginTop: 8, gap: 8 },
  relatedScroll: { gap: 10 },
  relatedCard: { width: 120, borderWidth: 1, borderRadius: 12, padding: 6, gap: 4 },
  relatedName: { fontSize: 12, fontWeight: "700" },
  relatedPrice: { fontSize: 12, fontWeight: "800" },
});
