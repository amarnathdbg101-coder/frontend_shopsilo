import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useCreateOffer } from "../api/useOffers";
import { X, Sparkles, Tag, Calendar, CheckCircle2 } from "lucide-react-native";

interface CreateOfferModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const TEMPLATES = [
  {
    type: "FLAT_DISCOUNT",
    label: "Flat % Discount",
    title: "Flat Discount on All Items",
    discount_text: "Flat 20% OFF",
    desc: "Special discount on all items in-store. Walk in and claim this deal.",
  },
  {
    type: "BOGO",
    label: "Buy 1 Get 1 (BOGO)",
    title: "Buy 1 Get 1 Free",
    discount_text: "Buy 1 Get 1",
    desc: "Buy one item, get another selected item absolutely free today.",
  },
  {
    type: "BUY_X_GET_Y",
    label: "Buy 2 Get 1 Free",
    title: "Buy 2 Get 1 Free Special",
    discount_text: "Buy 2 Get 1",
    desc: "Buy any two selected items and get one free at our counter.",
  },
  {
    type: "FESTIVE",
    label: "Festive Deal",
    title: "Festival Celebration In-Store Offer",
    discount_text: "Festive Special",
    desc: "Celebrate with special discounted prices in-store for a limited time.",
  },
];

export const CreateOfferModal: React.FC<CreateOfferModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors } = useThemeColor();
  const createMutation = useCreateOffer();

  const [title, setTitle] = useState("");
  const [discountText, setDiscountText] = useState("");
  const [description, setDescription] = useState("");
  const [days, setDays] = useState(7);
  const [errorMessage, setErrorMessage] = useState("");

  const applyTemplate = (tmpl: (typeof TEMPLATES)[0]) => {
    setTitle(tmpl.title);
    setDiscountText(tmpl.discount_text);
    setDescription(tmpl.desc);
  };

  const handleSubmit = async () => {
    if (!title.trim() || !discountText.trim()) {
      setErrorMessage("Title aur Discount Text required hain");
      return;
    }

    setErrorMessage("");
    try {
      await createMutation.mutateAsync({
        title: title.trim(),
        discount_text: discountText.trim(),
        description: description.trim(),
        expires_in_days: days,
      });
      setTitle("");
      setDiscountText("");
      setDescription("");
      setDays(7);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMessage(err?.message || "Offer create nahi ho saka");
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.sparkleIcon}>
                <Sparkles size={18} color="#ec4899" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Create Live Deal</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Attract nearby walk-in customers
                </Text>
              </View>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Quick Templates */}
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>QUICK TEMPLATES</Text>
            <View style={styles.templatesGrid}>
              {TEMPLATES.map((tmpl) => (
                <Pressable
                  key={tmpl.type}
                  accessibilityRole="button"
                  onPress={() => applyTemplate(tmpl)}
                  style={[styles.templateBtn, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.templateLabel, { color: colors.text }]}>{tmpl.label}</Text>
                  <Tag size={12} color={colors.primary} />
                </Pressable>
              ))}
            </View>

            {errorMessage ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Offer Title */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Offer Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="e.g. Weekend Special Electronics Bonanza"
                placeholderTextColor={colors.textMuted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Discount Badge Text */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Discount Badge Text *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="e.g. Flat 20% OFF or Buy 1 Get 1"
                placeholderTextColor={colors.textMuted}
                value={discountText}
                onChangeText={setDiscountText}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Offer Description (Optional)</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.text }]}
                placeholder="Which items are included? Walk-in counter terms..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            {/* Validity Days */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.text }]}>Valid For Duration</Text>
              <View style={styles.daysRow}>
                {[3, 7, 15, 30].map((d) => (
                  <Pressable
                    key={d}
                    accessibilityRole="button"
                    onPress={() => setDays(d)}
                    style={[
                      styles.dayChip,
                      {
                        backgroundColor: days === d ? colors.primary : colors.background,
                        borderColor: days === d ? colors.primary : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Text style={[styles.dayText, { color: days === d ? "#fff" : colors.text }]}>
                      {d === 7 ? "7 Days (1 Wk)" : `${d} Days`}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>

          {/* Footer Action Buttons */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={handleSubmit}
              disabled={createMutation.isPending}
              style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            >
              {createMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <CheckCircle2 size={16} color="#fff" />
                  <Text style={styles.submitText}>Publish Offer Live</Text>
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    maxHeight: "90%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(236, 72, 153, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 17, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 1 },
  closeBtn: { padding: 6 },
  body: { padding: 20, gap: 14 },
  sectionLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.6 },
  templatesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  templateBtn: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  templateLabel: { fontSize: 12, fontWeight: "600" },
  errorBox: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    padding: 10,
    borderRadius: 8,
  },
  errorText: { color: "#ef4444", fontSize: 12, fontWeight: "600" },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 70,
    fontSize: 14,
    textAlignVertical: "top",
  },
  daysRow: { flexDirection: "row", gap: 8 },
  dayChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
  },
  dayText: { fontSize: 11, fontWeight: "700" },
  footer: {
    flexDirection: "row",
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
  },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 14, fontWeight: "600" },
  submitBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  submitText: { color: "#fff", fontSize: 14, fontWeight: "800" },
});
