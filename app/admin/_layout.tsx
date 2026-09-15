import React from "react";
import { Stack } from "expo-router";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function AdminLayout() {
  const { colors } = useThemeColor();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: "700",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          title: "Admin Command Center",
        }}
      />
      <Stack.Screen
        name="shops"
        options={{
          title: "Shop Moderation",
        }}
      />
      <Stack.Screen
        name="users"
        options={{
          title: "User Management",
        }}
      />
    </Stack>
  );
}
