import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Link, Stack, useRouter, useLocalSearchParams, usePathname } from "expo-router";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useAuthStore } from "@/store/useAuthStore";

export default function NotFoundScreen() {
  const { colors } = useThemeColor();
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams();
  const { isAuthenticated, user } = useAuthStore();

  // Auto-redirect if this was an auth callback or deep link
  useEffect(() => {
    if (pathname?.includes("auth") || params?.id_token) {
      if (isAuthenticated && user?.role === "shop") {
        router.replace("/merchant/dashboard" as never);
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [pathname, params, isAuthenticated, user, router]);

  return (
    <>
      <Stack.Screen options={{ title: "Not Found", headerShown: true }} />
      <ScreenWrapper style={styles.container}>
        <Text style={[styles.title, { color: colors.text }]}>
          This screen doesn't exist.
        </Text>
        <Link href="/" style={styles.link}>
          <Text style={[styles.linkText, { color: colors.primary }]}>
            Go to home screen!
          </Text>
        </Link>
      </ScreenWrapper>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
