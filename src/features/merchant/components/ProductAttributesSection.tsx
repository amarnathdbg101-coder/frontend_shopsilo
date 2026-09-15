import React from "react";
import { StyleSheet, Text, View, TextInput, Pressable, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Plus, Trash2, SlidersHorizontal } from "lucide-react-native";

export interface AttributeItem {
  id: string;
  key: string;
  value: string;
}

const COMMON_KEYS = ["Brand", "Size / Unit", "Color", "Flavor", "Material", "Expiry"];

interface ProductAttributesSectionProps {
  attributes: AttributeItem[];
  setAttributes: React.Dispatch<React.SetStateAction<AttributeItem[]>>;
  tags: string;
  setTags: (v: string) => void;
}

export const ProductAttributesSection: React.FC<ProductAttributesSectionProps> = ({
  attributes,
  setAttributes,
  tags,
  setTags,
}) => {
  const { colors } = useThemeColor();

  const handleAddAttr = (suggestedKey?: string) => {
    setAttributes((prev) => [
      ...prev,
      { id: Date.now().toString(), key: suggestedKey || "", value: "" },
    ]);
  };

  const handleUpdate = (id: string, field: "key" | "value", text: string) => {
    setAttributes((prev) =>
      prev.map((a) => (a.id === id ? { ...a, [field]: text } : a))
    );
  };

  const handleRemove = (id: string) => {
    setAttributes((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <SlidersHorizontal size={16} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Flexible Specifications (JSONB / NoSQL)
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => handleAddAttr()}
          style={styles.addBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={14} color={colors.primary} />
          <Text style={[styles.addText, { color: colors.primary }]}>Add Field</Text>
        </Pressable>
      </View>

      <Text style={[styles.hint, { color: colors.textMuted }]}>
        Add custom key-values like Brand, Unit, Color, Material, etc.
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {COMMON_KEYS.map((k) => (
          <Pressable
            key={k}
            accessibilityRole="button"
            onPress={() => handleAddAttr(k)}
            style={[styles.chip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <Plus size={12} color={colors.textMuted} />
            <Text style={[styles.chipText, { color: colors.text }]}>{k}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {attributes.map((attr) => (
        <View key={attr.id} style={styles.attrRow}>
          <TextInput
            style={[styles.input, styles.keyInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Field (e.g. Brand)"
            placeholderTextColor={colors.textMuted}
            value={attr.key}
            onChangeText={(t) => handleUpdate(attr.id, "key", t)}
          />
          <TextInput
            style={[styles.input, styles.valInput, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Value (e.g. Amul)"
            placeholderTextColor={colors.textMuted}
            value={attr.value}
            onChangeText={(t) => handleUpdate(attr.id, "value", t)}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => handleRemove(attr.id)}
            style={styles.removeBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Trash2 size={16} color="#ef4444" />
          </Pressable>
        </View>
      ))}

      <Text style={[styles.label, { color: colors.textMuted, marginTop: 8 }]}>Search Tags (comma separated)</Text>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="e.g. fresh, dairy, milk, breakfast"
        placeholderTextColor={colors.textMuted}
        value={tags}
        onChangeText={setTags}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginVertical: 4, backgroundColor: "rgba(245, 158, 11, 0.045)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.16)", padding: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 2 },
  titleGroup: { flexDirection: "row", alignItems: "center", gap: 6 },
  sectionTitle: { fontSize: 15, fontWeight: "900" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 4 },
  addText: { fontSize: 12, fontWeight: "700" },
  hint: { fontSize: 11, marginBottom: 6 },
  chipsRow: { gap: 6, marginBottom: 8, paddingVertical: 2 },
  chip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chipText: { fontSize: 11, fontWeight: "600" },
  attrRow: { flexDirection: "row", gap: 6, alignItems: "center", marginBottom: 6 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 13 },
  keyInput: { flex: 1 },
  valInput: { flex: 1.4 },
  removeBtn: { padding: 8 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
});
