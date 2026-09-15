import React from "react";
import { View, StyleSheet } from "react-native";
import { Stack, usePathname } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";
import { MerchantBottomBar } from "@/components/navigation/MerchantBottomBar";

export default function MerchantLayout() {
  const { colors } = useThemeColor();
  const pathname = usePathname();

  // Hide bottom bar on registration screen
  const hideBottomBar = pathname === "/merchant/register-shop";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.surface },
          headerTintColor: colors.text,
          headerTitleStyle: { fontWeight: "700" },
        }}
      >
        <Stack.Screen
          name="dashboard"
          options={{ title: "Merchant Dashboard", headerShown: false }}
        />
        <Stack.Screen
          name="pos"
          options={{ title: "Counter POS Billing" }}
        />
        <Stack.Screen
          name="khata"
          options={{ title: "Customer Udhar Khata" }}
        />
        <Stack.Screen
          name="inventory"
          options={{ title: "Stock & Inventory" }}
        />
        <Stack.Screen
          name="expenses"
          options={{ title: "Daily Expenses (Kharcha)" }}
        />
        <Stack.Screen
          name="analytics"
          options={{ title: "Asli Munafa & Analytics" }}
        />
        <Stack.Screen
          name="pickups"
          options={{ title: "Counter Pickups" }}
        />
        <Stack.Screen
          name="add-product"
          options={{ title: "Add New Product" }}
        />
        <Stack.Screen
          name="settings"
          options={{ title: "Store Settings" }}
        />
        <Stack.Screen
          name="offers"
          options={{ title: "Offers & Promotions" }}
        />
        <Stack.Screen
          name="profile"
          options={{ title: "Shopkeeper Profile" }}
        />
        <Stack.Screen
          name="register-shop"
          options={{ title: "Open Your Shop", headerShown: false }}
        />
      </Stack>

      {!hideBottomBar && <MerchantBottomBar currentPath={pathname} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
});

