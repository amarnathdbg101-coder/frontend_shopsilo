/**
 * ============================================================================
 * 📌 WHAT: Shopkeeper Merchant OS Operational Control Center Dashboard.
 * ⚙️ HOW: Executes `useMerchantDashboard` (1 consolidated backend query fetching shop profile,
 *         daily digest, weekly scorecard, and active offers in a single HTTP call).
 * 🎯 WHY: Serves as the central command hub for Indian Kirana store owners, displaying
 *         today's sales (₹), Khata Udhar, stock alerts, and 1-tap counter tools.
 * 🔄 ALTERNATIVE: Making 5 parallel query requests caused server connection overload
 *               and layout flickering on slower mobile networks.
 * 📍 WHERE: `app/merchant/dashboard.tsx` • Main screen for logged-in shopkeepers.
 * ============================================================================
 */
import React, { useState } from "react";
import { StyleSheet, View, ScrollView, RefreshControl, Text } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LoadingState } from "@/components/LoadingState";
import { useMerchantDashboard } from "@/features/merchant/api/useMerchantDashboard";
import { useToggleShopStatus } from "@/features/merchant/api/useMerchantStore";
import { MerchantDashboardHeader } from "@/features/merchant/components/MerchantDashboardHeader";
import { MerchantKPIGrid } from "@/features/merchant/components/MerchantKPIGrid";
import { MerchantDiscoveryCard } from "@/features/merchant/components/MerchantDiscoveryCard";
import { MerchantToolsSection } from "@/features/merchant/components/MerchantToolsSection";
import { NoShopRegisteredView } from "@/features/merchant/components/NoShopRegisteredView";
import { ShopQRModal } from "@/features/merchant/components/ShopQRModal";
import { ProductScannerModal } from "@/features/catalog/components/ProductScannerModal";
import { useDrawerStore } from "@/store/useDrawerStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MerchantFocusPlanCard } from "@/features/merchant/components/MerchantFocusPlanCard";

function MerchantDashboardContent() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const openDrawer = useDrawerStore((s) => s.openDrawer);
  const [showQR, setShowQR] = useState(false);
  const [showPriceCheck, setShowPriceCheck] = useState(false);

  // 🚀 Single unified dashboard query (replaces 5 parallel network roundtrips)
  const { data, isLoading, isError, refetch, isRefetching } = useMerchantDashboard();
  const toggleStatus = useToggleShopStatus();

  const shop = data?.shop;
  const digest = data?.digest;
  const scorecard = data?.weekly_scorecard;
  const activeOffersCount = data?.active_offers_count ?? 0;

  if (isLoading && !data) {
    return <LoadingState fullScreen message="Loading Dukandar OS..." />;
  }

  if (!isLoading && (!shop || isError)) {
    return (
      <ScreenWrapper style={styles.container}>
        <NoShopRegisteredView onRetry={() => refetch()} />
      </ScreenWrapper>
    );
  }

  const isOpen = shop?.is_open ?? true;
  const weeklyOrders = scorecard?.total_bills_count ?? digest?.today_sales_count ?? 0;
  const khataCustomers = digest?.total_khata_customers ?? 0;
  const rating = typeof shop?.average_rating === "number" ? shop.average_rating : Number(shop?.average_rating) || 0;
  const reviewCount = typeof shop?.total_reviews === "number" ? shop.total_reviews : Number(shop?.total_reviews) || 0;
  const topProduct = scorecard?.top_selling_products?.[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const todayLabel = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date());

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <MerchantDashboardHeader
          shop={shop || undefined}
          isOpen={isOpen}
          isToggling={toggleStatus.isPending}
          onToggleStatus={(val) => toggleStatus.mutate(val)}
          onQRPress={() => setShowQR(true)}
          onSettingsPress={() => router.push("/merchant/settings")}
        />

        <View style={styles.contextRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.textMuted }]}>{greeting}, shopkeeper</Text>
            <Text style={[styles.contextTitle, { color: colors.text }]}>Your store at a glance</Text>
          </View>
          <View style={[styles.datePill, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.dateText, { color: colors.primary }]}>{todayLabel}</Text>
          </View>
        </View>

        <MerchantFocusPlanCard
          lowStockCount={digest?.low_stock_count ?? 0}
          activeReservations={digest?.active_reservations ?? 0}
          activeOffersCount={activeOffersCount}
          onInventoryPress={() => router.push("/merchant/inventory")}
          onPickupPress={() => router.push("/merchant/pickups")}
          onOffersPress={() => router.push("/merchant/offers")}
        />

        <View style={styles.sectionIntro}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>TODAY</Text>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Your numbers</Text>
        </View>

        <MerchantKPIGrid
          digest={digest || undefined}
          onPressTodaySales={() => router.push("/merchant/pos")}
          onPressKhata={() => router.push("/merchant/khata")}
          onPressPickups={() => router.push("/merchant/inventory")}
          onPressAlerts={() => router.push("/merchant/inventory")}
        />

        <MerchantDiscoveryCard
          weeklyOrders={weeklyOrders}
          khataCustomers={khataCustomers}
          rating={rating}
          reviewCount={reviewCount}
          topItemName={topProduct?.product_name}
          topItemSold={topProduct?.units_sold}
          activeOffersCount={activeOffersCount}
        />

        <MerchantToolsSection
          onOpenDrawer={openDrawer}
          onPriceCheckPress={() => setShowPriceCheck(true)}
        />
      </ScrollView>

      <ShopQRModal visible={showQR} onClose={() => setShowQR(false)} shop={shop || undefined} />
      <ProductScannerModal visible={showPriceCheck} onClose={() => setShowPriceCheck(false)} />
    </ScreenWrapper>
  );
}

export default function MerchantDashboardScreen() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load Merchant Dashboard">
      <MerchantDashboardContent />
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 14, paddingBottom: 80 },
  contextRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14, paddingHorizontal: 2 },
  greeting: { color: "#64748b", fontSize: 12, fontWeight: "700" },
  contextTitle: { color: "#0f172a", fontSize: 18, fontWeight: "900", marginTop: 2 },
  datePill: { backgroundColor: "#eef2ff", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  dateText: { color: "#4f46e5", fontSize: 11, fontWeight: "800" },
  sectionIntro: { marginBottom: 10, marginTop: 2 },
  eyebrow: { fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  sectionTitle: { fontSize: 16, fontWeight: "800", marginTop: 3 },
});
