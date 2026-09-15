import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { ReservationItem } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { CheckCircle, Clock } from "lucide-react-native";

interface PickupCardProps {
  item: ReservationItem;
  onVerify: (code: string) => void;
}

export const PickupCard: React.FC<PickupCardProps> = ({ item, onVerify }) => {
  const { colors } = useThemeColor();
  const isPending = item.status === "pending";

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {item.customer_name || "Customer"}
          </Text>
          <Text style={[styles.phone, { color: colors.textMuted }]}>
            +91 {item.customer_phone || "N/A"}
          </Text>
        </View>

        <View style={[styles.codeBadge, { backgroundColor: isPending ? "rgba(37,99,235,0.12)" : "rgba(22,163,74,0.12)" }]}>
          <Text style={[styles.codeText, { color: isPending ? "#2563eb" : "#16a34a" }]}>
            OTP: {item.pickup_code || "N/A"}
          </Text>
        </View>
      </View>

      <View style={styles.bottomRow}>
        <Text style={[styles.amount, { color: colors.text }]}>
          {formatCurrency(item.total_amount ?? item.total_price)}
        </Text>

        {isPending ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => onVerify(item.pickup_code)}
            style={[styles.verifyBtn, { backgroundColor: colors.primary }]}
          >
            <Clock size={14} color="#fff" />
            <Text style={styles.verifyBtnText}>Verify OTP</Text>
          </Pressable>
        ) : (
          <View style={styles.completedBadge}>
            <CheckCircle size={14} color="#16a34a" />
            <Text style={styles.completedText}>Completed</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: "700" },
  phone: { fontSize: 12, marginTop: 2 },
  codeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  codeText: { fontSize: 13, fontWeight: "800" },
  bottomRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  amount: { fontSize: 16, fontWeight: "800" },
  verifyBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  verifyBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  completedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  completedText: { color: "#16a34a", fontSize: 12, fontWeight: "700" },
});
