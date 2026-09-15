import React, { useState, useEffect } from "react";
import { Modal, StyleSheet, Text, View, TextInput, Alert, Pressable } from "react-native";
import { ReservationItem } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import { useVerifyPickup } from "../api/useMerchantReservations";
import { X, CheckCircle2, KeyRound } from "lucide-react-native";

interface VerifyPickupModalProps {
  visible: boolean;
  prefilledCode?: string;
  onClose: () => void;
}

export const VerifyPickupModal: React.FC<VerifyPickupModalProps> = ({
  visible,
  prefilledCode,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const [code, setCode] = useState(prefilledCode || "");
  const [verifiedItem, setVerifiedItem] = useState<ReservationItem | null>(null);

  useEffect(() => {
    setCode(prefilledCode || "");
    setVerifiedItem(null);
  }, [prefilledCode, visible]);

  const verifyMutation = useVerifyPickup();

  const handleVerify = () => {
    if (!code || code.trim().length < 4) {
      Alert.alert("Invalid Code", "Please enter the 4-digit pickup OTP.");
      return;
    }

    verifyMutation.mutate(
      { pickup_code: code.trim() },
      {
        onSuccess: (data) => setVerifiedItem(data),
        onError: () => Alert.alert("Verification Failed", "Invalid OTP or reservation has expired."),
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <KeyRound size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Verify Counter Pickup</Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {verifiedItem ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={44} color="#16a34a" />
              <Text style={[styles.successTitle, { color: colors.text }]}>Pickup Completed!</Text>
              <Text style={[styles.successText, { color: colors.textMuted }]}>
                Items handed over to {verifiedItem.customer_name || "Customer"}.
              </Text>
              <Button title="Done" variant="primary" onPress={onClose} style={{ width: "100%", marginTop: 14 }} />
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                Ask customer for the 4-digit OTP shown in their shopsilo app.
              </Text>

              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
                placeholder="Enter 4-Digit OTP"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
                maxLength={6}
                value={code}
                onChangeText={setCode}
                autoFocus
              />

              <Button
                title="Verify & Handover Order"
                variant="primary"
                isLoading={verifyMutation.isPending}
                disabled={verifyMutation.isPending || code.length < 4}
                onPress={handleVerify}
                style={styles.verifyBtn}
              />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, padding: 18, gap: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  closeBtn: { padding: 4 },
  form: { gap: 12, marginTop: 8 },
  subtitle: { fontSize: 13 },
  input: { height: 48, borderRadius: 10, textAlign: "center", fontSize: 20, fontWeight: "800", letterSpacing: 4 },
  verifyBtn: { marginTop: 4 },
  successBox: { alignItems: "center", paddingVertical: 14, gap: 6 },
  successTitle: { fontSize: 18, fontWeight: "800", marginTop: 8 },
  successText: { fontSize: 13, textAlign: "center" },
});
