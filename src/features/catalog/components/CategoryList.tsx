import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  ScrollView,
  Pressable,
  Modal,
  FlatList,
} from "react-native";
import { Category } from "@/features/catalog/types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { expandHinglishSynonyms } from "@/utils/fuzzyMatcher";
import {
  Search,
  ChevronDown,
  X,
  Check,
  Sparkles,
  Layers,
  Filter,
} from "lucide-react-native";

interface CategoryListProps {
  categories: Category[];
  selectedCategoryId?: string;
  onSelectCategory: (categoryId?: string) => void;
}

const getCategoryEmoji = (name: string): string => {
  const lower = name.toLowerCase();
  if (lower.includes("rice") || lower.includes("chawal")) return "🍚";
  if (lower.includes("pulse") || lower.includes("dal") || lower.includes("lentil")) return "🥣";
  if (lower.includes("flour") || lower.includes("atta") || lower.includes("besan")) return "🌾";
  if (lower.includes("oil") || lower.includes("tel") || lower.includes("ghee")) return "🫒";
  if (lower.includes("masala") || lower.includes("spice")) return "🌶️";
  if (lower.includes("sugar") || lower.includes("salt") || lower.includes("cheeni") || lower.includes("namak")) return "🧂";
  if (lower.includes("biscuit") || lower.includes("cookie") || lower.includes("snack") || lower.includes("namkeen") || lower.includes("chip")) return "🍪";
  if (lower.includes("tea") || lower.includes("coffee") || lower.includes("chai")) return "☕";
  if (lower.includes("drink") || lower.includes("juice") || lower.includes("soda")) return "🥤";
  if (lower.includes("milk") || lower.includes("curd") || lower.includes("doodh") || lower.includes("dairy") || lower.includes("paneer") || lower.includes("butter") || lower.includes("cheese")) return "🥛";
  if (lower.includes("bread") || lower.includes("bakery") || lower.includes("bun") || lower.includes("cake") || lower.includes("pav")) return "🍞";
  if (lower.includes("egg") || lower.includes("anda")) return "🥚";
  if (lower.includes("fruit") || lower.includes("seb") || lower.includes("kela") || lower.includes("aam")) return "🍎";
  if (lower.includes("vegetable") || lower.includes("sabji") || lower.includes("aloo") || lower.includes("pyaz")) return "🥔";
  if (lower.includes("meat") || lower.includes("chicken") || lower.includes("fish") || lower.includes("seafood")) return "🍗";
  if (lower.includes("soap") || lower.includes("bath") || lower.includes("clean") || lower.includes("laundry") || lower.includes("surf") || lower.includes("sabun")) return "🧼";
  if (lower.includes("skin") || lower.includes("hair") || lower.includes("shampoo") || lower.includes("oral") || lower.includes("paste")) return "🧴";
  if (lower.includes("baby")) return "👶";
  if (lower.includes("puja") || lower.includes("religious")) return "🪔";
  if (lower.includes("stationery") || lower.includes("book") || lower.includes("pen")) return "📚";
  if (lower.includes("toy") || lower.includes("game")) return "🧸";
  if (lower.includes("cloth") || lower.includes("fashion") || lower.includes("wear") || lower.includes("footwear") || lower.includes("joota")) return "👕";
  if (lower.includes("electronic") || lower.includes("mobile") || lower.includes("hardware") || lower.includes("electrical")) return "⚡";
  if (lower.includes("pharmacy") || lower.includes("medicine") || lower.includes("vitamin") || lower.includes("dawa")) return "💊";
  if (lower.includes("general") || lower.includes("store") || lower.includes("kirana")) return "🏪";
  return "🏷️";
};

export const CategoryList: React.FC<CategoryListProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { colors, isDark } = useThemeColor();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selectedCategory = useMemo(() => {
    if (!selectedCategoryId) return undefined;
    return categories.find(
      (c) =>
        c.id === selectedCategoryId ||
        c.slug === selectedCategoryId ||
        c.name.toLowerCase() === selectedCategoryId.toLowerCase()
    );
  }, [categories, selectedCategoryId]);

  // Real-time search with Hinglish synonyms
  const filteredCategories = useMemo(() => {
    const clean = search.trim().toLowerCase();
    if (!clean) return categories;

    const synonyms = expandHinglishSynonyms(clean);

    return categories.filter((c) => {
      const name = c.name.toLowerCase();
      const desc = (c.description || "").toLowerCase();
      const slug = (c.slug || "").toLowerCase();

      return synonyms.some(
        (syn) => name.includes(syn) || desc.includes(syn) || slug.includes(syn)
      );
    });
  }, [categories, search]);

  const closeModal = () => {
    setIsModalOpen(false);
    setSearch("");
  };

  const handleSelect = (catId?: string) => {
    onSelectCategory(catId);
    closeModal();
  };

  // Top 4 popular quick pills for fast 1-tap access
  const topPillSlugs = ["milk-curd", "edible-oils", "sugar-salt", "flour-atta"];
  const quickPills = useMemo(() => {
    return categories.filter((c) => topPillSlugs.includes(c.slug));
  }, [categories]);

  return (
    <View style={styles.wrapper}>
      {/* 1. Main Searchable Category Dropdown Trigger */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select category dropdown"
        onPress={() => setIsModalOpen(true)}
        style={({ pressed }) => [
          styles.dropdownTrigger,
          {
            backgroundColor: isDark ? "#1e293b" : colors.surface,
            borderColor: selectedCategory ? colors.primary : colors.surfaceBorder,
          },
          pressed && { opacity: 0.8 },
        ]}
      >
        <View style={styles.triggerLeft}>
          <View
            style={[
              styles.iconCircle,
              {
                backgroundColor: selectedCategory
                  ? colors.primaryLight
                  : isDark
                  ? "rgba(255,255,255,0.08)"
                  : "#f1f5f9",
              },
            ]}
          >
            <Text style={styles.triggerEmoji}>
              {selectedCategory ? getCategoryEmoji(selectedCategory.name) : "📂"}
            </Text>
          </View>
          <View style={styles.triggerTextCol}>
            <Text style={[styles.triggerLabel, { color: colors.textMuted }]}>
              {selectedCategory ? "FILTERED CATEGORY" : "CATEGORY FILTER"}
            </Text>
            <Text numberOfLines={1} style={[styles.triggerValue, { color: colors.text }]}>
              {selectedCategory ? selectedCategory.name : "All Categories (Tap to choose/search)"}
            </Text>
          </View>
        </View>

        <View style={styles.triggerRight}>
          {selectedCategory ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Reset category filter"
              onPress={(e) => {
                e.stopPropagation();
                onSelectCategory(undefined);
              }}
              hitSlop={8}
              style={[styles.clearBtn, { backgroundColor: isDark ? "#334155" : "#e2e8f0" }]}
            >
              <X size={13} color={colors.text} />
            </Pressable>
          ) : (
            <View style={[styles.badge, { backgroundColor: colors.primaryLight }]}>
              <Text style={[styles.badgeText, { color: colors.primary }]}>
                {categories.length}+
              </Text>
            </View>
          )}
          <ChevronDown size={18} color={selectedCategory ? colors.primary : colors.textMuted} />
        </View>
      </Pressable>

      {/* 2. Compact Quick-Access Horizontal Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickPillsRow}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => onSelectCategory(undefined)}
          style={[
            styles.quickPill,
            {
              backgroundColor: !selectedCategoryId ? colors.primary : colors.surface,
              borderColor: !selectedCategoryId ? colors.primary : colors.surfaceBorder,
            },
          ]}
        >
          <Layers size={13} color={!selectedCategoryId ? colors.primaryForeground : colors.textMuted} />
          <Text
            style={[
              styles.quickPillText,
              { color: !selectedCategoryId ? colors.primaryForeground : colors.text },
            ]}
          >
            All
          </Text>
        </Pressable>

        {quickPills.map((cat) => {
          const isSelected = selectedCategory?.id === cat.id;
          return (
            <Pressable
              key={cat.id}
              accessibilityRole="button"
              onPress={() => onSelectCategory(isSelected ? undefined : cat.id)}
              style={[
                styles.quickPill,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              <Text style={styles.quickPillEmoji}>{getCategoryEmoji(cat.name)}</Text>
              <Text
                style={[
                  styles.quickPillText,
                  { color: isSelected ? colors.primaryForeground : colors.text },
                ]}
              >
                {cat.name}
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          accessibilityRole="button"
          onPress={() => setIsModalOpen(true)}
          style={[
            styles.quickPill,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ]}
        >
          <Filter size={12} color={colors.primary} />
          <Text style={[styles.quickPillText, { color: colors.primary }]}>
            More ({categories.length - quickPills.length}) ▾
          </Text>
        </Pressable>
      </ScrollView>

      {/* 3. Searchable Category Picker Bottom Sheet Modal */}
      <Modal visible={isModalOpen} transparent animationType="slide" onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View
            style={[
              styles.modalCard,
              { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
            ]}
          >
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Choose Category</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>
                  {categories.length} categories available • Tap to filter products
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close category picker"
                onPress={closeModal}
                hitSlop={8}
                style={[styles.closeIconBtn, { backgroundColor: isDark ? "#334155" : "#f1f5f9" }]}
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>

            {/* Search Box with Instant Hinglish & English Detection */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <Search size={16} color={colors.primary} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search category (e.g. Doodh, Tel, Atta, Soap)..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <Pressable onPress={() => setSearch("")} hitSlop={8}>
                  <X size={15} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Category Results List */}
            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.categoryListContent}
              ListHeaderComponent={
                /* Always show 'All Categories' as top option */
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleSelect(undefined)}
                  style={[
                    styles.categoryRow,
                    {
                      borderColor: colors.surfaceBorder,
                      backgroundColor: !selectedCategoryId
                        ? colors.primaryLight
                        : isDark
                        ? "#1e293b"
                        : colors.surface,
                    },
                  ]}
                >
                  <View style={[styles.rowEmojiCircle, { backgroundColor: colors.primaryLight }]}>
                    <Sparkles size={16} color={colors.primary} />
                  </View>
                  <View style={styles.categoryCopy}>
                    <Text style={[styles.categoryName, { color: colors.text }]}>
                      All Categories (Show Everything)
                    </Text>
                    <Text style={[styles.categoryDesc, { color: colors.textMuted }]}>
                      View all trending products across all departments
                    </Text>
                  </View>
                  {!selectedCategoryId && <Check size={18} color={colors.primary} />}
                </Pressable>
              }
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    No categories matching "{search}"
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = selectedCategory?.id === item.id;
                const emoji = getCategoryEmoji(item.name);

                return (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    onPress={() => handleSelect(item.id)}
                    style={({ pressed }) => [
                      styles.categoryRow,
                      {
                        borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                        backgroundColor: isSelected
                          ? colors.primaryLight
                          : isDark
                          ? "#1e293b"
                          : colors.surface,
                      },
                      pressed && { opacity: 0.8 },
                    ]}
                  >
                    <View
                      style={[
                        styles.rowEmojiCircle,
                        {
                          backgroundColor: isSelected
                            ? "rgba(255,255,255,0.8)"
                            : isDark
                            ? "rgba(255,255,255,0.06)"
                            : "#f1f5f9",
                        },
                      ]}
                    >
                      <Text style={styles.rowEmoji}>{emoji}</Text>
                    </View>
                    <View style={styles.categoryCopy}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>
                        {item.name}
                      </Text>
                      {item.description ? (
                        <Text
                          numberOfLines={1}
                          style={[styles.categoryDesc, { color: colors.textMuted }]}
                        >
                          {item.description}
                        </Text>
                      ) : null}
                    </View>
                    {isSelected && <Check size={18} color={colors.primary} />}
                  </Pressable>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
    gap: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerEmoji: {
    fontSize: 18,
  },
  triggerTextCol: {
    flex: 1,
  },
  triggerLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  triggerValue: {
    fontSize: 13,
    fontWeight: "700",
    marginTop: 1,
  },
  triggerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  clearBtn: {
    padding: 4,
    borderRadius: 8,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
  },
  quickPillsRow: {
    gap: 6,
    paddingVertical: 2,
  },
  quickPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  quickPillEmoji: {
    fontSize: 12,
  },
  quickPillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "flex-end",
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    maxHeight: "82%",
    minHeight: "55%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    padding: 16,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
  },
  modalSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  closeIconBtn: {
    padding: 6,
    borderRadius: 999,
  },
  searchBox: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    height: "100%",
  },
  categoryListContent: {
    paddingBottom: 24,
    gap: 6,
  },
  categoryRow: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowEmojiCircle: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowEmoji: {
    fontSize: 18,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: "700",
  },
  categoryDesc: {
    fontSize: 11,
    marginTop: 1,
  },
  emptyWrap: {
    padding: 24,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
  },
});
