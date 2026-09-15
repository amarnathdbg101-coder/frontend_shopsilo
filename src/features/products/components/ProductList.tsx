import React, { useCallback } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Product } from "@/features/catalog/types";
import { ProductCard } from "@/features/products/components/ProductCard";
import { ProductCardSkeletonGrid } from "@/components/SkeletonLoader";

interface ProductListProps {
  products: Product[];
  onProductPress: (product: Product) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  onEndReached?: () => void;
  isFetchingNextPage?: boolean;
  ListHeaderComponent?: React.ReactElement | null;
  ListEmptyComponent?: React.ReactElement | null;
}

export const ProductList: React.FC<ProductListProps> = ({
  products,
  onProductPress,
  onRefresh,
  refreshing = false,
  onEndReached,
  isFetchingNextPage = false,
  ListHeaderComponent,
  ListEmptyComponent,
}) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const numColumns = 2; // Always display two products per row

  const renderItem = useCallback(
    ({ item }: { item: Product }) => (
      <View style={styles.cellWrapper}>
        <ProductCard
          product={item}
          onPress={onProductPress}
          isTablet={isTablet}
        />
      </View>
    ),
    [onProductPress, isTablet]
  );

  const keyExtractor = useCallback((item: Product) => item.id, []);

  return (
    <View style={styles.container}>
      <FlashList
        key={`products-col-${numColumns}`}
        data={products}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={numColumns}
        onRefresh={onRefresh}
        refreshing={refreshing}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={{ paddingVertical: 12 }}>
              <ProductCardSkeletonGrid />
            </View>
          ) : (
            <View style={styles.footerSpacer} />
          )
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  cellWrapper: {
    flex: 1,
    paddingHorizontal: 2,
  },
  footerSpacer: {
    height: 95,
  },
  listContent: {
    paddingBottom: 104,
  },
});
