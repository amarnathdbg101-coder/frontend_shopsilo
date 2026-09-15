import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, Linking, Alert, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { useThemeColor } from "@/hooks/useThemeColor";
import { User } from "@/features/auth/types";
import {
  generateShopRegistrationOTP,
  buildAdminWhatsAppUrl,
  buildAdminEmailUrl,
  verifyShopRegistrationOTP,
  ADMIN_CONFIG,
} from "../services/shopAccessGate";
import { Lock, KeyRound, MessageSquare, Mail, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react-native";

interface ShopRegistrationLockViewProps {
  user: User | null;
  onUnlocked: () => void;
}

export const ShopRegistrationLockView: React.FC<ShopRegistrationLockViewProps> = ({
  user,
  onUnlocked,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  const [otpInput, setOtpInput] = useState("");
  const [isRequesting, setIsRequesting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [lastRequestedOtp, setLastRequestedOtp] = useState<string | null>(null);

  // Handler: Request OTP via WhatsApp to Admin
  const handleRequestWhatsApp = async () => {
    try {
      setIsRequesting(true);
      const userId = user?.id || "guest_applicant";
      const otp = await generateShopRegistrationOTP(userId);
      setLastRequestedOtp(otp);

      const url = buildAdminWhatsAppUrl(otp, user);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url).catch(() => {
          Alert.alert("WhatsApp Not Available", `Please send OTP: ${otp} to Admin at +91 ${ADMIN_CONFIG.PHONE}`);
        });
      }
    } catch {
      Alert.alert("Error", "Could not generate OTP request. Please try again.");
    } finally {
      setIsRequesting(false);
    }
  };

  // Handler: Request OTP via Email to Admin
  const handleRequestEmail = async () => {
    try {
      const userId = user?.id || "guest_applicant";
      const otp = await generateShopRegistrationOTP(userId);
      setLastRequestedOtp(otp);

      const url = buildAdminEmailUrl(otp, user);
      await Linking.openURL(url).catch(() => {
        Alert.alert("Email Client Not Found", `Please email ${ADMIN_CONFIG.EMAIL} with verification OTP: ${otp}`);
      });
    } catch {
      Alert.alert("Error", "Could not generate email request.");
    }
  };

  // Handler: Verify entered OTP
  const handleVerify = async () => {
    if (!otpInput.trim() || otpInput.trim().length < 6) {
      Alert.alert("Invalid Input", "Please enter the 6-digit OTP provided by the Admin.");
      return;
    }

    try {
      setIsVerifying(true);
      const userId = user?.id || "guest_applicant";
      const res = await verifyShopRegistrationOTP(otpInput, userId);

      if (res.success) {
        Alert.alert("Access Granted! 🎉", "Shop registration has been unlocked.", [
          { text: "Continue", onPress: onUnlocked },
        ]);
      } else {
        Alert.alert("Verification Failed", res.message);
      }
    } catch {
      Alert.alert("Error", "Verification could not be processed. Please retry.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} style={styles.backBtn}>
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>

      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: "#fef3c7", borderColor: "#fde68a" }]}>
          <Lock size={32} color="#b45309" />
        </View>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>INVITATION ONLY</Text>
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>Private Store Access</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          ShopSilo is currently in personal beta mode. Dukaan open karne ke liye Admin se OTP prapt karein.
        </Text>
      </View>

      {/* Applicant Card */}
      <View style={[styles.userCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.userCardRow}>
          <ShieldCheck size={18} color={colors.primary} />
          <Text style={[styles.userCardTitle, { color: colors.text }]}>Applicant Information</Text>
        </View>
        <Text style={[styles.userInfo, { color: colors.textMuted }]}>
          Name: <Text style={{ color: colors.text, fontWeight: "600" }}>{user?.full_name || "Merchant"}</Text>
        </Text>
        <Text style={[styles.userInfo, { color: colors.textMuted }]}>
          Mobile: <Text style={{ color: colors.text, fontWeight: "600" }}>{user?.phone || user?.email || "N/A"}</Text>
        </Text>
      </View>

      {/* Step 1: Request OTP */}
      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.stepNumber, { color: colors.primary }]}>STEP 1: REQUEST ACCESS</Text>
        <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
          Admin ko WhatsApp par request bhejiye taaki wo aapko 6-digit invitation code share kar sakein.
        </Text>
        <View style={styles.actionRow}>
          <Button
            title="Request OTP (WhatsApp)"
            size="md"
            variant="primary"
            isLoading={isRequesting}
            leftIcon={<MessageSquare size={16} color="#ffffff" />}
            onPress={handleRequestWhatsApp}
            style={styles.waBtn}
          />
          <Button
            title="Email"
            size="md"
            variant="outline"
            leftIcon={<Mail size={16} color={colors.text} />}
            onPress={handleRequestEmail}
            style={styles.emailBtn}
          />
        </View>
        {lastRequestedOtp && (
          <View style={styles.lastReqNotice}>
            <CheckCircle2 size={14} color="#16a34a" />
            <Text style={styles.lastReqText}>Request sent to Admin! Awaiting OTP.</Text>
          </View>
        )}
      </View>

      {/* Step 2: Enter OTP */}
      <View style={[styles.stepCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Text style={[styles.stepNumber, { color: colors.primary }]}>STEP 2: UNLOCK REGISTRATION</Text>
        <Text style={[styles.stepDesc, { color: colors.textMuted }]}>
          Admin se mila 6-digit OTP code yahan enter kijiye:
        </Text>
        <Input
          value={otpInput}
          onChangeText={setOtpInput}
          placeholder="Enter 6-Digit OTP (e.g. 797901)"
          keyboardType="number-pad"
          maxLength={6}
          leftIcon={<KeyRound size={18} color={colors.textMuted} />}
          style={styles.otpInput}
        />
        <Button
          title={isVerifying ? "Verifying Access..." : "Verify OTP & Open Shop Form"}
          size="lg"
          variant="primary"
          isLoading={isVerifying}
          disabled={isVerifying}
          onPress={handleVerify}
          style={styles.verifyBtn}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scroll: { paddingVertical: 12, gap: 14 },
  backBtn: { alignSelf: "flex-start", padding: 4 },
  header: { alignItems: "center", marginBottom: 4 },
  iconCircle: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  badgeRow: { marginBottom: 6 },
  badge: { backgroundColor: "#fef3c7", paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, borderWidth: 1, borderColor: "#fde68a" },
  badgeText: { color: "#92400e", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  title: { fontSize: 20, fontWeight: "800", marginBottom: 4 },
  subtitle: { fontSize: 13, textAlign: "center", paddingHorizontal: 16, lineHeight: 18 },
  userCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 4 },
  userCardRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
  userCardTitle: { fontSize: 13, fontWeight: "700" },
  userInfo: { fontSize: 12 },
  stepCard: { borderWidth: 1, borderRadius: 12, padding: 14, gap: 8 },
  stepNumber: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  stepDesc: { fontSize: 12, lineHeight: 16 },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  waBtn: { flex: 2, backgroundColor: "#16a34a" },
  emailBtn: { flex: 1 },
  lastReqNotice: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  lastReqText: { color: "#16a34a", fontSize: 12, fontWeight: "600" },
  otpInput: { marginTop: 4 },
  verifyBtn: { marginTop: 4 },
});
