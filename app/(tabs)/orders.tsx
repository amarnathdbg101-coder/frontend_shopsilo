import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, RefreshControl, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ReservationCard } from "@/features/reservations/components/ReservationCard";
import { FavoriteShopsList } from "@/features/shops/components/FavoriteShopsList";
import { useUserReservations } from "@/features/reservations/api/useReservations";
import { useFavoriteShopsStore } from "@/store/useFavoriteShopsStore";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Shop } from "@/features/shops/types";
import { BookmarkCheck, Heart, ShoppingBag } from "lucide-react-native";

export default function SavedAndOrdersScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [activeTab, setActiveTab] = useState<"favorites" | "orders">("favorites");
  const { favoriteShops } = useFavoriteShopsStore();
  const { data: reservations = [], isLoading, refetch, isRefetching } = useUserReservations();

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleShopPress = useCallback(
    (shop: Shop) => router.push(`/shop/${shop.slug}`),
    [router]
  );

  if (isLoading && activeTab === "orders") {
    return <LoadingState fullScreen message="Loading reservations..." />;
  }

  return (
    <ErrorBoundary fallbackTitle="Unable to load Favorites & Orders">
      <ScreenWrapper style={styles.container}>
        {/* Top Segment Switch */}
        <View style={[styles.tabSegment, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Pressable
            onPress={() => setActiveTab("favorites")}
            style={[
              styles.segmentBtn,
              activeTab === "favorites" && [styles.activeSegmentBtn, { backgroundColor: colors.primary }],
            ]}
          >
            <Heart size={14} color={activeTab === "favorites" ? colors.primaryForeground : colors.textMuted} fill={activeTab === "favorites" ? colors.primaryForeground : "transparent"} />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "favorites" ? colors.primaryForeground : colors.textMuted },
              ]}
            >
              Favorite Stores ({favoriteShops.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setActiveTab("orders")}
            style={[
              styles.segmentBtn,
              activeTab === "orders" && [styles.activeSegmentBtn, { backgroundColor: colors.primary }],
            ]}
          >
            <ShoppingBag size={14} color={activeTab === "orders" ? colors.primaryForeground : colors.textMuted} />
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === "orders" ? colors.primaryForeground : colors.textMuted },
              ]}
            >
              Orders ({reservations.length})
            </Text>
          </Pressable>
        </View>

        {activeTab === "favorites" ? (
          <FavoriteShopsList onShopPress={handleShopPress} />
        ) : (
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} tintColor={colors.primary} />}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.text }]}>In-Store Reservations</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Show your counter OTP to the shopkeeper for priority pickup
              </Text>
            </View>

            {reservations.length === 0 ? (
              <View style={[styles.emptyContainer, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <BookmarkCheck size={44} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Reservations</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                  Browse products from local shops and reserve them at the counter with 0 advance payment.
                </Text>
              </View>
            ) : (
              reservations.map((res) => <ReservationCard key={res.id} reservation={res} />)
            )}
          </ScrollView>
        )}
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingTop: 6, flex: 1 },
  tabSegment: { flexDirection: "row", borderRadius: 12, borderWidth: 1, padding: 3, marginBottom: 12 },
  segmentBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 9 },
  activeSegmentBtn: { elevation: 2 },
  segmentText: { fontSize: 12, fontWeight: "700" },
  scrollContent: { paddingTop: 6, paddingBottom: 95 },
  header: { marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 3 },
  emptyContainer: { padding: 28, borderRadius: 16, borderWidth: 1, alignItems: "center", marginTop: 24, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySubtitle: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
