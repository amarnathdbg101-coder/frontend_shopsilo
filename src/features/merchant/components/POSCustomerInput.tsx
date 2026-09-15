import React from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

interface POSCustomerInputProps {
  customerPhone: string;
  setCustomerPhone: (val: string) => void;
  customerName: string;
  setCustomerName: (val: string) => void;
}

export const POSCustomerInput: React.FC<POSCustomerInputProps> = ({
  customerPhone,
  setCustomerPhone,
  customerName,
  setCustomerName,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.customerCard}>
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="Customer Phone (optional / required for Udhar)"
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        value={customerPhone}
        onChangeText={setCustomerPhone}
      />
      <TextInput
        style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
        placeholder="Customer Name (optional)"
        placeholderTextColor={colors.textMuted}
        value={customerName}
        onChangeText={setCustomerName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  customerCard: { gap: 8, marginBottom: 12 },
  input: { height: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
});
