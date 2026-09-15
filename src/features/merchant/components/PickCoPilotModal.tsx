import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMyShop, useDailyDigest } from "../api/useMerchantStore";
import { useLowStockItems, useAdjustStock } from "../api/useInventory";
import { useWeeklyScorecard, useMerchantProducts } from "../api/usePOS";
import { useMerchantReservations } from "../api/useMerchantReservations";
import { useKhataCustomers } from "../api/useKhata";
import { useProfitReport } from "../api/useAnalytics";
import { useExpenses } from "../api/useExpenses";
import { askPickCoPilot, ConversationTurn } from "../services/gemini";
import {
  loadChatHistory,
  saveChatHistory,
  clearAllMemory,
  StoredMessage,
} from "../services/geminiMemory";
import { searchProductsByImage } from "../services/visualProductMatcher";
import {
  Sparkles,
  X,
  Send,
  Boxes,
  TrendingUp,
  Tag,
  Zap,
  BookOpen,
  Cpu,
  Mic,
  MicOff,
  Volume2,
  RotateCcw,
  Bot,
  HelpCircle,
  ScanLine,
} from "lucide-react-native";

interface PickCoPilotModalProps {
  visible: boolean;
  onClose: () => void;
}

const QUICK_PROMPTS = [
  "💰 Aaj ka Asli Munafa aur bikri?",
  "👥 Kiska kitna udhar baaki hai?",
  "📈 Grahak aur bikri kaise badhayein?",
  "📦 Kam stock wale items dikhao",
  "🧾 Bill kaise banayein (POS)?",
  "🔥 Weekend ke liye offer banao",
];

const DEFAULT_WELCOME_MESSAGE: StoredMessage = {
  id: "welcome-1",
  sender: "pick",
  text: "Namaste Bhaiya! Main aapka Gemini AI Store Assistant hoon. Dukaan ka hisab-kitab, Sharma ji ka udhar, low stock, ya app me bill kaise banana hai — bas bolkar ya likhkar poochiye! 🎙️",
};

export const PickCoPilotModal: React.FC<PickCoPilotModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  // 360° Real-time Shop Intelligence (only fetch when modal is open and shop exists)
  const { data: shop } = useMyShop();
  const isIntelligenceEnabled = visible && !!shop;
  const { data: digest } = useDailyDigest(isIntelligenceEnabled);
  const { data: lowItems = [], refetch: refetchLowStock } = useLowStockItems(isIntelligenceEnabled);
  const { data: weeklyScorecard } = useWeeklyScorecard(isIntelligenceEnabled);
  const { data: reservations = [] } = useMerchantReservations(undefined, isIntelligenceEnabled);
  const { data: khataCustomers = [] } = useKhataCustomers(undefined, isIntelligenceEnabled);
  const { data: profitReport } = useProfitReport("month", isIntelligenceEnabled);
  const { data: expenses = [] } = useExpenses(undefined, isIntelligenceEnabled);
  const { data: products = [] } = useMerchantProducts();
  const adjustStockMutation = useAdjustStock();

  const isGeminiLive = !!process.env.EXPO_PUBLIC_GEMINI_API_KEY?.trim();

  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  const [messages, setMessages] = useState<StoredMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isBulkRestocking, setIsBulkRestocking] = useState(false);
  const [isVisualScanning, setIsVisualScanning] = useState(false);

  // 1. Load persistent chat history from AsyncStorage on mount
  useEffect(() => {
    let mounted = true;
    loadChatHistory().then((history) => {
      if (mounted && history.length > 0) {
        setMessages(history);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Save conversation changes to AsyncStorage
  const updateMessages = (newMessages: StoredMessage[]) => {
    setMessages(newMessages);
    saveChatHistory(newMessages);
  };

  // 3. Initialize Web Speech Recognition if running on web
  useEffect(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "hi-IN";

        recognition.onstart = () => {
          setIsListening(true);
          setSpeechHint("🎙️ Sun raha hoon... Boliye!");
        };

        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setIsListening(false);
          setSpeechHint(null);
          if (transcript) {
            handleSendMessage(transcript);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
          setSpeechHint(null);
        };

        recognition.onend = () => {
          setIsListening(false);
          setSpeechHint(null);
        };

        speechRecognitionRef.current = recognition;
      }
    }
  }, []);

  const handleToggleVoice = () => {
    if (speechRecognitionRef.current) {
      if (isListening) {
        speechRecognitionRef.current.stop();
        setIsListening(false);
        setSpeechHint(null);
      } else {
        speechRecognitionRef.current.start();
      }
    } else {
      // Mobile native dictation guidance
      inputRef.current?.focus();
      setSpeechHint("🎙️ Keyboard me spacebar ke paas wala mic dabakar Hindi me boliye!");
      setTimeout(() => setSpeechHint(null), 5000);
    }
  };

  const handleResetChat = () => {
    Alert.alert(
      "Nayi Baat Shuru Karein?",
      "Purani chat history clear ho jayegi aur Gemini nayi baatchit shuru karega.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear History",
          style: "destructive",
          onPress: async () => {
            await clearAllMemory();
            setMessages([DEFAULT_WELCOME_MESSAGE]);
          },
        },
      ]
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isTyping) return;

    const userMsg: StoredMessage = {
      id: String(Date.now()),
      sender: "user",
      text: text.trim(),
      timestamp: Date.now(),
    };

    // Snapshot the PREVIOUS messages (before appending the new user message)
    // This is critical: Gemini requires history to NOT end on a user turn,
    // and the current query is sent separately. Passing it in history causes
    // consecutive user turns → "model output must contain either output text" error.
    const previousMessages = [...messages];
    const currentHistory = [...previousMessages, userMsg];
    updateMessages(currentHistory);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Build history from PREVIOUS messages only (not the current query)
      // Exclude the welcome message (sender: "pick" without timestamp) from history
      const conversationTurns: ConversationTurn[] = previousMessages
        .filter((m) => m.timestamp && m.text && m.text.trim().length > 0)
        .slice(-8)
        .map((m) => ({
          role: m.sender === "user" ? "user" : "model",
          text: m.text,
        }));

      const result = await askPickCoPilot(
        text.trim(),
        {
          shop: shop || undefined,
          digest: digest || undefined,
          lowStockItems: lowItems,
          weeklyScorecard: weeklyScorecard || undefined,
          reservations,
          khataCustomers,
          profitReport: profitReport || undefined,
          expenses,
          products,
        },
        conversationTurns
      );

      const replyMsg: StoredMessage = {
        id: String(Date.now() + 1),
        sender: "pick",
        text: result.text,
        actionType: result.actionType,
        timestamp: Date.now(),
      };

      updateMessages([...currentHistory, replyMsg]);
    } catch (err: any) {
      const errorReply: StoredMessage = {
        id: String(Date.now() + 1),
        sender: "pick",
        text: "Bhaiya network issue aa gaya hai, lekin aap niche diye gaye buttons se seedha apna kaam kar sakte hain.",
        timestamp: Date.now(),
      };
      updateMessages([...currentHistory, errorReply]);
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  };

  /**
   * Visual Product Search from Chat:
   * User taps camera → picks image → AI generates visual code → searches inventory → shows results in chat.
   */
  const handleVisualScanFromChat = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        // Fallback to gallery
        const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (galleryStatus.status !== "granted") {
          return Alert.alert("Permission Required", "Camera or gallery access needed for visual product search.");
        }
        const galleryResult = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ["images"],
          quality: 0.6,
          base64: true,
        });
        if (!galleryResult.canceled && galleryResult.assets?.[0]?.base64) {
          await processVisualScanImage(galleryResult.assets[0].base64, galleryResult.assets[0].mimeType || "image/jpeg");
        }
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ["images"],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets?.[0]?.base64) {
        await processVisualScanImage(result.assets[0].base64, result.assets[0].mimeType || "image/jpeg");
      }
    } catch (err: any) {
      Alert.alert("Visual Scan Error", err?.message || "Could not open camera.");
    }
  };

  const processVisualScanImage = async (base64: string, mimeType: string) => {
    const scanMsg: StoredMessage = {
      id: String(Date.now()),
      sender: "user",
      text: "📸 [Visual Product Scan]",
      timestamp: Date.now(),
    };
    const thinkingMsg: StoredMessage = {
      id: String(Date.now() + 1),
      sender: "pick",
      text: "🔍 Image scan kar raha hoon aur aapke catalog me similar products dhoondh raha hoon...",
      timestamp: Date.now() + 1,
    };
    const withScan = [...messages, scanMsg, thinkingMsg];
    updateMessages(withScan);
    setIsVisualScanning(true);
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const safeInventory = Array.isArray(products) ? products : [];
      const output = await searchProductsByImage(base64, safeInventory, mimeType);

      let replyText = "";
      if (output.matches.length > 0) {
        const topMatches = output.matches.slice(0, 3);
        replyText = `✅ Visual Code: **${output.signature.visual_code}**\n\nAapke catalog me ${output.matches.length} matching products mile:\n\n`;
        topMatches.forEach((m, i) => {
          replyText += `${i + 1}. ${m.product.title || (m.product as any).name} — ₹${m.product.price} (${m.similarity_score}% match)\n`;
        });
        replyText += "\nCounter POS me ye products seedha add kar sakte hain!";
      } else {
        replyText = `Visual Code: **${output.signature.visual_code}** generate ho gaya.\n\n🔍 Aapke database me yeh specific item abhi nahi hai (${output.signature.estimated_title}).\n\nKya main ise naya product add karne me madad karoon? [ACTION:ADD_PRODUCT]`;
      }

      // Replace thinking message with actual result
      const resultMsg: StoredMessage = {
        id: String(Date.now() + 2),
        sender: "pick",
        text: replyText,
        actionType: output.matches.length === 0 ? "ADD_PRODUCT" : undefined,
        timestamp: Date.now() + 2,
      };
      updateMessages([...messages, scanMsg, resultMsg]);
    } catch (err: any) {
      const errMsg: StoredMessage = {
        id: String(Date.now() + 2),
        sender: "pick",
        text: `Visual scan me dikkat aayi: ${err?.message || "Image analyze nahi ho saki."}`,
        timestamp: Date.now() + 2,
      };
      updateMessages([...messages, scanMsg, errMsg]);
    } finally {
      setIsVisualScanning(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 200);
    }
  };

  const handleBulkRestock = async () => {
    if (lowItems.length === 0) return;
    setIsBulkRestocking(true);
    try {
      for (const item of lowItems) {
        await adjustStockMutation.mutateAsync({
          product_id: item.product_id || item.id || "",
          adjustment: 10,
          reason: "Gemini 1-Click Bulk Restock (+10)",
        });
      }
      await refetchLowStock();
      const confirmMsg: StoredMessage = {
        id: String(Date.now()),
        sender: "pick",
        text: `Badhiya! ${lowItems.length} products me +10 units add kar di gayi hain. Dukaan ka stock refresh ho gaya hai!`,
        timestamp: Date.now(),
      };
      updateMessages([...messages, confirmMsg]);
    } catch (err: any) {
      const failMsg: StoredMessage = {
        id: String(Date.now()),
        sender: "pick",
        text: `Restock me dikkat aayi: ${err?.message || "Error"}`,
        timestamp: Date.now(),
      };
      updateMessages([...messages, failMsg]);
    } finally {
      setIsBulkRestocking(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.botBubble}>
                <Sparkles size={20} color="#fff" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]}>Gemini AI Assistant</Text>
                  <View style={styles.geminiBadge}>
                    <Text style={styles.geminiBadgeText}>2.0 FLASH</Text>
                  </View>
                </View>
                <View style={styles.badgeRow}>
                  <Cpu size={11} color={isGeminiLive ? "#10b981" : "#2563eb"} />
                  <Text style={[styles.subtitle, { color: isGeminiLive ? "#10b981" : colors.textMuted }]}>
                    {isGeminiLive ? "Persistent Memory Active" : "Smart Offline Assistant"}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerRightActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear Chat Memory"
                onPress={handleResetChat}
                style={styles.headerIconBtn}
              >
                <RotateCcw size={17} color={colors.textMuted} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                onPress={onClose}
                style={styles.headerIconBtn}
              >
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          </View>

          {/* Voice Listening Banner */}
          {speechHint && (
            <View style={styles.speechHintBar}>
              <Volume2 size={15} color="#2563eb" />
              <Text style={styles.speechHintText}>{speechHint}</Text>
            </View>
          )}

          {/* Messages List */}
          <ScrollView
            ref={scrollViewRef}
            contentContainerStyle={styles.messagesList}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <View
                  key={m.id}
                  style={[
                    styles.msgWrap,
                    isUser ? styles.msgWrapUser : styles.msgWrapPick,
                  ]}
                >
                  <View
                    style={[
                      styles.bubble,
                      isUser
                        ? [styles.bubbleUser, { backgroundColor: colors.primary }]
                        : [styles.bubblePick, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.bubbleText,
                        { color: isUser ? "#fff" : colors.text },
                      ]}
                    >
                      {m.text}
                    </Text>

                    {m.actionType === "RESTOCK" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          disabled={isBulkRestocking}
                          onPress={handleBulkRestock}
                          style={styles.restockBtn}
                        >
                          {isBulkRestocking ? (
                            <ActivityIndicator size="small" color="#fff" />
                          ) : (
                            <>
                              <Zap size={14} color="#fff" />
                              <Text style={styles.actionBtnText}>1-Click Bulk Restock (+10)</Text>
                            </>
                          )}
                        </Pressable>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/inventory");
                          }}
                          style={[styles.outlineBtn, { borderColor: colors.surfaceBorder }]}
                        >
                          <Boxes size={14} color={colors.text} />
                          <Text style={[styles.outlineBtnText, { color: colors.text }]}>Open Inventory</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "OFFERS" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/offers");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary }]}
                        >
                          <Tag size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Create Offer Now</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "ANALYTICS" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/analytics");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: colors.primary }]}
                        >
                          <TrendingUp size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>View Asli Munafa</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "KHATA" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/khata");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: "#dc2626" }]}
                        >
                          <BookOpen size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Open Customer Khata</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "POS" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/pos");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: "#2563eb" }]}
                        >
                          <Zap size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Open Counter Billing</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "EXPENSES" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/expenses");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: "#d97706" }]}
                        >
                          <TrendingUp size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Record Daily Expense</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "ADD_PRODUCT" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/add-product");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: "#059669" }]}
                        >
                          <Boxes size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Add Product with Margins</Text>
                        </Pressable>
                      </View>
                    )}

                    {m.actionType === "PICKUPS" && (
                      <View style={styles.actionBtnsRow}>
                        <Pressable
                          accessibilityRole="button"
                          onPress={() => {
                            onClose();
                            router.push("/merchant/pickups");
                          }}
                          style={[styles.actionPrimaryBtn, { backgroundColor: "#7c3aed" }]}
                        >
                          <Sparkles size={14} color="#fff" />
                          <Text style={styles.actionBtnText}>Verify Customer Pickups</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isTyping && (
              <View style={[styles.msgWrap, styles.msgWrapPick]}>
                <View style={[styles.bubble, styles.bubblePick, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
                  <Text style={[styles.bubbleText, { color: colors.textMuted, fontStyle: "italic" }]}>
                    Gemini dukaan ka data check kar raha hai...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick prompt suggestions chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.promptChipsScroll}
            style={[styles.chipsBar, { borderTopColor: colors.surfaceBorder, backgroundColor: colors.background }]}
          >
            {QUICK_PROMPTS.map((p) => (
              <Pressable
                key={p}
                accessibilityRole="button"
                onPress={() => handleSendMessage(p)}
                style={[styles.promptChip, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.promptChipText, { color: colors.textMuted }]}>{p}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Input Bar with Mic + Visual Scan + Send Buttons */}
          <View style={[styles.inputBar, { borderTopColor: colors.surfaceBorder, backgroundColor: colors.surface }]}>
            <TextInput
              ref={inputRef}
              style={[styles.textInput, { backgroundColor: colors.background, borderColor: colors.inputBorder, color: colors.text }]}
              placeholder="Bolkar ya likhkar poochiye... (e.g. bill kaise banayein?)"
              placeholderTextColor={colors.textMuted}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={() => handleSendMessage()}
            />

            {/* 📷 Visual Product Scan Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Visual Product Scan"
              onPress={handleVisualScanFromChat}
              disabled={isVisualScanning || isTyping}
              style={[
                styles.micBtn,
                { backgroundColor: isVisualScanning ? "#7c3aed" : "rgba(124, 58, 237, 0.12)" },
              ]}
            >
              {isVisualScanning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <ScanLine size={18} color="#7c3aed" />
              )}
            </Pressable>

            {/* Dedicated Voice Command Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Voice Command Mic"
              onPress={handleToggleVoice}
              style={[
                styles.micBtn,
                { backgroundColor: isListening ? "#ef4444" : "rgba(37, 99, 235, 0.12)" },
              ]}
            >
              {isListening ? (
                <MicOff size={18} color="#fff" />
              ) : (
                <Mic size={18} color={colors.primary} />
              )}
            </Pressable>

            {/* Send Button */}
            <Pressable
              accessibilityRole="button"
              onPress={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              style={[
                styles.sendBtn,
                { backgroundColor: input.trim() && !isTyping ? colors.primary : colors.surfaceBorder },
              ]}
            >
              <Send size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
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
    height: "85%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  botBubble: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 16, fontWeight: "800" },
  geminiBadge: {
    backgroundColor: "rgba(124, 58, 237, 0.14)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  geminiBadgeText: {
    fontSize: 9,
    fontWeight: "900",
    color: "#7c3aed",
    letterSpacing: 0.5,
  },
  badgeRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 1 },
  subtitle: { fontSize: 11, fontWeight: "600" },
  headerRightActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: { padding: 6, borderRadius: 8 },
  speechHintBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(37, 99, 235, 0.08)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(37, 99, 235, 0.15)",
  },
  speechHintText: { fontSize: 12, fontWeight: "700", color: "#2563eb" },
  messagesList: { padding: 16, gap: 12 },
  msgWrap: { flexDirection: "row" },
  msgWrapUser: { justifyContent: "flex-end" },
  msgWrapPick: { justifyContent: "flex-start" },
  bubble: {
    maxWidth: "85%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  bubbleUser: {
    borderBottomRightRadius: 4,
  },
  bubblePick: {
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  bubbleText: {
    fontSize: 13,
    lineHeight: 19,
  },
  actionBtnsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
    flexWrap: "wrap",
  },
  restockBtn: {
    backgroundColor: "#10b981",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionPrimaryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  actionBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  outlineBtn: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  outlineBtnText: { fontSize: 12, fontWeight: "600" },
  chipsBar: {
    borderTopWidth: 1,
    maxHeight: 46,
  },
  promptChipsScroll: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 8,
  },
  promptChip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  promptChipText: { fontSize: 12, fontWeight: "600" },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 40,
    fontSize: 13,
  },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
