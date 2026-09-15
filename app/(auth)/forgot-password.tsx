import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { ArrowLeft, KeyRound, AlertCircle } from "lucide-react-native";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { ForgotPasswordForm } from "@/features/auth/components/ForgotPasswordForm";
import { ForgotPasswordSuccess } from "@/features/auth/components/ForgotPasswordSuccess";
import { ForgotPasswordFormData } from "@/features/auth/schemas";
import { apiClient } from "@/api/client";
import { Endpoints } from "@/api/endpoints";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Handler: Request password reset from Go backend
  const handleResetSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    try {
      setIsSubmitting(true);
      setServerError(null);
      await apiClient.post(Endpoints.AUTH.FORGOT_PASSWORD, data);
      setIsSubmitted(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : "Failed to request password reset."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler: Return to login screen
  const handleBackToLogin = (): void => {
    router.replace("/(auth)/login");
  };

  return (
    <ErrorBoundary fallbackTitle="Unable to load Reset Password">
      <ScreenWrapper scrollable withPadding contentContainerStyle={styles.container}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ArrowLeft size={24} color={colors.text} />
        </Pressable>

        <AuthHeader
          icon={<KeyRound size={36} color={colors.primary} />}
          title="Reset Password"
          subtitle="Enter your email and we'll send you instructions to reset your password"
        />

        {serverError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#dc2626" style={styles.errorIcon} />
            <Text style={styles.errorBannerText}>{serverError}</Text>
          </View>
        ) : null}

        {isSubmitted ? (
          <ForgotPasswordSuccess onBackToLogin={handleBackToLogin} />
        ) : (
          <ForgotPasswordForm
            onSubmit={handleResetSubmit}
            isLoading={isSubmitting}
          />
        )}
      </ScreenWrapper>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    marginBottom: 8,
    alignSelf: "flex-start",
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
});
