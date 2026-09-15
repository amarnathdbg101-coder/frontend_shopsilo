import React, { useState } from "react";
import { StyleSheet, View, Text, Pressable, Platform } from "react-native";
import { useRouter } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useMerchantProducts } from "@/features/merchant/api/usePOS";
import { VisualProductScannerModal } from "@/features/merchant/components/VisualProductScannerModal";
import { Store, Receipt, ScanLine, User } from "lucide-react-native";

interface MerchantBottomBarProps {
  currentPath: string;
}

export const MerchantBottomBar: React.FC<MerchantBottomBarProps> = ({ currentPath }) => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const [isPhotoScanOpen, setIsPhotoScanOpen] = useState(false);

  // Fetch shop's own products for AI Photo Scanner
  const { data: inventory = [] } = useMerchantProducts();

  const tabs = [
    {
      key: "dashboard",
      title: "Dashboard",
      path: "/merchant/dashboard",
      icon: Store,
      isActive: currentPath === "/merchant/dashboard",
    },
    {
      key: "pos",
      title: "POS Billing",
      path: "/merchant/pos",
      icon: Receipt,
      isActive: currentPath === "/merchant/pos",
    },
    {
      key: "photoscan",
      title: "Photo Scan",
      path: "photoscan",
      icon: ScanLine,
      isActive: isPhotoScanOpen,
    },
    {
      key: "profile",
      title: "Profile",
      path: "/merchant/profile",
      icon: User,
      isActive: currentPath.includes("profile"),
    },
  ];

  return (
    <>
      <View
        style={[
          styles.floatingTabBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.surfaceBorder,
          },
        ]}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.isActive;
          const isAiTab = tab.key === "photoscan";

          return (
            <Pressable
              key={tab.key}
              accessibilityRole="button"
              accessibilityLabel={tab.title}
              onPress={() => {
                if (isAiTab) {
                  setIsPhotoScanOpen(true);
                } else if (tab.key === "dashboard") {
                  router.replace(tab.path as never);
                } else {
                  router.push(tab.path as never);
                }
              }}
              style={styles.tabItem}
            >
              <View style={isAiTab && styles.aiIconRing}>
                <Icon size={isAiTab ? 22 : 20} color={isAiTab ? "#7c3aed" : active ? colors.primary : colors.textMuted} />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  { color: isAiTab ? "#7c3aed" : active ? colors.primary : colors.textMuted },
                  (active || isAiTab) && { fontWeight: "800" },
                ]}
              >
                {tab.title}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 📸 1-Tap AI Photo Product Scanner Modal */}
      <VisualProductScannerModal
        visible={isPhotoScanOpen}
        onClose={() => setIsPhotoScanOpen(false)}
        inventory={inventory}
        onSelectProduct={(product) => {
          setIsPhotoScanOpen(false);
          router.push(`/product/${product.id}` as never);
        }}
        onAddNewProductWithVisualCode={() => {
          setIsPhotoScanOpen(false);
          router.push("/merchant/procurement-list" as never);
        }}
      />
    </>
  );
};

const styles = StyleSheet.create({
  floatingTabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 22 : 14,
    left: 18,
    right: 18,
    height: 62,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    zIndex: 100,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    gap: 3,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
  },
  aiIconRing: {
    padding: 3,
    borderRadius: 12,
    backgroundColor: "rgba(124, 58, 237, 0.12)",
  },
});
