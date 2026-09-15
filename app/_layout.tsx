import "../global.css";
import React, { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import { View } from "react-native";
import { useAuthStore } from "@/store/useAuthStore";
import { useAppStore } from "@/store/useAppStore";
import { BrandedSplashScreen } from "@/components/BrandedSplashScreen";
import { SideMenuDrawer } from "@/components/SideMenuDrawer";
import { OfflineSyncBanner } from "@/components/OfflineSyncBanner";
import { WebSocketOrderAlertListener } from "@/components/WebSocketOrderAlertListener";
import { FloatingCartBar } from "@/components/FloatingCartBar";

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

function RootNavigator() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isAuthenticated, isHydrated, hydrate } = useAuthStore();
  const initApp = useAppStore((state) => state.initApp);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        await Promise.all([hydrate(), initApp()]);
      } catch (error) {
        console.error("[RootLayout] Initialization error:", error);
      } finally {
        setIsReady(true);
        await SplashScreen.hideAsync().catch(() => {});
      }
    };

    initialize();
  }, [hydrate, initApp]);

  useEffect(() => {
    if (!isReady || !isHydrated) return;

    const inAuthGroup = segments[0] === "(auth)";
    const inTabsGroup = segments[0] === "(tabs)";
    const inAdminGroup = segments[0] === "admin";
    const inMerchantGroup = segments[0] === "merchant";

    if (!isAuthenticated && (inTabsGroup || inAdminGroup || inMerchantGroup)) {
      router.replace("/(auth)/login");
    } else if (isAuthenticated && inAdminGroup && user?.role !== "admin") {
      // ðŸ›¡ï¸ Security Guard: Prevent non-admin users from accessing /admin routes
      router.replace("/(tabs)");
    } else if (isAuthenticated && inAuthGroup) {
      if (user?.role === "admin") {
        router.replace("/admin" as never);
      } else if (user?.role === "shop") {
        router.replace("/merchant/dashboard" as never);
      } else {
        router.replace("/(tabs)");
      }
    }
  }, [isAuthenticated, isHydrated, isReady, segments, user, router]);

  if (!isReady || !isHydrated) {
    return <BrandedSplashScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineSyncBanner />
      <WebSocketOrderAlertListener />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="admin" options={{ headerShown: false }} />
        <Stack.Screen name="merchant" options={{ headerShown: false }} />
        <Stack.Screen name="product/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="shop/[slug]" options={{ headerShown: false }} />
                <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" options={{ title: "Oops!" }} />
      </Stack>
      <FloatingCartBar />
      <SideMenuDrawer />
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

