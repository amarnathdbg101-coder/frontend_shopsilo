import React, { useState, useEffect } from "react";
import { StyleSheet, Text, View, Pressable, Switch, Platform } from "react-native";
import { Shop } from "@/features/shops/types";
import { useDrawerStore } from "@/store/useDrawerStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { Menu, Store, QrCode, Settings } from "lucide-react-native";

interface MerchantDashboardHeaderProps {
  shop?: Shop;
  isOpen: boolean;
  isToggling: boolean;
  onToggleStatus: (val: boolean) => void;
  onQRPress?: () => void;
  onSettingsPress?: () => void;
}

export const MerchantDashboardHeader: React.FC<MerchantDashboardHeaderProps> = ({
  shop,
  isOpen,
  isToggling,
  onToggleStatus,
  onQRPress,
  onSettingsPress,
}) => {
  const { colors } = useThemeColor();
  const openDrawer = useDrawerStore((s) => s.openDrawer);

  // Optimistic 0ms Instant Switch Toggle
  const [localIsOpen, setLocalIsOpen] = useState(isOpen);

  useEffect(() => {
    setLocalIsOpen(isOpen);
  }, [isOpen]);

  const handleToggle = (val: boolean) => {
    setLocalIsOpen(val); // 0ms instant UI update
    onToggleStatus(val); // Asynchronous background server mutation
  };

  return (
    <View
      style={[
        styles.appBar,
        {
          backgroundColor: colors.surface,
          borderColor: colors.surfaceBorder,
        },
      ]}
    >
      {/* Top Row: Side Menu Hamburger | Shop Brand | Quick Action Icons */}
      <View style={styles.topRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Side Menu"
          onPress={openDrawer}
          style={[styles.menuBtn, { backgroundColor: colors.background }]}
        >
          <Menu size={18} color={colors.text} />
        </Pressable>

        <View style={styles.brandCol}>
          <View style={styles.brandRow}>
            <Store size={16} color="#f59e0b" />
            <Text numberOfLines={1} style={[styles.brandText, { color: colors.text }]}>
              {shop?.name || "ShopSilo Partner"}
            </Text>
          </View>
          <Text style={[styles.brandSub, { color: colors.textMuted }]}>
            {shop?.category ? shop.category.toUpperCase() : "SHOP OWNER"}
          </Text>
        </View>

        <View style={styles.rightActions}>
          {onQRPress && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Shop QR Code"
              onPress={onQRPress}
              style={[styles.actionIconBtn, { backgroundColor: colors.background }]}
            >
              <QrCode size={15} color={colors.text} />
            </Pressable>
          )}
          {onSettingsPress && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Store Settings"
              onPress={onSettingsPress}
              style={[styles.actionIconBtn, { backgroundColor: colors.background }]}
            >
              <Settings size={15} color={colors.text} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Second Row: Store Open/Closed Toggle */}
      <View style={[styles.bottomBar, { backgroundColor: colors.background, borderColor: colors.surfaceBorder }]}>
        <View style={styles.statusSection}>
          <View style={[styles.liveDot, { backgroundColor: localIsOpen ? "#22c55e" : "#ef4444" }]} />
          <Text numberOfLines={1} style={[styles.statusLabel, { color: colors.textMuted }]}>
            {localIsOpen ? "Store Open • Counter Active" : "Store Closed Right Now"}
          </Text>
        </View>

        <View style={styles.statusToggleRow}>
          <View
            style={[
              styles.openBadge,
              { backgroundColor: localIsOpen ? "#dcfce7" : "#fee2e2" },
            ]}
          >
            <Text style={[styles.openBadgeText, { color: localIsOpen ? "#15803d" : "#b91c1c" }]}> 
              {localIsOpen ? "OPEN" : "CLOSED"}
            </Text>
          </View>
          <Switch
            value={localIsOpen}
            onValueChange={handleToggle}
            disabled={isToggling}
            trackColor={{ false: "#334155", true: "#15803d" }}
            thumbColor={localIsOpen ? "#22c55e" : "#ef4444"}
            style={Platform.OS === "android" ? { transform: [{ scaleX: 0.75 }, { scaleY: 0.75 }] } : undefined}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  appBar: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  menuBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  brandCol: {
    alignItems: "flex-start",
    flex: 1,
    paddingHorizontal: 8,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  brandText: {
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },
  brandSub: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.8,
    marginTop: 1,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  actionIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderColor: "#e2e8f0",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  statusSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: "700",
    marginRight: 4,
  },
  statusToggleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  openBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  openBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
});
