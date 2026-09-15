import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Product, BargainNegotiationResponse } from "@/features/catalog/types";
import { useMakeOffer } from "@/features/catalog/api/useMakeOffer";
import { useAuthStore } from "@/store/useAuthStore";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, Handshake, CheckCircle2, MessageSquare, AlertCircle } from "lucide-react-native";

interface BargainModalProps {
  product: Product;
  visible: boolean;
  onClose: () => void;
}

export const BargainModal: React.FC<BargainModalProps> = ({ product, visible, onClose }) => {
  const { colors } = useThemeColor();
  const { user } = useAuthStore();
  const { mutate: makeOffer, isPending } = useMakeOffer();

  const [offeredPrice, setOfferedPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [phone, setPhone] = useState(user?.phone || "");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<BargainNegotiationResponse | null>(null);

  const handleSendOffer = () => {
    setErrorMsg("");
    const priceNum = parseFloat(offeredPrice);
    const qtyNum = parseInt(quantity, 10);
    if (isNaN(priceNum) || priceNum <= 0) { setErrorMsg("Please enter a valid offer price"); return; }
    if (!phone || phone.trim().length < 8) { setErrorMsg("Please provide a valid contact phone number"); return; }

    makeOffer(
      { productId: product.id, request: { offered_price: priceNum, quantity: qtyNum > 0 ? qtyNum : 1, customer_phone: phone.trim(), customer_name: user?.full_name || undefined } },
      {
        onSuccess: (data) => setResult(data),
        onError: () => setErrorMsg("Could not submit offer. Please check details or retry."),
      }
    );
  };

  const handleClose = () => {
    setResult(null);
    setErrorMsg("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Handshake size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Make An Offer</Text>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {!result ? (
            <View style={styles.content}>
              <Text style={[styles.productLabel, { color: colors.textMuted }]}>
                Item: <Text style={{ color: colors.text, fontWeight: "700" }}>{product.name}</Text>
              </Text>
              <Text style={[styles.currentPrice, { color: colors.textMuted }]}>
                Listed Price: <Text style={{ color: colors.primary, fontWeight: "800" }}>{formatCurrency(product.price)}</Text>
              </Text>

              {errorMsg ? (
                <View style={styles.errorBox}>
                  <AlertCircle size={14} color="#ef4444" />
                  <Text style={styles.errorText}>{errorMsg}</Text>
                </View>
              ) : null}

              <Input label="Your Proposed Price (₹)" placeholder="e.g. 850" keyboardType="numeric" value={offeredPrice} onChangeText={setOfferedPrice} />
              <Input label="Quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              {!user?.phone && <Input label="Contact Phone" placeholder="10-digit mobile" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />}

              <Button title="Submit Offer to Store" isLoading={isPending} onPress={handleSendOffer} style={styles.submitBtn} />
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.resultHeader}>
                <CheckCircle2 size={36} color="#16a34a" />
                <Text style={[styles.resultTitle, { color: colors.text }]}>{result.status === "DEAL_ACCEPTED" ? "Offer Accepted! 🎉" : "Store Counter-Offer"}</Text>
                <Text style={[styles.resultMsg, { color: colors.textMuted }]}>{result.message}</Text>
              </View>

              <View style={styles.priceSummary}>
                <Text style={styles.agreedPrice}>{formatCurrency(result.agreed_price)}</Text>
                {result.savings_amount > 0 && <Text style={styles.savingsText}>You saved {formatCurrency(result.savings_amount)} ({result.savings_percentage}%)</Text>}
                {result.deal_code && <Text style={styles.dealCode}>Deal Code: {result.deal_code}</Text>}
              </View>

              {result.whatsapp_order_url && (
                <Button title="Chat on WhatsApp" onPress={() => Linking.openURL(result.whatsapp_order_url!)} leftIcon={<MessageSquare size={16} color="#fff" />} style={styles.waBtn} />
              )}
              <Button title="Done" variant="secondary" onPress={handleClose} />
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1, padding: 18, elevation: 8 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  content: { gap: 10 },
  productLabel: { fontSize: 13 },
  currentPrice: { fontSize: 13, marginBottom: 4 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(239, 68, 68, 0.1)", padding: 8, borderRadius: 8 },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600", flex: 1 },
  submitBtn: { marginTop: 6 },
  resultHeader: { alignItems: "center", gap: 6, marginVertical: 8 },
  resultTitle: { fontSize: 18, fontWeight: "800" },
  resultMsg: { fontSize: 13, textAlign: "center" },
  priceSummary: { backgroundColor: "#f0fdf4", borderColor: "#86efac", borderWidth: 1, borderRadius: 12, padding: 12, alignItems: "center", marginVertical: 6, gap: 2 },
  agreedPrice: { fontSize: 24, fontWeight: "900", color: "#15803d" },
  savingsText: { fontSize: 12, fontWeight: "700", color: "#16a34a" },
  dealCode: { fontSize: 11, fontWeight: "800", color: "#334155", letterSpacing: 1, marginTop: 4 },
  waBtn: { backgroundColor: "#25D366", borderColor: "#25D366", marginBottom: 4 },
});
