import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Pressable, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { useScanProduct } from "@/features/catalog/api/useScanProduct";
import { ScanProductResponse } from "@/features/catalog/types";
import { AppImage } from "@/components/AppImage";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, ScanBarcode, Sparkles, ArrowRight, AlertCircle } from "lucide-react-native";

interface ProductScannerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProductScannerModal: React.FC<ProductScannerModalProps> = ({ visible, onClose }) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { mutate: scanProduct, isPending } = useScanProduct();

  const [code, setCode] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState<ScanProductResponse | null>(null);

  const handleLookup = (searchCode?: string) => {
    const target = (searchCode || code).trim();
    if (!target) { setErrorMsg("Please enter a barcode or SKU code"); return; }
    setErrorMsg("");
    scanProduct(target, {
      onSuccess: (data) => setResult(data),
      onError: () => { setResult(null); setErrorMsg(`No active product matches code '${target}'.`); },
    });
  };

  const handleViewProduct = () => {
    if (!result) return;
    onClose();
    router.push(`/product/${result.product.id}`);
  };

  const handleClose = () => {
    setCode("");
    setErrorMsg("");
    setResult(null);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <ScanBarcode size={22} color={colors.primary} />
              <View style={styles.headerCol}>
                <Text style={[styles.title, { color: colors.text }]}>Scan & Check Price</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>Lookup store item by barcode or SKU</Text>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={8}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <View style={styles.inputRow}>
            <TextInput
              value={code}
              onChangeText={(t) => { setCode(t); setErrorMsg(""); }}
              placeholder="Enter SKU (e.g. E-EMC)"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            <Pressable
              disabled={isPending}
              onPress={() => handleLookup()}
              style={[styles.lookupBtn, { backgroundColor: colors.primary, opacity: isPending ? 0.7 : 1 }]}
            >
              <Text style={[styles.lookupBtnText, { color: colors.primaryForeground }]}>
                {isPending ? "..." : "Check"}
              </Text>
            </Pressable>
          </View>

          <View style={styles.chipRow}>
            <Text style={[styles.chipHint, { color: colors.textMuted }]}>Try sample:</Text>
            <Pressable onPress={() => { setCode("E-EMC"); handleLookup("E-EMC"); }} style={[styles.sampleChip, { borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.sampleChipText, { color: colors.primary }]}>E-EMC (Earrings)</Text>
            </Pressable>
          </View>

          {errorMsg ? (
            <View style={styles.errorBox}>
              <AlertCircle size={14} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {result && (
            <View style={[styles.resultBox, { borderColor: colors.surfaceBorder, backgroundColor: colors.background }]}>
              <AppImage source={result.product.images?.[0] || ""} width={60} height={60} borderRadius={10} />
              <View style={styles.resultInfo}>
                <Text numberOfLines={1} style={[styles.prodName, { color: colors.text }]}>{result.product.name}</Text>
                <Text style={[styles.prodPrice, { color: colors.primary }]}>{formatCurrency(result.product.price)}</Text>
                <View style={styles.rewardRow}>
                  <Sparkles size={11} color="#ea580c" />
                  <Text style={styles.rewardText}>+{result.points_reward} VIP Points on pickup</Text>
                </View>
              </View>
              <Pressable onPress={handleViewProduct} style={[styles.viewBtn, { backgroundColor: colors.primary }]}>
                <ArrowRight size={16} color={colors.primaryForeground} />
              </Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "center", padding: 20 },
  card: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 12 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  headerCol: { flex: 1 },
  title: { fontSize: 16, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 1 },
  inputRow: { flexDirection: "row", gap: 8 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 13, fontWeight: "700" },
  lookupBtn: { borderRadius: 10, paddingHorizontal: 16, justifyContent: "center", alignItems: "center" },
  lookupBtnText: { fontSize: 12, fontWeight: "800" },
  chipRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  chipHint: { fontSize: 11, fontWeight: "600" },
  sampleChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  sampleChipText: { fontSize: 11, fontWeight: "700" },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#fef2f2", padding: 10, borderRadius: 8 },
  errorText: { fontSize: 12, color: "#dc2626", flex: 1 },
  resultBox: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 12, borderWidth: 1, gap: 10 },
  resultInfo: { flex: 1 },
  prodName: { fontSize: 14, fontWeight: "700" },
  prodPrice: { fontSize: 16, fontWeight: "900", marginTop: 2 },
  rewardRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },
  rewardText: { fontSize: 10, fontWeight: "700", color: "#ea580c" },
  viewBtn: { width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" },
});
