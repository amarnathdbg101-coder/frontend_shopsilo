/**
 * ============================================================================
 * 📌 WHAT: Merchant Stock & Inventory Control Center Screen.
 * ⚙️ HOW: Renders 2-column grid (`numColumns={2}`) with `useInfiniteMerchantProducts`
 *         infinite scroll pagination. Uses exact DB stock (`stock_quantity`) without frontend modification.
 * 🎯 WHY: Allows shopkeepers to monitor stock levels, adjust quantities, bulk restock (+10),
 *         import CSV catalogs, and edit product details with max 4 photos.
 * 🔄 ALTERNATIVE: Subtracting reserved quantities on frontend was causing stock numbers
 *               to decrease automatically on every re-render.
 * 📍 WHERE: `app/merchant/inventory.tsx` • Main Inventory Management Route.
 * ============================================================================
 */
import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Alert,
  ActivityIndicator,
} from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { expandHinglishSynonyms } from "@/utils/fuzzyMatcher";
import { useRouter } from "expo-router";
import { useLowStockItems, useAdjustStock } from "@/features/merchant/api/useInventory";
import { useMerchantProducts, useInfiniteMerchantProducts } from "@/features/merchant/api/usePOS";
import { InventoryItemCard } from "@/features/merchant/components/InventoryItemCard";
import { StockAdjustModal } from "@/features/merchant/components/StockAdjustModal";
import { EditProductModal } from "@/features/merchant/components/EditProductModal";
import { BulkImportModal } from "@/features/merchant/components/BulkImportModal";
import { LowStockItem } from "@/features/merchant/types";
import { apiClient } from "@/api/client";
import {
  Search,
  ShieldCheck,
  AlertTriangle,
  Boxes,
  Zap,
  FileText,
  ArrowDownToLine,
  FileSpreadsheet,
  Plus,
  X,
} from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { InAppPDFModal } from "@/components/InAppPDFModal";

function InventoryContent() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [search]);
  const [activeTab, setActiveTab] = useState<"all" | "low">("all");
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);
  const [selectedEditItem, setSelectedEditItem] = useState<LowStockItem | null>(null);
  const [isBulkRestocking, setIsBulkRestocking] = useState(false);
  const [bulkImportOpen, setBulkImportOpen] = useState(false);
  const [reorderPdfOpen, setReorderPdfOpen] = useState(false);

  const { data: lowItems, isLoading: loadingLow, refetch: refetchLow } = useLowStockItems();
  const { data: rawMerchantProducts, isLoading: loadingAll, refetch: refetchAll } = useMerchantProducts(debouncedSearch);
  const {
    data: infiniteData,
    isLoading: loadingInfinite,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch: refetchInfinite,
  } = useInfiniteMerchantProducts(debouncedSearch);

  const adjustStockMutation = useAdjustStock();

  // 📦 Extract exact stock quantity directly from PostgreSQL database without altering it on frontend
  const allItems: LowStockItem[] = (rawMerchantProducts ?? []).map((p: any) => ({
    product_id: p.id,
    id: p.id,
    name: p.title || p.name || "Product",
    sku: p.sku || "",
    current_stock: Number(p.stock_quantity ?? p.stock ?? 0),
    low_stock_threshold: Number(p.min_stock || p.low_stock_threshold || 5),
    price: Number(p.price) || 0,
    cost_price: p.cost_price ? Number(p.cost_price) : undefined,
    image_url: p.image_url || p.images?.[0] || "",
    images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
  }));

  const infiniteList: LowStockItem[] = (infiniteData?.pages.flatMap((pg) => pg.products) ?? []).map((p: any) => ({
    product_id: p.id,
    id: p.id,
    name: p.title || p.name || "Product",
    sku: p.sku || "",
    current_stock: Number(p.stock_quantity ?? p.stock ?? 0),
    low_stock_threshold: Number(p.min_stock || p.low_stock_threshold || 5),
    price: Number(p.price) || 0,
    cost_price: p.cost_price ? Number(p.cost_price) : undefined,
    image_url: p.image_url || p.images?.[0] || "",
    images: Array.isArray(p.images) ? p.images : p.image_url ? [p.image_url] : [],
  }));

  const sourceList = activeTab === "low" ? (lowItems ?? []) : (infiniteList.length > 0 ? infiniteList : allItems);

  const searchSynonyms = useMemo(() => {
    const clean = search.trim().toLowerCase();
    return clean ? expandHinglishSynonyms(clean) : [];
  }, [search]);

  const filtered = sourceList.filter((i) => {
    if (searchSynonyms.length === 0) return true;
    const name = (i.product_name || i.name || "").toLowerCase();
    const sku = (i.sku || "").toLowerCase();

    return searchSynonyms.some(
      (syn: string) => name.includes(syn) || sku.includes(syn)
    );
  });

  const totalStockRetailValue = allItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.current_stock || 0),
    0
  );

  const isRefreshing = loadingLow || loadingAll || loadingInfinite;

  const handleBulkRestock = async (units = 10) => {
    const targets = (lowItems && lowItems.length > 0 ? lowItems : allItems).filter(
      (i) => i.current_stock <= 5
    );

    if (targets.length === 0) {
      Alert.alert("Inventory Healthy", "All products are above minimum stock levels!");
      return;
    }

    Alert.alert(
      "Confirm Bulk Restock",
      `Bulk restock ${targets.length} low-stock products with +${units} units each?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Restock Now",
          onPress: async () => {
            setIsBulkRestocking(true);
            try {
              for (const t of targets) {
                await adjustStockMutation.mutateAsync({
                  product_id: t.product_id || t.id || "",
                  adjustment: units,
                  reason: `1-Click Bulk Restock (+${units})`,
                });
              }
              await Promise.all([refetchLow(), refetchAll(), refetchInfinite()]);
              Alert.alert("Success", `Restocked ${targets.length} products with +${units} units.`);
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to bulk restock products.");
            } finally {
              setIsBulkRestocking(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenReorderPDF = () => {
    setReorderPdfOpen(true);
  };

  const reorderPdfUrl = `${apiClient.defaults.baseURL || "https://api.shopsilo.in"}/shops/me/inventory/reorder-sheet.pdf`;

  return (
    <ScreenWrapper style={styles.container}>
      <View style={styles.pageHeader}>
        <View style={styles.pageTitleGroup}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>CATALOG CONTROL</Text>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Inventory</Text>
          <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>Keep every shelf ready to sell.</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Add new product"
          onPress={() => router.push("/merchant/add-product")}
          style={({ pressed }) => [styles.addProductButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.addProductText}>Add product</Text>
        </Pressable>
      </View>

      {/* Search and Tabs */}
      <View style={[styles.searchBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Search size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Search inventory, SKU, Hinglish ('doodh', 'tel')..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear inventory search" onPress={() => setSearch("")} hitSlop={8}>
            <X size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* Stock Retail Value & Bulk Restock Header */}
      <View style={[styles.kpiCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View>
          <Text style={[styles.kpiLabel, { color: colors.textMuted }]}>STOCK RETAIL VALUE</Text>
          <Text style={[styles.kpiValue, { color: colors.primary }]}>
            ₹{totalStockRetailValue.toLocaleString("en-IN")}
          </Text>
          <Text style={[styles.kpiMeta, { color: colors.textMuted }]}>{lowItems?.length ?? 0} items need attention</Text>
        </View>

        <View style={{ flexDirection: "row", gap: 6, alignItems: "center" }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setBulkImportOpen(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.bulkBtn,
              { backgroundColor: "#059669" },
              pressed && { opacity: 0.8 },
            ]}
          >
            <FileSpreadsheet size={14} color="#fff" />
            <Text style={styles.bulkBtnText}>Import CSV 📂</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            disabled={isBulkRestocking}
            onPress={() => handleBulkRestock(10)}
            style={styles.bulkBtn}
          >
            {isBulkRestocking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Zap size={14} color="#fff" />
                <Text style={styles.bulkBtnText}>+10 Stock</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>

      <View style={styles.tabRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("all")}
          style={[styles.tab, activeTab === "all" && { backgroundColor: colors.primary, borderColor: colors.primary }]}
        >
          <Boxes size={14} color={activeTab === "all" ? "#fff" : colors.textMuted} />
          <Text style={[styles.tabText, { color: activeTab === "all" ? "#fff" : colors.text }]}>
            All Products ({allItems.length})
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => setActiveTab("low")}
          style={[styles.tab, activeTab === "low" && { backgroundColor: "#dc2626", borderColor: "#dc2626" }]}
        >
          <AlertTriangle size={14} color={activeTab === "low" ? "#fff" : "#dc2626"} />
          <Text style={[styles.tabText, { color: activeTab === "low" ? "#fff" : "#dc2626" }]}>
            Low Stock ({lowItems?.length ?? 0})
          </Text>
        </Pressable>
      </View>

      {/* Wholesale Reorder PDF Banner when on Low Stock */}
      {activeTab === "low" && (lowItems?.length ?? 0) > 0 && (
        <View style={styles.reorderBanner}>
          <View style={styles.reorderIconCol}>
            <FileText size={22} color="#92400e" />
          </View>
          <View style={styles.reorderTextCol}>
            <Text style={styles.reorderTitle}>Wholesale Reorder PDF Sheet</Text>
            <Text style={styles.reorderSub}>
              Download printable PO sheet with items, barcodes & reorder quantities for wholesale suppliers.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={handleOpenReorderPDF}
              style={styles.pdfBtn}
            >
              <ArrowDownToLine size={14} color="#fff" />
              <Text style={styles.pdfBtnText}>Download Reorder Sheet PDF</Text>
            </Pressable>
          </View>
        </View>
      )}

      {loadingLow && loadingAll && loadingInfinite ? (
        <LoadingState message="Checking warehouse inventory..." />
      ) : (
        <FlatList
          key="inventory-grid-2"
          numColumns={2}
          data={filtered}
          keyExtractor={(item, index) => item.product_id || item.id || `inv-${index}`}
          renderItem={({ item }) => (
            <InventoryItemCard
              item={item}
              onAdjust={(target) => setSelectedItem(target)}
              onEdit={(target) => setSelectedEditItem(target)}
            />
          )}
          onEndReached={() => {
            if (activeTab === "all" && hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={{ paddingVertical: 16, alignItems: "center", width: "100%" }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 4 }}>
                  Loading more products...
                </Text>
              </View>
            ) : null
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => {
                refetchLow();
                refetchAll();
                refetchInfinite();
              }}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <ShieldCheck size={40} color="#16a34a" />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                {activeTab === "low" ? "Stock Levels Healthy!" : "No Products Found"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                {activeTab === "low"
                  ? "No products are running below their minimum alert threshold right now."
                  : "Add products to your catalog to track real-time inventory."}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Adjust Stock Quantity Modal */}
      <StockAdjustModal
        visible={!!selectedItem}
        item={selectedItem}
        onClose={() => setSelectedItem(null)}
      />

      {/* ✏️ Edit Product Details Modal */}
      <EditProductModal
        visible={!!selectedEditItem}
        item={selectedEditItem}
        onClose={() => setSelectedEditItem(null)}
        onSuccess={() => {
          refetchLow();
          refetchAll();
          refetchInfinite();
        }}
      />

      {/* 📂 Bulk CSV / Excel Import Modal */}
      <BulkImportModal
        visible={bulkImportOpen}
        onClose={() => setBulkImportOpen(false)}
        onSuccess={() => {
          refetchLow();
          refetchAll();
          refetchInfinite();
        }}
      />

      <InAppPDFModal
        visible={reorderPdfOpen}
        title="Wholesale Reorder Sheet"
        pdfUrl={reorderPdfUrl}
        filename={`reorder-sheet-${new Date().toISOString().slice(0, 10)}.pdf`}
        items={(lowItems || []).map((item) => ({
          name: item.product_name || item.name || "Product",
          qty: `${item.current_stock ?? 0} in stock`,
        }))}
        onClose={() => setReorderPdfOpen(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 12 },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 14, marginBottom: 12, paddingHorizontal: 2 },
  pageTitleGroup: { flex: 1 },
  eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  pageTitle: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  addProductButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 9 },
  addProductText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  pressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  searchBox: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, height: 40, gap: 6, marginTop: 12, marginBottom: 8 },
  input: { flex: 1, fontSize: 13, height: "100%" },
  kpiCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  kpiLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  kpiValue: { fontSize: 18, fontWeight: "900", marginTop: 2 },
  kpiMeta: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  bulkBtn: {
    backgroundColor: "#10b981",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bulkBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: "#cbd5e1" },
  tabText: { fontSize: 12, fontWeight: "700" },
  reorderBanner: {
    backgroundColor: "#fef3c7",
    borderColor: "#fde68a",
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    gap: 10,
    marginBottom: 12,
  },
  reorderIconCol: { paddingTop: 2 },
  reorderTextCol: { flex: 1 },
  reorderTitle: { fontSize: 13, fontWeight: "800", color: "#92400e" },
  reorderSub: { fontSize: 11, color: "#b45309", marginTop: 2, lineHeight: 15 },
  pdfBtn: {
    backgroundColor: "#92400e",
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 8,
  },
  pdfBtnText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  list: { paddingBottom: 24, paddingHorizontal: 2 },
  emptyContainer: { paddingVertical: 50, alignItems: "center", paddingHorizontal: 20 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "rgba(22,163,74,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 6 },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});

export default function InventoryScreen() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load Inventory">
      <InventoryContent />
    </ErrorBoundary>
  );
}
