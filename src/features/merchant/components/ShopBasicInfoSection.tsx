import React from "react";
import { StyleSheet, View, TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface ShopBasicInfoSectionProps {
  name: string;
  setName: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  address: string;
  setAddress: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
}

export const ShopBasicInfoSection: React.FC<ShopBasicInfoSectionProps> = ({
  name,
  setName,
  category,
  setCategory,
  address,
  setAddress,
  city,
  setCity,
  phone,
  setPhone,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.container}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="Shop Name (e.g. Gupta General Store) *"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="Category (e.g. Kirana, Clothing, Bakery) *"
        placeholderTextColor={colors.textMuted}
        value={category}
        onChangeText={setCategory}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="Shop Address (Shop no, Street, Market) *"
        placeholderTextColor={colors.textMuted}
        value={address}
        onChangeText={setAddress}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.half, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
          placeholder="City (e.g. Patna)"
          placeholderTextColor={colors.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={[styles.input, styles.half, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
          placeholder="Contact Phone"
          placeholderTextColor={colors.textMuted}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 8 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
});
