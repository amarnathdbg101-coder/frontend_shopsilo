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
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Shop } from "@/features/shops/types";
import { Product, Category } from "../types";
import { askCustomerGemini, CustomerAIContext } from "../services/customerGemini";
import {
  loadCustomerChatHistory,
  saveCustomerChatHistory,
  clearCustomerMemory,
  StoredCustomerMessage,
  CustomerAction,
} from "../services/customerGeminiMemory";
import {
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  RotateCcw,
  Store,
  ShoppingBag,
  Flame,
  Scan,
  MapPin,
  Bot,
  ChevronRight,
} from "lucide-react-native";

interface CustomerGeminiModalProps {
  visible: boolean;
  onClose: () => void;
  currentLocation?: {
    city?: string;
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  nearbyShops?: Shop[];
  catalogProducts?: Product[];
  categories?: Category[];
  onOpenDeals?: () => void;
  onOpenScanner?: () => void;
  onOpenLocation?: () => void;
}

const QUICK_PROMPTS = [
  "🏪 Aas paas kaunsi dukan khuli hai?",
  "🥛 Doodh aur daily grocery kahan milegi?",
  "🔥 Aaj ke top discount aur deals dikhao",
  "📦 Store pickup order kaise karte hain?",
  "📍 Mere area ki top-rated dukan?",
  "📷 Barcode scan kaise karte hain?",
];

const DEFAULT_WELCOME_MESSAGE: StoredCustomerMessage = {
  id: "welcome-cust-1",
  sender: "gemini",
  text: "Namaste! Main aapka Gemini Shopping Sathi hoon. 🛍️✨\n\nAapke aas-paas kaunsi dukaan khuli hai, koi saaman (atta, doodh, dawa, snacks) kahan milega, ya store pickup kaise karna hai — bas bolkar ya likhkar poochiye!",
  actions: [
    { type: "DEALS", label: "🔥 Top Deals Dekhein" },
    { type: "SCANNER", label: "📷 Barcode Scanner" },
  ],
};

export const CustomerGeminiModal: React.FC<CustomerGeminiModalProps> = ({
  visible,
  onClose,
  currentLocation,
  nearbyShops = [],
  catalogProducts = [],
  categories = [],
  onOpenDeals,
  onOpenScanner,
  onOpenLocation,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<StoredCustomerMessage[]>([DEFAULT_WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechHint, setSpeechHint] = useState<string | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  // 1. Load persisted chat history on mount
  useEffect(() => {
    let mounted = true;
    loadCustomerChatHistory().then((history) => {
      if (mounted && history.length > 0) {
        setMessages(history);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // 2. Save conversation updates to local storage
  const updateMessages = (newMessages: StoredCustomerMessage[]) => {
    setMessages(newMessages);
    saveCustomerChatHistory(newMessages);
  };

  // 3. Web Speech Recognition for voice input
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
      // Mobile native dictation hint
      inputRef.current?.focus();
      setSpeechHint("🎙️ Keyboard me spacebar ke paas wala mic dabakar Hindi me boliye!");
      setTimeout(() => setSpeechHint(null), 5000);
    }
  };

  const handleResetChat = () => {
    Alert.alert(
      "Nayi Baat Shuru Karein?",
      "Purani chat history clear ho jayegi aur Gemini Shopping Sathi fresh shuru karega.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear History",
          style: "destructive",
          onPress: async () => {
            await clearCustomerMemory();
            setMessages([DEFAULT_WELCOME_MESSAGE]);
          },
        },
      ]
    );
  };

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || isTyping) return;

    setInput("");
    setSpeechHint(null);

    const userMessage: StoredCustomerMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: Date.now(),
    };

    const updated = [...messages, userMessage];
    updateMessages(updated);
    setIsTyping(true);

    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const context: CustomerAIContext = {
        currentLocation,
        nearbyShops,
        catalogProducts,
        categories,
      };

      const aiResponse = await askCustomerGemini(query, updated, context);

      const geminiMessage: StoredCustomerMessage = {
        id: `gemini-${Date.now()}`,
        sender: "gemini",
        text: aiResponse.text,
        actions: aiResponse.actions,
        timestamp: Date.now(),
      };

      updateMessages([...updated, geminiMessage]);
    } catch (err) {
      console.error("[CustomerGeminiModal] Chat error:", err);
      const errorMessage: StoredCustomerMessage = {
        id: `error-${Date.now()}`,
        sender: "gemini",
        text: "Kshama karein, thoda network issue aa raha hai. Kripya dobara try karein ya home search use karein.",
        timestamp: Date.now(),
      };
      updateMessages([...updated, errorMessage]);
    } finally {
      setIsTyping(false);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const handleActionClick = (action: CustomerAction) => {
    if (action.type === "SHOP" && action.payload) {
      onClose();
      router.push(`/shop/${action.payload}`);
    } else if (action.type === "PRODUCT" && action.payload) {
      onClose();
      router.push(`/product/${action.payload}`);
    } else if (action.type === "DEALS") {
      onClose();
      onOpenDeals?.();
    } else if (action.type === "SCANNER") {
      onClose();
      onOpenScanner?.();
    } else if (action.type === "LOCATION") {
      onClose();
      onOpenLocation?.();
    }
  };

  const renderActionIcon = (type: CustomerAction["type"]) => {
    switch (type) {
      case "SHOP":
        return <Store size={14} color="#7c3aed" />;
      case "PRODUCT":
        return <ShoppingBag size={14} color="#7c3aed" />;
      case "DEALS":
        return <Flame size={14} color="#ea580c" />;
      case "SCANNER":
        return <Scan size={14} color="#2563eb" />;
      case "LOCATION":
        return <MapPin size={14} color="#059669" />;
      default:
        return <ChevronRight size={14} color="#7c3aed" />;
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.headerLeft}>
              <View style={styles.aiBadge}>
                <Sparkles size={18} color="#ffffff" />
              </View>
              <View>
                <View style={styles.titleRow}>
                  <Text style={[styles.title, { color: colors.text }]}>Gemini Shopping Sathi</Text>
                  <View style={styles.liveBadge}>
                    <Text style={styles.liveBadgeText}>⚡ Gemini 3.6 Flash</Text>
                  </View>
                </View>
                <Text style={[styles.subtitle, { color: colors.textMuted }]}>
                  {currentLocation?.city ? `📍 ${currentLocation.city}` : "Aas-paas ki dukan aur saaman khojein"}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <Pressable
                onPress={handleResetChat}
                style={[styles.iconButton, { backgroundColor: colors.surface }]}
                accessibilityLabel="Reset Conversation"
              >
                <RotateCcw size={16} color={colors.textMuted} />
              </Pressable>
              <Pressable
                onPress={onClose}
                style={[styles.iconButton, { backgroundColor: colors.surface }]}
                accessibilityLabel="Close"
              >
                <X size={18} color={colors.text} />
              </Pressable>
            </View>
          </View>

          {/* Quick Prompt Carousel */}
          <View style={styles.quickPromptContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickPromptScroll}
            >
              {QUICK_PROMPTS.map((prompt, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => handleSendMessage(prompt)}
                  disabled={isTyping}
                  style={[
                    styles.quickPromptChip,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  ]}
                >
                  <Text style={[styles.quickPromptText, { color: colors.text }]}>{prompt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Chat Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatScrollContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((m) => {
              const isUser = m.sender === "user";
              return (
                <View
                  key={m.id}
                  style={[
                    styles.messageRow,
                    isUser ? styles.messageRowUser : styles.messageRowGemini,
                  ]}
                >
                  {!isUser && (
                    <View style={styles.geminiAvatar}>
                      <Bot size={16} color="#7c3aed" />
                    </View>
                  )}

                  <View
                    style={[
                      styles.messageBubble,
                      isUser
                        ? [styles.userBubble, { backgroundColor: "#7c3aed" }]
                        : [
                            styles.geminiBubble,
                            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                          ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.messageText,
                        { color: isUser ? "#ffffff" : colors.text },
                      ]}
                    >
                      {m.text}
                    </Text>

                    {/* Interactive Action Buttons */}
                    {m.actions && m.actions.length > 0 && (
                      <View style={styles.actionsContainer}>
                        {m.actions.map((act, actIdx) => (
                          <Pressable
                            key={actIdx}
                            onPress={() => handleActionClick(act)}
                            style={[
                              styles.actionButton,
                              { backgroundColor: colors.background, borderColor: "#7c3aed33" },
                            ]}
                          >
                            {renderActionIcon(act.type)}
                            <Text style={styles.actionButtonText}>{act.label}</Text>
                            <ChevronRight size={12} color="#7c3aed" />
                          </Pressable>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              );
            })}

            {isTyping && (
              <View style={[styles.messageRow, styles.messageRowGemini]}>
                <View style={styles.geminiAvatar}>
                  <Bot size={16} color="#7c3aed" />
                </View>
                <View
                  style={[
                    styles.messageBubble,
                    styles.geminiBubble,
                    { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                  ]}
                >
                  <View style={styles.typingIndicatorRow}>
                    <ActivityIndicator size="small" color="#7c3aed" />
                    <Text style={[styles.typingText, { color: colors.textMuted }]}>
                      Dukan aur saaman check kar raha hoon...
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Speech Hint Banner */}
          {speechHint && (
            <View style={[styles.speechHintBanner, { backgroundColor: "#f5f3ff", borderColor: "#c4b5fd" }]}>
              <Text style={styles.speechHintText}>{speechHint}</Text>
            </View>
          )}

          {/* Input Bar */}
          <View
            style={[
              styles.inputBar,
              { backgroundColor: colors.surface, borderTopColor: colors.surfaceBorder },
            ]}
          >
            <Pressable
              onPress={handleToggleVoice}
              style={[
                styles.micButton,
                isListening && styles.micButtonActive,
              ]}
              accessibilityLabel="Voice Input"
            >
              {isListening ? (
                <MicOff size={20} color="#dc2626" />
              ) : (
                <Mic size={20} color="#7c3aed" />
              )}
            </Pressable>

            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder="Dukaan, saaman ya rate poochiye..."
              placeholderTextColor={colors.textMuted}
              style={[
                styles.textInput,
                { color: colors.text, backgroundColor: colors.background, borderColor: colors.surfaceBorder },
              ]}
              returnKeyType="send"
              onSubmitEditing={() => handleSendMessage()}
              editable={!isTyping}
            />

            <Pressable
              onPress={() => handleSendMessage()}
              disabled={!input.trim() || isTyping}
              style={[
                styles.sendButton,
                { opacity: input.trim() && !isTyping ? 1 : 0.4 },
              ]}
            >
              <Send size={18} color="#ffffff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
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
    gap: 12,
    flex: 1,
  },
  aiBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
  },
  liveBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#059669",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  quickPromptContainer: {
    paddingVertical: 10,
  },
  quickPromptScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPromptChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
  },
  quickPromptText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 12,
  },
  messageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  messageRowUser: {
    justifyContent: "flex-end",
  },
  messageRowGemini: {
    justifyContent: "flex-start",
  },
  geminiAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f3e8ff",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  messageBubble: {
    maxWidth: "84%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  geminiBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionsContainer: {
    marginTop: 10,
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(124, 58, 237, 0.2)",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7c3aed",
    flex: 1,
  },
  typingIndicatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 4,
  },
  typingText: {
    fontSize: 13,
    fontStyle: "italic",
  },
  speechHintBanner: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  speechHintText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b21a8",
    textAlign: "center",
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f3e8ff",
  },
  micButtonActive: {
    backgroundColor: "#fee2e2",
  },
  textInput: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#7c3aed",
    alignItems: "center",
    justifyContent: "center",
  },
});
