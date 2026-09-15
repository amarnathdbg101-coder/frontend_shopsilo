import React from "react";
import { StyleSheet, Text, View, Pressable, Alert } from "react-native";
import { ShieldCheck, ShieldAlert, AlertTriangle, Sparkles } from "lucide-react-native";

interface TrustScoreBadgeProps {
  score?: number;
  badge?: string;
  size?: "sm" | "md";
  showLabel?: boolean;
  onPress?: () => void;
}

export const TrustScoreBadge: React.FC<TrustScoreBadgeProps> = ({
  score = 650,
  badge = "MODERATE",
  size = "sm",
  showLabel = true,
  onPress,
}) => {
  const isTrusted = score >= 750 || badge === "TRUSTED";
  const isHighRisk = score < 600 || badge === "HIGH_RISK";

  const bgColor = isTrusted ? "#dcfce7" : isHighRisk ? "#fee2e2" : "#fef3c7";
  const textColor = isTrusted ? "#16a34a" : isHighRisk ? "#dc2626" : "#d97706";
  const borderColor = isTrusted ? "#86efac" : isHighRisk ? "#fca5a5" : "#fcd34d";

  const labelText = isTrusted
    ? "Vishwasniya"
    : isHighRisk
    ? "Dhyan Dein"
    : "Madhyam";

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      Alert.alert(
        `Vyapar Vishwas: ${score}/900 (${labelText})`,
        isTrusted
          ? "Yeh customer pichhla hisab samay par chukta karta hai. Udhar dena safe hai."
          : isHighRisk
          ? "Savdhaan: Customer ka purana hisab lambe samay se baki hai ya dispute history hai."
          : "Customer ka track record normal hai. Samay anusar chukta hota rehta hai."
      );
    }
  };

  return (
    <Pressable
      accessibilityRole="button"
      onPress={handlePress}
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          paddingHorizontal: size === "sm" ? 7 : 10,
          paddingVertical: size === "sm" ? 3 : 5,
        },
      ]}
    >
      {isTrusted ? (
        <ShieldCheck size={size === "sm" ? 12 : 14} color={textColor} />
      ) : isHighRisk ? (
        <AlertTriangle size={size === "sm" ? 12 : 14} color={textColor} />
      ) : (
        <ShieldAlert size={size === "sm" ? 12 : 14} color={textColor} />
      )}
      <Text style={[styles.scoreText, { color: textColor, fontSize: size === "sm" ? 11 : 13 }]}>
        {score}
      </Text>
      {showLabel && (
        <Text style={[styles.labelText, { color: textColor, fontSize: size === "sm" ? 10 : 12 }]}>
          • {labelText}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 8,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  scoreText: {
    fontWeight: "800",
  },
  labelText: {
    fontWeight: "700",
  },
});
