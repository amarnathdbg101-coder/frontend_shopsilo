import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "@/components/Button";
import { CheckCircle } from "lucide-react-native";

interface RegisterShopSuccessProps {
  onOpenDashboard: () => void;
  onSwitchToCustomer: () => void;
}

export const RegisterShopSuccess: React.FC<RegisterShopSuccessProps> = ({
  onOpenDashboard,
  onSwitchToCustomer,
}) => {
  return (
    <View style={styles.successBox}>
      <CheckCircle size={44} color="#16a34a" />
      <Text style={styles.successTitle}>Shop Registered Successfully!</Text>
      <Text style={styles.successDesc}>
        Your shop is now live. Your role is updated to Shop Owner. You can now access POS Billing, Customer Khata, and product inventory.
      </Text>
      <Button
        title="Open Shop Owner Dashboard"
        size="lg"
        onPress={onOpenDashboard}
        style={styles.primaryBtn}
      />
      <Button
        title="Continue as Customer"
        variant="outline"
        size="md"
        onPress={onSwitchToCustomer}
        style={styles.secondaryBtn}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  successBox: {
    alignItems: "center",
    padding: 24,
    backgroundColor: "#dcfce7",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#86efac",
    gap: 12,
  },
  successTitle: { fontSize: 18, fontWeight: "700", color: "#166534" },
  successDesc: {
    fontSize: 13,
    textAlign: "center",
    color: "#15803d",
    lineHeight: 18,
  },
  primaryBtn: { width: "100%", marginTop: 8 },
  secondaryBtn: { width: "100%" },
});
