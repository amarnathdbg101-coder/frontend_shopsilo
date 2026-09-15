import React from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Store, Tag, Check, Sparkles } from "lucide-react-native";

interface ShopIdentitySectionProps {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
}

const COMMON_CATEGORIES = [
  "Kirana & Grocery",
  "Dairy & Sweets",
  "Medical & Pharmacy",
  "Electronics & Mobile",
  "Fruits & Vegetables",
  "Bakery & Confectionery",
  "Clothing & Garments",
  "Stationery & Gifts",
  "Hardware & Paint",
  "Pooja & General Store",
];

export const ShopIdentitySection: React.FC<ShopIdentitySectionProps> = ({
  name,
  setName,
  category,
  setCategory,
  description,
  setDescription,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.headerLeft}>
        <View style={[styles.iconWrap, { backgroundColor: "rgba(99, 102, 241, 0.12)" }]}>
          <Store size={18} color="#6366f1" />
        </View>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Store Identity & Category
          </Text>
          <Text style={[styles.sectionSub, { color: colors.textMuted }]}>
            How customers recognize your business on ShopSilo
          </Text>
        </View>
      </View>

      <View style={styles.inputsList}>
        {/* Shop Name */}
        <View>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>Shop Name *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. Ramesh Kirana & Provisions"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Category Input & Quick Chips */}
        <View>
          <Text style={[styles.inputLabel, { color: colors.textMuted }]}>
            Business Category *
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. Kirana & Grocery"
            placeholderTextColor={colors.textMuted}
            value={category}
            onChangeText={setCategory}
          />
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {COMMON_CATEGORIES.map((cat) => {
              const isSelected = category.toLowerCase() === cat.toLowerCase();
              return (
                <Pressable
                  key={cat}
                  accessibilityRole="button"
                  onPress={() => setCategory(cat)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: isSelected ? "rgba(99, 102, 241, 0.15)" : colors.background,
                      borderColor: isSelected ? "#6366f1" : colors.surfaceBorder,
                    },
                  ]}
                >
                  {isSelected && <Check size={12} color="#6366f1" />}
                  <Text style={[styles.chipText, { color: isSelected ? "#6366f1" : colors.textMuted }]}>
                    {cat}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionSub: {
    fontSize: 11,
    marginTop: 1,
  },
  inputsList: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: "600",
    marginBottom: 4,
  },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  chipsRow: {
    flexDirection: "row",
    gap: 6,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
