import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  ActivityIndicator,
  Keyboard,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSearchHistoryStore } from "@/store/useSearchHistoryStore";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { ApiResponse } from "@/types/api";
import { Product } from "@/features/catalog/types";
import { resolveImageUrl } from "@/components/AppImage";
import { formatCurrency } from "@/utils/format";
import {
  Search,
  X,
  History,
  TrendingUp,
  Sparkles,
  ArrowUpLeft,
  Store,
  Tag,
  Languages,
} from "lucide-react-native";

interface SmartSearchModalProps {
  visible: boolean;
  onClose: () => void;
  initialQuery?: string;
  onSelectProduct?: (product: Product) => void;
  onSelectQuery?: (query: string) => void;
  onOpenVoiceSearch?: () => void;
  onOpenScanner?: () => void;
}

const VILLAGE_HINGLISH_QUICK_SEARCH = [
  { label: "🥛 Doodh (Milk)", query: "doodh" },
  { label: "🫒 Tel (Oil)", query: "tel" },
  { label: "🌾 Aata (Flour)", query: "aata" },
  { label: "🍚 Chawal (Rice)", query: "chawal" },
  { label: "🧂 Cheeni / Sugar", query: "cheeni" },
  { label: "🧼 Sabun (Soap)", query: "sabun" },
  { label: "🍪 Biskut", query: "biskut" },
  { label: "🥔 Aalu / Pyaz", query: "aalu" },
  { label: "☕ Chai Patti", query: "chai" },
  { label: "💊 Dawa (Medicine)", query: "dawa" },
];

const TRENDING_SEARCHES = [
  "Aashirvaad Atta",
  "Fortune Sunlite Oil",
  "Tata Iodized Salt",
  "Dettol Soap",
  "Maggi 2-Min Noodles",
  "Amul Taaza Milk",
  "Surf Excel Easy Wash",
];

export const SmartSearchModal: React.FC<SmartSearchModalProps> = ({
  visible,
  onClose,
  initialQuery = "",
  onSelectProduct,
  onSelectQuery,
  onOpenVoiceSearch,
  onOpenScanner,
}) => {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [liveSuggestions, setLiveSuggestions] = useState<Product[]>([]);

  const { recentSearches, addSearchTerm, removeSearchTerm, clearHistory } =
    useSearchHistoryStore();

  useEffect(() => {
    if (visible) {
      setQuery(initialQuery);
      // Auto-focus text input when modal opens
      setTimeout(() => inputRef.current?.focus(), Platform.OS === "ios" ? 200 : 100);
    }
  }, [visible, initialQuery]);

  // Debounced Live Auto-Suggestions Fetcher (Fast Hinglish + English)
  useEffect(() => {
    const trimmed = query.trim();
    if (!trimmed || trimmed.length < 2) {
      setLiveSuggestions([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await apiClient.get<ApiResponse<any>>(Endpoints.PRODUCTS.LIST, {
          params: { search: trimmed, limit: 6 },
        });

        const raw = res.data?.data;
        const list: Product[] = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.products)
          ? raw.products
          : [];

        setLiveSuggestions(list);
      } catch {
        setLiveSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSearchSubmit = (searchTerm: string) => {
    const clean = searchTerm.trim();
    if (!clean) return;

    addSearchTerm(clean);
    Keyboard.dismiss();
    onClose();

    if (onSelectQuery) {
      onSelectQuery(clean);
    } else {
      router.push({
        pathname: "/(tabs)",
        params: { q: clean },
      } as any);
    }
  };

  const handleSelectSuggestion = (product: Product) => {
    addSearchTerm(product.name);
    Keyboard.dismiss();
    onClose();

    if (onSelectProduct) {
      onSelectProduct(product);
    } else {
      router.push(`/product/${product.id}` as any);
    }
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Sticky Smart Search Bar Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <View style={[styles.searchBox, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: colors.primary }]}>
            <Search size={18} color={colors.primary} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={() => handleSearchSubmit(query)}
              placeholder="Search 'Doodh', 'Tel', 'Aata' or English..."
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text }]}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setQuery("")}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <X size={16} color={colors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={[styles.cancelText, { color: colors.primary }]}>Cancel</Text>
          </Pressable>
        </View>

        {/* Bilingual Helper Banner */}
        <View style={[styles.bilingualBanner, { backgroundColor: isDark ? "rgba(14, 165, 233, 0.12)" : "rgba(14, 165, 233, 0.08)", borderColor: colors.surfaceBorder }]}>
          <Languages size={14} color="#0284c7" />
          <Text style={[styles.bilingualBannerText, { color: colors.text }]}>
            Hinglish & English smart search active. You can type colloquial village names.
          </Text>
        </View>

        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
        >
          {/* 1. LIVE PREDICTIVE AUTO-SUGGESTIONS (When typing) */}
          {query.trim().length >= 2 ? (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={15} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>LIVE PRODUCT MATCHES</Text>
                </View>
                {isLoading && <ActivityIndicator size="small" color={colors.primary} />}
              </View>

              {liveSuggestions.length > 0 ? (
                <View style={styles.suggestionList}>
                  {liveSuggestions.map((product) => (
                    <Pressable
                      key={product.id}
                      accessibilityRole="button"
                      onPress={() => handleSelectSuggestion(product)}
                      style={({ pressed }) => [
                        styles.suggestionItem,
                        { borderColor: colors.surfaceBorder },
                        pressed && { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#f1f5f9" },
                      ]}
                    >
                      <Image
                        source={{ uri: resolveImageUrl(product.images?.[0]) }}
                        style={styles.productThumb}
                        contentFit="cover"
                      />

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text numberOfLines={1} style={[styles.productName, { color: colors.text }]}>
                          {product.name}
                        </Text>
                        <View style={styles.priceRow}>
                          <Text style={[styles.productPrice, { color: colors.primary }]}>
                            {formatCurrency(product.price)}
                          </Text>
                          {product.shop_name && (
                            <View style={styles.shopBadge}>
                              <Store size={10} color={colors.textMuted} />
                              <Text numberOfLines={1} style={[styles.shopNameText, { color: colors.textMuted }]}>
                                {product.shop_name}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <ArrowUpLeft size={16} color={colors.textMuted} />
                    </Pressable>
                  ))}
                </View>
              ) : !isLoading ? (
                <View style={styles.noResultsBox}>
                  <Text style={[styles.noResultsText, { color: colors.textMuted }]}>
                    No products found for "{query}". Press Search to explore shops.
                  </Text>
                  <Pressable
                    onPress={() => handleSearchSubmit(query)}
                    style={[styles.fullSearchBtn, { backgroundColor: colors.primary }]}
                  >
                    <Search size={14} color="#fff" />
                    <Text style={styles.fullSearchText}>Search all local stores for "{query}"</Text>
                  </Pressable>
                </View>
              ) : null}
            </View>
          ) : (
            <>
              {/* 2. RECENT SEARCH HISTORY */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <View style={styles.sectionTitleRow}>
                      <History size={15} color={colors.textMuted} />
                      <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>RECENT SEARCHES</Text>
                    </View>

                    <Pressable onPress={clearHistory} style={styles.clearAllBtn}>
                      <Text style={styles.clearAllText}>Clear All</Text>
                    </Pressable>
                  </View>

                  <View style={styles.historyList}>
                    {recentSearches.map((term, idx) => (
                      <View key={idx} style={[styles.historyRow, { borderBottomColor: colors.surfaceBorder }]}>
                        <Pressable
                          style={styles.historyTextRow}
                          onPress={() => handleSearchSubmit(term)}
                        >
                          <History size={14} color={colors.textMuted} />
                          <Text style={[styles.historyTerm, { color: colors.text }]}>{term}</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => removeSearchTerm(term)}
                          style={styles.removeHistoryBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <X size={14} color={colors.textMuted} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* 3. VILLAGE & LOCAL STORE POPULAR QUICK SEARCH (HINGLISH) */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <Sparkles size={15} color={colors.primary} />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>QUICK SEARCH (HINGLISH & DAILY ITEMS)</Text>
                </View>

                <View style={styles.chipGrid}>
                  {VILLAGE_HINGLISH_QUICK_SEARCH.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSearchSubmit(item.query)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: colors.surfaceBorder },
                        pressed && { backgroundColor: "rgba(14, 165, 233, 0.15)" },
                      ]}
                    >
                      <Text style={[styles.chipText, { color: colors.text }]}>{item.label}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* 4. TRENDING SEARCH CHIPS */}
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <TrendingUp size={15} color="#e11d48" />
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>TRENDING BRANDS</Text>
                </View>

                <View style={styles.chipGrid}>
                  {TRENDING_SEARCHES.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => handleSearchSubmit(item)}
                      style={({ pressed }) => [
                        styles.chip,
                        { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: colors.surfaceBorder },
                        pressed && { backgroundColor: "rgba(225, 29, 72, 0.12)" },
                      ]}
                    >
                      <Tag size={12} color="#e11d48" />
                      <Text style={[styles.chipText, { color: colors.text }]}>{item}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingTop: Platform.OS === "ios" ? 54 : 36,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 10,
  },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    paddingVertical: 6,
  },
  iconBtn: {
    padding: 4,
  },
  cancelBtn: {
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "700",
  },
  bilingualBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bilingualBannerText: {
    fontSize: 11,
    fontWeight: "600",
    flex: 1,
  },
  scroll: {
    padding: 16,
    gap: 20,
  },
  section: {
    gap: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.6,
  },
  clearAllBtn: {
    paddingVertical: 2,
  },
  clearAllText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ef4444",
  },
  suggestionList: {
    gap: 8,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
  },
  productThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  productName: {
    fontSize: 14,
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  productPrice: {
    fontSize: 13,
    fontWeight: "800",
  },
  shopBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  shopNameText: {
    fontSize: 11,
    fontWeight: "600",
  },
  noResultsBox: {
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  noResultsText: {
    fontSize: 13,
    textAlign: "center",
  },
  fullSearchBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  fullSearchText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  historyList: {
    gap: 2,
  },
  historyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  historyTextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  historyTerm: {
    fontSize: 14,
    fontWeight: "600",
  },
  removeHistoryBtn: {
    padding: 4,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
