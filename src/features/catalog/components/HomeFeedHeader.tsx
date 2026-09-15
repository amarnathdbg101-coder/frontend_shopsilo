import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { HomeHeader } from "./HomeHeader";
import { SearchBar } from "./SearchBar";
import { SmartSearchModal } from "./SmartSearchModal";
import { HeroBannerCarousel } from "./HeroBannerCarousel";
import { QuickFeatureChips } from "./QuickFeatureChips";
import { CategoryList } from "./CategoryList";
import { NearbyShopsSection } from "@/features/shops/components/NearbyShopsSection";
import { Category } from "../types";
import { Shop } from "@/features/shops/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Flame, X } from "lucide-react-native";

interface HomeFeedHeaderProps {
  search: string;
  onSearchChange: (val: string) => void;
  selectedCatId?: string;
  onSelectCategory: (id?: string) => void;
  categories: Category[];
  shops: Shop[];
  productCount: number;
  onLocationPress: () => void;
  onDealsPress: () => void;
  onShopPress: (s: Shop) => void;
}

export const HomeFeedHeader: React.FC<HomeFeedHeaderProps> = ({
  search,
  onSearchChange,
  selectedCatId,
  onSelectCategory,
  categories,
  shops,
  productCount,
  onLocationPress,
  onDealsPress,
  onShopPress,
}) => {
  const { colors } = useThemeColor();
  const [smartSearchVisible, setSmartSearchVisible] = useState(false);
  const isSearching = search.trim().length > 0;
  const selectedCategory = categories.find((c) => c.id === selectedCatId);

  return (
    <View style={styles.headerWrap}>
      <HomeHeader onLocationPress={onLocationPress} />
      <SearchBar
        value={search}
        onChangeText={onSearchChange}
        onPressSearchModal={() => setSmartSearchVisible(true)}
      />

      <SmartSearchModal
        visible={smartSearchVisible}
        initialQuery={search}
        onClose={() => setSmartSearchVisible(false)}
        onSelectQuery={(term) => {
          onSearchChange(term);
          setSmartSearchVisible(false);
        }}
      />

      {!isSearching && !selectedCatId && (
        <>
          <HeroBannerCarousel />
          <QuickFeatureChips onDealsPress={onDealsPress} />
        </>
      )}

      {categories.length > 0 && (
        <CategoryList
          categories={categories}
          selectedCategoryId={selectedCatId}
          onSelectCategory={onSelectCategory}
        />
      )}

      {!isSearching && !selectedCatId && (
        <NearbyShopsSection shops={shops} onShopPress={onShopPress} />
      )}

      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleRow}>
          <Flame size={18} color="#ea580c" />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {selectedCategory
              ? selectedCategory.name
              : isSearching
              ? `Results for "${search}"`
              : "Trending in Local Stores"}
          </Text>
        </View>
        <View style={styles.rightInfoRow}>
          {selectedCategory && (
            <Pressable
              onPress={() => onSelectCategory(undefined)}
              style={({ pressed }) => [
                styles.clearFilterChip,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={[styles.clearFilterText, { color: colors.primary }]}>Show All</Text>
              <X size={12} color={colors.primary} />
            </Pressable>
          )}
          <Text style={[styles.productCount, { color: colors.textMuted }]}>
            {productCount} items
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerWrap: { paddingBottom: 8 },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
    marginBottom: 8,
  },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 16, fontWeight: "800" },
  rightInfoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  clearFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  clearFilterText: {
    fontSize: 11,
    fontWeight: "700",
  },
  productCount: { fontSize: 12, fontWeight: "600" },
});
