import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Animated,
  StyleSheet,
  Alert,
} from "react-native";
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  CheckCircle2,
  User,
  Tag,
  AlertCircle,
} from "lucide-react-native";
import { KhataCustomer } from "../types";
import { useRecordCredit, useRecordKhataPayment } from "../api/useKhata";

interface AIVoiceKhataModalProps {
  visible: boolean;
  onClose: () => void;
  customers: KhataCustomer[];
  onManualPrefill?: (
    customer: KhataCustomer,
    type: "CREDIT" | "PAYMENT",
    amount: number,
    note: string
  ) => void;
  onSuccess?: (msg: string) => void;
}

interface ParsedKhata {
  customer: KhataCustomer | null;
  customerQuery: string;
  type: "CREDIT" | "PAYMENT";
  amount: number;
  items: string;
  confidence: number;
}

export const AIVoiceKhataModal: React.FC<AIVoiceKhataModalProps> = ({
  visible,
  onClose,
  customers,
  onManualPrefill,
  onSuccess,
}) => {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const [parsed, setParsed] = useState<ParsedKhata | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const recordCredit = useRecordCredit();
  const [selectedMobile, setSelectedMobile] = useState("");
  const recordPayment = useRecordKhataPayment(selectedMobile);

  // Pulse animation for mic
  useEffect(() => {
    let anim: Animated.CompositeAnimation | null = null;
    if (isListening) {
      anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      anim.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => anim?.stop();
  }, [isListening, pulseAnim]);

  // AI / Regex Natural Language Parser for Hinglish Khata Speech
  const parseSpeech = (text: string) => {
    if (!text || text.trim().length === 0) {
      setParsed(null);
      return;
    }

    const lower = text.toLowerCase();

    // 1. Transaction Type Detection
    const paymentKeywords = [
      "jama",
      "payment",
      "diye",
      "diya",
      "mila",
      "mile",
      "recieved",
      "received",
      "chutta",
      "cleared",
      "pay kiya",
      "bhara",
    ];
    const isPayment = paymentKeywords.some((kw) => lower.includes(kw));
    const txType: "CREDIT" | "PAYMENT" = isPayment ? "PAYMENT" : "CREDIT";

    // 2. Amount Extraction (handles digits, "sau", "hazar", "rupay", "rs", "₹")
    let amount = 0;
    const amountMatch = text.match(
      /(?:rs\.?|inr|₹|rupay|rupaye|rupees)?\s*(\d+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|₹|rupay|rupaye|rupees)?/i
    );
    if (amountMatch && amountMatch[1]) {
      amount = parseFloat(amountMatch[1]);
    } else {
      if (lower.includes("ek sau") || lower.includes("100")) amount = 100;
      else if (lower.includes("do sau") || lower.includes("200")) amount = 200;
      else if (lower.includes("panch sau") || lower.includes("500")) amount = 500;
      else if (lower.includes("hazar") || lower.includes("1000")) amount = 1000;
    }

    // 3. Customer Matching against customer list
    let matchedCustomer: KhataCustomer | null = null;
    let customerQuery = "";

    for (const c of customers) {
      const name = (c.customer_name || "").toLowerCase().trim();
      const phone = (c.customer_mobile || "").trim();

      if (name && name.length >= 3 && lower.includes(name)) {
        matchedCustomer = c;
        customerQuery = c.customer_name;
        break;
      }
      if (phone && phone.length >= 4 && lower.includes(phone)) {
        matchedCustomer = c;
        customerQuery = c.customer_name || c.customer_mobile;
        break;
      }
    }

    // If no exact customer match, extract tentative name from beginning of sentence
    if (!matchedCustomer) {
      const words = text.split(" ").filter((w) => w.trim().length > 0);
      if (words.length > 0) {
        const firstWord = words[0].replace(/[^a-zA-Z0-9]/g, "");
        if (
          firstWord &&
          !["udhar", "jama", "likho", "likh", "bhai", "aaj"].includes(
            firstWord.toLowerCase()
          )
        ) {
          customerQuery = firstWord;
          const candidate = customers.find(
            (c) =>
              c.customer_name.toLowerCase().startsWith(firstWord.toLowerCase()) ||
              c.customer_mobile.includes(firstWord)
          );
          if (candidate) {
            matchedCustomer = candidate;
          }
        }
      }
    }

    // 4. Items & Notes Extraction (remove numbers and intent keywords)
    let cleaned = text
      .replace(
        /(?:rs\.?|inr|₹|rupay|rupaye|rupees)?\s*\d+(?:\.\d{1,2})?\s*(?:rs\.?|inr|₹|rupay|rupaye|rupees)?/gi,
        ""
      )
      .replace(
        /\b(udhar|jama|likho|likh|do|de|diya|diye|mila|mile|baki|hai|ko|ne|ka|ki|se|khata|me|rupay|rupaye|rs|₹)\b/gi,
        ""
      )
      .replace(customerQuery, "")
      .trim()
      .replace(/\s+/g, " ");

    const confidence =
      (matchedCustomer ? 0.5 : customerQuery ? 0.25 : 0) +
      (amount > 0 ? 0.4 : 0) +
      0.1;

    setParsed({
      customer: matchedCustomer,
      customerQuery: customerQuery || "Customer",
      type: txType,
      amount,
      items: cleaned || (txType === "CREDIT" ? "Udhar Saaman" : "Payment / Cash Jama"),
      confidence,
    });
  };

  const handleTextChange = (txt: string) => {
    setTranscript(txt);
    parseSpeech(txt);
  };

  const toggleMic = () => {
    if (isListening) {
      setIsListening(false);
    } else {
      setIsListening(true);
      if (!transcript) {
        const sample = "Ramesh ko 140 rupay udhar 2 packet doodh likho";
        setTranscript(sample);
        parseSpeech(sample);
      }
    }
  };

  const applySamplePrompt = (prompt: string) => {
    setTranscript(prompt);
    parseSpeech(prompt);
  };

  const handleConfirmAndSave = async () => {
    if (!parsed) return;
    if (!parsed.customer) {
      Alert.alert(
        "Customer Select Karein",
        `"${parsed.customerQuery}" hamari customer list me nahi mila. Kripya niche se customer select karein ya pehle naya customer add karein.`
      );
      return;
    }
    if (parsed.amount <= 0) {
      Alert.alert("Amount Jaruri Hai", "Kripya valid amount bole ya likhein.");
      return;
    }

    try {
      setIsSubmitting(true);
      if (parsed.type === "CREDIT") {
        await recordCredit.mutateAsync({
          customer_mobile: parsed.customer.customer_mobile,
          customer_name: parsed.customer.customer_name,
          amount: parsed.amount,
          notes: parsed.items,
        });
      } else {
        setSelectedMobile(parsed.customer.customer_mobile);
        await recordPayment.mutateAsync({
          amount: parsed.amount,
          payment_mode: "cash",
          notes: parsed.items,
        });
      }

      onSuccess?.(
        `✅ ${parsed.customer.customer_name} ke khata me ₹${parsed.amount} ${
          parsed.type === "CREDIT" ? "Udhar" : "Jama"
        } darj ho gaya!`
      );
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Transaction record karne me dikkat aayi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditInExpress = () => {
    if (!parsed) return;
    if (parsed.customer && onManualPrefill) {
      onManualPrefill(
        parsed.customer,
        parsed.type,
        parsed.amount,
        parsed.items
      );
      onClose();
    } else {
      Alert.alert(
        "Pehle Customer Select Karein",
        "Express entry me edit karne ke liye customer select karein."
      );
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.aiBadge}>
                <Sparkles size={16} color="#8b5cf6" />
                <Text style={styles.aiBadgeText}>AI Voice Khata</Text>
              </View>
              <Text style={styles.headerTitle}>Bol Kar Khata Likhein</Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.contentContainer}
          >
            {/* Mic Center Section */}
            <View style={styles.micSection}>
              <Animated.View
                style={[
                  styles.micPulseRing,
                  {
                    transform: [{ scale: pulseAnim }],
                    borderColor: isListening ? "#8b5cf6" : "#e2e8f0",
                    backgroundColor: isListening ? "#f5f3ff" : "#f8fafc",
                  },
                ]}
              >
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.micButton,
                    { backgroundColor: isListening ? "#7c3aed" : "#0f172a" },
                  ]}
                  onPress={toggleMic}
                >
                  {isListening ? (
                    <Mic size={32} color="#ffffff" />
                  ) : (
                    <MicOff size={32} color="#94a3b8" />
                  )}
                </TouchableOpacity>
              </Animated.View>
              <Text style={styles.micStatusText}>
                {isListening
                  ? "🎙️ Sun rahe hain... Boliye (jaise: 'Ramesh 150 rupay udhar doodh')"
                  : "Mic par tap karein ya niche se prompt select karein"}
              </Text>
            </View>

            {/* Quick Prompt Chips */}
            <View style={styles.chipsSection}>
              <Text style={styles.sectionLabel}>⚡ Quick Voice Prompts:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll}>
                {[
                  "Ramesh ko 140 rupay udhar 2 packet doodh",
                  "Amit ne 500 rupay jama kiye cash",
                  "Rahul 220 udhar ration saaman",
                  "Suresh 1000 rupay payment mila",
                ].map((prompt, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.promptChip}
                    onPress={() => applySamplePrompt(prompt)}
                  >
                    <Text style={styles.promptChipText}>"{prompt}"</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Speech Transcript Input Box */}
            <View style={styles.inputCard}>
              <View style={styles.inputHeader}>
                <Text style={styles.inputLabel}>Jo bola gaya / Typed Speech:</Text>
                {transcript.length > 0 && (
                  <TouchableOpacity onPress={() => handleTextChange("")}>
                    <Text style={styles.clearText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                style={styles.transcriptInput}
                value={transcript}
                onChangeText={handleTextChange}
                placeholder="Jaise: 'Ramesh 150 udhar doodh' ya yahan type karein..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Parsed AI Intelligence Result */}
            {parsed && (
              <View
                style={[
                  styles.parsedCard,
                  {
                    borderColor:
                      parsed.type === "CREDIT" ? "#fecaca" : "#bbf7d0",
                    backgroundColor:
                      parsed.type === "CREDIT" ? "#fef2f2" : "#f0fdf4",
                  },
                ]}
              >
                <View style={styles.parsedHeader}>
                  <View style={styles.parsedTypeRow}>
                    <View
                      style={[
                        styles.txTypeBadge,
                        {
                          backgroundColor:
                            parsed.type === "CREDIT" ? "#ef4444" : "#10b981",
                        },
                      ]}
                    >
                      <Text style={styles.txTypeBadgeText}>
                        {parsed.type === "CREDIT" ? "🔴 UDHAR (Credit)" : "🟢 JAMA (Payment)"}
                      </Text>
                    </View>
                    <Text style={styles.parsedAmountText}>
                      ₹{parsed.amount > 0 ? parsed.amount.toLocaleString("en-IN") : "--"}
                    </Text>
                  </View>
                </View>

                {/* Customer Details */}
                <View style={styles.parsedRow}>
                  <User size={16} color="#64748b" />
                  <Text style={styles.parsedRowLabel}>Customer:</Text>
                  {parsed.customer ? (
                    <View style={styles.matchedCustomerBadge}>
                      <Text style={styles.matchedCustomerName}>
                        {parsed.customer.customer_name}
                      </Text>
                      <Text style={styles.matchedCustomerPhone}>
                        ({parsed.customer.customer_mobile})
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.unmatchedCustomerBadge}>
                      <AlertCircle size={14} color="#f59e0b" />
                      <Text style={styles.unmatchedText}>
                        "{parsed.customerQuery}" (Nahi Mila - Niche Select Karein)
                      </Text>
                    </View>
                  )}
                </View>

                {/* Items / Description */}
                <View style={styles.parsedRow}>
                  <Tag size={16} color="#64748b" />
                  <Text style={styles.parsedRowLabel}>Saaman / Details:</Text>
                  <Text style={styles.parsedItemsText}>{parsed.items}</Text>
                </View>

                {/* Customer Picker if unmatched */}
                {!parsed.customer && customers.length > 0 && (
                  <View style={styles.customerSuggestBox}>
                    <Text style={styles.suggestLabel}>Kisi customer se match karein:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      {customers.slice(0, 5).map((c) => (
                        <TouchableOpacity
                          key={c.customer_mobile}
                          style={styles.customerChip}
                          onPress={() =>
                            setParsed((p) => (p ? { ...p, customer: c } : null))
                          }
                        >
                          <Text style={styles.customerChipName}>{c.customer_name}</Text>
                          <Text style={styles.customerChipPhone}>{c.customer_mobile}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={handleEditInExpress}
                  >
                    <Text style={styles.editBtnText}>Edit Karein</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.confirmBtn,
                      {
                        backgroundColor:
                          parsed.customer && parsed.amount > 0
                            ? "#059669"
                            : "#94a3b8",
                      },
                    ]}
                    disabled={
                      !parsed.customer || parsed.amount <= 0 || isSubmitting
                    }
                    onPress={handleConfirmAndSave}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color="#ffffff" />
                        <Text style={styles.confirmBtnText}>1-Tap Save</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.7)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f3ff",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: "#ddd6fe",
  },
  aiBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#7c3aed",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 20,
    gap: 16,
  },
  micSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  micPulseRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  micButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micStatusText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  chipsSection: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  chipsScroll: {
    flexDirection: "row",
  },
  promptChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  promptChipText: {
    fontSize: 12,
    color: "#334155",
    fontWeight: "500",
  },
  inputCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  clearText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "600",
  },
  transcriptInput: {
    fontSize: 14,
    color: "#0f172a",
    minHeight: 48,
    textAlignVertical: "top",
  },
  parsedCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  parsedHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  parsedTypeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  txTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  txTypeBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
  },
  parsedAmountText: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0f172a",
  },
  parsedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  parsedRowLabel: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  matchedCustomerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#dcfce7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  matchedCustomerName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#15803d",
  },
  matchedCustomerPhone: {
    fontSize: 12,
    color: "#166534",
  },
  unmatchedCustomerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flex: 1,
  },
  unmatchedText: {
    fontSize: 12,
    color: "#b45309",
    fontWeight: "600",
    flex: 1,
  },
  parsedItemsText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  customerSuggestBox: {
    marginTop: 4,
    gap: 6,
  },
  suggestLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
  },
  customerChip: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    marginRight: 6,
  },
  customerChipName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0f172a",
  },
  customerChipPhone: {
    fontSize: 10,
    color: "#64748b",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  editBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  confirmBtn: {
    flex: 2,
    flexDirection: "row",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
