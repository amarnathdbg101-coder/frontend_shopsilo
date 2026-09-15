import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { ArrowLeft, ShieldAlert } from "lucide-react-native";

interface ProductDetailTopBarProps {
  title: string;
  onReportPress?: () => void;
}

export const ProductDetailTopBar: React.FC<ProductDetailTopBarProps> = ({
  title,
  onReportPress,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.back()}
        style={styles.backBtn}
      >
        <ArrowLeft size={22} color={colors.text} />
      </Pressable>
      <Text numberOfLines={1} style={[styles.topTitle, { color: colors.text }]}>
        {title}
      </Text>
      {onReportPress && (
        <Pressable
          accessibilityRole="button"
          onPress={onReportPress}
          style={styles.reportBtn}
        >
          <ShieldAlert size={18} color={colors.textMuted} />
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  backBtn: {
    padding: 6,
  },
  topTitle: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  reportBtn: {
    padding: 6,
  },
});

