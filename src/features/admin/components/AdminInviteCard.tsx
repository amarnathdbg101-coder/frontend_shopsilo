import React, { useState } from "react";
import { StyleSheet, Text, View, Linking, Alert } from "react-native";
import { Button } from "@/components/Button";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ADMIN_CONFIG } from "@/features/merchant/services/shopAccessGate";
import { KeyRound, MessageSquare, RefreshCw, ShieldCheck } from "lucide-react-native";

export const AdminInviteCard: React.FC = () => {
  const { colors } = useThemeColor();
  const [dynamicOtp, setDynamicOtp] = useState<string | null>(null);

  const handleGenerateNew = () => {
    const raw = Math.floor(100000 + Math.random() * 900000).toString();
    setDynamicOtp(raw);
  };

  const handleShareWhatsApp = (code: string) => {
    const message =
      `*ShopSilo Merchant Access Invitation*\n\n` +
      `Namaste! Aapke liye ShopSilo par apni dukaan create karne ka authorization code:\n\n` +
      `🔑 *Verification OTP:* ${code}\n\n` +
      `ShopSilo app open karein, menu me 'Become a Shop Owner' par jayein, aur ye 6-digit code enter karke apni nayi dukaan launch karein!`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert("WhatsApp Unavailable", `Invite OTP is: ${code}`);
    });
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <KeyRound size={18} color="#d97706" />
          <Text style={[styles.title, { color: colors.text }]}>
            Shop Creation Access & OTP
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>PRIVATE BETA</Text>
        </View>
      </View>

      <Text style={[styles.desc, { color: colors.textMuted }]}>
        Only specific users with an OTP can register a shop. Share the master code or generate an instant one-time invite.
      </Text>

      {/* Master OTP Row */}
      <View style={[styles.otpBox, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
        <View style={styles.otpLeft}>
          <ShieldCheck size={16} color="#16a34a" />
          <View>
            <Text style={[styles.otpLabel, { color: colors.textMuted }]}>Master Admin Passcode</Text>
            <Text style={[styles.otpValue, { color: colors.text }]}>{ADMIN_CONFIG.MASTER_OTP}</Text>
          </View>
        </View>
        <Button
          title="Share"
          size="sm"
          variant="outline"
          leftIcon={<MessageSquare size={14} color={colors.primary} />}
          onPress={() => handleShareWhatsApp(ADMIN_CONFIG.MASTER_OTP)}
        />
      </View>

      {/* Dynamic OTP generator */}
      {dynamicOtp && (
        <View style={[styles.dynamicOtpBox, { backgroundColor: "#ecfdf5", borderColor: "#a7f3d0" }]}>
          <View>
            <Text style={styles.dynamicLabel}>Generated Invite Code:</Text>
            <Text style={styles.dynamicValue}>{dynamicOtp}</Text>
          </View>
          <Button
            title="Share Code"
            size="sm"
            variant="primary"
            leftIcon={<MessageSquare size={14} color="#ffffff" />}
            onPress={() => handleShareWhatsApp(dynamicOtp)}
            style={styles.greenBtn}
          />
        </View>
      )}

      <Button
        title={dynamicOtp ? "Generate Another Code" : "Generate Instant 6-Digit Code"}
        size="md"
        variant="outline"
        leftIcon={<RefreshCw size={15} color={colors.text} />}
        onPress={handleGenerateNew}
        style={styles.genBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  badge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: "#b45309",
    fontSize: 10,
    fontWeight: "800",
  },
  desc: {
    fontSize: 12,
    lineHeight: 16,
  },
  otpBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  otpLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  otpLabel: {
    fontSize: 10,
    fontWeight: "600",
  },
  otpValue: {
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  dynamicOtpBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  dynamicLabel: {
    color: "#047857",
    fontSize: 10,
    fontWeight: "700",
  },
  dynamicValue: {
    color: "#065f46",
    fontSize: 18,
    fontWeight: "900",
    letterSpacing: 2,
  },
  greenBtn: {
    backgroundColor: "#10b981",
  },
  genBtn: {
    marginTop: 2,
  },
});
