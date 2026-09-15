import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";

interface ForgotPasswordSuccessProps {
  onBackToLogin: () => void;
}

export const ForgotPasswordSuccess: React.FC<ForgotPasswordSuccessProps> = ({
  onBackToLogin,
}) => {
  return (
    <View style={styles.successBanner}>
      <Text style={styles.successTitle}>Check Your Inbox</Text>
      <Text style={styles.successText}>
        If an account exists with that email, reset instructions have been sent.
      </Text>
      <Button
        title="Back to Sign In"
        variant="outline"
        onPress={onBackToLogin}
        style={styles.backButton}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  successBanner: {
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: "#dcfce7",
    borderColor: "#86efac",
    alignItems: "center",
  },
  successTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    color: "#15803d",
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    width: "100%",
  },
});
