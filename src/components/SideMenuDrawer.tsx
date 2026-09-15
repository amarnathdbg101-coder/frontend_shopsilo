import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, View, Modal, Pressable, Animated } from "react-native";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/store/useAuthStore";
import { useDrawerStore } from "@/store/useDrawerStore";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useLogout } from "@/features/auth/api/useLogout";
import { DrawerProfileHeader } from "@/components/drawer/DrawerProfileHeader";
import { DrawerNavigationList } from "@/components/drawer/DrawerNavigationList";
import { DrawerThemeSelector } from "@/components/drawer/DrawerThemeSelector";
import { DrawerFooterActions } from "@/components/drawer/DrawerFooterActions";

export const SideMenuDrawer: React.FC = () => {
  const router = useRouter();
  const { colors } = useThemeColor();
  const { user } = useAuthStore();
  const { isOpen, closeDrawer } = useDrawerStore();
  const { mutate: logout, isPending: isLoggingOut } = useLogout();

  const [visible, setVisible] = useState(isOpen);
  const slideAnim = useRef(new Animated.Value(-320)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 0, duration: 240, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -320, duration: 200, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => setVisible(false));
    }
  }, [isOpen, slideAnim, fadeAnim]);

  const handleNavigate = (path: string) => {
    closeDrawer();
    if (path === "/(tabs)" || path === "/merchant/dashboard") {
      router.replace(path as never);
    } else {
      router.push(path as never);
    }
  };

  const handleLogout = () => {
    closeDrawer();
    logout();
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent onRequestClose={closeDrawer}>
      <View style={styles.overlay}>
        {/* Left Drawer */}
        <Animated.View
          style={[
            styles.drawerContent,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <DrawerProfileHeader user={user} onClose={closeDrawer} />

          <DrawerNavigationList onNavigate={handleNavigate} />

          {/* Professional Appearance Selector */}
          <DrawerThemeSelector />

          <DrawerFooterActions
            user={user}
            onNavigate={handleNavigate}
            onLogout={handleLogout}
            isLoggingOut={isLoggingOut}
          />
        </Animated.View>

        {/* Right Backdrop */}
        <Animated.View style={[styles.backdropWrap, { opacity: fadeAnim }]}> 
          <Pressable style={styles.backdrop} onPress={closeDrawer} />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, flexDirection: "row" },
  drawerContent: { width: "82%", maxWidth: 320, height: "100%", borderRightWidth: 1, zIndex: 10 },
  backdropWrap: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)" },
  backdrop: { flex: 1 },
});
