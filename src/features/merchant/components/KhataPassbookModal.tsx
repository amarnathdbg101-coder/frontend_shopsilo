import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Linking,
  Alert,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { useAuthStore } from "@/store/useAuthStore";
import { InAppPDFModal } from "@/components/InAppPDFModal";
import { KhataCustomer, CustomerKhataHistoryResponse } from "../types";
import {
  X,
  MessageCircle,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  FileText,
} from "lucide-react-native";

interface KhataPassbookModalProps {
  visible: boolean;
  customer: KhataCustomer | null;
  shopName?: string;
  onClose: () => void;
  onOpenPayment: (customer: KhataCustomer) => void;
}

export const KhataPassbookModal: React.FC<KhataPassbookModalProps> = ({
  visible,
  customer,
  shopName = "Hamari Dukan",
  onClose,
  onOpenPayment,
}) => {
  const { colors } = useThemeColor();
  const [history, setHistory] = useState<CustomerKhataHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!visible || !customer?.customer_mobile) {
      setHistory(null);
      return;
    }

    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(
          Endpoints.MERCHANT.KHATA_STATEMENT(customer.customer_mobile)
        );
        setHistory(res.data?.data || res.data || null);
      } catch (err) {
        console.error("Failed to fetch khata history:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, [visible, customer?.customer_mobile]);

  const [pdfModalOpen, setPdfModalOpen] = useState(false);

  if (!customer) return null;

  const token = useAuthStore.getState().accessToken;
  const baseURL = apiClient.defaults.baseURL || "https://api.shopsilo.in";
  const passbookPdfUrl = `${baseURL}/shops/me/khata/${customer.customer_mobile}/statement.pdf${token ? `?token=${token}` : ""}`;

  const handleWhatsAppReminder = () => {
    const text = encodeURIComponent(
      `Namaste ${customer.customer_name} ji! Aapka ${shopName} par kul ₹${customer.current_balance} ka baki udhar hai.\n📄 View Statement PDF: ${passbookPdfUrl}\nKripya samay par iska bhugtan karein. Dhanyawad!`
    );
    const clean = customer.customer_mobile.replace(/\D/g, "");
    Linking.openURL(`https://wa.me/91${clean.slice(-10)}?text=${text}`).catch(() => {});
  };

  const handleDownloadPassbookPDF = () => {
    setPdfModalOpen(true);
  };

  const transactions = history?.transactions || [];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.customerName, { color: colors.text }]}>
                {customer.customer_name}
              </Text>
              <Text style={[styles.customerPhone, { color: colors.textMuted }]}>
                +91 {customer.customer_mobile}
              </Text>
            </View>
            <Pressable accessibilityRole="button" onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Balance card */}
          <View style={[styles.balanceCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.balanceLabel, { color: colors.textMuted }]}>TOTAL OUTSTANDING (BAKI UDHAR)</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(customer.current_balance)}</Text>
          </View>

          {/* Action Row */}
          <View style={styles.actionRow}>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                onClose();
                onOpenPayment(customer);
              }}
              style={styles.jamaBtn}
            >
              <ArrowDownLeft size={16} color="#fff" />
              <Text style={styles.btnText}>Paise Jama</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleDownloadPassbookPDF}
              style={styles.pdfBtn}
            >
              <FileText size={16} color="#fff" />
              <Text style={styles.btnText}>PDF Statement</Text>
            </Pressable>

            <Pressable
              accessibilityRole="button"
              onPress={handleWhatsAppReminder}
              style={styles.whatsappBtn}
            >
              <MessageCircle size={16} color="#fff" />
              <Text style={styles.btnText}>WhatsApp</Text>
            </Pressable>
          </View>

          {/* Passbook History Title */}
          <View style={styles.sectionHeader}>
            <BookOpen size={15} color={colors.primary} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              LEN-DEN PASSBOOK TIMELINE
            </Text>
          </View>

          {/* Transactions List */}
          <ScrollView
            contentContainerStyle={styles.txList}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <View style={styles.loadingWrap}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.textMuted }]}>
                  Loading passbook ledger...
                </Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  No past transactions recorded yet for this customer.
                </Text>
              </View>
            ) : (
              transactions.map((tx) => {
                const isCredit = tx.transaction_type === "credit";
                const dateStr = tx.created_at ? new Date(tx.created_at).toLocaleDateString("en-IN") : "";
                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txItem,
                      { borderBottomColor: colors.surfaceBorder },
                    ]}
                  >
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconBubble,
                          {
                            backgroundColor: isCredit
                              ? "rgba(239, 68, 68, 0.12)"
                              : "rgba(16, 185, 129, 0.12)",
                          },
                        ]}
                      >
                        {isCredit ? (
                          <ArrowUpRight size={16} color="#ef4444" />
                        ) : (
                          <ArrowDownLeft size={16} color="#10b981" />
                        )}
                      </View>
                      <View>
                        <Text style={[styles.txTitle, { color: colors.text }]}>
                          {isCredit ? "Udhar Diya" : "Jama Hua (Payment)"}
                        </Text>
                        <Text style={[styles.txSub, { color: colors.textMuted }]}>
                          {tx.notes || (isCredit ? "POS Credit" : `Mode: ${tx.payment_mode || "Cash"}`)}
                          {dateStr ? ` • ${dateStr}` : ""}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[
                        styles.txAmount,
                        { color: isCredit ? "#dc2626" : "#16a34a" },
                      ]}
                    >
                      {isCredit ? "+" : "-"}₹{tx.amount?.toLocaleString("en-IN")}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Close button */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.closeFooterBtn, { backgroundColor: colors.background }]}>
              <Text style={[styles.closeFooterText, { color: colors.text }]}>Band Karein</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* In-App PDF Viewer & Local Downloader Modal */}
      <InAppPDFModal
        visible={pdfModalOpen}
        title={`${customer.customer_name} — Khata Passbook Statement`}
        pdfUrl={passbookPdfUrl}
        filename={`khata_statement_${customer.customer_mobile}.pdf`}
        items={transactions.map((transaction) => ({
          name: transaction.transaction_type === "credit" ? "Udhar Diya" : "Payment Received",
          qty: `${formatCurrency(transaction.amount)}${transaction.created_at ? ` • ${new Date(transaction.created_at).toLocaleDateString("en-IN")}` : ""}`,
        }))}
        onClose={() => setPdfModalOpen(false)}
      />
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
    maxHeight: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  customerName: { fontSize: 18, fontWeight: "800" },
  customerPhone: { fontSize: 12, marginTop: 2 },
  closeBtn: { padding: 6 },
  balanceCard: {
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
  },
  balanceLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  balanceAmount: { fontSize: 26, fontWeight: "900", color: "#dc2626", marginTop: 2 },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  jamaBtn: {
    flex: 1,
    backgroundColor: "#10b981",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  pdfBtn: {
    flex: 1,
    backgroundColor: "#0284c7",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  whatsappBtn: {
    flex: 1,
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  btnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 18,
    marginTop: 6,
    marginBottom: 8,
  },
  sectionTitle: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  txList: { paddingHorizontal: 16, paddingBottom: 16 },
  loadingWrap: { paddingVertical: 30, alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12 },
  emptyWrap: { paddingVertical: 30, alignItems: "center" },
  emptyText: { fontSize: 13, textAlign: "center" },
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  txIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: { fontSize: 14, fontWeight: "700" },
  txSub: { fontSize: 12, marginTop: 2 },
  txAmount: { fontSize: 15, fontWeight: "900" },
  footer: { padding: 14, borderTopWidth: 1 },
  closeFooterBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  closeFooterText: { fontSize: 14, fontWeight: "600" },
});
