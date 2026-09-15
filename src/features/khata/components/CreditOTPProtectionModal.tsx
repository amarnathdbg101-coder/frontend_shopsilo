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
  Switch,
} from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { formatCurrency } from "@/utils/format";
import { X, ShieldAlert, ShieldCheck, CheckCircle2, Lock } from "lucide-react-native";

interface CreditOTPProtectionModalProps {
  visible: boolean;
  onClose: () => void;
  khataId: string;
  shopName: string;
  initialRequired?: boolean;
  initialThreshold?: number;
  onUpdated?: () => void;
}

export const CreditOTPProtectionModal: React.FC<CreditOTPProtectionModalProps> = ({
  visible,
  onClose,
  khataId,
  shopName,
  initialRequired = false,
  initialThreshold = 1000,
  onUpdated,
}) => {
  const { colors, isDark } = useThemeColor();

  const [isEnabled, setIsEnabled] = useState(initialRequired);
  const [threshold, setThreshold] = useState(String(initialThreshold > 0 ? initialThreshold : 1000));
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsEnabled(initialRequired);
      setThreshold(String(initialThreshold > 0 ? initialThreshold : 1000));
    }
  }, [visible, initialRequired, initialThreshold]);

  const handleSave = async () => {
    const amt = parseFloat(threshold);
    if (isEnabled && (!amt || amt <= 0)) {
      Alert.alert("Limit Required", "Kripya sahi threshold amount enter karein.");
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.put(Endpoints.CUSTOMER_KHATA.SET_OTP_PROTECTION(khataId), {
        required: isEnabled,
        threshold: isEnabled ? amt : 0,
      });
      Alert.alert(
        "Suraksha Update Ho Gayi",
        isEnabled
          ? `Ab ${shopName} se ${formatCurrency(amt)} se adhik udhar par aapka OTP jaruri hoga.`
          : "Badi udhari par OTP suraksha band kar di gayi hai."
      );
      onUpdated?.();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Suraksha setting save nahi ho payi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const presetAmounts = [500, 1000, 2000, 5000];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.surfaceBorder }]}>
            <View style={styles.titleRow}>
              <ShieldAlert size={22} color={colors.primary} />
              <View>
                <Text style={[styles.title, { color: colors.text }]}>High-Value Credit OTP</Text>
                <Text style={[styles.subtitle, { color: colors.textMuted }]} numberOfLines={1}>
                  {shopName} ke sath suraksha
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

          {/* Toggle Switch */}
          <View style={styles.body}>
            <View style={[styles.toggleCard, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.toggleTitle, { color: colors.text }]}>
                  Badi Udhari OTP Suraksha
                </Text>
                <Text style={[styles.toggleDesc, { color: colors.textMuted }]}>
                  Nirdharit seema se upar ka udhar likhne par aapki manzoori OTP chahiye.
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={setIsEnabled}
                trackColor={{ false: colors.surfaceBorder, true: colors.primary }}
                thumbColor="#fff"
              />
            </View>

            {isEnabled && (
              <View style={styles.thresholdSection}>
                <Text style={[styles.sectionLabel, { color: colors.text }]}>
                  Suraksha Seema (Threshold Amount ₹):
                </Text>

                <TextInput
                  style={[
                    styles.amountInput,
                    { color: colors.text, borderColor: colors.surfaceBorder, backgroundColor: colors.background },
                  ]}
                  keyboardType="numeric"
                  placeholder="₹ Amount e.g. 1000"
                  placeholderTextColor={colors.textMuted}
                  value={threshold}
                  onChangeText={setThreshold}
                />

                {/* Preset Chips */}
                <View style={styles.presetsRow}>
                  {presetAmounts.map((amt) => (
                    <Pressable
                      key={amt}
                      onPress={() => setThreshold(String(amt))}
                      style={[
                        styles.presetChip,
                        {
                          backgroundColor:
                            threshold === String(amt)
                              ? colors.primary
                              : isDark
                              ? "#1e293b"
                              : "#f1f5f9",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.presetText,
                          { color: threshold === String(amt) ? "#fff" : colors.text },
                        ]}
                      >
                        ₹{amt}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View
                  style={[
                    styles.infoBanner,
                    { backgroundColor: isDark ? "#1e293b" : "#f0fdf4" },
                  ]}
                >
                  <Lock size={16} color="#16a34a" />
                  <Text style={[styles.infoBannerText, { color: isDark ? "#94a3b8" : "#166534" }]}>
                    Is seema se zyada ka udhar dukandar bina aapke passbook OTP ke nahi likh sakega.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Footer Save Button */}
          <View style={[styles.footer, { borderTopColor: colors.surfaceBorder }]}>
            <Pressable
              accessibilityRole="button"
              onPress={handleSave}
              disabled={isSubmitting}
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <>
                  <CheckCircle2 size={18} color="#fff" />
                  <Text style={styles.saveBtnText}>Suraksha Settings Save Karein</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    padding: 20,
  },
  container: {
    borderRadius: 24,
    overflow: "hidden",
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    maxWidth: 220,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    padding: 20,
    gap: 16,
  },
  toggleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  toggleDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  thresholdSection: {
    gap: 10,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  amountInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: "700",
  },
  presetsRow: {
    flexDirection: "row",
    gap: 8,
  },
  presetChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  presetText: {
    fontSize: 13,
    fontWeight: "600",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
  },
  saveBtn: {
    height: 48,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
  },
});
