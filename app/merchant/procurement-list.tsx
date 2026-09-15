/**
 * ============================================================================
 * 📌 WHAT: Mandi Khareed & Market Procurement Order Management Screen.
 * ⚙️ HOW: Combines AsyncStorage `localItems` with `useDemandWatchlist`.
 *         Uses `parseProcurementListWithAI` (pre-tokenized regex cleaner) for AI Smart
 *         Paste text detection. Generates in-app PDF and WhatsApp wholesale orders.
 * 🎯 WHY: Solves market purchasing for shopkeepers, ensuring zero missing items
 *         and accurate quantities during mandi visits.
 * 🔄 ALTERNATIVE: Shopkeepers used paper notebooks that were easily lost or unreadable.
 * 📍 WHERE: `app/merchant/procurement-list.tsx` • Merchant Side Drawer & Dashboard.
 * ============================================================================
 */
import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  Alert,
  Linking,
  Modal,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useDemandWatchlist } from "@/features/merchant/api/useInventory";
import { parseProcurementListWithAI, CleanedProcurementItem } from "@/features/merchant/services/aiParchiMatcher";
import { InAppPDFModal } from "@/components/InAppPDFModal";
import { createProcurementPdfBase64 } from "@/utils/procurementPdf";
import {
  ClipboardList,
  Plus,
  MessageCircle,
  PackagePlus,
  Trash2,
  X,
  Sparkles,
  FileText,
  Store,
} from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const LOCAL_STORAGE_KEY = "shopsilo_local_procurement_items";

export interface CustomProcurementItem {
  id: string;
  name: string;
  qty: string;
  notes?: string;
  demandCount?: number;
  addedAt: string;
}

function ProcurementListContent() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();

  const [localItems, setLocalItems] = useState<CustomProcurementItem[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemQty, setNewItemQty] = useState("");
  const [newItemNotes, setNewItemNotes] = useState("");

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiRawInput, setAiRawInput] = useState("");
  const [isParsingAi, setIsParsingAi] = useState(false);
  const [previewItems, setPreviewItems] = useState<CleanedProcurementItem[]>([]);

  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  const { data: watchlistData, isLoading: isWatchlistLoading } = useDemandWatchlist();

  // Load saved procurement list from AsyncStorage
  useEffect(() => {
    const loadSavedList = async () => {
      try {
        const raw = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) setLocalItems(parsed);
        }
      } catch (err) {
        console.warn("[Procurement] Failed to load local list:", err);
      }
    };
    loadSavedList();
  }, []);

  const saveLocalItems = async (items: CustomProcurementItem[]) => {
    setLocalItems(items);
    try {
      await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn("[Procurement] Failed to save local list:", err);
    }
  };

  const handleAddManualItem = () => {
    if (!newItemName.trim()) {
      return Alert.alert("Required", "Please enter product name.");
    }

    const item: CustomProcurementItem = {
      id: `proc_${Date.now()}`,
      name: newItemName.trim(),
      qty: newItemQty.trim() || "1",
      notes: newItemNotes.trim() || undefined,
      addedAt: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    };

    const updated = [item, ...localItems];
    saveLocalItems(updated);

    setNewItemName("");
    setNewItemQty("");
    setNewItemNotes("");
  };

  // AI Smart Paste Parser
  const handleParseAiText = async () => {
    if (!aiRawInput.trim()) {
      return Alert.alert("Empty Input", "Please paste or type your raw market list notes.");
    }

    setIsParsingAi(true);
    try {
      const cleaned = await parseProcurementListWithAI(aiRawInput);
      setPreviewItems(cleaned);
    } catch (err: any) {
      Alert.alert("Parsing Notice", err?.message || "Could not parse text. Using raw format.");
    } finally {
      setIsParsingAi(false);
    }
  };

  const handleUpdatePreview = (index: number, field: keyof CleanedProcurementItem, val: string) => {
    const updated = [...previewItems];
    updated[index] = { ...updated[index], [field]: val };
    setPreviewItems(updated);
  };

  const handleRemovePreview = (index: number) => {
    const updated = previewItems.filter((_, idx) => idx !== index);
    setPreviewItems(updated);
  };

  const handleSaveAllPreview = () => {
    const validItems = previewItems.filter((i) => i.name.trim().length > 0);
    if (validItems.length === 0) {
      return Alert.alert("No Valid Items", "No items to save.");
    }

    const newProcurementItems: CustomProcurementItem[] = validItems.map((item, idx) => ({
      id: `proc_ai_${Date.now()}_${idx}`,
      name: item.name.trim(),
      qty: item.qty.trim() || "1",
      notes: item.notes?.trim() || undefined,
      demandCount: 1,
      addedAt: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    }));

    const updated = [...newProcurementItems, ...localItems];
    saveLocalItems(updated);

    setAiRawInput("");
    setPreviewItems([]);
    setIsAiModalOpen(false);

    Alert.alert("Saved to Mandi List ✨", `${validItems.length} cleaned items saved to your procurement list!`);
  };

  const handleRemoveLocalItem = (id: string) => {
    const updated = localItems.filter((i) => i.id !== id);
    saveLocalItems(updated);
  };

  // 1-Click WhatsApp Order formatting
  const handleWhatsAppWholesaleOrder = () => {
    const apiItems = watchlistData?.items || [];
    if (apiItems.length === 0 && localItems.length === 0) {
      return Alert.alert("Empty List", "Your Mandi Procurement List is empty.");
    }

    let text = `📦 *Mandi Khareed & Wholesale Order Sheet*\n`;
    text += `Dukaan Procurement List — ${new Date().toLocaleDateString("en-IN")}\n\n`;

    if (localItems.length > 0) {
      text += `*ITEMS TO PURCHASE FROM MARKET:*\n`;
      localItems.forEach((item, idx) => {
        text += `${idx + 1}. ${item.name} — Qty: ${item.qty}${item.notes ? ` (${item.notes})` : ""}\n`;
      });
      text += `\n`;
    }

    if (apiItems.length > 0) {
      text += `*CUSTOMER DEMAND OUT-OF-STOCK ITEMS:*\n`;
      apiItems.forEach((item, idx) => {
        text += `${idx + 1}. ${item.product_name} (${item.unmet_demand_count} customers requested)\n`;
      });
      text += `\n`;
    }

    text += `Please confirm stock availability and wholesale rates. Thank you!`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("Notice", "Unable to open WhatsApp automatically.");
    });
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [generatedBase64Pdf, setGeneratedBase64Pdf] = useState<string | undefined>(undefined);

  const apiWatchlistItems = watchlistData?.items || [];

  const displayPdfItems = [
    ...localItems.map((i) => ({ name: i.name, qty: i.qty, notes: i.notes || "Market Reorder" })),
    ...apiWatchlistItems.map((i) => ({ name: i.product_name, qty: `${i.unmet_demand_count || (i as any).waiting_customers_count || 1} Customer Demand`, notes: "Out of stock demand" })),
  ];

  const handleDownloadMandiPDF = async () => {
    try {
      setIsGeneratingPdf(true);
      const b64 = await createProcurementPdfBase64(
        "Mandi Khareed & Wholesale Procurement Order Sheet",
        displayPdfItems
      );
      setGeneratedBase64Pdf(b64);
      setPdfModalOpen(true);
    } catch (err) {
      console.warn("[MandiPdf] Error generating client PDF:", err);
      setPdfModalOpen(true);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container}>
      {/* Header Banner */}
      <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(124, 58, 237, 0.15)" }]}>
            <ClipboardList size={22} color="#7c3aed" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>Mandi Khareed List 📝</Text>
            <Text style={[styles.headerSub, { color: colors.textMuted }]}>
              Plan bazaar purchasing &amp; customer demand reorders
            </Text>
          </View>
        </View>

        <View style={styles.topActions}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setIsAiModalOpen(true)}
            style={styles.aiPasteBtn}
          >
            <Sparkles size={14} color="#ffffff" />
            <Text style={styles.aiPasteText}>AI Smart Paste ✨</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleDownloadMandiPDF}
            style={styles.pdfBtn}
          >
            <FileText size={14} color="#0284c7" />
            <Text style={styles.pdfBtnText}>Download PDF 📄</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Manual Add Row */}
        <View style={[styles.addBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.boxTitle, { color: colors.text }]}>+ Add Item to Khareed List</Text>
          <View style={styles.addFormRow}>
            <TextInput
              style={[styles.input, styles.inputFlex, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Item Name (e.g. Aashirvaad Atta)"
              placeholderTextColor={colors.textMuted}
              value={newItemName}
              onChangeText={setNewItemName}
            />
            <TextInput
              style={[styles.input, styles.inputQty, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Qty (e.g. 5 kg)"
              placeholderTextColor={colors.textMuted}
              value={newItemQty}
              onChangeText={setNewItemQty}
            />
          </View>

          <View style={styles.addFormRow}>
            <TextInput
              style={[styles.input, styles.inputFlex, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="Notes (e.g. Fortune brand / Pouch pack)"
              placeholderTextColor={colors.textMuted}
              value={newItemNotes}
              onChangeText={setNewItemNotes}
            />
            <Button
              title="Add"
              size="sm"
              variant="primary"
              onPress={handleAddManualItem}
              leftIcon={<Plus size={14} color="#ffffff" />}
              style={styles.addSubmitBtn}
            />
          </View>
        </View>

        {/* 1-Click WhatsApp Wholesale Reorder Button */}
        <Pressable
          accessibilityRole="button"
          onPress={handleWhatsAppWholesaleOrder}
          style={styles.whatsappOrderBanner}
        >
          <MessageCircle size={20} color="#ffffff" />
          <View style={{ flex: 1 }}>
            <Text style={styles.waTitle}>Send Order Sheet to Wholesale Dealer</Text>
            <Text style={styles.waSub}>
              Share complete list of {localItems.length + apiWatchlistItems.length} items directly on WhatsApp
            </Text>
          </View>
        </Pressable>

        {/* Local Khareed Items Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Custom Procurement Items ({localItems.length})
          </Text>
          {localItems.length > 0 && (
            <Pressable onPress={() => saveLocalItems([])}>
              <Text style={styles.clearText}>Clear List</Text>
            </Pressable>
          )}
        </View>

        {localItems.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <ClipboardList size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Khareed List Empty</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Tap "AI Smart Paste ✨" to paste messy notes or add items above manually.
            </Text>
          </View>
        ) : (
          localItems.map((item) => (
            <View
              key={item.id}
              style={[styles.itemCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.itemName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[styles.itemMeta, { color: colors.primary }]}>
                  Quantity Needed: <Text style={{ fontWeight: "800" }}>{item.qty}</Text>
                </Text>
                {item.notes && (
                  <Text style={[styles.itemNotes, { color: colors.textMuted }]}>
                    Note: {item.notes}
                  </Text>
                )}
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => handleRemoveLocalItem(item.id)}
                style={styles.deleteBtn}
              >
                <Trash2 size={16} color="#ef4444" />
              </Pressable>
            </View>
          ))
        )}

        {/* Customer Demand Watchlist Section (Auto-aggregated from Store Pre-orders) */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Customer Demand Watchlist ({apiWatchlistItems.length})
          </Text>
        </View>

        {isWatchlistLoading ? (
          <LoadingState message="Checking customer pre-orders..." />
        ) : apiWatchlistItems.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Store size={32} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Unmet Customer Demand</Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              When shoppers request out-of-stock items, they will automatically appear here for wholesale restocking.
            </Text>
          </View>
        ) : (
          apiWatchlistItems.map((item, idx) => (
            <View
              key={item.product_id || idx}
              style={[styles.demandCard, { backgroundColor: isDark ? "rgba(124, 58, 237, 0.12)" : "#f5f3ff", borderColor: "#c4b5fd" }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.demandName, { color: colors.text }]}>{item.product_name}</Text>
                <Text style={styles.demandBadge}>
                  🔥 {item.unmet_demand_count} customers requested this out-of-stock item
                </Text>
              </View>

              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  const newItem: CustomProcurementItem = {
                    id: `proc_demand_${Date.now()}_${idx}`,
                    name: item.product_name,
                    qty: "+10 units",
                    notes: `Restock for ${item.unmet_demand_count} waiting customers`,
                    addedAt: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
                  };
                  saveLocalItems([newItem, ...localItems]);
                  Alert.alert("Added", `"${item.product_name}" added to custom khareed list.`);
                }}
                style={styles.addDemandBtn}
              >
                <PackagePlus size={14} color="#7c3aed" />
                <Text style={styles.addDemandText}>+ Add</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>

      {/* AI Smart Paste Text Parser Modal */}
      <Modal visible={isAiModalOpen} transparent animationType="slide" onRequestClose={() => setIsAiModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={styles.modalHeader}>
              <View style={styles.sparkleTitleRow}>
                <Sparkles size={20} color="#7c3aed" />
                <Text style={[styles.modalTitle, { color: colors.text }]}>AI Smart Paste ✨</Text>
              </View>
              <Pressable onPress={() => setIsAiModalOpen(false)}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Paste messy WhatsApp, SMS or notebook list. AI will clean spellings &amp; separate items automatically!
            </Text>

            <TextInput
              style={[styles.aiInput, { backgroundColor: colors.background, borderColor: colors.surfaceBorder, color: colors.text }]}
              placeholder="e.g. 2kgaasirvad ata 1litr fortun tel 500gdetol sabun 5packet magi..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
              value={aiRawInput}
              onChangeText={setAiRawInput}
            />

            <Button
              title={isParsingAi ? "AI Cleaning Text & Spellings..." : "Parse & Clean List with AI ✨"}
              variant="primary"
              size="md"
              isLoading={isParsingAi}
              disabled={isParsingAi}
              onPress={handleParseAiText}
              style={{ backgroundColor: "#7c3aed", marginTop: 8 }}
            />

            {/* Preview of Cleaned Items */}
            <ScrollView style={{ maxHeight: 220, marginTop: 10 }}>
              {previewItems.length > 0 && (
                <View style={{ gap: 8 }}>
                  <Text style={[styles.previewHeading, { color: colors.text }]}>
                    Cleaned Preview ({previewItems.length} items):
                  </Text>

                  {previewItems.map((item, idx) => (
                    <View key={idx} style={[styles.previewRow, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                      <TextInput
                        style={[styles.prevInput, { flex: 2, color: colors.text }]}
                        value={item.name}
                        onChangeText={(t) => handleUpdatePreview(idx, "name", t)}
                        placeholder="Item Title"
                        placeholderTextColor={colors.textMuted}
                      />
                      <TextInput
                        style={[styles.prevInput, { flex: 1, color: colors.primary, fontWeight: "700" }]}
                        value={item.qty}
                        onChangeText={(t) => handleUpdatePreview(idx, "qty", t)}
                        placeholder="Qty"
                        placeholderTextColor={colors.textMuted}
                      />
                      <Pressable onPress={() => handleRemovePreview(idx)} style={{ padding: 4 }}>
                        <Trash2 size={16} color="#ef4444" />
                      </Pressable>
                    </View>
                  ))}

                  <Button
                    title={`Save ${previewItems.length} Cleaned Items to Mandi List 📝`}
                    variant="primary"
                    size="md"
                    onPress={handleSaveAllPreview}
                    style={{ marginTop: 8 }}
                  />
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* In-App PDF Viewer & Local Downloader Modal */}
      <InAppPDFModal
        visible={pdfModalOpen}
        title="Mandi Khareed & Wholesale Reorder Sheet"
        pdfUrl=""
        pdfBase64={generatedBase64Pdf}
        filename={`mandi-procurement-sheet-${new Date().toISOString().slice(0, 10)}.pdf`}
        items={displayPdfItems}
        onClose={() => setPdfModalOpen(false)}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingVertical: 12, paddingBottom: 40, gap: 10 },
  headerCard: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 12 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontWeight: "800" },
  headerSub: { fontSize: 11, marginTop: 1 },
  topActions: { flexDirection: "row", gap: 8 },
  aiPasteBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "#7c3aed", paddingVertical: 8, borderRadius: 10 },
  aiPasteText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  pdfBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: "rgba(2, 132, 199, 0.12)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
  pdfBtnText: { color: "#0284c7", fontSize: 12, fontWeight: "800" },
  addBox: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 8 },
  boxTitle: { fontSize: 13, fontWeight: "800" },
  addFormRow: { flexDirection: "row", gap: 8 },
  input: { height: 40, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, fontSize: 12, fontWeight: "600" },
  inputFlex: { flex: 1 },
  inputQty: { width: 90 },
  addSubmitBtn: { backgroundColor: "#7c3aed", height: 40, paddingHorizontal: 16 },
  whatsappOrderBanner: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#16a34a", padding: 12, borderRadius: 14 },
  waTitle: { color: "#ffffff", fontSize: 13, fontWeight: "800" },
  waSub: { color: "rgba(255,255,255,0.85)", fontSize: 11, marginTop: 1 },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 },
  sectionTitle: { fontSize: 14, fontWeight: "800" },
  clearText: { color: "#ef4444", fontSize: 12, fontWeight: "700" },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: "center", gap: 6 },
  emptyTitle: { fontSize: 14, fontWeight: "800" },
  emptySub: { fontSize: 12, textAlign: "center", lineHeight: 16 },
  itemCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  itemName: { fontSize: 14, fontWeight: "800" },
  itemMeta: { fontSize: 12, marginTop: 2 },
  itemNotes: { fontSize: 11, marginTop: 2 },
  deleteBtn: { padding: 6 },
  demandCard: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  demandName: { fontSize: 14, fontWeight: "800" },
  demandBadge: { fontSize: 11, color: "#7c3aed", fontWeight: "700", marginTop: 2 },
  addDemandBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(124,58,237,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  addDemandText: { color: "#7c3aed", fontSize: 12, fontWeight: "800" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 380, borderRadius: 20, borderWidth: 1, padding: 16, gap: 10, maxHeight: "90%" },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sparkleTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  modalTitle: { fontSize: 16, fontWeight: "800" },
  modalSub: { fontSize: 12, lineHeight: 16 },
  aiInput: { height: 90, borderRadius: 12, borderWidth: 1, padding: 10, fontSize: 13, textAlignVertical: "top" },
  previewHeading: { fontSize: 13, fontWeight: "800", marginBottom: 4 },
  previewRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 8, borderRadius: 10, borderWidth: 1 },
  prevInput: { height: 36, paddingHorizontal: 8, fontSize: 12, borderRadius: 6, borderWidth: 1, borderColor: "rgba(0,0,0,0.1)" },
});

export default function ProcurementListScreen() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load Mandi Khareed List">
      <ProcurementListContent />
    </ErrorBoundary>
  );
}
