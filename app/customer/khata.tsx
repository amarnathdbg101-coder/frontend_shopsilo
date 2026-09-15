import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { InAppPDFModal } from "@/components/InAppPDFModal";
import { useAuthStore } from "@/store/useAuthStore";
import { CustomerKhataQRModal } from "@/features/khata/components/CustomerKhataQRModal";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import { ParchiViewerModal } from "@/features/khata/components/ParchiViewerModal";
import { PromiseToPayModal } from "@/features/khata/components/PromiseToPayModal";
import { formatCurrency } from "@/utils/format";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Endpoints } from "@/api/endpoints";
import {
  useCustomerKhataSummary,
  useCustomerKhataPassbook,
  useDisputeKhataTransaction,
  useSubmitKhataUPIPayment,
  useSetCustomerPromiseToPay,
} from "@/features/khata/api/useCustomerKhata";
import {
  CustomerShopKhataItem,
  KhataTransactionItem,
} from "@/features/khata/types";
import {
  BookOpen,
  ArrowLeft,
  Store,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  CreditCard,
  Search,
  X,
  ShieldCheck,
  Receipt,
  HelpCircle,
  QrCode,
  RotateCcw,
  Paperclip,
  Calendar,
  Send,
  Clock,
} from "lucide-react-native";

export default function CustomerKhataScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();

  const {
    data: summary,
    isLoading,
    isRefetching,
    refetch,
  } = useCustomerKhataSummary();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKhataId, setSelectedKhataId] = useState<string | null>(null);

  // Dispute state
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputingTx, setDisputingTx] = useState<KhataTransactionItem | null>(null);
  const [disputeReason, setDisputeReason] = useState("");

  // UPI Settlement state
  const [upiModalVisible, setUpiModalVisible] = useState(false);
  const [payingShop, setPayingShop] = useState<CustomerShopKhataItem | null>(null);
  const [upiAmount, setUpiAmount] = useState("");
  const [upiUtr, setUpiUtr] = useState("");
  const [upiNotes, setUpiNotes] = useState("");

  const { user } = useAuthStore();
  const [customerQRVisible, setCustomerQRVisible] = useState(false);

  // Parchi & PTP States
  const [selectedParchiTx, setSelectedParchiTx] = useState<KhataTransactionItem | null>(null);
  const [ptpModalVisible, setPtpModalVisible] = useState(false);

  // Queries & Mutations for selected khata
  const {
    data: passbook,
    isLoading: isPassbookLoading,
    refetch: refetchPassbook,
  } = useCustomerKhataPassbook(selectedKhataId || undefined);

  const disputeMutation = useDisputeKhataTransaction(selectedKhataId || "");
  const upiMutation = useSubmitKhataUPIPayment(selectedKhataId || "");
  const customerPtpMutation = useSetCustomerPromiseToPay(selectedKhataId || "");

  // Quick dispute chip options
  const disputeChips = [
    "Galat Rakam (Wrong Amount)",
    "Pehle hi Jama Kar Diya (Paid)",
    "Saman Nahi Mila (Not Received)",
    "Duplicate Entry",
  ];

  // Filtered shops
  const filteredShops = (summary?.shops || []).filter((s) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      s.shop_name.toLowerCase().includes(q) ||
      s.shop_phone.includes(q) ||
      (s.shop_address && s.shop_address.toLowerCase().includes(q))
    );
  });

  const handleOpenPassbook = (khataId: string) => {
    setSelectedKhataId(khataId);
  };

  const handleOpenDispute = (tx: KhataTransactionItem) => {
    setDisputingTx(tx);
    setDisputeReason("");
    setDisputeModalVisible(true);
  };

  const handleSubmitDispute = async () => {
    if (!disputingTx || !selectedKhataId) return;
    if (!disputeReason.trim()) {
      Alert.alert("Reason Required", "Kripya galat entry ka karan darj karein.");
      return;
    }

    try {
      await disputeMutation.mutateAsync({
        transaction_id: disputingTx.id,
        reason: disputeReason.trim(),
      });
      Alert.alert(
        "Dispute Registered",
        "Aapki aappatti darj kar li gayi hai aur dukandar ko alert bhej diya gaya hai."
      );
      setDisputeModalVisible(false);
      setDisputingTx(null);
      setDisputeReason("");
      refetchPassbook();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Dispute register nahi ho paya. Dobara koshish karein.");
    }
  };

  const handleOpenUpiPayment = (shop: CustomerShopKhataItem) => {
    setPayingShop(shop);
    setUpiAmount(shop.current_balance > 0 ? String(shop.current_balance) : "100");
    setUpiUtr("");
    setUpiNotes("Khata payment");
    setUpiModalVisible(true);
  };

  const handleLaunchUpiApp = () => {
    if (!payingShop) return;
    const upiId = payingShop.shop_upi_id || `${payingShop.shop_phone}@upi`;
    const amt = parseFloat(upiAmount) || 0;
    const payeeName = encodeURIComponent(payingShop.shop_name);
    const url = `upi://pay?pa=${upiId}&pn=${payeeName}&am=${amt}&cu=INR&tn=Khata%20Settlement`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            "UPI App Not Found",
            `Aapke phone me direct UPI app link nahi mila. Kripya is UPI ID par pay karein: ${upiId}`
          );
        }
      })
      .catch(() => {
        Alert.alert("Pay Manual", `Dukandar UPI ID: ${upiId}`);
      });
  };

  const handleSubmitUpiProof = async () => {
    if (!payingShop) return;
    const amt = parseFloat(upiAmount);
    if (!amt || amt <= 0) {
      Alert.alert("Invalid Amount", "Kripya sahi payment amount enter karein.");
      return;
    }
    if (!upiUtr.trim() || upiUtr.trim().length < 6) {
      Alert.alert("UTR Required", "Kripya 12-digit UPI Reference Number / UTR enter karein.");
      return;
    }

    try {
      await upiMutation.mutateAsync({
        amount: amt,
        upi_ref_no: upiUtr.trim(),
        notes: upiNotes.trim(),
      });
      Alert.alert(
        "Payment Recorded",
        "Aapka payment proof record ho gaya hai. Dukandar ke verify karte hi account balance update ho jayega."
      );
      setUpiModalVisible(false);
      setPayingShop(null);
      refetch();
      if (selectedKhataId) refetchPassbook();
    } catch (err: any) {
      Alert.alert("Payment Error", err?.message || "Payment submit nahi ho paya.");
    }
  };

  const handleSavePromiseToPay = async (promiseDate: string, target: number) => {
    if (!selectedKhataId) return;
    await customerPtpMutation.mutateAsync({
      promise_to_pay_date: promiseDate,
      installment_target: target,
    });
    refetchPassbook();
  };

  if (isLoading) {
    return <LoadingState message="Aapka khata passbook load ho raha hai..." />;
  }

  const selectedShop = passbook?.shop;

  // Selected paying shop live UPI QR
  const upiIdForQr = payingShop?.shop_upi_id || `${payingShop?.shop_phone || ""}`;
  const upiAmtForQr = parseFloat(upiAmount) || payingShop?.current_balance || 100;
  const qrUri = `upi://pay?pa=${upiIdForQr}&pn=${encodeURIComponent(payingShop?.shop_name || "Dukan")}&am=${upiAmtForQr}&cu=INR&tn=KhataPayment`;
  const qrImgUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrUri)}&size=200x200`;

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => (selectedKhataId ? setSelectedKhataId(null) : router.back())}
          style={[styles.backBtn, { backgroundColor: colors.surfaceBorder }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {selectedKhataId ? selectedShop?.shop_name || "Passbook History" : "Mera Khata"}
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            {selectedKhataId ? "Live Bahi-Khata Panna" : "Digital Udhar Passbook"}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open personal Mera Khata QR"
          onPress={() => setCustomerQRVisible(true)}
          style={[styles.qrHeaderBtn, { backgroundColor: isDark ? "#1e293b" : "#eff6ff" }]}
        >
          <QrCode size={16} color="#2563eb" />
          <Text style={[styles.qrHeaderBtnText, { color: "#2563eb" }]}>Mera QR</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => {
              refetch();
              if (selectedKhataId) refetchPassbook();
            }}
          />
        }
      >
        {/* VIEW 1: SUMMARY / SHOPS LIST */}
        {!selectedKhataId ? (
          <>
            {/* Aggregated Overview Card */}
            <View
              style={[
                styles.overviewCard,
                {
                  backgroundColor: isDark ? "#1e1e24" : "#fef2f2",
                  borderColor: isDark ? "#3f2020" : "#fecaca",
                },
              ]}
            >
              <View style={styles.overviewTop}>
                <View>
                  <Text style={[styles.overviewLabel, { color: isDark ? "#fca5a5" : "#991b1b" }]}>
                    TOTAL MARKET PENDING UDHAR
                  </Text>
                  <Text style={[styles.overviewAmount, { color: isDark ? "#ef4444" : "#dc2626" }]}>
                    {formatCurrency(summary?.total_market_due ?? 0)}
                  </Text>
                </View>
                <View style={styles.overviewIconCircle}>
                  <BookOpen size={24} color="#dc2626" />
                </View>
              </View>
              <View style={styles.overviewDivider} />
              <View style={styles.overviewBottom}>
                <View style={styles.statCol}>
                  <Text style={[styles.statSub, { color: colors.textMuted }]}>Connected Dukans</Text>
                  <Text style={[styles.statVal, { color: colors.text }]}>
                    {summary?.total_shops_count ?? 0} Dukanein
                  </Text>
                </View>
                <View style={styles.statCol}>
                  <Text style={[styles.statSub, { color: colors.textMuted }]}>Passbook Sync</Text>
                  <View style={styles.rowAlign}>
                    <CheckCircle2 size={12} color="#16a34a" />
                    <Text style={[styles.statVal, { color: "#16a34a", marginLeft: 4 }]}>
                      100% Verified
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Search Bar if multiple shops */}
            {(summary?.shops?.length || 0) > 1 && (
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <Search size={18} color={colors.textMuted} />
                <TextInput
                  style={[styles.searchInput, { color: colors.text }]}
                  placeholder="Dukan ka naam ya phone search karein..."
                  placeholderTextColor={colors.textMuted}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {!!searchQuery && (
                  <Pressable onPress={() => setSearchQuery("")}>
                    <X size={16} color={colors.textMuted} />
                  </Pressable>
                )}
              </View>
            )}

            {/* Section Header */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Aapke Connected Dukandar ({filteredShops.length})
              </Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Dukandar ke sath live hisaab-kitab
              </Text>
            </View>

            {/* Empty State */}
            {filteredShops.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Store size={40} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Koi Dukan Link Nahi Hai</Text>
                <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                  Jab aap kisi Shopsilo dukandar se udhar lenge ya apna QR scan karayenge, unka hisab yahan live dikhai dega.
                </Text>
              </View>
            ) : (
              filteredShops.map((shop) => {
                const isCleared = shop.current_balance <= 0;

                return (
                  <View
                    key={shop.khata_id}
                    style={[
                      styles.shopCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.surfaceBorder,
                      },
                    ]}
                  >
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => handleOpenPassbook(shop.khata_id)}
                      style={styles.shopCardTop}
                    >
                      <View style={styles.shopAvatar}>
                        <Store size={22} color={colors.primary} />
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                          <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>
                            {shop.shop_name}
                          </Text>
                          <TrustScoreBadge score={820} badge="VERIFIED_STORE" size="sm" />
                        </View>
                        <Text style={[styles.shopMeta, { color: colors.textMuted }]}>
                          📞 {shop.shop_phone}
                        </Text>
                        {!!shop.promise_to_pay_date && shop.current_balance > 0 && (
                          <View style={styles.ptpTag}>
                            <Calendar size={10} color="#2563eb" />
                            <Text style={styles.ptpTagText}>
                              Promise: {new Date(shop.promise_to_pay_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                            </Text>
                          </View>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end", gap: 2 }}>
                        <Text
                          style={[
                            styles.shopBalance,
                            { color: isCleared ? "#16a34a" : "#dc2626" },
                          ]}
                        >
                          {formatCurrency(shop.current_balance)}
                        </Text>
                        <Text style={[styles.shopBalLabel, { color: colors.textMuted }]}>
                          {isCleared ? "Chukta" : "Udhar Baki"}
                        </Text>
                      </View>
                    </Pressable>

                    {/* Action Row */}
                    <View style={[styles.shopActionRow, { borderTopColor: colors.surfaceBorder }]}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleOpenPassbook(shop.khata_id)}
                        style={[styles.actionBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
                      >
                        <Receipt size={14} color={colors.text} />
                        <Text style={[styles.actionBtnText, { color: colors.text }]}>Passbook Dekhein</Text>
                      </Pressable>

                      {shop.current_balance > 0 && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenUpiPayment(shop)}
                          style={[styles.actionBtn, { backgroundColor: "#16a34a" }]}
                        >
                          <CreditCard size={14} color="#fff" />
                          <Text style={[styles.actionBtnText, { color: "#fff" }]}>Pay via UPI</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : (
          /* VIEW 2: DETAILED PASSBOOK VIEW */
          <>
            {/* Selected Shop Hero Banner */}
            <View
              style={[
                styles.passbookHero,
                {
                  backgroundColor: (selectedShop?.current_balance ?? 0) > 0 ? (isDark ? "#2a1515" : "#fef2f2") : (isDark ? "#14291a" : "#f0fdf4"),
                  borderColor: (selectedShop?.current_balance ?? 0) > 0 ? (isDark ? "#451a1a" : "#fecaca") : (isDark ? "#166534" : "#bbf7d0"),
                },
              ]}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <View>
                  <Text style={[styles.heroLabel, { color: (selectedShop?.current_balance ?? 0) > 0 ? "#dc2626" : "#16a34a" }]}>
                    {(selectedShop?.current_balance ?? 0) > 0 ? "TOTAL AMOUNT OWED" : "HISAAB CLEAR"}
                  </Text>
                  <Text style={[styles.heroAmount, { color: (selectedShop?.current_balance ?? 0) > 0 ? "#dc2626" : "#16a34a" }]}>
                    {formatCurrency(selectedShop?.current_balance ?? 0)}
                  </Text>
                </View>

                {/* Promise to pay button */}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPtpModalVisible(true)}
                  style={[styles.heroPtpBtn, { backgroundColor: colors.primary }]}
                >
                  <Calendar size={12} color="#fff" />
                  <Text style={styles.heroPtpBtnText}>
                    {selectedShop?.promise_to_pay_date ? "Change Promise" : "+ Promise Date"}
                  </Text>
                </Pressable>
              </View>

              {!!selectedShop?.promise_to_pay_date && (
                <View style={styles.promiseActiveRow}>
                  <Clock size={12} color="#2563eb" />
                  <Text style={styles.promiseActiveText}>
                    Agreed Repayment Date: {new Date(selectedShop.promise_to_pay_date).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}
                  </Text>
                </View>
              )}

              {/* Pay Now Button */}
              {(selectedShop?.current_balance ?? 0) > 0 && selectedShop && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleOpenUpiPayment(selectedShop)}
                  style={[styles.payNowBigBtn, { backgroundColor: "#16a34a" }]}
                >
                  <CreditCard size={18} color="#fff" />
                  <Text style={styles.payNowBigBtnText}>Pay Balance Online (UPI)</Text>
                </Pressable>
              )}
            </View>

            {/* Passbook Transactions List */}
            <View style={styles.timelineHeader}>
              <Text style={[styles.timelineTitle, { color: colors.text }]}>Entry Passbook Details</Text>
              <Text style={[styles.timelineSub, { color: colors.textMuted }]}>
                Aapke aur dukandar ke beech transactions
              </Text>
            </View>

            {isPassbookLoading ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 20 }} />
            ) : !passbook?.transactions || passbook.transactions.length === 0 ? (
              <View style={[styles.emptyBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                <Receipt size={36} color={colors.textMuted} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>Koi Entry Nahi Hai</Text>
              </View>
            ) : (
              passbook.transactions.map((tx) => {
                const isCredit = tx.type === "GIVE_CREDIT";
                const isPayment = tx.type === "RECEIVE_PAYMENT";
                const hasDispute = tx.status === "DISPUTED";
                const isAccepted = tx.status === "RESOLVED_ACCEPTED";
                const isRejected = tx.status === "RESOLVED_REJECTED";

                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: hasDispute ? "#fca5a5" : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <View style={styles.txRow}>
                      <View
                        style={[
                          styles.txIconWrap,
                          {
                            backgroundColor: isCredit ? "#fee2e2" : isPayment ? "#dcfce7" : "#fef3c7",
                          },
                        ]}
                      >
                        {isCredit ? (
                          <ArrowDownLeft size={16} color="#dc2626" />
                        ) : isPayment ? (
                          <ArrowUpRight size={16} color="#16a34a" />
                        ) : (
                          <RotateCcw size={16} color="#d97706" />
                        )}
                      </View>

                      <View style={{ flex: 1, gap: 2 }}>
                        <Text style={[styles.txTitle, { color: colors.text }]}>
                          {isCredit ? "Udhar Diya (Taken)" : isPayment ? "Jama Liya (Paid)" : "Reversal Entry"}
                        </Text>
                        <Text style={[styles.txDate, { color: colors.textMuted }]}>
                          {new Date(tx.created_at).toLocaleString("en-IN", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </Text>

                        {!!tx.notes && (
                          <Text style={[styles.txNotes, { color: colors.text }]}>
                            📝 {tx.notes}
                          </Text>
                        )}
                        {!!tx.bill_number && (
                          <Text style={[styles.txBill, { color: colors.textMuted }]}>
                            Bill #{tx.bill_number}
                          </Text>
                        )}

                        {/* Parchi Photo Attachment */}
                        {!!tx.parchi_image_url && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => setSelectedParchiTx(tx)}
                            style={styles.parchiThumbLink}
                          >
                            <Paperclip size={12} color="#2563eb" />
                            <Text style={styles.parchiThumbLinkText}>Parchi Saboot Dekhein</Text>
                          </Pressable>
                        )}
                      </View>

                      <View style={{ alignItems: "flex-end" }}>
                        <Text
                          style={[
                            styles.txAmount,
                            { color: isCredit ? "#dc2626" : isPayment ? "#16a34a" : "#d97706" },
                          ]}
                        >
                          {isCredit ? `+ ${formatCurrency(tx.amount)}` : `- ${formatCurrency(tx.amount)}`}
                        </Text>
                        {tx.balance_after !== undefined && (
                          <Text style={[styles.txBalAfter, { color: colors.textMuted }]}>
                            Baki: {formatCurrency(tx.balance_after)}
                          </Text>
                        )}
                      </View>
                    </View>

                    {/* Dispute Action / Status Row */}
                    {isCredit && !hasDispute && !isAccepted && (
                      <View style={styles.disputeActionRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenDispute(tx)}
                          style={styles.raiseDisputeBtn}
                        >
                          <HelpCircle size={12} color="#ef4444" />
                          <Text style={styles.raiseDisputeBtnText}>Galat Entry? Dispute Karein</Text>
                        </Pressable>
                      </View>
                    )}

                    {hasDispute && (
                      <View style={styles.disputePendingBanner}>
                        <AlertTriangle size={12} color="#dc2626" />
                        <Text style={styles.disputePendingText}>
                          Dispute Pending: "{tx.dispute_reason || "Entry aappatti"}"
                        </Text>
                      </View>
                    )}

                    {isAccepted && (
                      <View style={styles.disputeAcceptedBanner}>
                        <CheckCircle2 size={12} color="#16a34a" />
                        <Text style={styles.disputeAcceptedText}>Dispute Accepted & Reversed</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>

      {/* MODAL: UPI SETTLEMENT & DYNAMIC QR */}
      <Modal
        visible={upiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUpiModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
            <View style={styles.promptHeader}>
              <CreditCard size={20} color="#16a34a" />
              <Text style={[styles.promptTitle, { color: colors.text }]}>Pay Dukan via UPI</Text>
              <Pressable onPress={() => setUpiModalVisible(false)} style={{ marginLeft: "auto" }}>
                <X size={18} color={colors.textMuted} />
              </Pressable>
            </View>

            <Text style={[styles.promptSub, { color: colors.textMuted }]}>
              {payingShop?.shop_name} ko sidhe online payment karein aur reference number darj karein.
            </Text>

            {/* Live QR Code Display */}
            <View style={styles.qrDisplayBox}>
              <Image source={{ uri: qrImgUrl }} style={styles.qrImage} resizeMode="contain" />
              <Text style={[styles.qrShopTitle, { color: colors.text }]}>{payingShop?.shop_name}</Text>
              <Text style={[styles.qrUpiId, { color: colors.textMuted }]}>{upiIdForQr}</Text>
            </View>

            {/* 1-Click Launch UPI App */}
            <Pressable
              accessibilityRole="button"
              onPress={handleLaunchUpiApp}
              style={[styles.launchUpiBtn, { backgroundColor: colors.primary }]}
            >
              <Send size={16} color="#fff" />
              <Text style={styles.launchUpiBtnText}>Open PhonePe / GPay / Paytm</Text>
            </Pressable>

            {/* Input Amount & UTR */}
            <View style={{ gap: 8, marginTop: 4 }}>
              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                placeholder="₹ Payment Amount"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                value={upiAmount}
                onChangeText={setUpiAmount}
              />

              <TextInput
                style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                placeholder="12-Digit UPI Ref / UTR No. *"
                placeholderTextColor={colors.textMuted}
                value={upiUtr}
                onChangeText={setUpiUtr}
              />
            </View>

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setUpiModalVisible(false)}
                style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitUpiProof}
                disabled={upiMutation.isPending}
                style={[styles.confirmBtn, { backgroundColor: "#16a34a" }]}
              >
                {upiMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Submit Proof</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL: DISPUTE ENTRY WITH QUICK REASON CHIPS */}
      <Modal
        visible={disputeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisputeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
            <View style={styles.promptHeader}>
              <HelpCircle size={20} color="#ef4444" />
              <Text style={[styles.promptTitle, { color: colors.text }]}>Galat Entry Aappatti (Dispute)</Text>
            </View>
            <Text style={[styles.promptSub, { color: colors.textMuted }]}>
              Agar aapne ye saman nahi liya ya rakam galat hai, to aappatti darj karein:
            </Text>

            {/* Quick reason chips */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
              {disputeChips.map((chip) => (
                <Pressable
                  key={chip}
                  onPress={() => setDisputeReason(chip)}
                  style={[
                    styles.disputeChip,
                    disputeReason === chip && styles.disputeChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.disputeChipText,
                      disputeReason === chip && styles.disputeChipTextActive,
                    ]}
                  >
                    {chip}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[styles.modalInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
              placeholder="Aappatti ka karan likhein..."
              placeholderTextColor={colors.textMuted}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setDisputeModalVisible(false)}
                style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleSubmitDispute}
                disabled={disputeMutation.isPending}
                style={[styles.confirmBtn, { backgroundColor: "#ef4444" }]}
              >
                {disputeMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.confirmText}>Dispute Bhejein</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PARCHI VIEWER MODAL */}
      <ParchiViewerModal
        visible={!!selectedParchiTx}
        onClose={() => setSelectedParchiTx(null)}
        parchiUrl={selectedParchiTx?.parchi_image_url}
        itemsSummary={selectedParchiTx?.notes || selectedParchiTx?.items_summary}
        billNumber={selectedParchiTx?.bill_number}
        amount={selectedParchiTx?.amount}
        date={selectedParchiTx?.created_at}
        customerName={user?.full_name || "Customer"}
      />

      {/* PROMISE TO PAY MODAL */}
      <PromiseToPayModal
        visible={ptpModalVisible}
        onClose={() => setPtpModalVisible(false)}
        customerName={user?.full_name || "Mera Khata"}
        currentBalance={selectedShop?.current_balance || 0}
        initialPromiseDate={selectedShop?.promise_to_pay_date}
        onSave={handleSavePromiseToPay}
      />

      {/* CUSTOMER KHATA QR MODAL */}
      <CustomerKhataQRModal
        visible={customerQRVisible}
        onClose={() => setCustomerQRVisible(false)}
        customerName={user?.full_name || "Customer"}
        customerPhone={user?.phone || ""}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
  },
  qrHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  qrHeaderBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  overviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  overviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  overviewAmount: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  overviewIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(220,38,38,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  overviewBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCol: {
    gap: 2,
  },
  statSub: {
    fontSize: 11,
  },
  statVal: {
    fontSize: 13,
    fontWeight: "700",
  },
  rowAlign: {
    flexDirection: "row",
    alignItems: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
  },
  sectionHeader: {
    gap: 2,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "800",
  },
  sectionSubtitle: {
    fontSize: 12,
  },
  emptyBox: {
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  shopCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  shopCardTop: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  shopAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(37,99,235,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  shopName: {
    fontSize: 15,
    fontWeight: "800",
  },
  shopMeta: {
    fontSize: 11,
  },
  ptpTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 2,
  },
  ptpTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#2563eb",
  },
  shopBalance: {
    fontSize: 17,
    fontWeight: "900",
  },
  shopBalLabel: {
    fontSize: 11,
  },
  shopActionRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    padding: 8,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  passbookHero: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  heroLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  heroAmount: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 2,
  },
  heroPtpBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  heroPtpBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  promiseActiveRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#eff6ff",
    padding: 8,
    borderRadius: 8,
  },
  promiseActiveText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  payNowBigBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 10,
    marginTop: 4,
  },
  payNowBigBtnText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  timelineHeader: {
    marginTop: 6,
    gap: 2,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  timelineSub: {
    fontSize: 11,
  },
  txCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  txRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  txDate: {
    fontSize: 11,
  },
  txNotes: {
    fontSize: 12,
    marginTop: 2,
  },
  txBill: {
    fontSize: 11,
    marginTop: 1,
  },
  parchiThumbLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  parchiThumbLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
  txBalAfter: {
    fontSize: 11,
  },
  disputeActionRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 2,
  },
  raiseDisputeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  raiseDisputeBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ef4444",
  },
  disputePendingBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    padding: 6,
    borderRadius: 6,
  },
  disputePendingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
  },
  disputeAcceptedBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    padding: 6,
    borderRadius: 6,
  },
  disputeAcceptedText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  promptCard: {
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  promptHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  promptSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  qrDisplayBox: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    backgroundColor: "#fff",
    borderRadius: 12,
    gap: 4,
  },
  qrImage: {
    width: 180,
    height: 180,
  },
  qrShopTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  qrUpiId: {
    fontSize: 11,
  },
  launchUpiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 42,
    borderRadius: 10,
  },
  launchUpiBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  modalInput: {
    height: 44,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  disputeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#f8fafc",
  },
  disputeChipActive: {
    backgroundColor: "#fee2e2",
    borderColor: "#ef4444",
  },
  disputeChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  disputeChipTextActive: {
    color: "#ef4444",
    fontWeight: "700",
  },
  promptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
