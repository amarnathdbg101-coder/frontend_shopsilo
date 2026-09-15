import React, { useMemo, useState } from "react";
import { StyleSheet, Text, View, ScrollView, Pressable, Modal, TextInput, FlatList } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { PRODUCT_CATEGORIES } from "@/constants/productCategories";
import { Check, ChevronDown, Search, X, ArrowDownAZ, ArrowUpAZ } from "lucide-react-native";

interface ProductCategorySelectorProps {
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
}

export const ProductCategorySelector: React.FC<ProductCategorySelectorProps> = ({
  selectedCategoryId,
  onSelectCategory,
}) => {
  const { colors } = useThemeColor();
  const categories = PRODUCT_CATEGORIES;
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [sortAscending, setSortAscending] = useState(true);

  const selectedCategory = categories?.find((category) => category.id === selectedCategoryId);
  const filteredCategories = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return [...(categories || [])]
      .filter((category) => !normalizedSearch || `${category.name} ${category.description || ""}`.toLowerCase().includes(normalizedSearch))
      .sort((a, b) => {
        const result = a.name.localeCompare(b.name);
        return sortAscending ? result : -result;
      });
  }, [categories, search, sortAscending]);

  const closePicker = () => {
    setIsOpen(false);
    setSearch("");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.labelRow}>
        <View>
          <Text style={[styles.label, { color: colors.text }]}>Category</Text>
          <Text style={[styles.hint, { color: colors.textMuted }]}>{categories?.length || 0} categories available</Text>
        </View>
        <Text style={[styles.loadingText, { color: colors.textMuted }]}>Local catalog</Text>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose product category"
        onPress={() => setIsOpen(true)}
        style={[styles.dropdownTrigger, { backgroundColor: colors.background, borderColor: selectedCategory ? colors.primary : colors.surfaceBorder }]}
      >
        <View style={styles.triggerCopy}>
          <Text style={[styles.triggerValue, { color: selectedCategory ? colors.text : colors.textMuted }]} numberOfLines={1}>
            {selectedCategory?.name || "Select a category"}
          </Text>
          {selectedCategory?.description && <Text style={[styles.triggerDescription, { color: colors.textMuted }]} numberOfLines={1}>{selectedCategory.description}</Text>}
        </View>
        <ChevronDown size={18} color={colors.textMuted} />
      </Pressable>

      <Modal visible={isOpen} transparent animationType="slide" onRequestClose={closePicker}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Choose category</Text>
                <Text style={[styles.modalSubtitle, { color: colors.textMuted }]}>Search by name or description</Text>
              </View>
              <Pressable accessibilityRole="button" accessibilityLabel="Close category picker" onPress={closePicker} hitSlop={8}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              <Search size={16} color={colors.textMuted} />
              <TextInput
                autoFocus
                value={search}
                onChangeText={setSearch}
                placeholder="Search categories..."
                placeholderTextColor={colors.textMuted}
                style={[styles.searchInput, { color: colors.text }]}
              />
              {search.length > 0 && <Pressable onPress={() => setSearch("")} hitSlop={8}><X size={15} color={colors.textMuted} /></Pressable>}
            </View>

            <View style={styles.toolbar}>
              <Text style={[styles.resultCount, { color: colors.textMuted }]}>{filteredCategories.length} results</Text>
              <Pressable accessibilityRole="button" onPress={() => setSortAscending((value) => !value)} style={styles.sortButton}>
                {sortAscending ? <ArrowDownAZ size={15} color={colors.primary} /> : <ArrowUpAZ size={15} color={colors.primary} />}
                <Text style={[styles.sortText, { color: colors.primary }]}>{sortAscending ? "A–Z" : "Z–A"}</Text>
              </Pressable>
            </View>

            <FlatList
              data={filteredCategories}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={<Text style={[styles.emptyText, { color: colors.textMuted }]}>No matching categories</Text>}
              renderItem={({ item }) => {
                const isSelected = item.id === selectedCategoryId;
                return (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${item.name}`}
                    onPress={() => { onSelectCategory(item.id); closePicker(); }}
                    style={({ pressed }) => [styles.categoryRow, { borderColor: colors.surfaceBorder, backgroundColor: isSelected ? colors.primaryLight : colors.surface }, pressed && styles.pressed]}
                  >
                    <View style={styles.categoryCopy}>
                      <Text style={[styles.categoryName, { color: colors.text }]}>{item.name}</Text>
                      {item.description && <Text style={[styles.categoryDescription, { color: colors.textMuted }]} numberOfLines={1}>{item.description}</Text>}
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
  container: { marginVertical: 4, borderRadius: 14, borderWidth: 1, padding: 12 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  label: { fontSize: 15, fontWeight: "900" },
  hint: { fontSize: 10, marginTop: 2 },
  loadingText: { fontSize: 10, fontWeight: "700" },
  dropdownTrigger: { minHeight: 48, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  triggerCopy: { flex: 1 },
  triggerValue: { fontSize: 13, fontWeight: "800" },
  triggerDescription: { fontSize: 10, marginTop: 2 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(15, 23, 42, 0.45)", justifyContent: "flex-end" },
  modalCard: { maxHeight: "82%", minHeight: "55%", borderTopLeftRadius: 22, borderTopRightRadius: 22, borderWidth: 1, padding: 16 },
  modalHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  modalTitle: { fontSize: 19, fontWeight: "900" },
  modalSubtitle: { fontSize: 11, marginTop: 2 },
  searchBox: { height: 44, borderRadius: 11, borderWidth: 1, paddingHorizontal: 11, flexDirection: "row", alignItems: "center", gap: 7 },
  searchInput: { flex: 1, fontSize: 13, height: "100%" },
  toolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  resultCount: { fontSize: 11, fontWeight: "700" },
  sortButton: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  sortText: { fontSize: 11, fontWeight: "900" },
  categoryRow: { minHeight: 58, borderRadius: 11, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 9, flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 7 },
  categoryCopy: { flex: 1 },
  categoryName: { fontSize: 13, fontWeight: "800" },
  categoryDescription: { fontSize: 10, marginTop: 3 },
  pressed: { opacity: 0.72, transform: [{ scale: 0.99 }] },
  emptyText: { fontSize: 12, paddingVertical: 18, textAlign: "center" },
});
