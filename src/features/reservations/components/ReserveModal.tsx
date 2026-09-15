import React, { useState } from "react";
import { StyleSheet, Text, View, Modal, Pressable } from "react-native";
import { Product } from "@/features/catalog/types";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useCreateReservation } from "@/features/reservations/api/useReservations";
import { X, ShoppingBag } from "lucide-react-native";

interface ReserveModalProps {
  product: Product;
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReserveModal: React.FC<ReserveModalProps> = ({
  product,
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useThemeColor();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState("");
  const { mutate: createReservation, isPending } = useCreateReservation();

  const handleConfirm = () => {
    createReservation(
      { product_id: product.id, quantity, hold_hours: 4, notes },
      {
        onSuccess: () => {
          onSuccess();
          onClose();
        },
      }
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.background }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>
              Reserve at Store
            </Text>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.productName, { color: colors.text }]}>
            {product.name}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Item will be held at counter for 4 hours with guaranteed stock.
          </Text>

          <View style={styles.quantityRow}>
            <Text style={[styles.label, { color: colors.text }]}>Quantity:</Text>
            <View style={styles.stepper}>
              <Pressable
                accessibilityRole="button"
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={[styles.stepBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.stepText, { color: colors.text }]}>-</Text>
              </Pressable>
              <Text style={[styles.qtyValue, { color: colors.text }]}>{quantity}</Text>
              <Pressable
                accessibilityRole="button"
                onPress={() => setQuantity(Math.min(5, quantity + 1))}
                style={[styles.stepBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.stepText, { color: colors.text }]}>+</Text>
              </Pressable>
            </View>
          </View>

          <Input
            label="Notes (Optional)"
            placeholder="e.g. Arriving at 5 PM"
            value={notes}
            onChangeText={setNotes}
          />

          <Button
            title="Confirm Reservation"
            size="lg"
            isLoading={isPending}
            onPress={handleConfirm}
            leftIcon={<ShoppingBag size={18} color="#ffffff" />}
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: { fontSize: 18, fontWeight: "700" },
  closeBtn: { padding: 4 },
  productName: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  subtitle: { fontSize: 13, lineHeight: 18, marginBottom: 14 },
  quantityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  label: { fontSize: 14, fontWeight: "500" },
  stepper: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 17, fontWeight: "600" },
  qtyValue: { fontSize: 16, fontWeight: "700" },
  confirmBtn: { marginTop: 8 },
});
