import React, { useState, useEffect, useCallback } from "react";
import { StyleSheet, Text, View, TextInput, FlatList, Pressable, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { DistanceFilterBar } from "@/features/shops/components/DistanceFilterBar";
import { NearbyShopListItem } from "@/features/shops/components/NearbyShopListItem";
import { LocationModal } from "@/features/location/components/LocationModal";
import { useShops } from "@/features/shops/api/useShops";
import { useLocationStore } from "@/store/useLocationStore";
import { Shop } from "@/features/shops/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ArrowLeft, MapPin, Store, Search, X } from "lucide-react-native";

export default function NearbyShopsScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { currentLocation } = useLocationStore();

  const [distance, setDistance] = useState<number>(10);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [searchShop, setSearchShop] = useState("");
  const [debouncedShopSearch, setDebouncedShopSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedShopSearch(searchShop.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [searchShop]);

  const { data: shopsData, isLoading, refetch, isRefetching } = useShops({
    lat: currentLocation.latitude,
    lng: currentLocation.longitude,
    radius_km: distance,
    search: debouncedShopSearch || undefined,
    limit: 50,
  });

  const shops = shopsData?.shops || [];

  const handleShopPress = useCallback(
    (shop: Shop) => router.push(`/shop/${shop.slug}`),
    [router]
  );

  return (
    <ErrorBoundary fallbackTitle="Unable to load Nearby Stores">
      <ScreenWrapper style={styles.container}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={22} color={colors.text} />
          </Pressable>
          <View style={styles.titleCol}>
            <Text style={[styles.title, { color: colors.text }]}>Local Stores Near You</Text>
            <Pressable onPress={() => setIsLocationModalOpen(true)} style={styles.locationChip}>
              <MapPin size={11} color={colors.primary} />
              <Text numberOfLines={1} style={[styles.locationText, { color: colors.primary }]}>
                {currentLocation.suburb || currentLocation.city} (Tap to change)
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Shop Search Input */}
        <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search stores by name or type (e.g. Kirana, Dairy)..."
            placeholderTextColor={colors.textMuted}
            value={searchShop}
            onChangeText={setSearchShop}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchShop.length > 0 && (
            <Pressable
              accessibilityRole="button"
              onPress={() => setSearchShop("")}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <X size={14} color={colors.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Distance Range Filter */}
        <DistanceFilterBar selectedDistance={distance} onSelectDistance={setDistance} />

        {/* Shops Listing */}
        {isLoading ? (
          <LoadingState message={`Finding local shops within ${distance} km...`} />
        ) : (
          <FlatList
            data={shops}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <NearbyShopListItem shop={item} onPress={handleShopPress} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
            ListEmptyComponent={
              <View style={[styles.emptyBox, { borderColor: colors.surfaceBorder }]}>
                <Store size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Stores Within {distance} km</Text>
                <Text style={[styles.emptySub, { color: colors.textMuted }]}>
                  Try expanding your search distance or change your city location.
                </Text>
                <Pressable onPress={() => setDistance(25)} style={[styles.expandBtn, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.expandBtnText, { color: colors.primaryForeground }]}>Expand to 25 km</Text>
                </Pressable>
              </View>
            }
          />
        )}

        <LocationModal visible={isLocationModalOpen} onClose={() => setIsLocationModalOpen(false)} />
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 6, flex: 1 },
  searchBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, height: 42, gap: 8, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: "600" },
  topBar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  backBtn: { padding: 4 },
  titleCol: { flex: 1 },
  title: { fontSize: 18, fontWeight: "800" },
  locationChip: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 2 },
  locationText: { fontSize: 11, fontWeight: "700" },
  listContent: { paddingBottom: 40 },
  emptyBox: { alignItems: "center", justifyContent: "center", padding: 24, borderWidth: 1, borderRadius: 16, borderStyle: "dashed", marginTop: 20, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "800", marginTop: 6 },
  emptySub: { fontSize: 12, textAlign: "center", lineHeight: 18 },
  expandBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10, marginTop: 6 },
  expandBtnText: { fontSize: 12, fontWeight: "800" },
});
