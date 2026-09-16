import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Linking, Alert, Platform } from "react-native";
import { POSSaleResponse } from "../types";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { Button } from "@/components/Button";
import { apiClient } from "@/api/client";
import { InAppPDFModal } from "@/components/InAppPDFModal";
import { formatThermalReceiptText } from "@/utils/thermalPrinter";
import { CheckCircle2, MessageCircle, FileText, Receipt, Printer } from "lucide-react-native";

interface POSReceiptModalProps {
  visible: boolean;
  sale: POSSaleResponse | any | null;
  customerPhone?: string;
  onClose: () => void;
}

export const POSReceiptModal: React.FC<POSReceiptModalProps> = ({
  visible,
  sale,
  customerPhone,
  onClose,
}) => {
  const { colors } = useThemeColor();
  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  if (!sale) return null;

  // Extract properties safely whether sale is nested (sale.bill) or flat
  const billNumber = (sale as any).bill_number || (sale as any).bill?.bill_number || "BIL-000";
  const totalAmount = (sale as any).total_amount ?? (sale as any).bill?.total_amount ?? 0;
  const rawPayment = (sale as any).payment_method || (sale as any).bill?.payment_method || "cash";
  const paymentMethod = String(rawPayment).toUpperCase();
  const receiptItems = ((sale as any)?.bill?.items || (sale as any)?.items || []).map((item: any) => ({
    name: item.product_name || item.name || "Item",
    qty: String(item.quantity || 1),
  }));

  const baseURL = apiClient.defaults.baseURL || "https://api.shopsilo.in";
  const pdfUrl = `${baseURL}/receipts/${billNumber}.pdf`;

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `🧾 *Tax Invoice from Store*\nBill No: ${billNumber}\nAmount Paid: ₹${totalAmount}\nPayment: ${paymentMethod}\n📄 View Digital Bill PDF: ${pdfUrl}\n\nThank you for shopping with us!`
    );
    const cleanPhone = (customerPhone || "").replace(/\D/g, "");
    const url = cleanPhone
      ? `https://wa.me/91${cleanPhone.slice(-10)}?text=${text}`
      : `https://wa.me/?text=${text}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleThermalPrint = () => {
    const rawItems = (sale as any)?.bill?.items || (sale as any)?.items || [];
    const printText = formatThermalReceiptText({
      shopName: "SHOPKEEPER STORE",
      billNumber,
      dateStr: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      customerPhone,
      paymentMethod,
      subtotal: totalAmount,
      discount: 0,
      grandTotal: totalAmount,
      items: rawItems.map((it: any) => ({
        name: it.product_name || it.name || "Item",
        qty: it.quantity || 1,
        rate: it.unit_price || 0,
        total: it.total_price || ((it.unit_price || 0) * (it.quantity || 1)) || 0,
      })),
    });

    if (Platform.OS === "web" && typeof window !== "undefined") {
      const win = window.open("", "_blank");
      if (win) {
        win.document.write(`<pre style="font-family:monospace;font-size:14px;padding:20px;">${printText}</pre>`);
        win.document.close();
        win.print();
      }
    } else {
      Alert.alert(
        "🖨️ ESC/POS Thermal Receipt Ready",
        `Formatted for 2-inch Counter Thermal Printer:\n\n${printText.slice(0, 220)}...\n\n[ESC/POS Command Ready]`,
        [{ text: "OK" }]
      );
    }
  };

  return (
    <>
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View style={styles.overlay}>
          <View style={[styles.container, { backgroundColor: colors.surface }]}>
            <View style={styles.iconCircle}>
              <CheckCircle2 size={44} color="#16a34a" />
            </View>

            <Text style={[styles.title, { color: colors.text }]}>Sale Recorded!</Text>
            <Text style={[styles.billNo, { color: colors.textMuted }]}>
              Bill #{billNumber}
            </Text>

            <View style={[styles.receiptCard, { backgroundColor: colors.surfaceBorder }]}>
              <View style={styles.receiptRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Total Amount</Text>
                <Text style={[styles.amount, { color: colors.text }]}>
                  {formatCurrency(totalAmount)}
                </Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Payment Method</Text>
                <Text style={[styles.val, { color: colors.text }]}>
                  {paymentMethod}
                </Text>
              </View>
            </View>

            <View style={styles.btnRow}>
              <Button
                title="Thermal Print Receipt 🖨️"
                variant="primary"
                leftIcon={<Printer size={18} color="#fff" />}
                onPress={handleThermalPrint}
                style={{ backgroundColor: "#10b981", width: "100%" }}
              />
              <Button
                title="Download Tax Invoice PDF 📄"
                variant="outline"
                leftIcon={<FileText size={18} color={colors.primary} />}
                onPress={() => setPdfModalOpen(true)}
                style={styles.actionBtn}
              />
              <Button
                title="WhatsApp Bill & PDF Link"
                variant="outline"
                leftIcon={<MessageCircle size={18} color="#16a34a" />}
                onPress={handleWhatsAppShare}
                style={styles.actionBtn}
              />
              <Button
                title="Next Customer"
                variant="ghost"
                leftIcon={<Receipt size={18} color={colors.primary} />}
                onPress={onClose}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* In-App PDF Viewer & Local Downloader Modal */}
      <InAppPDFModal
        visible={pdfModalOpen}
        title={`Tax Invoice Bill #${billNumber}`}
        pdfUrl={pdfUrl}
        filename={`receipt-${billNumber}.pdf`}
        items={receiptItems}
        onClose={() => setPdfModalOpen(false)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 20 },
  container: { borderRadius: 20, padding: 22, alignItems: "center" },
  iconCircle: { width: 68, height: 68, borderRadius: 34, backgroundColor: "rgba(22,163,74,0.12)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  title: { fontSize: 20, fontWeight: "800" },
  billNo: { fontSize: 13, marginTop: 4, marginBottom: 16 },
  receiptCard: { width: "100%", borderRadius: 14, padding: 16, gap: 10, marginBottom: 20 },
  receiptRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { fontSize: 14, fontWeight: "500" },
  amount: { fontSize: 22, fontWeight: "800", color: "#16a34a" },
  val: { fontSize: 14, fontWeight: "700" },
  btnRow: { width: "100%", gap: 8 },
  actionBtn: { width: "100%" },
});
