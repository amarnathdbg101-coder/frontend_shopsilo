import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { X, Calendar, CheckCircle2, Clock, Sparkles } from "lucide-react-native";

interface PromiseToPayModalProps {
  visible: boolean;
  onClose: () => void;
  customerName: string;
  currentBalance: number;
  initialPromiseDate?: string;
  initialTarget?: number;
  onSave: (promiseDate: string, target: number) => Promise<void>;
}

export const PromiseToPayModal: React.FC<PromiseToPayModalProps> = ({
  visible,
  onClose,
  customerName,
  currentBalance,
  initialPromiseDate,
  initialTarget,
  onSave,
}) => {
  const { colors, isDark } = useThemeColor();

  const [targetAmount, setTargetAmount] = useState(
    initialTarget && initialTarget > 0 ? String(initialTarget) : String(currentBalance)
  );
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper to format ISO YYYY-MM-DD
  const formatDateISO = (d: Date) => d.toISOString().split("T")[0];

  useEffect(() => {
    if (visible) {
      setTargetAmount(initialTarget && initialTarget > 0 ? String(initialTarget) : String(currentBalance));
      if (initialPromiseDate) {
        setSelectedDate(initialPromiseDate.split("T")[0]);
      } else {
        // default 15 days ahead
        const d = new Date();
        d.setDate(d.getDate() + 15);
        setSelectedDate(formatDateISO(d));
      }
    }
  }, [visible, initialPromiseDate, initialTarget, currentBalance]);

  const quickDates = [
    { label: "7 Din", getDays: 7 },
    { label: "15 Din", getDays: 15 },
    { label: "1 Month", getDays: 30 },
  ];

  const handleSelectQuickDays = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setSelectedDate(formatDateISO(d));
  };

  const handleConfirm = async () => {
    if (!selectedDate) {
      Alert.alert("Date Required", "Kripya repayment ki agreed date chunein.");
      return;
    }
    const amt = parseFloat(targetAmount) || 0;

    setIsSubmitting(true);
    try {
      await onSave(selectedDate, amt);
      Alert.alert(
        "Promise to Pay Set",
        `${customerName} ke sath ${new Date(selectedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ko hisab chukta karne ka target set ho gaya hai.`
      );
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Promise date save nahi ho payi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.titleRow}>
              <Calendar size={20} color={colors.primary} />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Kisht / Promise to Pay</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {customerName} • Kul Baki: {formatCurrency(currentBalance)}
                </Text>
              </View>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceBorder }]}
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Target Installment Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Kisht / Target Amount (₹):</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background },
                ]}
                keyboardType="numeric"
                value={targetAmount}
                onChangeText={setTargetAmount}
                placeholder="₹ Target amount"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Agreed Target Date */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Chukta Karne Ki Tareekh (Promise Date):</Text>
              <TextInput
                style={[
                  styles.input,
                  { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background },
                ]}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
              />

              {/* Quick Chips */}
              <View style={styles.chipsRow}>
                {quickDates.map((q) => (
                  <Pressable
                    key={q.label}
                    onPress={() => handleSelectQuickDays(q.getDays)}
                    style={[styles.chip, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
                  >
                    <Clock size={12} color={colors.primary} />
                    <Text style={[styles.chipText, { color: colors.text }]}>+{q.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Friendly explanation */}
            <View style={[styles.infoCard, { backgroundColor: isDark ? "#1e293b" : "#f0fdf4" }]}>
              <Sparkles size={16} color="#16a34a" />
              <Text style={[styles.infoText, { color: isDark ? "#94a3b8" : "#166534" }]}>
                Is tareekh par dono paksho ke passbook me progress dikhega aur 1-tap polite reminder bheja ja sakega.
              </Text>
            </View>
          </View>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <Pressable
              accessibilityRole="button"
              onPress={handleConfirm}
              disabled={isSubmitting}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Target Tareekh Save Karein</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 16,
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 48,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
