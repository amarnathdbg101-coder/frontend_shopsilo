import React, { useEffect } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { useAuthStore } from "@/store/useAuthStore";
import { useGoogleAuth } from "@/features/auth/api/useGoogleAuth";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id_token?: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const { mutate: googleAuth } = useGoogleAuth();

  useEffect(() => {
    // 1. Tell WebBrowser the auth session is complete
    WebBrowser.maybeCompleteAuthSession();

    // 2. If already authenticated
    if (isAuthenticated && user) {
      if (user.role === "admin") {
        router.replace("/admin" as never);
      } else if (user.role === "shop") {
        router.replace("/merchant/dashboard" as never);
      } else {
        router.replace("/(tabs)");
      }
      return;
    }

    // 3. Process id_token directly from deep link if openAuthSessionAsync didn't finish it
    const processToken = async () => {
      let token = params.id_token;

      if (!token) {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl) {
          const urlPart = initialUrl.includes("#")
            ? initialUrl.split("#")[1]
            : initialUrl.includes("?")
            ? initialUrl.split("?")[1]
            : "";
          const searchParams = new URLSearchParams(urlPart);
          token = searchParams.get("id_token") || undefined;
        }
      }

      if (token) {
        googleAuth(
          { id_token: token },
          {
            onError: (err) => {
              console.error("[AuthCallback] Google auth failed:", err);
              router.replace("/(auth)/login");
            },
          }
        );
      } else {
        const timer = setTimeout(() => {
          router.replace("/(tabs)");
        }, 800);
        return () => clearTimeout(timer);
      }
    };

    processToken();
  }, [isAuthenticated, user, params.id_token]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#4f46e5" />
      <Text style={styles.text}>Logging you into ShopSilo...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffffff",
    padding: 20,
  },
  text: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: "600",
    color: "#475569",
  },
});
