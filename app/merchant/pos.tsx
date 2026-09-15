/**
 * ============================================================================
 * 📌 WHAT: Fast Counter Billing POS Screen.
 * ⚙️ HOW: Maintains local cart state. Triggers `useCreatePOSSale`. Supports 1-click
 *         WhatsApp digital receipts, ESC/POS Bluetooth thermal printing, Photo Search,
 *         Voice POS, WhatsApp Parchi OCR, and offline queuing fallback via `enqueueOfflineAction`.
 * 🎯 WHY: Enables 5-second counter billing for Indian kirana store owners with zero lost sales.
 * 🔄 ALTERNATIVE: Traditional desktop POS software required expensive computers & thermal
 *               printers, whereas Shopsilo runs 100% on the shopkeeper's phone.
 * 📍 WHERE: `app/merchant/pos.tsx` • Main POS Counter Route.
 * ============================================================================
 */
import React, { useState, useCallback } from "react";
import { StyleSheet, Text, View, ScrollView, Alert, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { useCreatePOSSale } from "@/features/merchant/api/usePOS";
import { POSSaleResponse, ParsedParchiItem } from "@/features/merchant/types";
import { Product } from "@/features/products/types";
import { POSProductPicker } from "@/features/merchant/components/POSProductPicker";
import { POSCartItem, CartItemData } from "@/features/merchant/components/POSCartItem";
import { POSPaymentSelector } from "@/features/merchant/components/POSPaymentSelector";
import { POSReceiptModal } from "@/features/merchant/components/POSReceiptModal";
import { POSParchiModal } from "@/features/merchant/components/POSParchiModal";
import { AIVoicePOSModal } from "@/features/merchant/components/AIVoicePOSModal";
import { VisualProductScannerModal } from "@/features/merchant/components/VisualProductScannerModal";
import { KhataCustomerQRScannerModal } from "@/features/merchant/components/KhataCustomerQRScannerModal";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import { apiClient } from "@/api/client";
import { VoiceBillItem } from "@/features/merchant/services/aiVoicePOS";
import { useMerchantProducts } from "@/features/merchant/api/usePOS";
import { POSCustomerInput } from "@/features/merchant/components/POSCustomerInput";
import { FileText, Mic, Camera, ReceiptText, Trash2, QrCode, BookOpen } from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { enqueueOfflineAction } from "@/utils/offlineSyncQueue";
import { Endpoints } from "@/api/endpoints";

function POSContent() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();
  const [items, setItems] = useState<CartItemData[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "upi" | "credit" | "split">("cash");
  const [splitCash, setSplitCash] = useState("");
  const [splitUPI, setSplitUPI] = useState("");
  const [completedSale, setCompletedSale] = useState<POSSaleResponse | null>(null);
  const [parchiVisible, setParchiVisible] = useState(false);
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [visualVisible, setVisualVisible] = useState(false);
  const [khataScannerVisible, setKhataScannerVisible] = useState(false);
  const [customerTrustInfo, setCustomerTrustInfo] = useState<{
    score: number;
    badge: string;
    credit_limit: number;
    current_balance: number;
  } | null>(null);

  const { data: inventory = [] } = useMerchantProducts();
  const saleMutation = useCreatePOSSale();

  const handleAddProduct = useCallback((p: Product) => {
    setItems((prev) => {
      const idx = prev.findIndex((i) => i.id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx].quantity += 1;
        return next;
      }
      return [...prev, { id: p.id, name: p.title, price: p.price, quantity: 1 }];
    });
  }, []);

  const handleImportParchi = useCallback((parsedItems: ParsedParchiItem[]) => {
    setItems((prev) => {
      const next = [...prev];
      for (const p of parsedItems) {
        const idx = next.findIndex((i) => i.id === p.product_id);
        if (idx >= 0) {
          next[idx].quantity += p.requested_quantity;
        } else {
          next.push({ id: p.product_id, name: p.product_name, price: p.unit_price, quantity: p.requested_quantity });
        }
      }
      return next;
    });
  }, []);

  const handleImportVoiceItems = useCallback((voiceItems: VoiceBillItem[]) => {
    setItems((prev) => {
      const next = [...prev];
      for (const v of voiceItems) {
        const idx = next.findIndex((i) => i.id === v.product_id);
        if (idx >= 0) {
          next[idx].quantity += v.quantity;
        } else {
          next.push({ id: v.product_id, name: v.product_name, price: v.unit_price, quantity: v.quantity });
        }
      }
      return next;
    });
  }, []);

  const handleUpdateQty = useCallback((id: string, delta: number) => {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: i.quantity + delta } : i)).filter((i) => i.quantity > 0)
    );
  }, []);

  const total = items.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleClearCart = () => {
    if (items.length === 0) return;
    Alert.alert("Clear current bill?", "All items will be removed from this bill.", [
      { text: "Keep bill", style: "cancel" },
      { text: "Clear", style: "destructive", onPress: () => setItems([]) },
    ]);
  };

  const handleKhataCustomerScanned = (scanned: { phone: string; name?: string }) => {
    setCustomerPhone(scanned.phone);
    if (scanned.name) setCustomerName(scanned.name);
    apiClient
      .get(Endpoints.MERCHANT.KHATA_TRUST_SCORE(scanned.phone))
      .then((res) => {
        if (res.data?.data) {
          setCustomerTrustInfo({
            score: res.data.data.trust_score,
            badge: res.data.data.trust_badge,
            credit_limit: res.data.data.credit_limit,
            current_balance: res.data.data.current_balance,
          });
        }
      })
      .catch(() => {});
  };

  const handleCheckout = useCallback(() => {
    if (items.length === 0) return Alert.alert("Empty Cart", "Add items to generate bill.");
    if (paymentMethod === "credit" && !customerPhone) return Alert.alert("Phone Required", "Enter mobile for Udhar.");

    saleMutation.mutate(
      {
        customer_phone: customerPhone || undefined,
        customer_name: customerName || undefined,
        items: items.map((i) => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
        payment_method: paymentMethod,
        split_cash_amount: paymentMethod === "split" ? Number(splitCash) || 0 : undefined,
        split_upi_amount: paymentMethod === "split" ? Number(splitUPI) || 0 : undefined,
      },
      {
        onSuccess: (data) => {
          const saleObj = (data as any)?.bill || data;
          setCompletedSale(saleObj);
          setItems([]);
        },
        onError: async (err: any) => {
          const isNetworkErr = err?.code === "ERR_NETWORK" || (err?.message || "").toLowerCase().includes("network") || (err?.message || "").toLowerCase().includes("connect");
          if (isNetworkErr) {
            const payload = {
              customer_phone: customerPhone || undefined,
              customer_name: customerName || undefined,
              items: items.map((i) => ({ product_id: i.id, quantity: i.quantity, unit_price: i.price })),
              payment_method: paymentMethod,
              split_cash_amount: paymentMethod === "split" ? Number(splitCash) || 0 : undefined,
              split_upi_amount: paymentMethod === "split" ? Number(splitUPI) || 0 : undefined,
            };
            await enqueueOfflineAction("POS_SALE", Endpoints.MERCHANT.POS_SALE, payload);
            setCompletedSale({
              bill_number: `OFFLINE-${Date.now().toString().slice(-6)}`,
              total_amount: total,
              payment_method: paymentMethod,
              created_at: new Date().toISOString(),
            } as any);
            setItems([]);
            Alert.alert("Offline Sale Saved 📶", "Internet disconnected. Sale saved locally and will auto-sync with database when back online!");
          } else {
            const errMsg = err?.response?.data?.message || err?.message || "Could not complete bill.";
            Alert.alert("Checkout Notice", errMsg);
          }
        },
      }
    );
  }, [items, paymentMethod, customerPhone, customerName, splitCash, splitUPI, saleMutation]);

  return (
    <ScreenWrapper style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.pageHeader}>
          <View>
            <Text style={[styles.eyebrow, { color: colors.primary }]}>COUNTER BILLING</Text>
            <Text style={[styles.pageTitle, { color: colors.text }]}>New sale</Text>
            <Text style={[styles.pageSubtitle, { color: colors.textMuted }]}>Scan, add items and charge in seconds.</Text>
          </View>
          <View style={[styles.billIcon, { backgroundColor: colors.primaryLight }]}>
            <ReceiptText size={20} color={colors.primary} />
          </View>
        </View>

        <POSProductPicker onSelectProduct={handleAddProduct} />

        {/* AI POS Action Bar: Photo Search, Voice-to-Bill & WhatsApp Parchi */}
        <View style={styles.aiActionBar}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setVisualVisible(true)}
            style={[styles.actionBtn, styles.visualBtn]}
          >
            <Camera size={15} color="#ffffff" />
            <Text style={styles.visualBtnText}>📸 Photo Search</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setVoiceVisible(true)}
            style={[styles.actionBtn, styles.voiceBtn]}
          >
            <Mic size={15} color="#ffffff" />
            <Text style={styles.voiceBtnText}>🎙️ Bolkar Bill</Text>
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => setParchiVisible(true)}
            style={[styles.actionBtn, styles.parchiBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <FileText size={15} color={colors.primary} />
            <Text style={[styles.parchiBtnText, { color: colors.primary }]}>Parchi</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text }]}>Customer details <Text style={[styles.optional, { color: colors.textMuted }]}>optional</Text></Text>
        <POSCustomerInput
          customerPhone={customerPhone}
          setCustomerPhone={setCustomerPhone}
          customerName={customerName}
          setCustomerName={setCustomerName}
        />

        <View style={styles.billSectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Current bill ({itemCount})</Text>
          {items.length > 0 && (
            <Pressable accessibilityRole="button" onPress={handleClearCart} style={styles.clearBillBtn}>
              <Trash2 size={13} color="#dc2626" />
              <Text style={styles.clearBillText}>Clear</Text>
            </Pressable>
          )}
        </View>
        {items.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <ReceiptText size={22} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Your bill is empty</Text>
            <Text style={[styles.empty, { color: colors.textMuted }]}>Search above or use Photo, Voice, or Parchi to add items.</Text>
          </View>
        ) : (
          items.map((it) => (
            <POSCartItem
              key={it.id}
              item={it}
              onIncrement={() => handleUpdateQty(it.id, 1)}
              onDecrement={() => handleUpdateQty(it.id, -1)}
              onRemove={() => handleUpdateQty(it.id, -it.quantity)}
            />
          ))
        )}

        {paymentMethod === "credit" && (
          <View
            style={[
              styles.khataCreditCard,
              {
                backgroundColor: isDark ? "#1e293b" : "#fef2f2",
                borderColor: "#fca5a5",
              },
            ]}
          >
            <View style={styles.khataCreditRow}>
              <View style={styles.khataCreditLeft}>
                <BookOpen size={16} color="#dc2626" />
                <Text style={[styles.khataCreditTitle, { color: colors.text }]}>
                  Khata / Udhar Billing
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => setKhataScannerVisible(true)}
                style={[
                  styles.khataScanBtn,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <QrCode size={14} color={colors.primary} />
                <Text style={[styles.khataScanBtnText, { color: colors.primary }]}>
                  Scan Customer QR
                </Text>
              </Pressable>
            </View>

            {customerTrustInfo ? (
              <View style={styles.trustInfoRow}>
                <TrustScoreBadge
                  score={customerTrustInfo.score}
                  badge={customerTrustInfo.badge}
                  size="sm"
                />
                <Text style={[styles.trustBalanceText, { color: colors.textMuted }]}>
                  Baki: ₹{customerTrustInfo.current_balance.toLocaleString("en-IN")}
                  {customerTrustInfo.credit_limit > 0
                    ? ` (Limit: ₹${customerTrustInfo.credit_limit.toLocaleString("en-IN")})`
                    : ""}
                </Text>
              </View>
            ) : (
              <Text style={[styles.khataHintText, { color: colors.textMuted }]}>
                Customer ka phone number bharein ya QR scan karein. Bill seedhe unke khate me jud jayega.
              </Text>
            )}
          </View>
        )}

        <POSPaymentSelector
          method={paymentMethod}
          onSelectMethod={setPaymentMethod}
          splitCash={splitCash}
          setSplitCash={setSplitCash}
          splitUPI={splitUPI}
          setSplitUPI={setSplitUPI}
        />

      </ScrollView>

      <View style={[styles.checkoutBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.totalBlock}>
          <Text style={[styles.totalLabel, { color: colors.textMuted }]}>TOTAL</Text>
          <Text style={[styles.totalValue, { color: colors.text }]}>{formatCurrency(total)}</Text>
          <Text style={[styles.paymentHint, { color: colors.textMuted }]}>
            {paymentMethod === "credit" ? "Udhar" : paymentMethod === "split" ? "Split payment" : paymentMethod.toUpperCase()}
          </Text>
        </View>
        <Button
          title={saleMutation.isPending ? "Processing..." : "Charge bill"}
          variant="primary"
          size="md"
          isLoading={saleMutation.isPending}
          disabled={saleMutation.isPending || items.length === 0}
          onPress={handleCheckout}
          style={styles.checkoutBtn}
        />
      </View>

      <POSReceiptModal
        visible={!!completedSale}
        sale={completedSale}
        customerPhone={customerPhone}
        onClose={() => { setCompletedSale(null); setCustomerPhone(""); setCustomerName(""); }}
      />

      <POSParchiModal
        visible={parchiVisible}
        onClose={() => setParchiVisible(false)}
        onImportItems={handleImportParchi}
      />

      <AIVoicePOSModal
        visible={voiceVisible}
        onClose={() => setVoiceVisible(false)}
        inventory={inventory}
        onAddItems={handleImportVoiceItems}
      />

      <KhataCustomerQRScannerModal
        visible={khataScannerVisible}
        onClose={() => setKhataScannerVisible(false)}
        onCustomerScanned={handleKhataCustomerScanned}
      />

      <VisualProductScannerModal
        visible={visualVisible}
        onClose={() => setVisualVisible(false)}
        inventory={inventory}
        onSelectProduct={handleAddProduct}
        onAddNewProductWithVisualCode={(data) => {
          setVisualVisible(false);
          Alert.alert(
            "Item Not In Catalog",
            `"${data.name}" is not in your store catalog yet. Redirecting to Add Product...`,
            [
              {
                text: "Add to Catalog",
                onPress: () =>
                  router.push({
                    pathname: "/merchant/add-product",
                  } as never),
              },
            ]
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16 },
  scroll: { paddingTop: 12, paddingBottom: 128 },
  pageHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
  eyebrow: { fontSize: 9, fontWeight: "900", letterSpacing: 1.1 },
  pageTitle: { fontSize: 24, fontWeight: "900", marginTop: 2 },
  pageSubtitle: { fontSize: 11, marginTop: 2 },
  billIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  aiActionBar: { flexDirection: "row", gap: 6, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  visualBtn: { backgroundColor: "#0284c7", borderColor: "#0284c7" },
  visualBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  voiceBtn: { backgroundColor: "#7c3aed", borderColor: "#7c3aed" },
  voiceBtnText: { color: "#ffffff", fontSize: 12, fontWeight: "800" },
  parchiBtn: {},
  parchiBtnText: { fontSize: 12, fontWeight: "700" },
  sectionTitle: { fontSize: 15, fontWeight: "800", marginBottom: 8 },
  optional: { fontSize: 11, fontWeight: "600" },
  billSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  clearBillBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: 6 },
  clearBillText: { color: "#dc2626", fontSize: 11, fontWeight: "800" },
  emptyCard: { alignItems: "center", borderWidth: 1, borderRadius: 14, padding: 22, marginBottom: 10 },
  emptyTitle: { fontSize: 13, fontWeight: "800", marginTop: 8 },
  empty: { textAlign: "center", paddingTop: 4, fontSize: 12, lineHeight: 17 },
  khataCreditCard: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 8,
  },
  khataCreditRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  khataCreditLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  khataCreditTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  khataScanBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  khataScanBtnText: {
    fontSize: 11,
    fontWeight: "700",
  },
  trustInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  trustBalanceText: {
    fontSize: 11,
    fontWeight: "600",
  },
  khataHintText: {
    fontSize: 11,
  },
  checkoutBar: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingTop: 10, paddingBottom: 8, marginBottom: Platform.OS === "ios" ? 76 : 72, shadowColor: "#0f172a", shadowOffset: { width: 0, height: -3 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 6, zIndex: 5 },
  totalBlock: { minWidth: 92 },
  totalLabel: { fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  totalValue: { fontSize: 20, fontWeight: "900", marginTop: 1 },
  paymentHint: { fontSize: 9, fontWeight: "700", marginTop: 1 },
  checkoutBtn: { flex: 1 },
});

export default function POSScreen() {
  return (
    <ErrorBoundary fallbackTitle="Unable to load POS Billing">
      <POSContent />
    </ErrorBoundary>
  );
}
