import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Pressable } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Product } from "@/features/catalog/types";
import { useNotifyMe } from "@/features/catalog/api/useNotifyMe";
import { useAuthStore } from "@/store/useAuthStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, BellRing, CheckCircle2, AlertCircle } from "lucide-react-native";

interface StockAlertModalProps {
  product: Product;
  visible: boolean;
  onClose: () => void;
}

export const StockAlertModal: React.FC<StockAlertModalProps> = ({ product, visible, onClose }) => {
  const { colors } = useThemeColor();
  const { user } = useAuthStore();
  const { mutate: notifyMe, isPending } = useNotifyMe();

  const [phone, setPhone] = useState(user?.phone || "");
  const [errorMsg, setErrorMsg] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = () => {
    setErrorMsg("");
    if (!phone || phone.trim().length < 8) {
      setErrorMsg("Please enter a valid phone number");
      return;
    }

    notifyMe(
      {
        productId: product.id,
        request: {
          customer_phone: phone.trim(),
          customer_name: user?.full_name || undefined,
        },
      },
      {
        onSuccess: () => setSuccess(true),
        onError: () => setErrorMsg("Failed to subscribe for alert. Try again later."),
      }
    );
  };

  const handleClose = () => {
    setSuccess(false);
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <BellRing size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Back In Stock Alert</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {!success ? (
            <View style={styles.content}>
              <Text style={[styles.description, { color: colors.textMuted }]}>
                Get an instant SMS/WhatsApp alert the moment <Text style={{ color: colors.text, fontWeight: "700" }}>{product.name}</Text> is restocked at the local store.
              </Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color="#ef4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <Input
                label="Mobile Phone Number"
                placeholder="10-digit mobile number"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />

              <Button title="Notify Me When Available" isLoading={isPending} onPress={handleSubmit} style={styles.submitBtn} />
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.successBox}>
                <CheckCircle2 size={36} color="#16a34a" />
                <Text style={[styles.successTitle, { color: colors.text }]}>Alert Activated!</Text>
                <Text style={[styles.successText, { color: colors.textMuted }]}>
                  We will notify {phone} as soon as this item arrives back on store shelves.
                </Text>
              </View>
              <Button title="Close" variant="secondary" onPress={handleClose} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 360, borderRadius: 20, borderWidth: 1, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  content: { gap: 12 },
  description: { fontSize: 13, lineHeight: 18 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 8, borderRadius: 8 },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", flex: 1 },
  submitBtn: { marginTop: 4 },
  successBox: { alignItems: "center", gap: 8, marginVertical: 12 },
  successTitle: { fontSize: 18, fontWeight: "800" },
  successText: { fontSize: 13, textAlign: "center", lineHeight: 18 },
});
