import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { useSubmitReport } from "@/features/catalog/api/useSubmitReport";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, ShieldAlert, CheckCircle2 } from "lucide-react-native";

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: "shop" | "product";
  targetId: string;
  targetName: string;
}

const REASONS = [
  "Misleading Price / Quality",
  "Fake / Inactive Store",
  "Counterfeit Item",
  "Refused Counter OTP",
];

export const ReportModal: React.FC<ReportModalProps> = ({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}) => {
  const { colors } = useThemeColor();
  const { mutate: submitReport, isPending } = useSubmitReport();

  const [reason, setReason] = useState(REASONS[0]);
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!description.trim()) return;
    submitReport(
      {
        target_type: targetType,
        target_id: targetId,
        reason,
        description: description.trim(),
      },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  const handleClose = () => {
    setSubmitted(false);
    setDescription("");
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ShieldAlert size={20} color="#dc2626" />
              <Text style={[styles.title, { color: colors.text }]}>Report {targetType === "shop" ? "Store" : "Item"}</Text>
            </View>
            <Pressable onPress={handleClose} hitSlop={8}><X size={20} color={colors.textMuted} /></Pressable>
          </View>

          {submitted ? (
            <View style={styles.successBox}>
              <CheckCircle2 size={36} color="#16a34a" />
              <Text style={[styles.successTitle, { color: colors.text }]}>Report Submitted</Text>
              <Text style={[styles.successSub, { color: colors.textMuted }]}>
                Thank you. Our safety officer will review {targetName} under IT Rules 2021 compliance.
              </Text>
              <Pressable onPress={handleClose} style={[styles.submitBtn, { backgroundColor: colors.primary }]}>
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Done</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={[styles.targetName, { color: colors.text }]}>Reporting: {targetName}</Text>
              <Text style={[styles.label, { color: colors.textMuted }]}>Select Issue Reason:</Text>
              <View style={styles.reasonWrap}>
                {REASONS.map((r) => (
                  <Pressable
                    key={r}
                    onPress={() => setReason(r)}
                    style={[
                      styles.reasonChip,
                      { borderColor: reason === r ? colors.primary : colors.surfaceBorder, backgroundColor: reason === r ? colors.primary : colors.background },
                    ]}
                  >
                    <Text style={[styles.reasonText, { color: reason === r ? colors.primaryForeground : colors.text }]}>{r}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Describe details (e.g. store was shut during open hours)..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                style={[styles.input, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}
              />

              <Pressable
                disabled={isPending || !description.trim()}
                onPress={handleSubmit}
                style={[styles.submitBtn, { backgroundColor: colors.primary, opacity: isPending || !description.trim() ? 0.6 : 1 }]}
              >
                <Text style={[styles.btnText, { color: colors.primaryForeground }]}>{isPending ? "Submitting..." : "Submit Safety Report"}</Text>
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  targetName: { fontSize: 13, fontWeight: "700" },
  label: { fontSize: 11, fontWeight: "700" },
  content: { gap: 10 },
  reasonWrap: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  reasonChip: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  reasonText: { fontSize: 11, fontWeight: "700" },
  input: { borderWidth: 1, borderRadius: 10, padding: 10, minHeight: 65, textAlignVertical: "top", fontSize: 12 },
  submitBtn: { paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  btnText: { fontSize: 13, fontWeight: "800" },
  successBox: { alignItems: "center", gap: 8, paddingVertical: 16 },
  successTitle: { fontSize: 16, fontWeight: "800" },
  successSub: { fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 8 },
});
