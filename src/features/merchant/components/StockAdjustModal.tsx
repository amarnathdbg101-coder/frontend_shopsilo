import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, TextInput, Alert, Pressable } from "react-native";
import { LowStockItem } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import { useAdjustStock } from "../api/useInventory";
import { X } from "lucide-react-native";

interface StockAdjustModalProps {
  visible: boolean;
  item: LowStockItem | null;
  onClose: () => void;
}

export const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  visible,
  item,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"restock" | "damage" | "audit">("restock");

  const adjustMutation = useAdjustStock();

  const handleAdjust = () => {
    if (!item) return;
    const qty = parseInt(delta, 10);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert("Invalid Quantity", "Please enter a positive count.");
      return;
    }

    const signedDelta = type === "damage" ? -qty : qty;
    const targetId = item.product_id || item.id;
    if (!targetId) return Alert.alert("Error", "Invalid product ID");

    adjustMutation.mutate(
      {
        product_id: targetId,
        adjustment: signedDelta,
        notes: reason || type,
      },
      {
        onSuccess: () => {
          setDelta("");
          setReason("");
          onClose();
        },
        onError: () => {
          Alert.alert("Error", "Could not adjust stock. Please try again.");
        },
      }
    );
  };

  if (!item) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.header}>
            <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
              Adjust: {item.product_name || item.name}
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.currentStock, { color: colors.textMuted }]}>
            Current Stock: <Text style={{ color: (item.current_stock ?? item.stock_quantity ?? 0) <= (item.min_threshold || item.low_stock_threshold || 5) ? "#dc2626" : "#16a34a", fontWeight: "700" }}>{item.current_stock ?? item.stock_quantity ?? 0}</Text> | Min Threshold: {item.min_threshold || item.low_stock_threshold || 5}
          </Text>

          <View style={styles.typeRow}>
            {(["restock", "damage", "audit"] as const).map((t) => (
              <Pressable
                key={t}
                accessibilityRole="button"
                onPress={() => setType(t)}
                style={[
                  styles.typeTab,
                  {
                    backgroundColor: type === t ? colors.primary : colors.surfaceBorder,
                  },
                ]}
              >
                <Text style={[styles.typeText, { color: type === t ? "#fff" : colors.text }]}>
                  {t.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Units count (e.g. 10)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            value={delta}
            onChangeText={setDelta}
          />

          <TextInput
            style={[styles.input, { backgroundColor: colors.surfaceBorder, color: colors.text }]}
            placeholder="Reason or notes (optional)"
            placeholderTextColor={colors.textMuted}
            value={reason}
            onChangeText={setReason}
          />

          <Button
            title={`Confirm ${type.toUpperCase()}`}
            variant="primary"
            isLoading={adjustMutation.isPending}
            disabled={adjustMutation.isPending}
            onPress={handleAdjust}
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 16, fontWeight: "800", flex: 1, marginRight: 8 },
  closeBtn: { padding: 4 },
  currentStock: { fontSize: 12, marginBottom: 4 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: "center" },
  typeText: { fontSize: 11, fontWeight: "700" },
  input: { height: 42, borderRadius: 8, paddingHorizontal: 12, fontSize: 14 },
  submitBtn: { marginTop: 6 },
});
