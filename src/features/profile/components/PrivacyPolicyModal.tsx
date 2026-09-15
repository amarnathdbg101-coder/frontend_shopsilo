import React, { useState } from "react";
import { Modal, StyleSheet, Text, View, Pressable, ScrollView, Linking } from "react-native";
import { POLICIES } from "@/features/profile/constants/policyData";
import { PolicySectionCard } from "@/features/profile/components/PolicySectionCard";
import { useThemeColor } from "@/hooks/useThemeColor";
import { X, Shield, Mail, Lock } from "lucide-react-native";

interface PrivacyPolicyModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({ visible, onClose }) => {
  const { colors } = useThemeColor();
  const [activeTab, setActiveTab] = useState<"privacy" | "terms" | "returns">("privacy");

  const currentCategory = POLICIES.find((p) => p.id === activeTab) || POLICIES[0];

  const handleContactGrievance = () => {
    Linking.openURL("mailto:amarnathdbg101@gmail.com?subject=Policy%20Inquiry%20or%20Dispute").catch(() => {});
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Shield size={20} color={colors.primary} />
              <Text style={[styles.title, { color: colors.text }]}>Legal & Store Policies</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Segmented Tab Bar */}
          <View style={[styles.tabBar, { backgroundColor: colors.background }]}>
            {POLICIES.map((cat) => {
              const isActive = activeTab === cat.id;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => setActiveTab(cat.id)}
                  style={[styles.tabBtn, isActive && { backgroundColor: colors.surface, borderColor: colors.primary, borderWidth: 1 }]}
                >
                  <Text style={[styles.tabText, { color: isActive ? colors.primary : colors.textMuted }]}>
                    {cat.id === "privacy" ? "Privacy" : cat.id === "terms" ? "Store Terms" : "Returns"}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            {/* Merchant Safe Trade Banner */}
            <View style={styles.protectionBanner}>
              <Lock size={15} color="#15803d" />
              <Text style={styles.protectionText}>
                All transactions are governed under Indian Consumer Protection (E-Commerce) Rules 2020 & DPDP Act 2023.
              </Text>
            </View>

            {currentCategory.items.map((item) => (
              <PolicySectionCard key={item.id} item={item} />
            ))}

            {/* Grievance Officer Contact */}
            <Pressable onPress={handleContactGrievance} style={[styles.grievanceBox, { borderColor: colors.surfaceBorder }]}>
              <Mail size={16} color={colors.primary} />
              <View style={styles.grievanceTextWrap}>
                <Text style={[styles.grievanceTitle, { color: colors.text }]}>Grievance & Compliance Officer</Text>
                <Text style={[styles.grievanceSub, { color: colors.textMuted }]}>amarnathdbg101@gmail.com • Response within 48 business hours</Text>
              </View>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center", padding: 18 },
  card: { width: "100%", maxWidth: 390, maxHeight: "85%", borderRadius: 20, borderWidth: 1, padding: 18 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 17, fontWeight: "800" },
  closeBtn: { padding: 4 },
  tabBar: { flexDirection: "row", padding: 4, borderRadius: 12, marginBottom: 12, gap: 4 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: "center", borderRadius: 8 },
  tabText: { fontSize: 12, fontWeight: "800" },
  content: { gap: 6, paddingBottom: 10 },
  protectionBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f0fdf4", borderColor: "#86efac", borderWidth: 1, borderRadius: 10, padding: 10, marginBottom: 8 },
  protectionText: { fontSize: 11, color: "#166534", fontWeight: "600", flex: 1, lineHeight: 16 },
  grievanceBox: { flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  grievanceTextWrap: { flex: 1 },
  grievanceTitle: { fontSize: 12, fontWeight: "800" },
  grievanceSub: { fontSize: 11, marginTop: 2 },
});
