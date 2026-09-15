import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { InAppPDFModal } from "@/components/InAppPDFModal";
import { playSoundboxTone } from "@/utils/soundbox";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import { ParchiViewerModal } from "@/features/khata/components/ParchiViewerModal";
import { PromiseToPayModal } from "@/features/khata/components/PromiseToPayModal";
import * as ImagePicker from "expo-image-picker";
import { KhataCustomer, CustomerKhataHistoryResponse } from "../types";
import {
  ArrowLeft,
  ArrowDownLeft,
  ArrowUpRight,
  BookOpen,
  FileText,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  Receipt,
  Lock,
  CheckCircle2,
  X,
  Phone,
  RotateCcw,
  Check,
  AlertCircle,
  HelpCircle,
  Camera,
  Calendar,
  Clock,
  Paperclip,
  Eye,
} from "lucide-react-native";

interface KhataPannaViewProps {
  visible: boolean;
  customer: KhataCustomer | null;
  shopName?: string;
  onClose: () => void;
  onRefreshList?: () => void;
}

export const KhataPannaView: React.FC<KhataPannaViewProps> = ({
  visible,
  customer,
  shopName = "Hamari Dukan",
  onClose,
  onRefreshList,
}) => {
  const { colors, isDark } = useThemeColor();

  const [history, setHistory] = useState<CustomerKhataHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Quick entry inputs (जैसे कॉपी पे लिखते हैं)
  const [entryAmount, setEntryAmount] = useState("");
  const [entryNotes, setEntryNotes] = useState("");
  const [entryBillNo, setEntryBillNo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Modals
  const [pdfModalVisible, setPdfModalVisible] = useState(false);
  const [closureModalVisible, setClosureModalVisible] = useState(false);
  const [closureOtpInput, setClosureOtpInput] = useState("");
  const [isClosurePending, setIsClosurePending] = useState(false);
  const [closureStatus, setClosureStatus] = useState<string>("ACTIVE");
  const [closureCustomerOTP, setClosureCustomerOTP] = useState<string>("");

  // Typo Reversal Modal
  const [reversalModalVisible, setReversalModalVisible] = useState(false);
  const [reversingTx, setReversingTx] = useState<any | null>(null);
  const [reversalReason, setReversalReason] = useState("");
  const [isReversing, setIsReversing] = useState(false);

  // Dispute Resolution Modal
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [resolvingTx, setResolvingTx] = useState<any | null>(null);
  const [disputeAction, setDisputeAction] = useState<"ACCEPT" | "REJECT">("ACCEPT");
  const [disputeNotes, setDisputeNotes] = useState("");
  const [isResolvingDispute, setIsResolvingDispute] = useState(false);

  // Parchi & Promise to Pay states
  const [parchiPhotoUri, setParchiPhotoUri] = useState<string | null>(null);
  const [parchiViewerVisible, setParchiViewerVisible] = useState(false);
  const [viewingParchiTx, setViewingParchiTx] = useState<any | null>(null);
  const [ptpModalVisible, setPtpModalVisible] = useState(false);

  const fetchHistory = async () => {
    if (!customer?.customer_mobile) return;
    setIsLoading(true);
    try {
      const res = await apiClient.get(
        Endpoints.MERCHANT.KHATA_STATEMENT(customer.customer_mobile)
      );
      const data = res.data?.data;
      if (data) {
        setHistory(data);
        if (data.customer) {
          setClosureStatus(data.customer.closure_status || "ACTIVE");
          if (data.customer.closure_otp) {
            setClosureCustomerOTP(data.customer.closure_otp);
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (visible && customer?.customer_mobile) {
      setClosureStatus(customer.closure_status || "ACTIVE");
      setClosureCustomerOTP(customer.closure_otp || "");
      fetchHistory();
    } else {
      setHistory(null);
      setEntryAmount("");
      setEntryNotes("");
      setEntryBillNo("");
      setParchiPhotoUri(null);
    }
  }, [visible, customer?.customer_mobile]);

  if (!visible || !customer) return null;

  const currentBal = history?.current_balance ?? customer.current_balance;

  // 1. Direct Add Credit (Udhar Diya +)
  const handleSnapParchi = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Parchi photo khinchne ke liye camera permission chahiye.");
        return;
      }
      const res = await ImagePicker.launchCameraAsync({
        quality: 0.4,
        base64: true,
      });
      if (!res.canceled && res.assets && res.assets.length > 0) {
        const asset = res.assets[0];
        const uri = asset.base64 ? `data:image/jpeg;base64,${asset.base64}` : asset.uri;
        setParchiPhotoUri(uri);
      }
    } catch {
      // ignore
    }
  };

  const handleSavePromiseToPay = async (promiseDate: string, target: number) => {
    const targetKhataId = customer.id || (history as any)?.customer?.id;
    if (!targetKhataId) return;
    await apiClient.post(Endpoints.MERCHANT.KHATA_PROMISE_DATE(targetKhataId), {
      promise_date: promiseDate,
      installment_target: target,
    });
    fetchHistory();
    onRefreshList?.();
  };

  const handleGiveCredit = async () => {
    const amt = parseFloat(entryAmount);
    if (!amt || amt <= 0) {
      Alert.alert("Amount Required", "Kripya sahi rakam (amount ₹) enter karein.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(Endpoints.MERCHANT.KHATA, {
        customer_name: customer.customer_name,
        customer_mobile: customer.customer_mobile,
        amount: amt,
        notes: entryNotes.trim(),
        bill_number: entryBillNo.trim(),
        parchi_image_url: parchiPhotoUri || undefined,
        items_summary: entryNotes.trim() || undefined,
      });
      playSoundboxTone("credit");
      setEntryAmount("");
      setEntryNotes("");
      setEntryBillNo("");
      await fetchHistory();
      onRefreshList?.();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Udhar record nahi ho paya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Direct Add Payment (Jama Liya -)
  const handleReceivePayment = async () => {
    const amt = parseFloat(entryAmount);
    if (!amt || amt <= 0) {
      Alert.alert("Amount Required", "Kripya sahi payment amount enter karein.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post(Endpoints.MERCHANT.KHATA_PAYMENT(customer.customer_mobile), {
        customer_name: customer.customer_name,
        amount: amt,
        payment_mode: "cash",
        notes: entryNotes.trim() || "Payment received at counter",
      });
      playSoundboxTone("payment");
      setEntryAmount("");
      setEntryNotes("");
      setEntryBillNo("");
      await fetchHistory();
      onRefreshList?.();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Payment record nahi ho paya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Typo Reversal Protocol
  const handleOpenReversalPrompt = (tx: any) => {
    setReversingTx(tx);
    setReversalReason("");
    setReversalModalVisible(true);
  };

  const handleConfirmReversal = async () => {
    const targetKhataId = customer.id || (history as any)?.customer?.id;
    if (!targetKhataId || !reversingTx?.id) {
      Alert.alert("Error", "Khata record id prapt nahi hua. Kripya refresh karein.");
      return;
    }
    if (!reversalReason.trim()) {
      Alert.alert("Reason Required", "Kripya galti sudharne ka karan likhein (e.g. Galat amount / Duplicate tap).");
      return;
    }

    setIsReversing(true);
    try {
      await apiClient.post(
        Endpoints.MERCHANT.KHATA_REVERSE_TX(targetKhataId, reversingTx.id),
        { reason: reversalReason.trim() }
      );
      playSoundboxTone("reversal");
      Alert.alert("Galti Sudhari Gayi", "Transaction ka official Reversal entry record kar diya gaya hai aur balance theek ho gaya hai.");
      setReversalModalVisible(false);
      setReversingTx(null);
      setReversalReason("");
      await fetchHistory();
      onRefreshList?.();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Reversal entry record nahi ho payi.");
    } finally {
      setIsReversing(false);
    }
  };

  // 4. Dispute Resolution
  const handleOpenDisputeResolve = (tx: any, action: "ACCEPT" | "REJECT") => {
    setResolvingTx(tx);
    setDisputeAction(action);
    setDisputeNotes(action === "ACCEPT" ? "Customer dispute claim verified & accepted" : "Bill verified at counter");
    setDisputeModalVisible(true);
  };

  const handleConfirmDisputeResolution = async () => {
    const targetKhataId = customer.id || (history as any)?.customer?.id;
    if (!targetKhataId || !resolvingTx?.id) return;

    setIsResolvingDispute(true);
    try {
      await apiClient.post(
        Endpoints.MERCHANT.KHATA_RESOLVE_DISPUTE(targetKhataId, resolvingTx.id),
        {
          action: disputeAction,
          notes: disputeNotes.trim(),
        }
      );
      playSoundboxTone(disputeAction === "ACCEPT" ? "reversal" : "payment");
      Alert.alert(
        "Faisla Darj Hua",
        disputeAction === "ACCEPT"
          ? "Customer ka dispute accept kar entry reverse kar di gayi hai."
          : "Dispute reject kar entry khata me sahi paayi gayi."
      );
      setDisputeModalVisible(false);
      setResolvingTx(null);
      setDisputeNotes("");
      await fetchHistory();
      onRefreshList?.();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Dispute resolve nahi ho paya.");
    } finally {
      setIsResolvingDispute(false);
    }
  };

  // 5. WhatsApp Reminder
  const handleWhatsAppReminder = () => {
    const message = `Namaste ${customer.customer_name} ji, ${shopName} se aapka khata baki hisab ${formatCurrency(currentBal)} hai. Kripya samay par chukta karein. Dhanyawad!`;
    const cleanPhone = customer.customer_mobile.replace(/[^0-9]/g, "");
    const formattedPhone = cleanPhone.startsWith("91") ? cleanPhone : `91${cleanPhone}`;
    const url = `whatsapp://send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        Linking.openURL(`https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`);
      }
    });
  };

  // 6. Request Closure (Dual-OTP)
  const handleRequestClosure = async () => {
    if (currentBal > 0) {
      Alert.alert("Balance Pending", "Khata tabhi band ho sakta hai jab baki hisab ₹0 ho. Kripya pehle baki payment clear karein.");
      return;
    }

    setIsClosurePending(true);
    try {
      await apiClient.post(Endpoints.MERCHANT.KHATA_REQUEST_CLOSURE(customer.id));
      Alert.alert(
        "Closure OTP Sent",
        "Khata band karne ka OTP customer ke Mera Khata passbook par bhej diya gaya hai. Customer se 6-digit OTP puchhkar yahan enter karein."
      );
      setClosureStatus("PENDING_OTP");
      setClosureModalVisible(true);
      fetchHistory();
      onRefreshList?.();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Closure request initiate nahi ho paya.");
    } finally {
      setIsClosurePending(false);
    }
  };

  // 7. Verify Closure OTP
  const handleVerifyClosureOTP = async () => {
    if (!closureOtpInput.trim() || closureOtpInput.trim().length !== 6) {
      Alert.alert("OTP Required", "Kripya customer se mila 6-digit OTP enter karein.");
      return;
    }

    setIsClosurePending(true);
    try {
      await apiClient.post(Endpoints.MERCHANT.KHATA_VERIFY_CLOSURE(customer.id), {
        otp: closureOtpInput.trim(),
      });
      Alert.alert("Khata Closed", "Khata safaltapoorvak band (Archive) kar diya gaya hai. Dono paksho ka hisab safe hai.");
      setClosureStatus("CLOSED");
      setClosureModalVisible(false);
      setClosureOtpInput("");
      fetchHistory();
      onRefreshList?.();
    } catch (err: any) {
      Alert.alert("Verification Failed", err?.message || "Galat OTP! Kripya sahi OTP enter karein.");
    } finally {
      setIsClosurePending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top Panna Header */}
        <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.backBtn, { backgroundColor: colors.surfaceBorder }]}
          >
            <ArrowLeft size={20} color={colors.text} />
          </Pressable>

          <View style={styles.headerTitleWrap}>
            <View style={styles.nameRow}>
              <Text style={[styles.customerName, { color: colors.text }]} numberOfLines={1}>
                {customer.customer_name}
              </Text>
              <TrustScoreBadge
                score={customer.trust_score || (history as any)?.customer?.trust_score || 750}
                badge={customer.trust_badge || (history as any)?.customer?.trust_badge || "TRUSTED"}
                size="sm"
              />
              {customer.is_registered && (
                <View style={styles.verifiedBadge}>
                  <ShieldCheck size={12} color="#16a34a" />
                  <Text style={styles.verifiedBadgeText}>Shopsilo App</Text>
                </View>
              )}
            </View>
            <Text style={[styles.customerMobile, { color: colors.textMuted }]}>
              📞 {customer.customer_mobile}
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            onPress={() => setPdfModalVisible(true)}
            style={[styles.pdfIconBtn, { backgroundColor: "#eff6ff" }]}
          >
            <FileText size={18} color="#2563eb" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Big Balance Banner */}
          <View
            style={[
              styles.balanceBanner,
              {
                backgroundColor: currentBal > 0 ? (isDark ? "#2a1515" : "#fef2f2") : (isDark ? "#14291a" : "#f0fdf4"),
                borderColor: currentBal > 0 ? (isDark ? "#451a1a" : "#fecaca") : (isDark ? "#166534" : "#bbf7d0"),
              },
            ]}
          >
            <View style={styles.balanceRow}>
              <View>
                <Text style={[styles.balanceLabel, { color: currentBal > 0 ? "#dc2626" : "#16a34a" }]}>
                  {currentBal > 0 ? "KUL BAKI (CUSTOMER OWES)" : "HISAAB CHUKTA (ALL CLEAR)"}
                </Text>
                <Text style={[styles.balanceAmount, { color: currentBal > 0 ? "#dc2626" : "#16a34a" }]}>
                  {formatCurrency(currentBal)}
                </Text>
              </View>

              {closureStatus === "CLOSED" && (
                <View style={styles.closedBadge}>
                  <Lock size={12} color="#64748b" />
                  <Text style={styles.closedBadgeText}>CLOSED</Text>
                </View>
              )}
            </View>

            {/* Promise to Pay (Kisht Target) */}
            <Pressable
              accessibilityRole="button"
              onPress={() => setPtpModalVisible(true)}
              style={[styles.ptpBanner, { backgroundColor: isDark ? "#1e293b" : "#eff6ff", borderColor: colors.surfaceBorder }]}
            >
              <View style={styles.ptpLeft}>
                <Calendar size={14} color={colors.primary} />
                <View>
                  <Text style={[styles.ptpTitle, { color: colors.text }]}>
                    {(history as any)?.customer?.promise_to_pay_date || customer.promise_to_pay_date
                      ? `Promise: ${new Date((history as any)?.customer?.promise_to_pay_date || customer.promise_to_pay_date!).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}`
                      : "Promise to Pay (Tareekh Set Karein)"}
                  </Text>
                  <Text style={[styles.ptpSub, { color: colors.textMuted }]}>
                    {customer.installment_target && customer.installment_target > 0
                      ? `Target Kisht: ${formatCurrency(customer.installment_target)}`
                      : "Dono paksho ke beech target repayment date"}
                  </Text>
                </View>
              </View>
              <View style={styles.ptpActionBadge}>
                <Text style={styles.ptpActionText}>
                  {(history as any)?.customer?.promise_to_pay_date || customer.promise_to_pay_date ? "Badlein" : "+ Set"}
                </Text>
              </View>
            </Pressable>

            {/* Credit Limit & OTP Info */}
            <View style={styles.balanceMetaRow}>
              {customer.credit_limit > 0 && (
                <Text style={[styles.creditLimitText, { color: colors.textMuted }]}>
                  Seema: {formatCurrency(customer.credit_limit)}
                </Text>
              )}
              {customer.credit_otp_required && (
                <View style={styles.otpProtectedBadge}>
                  <ShieldCheck size={11} color="#0284c7" />
                  <Text style={styles.otpProtectedBadgeText}>
                    OTP Suraksha &gt; {formatCurrency(customer.credit_otp_threshold || 1000)}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* QUICK-ENTRY ROW (जैसे कॉपी पे लिखते हैं) */}
          {closureStatus !== "CLOSED" && (
            <View style={[styles.quickEntryCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                Nayi Entry Likhein (Quick Panna Entry)
              </Text>

              <View style={styles.entryRowInputs}>
                <TextInput
                  style={[styles.amountInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                  placeholder="₹ Rakam"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={entryAmount}
                  onChangeText={setEntryAmount}
                />

                <TextInput
                  style={[styles.notesInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                  placeholder="Samaan / Vivaran (e.g. 2 packet dudh, chini)"
                  placeholderTextColor={colors.textMuted}
                  value={entryNotes}
                  onChangeText={setEntryNotes}
                />
              </View>

              <View style={styles.optionalRow}>
                <TextInput
                  style={[styles.billInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                  placeholder="Parchi / Bill # (optional)"
                  placeholderTextColor={colors.textMuted}
                  value={entryBillNo}
                  onChangeText={setEntryBillNo}
                />

                <Pressable
                  accessibilityRole="button"
                  onPress={handleSnapParchi}
                  style={[
                    styles.snapParchiBtn,
                    {
                      backgroundColor: parchiPhotoUri ? "#dcfce7" : isDark ? "#1e293b" : "#f1f5f9",
                      borderColor: parchiPhotoUri ? "#16a34a" : colors.surfaceBorder,
                    },
                  ]}
                >
                  <Camera size={14} color={parchiPhotoUri ? "#16a34a" : colors.text} />
                  <Text
                    style={[
                      styles.snapParchiText,
                      { color: parchiPhotoUri ? "#16a34a" : colors.text },
                    ]}
                  >
                    {parchiPhotoUri ? "Photo Attached ✓" : "+ Parchi Photo"}
                  </Text>
                </Pressable>
              </View>

              {/* 2 Big Action Buttons */}
              <View style={styles.actionButtonsRow}>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleGiveCredit}
                  disabled={isSubmitting}
                  style={[styles.giveCreditBtn, { backgroundColor: "#dc2626" }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <ArrowDownLeft size={16} color="#fff" />
                      <Text style={styles.btnText}>Udhar Diya (+)</Text>
                    </>
                  )}
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  onPress={handleReceivePayment}
                  disabled={isSubmitting}
                  style={[styles.receivePaymentBtn, { backgroundColor: "#16a34a" }]}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <ArrowUpRight size={16} color="#fff" />
                      <Text style={styles.btnText}>Jama Liya (-)</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}

          {/* TRANSACTIONS LEDGER TIMELINE */}
          <View style={styles.timelineHeader}>
            <Text style={[styles.timelineTitle, { color: colors.text }]}>
              Khata Passbook Entries ({history?.transactions?.length ?? 0})
            </Text>
            <Text style={[styles.timelineSub, { color: colors.textMuted }]}>
              Customer ke sath live dual-sync ledger
            </Text>
          </View>

          {isLoading ? (
            <ActivityIndicator style={{ marginVertical: 20 }} color={colors.primary} />
          ) : !history?.transactions || history.transactions.length === 0 ? (
            <View style={styles.emptyCard}>
              <Receipt size={32} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                Is panna par abhi koi entry nahi hai. Upar diye form se pehla hisab likhein.
              </Text>
            </View>
          ) : (
            history.transactions.map((tx: any) => {
              const isReversal = tx.transaction_type === "reversal" || tx.type === "REVERSAL" || !!tx.reversal_of_id;
              const isCredit = (tx.transaction_type === "credit" || tx.type === "GIVE_CREDIT") && !isReversal;
              const isDisputed = tx.status === "DISPUTED";
              const isResolvedAccepted = tx.status === "RESOLVED_ACCEPTED";
              const isResolvedRejected = tx.status === "RESOLVED_REJECTED";

              return (
                <View
                  key={tx.id}
                  style={[
                    styles.txRow,
                    {
                      backgroundColor: colors.surface,
                      borderColor: isDisputed ? "#ef4444" : isReversal ? "#f59e0b" : colors.surfaceBorder,
                    },
                  ]}
                >
                  <View style={styles.txMainRow}>
                    <View style={styles.txLeft}>
                      <View
                        style={[
                          styles.txIconWrap,
                          {
                            backgroundColor: isReversal
                              ? "#fef3c7"
                              : isCredit
                              ? "#fee2e2"
                              : "#dcfce7",
                          },
                        ]}
                      >
                        {isReversal ? (
                          <RotateCcw size={16} color="#d97706" />
                        ) : isCredit ? (
                          <ArrowDownLeft size={16} color="#dc2626" />
                        ) : (
                          <ArrowUpRight size={16} color="#16a34a" />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <Text style={[styles.txTypeText, { color: colors.text }]}>
                            {isReversal
                              ? "Galti Sudhar (Reversal)"
                              : isCredit
                              ? "Udhar Diya (Debit)"
                              : "Jama Liya (Credit)"}
                          </Text>
                          {isResolvedAccepted && (
                            <View style={styles.resolvedAcceptedBadge}>
                              <Text style={styles.resolvedBadgeText}>Claim Accepted</Text>
                            </View>
                          )}
                          {isResolvedRejected && (
                            <View style={styles.resolvedRejectedBadge}>
                              <Text style={styles.resolvedBadgeText}>Entry Verified</Text>
                            </View>
                          )}
                        </View>

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
                          <Text style={[styles.txBillNo, { color: colors.textMuted }]}>
                            Bill #{tx.bill_number}
                          </Text>
                        )}
                        {(!!tx.parchi_image_url || !!tx.items_summary) && (
                          <Pressable
                            accessibilityRole="button"
                            onPress={() => {
                              setViewingParchiTx(tx);
                              setParchiViewerVisible(true);
                            }}
                            style={styles.viewParchiLink}
                          >
                            <Eye size={12} color="#2563eb" />
                            <Text style={styles.viewParchiLinkText}>Parchi / Samaan Dekhein</Text>
                          </Pressable>
                        )}
                      </View>
                    </View>

                    <View style={styles.txRight}>
                      <Text
                        style={[
                          styles.txAmount,
                          {
                            color: isReversal
                              ? "#d97706"
                              : isCredit
                              ? "#dc2626"
                              : "#16a34a",
                          },
                        ]}
                      >
                        {isReversal ? "↺ " : isCredit ? "+₹" : "-₹"}
                        {tx.amount.toLocaleString("en-IN")}
                      </Text>
                      {tx.balance_after != null && (
                        <Text style={[styles.txBalAfter, { color: colors.textMuted }]}>
                          Baki: ₹{tx.balance_after.toLocaleString("en-IN")}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Typo Correction Action Button */}
                  {!isReversal && !isDisputed && closureStatus !== "CLOSED" && (
                    <View style={styles.txFooterRow}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={() => handleOpenReversalPrompt(tx)}
                        style={[styles.reversalPromptBtn, { backgroundColor: isDark ? "#1e293b" : "#f1f5f9" }]}
                      >
                        <RotateCcw size={12} color={colors.textMuted} />
                        <Text style={[styles.reversalPromptText, { color: colors.textMuted }]}>
                          Galti Sudharein
                        </Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Dispute Banner with Merchant Resolution Options */}
                  {isDisputed && (
                    <View style={styles.disputeSection}>
                      <View style={styles.disputeNotice}>
                        <AlertTriangle size={14} color="#ef4444" />
                        <Text style={styles.disputeNoticeText}>
                          Customer Aappatti: {tx.dispute_reason || "Dispute raised by customer"}
                        </Text>
                      </View>

                      <View style={styles.disputeActionButtons}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenDisputeResolve(tx, "ACCEPT")}
                          style={[styles.disputeAcceptBtn, { backgroundColor: "#16a34a" }]}
                        >
                          <Check size={14} color="#fff" />
                          <Text style={styles.disputeActionBtnText}>Claim Manzoor (Reverse)</Text>
                        </Pressable>

                        <Pressable
                          accessibilityRole="button"
                          onPress={() => handleOpenDisputeResolve(tx, "REJECT")}
                          style={[styles.disputeRejectBtn, { borderColor: "#ef4444" }]}
                        >
                          <X size={14} color="#ef4444" />
                          <Text style={[styles.disputeActionBtnText, { color: "#ef4444" }]}>Entry Sahi Hai</Text>
                        </Pressable>
                      </View>
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* BOTTOM ACTIONS (REMINDER, PDF, DUAL-OTP CLOSURE) */}
          <View style={styles.bottomToolbar}>
            {currentBal > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={handleWhatsAppReminder}
                style={[styles.toolBtn, { backgroundColor: "#22c55e" }]}
              >
                <MessageCircle size={16} color="#fff" />
                <Text style={styles.toolBtnText}>WhatsApp Reminder</Text>
              </Pressable>
            )}

            <Pressable
              accessibilityRole="button"
              onPress={() => setPdfModalVisible(true)}
              style={[styles.toolBtn, { backgroundColor: "#3b82f6" }]}
            >
              <FileText size={16} color="#fff" />
              <Text style={styles.toolBtnText}>Statement PDF</Text>
            </Pressable>

            {/* Dual-OTP Closure Button */}
            <Pressable
              accessibilityRole="button"
              onPress={handleRequestClosure}
              disabled={isClosurePending || closureStatus === "CLOSED"}
              style={[
                styles.toolBtn,
                {
                  backgroundColor: closureStatus === "CLOSED" ? "#64748b" : "#475569",
                  opacity: currentBal > 0 ? 0.6 : 1,
                },
              ]}
            >
              <Lock size={16} color="#fff" />
              <Text style={styles.toolBtnText}>
                {closureStatus === "CLOSED"
                  ? "Khata Band Hai (Closed)"
                  : closureStatus === "PENDING_OTP"
                  ? "Closure OTP Verify Karein"
                  : "Khata Band Karein (Dual-OTP)"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>

        {/* Typo Reversal Reason Modal */}
        <Modal
          visible={reversalModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setReversalModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
              <View style={styles.promptHeader}>
                <RotateCcw size={20} color="#d97706" />
                <Text style={[styles.promptTitle, { color: colors.text }]}>
                  Galti Sudhar Entry (Reversal)
                </Text>
              </View>
              <Text style={[styles.promptSub, { color: colors.textMuted }]}>
                Is transaction ki rakam ({reversingTx ? formatCurrency(reversingTx.amount) : ""}) ka official reversal passbook me judega aur balance theek ho jayega.
              </Text>

              <TextInput
                style={[
                  styles.notesInput,
                  { color: colors.text, borderColor: colors.surfaceBorder, height: 46, borderRadius: 10 },
                ]}
                placeholder="Sudhar ka karan (e.g. Galat rakam likh di thi)"
                placeholderTextColor={colors.textMuted}
                value={reversalReason}
                onChangeText={setReversalReason}
              />

              <View style={styles.promptActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setReversalModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleConfirmReversal}
                  disabled={isReversing}
                  style={[styles.confirmBtn, { backgroundColor: "#d97706" }]}
                >
                  {isReversing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmText}>Confirm Reversal</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Dispute Resolution Modal */}
        <Modal
          visible={disputeModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDisputeModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
              <View style={styles.promptHeader}>
                {disputeAction === "ACCEPT" ? (
                  <CheckCircle2 size={20} color="#16a34a" />
                ) : (
                  <AlertCircle size={20} color="#ef4444" />
                )}
                <Text style={[styles.promptTitle, { color: colors.text }]}>
                  {disputeAction === "ACCEPT" ? "Claim Manzoor Karein" : "Entry Barkarar Rakhein"}
                </Text>
              </View>
              <Text style={[styles.promptSub, { color: colors.textMuted }]}>
                {disputeAction === "ACCEPT"
                  ? "Customer ka claim accept karne par ye entry automatically reverse ho jayegi aur balance ghat jayega."
                  : "Agar entry counter par sahi thi, to apna note likhkar is dispute ko close karein."}
              </Text>

              <TextInput
                style={[
                  styles.notesInput,
                  { color: colors.text, borderColor: colors.surfaceBorder, height: 46, borderRadius: 10 },
                ]}
                placeholder="Dukandar ka note / Vivaran"
                placeholderTextColor={colors.textMuted}
                value={disputeNotes}
                onChangeText={setDisputeNotes}
              />

              <View style={styles.promptActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setDisputeModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleConfirmDisputeResolution}
                  disabled={isResolvingDispute}
                  style={[
                    styles.confirmBtn,
                    { backgroundColor: disputeAction === "ACCEPT" ? "#16a34a" : "#ef4444" },
                  ]}
                >
                  {isResolvingDispute ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmText}>
                      {disputeAction === "ACCEPT" ? "Accept & Reverse" : "Keep Entry"}
                    </Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* Dual-OTP Closure Modal */}
        <Modal
          visible={closureModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setClosureModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={[styles.promptCard, { backgroundColor: colors.surface }]}>
              <View style={styles.promptHeader}>
                <Lock size={20} color="#dc2626" />
                <Text style={[styles.promptTitle, { color: colors.text }]}>
                  Customer OTP Enter Karein
                </Text>
              </View>
              <Text style={[styles.promptSub, { color: colors.textMuted }]}>
                Customer se unke phone / Shopsilo app par mila 6-digit OTP puchhein:
              </Text>

              <TextInput
                style={[
                  styles.otpInput,
                  { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background },
                ]}
                placeholder="000000"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                maxLength={6}
                value={closureOtpInput}
                onChangeText={setClosureOtpInput}
              />

              <View style={styles.promptActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setClosureModalVisible(false)}
                  style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
                >
                  <Text style={[styles.cancelText, { color: colors.text }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={handleVerifyClosureOTP}
                  disabled={isClosurePending}
                  style={[styles.confirmBtn, { backgroundColor: "#16a34a" }]}
                >
                  {isClosurePending ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.confirmText}>Verify &amp; Close Khata</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>

        {/* In-App PDF Modal */}
        <ParchiViewerModal
          visible={parchiViewerVisible}
          onClose={() => {
            setParchiViewerVisible(false);
            setViewingParchiTx(null);
          }}
          parchiUrl={viewingParchiTx?.parchi_image_url}
          itemsSummary={viewingParchiTx?.items_summary}
          billNumber={viewingParchiTx?.bill_number}
          amount={viewingParchiTx?.amount}
          date={viewingParchiTx?.created_at}
          customerName={customer.customer_name}
        />

        <PromiseToPayModal
          visible={ptpModalVisible}
          onClose={() => setPtpModalVisible(false)}
          customerName={customer.customer_name}
          currentBalance={currentBal}
          initialPromiseDate={(history as any)?.customer?.promise_to_pay_date || customer.promise_to_pay_date}
          initialTarget={customer.installment_target}
          onSave={handleSavePromiseToPay}
        />

        <InAppPDFModal
          visible={pdfModalVisible}
          onClose={() => setPdfModalVisible(false)}
          pdfUrl={Endpoints.MERCHANT.KHATA_STATEMENT_PDF(customer.customer_mobile)}
          title={`Khata Statement - ${customer.customer_name}`}
          filename={`Khata_${customer.customer_name.replace(/\s+/g, "_")}_${customer.customer_mobile}.pdf`}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

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
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "800",
  },
  customerMobile: {
    fontSize: 12,
    marginTop: 1,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#16a34a",
  },
  pdfIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  balanceBanner: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 6,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  balanceLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  balanceAmount: {
    fontSize: 26,
    fontWeight: "900",
    marginTop: 2,
  },
  closedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e2e8f0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  closedBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
  },
  ptpBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginTop: 6,
  },
  ptpLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  ptpTitle: {
    fontSize: 12,
    fontWeight: "700",
  },
  ptpSub: {
    fontSize: 10,
    marginTop: 1,
  },
  ptpActionBadge: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ptpActionText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "700",
  },
  snapParchiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    marginLeft: 8,
  },
  snapParchiText: {
    fontSize: 11,
    fontWeight: "700",
  },
  viewParchiLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    backgroundColor: "#eff6ff",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  viewParchiLinkText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#2563eb",
  },
  balanceMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  creditLimitText: {
    fontSize: 11,
  },
  otpProtectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  otpProtectedBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#0369a1",
  },
  quickEntryCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  entryRowInputs: {
    flexDirection: "row",
    gap: 8,
  },
  amountInput: {
    width: 100,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 14,
    fontWeight: "700",
  },
  notesInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
  },
  optionalRow: {
    flexDirection: "row",
  },
  billInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 12,
  },
  actionButtonsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  giveCreditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
  },
  receivePaymentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
  },
  btnText: {
    fontSize: 13,
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
  emptyCard: {
    padding: 24,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 12,
    textAlign: "center",
  },
  txRow: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  txMainRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  txLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    flex: 1,
  },
  txIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  txTypeText: {
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
  txBillNo: {
    fontSize: 11,
    marginTop: 1,
  },
  txRight: {
    alignItems: "flex-end",
    marginLeft: 8,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: "800",
  },
  txBalAfter: {
    fontSize: 11,
  },
  txFooterRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  reversalPromptBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  reversalPromptText: {
    fontSize: 11,
    fontWeight: "600",
  },
  disputeSection: {
    gap: 6,
    marginTop: 4,
  },
  disputeNotice: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fee2e2",
    padding: 8,
    borderRadius: 6,
  },
  disputeNoticeText: {
    fontSize: 11,
    color: "#ef4444",
    fontWeight: "600",
    flex: 1,
  },
  disputeActionButtons: {
    flexDirection: "row",
    gap: 8,
  },
  disputeAcceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
  },
  disputeRejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  disputeActionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
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
  bottomToolbar: {
    gap: 8,
    marginTop: 10,
  },
  toolBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 42,
    borderRadius: 10,
  },
  toolBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
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
  otpInput: {
    height: 46,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 4,
    textAlign: "center",
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
    alignItems: "center",
    justifyContent: "center",
  },
  confirmText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
});
