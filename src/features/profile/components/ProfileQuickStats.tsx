import React from "react";
import { StyleSheet, Text, View, Pressable } from "react-native";
import { useThemeColor } from "@/hooks/useThemeColor";
import {
  Package,
  Tag,
  MapPin,
  Headphones,
  Receipt,
  PackageCheck,
  BookOpen,
  Settings,
} from "lucide-react-native";

interface ProfileQuickStatsProps {
  isMerchant?: boolean;
  onOrdersPress?: () => void;
  onDealsPress?: () => void;
  onAddressesPress?: () => void;
  onHelpPress?: () => void;
  onPosPress?: () => void;
  onPickupsPress?: () => void;
  onKhataPress?: () => void;
  onSettingsPress?: () => void;
}

export const ProfileQuickStats: React.FC<ProfileQuickStatsProps> = ({
  isMerchant,
  onOrdersPress,
  onDealsPress,
  onAddressesPress,
  onHelpPress,
  onPosPress,
  onPickupsPress,
  onKhataPress,
  onSettingsPress,
}) => {
  const { colors } = useThemeColor();

  const customerItems = [
    { label: "My Orders", icon: Package, onPress: onOrdersPress, color: "#3b82f6" },
    { label: "Mera Khata", icon: BookOpen, onPress: onKhataPress, color: "#dc2626" },
    { label: "Top Deals", icon: Tag, onPress: onDealsPress, color: "#ea580c" },
    { label: "Help Desk", icon: Headphones, onPress: onHelpPress, color: "#8b5cf6" },
  ];

  const merchantItems = [
    { label: "Fast POS", icon: Receipt, onPress: onPosPress, color: "#16a34a" },
    { label: "Pickups", icon: PackageCheck, onPress: onPickupsPress, color: "#0284c7" },
    { label: "Khata", icon: BookOpen, onPress: onKhataPress, color: "#dc2626" },
    { label: "Store Setup", icon: Settings, onPress: onSettingsPress, color: "#64748b" },
  ];

  const items = isMerchant ? merchantItems : customerItems;

  return (
    <View style={styles.container}>
      {items.map((item) => {
        const IconComponent = item.icon;
        return (
          <Pressable
            key={item.label}
            onPress={item.onPress}
            style={[styles.tile, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
          >
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}18` }]}>
              <IconComponent size={20} color={item.color} />
            </View>
            <Text style={[styles.label, { color: colors.text }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginBottom: 16 },
  tile: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 12, paddingHorizontal: 4, borderRadius: 14, borderWidth: 1, gap: 6 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, fontWeight: "700", textAlign: "center" },
});
