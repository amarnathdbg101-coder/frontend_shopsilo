import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Zap, Store, Tag, BookOpen } from "lucide-react-native";

interface QuickFeatureChipsProps {
  onDealsPress?: () => void;
}

export const QuickFeatureChips: React.FC<QuickFeatureChipsProps> = ({
  onDealsPress,
}) => {
  const router = useRouter();
  const { colors } = useThemeColor();

  const features = [
    {
      id: "pickup",
      label: "Instant Pickup",
      sub: "15-Min OTP",
      icon: <Zap size={16} color="#16a34a" />,
      bg: "#dcfce7",
      onPress: () => router.push("/(tabs)/orders"),
    },
    {
      id: "shops",
      label: "Local Shops",
      sub: "Near You",
      icon: <Store size={16} color="#2563eb" />,
      bg: "#dbeafe",
      onPress: () => router.push("/shops" as never),
    },
    {
      id: "khata",
      label: "Mera Khata",
      sub: "Udhar Passbook",
      icon: <BookOpen size={16} color="#dc2626" />,
      bg: "#fee2e2",
      onPress: () => router.push("/customer/khata" as never),
    },
    {
      id: "offers",
      label: "Live Deals",
      sub: "Store Offers",
      icon: <Tag size={16} color="#ea580c" />,
      bg: "#ffedd5",
      onPress: () => onDealsPress?.(),
    },
  ];

  return (
    <View style={styles.grid}>
      {features.map((item) => (
        <Pressable
          key={item.id}
          accessibilityRole="button"
          onPress={item.onPress}
          style={[
            styles.chip,
            { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: item.bg }]}>
            {item.icon}
          </View>
          <View style={styles.textCol}>
            <Text
              numberOfLines={1}
              style={[styles.label, { color: colors.text }]}
            >
              {item.label}
            </Text>
            <Text style={[styles.sub, { color: colors.textMuted }]}>
              {item.sub}
            </Text>
          </View>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    minWidth: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  textCol: {
    flex: 1,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
  },
  sub: {
    fontSize: 11,
    marginTop: 1,
  },
});
