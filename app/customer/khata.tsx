import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TextInput,
  Pressable,
  RefreshControl,
  Modal,
  Alert,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Button } from "@/components/Button";
import { LoadingState } from "@/components/LoadingState";
import { InAppPDFModal } from "@/components/InAppPDFModal";
import { useAuthStore } from "@/store/useAuthStore";
import { CustomerKhataQRModal } from "@/features/khata/components/CustomerKhataQRModal";
import { CreditOTPProtectionModal } from "@/features/khata/components/CreditOTPProtectionModal";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import { ParchiViewerModal } from "@/features/khata/components/ParchiViewerModal";
import { PromiseToPayModal } from "@/features/khata/components/PromiseToPayModal";
import { Camera, Calendar } from "lucide-react-native";
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
  Phone,
  MapPin,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Download,
  CreditCard,
  Search,
  X,
  ShieldCheck, Lock,
  Receipt,
  HelpCircle,
  QrCode,
  RotateCcw,
  ShieldAlert,
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

  // PDF Modal state
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const { user } = useAuthStore();
  const [customerQRVisible, setCustomerQRVisible] = useState(false);
  const [otpProtectionModalVisible, setOtpProtectionModalVisible] = useState(false);
  const [protectingShop, setProtectingShop] = useState<CustomerShopKhataItem | null>(null);

  // Pillar 3 & 4: Parchi & PTP States
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
            `Aapke phone me UPI app nahi mila. Kripya is UPI ID par pay karein: ${upiId}`
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
    } catch (err: any) {
      Alert.alert("Payment Error", err?.message || "Payment submit nahi ho paya.");
    }
  };

  if (isLoading) {
    return <LoadingState message="Aapka khata passbook load ho raha hai..." />;
  }

  const selectedShop = passbook?.shop;

  return (
    <ScreenWrapper>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surfaceBorder }]}
        >
          <ArrowLeft size={20} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Mera Khata</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
            Digital Udhar Passbook
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
                ₹{(summary?.total_market_due ?? 0).toLocaleString("en-IN")}
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
        {filteredShops.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Store size={40} color={colors.textMuted} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Koi Khata Record Nahi Mila
            </Text>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {searchQuery
                ? "Aapki khoj ke mutabik koi dukan nahi mili."
                : "Aapka kisi bhi registered dukan par koi udhari ya khata pending nahi hai. Dukandar jab bhi aapke phone number par koi entry karenge, wo yahan live dikhegi."}
            </Text>
          </View>
        )}

        {/* Shop Khata Cards */}
        {filteredShops.map((shop) => {
          const limitUsedPct =
            shop.credit_limit > 0
              ? Math.min(100, Math.round((shop.current_balance / shop.credit_limit) * 100))
              : 0;

          return (
            <View
              key={shop.khata_id}
              style={[
                styles.shopCard,
                { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
              ]}
            >
              <View style={styles.shopCardHeader}>
                <View style={[styles.shopIconWrap, { backgroundColor: "#eff6ff" }]}>
                  <Store size={20} color="#2563eb" />
                </View>
                <View style={styles.shopInfoCol}>
                  <Text style={[styles.shopName, { color: colors.text }]} numberOfLines={1}>
                    {shop.shop_name}
                  </Text>
                  {!!shop.shop_address && (
                    <Text style={[styles.shopAddress, { color: colors.textMuted }]} numberOfLines={1}>
                      <MapPin size={11} color={colors.textMuted} /> {shop.shop_address}
                    </Text>
                  )}
                  <Text style={[styles.shopPhone, { color: colors.textMuted }]}>
                    📞 {shop.shop_phone}
                  </Text>
                </View>
                <View style={styles.balanceBadgeWrap}>
                  <Text style={[styles.balanceBadgeLabel, { color: colors.textMuted }]}>
                    Aapka Bakaya
                  </Text>
                  <Text
                    style={[
                      styles.balanceBadgeAmount,
                      { color: shop.current_balance > 0 ? "#dc2626" : "#16a34a" },
                    ]}
                  >
                    ₹{shop.current_balance.toLocaleString("en-IN")}
                  </Text>
                </View>
              </View>

              {/* Credit limit progress bar */}
              {/* Pillar 2: Vyapar Vishwas Score & Pillar 4: PTP in Shop Card */}
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8, marginVertical: 6 }}>
                {shop.trust_score !== undefined && (
                  <TrustScoreBadge score={shop.trust_score} badge={shop.trust_badge} size="sm" />
                )}
                {!!shop.promise_to_pay_date && (
                  <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: isDark ? "#27272a" : "#fef3c7", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, gap: 4 }}>
                    <Calendar size={11} color="#b45309" />
                    <Text style={{ fontSize: 11, fontWeight: "600", color: "#b45309" }}>
                      Wada: {new Date(shop.promise_to_pay_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      {shop.installment_target ? ` (Target: ₹${shop.installment_target})` : ""}
                    </Text>
                  </View>
                )}
              </View>

              {shop.credit_otp_required && (
                  <View style={styles.otpShieldBadge}>
                    <ShieldCheck size={11} color="#0284c7" />
                    <Text style={styles.otpShieldBadgeText}>
                      OTP Guard &gt; ₹{shop.credit_otp_threshold || 1000}
                    </Text>
                  </View>
                )}
                {shop.credit_limit > 0 && (
                <View style={styles.creditLimitWrap}>
                  <View style={styles.creditLimitLabels}>
                    <Text style={[styles.creditLimitText, { color: colors.textMuted }]}>
                      Credit Limit: ₹{shop.credit_limit.toLocaleString("en-IN")}
                    </Text>
                    <Text
                      style={[
                        styles.creditLimitText,
                        {
                          color:
                            limitUsedPct > 80
                              ? "#dc2626"
                              : limitUsedPct > 50
                              ? "#d97706"
                              : "#16a34a",
                          fontWeight: "700",
                        },
                      ]}
                    >
                      {limitUsedPct}% Used
                    </Text>
                  </View>
                  <View style={[styles.progressBarTrack, { backgroundColor: colors.surfaceBorder }]}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${limitUsedPct}%`,
                          backgroundColor:
                            limitUsedPct > 80
                              ? "#dc2626"
                              : limitUsedPct > 50
                              ? "#d97706"
                              : "#16a34a",
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.shopCardActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handleOpenPassbook(shop.khata_id)}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: isDark ? "#27272a" : "#f4f4f5" },
                  ]}
                >
                  <Receipt size={15} color={colors.text} />
                  <Text style={[styles.actionBtnText, { color: colors.text }]}>
                    Passbook Dekhein
                  </Text>
                  <ChevronRight size={14} color={colors.textMuted} />
                </Pressable>

                {shop.current_balance > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => handleOpenUpiPayment(shop)}
                    style={[styles.payBtn, { backgroundColor: "#16a34a" }]}
                  >
                    <CreditCard size={15} color="#fff" />
                    <Text style={styles.payBtnText}>Pay via UPI</Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ========================================================================= */}
      {/* DETAILED PASSBOOK MODAL                                                   */}
      {/* ========================================================================= */}
      <Modal
        visible={!!selectedKhataId}
        animationType="slide"
        onRequestClose={() => setSelectedKhataId(null)}
      >
        <ScreenWrapper>
          <View
            style={[
              styles.modalHeader,
              { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              onPress={() => setSelectedKhataId(null)}
              style={[styles.backBtn, { backgroundColor: colors.surfaceBorder }]}
            >
              <ArrowLeft size={20} color={colors.text} />
            </Pressable>
            <View style={styles.modalHeaderInfo}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]} numberOfLines={1}>
                {selectedShop?.shop_name || "Dukan Passbook"}
              </Text>
              <Text style={[styles.modalHeaderSub, { color: colors.textMuted }]}>
                Live Dual-Entry Ledger
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setPdfModalVisible(true)}
              style={[styles.pdfIconBtn, { backgroundColor: "#eff6ff" }]}
            >
              <Download size={18} color="#2563eb" />
            </Pressable>
          </View>

          {isPassbookLoading ? (
            <LoadingState message="Passbook transactions load ho rahi hain..." />
          ) : (
            <ScrollView
              contentContainerStyle={styles.passbookScroll}
              refreshControl={
                <RefreshControl
                  refreshing={isPassbookLoading}
                  onRefresh={() => refetchPassbook()}
                />
              }
            >
              {/* Dual-OTP Closure Alert Banner */}
              {selectedShop?.closure_status === "PENDING_OTP" && !!selectedShop?.closure_otp && (
                <View style={[styles.closureAlertBanner, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9", borderColor: "#64748b" }]}>
                  <Lock size={20} color="#64748b" />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={[styles.closureAlertTitle, { color: colors.text }]}>
                      Dukandar ne Khata Band Karne Ka Anurodh Kiya Hai
                    </Text>
                    <Text style={[styles.closureAlertSub, { color: colors.textMuted }]}>
                      Agar aapka sara hisab chukta (₹0) ho chuka hai aur aap khata band karne ke liye sahmat hain, to dukandar ko yeh OTP batayein:
                    </Text>
                    <View style={styles.otpPill}>
                      <Text style={styles.otpPillText}>{selectedShop.closure_otp}</Text>
                    </View>
                  </View>
                </View>
              )}

              {selectedShop?.closure_status === "CLOSED" && (
                <View style={[styles.closureAlertBanner, { backgroundColor: isDark ? "#1e293b" : "#f8fafc", borderColor: "#94a3b8" }]}>
                  <CheckCircle2 size={18} color="#16a34a" />
                  <Text style={[styles.closureAlertTitle, { color: colors.text, fontSize: 13 }]}>
                    Yeh Khata Band (Archived) Hai — Purana Hisab Surakshit Hai
                  </Text>
                </View>
              )}

              {/* Pillar 2 & 4: Passbook Trust & PTP Card */}
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingHorizontal: 4 }}>
                {selectedShop?.trust_score !== undefined ? (
                  <TrustScoreBadge score={selectedShop.trust_score} badge={selectedShop.trust_badge} />
                ) : <View />}

                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPtpModalVisible(true)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: isDark ? "#27272a" : "#eff6ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: "#bfdbfe" }}
                >
                  <Calendar size={13} color="#2563eb" />
                  <Text style={{ fontSize: 12, fontWeight: "700", color: "#2563eb" }}>
                    {selectedShop?.promise_to_pay_date
                      ? `Chukane Ki Tarikh: ${new Date(selectedShop.promise_to_pay_date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                      : "Tarikh Tay Karein (PTP)"}
                  </Text>
                </Pressable>
              </View>

              {/* Passbook Summary Banner */}
              <View
                style={[
                  styles.passbookBanner,
                  {
                    backgroundColor: isDark ? "#18181b" : "#f8fafc",
                    borderColor: colors.surfaceBorder,
                  },
                ]}
              >
                <View style={styles.passbookBannerRow}>
                  <View>
                    <Text style={[styles.bannerLabel, { color: colors.textMuted }]}>
                      KUL BAKI HISAB (NET DUE)
                    </Text>
                    <Text
                      style={[
                        styles.bannerAmount,
                        {
                          color:
                            (selectedShop?.current_balance ?? 0) > 0 ? "#dc2626" : "#16a34a",
                        },
                      ]}
                    >
                      ₹{(selectedShop?.current_balance ?? 0).toLocaleString("en-IN")}
                    </Text>
                  </View>
                  {selectedShop && selectedShop.current_balance > 0 && (
                    <Button
                      title="Chukayein (UPI)"
                      onPress={() => handleOpenUpiPayment(selectedShop)}
                      size="sm"
                      style={styles.payBannerBtn}
                    />
                  )}
                </View>

                {selectedShop?.credit_limit ? (
                  <Text style={[styles.bannerSubText, { color: colors.textMuted }]}>
                    Dukan Credit Limit: ₹{selectedShop.credit_limit.toLocaleString("en-IN")}
                  </Text>
                ) : null}
              </View>

              {/* Badi Udhari OTP Suraksha Setting */}
              {selectedShop && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setProtectingShop(selectedShop);
                    setOtpProtectionModalVisible(true);
                  }}
                  style={[
                    styles.otpCardBanner,
                    {
                      backgroundColor: selectedShop.credit_otp_required
                        ? isDark
                          ? "#14291a"
                          : "#f0fdf4"
                        : isDark
                        ? "#1e293b"
                        : "#f8fafc",
                      borderColor: selectedShop.credit_otp_required
                        ? "#86efac"
                        : colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.otpCardLeft}>
                    {selectedShop.credit_otp_required ? (
                      <ShieldCheck size={18} color="#16a34a" />
                    ) : (
                      <ShieldAlert size={18} color={colors.textMuted} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.otpCardTitle, { color: colors.text }]}>
                        {selectedShop.credit_otp_required
                          ? `Badi Udhari OTP Suraksha: ON (> ₹${selectedShop.credit_otp_threshold || 1000})`
                          : "Badi Udhari OTP Suraksha: OFF"}
                      </Text>
                      <Text style={[styles.otpCardSubtitle, { color: colors.textMuted }]}>
                        {selectedShop.credit_otp_required
                          ? "Is seema se zyada udhar likhne par aapka OTP approval jaruri hoga"
                          : "Tap karein aur anchahe udhar par OTP rok lagayein"}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={16} color={colors.textMuted} />
                </Pressable>
              )}

              {/* Transactions Timeline */}
              <View style={styles.timelineHeader}>
                <Text style={[styles.timelineTitle, { color: colors.text }]}>
                  Transactions ({passbook?.transactions?.length || 0})
                </Text>
                <Text style={[styles.timelineSub, { color: colors.textMuted }]}>
                  Dono paksho ka ek-ek rupaye ka hisab
                </Text>
              </View>

              {(!passbook?.transactions || passbook.transactions.length === 0) && (
                <View style={styles.noTxCard}>
                  <Receipt size={32} color={colors.textMuted} />
                  <Text style={[styles.noTxText, { color: colors.textMuted }]}>
                    Is dukan ke sath abhi koi transaction entry nahi hai.
                  </Text>
                </View>
              )}

              {passbook?.transactions?.map((tx) => {
                const isReversal = tx.type === "REVERSAL" || !!tx.reversal_of_id;
                const isDebit = tx.type === "GIVE_CREDIT" && !isReversal;
                const isDisputed = tx.status === "DISPUTED";
                const isResolvedAccepted = tx.status === "RESOLVED_ACCEPTED";
                const isResolvedRejected = tx.status === "RESOLVED_REJECTED";

                return (
                  <View
                    key={tx.id}
                    style={[
                      styles.txCard,
                      {
                        backgroundColor: colors.surface,
                        borderColor: isDisputed ? "#ef4444" : colors.surfaceBorder,
                      },
                    ]}
                  >
                    <View style={styles.txHeaderRow}>
                      <View style={styles.txTypeRow}>
                        <View
                          style={[
                            styles.txIconWrap,
                            { backgroundColor: isDebit ? "#fee2e2" : "#dcfce7" },
                          ]}
                        >
                          {isReversal ? (
                            <RotateCcw size={16} color="#d97706" />
                          ) : isDebit ? (
                            <ArrowDownLeft size={16} color="#dc2626" />
                          ) : (
                            <ArrowUpRight size={16} color="#16a34a" />
                          )}
                        </View>
                        <View>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                            <Text style={[styles.txTitle, { color: colors.text }]}>
                              {isReversal
                                ? "Galti Sudhar (Reversal)"
                                : isDebit
                                ? "Udhar Liya (Debit)"
                                : "Rupaye Diye (Credit)"}
                            </Text>
                            {isResolvedAccepted && (
                              <View style={styles.resolvedAcceptedBadge}>
                                <Text style={styles.resolvedBadgeText}>Claim Accepted</Text>
                              </View>
                            )}
                            {isResolvedRejected && (
                              <View style={styles.resolvedRejectedBadge}>
                                <Text style={styles.resolvedBadgeText}>Reviewed</Text>
                              </View>
                            )}
                          </View>
                          <Text style={[styles.txDate, { color: colors.textMuted }]}>
                            {new Date(tx.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.txAmountCol}>
                        <Text
                          style={[
                            styles.txAmount,
                            { color: isDebit ? "#dc2626" : "#16a34a" },
                          ]}
                        >
                          {isReversal ? "↺ " : isDebit ? "-₹" : "+₹"}
                          {tx.amount.toLocaleString("en-IN")}
                        </Text>
                        <Text style={[styles.txBalanceAfter, { color: colors.textMuted }]}>
                          Shesh: ₹{tx.balance_after.toLocaleString("en-IN")}
                        </Text>
                      </View>
                    </View>

                    {/* Notes / Bill Number */}
                    {/* Pillar 3: Itemized breakdown & Parchi button */}
                    {!!tx.items_summary && (
                      <View style={{ backgroundColor: isDark ? "#1e293b" : "#f1f5f9", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginVertical: 4 }}>
                        <Text style={{ fontSize: 12, color: colors.text, fontWeight: "500" }}>
                          🛒 {tx.items_summary}
                        </Text>
                      </View>
                    )}

                    {!!tx.parchi_image_url && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => setSelectedParchiTx(tx)}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#eff6ff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, marginVertical: 4, alignSelf: "flex-start", borderWidth: 1, borderColor: "#bfdbfe" }}
                      >
                        <Camera size={13} color="#2563eb" />
                        <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563eb" }}>
                          Asli Parchi / Receipt Dekhein
                        </Text>
                      </Pressable>
                    )}

                    {!!tx.notes && (
                      <View style={[styles.txNotesBox, { backgroundColor: isDark ? "#27272a" : "#f4f4f5" }]}>
                        <Text style={[styles.txNotesText, { color: colors.text }]}>
                          📝 {tx.notes}
                        </Text>
                      </View>
                    )}

                    {!!tx.bill_number && (
                      <Text style={[styles.txBillNo, { color: colors.textMuted }]}>
                        Bill / Invoice: #{tx.bill_number}
                      </Text>
                    )}

                    {!!tx.upi_ref_no && (
                      <Text style={[styles.txUpiRef, { color: colors.textMuted }]}>
                        UPI Ref (UTR): {tx.upi_ref_no}
                      </Text>
                    )}

                    {/* Status & Dispute Action */}
                    <View style={styles.txFooterRow}>
                      {isDisputed ? (
                        <View style={styles.disputeAlertWrap}>
                          <AlertTriangle size={14} color="#ef4444" />
                          <Text style={styles.disputeAlertText}>
                            Disputed: {tx.dispute_reason || "Aapatti darj hai"}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.confirmedBadge}>
                          <CheckCircle2 size={12} color="#16a34a" />
                          <Text style={styles.confirmedBadgeText}>Dukandar se Verified</Text>
                        </View>
                      )}

                      {!isDisputed && isDebit && (
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenDispute(tx)}
                          style={styles.flagDisputeBtn}
                        >
                          <HelpCircle size={12} color="#dc2626" />
                          <Text style={styles.flagDisputeText}>Galat Entry? Dispute karein</Text>
                        </Pressable>
                      )}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </ScreenWrapper>
      </Modal>

      {/* ========================================================================= */}
      {/* 1-TAP DISPUTE MODAL                                                       */}
      {/* ========================================================================= */}
      <Modal
        visible={disputeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDisputeModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptModal, { backgroundColor: colors.surface }]}>
            <View style={styles.promptHeader}>
              <AlertTriangle size={22} color="#dc2626" />
              <Text style={[styles.promptTitle, { color: colors.text }]}>
                Galat Entry Par Aapatti (Dispute)
              </Text>
            </View>
            <Text style={[styles.promptSub, { color: colors.textMuted }]}>
              Agar yeh entry aapke mutabik galat hai to karan darj karein. Yeh alert turant dukandar ke portal par highlight ho jayega.
            </Text>

            {disputingTx && (
              <View style={[styles.disputeTxSummary, { backgroundColor: colors.surfaceBorder }]}>
                <Text style={[styles.disputeTxAmount, { color: colors.text }]}>
                  Rakam: ₹{disputingTx.amount.toLocaleString("en-IN")}
                </Text>
                <Text style={[styles.disputeTxDate, { color: colors.textMuted }]}>
                  Date: {new Date(disputingTx.created_at).toLocaleDateString("en-IN")}
                </Text>
              </View>
            )}

            {/* Quick Reason Chips */}
            <View style={styles.quickChipsWrap}>
              {[
                "Maine yeh saman nahi liya tha",
                "Rupaye galat add kiye gaye hain",
                "Cash pehle hi chuka diya tha",
              ].map((chip) => (
                <Pressable
                  key={chip}
                  onPress={() => setDisputeReason(chip)}
                  style={[
                    styles.quickChip,
                    {
                      backgroundColor:
                        disputeReason === chip
                          ? isDark
                            ? "#7f1d1d"
                            : "#fee2e2"
                          : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      { color: disputeReason === chip ? "#dc2626" : colors.text },
                    ]}
                  >
                    {chip}
                  </Text>
                </Pressable>
              ))}
            </View>

            <TextInput
              style={[
                styles.disputeInput,
                { color: colors.text, borderColor: colors.surfaceBorder },
              ]}
              multiline
              numberOfLines={3}
              placeholder="Apna karan likhein ya upar se chunein..."
              placeholderTextColor={colors.textMuted}
              value={disputeReason}
              onChangeText={setDisputeReason}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setDisputeModalVisible(false)}
                style={[styles.promptCancelBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.promptCancelText, { color: colors.textMuted }]}>
                  Radd Karein
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitDispute}
                disabled={disputeMutation.isPending}
                style={[styles.promptSubmitBtn, { backgroundColor: "#dc2626" }]}
              >
                {disputeMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.promptSubmitText}>Aapatti Darj Karein</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* DIRECT UPI SETTLEMENT MODAL                                               */}
      {/* ========================================================================= */}
      <Modal
        visible={upiModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUpiModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.promptModal, { backgroundColor: colors.surface }]}>
            <View style={styles.promptHeader}>
              <CreditCard size={22} color="#16a34a" />
              <Text style={[styles.promptTitle, { color: colors.text }]}>
                Dukandar Ko UPI Se Chukaayein
              </Text>
            </View>
            <Text style={[styles.promptSub, { color: colors.textMuted }]}>
              {payingShop?.shop_name} ko sidhe UPI se payment karein aur reference number enter karein.
            </Text>

            <View style={[styles.upiShopBox, { backgroundColor: colors.surfaceBorder }]}>
              <Text style={[styles.upiShopLabel, { color: colors.textMuted }]}>
                Dukandar UPI ID:
              </Text>
              <Text style={[styles.upiShopId, { color: colors.text }]}>
                {payingShop?.shop_upi_id || `${payingShop?.shop_phone}@upi`}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Payment Amount (₹)</Text>
            <TextInput
              style={[styles.singleInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
              keyboardType="numeric"
              placeholder="Amount enter karein"
              placeholderTextColor={colors.textMuted}
              value={upiAmount}
              onChangeText={setUpiAmount}
            />

            {/* Launch UPI button */}
            <Pressable
              onPress={handleLaunchUpiApp}
              style={[styles.openUpiBtn, { backgroundColor: "#2563eb" }]}
            >
              <CreditCard size={16} color="#fff" />
              <Text style={styles.openUpiBtnText}>GooglePay / PhonePe / Paytm Kholein</Text>
            </Pressable>

            <Text style={[styles.inputLabel, { color: colors.text, marginTop: 12 }]}>
              12-Digit UPI Ref / UTR Number *
            </Text>
            <TextInput
              style={[styles.singleInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
              placeholder="e.g. 425619876543"
              placeholderTextColor={colors.textMuted}
              value={upiUtr}
              onChangeText={setUpiUtr}
            />

            <View style={styles.promptActions}>
              <Pressable
                onPress={() => setUpiModalVisible(false)}
                style={[styles.promptCancelBtn, { borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.promptCancelText, { color: colors.textMuted }]}>
                  Cancel
                </Text>
              </Pressable>

              <Pressable
                onPress={handleSubmitUpiProof}
                disabled={upiMutation.isPending}
                style={[styles.promptSubmitBtn, { backgroundColor: "#16a34a" }]}
              >
                {upiMutation.isPending ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.promptSubmitText}>Payment Jama Karein</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ========================================================================= */}
      {/* IN-APP PDF MODAL FOR STATEMENT                                            */}
      {/* ========================================================================= */}
      {selectedKhataId && (
        <InAppPDFModal
          visible={pdfModalVisible}
          title={`${selectedShop?.shop_name || "Khata"} Statement`}
          pdfUrl={Endpoints.CUSTOMER_KHATA.STATEMENT_PDF(selectedKhataId)}
          filename={`Khata_Statement_${selectedShop?.shop_name || "Dukan"}.pdf`}
          onClose={() => setPdfModalVisible(false)}
        />
      )}
      <CustomerKhataQRModal
        visible={customerQRVisible}
        onClose={() => setCustomerQRVisible(false)}
        customerName={user?.full_name || passbook?.customer_name || "Mera Khata"}
        customerPhone={user?.phone || ""}
      />

      <CreditOTPProtectionModal
        visible={otpProtectionModalVisible}
        onClose={() => setOtpProtectionModalVisible(false)}
        khataId={protectingShop?.khata_id || selectedKhataId || ""}
        shopName={protectingShop?.shop_name || selectedShop?.shop_name || "Dukan"}
        initialRequired={protectingShop?.credit_otp_required}
        initialThreshold={protectingShop?.credit_otp_threshold}
        onUpdated={() => {
          refetch();
          refetchPassbook();
        }}
      />
          {/* Pillar 3: Parchi Modal */}
      <ParchiViewerModal
        visible={!!selectedParchiTx}
        onClose={() => setSelectedParchiTx(null)}
        parchiUrl={selectedParchiTx?.parchi_image_url}
        itemsSummary={selectedParchiTx?.items_summary}
                amount={selectedParchiTx?.amount}
        date={selectedParchiTx?.created_at}
      />

      {/* Pillar 4: Customer Promise To Pay Modal */}
      {selectedShop && (
        <PromiseToPayModal
          visible={ptpModalVisible}
          onClose={() => setPtpModalVisible(false)}
          currentBalance={selectedShop.current_balance}
          initialPromiseDate={selectedShop.promise_to_pay_date}
          initialTarget={selectedShop.installment_target}
          customerName={selectedShop.shop_name}
          onSave={async (promiseDate: string, target: number) => {
            await customerPtpMutation.mutateAsync({
              promise_to_pay_date: promiseDate,
              installment_target: target,
            });
            setPtpModalVisible(false);
            refetchPassbook();
            refetch();
            Alert.alert("Dukandar ko Suchit Kiya", "Aapki chukane ki tarikh dukandar ke khata me darj ho gayi hai.");
          }}
        />
      )}
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
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  qrHeaderBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  qrHeaderBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  otpShieldBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
  },
  otpShieldBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369a1",
  },
  otpCardBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  otpCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  otpCardTitle: {
    fontSize: 13,
    fontWeight: "700",
  },
  otpCardSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  resolvedAcceptedBadge: {
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resolvedRejectedBadge: {
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resolvedBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#166534",
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#16a34a",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
    gap: 16,
  },
  overviewCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  overviewTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overviewLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  overviewAmount: {
    fontSize: 28,
    fontWeight: "900",
    marginTop: 4,
  },
  overviewIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },
  overviewDivider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.06)",
    marginVertical: 12,
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
    gap: 8,
    paddingHorizontal: 12,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
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
  emptyCard: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  shopCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  shopCardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  shopIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  shopInfoCol: {
    flex: 1,
    gap: 2,
  },
  shopName: {
    fontSize: 15,
    fontWeight: "800",
  },
  shopAddress: {
    fontSize: 12,
  },
  shopPhone: {
    fontSize: 12,
  },
  balanceBadgeWrap: {
    alignItems: "flex-end",
  },
  balanceBadgeLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  balanceBadgeAmount: {
    fontSize: 18,
    fontWeight: "900",
    marginTop: 2,
  },
  creditLimitWrap: {
    gap: 4,
  },
  creditLimitLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  creditLimitText: {
    fontSize: 11,
  },
  progressBarTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 6,
    borderRadius: 3,
  },
  shopCardActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: "700",
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  payBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  modalHeaderInfo: {
    flex: 1,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  modalHeaderSub: {
    fontSize: 11,
  },
  pdfIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  passbookScroll: {
    padding: 16,
    paddingBottom: 40,
    gap: 12,
  },
  closureAlertBanner: {
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "flex-start",
  },
  closureAlertTitle: {
    fontSize: 14,
    fontWeight: "800",
  },
  closureAlertSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  otpPill: {
    alignSelf: "flex-start",
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 4,
  },
  otpPillText: {
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 4,
    color: "#0f172a",
  },
  passbookBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  passbookBannerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bannerLabel: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  bannerAmount: {
    fontSize: 24,
    fontWeight: "900",
    marginTop: 2,
  },
  payBannerBtn: {
    paddingHorizontal: 14,
  },
  bannerSubText: {
    fontSize: 11,
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
  noTxCard: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  noTxText: {
    fontSize: 13,
    textAlign: "center",
  },
  txCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  txHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  txTypeRow: {
    flexDirection: "row",
    alignItems: "center",
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
  txAmountCol: {
    alignItems: "flex-end",
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
  txBalanceAfter: {
    fontSize: 11,
  },
  txNotesBox: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
  },
  txNotesText: {
    fontSize: 12,
  },
  txBillNo: {
    fontSize: 11,
  },
  txUpiRef: {
    fontSize: 11,
  },
  txFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 2,
  },
  confirmedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  confirmedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#16a34a",
  },
  disputeAlertWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },
  disputeAlertText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ef4444",
  },
  flagDisputeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#fee2e2",
  },
  flagDisputeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#dc2626",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 16,
  },
  promptModal: {
    borderRadius: 18,
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
  disputeTxSummary: {
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  disputeTxAmount: {
    fontSize: 13,
    fontWeight: "700",
  },
  disputeTxDate: {
    fontSize: 11,
  },
  quickChipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  disputeInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    fontSize: 13,
    textAlignVertical: "top",
    minHeight: 70,
  },
  promptActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 6,
  },
  promptCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  promptCancelText: {
    fontSize: 13,
    fontWeight: "700",
  },
  promptSubmitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  promptSubmitText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  upiShopBox: {
    padding: 10,
    borderRadius: 8,
    gap: 2,
  },
  upiShopLabel: {
    fontSize: 11,
  },
  upiShopId: {
    fontSize: 14,
    fontWeight: "700",
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "700",
  },
  singleInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 14,
  },
  openUpiBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  openUpiBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
