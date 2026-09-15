import React, { useState } from "react";
import { StyleSheet, Text, View, FlatList } from "react-native";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { useExpenses } from "@/features/merchant/api/useExpenses";
import { ExpenseItemCard } from "@/features/merchant/components/ExpenseItemCard";
import { AddExpenseModal } from "@/features/merchant/components/AddExpenseModal";
import { Plus, IndianRupee } from "lucide-react-native";

export default function ExpensesScreen() {
  const { colors } = useThemeColor();
  const [modalVisible, setModalVisible] = useState(false);

  const { data: expenses, isLoading } = useExpenses();

  const totalExpense = (expenses ?? []).reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <ScreenWrapper style={styles.container}>
      <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Total Expenses</Text>
          <Text style={[styles.summaryTotal, { color: colors.text }]}>
            {formatCurrency(totalExpense)}
          </Text>
        </View>
        <Button
          title="Record Kharcha"
          variant="primary"
          size="sm"
          leftIcon={<Plus size={16} color="#fff" />}
          onPress={() => setModalVisible(true)}
        />
      </View>

      {isLoading ? (
        <LoadingState message="Loading store expenses..." />
      ) : (
        <FlatList
          data={expenses ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ExpenseItemCard expense={item} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No expenses recorded yet. Tap "Record Kharcha" to log store overheads.
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}

      <AddExpenseModal visible={modalVisible} onClose={() => setModalVisible(false)} />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  summaryCard: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, marginVertical: 12 },
  summaryLabel: { fontSize: 12, fontWeight: "600" },
  summaryTotal: { fontSize: 22, fontWeight: "800", marginTop: 2 },
  list: { paddingBottom: 24 },
  empty: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 13, textAlign: "center" },
});
