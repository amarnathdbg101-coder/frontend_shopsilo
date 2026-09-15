import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { Minus, Plus, Trash2 } from "lucide-react-native";

export interface CartItemData {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface POSCartItemProps {
  item: CartItemData;
  onIncrement: () => void;
  onDecrement: () => void;
  onRemove: () => void;
}

export const POSCartItem: React.FC<POSCartItemProps> = ({
  item,
  onIncrement,
  onDecrement,
  onRemove,
}) => {
  const { colors } = useThemeColor();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.left}>
        <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
          {item.name}
        </Text>
        <Text style={[styles.price, { color: colors.textMuted }]}>
          {formatCurrency(item.price)} × {item.quantity} ={" "}
          <Text style={{ color: colors.text, fontWeight: "700" }}>
            {formatCurrency(item.price * item.quantity)}
          </Text>
        </Text>
      </View>

      <View style={styles.controls}>
        <Pressable accessibilityRole="button" onPress={onDecrement} style={[styles.btn, { borderColor: colors.surfaceBorder }]}>
          <Minus size={14} color={colors.text} />
        </Pressable>
        <Text style={[styles.qty, { color: colors.text }]}>{item.quantity}</Text>
        <Pressable accessibilityRole="button" onPress={onIncrement} style={[styles.btn, { borderColor: colors.surfaceBorder }]}>
          <Plus size={14} color={colors.text} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onRemove} style={styles.trashBtn}>
          <Trash2 size={16} color="#ef4444" />
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 10, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  left: { flex: 1, marginRight: 8 },
  name: { fontSize: 14, fontWeight: "700" },
  price: { fontSize: 12, marginTop: 2 },
  controls: { flexDirection: "row", alignItems: "center", gap: 6 },
  btn: { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  qty: { fontSize: 14, fontWeight: "700", minWidth: 20, textAlign: "center" },
  trashBtn: { padding: 6 },
});
