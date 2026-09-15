import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, TextInput, Alert, Pressable, ScrollView } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import { useCreateExpense } from "../api/useExpenses";
import { X } from "lucide-react-native";

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
}

const CATEGORIES = [
  { label: "Tea & Snacks", value: "tea_snacks" },
  { label: "Shop Rent", value: "rent" },
  { label: "Electricity", value: "electricity" },
  { label: "Staff Salary", value: "salary" },
  { label: "Packaging", value: "packaging" },
  { label: "Other", value: "other" },
];

export const AddExpenseModal: React.FC<AddExpenseModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeColor();
  const [category, setCategory] = useState("tea_snacks");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi">("cash");
  const expenseMutation = useCreateExpense();

  const handleSave = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid expense amount.");
      return;
    }

    expenseMutation.mutate(
      { category, amount: num, payment_method: paymentMethod, notes: notes || undefined },
      {
        onSuccess: () => {
          setAmount("");
          setNotes("");
          onClose();
        },
        onError: () => Alert.alert("Error", "Could not record expense. Please try again."),
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Add Shop Expense (Kharcha)</Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catRow}>
            {CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                accessibilityRole="button"
                onPress={() => setCategory(c.value)}
                style={[styles.catChip, { backgroundColor: category === c.value ? colors.primary : colors.surfaceBorder }]}
              >
                <Text style={[styles.catText, { color: category === c.value ? "#fff" : colors.text }]}>
                  {c.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Amount (₹)"
            placeholderTextColor={colors.textMuted}
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Expense notes (e.g. Morning Chai)"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={styles.methodRow}>
            {(["cash", "upi"] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="button"
                onPress={() => setPaymentMethod(m)}
                style={[styles.methodBtn, { backgroundColor: paymentMethod === m ? colors.primary : colors.surfaceBorder }]}
              >
                <Text style={[styles.methodText, { color: paymentMethod === m ? "#fff" : colors.text }]}>
                  Paid via {m.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <Button
            title="Save Expense Entry"
            variant="primary"
            isLoading={expenseMutation.isPending}
            disabled={expenseMutation.isPending}
            onPress={handleSave}
            style={styles.saveBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, padding: 18, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "800" },
  closeBtn: { padding: 4 },
  catRow: { gap: 6, paddingVertical: 2 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  catText: { fontSize: 12, fontWeight: "700" },
  input: { height: 42, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  methodRow: { flexDirection: "row", gap: 8 },
  methodBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  methodText: { fontSize: 12, fontWeight: "700" },
  saveBtn: { marginTop: 6 },
});
