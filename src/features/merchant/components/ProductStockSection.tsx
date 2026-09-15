import React from "react";
import { StyleSheet, Text, View, TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ProductMediaUploadSection } from "./ProductMediaUploadSection";

interface ProductStockSectionProps {
  stock: string;
  setStock: (v: string) => void;
  minStock: string;
  setMinStock: (v: string) => void;
  weight: string;
  setWeight: (v: string) => void;
  images: string[];
  setImages: React.Dispatch<React.SetStateAction<string[]>>;
}

export const ProductStockSection: React.FC<ProductStockSectionProps> = React.memo(({
  stock,
  setStock,
  minStock,
  setMinStock,
  weight,
  setWeight,
  images,
  setImages,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.container}>
      <ProductMediaUploadSection images={images} setImages={setImages} />

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Stock & Inventory Limits</Text>

      <View style={styles.inputRow}>
        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Initial Stock *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 20"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={stock}
            accessibilityLabel="Initial Stock quantity"
            onChangeText={(text) => setStock(text.replace(/[^0-9]/g, ""))}
          />
        </View>

        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Alert Min Stock</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 5"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={minStock}
            accessibilityLabel="Minimum alert stock threshold"
            onChangeText={(text) => setMinStock(text.replace(/[^0-9]/g, ""))}
          />
        </View>

        <View style={styles.col}>
          <Text style={[styles.label, { color: colors.textMuted }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="e.g. 1.0"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={weight}
            accessibilityLabel="Product weight in kilograms"
            onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ""))}
          />
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: { marginVertical: 4, backgroundColor: "rgba(16, 185, 129, 0.04)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(16, 185, 129, 0.14)", padding: 12 },
  sectionTitle: { fontSize: 15, fontWeight: "900", marginTop: 10, marginBottom: 8 },
  inputRow: { flexDirection: "row", gap: 8 },
  col: { flex: 1 },
  label: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, fontSize: 14, fontWeight: "700" },
});
