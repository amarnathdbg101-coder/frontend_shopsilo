import React, { useState } from "react";
import { StyleSheet, Text, View, Modal, TextInput, Pressable, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMerchantProducts } from "@/features/merchant/api/usePOS";
import { ParsedParchiItem } from "@/features/merchant/types";
import { parseParchiWithAI, AIParchiResult } from "../services/aiParchiMatcher";
import { formatCurrency } from "@/utils/format";
import { FileText, X, CheckCircle2, AlertTriangle, Sparkles, ClipboardList } from "lucide-react-native";

interface POSParchiModalProps {
  visible: boolean;
  onClose: () => void;
  onImportItems: (items: ParsedParchiItem[]) => void;
}

export const POSParchiModal: React.FC<POSParchiModalProps> = ({ visible, onClose, onImportItems }) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [rawText, setRawText] = useState("");
  const [parsedResult, setParsedResult] = useState<AIParchiResult | null>(null);
  const [isParsing, setIsParsing] = useState(false);

  const { data: inventory = [] } = useMerchantProducts();

  const handleParse = async () => {
    if (!rawText.trim() || rawText.trim().length < 2) {
      return Alert.alert("Parchi Empty", "Paste or type a grocery list first (e.g. 2kg chawal, 1kg chini).");
    }

    try {
      setIsParsing(true);
      const res = await parseParchiWithAI(rawText, inventory);
      setParsedResult(res);
    } catch (err: any) {
      Alert.alert("AI Parchi Notice", err?.message || "Could not parse parchi. Please verify text.");
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = () => {
    if (!parsedResult?.matched_items?.length) return;
    onImportItems(parsedResult.matched_items);
    setRawText("");
    setParsedResult(null);
    onClose();
  };

  const handleOpenMandiList = () => {
    onClose();
    router.push("/merchant/procurement-list");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <FileText size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Paste WhatsApp Parchi</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              Paste grocery lists copied from customer WhatsApp chats to automatically convert them into cart items.
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="e.g.&#10;2kg basmati chawal&#10;500g toor dal&#10;1 packet surf excel"
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={5}
              value={rawText}
              onChangeText={setRawText}
            />

            <Button
              title={isParsing ? "AI Matching Items..." : "AI Parse & Match Products ✨"}
              variant="outline"
              size="md"
              isLoading={isParsing}
              disabled={isParsing || !rawText.trim()}
              onPress={handleParse}
              leftIcon={<Sparkles size={16} color={colors.primary} />}
            />

            {parsedResult && (
              <View style={styles.resultSection}>
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryText, { color: colors.text }]}>
                    Matched: <Text style={{ color: "#16a34a", fontWeight: "700" }}>{parsedResult.matched_count}</Text> items
                  </Text>
                  <Text style={[styles.summaryText, { color: colors.primary, fontWeight: "800" }]}>
                    Est. Total: {formatCurrency(parsedResult.estimated_total_amount)}
                  </Text>
                </View>

                {parsedResult.matched_items.map((item) => (
                  <View key={item.product_id} style={[styles.itemCard, { backgroundColor: colors.background }]}>
                    <View style={styles.itemHeader}>
                      <CheckCircle2 size={16} color="#16a34a" />
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.product_name}</Text>
                    </View>
                    <Text style={[styles.itemDetail, { color: colors.textMuted }]}>
                      Qty: {item.requested_quantity} {item.parsed_unit || "units"} • {formatCurrency(item.unit_price)} each = {formatCurrency(item.total_price)}
                    </Text>
                  </View>
                ))}

                {((parsedResult.unmatched_lines?.length || 0) > 0 || (parsedResult.unmatched_items?.length || 0) > 0) && (
                  <View style={styles.unmatchedBox}>
                    <View style={styles.unmatchedHeader}>
                      <AlertTriangle size={14} color="#d97706" />
                      <Text style={styles.unmatchedTitle}>
                        Not in Store Stock ({(parsedResult.unmatched_lines?.length || 0) + (parsedResult.unmatched_items?.length || 0)})
                      </Text>
                    </View>
                    {(parsedResult.unmatched_lines || []).map((u, i) => (
                      <Text key={`line-${i}`} style={styles.unmatchedText}>• "{u.original_line}"</Text>
                    ))}
                    {(parsedResult.unmatched_items || []).map((u, i) => (
                      <Text key={`item-${i}`} style={styles.unmatchedText}>• "{u.raw_text}" ({u.reason})</Text>
                    ))}

                    <Pressable
                      accessibilityRole="button"
                      onPress={handleOpenMandiList}
                      style={styles.mandiBtn}
                    >
                      <ClipboardList size={14} color="#7c3aed" />
                      <Text style={styles.mandiBtnText}>Add Unmatched Items to Mandi Khareed List 📝</Text>
                    </Pressable>
                  </View>
                )}

                <Button
                  title={`Import ${parsedResult.matched_count} Items to Bill`}
                  variant="primary"
                  size="md"
                  disabled={parsedResult.matched_count === 0}
                  onPress={handleImport}
                  style={styles.importBtn}
                />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  card: { borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, maxHeight: "85%", padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 16, fontWeight: "800" },
  closeBtn: { padding: 4 },
  scroll: { gap: 10, paddingBottom: 30 },
  sub: { fontSize: 12, lineHeight: 16 },
  input: { height: 100, borderRadius: 12, borderWidth: 1, padding: 12, fontSize: 13, textAlignVertical: "top" },
  resultSection: { marginTop: 10, gap: 8 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryText: { fontSize: 13 },
  itemCard: { borderRadius: 10, padding: 10, gap: 4 },
  itemHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  itemName: { fontSize: 13, fontWeight: "700", flex: 1 },
  itemDetail: { fontSize: 11 },
  unmatchedBox: { backgroundColor: "rgba(217, 119, 6, 0.08)", borderRadius: 10, padding: 10, gap: 6 },
  unmatchedHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  unmatchedTitle: { fontSize: 12, fontWeight: "700", color: "#d97706" },
  unmatchedText: { fontSize: 11, color: "#b45309" },
  mandiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 4,
  },
  mandiBtnText: { color: "#7c3aed", fontSize: 12, fontWeight: "700" },
  importBtn: { marginTop: 6 },
});
