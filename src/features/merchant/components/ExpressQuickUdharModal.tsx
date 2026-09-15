import React, { useState, useEffect } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { playSoundboxTone } from "@/utils/soundbox";
import { TrustScoreBadge } from "@/features/khata/components/TrustScoreBadge";
import * as ImagePicker from "expo-image-picker";
import { KhataCustomer } from "../types";
import {
  Zap,
  X,
  Camera,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
} from "lucide-react-native";

interface ExpressQuickUdharModalProps {
  visible: boolean;
  customer: KhataCustomer | null;
  onClose: () => void;
  onSuccess: (result: {
    customer: KhataCustomer;
    amount: number;
    type: "CREDIT" | "PAYMENT";
    notes: string;
  }) => void;
}

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];
const QUICK_ITEMS = [
  "🥛 Doodh",
  "🍚 Chini",
  "🌾 Atta",
  "🍚 Chawal",
  "🛢️ Tel",
  "🍪 Biscuits",
  "🥬 Sabji",
  "📦 Ration",
  "⚡ Daily Udhar",
];

export const ExpressQuickUdharModal: React.FC<ExpressQuickUdharModalProps> = ({
  visible,
  customer,
  onClose,
  onSuccess,
}) => {
  const { colors, isDark } = useThemeColor();

  const [amount, setAmount] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customNotes, setCustomNotes] = useState("");
  const [parchiPhotoUri, setParchiPhotoUri] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setAmount("");
      setSelectedItems([]);
      setCustomNotes("");
      setParchiPhotoUri(null);
      setIsSubmitting(false);
    }
  }, [visible, customer]);

  if (!visible || !customer) return null;

  const currentBal = customer.current_balance || 0;
  const creditLimit = customer.credit_limit || 0;
  const numAmount = parseFloat(amount) || 0;

  // Toggle quick item
  const handleToggleItem = (itemText: string) => {
    const clean = itemText.replace(/^[^\w\s]+/, "").trim(); // Remove emoji for clean note
    if (selectedItems.includes(clean)) {
      setSelectedItems(selectedItems.filter((i) => i !== clean));
    } else {
      setSelectedItems([...selectedItems, clean]);
    }
  };

  // Add quick amount
  const handleAddAmount = (addVal: number) => {
    const cur = parseFloat(amount) || 0;
    setAmount(String(cur + addVal));
  };

  // Camera snap
  const handleSnapParchi = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("Permission Required", "Parchi photo lene ke liye camera permission chahiye.");
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

  const getFullNotes = () => {
    const parts = [...selectedItems];
    if (customNotes.trim()) parts.push(customNotes.trim());
    return parts.join(", ") || "Dukan Khata Entry";
  };

  // 1-Tap Save Credit
  const handleSaveCredit = async () => {
    if (numAmount <= 0) {
      Alert.alert("Amount Required", "Kripya sahi rakam (amount > ₹0) chunein ya enter karein.");
      return;
    }

    // Over-limit protection
    if (creditLimit > 0 && currentBal + numAmount > creditLimit) {
      Alert.alert(
        "⚠️ Credit Limit Exceeded",
        `${customer.customer_name} ki Seema ${formatCurrency(creditLimit)} hai. Naya udhar milakar kul baaki ${formatCurrency(currentBal + numAmount)} ho jayega.\n\nKya aap phir bhi udhar likhna chahte hain?`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Haan, Udhar Likhein",
            onPress: () => executeCreditSubmit(),
          },
        ]
      );
      return;
    }

    await executeCreditSubmit();
  };

  const executeCreditSubmit = async () => {
    setIsSubmitting(true);
    const finalNotes = getFullNotes();
    try {
      await apiClient.post(Endpoints.MERCHANT.KHATA, {
        customer_name: customer.customer_name,
        customer_mobile: customer.customer_mobile,
        amount: numAmount,
        notes: finalNotes,
        parchi_image_url: parchiPhotoUri || undefined,
        items_summary: finalNotes,
      });

      playSoundboxTone("credit");
      onSuccess({
        customer,
        amount: numAmount,
        type: "CREDIT",
        notes: finalNotes,
      });
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Udhar darj nahi ho paya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1-Tap Save Payment
  const handleSavePayment = async () => {
    if (numAmount <= 0) {
      Alert.alert("Amount Required", "Kripya jama rakam enter karein.");
      return;
    }

    setIsSubmitting(true);
    const finalNotes = customNotes.trim() || "Payment received at counter";
    try {
      await apiClient.post(Endpoints.MERCHANT.KHATA_PAYMENT(customer.customer_mobile), {
        customer_name: customer.customer_name,
        amount: numAmount,
        payment_mode: "cash",
        notes: finalNotes,
      });

      playSoundboxTone("payment");
      onSuccess({
        customer,
        amount: numAmount,
        type: "PAYMENT",
        notes: finalNotes,
      });
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Payment darj nahi ho paya.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <View style={styles.zapIconWrap}>
                <Zap size={18} color="#fff" />
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>⚡ Express Quick Khata</Text>
                <Text style={[styles.headerSub, { color: colors.textMuted }]}>
                  Instant 1-Tap Udhar & Jama
                </Text>
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={[styles.closeBtn, { backgroundColor: colors.surfaceBorder }]}
            >
              <X size={18} color={colors.text} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Identity Verification Card (Loophole Protection) */}
            <View
              style={[
                styles.identityCard,
                {
                  backgroundColor: isDark ? "#1e293b" : "#f8fafc",
                  borderColor: colors.surfaceBorder,
                },
              ]}
            >
              <View style={styles.identityRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <Text style={[styles.custName, { color: colors.text }]} numberOfLines={1}>
                      {customer.customer_name}
                    </Text>
                    {customer.is_registered && (
                      <View style={styles.appBadge}>
                        <ShieldCheck size={10} color="#16a34a" />
                        <Text style={styles.appBadgeText}>App User</Text>
                      </View>
                    )}
                    <TrustScoreBadge score={customer.trust_score || 750} badge={customer.trust_badge || "TRUSTED"} size="sm" />
                  </View>
                  <Text style={[styles.custPhone, { color: colors.textMuted }]}>
                    📞 +91 {customer.customer_mobile}
                  </Text>
                </View>

                <View style={{ alignItems: "flex-end" }}>
                  <Text
                    style={[
                      styles.custBalance,
                      { color: currentBal > 0 ? "#dc2626" : "#16a34a" },
                    ]}
                  >
                    {formatCurrency(currentBal)}
                  </Text>
                  <Text style={[styles.custBalLabel, { color: colors.textMuted }]}>
                    {currentBal > 0 ? "Pehle ka Baki" : "Hisaab Clear"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Big Amount Input Box */}
            <View style={[styles.amountBox, { borderColor: colors.primary, backgroundColor: isDark ? "#131b2e" : "#f0fdf4" }]}>
              <Text style={[styles.currencyPrefix, { color: colors.primary }]}>₹</Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                placeholder="0"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
                autoFocus
                value={amount}
                onChangeText={setAmount}
              />
              {!!amount && (
                <Pressable onPress={() => setAmount("")} style={styles.clearAmtBtn}>
                  <X size={14} color={colors.textMuted} />
                </Pressable>
              )}
            </View>

            {/* Quick Amount Preset Chips (+50, +100, +200, +500, +1000) */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>⚡ Quick Amount (1-Tap):</Text>
              <View style={styles.chipsRow}>
                {QUICK_AMOUNTS.map((val) => (
                  <Pressable
                    key={val}
                    onPress={() => handleAddAmount(val)}
                    style={[styles.quickAmtChip, { backgroundColor: isDark ? "#1e293b" : "#eff6ff", borderColor: colors.surfaceBorder }]}
                  >
                    <Text style={[styles.quickAmtChipText, { color: colors.primary }]}>+₹{val}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Quick Items Preset Chips (Zero Typing) */}
            <View style={styles.sectionWrap}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>📦 Samaan Chunein (Bina Type Kiye):</Text>
              <View style={styles.chipsRow}>
                {QUICK_ITEMS.map((item) => {
                  const clean = item.replace(/^[^\w\s]+/, "").trim();
                  const isSelected = selectedItems.includes(clean);
                  return (
                    <Pressable
                      key={item}
                      onPress={() => handleToggleItem(item)}
                      style={[
                        styles.quickItemChip,
                        {
                          backgroundColor: isSelected ? colors.primary : isDark ? "#1e293b" : "#f1f5f9",
                          borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.quickItemChipText,
                          { color: isSelected ? "#fff" : colors.text },
                        ]}
                      >
                        {item}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Optional Note & Camera Snap */}
            <View style={styles.noteRow}>
              <TextInput
                style={[styles.noteInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                placeholder="Extra vivaran (optional)..."
                placeholderTextColor={colors.textMuted}
                value={customNotes}
                onChangeText={setCustomNotes}
              />

              <Pressable
                onPress={handleSnapParchi}
                style={[
                  styles.cameraBtn,
                  {
                    backgroundColor: parchiPhotoUri ? "#dcfce7" : isDark ? "#1e293b" : "#f1f5f9",
                    borderColor: parchiPhotoUri ? "#16a34a" : colors.surfaceBorder,
                  },
                ]}
              >
                <Camera size={16} color={parchiPhotoUri ? "#16a34a" : colors.text} />
              </Pressable>
            </View>

            {/* 2 Big 1-Tap Action Buttons */}
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                onPress={handleSaveCredit}
                disabled={isSubmitting || numAmount <= 0}
                style={[
                  styles.giveCreditBtn,
                  { opacity: numAmount > 0 ? 1 : 0.6 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <ArrowDownLeft size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>
                      Udhar Diya (+₹{numAmount || 0})
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable
                accessibilityRole="button"
                onPress={handleSavePayment}
                disabled={isSubmitting || numAmount <= 0}
                style={[
                  styles.receivePaymentBtn,
                  { opacity: numAmount > 0 ? 1 : 0.6 },
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <ArrowUpRight size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>
                      Jama Liya (-₹{numAmount || 0})
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  zapIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "800",
  },
  headerSub: {
    fontSize: 11,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 16,
    gap: 12,
    paddingBottom: 32,
  },
  identityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  identityRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  custName: {
    fontSize: 15,
    fontWeight: "800",
  },
  custPhone: {
    fontSize: 11,
    marginTop: 1,
  },
  appBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  appBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#16a34a",
  },
  custBalance: {
    fontSize: 18,
    fontWeight: "900",
  },
  custBalLabel: {
    fontSize: 10,
    marginTop: 1,
  },
  amountBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 56,
  },
  currencyPrefix: {
    fontSize: 26,
    fontWeight: "900",
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 26,
    fontWeight: "900",
    height: "100%",
  },
  clearAmtBtn: {
    padding: 6,
  },
  sectionWrap: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  quickAmtChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickAmtChipText: {
    fontSize: 12,
    fontWeight: "800",
  },
  quickItemChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickItemChipText: {
    fontSize: 11,
    fontWeight: "700",
  },
  noteRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  noteInput: {
    flex: 1,
    height: 42,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 13,
  },
  cameraBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  giveCreditBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#dc2626",
  },
  receivePaymentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#16a34a",
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#fff",
  },
});
