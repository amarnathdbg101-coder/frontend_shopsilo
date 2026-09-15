import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Platform,
} from "react-native";
import * as FileSystem from "expo-file-system";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Button } from "@/components/Button";
import {
  useBulkImportProducts,
  BulkImportItem,
  BulkImportResponse,
} from "../api/useAddProduct";
import { Config } from "@/constants/config";
import { Endpoints } from "@/api/endpoints";
import { useAuthStore } from "@/store/useAuthStore";
import {
  FileSpreadsheet,
  Download,
  Upload,
  CheckCircle2,
  X,
  FileCheck,
  PackagePlus,
  ClipboardList,
} from "lucide-react-native";

interface BulkImportModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  visible,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useThemeColor();

  const [activeTab, setActiveTab] = useState<"file" | "paste">("file");
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [pastedText, setPastedText] = useState("");
  const [parsedItems, setParsedItems] = useState<BulkImportItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResponse | null>(null);

  const bulkImportMutation = useBulkImportProducts();

  if (!visible) return null;

  // 1. Download Sample CSV Import Template
  const handleDownloadTemplate = async () => {
    try {
      const templateURL = `${Config.API_BASE_URL}${Endpoints.PRODUCTS.IMPORT_TEMPLATE}`;

      if (typeof window !== "undefined" && window.document) {
        window.open(templateURL, "_blank");
        return;
      }

      await Linking.openURL(templateURL);
    } catch {
      Alert.alert("Notice", "Unable to download CSV template.");
    }
  };

  // 2. Parse CSV String Content
  const parseCSVContent = (content: string, fileName?: string) => {
    const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
      Alert.alert("Empty CSV Data", "The CSV data has no product rows.");
      return;
    }

    // Determine if line 0 is a header row or direct data
    const firstLineLower = lines[0].toLowerCase();
    const hasHeaderKeywords =
      firstLineLower.includes("name") ||
      firstLineLower.includes("price") ||
      firstLineLower.includes("mrp") ||
      firstLineLower.includes("sku") ||
      firstLineLower.includes("rate") ||
      firstLineLower.includes("stock") ||
      firstLineLower.includes("title");

    let startIndex = 0;
    let nameIdx = 0;
    let skuIdx = -1;
    let priceIdx = 1;
    let costIdx = -1;
    let stockIdx = 2;
    let minIdx = -1;
    let descIdx = -1;

    if (hasHeaderKeywords) {
      startIndex = 1; // Skip header row
      const header = lines[0].split(",").map((h) => h.trim().toLowerCase());

      nameIdx = header.findIndex((h) => h.includes("name") || h.includes("item") || h.includes("title"));
      skuIdx = header.findIndex((h) => h.includes("sku") || h.includes("code") || h.includes("barcode"));
      priceIdx = header.findIndex((h) => h.includes("price") || h.includes("mrp") || h.includes("rate"));
      costIdx = header.findIndex((h) => h.includes("cost") || h.includes("buy") || h.includes("wholesale"));
      stockIdx = header.findIndex((h) => h.includes("stock") || h.includes("qty") || h.includes("quantity"));
      minIdx = header.findIndex((h) => h.includes("min") || h.includes("threshold"));
      descIdx = header.findIndex((h) => h.includes("desc") || h.includes("details"));

      if (nameIdx === -1) nameIdx = 0;
      if (priceIdx === -1) priceIdx = 1;
    }

    const items: BulkImportItem[] = [];

    for (let i = startIndex; i < lines.length; i++) {
      const row = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
      if (row.length === 0) continue;

      const name = nameIdx < row.length ? row[nameIdx] : "";
      if (!name) continue;

      const priceStr = priceIdx < row.length ? row[priceIdx] : "0";
      const price = parseFloat(priceStr.replace(/[^0-9.]/g, ""));

      const sku = skuIdx !== -1 && skuIdx < row.length ? row[skuIdx] : undefined;
      const costStr = costIdx !== -1 && costIdx < row.length ? row[costIdx] : "";
      const costPrice = costStr ? parseFloat(costStr.replace(/[^0-9.]/g, "")) : undefined;

      const stockStr = stockIdx !== -1 && stockIdx < row.length ? row[stockIdx] : "10";
      const stockQty = parseInt(stockStr.replace(/[^0-9]/g, ""), 10);

      const minStr = minIdx !== -1 && minIdx < row.length ? row[minIdx] : "5";
      const minStock = parseInt(minStr.replace(/[^0-9]/g, ""), 10);

      const desc = descIdx !== -1 && descIdx < row.length ? row[descIdx] : undefined;

      items.push({
        name,
        sku,
        price: isNaN(price) || price <= 0 ? 10 : price,
        cost_price: isNaN(costPrice as number) ? undefined : costPrice,
        stock_quantity: isNaN(stockQty) ? 10 : stockQty,
        min_stock: isNaN(minStock) ? 5 : minStock,
        description: desc,
      });
    }

    if (items.length === 0) {
      return Alert.alert("No Valid Products", "Could not parse any product rows. Please check CSV format.");
    }

    if (fileName) setSelectedFileName(fileName);
    setParsedItems(items);
    Alert.alert("CSV Parsed 📄", `Found ${items.length} products ready for import!`);
  };

  // 3. Pick & Parse CSV File Safely
  const handlePickCSVFile = async () => {
    try {
      setImportResult(null);
      let documentPickerModule: any = null;

      try {
        documentPickerModule = require("expo-document-picker");
      } catch {
        console.warn("[BulkImport] expo-document-picker not installed, switching to paste mode");
        setActiveTab("paste");
        return Alert.alert(
          "Use Copy-Paste Mode",
          "File picker native module is unavailable in this environment. You can copy & paste your CSV rows directly into the text box below!"
        );
      }

      const res = await documentPickerModule.getDocumentAsync({
        type: ["text/csv", "text/comma-separated-values", "application/csv", "*/*"],
        copyToCacheDirectory: true,
      });

      if (res.canceled || !res.assets?.[0]?.uri) return;

      const file = res.assets[0];
      setIsParsing(true);

      const fileContent = await FileSystem.readAsStringAsync(file.uri);
      parseCSVContent(fileContent, file.name);
    } catch (err: any) {
      console.warn("[BulkImport] File pick error:", err);
      Alert.alert("CSV File Error", "Unable to open file. Try using the 'Paste CSV Text' tab!");
    } finally {
      setIsParsing(false);
    }
  };

  const handleParsePastedText = () => {
    if (!pastedText.trim() || pastedText.trim().length < 5) {
      return Alert.alert("Required", "Please paste CSV text or rows into the box first.");
    }
    parseCSVContent(pastedText.trim(), "Pasted_CSV_Data.csv");
  };

  // 4. Commit Batch Import to Database
  const handleStartImport = () => {
    if (parsedItems.length === 0) {
      return Alert.alert("No Products", "Please pick a valid CSV file or paste CSV text first.");
    }

    bulkImportMutation.mutate(parsedItems, {
      onSuccess: (result) => {
        setImportResult(result);
        onSuccess?.();
      },
      onError: (err: any) => {
        Alert.alert("Import Failed", err?.message || "Could not bulk import products.");
      },
    });
  };

  const handleCloseAndRefresh = () => {
    setParsedItems([]);
    setImportResult(null);
    setSelectedFileName(null);
    setPastedText("");
    onSuccess?.();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconCircle, { backgroundColor: "rgba(5, 150, 105, 0.12)" }]}>
                <FileSpreadsheet size={18} color="#059669" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: colors.text }]}>Excel / CSV Bulk Import 📂</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  Add 500+ products to store catalog in 10 seconds
                </Text>
              </View>
            </View>

            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Segmented Mode Switcher (Pick File vs Paste Text) */}
          <View style={[styles.tabRow, { backgroundColor: colors.background }]}>
            <Pressable
              onPress={() => setActiveTab("file")}
              style={[
                styles.tabBtn,
                activeTab === "file" && { backgroundColor: colors.surface, elevation: 2 },
              ]}
            >
              <Upload size={13} color={activeTab === "file" ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === "file" ? colors.text : colors.textMuted }]}>
                Pick CSV File
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setActiveTab("paste")}
              style={[
                styles.tabBtn,
                activeTab === "paste" && { backgroundColor: colors.surface, elevation: 2 },
              ]}
            >
              <ClipboardList size={13} color={activeTab === "paste" ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabText, { color: activeTab === "paste" ? colors.text : colors.textMuted }]}>
                Paste CSV Text 📋
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Step 1: Download Template Instruction Card */}
            <View style={[styles.instructionBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              <View style={styles.stepHeader}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>1</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Download Sample CSV Template</Text>
              </View>

              <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                Includes pre-formatted columns: Name, SKU, Price, Cost Price, Stock Quantity & Min Stock.
              </Text>

              <Button
                title="Download CSV Template 📄"
                variant="outline"
                size="sm"
                onPress={handleDownloadTemplate}
                leftIcon={<Download size={14} color={colors.primary} />}
                style={{ marginTop: 6 }}
              />
            </View>

            {/* Step 2: Pick File or Paste Text */}
            {activeTab === "file" ? (
              <View style={[styles.instructionBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepBadge, { backgroundColor: "#059669" }]}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Select Product CSV File</Text>
                </View>

                {selectedFileName ? (
                  <View style={styles.selectedFileRow}>
                    <FileCheck size={16} color="#059669" />
                    <Text numberOfLines={1} style={[styles.fileNameText, { color: colors.text }]}>
                      {selectedFileName} ({parsedItems.length} products)
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.stepSub, { color: colors.textMuted }]}>
                    Choose .csv file saved in phone storage.
                  </Text>
                )}

                <Button
                  title={isParsing ? "Reading CSV File..." : selectedFileName ? "Change File 📂" : "Pick CSV File from Phone 📂"}
                  variant="secondary"
                  size="sm"
                  isLoading={isParsing}
                  onPress={handlePickCSVFile}
                  leftIcon={<Upload size={14} color={colors.text} />}
                  style={{ marginTop: 6 }}
                />
              </View>
            ) : (
              <View style={[styles.instructionBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <View style={styles.stepHeader}>
                  <View style={[styles.stepBadge, { backgroundColor: "#059669" }]}>
                    <Text style={styles.stepNumber}>2</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Paste CSV Text Rows</Text>
                </View>

                <TextInput
                  style={[
                    styles.textArea,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.surfaceBorder,
                      color: colors.text,
                    },
                  ]}
                  multiline
                  numberOfLines={5}
                  placeholder={`Name,SKU,Price,StockQuantity\nAashirvaad Atta 5kg,ATT-5KG,245,50\nFortune Refined Oil 1L,OIL-1L,135,40`}
                  placeholderTextColor={colors.textMuted}
                  value={pastedText}
                  onChangeText={setPastedText}
                  textAlignVertical="top"
                />

                <Button
                  title="Parse CSV Text Data ⚡"
                  variant="secondary"
                  size="sm"
                  onPress={handleParsePastedText}
                  leftIcon={<ClipboardList size={14} color={colors.text} />}
                  style={{ marginTop: 6 }}
                />
              </View>
            )}

            {/* Parsed Preview Section */}
            {parsedItems.length > 0 && !importResult && (
              <View style={[styles.previewBox, { backgroundColor: "rgba(5, 150, 105, 0.08)", borderColor: "#059669" }]}>
                <View style={styles.previewHeader}>
                  <PackagePlus size={18} color="#059669" />
                  <Text style={styles.previewTitle}>{parsedItems.length} Products Ready for Import!</Text>
                </View>

                {/* Preview First 3 Items */}
                <View style={styles.sampleList}>
                  {parsedItems.slice(0, 3).map((item, idx) => (
                    <Text key={idx} numberOfLines={1} style={styles.sampleItemText}>
                      • {item.name} — ₹{item.price} ({item.stock_quantity} stock)
                    </Text>
                  ))}
                  {parsedItems.length > 3 && (
                    <Text style={styles.moreText}>+ {parsedItems.length - 3} more items...</Text>
                  )}
                </View>

                <Button
                  title={`Import All ${parsedItems.length} Products Now ✨`}
                  variant="primary"
                  size="md"
                  isLoading={bulkImportMutation.isPending}
                  disabled={bulkImportMutation.isPending}
                  onPress={handleStartImport}
                  leftIcon={<CheckCircle2 size={16} color="#fff" />}
                  style={{ backgroundColor: "#059669", marginTop: 8 }}
                />
              </View>
            )}

            {/* Import Results Box */}
            {importResult && (
              <View style={[styles.resultBox, { backgroundColor: "rgba(34, 197, 94, 0.12)", borderColor: "#22c55e" }]}>
                <View style={styles.resultHeader}>
                  <CheckCircle2 size={20} color="#16a34a" />
                  <Text style={styles.resultTitle}>
                    🎉 {importResult.imported_count} Products Imported Successfully!
                  </Text>
                </View>

                <Text style={styles.resultSub}>
                  Total Rows: {importResult.total_rows} • Imported: {importResult.imported_count} • Skipped: {importResult.skipped_count}
                </Text>

                {importResult.errors && importResult.errors.length > 0 && (
                  <View style={styles.errorList}>
                    <Text style={styles.errorHeader}>Skipped Rows Summary:</Text>
                    {importResult.errors.slice(0, 4).map((err, idx) => (
                      <Text key={idx} numberOfLines={1} style={styles.errorItem}>
                        • {err}
                      </Text>
                    ))}
                  </View>
                )}

                <Button
                  title="Done & Refresh Catalog ✨"
                  variant="primary"
                  size="sm"
                  onPress={handleCloseAndRefresh}
                  style={{ marginTop: 8 }}
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
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 18 },
  backdrop: { ...StyleSheet.absoluteFill },
  card: { width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10, maxHeight: "88%", zIndex: 10 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 15, fontWeight: "800" },
  subtitle: { fontSize: 11, marginTop: 1 },
  closeBtn: { padding: 4 },
  tabRow: { flexDirection: "row", borderRadius: 12, padding: 3, gap: 4 },
  tabBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 8, borderRadius: 10 },
  tabText: { fontSize: 12, fontWeight: "700" },
  scroll: { gap: 10, paddingVertical: 4 },
  instructionBox: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  stepHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  stepBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: "#4f46e5", alignItems: "center", justifyContent: "center" },
  stepNumber: { color: "#fff", fontSize: 11, fontWeight: "900" },
  stepTitle: { fontSize: 13, fontWeight: "800" },
  stepSub: { fontSize: 11, lineHeight: 15 },
  selectedFileRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 2 },
  fileNameText: { fontSize: 12, fontWeight: "700", flex: 1 },
  textArea: { minHeight: 90, borderRadius: 10, borderWidth: 1, padding: 10, fontSize: 12, fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace" },
  previewBox: { padding: 12, borderRadius: 14, borderWidth: 1, gap: 6 },
  previewHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  previewTitle: { fontSize: 13, fontWeight: "800", color: "#059669" },
  sampleList: { gap: 2, paddingVertical: 2 },
  sampleItemText: { fontSize: 11, color: "#047857", fontWeight: "600" },
  moreText: { fontSize: 10, fontStyle: "italic", color: "#047857" },
  resultBox: { padding: 14, borderRadius: 14, borderWidth: 1, gap: 6 },
  resultHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  resultTitle: { fontSize: 14, fontWeight: "800", color: "#15803d" },
  resultSub: { fontSize: 11, fontWeight: "600", color: "#166534" },
  errorList: { marginTop: 4, gap: 2 },
  errorHeader: { fontSize: 11, fontWeight: "700", color: "#b91c1c" },
  errorItem: { fontSize: 10, color: "#b91c1c" },
});
