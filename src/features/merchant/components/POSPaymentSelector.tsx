import React from "react";
import { StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

type PaymentMethod = "cash" | "upi" | "credit" | "split";

interface POSPaymentSelectorProps {
  method: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  splitCash: string;
  setSplitCash: (v: string) => void;
  splitUPI: string;
  setSplitUPI: (v: string) => void;
}

const METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "cash" },
  { label: "UPI", value: "upi" },
  { label: "Split", value: "split" },
  { label: "Udhar", value: "credit" },
];

export const POSPaymentSelector: React.FC<POSPaymentSelectorProps> = ({
  method,
  onSelectMethod,
  splitCash,
  setSplitCash,
  splitUPI,
  setSplitUPI,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.text }]}>Payment Mode</Text>
      <View style={styles.tabs}>
        {METHODS.map((m) => {
          const isSelected = method === m.value;
          return (
            <Pressable
              key={m.value}
              accessibilityRole="button"
              onPress={() => onSelectMethod(m.value)}
              style={[
                styles.tab,
                {
                  backgroundColor: isSelected ? colors.primary : colors.surface,
                  borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isSelected ? "#fff" : colors.text },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {method === "split" && (
        <View style={styles.splitRow}>
          <View style={styles.splitInputCol}>
            <Text style={[styles.splitLabel, { color: colors.textMuted }]}>Cash (₹)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={splitCash}
              onChangeText={setSplitCash}
            />
          </View>
          <View style={styles.splitInputCol}>
            <Text style={[styles.splitLabel, { color: colors.textMuted }]}>UPI (₹)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="0"
              placeholderTextColor={colors.textMuted}
              keyboardType="numeric"
              value={splitUPI}
              onChangeText={setSplitUPI}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginTop: 12, marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  tabs: { flexDirection: "row", gap: 8 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  tabText: { fontSize: 13, fontWeight: "700" },
  splitRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  splitInputCol: { flex: 1 },
  splitLabel: { fontSize: 11, fontWeight: "600", marginBottom: 4 },
  input: { height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, fontSize: 14, fontWeight: "700" },
});
