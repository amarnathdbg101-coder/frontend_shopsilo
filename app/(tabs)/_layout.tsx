import React from "react";
import { StyleSheet, Platform, View } from "react-native";
import { Tabs } from "expo-router";
import { Home, User, Heart } from "lucide-react-native";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function TabLayout() {
  const { colors } = useThemeColor();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarShowLabel: true,
          tabBarLabelStyle: styles.tabLabel,
          tabBarStyle: [
            styles.floatingTabBar,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
            },
          ],
          tabBarHideOnKeyboard: true,
          headerShown: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Explore",
            tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: "Saved & Orders",
            tabBarIcon: ({ color, size }) => (
              <Heart size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => <User size={size} color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  floatingTabBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 22 : 14,
    left: 18,
    right: 18,
    height: 62,
    borderRadius: 26,
    borderWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 8 : 6,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: "700",
    marginTop: -2,
  },
});
