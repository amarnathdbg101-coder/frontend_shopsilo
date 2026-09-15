import React, { useState, useEffect } from "react";
import { Modal, StyleSheet, Text, View, TextInput, Alert, Pressable } from "react-native";
import { KhataCustomer } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import { useRecordCredit, useRecordKhataPayment } from "../api/useKhata";
import { X } from "lucide-react-native";

interface RecordTransactionModalProps {
  visible: boolean;
  customer?: KhataCustomer | null;
  mode: "credit" | "payment";
  onClose: () => void;
}

export const RecordTransactionModal: React.FC<RecordTransactionModalProps> = ({
  visible,
  customer,
  mode,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [method, setMethod] = useState<"cash" | "upi">("cash");

  useEffect(() => {
    if (customer) {
      setName(customer.customer_name);
      setMobile(customer.customer_mobile);
    } else {
      setName("");
      setMobile("");
    }
    setAmount("");
    setNotes("");
  }, [customer, visible]);

  const creditMutation = useRecordCredit();
  const paymentMutation = useRecordKhataPayment(mobile);

  const handleSubmit = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (!mobile || mobile.length < 10) {
      Alert.alert("Invalid Mobile", "Please enter a valid 10-digit mobile number.");
      return;
    }

    if (mode === "credit") {
      creditMutation.mutate(
        { customer_name: name || "Customer", customer_mobile: mobile, amount: num, notes },
        { onSuccess: onClose, onError: () => Alert.alert("Error", "Could not record credit.") }
      );
    } else {
      paymentMutation.mutate(
        { amount: num, payment_mode: method, notes },
        { onSuccess: onClose, onError: () => Alert.alert("Error", "Could not record payment.") }
      );
    }
  };

  const isPending = creditMutation.isPending || paymentMutation.isPending;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              {mode === "credit" ? "Udhar Diya (New Credit)" : "Jama (Payment Received)"}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {mode === "credit" && (
            <TextInput
              style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Customer Name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          )}

          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Mobile Number"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={mobile}
            editable={!customer}
            onChangeText={setMobile}
          />

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
            placeholder="Notes (optional)"
            placeholderTextColor={colors.textMuted}
            value={notes}
            onChangeText={setNotes}
          />

          <Button
            title={mode === "credit" ? "Save Udhar Entry" : "Save Jama Entry"}
            variant="primary"
            isLoading={isPending}
            disabled={isPending}
            onPress={handleSubmit}
            style={styles.submitBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, padding: 18, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  input: { height: 42, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  submitBtn: { marginTop: 6 },
});
