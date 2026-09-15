import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { ShoppingBag, AlertCircle } from "lucide-react-native";

import { ScreenWrapper } from "@/components/ScreenWrapper";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Button } from "@/components/Button";
import { AuthHeader } from "@/features/auth/components/AuthHeader";
import { LoginForm } from "@/features/auth/components/LoginForm";
import { LoginFormData } from "@/features/auth/schemas";
import { useLogin } from "@/features/auth/api/useLogin";
import { useGoogleAuth } from "@/features/auth/api/useGoogleAuth";
import { promptGoogleSignIn } from "@/features/auth/utils/googleAuth";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function LoginScreen() {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { mutate: login, isPending: isLoginPending, error: loginError } = useLogin();
  const { mutate: googleAuth, isPending: isGooglePending, error: googleError } = useGoogleAuth();
  const [googleClientError, setGoogleClientError] = useState<string | null>(null);

  const handleLoginSubmit = (data: LoginFormData): void => {
    login(data);
  };

  const handleGoogleSignIn = async (): Promise<void> => {
    setGoogleClientError(null);
    try {
      const googleResult = await promptGoogleSignIn();
      if (!googleResult?.idToken) {
        throw new Error("Google token nahi mila. Kripya dobara try karein.");
      }
      googleAuth({ id_token: googleResult.idToken });
    } catch (err: any) {
      console.error("[LoginScreen] Google Sign in error:", err);
      const msg = err?.message || "Google sign in cancel ya fail ho gaya.";
      setGoogleClientError(msg);
      Alert.alert("Google Sign-In", msg);
    }
  };

  const handleNavigateToRegister = (): void => {
    router.push("/(auth)/register");
  };

  const handleNavigateToForgotPassword = (): void => {
    router.push("/(auth)/forgot-password");
  };

  const displayError = loginError?.message || googleError?.message || googleClientError;

  return (
    <ErrorBoundary fallbackTitle="Unable to load Login">
      <ScreenWrapper scrollable withPadding contentContainerStyle={styles.container}>
        <AuthHeader
          icon={<ShoppingBag size={36} color={colors.primary} />}
          title="Welcome Back"
          subtitle="Sign in to your ShopSilo account"
        />

        {displayError ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={18} color="#dc2626" style={styles.errorIcon} />
            <Text style={styles.errorBannerText}>{displayError}</Text>
          </View>
        ) : null}

        <LoginForm onSubmit={handleLoginSubmit} isLoading={isLoginPending} />

        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.surfaceBorder }]} />
        </View>

        <Button
          title="Continue with Google"
          variant="outline"
          size="lg"
          isLoading={isGooglePending}
          onPress={handleGoogleSignIn}
          style={styles.googleButton}
        />



        <View style={styles.forgotPasswordContainer}>
          <Pressable
            accessibilityRole="button"
            onPress={handleNavigateToForgotPassword}
          >
            <Text style={[styles.forgotPasswordText, { color: colors.primary }]}>
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            Don't have an account?{" "}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={handleNavigateToRegister}
          >
            <Text style={[styles.footerLink, { color: colors.primary }]}>
              Sign Up
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
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    fontWeight: "600",
  },
  googleButton: {
    marginBottom: 8,
  },
  forgotPasswordContainer: {
    alignItems: "flex-end",
    marginTop: 12,
    marginBottom: 8,
  },
  forgotPasswordText: {
    fontSize: 13,
    fontWeight: "600",
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

