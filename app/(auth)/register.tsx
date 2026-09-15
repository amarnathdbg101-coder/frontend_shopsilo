import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, AlertCircle } from "lucide-react-native";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { RegisterForm } from "@/features/auth/components/RegisterForm";
import { RegisterFormData } from "@/features/auth/schemas";
import { useRegister } from "@/features/auth/api/useRegister";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { mutate: register, isPending, error } = useRegister();

  // Handler: Submits registration to Go backend
  const handleRegisterSubmit = (data: RegisterFormData): void => {
    register(data);
  };

  // Handler: Navigate back to sign in screen
  const handleNavigateToLogin = (): void => {
    router.push("/(auth)/login");
  };

  return (
    <ErrorBoundary fallbackTitle="Unable to load Registration">
      <ScreenWrapper scrollable withPadding contentContainerStyle={styles.container}>
        <AuthHeader
          icon={<ShoppingBag size={36} color={colors.primary} />}
          title="Create Account"
          subtitle="Join ShopSilo to explore products & deals"
        />

        {error ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#dc2626" style={styles.errorIcon} />
            <Text style={styles.errorBannerText}>{error.message}</Text>
          </View>
        ) : null}

        <RegisterForm onSubmit={handleRegisterSubmit} isLoading={isPending} />

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Already have an account?{" "}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleNavigateToLogin}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Sign In
            </Text>
          </Pressable>
        </View>
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 24,
    justifyContent: "space-between",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.25)",
    marginBottom: 16,
  },
  errorIcon: {
    marginRight: 10,
  },
  errorBannerText: {
    color: "#dc2626",
    fontSize: 13,
    fontWeight: "600",
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 14,
  },
  footerLink: {
    fontSize: 14,
    fontWeight: "600",
  },
});
