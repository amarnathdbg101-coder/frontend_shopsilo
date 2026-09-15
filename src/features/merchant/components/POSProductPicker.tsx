import React, { useState, useEffect, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMerchantProducts } from "../api/usePOS";
import { searchProductsWithAISemantic } from "../services/aiSearch";
import { formatCurrency } from "@/utils/format";
import { resolveImageUrl } from "@/components/AppImage";
import {
  Search,
  Plus,
  Sparkles,
  ClipboardList,
  X,
  Check,
} from "lucide-react-native";
import { Product } from "@/features/products/types";
import { expandHinglishSynonyms } from "@/utils/fuzzyMatcher";

interface POSProductPickerProps {
  onSelectProduct: (product: Product) => void;
}

const EMPTY_PRODUCTS: Product[] = [];

export const POSProductPicker: React.FC<POSProductPickerProps> = ({
  onSelectProduct,
}) => {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const [search, setSearch] = useState("");
  const [lastAddedId, setLastAddedId] = useState<string | null>(null);

  const trimmedSearch = search.trim();

  // Single query for all merchant products
  const { data: rawAllProducts } = useMerchantProducts();
  const allProducts = rawAllProducts || EMPTY_PRODUCTS;
  const searchFiltered = useMemo(() => {
    if (!trimmedSearch) return EMPTY_PRODUCTS;
    const normalizedSearch = trimmedSearch.toLowerCase();
    const synonyms = expandHinglishSynonyms(normalizedSearch);

    return allProducts.filter((product) => {
      const title = (product.title || (product as any).name || "").toLowerCase();
      const sku = product.sku?.toLowerCase() || "";
      const desc = (product as any).description?.toLowerCase() || "";

      return synonyms.some(
        (syn) => title.includes(syn) || sku.includes(syn) || desc.includes(syn)
      );
    });
  }, [allProducts, trimmedSearch]);

  const [aiResults, setAiResults] = useState<Product[]>(EMPTY_PRODUCTS);
  const [isAiMatch, setIsAiMatch] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);

  // Compute products to display
  const displayProducts = useMemo(() => {
    if (!trimmedSearch) {
      return allProducts;
    }
    if (searchFiltered.length > 0) {
      return searchFiltered;
    }
    return aiResults;
  }, [trimmedSearch, allProducts, searchFiltered, aiResults]);

  // Barcode / SKU Auto-Detect (If 6+ digit barcode scanned or typed)
  useEffect(() => {
    if (!trimmedSearch || trimmedSearch.length < 6) return;

    const exactBarcodeMatch = allProducts.find(
      (p) => p.sku && p.sku.toLowerCase() === trimmedSearch.toLowerCase()
    );

    if (exactBarcodeMatch) {
      handleAddItem(exactBarcodeMatch);
      setSearch(""); // Auto-clear after barcode scan
    }
  }, [trimmedSearch, allProducts]);

  // Run AI Semantic intent search only when local keyword search returns 0 items
  useEffect(() => {
    if (!trimmedSearch || searchFiltered.length > 0) {
      setIsAiMatch(false);
      setAiResults(EMPTY_PRODUCTS);
      return;
    }

    const timer = setTimeout(async () => {
      setIsAiSearching(true);
      try {
        const res = await searchProductsWithAISemantic(trimmedSearch, allProducts);
        setAiResults(res.results);
        setIsAiMatch(res.isSemanticMatch);
      } catch (err) {
        console.warn("[POSProductPicker] AI Search error:", err);
      } finally {
        setIsAiSearching(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [trimmedSearch, searchFiltered.length, allProducts]);

  const handleAddItem = (product: Product) => {
    onSelectProduct(product);
    setLastAddedId(product.id);
    setTimeout(() => setLastAddedId(null), 1200);
  };

  return (
    <View style={styles.container}>
      {/* 🔍 Smart Barcode & Predictive Search Bar */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: colors.surface,
            borderColor: trimmedSearch ? colors.primary : colors.surfaceBorder,
          },
        ]}
      >
        <Search size={18} color={trimmedSearch ? colors.primary : colors.textMuted} />
        <TextInput
          style={[styles.input, { color: colors.text }]}
          placeholder="Scan barcode, Hinglish ('doodh', 'tel') or item name..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {isAiSearching && <ActivityIndicator size="small" color="#7c3aed" />}

        {search.length > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={() => setSearch("")}
            style={styles.clearBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <X size={16} color={colors.textMuted} />
          </Pressable>
        )}
      </View>

      {/* 🤖 AI Intent Badge */}
      {isAiMatch && (
        <View style={styles.aiBadgeRow}>
          <Sparkles size={13} color="#7c3aed" />
          <Text style={styles.aiBadgeText}>AI Intent Match ({displayProducts.length} items)</Text>
        </View>
      )}

      {/* 📝 Item Not Found in Store Catalog Banner */}
      {trimmedSearch && displayProducts.length === 0 && !isAiSearching && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/merchant/procurement-list" as any)}
          style={[
            styles.notFoundBanner,
            { backgroundColor: "rgba(124, 58, 237, 0.08)", borderColor: "#7c3aed" },
          ]}
        >
          <ClipboardList size={16} color="#7c3aed" />
          <Text style={styles.notFoundText}>
            "{trimmedSearch}" not in store? Tap to add to Mandi Procurement List 📝
          </Text>
        </Pressable>
      )}

      {/* ⚡ PREDICTIVE AUTO-SUGGESTION VERTICAL LIST (When Cashier Types) */}
      {trimmedSearch.length > 0 && displayProducts.length > 0 ? (
        <View
          style={[
            styles.predictiveDropdown,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            style={{ maxHeight: 220 }}
            contentContainerStyle={styles.dropdownScroll}
          >
            {displayProducts.map((p) => {
              const isJustAdded = lastAddedId === p.id;
              const stockNum = typeof p.stock === "number" ? p.stock : 99;
              const isOut = stockNum <= 0;

              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => handleAddItem(p)}
                  style={({ pressed }) => [
                    styles.dropdownRow,
                    { borderBottomColor: colors.surfaceBorder },
                    pressed && { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
                  ]}
                >
                  <Image
                    source={{ uri: resolveImageUrl(p.image_url) }}
                    style={styles.itemThumb}
                    contentFit="cover"
                  />

                  <View style={{ flex: 1, gap: 2 }}>
                    <Text numberOfLines={1} style={[styles.itemTitle, { color: colors.text }]}>
                      {p.title}
                    </Text>
                    <View style={styles.itemSubRow}>
                      <Text style={[styles.itemPrice, { color: colors.primary }]}>
                        {formatCurrency(p.price)}
                      </Text>
                      {p.sku ? (
                        <Text style={[styles.itemSku, { color: colors.textMuted }]}>
                          • SKU: {p.sku}
                        </Text>
                      ) : null}
                    </View>
                  </View>

                  <View
                    style={[
                      styles.addBtnPill,
                      {
                        backgroundColor: isJustAdded
                          ? "#22c55e"
                          : isOut
                          ? "#fee2e2"
                          : colors.primaryLight,
                      },
                    ]}
                  >
                    {isJustAdded ? (
                      <Check size={14} color="#fff" />
                    ) : (
                      <>
                        <Plus size={13} color={isOut ? "#ef4444" : colors.primary} />
                        <Text
                          style={[
                            styles.addBtnText,
                            { color: isOut ? "#ef4444" : colors.primary },
                          ]}
                        >
                          {isOut ? "Out" : "Add"}
                        </Text>
                      </>
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : (
        /* 🏪 DEFAULT QUICK PICKER HORIZONTAL CHIPS (When Input is Empty) */
        displayProducts && displayProducts.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.scroll}
          >
            {displayProducts.slice(0, 10).map((p) => {
              const isJustAdded = lastAddedId === p.id;
              return (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => handleAddItem(p)}
                  style={({ pressed }) => [
                    styles.chip,
                    {
                      backgroundColor: isJustAdded ? "rgba(34, 197, 94, 0.15)" : colors.surface,
                      borderColor: isJustAdded ? "#22c55e" : colors.surfaceBorder,
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <Text numberOfLines={1} style={[styles.chipName, { color: colors.text }]}>
                    {p.title}
                  </Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.chipPrice, { color: colors.primary }]}>
                      {formatCurrency(p.price)}
                    </Text>
                    {isJustAdded ? (
                      <Check size={14} color="#22c55e" />
                    ) : (
                      <Plus size={14} color={colors.primary} />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: { flex: 1, fontSize: 13, fontWeight: "600", height: "100%" },
  clearBtn: { padding: 4 },
  scroll: { gap: 8, paddingVertical: 8 },
  chip: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 140,
  },
  chipName: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chipPrice: { fontSize: 13, fontWeight: "900" },
  aiBadgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  aiBadgeText: { color: "#7c3aed", fontSize: 11, fontWeight: "700" },
  notFoundBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
  },
  notFoundText: { fontSize: 12, fontWeight: "700", color: "#7c3aed", flex: 1 },
  predictiveDropdown: {
    marginTop: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  dropdownScroll: {
    paddingVertical: 4,
  },
  dropdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemThumb: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  itemTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  itemSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "800",
  },
  itemSku: {
    fontSize: 11,
    fontWeight: "500",
  },
  addBtnPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    fontSize: 11,
    fontWeight: "800",
  },
});
