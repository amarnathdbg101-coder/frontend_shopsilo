import React, { useState, useEffect, useCallback, useMemo } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { ProductList } from "@/features/products/components/ProductList";
import { ShopTopNav } from "@/features/shops/components/ShopTopNav";
import { ShopHeaderInfo } from "@/features/shops/components/ShopHeaderInfo";
import { ShopOffersSection } from "@/features/shops/components/ShopOffersSection";
import { ShopReviewsSection } from "@/features/shops/components/ShopReviewsSection";
import { ShopSearchBar } from "@/features/shops/components/ShopSearchBar";
import { ShopQRModal } from "@/features/shops/components/ShopQRModal";
import { AddReviewModal } from "@/features/shops/components/AddReviewModal";
import { useShopDetail, useInfiniteShopProducts } from "@/features/shops/api/useShopDetail";
import { useShopReviews } from "@/features/shops/api/useShopReviews";
import { Product } from "@/features/catalog/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { SearchX } from "lucide-react-native";

export default function ShopStorefrontScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors } = useThemeColor();
  const [isAddReviewOpen, setIsAddReviewOpen] = useState(false);
  const [isQROpen, setIsQROpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: shop, isLoading: isShopLoading } = useShopDetail(slug);
  const {
    data: infiniteData,
    isLoading: isProductsLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchProducts,
    isRefetching,
  } = useInfiniteShopProducts(slug, {
    search: debouncedSearch,
  });
  const { data: reviews = [], refetch: refetchReviews } = useShopReviews(slug);

  const shopProducts = useMemo(() => {
    return infiniteData?.pages.flatMap((p) => p.products) || [];
  }, [infiniteData]);

  const totalCount = infiniteData?.pages[0]?.total_count ?? shopProducts.length;

  const handleProductPress = useCallback(
    (product: Product) => router.push(`/product/${product.id}`),
    [router]
  );

  const handleRefresh = useCallback(() => {
    refetchProducts();
    refetchReviews();
  }, [refetchProducts, refetchReviews]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const listHeader = useMemo(() => {
    if (!shop) return null;
    return (
      <View>
        <ShopHeaderInfo shop={shop} />
        <ShopOffersSection shopSlug={shop.slug} />
        <ShopReviewsSection
          reviews={reviews}
          averageRating={shop.average_rating}
          totalReviews={shop.total_reviews}
          onAddReviewPress={() => setIsAddReviewOpen(true)}
        />
        <View style={styles.inventoryHeader}>
          <Text style={[styles.inventoryTitle, { color: colors.text }]}>
            {searchQuery.trim()
              ? `Found ${totalCount} item${totalCount === 1 ? "" : "s"}`
              : `Store Inventory (${totalCount})`}
          </Text>
          {searchQuery.trim().length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Text style={[styles.clearBtn, { color: colors.primary }]}>Clear</Text>
            </Pressable>
          )}
        </View>
        <ShopSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          shopName={shop.name}
        />
        {searchQuery.trim().length > 0 && shopProducts.length === 0 && !isProductsLoading && (
          <View style={[styles.emptySearch, { borderColor: colors.surfaceBorder }]}>
            <SearchX size={32} color={colors.textMuted} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              No items matching "{searchQuery}" in this shop.
            </Text>
          </View>
        )}
      </View>
    );
  }, [shop, reviews, totalCount, searchQuery, shopProducts.length, isProductsLoading, colors]);

  if (isShopLoading) {
    return <LoadingState fullScreen message="Loading storefront..." />;
  }

  if (!shop) {
    return (
      <ScreenWrapper style={styles.center}>
        <Text style={[styles.notFound, { color: colors.text }]}>Shop Not Found</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ErrorBoundary fallbackTitle="Unable to load Shop">
      <ScreenWrapper style={styles.container}>
        <ShopTopNav title={shop.name} shop={shop} onQRPress={() => setIsQROpen(true)} />

        <ProductList
          products={shopProducts}
          onProductPress={handleProductPress}
          onRefresh={handleRefresh}
          refreshing={isRefetching}
          onEndReached={handleEndReached}
          isFetchingNextPage={isFetchingNextPage}
          ListHeaderComponent={listHeader}
        />

        <AddReviewModal
          shopSlug={shop.slug}
          shopName={shop.name}
          visible={isAddReviewOpen}
          onClose={() => setIsAddReviewOpen(false)}
        />

        <ShopQRModal
          shop={shop}
          visible={isQROpen}
          onClose={() => setIsQROpen(false)}
        />
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 10, flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  notFound: { fontSize: 18, fontWeight: "700" },
  inventoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, marginBottom: 2 },
  inventoryTitle: { fontSize: 16, fontWeight: "800" },
  clearBtn: { fontSize: 12, fontWeight: "700" },
  emptySearch: { alignItems: "center", justifyContent: "center", padding: 24, borderWidth: 1, borderStyle: "dashed", borderRadius: 14, marginTop: 10, gap: 6 },
  emptyText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
});
