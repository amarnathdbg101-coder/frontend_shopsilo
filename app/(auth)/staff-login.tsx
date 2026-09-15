import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, TextInput, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { useStaffLogin } from "@/features/merchant/api/useStaff";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Users, Phone, Key, Store, ArrowLeft, ShieldCheck, Check } from "lucide-react-native";

export default function StaffLoginScreen() {
  const router = useRouter();
  const { colors, isDark } = useThemeColor();

  const [shopId, setShopId] = useState("");
  const [phone, setPhone] = useState("");
  const [pin, setPin] = useState("");

  const staffLoginMutation = useStaffLogin();

  const handleStaffLogin = () => {
    if (!shopId.trim()) {
      return Alert.alert("Required", "Please enter Shop ID provided by store owner.");
    }
    if (!phone.trim() || phone.trim().length < 10) {
      return Alert.alert("Required", "Please enter valid 10-digit mobile number.");
    }
    if (!pin.trim() || pin.trim().length !== 4) {
      return Alert.alert("Required", "Please enter your 4-digit counter PIN.");
    }

    staffLoginMutation.mutate(
      {
        shop_id: shopId.trim(),
        phone: phone.trim(),
        pin: pin.trim(),
      },
      {
        onSuccess: (data) => {
          Alert.alert("Cashier Login Successful 🎉", `Welcome ${data.full_name}! Counter POS active.`);
          router.replace("/merchant/pos" as never);
        },
        onError: (err: any) => {
          Alert.alert("Login Failed", err?.message || "Invalid shop ID, phone, or 4-digit PIN.");
        },
      }
    );
  };

  return (
    <ErrorBoundary fallbackTitle="Unable to load Staff Login">
      <ScreenWrapper scrollable withPadding contentContainerStyle={styles.container}>
        {/* Back Button */}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
        >
          <ArrowLeft size={18} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Back to Main Login</Text>
        </Pressable>

        <AuthHeader
          icon={<Users size={36} color="#7c3aed" />}
          title="Cashier & Staff Login 👥"
          subtitle="4-Digit PIN counter access for store helpers"
        />

        {/* Counter Badge */}
        <View style={[styles.infoBanner, { backgroundColor: "rgba(124, 58, 237, 0.08)", borderColor: "#7c3aed" }]}>
          <ShieldCheck size={18} color="#7c3aed" />
          <Text style={styles.infoBannerText}>
            Restricted Counter Access: Allows fast billing & stock checks without exposing shop net profit.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Input
            label="Shop ID / Unique Dukan Code *"
            placeholder="e.g. uuid-of-shop"
            value={shopId}
            onChangeText={setShopId}
            leftIcon={<Store size={18} color={colors.textMuted} />}
          />

          <Input
            label="Cashier Mobile Number *"
            placeholder="10-Digit Mobile Number"
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            leftIcon={<Phone size={18} color={colors.textMuted} />}
          />

          <Input
            label="4-Digit Counter Login PIN *"
            placeholder="4-Digit PIN (e.g. 1234)"
            keyboardType="numeric"
            maxLength={4}
            secureTextEntry
            value={pin}
            onChangeText={setPin}
            leftIcon={<Key size={18} color={colors.textMuted} />}
          />

          <Button
            title={staffLoginMutation.isPending ? "Logging in..." : "Login to Counter Register 🧾"}
            variant="primary"
            size="lg"
            isLoading={staffLoginMutation.isPending}
            disabled={staffLoginMutation.isPending}
            onPress={handleStaffLogin}
            leftIcon={<Check size={18} color="#fff" />}
            style={{ backgroundColor: "#7c3aed", marginTop: 12 }}
          />
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Dukandar Main Owner?{" "}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => router.replace("/(auth)/login" as never)}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Main Owner Login
            </Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 18,
    gap: 16,
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
  },
  backText: {
    fontSize: 13,
    fontWeight: "700",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#7c3aed",
    flex: 1,
    lineHeight: 16,
  },
  formGroup: {
    gap: 10,
    marginTop: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "700",
  },
});
