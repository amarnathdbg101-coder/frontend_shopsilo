import React from "react";
import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { KhataCustomer } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { MessageCircle, ArrowDownLeft } from "lucide-react-native";

interface KhataCustomerCardProps {
  customer: KhataCustomer;
  onRecordPayment: (customer: KhataCustomer) => void;
  onPressCard?: (customer: KhataCustomer) => void;
}

export const KhataCustomerCard: React.FC<KhataCustomerCardProps> = ({
  customer,
  onRecordPayment,
  onPressCard,
}) => {
  const { colors } = useThemeColor();

  const handleWhatsAppReminder = () => {
    const text = encodeURIComponent(
      `Namaste ${customer.customer_name} ji! Aapka dukan ka baki kul ₹${customer.current_balance} hai. Kripya payment karein. Dhanyawad!`
    );
    const clean = customer.customer_mobile.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/91${clean.slice(-10)}?text=${text}`).catch(() => {});
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onPressCard?.(customer)}
        style={styles.top}
      >
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
            {customer.customer_name}
          </Text>
          <Text style={[styles.mobile, { color: colors.textMuted }]}>
            +91 {customer.customer_mobile} • Tap for passbook
          </Text>
        </View>

        <View style={styles.balanceCol}>
          <Text style={styles.balance}>{formatCurrency(customer.current_balance)}</Text>
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>Udhar Baki</Text>
        </View>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={handleWhatsAppReminder}
          style={[styles.btn, { backgroundColor: "rgba(34,197,94,0.12)" }]}
        >
          <MessageCircle size={14} color="#16a34a" />
          <Text style={[styles.btnText, { color: "#16a34a" }]}>Remind</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onRecordPayment(customer)}
          style={[styles.btn, { backgroundColor: "rgba(37,99,235,0.12)" }]}
        >
          <ArrowDownLeft size={14} color="#2563eb" />
          <Text style={[styles.btnText, { color: "#2563eb" }]}>Jama (Paise Mile)</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  info: { flex: 1, marginRight: 8 },
  name: { fontSize: 15, fontWeight: "700" },
  mobile: { fontSize: 12, marginTop: 2 },
  balanceCol: { alignItems: "flex-end" },
  balance: { fontSize: 16, fontWeight: "800", color: "#dc2626" },
  balanceLabel: { fontSize: 11, marginTop: 1 },
  actionRow: { flexDirection: "row", gap: 8 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 8 },
  btnText: { fontSize: 12, fontWeight: "700" },
});
