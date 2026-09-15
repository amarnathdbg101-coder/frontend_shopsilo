import React from "react";
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, Linking } from "react-native";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, Headphones, MessageSquare, Mail } from "lucide-react-native";

interface HelpSupportModalProps {
  visible: boolean;
  onClose: () => void;
}

const FAQS = [
  { q: "How do in-store reservations work?", a: "Browse local store items, reserve at the counter, and present your 4-digit OTP to the shopkeeper for zero-wait pickup." },
  { q: "How do I redeem Loyalty points?", a: "Loyalty points automatically upgrade your tier (Bronze to Gold) and unlock exclusive discount coupons on your favorite shops." },
  { q: "What is Smart Bargaining?", a: "On eligible products, tap 'Bargain' to propose your desired price. The store responds instantly with accepted or counter offers." },
];

export const HelpSupportModal: React.FC<HelpSupportModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeColor();

  const handleWhatsApp = () => {
    Linking.openURL("https://wa.me/917979014637?text=Hi%20ShopSilo%20Support").catch(() => {});
  };

  const handleEmail = () => {
    Linking.openURL("mailto:amarnathdbg101@gmail.com?subject=ShopSilo%20Support%20Inquiry").catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Headphones size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>24x7 Help & Support</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.actionRow}>
              <Button
                title="WhatsApp Us"
                onPress={handleWhatsApp}
                leftIcon={<MessageSquare size={16} color="#ffffff" />}
                style={styles.waBtn}
              />
              <Button
                title="Email Support"
                variant="outline"
                onPress={handleEmail}
                leftIcon={<Mail size={16} color={colors.primary} />}
                style={styles.emailBtn}
              />
            </View>

            <Text style={[styles.faqHeading, { color: colors.text }]}>Common Questions</Text>
            {FAQS.map((faq) => (
              <View
                key={faq.q}
                style={[styles.faqCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}
              >
                <Text style={[styles.faqQ, { color: colors.text }]}>{faq.q}</Text>
                <Text style={[styles.faqA, { color: colors.textMuted }]}>{faq.a}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  card: { width: "100%", maxWidth: 380, maxHeight: "80%", borderRadius: 20, borderWidth: 1, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  content: { gap: 12 },
  actionRow: { flexDirection: "row", gap: 8 },
  waBtn: { flex: 1, backgroundColor: "#25D366", borderColor: "#25D366" },
  emailBtn: { flex: 1 },
  faqHeading: { fontSize: 14, fontWeight: "800", marginTop: 4 },
  faqCard: { padding: 12, borderRadius: 12, borderWidth: 1, gap: 4 },
  faqQ: { fontSize: 13, fontWeight: "700" },
  faqA: { fontSize: 12, lineHeight: 18 },
});
