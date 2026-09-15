import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/format";
import { Product } from "@/features/products/types";
import { parseVoiceBillWithAI, VoiceBillItem, AIVoiceBillResult } from "../services/aiVoicePOS";
import {
  Mic,
  MicOff,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
  Volume2,
  ClipboardList,
} from "lucide-react-native";

interface AIVoicePOSModalProps {
  visible: boolean;
  onClose: () => void;
  inventory: Product[];
  onAddItems: (items: VoiceBillItem[]) => void;
}

const SAMPLE_COMMANDS = [
  "2 packet maggi aur 1 namak",
  "Do dettol sabun aur 1kg cheeni",
  "Aadha kilo toor dal",
  "1 Surf excel aur 2 parle-g",
];

export const AIVoicePOSModal: React.FC<AIVoicePOSModalProps> = ({
  visible,
  onClose,
  inventory,
  onAddItems,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [spokenText, setSpokenText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [voiceResult, setVoiceResult] = useState<AIVoiceBillResult | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Web Speech recognition support for desktop/browser
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const reco = new SpeechRecognition();
        reco.continuous = false;
        reco.interimResults = false;
        reco.lang = "hi-IN"; // Hindi / Indian English

        reco.onresult = (event: any) => {
          const text = event.results?.[0]?.[0]?.transcript || "";
          if (text) {
            setSpokenText(text);
            handleProcessCommand(text);
          }
          setIsListening(false);
        };

        reco.onerror = () => setIsListening(false);
        reco.onend = () => setIsListening(false);
        recognitionRef.current = reco;
      }
    }
  }, []);

  const handleProcessCommand = async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    try {
      setIsAnalyzing(true);
      const res = await parseVoiceBillWithAI(clean, inventory);
      setVoiceResult(res);
    } catch (err: any) {
      Alert.alert("Voice POS Notice", err?.message || "Could not understand voice command. Please retry.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleMicPress = () => {
    if (recognitionRef.current) {
      if (isListening) {
        recognitionRef.current.stop();
        setIsListening(false);
      } else {
        setIsListening(true);
        recognitionRef.current.start();
      }
    } else {
      // Mobile native dictation: Toggle active mic ring & focus input for keyboard mic
      const nextListening = !isListening;
      setIsListening(nextListening);
      inputRef.current?.focus();
    }
  };

  const handleAddAll = () => {
    if (!voiceResult?.matched_items?.length) return;
    onAddItems(voiceResult.matched_items);
    setSpokenText("");
    setVoiceResult(null);
    onClose();
  };

  const handleClose = () => {
    setSpokenText("");
    setVoiceResult(null);
    setIsListening(false);
    onClose();
  };

  const handleOpenMandiList = () => {
    handleClose();
    router.push("/merchant/procurement-list");
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.iconCircle}>
                <Mic size={18} color="#7c3aed" />
              </View>
              <View>
                <Text style={[styles.title, { color: colors.text }]}>Bolkar Bill Banao (Voice POS)</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  AI voice-to-bill for hands-free counter checkout
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {/* Mic Hero Section */}
            <View style={styles.micHero}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Voice Mic Button"
                onPress={handleMicPress}
                style={[
                  styles.micRing,
                  { backgroundColor: isListening ? "#dc2626" : "#7c3aed" },
                ]}
              >
                {isListening ? <MicOff size={32} color="#ffffff" /> : <Mic size={32} color="#ffffff" />}
              </Pressable>
              <Text style={[styles.micHint, { color: isListening ? "#dc2626" : colors.text }]}>
                {isListening ? "🎙️ Listening... Mobile keyboard mic 🎙️ se boliye!" : "Tap Mic & Speak (Hindi ya English)"}
              </Text>
              <Text style={[styles.micSubHint, { color: colors.textMuted }]}>
                Mobile keyboard ka voice mic 🎙️ dabayein ya sample chip tap karein
              </Text>
            </View>

            {/* Input & Process Bar */}
            <View style={[styles.inputBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              <TextInput
                ref={inputRef}
                style={[styles.input, { color: colors.text }]}
                placeholder="Spoken items (e.g. 2 packet maggi aur 1kg chini)..."
                placeholderTextColor={colors.textMuted}
                value={spokenText}
                onChangeText={setSpokenText}
                onSubmitEditing={() => handleProcessCommand(spokenText)}
              />
              <Pressable
                accessibilityRole="button"
                onPress={() => handleProcessCommand(spokenText)}
                disabled={isAnalyzing || !spokenText.trim()}
                style={[styles.parseIconBtn, { opacity: spokenText.trim() ? 1 : 0.5 }]}
              >
                {isAnalyzing ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Sparkles size={16} color="#ffffff" />
                )}
              </Pressable>
            </View>

            <Button
              title={isAnalyzing ? "AI Matching Items..." : "Match Spoken Items with AI ✨"}
              variant="primary"
              size="md"
              isLoading={isAnalyzing}
              disabled={isAnalyzing || !spokenText.trim()}
              onPress={() => handleProcessCommand(spokenText)}
            />

            {/* Quick Test Samples */}
            <View style={styles.samplesBox}>
              <Text style={[styles.sampleLabel, { color: colors.textMuted }]}>
                Quick 1-Tap Voice Test Chips (Tap to test):
              </Text>
              <View style={styles.chipsWrap}>
                {SAMPLE_COMMANDS.map((cmd, i) => (
                  <Pressable
                    key={i}
                    accessibilityRole="button"
                    onPress={() => {
                      setSpokenText(cmd);
                      handleProcessCommand(cmd);
                    }}
                    style={[styles.sampleChip, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}
                  >
                    <Volume2 size={12} color="#7c3aed" />
                    <Text style={[styles.sampleChipText, { color: colors.text }]}>"{cmd}"</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* AI Detected Result */}
            {voiceResult && (
              <View style={[styles.resultCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                <View style={styles.resultHeader}>
                  <Text style={[styles.resultTitle, { color: colors.text }]}>
                    AI Detected Items ({voiceResult.matched_items.length})
                  </Text>
                  <Text style={[styles.resultTotal, { color: colors.primary }]}>
                    Total: {formatCurrency(voiceResult.total_amount)}
                  </Text>
                </View>

                {voiceResult.matched_items.map((item, idx) => (
                  <View key={`${item.product_id}-${idx}`} style={[styles.itemRow, { borderBottomColor: colors.surfaceBorder }]}>
                    <View style={styles.itemLeft}>
                      <CheckCircle2 size={15} color="#16a34a" />
                      <Text style={[styles.itemName, { color: colors.text }]}>{item.product_name}</Text>
                    </View>
                    <Text style={[styles.itemQty, { color: colors.textMuted }]}>
                      {item.quantity} {item.unit || "unit"} • {formatCurrency(item.total_price)}
                    </Text>
                  </View>
                ))}

                {(voiceResult.unmatched_text?.length || 0) > 0 && (
                  <View style={styles.unmatchedBox}>
                    <View style={styles.unmatchedHeader}>
                      <AlertCircle size={13} color="#d97706" />
                      <Text style={styles.unmatchedLabel}>Items Not In Store Stock:</Text>
                    </View>
                    {voiceResult.unmatched_text?.map((u, i) => (
                      <Text key={i} style={styles.unmatchedText}>• "{u}"</Text>
                    ))}

                    <Pressable
                      accessibilityRole="button"
                      onPress={handleOpenMandiList}
                      style={styles.mandiBtn}
                    >
                      <ClipboardList size={13} color="#7c3aed" />
                      <Text style={styles.mandiBtnText}>Add Unmatched Items to Mandi Khareed List 📝</Text>
                    </Pressable>
                  </View>
                )}

                <Button
                  title={`Add ${voiceResult.matched_items.length} Items to Bill Cart 🛒`}
                  variant="primary"
                  size="md"
                  disabled={voiceResult.matched_items.length === 0}
                  onPress={handleAddAll}
                  style={styles.addAllBtn}
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
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    maxHeight: "85%",
    padding: 16,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "800",
  },
  subtitle: {
    fontSize: 11,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    gap: 12,
    paddingBottom: 30,
  },
  micHero: {
    alignItems: "center",
    paddingVertical: 14,
    gap: 6,
  },
  micRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  micHint: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  micSubHint: {
    fontSize: 11,
    textAlign: "center",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  parseIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  samplesBox: {
    gap: 6,
  },
  sampleLabel: {
    fontSize: 11,
    fontWeight: "600",
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  sampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  sampleChipText: {
    fontSize: 11,
    fontWeight: "600",
  },
  resultCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 10,
    marginTop: 4,
  },
  resultHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  resultTitle: {
    fontSize: 13,
    fontWeight: "800",
  },
  resultTotal: {
    fontSize: 13,
    fontWeight: "800",
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  itemName: {
    fontSize: 13,
    fontWeight: "600",
  },
  itemQty: {
    fontSize: 12,
  },
  unmatchedBox: {
    backgroundColor: "rgba(217, 119, 6, 0.08)",
    borderRadius: 8,
    padding: 8,
    gap: 4,
  },
  unmatchedHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  unmatchedLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#d97706",
  },
  unmatchedText: {
    fontSize: 11,
    color: "#b45309",
  },
  mandiBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  mandiBtnText: {
    color: "#7c3aed",
    fontSize: 11,
    fontWeight: "700",
  },
  addAllBtn: {
    marginTop: 4,
  },
});
