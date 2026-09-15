import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Expense } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { IndianRupee, Coffee, Home, Zap, Users, Package, HelpCircle } from "lucide-react-native";

interface ExpenseItemCardProps {
  expense: Expense;
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case "tea_snacks":
      return <Coffee size={16} color="#d97706" />;
    case "rent":
      return <Home size={16} color="#2563eb" />;
    case "electricity":
      return <Zap size={16} color="#eab308" />;
    case "salary":
      return <Users size={16} color="#059669" />;
    case "packaging":
      return <Package size={16} color="#7c3aed" />;
    default:
      return <HelpCircle size={16} color="#6b7280" />;
  }
};

export const ExpenseItemCard: React.FC<ExpenseItemCardProps> = ({ expense }) => {
  const { colors } = useThemeColor();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
      <View style={styles.left}>
        <View style={styles.iconWrap}>{getCategoryIcon(expense.category)}</View>
        <View style={styles.info}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {expense.notes || expense.category.replace("_", " ").toUpperCase()}
          </Text>
          <Text style={[styles.sub, { color: colors.textMuted }]}>
            {expense.category.toUpperCase()} • {expense.payment_method.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={[styles.amount, { color: colors.text }]}>
        -{formatCurrency(expense.amount)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 12, borderRadius: 12, borderWidth: 1, marginBottom: 8 },
  left: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1, marginRight: 8 },
  iconWrap: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.04)", alignItems: "center", justifyContent: "center" },
  info: { flex: 1 },
  title: { fontSize: 14, fontWeight: "700" },
  sub: { fontSize: 11, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: "800" },
});
