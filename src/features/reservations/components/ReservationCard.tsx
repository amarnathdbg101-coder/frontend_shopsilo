import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { Reservation } from "@/features/reservations/types";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Clock, Store, Key } from "lucide-react-native";

interface ReservationCardProps {
  reservation: Reservation;
}

export const ReservationCard: React.FC<ReservationCardProps> = ({
  reservation,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return { bg: "#dcfce7", text: "#166534" };
      case "completed":
        return { bg: "#e0f2fe", text: "#0369a1" };
      case "cancelled":
        return { bg: "#fee2e2", text: "#b91c1c" };
      default:
        return { bg: "#f1f5f9", text: "#64748b" };
    }
  };

  const statusStyle = getStatusColor(reservation.status);

  const handlePress = () => {
    if (reservation.product_id) {
      router.push(`/product/${reservation.product_id}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
        pressed && { opacity: 0.92 },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.resNumber, { color: colors.textMuted }]}>
          #{reservation.reservation_number}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
          <Text style={[styles.statusText, { color: statusStyle.text }]}>
            {reservation.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.productRow}>
        <Text numberOfLines={1} style={[styles.productName, { color: colors.text }]}>
          {reservation.product?.name || "Reserved Item"}
        </Text>
        {typeof reservation.product?.price === "number" && (
          <Text style={[styles.productPrice, { color: colors.primary }]}>
            {formatCurrency(reservation.product.price)}
          </Text>
        )}
      </View>

      {reservation.shop && (
        <View style={styles.shopRow}>
          <Store size={14} color={colors.textMuted} />
          <Text style={[styles.shopName, { color: colors.textMuted }]}>
            {reservation.shop.name}
          </Text>
        </View>
      )}

      {/* Counter Pickup Code */}
      <View
        style={[
          styles.pickupBox,
          { backgroundColor: colors.inputBackground, borderColor: colors.surfaceBorder },
        ]}
      >
        <View style={styles.pickupLeft}>
          <Key size={15} color={colors.primary} />
          <Text style={[styles.pickupLabel, { color: colors.textMuted }]}>
            Counter OTP:
          </Text>
        </View>
        <Text style={[styles.pickupCode, { color: colors.primary }]}>
          {reservation.pickup_code}
        </Text>
      </View>

      {reservation.status === "active" && reservation.time_remaining_minutes > 0 && (
        <View style={styles.timeRow}>
          <Clock size={13} color="#f59e0b" />
          <Text style={styles.timeText}>
            Expires in {reservation.time_remaining_minutes} mins
          </Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 12 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  resNumber: { fontSize: 12, fontWeight: "600" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  statusText: { fontSize: 11, fontWeight: "700" },
  productRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3 },
  productName: { fontSize: 16, fontWeight: "800", flex: 1, marginRight: 8 },
  productPrice: { fontSize: 15, fontWeight: "800" },
  shopRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  shopName: { fontSize: 13 },
  pickupBox: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  pickupLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  pickupLabel: { fontSize: 12, fontWeight: "500" },
  pickupCode: { fontSize: 15, fontWeight: "800", letterSpacing: 2 },
  timeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  timeText: { fontSize: 12, color: "#b45309", fontWeight: "600" },
});
