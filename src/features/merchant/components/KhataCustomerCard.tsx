import React from "react";
import { StyleSheet, Text, View, Pressable, Linking } from "react-native";
import { KhataCustomer } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import {
  MessageCircle,
  ArrowDownLeft,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  QrCode,
} from "lucide-react-native";

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
  const { colors, isDark } = useThemeColor();

  const handleWhatsAppReminder = () => {
    const text = encodeURIComponent(
      `Namaste ${customer.customer_name} ji! Dukan ka baki kul ${formatCurrency(customer.current_balance)} hai. Kripya samay par chukta karein. Dhanyawad!`
    );
    const clean = customer.customer_mobile.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/91${clean.slice(-10)}?text=${text}`).catch(() => {});
  };

  // Promise date calculations
  const ptpDate = customer.promise_to_pay_date ? new Date(customer.promise_to_pay_date) : null;
  const isOverdue = ptpDate && ptpDate < new Date() && customer.current_balance > 0;
  const isDueToday = ptpDate && ptpDate.toDateString() === new Date().toDateString() && customer.current_balance > 0;

  // Credit limit utilization
  const creditLimit = customer.credit_limit || 0;
  const isLimitCrossed = creditLimit > 0 && customer.current_balance > creditLimit;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <Pressable
        accessibilityRole="button"
        onPress={() => onPressCard?.(customer)}
        style={styles.top}
      >
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.text }]}>
              {customer.customer_name}
            </Text>
            {customer.is_registered && (
              <View style={styles.appBadge}>
                <ShieldCheck size={11} color="#16a34a" />
                <Text style={styles.appBadgeText}>App User</Text>
              </View>
            )}
            <TrustScoreBadge
              score={customer.trust_score || 750}
              badge={customer.trust_badge || "TRUSTED"}
              size="sm"
            />
          </View>

          <Text style={[styles.mobile, { color: colors.textMuted }]}>
            +91 {customer.customer_mobile} • Tap for passbook
          </Text>

          {/* Tags row */}
          <View style={styles.tagsRow}>
            {!!ptpDate && (
              <View
                style={[
                  styles.ptpTag,
                  {
                    backgroundColor: isOverdue ? "#fee2e2" : isDueToday ? "#fef3c7" : "#eff6ff",
                  },
                ]}
              >
                <Calendar size={10} color={isOverdue ? "#dc2626" : isDueToday ? "#d97706" : "#2563eb"} />
                <Text
                  style={[
                    styles.ptpTagText,
                    {
                      color: isOverdue ? "#dc2626" : isDueToday ? "#d97706" : "#2563eb",
                    },
                  ]}
                >
                  {isOverdue ? "Overdue: " : isDueToday ? "Due Today: " : "Promise: "}
                  {ptpDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </Text>
              </View>
            )}

            {isLimitCrossed && (
              <View style={styles.limitCrossTag}>
                <AlertTriangle size={10} color="#b91c1c" />
                <Text style={styles.limitCrossTagText}>Limit Cross ({formatCurrency(creditLimit)})</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.balanceCol}>
          <Text
            style={[
              styles.balance,
              { color: customer.current_balance > 0 ? "#dc2626" : "#16a34a" },
            ]}
          >
            {formatCurrency(customer.current_balance)}
          </Text>
          <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>
            {customer.current_balance > 0 ? "Udhar Baki" : "Chukta"}
          </Text>
        </View>
      </Pressable>

      <View style={styles.actionRow}>
        <Pressable
          accessibilityRole="button"
          onPress={handleWhatsAppReminder}
          style={[styles.btn, { backgroundColor: "rgba(34,197,94,0.12)" }]}
        >
          <MessageCircle size={14} color="#16a34a" />
          <Text style={[styles.btnText, { color: "#16a34a" }]}>Remind (WhatsApp)</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          onPress={() => onRecordPayment(customer)}
          style={[styles.btn, { backgroundColor: "rgba(37,99,235,0.12)" }]}
        >
          <ArrowDownLeft size={14} color="#2563eb" />
          <Text style={[styles.btnText, { color: "#2563eb" }]}>Jama / Entry</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 10,
    gap: 8,
  },
  top: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  info: {
    flex: 1,
    marginRight: 8,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 15,
    fontWeight: "800",
  },
  appBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16a34a",
  },
  mobile: {
    fontSize: 12,
  },
  tagsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginTop: 2,
  },
  ptpTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ptpTagText: {
    fontSize: 10,
    fontWeight: "700",
  },
  limitCrossTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#fee2e2",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  limitCrossTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b91c1c",
  },
  balanceCol: {
    alignItems: "flex-end",
  },
  balance: {
    fontSize: 17,
    fontWeight: "900",
  },
  balanceLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
